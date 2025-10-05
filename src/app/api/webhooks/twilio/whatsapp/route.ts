// src/app/api/webhooks/twilio/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { TwilioWebhookPayload, WhatsAppMessage, WhatsAppConversation } from '@/lib/types';

/**
 * Twilio WhatsApp webhook endpoint
 * Receives incoming WhatsApp messages and status updates
 */
export async function POST(request: NextRequest) {
  console.log('='.repeat(80));
  console.log('🔔 WEBHOOK CALLED AT:', new Date().toISOString());
  console.log('Request URL:', request.url);
  console.log('Request Method:', request.method);

  try {
    const formData = await request.formData();
    const payload: Partial<TwilioWebhookPayload> = {};

    // Parse form data
    formData.forEach((value, key) => {
      payload[key as keyof TwilioWebhookPayload] = value.toString();
    });

    console.log('📦 RECEIVED PAYLOAD:', JSON.stringify(payload, null, 2));
    console.log('From:', payload.From);
    console.log('To:', payload.To);
    console.log('Body:', payload.Body);
    console.log('MessageSid:', payload.MessageSid);

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

    console.warn('⚠️ Invalid payload - missing required fields');
    return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ Error processing Twilio webhook:', error);
    console.error('Error stack:', error.stack);
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
    console.warn('Database not configured, using default partnerId for WhatsApp');
    return 'system';
  }

  try {
    console.log('🔍 Looking up phone mapping for:', toPhone);
    
    // WhatsApp numbers come with 'whatsapp:' prefix, use as-is for lookup
    const mappingDoc = await db.collection('twilioPhoneMappings').doc(toPhone).get();
    
    if (mappingDoc.exists) {
      const data = mappingDoc.data();
      console.log(`✅ Found mapping for ${toPhone}: partnerId=${data?.partnerId}`);
      return data?.partnerId || 'system';
    }
    
    console.warn(`⚠️ No WhatsApp mapping found for ${toPhone}, using 'system' as partnerId`);
    return 'system';
  } catch (error) {
    console.error('❌ Error fetching phone mapping for WhatsApp:', error);
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

  console.log('📨 Processing incoming WhatsApp message...');

  // Extract phone number from whatsapp:+1234567890 format
  const fromPhone = payload.From.replace('whatsapp:', '');
  const toPhone = payload.To; // Keep the 'whatsapp:' prefix for lookup

  console.log('Customer phone (from):', fromPhone);
  console.log('Business phone (to):', toPhone);

  // Get partnerId from phone mapping
  const partnerId = await getPartnerIdFromPhone(toPhone);
  console.log('Assigned partnerId:', partnerId);

  // Find or create conversation
  let conversationId: string;
  const conversationsSnapshot = await db
    .collection('whatsappConversations')
    .where('customerPhone', '==', fromPhone)
    .where('partnerId', '==', partnerId)
    .limit(1)
    .get();

  if (conversationsSnapshot.empty) {
    console.log('📝 Creating new WhatsApp conversation...');
    
    // Create new conversation
    const conversationRef = db.collection('whatsappConversations').doc();
    conversationId = conversationRef.id;

    const newConversation: Partial<WhatsAppConversation> = {
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
    };
    
    await conversationRef.set(newConversation);
    console.log('✅ Created conversation:', conversationId);

  } else {
    conversationId = conversationsSnapshot.docs[0].id;
    console.log('📌 Using existing conversation:', conversationId);
    
    await conversationsSnapshot.docs[0].ref.update({
      lastMessageAt: FieldValue.serverTimestamp(),
      messageCount: FieldValue.increment(1),
      isActive: true, // Reactivate if it was inactive
    });
    console.log('✅ Updated conversation');
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
      type: payload.MediaContentType0?.startsWith('image') ? 'image' : 'file',
      name: `media_${payload.MessageSid}`,
      url: payload.MediaUrl0,
      size: 0,
      mimeType: payload.MediaContentType0 || 'application/octet-stream',
    }];
    console.log('📎 Added media attachment:', payload.MediaUrl0);
  }

  await messageRef.set(messageData);

  console.log('✅ Stored incoming WhatsApp message:', messageRef.id);
  console.log('   - Conversation ID:', conversationId);
  console.log('   - Partner ID:', partnerId);
  console.log('   - From:', fromPhone);
  console.log('   - Content:', payload.Body);
  console.log('='.repeat(80));
}

/**
 * Handle message status updates
 */
async function handleStatusUpdate(payload: Partial<TwilioWebhookPayload>) {
  if (!db || !payload.MessageSid || !payload.MessageStatus) {
    console.warn('⚠️ Invalid status update payload');
    return;
  }

  console.log('🔄 Updating message status:', payload.MessageSid, '→', payload.MessageStatus);

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

    console.log('✅ Updated WhatsApp message status:', payload.MessageSid, payload.MessageStatus);
  } else {
    console.warn('⚠️ Message not found for status update:', payload.MessageSid);
  }
}