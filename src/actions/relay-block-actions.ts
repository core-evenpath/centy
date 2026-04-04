'use server';

import { db as adminDb } from '@/lib/firebase-admin';

export interface PartnerBlockConfig {
  id: string;
  templateId: string;
  blockType: string;
  label: string;
  description?: string;
  moduleSlug?: string;
  moduleId?: string;
  iconName: string;
  category: string;
  sortOrder: number;
  isVisible: boolean;
  customLabel?: string;
  customDescription?: string;
  dataSchema?: Record<string, any>;
  blockTypeTemplate?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export async function getPartnerBlockConfigsAction(partnerId: string): Promise<{
  success: boolean;
  blocks: PartnerBlockConfig[];
  error?: string;
}> {
  try {
    const snap = await adminDb
      .collection(`partners/${partnerId}/relayConfig/blocks`)
      .orderBy('sortOrder', 'asc')
      .get();

    const blocks = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PartnerBlockConfig[];

    return { success: true, blocks };
  } catch (error) {
    console.error('Failed to get partner block configs:', error);
    return {
      success: false,
      blocks: [],
      error: error instanceof Error ? error.message : 'Failed to get partner block configs',
    };
  }
}

export async function togglePartnerBlockVisibilityAction(
  partnerId: string,
  blockId: string,
  isVisible: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await adminDb
      .collection(`partners/${partnerId}/relayConfig/blocks`)
      .doc(blockId)
      .update({
        isVisible,
        updatedAt: new Date().toISOString(),
      });
    return { success: true };
  } catch (error) {
    console.error('Failed to toggle partner block visibility:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle block visibility',
    };
  }
}

export async function reorderPartnerBlocksAction(
  partnerId: string,
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    const col = adminDb.collection(`partners/${partnerId}/relayConfig/blocks`);

    for (let i = 0; i < orderedIds.length; i += 500) {
      const batch = adminDb.batch();
      const chunk = orderedIds.slice(i, i + 500);
      for (let j = 0; j < chunk.length; j++) {
        batch.update(col.doc(chunk[j]), { sortOrder: i + j, updatedAt: now });
      }
      await batch.commit();
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to reorder partner blocks:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reorder partner blocks',
    };
  }
}

export async function updatePartnerBlockAction(
  partnerId: string,
  blockId: string,
  updates: Partial<PartnerBlockConfig>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { id: _id, templateId: _tid, createdAt: _ca, ...safeUpdates } = updates;
    const allowed: Record<string, any> = {};
    const allowedFields = ['customLabel', 'customDescription', 'isVisible', 'sortOrder', 'blockType'];
    for (const field of allowedFields) {
      if ((safeUpdates as any)[field] !== undefined) {
        allowed[field] = (safeUpdates as any)[field];
      }
    }
    allowed.updatedAt = new Date().toISOString();

    await adminDb
      .collection(`partners/${partnerId}/relayConfig/blocks`)
      .doc(blockId)
      .update(allowed);
    return { success: true };
  } catch (error) {
    console.error('Failed to update partner block:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update partner block',
    };
  }
}

export async function removePartnerBlockAction(
  partnerId: string,
  blockId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await adminDb
      .collection(`partners/${partnerId}/relayConfig/blocks`)
      .doc(blockId)
      .delete();
    return { success: true };
  } catch (error) {
    console.error('Failed to remove partner block:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove partner block',
    };
  }
}
