// src/app/api/thesis-docs/list/route.ts
import { NextResponse } from "next/server";
import { db, adminAuth } from "@/lib/firebase-admin";
import { headers } from "next/headers";

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

export async function GET() {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization") || "";

    const userData = await getPartnerId(authHeader);
    console.log(userData);
    if (!userData?.partnerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Partner ID is required",
        },
        { status: 400 }
      );
    }

    // Get partner docs
    const partnerDocsCollection = await db
      .collection(`thesis-docs/${userData.partnerId}/docs`)
      .get();

    if (partnerDocsCollection.empty) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const partnerDocs = partnerDocsCollection.docs.map((snap) => snap.data());
    return NextResponse.json({
      success: true,
      data: partnerDocs,
    });
  } catch (error: any) {
    console.error("Error fetching partner details:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch partner details",
      },
      { status: 500 }
    );
  }
}
