import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/firebase-admin";
import { RAGINDEX_COLLECTION_NAME } from "@/ai/fireRagSetup";
import { getPartnerId } from "@/utils/auth";

/**
 * Diagnostic endpoint to check RAG system health
 */
export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: [],
    summary: {
      healthy: true,
      errors: [],
      warnings: [],
    },
  };

  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization") || "";
    const userData = await getPartnerId(authHeader);

    // Check 1: Authentication
    if (!userData.success || !userData.partnerId) {
      diagnostics.checks.push({
        name: "Authentication",
        status: "FAILED",
        error: "Could not authenticate user",
      });
      diagnostics.summary.healthy = false;
      diagnostics.summary.errors.push("Authentication failed");
      return NextResponse.json(diagnostics);
    }

    diagnostics.checks.push({
      name: "Authentication",
      status: "OK",
      partnerId: userData.partnerId,
    });

    // Check 2: Partner documents collection
    const docsSnapshot = await db
      .collection(`thesis-docs/${userData.partnerId}/docs`)
      .get();

    diagnostics.checks.push({
      name: "Partner Documents Collection",
      status: docsSnapshot.empty ? "WARNING" : "OK",
      documentCount: docsSnapshot.size,
      documents: docsSnapshot.docs.map((doc) => ({
        id: doc.id,
        fileId: doc.data().fileId,
        url: doc.data().url,
        hasMetadata: !!doc.data().metaData,
        hasTags: !!doc.data().tags,
        tagCount: doc.data().tags?.length || 0,
        status: doc.data().status,
      })),
    });

    if (docsSnapshot.empty) {
      diagnostics.summary.warnings.push("No documents found for this partner");
    }

    // Check 3: RAG Index collection
    const ragSnapshot = await db
      .collection(RAGINDEX_COLLECTION_NAME)
      .limit(100)
      .get();

    const fileIdCounts: { [key: string]: number } = {};
    ragSnapshot.docs.forEach((doc) => {
      const fileId = doc.data().fileId;
      if (fileId) {
        fileIdCounts[fileId] = (fileIdCounts[fileId] || 0) + 1;
      }
    });

    diagnostics.checks.push({
      name: "RAG Index Collection",
      status: ragSnapshot.empty ? "FAILED" : "OK",
      totalChunks: ragSnapshot.size,
      uniqueFiles: Object.keys(fileIdCounts).length,
      chunksPerFile: fileIdCounts,
      sampleChunks: ragSnapshot.docs.slice(0, 3).map((doc) => ({
        id: doc.id,
        fileId: doc.data().fileId,
        hasEmbedding: !!doc.data().embedding,
        hasText: !!doc.data().text,
        textLength: doc.data().text?.length || 0,
        textPreview: doc.data().text?.substring(0, 100),
      })),
    });

    if (ragSnapshot.empty) {
      diagnostics.summary.healthy = false;
      diagnostics.summary.errors.push(
        "RAG index is empty - no content indexed"
      );
    }

    // Check 4: Cross-reference documents with RAG chunks
    const missingInRag: string[] = [];
    const foundInRag: string[] = [];

    for (const doc of docsSnapshot.docs) {
      const fileId = doc.data().fileId;
      if (fileId) {
        const ragChunks = await db
          .collection(RAGINDEX_COLLECTION_NAME)
          .where("fileId", "==", fileId)
          .limit(1)
          .get();

        if (ragChunks.empty) {
          missingInRag.push(fileId);
        } else {
          foundInRag.push(fileId);
        }
      }
    }

    diagnostics.checks.push({
      name: "Document-RAG Consistency",
      status: missingInRag.length > 0 ? "WARNING" : "OK",
      documentsInBothSystems: foundInRag.length,
      documentsNotIndexed: missingInRag.length,
      missingFileIds: missingInRag,
    });

    if (missingInRag.length > 0) {
      diagnostics.summary.warnings.push(
        `${missingInRag.length} documents are not indexed in RAG system`
      );
    }

    // Check 5: Sample embedding dimension
    if (!ragSnapshot.empty) {
      const sampleDoc = ragSnapshot.docs[0];
      const embedding = sampleDoc.data().embedding;

      diagnostics.checks.push({
        name: "Embedding Configuration",
        status: embedding ? "OK" : "FAILED",
        hasEmbedding: !!embedding,
        embeddingType: typeof embedding,
        // Note: embedding is a FieldValue.vector, can't easily get dimensions
      });

      if (!embedding) {
        diagnostics.summary.healthy = false;
        diagnostics.summary.errors.push("RAG chunks missing embeddings");
      }
    }

    // Final summary
    diagnostics.summary.totalDocuments = docsSnapshot.size;
    diagnostics.summary.totalRAGChunks = ragSnapshot.size;
    diagnostics.summary.documentsIndexed = foundInRag.length;
    diagnostics.summary.documentsNotIndexed = missingInRag.length;

    return NextResponse.json(diagnostics);
  } catch (error: any) {
    console.error("[DIAGNOSTIC] Error:", error);
    diagnostics.summary.healthy = false;
    diagnostics.summary.errors.push(error.message);
    diagnostics.checks.push({
      name: "System Error",
      status: "FAILED",
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(diagnostics, { status: 500 });
  }
}
