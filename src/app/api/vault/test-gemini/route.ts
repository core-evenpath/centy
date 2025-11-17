import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { db } from '@/lib/firebase-admin';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(request: NextRequest) {
  try {
    const { partnerId, message } = await request.json();

    console.log('🧪 Testing direct Gemini query');
    console.log('Partner:', partnerId);
    console.log('Message:', message);

    const storesSnapshot = await db!
      .collection(`partners/${partnerId}/fileSearchStores`)
      .where('state', '==', 'ACTIVE')
      .limit(1)
      .get();

    if (storesSnapshot.empty) {
      return NextResponse.json({ 
        success: false, 
        message: 'No RAG store found' 
      });
    }

    const ragStoreName = storesSnapshot.docs[0].data().name;
    console.log('📦 RAG Store:', ragStoreName);

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: message,
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

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    console.log('📚 Chunks retrieved:', groundingChunks.length);

    const chunks = groundingChunks.map((chunk: any, i: number) => ({
      index: i,
      title: chunk.retrievedContext?.title,
      uri: chunk.retrievedContext?.uri,
      textLength: chunk.retrievedContext?.text?.length || 0,
      textPreview: chunk.retrievedContext?.text?.substring(0, 200)
    }));

    console.log('📊 Chunk details:', JSON.stringify(chunks, null, 2));

    return NextResponse.json({
      success: true,
      response: response.text,
      ragStoreName,
      chunksRetrieved: groundingChunks.length,
      chunks
    });

  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json({
      success: false,
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}