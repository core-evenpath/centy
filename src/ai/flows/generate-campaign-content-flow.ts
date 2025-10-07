'use server';

/**
 * @fileOverview A Genkit flow for generating marketing campaign content.
 */

import { ai } from '../genkit';
import { z } from 'genkit';

export const GenerateCampaignContentInputSchema = z.object({
  prompt: z.string().describe('The user\'s request for the campaign content.'),
});
export type GenerateCampaignContentInput = z.infer<typeof GenerateCampaignContentInputSchema>;

export const GenerateCampaignContentOutputSchema = z.object({
  content: z.string().describe('The generated marketing content.'),
});
export type GenerateCampaignContentOutput = z.infer<typeof GenerateCampaignContentOutputSchema>;

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
    return output!;
  }
);
