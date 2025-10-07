
import { NextResponse } from 'next/server';
import { generateCampaignContent } from '@/ai/flows/generate-campaign-content-flow';
import type { GenerateCampaignContentInput } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const input: GenerateCampaignContentInput = { prompt };
    const result = await generateCampaignContent(input);

    return NextResponse.json({
      content: result.content
    });

  } catch (error: any) {
    console.error("Error in /api/generate-text:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate text' },
      { status: 500 }
    );
  }
}
