
'use server';

/**
 * @fileOverview A Genkit flow for generating marketing campaign content.
 */

import { ai } from '../genkit';
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

const campaignPrompt = ai.definePrompt({
  name: 'generateCampaignContentPrompt',
  input: { schema: GenerateCampaignContentInputSchema },
  output: { schema: GenerateCampaignContentOutputSchema },
  prompt: `You are an expert marketing copywriter. A user wants to create content for a new campaign.
Based on their request, write a concise, compelling, and effective message.

User Request: "{{prompt}}"

Generated Content:
`,
});

const generateCampaignContentFlow = ai.defineFlow(
  {
    name: 'generateCampaignContentFlow',
    inputSchema: GenerateCampaignContentInputSchema,
    outputSchema: GenerateCampaignContentOutputSchema,
  },
  async (input) => {
    const { output } = await campaignPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate content.');
    }
    return output;
  }
);
