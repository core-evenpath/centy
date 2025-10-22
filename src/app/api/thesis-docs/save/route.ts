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
      Extract the data from the text
      ### TEXT FROM PDF
      ${pdfText}
      `,
      },
    ],
    output: { schema: CompanyInfoSchema },
  });
  return aiResponse.toJSON().message?.content;
}

// Ensure storage is initialized with the app
let storage: admin.storage.Storage;
try {
  storage = admin.storage();
} catch (e: any) {
  console.error("Failed to initialize Firebase Storage:", e.message);
}

export async function POST(request: NextRequest) {
  const headersList = await headers();
  const authHeader = headersList.get("authorization") || "";
  const userData = await getPartnerId(authHeader);
  if (!userData.success) {
    return NextResponse.json(
      { error: "Could not authenticate user" },
      { status: 401 }
    );
  }
  if (typeof userData.partnerId === undefined) {
    return NextResponse.json(
      { error: "Could not find partner ID" },
      { status: 401 }
    );
  }
  if (!storage) {
    console.error(
      "Firebase Storage is not configured on the server. Check firebase-admin.ts initialization."
    );
    return NextResponse.json(
      { error: "Firebase Storage is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const params = await request.json();
    const { pdfFile, metaData } = params;

    if (!pdfFile || !pdfFile.startsWith("data:application")) {
      return NextResponse.json(
        { error: "Valid pdf data URI is required." },
        { status: 400 }
      );
    }

    const mimeTypeMatch = pdfFile.match(/data:(application\/pdf);/);
    if (!mimeTypeMatch || !mimeTypeMatch[1]) {
      return NextResponse.json(
        { error: "Could not determine image MIME type." },
        { status: 400 }
      );
    }
    const mimeType = mimeTypeMatch[1];

    const base64Data = pdfFile.split(";base64,").pop();
    if (!base64Data) {
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

    // also write to temp file and extract data
    const tempFilePath = `/tmp/${uuidv4()}.pdf`;
    await fs.writeFile(tempFilePath, buffer);
    // const pdfText = await extractTextFromPdf(tempFilePath);
    const pdfText = await extractPageTextFromPdf(tempFilePath);

    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
        cacheControl: "public, max-age=31536000", // Cache for 1 year
      },
    });

    await file.makePublic();
    // Make the file publicly accessible
    const publicUrl = file.publicUrl();

    const thesisInfo = await getThesisInfo(pdfText.text);
    // const thesisInfo = { assume: "some thesis" };

    const fileId = uuidv4();
    await indexPdfFile(RAGINDEX_COLLECTION_NAME, fileId, tempFilePath);

    // TODO - save document first, then RAG, then set document.status = PROCESSED

    await db.collection(`thesis-docs/${userData.partnerId}/docs`).add({
      fileId,
      url: publicUrl,
      thesisInfo,
      metaData: metaData ?? {},
    });

    return NextResponse.json({
      url: publicUrl,
      thesisInfo,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate and store image" },
      { status: 500 }
    );
  }
}
