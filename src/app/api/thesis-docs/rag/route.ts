import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import * as admin from "firebase-admin";
import { NextRequest, NextResponse } from "next/server";

import { RAGINDEX_COLLECTION_NAME, indexPdfFile } from "@/ai/fireRagSetup";
import { db } from "@/lib/firebase-admin";

// Ensure storage is initialized with the app
let storage: admin.storage.Storage;
try {
  storage = admin.storage();
} catch (e: any) {
  console.error("Failed to initialize Firebase Storage:", e.message);
}

const downloadFile = async (url: string, path: string) => {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  await fs.writeFile(path, Buffer.from(buffer));
};

export async function POST(request: NextRequest) {
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
    // get all documents for partnerId
    const ragDocsForPartner = await db
      .collection(RAGINDEX_COLLECTION_NAME)
      .listDocuments();

    // -- steps
    // for every document/file for partnerId
    // save as local tmp file
    // generate a new fileId for every file
    // call extractPdf on each doc with fileId

    // Loop to iterate over the collection and print the id and data of each document
    let processedDocsCount = 0;
    let processingError: { fileUrl: string } | undefined = undefined;
    let currentFileUrl: string | undefined = undefined;
    for (const docRef of ragDocsForPartner) {
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        const docData = docSnap.data();
        if (docData) {
          currentFileUrl = docData.url;
          const docId = docData.docId;
          if (!currentFileUrl) {
            console.error(
              `--- invalid currentFileUrl=${currentFileUrl} for docData=${JSON.stringify(
                docData
              )}`
            );
            break;
          }
          if (!docId) {
            console.error(
              `--- invalid docId for document with currentFileUrl=${currentFileUrl} for docData=${JSON.stringify(
                docData
              )}`
            );
            break;
          }
          const tempFilePath = `/tmp/${uuidv4()}.pdf`;
          await downloadFile(currentFileUrl, tempFilePath);
          await indexPdfFile(RAGINDEX_COLLECTION_NAME, docId, tempFilePath);
          processedDocsCount += 1;
        }
      } else {
        console.error(`${docSnap.id} does not exist`);
        break;
      }
    }
    if (processingError) {
      return NextResponse.json(
        {
          error: `Failed after processing ${processedDocsCount} for file: ${
            currentFileUrl ?? "-"
          }`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Error in /api/thesis-docs/save:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate and store image" },
      { status: 500 }
    );
  }
}
