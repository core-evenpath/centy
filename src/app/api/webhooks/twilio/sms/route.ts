// src/app/api/webhooks/twilio/sms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { TwilioSMSWebhookPayload, SMSMessage } from '@/lib/types';

/**
 * Twilio SMS webhook endpoint
 * Receives incoming SMS messages and status updates
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const payload: Partial<TwilioSMSWebhookPayload> = {};

    // Parse form data
    formData.forEach((value, key) => {
      payload[key as keyof TwilioSMSWebhookPayload] = value.toString();
    });

    console.log('Received Twilio SMS webhook:', payload);

    // Handle status callbacks
    if (payload.MessageStatus || payload.SmsStatus) {
      await handleStatusUpdate(payload);
      return NextResponse.json({ success: true, message: 'Status updated' });
    }

    // Handle incoming messages
    if (payload.Body && payload.From && payload.To) {
      await handleIncomingMessage(payload as TwilioSMSWebhookPayload);
      return NextResponse.json({ success: true, message: 'Message received' });
    }

    return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing Twilio SMS webhook:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle incoming SMS message
 */
async function handleIncomingMessage(payload: TwilioSMSWebhookPayload) {
  if (!db) {
    throw new Error('Database not configured');
  }

  const fromPhone = payload.From;
  const toPhone = payload.To;

  // Find or create conversation
  let conversationId: string;
  const conversationsSnapshot = await db
    .collection('smsConversations')
    .where('customerPhone', '==', fromPhone)
    .where('partnerId', '!=', 'system') // Exclude system conversations
    .limit(1)
    .get();

  if (conversationsSnapshot.empty) {
    // Create new conversation - need to determine partnerId from the receiving number
    const conversationRef = db.collection('smsConversations').doc();
    conversationId = conversationRef.id;

    // Try to find partner by their Twilio number
    let partnerId = 'system'; // Default fallback
    
    // You can implement logic here to map Twilio numbers to partners
    // For now, using 'system' as default or extracting from environment
    const partnerMapping = process.env.TWILIO_PHONE_TO_PARTNER_MAP;
    if (partnerMapping) {
      try {
        const mappings = JSON.parse(partnerMapping);
        partnerId = mappings[toPhone] || 'system';
      } catch (e) {
        console.error('Error parsing partner mapping:', e);
      }
    }

    await conversationRef.set({
      id: conversationId,
      partnerId: partnerId,
      type: 'direct',
      platform: 'sms',
      title: `SMS: ${fromPhone}`,
      customerPhone: fromPhone,
      participants: [],
      isActive: true,
      messageCount: 1,
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
  const messageRef = db.collection('smsMessages').doc();
  const messageData: Partial<SMSMessage> = {
    id: messageRef.id,
    conversationId,
    senderId: fromPhone,
    type: payload.NumMedia && parseInt(payload.NumMedia) > 0 ? 'image' : 'text',
    content: payload.Body || '',
    direction: 'inbound',
    platform: 'sms',
    smsMetadata: {
      twilioSid: payload.MessageSid,
      twilioStatus: 'delivered',
      to: payload.To,
      from: payload.From,
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

  console.log('Stored incoming SMS message:', messageRef.id);
}

/**
 * Handle message status updates
 */
async function handleStatusUpdate(payload: Partial<TwilioSMSWebhookPayload>) {
  if (!db || !payload.MessageSid) {
    return;
  }

  const status = payload.MessageStatus || payload.SmsStatus;
  if (!status) {
    return;
  }

  const snapshot = await db
    .collection('smsMessages')
    .where('smsMetadata.twilioSid', '==', payload.MessageSid)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const updateData: any = {
      'smsMetadata.twilioStatus': status,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Add error information if present
    if (payload.ErrorCode) {
      updateData['smsMetadata.errorCode'] = payload.ErrorCode;
      updateData['smsMetadata.errorMessage'] = `Error ${payload.ErrorCode}`;
    }

    await snapshot.docs[0].ref.update(updateData);

    console.log('Updated SMS message status:', payload.MessageSid, status);
  }
}

/**
 * Verify Twilio webhook signature (optional but recommended for production)
 */
function verifyTwilioSignature(request: NextRequest): boolean {
  // Implementation would use Twilio's webhook signature validation
  // const twilioSignature = request.headers.get('x-twilio-signature');
  // const url = request.url;
  // const params = Object.fromEntries(request.formData());
  // return twilio.validateRequest(authToken, twilioSignature, url, params);
  
  // For now, return true - implement proper validation in production
  return true;
}