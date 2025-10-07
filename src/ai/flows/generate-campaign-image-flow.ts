
'use server';

import { ai } from '../genkit';
import { googleAI } from '@genkit-ai/google-genai';
import {
  GenerateCampaignImageInputSchema,
  GenerateCampaignImageOutputSchema,
  type GenerateCampaignImageInput,
  type GenerateCampaignImageOutput,
} from '../../lib/types';

export async function generateCampaignImage(input: GenerateCampaignImageInput): Promise<GenerateCampaignImageOutput> {
  return generateCampaignImageFlow(input);
}

const generateCampaignImageFlow = ai.defineFlow(
  {
    name: 'generateCampaignImageFlow',
    inputSchema: GenerateCampaignImageInputSchema,
    outputSchema: GenerateCampaignImageOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-image-preview'),
      prompt: input.prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed to return a valid image.');
    }

    return { imageUrl: media.url };
  }
);
