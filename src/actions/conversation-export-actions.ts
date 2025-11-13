'use server';

import { db } from '@/lib/firebase-admin';
import { format } from 'date-fns';

interface ExportConversationResult {
  success: boolean;
  message: string;
  conversationText?: string;
  metadata?: {
    messageCount: number;
    dateRange: { start: string; end: string };
    customerPhone: string;
    platform: string;
  };
}

export async function exportConversationToText(
  conversationId: string,
  platform: 'sms' | 'whatsapp',
  partnerId: string
): Promise<ExportConversationResult> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const collectionName = platform === 'sms' ? 'smsMessages' : 'whatsappMessages';
    const conversationCollection = platform === 'sms' ? 'smsConversations' : 'whatsappConversations';

    // Get conversation metadata
    const conversationDoc = await db
      .collection(conversationCollection)
      .doc(conversationId)
      .get();

    if (!conversationDoc.exists) {
      return { success: false, message: 'Conversation not found' };
    }

    const conversationData = conversationDoc.data();

    // Get all messages
    const messagesSnapshot = await db
      .collection(collectionName)
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'asc')
      .get();

    if (messagesSnapshot.empty) {
      return { success: false, message: 'No messages found in conversation' };
    }

    const messages = messagesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Format conversation text
    const header = `Conversation Summary
Platform: ${platform.toUpperCase()}
Customer: ${conversationData?.customerPhone || 'Unknown'}
Partner: ${partnerId}
Total Messages: ${messages.length}
Date Range: ${format(messages[0].createdAt.toDate(), 'MMM d, yyyy')} - ${format(messages[messages.length - 1].createdAt.toDate(), 'MMM d, yyyy')}

---

`;

    const messageText = messages.map(msg => {
      const timestamp = format(msg.createdAt.toDate(), 'MMM d, yyyy HH:mm');
      const sender = msg.direction === 'inbound' ? 'Customer' : 'Partner';
      return `[${timestamp}] ${sender}: ${msg.content}`;
    }).join('\n\n');

    const conversationText = header + messageText;

    const metadata = {
      messageCount: messages.length,
      dateRange: {
        start: messages[0].createdAt.toDate().toISOString(),
        end: messages[messages.length - 1].createdAt.toDate().toISOString(),
      },
      customerPhone: conversationData?.customerPhone || 'Unknown',
      platform: platform,
    };

    return {
      success: true,
      message: 'Conversation exported successfully',
      conversationText,
      metadata,
    };
  } catch (error: any) {
    console.error('Error exporting conversation:', error);
    return {
      success: false,
      message: `Failed to export conversation: ${error.message}`,
    };
  }
}

export async function getConversationContext(
  conversationId: string,
  platform: 'sms' | 'whatsapp',
  messageLimit: number = 10
): Promise<string> {
  if (!db) return '';

  try {
    const collectionName = platform === 'sms' ? 'smsMessages' : 'whatsappMessages';

    const messagesSnapshot = await db
      .collection(collectionName)
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'desc')
      .limit(messageLimit)
      .get();

    if (messagesSnapshot.empty) return '';

    const messages = messagesSnapshot.docs
      .map(doc => doc.data())
      .reverse(); // Most recent last

    return messages
      .map(msg => `${msg.direction === 'inbound' ? 'Customer' : 'Partner'}: ${msg.content}`)
      .join('\n');
  } catch (error) {
    console.error('Error getting conversation context:', error);
    return '';
  }
}