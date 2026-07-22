import crypto from 'crypto';
import { db } from './db.js';

export function sanitizeText(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map(v => sanitizeObject(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      if (key.toLowerCase().includes('password') || key === 'rawBody' || key === 'bio') {
        result[key] = obj[key];
      } else {
        result[key] = sanitizeObject(obj[key]);
      }
      return result;
    }, {});
  } else if (typeof obj === 'string') {
    return sanitizeText(obj);
  }
  return obj;
}

const pbkdf2Promise = (password, salt, iterations, keylen, digest) => {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex'));
    });
  });
};

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await pbkdf2Promise(password, salt, 600000, 64, 'sha512');
  return { salt, hash };
}

export async function verifyPassword(password, salt, storedHash) {
  const hash = await pbkdf2Promise(password, salt, 600000, 64, 'sha512');
  return hash === storedHash;
}

export async function createNotification(userId, type, title, body) {
  try {
    return await db.insert('notifications', {
      userId,
      type,
      title,
      body,
      read: false
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
    return null;
  }
}
