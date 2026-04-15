'use server';

import { revalidatePath } from 'next/cache';
import { db as adminDb } from '@/lib/firebase-admin';
import { getBlockConfig, invalidatePartnerBlockCache } from '@/lib/relay/block-config-service';

export interface BlockDataSource {
  // 'auto' = route picks the best fit (partner profile for greeting/contact,
  // first module with items for product_card, etc).
  // 'module' = use the partner's module with `id` (PartnerModule doc id).
  // 'document' = use the vault file with `id`.
  // 'none' = render design sample only.
  type: 'auto' | 'module' | 'document' | 'none';
  id?: string;
}

export interface PartnerBlockOverride {
  enabled: boolean;
  fieldPriority?: string[];
  labelOverrides?: Record<string, string>;
  customConfig?: Record<string, any>;
  dataSource?: BlockDataSource;
}

export interface PartnerHomeScreenOverride {
  sectionOrder?: string[];
  hiddenSections?: string[];
}

export interface PartnerRelayCustomization {
  blockOverrides: Record<string, PartnerBlockOverride>;
  homeScreenOverrides: PartnerHomeScreenOverride;
  flowTemplateId?: string;
  updatedAt: string;
}

export async function getPartnerCustomizationAction(
  partnerId: string
): Promise<{
  success: boolean;
  customization?: PartnerRelayCustomization;
  error?: string;
}> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    const doc = await adminDb
      .collection(`partners/${partnerId}/relayConfig`)
      .doc('blockOverrides')
      .get();

    if (!doc.exists) {
      return {
        success: true,
        customization: {
          blockOverrides: {},
          homeScreenOverrides: {},
          updatedAt: '',
        },
      };
    }

    const data = doc.data() || {};

    return {
      success: true,
      customization: {
        blockOverrides: data.blockOverrides || {},
        homeScreenOverrides: data.homeScreenOverrides || {},
        flowTemplateId: data.flowTemplateId || undefined,
        updatedAt: data.updatedAt || '',
      },
    };
  } catch (error: any) {
    console.error('[Customization] Failed to get partner customization:', error);
    return { success: false, error: error.message };
  }
}

export async function savePartnerCustomizationAction(
  partnerId: string,
  customization: Omit<PartnerRelayCustomization, 'updatedAt'>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    const now = new Date().toISOString();

    await adminDb
      .collection(`partners/${partnerId}/relayConfig`)
      .doc('blockOverrides')
      .set(
        {
          ...customization,
          updatedAt: now,
        },
        { merge: true }
      );

    revalidatePath('/partner/relay');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleBlockAction(
  partnerId: string,
  blockId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    if (!(await getBlockConfig(blockId))) {
      return { success: false, error: `Block "${blockId}" not found in registry` };
    }

    const docRef = adminDb
      .collection(`partners/${partnerId}/relayConfig`)
      .doc('blockOverrides');

    const doc = await docRef.get();
    const data = doc.exists ? doc.data() || {} : {};
    const overrides: Record<string, PartnerBlockOverride> = data.blockOverrides || {};

    if (overrides[blockId]) {
      overrides[blockId].enabled = enabled;
    } else {
      overrides[blockId] = { enabled };
    }

    await docRef.set(
      {
        blockOverrides: overrides,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    invalidatePartnerBlockCache(partnerId);
    revalidatePath('/partner/relay');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateHomeScreenOverridesAction(
  partnerId: string,
  homeScreenOverrides: PartnerHomeScreenOverride
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    await adminDb
      .collection(`partners/${partnerId}/relayConfig`)
      .doc('blockOverrides')
      .set(
        {
          homeScreenOverrides,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

    revalidatePath('/partner/relay');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function assignFlowToPartnerAction(
  partnerId: string,
  flowTemplateId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    const templateDoc = await adminDb
      .collection('systemFlowTemplates')
      .doc(flowTemplateId)
      .get();

    if (!templateDoc.exists) {
      return { success: false, error: 'Flow template not found' };
    }

    await adminDb
      .collection(`partners/${partnerId}/relayConfig`)
      .doc('blockOverrides')
      .set(
        {
          flowTemplateId,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

    revalidatePath('/partner/relay');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resetPartnerCustomizationAction(
  partnerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    await adminDb
      .collection(`partners/${partnerId}/relayConfig`)
      .doc('blockOverrides')
      .delete();

    revalidatePath('/partner/relay');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
