import { db } from '../db.js';
import { createNotification } from '../utils.js';
import { sendTransactionalEmail } from './email.js';

const APP_URL = (process.env.CLIENT_ORIGIN || process.env.APP_URL || 'https://www.eduvistar.com').replace(/\/$/, '');

/**
 * Generate a pre-composed direct WhatsApp URL for parent or teacher
 * @param {string} phone - Target phone number (international format e.g. 2348012345678)
 * @param {object} session - Session details
 * @param {string} recipientRole - 'parent' | 'teacher'
 */
export function generateWhatsAppReminderUrl({ phone, session, recipientRole = 'parent' }) {
  if (!phone) return null;
  // Clean phone number (strip +, spaces, hyphens)
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return null;

  const dateStr = session.slot?.day || session.date || 'Today';
  const timeStr = session.slot?.time || session.time || 'Upcoming';
  const subjectStr = session.subject || 'Tutoring Class';
  const studentStr = session.studentName || 'Student';
  const teacherStr = session.teacherName || 'Educator';
  const classroomUrl = `${APP_URL}/classroom?session=${session.id || session.uid || ''}`;

  let message = '';
  if (recipientRole === 'parent') {
    message = `👋 *EduVistar Class Reminder*\n\nHello! This is a friendly reminder that *${studentStr}*'s upcoming *${subjectStr}* live lesson with *${teacherStr}* is scheduled for:\n📅 *${dateStr} at ${timeStr}*\n\n🔗 *Join Classroom Link:* ${classroomUrl}\n\nPlease ensure your device camera and microphone are ready 5 minutes before class. Thank you!`;
  } else {
    message = `👋 *EduVistar Tutor Reminder*\n\nHello *${teacherStr}*! Your scheduled live tutoring session with student *${studentStr}* for *${subjectStr}* starts at:\n📅 *${dateStr} at ${timeStr}*\n\n🔗 *Live Classroom:* ${classroomUrl}\n\nPlease enter the room on time. Happy teaching!`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Dispatches an automated or manual session reminder via Email and In-App notification
 * @param {object} params
 * @param {string} params.sessionId
 * @param {string} params.type - 'instant' | '24h' | '1h'
 * @param {string} params.senderUid
 */
export async function dispatchSessionReminder({ sessionId, type = 'instant', senderUid = null }) {
  const session = await db.findOne('sessions', s => s.id === sessionId || s.uid === sessionId);
  if (!session) {
    throw new Error("Session not found.");
  }

  const teacher = await db.findOne('teachers', t => t.uid === session.teacherId || t.id === session.teacherId);
  const parent = await db.findOne('users', u => u.uid === session.parentId || u.id === session.parentId);

  const studentName = session.studentName || "Student";
  const subject = session.subject || "Tutoring Session";
  const dateStr = session.slot?.day || session.date || "Upcoming";
  const timeStr = session.slot?.time || session.time || "Scheduled Time";
  const classroomUrl = `${APP_URL}/classroom?session=${session.id}`;

  const results = {
    emailSent: false,
    parentNotified: false,
    teacherNotified: false,
    whatsAppParentUrl: null,
    whatsAppTeacherUrl: null
  };

  // 1. Generate direct WhatsApp links
  if (parent?.phone || session.parentPhone) {
    results.whatsAppParentUrl = generateWhatsAppReminderUrl({
      phone: parent?.phone || session.parentPhone,
      session,
      recipientRole: 'parent'
    });
  }

  if (teacher?.whatsapp || teacher?.phone) {
    results.whatsAppTeacherUrl = generateWhatsAppReminderUrl({
      phone: teacher?.whatsapp || teacher?.phone,
      session,
      recipientRole: 'teacher'
    });
  }

  // 2. Dispatch In-App Notifications
  if (session.parentId) {
    await createNotification(
      session.parentId,
      `⏰ Live Class Reminder: ${subject}`,
      `Upcoming class for ${studentName} with ${session.teacherName} on ${dateStr} at ${timeStr}. Click to enter classroom.`,
      "reminder"
    );
    results.parentNotified = true;
  }

  if (session.teacherId) {
    await createNotification(
      session.teacherId,
      `⏰ Scheduled Class Reminder: ${studentName}`,
      `Your live session for ${subject} with ${studentName} is scheduled on ${dateStr} at ${timeStr}.`,
      "reminder"
    );
    results.teacherNotified = true;
  }

  // 3. Dispatch Email Notification to Parent
  const parentEmail = parent?.email || session.parentEmail;
  if (parentEmail) {
    try {
      await sendTransactionalEmail({
        to: parentEmail,
        subject: `⏰ Live Class Reminder: ${studentName}'s ${subject} on ${dateStr} at ${timeStr}`,
        body: `Hello ${parent?.displayName || 'Parent'},\n\nThis is a scheduled reminder for ${studentName}'s upcoming live tutoring session on EduVistar.\n\nSession Details:\n- Subject: ${subject}\n- Tutor: ${session.teacherName}\n- Date & Time: ${dateStr} at ${timeStr}\n- Classroom Link: ${classroomUrl}\n\nPlease join 5 minutes before class starts. Ensure your child has a quiet workspace and working audio/video.\n\nBest regards,\nEduVistar Africa Team`
      });
      results.emailSent = true;
    } catch (e) {
      console.warn("Session reminder email dispatch error:", e);
    }
  }

  // Log reminder on session record
  await db.update('sessions', session.id, {
    lastReminderSentAt: new Date().toISOString(),
    reminderType: type,
    reminderSentBy: senderUid || 'system'
  });

  return results;
}
