// src/app/api/webhooks/twilio/sms/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { normalizePhoneNumber } from '@/utils/phone-utils';

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

export async function POST(request: NextRequest) {
  let payload: Record<string, string> = {};
  
  try {
    const formData = await request.formData();
    formData.forEach((value, key) => { payload[key] = value.toString(); });
    
    if (payload.MessageStatus) {
      await logWebhookCall(payload, true, 'Status update processed.');
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', { status: 200, headers: { 'Content-Type': 'text/xml' } });
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

  const normalizedPhone = normalizePhoneNumber(toPhone);
  console.log(`🔍 SMS: Looking up partner for normalized phone: ${normalizedPhone}`);

  // 1. Direct lookup in twilioPhoneMappings
  const mappingDoc = await db.collection('twilioPhoneMappings').doc(normalizedPhone).get();
  if (mappingDoc.exists) {
      const partnerId = mappingDoc.data()?.partnerId;
      if (partnerId) {
          console.log(`✅ SMS: Found partnerId via direct mapping: ${partnerId}`);
          return partnerId;
      }
  }

  // 2. Fallback to searching the partners collection (less reliable)
  const partnersSnapshot = await db.collection('partners').get();
  for (const doc of partnersSnapshot.docs) {
      const partner = doc.data();
      if (partner.phone && normalizePhoneNumber(partner.phone) === normalizedPhone) {
          console.log(`✅ SMS: Found partnerId via fallback search: ${doc.id}`);
          return doc.id;
      }
  }

  throw new Error(`No partner mapping found for ${toPhone}`);
}

async function handleIncomingMessage(payload: Record<string, string>) {
  if (!db) throw new Error('Database not configured');

  const fromPhone = normalizePhoneNumber(payload.From);
  const toPhone = normalizePhoneNumber(payload.To);
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
      partnerId,
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
    partnerId,
    senderId: `customer:${fromPhone}`,
    type: (payload.NumMedia && parseInt(payload.NumMedia) > 0) ? 'image' : 'text',
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
