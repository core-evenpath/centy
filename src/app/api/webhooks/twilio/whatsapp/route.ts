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
 * Get partnerId from Twilio phone number or Messaging Service mapping
 */
async function getPartnerIdFromPhone(toPhone: string, messagingServiceSid?: string): Promise<string> {
  if (!db) {
    console.error('❌ Database not configured');
    const defaultPartnerId = process.env.DEFAULT_PARTNER_ID || process.env.NEXT_PUBLIC_DEFAULT_PARTNER_ID;
    if (defaultPartnerId) {
      console.log(`✅ Using DEFAULT_PARTNER_ID from environment: ${defaultPartnerId}`);
      return defaultPartnerId;
    }
    throw new Error('Database not configured and no DEFAULT_PARTNER_ID set');
  }

  try {
    // First, try to find mapping by Messaging Service SID if provided
    if (messagingServiceSid) {
      console.log('🔍 Looking up Messaging Service mapping for:', messagingServiceSid);
      const serviceMappingDoc = await db.collection('twilioPhoneMappings').doc(messagingServiceSid).get();
      
      if (serviceMappingDoc.exists) {
        const data = serviceMappingDoc.data();
        console.log(`✅ Found Messaging Service mapping: partnerId=${data?.partnerId}`);
        return data?.partnerId || await getDefaultPartnerId();
      }
      console.log('⚠️ No Messaging Service mapping found, trying phone number...');
    }

    // Fall back to phone number lookup
    const lookupId = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
    console.log('🔍 Looking up phone mapping for:', lookupId);
    
    const mappingDoc = await db.collection('twilioPhoneMappings').doc(lookupId).get();
    
    if (mappingDoc.exists) {
      const data = mappingDoc.data();
      console.log(`✅ Found phone mapping: partnerId=${data?.partnerId}`);
      return data?.partnerId || await getDefaultPartnerId();
    }
    
    console.warn(`⚠️ No mapping found for ${lookupId}, using default partnerId`);
    return await getDefaultPartnerId();
  } catch (error) {
    console.error('❌ Error fetching mapping:', error);
    return await getDefaultPartnerId();
  }
}

/**
 * Get the default partnerId from environment or database
 */
async function getDefaultPartnerId(): Promise<string> {
  // First, check environment variables
  const envPartnerId = process.env.DEFAULT_PARTNER_ID || process.env.NEXT_PUBLIC_DEFAULT_PARTNER_ID;
  if (envPartnerId) {
    console.log(`✅ Using DEFAULT_PARTNER_ID from environment: ${envPartnerId}`);
    return envPartnerId;
  }

  // If no environment variable, try to find the first active partner in the database
  try {
    if (db) {
      console.log('🔍 Looking for first active partner in database...');
      const partnersSnapshot = await db
        .collection('partners')
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (!partnersSnapshot.empty) {
        const firstPartner = partnersSnapshot.docs[0];
        const partnerId = firstPartner.id;
        console.log(`✅ Found first active partner: ${partnerId}`);
        return partnerId;
      }
    }
  } catch (error) {
    console.error('❌ Error fetching first partner:', error);
  }

  // Last resort: use 'system'
  console.warn('⚠️ No default partnerId found, using "system"');
  return 'system';
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
  const toPhone = payload.To;
  const messagingServiceSid = payload.MessagingServiceSid;

  console.log('  From (customer):', fromPhone);
  console.log('  To (business):', toPhone);
  console.log('  Messaging Service SID:', messagingServiceSid || 'N/A');

  // Get partnerId (checks both Messaging Service SID and phone number)
  const partnerId = await getPartnerIdFromPhone(toPhone, messagingServiceSid);
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
      console.log('  ✅ Conversation created:', conversationId);
    } else {
      conversationId = conversationsSnapshot.docs[0].id;
      console.log('  ✅ Using existing conversation:', conversationId);
      
      await conversationsSnapshot.docs[0].ref.update({
        lastMessageAt: FieldValue.serverTimestamp(),
        messageCount: FieldValue.increment(1),
      });
    }

    // Store incoming message
    console.log('💾 Saving message to database...');
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

    if (payload.MediaUrl0) {
      (messageData as any).attachments = [{
        id: messageRef.id,
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