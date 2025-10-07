
import { NextResponse } from 'next/server';
import { generateCampaignImage } from '@/ai/flows/generate-campaign-image-flow';
import type { GenerateCampaignImageInput } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const input: GenerateCampaignImageInput = { prompt };
    const result = await generateCampaignImage(input);

    return NextResponse.json({
      imageUrl: result.imageUrl
    });
    
  } catch (error: any) {
    console.error("Error in /api/generate-image:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    );
  }
}
