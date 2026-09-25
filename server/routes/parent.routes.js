import express from 'express';
import { db } from '../db.js';
import { sanitizeText, createNotification } from '../utils.js';
import { authenticateToken, requireRole, requireOwnerOrAdmin } from '../middleware/auth.js';
import { paymentRateLimiter, publicActionRateLimiter } from '../middleware/limiters.js';
import { sendTransactionalEmail } from '../services/email.js';

const router = express.Router();

// GET Parent intelligence dashboard summary
router.post('/students/add', authenticateToken, requireOwnerOrAdmin, async (req, res) => {
  const { parentId, name, dob, subjects } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Child's name is required." });
  }

  // Create new student
  const studentUid = `student_${Date.now()}`;
  const newStudent = await db.insert('students', {
    uid: studentUid,
    parentUid: parentId,
    name: sanitizeText(name),
    dob: dob ? sanitizeText(dob) : "",
    subjects: subjects || [],
    xp: 0,
    badges: [],
    progressBySubject: {}
  });

  // Update parent children list in database
  const parent = await db.findOne('parents', p => p.uid === parentId);
  if (parent) {
    const updatedChildren = Array.isArray(parent.children) ? [...parent.children, name] : [name];
    await db.update('parents', parent.id, { children: updatedChildren });
  }

  res.json({ success: true, student: newStudent });
});

router.get('/dashboard/:uid', authenticateToken, requireOwnerOrAdmin, async (req, res) => {
  const { uid } = req.params;
  
  const parent = await db.findOne('parents', p => p.uid === uid);
  if (!parent) {
    return res.status(404).json({ error: "Parent dashboard not found." });
  }

  const wallet = await db.findOne('wallets', w => w.uid === uid);
  const students = await db.find('students', s => s.parentUid === uid);
  const studentNames = students.map(s => s.name);
  
  // Find sessions where parent is involved
  const activeSessions = await db.find('sessions', s => s.parentId === uid || studentNames.includes(s.studentName));
  const assignments = await db.find('assignments', a => studentNames.includes(a.studentName));
  const parentTransactions = await db.find('transactions', t => t.fromUserId === uid);
  const parentDisputes = await db.find('disputes', d => d.raisedBy === uid);

  // Fetch referrals for this parent
  const referrals = await db.find('parents', p => p.referredBy === uid);
  const referralsList = await Promise.all(referrals.map(async r => {
    const user = await db.findOne('users', u => u.uid === r.uid);
    return {
      id: r.uid,
      name: user ? user.displayName : 'Referred Parent',
      date: new Date(parseInt(r.uid.split('_')[1]) || Date.now()).toISOString().split('T')[0],
      status: 'Converted',
      commission: 500000 // ₦5,000 in minor NGN
    };
  }));

  const referralStats = {
    hits: parent.referralHits || 0,
    conversions: referrals.length,
    earnings: referrals.length * 500000
  };

  res.json({
    parent,
    walletBalance: wallet ? wallet.balance : 0,
    escrowBalance: wallet ? wallet.escrow : 0,
    dva: wallet ? wallet.dva : null,
    students,
    sessions: activeSessions,
    gradesLog: assignments.filter(a => a.status === 'Graded'),
    pendingAssignments: assignments.filter(a => a.status !== 'Graded'),
    transactions: parentTransactions,
    referralsList,
    referralStats,
    disputes: parentDisputes
  });
});

// GET Student dashboard data
router.get('/students/dashboard/:uid', authenticateToken, async (req, res) => {
  const { uid } = req.params;

  // Find student by UID or by username
  let student = await db.findOne('students', s => s.uid === uid);
  if (!student) {
    // Fallback: try by name
    student = await db.findOne('students', s => s.name.toLowerCase() === uid.toLowerCase());
  }

  if (!student) {
    return res.status(404).json({ error: "Student dashboard not found." });
  }

  // Authorization check: User must be Admin, the Student themselves, or the Parent of the student
  if (req.user.role !== 'Admin' && req.user.uid !== student.uid && req.user.uid !== student.parentUid) {
    return res.status(403).json({ error: "Access forbidden. You do not have permission to view this student's dashboard." });
  }

  const studentSessions = await db.find('sessions', s => s.studentId === student.uid || s.studentName.toLowerCase() === student.name.toLowerCase());
  const assignments = await db.find('assignments', a => a.studentId === student.uid || a.studentName.toLowerCase() === student.name.toLowerCase());

  // Return dynamic student leaderboard sorted by XP
  const allStudents = await db.find('students');
  const leaderboard = allStudents
    .map((s, idx) => ({
      rank: idx + 1, // Will be computed after sorting
      name: s.name + (s.uid === student.uid ? ' (You)' : ''),
      xp: s.xp || 0,
      active: s.uid === student.uid
    }))
    .sort((a, b) => b.xp - a.xp)
    .map((s, idx) => ({ ...s, rank: idx + 1 }));

  res.json({
    student,
    sessions: studentSessions,
    gradesLog: assignments.filter(a => a.status === 'Graded'),
    pendingAssignments: assignments.filter(a => a.status !== 'Graded'),
    leaderboard
  });
});

// POST Parent wallet top-up / add funds
router.post('/wallet/topup', authenticateToken, paymentRateLimiter, async (req, res) => {
  const { amount, parentId, method } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid topup amount." });
  }

  // Enforce parent ownership check to prevent unauthorized wallet updates
  if (req.user.role !== 'Admin' && req.user.uid !== parentId) {
    return res.status(403).json({ error: "Access forbidden. User identity mismatch." });
  }

  if (method === 'bank') {
    // 1. Create a pending transaction
    await db.insert('transactions', {
      id: 'txn_' + Date.now(),
      fromUserId: 'system',
      toUserId: parentId,
      amount: amount,
      type: 'wallet_topup',
      status: 'Pending Verification',
      method: 'bank',
      date: new Date().toISOString()
    });
    
    // 2. Notify parent
    await db.insert('notifications', {
      id: 'notif_' + Date.now(),
      userId: parentId,
      title: 'Top-up Pending Verification',
      body: `Your bank transfer of funds is pending admin verification.`,
      read: false,
      type: 'wallet_topup',
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      status: 'pending',
      message: 'Bank transfer pending verification by Admin.'
    });
  }

  // Live Gateway Verification for Card / Paystack payments
  const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
  const isPaystackLive = paystackSecret && !paystackSecret.includes('mock_paystack_secret_key');

  if (method === 'card' || method === 'paystack') {
    const { reference } = req.body;
    if (isPaystackLive) {
      if (!reference) {
        return res.status(400).json({ error: "Payment reference is required to verify transaction." });
      }
      try {
        const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
          headers: { 'Authorization': `Bearer ${paystackSecret}` }
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.status || verifyData.data.status !== 'success') {
          return res.status(400).json({ error: "Card transaction could not be verified by payment gateway." });
        }
        // Deduplicate verification
        const existingTx = await db.findOne('transactions', t => t.paymentReference === reference);
        if (existingTx) {
          return res.status(400).json({ error: "Payment reference has already been processed." });
        }
      } catch (err) {
        return res.status(500).json({ error: "Gateway verification error." });
      }
    }
  }

  let wallet = await db.findOne('wallets', w => w.uid === parentId);
  if (!wallet) {
    wallet = await db.insert('wallets', {
      uid: parentId,
      balance: Number(amount),
      escrow: 0
    });
  } else {
    wallet = await db.update('wallets', wallet.id, {
      balance: Number(wallet.balance) + Number(amount)
    });
  }

  // log a mock transaction
  await db.insert('transactions', {
    id: 'txn_' + Date.now(),
    fromUserId: 'system',
    toUserId: parentId,
    amount: amount,
    type: 'wallet_topup',
    status: 'Completed',
    date: new Date().toISOString()
  });

  // add notification
  await db.insert('notifications', {
    id: 'notif_' + Date.now(),
    userId: parentId,
    title: 'Wallet Top-up Successful',
    body: `Successfully added funds to your wallet.`,
    read: false,
    type: 'wallet_topup',
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    walletBalance: wallet.balance,
    escrowBalance: wallet.escrow
  });
});

// POST register referral link hit
router.post('/referral/hit', publicActionRateLimiter, async (req, res) => {
  const { ref } = req.body;
  if (!ref) {
    return res.status(400).json({ error: "Referral code is required." });
  }

  const parent = await db.findOne('parents', p => p.uid === ref);
  if (parent) {
    await db.update('parents', parent.id, {
      referralHits: (parent.referralHits || 0) + 1
    });
    return res.json({ success: true, hits: (parent.referralHits || 0) + 1 });
  }
  res.status(404).json({ error: "Parent not found." });
});


// POST submit assignments score
router.post('/assignments/grade', authenticateToken, requireRole(['Teacher']), async (req, res) => {
  const { id, score, feedback } = req.body;
  const assignment = await db.findOne('assignments', a => a.id === id);
  if (!assignment) {
    return res.status(404).json({ error: "Assignment not found." });
  }

  // Verify ownership: Teacher is tutor of session
  if (assignment.teacherId && assignment.teacherId !== req.user.uid) {
    const matchedTeacher = await db.findOne('teachers', t => t.uid === req.user.uid);
    if (!matchedTeacher || (assignment.teacherName && assignment.teacherName !== matchedTeacher.name)) {
      return res.status(403).json({ error: "Access forbidden. You are not the teacher of this assignment." });
    }
  }

  const updated = await db.update('assignments', id, {
    status: "Graded",
    grade: {
      score: parseInt(score, 10),
      feedback: feedback ? sanitizeText(feedback) : "",
      date: "Just now"
    }
  });

  // Notify parent of graded assignment
  const student = await db.findOne('students', s => s.name.toLowerCase() === assignment.studentName.toLowerCase());
  const parentUid = student ? student.parentUid : "parent_1";
  await createNotification(
    parentUid,
    "assignment_graded",
    "Assignment Graded",
    `Mr. Adebayo graded ${assignment.studentName}'s assignment: "${assignment.title}". Score: ${score}/100.`
  );

  // Trigger transactional email to parent
  const parentUser = await db.findOne('users', u => u.uid === parentUid) || { email: "parent_1@eduvistar.com" };
  sendTransactionalEmail(parentUser.email, "EduVistar: Assignment Graded Card", "assignment_graded", {
    studentName: assignment.studentName,
    title: assignment.title,
    score,
    feedback: feedback || "No comments."
  });

  res.json(updated);
});

// POST create new assignment (Teacher)
router.post('/assignments/create', authenticateToken, requireRole(['Teacher']), async (req, res) => {
  const { title, description, studentName, dueDate } = req.body;
  if (!title || !studentName) {
    return res.status(400).json({ error: "Title and Student Name are required." });
  }

  const teacher = await db.findOne('teachers', t => t.uid === req.user.uid) || { name: "Teacher" };

  const newAssignment = await db.insert('assignments', {
    title: sanitizeText(title),
    description: description ? sanitizeText(description) : "",
    teacherId: req.user.uid,
    teacherName: teacher.name,
    studentName,
    dueDate: dueDate || "Next Week",
    status: "Pending",
    createdAt: new Date().toISOString()
  });

  // Notify parent of new homework
  const studentObj = await db.findOne('students', s => s.name.toLowerCase() === studentName.toLowerCase());
  const pUid = studentObj ? studentObj.parentUid : "parent_1";
  await createNotification(
    pUid,
    "assignment_assigned",
    "New Homework Assigned",
    `A new assignment "${title}" has been set for ${studentName} by ${teacher.name || "Teacher"}.`
  );

  res.json(newAssignment);
});

// POST submit assignment (Student/Parent)
router.post('/assignments/submit', authenticateToken, async (req, res) => {
  const { id, submissionText } = req.body;
  const assignment = await db.findOne('assignments', a => a.id === id);
  if (!assignment) {
    return res.status(404).json({ error: "Assignment not found." });
  }

  // Verify Role: Must be Parent or Student
  if (req.user.role !== 'Parent' && req.user.role !== 'Student') {
    return res.status(403).json({ error: "Access forbidden. Only students or parents can submit homework." });
  }

  // Verify Ownership: Requester must be the Student themselves or the Parent of the student
  const student = await db.findOne('students', s => s.name.toLowerCase() === assignment.studentName.toLowerCase());
  if (req.user.role !== 'Admin') {
    if (req.user.role === 'Student' && (!student || student.uid !== req.user.uid)) {
      return res.status(403).json({ error: "Access forbidden. You are not the student assigned to this homework." });
    }
    if (req.user.role === 'Parent' && (!student || student.parentUid !== req.user.uid)) {
      return res.status(403).json({ error: "Access forbidden. You are not the parent of the student assigned to this homework." });
    }
  }

  const updated = await db.update('assignments', id, {
    status: "Submitted",
    submission: sanitizeText(submissionText),
    submittedAt: new Date().toISOString()
  });

  // Automated email alert to teacher
  try {
    const studentObj = await db.findOne('students', s => s.id === assignment.studentId) || { name: "Student" };
    const teacherUser = await db.findOne('users', u => u.uid === assignment.teacherId);
    if (teacherUser && teacherUser.email) {
      sendTransactionalEmail(teacherUser.email, "EduVistar: Homework Assignment Submitted", "assignment_submitted", {
        studentName: studentObj.name,
        title: assignment.title,
        submittedAt: new Date().toLocaleDateString()
      });
    }
  } catch (err) {
    console.error("Failed to send homework submission email alert:", err);
  }

  res.json(updated);
});

export default router;
