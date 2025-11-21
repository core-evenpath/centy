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

export async function queryWithGeminiRAG(
  partnerId: string,
  question: string,
  options?: {
    maxChunks?: number;
    selectedFileIds?: string[];
  }
): Promise<GeminiRAGResult> {
  const maxChunks = options?.maxChunks || 5;
  const selectedFileIds = options?.selectedFileIds;

  console.log('═══════════════════════════════════════');
  console.log('🔍 GEMINI 3 RAG QUERY STARTING');
  console.log('═══════════════════════════════════════');
  console.log(`📊 Partner: ${partnerId}`);
  console.log(`📊 Question: "${question}"`);
  console.log(`📊 Selected file IDs: ${selectedFileIds?.length || 'ALL'} files`);
  
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

    let metadataFilter: string | undefined;
    
    if (selectedFileIds && selectedFileIds.length > 0) {
      metadataFilter = selectedFileIds
        .map(id => `fileId="${id}"`)
        .join(' OR ');
      console.log(`🔍 Metadata filter: ${metadataFilter}`);
    } else {
      console.log(`🔍 No filter - searching ALL documents`);
    }

    console.log('🔵 Step 2: Calling Gemini 3 Pro for RAG query');
    console.log(`📤 RAG Store: ${ragStoreName}`);
    console.log(`📤 Question: "${question}"`);
    console.log(`📤 Model: gemini-3-pro-preview`);
    console.log(`📤 Thinking Level: low (optimized for retrieval + generation)`);
    
    const queryStart = Date.now();

    const geminiConfig: any = {
      model: 'gemini-3-pro-preview',
      contents: question,
      config: {
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [ragStoreName],
            }
          }
        ],
        thinkingLevel: 'low',
        maxOutputTokens: 4096,
      }
    };

    if (metadataFilter) {
      geminiConfig.config.tools[0].fileSearch.metadataFilter = metadataFilter;
    }

    console.log('📤 Sending Gemini 3 request');

    const geminiResponse = await genAI.models.generateContent(geminiConfig);

    const totalTime = Date.now() - queryStart;
    console.log(`✅ Gemini 3 response received in ${totalTime}ms`);

    // Extract response text
    const responseText = geminiResponse.text || '';

    // Extract grounding chunks
    let groundingChunks: any[] = [];
    if (geminiResponse.candidates && geminiResponse.candidates[0]) {
      const candidate = geminiResponse.candidates[0];
      if (candidate.groundingMetadata) {
        groundingChunks = candidate.groundingMetadata.groundingChunks || [];
      }
    }
    
    console.log(`📚 Retrieved ${groundingChunks.length} chunks from Gemini 3`);

    if (groundingChunks.length === 0) {
      console.warn('⚠️ No chunks retrieved - answer may be based on general knowledge');
    } else {
      groundingChunks.forEach((chunk: any, i: number) => {
        const ctx = chunk.retrievedContext;
        console.log(`  📄 Chunk ${i + 1}:`, {
          hasTitle: !!ctx?.title,
          title: ctx?.title || 'No title',
          textLength: ctx?.text?.length || 0,
        });
      });
    }

    // Process chunks
    const processedChunks = groundingChunks
      .map((chunk: any) => {
        const ctx = chunk.retrievedContext;
        if (!ctx) return null;

        let content = ctx.text || '';
        let source = ctx.title || 'Unknown Source';
        
        if (ctx.uri) {
          const match = ctx.uri.match(/files\/([^\/]+)/);
          if (match) {
            source = match[1];
          }
        }

        return {
          content,
          source,
          score: 0.85,
        };
      })
      .filter((chunk): chunk is NonNullable<typeof chunk> => chunk !== null)
      .slice(0, maxChunks);

    console.log('═══════════════════════════════════════');
    console.log('✅ GEMINI 3 RAG QUERY COMPLETE');
    console.log('═══════════════════════════════════════');
    console.log(`⏱️ Total time: ${totalTime}ms`);
    console.log(`📚 Chunks used: ${processedChunks.length}`);
    console.log(`📝 Response length: ${responseText.length} characters`);
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
      metadataFilter,
    };

  } catch (error: any) {
    console.error('═══════════════════════════════════════');
    console.error('❌ GEMINI 3 RAG QUERY FAILED');
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