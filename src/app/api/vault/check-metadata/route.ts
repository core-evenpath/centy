import { NextRequest, NextResponse } from 'next/server';
import { listGeminiStoreDocuments } from '@/actions/vault-actions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const partnerId = searchParams.get('partnerId');

        if (!partnerId) {
            return NextResponse.json(
                { success: false, message: 'partnerId is required' },
                { status: 400 }
            );
        }

        const result = await listGeminiStoreDocuments(partnerId);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error checking metadata:', error);
        return NextResponse.json(
            { success: false, message: `Server error: ${error.message}` },
            { status: 500 }
        );
    }
}