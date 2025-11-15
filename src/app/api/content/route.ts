// src/app/api/vault/content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getVaultFileContent } from '@/actions/vault-actions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    const fileId = searchParams.get('fileId');

    if (!partnerId || !fileId) {
      return NextResponse.json(
        { success: false, message: 'Partner ID and File ID are required' },
        { status: 400 }
      );
    }

    const result = await getVaultFileContent(partnerId, fileId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in content API:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}