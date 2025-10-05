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

    console.log('Received Twilio WhatsApp webhook:', {
      From: payload.From,
      To: payload.To,
      MessageSid: payload.MessageSid,
      MessageStatus: payload.MessageStatus,
      Body: payload.Body?.substring(0, 50) + '...',
    });

    // Handle status callbacks (including read receipts)
    if (payload.MessageStatus) {
      await handleStatusUpdate(payload);
      return NextResponse.json({ success: true, message: 'Status updated' });
    }

    // Handle incoming messages
    if (payload.Body !== undefined && payload.From && payload.To) {
      await handleIncomingMessage(payload as TwilioWebhookPayload);
      return NextResponse.json({ success: true, message: 'Message received' });
    }

    return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing Twilio WhatsApp webhook:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
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
  const toPhone = payload.To.replace('whatsapp:', '');

  console.log('Processing incoming WhatsApp message:', {
    from: fromPhone,
    to: toPhone,
    messageSid: payload.MessageSid,
  });

  // Find or create conversation
  let conversationId: string;
  let partnerId: string;

  const conversationsSnapshot = await db
    .collection('whatsappConversations')
    .where('customerPhone', '==', fromPhone)
    .where('platform', '==', 'whatsapp')
    .limit(1)
    .get();

  if (conversationsSnapshot.empty) {
    // Create new conversation
    const conversationRef = db.collection('whatsappConversations').doc();
    conversationId = conversationRef.id;

    // Map Twilio WhatsApp number to partnerId
    partnerId = 'system'; // Default fallback
    
    const partnerMapping = process.env.TWILIO_WHATSAPP_TO_PARTNER_MAP;
    if (partnerMapping) {
      try {
        const mappings = JSON.parse(partnerMapping);
        // payload.To includes 'whatsapp:' prefix, so match against that
        partnerId = mappings[payload.To] || 'system';
        console.log('Mapped WhatsApp number to partnerId:', {
          whatsappNumber: payload.To,
          partnerId: partnerId,
        });
      } catch (e) {
        console.error('Error parsing TWILIO_WHATSAPP_TO_PARTNER_MAP:', e);
      }
    } else {
      console.warn('TWILIO_WHATSAPP_TO_PARTNER_MAP not configured - using "system" as partnerId');
    }

    console.log('Creating new WhatsApp conversation:', {
      conversationId,
      partnerId,
      customerPhone: fromPhone,
    });

    await conversationRef.set({
      id: conversationId,
      partnerId: partnerId,
      type: 'direct',
      platform: 'whatsapp',
      title: `WhatsApp: ${fromPhone}`,
      customerPhone: fromPhone,
      participants: [],
      isActive: true,
      messageCount: 1,
      createdBy: 'system',
      createdAt: FieldValue.serverTimestamp(),
      lastMessageAt: FieldValue.serverTimestamp(),
    });
  } else {
    // Use existing conversation
    const conversationDoc = conversationsSnapshot.docs[0];
    conversationId = conversationDoc.id;
    partnerId = conversationDoc.data().partnerId;

    console.log('Using existing WhatsApp conversation:', {
      conversationId,
      partnerId,
    });

    // Update conversation metadata
    await conversationDoc.ref.update({
      lastMessageAt: FieldValue.serverTimestamp(),
      messageCount: FieldValue.increment(1),
      isActive: true,
    });
  }

  // Store incoming message
  const messageRef = db.collection('whatsappMessages').doc();
  const hasMedia = payload.NumMedia && parseInt(payload.NumMedia) > 0;
  
  const messageData: Partial<WhatsAppMessage> = {
    id: messageRef.id,
    conversationId,
    senderId: fromPhone,
    type: hasMedia ? 'image' : 'text',
    content: payload.Body || '',
    direction: 'inbound',
    platform: 'whatsapp',
    partnerId: partnerId, // Add partnerId to message for proper access control
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

  console.log('Stored incoming WhatsApp message:', {
    messageId: messageRef.id,
    conversationId,
    hasMedia,
  });
}

/**
 * Handle message status updates (including read receipts)
 */
async function handleStatusUpdate(payload: Partial<TwilioWebhookPayload>) {
  if (!db || !payload.MessageSid || !payload.MessageStatus) {
    return;
  }

  console.log('Processing WhatsApp status update:', {
    messageSid: payload.MessageSid,
    status: payload.MessageStatus,
  });

  const snapshot = await db
    .collection('whatsappMessages')
    .where('whatsappMetadata.twilioSid', '==', payload.MessageSid)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const updateData: any = {
      'whatsappMetadata.twilioStatus': payload.MessageStatus,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Add error information if present
    if (payload.ErrorCode) {
      updateData['whatsappMetadata.errorCode'] = payload.ErrorCode;
      updateData['whatsappMetadata.errorMessage'] = `Error ${payload.ErrorCode}`;
    }

    await snapshot.docs[0].ref.update(updateData);

    console.log('Updated WhatsApp message status:', {
      messageSid: payload.MessageSid,
      newStatus: payload.MessageStatus,
    });

    // Log read receipts specifically
    if (payload.MessageStatus === 'read') {
      console.log('WhatsApp message read by recipient:', payload.MessageSid);
    }
  } else {
    console.warn('Message not found for status update:', payload.MessageSid);
  }
}

/**
 * Verify Twilio webhook signature (implement for production security)
 */
function verifyTwilioSignature(request: NextRequest): boolean {
  // TODO: Implement Twilio webhook signature validation
  // const twilioSignature = request.headers.get('x-twilio-signature');
  // const url = request.url;
  // Use Twilio's validateRequest method
  // import { validateRequest } from 'twilio';
  // return validateRequest(authToken, twilioSignature, url, params);
  
  return true; // For development - implement proper validation in production
}