import express from 'express';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { dispatchSessionReminder, generateWhatsAppReminderUrl } from '../services/reminders.js';

const router = express.Router();

/**
 * GET /api/reminders/session/:sessionId/whatsapp-link
 * Get WhatsApp direct notification deep link for parent and tutor
 */
router.get('/session/:sessionId/whatsapp-link', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await db.findOne('sessions', s => s.id === sessionId || s.uid === sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    // Permission check: only admin, session teacher, or session parent can view reminder links
    const isTeacher = session.teacherId === req.user.uid;
    const isParent = session.parentId === req.user.uid;
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'admin';

    if (!isTeacher && !isParent && !isAdmin) {
      return res.status(403).json({ error: "Unauthorized to access reminder links for this session." });
    }

    const teacher = await db.findOne('teachers', t => t.uid === session.teacherId || t.id === session.teacherId);
    const parent = await db.findOne('users', u => u.uid === session.parentId || u.id === session.parentId);

    const parentPhone = parent?.phone || session.parentPhone;
    const teacherPhone = teacher?.whatsapp || teacher?.phone;

    const parentWhatsAppUrl = parentPhone
      ? generateWhatsAppReminderUrl({ phone: parentPhone, session, recipientRole: 'parent' })
      : null;

    const teacherWhatsAppUrl = teacherPhone
      ? generateWhatsAppReminderUrl({ phone: teacherPhone, session, recipientRole: 'teacher' })
      : null;

    return res.json({
      success: true,
      sessionId,
      parentWhatsAppUrl,
      teacherWhatsAppUrl,
      parentPhone: parentPhone ? `***${parentPhone.slice(-4)}` : null,
      teacherPhone: teacherPhone ? `***${teacherPhone.slice(-4)}` : null
    });
  } catch (error) {
    console.error("Fetch WhatsApp link error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate WhatsApp link." });
  }
});

/**
 * POST /api/reminders/session/:sessionId/send
 * Dispatches instant email and in-app reminder to parent & tutor
 */
router.post('/session/:sessionId/send', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { type = 'instant' } = req.body;

    const session = await db.findOne('sessions', s => s.id === sessionId || s.uid === sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    // Permission check: only admin, session teacher, or session parent can trigger
    const isTeacher = session.teacherId === req.user.uid;
    const isParent = session.parentId === req.user.uid;
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'admin';

    if (!isTeacher && !isParent && !isAdmin) {
      return res.status(403).json({ error: "Unauthorized to send reminders for this session." });
    }

    const dispatchResult = await dispatchSessionReminder({
      sessionId,
      type,
      senderUid: req.user.uid
    });

    return res.json({
      success: true,
      message: "Reminder dispatched successfully.",
      ...dispatchResult
    });
  } catch (error) {
    console.error("Dispatch reminder error:", error);
    return res.status(500).json({ error: error.message || "Failed to dispatch reminder." });
  }
});

export default router;
