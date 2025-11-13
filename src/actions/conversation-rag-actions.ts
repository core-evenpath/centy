'use server';

import { db } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getConversationContext } from './conversation-export-actions';
import type { RAGQueryResult, RAGSource } from '@/lib/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function queryConversationRAG(
  partnerId: string,
  conversationId: string,
  platform: 'sms' | 'whatsapp',
  userMessage: string
): Promise<RAGQueryResult> {
  if (!db) {
    return { success: false, message: 'Database not available' };
  }

  try {
    console.log(`🔍 RAG Query for conversation ${conversationId}: "${userMessage}"`);

    // 1. Get file search store
    const storesSnapshot = await db
      .collection(`partners/${partnerId}/fileSearchStores`)
      .where('state', '==', 'ACTIVE')
      .limit(1)
      .get();

    if (storesSnapshot.empty) {
      return {
        success: false,
        message: 'No active knowledge base found. Please upload documents or sync conversations first.',
      };
    }

    const ragStoreName = storesSnapshot.docs[0].data().name;

    // 2. Get recent conversation context
    const conversationContext = await getConversationContext(conversationId, platform, 10);

    // 3. Build enhanced prompt with context
    const systemInstruction = `You are a helpful AI assistant helping a business respond to customer messages.

IMPORTANT INSTRUCTIONS:
1. Generate a professional, helpful reply that the business partner can send to the customer
2. Base your response on the conversation history and available documents
3. Keep responses concise and actionable (2-4 sentences)
4. Match the tone of the conversation (formal or casual)
5. If you're not confident, ask clarifying questions
6. Never make up information - only use what's in the documents and conversation history

Recent Conversation Context:
${conversationContext}

Customer's Latest Message: "${userMessage}"

Provide a suggested reply and explain your reasoning.`;

    // 4. Query Gemini with File Search
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
    });

    const response = await model.generateContent({
      systemInstruction,
      contents: [
        {
          role: 'user',
          parts: [{ text: `Based on the conversation context and available knowledge, suggest a reply to: "${userMessage}"` }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
      tools: [
        {
          fileSearch: {
            fileSearchStoreNames: [ragStoreName],
          },
        },
      ],
    });

    const responseText = response.response.text();
    console.log('📝 RAG Response:', responseText);

    // 5. Extract grounding chunks (sources)
    const groundingChunks = response.response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources: RAGSource[] = groundingChunks.slice(0, 3).map((chunk: any) => {
      const title = chunk.retrievedContext?.title || 'Document';
      const text = chunk.retrievedContext?.text || '';
      const isConversation = title.includes('conversation') || title.includes('Conversation');

      return {
        type: isConversation ? 'conversation' : 'document',
        name: title,
        excerpt: text.substring(0, 150),
        relevance: 0.85, // Gemini doesn't provide scores, default to high
      };
    });

    // 6. Calculate confidence based on response and sources
    const confidence = calculateConfidence(responseText, sources.length);

    // 7. Generate reasoning
    const reasoning = generateReasoning(responseText, sources, conversationContext);

    return {
      success: true,
      message: 'Query successful',
      response: responseText,
      confidence,
      reasoning,
      sources,
      groundingChunks,
    };
  } catch (error: any) {
    console.error('❌ RAG Query Error:', error);
    return {
      success: false,
      message: `Query failed: ${error.message}`,
    };
  }
}

function calculateConfidence(response: string, sourceCount: number): number {
  let confidence = 0.5; // Base confidence

  // Increase confidence with more sources
  confidence += Math.min(sourceCount * 0.15, 0.3);

  // Increase if response is detailed
  if (response.length > 100) confidence += 0.1;
  if (response.length > 200) confidence += 0.1;

  // Decrease if response indicates uncertainty
  const uncertaintyPhrases = ['not sure', 'might', 'possibly', 'unclear', 'don\'t know'];
  if (uncertaintyPhrases.some(phrase => response.toLowerCase().includes(phrase))) {
    confidence -= 0.2;
  }

  // Increase if response has specific details
  const specificIndicators = ['$', '%', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'AM', 'PM'];
  if (specificIndicators.some(indicator => response.includes(indicator))) {
    confidence += 0.1;
  }

  return Math.max(0.3, Math.min(0.95, confidence));
}

function generateReasoning(response: string, sources: RAGSource[], conversationContext: string): string {
  const parts: string[] = [];

  if (conversationContext) {
    parts.push('Based on the ongoing conversation');
  }

  if (sources.length > 0) {
    const docSources = sources.filter(s => s.type === 'document').length;
    const convoSources = sources.filter(s => s.type === 'conversation').length;

    if (docSources > 0) parts.push(`${docSources} relevant document${docSources > 1 ? 's' : ''}`);
    if (convoSources > 0) parts.push(`${convoSources} past conversation${convoSources > 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return 'Generated response based on general knowledge';
  }

  return `Generated from ${parts.join(' and ')}`;
}

export async function generateAlternativeReplies(
  partnerId: string,
  originalReply: string,
  userMessage: string,
  count: number = 2
): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Given this customer message: "${userMessage}"
And this suggested reply: "${originalReply}"

Generate ${count} alternative ways to respond that convey the same information but with different wording or tone.
Return only the alternative responses, one per line, without numbering or additional text.`;

    const response = await model.generateContent(prompt);
    const text = response.response.text();
    
    return text
      .split('\n')
      .filter(line => line.trim())
      .slice(0, count);
  } catch (error) {
    console.error('Error generating alternatives:', error);
    return [];
  }
}