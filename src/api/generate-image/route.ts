
import { NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { generateStockPickImage } from '@/ai/flows/generate-stock-pick-image-flow';

export async function POST(request: Request) {
  if (!adminStorage) {
      console.error("Firebase Storage is not configured on the server. Check firebase-admin.ts initialization.");
      return NextResponse.json({ error: 'Firebase Storage is not configured on the server.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    
    // Use the stock pick image generation flow
    if (body.ticker && body.companyName) {
      console.log("Generating stock pick image for:", body.ticker);
      
      const result = await generateStockPickImage(body);
      
      const base64Data = result.imageUrl.split(';base64,').pop();
      if (!base64Data) {
        throw new Error('Invalid base64 data from AI image generator.');
      }
      
      const buffer = Buffer.from(base64Data, 'base64');
      const mimeType = 'image/png';
      const fileExtension = 'png';
      const fileName = `ai-generated-picks/${uuidv4()}.${fileExtension}`;
      
      const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
      if (!bucketName) {
        throw new Error("Firebase Storage bucket name is not configured.");
      }
      
      const bucket = adminStorage.bucket(bucketName);
      const file = bucket.file(fileName);

      await file.save(buffer, {
        metadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=31536000',
        },
        public: true,
      });

      const publicUrl = file.publicUrl();
      console.log("Stock pick image uploaded successfully:", publicUrl);
      
      return NextResponse.json({ imageUrl: publicUrl });
    }
    
    // Fallback to a generic error if the request is not for a stock pick
    return NextResponse.json({ error: 'Invalid request. Ticker and company name are required.' }, { status: 400 });

  } catch (error: any) {
    console.error("Error in /api/generate-image:", error);
    // Return a more descriptive error message
    return NextResponse.json(
      { error: error.message || 'Failed to generate and store image' },
      { status: 500 }
    );
  }
}
