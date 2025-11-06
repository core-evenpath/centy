// src/actions/message-actions.ts
'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

interface DeleteMessageInput {
  messageId: string;
  conversationId: string;
  platform: 'sms' | 'whatsapp';
  partnerId: string;
}

interface DeleteMessageResult {
  success: boolean;
  message: string;
}

interface DeleteConversationInput {
  conversationId: string;
  platform: 'sms' | 'whatsapp';
  partnerId: string;
}

interface DeleteConversationResult {
  success: boolean;
  message: string;
  deletedMessagesCount?: number;
}

export async function deleteMessageAction(input: DeleteMessageInput): Promise<DeleteMessageResult> {
  if (!db) {
    return { success: false, message: 'Server not configured' };
  }

  if (!input.messageId || !input.conversationId || !input.platform || !input.partnerId) {
    return { success: false, message: 'Missing required fields' };
  }

  try {
    const collectionName = input.platform === 'sms' ? 'smsMessages' : 'whatsappMessages';
    const conversationCollection = input.platform === 'sms' ? 'smsConversations' : 'whatsappConversations';
    
    const messageRef = db.collection(collectionName).doc(input.messageId);
    const messageDoc = await messageRef.get();

    if (!messageDoc.exists) {
      return { success: false, message: 'Message not found' };
    }

    const messageData = messageDoc.data();
    
    if (messageData?.direction !== 'outbound') {
      return { success: false, message: 'Only outbound messages can be deleted' };
    }

    if (messageData?.senderId !== input.partnerId) {
      return { success: false, message: 'Unauthorized: Message does not belong to this partner' };
    }

    if (messageData?.conversationId !== input.conversationId) {
      return { success: false, message: 'Message does not belong to this conversation' };
    }

    await messageRef.delete();

    const conversationRef = db.collection(conversationCollection).doc(input.conversationId);
    await conversationRef.update({
      messageCount: FieldValue.increment(-1),
    });

    return {
      success: true,
      message: 'Message deleted successfully',
    };
  } catch (error: any) {
    console.error('Error deleting message:', error);
    return {
      success: false,
      message: error.message || 'Failed to delete message',
    };
  }
}

export async function deleteConversationAction(input: DeleteConversationInput): Promise<DeleteConversationResult> {
  if (!db) {
    return { success: false, message: 'Server not configured' };
  }

  if (!input.conversationId || !input.platform || !input.partnerId) {
    return { success: false, message: 'Missing required fields' };
  }

  try {
    const messageCollectionName = input.platform === 'sms' ? 'smsMessages' : 'whatsappMessages';
    const conversationCollection = input.platform === 'sms' ? 'smsConversations' : 'whatsappConversations';
    
    const conversationRef = db.collection(conversationCollection).doc(input.conversationId);
    const conversationDoc = await conversationRef.get();

    if (!conversationDoc.exists) {
      return { success: false, message: 'Conversation not found' };
    }

    const conversationData = conversationDoc.data();
    
    if (conversationData?.partnerId !== input.partnerId) {
      return { success: false, message: 'Unauthorized: Conversation does not belong to this partner' };
    }

    const messagesSnapshot = await db
      .collection(messageCollectionName)
      .where('conversationId', '==', input.conversationId)
      .get();

    const batch = db.batch();
    
    messagesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    batch.delete(conversationRef);

    await batch.commit();

    return {
      success: true,
      message: 'Conversation deleted successfully',
      deletedMessagesCount: messagesSnapshot.size,
    };
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    return {
      success: false,
      message: error.message || 'Failed to delete conversation',
    };
  }
}