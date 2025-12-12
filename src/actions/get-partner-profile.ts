'use server';

import { db } from '../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { Partner } from '../lib/types';

/**
 * Helper function to serialize Firestore data for client components
 * Converts Timestamp objects to ISO strings
 */
function serializeForClient(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle Firestore Timestamp
  if (obj instanceof Timestamp || (obj && typeof obj.toDate === 'function')) {
    return obj.toDate().toISOString();
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeForClient(item));
  }

  // Handle plain objects
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = serializeForClient(obj[key]);
    }
    return result;
  }

  // Return primitives as-is
  return obj;
}

export async function getPartnerProfileAction(partnerId: string): Promise<{
  success: boolean;
  message: string;
  partner?: Partner;
}> {
  if (!db) {
    return {
      success: false,
      message: "Database not available"
    };
  }

  if (!partnerId) {
    return {
      success: false,
      message: "Partner ID is required"
    };
  }

  try {
    console.log('Fetching partner profile for ID:', partnerId);

    const partnerRef = db.collection('partners').doc(partnerId);
    const partnerDoc = await partnerRef.get();

    if (!partnerDoc.exists) {
      console.log('Partner document not found for ID:', partnerId);
      return {
        success: false,
        message: "Partner profile not found"
      };
    }

    const partnerData = partnerDoc.data();
    console.log('Found partner data:', partnerData?.name || partnerData?.businessName);

    // Serialize all data to convert Firestore Timestamps to ISO strings
    const serializedData = serializeForClient(partnerData);

    const partner: Partner = {
      id: partnerDoc.id,
      ...serializedData,
    } as Partner;

    return {
      success: true,
      message: "Partner profile retrieved successfully",
      partner
    };

  } catch (error: any) {
    console.error('Error fetching partner profile:', error);
    return {
      success: false,
      message: `Failed to fetch partner profile: ${error.message}`
    };
  }
}