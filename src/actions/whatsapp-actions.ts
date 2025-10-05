
// src/actions/whatsapp-actions.ts
'use server';

import { db } from '@/lib/firebase-admin';
import { sendWhatsAppMessage, getMessageStatus } from '@/lib/twilio-service';
import { FieldValue } from 'firebase-admin/firestore';
import type { SendWhatsAppMessageInput, SendWhatsAppMessageResult, WhatsAppMessage, WhatsAppConversation } from '@/lib/types';
import { FirestorePermissionError } from '@/firebase/errors';

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

  if (!input.partnerId) {
    return { success: false, message: 'Partner ID is required' };
  }

  try {
    // Send via Twilio WhatsApp first
    const twilioResponse = await sendWhatsAppMessage({
      to: input.to,
      body: input.message,
      mediaUrl: input.mediaUrl,
    });

    // Get or create conversation
    let conversationId = input.conversationId;
    let conversationRef;
    
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
      conversationRef = db.collection('whatsappConversations').doc(conversationId);
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

    // Add media attachment if present
    if (input.mediaUrl) {
      messageData.attachments = [{
        id: messageRef.id,
        type: 'image',
        name: 'media',
        url: input.mediaUrl,
        size: 0,
        mimeType: 'image/jpeg',
      }];
      messageData.whatsappMetadata!.numMedia = 1;
      messageData.whatsappMetadata!.mediaUrls = [input.mediaUrl];
    }

    await messageRef.set(messageData);

    return {
      success: true,
      message: 'WhatsApp message sent successfully',
      messageId: messageRef.id,
      twilioSid: twilioResponse.sid,
      conversationId,
    };
  } catch (serverError: any) {
    console.error("Error in sendWhatsAppMessageAction:", serverError);
    
    // Handle Firestore permission errors
    if (serverError.code === 7 || serverError.message?.includes('PERMISSION_DENIED')) {
      const permissionError = new FirestorePermissionError({
        path: serverError.ref?.path || 'unknown path',
        operation: 'write',
        requestResourceData: serverError.requestData || { info: "data not captured" },
      });
      throw permissionError;
    }
    
    // Handle Twilio errors
    if (serverError.message?.includes('Twilio') || serverError.message?.includes('WhatsApp')) {
      return {
        success: false,
        message: `Twilio error: ${serverError.message}`,
      };
    }
    
    return {
      success: false,
      message: serverError.message || 'Failed to send WhatsApp message',
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
    console.error('Error fetching WhatsApp conversations:', error);
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
    console.error('Error fetching WhatsApp messages:', error);
    throw error;
  }
}

/**
 * Update WhatsApp message status from Twilio webhook
 */
export async function updateWhatsAppMessageStatus(twilioSid: string, status: string): Promise<void> {
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
    console.error('Error updating WhatsApp message status:', error);
    throw error;
  }
}

/**
 * Get WhatsApp message status from Twilio
 */
export async function checkWhatsAppMessageStatus(twilioSid: string): Promise<string> {
  try {
    return await getMessageStatus(twilioSid);
  } catch (error: any) {
    console.error('Error checking WhatsApp message status:', error);
    throw error;
  }
}

/**
 * Mark WhatsApp message as read
 */
export async function markWhatsAppMessageAsRead(messageId: string): Promise<void> {
  if (!db) {
    throw new Error('Server not configured');
  }

  try {
    await db.collection('whatsappMessages').doc(messageId).update({
      'whatsappMetadata.twilioStatus': 'read',
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error: any) {
    console.error('Error marking WhatsApp message as read:', error);
    throw error;
  }
}
