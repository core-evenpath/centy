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
    console.log('🔵 Step 1: Saving to Firebase Storage');
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
    console.log('✅ File saved to storage');

    console.log('🔵 Step 2: Getting/Creating RAG store');
    let ragStoreName: string;
    
    const storesSnapshot = await db
      .collection(`partners/${partnerId}/fileSearchStores`)
      .where('state', '==', 'ACTIVE')
      .limit(1)
      .get();

    if (storesSnapshot.empty) {
      console.log('📦 Creating new RAG store');
      const displayName = `${partnerId}-vault`;
      const ragStore = await genAI.fileSearchStores.create({ 
        config: { displayName } 
      });
      
      if (!ragStore.name) {
        throw new Error('Failed to create RAG store: name is missing');
      }
      
      ragStoreName = ragStore.name;
      console.log('✅ RAG store created:', ragStoreName);
      
      await db.collection(`partners/${partnerId}/fileSearchStores`).add({
        name: ragStoreName,
        displayName: displayName,
        partnerId: partnerId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        fileCount: 0,
        totalSizeBytes: 0,
        state: 'ACTIVE',
      });
    } else {
      ragStoreName = storesSnapshot.docs[0].data().name;
      console.log('✅ Using existing RAG store:', ragStoreName);
    }

    console.log('🔵 Step 3: Creating File object for upload');
    const blob = new Blob([fileData.buffer], { type: fileData.mimeType });
    const uploadFile = new File([blob], fileData.name, { type: fileData.mimeType });

    console.log('🔵 Step 4: Uploading to RAG store');
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

    console.log('✅ File uploaded to Gemini');

    const vaultFile: Omit<VaultFile, 'id'> = {
      name: fileData.name,
      displayName: fileData.displayName,
      mimeType: fileData.mimeType,
      sizeBytes: fileData.buffer.length,
      uri: storagePath,
      state: 'ACTIVE',
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId,
      partnerId: partnerId,
      geminiFileUri: ragStoreName,
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

    console.log('✅ SUCCESS! File ID:', docRef.id);

    return {
      success: true,
      message: 'File uploaded successfully',
      file: { ...vaultFile, id: docRef.id },
    };
  } catch (error: any) {
    console.error('❌ UPLOAD FAILED:', error.message);
    console.error('Full error:', error);
    
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

    // If specific files are selected, add context to the query
    let enhancedMessage = message;
    if (selectedFileIds && selectedFileIds.length > 0 && selectedFileIds.length < 30) {
      // Get the selected file names - fetch them individually to avoid documentId() issues
      const fileNames: string[] = [];
      
      for (const fileId of selectedFileIds) {
        const fileDoc = await db
          .collection(`partners/${partnerId}/vaultFiles`)
          .doc(fileId)
          .get();
        
        if (fileDoc.exists) {
          const data = fileDoc.data();
          if (data?.displayName) {
            fileNames.push(data.displayName);
          }
        }
      }
      
      if (fileNames.length > 0) {
        enhancedMessage = `IMPORTANT: Only search and reference information from these specific documents: ${fileNames.join(', ')}. 

User question: ${message}

CRITICAL INSTRUCTIONS:
- DO NOT use information from any documents other than those listed above
- If the answer cannot be found in these specific documents, clearly state that
- Only cite sources from the documents listed above
- Ignore all other documents in the knowledge base`;
      }
    }

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

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const responseText = response.text;

    await db.collection(`partners/${partnerId}/vaultQueries`).add({
      query: message,
      response: responseText,
      partnerId: partnerId,
      userId: userId,
      selectedFileIds: selectedFileIds || [],
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
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        uploadedAt: data.uploadedAt || new Date().toISOString(),
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
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
      } as FileSearchStore;
    });

    return { success: true, stores };
  } catch (error: any) {
    console.error('Error listing stores:', error);
    return { success: false, stores: [] };
  }
}