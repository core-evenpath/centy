// src/lib/firebase-admin.ts
import 'server-only';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

let app: admin.app.App;

function formatPrivateKey(key: string) {
  return key.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    if (privateKey && clientEmail && projectId && storageBucket) {
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formatPrivateKey(privateKey),
        }),
        projectId,
        storageBucket,
      });
      
      const firestore = getFirestore(app);
      // Ensure this setting is applied
      firestore.settings({
        ignoreUndefinedProperties: true,
      });
      
      console.log('Firebase Admin SDK initialized successfully.');
      console.log('Firestore configured to ignore undefined properties.');
    } else {
      const missingVars = [];
      if (!privateKey) missingVars.push('FIREBASE_PRIVATE_KEY');
      if (!clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
      if (!projectId) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
      if (!storageBucket) missingVars.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
      
      console.error(`CRITICAL: Firebase Admin credentials incomplete. Missing: ${missingVars.join(', ')}`);
    }
  } catch (error: any) {
    console.error("CRITICAL: Error initializing Firebase Admin SDK:", error.message);
  }
} else {
  app = admin.apps[0]!;
}

// Re-get firestore instance to ensure settings are applied if app was already initialized
const db = getFirestore(app);
if (admin.apps.length > 0) {
    db.settings({
        ignoreUndefinedProperties: true,
    });
}
const adminAuth = getAuth(app);

export { db, adminAuth };
