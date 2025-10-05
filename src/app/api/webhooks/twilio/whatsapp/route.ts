// src/app/api/webhooks/twilio/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { TwilioWebhookPayload, WhatsAppMessage } from '@/lib/types';

/**
 * Twilio WhatsApp webhook endpoint
 * Receives incoming WhatsApp messages and status updates
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const payload: Partial<TwilioWebhookPayload> = {};

    // Parse form data
    formData.forEach((value, key) => {
      payload[key as keyof TwilioWebhookPayload] = value.toString();
    });

    console.log('Received Twilio webhook:', payload);

    // Handle status callbacks
    if (payload.MessageStatus) {
      await handleStatusUpdate(payload);
      return NextResponse.json({ success: true, message: 'Status updated' });
    }

    // Handle incoming messages
    if (payload.Body && payload.From && payload.To) {
      await handleIncomingMessage(payload as TwilioWebhookPayload);
      return NextResponse.json({ success: true, message: 'Message received' });
    }

    return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing Twilio webhook:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get partnerId from Twilio phone number mapping
 */
async function getPartnerIdFromPhone(toPhone: string): Promise<string> {
  if (!db) {
    console.warn('Database not configured, using default partnerId');
    return 'system';
  }

  try {
    const mappingDoc = await db.collection('twilioPhoneMappings').doc(toPhone).get();
    
    if (mappingDoc.exists) {
      const data = mappingDoc.data();
      return data?.partnerId || 'system';
    }
    
    console.warn(`No mapping found for ${toPhone}, using 'system' as partnerId`);
    return 'system';
  } catch (error) {
    console.error('Error fetching phone mapping:', error);
    return 'system';
  }
}

/**
 * Handle incoming WhatsApp message
 */
async function handleIncomingMessage(payload: TwilioWebhookPayload) {
  if (!db) {
    throw new Error('Database not configured');
  }

  // Extract phone number from whatsapp:+1234567890 format
  const fromPhone = payload.From.replace('whatsapp:', '');
  const toPhone = payload.To; // Keep the whatsapp: prefix for mapping lookup

  // Get partnerId from phone mapping
  const partnerId = await getPartnerIdFromPhone(toPhone);

  // Find or create conversation
  let conversationId: string;
  const conversationsSnapshot = await db
    .collection('whatsappConversations')
    .where('customerPhone', '==', fromPhone)
    .where('partnerId', '==', partnerId)
    .limit(1)
    .get();

  if (conversationsSnapshot.empty) {
    // Create new conversation
    const conversationRef = db.collection('whatsappConversations').doc();
    conversationId = conversationRef.id;

    await conversationRef.set({
      id: conversationId,
      partnerId: partnerId,
      type: 'direct',
      platform: 'whatsapp',
      title: `WhatsApp: ${fromPhone}`,
      customerPhone: fromPhone,
      participants: [],
      isActive: true,
      messageCount: 0,
      createdBy: 'system',
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

  // Store incoming message
  const messageRef = db.collection('whatsappMessages').doc();
  const messageData: Partial<WhatsAppMessage> = {
    id: messageRef.id,
    conversationId,
    senderId: fromPhone,
    type: payload.NumMedia && parseInt(payload.NumMedia) > 0 ? 'image' : 'text',
    content: payload.Body || '',
    direction: 'inbound',
    platform: 'whatsapp',
    whatsappMetadata: {
      twilioSid: payload.MessageSid,
      twilioStatus: 'received',
      to: payload.To,
      from: payload.From,
      numMedia: payload.NumMedia ? parseInt(payload.NumMedia) : 0,
      mediaUrls: payload.MediaUrl0 ? [payload.MediaUrl0] : undefined,
    },
    isEdited: false,
    createdAt: FieldValue.serverTimestamp(),
  };

  // Add media attachments if present
  if (payload.MediaUrl0) {
    messageData.attachments = [{
      id: messageRef.id,
      type: 'image',
      name: 'media',
      url: payload.MediaUrl0,
      size: 0,
      mimeType: payload.MediaContentType0 || 'image/jpeg',
    }];
  }

  await messageRef.set(messageData);

  console.log('Stored incoming WhatsApp message:', messageRef.id, 'for partnerId:', partnerId);
}

/**
 * Handle message status updates
 */
async function handleStatusUpdate(payload: Partial<TwilioWebhookPayload>) {
  if (!db || !payload.MessageSid || !payload.MessageStatus) {
    return;
  }

  const snapshot = await db
    .collection('whatsappMessages')
    .where('whatsappMetadata.twilioSid', '==', payload.MessageSid)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    await snapshot.docs[0].ref.update({
      'whatsappMetadata.twilioStatus': payload.MessageStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log('Updated message status:', payload.MessageSid, payload.MessageStatus);
  }
}
