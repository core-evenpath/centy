// src/app/api/thesis-docs/list/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { headers } from "next/headers";
import { getPartnerId } from "@/utils/auth";
import { getPartnerThesisDocs } from "@/services/thesis-docs";

export async function GET() {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization") || "";

    const userData = await getPartnerId(authHeader);
    if (!userData?.partnerId) {
      return NextResponse.json(
        {
          success: false,
          message: "Partner ID is required",
        },
        { status: 400 }
      );
    }

    const docs = await getPartnerThesisDocs(userData.partnerId);
    return NextResponse.json({
      success: true,
      data: docs,
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
