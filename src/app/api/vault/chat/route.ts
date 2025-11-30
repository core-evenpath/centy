import { NextRequest, NextResponse } from 'next/server';
import { queryWithGeminiRAG } from '@/lib/gemini-rag';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('═══════════════════════════════════════');
    console.log('🚀 VAULT CHAT API CALLED');
    console.log('═══════════════════════════════════════');

    const body = await request.json();
    const { partnerId, userId, message, selectedFileIds, selectedFileNames } = body;

    console.log('📊 Request params:', {
      partnerId,
      userId,
      messageLength: message?.length,
      selectedFileIds: selectedFileIds?.length || 'ALL',
      selectedFileNames: selectedFileNames?.length || 'ALL',
    });

    if (!partnerId || !userId || !message) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { success: false, message: 'Missing required fields: partnerId, userId, and message are required' },
        { status: 400 }
      );
    }

    console.log('🔵 Calling queryWithGeminiRAG...');

    const result = await queryWithGeminiRAG(
      partnerId,
      message,
      {
        maxChunks: 10,
        selectedFileIds: selectedFileIds,
        selectedFileNames: selectedFileNames,
      }
    );

    const totalTime = Date.now() - startTime;

    if (!result.success) {
      console.error('❌ Query failed:', result.message);
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          retrievalTime: result.retrievalTime,
        },
        { status: 500 }
      );
    }

    if (db) {
      try {
        await db.collection(`partners/${partnerId}/vaultQueries`).add({
          query: message,
          response: result.response,
          partnerId: partnerId,
          userId: userId,
          selectedFileIds: selectedFileIds || [],
          provider: 'gemini-rag',
          modelUsed: result.modelUsed,
          chunksRetrieved: result.geminiChunks?.length || 0,
          retrievalTimeMs: result.retrievalTime,
          generationTimeMs: result.generationTime,
          totalTimeMs: totalTime,
          createdAt: FieldValue.serverTimestamp(),
        });
        console.log('✅ Query logged to database');
      } catch (logError) {
        console.warn('⚠️ Failed to log query:', logError);
      }
    }

    console.log('═══════════════════════════════════════');
    console.log('✅ VAULT CHAT API SUCCESS');
    console.log('═══════════════════════════════════════');
    console.log(`⏱️ Total API time: ${totalTime}ms`);
    console.log(`📚 Chunks returned: ${result.geminiChunks?.length || 0}`);
    console.log('═══════════════════════════════════════');

    return NextResponse.json({
      success: true,
      response: result.response,
      geminiChunks: result.geminiChunks || [],
      usage: result.usage,
      retrievalTime: result.retrievalTime,
      generationTime: result.generationTime,
      modelUsed: result.modelUsed,
    });

  } catch (error: any) {
    console.error('═══════════════════════════════════════');
    console.error('❌ VAULT CHAT API ERROR');
    console.error('═══════════════════════════════════════');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('═══════════════════════════════════════');

    return NextResponse.json(
      {
        success: false,
        message: `Server error: ${error.message}`
      },
      { status: 500 }
    );
  }
}