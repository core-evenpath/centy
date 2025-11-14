import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { shouldSyncConversation, syncConversationToVault } from '@/actions/conversation-sync-actions';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

interface TwilioWhatsAppWebhookBody {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  AccountSid: string;
  MessagingServiceSid?: string;
  ProfileName?: string;
  WaId?: string;
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

async function findPartnerIdByWhatsAppNumber(phoneNumber: string): Promise<string | null> {
  if (!db) {
    console.error('❌ Database not available');
    return null;
  }

  try {
    console.log(`🔍 Looking up partner for WhatsApp: ${phoneNumber}`);
    
    const partnersSnapshot = await db
      .collection('partners')
      .where('twilioWhatsAppNumber', '==', phoneNumber)
      .limit(1)
      .get();

    if (partnersSnapshot.empty) {
      console.error(`❌ No partner found for WhatsApp number: ${phoneNumber}`);
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

async function getOrCreateWhatsAppConversation(
  partnerId: string,
  customerPhone: string,
  profileName?: string
): Promise<string> {
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    console.log(`🔍 Looking for existing WhatsApp conversation: ${customerPhone}`);
    
    const conversationsSnapshot = await db
      .collection('whatsappConversations')
      .where('partnerId', '==', partnerId)
      .where('customerPhone', '==', customerPhone)
      .limit(1)
      .get();

    if (!conversationsSnapshot.empty) {
      const conversationId = conversationsSnapshot.docs[0].id;
      console.log(`✅ Found existing conversation: ${conversationId}`);
      
      const updateData: any = {
        lastMessageAt: FieldValue.serverTimestamp(),
        isActive: true,
        messageCount: FieldValue.increment(1),
      };

      if (profileName) {
        updateData.customerName = profileName;
      }

      await db.collection('whatsappConversations').doc(conversationId).update(updateData);
      
      return conversationId;
    }

    console.log(`📝 Creating new WhatsApp conversation for ${customerPhone}`);
    
    const newConversation = {
      partnerId,
      platform: 'whatsapp',
      customerPhone,
      customerName: profileName || null,
      lastMessageAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      isActive: true,
      messageCount: 1,
      lastSyncedAt: null,
      lastSyncedMessageCount: 0,
      syncStatus: 'pending',
    };

    const conversationRef = await db
      .collection('whatsappConversations')
      .add(newConversation);

    console.log(`✅ Created WhatsApp conversation: ${conversationRef.id}`);
    return conversationRef.id;
  } catch (error) {
    console.error('❌ Error in getOrCreateWhatsAppConversation:', error);
    throw error;
  }
}

async function handleIncomingWhatsAppMessage(
  partnerId: string,
  from: string,
  to: string,
  body: string,
  messageSid: string,
  profileName?: string,
  mediaUrl?: string,
  mediaContentType?: string
): Promise<void> {
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    console.log(`📨 Processing incoming WhatsApp from ${from}`);
    
    const conversationId = await getOrCreateWhatsAppConversation(partnerId, from, profileName);

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
      platform: 'whatsapp',
      senderName: profileName || null,
      mediaUrl: mediaUrl || null,
      mediaContentType: mediaContentType || null,
    };

    const messageRef = await db.collection('whatsappMessages').add(messageData);
    console.log(`✅ Stored WhatsApp message: ${messageRef.id}`);

    await db.collection('notifications').add({
      partnerId,
      conversationId,
      messageId: messageRef.id,
      type: 'new_whatsapp_message',
      title: 'New WhatsApp Message',
      message: `New message from ${profileName || from}: ${body.substring(0, 50)}${body.length > 50 ? '...' : ''}`,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
      platform: 'whatsapp',
      customerPhone: from,
      customerName: profileName || null,
    });

    console.log(`✅ Created notification`);

    try {
      const shouldSync = await shouldSyncConversation(conversationId, 'whatsapp', partnerId);
      if (shouldSync) {
        console.log('🔄 Triggering background sync for conversation:', conversationId);
        syncConversationToVault(conversationId, 'whatsapp', partnerId).catch(err => 
          console.error('Background sync error:', err)
        );
      }
    } catch (syncError) {
      console.error('Sync check error:', syncError);
    }
  } catch (error) {
    console.error('❌ Error handling incoming WhatsApp message:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log('\n🔔 ========== INCOMING WHATSAPP WEBHOOK ==========');
  
  const webhookLogData: any = {
    platform: 'whatsapp',
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
    const body: TwilioWhatsAppWebhookBody = {} as TwilioWhatsAppWebhookBody;
    
    formData.forEach((value, key) => {
      body[key as keyof TwilioWhatsAppWebhookBody] = value.toString();
      webhookLogData.payload[key] = value.toString();
    });

    webhookLogData.from = body.From;
    webhookLogData.to = body.To;
    webhookLogData.body = body.Body;
    webhookLogData.messageSid = body.MessageSid;

    console.log('📦 Webhook Body:', {
      MessageSid: body.MessageSid,
      From: body.From,
      To: body.To,
      Body: body.Body?.substring(0, 50),
      ProfileName: body.ProfileName,
      WaId: body.WaId,
      NumMedia: body.NumMedia,
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
      webhookLogData.error = 'Missing required fields (From, To, or Body)';
      if (db) {
        await db.collection('webhookLogs').add(webhookLogData);
      }
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const partnerId = await findPartnerIdByWhatsAppNumber(body.To);
    if (!partnerId) {
      console.error('❌ Partner not found for WhatsApp:', body.To);
      webhookLogData.error = `Partner not found for WhatsApp number: ${body.To}`;
      if (db) {
        await db.collection('webhookLogs').add(webhookLogData);
      }
      return NextResponse.json(
        { error: 'Partner not found' },
        { status: 404 }
      );
    }

    await handleIncomingWhatsAppMessage(
      partnerId,
      body.From,
      body.To,
      body.Body,
      body.MessageSid,
      body.ProfileName,
      body.MediaUrl0,
      body.MediaContentType0
    );

    webhookLogData.success = true;
    if (db) {
      await db.collection('webhookLogs').add(webhookLogData);
    }

    console.log('✅ ========== WHATSAPP WEBHOOK COMPLETE ==========\n');

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error: any) {
    console.error('❌ WhatsApp webhook error:', error);
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
      message: 'WhatsApp webhook endpoint is active',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}