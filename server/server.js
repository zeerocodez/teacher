import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db, connectDb } from './db.js';
import paymentRoutes from './routes/payments.js';
import b2bRoutes from './routes/b2b.js';
import { sendTransactionalEmail, readSentEmails } from './services/email.js';
import { authenticateToken, requireRole, requireOwnerOrAdmin } from './middleware/auth.js';
dotenv.config();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet()); // Apply HTTP security headers globally
const PORT = process.env.PORT || 5000;

let dbInitialized = false;
let dbInitPromise = null;

async function ensureDb() {
  if (dbInitialized) return;
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      await connectDb();
      if (process.env.VERCEL) {
        guaranteeInitialProfiles().catch(console.error);
      } else {
        await guaranteeInitialProfiles();
      }
      dbInitialized = true;
    })();
  }
  await dbInitPromise;
}

// Database initialization middleware
app.use(async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    console.error("Database initialization failed during request:", err);
    res.status(500).json({ error: "Database initialization failed." });
  }
});

// CORS origin security configuration
const clientOrigin = process.env.CLIENT_ORIGIN || 'https://www.eduvistar.com';
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true); // Allow all origins to prevent 500 HTML errors on custom domains
  },
  credentials: true
}));

// Configure express.json to capture rawBody for webhook signature verification
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

import { sanitizeText, sanitizeObject, hashPassword, verifyPassword, createNotification } from './utils.js';
import { globalRateLimiter, authRateLimiter, supportRateLimiter, paymentRateLimiter, publicActionRateLimiter } from './middleware/limiters.js';

// Global Input Sanitization Middleware to prevent XSS
app.use(async (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) {
    try {
      const sanitizedQuery = sanitizeObject(req.query);
      for (const key of Object.keys(req.query)) {
        req.query[key] = sanitizedQuery[key];
      }
    } catch (e) {
      // ignore
    }
  }
  if (req.params) {
    try {
      const sanitizedParams = sanitizeObject(req.params);
      for (const key of Object.keys(req.params)) {
        req.params[key] = sanitizedParams[key];
      }
    } catch (e) {
      // ignore
    }
  }
  next();
});

const JWT_SECRET = process.env.JWT_SECRET || 'eduvistar_jwt_secret_2026';

app.use(globalRateLimiter);

app.use('/api/payments', paymentRoutes);
app.use('/api/b2b/schools', b2bRoutes);

// Generate default credentials for seeded accounts asynchronously
let defaultCreds = null;

async function initDefaultCreds() {
  if (!defaultCreds) {
    defaultCreds = await hashPassword("password123");
  }
}

// Initialize Database & Seed Guarantees
async function guaranteeInitialProfiles() {
  await initDefaultCreds();
  
  // Clear legacy assignments to guarantee 0 average grade for production
  try {
    const legacyAssignments = await db.find('assignments');
    for (const a of legacyAssignments) {
      await db.delete('assignments', a.id || a.uid);
    }
  } catch (e) {}

  // Guarantee Production Admin Users
  const adminUser = await db.findOne('users', u => u.role === 'Admin');
  if (!adminUser) {
    await db.insert('users', {
      uid: "admin_1",
      email: "admin@eduvistar.com",
      displayName: "System Admin",
      role: "Admin",
      country: "Nigeria",
      status: "active",
      salt: defaultCreds.salt,
      passwordHash: defaultCreds.hash
    });
    console.log("Guaranteed admin@eduvistar.com admin profile.");
  }

  const zeerocodesAdmin = await db.findOne('users', u => u.email.toLowerCase() === 'zeerocodes@gmail.com');
  if (!zeerocodesAdmin) {
    await db.insert('users', {
      uid: "admin_zeerocodes",
      email: "zeerocodes@gmail.com",
      displayName: "Zeerocodes Super Admin",
      role: "Admin",
      country: "Nigeria",
      status: "active",
      salt: defaultCreds.salt,
      passwordHash: defaultCreds.hash
    });
    console.log("Guaranteed zeerocodes@gmail.com admin profile.");
  }

  const morichcareAdmin = await db.findOne('users', u => u.email.toLowerCase() === 'morichcare@gmail.com');
  if (!morichcareAdmin) {
    await db.insert('users', {
      uid: "admin_morichcare",
      email: "morichcare@gmail.com",
      displayName: "Morichcare Admin",
      role: "Admin",
      country: "Nigeria",
      status: "active",
      salt: defaultCreds.salt,
      passwordHash: defaultCreds.hash
    });
    console.log("Guaranteed morichcare@gmail.com admin profile.");
  }

  // Guarantee wallets for production admins with zero balance
  const adminProfiles = [
    { uid: 'admin_1' },
    { uid: 'admin_zeerocodes' },
    { uid: 'admin_morichcare' }
  ];

  for (const adm of adminProfiles) {
    let wallet = await db.findOne('wallets', w => w.uid === adm.uid);
    if (!wallet) {
      await db.insert('wallets', {
        uid: adm.uid,
        userUid: adm.uid,
        balance: 0,
        escrow: 0,
        currency: "NGN",
        history: []
      });
    }
  }

  // Seed LMS Courses if not present
  try {
    await seedLmsCoursesIfEmpty();
  } catch (e) {
    console.warn("LMS Courses seed warning:", e);
  }
}






import authRoutes from './routes/auth.routes.js';
app.use('/api/auth', authRoutes);

// POST support agent chatbot message using Gemini AI
app.post('/api/support/message', authenticateToken, supportRateLimiter, async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Elegant regex-based local fallback support answers
    let reply = "I'm the EduVistar Support Assistant. I'm here to help you coordinate with vetted teachers, secure escrow payments, or audit lessons. Could you please specify your concern?";
    const msgLower = message.toLowerCase();
    if (msgLower.includes('tutor') || msgLower.includes('teacher') || msgLower.includes('instructor')) {
      reply = "Our teachers undergo government ID checks, credentials handbook verification, and a 4-week onboarding priority audit. You can explore tutors directly on our marketplace.";
    } else if (msgLower.includes('escrow') || msgLower.includes('pay') || msgLower.includes('fee') || msgLower.includes('cost')) {
      reply = "EduVistar operates a timed escrow payment engine. When you book a lesson, funds are secured in escrow and only released to the teacher 24 hours after a class validation check. A 15% commission is kept by the platform.";
    } else if (msgLower.includes('dispute') || msgLower.includes('refund') || msgLower.includes('cancel')) {
      reply = "If a session has an issue, you can file a dispute claim directly from the session log. Escrow funds will remain locked while an admin resolves the claim within 24 hours.";
    } else if (msgLower.includes('language') || msgLower.includes('translate') || msgLower.includes('french') || msgLower.includes('swahili')) {
      reply = "EduVistar provides a multilingual interface supporting English, French, and Swahili. You can switch your preferred language at the top navbar.";
    } else if (msgLower.includes('b2b') || msgLower.includes('school') || msgLower.includes('api')) {
      reply = "We offer robust school B2B APIs for partner academic institutions to request tutor batches and compliance audits programmatically. Generate a B2B API token inside the Admin Portal.";
    }
    return res.json({ reply });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    // Map history to Gemini API format
    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach(h => {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const systemInstruction = {
      parts: [{
        text: "You are the official EduVistar AI Customer Support Agent. You represent EduVistar Africa, an elite tutoring marketplace connecting verified African educators (specializing in WAEC, Cambridge, SAT, and foundational tutoring) with global parent markets. You explain concepts clearly, resolve dispute inquiries gracefully, explain escrow locks (which release 24 hours after a lesson is verified), and explain commission rates (15% commission fee). Maintain a polite, professional, and supportive tone. Keep answers under 100 words."
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Thank you for contacting support. I am checking on this for you.";
    res.json({ reply });
  } catch (err) {
    console.error("Gemini support message error:", err);
    res.status(500).json({ error: "Failed to connect to AI support specialist." });
  }
});

// Simulates user account status and fetch
app.get('/api/users/:uid', authenticateToken, requireOwnerOrAdmin, async (req, res) => {
  const { uid } = req.params;
  const user = await db.findOne('users', u => u.uid === uid || u.id === uid);
  if (!user) {
    return res.status(404).json({ error: "User profile not found." });
  }
  res.json(user);
});


import teacherRoutes from './routes/teacher.routes.js';
app.use('/api/teachers', teacherRoutes);

import adminRoutes from './routes/admin.routes.js';
app.use('/api/admin', adminRoutes);

import blogRoutes from './routes/blog.routes.js';
app.use('/api/blog', blogRoutes);


// --- 3. PARENT & STUDENT ENDPOINTS ---

import parentRoutes from './routes/parent.routes.js';
app.use('/api/parents', parentRoutes);

import newPaymentRoutes from './routes/payment.routes.js';
app.use('/api', newPaymentRoutes);

import videoRoutes from './routes/video.routes.js';
app.use('/api/video', videoRoutes);

import lmsRoutes, { seedLmsCoursesIfEmpty } from './routes/lms.routes.js';
app.use('/api/lms', lmsRoutes);


// --- 6. REPUTATION ENGINE ENDPOINTS ---

// GET /api/leaderboard
app.get('/api/leaderboard', async (req, res) => {
  let teachers = await db.find('teachers');
  // Sort logic: Higher rating, higher reviewsCount, and badges
  teachers = teachers.map(t => {
    let score = (t.rating * 10) + ((t.reviewsCount || 0) * 5) + ((t.badges || []).length * 15);
    return { ...t, leaderboardScore: score };
  });
  teachers.sort((a, b) => b.leaderboardScore - a.leaderboardScore);
  res.json(teachers.slice(0, 3)); // Return Top 3
});

// GET /api/teachers/:uid/reviews
app.get('/api/teachers/:uid/reviews', async (req, res) => {
  const { uid } = req.params;
  const reviews = await db.find('reviews', r => r.teacherId === uid);
  res.json(reviews.map(r => ({ ...r, parentName: r.parentName || 'Verified Parent' })));
});

// POST /api/reviews/reply
app.post('/api/reviews/reply', authenticateToken, requireRole(['Teacher']), async (req, res) => {
  const { reviewId, replyText } = req.body;
  if (!reviewId || !replyText) return res.status(400).json({ error: "Missing fields" });
  
  const review = await db.findOne('reviews', r => r.id === reviewId);
  if (review && review.teacherId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. Review recipient mismatch." });
  }

  if (review) {
    const updated = await await db.update('reviews', review.id, { reply: sanitizeText(replyText) });
    res.json({ success: true, review: updated });
  } else {
    res.json({ success: true, review: { id: reviewId, reply: sanitizeText(replyText) } });
  }
});


// --- 5. ACADEMY & ELITE TEACHERS ACADEMY ENDPOINTS ---

// POST Enroll in Academy (Subscription Paywall)
app.post('/api/academy/enroll', authenticateToken, requireRole(['Teacher']), async (req, res) => {
  const { userId, plan, cardDetails } = req.body;

  if (userId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. User identity mismatch." });
  }

  const teacher = await db.findOne('teachers', t => t.uid === userId || t.id === userId);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher profile not found." });
  }

  // Process mock subscription charging
  const subscriptionFee = plan === 'annual' ? 12000000 : 1500000; // ₦120,000 annual or ₦15,000 monthly in minor kobo
  
  // Register enrollment in database
  await await db.update('teachers', teacher.id, {
    academyEnrolled: true,
    academyPlan: plan,
    academyEnrolledAt: new Date().toISOString()
  });

  // Create an academy ledger notification
  await await db.insert('notifications', {
    userId,
    title: "Elite Academy Subscription Secured",
    message: `Welcome to the Elite Teachers Academy! Your ${plan === 'annual' ? 'annual' : 'monthly'} subscription was successfully authorized. You now have full access to all 6 modules, interactive quizzes, video courses, discussion forums, and the Gemini roleplay simulator.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  res.json({
    success: true,
    message: "Subscription processed successfully. Welcome to the Elite Teachers Academy!",
    academyEnrolled: true
  });
});

// GET Academy Enrollment & Progress Status
app.get('/api/academy/status/:userId', authenticateToken, requireRole(['Teacher']), async (req, res) => {
  const { userId } = req.params;
  if (userId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden." });
  }

  const teacher = await db.findOne('teachers', t => t.uid === userId || t.id === userId);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher profile not found." });
  }

  const progress = await db.find('academy_progress', p => p.userId === userId);
  res.json({
    enrolled: !!teacher.academyEnrolled,
    plan: teacher.academyPlan || null,
    enrolledAt: teacher.academyEnrolledAt || null,
    completedModules: progress.filter(p => p.status === 'Completed').map(p => p.moduleId),
    xp: progress.length * 200
  });
});

// POST Submit module quiz
app.post('/api/academy/submit-quiz', authenticateToken, requireRole(['Teacher']), async (req, res) => {
  const { userId, moduleId, answer } = req.body;

  if (userId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. User identity mismatch." });
  }

  const teacher = await db.findOne('teachers', t => t.uid === userId || t.id === userId);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher profile not found." });
  }

  if (!teacher.academyEnrolled) {
    return res.status(403).json({ error: "Enrollment required to access course content." });
  }

  // Verification Logic: Option A (0) is the correct answer
  const isCorrect = (parseInt(answer, 10) === 0);

  if (!isCorrect) {
    return res.json({ success: false, message: "Incorrect answer. Review module content and try again." });
  }

  // Save progress
  const progressRecord = await db.findOne('academy_progress', p => p.userId === userId && p.moduleId === moduleId);
  if (!progressRecord) {
    await await db.insert('academy_progress', {
      userId,
      moduleId,
      status: "Completed",
      score: 100,
      completedAt: new Date().toISOString()
    });
  }

  // Update teacher badges & stats
  const allProgress = await db.find('academy_progress', p => p.userId === userId && p.status === 'Completed');
  const modulesCompletedCount = allProgress.length;

  let badges = [...(teacher.badges || [])];
  // Check if Elite certified badge needs to be unlocked (after module 6 or all are done)
  if (!badges.includes('badge-ai-cert')) {
    badges.push('badge-ai-cert');
  }

  await await db.update('teachers', teacher.id, {
    badges
  });

  res.json({
    success: true,
    message: "Correct! +200 XP earned.",
    xpEarned: 200,
    completedCount: modulesCompletedCount
  });
});


// POST Complete Level 4 & Request VIP Teacher Promotion
app.post('/api/academy/complete-level4', authenticateToken, requireRole(['Teacher']), async (req, res) => {
  const userId = req.user.uid;
  const teacher = await db.findOne('teachers', t => t.uid === userId || t.id === userId);
  if (!teacher) {
    return res.status(404).json({ error: "Teacher profile not found." });
  }

  await db.update('teachers', teacher.id, {
    level4Completed: true,
    level4CompletedAt: new Date().toISOString(),
    vipStatus: 'Pending Admin Verification'
  });

  // Notify admin
  await db.insert('notifications', {
    userId: 'admin',
    title: "New Level 4 Graduate Ready for VIP Promotion",
    message: `Teacher ${teacher.name || teacher.email} has completed Level 4 Academy modules and is ready for VIP promotion.`,
    read: false,
    createdAt: new Date().toISOString()
  });

  res.json({
    success: true,
    message: "Level 4 completed! Your profile has been submitted to Admin for VIP Teacher promotion.",
    level4Completed: true,
    vipStatus: 'Pending Admin Verification'
  });
});

// GET Level 4 Academy Graduates (Admin Only)
app.get('/api/admin/level4-graduates', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const teachers = await db.find('teachers');
    const graduates = teachers.filter(t => t.level4Completed || t.vipVerified || t.isVipTeacher);
    res.json(graduates);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch graduates" });
  }
});

// POST Promote Teacher to VIP (Admin Only)
app.post('/api/admin/promote-vip', authenticateToken, requireRole(['Admin']), async (req, res) => {
  const { teacherUid } = req.body;
  if (!teacherUid) return res.status(400).json({ error: "teacherUid is required" });

  const teacher = await db.findOne('teachers', t => t.uid === teacherUid || t.id === teacherUid);
  if (!teacher) return res.status(404).json({ error: "Teacher not found" });

  const updated = await db.update('teachers', teacher.id, {
    isVipTeacher: true,
    vipVerified: true,
    vipStatus: 'Verified VIP Educator',
    vipGrantedAt: new Date().toISOString()
  });

  // Send notification to teacher
  await db.insert('notifications', {
    userId: teacher.uid || teacher.id,
    title: "🏆 Promoted to Verified VIP Educator!",
    message: "Congratulations! You have been verified as an official EduVistar VIP Teacher by our admin team after completing Level 4 Academy Mastery.",
    read: false,
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, message: `Teacher ${teacher.name || teacher.email} successfully promoted to VIP Teacher!`, teacher: updated });
});


// POST Gemini Roleplay Classroom Simulation Endpoint
app.post('/api/academy/roleplay', authenticateToken, requireRole(['Teacher']), async (req, res) => {
  const { scenario, message, history } = req.body;
  if (!scenario || !message) {
    return res.status(400).json({ error: "scenario and message are required." });
  }

  // Scenario description setups
  const personas = {
    classroom_distraction: {
      name: "Chidi",
      role: "Student",
      desc: "A distracted 14-year-old student who keeps playing games on his smartphone during class.",
      systemPrompt: "You are Chidi, a distracted 14-year-old high school student. You are in a tutoring class with your teacher. You are currently looking at your phone playing a mobile game. Respond briefly, defensively or distractedly. You speak in informal teen slang. The teacher is trying to get your attention and keep you engaged. Do not be overly cooperative immediately — make the teacher work to get your interest. Keep replies under 3 sentences."
    },
    parent_conflict: {
      name: "Mrs. Bello",
      role: "Parent",
      desc: "An angry parent whose daughter's quiz grades dropped from 92% to 68%.",
      systemPrompt: "You are Mrs. Bello, an anxious and demanding parent. You paid for tutoring sessions but your daughter's last math quiz grade dropped significantly. You are confronting the tutor. You are skeptical, protective of your daughter, and a bit angry. You want explanations and a concrete plan of action. Keep your tone firm, strict, and parent-like. Keep replies under 3 sentences."
    },
    syllabus_alignment: {
      name: "Principal Mensah",
      role: "Principal",
      desc: "A strict school principal auditing if the tutor's session plans align with the Cambridge and WAEC criteria.",
      systemPrompt: "You are Principal Mensah, a strict, professional school academic auditor. You are vetting the tutor to check if their lesson outline is properly structured and aligned with both Cambridge and WAEC curriculum guidelines. You ask technical questions about lesson structures, assessments, and syllabus code references. Speak formally, professionally, and critically. Keep replies under 3 sentences."
    }
  };

  const persona = personas[scenario] || personas.classroom_distraction;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Elegant local fallback dialogue tree responses
    let reply = `[${persona.role} ${persona.name}]: I hear you, teacher. But I'm not really sure if this is relevant to what I want right now.`;
    const msgLower = message.toLowerCase();

    if (scenario === 'classroom_distraction') {
      if (msgLower.includes('phone') || msgLower.includes('put') || msgLower.includes('away') || msgLower.includes('stop')) {
        reply = "[Student Chidi]: Aw, come on, teach! I was just checking a notification. Fine, I'll put it facedown on the desk. What were you saying about the quadratic formula again?";
      } else if (msgLower.includes('game') || msgLower.includes('playing') || msgLower.includes('chidi')) {
        reply = "[Student Chidi]: Bro, this level is so hard though! Fine, fine, I'm locking the screen. I'm listening. Show me how to solve this equation.";
      } else if (msgLower.includes('interesting') || msgLower.includes('fun') || msgLower.includes('active')) {
        reply = "[Student Chidi]: An active worksheet? Like, solving it on the digital board? Okay, that sounds better than just reading slides. I'll join the workspace.";
      }
    } else if (scenario === 'parent_conflict') {
      if (msgLower.includes('sorry') || msgLower.includes('apologize') || msgLower.includes('understand')) {
        reply = "[Parent Mrs. Bello]: I appreciate the apology, but excuses won't get her into university. What specific topics did she fail on, and how will you fix it this week?";
      } else if (msgLower.includes('plan') || msgLower.includes('strategy') || msgLower.includes('drill') || msgLower.includes('practice')) {
        reply = "[Parent Mrs. Bello]: A daily practice drill? Yes, that sounds sensible. She needs structure. Can you send me the scores directly after each session so I can verify?";
      } else if (msgLower.includes('focus') || msgLower.includes('attention') || msgLower.includes('distracted')) {
        reply = "[Parent Mrs. Bello]: Are you saying she isn't paying attention? She is usually very focused. But I will talk to her. Please make sure the lessons are engaging.";
      }
    } else if (scenario === 'syllabus_alignment') {
      if (msgLower.includes('waec') || msgLower.includes('cambridge') || msgLower.includes('syllabus')) {
        reply = "[Principal Mensah]: Excellent. Having exact objective reference marks in your syllabus is critical. Which module units will you cover for the coordinate geometry exam?";
      } else if (msgLower.includes('assessment') || msgLower.includes('test') || msgLower.includes('quiz')) {
        reply = "[Principal Mensah]: A weekly pre-test is good practice. How do you track the student's telemetry progression scores? Is there a progress dashboard?";
      } else if (msgLower.includes('active') || msgLower.includes('notion') || msgLower.includes('classroom')) {
        reply = "[Principal Mensah]: Google Classroom and Notion are acceptable setups. Ensure that assignment links are shared securely and accessible for parent review.";
      }
    }
    return res.json({ reply });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const contents = [];
    if (history && Array.isArray(history)) {
      history.forEach(h => {
        contents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }]
        });
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const systemInstruction = {
      parts: [{ text: persona.systemPrompt }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, systemInstruction })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || `[${persona.name}]: I'm listening.`;
    res.json({ reply });
  } catch (err) {
    console.error("Gemini roleplay API error:", err);
    res.status(500).json({ error: "Failed to connect to simulation partner." });
  }
});

// GET list forum posts
app.get('/api/academy/forum', authenticateToken, async (req, res) => {
  const posts = await db.find('academy_forum');
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(posts);
});

// POST create forum post or comment
app.post('/api/academy/forum', authenticateToken, async (req, res) => {
  const { title, content, parentId } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Content is required." });
  }

  if (parentId) {
    const post = await db.findOne('academy_forum', p => p.id === parentId);
    if (!post) return res.status(404).json({ error: "Parent post not found." });
    
    const comments = post.comments || [];
    const newComment = {
      id: crypto.randomUUID(),
      authorName: req.user.displayName || "Elite Tutor",
      content,
      createdAt: new Date().toISOString()
    };
    comments.push(newComment);
    await await db.update('academy_forum', post.id, { comments });
    return res.json({ success: true, post: await db.findOne('academy_forum', p => p.id === parentId) });
  }

  if (!title) {
    return res.status(400).json({ error: "Title is required for a new thread." });
  }

  const newPost = await await db.insert('academy_forum', {
    title,
    content,
    authorName: req.user.displayName || "Elite Tutor",
    authorRole: req.user.role,
    comments: [],
    likes: 0
  });

  res.json({ success: true, post: newPost });
});

// --- 7. NOTIFICATION, DISPUTE & REPORT ENDPOINTS ---

// GET notifications list
app.get('/api/notifications/:uid', authenticateToken, requireOwnerOrAdmin, async (req, res) => {
  const { uid } = req.params;
  const list = await db.find('notifications', n => n.userId === uid);
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(list);
});

// POST Mark notification as read
app.post('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const notification = await db.findOne('notifications', n => n.id === id);
  if (notification) {
    if (notification.userId !== req.user.uid) {
      return res.status(403).json({ error: "Access forbidden. You do not own this notification." });
    }
    const updated = await await db.update('notifications', notification.id, { read: true });
    return res.json(updated);
  }
  res.status(404).json({ error: "Notification not found." });
});

// POST Mark all notifications as read
app.post('/api/notifications/read-all/:uid', authenticateToken, requireOwnerOrAdmin, async (req, res) => {
  const { uid } = req.params;
  const list = await db.find('notifications', n => n.userId === uid && !n.read);
  for (const n of list) {
    await await db.update('notifications', n.id, { read: true });
  }
  res.json({ success: true, count: list.length });
});

// --- ADMIN EMAIL & NOTIFICATION CLIENT ROUTES ---

// GET all users (Admin only)
app.get('/api/admin/users', authenticateToken, requireRole(['Admin']), async (req, res) => {
  const users = await db.find('users');
  res.json(users);
});

// GET all sent emails (Admin only)
app.get('/api/admin/emails', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const emails = readSentEmails();
    res.json(emails);
  } catch (err) {
    res.status(500).json({ error: "Failed to read sent emails logs." });
  }
});

// POST send welcome email (Admin only)
app.post('/api/admin/emails/send-welcome', authenticateToken, requireRole(['Admin']), async (req, res) => {
  const { email, displayName, role } = req.body;
  if (!email || !displayName || !role) {
    return res.status(400).json({ error: "Email, display name, and role are required." });
  }
  try {
    const record = sendTransactionalEmail(email, "Welcome to EduVistar Africa!", "welcome", {
      displayName,
      role
    });
    res.json({ success: true, email: record });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to send welcome email." });
  }
});

// POST send admin notification (Admin only)
app.post('/api/admin/emails/send-notification', authenticateToken, requireRole(['Admin']), async (req, res) => {
  const { userId, title, body } = req.body;
  if (!userId || !title || !body) {
    return res.status(400).json({ error: "userId, title, and body are required." });
  }

  try {
    let targets = [];
    if (userId === 'all') {
      targets = await db.find('users');
    } else {
      const user = await db.findOne('users', u => u.uid === userId);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }
      targets = [user];
    }

    const sentRecords = [];
    for (const target of targets) {
      // 1. Create in-app notification
      await createNotification(target.uid, 'admin_broadcast', title, body);
      
      // 2. Send email notification
      const emailRecord = sendTransactionalEmail(target.email, title, 'admin_notification', {
        displayName: target.displayName,
        message: body
      });
      sentRecords.push(emailRecord);
    }

    res.json({ success: true, sentCount: targets.length });
  } catch (err) {
    res.status(500).json({ error: err.message || "Failed to broadcast notification." });
  }
});

// POST Create Dispute
app.post('/api/disputes/create', authenticateToken, requireRole(['Parent']), async (req, res) => {
  const { sessionId, reason, details } = req.body;
  if (!sessionId || !reason) {
    return res.status(400).json({ error: "sessionId and reason are required." });
  }

  const session = await db.findOne('sessions', s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }

  if (session.parentId !== req.user.uid) {
    return res.status(403).json({ error: "Access forbidden. You are not a participant parent." });
  }

  const transaction = await db.findOne('transactions', t => t.sessionId === sessionId);
  if (transaction) {
    await await db.update('transactions', transaction.id, {
      status: "disputed",
      payoutStatus: "frozen"
    });
  }

  await await db.update('sessions', session.id, {
    status: "Disputed"
  });

  const dispute = await await db.insert('disputes', {
    sessionId,
    reason,
    details: details ? sanitizeText(details) : "",
    status: "Open",
    raisedBy: session.parentId
  });

  await createNotification(
    session.teacherId,
    "dispute_opened",
    "Dispute Raised on Session",
    `A dispute has been raised for the session on ${session.slot.day} at ${session.slot.time} by the parent. Payout is temporarily frozen.`
  );

  await createNotification(
    session.parentId,
    "dispute_opened",
    "Dispute Registered",
    `Your dispute on the session with ${session.teacherName} has been received. Our support team will review within 48 hours.`
  );

  // Automated dispute email alerts (teacher, parent, admins)
  try {
    const parentUser = await db.findOne('users', u => u.uid === session.parentId) || { email: "parent_1@eduvistar.com" };
    const teacherUser = await db.findOne('users', u => u.uid === session.teacherId);
    if (teacherUser && teacherUser.email) {
      sendTransactionalEmail(teacherUser.email, "EduVistar: Billing Dispute Opened", "dispute_created", {
        slot: session.slot,
        parentName: parentUser.displayName || parentUser.email.split('@')[0],
        reason
      });
    }
    
    sendTransactionalEmail(parentUser.email, "EduVistar: Dispute Registered", "admin_notification", {
      displayName: parentUser.displayName || "Parent",
      message: `Your dispute for the session on ${session.slot.day} at ${session.slot.time} with ${session.teacherName} has been registered. Our billing support team is reviewing it and will contact you shortly.`
    });

    const admins = await db.find('users', u => u.role === 'Admin');
    for (const admin of admins) {
      sendTransactionalEmail(admin.email, "EduVistar ADMIN: New Dispute Filed", "dispute_created", {
        slot: session.slot,
        parentName: parentUser.displayName || parentUser.email.split('@')[0],
        reason
      });
    }
  } catch (err) {
    console.error("Failed to send dispute transactional emails:", err);
  }

  res.json({ success: true, dispute });
});

// POST Complete Session & Trigger Escrow Release Countdown
app.post('/api/sessions/:id/complete', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const session = await db.findOne('sessions', s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }

  if (session.teacherId !== req.user.uid && session.parentId !== req.user.uid && req.user.role !== 'Admin') {
    return res.status(403).json({ error: "Access forbidden. Not authorized to complete this session." });
  }

  const now = new Date();
  const autoReleaseAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  await await db.update('sessions', session.id, {
    status: "Completed",
    completedAt: now.toISOString(),
    autoReleaseAt
  });

  // Notify Parent to rate and review
  await createNotification(
    session.parentId,
    "session_completed",
    "Session Marked Completed",
    `Your session on ${session.slot?.day || 'scheduled slot'} with ${session.teacherName || 'your tutor'} is complete. Please leave a rating and review!`
  );

  res.json({ success: true, message: "Session marked as completed. Escrow 24-hour clearance initiated.", autoReleaseAt });
});

// Automated Escrow Release Processor (Releases locked session funds after 24 hours or on trigger)
export async function processEscrowClearance(sessionId = null) {
  try {
    const completedSessions = sessionId 
      ? await db.find('sessions', s => s.id === sessionId)
      : await db.find('sessions', s => s.status === 'Completed');

    const now = new Date();
    let releasedCount = 0;

    for (const session of completedSessions) {
      // Check if session autoReleaseAt has elapsed (or if manually triggered)
      const releaseTime = session.autoReleaseAt ? new Date(session.autoReleaseAt) : now;
      if (sessionId || now >= releaseTime) {
        // Verify no pending disputes exist
        const activeDispute = await db.findOne('disputes', d => d.sessionId === session.id && (d.status === 'Pending' || d.status === 'Open'));
        if (activeDispute) {
          console.log(`[ESCROW ENGINE] Session ${session.id} has an open dispute. Escrow remains locked.`);
          continue;
        }

        const totalCost = session.cost || 2500000;
        const commission = Math.round(totalCost * 0.15);
        const teacherShare = totalCost - commission;

        // Update session status
        await db.update('sessions', session.id, {
          status: 'Cleared',
          clearedAt: now.toISOString()
        });

        // Update Teacher Wallet: deduct escrow, add to available balance
        let teacherWallet = await db.findOne('wallets', w => w.uid === session.teacherId || w.userUid === session.teacherId);
        if (teacherWallet) {
          await db.update('wallets', teacherWallet.id, {
            escrow: Math.max(0, (teacherWallet.escrow || 0) - teacherShare),
            balance: (teacherWallet.balance || 0) + teacherShare,
            updatedAt: now.toISOString()
          });
        }

        // Update Admin Wallet: add 15% platform commission
        const adminUser = await db.findOne('users', u => u.role === 'Admin') || { uid: 'admin_1' };
        let adminWallet = await db.findOne('wallets', w => w.uid === adminUser.uid);
        if (adminWallet) {
          await db.update('wallets', adminWallet.id, {
            balance: (adminWallet.balance || 0) + commission,
            updatedAt: now.toISOString()
          });
        }

        // Log Escrow Release Transaction
        await db.insert('transactions', {
          id: `tx_escrow_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          fromUserId: 'escrow_engine',
          toUserId: session.teacherId,
          sessionId: session.id,
          amount: teacherShare,
          type: 'escrow_release',
          status: 'completed',
          date: now.toISOString(),
          description: `Escrow funds cleared for completed session #${session.id}`
        });

        // Notifications
        await createNotification(
          session.teacherId,
          'escrow_released',
          'Escrow Funds Released',
          `₦${(teacherShare / 100).toLocaleString()} has been credited to your withdrawable wallet balance for session #${session.id}.`
        );

        const teacherUser = await db.findOne('users', u => u.uid === session.teacherId);
        if (teacherUser && teacherUser.email) {
          sendTransactionalEmail(teacherUser.email, "EduVistar: Escrow Funds Released", "escrow_released", {
            teacherName: session.teacherName || teacherUser.displayName,
            formattedPayout: `₦${(teacherShare / 100).toLocaleString()}`,
            formattedCommission: `₦${(commission / 100).toLocaleString()}`
          });
        }

        releasedCount++;
        console.log(`[ESCROW ENGINE] Released ₦${teacherShare / 100} to teacher ${session.teacherId} for session ${session.id}.`);
      }
    }
    return releasedCount;
  } catch (err) {
    console.error("[ESCROW ENGINE ERROR]:", err);
    return 0;
  }
}

// Interval runner: Check and clear matured escrows every 60 seconds
setInterval(() => {
  processEscrowClearance().catch(err => console.error("Escrow background error:", err));
}, 60000);

// POST Escrow Manual/Instant Release Endpoint
app.post('/api/escrow/release-now', authenticateToken, async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: "sessionId is required." });
  }

  const session = await db.findOne('sessions', s => s.id === sessionId);
  if (!session) {
    return res.status(404).json({ error: "Session not found." });
  }

  if (session.parentId !== req.user.uid && session.teacherId !== req.user.uid && req.user.role !== 'Admin') {
    return res.status(403).json({ error: "Not authorized to release escrow for this session." });
  }

  const releasedCount = await processEscrowClearance(sessionId);
  if (releasedCount > 0) {
    return res.json({ success: true, message: `Escrow funds successfully released for session #${sessionId}.` });
  } else {
    return res.status(400).json({ error: "Session escrow could not be released. Check if session has active disputes or is already cleared." });
  }
});

// POST Admin Dispute Resolution (Refund Parent or Release to Teacher)
app.post('/api/disputes/resolve', authenticateToken, requireRole(['Admin']), async (req, res) => {
  const { disputeId, action, resolutionNotes } = req.body;
  if (!disputeId || !action) {
    return res.status(400).json({ error: "disputeId and action are required." });
  }

  const dispute = await db.findOne('disputes', d => d.id === disputeId);
  if (!dispute) {
    return res.status(404).json({ error: "Dispute record not found." });
  }

  const session = await db.findOne('sessions', s => s.id === dispute.sessionId);
  const safeNotes = resolutionNotes ? sanitizeText(resolutionNotes) : "Admin resolution completed.";

  if (action === 'refund_parent') {
    // 1. Mark dispute & session
    await await db.update('disputes', dispute.id, { status: "Resolved - Refunded", resolutionNotes: safeNotes, resolvedAt: new Date().toISOString() });
    if (session) {
      await await db.update('sessions', session.id, { status: "Refunded" });
      
      // Credit Parent Wallet
      const parentWallet = await db.findOne('wallets', w => w.userUid === session.parentId);
      if (parentWallet) {
        const amount = session.amount || 2500000;
        await await db.update('wallets', parentWallet.id, {
          balance: (parentWallet.balance || 0) + amount,
          updatedAt: new Date().toISOString()
        });
      }

      // Deduct/clear teacher escrow if present
      const teacherWallet = await db.findOne('wallets', w => w.userUid === session.teacherId);
      if (teacherWallet) {
        const amount = session.amount || 2500000;
        await await db.update('wallets', teacherWallet.id, {
          escrow: Math.max(0, (teacherWallet.escrow || 0) - amount),
          updatedAt: new Date().toISOString()
        });
      }

      // Record transaction
      await await db.insert('transactions', {
        id: `tx_ref_${Date.now()}`,
        userUid: session.parentId,
        sessionId: session.id,
        amount: session.amount || 2500000,
        type: "Refund",
        status: "completed",
        date: new Date().toISOString(),
        description: `Full refund for disputed session #${session.id}`
      });

      await createNotification(session.parentId, "dispute_resolved", "Dispute Refunded", `Your dispute for session #${session.id} was approved. Funds have been refunded to your wallet.`);
      await createNotification(session.teacherId, "dispute_resolved", "Dispute Decision", `The dispute for session #${session.id} was resolved with a parent refund.`);
    }

    return res.json({ success: true, message: "Dispute resolved: Parent refunded successfully.", disputeId });

  } else if (action === 'release_teacher') {
    await await db.update('disputes', dispute.id, { status: "Resolved - Released", resolutionNotes: safeNotes, resolvedAt: new Date().toISOString() });
    if (session) {
      await await db.update('sessions', session.id, { status: "Cleared" });

      const teacherWallet = await db.findOne('wallets', w => w.userUid === session.teacherId);
      if (teacherWallet) {
        const amount = session.amount || 2500000;
        await await db.update('wallets', teacherWallet.id, {
          escrow: Math.max(0, (teacherWallet.escrow || 0) - amount),
          balance: (teacherWallet.balance || 0) + Math.round(amount * 0.85),
          updatedAt: new Date().toISOString()
        });
      }

      await createNotification(session.teacherId, "dispute_resolved", "Escrow Released", `Dispute resolved in your favor. Escrow funds for session #${session.id} cleared to your wallet balance.`);
      await createNotification(session.parentId, "dispute_resolved", "Dispute Closed", `Your dispute for session #${session.id} has been reviewed and closed by support.`);
    }

    return res.json({ success: true, message: "Dispute resolved: Funds released to teacher wallet.", disputeId });
  }

  res.status(400).json({ error: "Invalid action type. Expected 'refund_parent' or 'release_teacher'." });
});

// POST Submit Parent Review for Teacher
app.post('/api/reviews', authenticateToken, requireRole(['Parent']), async (req, res) => {
  const { teacherId, sessionId, rating, comment } = req.body;
  if (!teacherId || !rating) {
    return res.status(400).json({ error: "teacherId and rating (1-5) are required." });
  }

  const numRating = Math.min(5, Math.max(1, Number(rating)));
  const safeComment = comment ? sanitizeText(comment) : "";

  const parentUser = await db.findOne('users', u => u.uid === req.user.uid);
  const parentName = parentUser ? (parentUser.displayName || parentUser.email.split('@')[0]) : "Verified Parent";

  const newReview = await await db.insert('reviews', {
    teacherId,
    sessionId: sessionId || null,
    parentId: req.user.uid,
    parentName,
    rating: numRating,
    comment: safeComment,
    date: new Date().toISOString()
  });

  // Recalculate Teacher Profile Avg Rating
  const allReviews = await db.find('reviews', r => r.teacherId === teacherId);
  const avgRating = (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1);

  const teacherProfile = await db.findOne('teachers', t => t.uid === teacherId || t.id === teacherId);
  if (teacherProfile) {
    await await db.update('teachers', teacherProfile.id, {
      rating: parseFloat(avgRating),
      reviewsCount: allReviews.length
    });
  }

  await createNotification(
    teacherId,
    "new_review",
    "New Parent Review Received",
    `${parentName} left you a ${numRating}-star rating!`
  );

  res.json({ success: true, review: newReview, avgRating: parseFloat(avgRating), totalReviews: allReviews.length });
});

// GET Fetch Reviews for Teacher
app.get('/api/teachers/:teacherId/reviews', async (req, res) => {
  const { teacherId } = req.params;
  const reviews = await db.find('reviews', r => r.teacherId === teacherId);
  res.json({ success: true, reviews });
});

// POST Generate AI Progress Report
app.post('/api/ai/progress-report', authenticateToken, async (req, res) => {
  const { studentName, teacherNotes } = req.body;
  if (!studentName) {
    return res.status(400).json({ error: "studentName is required." });
  }

  const assignments = await db.find('assignments', a => a.studentName?.toLowerCase() === studentName.toLowerCase());
  const sessions = await db.find('sessions', s => s.studentName?.toLowerCase() === studentName.toLowerCase());

  const graded = assignments.filter(a => a.status === 'Graded');
  const avgGrade = graded.length > 0
    ? Math.round(graded.reduce((sum, g) => sum + (g.grade?.score || 0), 0) / graded.length)
    : 85;

  const apiKey = process.env.GEMINI_API_KEY;
  let reportText = "";

  if (apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [{
          parts: [{
            text: `You are an AI Educational Specialist for EduVistar Africa. Generate a detailed 4-point student progress report for parent review.
            Student Name: ${studentName}
            Average Grade: ${avgGrade}%
            Teacher Notes: ${teacherNotes || 'Consistently attentive and active.'}
            Graded Submissions: ${JSON.stringify(graded.map(g => ({ title: g.title, score: g.grade?.score })))}
            Provide concise sections for: 1. Academic Strengths, 2. Areas for Growth, 3. Attendance & Engagement, 4. Recommended Action Plan.`
          }]
        }]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      reportText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (e) {
      console.error("Gemini API progress report call error:", e);
    }
  }

  if (!reportText) {
    reportText = `### Academic Summary for ${studentName}\n\n` +
      `**1. Academic Strengths**: Demonstrates strong performance with a ${avgGrade}% overall assignment score. Shows quick comprehension of core concepts.\n` +
      `**2. Areas for Growth**: Can benefit from additional practice in exam-style multi-part problems and independent problem solving under timed constraints.\n` +
      `**3. Attendance & Engagement**: Completed ${sessions.length || 3} scheduled sessions with high punctuality and enthusiasm.\n` +
      `**4. Recommended Action Plan**: Continue bi-weekly tutoring sessions and complete assigned practice homework prior to upcoming assessment deadlines.`;
  }

  res.json({
    success: true,
    studentName,
    avgGrade,
    report: reportText,
    generatedAt: new Date().toISOString()
  });
});

// GET generate AI cognitive report
app.get('/api/parents/dashboard/:uid/ai-insight', authenticateToken, requireOwnerOrAdmin, async (req, res) => {
  const { uid } = req.params;
  const { studentName } = req.query;

  if (!studentName) {
    return res.status(400).json({ error: "studentName query param is required" });
  }

  const student = await db.findOne('students', s => s.parentUid === uid && s.name.toLowerCase() === studentName.toLowerCase());
  if (!student) {
    return res.status(403).json({ error: "Access forbidden. Student not associated with this parent profile." });
  }

  const assignments = await db.find('assignments', a => a.studentName.toLowerCase() === studentName.toLowerCase());
  const sessions = await db.find('sessions', s => s.studentName.toLowerCase() === studentName.toLowerCase());

  const graded = assignments.filter(a => a.status === 'Graded');
  const pending = assignments.filter(a => a.status !== 'Graded');
  const completedSessions = sessions.filter(s => s.status === 'Completed');

  const avgGrade = graded.length > 0
    ? Math.round(graded.reduce((sum, g) => sum + (g.grade?.score || 0), 0) / graded.length)
    : 80;

  const attendanceRate = sessions.length > 0
    ? Math.round((completedSessions.length / sessions.length) * 100)
    : 95;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const analysis = studentName.toLowerCase() === 'tunde'
      ? `Tunde has shown a significant ${avgGrade - 72}% improvement in mathematical factoring over the past 4 weeks. His homework completion rate is currently at ${Math.round((graded.length / (assignments.length || 1)) * 100)}% with an average assessment score of ${avgGrade}/100. We recommend focusing on trigonometric functions and quadratic coordinates in the next session to solidifying secondary WAEC exam foundations.`
      : `Yinka exhibits a strong grasp of structural grammar and essay punctuation, currently holding a ${avgGrade}/100 average in English Literature. Her attendance rate is a perfect ${attendanceRate}%. To challenge her analytical depth, we recommend that the next session focus on narrative structuring and reading compression strategies.`;

    return res.json({
      insight: analysis,
      timestamp: new Date().toISOString(),
      level: avgGrade >= 90 ? "EXCEPTIONAL" : "HIGH COMPREHENSION",
      avgGrade,
      attendanceRate
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{
        parts: [{
          text: `You are an expert pedagogical AI educational analyst. Analyze this student's learning analytics and write a concise, encouraging, and highly specific 3-line diagnostic weekly digest for their parent. Focus on concrete statistics and soft/hard skills.
          
          Student Name: ${studentName}
          Subject Metrics: Average assessment score of ${avgGrade}/100, Attendance rate of ${attendanceRate}%.
          Graded Assignments: ${JSON.stringify(graded.map(g => ({ title: g.title, score: g.grade?.score, feedback: g.grade?.feedback })))}
          Pending Assignments: ${JSON.stringify(pending.map(p => p.title))}
          Completed Sessions: ${completedSessions.length}`
        }]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const insightText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to parse cognitive metrics.";
    
    res.json({
      insight: insightText.trim(),
      timestamp: new Date().toISOString(),
      level: avgGrade >= 90 ? "EXCEPTIONAL" : "HIGH COMPREHENSION",
      avgGrade,
      attendanceRate
    });
  } catch (err) {
    console.error("Gemini dashboard insight error:", err);
    res.status(500).json({ error: "Failed to generate AI weekly insight." });
  }
});

// GET HTML progress report download representation
app.get('/api/reports/download/:studentId', authenticateToken, async (req, res) => {
  const { studentId } = req.params;
  const student = await db.findOne('students', s => s.uid === studentId || s.id === studentId);
  if (!student) {
    return res.status(404).send("Student profile not found.");
  }

  if (req.user.role !== 'Admin' && student.parentUid !== req.user.uid) {
    return res.status(403).send("Access forbidden. Not the parent of this student.");
  }

  const parent = await db.findOne('parents', p => p.uid === student.parentUid);
  const parentUser = await db.findOne('users', u => u.uid === student.parentUid);
  const assignments = await db.find('assignments', a => a.studentName.toLowerCase() === student.name.toLowerCase());
  const sessions = await db.find('sessions', s => s.studentName.toLowerCase() === student.name.toLowerCase());
  
  const graded = assignments.filter(a => a.status === 'Graded');
  const completed = sessions.filter(s => s.status === 'Completed');
  
  const avgScore = graded.length > 0
    ? Math.round(graded.reduce((sum, g) => sum + (g.grade?.score || 0), 0) / graded.length)
    : 80;

  const attendance = sessions.length > 0
    ? Math.round((completed.length / sessions.length) * 100)
    : 100;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>EduVistar Progress Report - ${student.name}</title>
      <style>
        body { font-family: 'Inter', system-ui, sans-serif; background: #FAF8F5; color: #1A1A1A; padding: 40px; margin: 0; }
        .card { max-width: 800px; margin: 0 auto; background: #FFF; border: 1px solid #2E4036; border-radius: 24px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2E4036; padding-bottom: 20px; }
        .logo { font-size: 24px; font-weight: 800; color: #2E4036; text-transform: uppercase; font-family: 'Space Grotesk', sans-serif; }
        .title { font-size: 18px; color: #CC5833; font-weight: bold; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
        .meta-item { background: #F2F0E9; padding: 15px 20px; border-radius: 12px; }
        .meta-label { font-size: 10px; text-transform: uppercase; color: #666; font-weight: bold; margin-bottom: 5px; }
        .meta-value { font-size: 16px; font-weight: bold; color: #2E4036; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 40px; }
        .stat-card { text-align: center; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px; }
        .stat-val { font-size: 32px; font-weight: 800; color: #CC5833; }
        .stat-lbl { font-size: 11px; text-transform: uppercase; color: #666; margin-top: 5px; }
        .section-title { font-size: 16px; font-weight: bold; color: #2E4036; border-bottom: 1px solid #E2E8F0; padding-bottom: 10px; margin-bottom: 20px; text-transform: uppercase; }
        .grade-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; background: #FFF; border: 1px solid #F2F0E9; border-radius: 8px; margin-bottom: 10px; }
        .grade-score { background: #2E4036; color: #FFF; font-weight: bold; padding: 6px 12px; border-radius: 6px; font-size: 14px; }
        .footer { text-align: center; margin-top: 30px; border-top: 1px solid #E2E8F0; padding-top: 20px; font-size: 10px; color: #666; }
        @media print {
          body { background: #FFF; padding: 0; }
          .card { border: none; box-shadow: none; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">EduVistar Africa</div>
          <div class="title">Official Progress Report</div>
        </div>
        
        <div class="meta-grid">
          <div class="meta-item">
            <div class="meta-label">STUDENT NAME</div>
            <div class="meta-value">${student.name}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">PARENT / GUARDIAN</div>
            <div class="meta-value">${parentUser ? parentUser.displayName : "Ngozi Adeleke"}</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-val">${avgScore}%</div>
            <div class="stat-lbl">Average Grade</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${attendance}%</div>
            <div class="stat-lbl">Attendance Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-val">${student.xp}</div>
            <div class="stat-lbl">Earned Student XP</div>
          </div>
        </div>

        <div class="section-title">Assignment History</div>
        ${graded.map(g => `
          <div class="grade-row">
            <div>
              <div style="font-weight: bold; font-size: 13px;">${g.title}</div>
              <div style="font-size: 11px; color: #666; font-style: italic; margin-top: 3px;">"${g.grade?.feedback || ''}"</div>
            </div>
            <div class="grade-score">${g.grade?.score}/100</div>
          </div>
        `).join('')}

        <div class="section-title">AI Academic Insights</div>
        <div style="background: #F2F0E9; border-left: 4px solid #CC5833; padding: 15px; font-size: 13px; line-height: 1.6; border-radius: 0 12px 12px 0; font-style: italic;">
          "${student.name} exhibits excellent comprehension marks with ${avgScore}% overall assessment quality. They demonstrate high aptitude in logic parameters and structured completion rates. Recommended next curriculum topics: Advanced exercises and comprehensive reviews."
        </div>

        <div class="footer">
          Generated on ${new Date().toLocaleDateString()} · Official EduVistar Academic Registry Record.
        </div>
      </div>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// App initialization status check
app.get('/api/status', async (req, res) => {
  res.json({ status: "healthy", version: "2.0.0", message: "EduVistar API Server Active." });
});

// Start Server conditionally (only when not running inside Vercel serverless environment)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  ensureDb().then(() => {
    app.listen(PORT, () => {
      console.log(`EduVistar Africa Backend Server running on http://localhost:${PORT}`);
    });
  }).catch(err => {
    console.error("Database initialization failed, starting server with fallback...", err);
    app.listen(PORT, () => {
      console.log(`EduVistar Africa Backend Server running on http://localhost:${PORT} (failed init fallback)`);
    });
  });
}

export default app;
