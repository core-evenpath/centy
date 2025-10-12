// src/actions/early-access-actions.ts
'use server';

import { db } from '../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

interface EarlyAccessSignupInput {
  name: string;
  email: string;
}

export async function saveEarlyAccessSignupAction(input: EarlyAccessSignupInput): Promise<{
  success: boolean;
  message: string;
}> {
  if (!db) {
    return {
      success: false,
      message: "Database not available",
    };
  }

  if (!input.name || !input.email) {
    return {
      success: false,
      message: "Name and email are required.",
    };
  }

  try {
    const signupData = {
      name: input.name,
      email: input.email.toLowerCase(),
      createdAt: FieldValue.serverTimestamp(),
    };

    // Use email as document id to prevent duplicates
    await db.collection('earlyAccessSignups').doc(signupData.email).set(signupData);

    return {
      success: true,
      message: "Successfully signed up for early access!",
    };
  } catch (error: any) {
    console.error("Error saving early access signup:", error);
    return {
      success: false,
      message: `Failed to sign up: ${error.message}`,
    };
  }
}
