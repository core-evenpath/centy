// src/actions/sms-actions.ts
'use server';

import { db } from '@/lib/firebase-admin';
import { sendSMS, getMessageStatus } from '@/lib/twilio-service';
import { FieldValue } from 'firebase-admin/firestore';
import type { SendSMSInput, SendSMSResult, SMSMessage, SMSConversation } from '@/lib/types';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

/**
 * Send an SMS message and store it in Firestore
 */
export async function sendSMSAction(input: SendSMSInput): Promise<SendSMSResult> {
  if (!db) {
    return { success: false, message: 'Server not configured' };
  }

  // Validate input
  if (!input.to || !input.message) {
    return { success: false, message: 'Phone number and message are required' };
  }

  // Send via Twilio first
  const twilioResponse = await sendSMS({
    to: input.to,
    body: input.message,
  });

  // Get or create conversation
  let conversationId = input.conversationId;
  let conversationRef;

  try {
    if (!conversationId) {
      // Create new conversation
      conversationRef = db.collection('smsConversations').doc();
      conversationId = conversationRef.id;

      const newConversation: Partial<SMSConversation> = {
        id: conversationId,
        partnerId: input.partnerId,
        type: 'direct',
        platform: 'sms',
        title: `SMS: ${input.to}`,
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
      conversationRef = db.collection('smsConversations').doc(conversationId)
      await conversationRef.update({
        lastMessageAt: FieldValue.serverTimestamp(),
        messageCount: FieldValue.increment(1),
      });
    }

    // Store message in Firestore
    const messageRef = db.collection('smsMessages').doc();
    const messageData: Partial<SMSMessage> = {
      id: messageRef.id,
      conversationId,
      senderId: input.partnerId,
      type: 'text',
      content: input.message,
      direction: 'outbound',
      platform: 'sms',
      smsMetadata: {
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

    await messageRef.set(messageData);

    return {
      success: true,
      message: 'SMS sent successfully',
      messageId: messageRef.id,
      twilioSid: twilioResponse.sid,
      conversationId,
    };
  } catch (serverError: any) {
    console.error("Firestore error in sendSMSAction:", serverError);
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
 * Get SMS conversations for a partner
 */
export async function getSMSConversations(partnerId: string) {
  if (!db) {
    throw new Error('Server not configured');
  }

  try {
    const snapshot = await db
      .collection('smsConversations')
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
 * Get messages for an SMS conversation
 */
export async function getSMSMessages(conversationId: string) {
  if (!db) {
    throw new Error('Server not configured');
  }

  try {
    const snapshot = await db
      .collection('smsMessages')
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
export async function updateSMSStatus(twilioSid: string, status: string): Promise<void> {
  if (!db) {
    throw new Error('Server not configured');
  }

  try {
    // Find message by Twilio SID
    const snapshot = await db
      .collection('smsMessages')
      .where('smsMetadata.twilioSid', '==', twilioSid)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      await doc.ref.update({
        'smsMetadata.twilioStatus': status,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  } catch (error: any) {
    console.error('Error updating message status:', error);
    throw error;
  }
}
