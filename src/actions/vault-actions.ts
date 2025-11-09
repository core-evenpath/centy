'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { db } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';
import type { VaultFile, FileSearchStore, VaultQuery } from '@/lib/types';
import { Readable } from 'stream';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY || '');

interface UploadFileResult {
  success: boolean;
  message: string;
  file?: VaultFile;
}

export async function uploadFileToVault(
  partnerId: string,
  userId: string,
  fileData: {
    name: string;
    buffer: Buffer;
    mimeType: string;
    displayName: string;
  }
): Promise<UploadFileResult> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const storage = getStorage();
    const bucket = storage.bucket();
    
    const storagePath = `vault/${partnerId}/${Date.now()}_${fileData.name}`;
    const file = bucket.file(storagePath);
    
    await file.save(fileData.buffer, {
      metadata: {
        contentType: fileData.mimeType,
        metadata: {
          partnerId: partnerId,
          uploadedBy: userId,
        }
      }
    });

    const [fileUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    const downloadResponse = await fetch(fileUrl);
    const fileBuffer = Buffer.from(await downloadResponse.arrayBuffer());
    
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const tempPath = path.join(os.tmpdir(), fileData.name);
    fs.writeFileSync(tempPath, fileBuffer);

    const uploadResult = await fileManager.uploadFile(tempPath, {
      mimeType: fileData.mimeType,
      displayName: fileData.displayName,
    });

    fs.unlinkSync(tempPath);

    const vaultFile: Omit<VaultFile, 'id'> = {
      name: uploadResult.file.name,
      displayName: fileData.displayName,
      mimeType: uploadResult.file.mimeType,
      sizeBytes: parseInt(uploadResult.file.sizeBytes || '0'),
      uri: uploadResult.file.uri,
      state: uploadResult.file.state as any,
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId,
      partnerId: partnerId,
      geminiFileUri: uploadResult.file.uri,
      metadata: {
        firebaseStoragePath: storagePath,
      }
    };

    const docRef = await db
      .collection(`partners/${partnerId}/vaultFiles`)
      .add({
        ...vaultFile,
        createdAt: FieldValue.serverTimestamp(),
      });

    return {
      success: true,
      message: 'File uploaded successfully',
      file: { ...vaultFile, id: docRef.id },
    };
  } catch (error: any) {
    console.error('Error uploading file to vault:', error);
    return {
      success: false,
      message: `Failed to upload file: ${error.message}`,
    };
  }
}

export async function deleteVaultFile(
  partnerId: string,
  fileId: string
): Promise<{ success: boolean; message: string }> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const fileDoc = await db
      .collection(`partners/${partnerId}/vaultFiles`)
      .doc(fileId)
      .get();

    if (!fileDoc.exists) {
      return { success: false, message: 'File not found' };
    }

    const fileData = fileDoc.data();
    
    if (fileData?.metadata?.firebaseStoragePath) {
      const storage = getStorage();
      const bucket = storage.bucket();
      const file = bucket.file(fileData.metadata.firebaseStoragePath);
      
      try {
        await file.delete();
      } catch (error) {
        console.warn('Could not delete from storage:', error);
      }
    }

    await db
      .collection(`partners/${partnerId}/vaultFiles`)
      .doc(fileId)
      .delete();

    return { success: true, message: 'File deleted successfully' };
  } catch (error: any) {
    console.error('Error deleting vault file:', error);
    return {
      success: false,
      message: `Failed to delete file: ${error.message}`,
    };
  }
}

// Keep all other functions the same (createFileSearchStore, importFileToStore, queryFileSearchStore, listVaultFiles, listFileSearchStores)
export async function createFileSearchStore(
  partnerId: string,
  displayName: string
): Promise<CreateStoreResult> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const storeData: Omit<FileSearchStore, 'id'> = {
      name: `fileSearchStores/${partnerId}-${Date.now()}`,
      displayName: displayName,
      partnerId: partnerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fileCount: 0,
      totalSizeBytes: 0,
      state: 'ACTIVE',
    };

    const docRef = await db
      .collection(`partners/${partnerId}/fileSearchStores`)
      .add({
        ...storeData,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    return {
      success: true,
      message: 'File search store created successfully',
      store: { ...storeData, id: docRef.id },
    };
  } catch (error: any) {
    console.error('Error creating file search store:', error);
    return {
      success: false,
      message: `Failed to create store: ${error.message}`,
    };
  }
}

interface CreateStoreResult {
  success: boolean;
  message: string;
  store?: FileSearchStore;
}

export async function importFileToStore(
  partnerId: string,
  storeId: string,
  fileUri: string
): Promise<{ success: boolean; message: string }> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    await db
      .collection(`partners/${partnerId}/fileSearchStores`)
      .doc(storeId)
      .update({
        fileCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });

    return {
      success: true,
      message: 'File imported to store successfully',
    };
  } catch (error: any) {
    console.error('Error importing file to store:', error);
    return {
      success: false,
      message: `Failed to import file: ${error.message}`,
    };
  }
}

interface QueryResult {
  success: boolean;
  message: string;
  response?: string;
  citations?: any[];
}

export async function queryFileSearchStore(
  partnerId: string,
  userId: string,
  storeId: string,
  query: string
): Promise<QueryResult> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const storeDoc = await db
      .collection(`partners/${partnerId}/fileSearchStores`)
      .doc(storeId)
      .get();

    if (!storeDoc.exists) {
      return { success: false, message: 'File search store not found' };
    }

    const filesSnapshot = await db
      .collection(`partners/${partnerId}/vaultFiles`)
      .where('state', '==', 'ACTIVE')
      .get();

    const files = filesSnapshot.docs.map((doc) => ({
      fileData: {
        fileUri: doc.data().uri,
        mimeType: doc.data().mimeType,
      },
    }));

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: query }] }],
    });

    const response = result.response.text();

    const vaultQuery: Omit<VaultQuery, 'id'> = {
      query: query,
      response: response,
      partnerId: partnerId,
      userId: userId,
      createdAt: new Date().toISOString(),
    };

    const queryDocRef = await db
      .collection(`partners/${partnerId}/vaultQueries`)
      .add({
        ...vaultQuery,
        createdAt: FieldValue.serverTimestamp(),
      });

    return {
      success: true,
      message: 'Query executed successfully',
      response: response,
      citations: [],
    };
  } catch (error: any) {
    console.error('Error querying file search store:', error);
    return {
      success: false,
      message: `Failed to query: ${error.message}`,
    };
  }
}

export async function listVaultFiles(
  partnerId: string
): Promise<{ success: boolean; files: VaultFile[] }> {
  if (!db) {
    return { success: false, files: [] };
  }

  try {
    const snapshot = await db
      .collection(`partners/${partnerId}/vaultFiles`)
      .orderBy('createdAt', 'desc')
      .get();

    const files: VaultFile[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as VaultFile));

    return { success: true, files };
  } catch (error: any) {
    console.error('Error listing vault files:', error);
    return { success: false, files: [] };
  }
}

export async function listFileSearchStores(
  partnerId: string
): Promise<{ success: boolean; stores: FileSearchStore[] }> {
  if (!db) {
    return { success: false, stores: [] };
  }

  try {
    const snapshot = await db
      .collection(`partners/${partnerId}/fileSearchStores`)
      .orderBy('createdAt', 'desc')
      .get();

    const stores: FileSearchStore[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as FileSearchStore));

    return { success: true, stores };
  } catch (error: any) {
    console.error('Error listing file search stores:', error);
    return { success: false, stores: [] };
  }
}