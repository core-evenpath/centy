// src/app/api/webhooks/twilio/sms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { TwilioSMSWebhookPayload, SMSMessage, SMSConversation } from '@/lib/types';

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
 * Get partnerId from the Twilio phone number the message was sent TO.
 */
async function getPartnerIdFromPhone(toPhone: string): Promise<string> {
  if (!db) {
    console.warn('Database not configured, using default partnerId for SMS');
    return 'system';
  }

  try {
    console.log('🔍 [SMS] Looking up partner for Twilio number:', toPhone);
    
    const partnersRef = db.collection('partners');
    // CORRECT: Use admin SDK query syntax
    const snapshot = await partnersRef.where("phone", "==", toPhone).limit(1).get();

    if (!snapshot.empty) {
      const partnerDoc = snapshot.docs[0];
      const partnerId = partnerDoc.id;
      console.log(`✅ [SMS] Found partner '${partnerDoc.data().name}' (ID: ${partnerId}) for number ${toPhone}`);
      return partnerId;
    }
    
    console.warn(`⚠️ [SMS] No partner found with phone number ${toPhone}, using 'system' as partnerId`);
    return 'system';

  } catch (error) {
    console.error('❌ [SMS] Error fetching partner by phone number:', error);
    return 'system';
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

  // Get partnerId from phone mapping
  const partnerId = await getPartnerIdFromPhone(toPhone);

  // Find or create conversation
  let conversationId: string;
  const conversationsSnapshot = await db
    .collection('smsConversations')
    .where('customerPhone', '==', fromPhone)
    .where('partnerId', '==', partnerId)
    .limit(1)
    .get();

  if (conversationsSnapshot.empty) {
    // Create new conversation
    const conversationRef = db.collection('smsConversations').doc();
    conversationId = conversationRef.id;

    const newConversation: Partial<SMSConversation> = {
      id: conversationId,
      partnerId: partnerId, // Use the looked-up partnerId
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
    };
    
    await conversationRef.set(newConversation);

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
    partnerId: partnerId, // Ensure partnerId is stored
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
    (messageData as any).attachments = [{
      id: messageRef.id,
      type: 'image',
      name: 'media',
      url: payload.MediaUrl0,
      size: 0,
      mimeType: payload.MediaContentType0 || 'image/jpeg',
    }];
  }

  await messageRef.set(messageData);

  console.log('Stored incoming SMS message:', messageRef.id, 'for partnerId:', partnerId);
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
