
import { NextResponse } from 'next/server';
import { adminAuth, db } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

// Ensure storage is initialized with the app
let storage: admin.storage.Storage;
try {
    storage = admin.storage();
} catch (e: any)
{
    console.error("Failed to initialize Firebase Storage:", e.message);
}

export async function POST(request: Request) {
    if (!storage) {
        console.error("Firebase Storage is not configured on the server. Check firebase-admin.ts initialization.");
        return NextResponse.json({ error: 'Firebase Storage is not configured on the server.' }, { status: 500 });
    }
  
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured.' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'b64_json' // Use Base64 JSON format
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("OpenAI Image API Error:", data.error);
      return NextResponse.json(
        { error: data.error.message },
        { status: 500 }
      );
    }

    // Decode the Base64 string and upload to Firebase Storage
    const base64Data = data.data[0].b64_json;
    const buffer = Buffer.from(base64Data, 'base64');
    const mimeType = 'image/png'; // DALL-E 3 with b64_json returns PNG
    const fileExtension = 'png';
    const fileName = `ai-generated/${uuidv4()}.${fileExtension}`;
    
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      throw new Error("Firebase Storage bucket name is not configured.");
    }
    
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    await file.save(buffer, {
        metadata: {
            contentType: mimeType,
            cacheControl: 'public, max-age=31536000',
        },
    });

    // Make the file publicly readable to get a consistent URL
    await file.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    
    console.log(`AI Image uploaded to Storage. Public URL: ${publicUrl}`);

    // Return the public URL in the correct JSON format
    return NextResponse.json({
      imageUrl: publicUrl
    });

  } catch (error: any) {
    console.error("Error in /api/generate-image:", error);
    return NextResponse.json(
      { error: 'Failed to generate and store image' },
      { status: 500 }
    );
  }
}
