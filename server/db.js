import crypto from 'crypto';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let firestoreDb = null;
export let isFirestore = false;
export let dbInitError = null;

function initFirestore() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : null;

  if (projectId && clientEmail && privateKey) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        })
      });
      firestoreDb = getFirestore();
      isFirestore = true;
      console.log("Database Migration: Connected to Cloud Firestore via env vars.");
      return;
    } catch (err) {
      console.error("Database Migration: Failed to initialize Firebase Admin cert:", err);
    }
  }

  // Fallback to local service account file
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const serviceAccountPath = path.join(process.cwd(), 'edubridgez-firebase-adminsdk-fbsvc-d56360976c.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      initializeApp({
        credential: cert(serviceAccount)
      });
      firestoreDb = getFirestore();
      isFirestore = true;
      console.log("Database Migration: Connected to Cloud Firestore via local json key.");
      return;
    } catch (err) {
      console.error("Database Migration: Failed to init local service account:", err);
    }
  }

  dbInitError = "No valid Firebase credentials found.";
  console.error(dbInitError);
}

export async function connectDb() {
  initFirestore();
}

export function getDbInitError() { return dbInitError; }

export const db = {
  find: async (collection, fieldOrFn, operator, value) => {
    if (!isFirestore) return [];
    try {
      if (typeof fieldOrFn === 'function') {
        const snapshot = await firestoreDb.collection(collection).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(fieldOrFn);
      }
      
      let query = firestoreDb.collection(collection);
      if (fieldOrFn && operator && value !== undefined) {
        query = query.where(fieldOrFn, operator, value);
      }
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error(`Firestore Find Error [${collection}]:`, err);
      return [];
    }
  },

  findOne: async (collection, fieldOrFn, operator, value) => {
    if (!isFirestore) return null;
    try {
      if (typeof fieldOrFn === 'function') {
        const snapshot = await firestoreDb.collection(collection).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).find(fieldOrFn) || null;
      }

      let query = firestoreDb.collection(collection);
      if (fieldOrFn && operator && value !== undefined) {
        query = query.where(fieldOrFn, operator, value);
      }
      const snapshot = await query.limit(1).get();
      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    } catch (err) {
      console.error(`Firestore FindOne Error [${collection}]:`, err);
      return null;
    }
  },

  insert: async (collection, doc) => {
    if (!isFirestore) return null;
    const docId = doc.id || doc.uid || crypto.randomUUID();
    const newDoc = {
      ...doc,
      id: docId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await firestoreDb.collection(collection).doc(docId).set(newDoc);
    return newDoc;
  },

  update: async (collection, id, updates) => {
    if (!isFirestore) return null;
    const updatedDoc = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await firestoreDb.collection(collection).doc(id).set(updatedDoc, { merge: true });
    const snapshot = await firestoreDb.collection(collection).doc(id).get();
    return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : updatedDoc;
  },

  delete: async (collection, id) => {
    if (!isFirestore) return false;
    await firestoreDb.collection(collection).doc(id).delete();
    return true;
  }
};
