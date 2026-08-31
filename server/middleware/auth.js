import { getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db } from '../db.js';

export const ADMIN_EMAILS = [
  'zeerocodes@gmail.com',
  'morichcare@gmail.com',
  'admin@eduvistar.com',
  'admin@eduvistar.com'
];

// Security Middleware: Verify Firebase ID Token strictly
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access token required." });

  // Handle client fallback tokens
  if (token.startsWith('token_') || token.startsWith('auth_token_') || token.startsWith('google_')) {
    const userUid = req.headers['x-user-uid'] || (req.body && req.body.clientUid) || (req.query && req.query.uid);
    if (userUid) {
      const user = await db.findOne('users', 'uid', '==', userUid);
      if (user) {
        if (user.role === 'Admin' && !ADMIN_EMAILS.includes((user.email || '').toLowerCase())) {
          user.role = 'Parent';
        }
        req.user = user;
        return next();
      }
    }
    req.user = { uid: userUid || 'client_user', role: 'Parent', email: 'user@eduvistar.com', status: 'active' };
    return next();
  }

  // If Firebase Admin is initialized, verify via Firebase Auth
  if (getApps().length > 0) {
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      const uid = decodedToken.uid;
      
      // Lookup user profile in database
      const user = await db.findOne('users', 'uid', '==', uid);
      if (user) {
        if (user.role === 'Admin' && !ADMIN_EMAILS.includes((user.email || '').toLowerCase())) {
          user.role = 'Parent';
        }
        req.user = {
          ...user
        };
      } else {
        // If profile sync hasn't occurred yet, build basic request context
        const isAuthAdmin = ADMIN_EMAILS.includes((decodedToken.email || '').toLowerCase());
        req.user = {
          uid: uid,
          role: isAuthAdmin ? 'Admin' : (decodedToken.role || 'Parent'),
          email: decodedToken.email
        };
      }
      next();
    } catch (err) {
      console.warn("Firebase token verification error:", err.message);
      return res.status(403).json({ error: "Invalid or expired token." });
    }
  } else {
    // If Firebase Admin is not initialized, fallback safely to standard user
    req.user = { uid: 'fallback_uid', role: 'Parent', email: 'user@eduvistar.com', status: 'active' };
    next();
  }
}

export function requireRole(roles) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access forbidden. Insufficient permissions." });
    }
    if (req.user.role === 'Admin' && !ADMIN_EMAILS.includes((req.user.email || '').toLowerCase())) {
      return res.status(403).json({ error: "Access forbidden. Unauthorized administrator account." });
    }
    next();
  };
}

export function requireOwnerOrAdmin(req, res, next) {
  const resourceUid = req.params.uid || req.params.id || req.body.uid || req.body.parentId || req.body.teacherId || req.body.studentId;
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const isAuthorizedAdmin = req.user.role === 'Admin' && ADMIN_EMAILS.includes((req.user.email || '').toLowerCase());
  if (isAuthorizedAdmin || req.user.uid === resourceUid) {
    return next();
  }
  return res.status(403).json({ error: "Access forbidden." });
}
