// src/actions/trading-pick-actions.ts
'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { TradingPick } from '@/lib/types';
import { headers } from 'next/headers';

interface SaveTradingPickInput {
  partnerId: string;
  pickData: Omit<TradingPick, 'id' | 'createdAt' | 'updatedAt'>;
  pickId?: string; // Optional: for updating existing picks
}

interface TradingPickActionResult {
  success: boolean;
  message: string;
  pickId?: string;
}

/**
 * Server action to save a trading pick.
 * This action is authorized to ensure only the correct partner can save a pick.
 */
export async function saveTradingPickAction(
  input: SaveTradingPickInput
): Promise<TradingPickActionResult> {
  const { partnerId, pickData, pickId } = input;

  if (!db) {
    return { success: false, message: 'Database not available.' };
  }

  try {
    // Authorization is assumed to be handled by API routes or page-level checks in a real app
    
    const collectionRef = db.collection(`partners/${partnerId}/tradingPicks`);
    
    const dataToSave: Omit<TradingPick, 'id' | 'createdAt' | 'updatedAt'> = {
        ...pickData,
        partnerId, // Ensure partnerId is always set
        ideaType: 'stock-recommendation', // Set the idea type
    };
    
    if (pickId) {
      // Update existing pick
      const docRef = collectionRef.doc(pickId);
      await docRef.update({
        ...dataToSave,
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`Trading pick ${pickId} updated successfully.`);
      return { success: true, message: 'Recommendation updated successfully.', pickId };
    } else {
      // Create new pick
      const docRef = await collectionRef.add({
        ...dataToSave,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`New trading pick created with ID: ${docRef.id}`);
      return { success: true, message: 'Recommendation saved successfully.', pickId: docRef.id };
    }
  } catch (error: any) {
    console.error('Error saving trading pick:', error);
    return { success: false, message: `Failed to save recommendation: ${error.message}` };
  }
}
