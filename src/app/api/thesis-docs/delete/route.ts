import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  RAGINDEX_COLLECTION_NAME,
  deleteRagIndexDocs,
} from "@/ai/fireRagSetup";
import { db, adminStorage } from "@/lib/firebase-admin";
import { getPartnerId } from "@/utils/auth";

export async function DELETE(request: NextRequest) {
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
  console.log("in /api/thesis-docs/delete POST");
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
    const params = await request.json();
    const { fileId, docUrl } = params;

    if (!fileId && !docUrl) {
      return NextResponse.json(
        { error: "Valid pdf data id is required." },
        { status: 400 }
      );
    }
    if (fileId) {
      // first delete the indexed data
      deleteRagIndexDocs(RAGINDEX_COLLECTION_NAME, fileId);

      //   then delete the
      const docs = await db
        .collection(`thesis-docs/${userData.partnerId}/docs`)
        .where("id", "==", fileId)
        .get();

      const batch = db.batch();
      docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } else if (docUrl) {
      const docs = await db
        .collection(`thesis-docs/${userData.partnerId}/docs`)
        .where("url", "==", docUrl)
        .get();

      const batch = db.batch();
      docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Error in /api/thesis-docs/delete:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate and store image" },
      { status: 500 }
    );
  }
}
