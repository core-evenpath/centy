
// src/services/tenant-service.ts
import { db, adminAuth } from '../lib/firebase-admin';
import type { Partner } from '../lib/types';

export interface TenantLookupResult {
  success: boolean;
  tenantId?: string;
  partnerId?: string;
  message: string;
}

/**
 * Gets the tenant ID for a given email address or phone number.
 */
export async function getTenantIdForEmail(identifier: string): Promise<TenantLookupResult> {
  if (!db) {
    return {
      success: false,
      message: "Database not available"
    };
  }

  try {
    const lowercasedIdentifier = identifier.toLowerCase();
    const userMappingRef = db.collection('userMappings').doc(lowercasedIdentifier);
    const doc = await userMappingRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      return {
        success: true,
        tenantId: data?.tenantId,
        partnerId: data?.partnerId,
        message: "Tenant found"
      };
    }
    
    return {
      success: false,
      message: "Your organization could not be found. Please contact support."
    };
    
  } catch (error: any) {
    console.error("Error looking up tenant for identifier:", identifier, error);
    return {
      success: false,
      message: "Failed to lookup organization. Please try again."
    };
  }
}

/**
 * Gets the tenant ID for a given partner ID.
 */
export async function getPartnerTenantId(partnerId: string): Promise<TenantLookupResult> {
  if (!db) {
    return {
      success: false,
      message: "Database not available"
    };
  }

  try {
    const partnerRef = db.collection('partners').doc(partnerId);
    const doc = await partnerRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      return {
        success: true,
        tenantId: data?.tenantId,
        partnerId: partnerId,
        message: "Partner tenant found"
      };
    }
    
    return {
      success: false,
      message: "Partner not found"
    };
    
  } catch (error: any) {
    console.error("Error looking up tenant for partner:", partnerId, error);
    return {
      success: false,
      message: "Failed to lookup partner tenant"
    };
  }
}

/**
 * Creates a user mapping between an identifier (email/phone) and tenant ID.
 */
export async function createUserMapping(identifier: string, tenantId: string, partnerId?: string): Promise<TenantLookupResult> {
  if (!db) {
    return {
      success: false,
      message: "Database not available"
    };
  }

  try {
    const lowercasedIdentifier = identifier.toLowerCase();
    const userMappingRef = db.collection('userMappings').doc(lowercasedIdentifier);
    
    const doc = await userMappingRef.get();
    if(doc.exists) {
        return {
            success: false,
            message: `Mapping for ${identifier} already exists.`
        };
    }

    await userMappingRef.set({
      identifier: lowercasedIdentifier,
      tenantId,
      partnerId: partnerId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return {
      success: true,
      tenantId,
      partnerId,
      message: "User mapping created successfully"
    };
    
  } catch (error: any) {
    console.error("Error creating user mapping:", error);
    return {
      success: false,
      message: "Failed to create user mapping"
    };
  }
}

/**
 * Validates that a tenant ID exists in Firebase Auth.
 */
export async function validateTenantId(tenantId: string): Promise<boolean> {
  if (!tenantId) return false;
    
  if (!adminAuth) {
    console.warn("Admin auth not available, cannot validate tenant");
    return false;
  }

  try {
    await adminAuth.tenantManager().getTenant(tenantId);
    return true;
  } catch (error: any) {
    if ((error as any).code === 'auth/tenant-not-found') {
      console.warn(`Tenant validation failed for ${tenantId}: Tenant does not exist.`);
    } else {
      console.error(`Tenant validation failed for ${tenantId}:`, error);
    }
    return false;
  }
}

/**
 * Gets partner details for a given partner ID.
 */
export async function getPartnerDetailsByPartnerId(partnerId: string): Promise<{ success: boolean; message: string; partner?: Partner, tenantId?: string }> {
  if (!db) {
    return {
      success: false,
      message: "Database not available"
    };
  }

  try {
    const partnerRef = db.collection('partners').doc(partnerId);
    const doc = await partnerRef.get();
    
    if (doc.exists) {
      const data = doc.data() as Partner;
      return {
        success: true,
        partner: { ...data, id: doc.id },
        tenantId: data.tenantId,
        message: "Partner details found"
      };
    }
    
    return {
      success: false,
      message: "Partner not found"
    };
    
  } catch (error: any) {
    console.error("Error looking up partner details:", partnerId, error);
    return {
      success: false,
      message: "Failed to lookup partner details"
    };
  }
}
