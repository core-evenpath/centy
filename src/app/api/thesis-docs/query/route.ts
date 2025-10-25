import { headers } from "next/headers";
import * as admin from "firebase-admin";
import { googleAI } from "@genkit-ai/google-genai";

import { ai } from "@/ai/genkit";
import {
  RAGINDEX_COLLECTION_NAME,
  firestoreRetriever,
} from "@/ai/fireRagSetup";
import { adminAuth } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

// Ensure storage is initialized with the app
let storage: admin.storage.Storage;
try {
  storage = admin.storage();
} catch (e: any) {
  console.error("Failed to initialize Firebase Storage:", e.message);
}

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

export async function GET(request: NextRequest) {
  const headersList = await headers();
  const authHeader = headersList.get("authorization") || "";
  const userData = await getPartnerId(authHeader);
  const searchParams = request.nextUrl.searchParams;
  const userQuery = searchParams.get("query");
  const fileId = searchParams.get("fileId");
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
    let ts = performance.now();
    console.log(`starting rag query at ${ts}`);
    if (typeof userQuery !== "string" || userQuery.length < 5) {
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

    let filters: Record<string, string | null> = {
      partnerId: userData.partnerId,
    };
    if (typeof fileId === "string") {
      filters["fileId"] = fileId;
    }

    const docs = await ai.retrieve({
      retriever,
      query: userQuery,
      options: {
        k: 3,
        where: filters,
      },
    });
    console.log(
      `ending rag query: time taken ${performance.now() - ts} : docs = ${docs}`
    );
    ts = performance.now();

    const { text } = await ai.generate({
      model: googleAI.model("gemini-2.5-flash"),
      prompt: `
You are a helpful AI assistant that can answer questions.

Use only the context provided to answer the question.
If you don't know, do not make up an answer.

Question: ${userQuery}`,
      docs,
    });
    console.log(`ending llm query: time taken ${performance.now() - ts} `);
    ts = performance.now();

    return NextResponse.json({
      success: true,
      result: text,
    });
  } catch (error: any) {
    console.error("Error in /api/thesis-docs/save:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate and store image" },
      { status: 500 }
    );
  }
}
