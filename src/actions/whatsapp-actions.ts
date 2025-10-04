// src/actions/whatsapp-actions.ts
'use server';

import { db } from '@/lib/firebase-admin';
import { sendWhatsAppMessage, getMessageStatus } from '@/lib/twilio-service';
import { FieldValue } from 'firebase-admin/firestore';
import type { SendWhatsAppMessageInput, SendWhatsAppMessageResult, WhatsAppMessage, WhatsAppConversation } from '@/lib/types';

/**
 * Send a WhatsApp message and store it in Firestore
 */
export async function sendWhatsAppMessageAction(input: SendWhatsAppMessageInput): Promise<SendWhatsAppMessageResult> {
  if (!db) {
    return { success: false, message: 'Server not configured' };
  }

  try {
    // Validate input
    if (!input.to || !input.message) {
      return { success: false, message: 'Phone number and message are required' };
    }

    // Format phone number to E.164 if not already
    const phoneNumber = input.to.startsWith('+') ? input.to : `+${input.to}`;

    // Send via Twilio
    const twilioResponse = await sendWhatsAppMessage({
      to: phoneNumber,
      body: input.message,
      mediaUrl: input.mediaUrl,
    });

    // Get or create conversation
    let conversationId = input.conversationId;
    
    if (!conversationId) {
      // Create new conversation
      const conversationRef = db.collection('whatsappConversations').doc();
      conversationId = conversationRef.id;

      const newConversation: Partial<WhatsAppConversation> = {
        id: conversationId,
        partnerId: input.partnerId,
        type: 'direct',
        platform: 'whatsapp',
        title: `WhatsApp: ${phoneNumber}`,
        customerPhone: phoneNumber,
        participants: [],
        isActive: true,
        messageCount: 0,
        createdBy: input.partnerId,
        createdAt: FieldValue.serverTimestamp(),
        lastMessageAt: FieldValue.serverTimestamp(),
      };

      await conversationRef.set(newConversation);
    } else {
      // Update existing conversation
      await db.collection('whatsappConversations').doc(conversationId).update({
        lastMessageAt: FieldValue.serverTimestamp(),
        messageCount: FieldValue.increment(1),
      });
    }

    // Store message in Firestore
    const messageRef = db.collection('whatsappMessages').doc();
    const messageData: Partial<WhatsAppMessage> = {
      id: messageRef.id,
      conversationId,
      senderId: input.partnerId,
      type: 'text',
      content: input.message,
      direction: 'outbound',
      platform: 'whatsapp',
      whatsappMetadata: {
        twilioSid: twilioResponse.sid,
        twilioStatus: twilioResponse.status as any,
        to: twilioResponse.to,
        from: twilioResponse.from,
        errorCode: twilioResponse.errorCode,
        errorMessage: twilioResponse.errorMessage,
      },
      isEdited: false,
      createdAt: FieldValue.serverTimestamp(),
    };

    if (input.mediaUrl) {
      messageData.attachments = [{
        id: messageRef.id,
        type: 'image',
        name: 'media',
        url: input.mediaUrl,
        size: 0,
        mimeType: 'image/jpeg',
      }];
    }

    await messageRef.set(messageData);

    return {
      success: true,
      message: 'Message sent successfully',
      messageId: messageRef.id,
      twilioSid: twilioResponse.sid,
      conversationId,
    };
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    return {
      success: false,
      message: error.message || 'Failed to send message',
    };
  }
}

/**
 * Get WhatsApp conversations for a partner
 */
export async function getWhatsAppConversations(partnerId: string) {
  if (!db) {
    throw new Error('Server not configured');
  }

  try {
    const snapshot = await db
      .collection('whatsappConversations')
      .where('partnerId', '==', partnerId)
      .orderBy('lastMessageAt', 'desc')
      .limit(50)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

/**
 * Get messages for a WhatsApp conversation
 */
export async function getWhatsAppMessages(conversationId: string) {
  if (!db) {
    throw new Error('Server not configured');
  }

  try {
    const snapshot = await db
      .collection('whatsappMessages')
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'asc')
      .limit(100)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

/**
 * Update message status from Twilio webhook
 */
export async function updateMessageStatus(twilioSid: string, status: string): Promise<void> {
  if (!db) {
    throw new Error('Server not configured');
  }

  try {
    // Find message by Twilio SID
    const snapshot = await db
      .collection('whatsappMessages')
      .where('whatsappMetadata.twilioSid', '==', twilioSid)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      await doc.ref.update({
        'whatsappMetadata.twilioStatus': status,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  } catch (error: any) {
    console.error('Error updating message status:', error);
    throw error;
  }
}