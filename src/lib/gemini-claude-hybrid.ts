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
    source?: string;
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

  console.log('🔍 Hybrid RAG Query Starting');
  console.log(`📊 Selected files: ${selectedFileIds?.length || 'ALL'}`);

  const startTime = Date.now();

  if (!db) {
    return {
      success: false,
      message: 'Database not available',
    };
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
        message: 'No active File Search store found',
      };
    }

    const ragStoreName = storesSnapshot.docs[0].data().name;
    console.log(`📦 Using RAG store: ${ragStoreName}`);

    let metadataFilter: string | undefined;
    if (selectedFileIds && selectedFileIds.length > 0) {
      metadataFilter = selectedFileIds
        .map(id => `fileId="${id}"`)
        .join(' OR ');
      
      console.log(`🔍 Metadata filter: ${metadataFilter}`);
    } else {
      console.log(`🔍 No filter - searching ALL documents`);
    }

    console.log('📤 Step 1: Gemini retrieval...');
    const retrievalStart = Date.now();

    const geminiResponse = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: question,
      config: {
        tools: [
          {
            fileSearch: {
              fileSearchStoreNames: [ragStoreName],
              metadataFilter: metadataFilter,
            }
          }
        ]
      }
    });

    const retrievalTime = Date.now() - retrievalStart;
    console.log(`⏱️ Gemini retrieval: ${retrievalTime}ms`);

    const groundingChunks = geminiResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    console.log(`📚 Retrieved ${groundingChunks.length} chunks from Gemini`);

    const chunks = groundingChunks
      .slice(0, maxChunks)
      .map((chunk: any, index: number) => {
        const text = chunk.retrievedContext?.text || '';
        const title = chunk.retrievedContext?.title || `Document ${index + 1}`;
        
        return {
          content: truncateChunk(text, maxChunkChars),
          score: 0.85,
          source: title,
        };
      })
      .filter(chunk => allowEmptyChunks || chunk.content.trim().length > 0);

    console.log(`📊 Using ${chunks.length} chunks for generation`);

    if (chunks.length === 0 && !allowEmptyChunks) {
      return {
        success: true,
        response: "I couldn't find relevant information in the selected documents to answer your question. Please try rephrasing or selecting different documents.",
        geminiChunks: [],
        retrievalTime,
        generationTime: 0,
        chunksUsed: 0,
        modelUsed: modelChoice,
        metadataFilter,
      };
    }

    const contextText = chunks.length > 0
      ? chunks.map((chunk, i) => `[Source ${i + 1}: ${chunk.source}]\n${chunk.content}`).join('\n\n---\n\n')
      : '';

    const estimatedContextTokens = estimateTokens(contextText);
    console.log(`💰 Estimated context tokens: ${estimatedContextTokens}`);

    console.log('🤖 Step 2: LLM generation...');
    const generationStart = Date.now();

    let response: string;
    let usage: any = {};

    const modelMap: Record<AIModelChoice, string> = {
      'haiku': 'claude-3-5-haiku-20241022',
      'sonnet-3.5': 'claude-3-5-sonnet-20241022',
      'sonnet-4.5': 'claude-sonnet-4-20250514',
      'gpt-4o-mini': 'gpt-4o-mini',
      'gemini-2.5-pro': 'gemini-2.5-pro',
    };

    const modelName = modelMap[modelChoice];

    if (modelChoice === 'gemini-2.5-pro') {
      const geminiGenResponse = await genAI.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Based on the following context, answer the user's question. If the context doesn't contain relevant information, say so clearly.

Context:
${contextText}

Question: ${question}

Answer:`,
      });

      response = geminiGenResponse.text;
      usage = {
        prompt_tokens: estimatedContextTokens,
        completion_tokens: estimateTokens(response),
      };
    } else if (modelChoice.startsWith('sonnet') || modelChoice === 'haiku') {
      const systemPrompt = chunks.length > 0
        ? `You are a helpful assistant. Answer the user's question based on the provided context. If the context doesn't contain the answer, say so clearly. Be concise and direct.`
        : `You are a helpful assistant. The document search returned no results. Politely inform the user that you couldn't find relevant information.`;

      const userPrompt = chunks.length > 0
        ? `Context from documents:\n\n${contextText}\n\nQuestion: ${question}`
        : `Question: ${question}`;

      const { response: claudeResponse } = await callClaudeWithRetry({
        model: modelName,
        max_tokens: 2048,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          }
        ],
      });

      response = claudeResponse.content[0].type === 'text' 
        ? claudeResponse.content[0].text 
        : '';
      usage = claudeResponse.usage;
    } else {
      return {
        success: false,
        message: `Model ${modelChoice} not yet implemented`,
      };
    }

    const generationTime = Date.now() - generationStart;
    console.log(`⏱️ LLM generation: ${generationTime}ms`);
    console.log(`✅ Total time: ${Date.now() - startTime}ms`);

    return {
      success: true,
      response,
      geminiChunks: chunks,
      usage,
      retrievalTime,
      generationTime,
      chunksUsed: chunks.length,
      estimatedTokens: estimatedContextTokens,
      modelUsed: modelName,
      metadataFilter,
    };

  } catch (error: any) {
    console.error('❌ Hybrid RAG query failed:', error);
    
    return {
      success: false,
      message: `Query failed: ${error.message || 'Unknown error'}`,
    };
  }
}