import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  RAGINDEX_COLLECTION_NAME,
  deleteAllRagIndexDocs,
  indexPdfFile,
} from "@/ai/fireRagSetup";
import * as admin from "firebase-admin";
import { adminAuth, db } from "@/lib/firebase-admin";

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
  try {
    // get all documents for partnerId
    const ragDocsForPartner = await db
      .collection(`thesis-docs/${userData.partnerId}/docs`)
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
    let ts = performance.now();
    console.log(`-- START deleteRagIndexDocs @ ${ts}`);
    await deleteAllRagIndexDocs(RAGINDEX_COLLECTION_NAME);
    console.log(
      `-- DONE deleteRagIndexDocs time_taken = ${performance.now() - ts}`
    );
    ts = performance.now();

    for (const docRef of ragDocsForPartner) {
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        const docData = docSnap.data();
        if (docData) {
          currentFileUrl = docData.url;
          const fileId = docData.fileId;
          if (!currentFileUrl) {
            console.error(
              `--- invalid currentFileUrl=${currentFileUrl} for docData=${JSON.stringify(
                docData
              )}`
            );
            break;
          }
          if (!fileId) {
            console.error(
              `--- invalid fileId for document with currentFileUrl=${currentFileUrl} for docData=${JSON.stringify(
                docData
              )}`
            );
            break;
          }
          const tempFilePath = `/tmp/${uuidv4()}.pdf`;
          await downloadFile(currentFileUrl, tempFilePath);

          console.log(`-- START ragging ${currentFileUrl}`);
          ts = performance.now();
          await indexPdfFile(RAGINDEX_COLLECTION_NAME, fileId, tempFilePath);
          processedDocsCount += 1;
          console.log(
            `-- DONE ragging ${currentFileUrl} : time_taken = ${
              performance.now() - ts
            }`
          );
          ts = performance.now();
        }
      } else {
        console.error(`${docSnap.id} does not exist`);
        // break;
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
