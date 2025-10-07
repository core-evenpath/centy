import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  console.log('GET /api/webhooks/twilio/whatsapp');
  return NextResponse.json({ 
    success: true,
    message: 'WhatsApp webhook is active',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  console.log('='.repeat(80));
  console.log('🔔 WHATSAPP WEBHOOK - POST received');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const formData = await request.formData();
    const payload: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });
    
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    
    // Handle status updates
    if (payload.MessageStatus) {
      console.log('🔄 Status update:', payload.MessageStatus);
      await handleStatusUpdate(payload);
      return NextResponse.json({ success: true, message: 'Status updated' });
    }
    
    // Handle incoming messages
    if (payload.Body && payload.From && payload.To) {
      console.log('📨 Incoming message detected');
      await handleIncomingMessage(payload);
      return NextResponse.json({ success: true, message: 'Message received' });
    }
    
    console.log('⚠️ Unhandled payload type');
    return NextResponse.json({ 
      success: true,
      message: 'Payload received but not processed'
    });
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}

async function getPartnerIdFromPhone(toPhone: string): Promise<string> {
  if (!db) throw new Error('Database not configured');
  
  const lookupId = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
  console.log('🔍 Looking up mapping for:', lookupId);
  
  const doc = await db.collection('twilioPhoneMappings').doc(lookupId).get();
  
  if (!doc.exists) {
    console.error('❌ No phone mapping found for:', lookupId);
    throw new Error(`No phone mapping found for ${lookupId}`);
  }
  
  const partnerId = doc.data()?.partnerId;
  console.log('✅ Found partnerId:', partnerId);
  return partnerId;
}

async function handleIncomingMessage(payload: Record<string, string>) {
  if (!db) throw new Error('Database not configured');
  
  const fromPhone = payload.From.replace('whatsapp:', '');
  const toPhone = payload.To;
  
  console.log('From:', fromPhone);
  console.log('To:', toPhone);
  
  const partnerId = await getPartnerIdFromPhone(toPhone);
  
  // Find or create conversation
  const convQuery = await db.collection('whatsappConversations')
    .where('customerPhone', '==', fromPhone)
    .where('partnerId', '==', partnerId)
    .limit(1)
    .get();
  
  let conversationId: string;
  
  if (convQuery.empty) {
    console.log('📝 Creating new conversation');
    const convRef = db.collection('whatsappConversations').doc();
    conversationId = convRef.id;
    
    await convRef.set({
      id: conversationId,
      partnerId,
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
    });
    console.log('✅ Conversation created:', conversationId);
  } else {
    conversationId = convQuery.docs[0].id;
    console.log('📌 Using existing conversation:', conversationId);
    
    await convQuery.docs[0].ref.update({
      lastMessageAt: FieldValue.serverTimestamp(),
      messageCount: FieldValue.increment(1),
      isActive: true,
    });
  }
  
  // Store message
  const msgRef = db.collection('whatsappMessages').doc();
  const messageData = {
    id: msgRef.id,
    conversationId,
    partnerId,
    senderId: fromPhone,
    type: 'text',
    content: payload.Body || '',
    direction: 'inbound',
    platform: 'whatsapp',
    whatsappMetadata: {
      twilioSid: payload.MessageSid,
      twilioStatus: 'received',
      to: payload.To,
      from: payload.From,
      numMedia: parseInt(payload.NumMedia || '0'),
    },
    isEdited: false,
    createdAt: FieldValue.serverTimestamp(),
  };
  
  await msgRef.set(messageData);
  console.log('✅ Message stored:', msgRef.id);
  console.log('🎯 Message should now appear in UI for partner:', partnerId);
}

async function handleStatusUpdate(payload: Record<string, string>) {
  if (!db) return;
  
  const snapshot = await db.collection('whatsappMessages')
    .where('whatsappMetadata.twilioSid', '==', payload.MessageSid)
    .limit(1)
    .get();
  
  if (!snapshot.empty) {
    await snapshot.docs[0].ref.update({
      'whatsappMetadata.twilioStatus': payload.MessageStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log('✅ Status updated:', payload.MessageStatus);
  }
}