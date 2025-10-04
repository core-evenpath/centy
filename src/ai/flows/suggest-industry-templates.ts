// src/ai/flows/suggest-industry-templates.ts
'use server';

/**
 * @fileOverview A Genkit flow to suggest high-value workflow templates for a specific industry.
 */

import { ai } from '../genkit';
import { googleAI } from '@genkit-ai/google-genai';
import {
  SuggestIndustryTemplatesInputSchema,
  SuggestIndustryTemplatesOutputSchema,
  type SuggestIndustryTemplatesInput,
  type SuggestIndustryTemplatesOutput
} from '../../lib/types';

export async function suggestIndustryTemplates(input: SuggestIndustryTemplatesInput): Promise<SuggestIndustryTemplatesOutput> {
  return suggestIndustryTemplatesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestIndustryTemplatesPrompt',
  model: googleAI.model('gemini-1.5-flash-latest'),
  input: { schema: SuggestIndustryTemplatesInputSchema },
  output: { schema: SuggestIndustryTemplatesOutputSchema },
  prompt: `You are an expert business process consultant specializing in operational automation.
Your task is to generate a list of 6 high-value, common workflow templates for a given industry.

For the industry "{{industry}}", provide a list of 6 workflow templates.

For each template, provide the following:
- **name**: A short, clear name for the workflow.
- **description**: A single sentence explaining the workflow's purpose.
- **category**: A single, one-word category (e.g., "Emergency", "Financial", "Marketing", "Operations").
- **popularity**: (Optional) Rank the top 3 as "Most Popular", "Popular", or "New".
- **steps**: An estimated number of steps for the workflow.
- **icon**: A single, relevant emoji character.

**Example for "Property Management":**
[
  {
    "name": "Emergency Maintenance Response",
    "description": "Urgent maintenance requests get immediate attention and proper escalation.",
    "category": "Emergency",
    "popularity": "Most Popular",
    "steps": 4,
    "icon": "🚨"
  },
  {
    "name": "Rent Collection Automation",
    "description": "Automated rent reminders and follow-up for late payments.",
    "category": "Financial",
    "popularity": "Popular",
    "steps": 6,
    "icon": "💰"
  }
]

Please generate exactly 6 templates for the "{{industry}}" industry.
`,
});

const suggestIndustryTemplatesFlow = ai.defineFlow(
  {
    name: 'suggestIndustryTemplatesFlow',
    inputSchema: SuggestIndustryTemplatesInputSchema,
    outputSchema: SuggestIndustryTemplatesOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
