// src/app/api/webhooks/twilio/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { TwilioWebhookPayload, WhatsAppMessage, WhatsAppConversation } from '@/lib/types';

/**
 * Twilio WhatsApp webhook endpoint
 * Receives incoming WhatsApp messages and status updates
 * 
 * Configure in Twilio Console:
 * Webhook URL: https://your-domain.vercel.app/api/webhooks/twilio/whatsapp
 * Method: POST
 */
export async function POST(request: NextRequest) {
  console.log('='.repeat(80));
  console.log('🔔 WHATSAPP WEBHOOK CALLED AT:', new Date().toISOString());
  console.log('🚨 WEBHOOK IS ALIVE! Request received from Twilio');

  try {
    // Parse Twilio's form data
    const formData = await request.formData();
    const payload: Partial<TwilioWebhookPayload> = {};

    formData.forEach((value, key) => {
      payload[key as keyof TwilioWebhookPayload] = value.toString();
    });

    console.log('📦 FULL PAYLOAD:', JSON.stringify(payload, null, 2));

    // Validate database connection
    if (!db) {
      console.error('❌ Database not configured!');
      return NextResponse.json(
        { success: false, message: 'Database not configured' },
        { status: 500 }
      );
    }

    // Handle status callbacks (delivery receipts, read receipts, etc.)
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

    console.warn('⚠️ Invalid payload structure - missing required fields');
    console.warn('Expected: Body, From, To OR MessageStatus');
    return NextResponse.json(
      { success: false, message: 'Invalid payload - missing required fields' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('❌ CRITICAL ERROR in webhook handler:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        error: error.name,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Get partnerId from Twilio phone number mapping
 * 
 * CRITICAL: This function determines which partner/organization receives the message.
 * Without a valid mapping, messages cannot be attributed to the correct organization.
 * 
 * Required Firestore structure:
 * Collection: twilioPhoneMappings
 * Document ID: whatsapp:+14155238886 (your Twilio number with whatsapp: prefix)
 * Fields: { phoneNumber, partnerId, partnerName, createdAt, updatedAt }
 */
async function getPartnerIdFromPhone(toPhone: string): Promise<string> {
  if (!db) {
    console.error('❌ Database not configured');
    throw new Error('Database not configured');
  }

  try {
    // Normalize the phone number format for lookup
    // Twilio sends: "whatsapp:+14155238886"
    const lookupId = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
    
    console.log('🔍 [WhatsApp] Looking up phone mapping...');
    console.log('   Lookup ID:', lookupId);
    console.log('   Collection: twilioPhoneMappings');
    console.log('   Document ID:', lookupId);

    const mappingDoc = await db.collection('twilioPhoneMappings').doc(lookupId).get();
    
    if (mappingDoc.exists) {
      const data = mappingDoc.data();
      const partnerId = data?.partnerId;
      const partnerName = data?.partnerName || 'Unknown';
      
      console.log('✅ [WhatsApp] Phone mapping found!');
      console.log('   Partner ID:', partnerId);
      console.log('   Partner Name:', partnerName);
      
      if (!partnerId) {
        console.error('❌ [WhatsApp] CRITICAL: Mapping exists but partnerId field is missing!');
        console.error('   Document data:', JSON.stringify(data, null, 2));
        throw new Error(`Phone mapping exists for ${lookupId} but partnerId field is not set. Please update the document.`);
      }
      
      return partnerId;
    }
    
    // No mapping found - this is the most common issue!
    console.error('❌ [WhatsApp] NO PHONE MAPPING FOUND!');
    console.error('   Searched for document ID:', lookupId);
    console.error('   Collection: twilioPhoneMappings');
    console.error('');
    console.error('🔧 TO FIX THIS ISSUE:');
    console.error('   1. Go to Firebase Console → Firestore');
    console.error('   2. Navigate to "twilioPhoneMappings" collection');
    console.error('   3. Create a new document:');
    console.error(`      Document ID: ${lookupId}`);
    console.error('      Fields:');
    console.error(`        - phoneNumber: "${lookupId}"`);
    console.error('        - partnerId: "your-partner-id-from-partners-collection"');
    console.error('        - partnerName: "Your Company Name"');
    console.error('        - createdAt: [timestamp]');
    console.error('        - updatedAt: [timestamp]');
    console.error('');
    
    throw new Error(
      `No phone mapping found for ${lookupId}. ` +
      `Please create a mapping document in the twilioPhoneMappings collection. ` +
      `See server logs for detailed instructions.`
    );
    
  } catch (error: any) {
    console.error('❌ [WhatsApp] Error fetching phone mapping:', error.message);
    throw error; // Re-throw to be caught by the main handler
  }
}

/**
 * Handle incoming WhatsApp message
 * 
 * Process flow:
 * 1. Extract and normalize phone numbers
 * 2. Look up partnerId from phone mapping
 * 3. Find or create conversation
 * 4. Store message with all required fields
 */
async function handleIncomingMessage(payload: TwilioWebhookPayload) {
  if (!db) {
    throw new Error('Database not configured');
  }

  console.log('');
  console.log('📨 ============ PROCESSING INBOUND MESSAGE ============');
  console.log('');

  // Extract phone numbers
  // From: whatsapp:+918008968303 (customer)
  // To: whatsapp:+14155238886 (your business Twilio number)
  const fromPhone = payload.From.replace('whatsapp:', '');
  const toPhone = payload.To; // Keep whatsapp: prefix for mapping lookup

  console.log('📞 Phone Numbers:');
  console.log('   From (Customer):', fromPhone);
  console.log('   To (Business):', toPhone);

  // CRITICAL: Get the partnerId - this determines which organization gets the message
  const partnerId = await getPartnerIdFromPhone(toPhone);
  console.log('');
  console.log('🏢 Partner Assignment:');
  console.log('   Partner ID:', partnerId);

  // Find or create conversation
  let conversationId: string;
  
  try {
    console.log('');
    console.log('💬 Looking for existing conversation...');
    console.log('   Query: whatsappConversations');
    console.log('   Where: customerPhone ==', fromPhone);
    console.log('   And: partnerId ==', partnerId);

    const conversationsSnapshot = await db
      .collection('whatsappConversations')
      .where('customerPhone', '==', fromPhone)
      .where('partnerId', '==', partnerId)
      .limit(1)
      .get();

    if (conversationsSnapshot.empty) {
      console.log('');
      console.log('📝 No existing conversation found. Creating new one...');
      
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
      
      console.log('   Conversation ID:', conversationId);
      console.log('   Partner ID:', partnerId);
      console.log('   Customer Phone:', fromPhone);
      console.log('   Platform: whatsapp');
      
      await conversationRef.set(newConversation);
      console.log('✅ Conversation created successfully');

    } else {
      conversationId = conversationsSnapshot.docs[0].id;
      console.log('');
      console.log('📌 Found existing conversation');
      console.log('   Conversation ID:', conversationId);
      
      // Update conversation metadata
      await conversationsSnapshot.docs[0].ref.update({
        lastMessageAt: FieldValue.serverTimestamp(),
        messageCount: FieldValue.increment(1),
        isActive: true,
      });
      console.log('✅ Conversation metadata updated');
    }

    // Store the incoming message
    console.log('');
    console.log('💾 Storing message in whatsappMessages collection...');
    
    const messageRef = db.collection('whatsappMessages').doc();
    const messageId = messageRef.id;
    
    // Determine message type
    const hasMedia = payload.NumMedia && parseInt(payload.NumMedia) > 0;
    const messageType = hasMedia ? 'image' : 'text';
    
    console.log('   Message ID:', messageId);
    console.log('   Type:', messageType);
    console.log('   Has Media:', hasMedia);
    console.log('   Content:', payload.Body || '(no text content)');

    const messageData: Partial<WhatsAppMessage> = {
      id: messageId,
      conversationId: conversationId,
      partnerId: partnerId, // CRITICAL: Must include partnerId for UI queries to work
      senderId: fromPhone,
      type: messageType,
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
      const mediaType = payload.MediaContentType0?.startsWith('image') ? 'image' : 'file';
      
      (messageData as any).attachments = [{
        id: messageId,
        type: mediaType,
        name: 'media',
        url: payload.MediaUrl0,
        size: 0,
        mimeType: payload.MediaContentType0 || 'application/octet-stream',
      }];
      
      console.log('   Media URL:', payload.MediaUrl0);
      console.log('   Media Type:', mediaType);
    }

    await messageRef.set(messageData);
    
    console.log('');
    console.log('✅ ============ MESSAGE STORED SUCCESSFULLY ============');
    console.log('');
    console.log('📋 Summary:');
    console.log('   Message ID:', messageId);
    console.log('   Conversation ID:', conversationId);
    console.log('   Partner ID:', partnerId);
    console.log('   Direction: inbound');
    console.log('   Platform: whatsapp');
    console.log('   Customer:', fromPhone);
    console.log('   Twilio SID:', payload.MessageSid);
    console.log('');
    console.log('🎯 This message should now be visible in the UI for partner:', partnerId);
    console.log('');

  } catch (error: any) {
    console.error('');
    console.error('❌ ============ ERROR STORING MESSAGE ============');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('');
    throw error;
  }
}

/**
 * Handle message status updates from Twilio
 * 
 * Status updates include:
 * - queued: Message accepted by Twilio
 * - sent: Message sent to WhatsApp
 * - delivered: Message delivered to recipient
 * - read: Message read by recipient
 * - failed: Message failed to send
 * - undelivered: Message could not be delivered
 */
async function handleStatusUpdate(payload: Partial<TwilioWebhookPayload>) {
  if (!db || !payload.MessageSid || !payload.MessageStatus) {
    console.warn('⚠️ Status update missing required fields');
    return;
  }

  console.log('');
  console.log('🔄 ============ PROCESSING STATUS UPDATE ============');
  console.log('   Twilio SID:', payload.MessageSid);
  console.log('   New Status:', payload.MessageStatus);

  try {
    const snapshot = await db
      .collection('whatsappMessages')
      .where('whatsappMetadata.twilioSid', '==', payload.MessageSid)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const messageDoc = snapshot.docs[0];
      const currentData = messageDoc.data();
      
      await messageDoc.ref.update({
        'whatsappMetadata.twilioStatus': payload.MessageStatus,
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log('✅ Status updated successfully');
      console.log('   Message ID:', messageDoc.id);
      console.log('   Old Status:', currentData.whatsappMetadata?.twilioStatus || 'unknown');
      console.log('   New Status:', payload.MessageStatus);
      
      // Log warnings for failed messages
      if (payload.MessageStatus === 'failed' || payload.MessageStatus === 'undelivered') {
        console.warn('⚠️ Message delivery failed!');
        if (payload.ErrorCode) {
          console.warn('   Error Code:', payload.ErrorCode);
        }
        if (payload.ErrorMessage) {
          console.warn('   Error Message:', payload.ErrorMessage);
        }
      }
      
    } else {
      console.warn('⚠️ Message not found for status update');
      console.warn('   Searched for Twilio SID:', payload.MessageSid);
      console.warn('   This could mean:');
      console.warn('   1. The message was sent before webhook was configured');
      console.warn('   2. The message failed to save initially');
      console.warn('   3. Wrong collection being searched');
    }
    
    console.log('');
    
  } catch (error: any) {
    console.error('❌ Error updating message status:', error.message);
    console.error('Stack:', error.stack);
  }
}

/**
 * Extend the TwilioWebhookPayload type to include error fields
 */
declare module '@/lib/types' {
  interface TwilioWebhookPayload {
    ErrorCode?: string;
    ErrorMessage?: string;
  }
}