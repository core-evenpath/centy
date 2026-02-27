import { z } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { NextRequest, NextResponse } from "next/server";

import { ai } from "@/ai/genkit";
import {
  RAGINDEX_COLLECTION_NAME,
  firestoreRetriever,
} from "@/ai/fireRagSetup";
import { adminStorage } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userQuery = searchParams.get("query");
  if (!adminStorage) {
    console.error(
      "Firebase Storage is not configured on the server. Check firebase-admin.ts initialization."
    );
    return NextResponse.json(
      { error: "Firebase Storage is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    if (typeof userQuery !== "string" || userQuery.length < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Please type a longer query",
        },
        { status: 403 }
      );
    }
    // get all documents for partnerId
    const retriever = firestoreRetriever(RAGINDEX_COLLECTION_NAME);
    const docs = await ai.retrieve({
      retriever,
      query: userQuery,
      options: { k: 3 },
    });

    const outputSchema = z.object({
      canBeExtracted: z
        .optional(z.boolean())
        .describe("If possible to extract required companyData field"),
      extractionError: z
        .optional(z.string())
        .describe("Error string if not possible to extract companyData"),
      companyData: z.optional(
        z.object({
          companyTicker: z
            .string()
            .describe("The stock ticker of the company."),
          companyName: z.string().describe("The full name of the company."),
          sector: z.string().describe("The sector the company operates in."),
          currentPrice: z
            .optional(z.string())
            .describe("The current stock price as a string."),
          aiThesis: z
            .array(z.string())
            .describe(
              "An array of thesis points about the company. Max of 5 items"
            ),
          aiRisks: z
            .array(z.string())
            .describe(
              "An array of potential risks associated with the company. Max of 5 items"
            ),
          aiCatalysts: z
            .array(z.string())
            .describe(
              "An array of catalysts that could drive the company's performance. Max of 5 items"
            ),
        })
      ),
    });

    const { text } = await ai.generate({
      model: googleAI.model("gemini-2.5-flash"),
      prompt: `
For the company or ticker mentioned in the question, generate output json as specified.

Use only the context provided to answer the question.
If you don't know, do not make up an answer.

Question: ${userQuery}`,
      docs,
      output: { schema: outputSchema },
    });

    return NextResponse.json({
      success: true,
      result: text,
    });
  } catch (error: any) {
    console.error("Error in /api/thesis-docs/gen_ideabox:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate and store image" },
      { status: 500 }
    );
  }
}
