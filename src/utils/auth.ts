import { adminAuth } from "@/lib/firebase-admin";

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

export { getPartnerId };
