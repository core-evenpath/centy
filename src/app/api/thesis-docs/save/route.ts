import { z } from "zod";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { headers } from "next/headers";
import * as admin from "firebase-admin";
import { NextRequest, NextResponse } from "next/server";

import { adminAuth, db } from "@/lib/firebase-admin";
import { googleAI } from "@genkit-ai/google-genai";
import { ai } from "@/ai/genkit";
import {
  RAGINDEX_COLLECTION_NAME,
  extractPageTextFromPdf,
  indexPdfFile,
} from "@/ai/fireRagSetup";

// Helper function to get partnerId for authenticated user
async function getPartnerId(authHeader: string) {
  try {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        success: false,
        error: "Missing or invalid authorization header",
      };
    }
    const idToken = authHeader.split("Bearer ")[1];
    const customClaims = await adminAuth.verifyIdToken(idToken);
    return { success: true, partnerId: customClaims.partnerId };
  } catch (error) {
    return { success: false, error: "Invalid token" };
  }
}

// Ensure storage is initialized with the app
let storage: admin.storage.Storage;
try {
  storage = admin.storage();
} catch (e: any) {
  console.error("Failed to initialize Firebase Storage:", e.message);
}

// function to extract data from pdf content
async function getThesisInfo(pdfText: string) {
  const CompanyInfoSchema = z.object({
    companyTicker: z.string().describe("The stock ticker of the company."),
    companyName: z.string().describe("The full name of the company."),
    sector: z.string().describe("The sector the company operates in."),
    currentPrice: z.string().describe("The current stock price as a string."),
    aiThesis: z
      .array(z.string())
      .describe("An array of thesis points about the company. Max of 5 items"),
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
  });

  const ThesisSchema = z
    .record(
      z.string().describe("The stock ticker for the company"),
      CompanyInfoSchema
    )
    .describe(
      "A record of company ticker symbols mapped to their information."
    );

  const aiResponse = await ai.generate({
    model: googleAI.model("gemini-2.0-flash-lite"),
    prompt: [
      {
        text: `
      I have investment thesis text from a pdf file.
      Extract the company information and create a structured JSON response.
      
      Text:
      ${pdfText}
      `,
      },
    ],
    output: {
      schema: ThesisSchema,
    },
  });

  return aiResponse.output;
}

export async function POST(request: NextRequest) {
  console.log("[SAVE] Starting document upload process");

  const headersList = await headers();
  const authHeader = headersList.get("authorization") || "";
  const userData = await getPartnerId(authHeader);

  if (!userData.success) {
    console.error("[SAVE] Authentication failed:", userData.error);
    return NextResponse.json(
      { error: "Could not authenticate user" },
      { status: 401 }
    );
  }

  if (typeof userData.partnerId === undefined) {
    console.error("[SAVE] Partner ID is undefined");
    return NextResponse.json(
      { error: "Could not find partner ID" },
      { status: 401 }
    );
  }

  console.log("[SAVE] Authenticated partner:", userData.partnerId);

  if (!storage) {
    console.error("[SAVE] Firebase Storage is not configured");
    return NextResponse.json(
      { error: "Firebase Storage is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const { pdfFile, metaData } = await request.json();
    console.log("[SAVE] Received file:", metaData?.name);

    if (!pdfFile || !pdfFile.startsWith("data:")) {
      console.error("[SAVE] Invalid PDF data format");
      return NextResponse.json(
        { error: "Valid pdf data URI is required." },
        { status: 400 }
      );
    }

    const mimeTypeMatch = pdfFile.match(/data:([^;]+);/);
    if (!mimeTypeMatch || !mimeTypeMatch[1]) {
      console.error("[SAVE] Could not determine MIME type");
      return NextResponse.json(
        { error: "Could not determine pdf MIME type." },
        { status: 400 }
      );
    }
    const mimeType = mimeTypeMatch[1];

    const base64Data = pdfFile.split(";base64,").pop();
    if (!base64Data) {
      console.error("[SAVE] Invalid base64 data");
      return NextResponse.json(
        { error: "Invalid base64 pdf data." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(base64Data, "base64");
    const fileExtension = mimeType.split("/")[1] || "pdf";

    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
      throw new Error("Firebase Storage bucket name is not configured.");
    }
    const bucket = storage.bucket(bucketName);

    const fileName = `partner-uploads/thesis-pdf/${uuidv4()}.${fileExtension}`;
    const file = bucket.file(fileName);

    console.log("[SAVE] Writing file to storage:", fileName);

    // Write to temp file for processing
    const tempFilePath = `/tmp/${uuidv4()}.pdf`;
    await fs.writeFile(tempFilePath, buffer);
    console.log("[SAVE] Created temp file:", tempFilePath);

    // Extract text from PDF
    console.log("[SAVE] Extracting text from PDF...");
    const pdfText = await extractPageTextFromPdf(tempFilePath);
    console.log("[SAVE] Extracted text length:", pdfText.text.length);

    // Upload to storage
    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
        cacheControl: "public, max-age=31536000",
      },
    });
    await file.makePublic();
    const publicUrl = file.publicUrl();
    console.log("[SAVE] File uploaded to:", publicUrl);

    // Extract thesis info (optional)
    console.log("[SAVE] Extracting thesis info...");
    const thesisInfo = await getThesisInfo(pdfText.text);
    console.log("[SAVE] Thesis info extracted");

    // Generate unique file ID
    const fileId = uuidv4();
    console.log("[SAVE] Generated fileId:", fileId);

    // Index PDF in RAG system
    console.log("[SAVE] Starting RAG indexing...");
    console.log("[SAVE] Collection:", RAGINDEX_COLLECTION_NAME);
    console.log("[SAVE] FileId:", fileId);
    console.log("[SAVE] FilePath:", tempFilePath);

    try {
      await indexPdfFile(
        RAGINDEX_COLLECTION_NAME,
        userData.partnerId,
        fileId,
        tempFilePath
      );
      console.log("[SAVE] RAG indexing completed successfully");

      // Verify indexing
      const ragChunks = await db
        .collection(RAGINDEX_COLLECTION_NAME)
        .where("fileId", "==", fileId)
        .limit(1)
        .get();

      console.log("[SAVE] Verification - chunks found:", !ragChunks.empty);
    } catch (ragError: any) {
      console.error("[SAVE] RAG indexing failed:", ragError);
      console.error("[SAVE] RAG error stack:", ragError.stack);
      // Continue anyway - don't fail the upload
    }

    // Clean up temp file
    try {
      await fs.unlink(tempFilePath);
      console.log("[SAVE] Cleaned up temp file");
    } catch (cleanupError) {
      console.error("[SAVE] Failed to clean up temp file:", cleanupError);
    }

    // Save document metadata
    console.log("[SAVE] Saving document metadata to Firestore...");
    await db.collection(`thesis-docs/${userData.partnerId}/docs`).add({
      fileId,
      url: publicUrl,
      thesisInfo,
      metaData: metaData ?? {},
      status: "processing",
      createdAt: new Date().toISOString(),
    });
    console.log("[SAVE] Document metadata saved");

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileId: fileId,
      thesisInfo,
    });
  } catch (error: any) {
    console.error("[SAVE] Error in save route:", error);
    console.error("[SAVE] Error stack:", error.stack);
    return NextResponse.json(
      { error: error.message || "Failed to generate and store image" },
      { status: 500 }
    );
  }
}
