// src/actions/whatsapp-actions.ts
'use server';

import { db } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { sendWhatsAppMessage, getMessageStatus } from '@/lib/twilio-service';
import { FieldValue } from 'firebase-admin/firestore';
import type { SendWhatsAppMessageInput, SendWhatsAppMessageResult, WhatsAppMessage, WhatsAppConversation, Contact } from '@/lib/types';
import { FirestorePermissionError } from '@/firebase/errors';
import { normalizePhoneNumber } from '@/utils/phone-utils';

export async function sendWhatsAppMessageAction(input: SendWhatsAppMessageInput): Promise<SendWhatsAppMessageResult> {
  if (!db) {
    return { success: false, message: 'Server not configured' };
  }

  if (!input.to || (!input.message && !input.mediaUrl)) {
    return { success: false, message: 'Phone number and a message or image are required' };
  }

  if (!input.partnerId) {
    return { success: false, message: 'Partner ID is required' };
  }

  try {
    const normalizedPhoneNumber = normalizePhoneNumber(input.to);

    console.log('📤 Sending WhatsApp message:', {
      originalPhone: input.to,
      normalizedPhone: normalizedPhoneNumber,
      partnerId: input.partnerId,
      conversationId: input.conversationId
    });

    const twilioResponse = await sendWhatsAppMessage({
      to: normalizedPhoneNumber,
      body: input.message,
      mediaUrl: input.mediaUrl,
    });

    let conversationId = input.conversationId;
    let conversationRef;
    
    // Try to find existing conversation
    if (!conversationId) {
      const q = await db.collection('whatsappConversations')
        .where('partnerId', '==', input.partnerId)
        .where('customerPhone', '==', normalizedPhoneNumber)
        .limit(1)
        .get();

      if (!q.empty) {
        conversationId = q.docs[0].id;
        conversationRef = q.docs[0].ref;
        console.log('✅ Found existing WhatsApp conversation:', conversationId);
      }
    }
    
    if (!conversationId) {
      // Create new conversation
      conversationRef = db.collection('whatsappConversations').doc();
      conversationId = conversationRef.id;

      const newConversation: Partial<WhatsAppConversation> = {
        id: conversationId,
        partnerId: input.partnerId,
        type: 'direct',
        platform: 'whatsapp',
        title: `WhatsApp: ${normalizedPhoneNumber}`,
        customerPhone: normalizedPhoneNumber,
        participants: [],
        isActive: true,
        messageCount: 0,
        createdBy: input.partnerId,
        createdAt: FieldValue.serverTimestamp(),
        lastMessageAt: FieldValue.serverTimestamp(),
      };

      await conversationRef.set(newConversation);
      console.log('✨ Created new WhatsApp conversation:', conversationId, 'with phone:', normalizedPhoneNumber);
    } else {
      // Update existing conversation - but verify it exists first
      if (!conversationRef) {
        conversationRef = db.collection('whatsappConversations').doc(conversationId);
      }
      
      // Check if conversation exists before updating
      const conversationDoc = await conversationRef.get();
      
      if (conversationDoc.exists) {
        await conversationRef.update({
          lastMessageAt: FieldValue.serverTimestamp(),
          messageCount: FieldValue.increment(1),
          isActive: true
        });
        console.log('✅ Updated existing conversation');
      } else {
        // Conversation was deleted, create a new one
        console.log('⚠️ Conversation not found, creating new one');
        conversationId = conversationRef.id;
        
        const newConversation: Partial<WhatsAppConversation> = {
          id: conversationId,
          partnerId: input.partnerId,
          type: 'direct',
          platform: 'whatsapp',
          title: `WhatsApp: ${normalizedPhoneNumber}`,
          customerPhone: normalizedPhoneNumber,
          participants: [],
          isActive: true,
          messageCount: 0,
          createdBy: input.partnerId,
          createdAt: FieldValue.serverTimestamp(),
          lastMessageAt: FieldValue.serverTimestamp(),
        };
        
        await conversationRef.set(newConversation);
        console.log('✨ Created new conversation to replace missing one');
      }
    }

    const messageRef = db.collection('whatsappMessages').doc();
    const messageData: Partial<WhatsAppMessage> = {
      id: messageRef.id,
      conversationId,
      senderId: input.partnerId,
      partnerId: input.partnerId,
      type: input.mediaUrl ? 'image' : 'text',
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
        numMedia: input.mediaUrl ? 1 : 0,
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
      if (messageData.whatsappMetadata) {
        messageData.whatsappMetadata.mediaUrls = [input.mediaUrl];
      }
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
    
    if (serverError.code === 7 || serverError.message?.includes('PERMISSION_DENIED')) {
      const permissionError = new FirestorePermissionError({
        path: serverError.ref?.path || 'unknown path',
        operation: 'write',
        requestResourceData: serverError.requestData || { info: "data not captured" },
      });
      throw permissionError;
    }
    
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

interface CampaignRecipient {
  id: string;
  name: string;
  type: 'contact' | 'group';
}

interface SendWhatsAppCampaignInput {
  partnerId: string;
  message: string;
  recipients: CampaignRecipient[];
  mediaUrl?: string;
}

export async function sendWhatsAppCampaignAction(input: SendWhatsAppCampaignInput): Promise<{
  success: boolean;
  message: string;
}> {
  if (!db) {
    return { success: false, message: 'Server not configured' };
  }

  try {
    const contactIds = new Set<string>();

    for (const recipient of input.recipients) {
      if (recipient.type === 'contact') {
        contactIds.add(recipient.id);
      } else if (recipient.type === 'group') {
        const contactsSnapshot = await db.collection(`partners/${input.partnerId}/contacts`).where('groups', 'array-contains', recipient.name).get();
        contactsSnapshot.forEach(doc => {
          contactIds.add(doc.id);
        });
      }
    }
    
    const uniqueContactIds = Array.from(contactIds);
    let contactsToSend: Contact[] = [];
    
    if (uniqueContactIds.length > 0) {
      const contactsSnapshot = await db.collection(`partners/${input.partnerId}/contacts`).where(admin.firestore.FieldPath.documentId(), 'in', uniqueContactIds).get();
      contactsToSend = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact));
    }
    
    const sendPromises = contactsToSend.map(contact => {
      if (contact.phone) {
        return sendWhatsAppMessageAction({
          partnerId: input.partnerId,
          to: contact.phone,
          message: input.message,
          mediaUrl: input.mediaUrl,
        }).catch(err => {
          console.error(`Failed to send WhatsApp to ${contact.phone}:`, err);
          return { success: false, message: `Failed to send to ${contact.name}` };
        });
      }
      return Promise.resolve({ success: false, message: `No phone for ${contact.name}`});
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;

    return {
      success: true,
      message: `Campaign successfully sent to ${successCount} of ${contactsToSend.length} recipient(s).`,
    };

  } catch (error: any) {
    console.error('Error in sendWhatsAppCampaignAction:', error);
    return {
      success: false,
      message: `Failed to send campaign: ${error.message}`,
    };
  }
}

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