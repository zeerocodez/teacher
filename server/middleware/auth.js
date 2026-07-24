import { getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db } from '../db.js';

// Security Middleware: Verify Firebase ID Token strictly
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access token required." });

  // If Firebase Admin is initialized, verify via Firebase Auth
  if (getApps().length > 0) {
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      const uid = decodedToken.uid;
      
      // Lookup user profile in database
      const user = await db.findOne('users', 'uid', '==', uid);
      if (user) {
        req.user = {
          ...user
        };
      } else {
        // If profile sync hasn't occurred yet, build basic request context
        req.user = {
          uid: uid,
          role: decodedToken.role || 'Parent',
          email: decodedToken.email
        };
      }
      next();
    } catch (err) {
      console.warn("Firebase token verification error:", err.message);
      return res.status(403).json({ error: "Invalid or expired token." });
    }
  } else {
    return res.status(500).json({ error: "Firebase Admin SDK not initialized." });
  }
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access forbidden. Insufficient permissions." });
    }
    next();
  };
}

export function requireOwnerOrAdmin(req, res, next) {
  const resourceUid = req.params.uid || req.params.id || req.body.uid || req.body.parentId || req.body.teacherId || req.body.studentId;
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.user.role === 'Admin' || req.user.uid === resourceUid) {
    return next();
  }
  return res.status(403).json({ error: "Access forbidden." });
}
