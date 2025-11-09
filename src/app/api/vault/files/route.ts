import { NextRequest, NextResponse } from 'next/server';
import { listVaultFiles } from '@/actions/vault-actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');

    if (!partnerId) {
      return NextResponse.json(
        { success: false, message: 'Partner ID is required' },
        { status: 400 }
      );
    }

    const result = await listVaultFiles(partnerId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in files API:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}