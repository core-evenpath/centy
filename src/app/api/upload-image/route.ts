import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    if (!adminStorage) {
        return NextResponse.json({ error: 'Firebase Storage is not configured on the server.' }, { status: 500 });
    }

    try {
        const { image, partnerId } = await request.json();

        if (!image || !image.startsWith('data:image')) {
            return NextResponse.json({ error: 'Valid image data URI is required.' }, { status: 400 });
        }
        if (!partnerId) {
            return NextResponse.json({ error: 'Partner ID is required for upload.' }, { status: 400 });
        }

        const mimeType = image.match(/data:(image\/[^;]+);/)?.[1];
        if (!mimeType) {
            return NextResponse.json({ error: 'Could not determine image MIME type.' }, { status: 400 });
        }

        const base64Data = image.split(';base64,').pop();
        if (!base64Data) {
            return NextResponse.json({ error: 'Invalid base64 image data.' }, { status: 400 });
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const fileExtension = mimeType.split('/')[1];
        const fileName = `${partnerId}/uploads/${uuidv4()}.${fileExtension}`;

        const bucket = adminStorage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
        const file = bucket.file(fileName);

        await file.save(buffer, {
            metadata: {
                contentType: mimeType,
                cacheControl: 'public, max-age=31536000',
            },
            public: true,
        });

        // Get the public URL
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-09-2491', // A far-future date
        });

        console.log(`Image uploaded successfully. Public URL: ${url}`);

        return NextResponse.json({ url });

    } catch (error: any) {
        console.error("Error uploading image to Firebase Storage:", error);
        return NextResponse.json({ error: error.message || 'Failed to upload image.' }, { status: 500 });
    }
}
