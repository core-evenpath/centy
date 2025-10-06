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
 * Get partnerId from the Twilio WhatsApp number the message was sent TO using the environment map.
 */
async function getPartnerIdFromPhone(toPhone: string): Promise<string> {
    console.log('🔍 [WhatsApp] Looking up partner for Twilio number:', toPhone);
    const mappingStr = process.env.TWILIO_WHATSAPP_TO_PARTNER_MAP;
  
    if (!mappingStr) {
      console.error('❌ [WhatsApp] TWILIO_WHATSAPP_TO_PARTNER_MAP environment variable is not set.');
      return 'system';
    }
  
    try {
      const mapping = JSON.parse(mappingStr);
      const partnerId = mapping[toPhone];
  
      if (partnerId) {
        console.log(`✅ [WhatsApp] Found partnerId '${partnerId}' for number ${toPhone}`);
        return partnerId;
      } else {
        console.warn(`⚠️ [WhatsApp] No partner found in map for number ${toPhone}. Using 'system'.`);
        return 'system';
      }
    } catch (error) {
      console.error('❌ [WhatsApp] Failed to parse TWILIO_WHATSAPP_TO_PARTNER_MAP. Ensure it is valid JSON.', error);
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

  console.log('📨 Starting inbound message processing...');

  const fromPhone = payload.From.replace('whatsapp:', '');
  const toPhone = payload.To; // Keep the 'whatsapp:' prefix for lookup

  console.log('  From (customer):', fromPhone);
  console.log('  To (business):', toPhone);

  // Get partnerId from phone mapping
  const partnerId = await getPartnerIdFromPhone(toPhone);
  console.log('  Assigned partnerId:', partnerId);

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
        partnerId: partnerId, // Use the looked-up partnerId
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
    
    const messageData: Partial<WhatsAppMessage> = {
      conversationId: conversationId,
      partnerId: partnerId, // CRITICAL: Include partnerId
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
        type: payload.MediaContentType0?.startsWith('image') ? 'image' : 'file',
        name: `media_${payload.MessageSid}`,
        url: payload.MediaUrl0,
        size: 0,
        mimeType: payload.MediaContentType0 || 'application/octet-stream',
      }];
    }

    console.log('  Message data:', JSON.stringify(messageData, null, 2));
    await messageRef.set(messageData);
    
    console.log('✅ SUCCESS - Message saved:', messageRef.id);
    console.log('='.repeat(80));

  } catch (error: any) {
    console.error('❌ ERROR in handleIncomingMessage:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

/**
 * Handle message status updates
 */
async function handleStatusUpdate(payload: Partial<TwilioWebhookPayload>) {
  if (!db || !payload.MessageSid || !payload.MessageStatus) {
    console.warn('⚠️ Invalid status update payload');
    return;
  }

  try {
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
      console.log('✅ Status updated');
    } else {
      console.warn('⚠️ Message not found:', payload.MessageSid);
    }
  } catch (error) {
    console.error('❌ Error updating status:', error);
  }
}
