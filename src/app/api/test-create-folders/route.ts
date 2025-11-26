import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        console.log('🧪 Creating chat folder structure...');

        const bucket = adminStorage.bucket();
        const partnerId = request.nextUrl.searchParams.get('partnerId') || 'test-partner-123';

        // Create test files to establish folder structure
        const testFiles = [
            {
                path: `chat/${partnerId}/whatsapp/incoming/test-incoming.txt`,
                content: 'Test incoming message file',
                metadata: {
                    partnerId,
                    source: 'test_incoming',
                    uploadedAt: new Date().toISOString()
                }
            },
            {
                path: `chat/${partnerId}/whatsapp/outgoing/test-outgoing.txt`,
                content: 'Test outgoing message file',
                metadata: {
                    partnerId,
                    source: 'test_outgoing',
                    uploadedAt: new Date().toISOString()
                }
            }
        ];

        const urls: string[] = [];

        for (const testFile of testFiles) {
            const file = bucket.file(testFile.path);
            await file.save(testFile.content, {
                metadata: {
                    contentType: 'text/plain',
                    customMetadata: testFile.metadata
                }
            });
            await file.makePublic();
            const url = `https://storage.googleapis.com/${bucket.name}/${testFile.path}`;
            urls.push(url);
            console.log(`✅ Created: ${testFile.path}`);
        }

        return NextResponse.json({
            success: true,
            message: 'Chat folder structure created!',
            partnerId,
            createdFiles: testFiles.map(f => f.path),
            urls,
            instructions: 'Go to Firebase Storage and refresh to see the /chat folder'
        });

    } catch (error: any) {
        console.error('❌ Failed to create structure:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
