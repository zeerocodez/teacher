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

// POST Approve or Reject teacher application (Admin trigger)
router.post('/applications/respond', authenticateToken, requireRole(['Admin']), async (req, res) => {
  const { teacherUid, action } = req.body;
  if (!teacherUid || !action) {
    return res.status(400).json({ error: "Teacher UID and action are required." });
  }

  const teacher = await db.findOne('teachers', t => t.uid === teacherUid);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher profile not found." });
  }

  const status = action === "Approve" ? "verified" : "rejected";
  const verifiedStatus = action === "Approve";

  const updated = await db.update('teachers', teacher.id, {
    status,
    verified: verifiedStatus
  });

  // Also update user verification state in users database collection
  const user = await db.findOne('users', u => u.uid === teacherUid);
  if (user) {
    await db.update('users', user.id, {
      status: action === "Approve" ? "active" : "suspended"
    });
  }

  // Notify teacher of the application outcome
  await createNotification(
    teacherUid,
    "application_response",
    action === "Approve" ? "Application Approved!" : "Application Rejected",
    action === "Approve"
      ? "Welcome to EduVista! Your teacher onboarding profile is approved and live."
      : "Your onboarding application was declined. Please verify your credentials and submit again."
  );

  // Send email to teacher
  if (user && user.email) {
    const subject = action === "Approve" ? "Teacher Application Approved!" : "Teacher Application Update";
    const message = action === "Approve"
      ? `Hello ${teacher.name},\n\nCongratulations! Your teacher onboarding application has been approved. You are now live on the EduBridge platform and can start accepting students.`
      : `Hello ${teacher.name},\n\nUnfortunately, your teacher application was declined at this time. Please verify your credentials and submit again or contact support for more details.`;
      
    sendTransactionalEmail(user.email, subject, "alert", { message });
  }

  res.json(updated);
});

export default router;
