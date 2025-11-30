'use server';

import { GoogleGenAI } from '@google/genai';
import { db } from '@/lib/firebase-admin';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface GeminiRAGResult {
  success: boolean;
  message: string;
  response?: string;
  geminiChunks?: Array<{
    content: string;
    source: string;
    score?: number;
  }>;
  usage?: any;
  retrievalTime?: number;
  generationTime?: number;
  modelUsed?: string;
  metadataFilter?: string;
}

function buildMetadataFilter(fileIds: string[]): string | undefined {
  if (!fileIds.length) return undefined;

  const filterParts = fileIds.map(id => `fileId="${id}"`);
  let filter = filterParts.join(' OR ');

  if (filter.length > 5000) {
    console.warn('⚠️ Filter too long, truncating to first 50 files');
    filter = filterParts.slice(0, 50).join(' OR ');
  }

  return filter;
}

async function getDocumentNameMapping(
  ragStoreName: string
): Promise<Map<string, string>> {
  const mapping = new Map<string, string>();

  try {
    let pageToken: string | undefined = undefined;

    do {
      const listParams: any = {
        parent: ragStoreName,
        config: { pageSize: 20 }
      };

      if (pageToken) {
        listParams.config.pageToken = pageToken;
      }

      const response = await genAI.fileSearchStores.documents.list(listParams) as any;

      if (response.documents) {
        for (const doc of response.documents) {
          if (doc.name && doc.displayName) {
            mapping.set(doc.name, doc.displayName);
            const docId = doc.name.split('/').pop() || '';
            if (docId) {
              mapping.set(docId, doc.displayName);
            }
          }
        }
      }

      pageToken = response.nextPageToken;
    } while (pageToken);


    console.log(`📋 Built document mapping with ${mapping.size} entries`);
  } catch (error) {
    console.warn('⚠️ Could not build document mapping:', error);
  }

  return mapping;
}


export async function queryWithGeminiRAG(
  partnerId: string,
  question: string,
  options?: {
    maxChunks?: number;
    selectedFileIds?: string[];
    selectedFileNames?: string[];
  }
): Promise<GeminiRAGResult> {
  const maxChunks = options?.maxChunks || 10;
  const selectedFileIds = options?.selectedFileIds;
  const selectedFileNames = options?.selectedFileNames;

  console.log('═══════════════════════════════════════');
  console.log('🔍 GEMINI RAG QUERY STARTING');
  console.log('═══════════════════════════════════════');
  console.log(`📊 Partner: ${partnerId}`);
  console.log(`📊 Question: "${question}"`);
  console.log(`📊 Max chunks: ${maxChunks}`);
  console.log(`📊 Selected file IDs: ${selectedFileIds?.length || 'ALL'} files`);
  console.log(`📊 Selected file Names: ${selectedFileNames?.join(', ') || 'ALL'}`);

  const startTime = Date.now();

  try {
    console.log('🔵 Step 1: Getting RAG store from database');

    let ragStoreName: string | null = null;

    if (db) {
      try {
        const storesSnapshot = await db
          .collection(`partners/${partnerId}/fileSearchStores`)
          .where('state', '==', 'ACTIVE')
          .limit(1)
          .get();

        if (!storesSnapshot.empty) {
          ragStoreName = storesSnapshot.docs[0].data().name;
          console.log(`✅ Found RAG store: ${ragStoreName}`);
        } else {
          console.error('❌ NO RAG STORE FOUND IN DATABASE');
          return {
            success: false,
            message: 'No document vault found. Please upload documents first.',
          };
        }
      } catch (error) {
        console.error('❌ Database error getting RAG store:', error);
        return {
          success: false,
          message: 'Database error getting document vault',
        };
      }
    } else {
      console.error('❌ Database not available');
      return {
        success: false,
        message: 'Database not available',
      };
    }

    if (!ragStoreName) {
      return {
        success: false,
        message: 'No document vault found',
      };
    }

    console.log('🔵 Step 2: Building document name mapping');
    const docNameMapping = await getDocumentNameMapping(ragStoreName);

    console.log('🔵 Step 3: Calling Gemini 3 Pro with File Search');
    console.log(`📤 RAG Store: ${ragStoreName}`);
    console.log(`📤 Question: "${question}"`);
    console.log(`📤 Model: gemini-3-pro-preview`);

    const queryStart = Date.now();

    const systemInstruction = `You are a helpful assistant that answers questions based ONLY on the documents in the knowledge base.

CRITICAL INSTRUCTIONS:
1. ONLY use information from the retrieved documents to answer
2. If the documents contain the answer, provide it directly and confidently
3. If the documents do NOT contain relevant information, clearly state: "I don't have information about that in the uploaded documents."
4. Be specific and cite information from the documents
5. Do NOT make up information or use general knowledge
6. Keep answers concise but complete`;

    let metadataFilter: string | undefined = undefined;

    // If no specific files selected, fetch ALL active files to ensure we don't search deleted ones
    let effectiveFileIds = selectedFileIds || [];

    if (effectiveFileIds.length === 0) {
      console.log('🔵 No specific files selected, fetching active file IDs for filter...');
      try {
        const activeFilesSnapshot = await db
          .collection(`partners/${partnerId}/vaultFiles`)
          .where('state', '==', 'ACTIVE')
          .get();

        const activeIds = activeFilesSnapshot.docs
          .map(doc => doc.id)
          .filter(id => id);

        if (activeIds.length > 0) {
          console.log(`✅ Found ${activeIds.length} active files for filtering`);
          effectiveFileIds = activeIds;
        } else {
          console.warn('⚠️ No active files found in database');
          return {
            success: true,
            message: 'No active documents found',
            response: "I don't have any documents to answer from. Please upload some documents first.",
            geminiChunks: []
          };
        }
      } catch (dbError) {
        console.error('⚠️ Failed to fetch active files:', dbError);
      }
    }

    if (effectiveFileIds.length > 0) {
      const filterParts = effectiveFileIds.map(id => `fileId="${id}"`);

      metadataFilter = filterParts.join(' OR ');
      console.log(`📤 Metadata Filter Length: ${metadataFilter.length} chars`);

      if (metadataFilter.length > 5000) {
        console.warn('⚠️ Filter string too long, truncating to first 50 files');
        const truncatedParts = filterParts.slice(0, 50);
        metadataFilter = truncatedParts.join(' OR ');
      }

      console.log(`📤 Metadata Filter: ${effectiveFileIds.length} files (using fileId)`);
    } else {
      console.log(`📤 Metadata Filter: None (searching all documents)`);
    }

    const fileSearchConfig: any = {
      fileSearchStoreNames: [ragStoreName],
    };

    if (metadataFilter) {
      fileSearchConfig.metadataFilter = metadataFilter;
    }

    let geminiResponse = await genAI.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: question,
      config: {
        systemInstruction: systemInstruction,
        tools: [
          {
            fileSearch: fileSearchConfig
          }
        ],
        temperature: 0.3,
        maxOutputTokens: 2048,
      }
    });

    let response = geminiResponse;
    let responseText = response.text || '';

    // Removed fallback retry logic to prevent contamination from deleted files

    const totalTime = Date.now() - queryStart;
    console.log(`✅ Gemini response received in ${totalTime}ms`);
    console.log(`📝 Response length: ${responseText.length} characters`);

    let groundingChunks: any[] = [];

    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];

      console.log('📊 Response structure:', {
        hasGroundingMetadata: !!candidate.groundingMetadata,
        groundingMetadataKeys: candidate.groundingMetadata ? Object.keys(candidate.groundingMetadata) : [],
      });

      if (candidate.groundingMetadata) {
        const gm = candidate.groundingMetadata;
        groundingChunks = gm.groundingChunks || [];

        console.log('📊 Grounding metadata:', {
          hasGroundingChunks: !!gm.groundingChunks,
          chunksLength: groundingChunks.length,
          hasGroundingSupports: !!gm.groundingSupports,
        });
      }
    }

    console.log(`📚 Retrieved ${groundingChunks.length} grounding chunks`);

    if (groundingChunks.length === 0) {
      console.warn('⚠️ No grounding chunks retrieved');
    } else {
      console.log('✅ Grounding chunks retrieved successfully!');
    }

    const processedChunks = groundingChunks
      .map((chunk: any) => {
        const ctx = chunk.retrievedContext;
        if (!ctx) return null;

        let content = ctx.text || '';
        let source = 'Document';

        if (ctx.title && ctx.title.trim()) {
          source = ctx.title;
        } else if (ctx.uri) {
          const uriParts = ctx.uri.split('/');
          for (let i = uriParts.length - 1; i >= 0; i--) {
            const part = uriParts[i];
            if (part && part.trim()) {
              const mappedName = docNameMapping.get(part);
              if (mappedName) {
                source = mappedName;
                break;
              }
              const fullPath = uriParts.slice(0, i + 1).join('/');
              const mappedFullPath = docNameMapping.get(fullPath);
              if (mappedFullPath) {
                source = mappedFullPath;
                break;
              }
            }
          }

          if (source === 'Document') {
            const lastPart = uriParts[uriParts.length - 1];
            if (lastPart && lastPart.trim() && !lastPart.match(/^[a-z0-9]{20,}$/i)) {
              source = decodeURIComponent(lastPart);
            }
          }
        }

        if (chunk.displayName) {
          source = chunk.displayName;
        }

        return {
          content: content.substring(0, 1000),
          source,
          score: 0.85,
        };
      })
      .filter((chunk): chunk is NonNullable<typeof chunk> => chunk !== null && chunk.content.length > 0)
      .slice(0, maxChunks);

    const uniqueSources = [...new Set(processedChunks.map(c => c.source))];
    console.log(`📄 Unique sources: ${uniqueSources.join(', ')}`);

    console.log('═══════════════════════════════════════');
    console.log('✅ GEMINI RAG QUERY COMPLETE');
    console.log('═══════════════════════════════════════');
    console.log(`⏱️ Total time: ${totalTime}ms`);
    console.log(`📚 Processed chunks: ${processedChunks.length}`);
    console.log(`📝 Response preview: ${responseText.substring(0, 200)}...`);
    console.log('═══════════════════════════════════════');

    return {
      success: true,
      message: 'Query successful',
      response: responseText,
      geminiChunks: processedChunks,
      usage: {
        model: 'gemini-3-pro-preview',
      },
      retrievalTime: totalTime,
      generationTime: totalTime,
      modelUsed: 'gemini-3-pro-preview',
      metadataFilter: metadataFilter,
    };

  } catch (error: any) {
    console.error('═══════════════════════════════════════');
    console.error('❌ GEMINI RAG QUERY FAILED');
    console.error('═══════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('═══════════════════════════════════════');

    return {
      success: false,
      message: `Query failed: ${error.message}`,
    };
  }
}