import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const payload: any = {};
    formData.forEach((value, key) => { payload[key] = value.toString(); });

    console.log('SMS V2:', payload);

    await db.collection('webhookLogs').add({
      platform: 'sms-v2',
      payload,
      success: true,
      timestamp: admin.firestore.Timestamp.now(),
    });

    return NextResponse.json({ success: true, message: 'SMS V2 received', payload });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
