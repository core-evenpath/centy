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
      version: 'v20-final-fix'
    });
  } catch (err) {
    console.error('Failed to log webhook call:', err);
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    success: true,
    message: 'WhatsApp webhook active',
    timestamp: new Date().toISOString(),
    version: 'v20-final-fix'
  });
}

export async function POST(request: NextRequest) {
  let payload: Record<string, string> = {};
  
  try {
    const formData = await request.formData();
    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });
    
    if (!db) throw new Error('Database not configured');

    if (payload.MessageStatus) {
      await logWebhookCall(payload, true, 'Status update received, skipping processing.');
      return NextResponse.json({ success: true, message: 'Status update received' });
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

    // --- Definitive Fix: Separate logic for media vs. text ---
    
    const numMedia = parseInt(payload.NumMedia || '0');
    let messageRef;

    if (numMedia > 0) {
      // Logic for messages WITH media
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
          twilioStatus: 'received' as const,
          to: payload.To,
          from: payload.From,
          errorCode: null,
          errorMessage: null,
          numMedia: numMedia,
          mediaUrls: [mediaUrl],
        },
      };
      messageRef = await db.collection('whatsappMessages').add(messageData);

    } else {
      // Logic for text-only messages
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
          twilioStatus: 'received' as const,
          to: payload.To,
          from: payload.From,
          errorCode: null,
          errorMessage: null,
        },
        // No 'attachments' or 'mediaUrls' fields are created
      };
      messageRef = await db.collection('whatsappMessages').add(messageData);
    }

    await logWebhookCall(payload, true);

    return NextResponse.json({ 
      success: true, 
      message: 'Message processed',
      messageId: messageRef.id,
      conversationId: conversationId
    });

  } catch (error: any) {
    console.error('❌ Webhook Error:', error.message);
    await logWebhookCall(payload, false, error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
