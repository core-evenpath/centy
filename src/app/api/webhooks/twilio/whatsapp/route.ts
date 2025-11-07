
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const WEBHOOK_VERSION = 'v8-final-fix';

async function logWebhookCall(payload: any, success: boolean, error?: string) {
  try {
    if (!db) return;
    
    await db.collection('webhookLogs').add({
      platform: 'whatsapp',
      payload: payload,
      success: success,
      error: error || null,
      timestamp: FieldValue.serverTimestamp(),
      from: payload.From || null,
      to: payload.To || null,
      body: payload.Body || null,
      messageSid: payload.MessageSid || null,
      version: WEBHOOK_VERSION
    });
  } catch (err) {
    console.error('Failed to log webhook call:', err);
  }
}

export async function GET() {
  return NextResponse.json({ 
    success: true,
    message: 'WhatsApp webhook active',
    timestamp: new Date().toISOString(),
    version: WEBHOOK_VERSION,
    route: '/api/webhooks/twilio/whatsapp'
  });
}

export async function POST(request: Request) {
  console.log(`🔔 WhatsApp Webhook ${WEBHOOK_VERSION}`);
  
  let payload: Record<string, string> = {};

  try {
    const formData = await request.formData();
    
    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });
    
    console.log('📦 Received:', {
      from: payload.From,
      to: payload.To,
      body: payload.Body?.substring(0, 30),
      messageSid: payload.MessageSid,
      numMedia: payload.NumMedia
    });
    
    if (!db) {
      throw new Error('Database not configured');
    }

    // Handle status updates
    if (payload.MessageStatus) {
      console.log('Status update:', payload.MessageStatus);
      await logWebhookCall(payload, true);
      return NextResponse.json({ 
        success: true, 
        message: 'Status update received',
        version: WEBHOOK_VERSION 
      });
    }

    // Validate required fields
    if (!payload.From || !payload.To) {
      console.log('Missing From or To');
      await logWebhookCall(payload, false, 'Missing required fields');
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    const fromPhone = payload.From.replace('whatsapp:', '');
    const toPhone = payload.To;
    
    // Get partner ID from phone mapping
    const lookupId = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
    console.log('Looking up:', lookupId);
    
    const mappingDoc = await db.collection('twilioPhoneMappings').doc(lookupId).get();
    
    if (!mappingDoc.exists) {
      const errorMsg = `No phone mapping found for ${lookupId}`;
      console.error('❌', errorMsg);
      await logWebhookCall(payload, false, errorMsg);
      throw new Error(errorMsg);
    }
    
    const partnerId = mappingDoc.data()?.partnerId;
    if (!partnerId) {
      const errorMsg = 'Phone mapping has no partnerId';
      console.error('❌', errorMsg);
      await logWebhookCall(payload, false, errorMsg);
      throw new Error(errorMsg);
    }

    console.log('✅ Partner ID:', partnerId);

    // Find or create conversation
    const convoQuery = await db
      .collection('whatsappConversations')
      .where('customerPhone', '==', fromPhone)
      .where('partnerId', '==', partnerId)
      .limit(1)
      .get();

    let conversationId: string;
    
    if (convoQuery.empty) {
      console.log('Creating new conversation');
      const convoRef = db.collection('whatsappConversations').doc();
      conversationId = convoRef.id;
      
      await convoRef.set({
        id: conversationId,
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
      });
      
      console.log('✨ Created conversation:', conversationId);
    } else {
      conversationId = convoQuery.docs[0].id;
      await convoQuery.docs[0].ref.update({
        lastMessageAt: FieldValue.serverTimestamp(),
        messageCount: FieldValue.increment(1),
      });
      
      console.log('📝 Updated conversation:', conversationId);
    }
    
    // Build message data
    const messageData: Record<string, any> = {
      conversationId,
      partnerId,
      senderId: `customer:${fromPhone}`,
      type: 'text', // Default to text
      content: payload.Body || '',
      direction: 'inbound',
      platform: 'whatsapp',
      isEdited: false,
      createdAt: FieldValue.serverTimestamp(),
    };

    const metadata: Record<string, any> = {
      twilioSid: payload.MessageSid,
      twilioStatus: 'received',
      to: payload.To,
      from: payload.From,
    };
    
    if (payload.NumMedia && parseInt(payload.NumMedia) > 0 && payload.MediaUrl0) {
      messageData.type = payload.MediaContentType0?.startsWith('image') ? 'image' : 'file';
      
      messageData.attachments = [{
        id: payload.MessageSid,
        type: messageData.type,
        name: 'whatsapp_media',
        url: payload.MediaUrl0,
        size: 0,
        mimeType: payload.MediaContentType0 || 'application/octet-stream',
      }];
      
      metadata.numMedia = parseInt(payload.NumMedia);
      metadata.mediaUrls = [payload.MediaUrl0];
    }
    
    messageData.whatsappMetadata = metadata;
    
    console.log('💾 Saving message with metadata:', messageData);

    const messageRef = await db.collection('whatsappMessages').add(messageData);
    console.log('✅ Message saved:', messageRef.id);

    await logWebhookCall(payload, true);

    return NextResponse.json({ 
      success: true, 
      message: 'Message received and saved',
      version: WEBHOOK_VERSION,
      messageId: messageRef.id,
      conversationId: conversationId
    });

  } catch (error: any) {
    console.error('❌ Webhook Error:', error.message);
    console.error('Stack:', error.stack);
    
    const errorPayload = Object.keys(payload).length > 0 ? payload : { rawRequestError: "Could not parse form data" };
    await logWebhookCall(errorPayload, false, error.message);
    
    return NextResponse.json({ 
      success: false,
      error: error.message,
      version: WEBHOOK_VERSION
    }, { status: 500 });
  }
}
