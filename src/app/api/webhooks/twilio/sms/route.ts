// src/app/api/webhooks/twilio/sms/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function logWebhookCall(payload: any, success: boolean, error?: string) {
  try {
    if (!db) return;
    
    await db.collection('webhookLogs').add({
      platform: 'sms',
      payload: payload,
      success: success,
      error: error || null,
      timestamp: FieldValue.serverTimestamp(),
      from: payload.From || null,
      to: payload.To || null,
      body: payload.Body || null,
      messageSid: payload.MessageSid || null,
      rawPayload: JSON.stringify(payload, null, 2)
    });
  } catch (err) {
    console.error('Failed to log webhook call:', err);
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    success: true,
    message: 'SMS webhook is active and ready',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  let payload: Record<string, string> = {};
  
  try {
    const formData = await request.formData();
    formData.forEach((value, key) => { payload[key] = value.toString(); });
    
    if (payload.MessageStatus) {
      await logWebhookCall(payload, true, 'Status update processed.');
      return NextResponse.json({ success: true, message: 'Status updated' });
    }
    
    if ((payload.Body || (payload.NumMedia && parseInt(payload.NumMedia) > 0)) && payload.From && payload.To) {
      await handleIncomingMessage(payload);
      await logWebhookCall(payload, true);
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', { status: 200, headers: { 'Content-Type': 'text/xml' } });
    }
    
    await logWebhookCall(payload, false, 'Unhandled payload type');
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', { status: 200, headers: { 'Content-Type': 'text/xml' } });
    
  } catch (error: any) {
    await logWebhookCall(payload, false, error.message);
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', { status: 200, headers: { 'Content-Type': 'text/xml' } });
  }
}

async function getPartnerIdFromPhone(toPhone: string): Promise<string> {
    if (!db) throw new Error('Database not configured');
    
    console.log('🔍 Looking up partner for SMS phone:', toPhone);
    
    // Direct lookup with the raw 'To' number from Twilio (e.g., +1234567890)
    const mappingRef = db.collection('twilioPhoneMappings').doc(toPhone);
    const mappingDoc = await mappingRef.get();
    
    if (mappingDoc.exists) {
      const partnerId = mappingDoc.data()?.partnerId;
      if (partnerId) {
        console.log('✅ Found partnerId via direct mapping:', partnerId);
        return partnerId;
      }
    }
    
    console.error('❌ No partner found with phone matching:', toPhone);
    throw new Error(`No partner mapping found for ${toPhone}. Please run the create-phone-mapping script or check your twilioPhoneMappings collection in Firestore.`);
}

async function handleIncomingMessage(payload: Record<string, string>) {
  if (!db) throw new Error('Database not configured');

  const fromPhone = payload.From;
  const toPhone = payload.To;

  const partnerId = await getPartnerIdFromPhone(toPhone);

  let conversationId: string;
  const conversationsSnapshot = await db
    .collection('smsConversations')
    .where('customerPhone', '==', fromPhone)
    .where('partnerId', '==', partnerId)
    .limit(1)
    .get();

  if (conversationsSnapshot.empty) {
    const conversationRef = db.collection('smsConversations').doc();
    conversationId = conversationRef.id;

    await conversationRef.set({
      partnerId: partnerId,
      type: 'direct',
      platform: 'sms',
      title: `SMS: ${fromPhone}`,
      customerPhone: fromPhone,
      participants: [],
      isActive: true,
      messageCount: 1,
      createdBy: 'customer',
      createdAt: FieldValue.serverTimestamp(),
      lastMessageAt: FieldValue.serverTimestamp(),
    });
  } else {
    conversationId = conversationsSnapshot.docs[0].id;
    await conversationsSnapshot.docs[0].ref.update({
      lastMessageAt: FieldValue.serverTimestamp(),
      messageCount: FieldValue.increment(1),
    });
  }

  const messageData: any = {
    conversationId,
    partnerId: partnerId,
    senderId: `customer:${fromPhone}`,
    type: payload.NumMedia && parseInt(payload.NumMedia) > 0 ? 'image' : 'text',
    content: payload.Body || '',
    direction: 'inbound',
    platform: 'sms',
    smsMetadata: {
      twilioSid: payload.MessageSid,
      twilioStatus: 'received',
      to: payload.To,
      from: payload.From,
    },
    isEdited: false,
    createdAt: FieldValue.serverTimestamp(),
  };

  if (payload.MediaUrl0) {
    messageData.attachments = [{
      id: payload.MessageSid,
      type: payload.MediaContentType0?.startsWith('image') ? 'image' : 'file',
      name: 'mms_attachment',
      url: payload.MediaUrl0,
      size: 0,
      mimeType: payload.MediaContentType0 || 'application/octet-stream',
    }];
  }

  await db.collection('smsMessages').add(messageData);
  console.log('✅ SMS: Stored incoming message for partnerId:', partnerId);
}
