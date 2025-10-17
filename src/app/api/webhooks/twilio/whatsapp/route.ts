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
    
    console.log('📦 Full Payload:', JSON.stringify(payload, null, 2));
    
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
    throw new Error(`No phone mapping found for ${lookupId}. Create document in twilioPhoneMappings collection.`);
  }
  
  const partnerId = doc.data()?.partnerId;
  if (!partnerId) {
    throw new Error(`Phone mapping exists but partnerId is missing for ${lookupId}`);
  }
  
  console.log('✅ Found partnerId:', partnerId);
  return partnerId;
}

async function handleIncomingMessage(payload: Record<string, string>) {
  if (!db) throw new Error('Database not configured');
  
  console.log('');
  console.log('📨 Processing inbound message...');
  
  // CRITICAL: Extract phone numbers correctly
  // From: whatsapp:+918008968303 (customer sending TO you)
  // To: whatsapp:+19107149473 (your business number)
  const customerPhone = payload.From.replace('whatsapp:', ''); // Customer's phone
  const businessPhone = payload.To; // Keep whatsapp: prefix for lookup
  
  console.log('👤 Customer phone:', customerPhone);
  console.log('🏢 Business phone:', businessPhone);
  
  const partnerId = await getPartnerIdFromPhone(businessPhone);
  console.log('🏢 Partner ID:', partnerId);
  
  // Find or create conversation
  const convQuery = await db.collection('whatsappConversations')
    .where('customerPhone', '==', customerPhone)
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
      title: `WhatsApp: ${customerPhone}`,
      customerPhone: customerPhone, // Customer's phone number
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
  console.log('💾 Saving message to whatsappMessages...');
  const msgRef = db.collection('whatsappMessages').doc();
  
  const messageData = {
    id: msgRef.id,
    conversationId,
    partnerId, // CRITICAL: Must match user's workspace partnerId
    senderId: `customer:${customerPhone}`, // CRITICAL: Identify sender as a customer
    type: 'text',
    content: payload.Body || '',
    direction: 'inbound', // CRITICAL: This is an INBOUND message from customer
    platform: 'whatsapp',
    whatsappMetadata: {
      twilioSid: payload.MessageSid,
      twilioStatus: 'received',
      to: payload.To, // Business number
      from: payload.From, // Customer number
      numMedia: parseInt(payload.NumMedia || '0'),
    },
    isEdited: false,
    createdAt: FieldValue.serverTimestamp(),
  };
  
  console.log('📝 Message data:', JSON.stringify(messageData, null, 2));
  
  await msgRef.set(messageData);
  
  console.log('');
  console.log('✅ Message saved successfully!');
  console.log('   Message ID:', msgRef.id);
  console.log('   Direction: inbound ✅');
  console.log('   Sender ID:', `customer:${customerPhone}`, '✅');
  console.log('   Partner ID:', partnerId, '✅');
  console.log('   Conversation ID:', conversationId);
  console.log('');
}

async function handleStatusUpdate(payload: Record<string, string>) {
  if (!db) return;
  
  console.log('🔄 Updating message status...');
  
  const snapshot = await db.collection('whatsappMessages')
    .where('whatsappMetadata.twilioSid', '==', payload.MessageSid)
    .limit(1)
    .get();
  
  if (!snapshot.empty) {
    await snapshot.docs[0].ref.update({
      'whatsappMetadata.twilioStatus': payload.MessageStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log('✅ Status updated to:', payload.MessageStatus);
  } else {
    console.warn('⚠️ Message not found for status update');
  }
}
