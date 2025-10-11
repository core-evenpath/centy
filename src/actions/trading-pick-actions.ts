// src/actions/trading-pick-actions.ts
'use server';

import { db, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { TradingPick } from '@/lib/types';
import { headers } from 'next/headers';

interface SaveTradingPickInput {
  partnerId: string;
  pickData: Omit<TradingPick, 'partnerId' | 'id' | 'createdAt' | 'updatedAt'>;
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
    const headersList = headers();
    const authHeader = headersList.get('authorization') || '';
    
    if (!authHeader.startsWith('Bearer ')) {
      return { success: false, message: 'Authentication required.' };
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      return { success: false, message: 'Invalid authentication token.' };
    }

    // Authorization check
    const isPartnerAdmin = decodedToken.role === 'partner_admin' && decodedToken.partnerId === partnerId;
    const isSuperAdmin = ['Super Admin', 'Admin'].includes(decodedToken.role);
    
    if (!isPartnerAdmin && !isSuperAdmin) {
      return { success: false, message: 'Insufficient permissions.' };
    }
    
    const collectionRef = db.collection(`partners/${partnerId}/tradingPicks`);
    
    if (pickId) {
      // Update existing pick
      const docRef = collectionRef.doc(pickId);
      await docRef.update({
        ...pickData,
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log(`Trading pick ${pickId} updated successfully.`);
      return { success: true, message: 'Recommendation updated successfully.', pickId };
    } else {
      // Create new pick
      const docRef = await collectionRef.add({
        ...pickData,
        partnerId, // Ensure partnerId is set
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
