'use server';

import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/firebase-admin';
import type { AIModelChoice } from '@/lib/types';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface HybridQueryResult {
  success: boolean;
  response?: string;
  geminiChunks?: Array<{
    content: string;
    score: number;
    source: string;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number;
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  message?: string;
  retrievalTime?: number;
  generationTime?: number;
  chunksUsed?: number;
  estimatedTokens?: number;
  modelUsed?: string;
  metadataFilter?: string;
}

function truncateChunk(content: string, maxChars: number = 3000): string {
  if (content.length <= maxChars) return content;
  return content.substring(0, maxChars) + '... [truncated]';
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callClaudeWithRetry(
  params: any,
  maxRetries: number = 3
): Promise<any> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await anthropic.messages.create(params);
      
      if (attempt > 0) {
        console.log(`✅ Retry ${attempt} succeeded`);
      }
      
      return { response, retryCount: attempt };
    } catch (error: any) {
      lastError = error;
      
      const isRateLimitError = 
        error.status === 429 || 
        error.error?.type === 'rate_limit_error' ||
        error.message?.includes('rate_limit');
      
      const isOverloadedError = 
        error.status === 529 || 
        error.error?.type === 'overloaded_error';
      
      if (isRateLimitError || isOverloadedError) {
        const waitTime = Math.min(Math.pow(2, attempt) * 2000, 60000);
        const errorType = isRateLimitError ? 'Rate limit' : 'Overloaded';
        
        console.log(`⏳ ${errorType} error. Waiting ${waitTime/1000}s before retry ${attempt + 1}/${maxRetries}...`);
        await delay(waitTime);
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
}

export async function queryWithHybridRAG(
  partnerId: string,
  question: string,
  modelChoice: AIModelChoice,
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
    
    // CRITICAL: Try WITHOUT metadata filter first
    if (selectedFileIds && selectedFileIds.length > 0) {
      console.log('⚠️ TEMPORARILY DISABLING METADATA FILTER FOR TESTING');
      console.log('   This will search ALL documents to verify retrieval works');
      // metadataFilter = selectedFileIds
      //   .map(id => `fileId="${id}"`)
      //   .join(' OR ');
      // console.log(`🔍 Metadata filter: ${metadataFilter}`);
    } else {
      console.log(`🔍 No filter - searching ALL documents`);
    }

    console.log('🔵 Step 3: Calling Gemini 2.5 Flash for retrieval');
    console.log(`📤 RAG Store: ${ragStoreName}`);
    console.log(`📤 Question: "${question}"`);
    console.log(`📤 Model: gemini-2.5-flash`);
    console.log(`📤 Filter: ${metadataFilter || 'NONE (searching all docs)'}`);
    
    const retrievalStart = Date.now();

    try {
      const geminiConfig: any = {
        model: 'gemini-2.5-flash',
        contents: question,
        config: {
          tools: [
            {
              fileSearch: {
                fileSearchStoreNames: [ragStoreName],
              }
            }
          ]
        }
      };

      // Only add metadata filter if it exists
      if (metadataFilter) {
        geminiConfig.config.tools[0].fileSearch.metadataFilter = metadataFilter;
      }

      console.log('📤 Sending Gemini request with config:', JSON.stringify(geminiConfig, null, 2));

      const geminiResponse = await genAI.models.generateContent(geminiConfig);

      retrievalTime = Date.now() - retrievalStart;
      console.log(`✅ Gemini response received in ${retrievalTime}ms`);

      // Debug the full response structure
      console.log('📊 Gemini response structure:', {
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
      
      console.log(`📚 Retrieved ${groundingChunks.length} chunks from Gemini`);

      if (groundingChunks.length === 0) {
        console.error('═══════════════════════════════════════');
        console.error('❌ NO CHUNKS RETRIEVED FROM GEMINI!');
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
            title: ctx?.title || 'NO TITLE',
            uri: ctx?.uri?.substring(0, 60) || 'NO URI',
            textLength: ctx?.text?.length || 0,
            textPreview: ctx?.text?.substring(0, 100) || 'NO TEXT'
          });
        });
      }

    } catch (geminiError: any) {
      console.error('❌ Gemini retrieval failed:', geminiError);
      console.error('Error details:', {
        message: geminiError.message,
        status: geminiError.status,
        stack: geminiError.stack,
      });
      throw geminiError;
    }

    const chunks = groundingChunks
      .slice(0, maxChunks)
      .map((chunk: any, index: number) => {
        const retrievedContext = chunk.retrievedContext;
        const text = retrievedContext?.text || '';
        const title = retrievedContext?.title || 
                     retrievedContext?.uri?.split('/').pop() || 
                     `Document ${index + 1}`;
        
        return {
          content: truncateChunk(text, maxChunkChars),
          source: title,
          score: 0.85,
        };
      })
      .filter(chunk => allowEmptyChunks || chunk.content.trim().length > 0);

    const chunksUsed = chunks.length;
    console.log(`📊 Using ${chunksUsed} chunks for generation`);

    if (chunksUsed === 0) {
      console.warn('⚠️ No chunks available for generation');
      return {
        success: true,
        response: "I couldn't find relevant information in the documents to answer your question. Please try:\n1. Rephrasing your question\n2. Being more specific\n3. Checking if the document contains this information",
        geminiChunks: [],
        usage: { prompt_tokens: 0, completion_tokens: 0 },
        retrievalTime,
        generationTime: 0,
        chunksUsed: 0,
        modelUsed: modelChoice,
        metadataFilter,
      };
    }

    const chunksText = chunks
      .map((c, i) => `[SOURCE ${i + 1}: ${c.source}]\n${c.content}\n`)
      .join('\n---\n\n');

    const systemPrompt = `You are a helpful AI assistant. Answer the question based on the provided context.

CONTEXT FROM DOCUMENTS:
${chunksText}

INSTRUCTIONS:
- Answer based ONLY on the context above
- Be specific and cite sources
- Keep responses concise (2-4 sentences)
- If the context doesn't answer the question, say so clearly`;

    let responseText = '';
    let usage: any = {};
    let modelUsed = '';
    const generationStart = Date.now();

    const systemTokens = estimateTokens(systemPrompt);
    const questionTokens = estimateTokens(question);
    const estimatedTokens = systemTokens + questionTokens;
    
    console.log('🔵 Step 4: Generating response');
    console.log(`📊 Input tokens (estimated): ${estimatedTokens}`);
    console.log(`📊 Model: ${modelChoice}`);

    if (modelChoice === 'gemini-2.5-pro') {
      console.log('🤖 Using Gemini 2.5 Flash for generation');

      const genResponse = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemPrompt}\n\nQUESTION: ${question}\n\nANSWER:`,
        config: {
          temperature: 0.3,
          maxOutputTokens: 4096,
        }
      });

      responseText = genResponse.text || '';
      
      const usageMeta = genResponse.usageMetadata;
      if (usageMeta) {
        usage = {
          prompt_tokens: usageMeta.promptTokenCount || 0,
          completion_tokens: usageMeta.candidatesTokenCount || 0,
          total_tokens: usageMeta.totalTokenCount || 0,
        };
      } else {
        usage = {
          prompt_tokens: estimateTokens(systemPrompt + question),
          completion_tokens: estimateTokens(responseText),
        };
      }
      
      modelUsed = 'gemini-2.5-flash';

    } else if (modelChoice === 'gpt-4o-mini') {
      if (!process.env.OPENAI_API_KEY) {
        return {
          success: false,
          message: 'OpenAI API key not configured',
        };
      }

      console.log('🤖 Using GPT-4o Mini for generation');

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
        console.log(`🔄 Succeeded after ${retryCount} retry(s)`);
      }
    }

    const generationTime = Date.now() - generationStart;
    const totalTime = Date.now() - startTime;

    console.log('═══════════════════════════════════════');
    console.log('✅ QUERY COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════');
    console.log(`⏱️ Retrieval: ${retrievalTime}ms`);
    console.log(`⏱️ Generation: ${generationTime}ms`);
    console.log(`⏱️ Total: ${totalTime}ms`);
    console.log(`📚 Chunks used: ${chunksUsed}`);
    console.log(`🤖 Model: ${modelUsed}`);
    console.log(`💰 Tokens: ${usage.prompt_tokens || usage.input_tokens || 0} in / ${usage.completion_tokens || usage.output_tokens || 0} out`);
    console.log(`📝 Response length: ${responseText.length} chars`);
    console.log(`📄 Response preview: ${responseText.substring(0, 200)}...`);
    console.log('═══════════════════════════════════════');

    return {
      success: true,
      response: responseText,
      geminiChunks: chunks,
      usage,
      retrievalTime,
      generationTime,
      chunksUsed,
      estimatedTokens,
      modelUsed,
      metadataFilter,
    };

  } catch (error: any) {
    console.error('═══════════════════════════════════════');
    console.error('❌ HYBRID QUERY FAILED');
    console.error('═══════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('═══════════════════════════════════════');
    
    const isRateLimitError = 
      error.status === 429 || 
      error.error?.type === 'rate_limit_error' ||
      error.message?.includes('rate_limit');
    
    if (isRateLimitError) {
      return {
        success: false,
        message: 'Rate limit reached. Please wait a moment and try again.',
      };
    }
    
    return {
      success: false,
      message: `Query failed: ${error.message || 'Unknown error'}`,
    };
  }
}