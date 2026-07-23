import express from 'express';
import { db } from '../db.js';
import { sanitizeText, createNotification } from '../utils.js';
import { authRateLimiter } from '../middleware/limiters.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendTransactionalEmail } from '../services/email.js';

const router = express.Router();

// Get Current Authenticated User Profile
router.get('/me', authenticateToken, async (req, res) => {
  // If authenticateToken succeeds, it means the Firebase token is valid.
  // req.user contains the full user document (if they exist in the DB)
  // If req.user only has uid, role, email (meaning they are authenticated in Firebase but NOT in our DB),
  // we return 404 to trigger the Onboarding flow on the frontend.
  if (req.user && req.user.status) {
    return res.json(req.user);
  } else {
    return res.status(404).json({ error: "User profile not found in database. Onboarding required." });
  }
});

// Register a new user (Parent or Teacher) after Firebase Auth succeeds
router.post('/register', authRateLimiter, async (req, res) => {
  try {
    const { clientUid, email, displayName, role, country, username: requestedUsername, referredBy, eliteCertificate } = req.body;
    
    if (!clientUid || !email || !displayName || !role) {
      return res.status(400).json({ error: "Firebase UID, Email, display name, and role are required." });
    }

    const sanitizedEmail = sanitizeText(email);
    const sanitizedDisplayName = sanitizeText(displayName);
    const sanitizedCountry = country ? sanitizeText(country) : "Nigeria";

    const existingUser = await db.findOne('users', 'uid', '==', clientUid);
    if (existingUser) {
      return res.status(400).json({ error: "User profile already exists." });
    }

    const uid = clientUid;
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
      status: "active"
    });

    if (finalRole === "Teacher") {
      const { 
        whatsapp, avatar, rate
      } = req.body;

      let finalUsername;
      if (requestedUsername) {
        const cleanUsername = requestedUsername.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/(^-|-$)/g, '');
        if (!cleanUsername) {
          return res.status(400).json({ error: "Username must contain alphanumeric characters or hyphens." });
        }
        const existingTeacher = await db.findOne('teachers', 'username', '==', cleanUsername);
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
        availability: {},
        languages: ["English"],
        verified: false,
        status: "pending_approval",
        stats: { sessionsTaught: 0, responseRate: 100 },
        leaderboardOptIn: true,
        whatsapp: whatsapp ? sanitizeText(whatsapp) : ""
      });

      await db.insert('wallets', {
        uid,
        userUid: uid,
        balance: 0,
        escrow: 0,
        currency: "NGN",
        history: []
      });

      // Notify Admins
      const admins = await db.find('users', 'role', '==', 'Admin');
      for (const admin of admins) {
        await createNotification(admin.uid, 'system', 'New Teacher Application', `${sanitizedDisplayName} (@${finalUsername}) has registered and is pending vetting.`);
        sendTransactionalEmail(admin.email, "New Teacher Registration", "alert", {
          message: `A new teacher, ${sanitizedDisplayName} (@${finalUsername}), has applied and is pending verification. Email: ${sanitizedEmail}`
        });
      }

    } else if (finalRole === "Parent") {
      await db.insert('parents', {
        uid,
        name: sanitizedDisplayName,
        email: sanitizedEmail,
        country: sanitizedCountry,
        referredBy: referredBy ? sanitizeText(referredBy) : null,
        referralHits: 0
      });

      await db.insert('wallets', {
        uid,
        userUid: uid,
        balance: 0,
        escrow: 0,
        currency: "NGN",
        history: []
      });

      const admins = await db.find('users', 'role', '==', 'Admin');
      for (const admin of admins) {
        await createNotification(admin.uid, 'system', 'New Parent Registration', `${sanitizedDisplayName} has joined as a Parent from ${sanitizedCountry}.`);
        sendTransactionalEmail(admin.email, "New Parent Registration", "alert", {
          message: `A new parent, ${sanitizedDisplayName} from ${sanitizedCountry}, has successfully registered on the platform. Email: ${sanitizedEmail}`
        });
      }
    }

    sendTransactionalEmail(sanitizedEmail, "Welcome to EduVista Africa!", "welcome", {
      displayName: sanitizedDisplayName,
      role: finalRole
    });

    res.json(newUser);
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "An internal server error occurred during registration." });
  }
});

export default router;
