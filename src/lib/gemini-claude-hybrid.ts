import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { db } from '@/lib/firebase-admin';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

interface HybridQueryResult {
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
  estimatedTokens?: number;
  modelUsed?: string;
  metadataFilter?: string;
}

async function callClaudeWithRetry(
  params: any,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<{ response: any; retryCount: number }> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await anthropic.messages.create(params);
      return { response, retryCount: attempt };
    } catch (error: any) {
      lastError = error;

      if (error.status === 529) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⚠️ Overloaded (attempt ${attempt + 1}/${maxRetries}), waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
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

export async function queryWithHybridRAG(
  partnerId: string,
  question: string,
  modelChoice: 'haiku' | 'sonnet-3.5' | 'sonnet-4.5' | 'openai' = 'haiku',
  options?: {
    maxChunks?: number;
    maxChunkChars?: number;
    allowEmptyChunks?: boolean;
    selectedFileIds?: string[];
  }
): Promise<HybridQueryResult> {
  const maxChunks = options?.maxChunks || 5;
  const maxChunkChars = options?.maxChunkChars || 3000;
  const allowEmptyChunks = options?.allowEmptyChunks ?? false;
  const selectedFileIds = options?.selectedFileIds;

  console.log('═══════════════════════════════════════');
  console.log('🔍 HYBRID RAG QUERY STARTING');
  console.log('═══════════════════════════════════════');
  console.log(`📊 Partner: ${partnerId}`);
  console.log(`📊 Model choice: ${modelChoice}`);
  console.log(`📊 Question: "${question}"`);
  console.log(`📊 Selected file IDs: ${selectedFileIds?.length || 'ALL'} files`);
  if (selectedFileIds) {
    console.log(`📋 File IDs:`, selectedFileIds);
  }

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

    let groundingChunks: any[] = [];
    let retrievalTime = 0;
    let metadataFilter: string | undefined;

    console.log('🔵 Step 2: Preparing metadata filter');

    if (selectedFileIds && selectedFileIds.length > 0) {
      metadataFilter = buildMetadataFilter(selectedFileIds);
      console.log(`📤 Metadata filter: ${selectedFileIds.length} files`);
    } else {
      console.log(`🔍 No filter - searching ALL documents`);
    }

    console.log('🔵 Step 3: Calling Gemini 3 Pro Preview for retrieval');
    console.log(`📤 RAG Store: ${ragStoreName}`);
    console.log(`📤 Question: "${question}"`);
    console.log(`📤 Model: gemini-3-pro-preview`);
    console.log(`📤 Thinking Level: low (optimized for retrieval speed)`);
    console.log(`📤 Filter: ${metadataFilter || 'NONE (searching all docs)'}`);

    const retrievalStart = Date.now();

    try {
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
        }
      };

      if (metadataFilter) {
        geminiConfig.config.tools[0].fileSearch.metadataFilter = metadataFilter;
      }

      console.log('📤 Sending Gemini 3 request with config:', JSON.stringify(geminiConfig, null, 2));

      const geminiResponse = await genAI.models.generateContent(geminiConfig);

      retrievalTime = Date.now() - retrievalStart;
      console.log(`✅ Gemini 3 response received in ${retrievalTime}ms`);

      console.log('📊 Gemini 3 response structure:', {
        hasCandidates: !!geminiResponse.candidates,
        candidatesLength: geminiResponse.candidates?.length || 0,
        firstCandidate: geminiResponse.candidates?.[0] ? 'exists' : 'missing',
        hasGroundingMetadata: !!geminiResponse.candidates?.[0]?.groundingMetadata,
      });

      if (geminiResponse.candidates && geminiResponse.candidates[0]) {
        const candidate = geminiResponse.candidates[0];
        console.log('📊 Candidate structure:', {
          hasGroundingMetadata: !!candidate.groundingMetadata,
          groundingMetadataKeys: candidate.groundingMetadata ? Object.keys(candidate.groundingMetadata) : [],
        });

        if (candidate.groundingMetadata) {
          const gm = candidate.groundingMetadata;
          console.log('📊 Grounding metadata:', {
            hasGroundingChunks: !!gm.groundingChunks,
            chunksLength: gm.groundingChunks?.length || 0,
            hasSearchEntryPoint: !!gm.searchEntryPoint,
            hasGroundingSupports: !!gm.groundingSupports,
          });

          groundingChunks = gm.groundingChunks || [];
        }
      }

      console.log(`📚 Retrieved ${groundingChunks.length} chunks from Gemini 3`);

      if (groundingChunks.length === 0) {
        console.error('═══════════════════════════════════════');
        console.error('❌ NO CHUNKS RETRIEVED FROM GEMINI 3!');
        console.error('═══════════════════════════════════════');
        console.error('Possible causes:');
        console.error('1. Files not properly indexed in RAG store');
        console.error('2. RAG store name incorrect');
        console.error('3. Metadata filter too restrictive');
        console.error('4. Question doesn\'t match document content');
        console.error('');
        console.error('RAG Store:', ragStoreName);
        console.error('Metadata Filter:', metadataFilter || 'NONE');
        console.error('Question:', question);
        console.error('═══════════════════════════════════════');
      } else {
        console.log('✅ Chunks retrieved successfully!');
        groundingChunks.forEach((chunk: any, i: number) => {
          const ctx = chunk.retrievedContext;
          console.log(`  📄 Chunk ${i + 1}:`, {
            hasContext: !!ctx,
            hasText: !!ctx?.text,
            textLength: ctx?.text?.length || 0,
            hasTitle: !!ctx?.title,
            title: ctx?.title || 'No title',
          });
        });
      }

    } catch (geminiError: any) {
      console.error('❌ Gemini 3 retrieval failed:', geminiError);
      return {
        success: false,
        message: `Gemini 3 retrieval failed: ${geminiError.message}`,
      };
    }

    console.log('🔵 Step 4: Processing and filtering chunks');

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

        if (content.length > maxChunkChars) {
          content = content.substring(0, maxChunkChars) + '...';
        }

        return {
          content,
          source,
          score: 0.85,
        };
      })
      .filter((chunk): chunk is NonNullable<typeof chunk> => chunk !== null)
      .slice(0, maxChunks);

    console.log(`✅ Processed ${processedChunks.length} chunks for Claude`);

    if (processedChunks.length === 0 && !allowEmptyChunks) {
      return {
        success: false,
        message: 'No relevant content found in documents',
        retrievalTime,
      };
    }

    console.log('🔵 Step 5: Building context for Claude');

    const contextText = processedChunks.length > 0
      ? processedChunks
        .map((chunk, i) => `[Source ${i + 1}: ${chunk.source}]\n${chunk.content}`)
        .join('\n\n---\n\n')
      : 'No specific document content retrieved.';

    const estimatedTokens = Math.ceil(contextText.length / 4) + Math.ceil(question.length / 4);
    console.log(`📊 Estimated total tokens: ${estimatedTokens.toLocaleString()}`);

    console.log('🔵 Step 6: Generating response with LLM');

    const systemPrompt = processedChunks.length > 0
      ? `You are a helpful assistant that answers questions based on the provided document context.

DOCUMENT CONTEXT:
${contextText}

Instructions:
- Answer the question using ONLY the information from the document context above
- Be direct and concise
- If the documents don't contain the answer, say "I don't have that information in the provided documents"
- Cite which source you're using when relevant`
      : `You are a helpful assistant. The document search did not return specific results, so provide a general, helpful response based on your knowledge.`;

    const generationStart = Date.now();
    let responseText = '';
    let usage: any = {};
    let modelUsed = '';

    if (modelChoice === 'openai') {
      console.log('🤖 Using GPT-4o-mini for generation');

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question }
          ],
          temperature: 0.3,
          max_tokens: 4096,
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
      }

      const openaiData = await openaiResponse.json();
      responseText = openaiData.choices[0]?.message?.content || '';
      usage = {
        prompt_tokens: openaiData.usage?.prompt_tokens || 0,
        completion_tokens: openaiData.usage?.completion_tokens || 0,
      };
      modelUsed = 'gpt-4o-mini';

    } else {
      const modelMap = {
        'haiku': 'claude-3-5-haiku-20241022',
        'sonnet-3.5': 'claude-3-5-sonnet-20241022',
        'sonnet-4.5': 'claude-sonnet-4-20250514',
      };

      const claudeModel = modelMap[modelChoice as 'haiku' | 'sonnet-3.5' | 'sonnet-4.5'];
      console.log(`🤖 Using ${claudeModel} for generation`);

      if (estimatedTokens > 190000) {
        return {
          success: false,
          message: `Context too large (${estimatedTokens.toLocaleString()} tokens). Please select fewer documents.`,
          estimatedTokens,
        };
      }

      const { response, retryCount } = await callClaudeWithRetry({
        model: claudeModel,
        max_tokens: 4096,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          { role: 'user', content: question }
        ],
      });

      responseText = response.content[0].type === 'text'
        ? response.content[0].text
        : '';
      usage = response.usage;
      modelUsed = claudeModel;

      if (retryCount > 0) {
        console.log(`✅ Succeeded after ${retryCount} retries`);
      }
    }

    const generationTime = Date.now() - generationStart;
    console.log(`✅ Response generated in ${generationTime}ms`);

    const totalTime = Date.now() - startTime;
    console.log('═══════════════════════════════════════');
    console.log('✅ HYBRID RAG QUERY COMPLETE');
    console.log('═══════════════════════════════════════');
    console.log(`⏱️ Total time: ${totalTime}ms`);
    console.log(`⏱️ Retrieval (Gemini 3): ${retrievalTime}ms`);
    console.log(`⏱️ Generation (${modelUsed}): ${generationTime}ms`);
    console.log(`📚 Chunks used: ${processedChunks.length}`);
    console.log(`💰 Tokens: ${usage.input_tokens || usage.prompt_tokens || 0} in, ${usage.output_tokens || usage.completion_tokens || 0} out`);
    console.log('═══════════════════════════════════════');

    return {
      success: true,
      message: 'Query successful',
      response: responseText,
      geminiChunks: processedChunks,
      usage,
      retrievalTime,
      generationTime,
      modelUsed,
      metadataFilter,
    };

  } catch (error: any) {
    console.error('═══════════════════════════════════════');
    console.error('❌ HYBRID RAG QUERY FAILED');
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