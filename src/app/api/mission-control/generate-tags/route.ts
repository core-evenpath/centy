import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { googleAI } from "@genkit-ai/google-genai";
import { z } from "genkit";
import { ai } from "@/ai/genkit";
import { db } from "@/lib/firebase-admin";
import { RAGINDEX_COLLECTION_NAME } from "@/ai/fireRagSetup";
import { getPartnerId } from "@/utils/auth";

/**
 * MC-LOOP-2: Generate intelligent tags for documents
 * This flow extracts content from documents and generates contextual tags
 * using AI without breaking the existing RAG implementation
 */
export async function POST(request: NextRequest) {
  console.log("[MC-LOOP-2] Starting tag generation...");

  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization") || "";
    const userData = await getPartnerId(authHeader);

    if (!userData.success || !userData.partnerId) {
      console.error("[MC-LOOP-2] Authentication failed");
      return NextResponse.json(
        { error: "Could not authenticate user" },
        { status: 401 }
      );
    }

    console.log("[MC-LOOP-2] Authenticated partner:", userData.partnerId);

    const body = await request.json();
    const { fileUrl, fileName } = body;

    if (!fileUrl) {
      return NextResponse.json(
        { error: "File URL is required" },
        { status: 400 }
      );
    }

    console.log("[MC-LOOP-2] Processing file:", fileName, fileUrl);

    // Find the document in the database
    const docsSnapshot = await db
      .collection(`thesis-docs/${userData.partnerId}/docs`)
      .where("url", "==", fileUrl)
      .limit(1)
      .get();

    if (docsSnapshot.empty) {
      console.error("[MC-LOOP-2] Document not found in database");
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const docRef = docsSnapshot.docs[0].ref;
    const docData = docsSnapshot.docs[0].data();
    const fileId = docData.fileId;

    console.log("[MC-LOOP-2] Found document with fileId:", fileId);

    // Get content chunks from RAG index
    const docsFromRag = await db
      .collection(RAGINDEX_COLLECTION_NAME)
      .where("fileId", "==", fileId)
      .limit(10)
      .get();

    if (docsFromRag.empty) {
      console.error("[MC-LOOP-2] No content chunks found in RAG index");
      return NextResponse.json(
        {
          error:
            "Document content not indexed yet. Please wait for RAG processing to complete.",
          requiresRetry: true,
        },
        { status: 400 }
      );
    }

    console.log("[MC-LOOP-2] Found", docsFromRag.docs.length, "content chunks");

    // Extract text content from the chunks
    const contentChunks = docsFromRag.docs.map((doc) => doc.data().text);
    const combinedContent = contentChunks.join("\n\n");
    const contentSample = combinedContent.substring(0, 4000); // Use first 4000 chars

    console.log("[MC-LOOP-2] Content sample length:", contentSample.length);

    // Define schema for tag generation with proper structure for Gemini
    // FIXED: Added proper field descriptions and constraints to prevent empty properties error
    const TagGenerationSchema = z.object({
      tags: z
        .array(
          z.string()
            .min(1)
            .describe("A single searchable tag or keyword")
        )
        .min(5)
        .max(15)
        .describe(
          "Array of 5-15 concise, searchable tags (1-3 words each). Include document type, topics, industry, entities, and time period."
        ),
      primaryCategory: z
        .string()
        .min(1)
        .describe(
          "Main category: 'Market Analysis', 'Investment Strategy', 'Compliance', 'Client Resources', 'Financial Report', or 'General'"
        ),
      confidence: z
        .number()
        .min(0)
        .max(1)
        .default(0.8)
        .describe("Confidence score for the tag generation (0-1)"),
    });

    console.log("[MC-LOOP-2] Calling AI to generate tags...");

    // Generate tags using AI
    const { output } = await ai.generate({
      model: googleAI.model("gemini-2.0-flash-lite"),
      prompt: `Analyze this document and generate smart tags for search and organization.

Document: ${fileName || "Unknown"}

Content:
${contentSample}

Generate:
1. Tags (5-15): Specific, searchable terms for categorization. Include:
   - Document type (report, analysis, guide, etc.)
   - Key topics and themes
   - Industry/sector
   - Companies or entities mentioned
   - Time periods (Q1, Q2, 2024, 2025, etc.)
   - Specific concepts or methodologies

2. Primary Category: Choose the most fitting category from:
   - Market Analysis
   - Investment Strategy
   - Compliance
   - Client Resources
   - Financial Report
   - General

3. Confidence: Your confidence level in these tags (0.0 to 1.0)

Make tags professional, concise (1-3 words), and useful for search.
Prioritize terms that make this document discoverable.`,
      output: { schema: TagGenerationSchema },
    });

    console.log("[MC-LOOP-2] AI response received");

    // Parse the generated tags
    const generatedData =
      typeof output === "string" ? JSON.parse(output) : output;
    
    const tags = (generatedData.tags || [])
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0)
      .slice(0, 15);

    const primaryCategory = generatedData.primaryCategory || "General";
    const confidence = generatedData.confidence || 0.8;

    console.log("[MC-LOOP-2] Generated tags:", tags);
    console.log("[MC-LOOP-2] Primary category:", primaryCategory);
    console.log("[MC-LOOP-2] Confidence:", confidence);

    // Store sample indexed content for search preview
    const indexedContentSample = contentChunks.slice(0, 3);

    // Update the document with generated tags
    await docRef.update({
      tags: tags,
      primaryCategory: primaryCategory,
      tagsGeneratedAt: new Date().toISOString(),
      status: "ready",
      indexedContent: indexedContentSample,
      tagConfidence: confidence,
    });

    console.log("[MC-LOOP-2] Successfully updated document with tags");

    return NextResponse.json({
      success: true,
      tags: tags,
      primaryCategory: primaryCategory,
      confidence: confidence,
      message: "Tags generated successfully",
    });
  } catch (error: any) {
    console.error("[MC-LOOP-2] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to generate tags",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}