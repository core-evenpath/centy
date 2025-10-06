// src/app/api/admin/phone-mappings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface TwilioPhoneMapping {
  phoneNumber: string; // Format: whatsapp:+1234567890
  partnerId: string;
  partnerName?: string;
  platform: 'whatsapp' | 'sms';
  createdAt: any;
  updatedAt?: any;
}

/**
 * GET - List all phone mappings
 */
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const snapshot = await db.collection('twilioPhoneMappings').get();
    const mappings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ success: true, mappings });
  } catch (error: any) {
    console.error('Error fetching phone mappings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST - Create or update a phone mapping
 */
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { phoneNumber, partnerId, platform = 'whatsapp' } = body;

    if (!phoneNumber || !partnerId) {
      return NextResponse.json(
        { error: 'phoneNumber and partnerId are required' },
        { status: 400 }
      );
    }

    // Format phone number for WhatsApp
    const formattedPhone = phoneNumber.startsWith('whatsapp:') 
      ? phoneNumber 
      : `whatsapp:${phoneNumber}`;

    // Get partner name
    let partnerName = 'Unknown Partner';
    try {
      const partnerDoc = await db.collection('partners').doc(partnerId).get();
      if (partnerDoc.exists) {
        partnerName = partnerDoc.data()?.name || partnerName;
      }
    } catch (err) {
      console.warn('Could not fetch partner name:', err);
    }

    // Create or update mapping
    const mappingRef = db.collection('twilioPhoneMappings').doc(formattedPhone);
    const existingMapping = await mappingRef.get();

    const mappingData: TwilioPhoneMapping = {
      phoneNumber: formattedPhone,
      partnerId,
      partnerName,
      platform,
      createdAt: existingMapping.exists ? existingMapping.data()?.createdAt : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await mappingRef.set(mappingData, { merge: true });

    console.log(`✅ Phone mapping created/updated: ${formattedPhone} → ${partnerId}`);

    return NextResponse.json({
      success: true,
      message: 'Phone mapping created successfully',
      mapping: {
        id: formattedPhone,
        ...mappingData
      }
    });
  } catch (error: any) {
    console.error('Error creating phone mapping:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE - Remove a phone mapping
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'phoneNumber is required' },
        { status: 400 }
      );
    }

    // Format phone number
    const formattedPhone = phoneNumber.startsWith('whatsapp:') 
      ? phoneNumber 
      : `whatsapp:${phoneNumber}`;

    await db.collection('twilioPhoneMappings').doc(formattedPhone).delete();

    console.log(`✅ Phone mapping deleted: ${formattedPhone}`);

    return NextResponse.json({
      success: true,
      message: 'Phone mapping deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting phone mapping:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}