'use server';

import { db } from '@/lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getConversationContext } from './conversation-export-actions';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function queryConversationRAG(
  partnerId: string,
  conversationId: string,
  platform: 'sms' | 'whatsapp',
  message: string
): Promise<{
  success: boolean;
  message: string;
  suggestedReply?: string;
  confidence?: number;
  reasoning?: string;
  sources?: any[];
  alternativeReplies?: string[];
}> {
  console.log('🚀 Starting RAG query for conversation:', conversationId);
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not configured');
    return { success: false, message: 'AI service not configured - missing API key' };
  }

  if (!db) {
    console.error('❌ Database not available');
    return { success: false, message: 'Database not available' };
  }

  try {
    const conversationCollection = platform === 'sms' ? 'smsConversations' : 'whatsappConversations';
    const conversationDoc = await db.collection(conversationCollection).doc(conversationId).get();

    if (!conversationDoc.exists) {
      console.error('❌ Conversation not found');
      return { success: false, message: 'Conversation not found' };
    }

    const conversationData = conversationDoc.data();
    const customerName = conversationData?.customerName || conversationData?.contactName || 'Customer';

    const storesSnapshot = await db
      .collection(`partners/${partnerId}/fileSearchStores`)
      .where('state', '==', 'ACTIVE')
      .limit(1)
      .get();

    if (storesSnapshot.empty) {
      console.error('❌ No active knowledge base found');
      return { 
        success: false, 
        message: 'No documents found. Please upload documents to vault first.' 
      };
    }

    const ragStoreName = storesSnapshot.docs[0].data().name;
    console.log('✅ Using RAG store:', ragStoreName);

    const conversationContext = await getConversationContext(conversationId, platform, 10);

    const prompt = `You are helping respond to a customer message.

Customer: ${customerName}

Recent conversation history:
${conversationContext || 'No previous conversation'}

Customer's new message: "${message}"

Instructions:
- Use company documents to answer about policies, pricing, services
- Use the conversation history above for context about THIS specific customer
- Generate a helpful 2-3 sentence reply
- Be professional and concise

Reply:`;

    console.log('📤 Querying Gemini with vault documents...');

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
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

    const responseText = result.response.text();
    
    if (!responseText?.trim()) {
      console.error('❌ AI generated empty response');
      return { success: false, message: 'AI generated empty response' };
    }

    console.log('✅ Response:', responseText.substring(0, 100) + '...');

    const groundingChunks = result.response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources = groundingChunks.slice(0, 5).map((chunk: any) => {
      const title = chunk.retrievedContext?.title || 'Document';
      const text = chunk.retrievedContext?.text || '';
      
      return {
        type: 'document',
        name: title,
        excerpt: text.substring(0, 150),
        relevance: 0.85,
      };
    });

    console.log(`✅ Generated reply with ${sources.length} sources from vault`);

    const confidence = Math.min(0.95, 0.5 + (sources.length * 0.1));
    
    const reasoning = sources.length > 0 
      ? `Generated from ${sources.length} document${sources.length > 1 ? 's' : ''} and conversation history`
      : 'Generated from conversation context';

    let alternatives: string[] = [];
    try {
      const altResult = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `Generate 2 alternative ways to say: "${responseText}". Return only the alternatives, one per line.` }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 200 },
      });
      
      const altText = altResult.response.text();
      alternatives = altText.split('\n').filter(line => line.trim()).slice(0, 2);
    } catch (error) {
      console.error('Failed to generate alternatives:', error);
    }

    console.log('✅ RAG query complete\n');

    return {
      success: true,
      message: 'Success',
      suggestedReply: responseText,
      confidence,
      reasoning,
      sources,
      alternativeReplies: alternatives,
    };

  } catch (error: any) {
    console.error('❌ RAG query failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    return {
      success: false,
      message: `Query failed: ${error.message || 'Unknown error'}`,
    };
  }
}