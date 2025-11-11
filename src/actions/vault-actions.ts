'use server';

import { GoogleGenAI } from '@google/genai';
import { db } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';
import type { VaultFile, FileSearchStore, VaultQuery, GroundingChunk } from '@/lib/types';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface UploadFileResult {
  success: boolean;
  message: string;
  file?: VaultFile;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getOrCreateRagStore(partnerId: string): Promise<string> {
  if (!db) {
    throw new Error('Database not available');
  }

  const storeRef = db.collection(`partners/${partnerId}/fileSearchStores`).doc('primary');
  
  try {
    const storeDoc = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(storeRef);
      
      if (doc.exists && doc.data()?.state === 'ACTIVE') {
        return doc;
      }
      
      console.log('📦 Creating new RAG store with transaction lock');
      const displayName = `${partnerId}-vault`;
      const ragStore = await genAI.fileSearchStores.create({ 
        config: { displayName } 
      });
      
      if (!ragStore.name) {
        throw new Error('Failed to create RAG store: name is missing');
      }
      
      transaction.set(storeRef, {
        name: ragStore.name,
        displayName: displayName,
        partnerId: partnerId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        fileCount: 0,
        totalSizeBytes: 0,
        state: 'ACTIVE',
      });
      
      return { exists: true, data: () => ({ name: ragStore.name }) } as any;
    });
    
    const ragStoreName = storeDoc.data()?.name;
    console.log('✅ Using RAG store:', ragStoreName);
    return ragStoreName;
    
  } catch (error: any) {
    console.error('Error in getOrCreateRagStore:', error);
    throw error;
  }
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

  const storage = getStorage();
  const bucket = storage.bucket();
  const storagePath = `vault/${partnerId}/${Date.now()}_${fileData.name}`;
  let fileDocRef: FirebaseFirestore.DocumentReference | null = null;

  try {
    console.log('🔵 Step 1: Creating file record with PROCESSING state');
    
    const initialVaultFile = {
      name: fileData.name,
      displayName: fileData.displayName,
      mimeType: fileData.mimeType,
      sizeBytes: fileData.buffer.length,
      uri: storagePath,
      state: 'PROCESSING',
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId,
      partnerId: partnerId,
      firebaseStoragePath: storagePath,
      createdAt: FieldValue.serverTimestamp(),
    };

    fileDocRef = await db
      .collection(`partners/${partnerId}/vaultFiles`)
      .add(initialVaultFile);
    
    console.log('✅ File record created with ID:', fileDocRef.id);

    console.log('🔵 Step 2: Uploading to Firebase Storage');
    const file = bucket.file(storagePath);
    
    await file.save(fileData.buffer, {
      metadata: {
        contentType: fileData.mimeType,
        metadata: {
          partnerId: partnerId,
          uploadedBy: userId,
          vaultFileId: fileDocRef.id,
        }
      }
    });
    console.log('✅ File saved to storage');

    console.log('🔵 Step 3: Getting/Creating RAG store');
    const ragStoreName = await getOrCreateRagStore(partnerId);

    console.log('🔵 Step 4: Creating File object for Gemini upload');
    const blob = new Blob([fileData.buffer], { type: fileData.mimeType });
    const uploadFile = new File([blob], fileData.name, { type: fileData.mimeType });

    console.log('🔵 Step 5: Uploading to RAG store');
    let op = await genAI.fileSearchStores.uploadToFileSearchStore({
      fileSearchStoreName: ragStoreName,
      file: uploadFile
    });
    console.log('⏳ Upload operation started');

    let attempts = 0;
    while (!op.done && attempts < 40) {
      await delay(3000);
      op = await genAI.operations.get({ operation: op });
      attempts++;
      
      if (attempts % 5 === 0) {
        console.log(`⏳ Still processing (${attempts * 3}s)`);
      }
    }

    if (!op.done) {
      throw new Error('Upload timeout after 2 minutes');
    }

    if (op.error) {
      throw new Error(`Gemini upload failed: ${op.error.message || 'Unknown error'}`);
    }

    console.log('✅ File uploaded to Gemini successfully');

    console.log('🔵 Step 6: Updating file record to ACTIVE');
    await fileDocRef.update({
      state: 'ACTIVE',
      geminiFileUri: ragStoreName,
    });

    const finalFile = {
      id: fileDocRef.id,
      ...initialVaultFile,
      state: 'ACTIVE' as const,
      geminiFileUri: ragStoreName,
      createdAt: new Date().toISOString(),
    };

    console.log('✅ SUCCESS! File ID:', fileDocRef.id);

    return {
      success: true,
      message: 'File uploaded successfully',
      file: finalFile,
    };
  } catch (error: any) {
    console.error('❌ UPLOAD FAILED:', error.message);
    console.error('Full error:', error);
    
    if (fileDocRef) {
      try {
        await fileDocRef.update({
          state: 'FAILED',
          errorMessage: error.message || 'Upload failed',
        });
        console.log('📝 Updated file record to FAILED state');
      } catch (updateError) {
        console.error('Failed to update file state:', updateError);
      }
    }

    if (storagePath) {
      try {
        const file = bucket.file(storagePath);
        await file.delete();
        console.log('🧹 Cleaned up storage file after failure');
      } catch (cleanupError) {
        console.warn('Could not clean up storage file:', cleanupError);
      }
    }
    
    return {
      success: false,
      message: `Failed to upload: ${error.message}`,
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
    
    if (fileData?.firebaseStoragePath) {
      const storage = getStorage();
      const bucket = storage.bucket();
      const file = bucket.file(fileData.firebaseStoragePath);
      
      try {
        await file.delete();
        console.log('✅ Deleted file from storage');
      } catch (error) {
        console.warn('Could not delete from storage:', error);
      }
    }

    await db
      .collection(`partners/${partnerId}/vaultFiles`)
      .doc(fileId)
      .delete();

    console.log('✅ Deleted file record from Firestore');

    return { success: true, message: 'File deleted successfully' };
  } catch (error: any) {
    console.error('Error deleting vault file:', error);
    return {
      success: false,
      message: `Failed to delete file: ${error.message}`,
    };
  }
}

async function filterGroundingChunksBySelectedFiles(
  partnerId: string,
  groundingChunks: any[],
  selectedFileIds: string[]
): Promise<any[]> {
  if (!db || selectedFileIds.length === 0 || groundingChunks.length === 0) {
    return groundingChunks;
  }

  try {
    const fileDocsPromises = selectedFileIds.map(fileId =>
      db!.collection(`partners/${partnerId}/vaultFiles`).doc(fileId).get()
    );
    
    const fileDocs = await Promise.all(fileDocsPromises);
    
    const selectedFileNames = new Set<string>();
    const selectedDisplayNames = new Set<string>();
    const selectedStoragePaths = new Set<string>();
    
    fileDocs.forEach(fileDoc => {
      if (fileDoc.exists) {
        const data = fileDoc.data();
        if (data?.displayName) {
          selectedFileNames.add(data.displayName.toLowerCase());
          selectedDisplayNames.add(data.displayName.toLowerCase());
        }
        if (data?.name) {
          selectedFileNames.add(data.name.toLowerCase());
        }
        if (data?.firebaseStoragePath) {
          selectedStoragePaths.add(data.firebaseStoragePath.toLowerCase());
        }
        selectedFileNames.add(fileDoc.id.toLowerCase());
      }
    });

    if (selectedFileNames.size === 0) {
      console.log('⚠️ No valid file names found for filtering, returning all chunks');
      return groundingChunks;
    }

    console.log(`🔍 Filtering with ${selectedFileNames.size} unique identifiers`);

    const filteredChunks = groundingChunks.filter((chunk: any) => {
      const title = chunk.retrievedContext?.title?.toLowerCase() || '';
      const uri = chunk.retrievedContext?.uri?.toLowerCase() || '';
      
      for (const identifier of selectedFileNames) {
        if (title.includes(identifier) || uri.includes(identifier)) {
          return true;
        }
      }
      
      for (const path of selectedStoragePaths) {
        if (uri.includes(path)) {
          return true;
        }
      }
      
      return false;
    });

    console.log(`🔍 Filtered chunks: ${groundingChunks.length} -> ${filteredChunks.length} (based on ${selectedFileIds.length} selected files)`);
    
    if (filteredChunks.length === 0 && groundingChunks.length > 0) {
      console.log('⚠️ Filtering removed all chunks, returning original chunks to avoid empty response');
      return groundingChunks;
    }
    
    return filteredChunks;
  } catch (error) {
    console.error('Error filtering chunks:', error);
    return groundingChunks;
  }
}

export async function chatWithVault(
  partnerId: string,
  userId: string,
  message: string,
  selectedFileIds?: string[]
): Promise<{
  success: boolean;
  message: string;
  response?: string;
  groundingChunks?: GroundingChunk[];
}> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const storesSnapshot = await db
      .collection(`partners/${partnerId}/fileSearchStores`)
      .where('state', '==', 'ACTIVE')
      .limit(1)
      .get();

    if (storesSnapshot.empty) {
      return { 
        success: false, 
        message: 'No documents uploaded yet. Please upload documents first.' 
      };
    }

    const ragStoreName = storesSnapshot.docs[0].data().name;

    let enhancedMessage = message;
    let fileNames: string[] = [];
    
    if (selectedFileIds && selectedFileIds.length > 0 && selectedFileIds.length < 30) {
      const fileDocsPromises = selectedFileIds.map(fileId =>
        db!.collection(`partners/${partnerId}/vaultFiles`).doc(fileId).get()
      );
      
      const fileDocs = await Promise.all(fileDocsPromises);
      
      fileDocs.forEach(fileDoc => {
        if (fileDoc.exists) {
          const data = fileDoc.data();
          if (data?.displayName) {
            fileNames.push(data.displayName);
          }
        }
      });
      
      if (fileNames.length > 0) {
        enhancedMessage = `Context: The user has selected specific documents to query: ${fileNames.join(', ')}.

User Question: ${message}

Instructions: Focus your answer primarily on information from the documents listed above. If relevant information exists in those specific documents, prioritize it in your response. If the selected documents don't contain relevant information, clearly state that.`;
      }
    }

    console.log(`📊 Query initiated - Selected files: ${fileNames.length}, Message: "${message.substring(0, 50)}..."`);

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: enhancedMessage + " DO NOT ASK THE USER TO READ THE DOCUMENT, pinpoint the relevant sections in the response itself.",
      config: {
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [ragStoreName],
            }
          }
        ]
      }
    });

    let groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const responseText = response.text;

    console.log(`📦 Raw response - Chunks before filtering: ${groundingChunks.length}`);

    if (selectedFileIds && selectedFileIds.length > 0) {
      groundingChunks = await filterGroundingChunksBySelectedFiles(
        partnerId,
        groundingChunks,
        selectedFileIds
      );
      
      console.log(`✅ Chunks after filtering: ${groundingChunks.length}`);
    }

    await db.collection(`partners/${partnerId}/vaultQueries`).add({
      query: message,
      response: responseText,
      partnerId: partnerId,
      userId: userId,
      selectedFileIds: selectedFileIds || [],
      selectedFileNames: fileNames,
      chunksBeforeFilter: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.length || 0,
      chunksAfterFilter: groundingChunks.length,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: 'Query successful',
      response: responseText,
      groundingChunks: groundingChunks,
    };
  } catch (error: any) {
    console.error('Error querying vault:', error);
    return {
      success: false,
      message: `Query failed: ${error.message}`,
    };
  }
}

export async function generateExampleQuestions(partnerId: string): Promise<string[]> {
  if (!db) return [];

  try {
    const storesSnapshot = await db
      .collection(`partners/${partnerId}/fileSearchStores`)
      .where('state', '==', 'ACTIVE')
      .limit(1)
      .get();

    if (storesSnapshot.empty) return [];

    const ragStoreName = storesSnapshot.docs[0].data().name;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: "Generate 4 short and practical example questions a user might ask about the uploaded documents. Return only a JSON array of question strings. Example: [\"question 1\", \"question 2\", \"question 3\", \"question 4\"]",
      config: {
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [ragStoreName],
            }
          }
        ]
      }
    });
    
    let jsonText = response.text.trim();
    const jsonMatch = jsonText.match(/```json\n([\s\S]*?)\n```/);
    
    if (jsonMatch && jsonMatch[1]) {
      jsonText = jsonMatch[1];
    } else {
      const firstBracket = jsonText.indexOf('[');
      const lastBracket = jsonText.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1) {
        jsonText = jsonText.substring(firstBracket, lastBracket + 1);
      }
    }
    
    const parsedData = JSON.parse(jsonText);
    return Array.isArray(parsedData) ? parsedData.filter(q => typeof q === 'string') : [];
  } catch (error) {
    console.error("Failed to generate questions:", error);
    return [];
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

    const files: VaultFile[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        displayName: data.displayName || '',
        mimeType: data.mimeType || '',
        sizeBytes: data.sizeBytes || 0,
        uri: data.uri || '',
        state: data.state || 'PROCESSING',
        uploadedAt: data.uploadedAt || new Date().toISOString(),
        uploadedBy: data.uploadedBy || '',
        partnerId: data.partnerId || partnerId,
        geminiFileUri: data.geminiFileUri,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        errorMessage: data.errorMessage,
        firebaseStoragePath: data.firebaseStoragePath || data.uri || '',
        metadata: data.metadata,
      } as VaultFile;
    });

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

    const stores: FileSearchStore[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        displayName: data.displayName || '',
        partnerId: data.partnerId || partnerId,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        fileCount: data.fileCount || 0,
        totalSizeBytes: data.totalSizeBytes || 0,
        state: data.state || 'ACTIVE',
      } as FileSearchStore;
    });

    return { success: true, stores };
  } catch (error: any) {
    console.error('Error listing stores:', error);
    return { success: false, stores: [] };
  }
}