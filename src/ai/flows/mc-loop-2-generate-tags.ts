'use server';
/**
 * MC-LOOP-2: Intelligent Tag Generation Flow
 * 
 * This flow analyzes document content and generates contextual tags
 * to enable powerful search and organization capabilities.
 * This is separate from the main RAG flow and doesn't affect existing functionality.
 */

import { ai } from '../genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const GenerateTagsInputSchema = z.object({
  documentContent: z.string().describe('The text content of the document to analyze'),
  documentName: z.string().describe('The name of the document file'),
  existingMetadata: z.object({
    uploadDate: z.string().optional(),
    fileType: z.string().optional(),
    fileSize: z.string().optional(),
  }).optional(),
});

export type GenerateTagsInput = z.infer<typeof GenerateTagsInputSchema>;

const GenerateTagsOutputSchema = z.object({
  tags: z.array(z.string()).describe('Array of generated tags for the document'),
  primaryCategory: z.string().describe('The primary category of the document'),
  contentSummary: z.string().describe('Brief summary of document content'),
  searchKeywords: z.array(z.string()).describe('Additional keywords for enhanced search'),
  confidence: z.number().min(0).max(1).describe('Confidence score for the generated tags'),
});

export type GenerateTagsOutput = z.infer<typeof GenerateTagsOutputSchema>;

/**
 * Generate intelligent tags for a document based on its content
 */
export async function generateDocumentTags(input: GenerateTagsInput): Promise<GenerateTagsOutput> {
  return generateTagsFlow(input);
}

const generateTagsPrompt = ai.definePrompt({
  name: 'generateDocumentTagsPrompt',
  input: { schema: GenerateTagsInputSchema },
  output: { schema: GenerateTagsOutputSchema },
  prompt: `
You are an expert document analyzer specializing in content categorization and tagging for knowledge management systems.

Your task is to analyze the provided document and generate:
1. **Tags** (5-15 tags): Specific, searchable terms that capture the document's key topics, themes, and content
2. **Primary Category**: The main classification (e.g., "Market Analysis", "Compliance", "Investment Strategy", "Client Resources", "Financial Report")
3. **Content Summary**: A concise 1-2 sentence description of what the document contains
4. **Search Keywords**: Additional terms users might search for to find this document
5. **Confidence Score**: Your confidence in the accuracy of the generated tags (0-1)

**Document Information:**
- File Name: {{documentName}}
{{#if existingMetadata.fileType}}- File Type: {{existingMetadata.fileType}}{{/if}}
{{#if existingMetadata.uploadDate}}- Upload Date: {{existingMetadata.uploadDate}}{{/if}}

**Document Content:**
{{documentContent}}

**Tag Generation Guidelines:**
- Use professional, business-appropriate terminology
- Include both broad categories and specific topics
- Consider: document type, industry/sector, time periods, key entities, methodologies, compliance aspects
- Make tags searchable and intuitive
- Avoid redundancy and overly generic terms
- Prioritize terms that distinguish this document from others

**Category Options:**
Consider these categories but choose the most appropriate:
- Market Research & Analysis
- Investment Strategy & Portfolio
- Compliance & Regulatory
- Client Resources & FAQs
- Financial Reports & Projections
- Product & Roadmap Planning
- Risk Assessment & Management
- General Documentation

Generate comprehensive, useful tags that will make this document easily discoverable.
`,
});

const generateTagsFlow = ai.defineFlow(
  {
    name: 'mcLoop2GenerateTagsFlow',
    inputSchema: GenerateTagsInputSchema,
    outputSchema: GenerateTagsOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await ai.generate({
        model: googleAI.model('gemini-2.0-flash-lite'),
        prompt: generateTagsPrompt.compile({ input }),
        output: { schema: GenerateTagsOutputSchema },
      });

      // Parse and validate the output
      const result = typeof output === 'string' ? JSON.parse(output) : output;
      
      // Ensure tags are unique and cleaned
      const uniqueTags = [...new Set(result.tags.map((tag: string) => tag.trim()))];
      
      // Ensure search keywords are unique and don't duplicate tags
      const uniqueKeywords = [...new Set(
        result.searchKeywords
          .map((kw: string) => kw.trim())
          .filter((kw: string) => !uniqueTags.includes(kw))
      )];

      return {
        tags: uniqueTags.slice(0, 15), // Limit to 15 tags
        primaryCategory: result.primaryCategory,
        contentSummary: result.contentSummary,
        searchKeywords: uniqueKeywords.slice(0, 10), // Limit to 10 keywords
        confidence: result.confidence || 0.8,
      };
    } catch (error) {
      console.error('Error in mc-loop-2 generate tags flow:', error);
      throw new Error(`Failed to generate tags: ${error}`);
    }
  }
);

export { generateTagsFlow };