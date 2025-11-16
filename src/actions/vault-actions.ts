'use server';

import { GoogleGenAI } from '@google/genai';
import { db } from '@/lib/firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { FieldValue } from 'firebase-admin/firestore';
import type { VaultFile, FileSearchStore, VaultQuery, GroundingChunk } from '@/lib/types';
import { queryVaultWithClaude, estimateDocumentTokens } from '@/lib/claude-rag';
import { queryWithHybridRAG } from '@/lib/gemini-claude-hybrid';
import { getPartnerAIConfig } from '@/actions/partner-settings-actions';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface UploadFileResult {
  success: boolean;
  message: string;
  file?: VaultFile;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function extractPDFText(buffer: Buffer): Promise<string | null> {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF extraction failed:', error);
    return null;
  }
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

function convertToMarkdown(datasetName: string, jsonlContent: string): string {
  const lines = jsonlContent.split('\n').filter(line => line.trim());
  const entries = lines.map(line => JSON.parse(line));
  
  let markdown = `# ${datasetName}\n\n`;
  markdown += `*Training Data - ${entries.length} Q&A pairs*\n\n`;
  markdown += `---\n\n`;
  
  entries.forEach((entry, index) => {
    markdown += `## Entry ${index + 1}\n\n`;
    markdown += `**Question:** ${entry.question}\n\n`;
    markdown += `**Answer:** ${entry.answer}\n\n`;
    if (entry.category) {
      markdown += `**Category:** ${entry.category}\n\n`;
    }
    markdown += `---\n\n`;
  });
  
  return markdown;
}

async function updateFileProgress(
  fileDocRef: FirebaseFirestore.DocumentReference,
  step: number,
  description: string
) {
  try {
    await fileDocRef.update({
      processingStep: step,
      processingDescription: description,
      updatedAt: FieldValue.serverTimestamp(),
    });
    console.log(`📊 Progress: Step ${step} - ${description}`);
  } catch (error) {
    console.warn('Failed to update progress:', error);
  }
}

export async function uploadFileToVault(
  partnerId: string,
  userId: string,
  fileData: {
    name: string;
    base64Data: string;
    mimeType: string;
    displayName: string;
  }
): Promise<UploadFileResult> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  const storage = getStorage();
  const bucket = storage.bucket();
  const timestamp = Date.now();
  const sanitizedName = fileData.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `vault/${partnerId}/${timestamp}_${sanitizedName}`;
  let fileDocRef: FirebaseFirestore.DocumentReference | null = null;
  let geminiFileNameToCleanup: string | null = null;
  const processingStartTime = Date.now();

  try {
    console.log('🔵 Step 1: Converting base64 to buffer');
    const buffer = Buffer.from(fileData.base64Data, 'base64');

    const estimatedChunks = Math.ceil(buffer.length / 2048);
    console.log(`📊 File size: ${buffer.length} bytes, estimated chunks: ${estimatedChunks}`);

    let extractedText: string | null = null;
    if (fileData.mimeType === 'application/pdf') {
      console.log('📄 Extracting text from PDF...');
      extractedText = await extractPDFText(buffer);
      if (extractedText) {
        console.log(`✅ Extracted ${extractedText.length} characters from PDF`);
      } else {
        console.warn('⚠️ PDF text extraction failed, will store without text');
      }
    }

    console.log('🔵 Step 2: Creating file record with PROCESSING state');
    
    const initialVaultFile = {
      name: fileData.name,
      displayName: fileData.displayName,
      mimeType: fileData.mimeType,
      sizeBytes: buffer.length,
      uri: storagePath,
      state: 'PROCESSING',
      processingStep: 1,
      processingDescription: 'Creating record...',
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId,
      partnerId: partnerId,
      firebaseStoragePath: storagePath,
      sourceType: 'upload',
      extractedText: extractedText || undefined,
      ragMetadata: {
        chunkSize: 2048,
        chunkOverlap: 128,
        embeddingModel: 'text-embedding-004',
        embeddingDimension: 768,
        estimatedChunks: estimatedChunks,
        extractedTextLength: extractedText?.length || 0,
      },
      createdAt: FieldValue.serverTimestamp(),
    };

    fileDocRef = await db
      .collection(`partners/${partnerId}/vaultFiles`)
      .add(initialVaultFile);
    
    console.log('✅ File record created with ID:', fileDocRef.id);

    await updateFileProgress(fileDocRef, 2, 'Uploading to storage...');
    console.log('🔵 Step 2: Uploading to Firebase Storage');
    const file = bucket.file(storagePath);
    
    await file.save(buffer, {
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

    await updateFileProgress(fileDocRef, 3, 'Storing in vault...');
    console.log('🔵 Step 3: Getting/Creating RAG store');
    const ragStoreName = await getOrCreateRagStore(partnerId);

    await updateFileProgress(fileDocRef, 4, 'RAG processing (AI indexing)...');
    console.log('🔵 Step 4: Creating File object for Gemini upload');
    const blob = new Blob([buffer], { type: fileData.mimeType });
    const uploadFile = new File([blob], fileData.name, { type: fileData.mimeType });

    console.log('🔵 Step 5: Uploading to RAG store');
    const ragProcessingStart = Date.now();
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
        await updateFileProgress(
          fileDocRef, 
          4, 
          `RAG processing... (${attempts * 3}s)`
        );
      }
    }

    if (!op.done) {
      throw new Error('Upload timeout after 2 minutes');
    }

    if (op.error) {
      throw new Error(`Gemini upload failed: ${op.error.message || 'Unknown error'}`);
    }

    const uploadedFileName = (op.response as any)?.file?.name || fileData.name;
    const ragProcessingTime = Date.now() - ragProcessingStart;
    console.log('✅ File uploaded to Gemini successfully:', uploadedFileName);
    console.log(`⏱️ RAG processing took: ${ragProcessingTime}ms`);

    geminiFileNameToCleanup = uploadedFileName;

    await updateFileProgress(fileDocRef, 5, 'Ready to query!');
    console.log('🔵 Step 6: Updating file record to ACTIVE');
    
    const totalProcessingTime = Date.now() - processingStartTime;
    
    await fileDocRef.update({
      state: 'ACTIVE',
      processingStep: 5,
      processingDescription: 'Ready to query',
      geminiFileUri: ragStoreName,
      geminiFileName: uploadedFileName,
      'ragMetadata.indexedAt': new Date().toISOString(),
      'ragMetadata.processingTimeMs': totalProcessingTime,
    });

    const finalFile = {
      id: fileDocRef.id,
      ...initialVaultFile,
      state: 'ACTIVE' as const,
      geminiFileUri: ragStoreName,
      geminiFileName: uploadedFileName,
      createdAt: new Date().toISOString(),
      ragMetadata: {
        ...initialVaultFile.ragMetadata,
        indexedAt: new Date().toISOString(),
        processingTimeMs: totalProcessingTime,
      }
    };

    console.log('✅ SUCCESS! File ID:', fileDocRef.id);
    console.log(`⏱️ Total processing time: ${totalProcessingTime}ms`);

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
          processingStep: -1,
          processingDescription: 'Upload failed',
          errorMessage: error.message || 'Upload failed',
        });
        console.log('📝 Updated file record to FAILED state');
      } catch (updateError) {
        console.error('Failed to update file state:', updateError);
      }
    }

    if (geminiFileNameToCleanup) {
      try {
        console.log('🧹 Attempting to clean up failed Gemini upload');
        await genAI.files.delete({ name: geminiFileNameToCleanup });
        console.log('✅ Cleaned up Gemini file after failure');
      } catch (cleanupError) {
        console.warn('Could not clean up Gemini file:', cleanupError);
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

export async function createTrainingDataFile(
  partnerId: string,
  userId: string,
  datasetName: string,
  jsonlContent: string
): Promise<{ success: boolean; message: string; file?: VaultFile }> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  const storage = getStorage();
  const bucket = storage.bucket();
  const timestamp = Date.now();
  const fileName = `${datasetName.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.md`;
  const storagePath = `vault/${partnerId}/${fileName}`;
  let fileDocRef: FirebaseFirestore.DocumentReference | null = null;
  const processingStartTime = Date.now();

  try {
    console.log('🔵 Converting Q&A pairs to Markdown');
    const markdownContent = convertToMarkdown(datasetName, jsonlContent);
    const buffer = Buffer.from(markdownContent, 'utf-8');

    const estimatedChunks = Math.ceil(buffer.length / 2048);

    console.log('🔵 Creating file record');
    const initialVaultFile = {
      name: fileName,
      displayName: `${datasetName}.md`,
      mimeType: 'text/markdown',
      sizeBytes: buffer.length,
      uri: storagePath,
      state: 'PROCESSING',
      uploadedAt: new Date().toISOString(),
      uploadedBy: userId,
      partnerId: partnerId,
      firebaseStoragePath: storagePath,
      sourceType: 'training',
      trainingData: jsonlContent,
      ragMetadata: {
        chunkSize: 2048,
        chunkOverlap: 128,
        embeddingModel: 'text-embedding-004',
        embeddingDimension: 768,
        estimatedChunks: estimatedChunks,
        extractedTextLength: buffer.length,
      },
      createdAt: FieldValue.serverTimestamp(),
    };

    fileDocRef = await db
      .collection(`partners/${partnerId}/vaultFiles`)
      .add(initialVaultFile);

    console.log('🔵 Uploading to Firebase Storage');
    const file = bucket.file(storagePath);
    await file.save(buffer, {
      metadata: {
        contentType: 'text/markdown',
        metadata: {
          partnerId,
          uploadedBy: userId,
          datasetName,
          vaultFileId: fileDocRef.id,
        }
      }
    });

    console.log('🔵 Uploading to RAG store');
    const ragStoreName = await getOrCreateRagStore(partnerId);

    const blob = new Blob([buffer], { type: 'text/markdown' });
    const uploadFile = new File([blob], fileName, { type: 'text/markdown' });

    let op = await genAI.fileSearchStores.uploadToFileSearchStore({
      fileSearchStoreName: ragStoreName,
      file: uploadFile
    });

    let attempts = 0;
    while (!op.done && attempts < 40) {
      await delay(3000);
      op = await genAI.operations.get({ operation: op });
      attempts++;
      
      if (attempts % 5 === 0) {
        console.log(`⏳ Processing (${attempts * 3}s)`);
      }
    }

    if (!op.done) {
      throw new Error('Upload timeout');
    }

    if (op.error) {
      throw new Error(`Upload failed: ${op.error.message || 'Unknown error'}`);
    }

    const uploadedFileName = (op.response as any)?.file?.name || fileName;
    const totalProcessingTime = Date.now() - processingStartTime;

    await fileDocRef.update({
      state: 'ACTIVE',
      geminiFileUri: ragStoreName,
      geminiFileName: uploadedFileName,
      'ragMetadata.indexedAt': new Date().toISOString(),
      'ragMetadata.processingTimeMs': totalProcessingTime,
    });

    const finalFile = {
      id: fileDocRef.id,
      ...initialVaultFile,
      state: 'ACTIVE' as const,
      geminiFileUri: ragStoreName,
      geminiFileName: uploadedFileName,
      createdAt: new Date().toISOString(),
      ragMetadata: {
        ...initialVaultFile.ragMetadata,
        indexedAt: new Date().toISOString(),
        processingTimeMs: totalProcessingTime,
      }
    };

    console.log('✅ Training data created successfully');

    return {
      success: true,
      message: 'Training data created successfully',
      file: finalFile,
    };
  } catch (error: any) {
    console.error('❌ Failed to create training data:', error);
    
    if (fileDocRef) {
      try {
        await fileDocRef.update({
          state: 'FAILED',
          errorMessage: error.message || 'Creation failed',
        });
      } catch (updateError) {
        console.error('Failed to update file state:', updateError);
      }
    }

    if (storagePath) {
      try {
        await bucket.file(storagePath).delete();
      } catch (cleanupError) {
        console.warn('Could not clean up file:', cleanupError);
      }
    }
    
    return {
      success: false,
      message: `Failed to create training data: ${error.message}`,
    };
  }
}

export async function updateTrainingDataFile(
  partnerId: string,
  fileId: string,
  userId: string,
  datasetName: string,
  jsonlContent: string
): Promise<{ success: boolean; message: string; file?: VaultFile }> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  const storage = getStorage();
  const bucket = storage.bucket();
  const processingStartTime = Date.now();

  try {
    const fileDoc = await db
      .collection(`partners/${partnerId}/vaultFiles`)
      .doc(fileId)
      .get();

    if (!fileDoc.exists) {
      return { success: false, message: 'File not found' };
    }

    const oldFileData = fileDoc.data();
    const timestamp = Date.now();
    const fileName = `${datasetName.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.md`;
    const storagePath = `vault/${partnerId}/${fileName}`;

    console.log('🔵 Converting updated Q&A pairs to Markdown');
    const markdownContent = convertToMarkdown(datasetName, jsonlContent);
    const buffer = Buffer.from(markdownContent, 'utf-8');

    const estimatedChunks = Math.ceil(buffer.length / 2048);

    console.log('🔵 Uploading to Firebase Storage');
    await bucket.file(storagePath).save(buffer, {
      metadata: {
        contentType: 'text/markdown',
        metadata: { partnerId, uploadedBy: userId, datasetName }
      }
    });

    console.log('🔵 Uploading to RAG store');
    const ragStoreName = await getOrCreateRagStore(partnerId);

    const blob = new Blob([buffer], { type: 'text/markdown' });
    const uploadFile = new File([blob], fileName, { type: 'text/markdown' });

    let op = await genAI.fileSearchStores.uploadToFileSearchStore({
      fileSearchStoreName: ragStoreName,
      file: uploadFile
    });

    let attempts = 0;
    while (!op.done && attempts < 40) {
      await delay(3000);
      op = await genAI.operations.get({ operation: op });
      attempts++;
    }

    if (!op.done || op.error) {
      throw new Error(op.error?.message || 'Upload failed');
    }

    const uploadedFileName = (op.response as any)?.file?.name || fileName;

    console.log('🔵 Cleaning up old RAG file');
    if (oldFileData?.geminiFileName && oldFileData?.geminiFileUri) {
      try {
        await genAI.files.delete({ name: oldFileData.geminiFileName });
        console.log('✅ Deleted old RAG file:', oldFileData.geminiFileName);
      } catch (ragError) {
        console.warn('Could not delete old RAG file:', ragError);
      }
    }

    console.log('🔵 Cleaning up old storage file');
    if (oldFileData?.firebaseStoragePath) {
      try {
        await bucket.file(oldFileData.firebaseStoragePath).delete();
      } catch (error) {
        console.warn('Could not delete old file:', error);
      }
    }

    const totalProcessingTime = Date.now() - processingStartTime;

    await db
      .collection(`partners/${partnerId}/vaultFiles`)
      .doc(fileId)
      .update({
        name: fileName,
        displayName: `${datasetName}.md`,
        mimeType: 'text/markdown',
        sizeBytes: buffer.length,
        uri: storagePath,
        firebaseStoragePath: storagePath,
        geminiFileUri: ragStoreName,
        geminiFileName: uploadedFileName,
        state: 'ACTIVE',
        trainingData: jsonlContent,
        ragMetadata: {
          chunkSize: 2048,
          chunkOverlap: 128,
          embeddingModel: 'text-embedding-004',
          embeddingDimension: 768,
          estimatedChunks: estimatedChunks,
          extractedTextLength: buffer.length,
          indexedAt: new Date().toISOString(),
          processingTimeMs: totalProcessingTime,
        },
        updatedAt: FieldValue.serverTimestamp(),
      });

    const finalFile = {
      id: fileId,
      partnerId,
      name: fileName,
      displayName: `${datasetName}.md`,
      mimeType: 'text/markdown',
      sizeBytes: buffer.length,
      uri: storagePath,
      firebaseStoragePath: storagePath,
      state: 'ACTIVE' as const,
      geminiFileUri: ragStoreName,
      geminiFileName: uploadedFileName,
      uploadedBy: oldFileData?.uploadedBy || userId,
      createdAt: oldFileData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ragMetadata: {
        chunkSize: 2048,
        chunkOverlap: 128,
        embeddingModel: 'text-embedding-004',
        embeddingDimension: 768,
        estimatedChunks: estimatedChunks,
        extractedTextLength: buffer.length,
        indexedAt: new Date().toISOString(),
        processingTimeMs: totalProcessingTime,
      }
    };

    console.log('✅ Training data updated successfully');

    return {
      success: true,
      message: 'Training data updated successfully',
      file: finalFile,
    };
  } catch (error: any) {
    console.error('❌ Failed to update training data:', error);
    return {
      success: false,
      message: `Failed to update training data: ${error.message}`,
    };
  }
}

export async function getVaultFileContent(
  partnerId: string,
  fileId: string
): Promise<{ success: boolean; content?: string; message?: string }> {
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
    
    if (fileData?.trainingData) {
      return {
        success: true,
        content: fileData.trainingData,
      };
    }
    
    if (!fileData?.firebaseStoragePath) {
      return { success: false, message: 'File path not found' };
    }

    const storage = getStorage();
    const bucket = storage.bucket();
    const file = bucket.file(fileData.firebaseStoragePath);

    const [content] = await file.download();
    
    return {
      success: true,
      content: content.toString('utf-8'),
    };
  } catch (error: any) {
    console.error('Error fetching file content:', error);
    return {
      success: false,
      message: `Failed to fetch content: ${error.message}`,
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
    console.log('🔵 Step 1: Fetching file record');
    const fileDoc = await db
      .collection(`partners/${partnerId}/vaultFiles`)
      .doc(fileId)
      .get();

    if (!fileDoc.exists) {
      return { success: false, message: 'File not found' };
    }

    const fileData = fileDoc.data();
    
    console.log('🔵 Step 2: Deleting from Gemini RAG store');
    if (fileData?.geminiFileName) {
      try {
        await genAI.files.delete({ name: fileData.geminiFileName });
        console.log('✅ Deleted file from RAG store:', fileData.geminiFileName);
      } catch (ragError: any) {
        console.warn('⚠️  Could not delete from RAG store:', ragError.message);
      }
    } else {
      console.log('⚠️  No Gemini file name found, skipping RAG cleanup');
    }

    console.log('🔵 Step 3: Deleting from Firebase Storage');
    if (fileData?.firebaseStoragePath) {
      const storage = getStorage();
      const bucket = storage.bucket();
      const file = bucket.file(fileData.firebaseStoragePath);
      
      try {
        await file.delete();
        console.log('✅ Deleted file from storage');
      } catch (error) {
        console.warn('⚠️  Could not delete from storage:', error);
      }
    }

    console.log('🔵 Step 4: Deleting Firestore record');
    await db
      .collection(`partners/${partnerId}/vaultFiles`)
      .doc(fileId)
      .delete();

    console.log('✅ File deleted successfully');

    return { success: true, message: 'File deleted successfully' };
  } catch (error: any) {
    console.error('❌ Error deleting vault file:', error);
    return {
      success: false,
      message: `Failed to delete file: ${error.message}`,
    };
  }
}

export async function cleanupOrphanedRagFiles(
  partnerId: string
): Promise<{ 
  success: boolean; 
  message: string; 
  cleanedCount?: number;
  errors?: string[];
}> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    console.log('🔍 Starting orphaned RAG file cleanup for partner:', partnerId);

    const storesSnapshot = await db
      .collection(`partners/${partnerId}/fileSearchStores`)
      .where('state', '==', 'ACTIVE')
      .limit(1)
      .get();

    if (storesSnapshot.empty) {
      return { success: true, message: 'No RAG store found', cleanedCount: 0 };
    }

    const ragStoreName = storesSnapshot.docs[0].data().name;
    console.log('📦 RAG Store:', ragStoreName);

    const vaultFilesSnapshot = await db
      .collection(`partners/${partnerId}/vaultFiles`)
      .get();

    const activeGeminiFileNames = new Set<string>();
    vaultFilesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.geminiFileName && data.state === 'ACTIVE') {
        activeGeminiFileNames.add(data.geminiFileName);
      }
    });

    console.log(`📊 Active files in Firestore: ${activeGeminiFileNames.size}`);

    let geminiFiles: any[] = [];
    try {
      const listResponse = await genAI.files.list();
      geminiFiles = listResponse.files || [];
      console.log(`📊 Files in Gemini: ${geminiFiles.length}`);
    } catch (listError: any) {
      console.warn('⚠️ Could not list Gemini files:', listError.message);
      return { success: false, message: 'Could not list Gemini files' };
    }

    const orphanedFiles = geminiFiles.filter(
      file => !activeGeminiFileNames.has(file.name)
    );

    console.log(`🗑️ Found ${orphanedFiles.length} orphaned files`);

    const errors: string[] = [];
    let cleanedCount = 0;

    for (const file of orphanedFiles) {
      try {
        await genAI.files.delete({ name: file.name });
        console.log(`✅ Deleted orphaned file: ${file.name}`);
        cleanedCount++;
      } catch (deleteError: any) {
        const errorMsg = `Failed to delete ${file.name}: ${deleteError.message}`;
        console.error('❌', errorMsg);
        errors.push(errorMsg);
      }
    }

    const message = `Cleanup complete: ${cleanedCount} files removed${errors.length > 0 ? `, ${errors.length} errors` : ''}`;
    console.log('✅', message);

    return {
      success: true,
      message,
      cleanedCount,
      errors: errors.length > 0 ? errors : undefined,
    };

  } catch (error: any) {
    console.error('❌ Cleanup failed:', error);
    return {
      success: false,
      message: `Cleanup failed: ${error.message}`,
    };
  }
}

export async function verifyRagFileIntegrity(
  partnerId: string
): Promise<{
  success: boolean;
  message: string;
  firestoreCount?: number;
  geminiCount?: number;
  missingInGemini?: string[];
  orphanedInGemini?: string[];
}> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    console.log('🔍 Verifying RAG file integrity for partner:', partnerId);

    const vaultFilesSnapshot = await db
      .collection(`partners/${partnerId}/vaultFiles`)
      .where('state', '==', 'ACTIVE')
      .get();

    const firestoreFiles = new Map<string, string>();
    vaultFilesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.geminiFileName) {
        firestoreFiles.set(data.geminiFileName, doc.id);
      }
    });

    console.log(`📊 Active files in Firestore: ${firestoreFiles.size}`);

    let geminiFiles: any[] = [];
    try {
      const listResponse = await genAI.files.list();
      geminiFiles = listResponse.files || [];
      console.log(`📊 Files in Gemini: ${geminiFiles.length}`);
    } catch (listError: any) {
      console.warn('⚠️ Could not list Gemini files:', listError.message);
      return { 
        success: false, 
        message: 'Could not list Gemini files',
        firestoreCount: firestoreFiles.size,
      };
    }

    const geminiFileNames = new Set(geminiFiles.map(f => f.name));

    const missingInGemini = Array.from(firestoreFiles.keys()).filter(
      name => !geminiFileNames.has(name)
    );

    const orphanedInGemini = Array.from(geminiFileNames).filter(
      name => !firestoreFiles.has(name)
    );

    console.log(`⚠️ Missing in Gemini: ${missingInGemini.length}`);
    console.log(`⚠️ Orphaned in Gemini: ${orphanedInGemini.length}`);

    if (missingInGemini.length > 0) {
      console.log('Files in Firestore but not in Gemini:', missingInGemini);
    }
    if (orphanedInGemini.length > 0) {
      console.log('Files in Gemini but not in Firestore:', orphanedInGemini);
    }

    return {
      success: true,
      message: 'Verification complete',
      firestoreCount: firestoreFiles.size,
      geminiCount: geminiFiles.length,
      missingInGemini: missingInGemini.length > 0 ? missingInGemini : undefined,
      orphanedInGemini: orphanedInGemini.length > 0 ? orphanedInGemini : undefined,
    };

  } catch (error: any) {
    console.error('❌ Verification failed:', error);
    return {
      success: false,
      message: `Verification failed: ${error.message}`,
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
  usage?: any;
}> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  if (!selectedFileIds || selectedFileIds.length === 0) {
    return {
      success: false,
      message: 'Please select at least one document to query',
    };
  }

  try {
    console.log(`📊 Query initiated - Selected files: ${selectedFileIds.length}`);

    const result = await queryVaultWithClaude(
      partnerId,
      selectedFileIds,
      message
    );

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Query failed',
      };
    }

    const fileNames = result.documents?.map(d => d.fileName) || [];

    await db.collection(`partners/${partnerId}/vaultQueries`).add({
      query: message,
      response: result.response,
      partnerId: partnerId,
      userId: userId,
      selectedFileIds: selectedFileIds,
      selectedFileNames: fileNames,
      provider: 'claude',
      usage: result.usage,
      inputTokens: result.usage?.input_tokens || 0,
      outputTokens: result.usage?.output_tokens || 0,
      cacheReadTokens: result.usage?.cache_read_input_tokens || 0,
      cacheCreationTokens: result.usage?.cache_creation_input_tokens || 0,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: 'Query successful',
      response: result.response,
      groundingChunks: [],
      usage: result.usage,
    };
  } catch (error: any) {
    console.error('Error querying vault:', error);
    return {
      success: false,
      message: `Query failed: ${error.message}`,
    };
  }
}

export async function chatWithVaultHybrid(
  partnerId: string,
  userId: string,
  message: string
): Promise<{
  success: boolean;
  message: string;
  response?: string;
  geminiChunks?: any[];
  usage?: any;
  retrievalTime?: number;
  generationTime?: number;
  modelUsed?: string;
}> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    const modelChoice = await getPartnerAIConfig(partnerId);
    console.log(`📊 Hybrid query initiated - Using partner's model: ${modelChoice}`);

    const result = await queryWithHybridRAG(partnerId, message, modelChoice);

    if (!result.success) {
      return {
        success: false,
        message: result.message || 'Query failed',
      };
    }

    const sourceFileNames = result.geminiChunks?.map(c => c.source) || [];

    await db.collection(`partners/${partnerId}/vaultQueries`).add({
      query: message,
      response: result.response,
      partnerId: partnerId,
      userId: userId,
      provider: `gemini-rag-${modelChoice}`,
      modelUsed: result.modelUsed,
      geminiChunks: result.geminiChunks?.length || 0,
      sources: sourceFileNames,
      usage: result.usage,
      inputTokens: result.usage?.input_tokens || result.usage?.prompt_tokens || 0,
      outputTokens: result.usage?.output_tokens || result.usage?.completion_tokens || 0,
      retrievalTimeMs: result.retrievalTime,
      generationTimeMs: result.generationTime,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: 'Query successful',
      response: result.response,
      geminiChunks: result.geminiChunks,
      usage: result.usage,
      retrievalTime: result.retrievalTime,
      generationTime: result.generationTime,
      modelUsed: result.modelUsed,
    };
  } catch (error: any) {
    console.error('Error querying vault:', error);
    return {
      success: false,
      message: `Query failed: ${error.message}`,
    };
  }
}

async function getConversationContext(
  conversationId: string,
  platform: 'sms' | 'whatsapp',
  messageLimit: number = 5
): Promise<string> {
  if (!db) return '';

  try {
    const collectionName = platform === 'sms' ? 'smsMessages' : 'whatsappMessages';
    
    const messagesSnapshot = await db
      .collection(collectionName)
      .where('conversationId', '==', conversationId)
      .orderBy('createdAt', 'desc')
      .limit(messageLimit)
      .select('direction', 'content')
      .get();

    if (messagesSnapshot.empty) return '';

    const messages = messagesSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return `${data.direction === 'inbound' ? 'Customer' : 'Partner'}: ${data.content}`;
      })
      .reverse();

    return messages.join('\n');
  } catch (error) {
    console.error('Error getting conversation context:', error);
    return '';
  }
}

export async function chatWithVaultForConversation(
  partnerId: string,
  conversationId: string,
  platform: 'sms' | 'whatsapp',
  message: string,
  options?: {
    includeAlternatives?: boolean;
  }
): Promise<{
  success: boolean;
  message: string;
  suggestedReply?: string;
  confidence?: number;
  reasoning?: string;
  sources?: any[];
  alternativeReplies?: string[];
}> {
  console.log('⚡ Hybrid RAG starting for messaging');
  const startTime = Date.now();
  
  if (!db) {
    return { success: false, message: 'Service not configured' };
  }

  try {
    const conversationCollection = platform === 'sms' ? 'smsConversations' : 'whatsappConversations';

    const [conversationDoc, conversationContext, modelChoice] = await Promise.all([
      db.collection(conversationCollection).doc(conversationId).get(),
      getConversationContext(conversationId, platform, 5),
      getPartnerAIConfig(partnerId)
    ]);

    console.log(`⏱️ Data loaded: ${Date.now() - startTime}ms`);
    console.log(`🤖 Using model: ${modelChoice}`);

    if (!conversationDoc.exists) {
      return { success: false, message: 'Conversation not found' };
    }

    const conversationData = conversationDoc.data();
    const customerName = conversationData?.customerName || conversationData?.contactName || 'Customer';

    const contextSection = conversationContext 
      ? `\nRecent conversation history:\n${conversationContext}\n` 
      : '';

    const enhancedQuestion = `You are helping ${customerName} respond to their question. ${contextSection}

Customer's question: "${message}"

Instructions:
1. Search the knowledge base for relevant information
2. Provide a helpful, professional response in 1-2 sentences
3. Be concise and conversational
4. If the information isn't in the knowledge base, give a brief helpful response anyway

Generate a suggested reply:`;

    console.log('📤 Querying with hybrid RAG...');
    const queryStart = Date.now();

    const result = await queryWithHybridRAG(
      partnerId,
      enhancedQuestion,
      modelChoice,
      {
        maxChunks: 3,
        maxChunkChars: 2000,
      }
    );

    console.log(`⏱️ Hybrid query: ${Date.now() - queryStart}ms`);

    if (!result.success || !result.response) {
      return {
        success: false,
        message: result.message || 'Failed to generate response',
      };
    }

    const responseText = result.response.trim();
    const chunksUsed = result.geminiChunks?.length || 0;
    
    const confidence = chunksUsed > 0 ? 0.85 : 0.70;
    const reasoning = chunksUsed > 0
      ? `Based on ${chunksUsed} relevant chunk${chunksUsed > 1 ? 's' : ''} from knowledge base (${result.modelUsed})`
      : `General response (${result.modelUsed})`;

    const sources = result.geminiChunks?.slice(0, 3).map(chunk => ({
      type: 'document' as const,
      name: chunk.source || 'Knowledge Base',
      excerpt: chunk.content.substring(0, 120),
      relevance: chunk.score || 0.85,
    })) || [];

    console.log(`✅ Total time: ${Date.now() - startTime}ms`);
    console.log(`💰 Tokens used: ${result.usage?.input_tokens || result.usage?.prompt_tokens || 0} input, ${result.usage?.output_tokens || result.usage?.completion_tokens || 0} output`);

    return {
      success: true,
      message: 'Success',
      suggestedReply: responseText,
      confidence,
      reasoning,
      sources,
      alternativeReplies: [],
    };

  } catch (error: any) {
    console.error('❌ Hybrid RAG failed for messaging:', error);
    
    return {
      success: false,
      message: `Error: ${error.message}`,
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
      contents: "Generate 4 short and practical example questions a user might ask about the uploaded documents. Return only a JSON array of question strings.",
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
        geminiFileName: data.geminiFileName,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        errorMessage: data.errorMessage,
        firebaseStoragePath: data.firebaseStoragePath || data.uri || '',
        metadata: data.metadata,
        sourceType: data.sourceType,
        conversationId: data.conversationId,
        conversationPlatform: data.conversationPlatform,
        customerPhone: data.customerPhone,
        customerName: data.customerName,
        processingStep: data.processingStep,
        processingDescription: data.processingDescription,
        ragMetadata: data.ragMetadata,
        extractedText: data.extractedText,
        trainingData: data.trainingData,
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

export async function getVaultFileStatus(
  partnerId: string,
  fileId: string
): Promise<{ 
  success: boolean; 
  state?: 'PROCESSING' | 'ACTIVE' | 'FAILED';
  processingStep?: number;
  processingDescription?: string;
  errorMessage?: string;
}> {
  if (!db) {
    return { success: false };
  }

  try {
    const fileDoc = await db
      .collection(`partners/${partnerId}/vaultFiles`)
      .doc(fileId)
      .get();

    if (!fileDoc.exists) {
      return { success: false };
    }

    const data = fileDoc.data();
    return {
      success: true,
      state: data?.state,
      processingStep: data?.processingStep || 1,
      processingDescription: data?.processingDescription || 'Processing...',
      errorMessage: data?.errorMessage,
    };
  } catch (error) {
    console.error('Error getting file status:', error);
    return { success: false };
  }
}

export async function getDocumentTokenEstimate(
  partnerId: string,
  fileIds: string[]
): Promise<{
  success: boolean;
  totalTokens?: number;
  documents?: Array<{ fileId: string; fileName: string; tokens: number }>;
  message?: string;
  withinLimit?: boolean;
}> {
  const result = await estimateDocumentTokens(partnerId, fileIds);
  
  if (result.success && result.totalTokens) {
    return {
      ...result,
      withinLimit: result.totalTokens <= 180000,
    };
  }
  
  return result;
}

export async function getExtractedTextPreview(
  partnerId: string,
  fileId: string
): Promise<{
  success: boolean;
  fileName?: string;
  hasText?: boolean;
  textLength?: number;
  preview?: string;
  searchSample?: string;
}> {
  if (!db) {
    return { success: false };
  }

  try {
    const fileDoc = await db
      .collection(`partners/${partnerId}/vaultFiles`)
      .doc(fileId)
      .get();

    if (!fileDoc.exists) {
      return { success: false };
    }

    const data = fileDoc.data()!;
    const text = data.extractedText || data.trainingData || '';

    return {
      success: true,
      fileName: data.displayName || data.name,
      hasText: text.length > 0,
      textLength: text.length,
      preview: text.substring(0, 1000),
      searchSample: text.toLowerCase().includes('ceo') 
        ? text.substring(text.toLowerCase().indexOf('ceo') - 100, text.toLowerCase().indexOf('ceo') + 400)
        : 'Search term not found in extracted text',
    };
  } catch (error: any) {
    console.error('Error:', error);
    return { success: false };
  }
}

export async function debugVaultFile(
  partnerId: string,
  fileId: string
): Promise<{
  success: boolean;
  debug?: {
    hasExtractedText: boolean;
    extractedTextLength: number;
    extractedTextPreview: string;
    mimeType: string;
    fileName: string;
    state: string;
  };
  message?: string;
}> {
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

    const data = fileDoc.data()!;

    return {
      success: true,
      debug: {
        hasExtractedText: !!data.extractedText,
        extractedTextLength: data.extractedText?.length || 0,
        extractedTextPreview: data.extractedText?.substring(0, 500) || 'NO TEXT EXTRACTED',
        mimeType: data.mimeType,
        fileName: data.displayName || data.name,
        state: data.state,
      },
    };
  } catch (error: any) {
    console.error('Debug failed:', error);
    return { success: false, message: error.message };
  }
}

export async function searchInDocument(
  partnerId: string,
  fileId: string,
  searchTerm: string
): Promise<{
  success: boolean;
  found?: boolean;
  occurrences?: number;
  excerpts?: string[];
  message?: string;
}> {
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

    const data = fileDoc.data()!;
    const text = data.extractedText || data.trainingData || '';

    if (!text) {
      return { 
        success: false, 
        message: 'No text content available for this file' 
      };
    }

    const lowerText = text.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();
    
    const indices: number[] = [];
    let index = lowerText.indexOf(lowerSearch);
    
    while (index !== -1) {
      indices.push(index);
      index = lowerText.indexOf(lowerSearch, index + 1);
    }

    const excerpts = indices.slice(0, 5).map(idx => {
      const start = Math.max(0, idx - 100);
      const end = Math.min(text.length, idx + searchTerm.length + 100);
      return text.substring(start, end);
    });

    return {
      success: true,
      found: indices.length > 0,
      occurrences: indices.length,
      excerpts,
    };
  } catch (error: any) {
    console.error('Search failed:', error);
    return { success: false, message: error.message };
  }
}