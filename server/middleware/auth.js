import jwt from 'jsonwebtoken';
import { getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'edubridge-super-secret-local-key-2026';

// Security Middleware: Verify Firebase ID Token or fallback to JWT
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access token required." });

  // If Firebase Admin is initialized, verify via Firebase Auth
  if (getApps().length > 0) {
    getAuth().verifyIdToken(token)
      .then((decodedToken) => {
        const uid = decodedToken.uid;
        // Lookup user profile in database cache
        const user = db.findOne('users', u => u.uid === uid);
        if (user) {
          req.user = {
            uid: user.uid,
            role: user.role,
            email: user.email,
            displayName: user.displayName
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
      })
      .catch((err) => {
        // Fallback to local JWT verification
        jwt.verify(token, JWT_SECRET, (jwtErr, user) => {
          if (jwtErr) {
            console.warn("JWT verification error (Firebase catch):", jwtErr.message);
            return res.status(403).json({ error: "Invalid or expired token." });
          }
          req.user = user;
          next();
        });
      });
  } else {
    // Normal local JWT fallback
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        console.warn("JWT verification error (No Firebase):", err.message);
        return res.status(403).json({ error: "Invalid or expired token." });
      }
      req.user = user;
      next();
    });
  }
}

// Security Middleware: Require Role
export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized." });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access forbidden. Insufficient permissions." });
    }
    next();
  };
}

// Security Middleware: Owner Check
export function requireOwnerOrAdmin(req, res, next) {
  const requestedUid = req.params.uid || req.body.uid || req.query.uid || req.body.parentId || req.body.userId;
  if (!requestedUid) {
    return res.status(400).json({ error: "User identity parameter is required." });
  }
  if (req.user.role === 'Admin') {
    return next();
  }
  if (req.user.uid !== requestedUid) {
    return res.status(403).json({ error: "Access forbidden. Resource ownership mismatch." });
  }
  next();
}
