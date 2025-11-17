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
  }
): Promise<HybridQueryResult> {
  const maxChunks = options?.maxChunks || 5;
  const maxChunkChars = options?.maxChunkChars || 3000;
  const allowEmptyChunks = options?.allowEmptyChunks ?? false;

  try {
    console.log(`🤖 Using model: ${modelChoice}`);
    console.log('🔵 Step 1: Get Gemini RAG store');
    
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
        }
      } catch (error) {
        console.error('Error getting RAG store:', error);
      }
    }

    if (!ragStoreName) {
      if (!allowEmptyChunks) {
        return {
          success: false,
          message: 'No documents uploaded yet. Please upload documents first.',
        };
      }
      console.log('⚠️ No RAG store found, continuing with empty context');
    }

    let groundingChunks: any[] = [];
    let retrievalTime = 0;

    if (ragStoreName) {
      console.log('🔵 Step 2: Query Gemini to retrieve relevant chunks');
      console.log('📦 RAG Store:', ragStoreName);
      const retrievalStart = Date.now();

      const geminiResponse = await genAI.models.generateContent({
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
      });

      retrievalTime = Date.now() - retrievalStart;
      console.log(`✅ Gemini retrieval completed in ${retrievalTime}ms`);

      const groundingMetadata = geminiResponse.groundingMetadata;
      groundingChunks = groundingMetadata?.groundingChunks || [];
      
      console.log(`📊 Retrieved ${groundingChunks.length} chunks from Gemini`);
    }

    if (groundingChunks.length === 0) {
      if (!allowEmptyChunks) {
        return {
          success: false,
          message: 'No relevant information found in your documents for this query.',
        };
      }
      console.log('⚠️ No chunks retrieved, generating response without context');
    }

    const chunks = groundingChunks.map((chunk: any) => {
      const retrievedContext = chunk.retrievedContext;
      const content = retrievedContext?.text || '';
      const source = retrievedContext?.title || 'Knowledge Base';
      const score = 0.9;
      return {
        content: truncateChunk(content, maxChunkChars),
        source,
        score,
      };
    }).slice(0, maxChunks);

    const chunksUsed = chunks.length;
    console.log(`📊 Using ${chunksUsed} chunks for generation`);

    const chunksText = chunks.length > 0
      ? chunks.map((c, i) => 
          `[SOURCE ${i + 1}: ${c.source}]\n${c.content}\n`
        ).join('\n---\n\n')
      : 'No specific context available - use general knowledge.';

    const systemPrompt = `You are a helpful AI assistant that answers questions using the company's knowledge base.

${chunks.length > 0 ? `IMPORTANT: The information below contains the answer to the question. Your job is to find it and use it.

COMPANY KNOWLEDGE BASE:
${chunksText}

CRITICAL INSTRUCTIONS:
1. The information you need IS in the knowledge base above - find it and use it confidently
2. Search thoroughly through ALL sources provided - the answer is there
3. When information is present in the sources, answer directly and confidently
4. Quote relevant sections and cite which source they're from
5. Consider synonyms and related terms (e.g., "price" = "cost", "fee", "rate")
6. ONLY if after exhaustive search you find NOTHING related, then say you don't have that information

RESPONSE FORMAT:
- Be professional and conversational
- Keep responses to 1-3 sentences
- Be direct and confident when you have the information
- Cite your source briefly (e.g., "According to [source name]...")` 
: `Note: No specific company documents are available, so provide a general helpful response based on common knowledge.`}`;

    let responseText = '';
    let usage: any = {};
    let modelUsed = '';
    const generationStart = Date.now();

    console.log('🔵 Step 3: Generate response with chosen model');

    const systemTokens = estimateTokens(systemPrompt);
    const questionTokens = estimateTokens(question);
    const estimatedTokens = systemTokens + questionTokens;
    console.log(`📊 Estimated tokens: ${estimatedTokens} (system: ${systemTokens}, question: ${questionTokens})`);

    if (modelChoice === 'gemini-2.5-pro') {
      console.log('🔵 Using Gemini 2.5 Flash Lite for generation');

      const genResponse = await genAI.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `${systemPrompt}\n\nUSER QUESTION: ${question}\n\nYOUR ANSWER:`,
        config: {
          temperature: 0.3,
          maxOutputTokens: 4096,
        }
      });

      responseText = genResponse.text || '';
      usage = {
        prompt_tokens: genResponse.usageMetadata?.promptTokenCount || 0,
        completion_tokens: genResponse.usageMetadata?.candidatesTokenCount || 0,
      };
      modelUsed = 'gemini-2.5-flash-lite';

    } else if (modelChoice === 'gpt-4o-mini') {
      if (!process.env.OPENAI_API_KEY) {
        return {
          success: false,
          message: 'OpenAI API key not configured',
        };
      }

      console.log('🔵 Using GPT-4o Mini for generation');

      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: question,
            }
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
      console.log(`🔵 Using ${claudeModel} for generation`);

      const totalInputTokens = systemTokens + questionTokens;

      if (totalInputTokens > 190000) {
        return {
          success: false,
          message: `Context too large (${totalInputTokens.toLocaleString()} tokens). Please ask a more specific question.`,
          estimatedTokens: totalInputTokens,
        };
      }

      const { response, retryCount } = await callClaudeWithRetry({
        model: claudeModel,
        max_tokens: 4096,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: question,
          }
        ],
      });

      responseText = response.content[0].type === 'text' 
        ? response.content[0].text 
        : '';
      
      usage = response.usage;
      modelUsed = claudeModel;

      if (retryCount > 0) {
        console.log(`🔄 Query succeeded after ${retryCount} retry(s)`);
      }
    }

    const generationTime = Date.now() - generationStart;
    console.log(`✅ ${modelChoice} generation completed in ${generationTime}ms`);
    console.log('💰 Token usage:', usage);
    console.log(`⏱️ Total time: ${retrievalTime + generationTime}ms (retrieval: ${retrievalTime}ms, generation: ${generationTime}ms)`);

    return {
      success: true,
      response: responseText,
      geminiChunks: chunks.slice(0, chunksUsed),
      usage,
      retrievalTime,
      generationTime,
      chunksUsed,
      estimatedTokens,
      modelUsed,
    };

  } catch (error: any) {
    console.error('❌ Hybrid query failed:', error);
    
    const isRateLimitError = 
      error.status === 429 || 
      error.error?.type === 'rate_limit_error' ||
      error.message?.includes('rate_limit');
    
    if (isRateLimitError) {
      return {
        success: false,
        message: 'Rate limit reached. Please wait 60 seconds and try again.',
      };
    }
    
    return {
      success: false,
      message: `Query failed: ${error.message || 'Unknown error'}`,
    };
  }
}