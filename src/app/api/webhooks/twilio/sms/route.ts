import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { shouldSyncConversation, syncConversationToVault } from '@/actions/conversation-sync-actions';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

interface TwilioSmsWebhookBody {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  AccountSid: string;
  MessagingServiceSid?: string;
  FromCity?: string;
  FromState?: string;
  FromZip?: string;
  FromCountry?: string;
}

async function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): Promise<boolean> {
  if (!authToken) {
    console.error('❌ Missing TWILIO_AUTH_TOKEN');
    return false;
  }
  
  try {
    return twilio.validateRequest(authToken, signature, url, params);
  } catch (error) {
    console.error('❌ Signature validation error:', error);
    return false;
  }
}

async function findPartnerIdByPhoneNumber(phoneNumber: string): Promise<string | null> {
  if (!db) {
    console.error('❌ Database not available');
    return null;
  }

  try {
    console.log(`🔍 Looking up partner for phone: ${phoneNumber}`);
    
    const partnersSnapshot = await db
      .collection('partners')
      .where('twilioPhoneNumber', '==', phoneNumber)
      .limit(1)
      .get();

    if (partnersSnapshot.empty) {
      console.error(`❌ No partner found for phone number: ${phoneNumber}`);
      return null;
    }

    const partnerId = partnersSnapshot.docs[0].id;
    console.log(`✅ Found partner: ${partnerId}`);
    return partnerId;
  } catch (error) {
    console.error('❌ Error finding partner:', error);
    return null;
  }
}

async function getOrCreateConversation(
  partnerId: string,
  customerPhone: string
): Promise<string> {
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    console.log(`🔍 Looking for existing conversation: ${customerPhone}`);
    
    const conversationsSnapshot = await db
      .collection('smsConversations')
      .where('partnerId', '==', partnerId)
      .where('customerPhone', '==', customerPhone)
      .limit(1)
      .get();

    if (!conversationsSnapshot.empty) {
      const conversationId = conversationsSnapshot.docs[0].id;
      console.log(`✅ Found existing conversation: ${conversationId}`);
      
      await db.collection('smsConversations').doc(conversationId).update({
        lastMessageAt: FieldValue.serverTimestamp(),
        isActive: true,
        messageCount: FieldValue.increment(1),
      });
      
      return conversationId;
    }

    console.log(`📝 Creating new conversation for ${customerPhone}`);
    
    const newConversation = {
      partnerId,
      platform: 'sms',
      customerPhone,
      lastMessageAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      isActive: true,
      messageCount: 1,
      lastSyncedAt: null,
      lastSyncedMessageCount: 0,
      syncStatus: 'pending',
    };

    const conversationRef = await db
      .collection('smsConversations')
      .add(newConversation);

    console.log(`✅ Created conversation: ${conversationRef.id}`);
    return conversationRef.id;
  } catch (error) {
    console.error('❌ Error in getOrCreateConversation:', error);
    throw error;
  }
}

async function handleIncomingMessage(
  partnerId: string,
  from: string,
  to: string,
  body: string,
  messageSid: string,
  mediaUrl?: string,
  mediaContentType?: string
): Promise<void> {
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    console.log(`📨 Processing incoming SMS from ${from}`);
    
    const conversationId = await getOrCreateConversation(partnerId, from);

    const messageData = {
      conversationId,
      direction: 'inbound',
      from,
      to,
      content: body,
      twilioMessageSid: messageSid,
      status: 'received',
      createdAt: FieldValue.serverTimestamp(),
      partnerId,
      platform: 'sms',
      mediaUrl: mediaUrl || null,
      mediaContentType: mediaContentType || null,
    };

    const messageRef = await db.collection('smsMessages').add(messageData);
    console.log(`✅ Stored message: ${messageRef.id}`);

    await db.collection('notifications').add({
      partnerId,
      conversationId,
      messageId: messageRef.id,
      type: 'new_sms_message',
      title: 'New SMS Message',
      message: `New message from ${from}: ${body.substring(0, 50)}${body.length > 50 ? '...' : ''}`,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
      platform: 'sms',
      customerPhone: from,
    });

    console.log(`✅ Created notification`);

    try {
      const shouldSync = await shouldSyncConversation(conversationId, 'sms', partnerId);
      if (shouldSync) {
        console.log('🔄 Triggering background sync for conversation:', conversationId);
        syncConversationToVault(conversationId, 'sms', partnerId).catch(err => 
          console.error('Background sync error:', err)
        );
      }
    } catch (syncError) {
      console.error('Sync check error:', syncError);
    }
  } catch (error) {
    console.error('❌ Error handling incoming message:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log('\n🔔 ========== INCOMING SMS WEBHOOK ==========');
  
  const webhookLogData: any = {
    platform: 'sms',
    timestamp: FieldValue.serverTimestamp(),
    success: false,
    error: null,
    from: null,
    to: null,
    body: null,
    messageSid: null,
    payload: {},
  };

  try {
    const formData = await request.formData();
    const body: TwilioSmsWebhookBody = {} as TwilioSmsWebhookBody;
    
    console.log('🔍 DEBUG: Raw formData entries:');
    formData.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
      body[key as keyof TwilioSmsWebhookBody] = value.toString();
      webhookLogData.payload[key] = value.toString();
    });

    webhookLogData.from = body.From;
    webhookLogData.to = body.To;
    webhookLogData.body = body.Body;
    webhookLogData.messageSid = body.MessageSid;

    console.log('📦 Parsed Webhook Body:', {
      MessageSid: body.MessageSid,
      From: body.From,
      To: body.To,
      Body: body.Body?.substring(0, 50),
      NumMedia: body.NumMedia,
      hasFrom: !!body.From,
      hasTo: !!body.To,
      hasBody: !!body.Body,
      bodyType: typeof body.Body,
      bodyLength: body.Body?.length || 0,
    });

    const twilioSignature = request.headers.get('x-twilio-signature');
    if (!twilioSignature) {
      console.error('❌ Missing Twilio signature');
      webhookLogData.error = 'Missing Twilio signature';
      if (db) {
        await db.collection('webhookLogs').add(webhookLogData);
      }
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    const url = request.url;
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const isValidSignature = await validateTwilioSignature(
      twilioSignature,
      url,
      params
    );

    if (!isValidSignature) {
      console.error('❌ Invalid Twilio signature');
      webhookLogData.error = 'Invalid Twilio signature';
      if (db) {
        await db.collection('webhookLogs').add(webhookLogData);
      }
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log('✅ Signature validated');

    if (!body.From || !body.To || !body.Body) {
      console.error('❌ Missing required fields');
      console.error('   From:', body.From, '(exists:', !!body.From, ')');
      console.error('   To:', body.To, '(exists:', !!body.To, ')');
      console.error('   Body:', body.Body, '(exists:', !!body.Body, ', length:', body.Body?.length || 0, ')');
      webhookLogData.error = `Missing required fields - From: ${!!body.From}, To: ${!!body.To}, Body: ${!!body.Body}`;
      if (db) {
        await db.collection('webhookLogs').add(webhookLogData);
      }
      return NextResponse.json(
        { error: 'Missing required fields', details: { hasFrom: !!body.From, hasTo: !!body.To, hasBody: !!body.Body } },
        { status: 400 }
      );
    }

    const partnerId = await findPartnerIdByPhoneNumber(body.To);
    if (!partnerId) {
      console.error('❌ Partner not found for phone:', body.To);
      webhookLogData.error = `Partner not found for phone number: ${body.To}`;
      if (db) {
        await db.collection('webhookLogs').add(webhookLogData);
      }
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      );
    }

    await handleIncomingMessage(
      partnerId,
      body.From,
      body.To,
      body.Body,
      body.MessageSid,
      body.MediaUrl0,
      body.MediaContentType0
    );

    webhookLogData.success = true;
    if (db) {
      await db.collection('webhookLogs').add(webhookLogData);
    }

    console.log('✅ ========== SMS WEBHOOK COMPLETE ==========\n');

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error: any) {
    console.error('❌ SMS webhook error:', error);
    console.error('Stack:', error.stack);
    
    webhookLogData.error = error.message;
    if (db) {
      await db.collection('webhookLogs').add(webhookLogData);
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'SMS webhook endpoint is active',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}