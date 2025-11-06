import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

interface TwilioSMSWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  MessagingServiceSid?: string;
  From: string;
  To: string;
  Body?: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  MessageStatus?: string;
  SmsStatus?: string;
  [key: string]: string | undefined;
}

interface SMSConversation {
  partnerId: string;
  type: 'direct' | 'group';
  platform: 'sms';
  title?: string;
  customerPhone: string;
  participants: string[];
  isActive: boolean;
  messageCount: number;
  createdBy: string;
  createdAt: any;
  lastMessageAt: any;
}

interface SMSMessage {
  conversationId: string;
  partnerId: string;
  senderId: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  content: string;
  direction: 'inbound' | 'outbound';
  platform: 'sms';
  smsMetadata?: {
    twilioSid: string;
    twilioStatus: string;
    to: string;
    from: string;
  };
  attachments?: Array<{
    id: string;
    type: 'image' | 'video' | 'audio' | 'file';
    url: string;
    name?: string;
    size?: number;
  }>;
  isEdited: boolean;
  createdAt: any;
}

/**
 * Get partnerId from Twilio phone number mapping
 * Looks up in twilioPhoneMappings collection
 */
async function getPartnerIdFromPhone(toPhone: string): Promise<string> {
  console.log('🔍 [SMS] Looking up partner for Twilio number:', toPhone);
  
  if (!db) {
    console.error('❌ [SMS] Database not configured');
    return 'system_default';
  }

  try {
    // Try format 1: exact match (e.g., "+19107149473")
    let lookupId = toPhone;
    let doc = await db.collection('twilioPhoneMappings').doc(lookupId).get();
    
    // Try format 2: with sms: prefix
    if (!doc.exists) {
      lookupId = toPhone.startsWith('sms:') ? toPhone : `sms:${toPhone}`;
      doc = await db.collection('twilioPhoneMappings').doc(lookupId).get();
    }
    
    // Try format 3: without prefix, just the number
    if (!doc.exists) {
      lookupId = toPhone.replace('sms:', '');
      doc = await db.collection('twilioPhoneMappings').doc(lookupId).get();
    }

    if (doc.exists) {
      const partnerId = doc.data()?.partnerId;
      if (partnerId) {
        console.log(`✅ [SMS] Found mapping: ${lookupId} → partnerId: ${partnerId}`);
        return partnerId;
      }
    }

    // Fallback: Search partners collection by phone field
    console.log('🔍 [SMS] No mapping found, searching partners collection...');
    const toPhoneDigits = toPhone.replace(/\D/g, '');
    
    const partnersSnapshot = await db.collection('partners').get();
    
    for (const partnerDoc of partnersSnapshot.docs) {
      const partnerData = partnerDoc.data();
      const storedPhone = partnerData.phone || partnerData.smsPhone || partnerData.twilioPhoneNumber;
      
      if (storedPhone) {
        const storedPhoneDigits = storedPhone.replace(/\D/g, '');
        if (storedPhoneDigits === toPhoneDigits) {
          const partnerId = partnerDoc.id;
          console.log(`✅ [SMS] Found partner by phone match: ${partnerId}`);
          return partnerId;
        }
      }
    }

    console.error(`❌ [SMS] No partner found for phone: ${toPhone}`);
    console.log('💡 [SMS] Create a phone mapping:');
    console.log(`   Collection: twilioPhoneMappings`);
    console.log(`   Document ID: ${toPhone}`);
    console.log(`   Fields: { phoneNumber: "${toPhone}", partnerId: "your-partner-id", platform: "sms" }`);
    
    return 'system_default';
  } catch (error: any) {
    console.error('❌ [SMS] Error looking up partner:', error);
    return 'system_default';
  }
}

export async function POST(request: NextRequest) {
  console.log('='.repeat(80));
  console.log('🔔 SMS WEBHOOK CALLED AT:', new Date().toISOString());
  
  try {
    const formData = await request.formData();
    const payload: Partial<TwilioSMSWebhookPayload> = {};

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
    if (payload.From && payload.To) {
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

async function handleIncomingMessage(payload: TwilioSMSWebhookPayload) {
  if (!db) {
    throw new Error('Database not configured');
  }

  console.log('');
  console.log('📨 [SMS] Processing inbound message...');

  const fromPhone = payload.From;
  const toPhone = payload.To;

  console.log('👤 [SMS] Customer phone:', fromPhone);
  console.log('🏢 [SMS] Business phone:', toPhone);

  // Get partnerId from phone mapping
  const partnerId = await getPartnerIdFromPhone(toPhone);
  
  if (partnerId === 'system_default') {
    console.error(`❌ [SMS] Could not find partner for ${toPhone}. Message will be discarded.`);
    console.log('');
    return;
  }

  console.log('🏢 [SMS] Partner ID:', partnerId);

  // Find or create conversation
  let conversationId: string;
  const conversationsSnapshot = await db.collection('smsConversations')
    .where('customerPhone', '==', fromPhone)
    .where('partnerId', '==', partnerId)
    .limit(1)
    .get();

  if (conversationsSnapshot.empty) {
    console.log('📝 [SMS] Creating new conversation');
    const conversationRef = db.collection('smsConversations').doc();
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
    
    await conversationRef.set(newConversation);
    console.log('✅ [SMS] Conversation created:', conversationId);
  } else {
    const conversationDoc = conversationsSnapshot.docs[0];
    conversationId = conversationDoc.id;
    console.log('📌 [SMS] Using existing conversation:', conversationId);
    
    await conversationDoc.ref.update({
      lastMessageAt: FieldValue.serverTimestamp(),
      messageCount: FieldValue.increment(1),
      isActive: true,
    });
  }

  // Store the message
  const messageContent = payload.Body || '';
  const hasMedia = payload.NumMedia && parseInt(payload.NumMedia) > 0;

  console.log('💾 [SMS] Saving message to smsMessages...');
  const messageRef = db.collection('smsMessages').doc();

  const messageData: Partial<SMSMessage> = {
    conversationId,
    partnerId: partnerId,
    senderId: `customer:${fromPhone}`,
    type: hasMedia ? 'image' : 'text',
    content: messageContent,
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

  if (hasMedia && payload.MediaUrl0) {
    messageData.attachments = [{
      id: payload.MessageSid,
      type: payload.MediaContentType0?.startsWith('image') ? 'image' : 'file',
      url: payload.MediaUrl0,
      name: `media_${payload.MessageSid}`,
    }];
  }

  console.log('📝 [SMS] Message data:', {
    conversationId,
    partnerId,
    direction: 'inbound',
    contentLength: messageContent.length,
    hasContent: !!messageContent,
    hasMedia
  });

  await messageRef.set(messageData);
  
  console.log('✅ [SMS] Message stored successfully with ID:', messageRef.id);
  console.log('');
}

async function handleStatusUpdate(payload: Partial<TwilioSMSWebhookPayload>) {
  if (!db) {
    throw new Error('Database not configured');
  }

  const messageSid = payload.MessageSid;
  if (!messageSid) {
    console.error('❌ [SMS] Status update missing MessageSid');
    return;
  }

  const newStatus = payload.MessageStatus || payload.SmsStatus;
  if (!newStatus) {
    console.error('❌ [SMS] Status update missing status value');
    return;
  }

  console.log(`🔄 [SMS] Updating message ${messageSid} to status: ${newStatus}`);

  const snapshot = await db.collection('smsMessages')
    .where('smsMetadata.twilioSid', '==', messageSid)
    .limit(1)
    .get();

  if (snapshot.empty) {
    console.warn(`⚠️ [SMS] No message found with sid: ${messageSid}`);
    return;
  }

  const messageDoc = snapshot.docs[0];
  await messageDoc.ref.update({
    'smsMetadata.twilioStatus': newStatus,
    status: newStatus,
  });

  console.log(`✅ [SMS] Status updated for message ${messageSid}`);
}