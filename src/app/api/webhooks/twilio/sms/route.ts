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
    .limit(1)
    .get();

  if (conversationsSnapshot.empty) {
    // Create new conversation
    const conversationRef = db.collection('smsConversations').doc();
    conversationId = conversationRef.id;

    await conversationRef.set({
      id: conversationId,
      partnerId: 'system', // You may want to route this based on business logic
      type: 'direct',
      platform: 'sms',
      title: `SMS: ${fromPhone}`,
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
  const messageRef = db.collection('smsMessages').doc();
  const messageData: Partial<SMSMessage> = {
    id: messageRef.id,
    conversationId,
    senderId: fromPhone,
    type: 'text',
    content: payload.Body || '',
    direction: 'inbound',
    platform: 'sms',
    smsMetadata: {
      twilioSid: payload.MessageSid || payload.SmsSid || '',
      twilioStatus: 'received',
      to: payload.To,
      from: payload.From,
    },
    isEdited: false,
    createdAt: FieldValue.serverTimestamp(),
  };

  await messageRef.set(messageData);

  console.log('Stored incoming SMS:', messageRef.id);
}

/**
 * Handle message status updates
 */
async function handleStatusUpdate(payload: Partial<TwilioSMSWebhookPayload>) {
  if (!db || !(payload.MessageSid || payload.SmsSid)) {
    return;
  }

  const messageSid = payload.MessageSid || payload.SmsSid;
  const status = payload.MessageStatus || payload.SmsStatus;

  if (!messageSid || !status) {
    return;
  }

  const snapshot = await db
    .collection('smsMessages')
    .where('smsMetadata.twilioSid', '==', messageSid)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    await snapshot.docs[0].ref.update({
      'smsMetadata.twilioStatus': status,
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log('Updated SMS status:', messageSid, status);
  }
}