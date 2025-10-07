// src/lib/firebase-admin.ts
import 'server-only';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

let app: admin.app.App;
let db: admin.firestore.Firestore;
let adminAuth: admin.auth.Auth;

function formatPrivateKey(key: string) {
  return key.replace(/\\n/g, '\n');
}

// This pattern ensures that the SDK is initialized only once.
if (admin.apps.length === 0) {
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
        storageBucket, // Add storage bucket to config
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } else {
      // Throw an error if essential variables are missing.
      // This prevents the application from running in a broken state.
      const missingVars = [];
      if (!privateKey) missingVars.push('FIREBASE_PRIVATE_KEY');
      if (!clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
      if (!projectId) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
      if (!storageBucket) missingVars.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
      
      throw new Error(
        `Firebase Admin credentials incomplete. Missing: ${missingVars.join(', ')}`
      );
    }
  } catch (error: any) {
    console.error("CRITICAL: Error initializing Firebase Admin SDK:", error.message);
    // Re-throw the error to halt initialization if it fails
    throw error;
  }
} else {
  app = admin.apps[0]!;
}

// @ts-ignore - This allows db and adminAuth to be uninitialized if creds are missing.
if (app!) {
  db = getFirestore(app);
  adminAuth = getAuth(app);
}

export { db, adminAuth };
