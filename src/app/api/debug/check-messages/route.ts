import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const results: any = {
      whatsapp: {
        conversations: [],
        messages: []
      },
      sms: {
        conversations: [],
        messages: []
      }
    };

    // Check WhatsApp conversations
    const whatsappConvos = await db
      .collection('whatsappConversations')
      .orderBy('lastMessageAt', 'desc')
      .limit(5)
      .get();

    console.log('Found', whatsappConvos.size, 'WhatsApp conversations');

    for (const doc of whatsappConvos.docs) {
      const data = doc.data();
      results.whatsapp.conversations.push({
        id: doc.id,
        partnerId: data.partnerId,
        customerPhone: data.customerPhone,
        platform: data.platform,
        messageCount: data.messageCount,
        lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString()
      });

      // Get messages for this conversation
      const messages = await db
        .collection('whatsappMessages')
        .where('conversationId', '==', doc.id)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

      messages.forEach(msgDoc => {
        const msg = msgDoc.data();
        results.whatsapp.messages.push({
          id: msgDoc.id,
          conversationId: msg.conversationId,
          partnerId: msg.partnerId,
          direction: msg.direction,
          platform: msg.platform,
          content: msg.content?.substring(0, 100),
          createdAt: msg.createdAt?.toDate?.()?.toISOString()
        });
      });
    }

    // Check SMS conversations
    const smsConvos = await db
      .collection('smsConversations')
      .orderBy('lastMessageAt', 'desc')
      .limit(5)
      .get();

    console.log('Found', smsConvos.size, 'SMS conversations');

    for (const doc of smsConvos.docs) {
      const data = doc.data();
      results.sms.conversations.push({
        id: doc.id,
        partnerId: data.partnerId,
        customerPhone: data.customerPhone,
        platform: data.platform,
        messageCount: data.messageCount,
        lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString()
      });

      const messages = await db
        .collection('smsMessages')
        .where('conversationId', '==', doc.id)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

      messages.forEach(msgDoc => {
        const msg = msgDoc.data();
        results.sms.messages.push({
          id: msgDoc.id,
          conversationId: msg.conversationId,
          partnerId: msg.partnerId,
          direction: msg.direction,
          platform: msg.platform,
          content: msg.content?.substring(0, 100),
          createdAt: msg.createdAt?.toDate?.()?.toISOString()
        });
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        whatsappConversations: results.whatsapp.conversations.length,
        whatsappMessages: results.whatsapp.messages.length,
        smsConversations: results.sms.conversations.length,
        smsMessages: results.sms.messages.length
      },
      results
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('Error checking messages:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}