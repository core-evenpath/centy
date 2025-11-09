import { NextRequest, NextResponse } from 'next/server';
import { queryFileSearchStore } from '@/actions/vault-actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partnerId, userId, storeId, query } = body;

    if (!partnerId || !userId || !storeId || !query) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await queryFileSearchStore(partnerId, userId, storeId, query);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in query API:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}