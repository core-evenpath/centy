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
  console.log('🔔 WHATSAPP WEBHOOK CALLED AT:', new Date().toISOString());

  try {
    const formData = await request.formData();
    const payload: Partial<TwilioWebhookPayload> = {};

    formData.forEach((value, key) => {
      payload[key as keyof TwilioWebhookPayload] = value.toString();
    });

    console.log('📦 FULL PAYLOAD:', JSON.stringify(payload, null, 2));

    // Handle status callbacks
    if (payload.MessageStatus) {
      console.log('🔄 Processing status update');
      await handleStatusUpdate(payload);
      return NextResponse.json({ success: true, message: 'Status updated' });
    }

    // Handle incoming messages
    if (payload.Body && payload.From && payload.To) {
      console.log('📨 Processing incoming message');
      await handleIncomingMessage(payload as TwilioWebhookPayload);
      return NextResponse.json({ success: true, message: 'Message received' });
    }

    console.warn('⚠️ Invalid payload structure');
    return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ CRITICAL ERROR:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    return NextResponse.json(
      { success: false, message: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

/**
 * Get partnerId from Twilio phone number mapping
 * CRITICAL: This must return the correct partnerId for messages to appear in the UI
 */
async function getPartnerIdFromPhone(toPhone: string): Promise<string> {
  if (!db) {
    console.error('❌ Database not configured');
    throw new Error('Database not configured');
  }

  try {
    // The lookup ID should match the format used when creating mappings
    const lookupId = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
    console.log('🔍 [WhatsApp] Looking up phone mapping for:', lookupId);

    const mappingDoc = await db.collection('twilioPhoneMappings').doc(lookupId).get();
    
    if (mappingDoc.exists) {
      const data = mappingDoc.data();
      const partnerId = data?.partnerId;
      console.log(`✅ [WhatsApp] Found mapping for ${toPhone}: partnerId=${partnerId}`);
      
      if (!partnerId) {
        console.error(`❌ [WhatsApp] Mapping exists but partnerId is missing!`);
        throw new Error(`Phone mapping exists for ${lookupId} but partnerId is not set`);
      }
      
      return partnerId;
    }
    
    console.error(`❌ [WhatsApp] NO MAPPING FOUND for ${lookupId}`);
    console.error(`❌ This is why messages won't appear in the UI!`);
    console.error(`❌ ACTION REQUIRED: Create a mapping document at twilioPhoneMappings/${lookupId}`);
    throw new Error(`No phone mapping found for ${lookupId}. Please create a mapping in twilioPhoneMappings collection.`);
  } catch (error) {
    console.error('❌ [WhatsApp] Error fetching phone mapping:', error);
    throw error; // Don't use 'system' fallback - fail fast so the issue is visible
  }
}

/**
 * Handle incoming WhatsApp message
 */
async function handleIncomingMessage(payload: TwilioWebhookPayload) {
  if (!db) {
    throw new Error('Database not configured');
  }

  console.log('📨 Starting inbound message processing...');

  const fromPhone = payload.From.replace('whatsapp:', '');
  const toPhone = payload.To; // Keep whatsapp: prefix for lookup

  console.log('  From (customer):', fromPhone);
  console.log('  To (business):', toPhone);

  // Get partnerId - this will throw if no mapping exists
  const partnerId = await getPartnerIdFromPhone(toPhone);
  console.log('  ✅ Assigned partnerId:', partnerId);

  // Find or create conversation
  let conversationId: string;
  
  try {
    const conversationsSnapshot = await db
      .collection('whatsappConversations')
      .where('customerPhone', '==', fromPhone)
      .where('partnerId', '==', partnerId)
      .limit(1)
      .get();

    if (conversationsSnapshot.empty) {
      console.log('📝 Creating new conversation...');
      
      const conversationRef = db.collection('whatsappConversations').doc();
      conversationId = conversationRef.id;

      const newConversation = {
        id: conversationId,
        partnerId: partnerId, // CRITICAL: Use the correct partnerId
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
      
      console.log('  Conversation data:', JSON.stringify(newConversation, null, 2));
      await conversationRef.set(newConversation);
      console.log('✅ Conversation created:', conversationId);

    } else {
      conversationId = conversationsSnapshot.docs[0].id;
      console.log('📌 Using existing conversation:', conversationId);
      
      await conversationsSnapshot.docs[0].ref.update({
        lastMessageAt: FieldValue.serverTimestamp(),
        messageCount: FieldValue.increment(1),
        isActive: true,
      });
      console.log('✅ Conversation updated');
    }

    // Store incoming message in the correct collection
    console.log('💾 Storing message in whatsappMessages...');
    const messageRef = db.collection('whatsappMessages').doc();
    
    const messageData = {
      id: messageRef.id,
      conversationId: conversationId,
      partnerId: partnerId, // CRITICAL: Include partnerId so UI queries work
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

    if (payload.MediaUrl0) {
      (messageData as any).attachments = [{
        id: messageRef.id,
        type: payload.MediaContentType0?.startsWith('image') ? 'image' : 'file',
        name: 'media',
        url: payload.MediaUrl0,
        size: 0,
        mimeType: payload.MediaContentType0 || 'application/octet-stream',
      }];
    }

    await messageRef.set(messageData);
    console.log('✅ Message stored successfully:', messageRef.id);
    console.log('   - ConversationId:', conversationId);
    console.log('   - PartnerId:', partnerId);
    console.log('   - Direction: inbound');
    console.log('   - Platform: whatsapp');

  } catch (error: any) {
    console.error('❌ Error in handleIncomingMessage:', error);
    throw error;
  }
}

/**
 * Handle message status updates
 */
async function handleStatusUpdate(payload: Partial<TwilioWebhookPayload>) {
  if (!db || !payload.MessageSid || !payload.MessageStatus) {
    return;
  }

  console.log('🔄 Updating message status:', payload.MessageSid, '->', payload.MessageStatus);

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

    console.log('✅ Message status updated');
  } else {
    console.warn('⚠️ Message not found for status update');
  }
}