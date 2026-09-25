import express from 'express';
import { db } from '../db.js';
import { sanitizeText, createNotification } from '../utils.js';
import { authenticateToken, requireRole, requireOwnerOrAdmin } from '../middleware/auth.js';
import { sendTransactionalEmail } from '../services/email.js';

const router = express.Router();

// GET vetted teachers list with filter supports (6 per page, rotated/shuffled among verified)
router.get('/', async (req, res) => {
    const { subject, curriculum, rateMax, location, search, page = 1, limit = 6 } = req.query;
    
    let teachers = await db.find('teachers');
    
    // Only verified educators who are active
    teachers = teachers.filter(t => (t.verified === true || t.status === 'verified') && t.status !== 'suspended' && t.status !== 'rejected');
    
    if (subject && subject !== 'All') {
      const sLower = subject.toLowerCase().trim();
      teachers = teachers.filter(t => 
        t.subjects && Array.isArray(t.subjects) && t.subjects.some(s => {
          if (!s) return false;
          const str = String(s).toLowerCase().trim();
          return str === sLower || str.includes(sLower) || sLower.includes(str);
        })
      );
    }
    if (curriculum && curriculum !== 'All') {
      const cLower = curriculum.toLowerCase().trim();
      teachers = teachers.filter(t => 
        t.curricula && Array.isArray(t.curricula) && t.curricula.some(c => {
          if (!c) return false;
          const str = String(c).toLowerCase().trim();
          return str === cLower || str.includes(cLower) || cLower.includes(str);
        })
      );
    }
    if (rateMax) {
      const maxVal = parseInt(rateMax, 10);
      teachers = teachers.filter(t => t.rate <= maxVal);
    }
    if (location) {
      teachers = teachers.filter(t => t.location && t.location.toLowerCase().includes(location.toLowerCase().trim()));
    }
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      teachers = teachers.filter(t => 
        (t.name && t.name.toLowerCase().includes(q)) || 
        (t.bio && t.bio.toLowerCase().includes(q)) ||
        (t.location && t.location.toLowerCase().includes(q)) ||
        (t.subjects && Array.isArray(t.subjects) && t.subjects.some(s => s && String(s).toLowerCase().includes(q))) ||
        (t.curricula && Array.isArray(t.curricula) && t.curricula.some(c => c && String(c).toLowerCase().includes(q)))
      );
    }
    
    // Rotate / sort logic: prioritize Elite verified teachers, and shuffle/rotate within tiers
    teachers.sort((a, b) => {
      const aElite = (a.badges || []).includes('badge-ai-cert');
      const bElite = (b.badges || []).includes('badge-ai-cert');
      if (aElite && !bElite) return -1;
      if (!aElite && bElite) return 1;
      // Randomize / rotate order
      return Math.random() - 0.5;
    });
    
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;
    
    const paginatedTeachers = teachers.slice(startIndex, endIndex);
    
    res.json({
      data: paginatedTeachers,
      pagination: {
        total: teachers.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(teachers.length / limitNum)
      }
    });
});

// GET single teacher public profile
router.get('/:uid', async (req, res) => {
  const { uid } = req.params;
  const teacher = await db.findOne('teachers', t => t.uid === uid || t.id === uid);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher profile not found." });
  }
  res.json(teacher);
});

// POST optimize bio using Gemini AI
router.post('/optimize-bio', authenticateToken, requireRole(['Teacher']), async (req, res) => {
  const { bio } = req.body;
  if (!bio) {
    return res.status(400).json({ error: "Bio content is required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const optimized = `[AI Optimized] Elite Pedagogical Instructor:\n\n${bio}\n\nKey Strengths:\n• Active, student-centric focus mapped to WAEC standards.\n• Emphasizes speed calculations & algebraic logic.\n• Expert in WAEC exam strategies.`;
    return res.json({ optimized });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert profile copywriter for a premium teacher marketplace. Revise and optimize the following teacher bio to sound highly professional, engaging, and trust-building for parents. Keep it under 150 words.\n\nOriginal Bio:\n${bio}`
          }]
        }]
      })
    });

    const data = await response.json();
    const optimized = data.candidates?.[0]?.content?.parts?.[0]?.text || bio;
    res.json({ optimized });
  } catch (err) {
    console.error("Gemini bio optimization error:", err);
    res.status(500).json({ error: "Failed to optimize bio with AI." });
  }
});

// POST Update teacher profile (builder)
router.post('/profile', authenticateToken, requireRole(['Teacher']), requireOwnerOrAdmin, async (req, res) => {
  const { uid, name, username: requestedUsername, location, rate, subjects, curricula, languages, bio, avatar, coverImage, govIdUrl, degreeUrl, cvUrl, videoUrl, currency, timezone, classroomLink, recordingTool, subjectProficiencies, whatsapp, linkedin } = req.body;
  const teacher = await db.findOne('teachers', t => t.uid === uid);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher profile not found." });
  }

  let finalUsername = teacher.username;
  if (requestedUsername && requestedUsername !== teacher.username) {
    const cleanUsername = requestedUsername.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/(^-|-$)/g, '');
    if (cleanUsername.length >= 3) {
      const existing = await db.findOne('teachers', t => t.username === cleanUsername && t.uid !== uid);
      if (!existing) {
        finalUsername = cleanUsername;
      }
    }
  }

  const updatedFields = {
    name: name ? sanitizeText(name) : teacher.name,
    username: finalUsername,
    location: location ? sanitizeText(location) : teacher.location,
    rate: rate ? parseInt(rate, 10) : teacher.rate,
    subjects: subjects !== undefined ? subjects : teacher.subjects,
    curricula: curricula !== undefined ? curricula : teacher.curricula,
    languages: languages !== undefined ? languages : teacher.languages,
    bio: bio !== undefined ? sanitizeText(bio) : teacher.bio,
    avatar: avatar || teacher.avatar,
    coverImage: coverImage !== undefined ? sanitizeText(coverImage) : teacher.coverImage,
    currency: currency ? sanitizeText(currency) : teacher.currency || "NGN",
    timezone: timezone ? sanitizeText(timezone) : teacher.timezone || "Africa/Lagos",
    classroomLink: classroomLink !== undefined ? sanitizeText(classroomLink) : teacher.classroomLink,
    recordingTool: recordingTool !== undefined ? sanitizeText(recordingTool) : teacher.recordingTool,
    subjectProficiencies: subjectProficiencies !== undefined ? subjectProficiencies : teacher.subjectProficiencies,
    whatsapp: whatsapp !== undefined ? sanitizeText(whatsapp) : teacher.whatsapp,
    linkedin: linkedin !== undefined ? sanitizeText(linkedin) : teacher.linkedin,
  };

  if (govIdUrl !== undefined) updatedFields.govIdUrl = sanitizeText(govIdUrl);
  if (degreeUrl !== undefined) updatedFields.degreeUrl = sanitizeText(degreeUrl);
  if (cvUrl !== undefined) updatedFields.cvUrl = sanitizeText(cvUrl);
  if (videoUrl !== undefined) updatedFields.videoUrl = sanitizeText(videoUrl);

  const updated = await db.update('teachers', teacher.id, updatedFields);

  res.json(updated);
});

// POST onboarding submissions (Teacher Onboarding)
router.post('/onboard', authenticateToken, requireRole(['Teacher']), requireOwnerOrAdmin, async (req, res) => {
  const { uid, name, username: requestedUsername, location, whatsapp, linkedin, currency, rate, timezone, classroomLink, recordingTool, bio, subjects, curricula, languages, availability, videoUrl, avatar, coverImage, govIdUrl, degreeUrl, cvUrl, subjectProficiencies } = req.body;
  if (!uid || !name) {
    return res.status(400).json({ error: "Teacher UID and Display Name are required." });
  }

  const teacher = await db.findOne('teachers', t => t.uid === uid);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher profile not found." });
  }

  // Handle username selection
  let finalUsername = "";
  if (requestedUsername) {
    const cleanUsername = requestedUsername.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/(^-|-$)/g, '');
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters long." });
    }
    const existing = await db.findOne('teachers', t => t.username === cleanUsername && t.uid !== uid);
    if (existing) {
      return res.status(400).json({ error: "This username is already taken. Please choose another." });
    }
    finalUsername = cleanUsername;
  } else {
    // Generate unique username based on lowercased name if not provided (fallback)
    let baseUsername = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    finalUsername = baseUsername;
    let counter = 1;
    while (await db.findOne('teachers', t => t.username === finalUsername && t.uid !== uid)) {
      finalUsername = `${baseUsername}-${counter}`;
      counter++;
    }
  }

  const updated = await db.update('teachers', teacher.id, {
    name: sanitizeText(name),
    username: finalUsername,
    location: location ? sanitizeText(location) : "Nigeria",
    whatsapp: whatsapp ? sanitizeText(whatsapp) : "",
    linkedin: linkedin ? sanitizeText(linkedin) : "",
    currency: currency ? sanitizeText(currency) : "NGN",
    timezone: timezone ? sanitizeText(timezone) : "Africa/Lagos",
    classroomLink: classroomLink ? sanitizeText(classroomLink) : "",
    recordingTool: recordingTool ? sanitizeText(recordingTool) : "",
    rate: rate ? parseInt(rate, 10) : 0,
    bio: bio ? sanitizeText(bio) : "",
    subjects: subjects || [],
    curricula: curricula || [],
    languages: languages || [],
    availability: availability || {},
    videoUrl: videoUrl || "",
    avatar: avatar || teacher.avatar,
    coverImage: coverImage ? sanitizeText(coverImage) : (teacher.coverImage || ""),
    subjectProficiencies: subjectProficiencies || teacher.subjectProficiencies || {},
    govIdUrl: govIdUrl ? sanitizeText(govIdUrl) : "",
    degreeUrl: degreeUrl ? sanitizeText(degreeUrl) : "",
    cvUrl: cvUrl ? sanitizeText(cvUrl) : "",
    status: "active",
    verified: true
  });

  // Notify Admins of the new registration
  const adminUsers = await db.find('users', u => u.role === 'Admin');
  for (const admin of adminUsers) {
    await createNotification(admin.uid, 'system', 'New Teacher Application', `${sanitizeText(name)} has submitted a new teacher application.`);
    sendTransactionalEmail(admin.email, "New Teacher Registration", "alert", {
      message: `A new teacher, ${sanitizeText(name)}, has completed onboarding and is pending approval. Please review their profile.`
    });
  }

  // Notify Teacher of pending verification
  const teacherUser = await db.findOne('users', u => u.uid === uid);
  if (teacherUser && teacherUser.email) {
    sendTransactionalEmail(teacherUser.email, "Application Received - Pending Verification", "alert", {
      message: `Hello ${sanitizeText(name)},\n\nYour teacher application has been successfully submitted and is currently pending verification on the EduVistar platform. Please keep an eye on your email for updates regarding your approval status.`
    });
  }

  res.json(updated);
});

// GET teacher by SEO-friendly username
router.get('/by-username/:username', async (req, res) => {
  const { username } = req.params;
  // Search strategy:
  // 1. Case-insensitive search for custom username
  // 2. Case-sensitive search for UID or ID (Firestore document IDs are case-sensitive)
  const teacher = await db.findOne('teachers', t => 
    (t.username && t.username.toLowerCase() === username.toLowerCase()) ||
    (t.uid === username) ||
    (String(t.id) === username)
  );
  if (!teacher) {
    return res.status(404).json({ error: "Teacher profile not found." });
  }
  res.json(teacher);
});

// GET Teacher dashboard data
router.get('/dashboard/:uid', authenticateToken, async (req, res) => {
  const { uid } = req.params;

  // Authorization check: User must be Admin or the Teacher themselves
  if (req.user.role !== 'Admin' && req.user.uid !== uid) {
    return res.status(403).json({ error: "Access forbidden. You do not have permission to view this dashboard." });
  }

  const teacher = await db.findOne('teachers', t => t.uid === uid);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher dashboard not found." });
  }

  const teacherSessions = await db.find('sessions', s => s.teacherId === uid);
  const teacherAssignments = await db.find('assignments', a => a.teacherId === uid || (a.teacherName === teacher.name && teacher.name));

  const wallet = await db.findOne('wallets', w => w.uid === uid) || { balance: 0, escrow: 0 };
  const teacherTransactions = await db.find('transactions', t => t.toUserId === uid);

  // Compute dynamic stats
  const completedSessions = teacherSessions.filter(s => s.status === 'Completed');
  const activeEscrowSessions = teacherSessions.filter(s => s.status === 'Scheduled' || s.status === 'Pending Confirmation');
  
  const config = await db.findOne('platform_config', c => c.id === 'default') || { commissionRate: 15 };
  const commissionRate = config.commissionRate || 15;

  const earnedThisMonth = completedSessions.reduce((sum, s) => sum + (s.cost - Math.round(s.cost * (commissionRate / 100))), 0);
  const escrowBalance = activeEscrowSessions.reduce((sum, s) => sum + (s.cost - Math.round(s.cost * (commissionRate / 100))), 0);
  const paidOutToDate = completedSessions.reduce((sum, s) => sum + (s.cost - Math.round(s.cost * (commissionRate / 100))), 0);
  const commission = completedSessions.reduce((sum, s) => sum + Math.round(s.cost * (commissionRate / 100)), 0);

  res.json({
    teacher,
    walletBalance: wallet.balance,
    escrowBalance,
    earnedThisMonth,
    paidOutToDate,
    commission,
    sessionsCount: completedSessions.length + activeEscrowSessions.length,
    sessions: teacherSessions,
    assignments: teacherAssignments,
    transactions: teacherTransactions
  });
});

export default router;
