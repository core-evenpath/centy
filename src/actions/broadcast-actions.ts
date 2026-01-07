'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type {
  Broadcast,
  BroadcastResult,
  SendBroadcastResult,
  CreateBroadcastInput,
  UpdateBroadcastInput,
  BroadcastRecipient,
  BroadcastMetrics,
  DEFAULT_BROADCAST_METRICS,
} from '@/lib/types-broadcast';
import { sendMetaTextMessage, sendMetaMediaMessage, getPartnerMetaConfig } from '@/lib/meta-whatsapp-service';
import { sendTelegramTextMessage, sendTelegramPhoto, getPartnerTelegramConfig } from '@/lib/telegram-service';

// ============================================
// CREATE BROADCAST (Draft or Scheduled)
// ============================================
export async function createBroadcastAction(
  input: CreateBroadcastInput
): Promise<BroadcastResult> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    console.log(`📤 Creating broadcast for partner: ${input.partnerId}`);

    // Validate channel connection
    if (input.channel === 'whatsapp') {
      const config = await getPartnerMetaConfig(input.partnerId);
      if (!config || config.status !== 'active') {
        return { success: false, message: 'WhatsApp is not connected. Please connect WhatsApp first.' };
      }
    } else if (input.channel === 'telegram') {
      const config = await getPartnerTelegramConfig(input.partnerId);
      if (!config || config.status !== 'active') {
        return { success: false, message: 'Telegram is not connected. Please connect Telegram first.' };
      }
    }

    // Fetch contact details for recipients
    const contactsSnapshot = await db
      .collection('contacts')
      .where('partnerId', '==', input.partnerId)
      .where('__name__', 'in', input.recipientContactIds.slice(0, 10)) // Firestore limit
      .get();

    // For larger lists, we need to batch
    let allContacts: FirebaseFirestore.DocumentSnapshot[] = contactsSnapshot.docs;

    if (input.recipientContactIds.length > 10) {
      // Batch fetch remaining contacts
      const batches = [];
      for (let i = 10; i < input.recipientContactIds.length; i += 10) {
        const batchIds = input.recipientContactIds.slice(i, i + 10);
        batches.push(
          db.collection('contacts')
            .where('partnerId', '==', input.partnerId)
            .where('__name__', 'in', batchIds)
            .get()
        );
      }
      const batchResults = await Promise.all(batches);
      batchResults.forEach(result => {
        allContacts = allContacts.concat(result.docs);
      });
    }

    const recipientCount = allContacts.length;

    if (recipientCount === 0) {
      return { success: false, message: 'No valid recipients found' };
    }

    // Determine status based on scheduling
    const status = input.scheduledFor ? 'scheduled' : 'draft';

    // Create broadcast document
    const broadcastRef = db.collection('broadcasts').doc();
    const now = FieldValue.serverTimestamp();

    const broadcastData: Omit<Broadcast, 'id'> = {
      partnerId: input.partnerId,
      title: input.title,
      channel: input.channel,
      status,
      message: input.message,
      hasImage: input.hasImage || false,
      imageUrl: input.imageUrl,
      buttons: input.buttons || [],
      templateId: input.templateId,
      recipientCount,
      recipientGroupId: input.recipientGroupId,
      metrics: {
        totalRecipients: recipientCount,
        sent: 0,
        delivered: 0,
        read: 0,
        replied: 0,
        failed: 0,
        deliveryRate: 0,
        readRate: 0,
        replyRate: 0,
      },
      scheduledFor: input.scheduledFor ? Timestamp.fromDate(input.scheduledFor) : null,
      createdAt: now as any,
      updatedAt: now as any,
      sentAt: null,
      completedAt: null,
      createdBy: input.createdBy,
      createdByName: input.createdByName,
    };

    await broadcastRef.set(broadcastData);

    // Create recipients subcollection
    const recipientsBatch = db.batch();
    allContacts.forEach(contactDoc => {
      const contact = contactDoc.data();
      const recipientRef = broadcastRef.collection('recipients').doc(contactDoc.id);
      const recipientData: Omit<BroadcastRecipient, 'id'> = {
        contactId: contactDoc.id,
        name: contact?.name || contact?.displayName || 'Unknown',
        phone: contact?.phone || contact?.waPhone || '',
        platform: input.channel,
        status: 'pending',
        sentAt: null,
        deliveredAt: null,
        readAt: null,
        repliedAt: null,
        failedAt: null,
      };
      recipientsBatch.set(recipientRef, recipientData);
    });
    await recipientsBatch.commit();

    console.log(`✅ Broadcast created: ${broadcastRef.id} with ${recipientCount} recipients`);

    return {
      success: true,
      message: status === 'scheduled' ? 'Broadcast scheduled successfully' : 'Broadcast draft saved',
      broadcastId: broadcastRef.id,
    };
  } catch (error: any) {
    console.error('❌ Error creating broadcast:', error);
    return { success: false, message: error.message };
  }
}

// ============================================
// SEND BROADCAST NOW
// ============================================
export async function sendBroadcastAction(
  broadcastId: string,
  partnerId: string
): Promise<SendBroadcastResult> {
  if (!db) {
    return { success: false, message: 'Database not available', totalSent: 0, totalFailed: 0 };
  }

  try {
    console.log(`📤 Sending broadcast: ${broadcastId}`);

    // Get broadcast
    const broadcastRef = db.collection('broadcasts').doc(broadcastId);
    const broadcastDoc = await broadcastRef.get();

    if (!broadcastDoc.exists) {
      return { success: false, message: 'Broadcast not found', totalSent: 0, totalFailed: 0 };
    }

    const broadcast = broadcastDoc.data() as Broadcast;

    if (broadcast.partnerId !== partnerId) {
      return { success: false, message: 'Unauthorized', totalSent: 0, totalFailed: 0 };
    }

    if (broadcast.status === 'sent' || broadcast.status === 'sending') {
      return { success: false, message: 'Broadcast already sent or sending', totalSent: 0, totalFailed: 0 };
    }

    // Update status to sending
    await broadcastRef.update({
      status: 'sending',
      sentAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Get partner config
    let sendFunction: (phone: string, message: string, imageUrl?: string) => Promise<{ success: boolean; messageId?: string; error?: string }>;

    if (broadcast.channel === 'whatsapp') {
      const config = await getPartnerMetaConfig(partnerId);
      if (!config || config.status !== 'active') {
        await broadcastRef.update({ status: 'failed', updatedAt: FieldValue.serverTimestamp() });
        return { success: false, message: 'WhatsApp not connected', totalSent: 0, totalFailed: 0 };
      }

      sendFunction = async (phone: string, message: string, imageUrl?: string) => {
        try {
          if (imageUrl) {
            const result = await sendMetaMediaMessage(partnerId, phone, 'image', imageUrl, message);
            return { success: result.success, messageId: result.messageId, error: result.error };
          } else {
            const result = await sendMetaTextMessage(partnerId, phone, message);
            return { success: result.success, messageId: result.messageId, error: result.error };
          }
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      };
    } else if (broadcast.channel === 'telegram') {
      const config = await getPartnerTelegramConfig(partnerId);
      if (!config || config.status !== 'active') {
        await broadcastRef.update({ status: 'failed', updatedAt: FieldValue.serverTimestamp() });
        return { success: false, message: 'Telegram not connected', totalSent: 0, totalFailed: 0 };
      }

      sendFunction = async (chatId: string, message: string, imageUrl?: string) => {
        try {
          // For Telegram, we use the chat ID directly
          if (imageUrl) {
            const result = await sendTelegramPhoto(partnerId, chatId, imageUrl, message);
            return { success: result.success, messageId: result.messageId?.toString(), error: result.error };
          } else {
            const result = await sendTelegramTextMessage(partnerId, chatId, message);
            return { success: result.success, messageId: result.messageId?.toString(), error: result.error };
          }
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      };
    } else {
      await broadcastRef.update({ status: 'failed', updatedAt: FieldValue.serverTimestamp() });
      return { success: false, message: 'Unsupported channel', totalSent: 0, totalFailed: 0 };
    }

    // Get recipients
    const recipientsSnapshot = await broadcastRef.collection('recipients').get();

    let totalSent = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    // Send to each recipient with rate limiting
    for (const recipientDoc of recipientsSnapshot.docs) {
      const recipient = recipientDoc.data() as BroadcastRecipient;

      if (!recipient.phone) {
        await recipientDoc.ref.update({
          status: 'failed',
          failedAt: FieldValue.serverTimestamp(),
          failureReason: 'No phone number',
        });
        totalFailed++;
        continue;
      }

      // Personalize message
      const personalizedMessage = broadcast.message
        .replace(/\{\{name\}\}/g, recipient.name || 'there');

      // Send message
      const result = await sendFunction(
        recipient.phone,
        personalizedMessage,
        broadcast.hasImage ? broadcast.imageUrl : undefined
      );

      if (result.success) {
        await recipientDoc.ref.update({
          status: 'sent',
          sentAt: FieldValue.serverTimestamp(),
          messageId: result.messageId,
        });
        totalSent++;
      } else {
        await recipientDoc.ref.update({
          status: 'failed',
          failedAt: FieldValue.serverTimestamp(),
          failureReason: result.error || 'Send failed',
        });
        totalFailed++;
        if (result.error) {
          errors.push(`${recipient.name}: ${result.error}`);
        }
      }

      // Rate limiting - 1 message per 100ms (10 messages per second)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update broadcast metrics
    const deliveryRate = totalSent > 0 ? Math.round((totalSent / (totalSent + totalFailed)) * 100) : 0;

    await broadcastRef.update({
      status: 'sent',
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      'metrics.sent': totalSent,
      'metrics.failed': totalFailed,
      'metrics.deliveryRate': deliveryRate,
    });

    console.log(`✅ Broadcast sent: ${totalSent} sent, ${totalFailed} failed`);

    return {
      success: true,
      message: `Broadcast sent to ${totalSent} recipients`,
      totalSent,
      totalFailed,
      errors: errors.slice(0, 10), // Limit error list
    };
  } catch (error: any) {
    console.error('❌ Error sending broadcast:', error);

    // Update status to failed
    try {
      await db.collection('broadcasts').doc(broadcastId).update({
        status: 'failed',
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (e) {
      console.error('Failed to update broadcast status:', e);
    }

    return { success: false, message: error.message, totalSent: 0, totalFailed: 0 };
  }
}

// ============================================
// UPDATE BROADCAST (Draft only)
// ============================================
export async function updateBroadcastAction(
  input: UpdateBroadcastInput
): Promise<BroadcastResult> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const broadcastRef = db.collection('broadcasts').doc(input.broadcastId);
    const broadcastDoc = await broadcastRef.get();

    if (!broadcastDoc.exists) {
      return { success: false, message: 'Broadcast not found' };
    }

    const broadcast = broadcastDoc.data() as Broadcast;

    if (broadcast.partnerId !== input.partnerId) {
      return { success: false, message: 'Unauthorized' };
    }

    if (broadcast.status !== 'draft' && broadcast.status !== 'scheduled') {
      return { success: false, message: 'Cannot edit a sent broadcast' };
    }

    const updates: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (input.title !== undefined) updates.title = input.title;
    if (input.message !== undefined) updates.message = input.message;
    if (input.hasImage !== undefined) updates.hasImage = input.hasImage;
    if (input.imageUrl !== undefined) updates.imageUrl = input.imageUrl;
    if (input.buttons !== undefined) updates.buttons = input.buttons;
    if (input.scheduledFor !== undefined) {
      updates.scheduledFor = input.scheduledFor ? Timestamp.fromDate(input.scheduledFor) : null;
      updates.status = input.scheduledFor ? 'scheduled' : 'draft';
    }

    await broadcastRef.update(updates);

    console.log(`✅ Broadcast updated: ${input.broadcastId}`);

    return {
      success: true,
      message: 'Broadcast updated successfully',
      broadcastId: input.broadcastId,
    };
  } catch (error: any) {
    console.error('❌ Error updating broadcast:', error);
    return { success: false, message: error.message };
  }
}

// ============================================
// DELETE BROADCAST
// ============================================
export async function deleteBroadcastAction(
  broadcastId: string,
  partnerId: string
): Promise<BroadcastResult> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const broadcastRef = db.collection('broadcasts').doc(broadcastId);
    const broadcastDoc = await broadcastRef.get();

    if (!broadcastDoc.exists) {
      return { success: false, message: 'Broadcast not found' };
    }

    const broadcast = broadcastDoc.data() as Broadcast;

    if (broadcast.partnerId !== partnerId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Delete recipients subcollection first
    const recipientsSnapshot = await broadcastRef.collection('recipients').get();
    const batch = db.batch();
    recipientsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    // Delete broadcast document
    await broadcastRef.delete();

    console.log(`✅ Broadcast deleted: ${broadcastId}`);

    return {
      success: true,
      message: 'Broadcast deleted successfully',
    };
  } catch (error: any) {
    console.error('❌ Error deleting broadcast:', error);
    return { success: false, message: error.message };
  }
}

// ============================================
// CANCEL SCHEDULED BROADCAST
// ============================================
export async function cancelBroadcastAction(
  broadcastId: string,
  partnerId: string
): Promise<BroadcastResult> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const broadcastRef = db.collection('broadcasts').doc(broadcastId);
    const broadcastDoc = await broadcastRef.get();

    if (!broadcastDoc.exists) {
      return { success: false, message: 'Broadcast not found' };
    }

    const broadcast = broadcastDoc.data() as Broadcast;

    if (broadcast.partnerId !== partnerId) {
      return { success: false, message: 'Unauthorized' };
    }

    if (broadcast.status !== 'scheduled') {
      return { success: false, message: 'Can only cancel scheduled broadcasts' };
    }

    await broadcastRef.update({
      status: 'cancelled',
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ Broadcast cancelled: ${broadcastId}`);

    return {
      success: true,
      message: 'Broadcast cancelled successfully',
    };
  } catch (error: any) {
    console.error('❌ Error cancelling broadcast:', error);
    return { success: false, message: error.message };
  }
}

// ============================================
// DUPLICATE BROADCAST
// ============================================
export async function duplicateBroadcastAction(
  broadcastId: string,
  partnerId: string,
  createdBy: string
): Promise<BroadcastResult> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const broadcastRef = db.collection('broadcasts').doc(broadcastId);
    const broadcastDoc = await broadcastRef.get();

    if (!broadcastDoc.exists) {
      return { success: false, message: 'Broadcast not found' };
    }

    const broadcast = broadcastDoc.data() as Broadcast;

    if (broadcast.partnerId !== partnerId) {
      return { success: false, message: 'Unauthorized' };
    }

    // Get recipients
    const recipientsSnapshot = await broadcastRef.collection('recipients').get();
    const recipientContactIds = recipientsSnapshot.docs.map(doc => doc.data().contactId);

    // Create new broadcast as draft
    const result = await createBroadcastAction({
      partnerId,
      title: `${broadcast.title} (Copy)`,
      channel: broadcast.channel,
      message: broadcast.message,
      hasImage: broadcast.hasImage,
      imageUrl: broadcast.imageUrl,
      buttons: broadcast.buttons,
      templateId: broadcast.templateId,
      recipientContactIds,
      createdBy,
    });

    return result;
  } catch (error: any) {
    console.error('❌ Error duplicating broadcast:', error);
    return { success: false, message: error.message };
  }
}

// ============================================
// GET BROADCAST BY ID
// ============================================
export async function getBroadcastAction(
  broadcastId: string,
  partnerId: string
): Promise<BroadcastResult> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const broadcastRef = db.collection('broadcasts').doc(broadcastId);
    const broadcastDoc = await broadcastRef.get();

    if (!broadcastDoc.exists) {
      return { success: false, message: 'Broadcast not found' };
    }

    const broadcast = { id: broadcastDoc.id, ...broadcastDoc.data() } as Broadcast;

    if (broadcast.partnerId !== partnerId) {
      return { success: false, message: 'Unauthorized' };
    }

    return {
      success: true,
      message: 'Broadcast retrieved successfully',
      broadcast,
    };
  } catch (error: any) {
    console.error('❌ Error getting broadcast:', error);
    return { success: false, message: error.message };
  }
}

// ============================================
// UPDATE RECIPIENT STATUS (for webhook updates)
// ============================================
export async function updateRecipientStatusAction(
  broadcastId: string,
  recipientId: string,
  status: 'delivered' | 'read' | 'replied',
  messageId?: string
): Promise<{ success: boolean; message: string }> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const recipientRef = db
      .collection('broadcasts')
      .doc(broadcastId)
      .collection('recipients')
      .doc(recipientId);

    const updates: Record<string, any> = {
      status,
    };

    if (status === 'delivered') {
      updates.deliveredAt = FieldValue.serverTimestamp();
    } else if (status === 'read') {
      updates.readAt = FieldValue.serverTimestamp();
    } else if (status === 'replied') {
      updates.repliedAt = FieldValue.serverTimestamp();
    }

    await recipientRef.update(updates);

    // Update broadcast metrics
    const broadcastRef = db.collection('broadcasts').doc(broadcastId);
    const metricsField = status === 'delivered' ? 'metrics.delivered' :
      status === 'read' ? 'metrics.read' : 'metrics.replied';

    await broadcastRef.update({
      [metricsField]: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, message: 'Status updated' };
  } catch (error: any) {
    console.error('❌ Error updating recipient status:', error);
    return { success: false, message: error.message };
  }
}

// ============================================
// GET BROADCAST RECIPIENTS
// ============================================
export async function getBroadcastRecipientsAction(
  broadcastId: string,
  partnerId: string,
  limit: number = 50,
  startAfter?: string
): Promise<{ success: boolean; recipients: BroadcastRecipient[]; hasMore: boolean; message?: string }> {
  if (!db) {
    return { success: false, recipients: [], hasMore: false, message: 'Database not available' };
  }

  try {
    const broadcastRef = db.collection('broadcasts').doc(broadcastId);
    const broadcastDoc = await broadcastRef.get();

    if (!broadcastDoc.exists) {
      return { success: false, recipients: [], hasMore: false, message: 'Broadcast not found' };
    }

    const broadcast = broadcastDoc.data() as Broadcast;

    if (broadcast.partnerId !== partnerId) {
      return { success: false, recipients: [], hasMore: false, message: 'Unauthorized' };
    }

    let query = broadcastRef.collection('recipients').orderBy('name').limit(limit + 1);

    if (startAfter) {
      const startDoc = await broadcastRef.collection('recipients').doc(startAfter).get();
      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }

    const snapshot = await query.get();
    const hasMore = snapshot.docs.length > limit;
    const recipients = snapshot.docs.slice(0, limit).map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as BroadcastRecipient[];

    return { success: true, recipients, hasMore };
  } catch (error: any) {
    console.error('❌ Error getting broadcast recipients:', error);
    return { success: false, recipients: [], hasMore: false, message: error.message };
  }
}
