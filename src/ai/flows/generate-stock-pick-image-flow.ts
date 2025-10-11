
'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const StockPickImageInputSchema = z.object({
  ticker: z.string().describe('The stock ticker symbol, e.g., NVDA'),
  companyName: z.string().describe('The full company name, e.g., NVIDIA Corporation'),
  sector: z.string().describe('The industry sector, e.g., Semiconductors / AI Hardware'),
  action: z.enum(['buy', 'sell', 'hold']).describe('The recommended action (buy, sell, or hold)'),
  priceTarget: z.string().describe('The price target for the stock, e.g., $200'),
  timeframe: z.string().describe('The expected timeframe for the recommendation, e.g., 1-6 months'),
  riskLevel: z.string().describe('The risk level of the investment, e.g., Medium'),
  thesis: z.array(z.string()).describe('A short array of key investment thesis bullet points (max 2).'),
});

export type StockPickImageInput = z.infer<typeof StockPickImageInputSchema>;

const StockPickImageOutputSchema = z.object({
  imageUrl: z.string().url().describe('The data URI of the generated image.'),
});

export type StockPickImageOutput = z.infer<typeof StockPickImageOutputSchema>;

export async function generateStockPickImage(input: StockPickImageInput): Promise<StockPickImageOutput> {
  return generateStockPickImageFlow(input);
}

const generateStockPickImageFlow = ai.defineFlow(
  {
    name: 'generateStockPickImageFlow',
    inputSchema: StockPickImageInputSchema,
    outputSchema: StockPickImageOutputSchema,
  },
  async (input) => {

    const prompt = `Generate a clean, modern UI card for a stock recommendation. The card should have a light blue border and a white background.
    - At the top left, show the stock ticker '${input.ticker}' inside a solid blue rectangle with rounded corners.
    - To the right of the ticker, display the company name '${input.companyName}' in a large, bold font, and underneath it, the sector '${input.sector}' in a smaller, lighter font.
    - Below this, create two columns of key-value pairs.
      - Left column: "Action: ${input.action}" and "Timeframe: ${input.timeframe}". The action value should be in a colored badge: green for 'buy', red for 'sell', and yellow for 'hold'.
      - Right column: "Target: ${input.priceTarget}" and "Risk: ${input.riskLevel}".
    - Below the columns, add a horizontal separator line.
    - Below the line, list the following investment thesis points as bullet points:
      ${input.thesis.map(t => `- ${t}`).join('\n')}
    - The design should be clean, professional, and minimalist, with good typography and spacing, suitable for a financial services company. Do not include any extra text, logos (except for the ticker symbol styling), or embellishments not described here.`;

    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-image-preview'),
      prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // Must include both for this model
      },
    });

    if (!media?.url) {
      throw new Error('Image generation failed to return a valid image.');
    }

    return { imageUrl: media.url };
  }
);
