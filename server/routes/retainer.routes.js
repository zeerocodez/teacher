import express from 'express';
import { db } from '../db.js';
import { createNotification } from '../utils.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { sendTransactionalEmail } from '../services/email.js';

const router = express.Router();

// Grade A Minimum Floor Guarantee in minor units (₦100,000 = 10,000,000 kobo)
const GRADE_A_MIN_FLOOR_MINOR = 10000000;

// Default 4-week structured milestones for monthly retainer
function generateDefaultMilestones(totalSessions = 8) {
  const s1 = Math.max(1, Math.round(totalSessions * 0.25));
  const s2 = Math.max(2, Math.round(totalSessions * 0.50));
  const s3 = Math.max(3, Math.round(totalSessions * 0.75));
  const s4 = totalSessions;

  return [
    {
      week: 1,
      title: "Week 1: Diagnostic Assessment & Curriculum Foundation",
      targetSessions: s1,
      completedSessions: 0,
      status: "in_progress",
      progressPercent: 25,
      releasedEscrowPercent: 0,
      description: "Initial diagnostic testing, baseline score measurement, and core foundational module drills."
    },
    {
      week: 2,
      title: "Week 2: Intensive Concepts & Bi-Weekly Quiz",
      targetSessions: s2,
      completedSessions: 0,
      status: "pending",
      progressPercent: 50,
      releasedEscrowPercent: 0,
      description: "In-depth practice problems, live Q&A sessions, and 1st milestone formative quiz."
    },
    {
      week: 3,
      title: "Week 3: Advanced Applications & Mock Exam Drill",
      targetSessions: s3,
      completedSessions: 0,
      status: "pending",
      progressPercent: 75,
      releasedEscrowPercent: 0,
      description: "Targeted weak-area remediation, timed problem sets, and practical homework reviews."
    },
    {
      week: 4,
      title: "Week 4: Mastery Evaluation & Monthly Progress Report",
      targetSessions: s4,
      completedSessions: 0,
      status: "pending",
      progressPercent: 100,
      releasedEscrowPercent: 100,
      description: "Comprehensive summative evaluation, final progress report card generation, and escrow release."
    }
  ];
}

// GET /api/retainers - Retrieve all monthly retainer contracts for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userRole = req.user.role;

    let retainers = await db.find('monthly_retainers');

    // Filter by role unless admin
    if (userRole === 'Parent') {
      retainers = retainers.filter(r => r.parentId === userId);
    } else if (userRole === 'Teacher') {
      retainers = retainers.filter(r => r.teacherId === userId);
    }

    // Sort by latest created
    retainers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(retainers);
  } catch (err) {
    console.error("Failed to fetch retainers:", err);
    res.status(500).json({ error: "Failed to retrieve monthly retainer records." });
  }
});

// GET /api/retainers/:id - Retrieve single retainer contract details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const retainer = await db.findOne('monthly_retainers', r => r.id === id || r.uid === id);
    if (!retainer) {
      return res.status(404).json({ error: "Retainer contract not found." });
    }

    // Access check
    if (req.user.role !== 'Admin' && retainer.parentId !== req.user.uid && retainer.teacherId !== req.user.uid) {
      return res.status(403).json({ error: "Unauthorized access to this retainer contract." });
    }

    res.json(retainer);
  } catch (err) {
    console.error("Failed to fetch retainer:", err);
    res.status(500).json({ error: "Failed to load retainer contract details." });
  }
});

// POST /api/retainers/create - Book a monthly retainer contract
router.post('/create', authenticateToken, requireRole(['Parent', 'Admin']), async (req, res) => {
  try {
    const {
      teacherId,
      studentId,
      studentName,
      subject,
      curriculum,
      sessionsCount = 8,
      paymentMethod = 'wallet',
      customScheduleNotes = ''
    } = req.body;

    if (!teacherId || !studentId) {
      return res.status(400).json({ error: "Teacher ID and Student ID are required." });
    }

    const teacher = await db.findOne('teachers', t => t.uid === teacherId || t.id === teacherId);
    if (!teacher) {
      return res.status(404).json({ error: "Educator profile not found." });
    }

    const parentUser = await db.findOne('users', u => u.uid === req.user.uid);
    const parentName = parentUser?.displayName || "Parent";

    // Determine educator tier and enforce Rate Floor Protection
    const isGradeA = teacher.tier === 'Grade A' || teacher.isEliteVip || teacher.isVipTeacher || (teacher.badges || []).includes('badge-ai-cert');
    const teacherRateMinor = teacher.rate || 350000;
    const rawCalculatedCostMinor = sessionsCount * teacherRateMinor;

    // Enforce ₦100,000 rate floor for Grade A Elite teachers
    let contractAmountMinor = rawCalculatedCostMinor;
    if (isGradeA && contractAmountMinor < GRADE_A_MIN_FLOOR_MINOR) {
      contractAmountMinor = GRADE_A_MIN_FLOOR_MINOR;
    }

    // Wallet balance check if paying via wallet
    if (paymentMethod === 'wallet') {
      const userWallet = parentUser?.walletBalance || 0;
      if (userWallet < contractAmountMinor) {
        return res.status(400).json({ 
          error: `Insufficient wallet balance. Total required is ₦${(contractAmountMinor / 100).toLocaleString()}, your balance is ₦${(userWallet / 100).toLocaleString()}.` 
        });
      }

      // Deduct from parent wallet and lock into escrow
      await db.update('users', req.user.uid, {
        walletBalance: userWallet - contractAmountMinor,
        escrowBalance: (parentUser.escrowBalance || 0) + contractAmountMinor
      });
    }

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const retainerId = `retainer_${Date.now()}`;
    const newRetainer = {
      id: retainerId,
      uid: retainerId,
      parentId: req.user.uid,
      parentName,
      parentEmail: parentUser?.email || '',
      teacherId: teacher.uid || teacher.id,
      teacherName: teacher.name,
      teacherAvatar: teacher.avatar,
      teacherTier: isGradeA ? 'Grade A' : (teacher.tier || 'Grade B'),
      isGradeA,
      isFloorGuaranteed: isGradeA,
      studentId,
      studentName: studentName || "Student",
      subject: subject || (teacher.subjects?.[0] || "General"),
      curriculum: curriculum || (teacher.curricula?.[0] || "Standard"),
      totalAmountMinor: contractAmountMinor,
      formattedAmountNgn: `₦${(contractAmountMinor / 100).toLocaleString()}`,
      sessionsTotal: parseInt(sessionsCount, 10),
      sessionsCompleted: 0,
      currentWeek: 1,
      overallProgress: 0,
      status: "active", // active | completed | paused | cancelled
      escrowStatus: "held_in_escrow", // held_in_escrow | partially_released | released
      paymentMethod,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      customScheduleNotes,
      milestones: generateDefaultMilestones(parseInt(sessionsCount, 10)),
      createdAt: new Date().toISOString()
    };

    await db.insert('monthly_retainers', newRetainer);

    // Record Escrow transaction
    await db.insert('transactions', {
      id: `tx_${Date.now()}`,
      fromUserId: req.user.uid,
      toUserId: teacher.uid || teacher.id,
      amount: contractAmountMinor,
      currency: "NGN",
      type: "monthly_retainer_escrow",
      retainerId,
      status: "escrow_locked",
      description: `Monthly Retainer Contract (${sessionsCount} sessions) secured for ${teacher.name} with ${studentName}`,
      createdAt: new Date().toISOString()
    });

    // Notify Teacher
    await createNotification(
      teacher.uid || teacher.id,
      "👑 New Monthly Retainer Contract Secured!",
      `${parentName} booked a 30-day monthly contract (${newRetainer.formattedAmountNgn}) for ${newRetainer.subject}. ${isGradeA ? 'Guaranteed ₦100,000 Grade A Floor Protection Active.' : ''}`,
      "retainer"
    );

    // Notify Parent
    await createNotification(
      req.user.uid,
      "Monthly Retainer Active & Escrow Secured",
      `Your 30-day contract with ${teacher.name} for ${studentName} is live. ${sessionsCount} sessions are scheduled across 4 weekly milestones.`,
      "retainer"
    );

    // Send confirmation email
    if (parentUser?.email) {
      sendTransactionalEmail({
        to: parentUser.email,
        subject: `Monthly Retainer Confirmed: ${teacher.name} (${newRetainer.formattedAmountNgn})`,
        body: `Hello ${parentName},\n\nYour 30-day monthly tutoring retainer with ${teacher.name} has been successfully secured in EduVistar Escrow.\n\nContract Details:\n- Total Amount: ${newRetainer.formattedAmountNgn}\n- Total Sessions: ${sessionsCount} Sessions\n- Student: ${studentName}\n- Subject: ${newRetainer.subject}\n- Milestones: 4 Weekly Structured Evaluations\n\nYou can track weekly progress anytime from your Parent Dashboard.`
      }).catch(err => console.warn("Retainer email failed:", err));
    }

    res.json({
      success: true,
      message: "Monthly Retainer Contract successfully secured in escrow.",
      retainer: newRetainer
    });
  } catch (err) {
    console.error("Failed to create monthly retainer:", err);
    res.status(500).json({ error: "Failed to book monthly retainer contract." });
  }
});

// POST /api/retainers/:id/complete-session - Increment session count & update milestone progress
router.post('/:id/complete-session', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const retainer = await db.findOne('monthly_retainers', r => r.id === id || r.uid === id);
    if (!retainer) {
      return res.status(404).json({ error: "Retainer contract not found." });
    }

    // Permission check (Teacher, Parent, or Admin)
    if (req.user.role !== 'Admin' && retainer.teacherId !== req.user.uid && retainer.parentId !== req.user.uid) {
      return res.status(403).json({ error: "Unauthorized." });
    }

    const newCompleted = Math.min(retainer.sessionsTotal, (retainer.sessionsCompleted || 0) + 1);
    const overallProgress = Math.round((newCompleted / retainer.sessionsTotal) * 100);

    // Update milestones status based on completed sessions
    const updatedMilestones = (retainer.milestones || []).map((m) => {
      const isMet = newCompleted >= m.targetSessions;
      return {
        ...m,
        completedSessions: Math.min(newCompleted, m.targetSessions),
        status: isMet ? "completed" : (newCompleted >= (m.targetSessions - 1) ? "in_progress" : "pending")
      };
    });

    const isFullyCompleted = newCompleted >= retainer.sessionsTotal;

    const updated = await db.update('monthly_retainers', retainer.id, {
      sessionsCompleted: newCompleted,
      overallProgress,
      milestones: updatedMilestones,
      status: isFullyCompleted ? "completed" : "active",
      escrowStatus: isFullyCompleted ? "released" : retainer.escrowStatus,
      completedAt: isFullyCompleted ? new Date().toISOString() : retainer.completedAt
    });

    // If fully completed, disburse escrow to teacher wallet
    if (isFullyCompleted && retainer.escrowStatus !== 'released') {
      const teacher = await db.findOne('teachers', t => t.uid === retainer.teacherId || t.id === retainer.teacherId);
      const teacherUser = await db.findOne('users', u => u.uid === retainer.teacherId);
      
      // Calculate 83% teacher payout (17% platform commission)
      const commissionRate = 0.17;
      const teacherEarningsMinor = Math.round(retainer.totalAmountMinor * (1 - commissionRate));

      if (teacherUser) {
        await db.update('users', teacherUser.uid, {
          walletBalance: (teacherUser.walletBalance || 0) + teacherEarningsMinor
        });
      }

      await createNotification(
        retainer.teacherId,
        "💰 Monthly Retainer Escrow Released!",
        `Congratulations! All ${retainer.sessionsTotal} sessions for ${retainer.studentName} have been completed. ₦${(teacherEarningsMinor / 100).toLocaleString()} credited to your wallet.`,
        "payment"
      );

      await createNotification(
        retainer.parentId,
        "🎓 Monthly Retainer Contract Successfully Completed",
        `All ${retainer.sessionsTotal} milestones for ${retainer.studentName} with ${retainer.teacherName} have concluded. Thank you for choosing EduVistar!`,
        "retainer"
      );
    }

    res.json({
      success: true,
      message: `Session progress updated (${newCompleted}/${retainer.sessionsTotal}).`,
      retainer: updated
    });
  } catch (err) {
    console.error("Failed to update milestone session:", err);
    res.status(500).json({ error: "Failed to update milestone progress." });
  }
});

export default router;
