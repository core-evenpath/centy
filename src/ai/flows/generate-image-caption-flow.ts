
'use server';
/**
 * @fileOverview A Genkit flow to generate a caption for an image.
 */

import { ai } from '../genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const GenerateImageCaptionInputSchema = z.object({
  imageUrl: z.string().url().describe('The URL of the image to generate a caption for.'),
});
export type GenerateImageCaptionInput = z.infer<typeof GenerateImageCaptionInputSchema>;

const GenerateImageCaptionOutputSchema = z.object({
  caption: z.string().describe('A short, engaging caption for the image.'),
});
export type GenerateImageCaptionOutput = z.infer<typeof GenerateImageCaptionOutputSchema>;


export async function generateImageCaption(input: GenerateImageCaptionInput): Promise<GenerateImageCaptionOutput> {
  return generateImageCaptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateImageCaptionPrompt',
  input: { schema: GenerateImageCaptionInputSchema },
  output: { schema: GenerateImageCaptionOutputSchema },
  prompt: `You are a marketing copywriter. Based on the provided image, write a short, compelling, and engaging caption suitable for a marketing message.

Image: {{media url=imageUrl}}

Generate a caption that is concise and relevant to the image.`,
});


const generateImageCaptionFlow = ai.defineFlow(
  {
    name: 'generateImageCaptionFlow',
    inputSchema: GenerateImageCaptionInputSchema,
    outputSchema: GenerateImageCaptionOutputSchema,
  },
  async (input) => {
    try {
      const llm = googleAI.model('gemini-pro-vision');
      const { output } = await llm.generate({
        prompt: prompt.compile({ input }),
        output: { schema: GenerateImageCaptionOutputSchema },
      });

      if (!output) {
        throw new Error('AI failed to generate a caption.');
      }
      return output;
    } catch (error) {
      console.error('Error in generateImageCaptionFlow:', error);
      // Return a successful response with an empty caption to avoid breaking the frontend flow.
      return { caption: '' };
    }
  }
);
