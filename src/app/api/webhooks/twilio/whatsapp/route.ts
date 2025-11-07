import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const WEBHOOK_VERSION = 'v4-minimal-2025-11-08';

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
  
  try {
    const formData = await request.formData();
    const payload: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });
    
    console.log('📦 Received:', {
      from: payload.From,
      to: payload.To,
      body: payload.Body?.substring(0, 30),
      messageSid: payload.MessageSid
    });
    
    if (!db) {
      throw new Error('Database not configured');
    }

    // Handle status updates
    if (payload.MessageStatus) {
      console.log('Status update:', payload.MessageStatus);
      return NextResponse.json({ 
        success: true, 
        message: 'Status update received',
        version: WEBHOOK_VERSION 
      });
    }

    // Validate required fields
    if (!payload.From || !payload.To) {
      console.log('Missing From or To');
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
      throw new Error(`No phone mapping found for ${lookupId}`);
    }
    
    const partnerId = mappingDoc.data()?.partnerId;
    if (!partnerId) {
      throw new Error('Phone mapping has no partnerId');
    }

    console.log('Partner ID:', partnerId);

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
      
      console.log('Created conversation:', conversationId);
    } else {
      conversationId = convoQuery.docs[0].id;
      await convoQuery.docs[0].ref.update({
        lastMessageAt: FieldValue.serverTimestamp(),
        messageCount: FieldValue.increment(1),
      });
      
      console.log('Updated conversation:', conversationId);
    }

    // Create message with ONLY fields that have values
    const messageData: Record<string, any> = {
      conversationId: conversationId,
      partnerId: partnerId,
      senderId: `customer:${fromPhone}`,
      type: 'text',
      content: payload.Body || '',
      direction: 'inbound',
      platform: 'whatsapp',
      isEdited: false,
      createdAt: FieldValue.serverTimestamp(),
    };

    console.log('Saving message...');
    const messageRef = await db.collection('whatsappMessages').add(messageData);
    console.log('✅ Message saved:', messageRef.id);

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
    
    return NextResponse.json({ 
      success: false,
      error: error.message,
      version: WEBHOOK_VERSION
    }, { status: 500 });
  }
}