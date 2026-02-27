import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

// WhatsApp API supported media types and limits
const MEDIA_CONFIG = {
    image: {
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSize: 5 * 1024 * 1024, // 5MB
        extensions: ['jpg', 'jpeg', 'png', 'webp']
    },
    video: {
        mimeTypes: ['video/mp4', 'video/3gpp'],
        maxSize: 16 * 1024 * 1024, // 16MB
        extensions: ['mp4', '3gp', '3gpp']
    },
    audio: {
        mimeTypes: ['audio/aac', 'audio/amr', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/opus', 'audio/webm'],
        maxSize: 16 * 1024 * 1024, // 16MB
        extensions: ['aac', 'amr', 'mp3', 'm4a', 'ogg', 'opus', 'webm']
    },
    document: {
        mimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv'
        ],
        maxSize: 100 * 1024 * 1024, // 100MB
        extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv']
    },
    sticker: {
        mimeTypes: ['image/webp'],
        maxSize: 100 * 1024, // 100KB
        extensions: ['webp']
    }
};

type MediaType = keyof typeof MEDIA_CONFIG;

function getMediaType(mimeType: string): MediaType | null {
    for (const [type, config] of Object.entries(MEDIA_CONFIG)) {
        if (config.mimeTypes.includes(mimeType)) {
            return type as MediaType;
        }
    }
    return null;
}

function getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'video/3gpp': '3gp',
        'audio/aac': 'aac',
        'audio/amr': 'amr',
        'audio/mpeg': 'mp3',
        'audio/mp4': 'm4a',
        'audio/ogg': 'ogg',
        'audio/opus': 'opus',
        'audio/webm': 'webm',
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
        'text/plain': 'txt',
        'text/csv': 'csv'
    };
    return mimeToExt[mimeType] || 'bin';
}

export async function POST(request: NextRequest) {
    if (!adminStorage) {
        return NextResponse.json({ error: 'Firebase Storage is not configured on the server.' }, { status: 500 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const partnerId = formData.get('partnerId') as string | null;
        const customFilename = formData.get('filename') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'File is required.' }, { status: 400 });
        }
        if (!partnerId) {
            return NextResponse.json({ error: 'Partner ID is required for upload.' }, { status: 400 });
        }

        const mimeType = file.type;
        const mediaType = getMediaType(mimeType);

        if (!mediaType) {
            return NextResponse.json({
                error: `Unsupported file type: ${mimeType}. Supported: images (JPEG, PNG), videos (MP4), audio (MP3, AAC, OGG), and documents (PDF, DOC, XLS, etc.)`
            }, { status: 400 });
        }

        const config = MEDIA_CONFIG[mediaType];

        // Check file size
        if (file.size > config.maxSize) {
            const maxSizeMB = config.maxSize / (1024 * 1024);
            return NextResponse.json({
                error: `File too large. Maximum size for ${mediaType} is ${maxSizeMB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`
            }, { status: 400 });
        }

        // Read file buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate filename
        const extension = getExtensionFromMimeType(mimeType);
        const originalName = customFilename || file.name || `${mediaType}_${Date.now()}`;
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `${partnerId}/whatsapp-media/${mediaType}/${uuidv4()}_${sanitizedName}`;

        const bucket = adminStorage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
        const storageFile = bucket.file(fileName);

        await storageFile.save(buffer, {
            metadata: {
                contentType: mimeType,
                cacheControl: 'public, max-age=31536000',
                metadata: {
                    originalName: file.name,
                    partnerId,
                    mediaType,
                    uploadedAt: new Date().toISOString()
                }
            },
            public: true,
        });

        // Get the public URL
        const [url] = await storageFile.getSignedUrl({
            action: 'read',
            expires: '03-09-2491', // Far-future date
        });

        console.log(`Media uploaded successfully. Type: ${mediaType}, URL: ${url}`);

        return NextResponse.json({
            url,
            mediaType,
            mimeType,
            filename: file.name,
            size: file.size
        });

    } catch (error: any) {
        console.error("Error uploading media to Firebase Storage:", error);
        return NextResponse.json({ error: error.message || 'Failed to upload media.' }, { status: 500 });
    }
}
