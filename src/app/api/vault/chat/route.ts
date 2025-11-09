import { NextRequest, NextResponse } from 'next/server';
import { chatWithVault } from '@/actions/vault-actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partnerId, userId, message, selectedFileIds } = body;

    if (!partnerId || !userId || !message) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await chatWithVault(partnerId, userId, message, selectedFileIds);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}