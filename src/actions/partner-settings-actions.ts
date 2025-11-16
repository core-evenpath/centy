'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { AIModelChoice, PartnerAIConfig } from '@/lib/types';

export async function getPartnerAIConfig(
  partnerId: string
): Promise<AIModelChoice> {
  if (!db) {
    return 'haiku'; // Default fallback
  }

  try {
    const configDoc = await db
      .collection('partners')
      .doc(partnerId)
      .collection('settings')
      .doc('aiConfig')
      .get();

    if (!configDoc.exists) {
      return 'haiku'; // Default
    }

    const config = configDoc.data() as PartnerAIConfig;
    return config.responseModel || 'haiku';
  } catch (error) {
    console.error('Error getting AI config:', error);
    return 'haiku'; // Default fallback
  }
}

export async function updatePartnerAIConfig(
  partnerId: string,
  userId: string,
  modelChoice: AIModelChoice
): Promise<{ success: boolean; message: string }> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const configRef = db
      .collection('partners')
      .doc(partnerId)
      .collection('settings')
      .doc('aiConfig');

    await configRef.set({
      responseModel: modelChoice,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
      timestamp: FieldValue.serverTimestamp(),
    });

    console.log(`✅ Updated AI config for ${partnerId} to ${modelChoice}`);

    return {
      success: true,
      message: 'AI configuration updated successfully',
    };
  } catch (error: any) {
    console.error('Error updating AI config:', error);
    return {
      success: false,
      message: `Failed to update: ${error.message}`,
    };
  }
}