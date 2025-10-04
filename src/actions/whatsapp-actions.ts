// src/actions/whatsapp-actions.ts
'use server';

import { db } from '@/lib/firebase-admin';
import { sendWhatsAppMessage, getMessageStatus } from '@/lib/twilio-service';
import { FieldValue } from 'firebase-admin/firestore';
import type { SendWhatsAppMessageInput, SendWhatsAppMessageResult, WhatsAppMessage, WhatsAppConversation } from '@/lib/types';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

/**
 * Send a WhatsApp message and store it in Firestore
 */
export async function sendWhatsAppMessageAction(input: SendWhatsAppMessageInput): Promise<SendWhatsAppMessageResult> {
  if (!db) {
    return { success: false, message: 'Server not configured' };
  }

  // Validate input
  if (!input.to || !input.message) {
    return { success: false, message: 'Phone number and message are required' };
  }

  // Send via Twilio first
  const twilioResponse = await sendWhatsAppMessage({
    to: input.to,
    body: input.message,
    mediaUrl: input.mediaUrl,
  });

  // Get or create conversation
  let conversationId = input.conversationId;
  let conversationRef;
  
  try {
    if (!conversationId) {
      // Create new conversation
      conversationRef = db.collection('whatsappConversations').doc();
      conversationId = conversationRef.id;

      const newConversation: Partial<WhatsAppConversation> = {
        id: conversationId,
        partnerId: input.partnerId,
        type: 'direct',
        platform: 'whatsapp',
        title: `WhatsApp: ${input.to}`,
        customerPhone: input.to,
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
      conversationRef = db.collection('whatsappConversations').doc(conversationId)
      await conversationRef.update({
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
        errorCode: twilioResponse.errorCode || null,
        errorMessage: twilioResponse.errorMessage || null,
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
  } catch (serverError: any) {
    console.error("Firestore error in sendWhatsAppMessageAction:", serverError);
    // Now we create the contextual error and throw it
    const permissionError = new FirestorePermissionError({
      path: (serverError.ref?.path || 'unknown path'),
      operation: 'write',
      requestResourceData: (serverError.requestData || { info: "data not captured" }),
      serverError,
    });

    // Instead of just emitting, we now throw the error so the server action fails informatively
    throw permissionError;
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
