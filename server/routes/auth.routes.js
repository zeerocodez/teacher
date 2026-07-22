import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { sanitizeText, hashPassword, verifyPassword, createNotification } from '../utils.js';
import { authRateLimiter } from '../middleware/limiters.js';
import { sendTransactionalEmail } from '../services/email.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'eduvista_jwt_secret_2026';

// Register a new user (Parent or Teacher)
router.post('/register', authRateLimiter, async (req, res) => {
  const { email, displayName, role, country, password, username: requestedUsername, referredBy, uid: clientUid, eliteCertificate } = req.body;
  if (!email || !displayName || !role) {
    return res.status(400).json({ error: "Email, display name, and role are required." });
  }

  const sanitizedEmail = sanitizeText(email);
  const sanitizedDisplayName = sanitizeText(displayName);
  const sanitizedCountry = country ? sanitizeText(country) : "Nigeria";

  const existingUser = db.findOne('users', u => u.email.toLowerCase() === sanitizedEmail.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: "User with this email already exists." });
  }

  // Use clientUid from Firebase if available, otherwise fallback to mock
  const uid = clientUid || `user_${Date.now()}`;
  let salt = "";
  let hash = "";

  if (password) {
    const pwDetails = await hashPassword(password);
    salt = pwDetails.salt;
    hash = pwDetails.hash;
  }

  let finalRole = role === 'Teacher' || role === 'Parent' ? role : 'Parent';
  if (sanitizedEmail.toLowerCase() === 'zeerocodes@gmail.com' || sanitizedEmail.toLowerCase() === 'morichcare@gmail.com') {
    finalRole = 'Admin';
  }

  const newUser = await db.insert('users', {
    uid,
    email: sanitizedEmail,
    displayName: sanitizedDisplayName,
    role: finalRole,
    country: sanitizedCountry,
    status: "active",
    salt,
    passwordHash: hash
  });

  if (finalRole === "Teacher") {
    const { 
      whatsapp, nin, linkedin, avatar, govIdUrl, cvUrl, videoUrl, degreeUrl, 
      rate, currency, timezone, classroomLink, recordingTool 
    } = req.body;

    let finalUsername;
    if (requestedUsername) {
      const cleanUsername = requestedUsername.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/(^-|-$)/g, '');
      if (!cleanUsername) {
        return res.status(400).json({ error: "Username must contain alphanumeric characters or hyphens." });
      }
      const existingTeacher = db.findOne('teachers', t => t.username === cleanUsername);
      if (existingTeacher) {
        return res.status(400).json({ error: "This username is taken. Please choose a unique username." });
      }
      finalUsername = cleanUsername;
    } else {
      return res.status(400).json({ error: "Public username is required for teachers." });
    }

    await db.insert('teachers', {
      uid,
      username: finalUsername,
      name: sanitizedDisplayName,
      location: sanitizedCountry,
      subjects: [],
      curricula: [],
      rate: rate ? Math.round(Number(rate) * 100) : 0,
      rating: 5.0,
      reviewsCount: 0,
      badges: eliteCertificate ? ["badge-ai-cert"] : [],
      bio: "",
      avatar: avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600&auto=format&fit=crop",
      online: true,
      availability: {
        Tomorrow: ["4:00 PM", "5:00 PM"],
        Wednesday: ["3:00 PM", "4:00 PM"]
      },
      languages: ["English"],
      verified: false,
      status: "pending_approval",
      stats: { sessionsTaught: 0, responseRate: 100 },
      leaderboardOptIn: true,
      whatsapp: whatsapp ? sanitizeText(whatsapp) : "",
      nin: nin ? sanitizeText(nin) : "",
      linkedin: linkedin ? sanitizeText(linkedin) : "",
      govIdUrl: govIdUrl ? sanitizeText(govIdUrl) : "",
      cvUrl: cvUrl ? sanitizeText(cvUrl) : "",
      videoUrl: videoUrl ? sanitizeText(videoUrl) : "",
      degreeUrl: degreeUrl ? sanitizeText(degreeUrl) : "",
      currency: currency ? sanitizeText(currency) : "NGN",
      timezone: timezone ? sanitizeText(timezone) : "Africa/Lagos",
      classroomLink: classroomLink ? sanitizeText(classroomLink) : "",
      recordingTool: recordingTool ? sanitizeText(recordingTool) : "recordly.site"
    });

    await db.insert('wallets', {
      uid,
      balance: 0,
      escrow: 0
    });

    // Notify Admins of the new registration immediately
    const admins = db.find('users', u => u.role === 'Admin');
    for (const admin of admins) {
      await createNotification(admin.uid, 'system', 'New Teacher Application', `${sanitizedDisplayName} (@${finalUsername}) has registered and is pending vetting.`);
      sendTransactionalEmail(admin.email, "New Teacher Registration", "alert", {
        message: `A new teacher, ${sanitizedDisplayName} (@${finalUsername}) from ${sanitizedCountry}, has registered directly and uploaded their credentials. WhatsApp: ${whatsapp || 'Not provided'}, LinkedIn: ${linkedin || 'Not provided'}. Please contact and vet them.`
      });
    }
  } else if (finalRole === "Parent") {
    await db.insert('parents', {
      uid,
      children: ["Tunde"], // Default test student
      paymentMethods: ["card_visa_default"],
      preferredCurrency: "NGN",
      country: sanitizedCountry,
      referredBy: referredBy ? sanitizeText(referredBy) : null,
      referralHits: 0
    });

    await db.insert('wallets', {
      uid,
      balance: 0, // Real-world balance defaults to 0 kobo NGN (requires paystack top-up)
      escrow: 0
    });

    // Notify Admins of the new parent registration
    const admins = db.find('users', u => u.role === 'Admin');
    for (const admin of admins) {
      await createNotification(admin.uid, 'system', 'New Parent Registration', `${sanitizedDisplayName} has joined as a Parent from ${sanitizedCountry}.`);
      sendTransactionalEmail(admin.email, "New Parent Registration", "alert", {
        message: `A new parent, ${sanitizedDisplayName} from ${sanitizedCountry}, has successfully registered on the platform. Email: ${sanitizedEmail}`
      });
    }
  }

  const token = jwt.sign({ uid, role: finalRole, email: sanitizedEmail }, JWT_SECRET, { expiresIn: '7d' });

  // Trigger transactional Welcome email
  sendTransactionalEmail(sanitizedEmail, "Welcome to EduVista Africa!", "welcome", {
    displayName: sanitizedDisplayName,
    role: finalRole
  });

  res.json({ ...newUser, token });
});

// Login user
router.post('/login', authRateLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const user = db.findOne('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "Account not found. Please register." });
  }

  // Securely verify password
  if (user.passwordHash && user.salt) {
    const isMatch = await verifyPassword(password, user.salt, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password credentials." });
    }
  }

  const token = jwt.sign({ uid: user.uid, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  res.json({ ...user, token });
});

export default router;
