import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        console.log('🧪 Testing Firebase Storage...');

        const bucket = adminStorage.bucket();
        console.log(`✅ Bucket name: ${bucket.name}`);

        // Create a test file
        const testFile = bucket.file('test-upload.txt');
        await testFile.save('Hello from Centy! This is a test upload.', {
            metadata: { contentType: 'text/plain' }
        });
        console.log('✅ Test file created');

        // Make it public
        await testFile.makePublic();
        console.log('✅ Test file made public');

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/test-upload.txt`;
        console.log(`✅ Public URL: ${publicUrl}`);

        return NextResponse.json({
            success: true,
            message: 'Storage test successful!',
            bucketName: bucket.name,
            testFileUrl: publicUrl
        });

    } catch (error: any) {
        console.error('❌ Storage test failed:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
