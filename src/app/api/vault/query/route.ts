import { NextRequest, NextResponse } from 'next/server';
import { chatWithVault } from '@/actions/vault-actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partnerId, query, selectedFileIds } = body;

    if (!partnerId || !query) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: partnerId and query' },
        { status: 400 }
      );
    }

    const result = await chatWithVault(
      partnerId,
      'system',
      query,
      selectedFileIds || []
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        answer: result.response,
        sources: result.groundingChunks?.map((chunk: any) => ({
          text: chunk.retrievedContext?.text || chunk.text || '',
          score: chunk.score,
          documentName: chunk.retrievedContext?.title || chunk.documentName || 'Unknown',
        })).filter((s: any) => s.text) || [],
        groundingChunks: result.groundingChunks,
      });
    } else {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in query API:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}