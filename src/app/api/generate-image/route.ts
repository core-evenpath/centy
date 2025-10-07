
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
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

    // Create a data URI from the base64 string
    const imageUrl = `data:image/png;base64,${data.data[0].b64_json}`;

    return NextResponse.json({
      imageUrl: imageUrl
    });

  } catch (error: any) {
    console.error("Error in /api/generate-image:", error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
