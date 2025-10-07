'use server';

/**
 * @fileOverview A Genkit flow for generating images for marketing campaigns.
 */

import { ai } from '../genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

export const GenerateCampaignImageInputSchema = z.object({
  prompt: z.string().describe("The user's text prompt to generate an image from."),
});
export type GenerateCampaignImageInput = z.infer<typeof GenerateCampaignImageInputSchema>;

export const GenerateCampaignImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type GenerateCampaignImageOutput = z.infer<typeof GenerateCampaignImageOutputSchema>;

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
