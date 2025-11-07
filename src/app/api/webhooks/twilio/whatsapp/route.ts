
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { WhatsAppMessage } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const WEBHOOK_VERSION = 'v11-definitive-fix';

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
      version: WEBHOOK_VERSION
    });
  } catch (err) {
    console.error('Failed to log webhook call:', err);
  }
}

export async function GET() {
  return NextResponse.json({ 
    success: true,
    message: 'WhatsApp webhook active',
    timestamp: new Date().toISOString(),
    version: WEBHOOK_VERSION,
    route: '/api/webhooks/twilio/whatsapp'
  });
}

export async function POST(request: Request) {
  console.log(`🔔 WhatsApp Webhook ${WEBHOOK_VERSION}`);
  let payload: Record<string, string> = {};
  
  try {
    const formData = await request.formData();
    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });
    
    console.log('📦 Received:', {
      from: payload.From,
      to: payload.To,
      body: payload.Body?.substring(0, 30),
      messageSid: payload.MessageSid,
      numMedia: payload.NumMedia
    });
    
    if (!db) throw new Error('Database not configured');

    if (payload.MessageStatus) {
      console.log('Status update:', payload.MessageStatus);
      await logWebhookCall(payload, true);
      return NextResponse.json({ success: true, message: 'Status update received', version: WEBHOOK_VERSION });
    }

    if (!payload.From || !payload.To) {
      throw new Error('Missing required fields: From or To');
    }

    const fromPhone = payload.From.replace('whatsapp:', '');
    const toPhone = payload.To;
    
    const lookupId = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
    const mappingDoc = await db.collection('twilioPhoneMappings').doc(lookupId).get();
    
    if (!mappingDoc.exists) throw new Error(`No phone mapping found for ${lookupId}`);
    
    const partnerId = mappingDoc.data()?.partnerId;
    if (!partnerId) throw new Error('Phone mapping has no partnerId');

    console.log('✅ Partner ID:', partnerId);

    const convoQuery = await db.collection('whatsappConversations').where('customerPhone', '==', fromPhone).where('partnerId', '==', partnerId).limit(1).get();
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
      console.log('✨ Created conversation:', conversationId);
    } else {
      conversationId = convoQuery.docs[0].id;
      await convoQuery.docs[0].ref.update({
        lastMessageAt: FieldValue.serverTimestamp(),
        messageCount: FieldValue.increment(1),
      });
      console.log('📝 Updated conversation:', conversationId);
    }

    const numMedia = parseInt(payload.NumMedia || '0');
    
    // Construct base message data
    const messageData: Partial<WhatsAppMessage> = {
      conversationId,
      partnerId,
      senderId: `customer:${fromPhone}`,
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
        numMedia: numMedia,
        mediaUrls: [], // Always initialize as an empty array
      },
    };

    // Conditionally add media information
    if (numMedia > 0 && payload.MediaUrl0) {
      messageData.type = 'image';
      messageData.attachments = [{
        id: payload.MessageSid,
        type: payload.MediaContentType0?.startsWith('image') ? 'image' : 'file',
        name: 'whatsapp_media',
        url: payload.MediaUrl0,
        size: 0,
        mimeType: payload.MediaContentType0 || 'application/octet-stream',
      }];
      if (messageData.whatsappMetadata) {
        messageData.whatsappMetadata.mediaUrls = [payload.MediaUrl0];
      }
    } else {
      messageData.type = 'text';
    }
    
    const messageRef = await db.collection('whatsappMessages').add(messageData);
    console.log('✅ Message saved:', messageRef.id);

    await logWebhookCall(payload, true);

    return NextResponse.json({ 
      success: true, 
      message: 'Message received and saved',
      version: WEBHOOK_VERSION,
      messageId: messageRef.id,
      conversationId: conversationId
    });

  } catch (error: any) {
    console.error('❌ Webhook Error:', error.message);
    await logWebhookCall(payload, false, error.message);
    return NextResponse.json({ success: false, error: error.message, version: WEBHOOK_VERSION }, { status: 500 });
  }
}
