// src/app/api/webhooks/twilio/whatsapp/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { WhatsAppMessage } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function logWebhookCall(payload: any, success: boolean, error?: string) {
  try {
    if (!db) return;
    
    await db.collection('webhookLogs').add({
      platform: 'whatsapp',
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
    message: 'WhatsApp webhook active',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  let payload: Record<string, string> = {};
  
  try {
    const formData = await request.formData();
    formData.forEach((value, key) => { payload[key] = value.toString(); });
    
    if (payload.MessageStatus) {
      await logWebhookCall(payload, true, 'Status update received, skipping processing.');
      return NextResponse.json({ success: true, message: 'Status update received' });
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
    
    console.log('🔍 Looking up partner for WhatsApp phone:', toPhone);
    
    // The 'To' number for WhatsApp comes with 'whatsapp:' prefix
    const mappingDoc = await db.collection('twilioPhoneMappings').doc(toPhone).get();
    
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

  const fromPhone = payload.From.replace('whatsapp:', '');
  const toPhone = payload.To;
  
  const partnerId = await getPartnerIdFromPhone(toPhone);

  const convoQuery = await db.collection('whatsappConversations')
    .where('customerPhone', '==', fromPhone)
    .where('partnerId', '==', partnerId)
    .limit(1)
    .get();
      
  let conversationId: string;
    
  if (convoQuery.empty) {
    const convoRef = db.collection('whatsappConversations').doc();
    conversationId = convoRef.id;
    await convoRef.set({
      id: conversationId,
      partnerId: partnerId,
      type: 'direct',
      platform: 'whatsapp',
      title: `WhatsApp: ${fromPhone}`,
      customerPhone: fromPhone,
      participants: [],
      isActive: true,
      messageCount: 1,
      createdBy: 'customer',
      createdAt: FieldValue.serverTimestamp(),
      lastMessageAt: FieldValue.serverTimestamp(),
    });
  } else {
    conversationId = convoQuery.docs[0].id;
    await convoQuery.docs[0].ref.update({
      lastMessageAt: FieldValue.serverTimestamp(),
      messageCount: FieldValue.increment(1),
    });
  }

  const numMedia = parseInt(payload.NumMedia || '0');
  
  if (numMedia > 0) {
    // Handle message with media
    const mediaUrl = payload.MediaUrl0;
    const mediaType = payload.MediaContentType0 || 'application/octet-stream';
    
    const messageData: Partial<WhatsAppMessage> = {
      conversationId,
      partnerId,
      senderId: `customer:${fromPhone}`,
      type: mediaType.startsWith('image') ? 'image' : 'file',
      content: payload.Body || '',
      direction: 'inbound',
      platform: 'whatsapp',
      isEdited: false,
      createdAt: FieldValue.serverTimestamp(),
      attachments: [{
        id: payload.MessageSid,
        type: mediaType.startsWith('image') ? 'image' : 'file',
        name: `media_attachment_${payload.MessageSid}`,
        url: mediaUrl,
        size: 0,
        mimeType: mediaType,
      }],
      whatsappMetadata: {
        twilioSid: payload.MessageSid,
        twilioStatus: 'received',
        to: payload.To,
        from: payload.From,
        errorCode: null,
        errorMessage: null,
        numMedia: numMedia,
        mediaUrls: [mediaUrl],
      },
    };
    await db.collection('whatsappMessages').add(messageData);

  } else {
    // Handle text-only message
    const messageData: Partial<WhatsAppMessage> = {
      conversationId,
      partnerId,
      senderId: `customer:${fromPhone}`,
      type: 'text',
      content: payload.Body || '',
      direction: 'inbound',
      platform: 'whatsapp',
      isEdited: false,
      createdAt: FieldValue.serverTimestamp(),
      whatsappMetadata: {
        twilioSid: payload.MessageSid,
        twilioStatus: 'received',
        to: payload.To,
        from: payload.From,
        errorCode: null,
        errorMessage: null,
      },
    };
    await db.collection('whatsappMessages').add(messageData);
  }
}
