import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({
        success: false,
        message: 'Database not configured'
      }, { status: 500 });
    }

    const mappingsSnapshot = await db.collection('twilioPhoneMappings').get();
    
    const mappings = mappingsSnapshot.docs.map(doc => ({
      phoneNumber: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      success: true,
      mappings,
      count: mappings.length
    });

  } catch (error: any) {
    console.error('Error fetching mappings:', error);
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}
