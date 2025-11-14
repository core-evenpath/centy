import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { shouldSyncConversation, syncConversationToVault } from '@/actions/conversation-sync-actions';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

interface TwilioWebhookBody {
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

async function findPartnerIdByPhoneNumber(phoneNumber: string, isWhatsApp: boolean): Promise<string | null> {
  if (!db) {
    console.error('❌ Database not available');
    return null;
  }

  try {
    const fieldName = isWhatsApp ? 'twilioWhatsAppNumber' : 'twilioPhoneNumber';
    console.log(`🔍 Looking up partner for ${isWhatsApp ? 'WhatsApp' : 'SMS'}: ${phoneNumber} using field: ${fieldName}`);
    
    const partnersSnapshot = await db
      .collection('partners')
      .where(fieldName, '==', phoneNumber)
      .limit(1)
      .get();

    if (partnersSnapshot.empty) {
      console.error(`❌ No partner found for ${fieldName}: ${phoneNumber}`);
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
  customerPhone: string,
  platform: 'sms' | 'whatsapp',
  profileName?: string
): Promise<string> {
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    const collectionName = platform === 'whatsapp' ? 'whatsappConversations' : 'smsConversations';
    console.log(`🔍 Looking for existing ${platform} conversation: ${customerPhone}`);
    
    const conversationsSnapshot = await db
      .collection(collectionName)
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

      await db.collection(collectionName).doc(conversationId).update(updateData);
      
      return conversationId;
    }

    console.log(`📝 Creating new ${platform} conversation for ${customerPhone}`);
    
    const newConversation: any = {
      partnerId,
      platform,
      customerPhone,
      lastMessageAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      isActive: true,
      messageCount: 1,
      lastSyncedAt: null,
      lastSyncedMessageCount: 0,
      syncStatus: 'pending',
    };

    if (profileName) {
      newConversation.customerName = profileName;
    }

    const conversationRef = await db.collection(collectionName).add(newConversation);

    console.log(`✅ Created ${platform} conversation: ${conversationRef.id}`);
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
  platform: 'sms' | 'whatsapp',
  profileName?: string,
  mediaUrl?: string,
  mediaContentType?: string
): Promise<void> {
  if (!db) {
    throw new Error('Database not available');
  }

  try {
    console.log(`📨 Processing incoming ${platform.toUpperCase()} from ${from}`);
    
    const conversationId = await getOrCreateConversation(partnerId, from, platform, profileName);

    const collectionName = platform === 'whatsapp' ? 'whatsappMessages' : 'smsMessages';
    const messageData: any = {
      conversationId,
      direction: 'inbound',
      from,
      to,
      content: body,
      twilioMessageSid: messageSid,
      status: 'received',
      createdAt: FieldValue.serverTimestamp(),
      partnerId,
      platform,
      mediaUrl: mediaUrl || null,
      mediaContentType: mediaContentType || null,
    };

    if (platform === 'whatsapp' && profileName) {
      messageData.senderName = profileName;
    }

    const messageRef = await db.collection(collectionName).add(messageData);
    console.log(`✅ Stored ${platform} message: ${messageRef.id}`);

    await db.collection('notifications').add({
      partnerId,
      conversationId,
      messageId: messageRef.id,
      type: platform === 'whatsapp' ? 'new_whatsapp_message' : 'new_sms_message',
      title: platform === 'whatsapp' ? 'New WhatsApp Message' : 'New SMS Message',
      message: `New message from ${profileName || from}: ${body.substring(0, 50)}${body.length > 50 ? '...' : ''}`,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
      platform,
      customerPhone: from,
      customerName: profileName || null,
    });

    console.log(`✅ Created notification`);

    try {
      const shouldSync = await shouldSyncConversation(conversationId, platform, partnerId);
      if (shouldSync) {
        console.log('🔄 Triggering background sync for conversation:', conversationId);
        syncConversationToVault(conversationId, platform, partnerId).catch(err => 
          console.error('Background sync error:', err)
        );
      }
    } catch (syncError) {
      console.error('Sync check error:', syncError);
    }
  } catch (error) {
    console.error(`❌ Error handling incoming ${platform} message:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log('\n🔔 ========== INCOMING WEBHOOK ==========');
  
  const webhookLogData: any = {
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
    const contentType = request.headers.get('content-type') || '';
    console.log('📋 Content-Type:', contentType);

    let body: TwilioWebhookBody;
    let params: Record<string, string> = {};

    if (contentType.includes('application/json')) {
      console.log('🔧 Parsing as JSON');
      const jsonBody = await request.json();
      body = jsonBody as TwilioWebhookBody;
      params = jsonBody;
      webhookLogData.payload = jsonBody;
    } else {
      console.log('🔧 Parsing as FormData');
      const formData = await request.formData();
      body = {} as TwilioWebhookBody;
      
      formData.forEach((value, key) => {
        body[key as keyof TwilioWebhookBody] = value.toString();
        params[key] = value.toString();
        webhookLogData.payload[key] = value.toString();
      });
    }

    const isWhatsApp = body.To?.startsWith('whatsapp:') || body.From?.startsWith('whatsapp:');
    const platform = isWhatsApp ? 'whatsapp' : 'sms';
    webhookLogData.platform = platform;

    console.log(`📱 Detected platform: ${platform.toUpperCase()}`);

    webhookLogData.from = body.From;
    webhookLogData.to = body.To;
    webhookLogData.body = body.Body;
    webhookLogData.messageSid = body.MessageSid;

    console.log('📦 Parsed Webhook Body:', {
      Platform: platform,
      MessageSid: body.MessageSid,
      From: body.From,
      To: body.To,
      Body: body.Body?.substring(0, 50),
      ProfileName: body.ProfileName,
    });

    const twilioSignature = request.headers.get('x-twilio-signature');
    if (!twilioSignature) {
      console.error('❌ Missing Twilio signature');
      webhookLogData.error = 'Missing Twilio signature';
      if (db) {
        await db.collection('webhookLogs').add(webhookLogData);
      }
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const url = request.url;
    const isValidSignature = await validateTwilioSignature(twilioSignature, url, params);

    if (!isValidSignature) {
      console.error('❌ Invalid Twilio signature');
      webhookLogData.error = 'Invalid Twilio signature';
      if (db) {
        await db.collection('webhookLogs').add(webhookLogData);
      }
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('✅ Signature validated');

    if (!body.From || !body.To || !body.Body) {
      console.error('❌ Missing required fields');
      webhookLogData.error = `Missing required fields - From: ${!!body.From}, To: ${!!body.To}, Body: ${!!body.Body}`;
      if (db) {
        await db.collection('webhookLogs').add(webhookLogData);
      }
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const partnerId = await findPartnerIdByPhoneNumber(body.To, isWhatsApp);
    if (!partnerId) {
      console.error(`❌ Partner not found for ${platform}:`, body.To);
      webhookLogData.error = `Partner not found for ${platform}: ${body.To}`;
      if (db) {
        await db.collection('webhookLogs').add(webhookLogData);
      }
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    await handleIncomingMessage(
      partnerId,
      body.From,
      body.To,
      body.Body,
      body.MessageSid,
      platform,
      body.ProfileName,
      body.MediaUrl0,
      body.MediaContentType0
    );

    webhookLogData.success = true;
    if (db) {
      await db.collection('webhookLogs').add(webhookLogData);
    }

    console.log(`✅ ========== ${platform.toUpperCase()} WEBHOOK COMPLETE ==========\n`);

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`;

    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    
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
  return NextResponse.json({ 
    message: 'Unified SMS/WhatsApp webhook endpoint is active',
    timestamp: new Date().toISOString(),
  }, { status: 200 });
}