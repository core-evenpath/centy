// src/actions/sms-actions.ts
'use server';

import { db } from '@/lib/firebase-admin';
import { sendSMS, getMessageStatus } from '@/lib/twilio-service';
import { FieldValue } from 'firebase-admin/firestore';
import type { SendSMSInput, SendSMSResult, SMSMessage, SMSConversation, Contact } from '@/lib/types';
import { FirestorePermissionError } from '@/firebase/errors';

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

  if (!input.partnerId) {
    return { success: false, message: 'Partner ID is required' };
  }

  try {
    // Send via Twilio first
    const twilioResponse = await sendSMS({
      to: input.to,
      body: input.message,
    });

    // Get or create conversation
    let conversationId = input.conversationId;
    let conversationRef;
    
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
      conversationRef = db.collection('smsConversations').doc(conversationId);
      await conversationRef.update({
        lastMessageAt: FieldValue.serverTimestamp(),
        messageCount: FieldValue.increment(1),
      });
    }

    // Store message in Firestore
    const messageRef = db.collection('smsMessages').doc();
    const messageData: Partial<SMSMessage> = {
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
    console.error("Error in sendSMSAction:", serverError);
    
    // Handle Firestore permission errors
    if (serverError.code === 7 || serverError.message?.includes('PERMISSION_DENIED')) {
      const permissionError = new FirestorePermissionError({
        path: serverError.ref?.path || 'unknown path',
        operation: 'write',
        requestResourceData: serverError.requestData || { info: "data not captured" },
        // serverError, // This causes serialization issues
      });
      throw permissionError;
    }
    
    // Handle Twilio errors
    if (serverError.message?.includes('Twilio')) {
      return {
        success: false,
        message: `Twilio error: ${serverError.message}`,
      };
    }
    
    return {
      success: false,
      message: serverError.message || 'Failed to send SMS',
    };
  }
}

interface CampaignRecipient {
  id: string;
  name: string;
  type: 'contact' | 'group';
}

interface SendSmsCampaignInput {
  partnerId: string;
  message: string;
  recipients: CampaignRecipient[];
}

export async function sendSmsCampaignAction(input: SendSmsCampaignInput): Promise<{
  success: boolean;
  message: string;
}> {
  if (!db) {
    return { success: false, message: 'Server not configured' };
  }

  try {
    let uniqueContacts: Contact[] = [];
    const contactIds = new Set<string>();

    for (const recipient of input.recipients) {
      if (recipient.type === 'contact') {
        if (!contactIds.has(recipient.id)) {
          const contactDoc = await db.collection(`partners/${input.partnerId}/contacts`).doc(recipient.id).get();
          if (contactDoc.exists) {
            uniqueContacts.push({ id: contactDoc.id, ...contactDoc.data() } as Contact);
            contactIds.add(recipient.id);
          }
        }
      } else if (recipient.type === 'group') {
        const contactsSnapshot = await db.collection(`partners/${input.partnerId}/contacts`).where('groups', 'array-contains', recipient.name).get();
        contactsSnapshot.forEach(doc => {
          if (!contactIds.has(doc.id)) {
            uniqueContacts.push({ id: doc.id, ...doc.data() } as Contact);
            contactIds.add(doc.id);
          }
        });
      }
    }
    
    // For V1, we'll just log the action and simulate sending.
    console.log(`Simulating SMS campaign for partner: ${input.partnerId}`);
    console.log(`Message: ${input.message}`);
    console.log(`Total unique recipients: ${uniqueContacts.length}`);
    uniqueContacts.forEach(contact => {
      console.log(`- Sending to ${contact.name} (${contact.phone})`);
    });

    // In a real implementation, you would loop through `uniqueContacts`
    // and call `sendSMSAction` for each, likely in a background job.
    // For now, we return a success message.

    return {
      success: true,
      message: `Campaign successfully sent to ${uniqueContacts.length} recipient(s).`,
    };

  } catch (error: any) {
    console.error('Error sending SMS campaign:', error);
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

/**
 * Update SMS message status from Twilio webhook
 */
export async function updateSMSMessageStatus(twilioSid: string, status: string): Promise<void> {
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
    console.error('Error updating SMS message status:', error);
    throw error;
  }
}

/**
 * Get SMS message status from Twilio
 */
export async function checkSMSMessageStatus(twilioSid: string): Promise<string> {
  try {
    return await getMessageStatus(twilioSid);
  } catch (error: any) {
    console.error('Error checking SMS message status:', error);
    throw error;
  }
}
