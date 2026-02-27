
// src/api/upload-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    if (!adminStorage) {
        console.error("Firebase Storage is not configured on the server. Check firebase-admin.ts initialization.");
        return NextResponse.json({ error: 'Firebase Storage is not configured on the server.' }, { status: 500 });
    }
  
    try {
        const { image, partnerId } = await request.json();

        if (!image || !image.startsWith('data:')) {
            return NextResponse.json({ error: 'Valid data URI is required.' }, { status: 400 });
        }
        if (!partnerId) {
            return NextResponse.json({ error: 'Partner ID is required for upload.' }, { status: 400 });
        }

        const mimeTypeMatch = image.match(/data:([^;]+);/);
        if (!mimeTypeMatch || !mimeTypeMatch[1]) {
            return NextResponse.json({ error: 'Could not determine file MIME type.' }, { status: 400 });
        }
        const mimeType = mimeTypeMatch[1];
        
        const base64Data = image.split(';base64,').pop();
        if (!base64Data) {
            return NextResponse.json({ error: 'Invalid base64 data.' }, { status: 400 });
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const fileType = mimeType.split('/')[0];
        const fileExtension = mimeType.split('/')[1] || 'bin';
        const fileName = `partner-uploads/${partnerId}/broadcasts/${fileType}/${uuidv4()}.${fileExtension}`;
        
        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        if (!bucketName) {
            throw new Error("Firebase Storage bucket name is not configured.");
        }
    
        const bucket = adminStorage.bucket(bucketName);
        const file = bucket.file(fileName);

        await file.save(buffer, {
            metadata: {
                contentType: mimeType,
                cacheControl: 'public, max-age=31536000', // Cache for 1 year
            },
        });
        
        // Make the file publicly accessible
        await file.makePublic();

        const publicUrl = file.publicUrl();
    
        console.log(`File uploaded to Storage. Public URL: ${publicUrl}`);

        return NextResponse.json({
            url: publicUrl
        });

    } catch (error: any) {
        console.error("Error in /api/upload-image:", error);
        return NextResponse.json(
            { error: error.message || 'Failed to upload file.' },
            { status: 500 }
        );
    }
}
