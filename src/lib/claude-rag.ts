'use server';

import Anthropic from '@anthropic-ai/sdk';
import { getStorage } from 'firebase-admin/storage';
import { db } from '@/lib/firebase-admin';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface DocumentContent {
  fileId: string;
  fileName: string;
  content: string;
  tokenEstimate: number;
}

interface ClaudeQueryResult {
  success: boolean;
  response?: string;
  usage?: {
    input_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
    output_tokens: number;
  };
  message?: string;
  documents?: DocumentContent[];
  retryCount?: number;
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

async function loadDocumentContent(
  partnerId: string,
  fileId: string
): Promise<DocumentContent> {
  if (!db) {
    throw new Error('Database not available');
  }

  const fileDoc = await db
    .collection(`partners/${partnerId}/vaultFiles`)
    .doc(fileId)
    .get();

  if (!fileDoc.exists) {
    throw new Error(`File ${fileId} not found`);
  }

  const fileData = fileDoc.data()!;
  
  if (fileData.state !== 'ACTIVE') {
    throw new Error(`File ${fileId} is not ready (state: ${fileData.state})`);
  }

  let content: string;

  if (fileData.extractedText) {
    console.log(`📄 Using pre-extracted text from: ${fileData.displayName}`);
    content = fileData.extractedText;
  } 
  else if (fileData.trainingData) {
    console.log(`📋 Using training data from: ${fileData.displayName}`);
    content = fileData.trainingData;
  }
  else if (
    fileData.mimeType === 'text/markdown' ||
    fileData.mimeType === 'text/plain' ||
    fileData.sourceType === 'training'
  ) {
    console.log(`📥 Downloading text file: ${fileData.displayName}`);
    const storage = getStorage();
    const bucket = storage.bucket();
    const file = bucket.file(fileData.firebaseStoragePath);
    const [buffer] = await file.download();
    content = buffer.toString('utf-8');
  }
  else {
    console.log(`📥 Downloading file: ${fileData.displayName}`);
    const storage = getStorage();
    const bucket = storage.bucket();
    const file = bucket.file(fileData.firebaseStoragePath);
    const [buffer] = await file.download();
    content = buffer.toString('utf-8');
  }

  if (!content || content.trim().length === 0) {
    throw new Error(`No content extracted from ${fileData.displayName}. The file may be empty or in an unsupported format.`);
  }

  const tokenEstimate = Math.ceil(content.length / 4);

  console.log(`✅ Loaded "${fileData.displayName}": ${content.length} chars (~${tokenEstimate} tokens)`);

  return {
    fileId,
    fileName: fileData.displayName || fileData.name,
    content,
    tokenEstimate,
  };
}

export async function queryVaultWithClaude(
  partnerId: string,
  selectedFileIds: string[],
  question: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<ClaudeQueryResult> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    if (!selectedFileIds || selectedFileIds.length === 0) {
      return {
        success: false,
        message: 'No files selected for query',
      };
    }

    console.log(`🔍 Loading ${selectedFileIds.length} documents for query...`);

    const documents = await Promise.all(
      selectedFileIds.map(fileId => loadDocumentContent(partnerId, fileId))
    );

    const totalTokens = documents.reduce((sum, d) => sum + d.tokenEstimate, 0);
    console.log(`📊 Total estimated tokens: ${totalTokens}`);

    if (totalTokens > 190000) {
      return {
        success: false,
        message: `Documents are too large (${totalTokens.toLocaleString()} tokens). Please select fewer documents or smaller files. Maximum: 190,000 tokens.`,
      };
    }

    if (totalTokens > 180000) {
      console.warn('⚠️ Document size approaching 200K token limit');
    }

    const fileNamesList = documents.map(d => d.fileName).join(', ');

    console.log('📋 DOCUMENT DETAILS:');
    documents.forEach((doc, idx) => {
      console.log(`  ${idx + 1}. ${doc.fileName}: ${doc.tokenEstimate.toLocaleString()} tokens`);
    });

    const systemBlocks = [
      {
        type: 'text' as const,
        text: `You are a document analysis assistant. Your task is to answer questions using EXCLUSIVELY the documents provided below.

CRITICAL INSTRUCTIONS:
1. You MUST ONLY use information explicitly stated in the documents below
2. Search thoroughly through all parts: headers, body text, tables, lists, footnotes
3. Look for synonyms and related terms (e.g., "compensation" = "salary", "pay", "remuneration")
4. If the answer is not in the documents, respond: "I searched the document(s) but could not find specific information about [topic]. The documents may discuss related topics. Would you like me to summarize what IS covered?"
5. When answering, cite the specific document name and quote relevant sections
6. DO NOT use general knowledge, training data, or make inferences beyond what's explicitly stated

DOCUMENTS PROVIDED (your only knowledge source):
${fileNamesList}

Remember: If it's not clearly written in these documents, you don't know it.`,
      },
      ...documents.map(doc => ({
        type: 'text' as const,
        text: `## DOCUMENT: ${doc.fileName}\n\nCONTENT:\n${doc.content}`,
        cache_control: { type: 'ephemeral' as const },
      })),
    ];

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...(conversationHistory || []),
      {
        role: 'user' as const,
        content: question,
      },
    ];

    console.log('📤 Sending query to Claude...');
    const startTime = Date.now();

    const { response, retryCount } = await callClaudeWithRetry({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      temperature: 0.3,
      system: systemBlocks,
      messages,
    });

    const duration = Date.now() - startTime;

    const usage = response.usage;
    const cacheHitTokens = usage.cache_read_input_tokens || 0;
    const cacheCreationTokens = usage.cache_creation_input_tokens || 0;
    const totalInputTokens = usage.input_tokens + cacheHitTokens;
    const cacheHitRate = totalInputTokens > 0
      ? ((cacheHitTokens / totalInputTokens) * 100).toFixed(1)
      : '0';

    console.log('✅ Claude response received');
    console.log(`⏱️ Duration: ${duration}ms`);
    console.log('💰 Token usage:', {
      input: usage.input_tokens,
      cacheCreation: cacheCreationTokens,
      cacheRead: cacheHitTokens,
      output: usage.output_tokens,
      cacheHitRate: `${cacheHitRate}%`,
    });

    if (retryCount > 0) {
      console.log(`🔄 Query succeeded after ${retryCount} retry(s)`);
    }

    const responseText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';

    return {
      success: true,
      response: responseText,
      usage: response.usage,
      documents,
      retryCount,
    };
  } catch (error: any) {
    console.error('❌ Claude query failed:', error);
    
    const isRateLimitError = 
      error.status === 429 || 
      error.error?.type === 'rate_limit_error' ||
      error.message?.includes('rate_limit');
    
    if (isRateLimitError) {
      return {
        success: false,
        message: 'Rate limit reached. Please wait 60 seconds and try again. Consider upgrading your API tier for higher limits.',
      };
    }
    
    return {
      success: false,
      message: `Query failed: ${error.message || 'Unknown error'}`,
    };
  }
}

export async function estimateDocumentTokens(
  partnerId: string,
  fileIds: string[]
): Promise<{
  success: boolean;
  totalTokens?: number;
  documents?: Array<{ fileId: string; fileName: string; tokens: number }>;
  message?: string;
}> {
  try {
    const documents = await Promise.all(
      fileIds.map(fileId => loadDocumentContent(partnerId, fileId))
    );

    const totalTokens = documents.reduce((sum, d) => sum + d.tokenEstimate, 0);

    return {
      success: true,
      totalTokens,
      documents: documents.map(d => ({
        fileId: d.fileId,
        fileName: d.fileName,
        tokens: d.tokenEstimate,
      })),
    };
  } catch (error: any) {
    console.error('Error estimating tokens:', error);
    return {
      success: false,
      message: error.message,
    };
  }
}