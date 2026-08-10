import express from 'express';
import { db } from '../db.js';
import { sanitizeText, createNotification } from '../utils.js';
import { authenticateToken, requireRole, requireOwnerOrAdmin } from '../middleware/auth.js';
import { sendTransactionalEmail } from '../services/email.js';

const router = express.Router();

// Helper function to execute a bank transfer via Paystack Transfer APIs
async function executePaystackTransfer(amountMinor, recipient) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || secretKey.startsWith('pk_') || secretKey.includes('mock') || secretKey.includes('test')) {
    console.log(`[PAYSTACK TRANSFER] Sandbox Simulation Mode: Initiated transfer of ₦${(amountMinor / 100).toLocaleString()} to ${recipient.name} (${recipient.bankName || 'GTBank'} - ${recipient.accountNumber})`);
    return { status: 'success', reference: `trsf_${Date.now()}` };
  }

  try {
    const recipientResponse = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'nuban',
        name: recipient.name,
        account_number: recipient.accountNumber,
        bank_code: recipient.bankCode,
        currency: 'NGN'
      })
    });

    const recipientData = await recipientResponse.json();
    if (!recipientResponse.ok || !recipientData.status) {
      throw new Error(recipientData.message || 'Failed to create transfer recipient on Paystack');
    }

    const recipientCode = recipientData.data.recipient_code;

    const transferResponse = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source: 'balance',
        amount: Math.round(amountMinor),
        recipient: recipientCode,
        reason: 'EduVista Payout Withdrawal'
      })
    });

    const transferData = await transferResponse.json();
    if (!transferResponse.ok || !transferData.status) {
      throw new Error(transferData.message || 'Failed to execute bank transfer on Paystack');
    }

    return {
      status: transferData.data.status,
      reference: transferData.data.reference
    };
  } catch (err) {
    console.error("[PAYSTACK TRANSFER] API Error:", err.message);
    throw err;
  }
}


// --- 4. SESSION BOOKINGS & ESCROW ---

// POST Book a session
router.post('/sessions/book', authenticateToken, requireRole(['Parent']), requireOwnerOrAdmin, async (req, res) => {
  const { teacherId, teacherName, studentId, studentName, parentId, costPerSession, slots, subject, curriculum, paymentMethod } = req.body;


  if (!slots || !Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({ error: "No slots selected." });
  }

  // Double-booking check
  const existingBookings = await db.find('sessions', s => s.teacherId === teacherId && s.status !== 'Cancelled');
  for (const slot of slots) {
    const isDoubleBooked = existingBookings.some(eb => 
      eb.slot && 
      eb.slot.time === slot.time &&
      (
        eb.slot.day === slot.day || 
        (eb.slot.dateString && eb.slot.dateString === slot.dateString) ||
        (eb.slot.dateString && slot.day && slot.day.includes(eb.slot.dateString)) ||
        (slot.dateString && eb.slot.day && eb.slot.day.includes(slot.dateString))
      )
    );
    if (isDoubleBooked) {
      return res.status(400).json({ error: `The slot "${slot.day} at ${slot.time}" is already booked for this teacher.` });
    }
  }

  const totalCost = costPerSession * slots.length;

  const isBankTransfer = paymentMethod === 'bank';

  // 1. Check Parent wallet (skip if bank transfer)
  const wallet = await db.findOne('wallets', w => w.uid === parentId);
  if (!isBankTransfer) {
    if (!wallet || wallet.balance < totalCost) {
      return res.status(400).json({ error: "Insufficient wallet balance." });
    }
    // 2. Lock escrow balance
    await db.update('wallets', wallet.id, {
      balance: wallet.balance - totalCost,
      escrow: wallet.escrow + totalCost
    });
  }

  const teacherProfile = await db.findOne('teachers', t => t.uid === teacherId || t.id === teacherId);
  const defaultSubject = (teacherProfile && teacherProfile.subjects && teacherProfile.subjects[0]) || "General Class";
  const defaultCurriculum = (teacherProfile && teacherProfile.curricula && teacherProfile.curricula[0]) || "Standard";

  // 3. Create Session Records
  const createdSessions = [];
  let lastSession = null;
  for (const slot of slots) {
    const newSession = await db.insert('sessions', {
      teacherId,
      teacherName,
      studentId,
      studentName,
      parentId,
      cost: costPerSession,
      slot,
      status: isBankTransfer ? "Pending Verification" : "Pending Confirmation",
      clockLog: [],
      recordingConsent: { teacher: true, parent: true },
      subject: subject || defaultSubject,
      curriculum: curriculum || defaultCurriculum
    });
    createdSessions.push(newSession);
    lastSession = newSession;
  }

  // 4. Log Transaction
  if (lastSession) {
    await db.insert('transactions', {
      amount: totalCost,
      amountMinorUnits: totalCost,
      currency: "NGN",
      commission: 0,
      status: isBankTransfer ? "Pending Verification" : "secured",
      fromUserId: parentId,
      toUserId: teacherId,
      sessionId: lastSession.id,
      paymentProcessor: isBankTransfer ? "bank" : "escrow",
      payoutStatus: "locked"
    });
  }

  const cost = costPerSession;
  const slot = slots[0];

  // Dispatch Notifications
  await createNotification(
    parentId,
    "booking_secured",
    "Escrow Secured",
    `₦${cost/100} has been locked in escrow for your session with ${teacherName}.`
  );
  await createNotification(
    teacherId,
    "booking_received",
    "New Booking Request",
    `You have a new session request from Ngozi Adeleke for Tunde on ${slot.day} at ${slot.time}.`
  );

  // Retrieve parent email to notify
  const parentUser = await db.findOne('users', u => u.uid === parentId) || { email: "parent_1@eduvistar.com" };
  sendTransactionalEmail(parentUser.email, "EduVista: Session Escrow Secured", "booking_secured", {
    teacherName,
    formattedCost: `₦${cost/100}`,
    slot
  });

  // Automated notification and email alert to the teacher
  try {
    const teacherUser = await db.findOne('users', u => u.uid === teacherId);
    if (teacherUser && teacherUser.email) {
      sendTransactionalEmail(teacherUser.email, "EduVista: New Session Booking Request", "booking_received", {
        parentName: parentUser.displayName || parentUser.email.split('@')[0],
        studentName,
        subject,
        curriculum,
        slot,
        formattedPayout: `₦${((cost * 0.85) / 100).toFixed(2)}`
      });
    }
  } catch (err) {
    console.error("Failed to send booking notification email to teacher:", err);
  }

  if (isBankTransfer) {
    res.json({
      success: true,
      status: "pending",
      message: "Booking pending bank transfer verification."
    });
  } else {
    res.json({
      success: true,
      message: "Successfully booked sessions",
      sessions: createdSessions,
      walletBalance: wallet.balance - totalCost,
      escrowBalance: wallet.escrow + totalCost
    });
  }
});

// POST Respond to booking requests (manual confirmation)
router.post('/sessions/respond', authenticateToken, requireRole(['Teacher']), async (req, res) => {
  const { sessionId, action } = req.body;
  if (!sessionId || !action) {
    return res.status(400).json({ error: "Session ID and action are required." });
  }

  const session = await db.findOne('sessions', s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }

  if (session.teacherId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. You are not the teacher of this session." });
  }

  if (action === "Confirm") {
    const updated = await db.update('sessions', session.id, {
      status: "Scheduled"
    });
    await createNotification(
      session.parentId,
      "booking_confirmed",
      "Booking Confirmed",
      `Your session with ${session.teacherName} has been confirmed for ${session.slot.day} at ${session.slot.time}.`
    );

    // Automated email to Parent
    try {
      const parentUser = await db.findOne('users', u => u.uid === session.parentId);
      if (parentUser && parentUser.email) {
        sendTransactionalEmail(parentUser.email, "EduVista: Booking Request Confirmed", "booking_confirmed", {
          teacherName: session.teacherName,
          slot: session.slot
        });
      }
    } catch (err) {
      console.error("Failed to send booking confirmation email to parent:", err);
    }

    return res.json(updated);
  } else if (action === "Reject") {
    // Release escrow back to parent
    const wallet = await db.findOne('wallets', w => w.uid === session.parentId);
    if (wallet) {
      await db.update('wallets', wallet.id, {
        balance: wallet.balance + session.cost,
        escrow: Math.max(0, wallet.escrow - session.cost)
      });
    }

    const updated = await db.update('sessions', session.id, {
      status: "Rejected"
    });
    await createNotification(
      session.parentId,
      "booking_rejected",
      "Booking Declined",
      `Your booking request was declined by ${session.teacherName}. Funds have been refunded to your wallet.`
    );

    // Automated email to Parent
    try {
      const parentUser = await db.findOne('users', u => u.uid === session.parentId);
      if (parentUser && parentUser.email) {
        sendTransactionalEmail(parentUser.email, "EduVista: Booking Request Declined", "booking_rejected", {
          teacherName: session.teacherName,
          formattedCost: `₦${session.cost/100}`
        });
      }
    } catch (err) {
      console.error("Failed to send booking rejection email to parent:", err);
    }

    return res.json(updated);
  } else {
    return res.status(400).json({ error: "Invalid action. Must be 'Confirm' or 'Reject'." });
  }
});

// GET messages for a session
router.get('/messages/:sessionId', authenticateToken, async (req, res) => {
  const { sessionId } = req.params;
  const session = await db.findOne('sessions', s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }
  if (session.teacherId !== req.user.uid && session.parentId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. You are not a participant of this class." });
  }
  
  const messages = await db.find('messages', m => m.sessionId === sessionId);
  messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json(messages);
});

// POST send message
router.post('/messages', authenticateToken, async (req, res) => {
  const { sessionId, senderId, senderName, text } = req.body;
  if (!sessionId || !senderId || !senderName || !text) {
    return res.status(400).json({ error: "Session ID, sender, and text are required." });
  }

  if (senderId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. Sender ID mismatch." });
  }

  const session = await db.findOne('sessions', s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }
  if (session.teacherId !== req.user.uid && session.parentId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. You are not a participant of this class." });
  }

  const newMessage = await db.insert('messages', {
    sessionId,
    senderId,
    senderName,
    text: sanitizeText(text)
  });

  // Dispatch Notifications
  const sess = await db.findOne('sessions', s => s.id === sessionId);
  if (sess) {
    const recipientId = senderId === sess.teacherId ? sess.parentId : sess.teacherId;
    await createNotification(
      recipientId,
      "message_received",
      `New Message from ${senderName}`,
      text.length > 50 ? `${text.substring(0, 50)}...` : text
    );
  }

  res.json(newMessage);
});

// POST Session telemetry / clock events
router.post('/sessions/clock', authenticateToken, async (req, res) => {
  const { sessionId, eventType, timestamp } = req.body;
  if (!sessionId || !eventType) {
    return res.status(400).json({ error: "Session ID and eventType are required." });
  }

  const session = await db.findOne('sessions', s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session record not found." });
  }

  if (session.teacherId !== req.user.uid && session.parentId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. Not a participant." });
  }

  const clockLog = session.clockLog || [];
  clockLog.push({ event: eventType, timestamp: timestamp || new Date().toISOString() });

  const updated = await db.update('sessions', sessionId, { clockLog });
  res.json({ success: true, clockLog: updated.clockLog });
});

// POST Update session class link
router.post('/sessions/link', authenticateToken, requireRole(['Teacher']), async (req, res) => {
  const { sessionId, classLink } = req.body;
  if (!sessionId || !classLink) {
    return res.status(400).json({ error: "Session ID and class link are required." });
  }

  const session = await db.findOne('sessions', s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }
  
  if (session.teacherId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. Not your session." });
  }

  const updated = await db.update('sessions', sessionId, { 
    classLink: sanitizeText(classLink)
  });
  
  res.json(updated);
});

// POST End session and release escrow
router.post('/sessions/end', authenticateToken, requireRole(['Parent']), async (req, res) => {
  const { sessionId, rating, comment } = req.body;

  const session = await db.findOne('sessions', s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session record not found." });
  }

  if (session.parentId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. You are not the parent of this session." });
  }

  if (session.status === "Completed") {
    return res.status(400).json({ error: "Session is already completed." });
  }

  // 1. Update session status
  await db.update('sessions', sessionId, {
    status: "Completed",
    actualEnd: new Date().toISOString()
  });

  // 2. Release Escrow & Apportion payout/commission based on booking source
  const config = await db.findOne('platform_config', c => c.id === 'default') || { commissionRate: 15 };
  const commissionRate = config.commissionRate || 15;
  const commission = Math.round(session.cost * (commissionRate / 100));
  const payout = session.cost - commission;

  const parentWallet = await db.findOne('wallets', w => w.uid === session.parentId);

  if (parentWallet && Number(parentWallet.escrow) >= session.cost) {
    // Booked via Parent Wallet: release parent escrow, add platform commission to admin, and add teacher payout
    await db.update('wallets', parentWallet.id, {
      escrow: Math.max(0, Number(parentWallet.escrow) - session.cost)
    });

    let teacherWallet = await db.findOne('wallets', w => w.uid === session.teacherId);
    if (!teacherWallet) {
      await db.insert('wallets', {
        uid: session.teacherId,
        balance: payout,
        escrow: 0
      });
    } else {
      await db.update('wallets', teacherWallet.id, {
        balance: Number(teacherWallet.balance) + payout
      });
    }

    let adminWallet = await db.findOne('wallets', w => w.uid === 'admin_1');
    if (!adminWallet) {
      await db.insert('wallets', {
        uid: 'admin_1',
        balance: commission,
        escrow: 0
      });
    } else {
      await db.update('wallets', adminWallet.id, {
        balance: Number(adminWallet.balance) + commission
      });
    }
  } else {
    // Booked via Card checkout: payout (85%) was already locked in teacher's escrow, so release it to teacher's balance
    let teacherWallet = await db.findOne('wallets', w => w.uid === session.teacherId);
    if (teacherWallet) {
      await db.update('wallets', teacherWallet.id, {
        escrow: Math.max(0, Number(teacherWallet.escrow) - payout),
        balance: Number(teacherWallet.balance) + payout
      });
    } else {
      await db.insert('wallets', {
        uid: session.teacherId,
        balance: payout,
        escrow: 0
      });
    }
    // Admin commission was already allocated to admin wallet balance at booking checkout webhook
  }

  await createNotification(
    session.parentId,
    "session_completed",
    "Session Completed",
    `Your session with ${session.teacherName} is complete. Billed duration: 58 mins.`
  );

  await createNotification(
    session.teacherId,
    "escrow_released",
    "Payout Transferred",
    `Payout of ₦${payout/100} has been released to your wallet (commission: ₦${commission/100}).`
  );

  // Automated email notifications to parent and teacher
  try {
    const parentUser = await db.findOne('users', u => u.uid === session.parentId);
    if (parentUser && parentUser.email) {
      sendTransactionalEmail(parentUser.email, "EduVista: Tutoring Session Completed Summary", "session_completed", {
        teacherName: session.teacherName
      });
    }

    const teacherUser = await db.findOne('users', u => u.uid === session.teacherId);
    if (teacherUser && teacherUser.email) {
      sendTransactionalEmail(teacherUser.email, "EduVista: Escrow Funds Released", "escrow_released", {
        formattedPayout: `₦${payout/100}`,
        formattedCommission: `₦${commission/100}`
      });
    }
  } catch (err) {
    console.error("Failed to send session ended transactional emails:", err);
  }

  // Add payout log to transactions
  await db.insert('transactions', {
    amount: session.cost,
    amountMinorUnits: session.cost,
    currency: "NGN",
    commission,
    status: "settled",
    fromUserId: session.parentId,
    toUserId: session.teacherId,
    sessionId: session.id,
    paymentProcessor: "payout",
    payoutStatus: "completed"
  });

  // 4. Submit review if rating is supplied
  if (rating) {
    await db.insert('reviews', {
      sessionId,
      parentId: session.parentId,
      teacherId: session.teacherId,
      overallRating: rating,
      dimensions: { Punctuality: rating, Quality: rating, Communication: rating, Preparedness: rating, Impact: rating },
      comment: comment ? sanitizeText(comment) : "Session completed successfully.",
      createdAt: new Date().toISOString()
    });

    // Update teacher reviews stats
    const teacher = await db.findOne('teachers', t => t.uid === session.teacherId);
    if (teacher) {
      const allReviews = await db.find('reviews', r => r.teacherId === session.teacherId);
      const avg = allReviews.reduce((sum, r) => sum + r.overallRating, 0) / allReviews.length;
      await db.update('teachers', teacher.id, {
        reviewsCount: allReviews.length,
        rating: parseFloat(avg.toFixed(1))
      });
    }
  }

  res.json({
    status: "Success",
    payoutAmount: payout,
    commissionAmount: commission
  });
});

// --- PAYOUT ENDPOINTS ---

// POST Request Payout (Teacher & Admin)
router.post('/payout/request', authenticateToken, requireRole(['Teacher', 'Admin']), async (req, res) => {
  const { amount, payoutMethod, bankDetails } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Valid amount is required." });
  }

  const wallet = await db.findOne('wallets', w => w.uid === req.user.uid);
  if (!wallet || wallet.balance < amount) {
    return res.status(400).json({ error: "Insufficient wallet balance." });
  }

  // Deduct from wallet balance to prevent double requests
  const newBal = Number(wallet.balance) - Number(amount);
  await db.update('wallets', wallet.id, { balance: newBal });

  const payoutReq = await db.insert('payout_requests', {
    teacherId: req.user.uid,
    amount: Number(amount),
    payoutMethod: payoutMethod || 'Wise Bank Direct',
    bankDetails: bankDetails || null,
    status: 'pending',
    requestedAt: new Date().toISOString()
  });

  // Notify admins
  const admins = await db.find('users', u => u.role === 'Admin');
  for (const admin of admins) {
    await createNotification(
      admin.uid,
      'system',
      'Payout Request',
      `${req.user.role === 'Admin' ? 'Admin' : 'Teacher'} ${req.user.displayName || req.user.uid} requested a payout of ₦${amount/100} via ${payoutMethod || 'Wise Bank Direct'}.`
    );
  }

  res.json({ success: true, payoutRequest: payoutReq, newBalance: newBal });
});

// GET Admin Wallet Balance
router.get('/admin/wallet', authenticateToken, requireRole(['Admin']), async (req, res) => {
  let wallet = await db.findOne('wallets', w => w.uid === req.user.uid);
  if (!wallet) {
    wallet = await db.insert('wallets', {
      uid: req.user.uid,
      balance: 0,
      escrow: 0
    });
  }
  res.json({
    walletBalance: wallet.balance,
    escrowBalance: wallet.escrow
  });
});

// GET Payout Requests (Admin)
router.get('/admin/payouts', authenticateToken, requireRole(['Admin']), async (req, res) => {
  const payouts = await db.find('payout_requests');
  // Enhance with teacher / admin user info
  const enhanced = await Promise.all(payouts.map(async p => {
    const t = await db.findOne('teachers', t => t.uid === p.teacherId) || {};
    const u = await db.findOne('users', u => u.uid === p.teacherId) || {};
    return { ...p, teacherName: u.displayName || t.name || p.teacherId };
  }));
  enhanced.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  res.json(enhanced);
});

// POST Approve/Reject Payout (Admin)
router.post('/admin/payouts/:id/respond', authenticateToken, requireRole(['Admin']), async (req, res) => {
  const { action } = req.body;
  const payoutReq = await db.findOne('payout_requests', p => p.id === req.params.id);
  
  if (!payoutReq || payoutReq.status !== 'pending') {
    return res.status(400).json({ error: "Invalid or already processed payout request." });
  }

  if (action === 'approve') {
    const bankDetails = payoutReq.bankDetails;
    if (bankDetails && bankDetails.accountNumber && bankDetails.bankCode) {
      try {
        const transferResult = await executePaystackTransfer(payoutReq.amount, {
          name: bankDetails.accountName || 'EduVista Partner',
          accountNumber: bankDetails.accountNumber,
          bankCode: bankDetails.bankCode,
          bankName: bankDetails.bankName
        });
        await db.update('payout_requests', payoutReq.id, { 
          status: 'approved', 
          processedAt: new Date().toISOString(),
          transferReference: transferResult.reference || 'simulated',
          transferStatus: transferResult.status || 'success'
        });
      } catch (transferErr) {
        console.error("[PAYOUT] Paystack Transfer failed:", transferErr.message);
        const wallet = await db.findOne('wallets', w => w.uid === payoutReq.teacherId);
        if (wallet) {
          await db.update('wallets', wallet.id, { balance: Number(wallet.balance) + payoutReq.amount });
        }
        await db.update('payout_requests', payoutReq.id, {
          status: 'failed',
          errorDetails: transferErr.message,
          processedAt: new Date().toISOString()
        });
        return res.status(500).json({ error: `Transfer failed: ${transferErr.message}. Funds refunded to tutor wallet.` });
      }
    } else {
      await db.update('payout_requests', payoutReq.id, { status: 'approved', processedAt: new Date().toISOString() });
    }

    await createNotification(payoutReq.teacherId, 'payout_approved', 'Payout Approved', `Your payout of ₦${payoutReq.amount/100} has been processed and sent to your bank account.`);

    try {
      const teacherUser = await db.findOne('users', u => u.uid === payoutReq.teacherId);
      if (teacherUser && teacherUser.email) {
        sendTransactionalEmail(teacherUser.email, "EduVista: Payout Request Approved", "payout_approved", {
          formattedAmount: `₦${payoutReq.amount/100}`
        });
      }
    } catch (err) {
      console.error("Failed to send payout approved email:", err);
    }
  } else if (action === 'reject') {
    await db.update('payout_requests', payoutReq.id, { status: 'rejected', processedAt: new Date().toISOString() });
    
    // Refund to wallet
    const wallet = await db.findOne('wallets', w => w.uid === payoutReq.teacherId);
    if (wallet) {
      await db.update('wallets', wallet.id, { balance: wallet.balance + payoutReq.amount });
    }
    await createNotification(payoutReq.teacherId, 'payout_rejected', 'Payout Rejected', `Your payout of ₦${payoutReq.amount/100} was rejected and refunded to your wallet.`);

    try {
      const teacherUser = await db.findOne('users', u => u.uid === payoutReq.teacherId);
      if (teacherUser && teacherUser.email) {
        sendTransactionalEmail(teacherUser.email, "EduVista: Payout Request Declined", "payout_rejected", {
          formattedAmount: `₦${payoutReq.amount/100}`,
          reason: "Administrative verification check required."
        });
      }
    } catch (err) {
      console.error("Failed to send payout rejected email:", err);
    }
  } else {
    return res.status(400).json({ error: "Action must be approve or reject." });
  }

  res.json({ success: true, status: action === 'approve' ? 'approved' : 'rejected' });
});

export default router;
