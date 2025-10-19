'use server';
/**
 * @fileOverview A Genkit flow to fetch real-time data and generate AI analysis for a stock ticker.
 */

import { ai } from '../genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Define the output schema for our main flow
const StockDataOutputSchema = z.object({
  success: z.boolean(),
  companyName: z.string().optional(),
  sector: z.string().optional(),
  currentPrice: z.string().optional(),
  aiThesis: z.array(z.string()).optional(),
  aiRisks: z.array(z.string()).optional(),
  errorMessage: z.string().optional(),
});
export type StockDataOutput = z.infer<typeof StockDataOutputSchema>;

// Define a tool to get basic stock info.
// In a real app, this would call a financial data API (e.g., Alpha Vantage, IEX Cloud).
// For this example, we will simulate it with a lookup.
const getStockInfoTool = ai.defineTool(
  {
    name: 'getStockInfo',
    description: 'Returns the company name, sector, and current price for a given stock ticker.',
    inputSchema: z.object({ ticker: z.string().describe('The stock ticker symbol.') }),
    outputSchema: z.object({
      companyName: z.string(),
      sector: z.string(),
      currentPrice: z.string(),
    }),
  },
  async ({ ticker }) => {
    console.log(`[getStockInfoTool] Fetching data for ${ticker}...`);
    // This is a placeholder for a real financial API call.
    const MOCK_FINANCIAL_API: Record<string, any> = {
        'NVDA': { companyName: 'NVIDIA Corporation', sector: 'Semiconductors / AI', currentPrice: '$192.57' },
        'AAPL': { companyName: 'Apple Inc.', sector: 'Technology', currentPrice: '$227.50' },
        'TSLA': { companyName: 'Tesla, Inc.', sector: 'Automotive', currentPrice: '$262.90' },
    };
    
    if (MOCK_FINANCIAL_API[ticker.toUpperCase()]) {
        return MOCK_FINANCIAL_API[ticker.toUpperCase()];
    } else {
        // In a real scenario, you'd throw an error if the ticker is not found.
        // For this example, we'll return a generic response.
        return {
            companyName: `${ticker.toUpperCase()} Company`,
            sector: 'Unknown',
            currentPrice: '$100.00'
        };
    }
  }
);

// Define the AI prompt that uses the tool and generates analysis.
const stockAnalysisPrompt = ai.definePrompt({
    name: 'stockAnalysisPrompt',
    model: googleAI.model('gemini-1.5-flash-latest'),
    tools: [getStockInfoTool],
    system: `You are a world-class financial analyst. Your task is to provide a concise, compelling investment thesis and identify key risks for a given stock.
    
    1. First, use the getStockInfoTool to get the company's name, sector, and price.
    2. Then, based on public knowledge about that company, generate:
       - A 3-point investment thesis. Each point should be a single, impactful sentence.
       - A 2-point summary of the key risks. Each point should be a single, impactful sentence.

    Your entire output must be in JSON format.`,
    output: {
      schema: z.object({
        thesis: z.array(z.string()).describe("An array of three strings, each being a key point of the investment thesis."),
        risks: z.array(z.string()).describe("An array of two strings, each being a key risk factor."),
      }),
    },
});

// The main flow that orchestrates the process
const getStockDataFlow = ai.defineFlow(
  {
    name: 'getStockDataFlow',
    inputSchema: z.string().describe("The stock ticker symbol."),
    outputSchema: StockDataOutputSchema,
  },
  async (ticker) => {
    if (!ticker) {
        return { success: false, errorMessage: 'Ticker symbol is required.' };
    }

    try {
        // 1. Get basic stock info using the tool
        const stockInfo = await getStockInfoTool({ ticker });

        // 2. Generate AI analysis
        const analysisResponse = await stockAnalysisPrompt({
            prompt: `Generate an investment thesis and risks for ${ticker}.`
        });
        const analysis = analysisResponse.output();

        if (!analysis) {
            throw new Error('AI analysis failed to generate output.');
        }

        // 3. Combine and return the data
        return {
            success: true,
            companyName: stockInfo.companyName,
            sector: stockInfo.sector,
            currentPrice: stockInfo.currentPrice,
            aiThesis: analysis.thesis,
            aiRisks: analysis.risks,
        };

    } catch (error: any) {
        console.error(`Error in getStockDataFlow for ticker "${ticker}":`, error);
        return {
            success: false,
            errorMessage: error.message || 'An unknown error occurred while fetching stock data.',
        };
    }
  }
);


// Export a wrapper function for client-side usage
export async function getStockData(ticker: string): Promise<StockDataOutput> {
  return getStockDataFlow(ticker);
}
