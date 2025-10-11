
'use server';
/**
 * @fileOverview A Genkit flow to generate a professional image card for a stock recommendation.
 */

import { ai } from '../genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const GenerateStockPickImageInputSchema = z.object({
  ticker: z.string(),
  companyName: z.string(),
  action: z.enum(['buy', 'sell', 'hold']),
  priceTarget: z.string(),
  currentPrice: z.string().optional(),
  thesis: z.string(),
  riskLevel: z.string(),
});
export type GenerateStockPickImageInput = z.infer<typeof GenerateStockPickImageInputSchema>;

const GenerateStockPickImageOutputSchema = z.object({
  imageUrl: z.string().url().describe('The data URI of the generated image.'),
});
export type GenerateStockPickImageOutput = z.infer<typeof GenerateStockPickImageOutputSchema>;

export async function generateStockPickImage(input: GenerateStockPickImageInput): Promise<GenerateStockPickImageOutput> {
  return generateStockPickImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStockPickImagePrompt',
  input: { schema: GenerateStockPickImageInputSchema },
  prompt: `
    Create a professional, modern, and clean image that looks like a stock recommendation card for a financial services company.

    The image MUST contain the following text, rendered clearly and accurately:
    - Ticker: \`{{ticker}}\`
    - Company Name: \`{{companyName}}\`
    - Action: \`{{action}}\` (This should be prominent, perhaps in a colored badge: green for buy, red for sell, yellow for hold)
    - Price Target: \`{{priceTarget}}\`
    - Current Price: \`{{currentPrice}}\`
    - Risk Level: \`{{riskLevel}}\`
    - Thesis Summary: A short summary of the thesis: \`{{thesis}}\` (Show only the first 2-3 key points or a summary)

    **Design requirements:**
    - Use a clean, sans-serif font like Inter or Helvetica.
    - The background should be abstract and professional, with a dark theme (dark blues, grays, blacks).
    - Use graphical elements like lines, boxes, and subtle gradients to structure the information cleanly.
    - The layout should be balanced and easy to read, similar to a high-quality financial report graphic.
    - Ensure high-fidelity text rendering. The text MUST be legible.
    - DO NOT include any logos or branding other than the text provided.
    - The final output should be a single, complete image of the card.
  `,
});

const generateStockPickImageFlow = ai.defineFlow(
  {
    name: 'generateStockPickImageFlow',
    inputSchema: GenerateStockPickImageInputSchema,
    outputSchema: GenerateStockPickImageOutputSchema,
  },
  async (input) => {
    try {
      const { media } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-image-preview'),
        prompt: prompt.compile({ input }),
        config: {
          responseModalities: ['IMAGE'],
        },
      });

      if (!media?.url) {
        throw new Error('Image generation failed to return a valid image URL.');
      }

      return { imageUrl: media.url };

    } catch (error: any) {
      console.error('Error in generateStockPickImageFlow:', error);
      // Check for specific quota-related errors
      if (error.message && (error.message.includes('429') || error.message.toLowerCase().includes('quota'))) {
        throw new Error(`Quota exceeded for image generation model. Please check your project's billing status or API limits. Details: ${error.message}`);
      }
      throw new Error(`Failed to generate stock pick image: ${error.message}`);
    }
  }
);
