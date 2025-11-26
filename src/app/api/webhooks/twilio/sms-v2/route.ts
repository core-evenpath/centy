import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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
      timestamp: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, message: 'SMS V2 received', payload });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
