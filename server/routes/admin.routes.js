import express from 'express';
import crypto from 'crypto';
import { db } from '../db.js';
import { createNotification } from '../utils.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { sendTransactionalEmail } from '../services/email.js';

const router = express.Router();

// GET all teacher applications (Admin application listings)
router.get('/applications', authenticateToken, requireRole(['Admin']), async (req, res) => {
  const teachers = await db.find('teachers');
  res.json(teachers);
});

// GET all B2B Schools list
router.get('/b2b-schools', authenticateToken, requireRole(['Admin']), async (req, res) => {
  let schools = await db.find('b2b_schools');
  if (schools.length === 0) {
    // Seed default B2B school
    await db.insert('b2b_schools', {
      uid: "school_greenwood",
      name: "Greenwood Hall Academy",
      apiKey: "eb_b2b_greenwood_key_2026",
      status: "active",
      registeredStudentsCount: 2
    });
    schools = await db.find('b2b_schools');
  }
  res.json(schools);
});

// POST generate new B2B School API Key
router.post('/b2b-schools/create', authenticateToken, requireRole(['Admin']), async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "School name is required." });
  }

  const apiKey = `eb_b2b_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${crypto.randomBytes(4).toString('hex')}`;
  const newSchool = await db.insert('b2b_schools', {
    uid: `school_${Date.now()}`,
    name,
    apiKey,
    status: "active",
    registeredStudentsCount: 0
  });

  res.json(newSchool);
});

// POST revoke B2B School API key
router.post('/b2b-schools/revoke', authenticateToken, requireRole(['Admin']), async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "School identity is required." });
  }

  const updated = await db.update('b2b_schools', id, { status: "revoked" });
  res.json(updated);
});

// POST Approve, Promote Tier, Request Revision, or Reject teacher application (Admin trigger)
router.post('/applications/respond', authenticateToken, requireRole(['Admin']), async (req, res) => {
  const { teacherUid, action, tier, reason, feedback } = req.body;
  if (!teacherUid || !action) {
    return res.status(400).json({ error: "Teacher UID and action are required." });
  }

  const teacher = await db.findOne('teachers', t => t.uid === teacherUid);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher profile not found." });
  }

  let status = "verified";
  let verifiedStatus = true;
  let assignedTier = tier || teacher.tier || 'Grade B';
  let isEliteVip = teacher.isEliteVip || false;
  let isVipTeacher = teacher.isVipTeacher || false;
  let existingBadges = Array.isArray(teacher.badges) ? [...teacher.badges] : [];
  let userStatus = "active";
  let notifTitle = "Application Approved!";
  let notifMessage = "Welcome to EduVistar! Your teacher onboarding profile is approved and live.";
  let emailSubject = "Teacher Application Approved!";
  let emailMessage = `Hello ${teacher.name},\n\nCongratulations! Your teacher onboarding application has been approved. You are now live on the EduVistar platform and can start accepting students.`;

  if (action === "ApproveGradeA" || (action === "Approve" && assignedTier === "Grade A")) {
    assignedTier = "Grade A";
    status = "verified";
    verifiedStatus = true;
    isEliteVip = true;
    isVipTeacher = true;
    if (!existingBadges.includes('badge-ai-cert')) existingBadges.push('badge-ai-cert');
    if (!existingBadges.includes('badge-vip')) existingBadges.push('badge-vip');
    if (!existingBadges.includes('badge-verified')) existingBadges.push('badge-verified');

    notifTitle = "👑 Grade A Elite VVIP Status Approved!";
    notifMessage = "Congratulations! You have been certified as a Grade A Elite VVIP Educator with ₦100,000 monthly rate floor protection and VIP WhatsApp community access.";
    emailSubject = "👑 Welcome to EduVistar Elite Teachers Academy (Grade A VVIP)";
    emailMessage = `Hello ${teacher.name},\n\nCongratulations! Your credentials have been thoroughly audited and approved as a Grade A Elite VVIP Educator on EduVistar.\n\nKey Benefits Active:\n- ₦100,000 Monthly Contract Rate Floor Guarantee\n- Gold Crown Verified Badge on your public profile\n- Top search placement in EduVistar Marketplace\n- Private VIP WhatsApp Community Access`;
  } else if (action === "ApproveGradeB" || action === "Approve") {
    assignedTier = "Grade B";
    status = "verified";
    verifiedStatus = true;
    if (!existingBadges.includes('badge-verified')) existingBadges.push('badge-verified');

    notifTitle = "🛡️ Grade B Verified Status Approved!";
    notifMessage = "Congratulations! Your credentials (NIN, Degree/TRCN, School ID, LinkedIn) have been verified. You are now live on the EduVistar Marketplace.";
    emailSubject = "🛡️ Your EduVistar Teacher Profile is Verified!";
    emailMessage = `Hello ${teacher.name},\n\nCongratulations! Your credentials have been audited and verified. You have been awarded the Grade B Verified Educator badge on EduVistar and are now accepting students.`;
  } else if (action === "RequestRevision") {
    status = "needs_revision";
    verifiedStatus = false;
    userStatus = "active";
    const revisionNotes = reason || feedback || "Please re-upload clearer copies of your credentials.";

    notifTitle = "🔄 Credential Revision Requested";
    notifMessage = `Your application requires credential updates: ${revisionNotes}`;
    emailSubject = "EduVistar Verification: Credential Updates Required";
    emailMessage = `Hello ${teacher.name},\n\nOur verification team reviewed your application and requires updates before finalizing verification:\n\nNotes: ${revisionNotes}\n\nPlease sign in to your dashboard to re-upload the requested documents.`;
  } else if (action === "Reject") {
    status = "rejected";
    verifiedStatus = false;
    userStatus = "suspended";
    const rejectFeedback = reason || feedback || "Credentials failed verification standards.";

    notifTitle = "Application Not Approved";
    notifMessage = `Your onboarding application was declined: ${rejectFeedback}`;
    emailSubject = "EduVistar Teacher Application Status Update";
    emailMessage = `Hello ${teacher.name},\n\nThank you for applying to EduVistar. Unfortunately, we were unable to approve your application at this time.\n\nReason: ${rejectFeedback}`;
  }

  const updateData = {
    status,
    verified: verifiedStatus,
    tier: assignedTier,
    isEliteVip,
    isVipTeacher,
    badges: existingBadges,
    ...(action === "RequestRevision" ? { revisionNotes: reason || feedback } : {}),
    ...(action === "Reject" ? { rejectReason: reason || feedback } : {})
  };

  const updated = await db.update('teachers', teacher.id, updateData);

  // Also update user verification state in users database collection
  const user = await db.findOne('users', u => u.uid === teacherUid);
  if (user) {
    await db.update('users', user.id, {
      status: userStatus,
      tier: assignedTier
    });
  }

  // Notify teacher of the application outcome
  await createNotification(
    teacherUid,
    "application_response",
    notifTitle,
    notifMessage
  );

  // Send email to teacher
  if (user && user.email) {
    sendTransactionalEmail(user.email, emailSubject, "alert", { message: emailMessage });
  }

  res.json(updated);
});

// GET pending transactions
router.get('/transactions/pending', authenticateToken, requireRole(['Admin']), async (req, res) => {
  const transactions = await db.find('transactions', t => t.status === 'Pending Verification');
  res.json(transactions);
});

// POST approve transaction
router.post('/transactions/:id/approve', authenticateToken, requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  const transaction = await db.findOne('transactions', t => t.id === id);
  if (!transaction) return res.status(404).json({ error: "Transaction not found" });
  if (transaction.status !== 'Pending Verification') return res.status(400).json({ error: "Transaction not pending" });
  
  if (transaction.type === 'wallet_topup') {
    let wallet = await db.findOne('wallets', w => w.uid === transaction.toUserId);
    if (!wallet) {
      await db.insert('wallets', { uid: transaction.toUserId, balance: Number(transaction.amount), escrow: 0 });
    } else {
      await db.update('wallets', wallet.id, { balance: Number(wallet.balance) + Number(transaction.amount) });
    }
  } else if (transaction.type === 'session_booking') {
    let wallet = await db.findOne('wallets', w => w.uid === transaction.fromUserId);
    if (wallet) {
      await db.update('wallets', wallet.id, { escrow: Number(wallet.escrow) + Number(transaction.amount) });
    }
    
    // Find all sessions booked by this parent that are pending verification
    const pendingSessions = await db.find('sessions', s => s.status === 'Pending Verification' && s.parentId === transaction.fromUserId && s.teacherId === transaction.toUserId);
    for (const ps of pendingSessions) {
      await db.update('sessions', ps.id, { status: 'Pending Confirmation' }); 
    }
  }
  
  await db.update('transactions', transaction.id, { status: 'Completed' });
  await createNotification(transaction.fromUserId === 'system' ? transaction.toUserId : transaction.fromUserId, 'payment_approved', 'Your bank transfer was verified and approved.', 'transaction_update');
  
  res.json({ success: true });
});

// POST reject transaction
router.post('/transactions/:id/reject', authenticateToken, requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  const transaction = await db.findOne('transactions', t => t.id === id);
  if (!transaction) return res.status(404).json({ error: "Transaction not found" });
  
  await db.update('transactions', transaction.id, { status: 'Failed' });
  
  if (transaction.type === 'session_booking') {
    const pendingSessions = await db.find('sessions', s => s.status === 'Pending Verification' && s.parentId === transaction.fromUserId && s.teacherId === transaction.toUserId);
    for (const ps of pendingSessions) {
      await db.update('sessions', ps.id, { status: 'Cancelled' }); 
    }
  }
  
  await createNotification(transaction.fromUserId === 'system' ? transaction.toUserId : transaction.fromUserId, 'payment_rejected', 'Your bank transfer could not be verified.', 'transaction_update');
  
  res.json({ success: true });
});

// POST Reset all non-admin data (Parents, Teachers, Students, Sessions, Assignments, Disputes, Transactions, Wallets, Reviews, Messages) for live production
router.post('/reset-signups', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const adminEmails = ['zeerocodes@gmail.com', 'morichcare@gmail.com', 'admin@eduvistar.com', 'admin@eduvistar.com'];
    
    // 1. Delete all non-admin users
    const allUsers = await db.find('users');
    let deletedUsers = 0;
    for (const u of allUsers) {
      const emailLower = (u.email || '').toLowerCase();
      if (u.role !== 'Admin' && !adminEmails.includes(emailLower)) {
        await db.delete('users', u.id || u.uid);
        deletedUsers++;
      }
    }

    // 2. Clear all activity collections
    const collectionsToClear = [
      'parents',
      'students',
      'sessions',
      'assignments',
      'disputes',
      'transactions',
      'notifications',
      'reviews',
      'messages',
      'sent_emails',
      'waitlist',
      'academy_progress',
      'academy_forum'
    ];
    
    const summary = { deletedUsers };

    for (const col of collectionsToClear) {
      const docs = await db.find(col);
      for (const d of docs) {
        await db.delete(col, d.id || d.uid);
      }
      summary[col] = docs.length;
    }

    // 3. Reset Wallets to 0 for admins and remove non-admin wallets
    const allWallets = await db.find('wallets');
    let resetWallets = 0;
    for (const w of allWallets) {
      const isOwnerAdmin = ['admin_1', 'admin_zeerocodes', 'admin_morichcare'].includes(w.uid || w.userUid);
      if (isOwnerAdmin) {
        await db.update('wallets', w.id, {
          balance: 0,
          escrow: 0,
          history: [],
          updatedAt: new Date().toISOString()
        });
        resetWallets++;
      } else {
        await db.delete('wallets', w.id);
      }
    }
    summary.walletsResetToZero = resetWallets;

    // 4. Reset Teacher metrics to zero baseline
    const teachers = await db.find('teachers');
    for (const t of teachers) {
      await db.update('teachers', t.id, {
        rating: 5.0,
        reviewsCount: 0,
        stats: { sessionsTaught: 0, responseRate: 100 },
        updatedAt: new Date().toISOString()
      });
    }
    summary.teachersReset = teachers.length;

    res.json({
      success: true,
      message: "All platform data has been securely reset to 0 across the board for live production.",
      summary
    });
  } catch (err) {
    console.error("Failed to reset signups:", err);
    res.status(500).json({ error: "Failed to reset signups: " + err.message });
  }
});

export default router;
