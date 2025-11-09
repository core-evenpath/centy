import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToVault } from '@/actions/vault-actions';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const partnerId = formData.get('partnerId') as string;
    const userId = formData.get('userId') as string;
    const displayName = formData.get('displayName') as string;

    if (!file || !partnerId || !userId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadFileToVault(partnerId, userId, {
      name: file.name,
      buffer: buffer,
      mimeType: file.type,
      displayName: displayName || file.name,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in upload API:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}