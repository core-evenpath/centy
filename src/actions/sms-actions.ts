// src/actions/sms-actions.ts
'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
import type { SendSMSInput, SendSMSResult, SMSMessage, SMSConversation, Contact } from '@/lib/types';
import { FirestorePermissionError } from '@/firebase/errors';
import { sendSMS, getMessageStatus } from '@/lib/twilio-service';

/**
 * Send an SMS message and store it in Firestore
 */
export async function sendSMSAction(input: SendSMSInput): Promise<SendSMSResult> {
  if (!db) {
    return { success: false, message: 'Server not configured' };
  }

  // Validate input
  if (!input.to || (!input.message && !input.mediaUrl)) {
    return { success: false, message: 'Phone number and a message or image are required' };
  }

  if (!input.partnerId) {
    return { success: false, message: 'Partner ID is required' };
  }

  try {
    // Send via Twilio first
    const twilioResponse = await sendSMS({
      to: input.to,
      body: input.message,
      mediaUrl: input.mediaUrl,
    });

    let conversationId = input.conversationId;
    let conversationRef;

    // If no conversationId is provided, try to find an existing one for this phone number
    if (!conversationId) {
        const q = await db.collection('smsConversations')
            .where('partnerId', '==', input.partnerId)
            .where('customerPhone', '==', input.to)
            .limit(1)
            .get();

        if (!q.empty) {
            conversationId = q.docs[0].id;
            conversationRef = q.docs[0].ref;
        }
    }
    
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
      if (!conversationRef) {
          conversationRef = db.collection('smsConversations').doc(conversationId);
      }
      await conversationRef.update({
        lastMessageAt: FieldValue.serverTimestamp(),
        messageCount: FieldValue.increment(1),
        isActive: true,
      });
    }

    // Store message in Firestore
    const messageRef = db.collection('smsMessages').doc();
    const messageData: Partial<SMSMessage> = {
      id: messageRef.id,
      conversationId,
      partnerId: input.partnerId, // ✅ CRITICAL: Added partnerId
      senderId: input.partnerId,
      type: input.mediaUrl ? 'image' : 'text',
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

    if (input.mediaUrl) {
      messageData.attachments = [{
        id: messageRef.id,
        type: 'image',
        name: 'media_attachment',
        url: input.mediaUrl,
        size: 0,
        mimeType: 'image/png',
      }];
    }

    await messageRef.set(messageData);

    return {
      success: true,
      message: 'SMS sent successfully',
      messageId: messageRef.id,
      twilioSid: twilioResponse.sid,
      conversationId,
    };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    
    if (error.code === 7 || error.message?.includes('PERMISSION_DENIED')) {
      const permissionError = new FirestorePermissionError({
        path: error.ref?.path || 'unknown path',
        operation: 'write',
        requestResourceData: error.requestData || { info: "data not captured" },
      });
      throw permissionError;
    }
    
    return {
      success: false,
      message: error.message || 'Failed to send SMS',
    };
  }
}

/**
 * Send SMS to multiple contacts (campaign)
 */
export async function sendSMSCampaignAction(input: {
  partnerId: string;
  message: string;
  recipients: Array<{ id: string; name: string; type: 'contact' | 'group' }>;
  mediaUrl?: string;
}): Promise<{ success: boolean; message: string }> {
  if (!db) {
    return { success: false, message: 'Server not configured' };
  }

  try {
    const contactIds = new Set<string>();

    for (const recipient of input.recipients) {
      if (recipient.type === 'contact') {
        contactIds.add(recipient.id);
      } else if (recipient.type === 'group') {
        const contactsSnapshot = await db
          .collection(`partners/${input.partnerId}/contacts`)
          .where('groups', 'array-contains', recipient.name)
          .get();
        contactsSnapshot.forEach(doc => {
          contactIds.add(doc.id);
        });
      }
    }

    const uniqueContactIds = Array.from(contactIds);
    let contactsToSend: Contact[] = [];

    if (uniqueContactIds.length > 0) {
      const contactsSnapshot = await db
        .collection(`partners/${input.partnerId}/contacts`)
        .where(admin.firestore.FieldPath.documentId(), 'in', uniqueContactIds)
        .get();
      contactsToSend = contactsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Contact));
    }

    const sendPromises = contactsToSend.map(contact => {
      if (contact.phone) {
        return sendSMSAction({
          partnerId: input.partnerId,
          to: contact.phone,
          message: input.message,
          mediaUrl: input.mediaUrl,
        }).catch(err => {
          console.error(`Failed to send SMS to ${contact.phone}:`, err);
          return { success: false, message: `Failed to send to ${contact.name}` };
        });
      }
      return Promise.resolve({ 
        success: false, 
        message: `No phone for ${contact.name}` 
      });
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;

    return {
      success: true,
      message: `Campaign sent to ${successCount} of ${contactsToSend.length} recipient(s).`,
    };
  } catch (error: any) {
    console.error('Error in sendSMSCampaignAction:', error);
    return {
      success: false,
      message: `Failed to send campaign: ${error.message}`,
    };
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
    console.error('Error fetching SMS conversations:', error);
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
    console.error('Error fetching SMS messages:', error);
    throw error;
  }
}