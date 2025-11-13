'use server';

import { db, storage } from '@/lib/firebase-admin';
import { GoogleGenAI } from '@google/genai';
import { exportConversationToText } from './conversation-export-actions';
import type { VaultFile } from '@/lib/types';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface SyncConversationResult {
  success: boolean;
  message: string;
  vaultDocumentId?: string;
}

export async function syncConversationToVault(
  conversationId: string,
  platform: 'sms' | 'whatsapp',
  partnerId: string
): Promise<SyncConversationResult> {
  if (!db || !storage) {
    return { success: false, message: 'Database not available' };
  }

  try {
    console.log(`🔄 Syncing conversation ${conversationId} to vault`);

    // Get conversation data for customer info
    const conversationCollection = platform === 'sms' ? 'smsConversations' : 'whatsappConversations';
    const conversationDoc = await db
      .collection(conversationCollection)
      .doc(conversationId)
      .get();

    if (!conversationDoc.exists) {
      return { success: false, message: 'Conversation not found' };
    }

    const conversationData = conversationDoc.data();
    const customerPhone = conversationData?.customerPhone;
    const customerName = conversationData?.customerName || conversationData?.contactName || 'Unknown';

    if (!customerPhone) {
      return { success: false, message: 'Customer phone not found' };
    }

    console.log(`📱 Customer: ${customerName} (${customerPhone})`);

    // Export conversation to text
    const exportResult = await exportConversationToText(conversationId, platform, partnerId);
    
    if (!exportResult.success || !exportResult.conversationText) {
      return { success: false, message: exportResult.message };
    }

    // Check if document already exists for THIS customer
    const existingDocsSnapshot = await db
      .collection(`partners/${partnerId}/vaultFiles`)
      .where('sourceType', '==', 'conversation')
      .where('customerPhone', '==', customerPhone)
      .where('conversationPlatform', '==', platform)
      .limit(1)
      .get();

    let vaultDocId: string;
    const timestamp = Date.now();
    const fileName = `conversation_${customerName}_${customerPhone}_${timestamp}.txt`;
    const storagePath = `partners/${partnerId}/vault/conversations/${customerPhone}_${platform}.txt`;

    // Upload to Firebase Storage
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    await file.save(exportResult.conversationText, {
      contentType: 'text/plain',
      metadata: {
        conversationId,
        platform,
        partnerId,
        customerPhone,
        customerName,
      },
    });

    console.log('✅ Uploaded to Firebase Storage');

    // Upload to Gemini File API
    const tempFilePath = `/tmp/${fileName}`;
    const fs = require('fs');
    fs.writeFileSync(tempFilePath, exportResult.conversationText);

    let uploadResponse;
    try {
      uploadResponse = await genAI.fileSearchStores.uploadFile({
        file: tempFilePath,
        config: {
          mimeType: 'text/plain',
          displayName: fileName,
        }
      });
    } catch (uploadError: any) {
      console.error('❌ Gemini upload failed:', uploadError);
      fs.unlinkSync(tempFilePath);
      throw uploadError;
    }

    console.log('✅ Uploaded to Gemini:', uploadResponse.file?.uri);
    fs.unlinkSync(tempFilePath);

    // Get or create file search store
    const storesSnapshot = await db
      .collection(`partners/${partnerId}/fileSearchStores`)
      .where('state', '==', 'ACTIVE')
      .limit(1)
      .get();

    let ragStoreName: string;

    if (storesSnapshot.empty) {
      const newStore = await genAI.fileSearchStores.create({
        config: { displayName: `${partnerId}-vault` }
      });
      ragStoreName = newStore.name!;

      await db.collection(`partners/${partnerId}/fileSearchStores`).doc('primary').set({
        name: ragStoreName,
        displayName: `${partnerId}-vault`,
        partnerId,
        createdAt: new Date(),
        state: 'ACTIVE',
      });

      console.log('✅ Created new file search store:', ragStoreName);
    } else {
      ragStoreName = storesSnapshot.docs[0].data().name;
    }

    // Add file to store
    if (uploadResponse.file?.name) {
      await genAI.fileSearchStores.addFiles({
        fileSearchStoreName: ragStoreName,
        fileNames: [uploadResponse.file.name],
      });
      console.log('✅ Added file to search store');
    }

    // Create or update vault record with customer-specific metadata
    if (!existingDocsSnapshot.empty) {
      // Update existing
      vaultDocId = existingDocsSnapshot.docs[0].id;
      await db
        .collection(`partners/${partnerId}/vaultFiles`)
        .doc(vaultDocId)
        .update({
          geminiFileUri: uploadResponse.file?.uri,
          state: 'ACTIVE',
          updatedAt: new Date(),
          sizeBytes: exportResult.conversationText.length,
          metadata: exportResult.metadata,
          customerPhone,
          customerName,
        });
      console.log('✅ Updated existing vault document');
    } else {
      // Create new with customer-specific metadata
      const vaultFileRef = db.collection(`partners/${partnerId}/vaultFiles`).doc();
      vaultDocId = vaultFileRef.id;

      const vaultFile: Partial<VaultFile> = {
        name: uploadResponse.file?.name || fileName,
        displayName: fileName,
        mimeType: 'text/plain',
        sizeBytes: exportResult.conversationText.length,
        uri: storagePath,
        state: 'ACTIVE',
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'system',
        partnerId,
        geminiFileUri: uploadResponse.file?.uri,
        createdAt: new Date().toISOString(),
        firebaseStoragePath: storagePath,
        sourceType: 'conversation',
        conversationId,
        conversationPlatform: platform,
        customerPhone,
        customerName,
        metadata: exportResult.metadata,
      };

      await vaultFileRef.set(vaultFile);
      console.log('✅ Created new vault document with customer metadata');
    }

    // Update conversation metadata
    await db
      .collection(conversationCollection)
      .doc(conversationId)
      .update({
        lastSyncedAt: new Date(),
        lastSyncedMessageCount: exportResult.metadata?.messageCount || 0,
        vaultDocumentId: vaultDocId,
        syncStatus: 'synced',
      });

    console.log('✅ Conversation sync complete');

    return {
      success: true,
      message: 'Conversation synced to vault successfully',
      vaultDocumentId: vaultDocId,
    };
  } catch (error: any) {
    console.error('❌ Error syncing conversation:', error);
    return {
      success: false,
      message: `Failed to sync conversation: ${error.message}`,
    };
  }
}

export async function shouldSyncConversation(
  conversationId: string,
  platform: 'sms' | 'whatsapp',
  partnerId: string,
  config?: {
    batchSize?: number;
    batchInterval?: number;
  }
): Promise<boolean> {
  if (!db) return false;

  try {
    const conversationCollection = platform === 'sms' ? 'smsConversations' : 'whatsappConversations';
    const conversationDoc = await db
      .collection(conversationCollection)
      .doc(conversationId)
      .get();

    if (!conversationDoc.exists) return false;

    const conversation = conversationDoc.data();
    const batchSize = config?.batchSize || 10;
    const batchInterval = config?.batchInterval || 3600000;

    const messagesSinceSync = conversation.messageCount - (conversation.lastSyncedMessageCount || 0);
    const timeSinceSync = Date.now() - (conversation.lastSyncedAt?.toMillis() || 0);

    return (
      messagesSinceSync >= batchSize ||
      timeSinceSync >= batchInterval
    );
  } catch (error) {
    console.error('Error checking sync status:', error);
    return false;
  }
}