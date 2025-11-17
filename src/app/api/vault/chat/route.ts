import { NextRequest, NextResponse } from 'next/server';
import { chatWithVaultHybrid } from '@/actions/vault-actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('API Route called');
    
    const body = await request.json();
    const { partnerId, userId, message, selectedFileIds } = body;

    if (!partnerId || !userId || !message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await chatWithVaultHybrid(
      partnerId,
      userId,
      message,
      selectedFileIds
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}