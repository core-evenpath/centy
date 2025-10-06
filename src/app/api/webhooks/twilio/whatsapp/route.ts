// src/app/api/webhooks/twilio/whatsapp/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue, query, where, getDocs, limit, collection, doc, setDoc, updateDoc, addDoc } from 'firebase-admin/firestore';
import type { TwilioWebhookPayload, WhatsAppMessage, WhatsAppConversation } from '@/lib/types';


/**
 * Get partnerId from the Twilio WhatsApp number the message was sent TO.
 * This version is more robust and handles formatting differences.
 */
async function getPartnerIdFromPhone(toPhoneWithPrefix: string): Promise<string> {
  console.log('🔍 [WhatsApp] Looking up partner for Twilio number:', toPhoneWithPrefix);
  if (!db) {
    console.error('❌ [WhatsApp] Firestore is not initialized.');
    return 'system_default';
  }
  
  // Sanitize the incoming number to digits only, removing the '+'
  const toPhoneDigits = toPhoneWithPrefix.replace(/\D/g, '');

  const partnersRef = collection(db, 'partners');
  const snapshot = await getDocs(partnersRef);

  if (snapshot.empty) {
    console.warn('⚠️ [WhatsApp] No partners found in the database.');
    return 'system_default';
  }

  for (const partnerDoc of snapshot.docs) {
    const partnerData = partnerDoc.data();
    const storedPhone = partnerData.whatsAppPhone || partnerData.phone;

    if (storedPhone) {
      // Sanitize the stored number to digits only
      const storedPhoneDigits = storedPhone.replace(/\D/g, '');
      
      if (storedPhoneDigits === toPhoneDigits) {
        const partnerId = partnerDoc.id;
        console.log(`✅ [WhatsApp] Found partnerId '${partnerId}' for number ${toPhoneWithPrefix}`);
        return partnerId;
      }
    }
  }

  console.warn(`⚠️ [WhatsApp] No partner found for number ${toPhoneWithPrefix}. (Sanitized: ${toPhoneDigits})`);
  return 'system_default';
}


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

    console.log('📦 WHATSAPP PAYLOAD:', JSON.stringify(payload, null, 2));

    // Handle status callbacks
    if (payload.MessageStatus) {
      console.log('🔄 WhatsApp: Processing status update');
      await handleStatusUpdate(payload);
      return NextResponse.json({ success: true, message: 'Status updated' });
    }

    // Handle incoming messages
    if (payload.Body && payload.From && payload.To) {
      console.log('📨 WhatsApp: Processing incoming message');
      await handleIncomingMessage(payload as TwilioWebhookPayload);
      return NextResponse.json({ success: true, message: 'Message received' });
    }

    console.warn('⚠️ WhatsApp: Invalid payload structure');
    return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ WhatsApp: CRITICAL ERROR:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    return NextResponse.json(
      { success: false, message: error.message, stack: error.stack },
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

  console.log('📨 Starting inbound message processing...');

  const fromPhone = payload.From.replace('whatsapp:', '');
  const toPhone = payload.To; // Keep the 'whatsapp:' prefix for lookup

  console.log('  From (customer):', fromPhone);
  console.log('  To (business):', toPhone);

  // Get partnerId from phone mapping
  const partnerId = await getPartnerIdFromPhone(toPhone);
  if (partnerId === 'system_default') {
      console.error(`Could not find partner for inbound message to ${toPhone}. Aborting.`);
      return;
  }
  console.log('  Assigned partnerId:', partnerId);

  // Find or create conversation
  let conversationId: string;
  
  try {
    const conversationsRef = collection(db, 'whatsappConversations');
    const q = query(
      conversationsRef,
      where('customerPhone', '==', fromPhone),
      where('partnerId', '==', partnerId),
      limit(1)
    );
    const conversationsSnapshot = await getDocs(q);

    if (conversationsSnapshot.empty) {
      console.log('📝 Creating new conversation...');
      
      const conversationRef = doc(collection(db, 'whatsappConversations'));
      conversationId = conversationRef.id;

      const newConversation: Partial<WhatsAppConversation> = {
        partnerId: partnerId,
        type: 'direct',
        platform: 'whatsapp',
        title: `WhatsApp: ${fromPhone}`,
        customerPhone: fromPhone,
        participants: [],
        isActive: true,
        messageCount: 1,
        createdBy: 'customer',
        createdAt: FieldValue.serverTimestamp(),
        lastMessageAt: FieldValue.serverTimestamp(),
      };
      
      await setDoc(conversationRef, newConversation);
      console.log('✅ Conversation created:', conversationId);

    } else {
      const conversationDoc = conversationsSnapshot.docs[0];
      conversationId = conversationDoc.id;
      console.log('📌 Using existing conversation:', conversationId);
      
      await updateDoc(conversationDoc.ref, {
        lastMessageAt: FieldValue.serverTimestamp(),
        messageCount: FieldValue.increment(1),
        isActive: true,
      });
      console.log('✅ Conversation updated');
    }

    // Store incoming message in the correct collection
    console.log('💾 Storing message in whatsappMessages...');
    
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

    const messageRef = await addDoc(collection(db, 'whatsappMessages'), messageData);
    
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

    const q = query(
      collection(db, 'whatsappMessages'),
      where('whatsappMetadata.twilioSid', '==', payload.MessageSid),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      await updateDoc(snapshot.docs[0].ref, {
        'whatsappMetadata.twilioStatus': payload.MessageStatus,
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log('✅ Status updated');
    } else {
      console.warn('⚠️ Message not found for status update:', payload.MessageSid);
    }
  } catch (error) {
    console.error('❌ Error updating status:', error);
  }
}
