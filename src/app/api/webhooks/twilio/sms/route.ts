// src/app/api/webhooks/twilio/sms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue, query, where, getDocs, limit, collection, doc, setDoc, updateDoc, addDoc } from 'firebase-admin/firestore';
import type { TwilioSMSWebhookPayload, SMSMessage, SMSConversation } from '@/lib/types';

/**
 * Get partnerId from the Twilio phone number the message was sent TO.
 */
async function getPartnerIdFromPhone(toPhone: string): Promise<string> {
  console.log('🔍 [SMS] Looking up partner for Twilio number:', toPhone);
  if (!db) {
    console.error('❌ [SMS] Firestore is not initialized.');
    return 'system_default'; // A default that won't match any partner
  }

  const partnersRef = collection(db, 'partners');
  const q = query(partnersRef, where('phone', '==', toPhone), limit(1));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const partnerId = snapshot.docs[0].id;
    console.log(`✅ [SMS] Found partnerId '${partnerId}' for number ${toPhone}`);
    return partnerId;
  } else {
    console.warn(`⚠️ [SMS] No partner found for number ${toPhone}. Message will not be associated with a partner.`);
    return 'system_default';
  }
}

/**
 * Twilio SMS webhook endpoint
 * Receives incoming SMS messages and status updates
 */
export async function POST(request: NextRequest) {
  console.log('='.repeat(80));
  console.log('🔔 SMS WEBHOOK CALLED AT:', new Date().toISOString());
  try {
    const formData = await request.formData();
    const payload: Partial<TwilioSMSWebhookPayload> = {};

    // Parse form data
    formData.forEach((value, key) => {
      payload[key as keyof TwilioSMSWebhookPayload] = value.toString();
    });

    console.log('📦 SMS PAYLOAD:', JSON.stringify(payload, null, 2));

    // Handle status callbacks
    if (payload.MessageStatus || payload.SmsStatus) {
      console.log('🔄 SMS: Processing status update');
      await handleStatusUpdate(payload);
      return NextResponse.json({ success: true, message: 'Status updated' });
    }

    // Handle incoming messages
    if (payload.Body && payload.From && payload.To) {
      console.log('📨 SMS: Processing incoming message');
      await handleIncomingMessage(payload as TwilioSMSWebhookPayload);
      return NextResponse.json({ success: true, message: 'Message received' });
    }

    console.warn('⚠️ SMS: Invalid payload structure');
    return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ SMS: CRITICAL ERROR:', error);
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

  // Get partnerId from phone mapping
  const partnerId = await getPartnerIdFromPhone(toPhone);
  if (partnerId === 'system_default') {
      console.error(`Could not find partner for inbound message to ${toPhone}. Aborting.`);
      return;
  }

  // Find or create conversation
  let conversationId: string;
  const conversationsRef = collection(db, 'smsConversations');
  const q = query(
      conversationsRef,
      where('customerPhone', '==', fromPhone),
      where('partnerId', '==', partnerId),
      limit(1)
  );
  const conversationsSnapshot = await getDocs(q);

  if (conversationsSnapshot.empty) {
    // Create new conversation
    const conversationRef = doc(collection(db, 'smsConversations'));
    conversationId = conversationRef.id;

    const newConversation: Partial<SMSConversation> = {
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
    };
    
    await setDoc(conversationRef, newConversation);
  } else {
    const conversationDoc = conversationsSnapshot.docs[0];
    conversationId = conversationDoc.id;
    await updateDoc(conversationDoc.ref, {
      lastMessageAt: FieldValue.serverTimestamp(),
      messageCount: FieldValue.increment(1),
    });
  }

  // Store incoming message
  const messageData: Partial<SMSMessage> = {
    conversationId,
    partnerId: partnerId, // Ensure partnerId is stored
    senderId: fromPhone,
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

  // Add media attachments if present
  if (payload.MediaUrl0) {
    (messageData as any).attachments = [{
      type: 'image',
      name: 'media',
      url: payload.MediaUrl0,
      size: 0,
      mimeType: payload.MediaContentType0 || 'image/jpeg',
    }];
  }

  await addDoc(collection(db, 'smsMessages'), messageData);
  console.log('✅ SMS: Stored incoming message for partnerId:', partnerId);
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
  
  const messagesRef = collection(db, 'smsMessages');
  const q = query(
      messagesRef,
      where('smsMetadata.twilioSid', '==', payload.MessageSid),
      limit(1)
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const messageDoc = snapshot.docs[0];
    const updateData: any = {
      'smsMetadata.twilioStatus': status,
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Add error information if present
    if (payload.ErrorCode) {
      updateData['smsMetadata.errorCode'] = payload.ErrorCode;
      updateData['smsMetadata.errorMessage'] = `Error ${payload.ErrorCode}`;
    }

    await updateDoc(messageDoc.ref, updateData);
    console.log('✅ SMS: Updated message status:', payload.MessageSid, status);
  } else {
    console.warn('⚠️ SMS: Message SID not found for status update:', payload.MessageSid);
  }
}
