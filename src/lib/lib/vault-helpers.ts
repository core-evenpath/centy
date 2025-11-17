import { db } from '@/lib/firebase-admin';

export function getVaultCollectionPath(partnerId: string) {
  return `partners/${partnerId}/vaultFiles`;
}

export function getFileSearchStoresPath(partnerId: string) {
  return `partners/${partnerId}/fileSearchStores`;
}

export function getVaultQueriesPath(partnerId: string) {
  return `partners/${partnerId}/vaultQueries`;
}

export async function getVaultFileByGeminiUri(
  partnerId: string,
  geminiFileUri: string
) {
  if (!db) {
    console.error('❌ Database not available');
    return null;
  }

  try {
    const vaultFilesSnapshot = await db
      .collection(getVaultCollectionPath(partnerId))
      .where('geminiFileUri', '==', geminiFileUri)
      .limit(1)
      .get();
    
    if (vaultFilesSnapshot.empty) {
      console.warn(`⚠️ No file found for Gemini URI: ${geminiFileUri}`);
      return null;
    }
    
    const doc = vaultFilesSnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      displayName: data.displayName,
      geminiFileUri: data.geminiFileUri,
      partnerId: data.partnerId,
    };
  } catch (error) {
    console.error('❌ Error getting vault file by Gemini URI:', error);
    return null;
  }
}

export async function getVaultFileByGeminiFileName(
  partnerId: string,
  geminiFileName: string
) {
  if (!db) {
    console.error('❌ Database not available');
    return null;
  }

  try {
    const vaultFilesSnapshot = await db
      .collection(getVaultCollectionPath(partnerId))
      .where('geminiFileName', '==', geminiFileName)
      .limit(1)
      .get();
    
    if (vaultFilesSnapshot.empty) {
      console.warn(`⚠️ No file found for Gemini filename: ${geminiFileName}`);
      return null;
    }
    
    const doc = vaultFilesSnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      displayName: data.displayName,
      geminiFileName: data.geminiFileName,
      partnerId: data.partnerId,
    };
  } catch (error) {
    console.error('❌ Error getting vault file by Gemini filename:', error);
    return null;
  }
}

export async function getVaultFileById(partnerId: string, fileId: string) {
  if (!db) {
    console.error('❌ Database not available');
    return null;
  }

  try {
    const fileDoc = await db
      .collection(getVaultCollectionPath(partnerId))
      .doc(fileId)
      .get();
    
    if (!fileDoc.exists) {
      console.warn(`⚠️ No file found with ID: ${fileId}`);
      return null;
    }
    
    return {
      id: fileDoc.id,
      ...fileDoc.data()
    };
  } catch (error) {
    console.error('❌ Error getting vault file by ID:', error);
    return null;
  }
}