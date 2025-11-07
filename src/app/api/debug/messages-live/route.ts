import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const results: any = {
      timestamp: new Date().toISOString(),
      whatsapp: {
        conversations: [],
        messages: []
      },
      sms: {
        conversations: [],
        messages: []
      }
    };

    // Get latest WhatsApp conversations
    const whatsappConvos = await db
      .collection('whatsappConversations')
      .orderBy('lastMessageAt', 'desc')
      .limit(limit)
      .get();

    for (const doc of whatsappConvos.docs) {
      const data = doc.data();
      results.whatsapp.conversations.push({
        id: doc.id,
        partnerId: data.partnerId,
        customerPhone: data.customerPhone,
        platform: data.platform,
        messageCount: data.messageCount,
        lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString(),
        createdAt: data.createdAt?.toDate?.()?.toISOString()
      });
    }

    // Get ALL recent WhatsApp messages (not filtered by conversation)
    const whatsappMessages = await db
      .collection('whatsappMessages')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    whatsappMessages.forEach(msgDoc => {
      const msg = msgDoc.data();
      results.whatsapp.messages.push({
        id: msgDoc.id,
        conversationId: msg.conversationId,
        partnerId: msg.partnerId || '❌ MISSING',
        direction: msg.direction,
        platform: msg.platform,
        content: msg.content?.substring(0, 100),
        createdAt: msg.createdAt?.toDate?.()?.toISOString(),
        senderId: msg.senderId,
        hasPartnerId: !!msg.partnerId
      });
    });

    // Get latest SMS conversations
    const smsConvos = await db
      .collection('smsConversations')
      .orderBy('lastMessageAt', 'desc')
      .limit(limit)
      .get();

    for (const doc of smsConvos.docs) {
      const data = doc.data();
      results.sms.conversations.push({
        id: doc.id,
        partnerId: data.partnerId,
        customerPhone: data.customerPhone,
        platform: data.platform,
        messageCount: data.messageCount,
        lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString(),
        createdAt: data.createdAt?.toDate?.()?.toISOString()
      });
    }

    // Get ALL recent SMS messages
    const smsMessages = await db
      .collection('smsMessages')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    smsMessages.forEach(msgDoc => {
      const msg = msgDoc.data();
      results.sms.messages.push({
        id: msgDoc.id,
        conversationId: msg.conversationId,
        partnerId: msg.partnerId || '❌ MISSING',
        direction: msg.direction,
        platform: msg.platform,
        content: msg.content?.substring(0, 100),
        createdAt: msg.createdAt?.toDate?.()?.toISOString(),
        senderId: msg.senderId,
        hasPartnerId: !!msg.partnerId
      });
    });

    return NextResponse.json({
      success: true,
      results
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error: any) {
    console.error('Error fetching live messages:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}