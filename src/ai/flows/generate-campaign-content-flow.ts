
'use server';

/**
 * @fileOverview A Genkit flow for generating marketing campaign content.
 */

import { ai } from '../genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import { 
  GenerateCampaignContentInputSchema,
  GenerateCampaignContentOutputSchema,
  type GenerateCampaignContentInput,
  type GenerateCampaignContentOutput,
} from '../../lib/types';

export async function generateCampaignContent(input: GenerateCampaignContentInput): Promise<GenerateCampaignContentOutput> {
  return generateCampaignContentFlow(input);
}

const generateCampaignContentFlow = ai.defineFlow(
  {
    name: 'generateCampaignContentFlow',
    inputSchema: GenerateCampaignContentInputSchema,
    outputSchema: GenerateCampaignContentOutputSchema,
  },
  async (input) => {
    const llm = googleAI.model('gemini-pro');

    const result = await ai.generate({
      model: llm,
      prompt: `You are an expert marketing copywriter. A user wants to create content for a new campaign.
Based on their request, write a concise, compelling, and effective message.

User Request: "${input.prompt}"`,
      output: {
        format: 'json',
        schema: GenerateCampaignContentOutputSchema,
      },
      config: {
        temperature: 0.7,
      },
    });

    const output = result.output();
    if (!output) {
      throw new Error('AI failed to generate content.');
    }
    return output;
  }
);
