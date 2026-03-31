'use server';

import { db as adminDb } from '@/lib/firebase-admin';
import { MODULE_ICON_MAP, CATEGORY_MAP } from './relay-storefront-actions';

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
  dataSchema?: {
    sourceCollection?: string;
    sourceFields?: string[];
    displayTemplate?: string;
    maxItems?: number;
    sortBy?: string;
    sortOrder?: string;
  };
  blockTypeTemplate?: {
    generatedBy: 'gemini' | 'manual' | 'default';
    generatedAt: string;
    subcategory: string;
    sampleData: Record<string, any>;
    isDefault: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PartnerBlockSummary {
  totalBlocks: number;
  visibleBlocks: number;
  hiddenBlocks: number;
  categories: Record<string, number>;
  lastUpdatedAt?: string;
}

function partnerBlocksRef(partnerId: string) {
  return adminDb.collection(`partners/${partnerId}/relayConfig/blocks`);
}

export async function getPartnerBlockConfigsAction(partnerId: string): Promise<{
  success: boolean;
  blocks: PartnerBlockConfig[];
  error?: string;
}> {
  try {
    const snap = await partnerBlocksRef(partnerId)
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

export async function syncBlocksFromTemplatesAction(partnerId: string): Promise<{
  success: boolean;
  added: number;
  skipped: number;
  error?: string;
}> {
  try {
    const [modulesSnap, templatesSnap, existingSnap] = await Promise.all([
      adminDb
        .collection(`partners/${partnerId}/businessModules`)
        .where('enabled', '==', true)
        .get(),
      adminDb.collection('relayBlockConfigs').get(),
      partnerBlocksRef(partnerId).get(),
    ]);

    const templatesBySlug = new Map<string, { id: string; data: Record<string, any> }>();
    const templatesById = new Map<string, { id: string; data: Record<string, any> }>();
    templatesSnap.docs.forEach((doc) => {
      const data = doc.data() || {};
      const entry = { id: doc.id, data };
      templatesById.set(doc.id, entry);
      if (data.moduleSlug) {
        templatesBySlug.set(data.moduleSlug, entry);
      }
    });

    const existingTemplateIds = new Set<string>();
    let maxSortOrder = -1;
    existingSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.templateId) {
        existingTemplateIds.add(data.templateId);
      }
      if (typeof data.sortOrder === 'number' && data.sortOrder > maxSortOrder) {
        maxSortOrder = data.sortOrder;
      }
    });

    let nextSortOrder = maxSortOrder + 1;
    let added = 0;
    let skipped = 0;

    const newBlocks: Array<{ id: string; data: Record<string, any> }> = [];

    for (const moduleDoc of modulesSnap.docs) {
      const moduleData = moduleDoc.data();
      const slug = moduleData.moduleSlug || '';

      const templateEntry =
        templatesBySlug.get(slug) || templatesById.get(`module_${slug}`) || null;

      if (!templateEntry) {
        skipped++;
        continue;
      }

      if (existingTemplateIds.has(templateEntry.id)) {
        skipped++;
        continue;
      }

      const template = templateEntry.data;
      const now = new Date().toISOString();
      const blockId = `pb_${template.moduleSlug || templateEntry.id}`;

      newBlocks.push({
        id: blockId,
        data: {
          id: blockId,
          templateId: templateEntry.id,
          blockType: template.blockType,
          label: template.label,
          description: template.description,
          moduleSlug: template.moduleSlug,
          moduleId: template.moduleId,
          iconName: MODULE_ICON_MAP[template.blockType] || 'Layers',
          category: CATEGORY_MAP[template.blockType] || 'Information',
          sortOrder: nextSortOrder,
          isVisible: true,
          dataSchema: template.dataSchema,
          blockTypeTemplate: template.blockTypeTemplate,
          createdAt: now,
          updatedAt: now,
        },
      });

      nextSortOrder++;
      added++;
    }

    for (let i = 0; i < newBlocks.length; i += 500) {
      const batch = adminDb.batch();
      const chunk = newBlocks.slice(i, i + 500);
      for (const block of chunk) {
        batch.set(partnerBlocksRef(partnerId).doc(block.id), block.data);
      }
      await batch.commit();
    }

    return { success: true, added, skipped };
  } catch (error) {
    console.error('Failed to sync blocks from templates:', error);
    return {
      success: false,
      added: 0,
      skipped: 0,
      error: error instanceof Error ? error.message : 'Failed to sync blocks from templates',
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

    await partnerBlocksRef(partnerId).doc(blockId).update(allowed);
    return { success: true };
  } catch (error) {
    console.error('Failed to update partner block:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update partner block',
    };
  }
}

export async function reorderPartnerBlocksAction(
  partnerId: string,
  orderedIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();
    const ref = partnerBlocksRef(partnerId);

    for (let i = 0; i < orderedIds.length; i += 500) {
      const batch = adminDb.batch();
      const chunk = orderedIds.slice(i, i + 500);
      for (let j = 0; j < chunk.length; j++) {
        batch.update(ref.doc(chunk[j]), { sortOrder: i + j, updatedAt: now });
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

export async function togglePartnerBlockVisibilityAction(
  partnerId: string,
  blockId: string,
  isVisible: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    await partnerBlocksRef(partnerId).doc(blockId).update({
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

export async function resetPartnerBlockToTemplateAction(
  partnerId: string,
  blockId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const blockDoc = await partnerBlocksRef(partnerId).doc(blockId).get();
    if (!blockDoc.exists) {
      return { success: false, error: 'Partner block not found' };
    }

    const blockData = blockDoc.data()!;
    const templateDoc = await adminDb.collection('relayBlockConfigs').doc(blockData.templateId).get();
    if (!templateDoc.exists) {
      return { success: false, error: 'Template not found' };
    }

    const template = templateDoc.data()!;
    await partnerBlocksRef(partnerId).doc(blockId).update({
      blockType: template.blockType,
      label: template.label,
      description: template.description,
      moduleSlug: template.moduleSlug,
      moduleId: template.moduleId,
      iconName: MODULE_ICON_MAP[template.blockType] || 'Layers',
      category: CATEGORY_MAP[template.blockType] || 'Information',
      dataSchema: template.dataSchema,
      blockTypeTemplate: template.blockTypeTemplate,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to reset partner block to template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset block to template',
    };
  }
}

export async function removePartnerBlockAction(
  partnerId: string,
  blockId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await partnerBlocksRef(partnerId).doc(blockId).delete();
    return { success: true };
  } catch (error) {
    console.error('Failed to remove partner block:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove partner block',
    };
  }
}

export async function getPartnerBlockSummaryAction(partnerId: string): Promise<{
  success: boolean;
  summary?: PartnerBlockSummary;
  error?: string;
}> {
  try {
    const snap = await partnerBlocksRef(partnerId).get();

    let visibleBlocks = 0;
    let hiddenBlocks = 0;
    const categories: Record<string, number> = {};
    let lastUpdatedAt: string | undefined;

    snap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.isVisible) {
        visibleBlocks++;
      } else {
        hiddenBlocks++;
      }
      const cat = data.category || 'Unknown';
      categories[cat] = (categories[cat] || 0) + 1;
      if (!lastUpdatedAt || (data.updatedAt && data.updatedAt > lastUpdatedAt)) {
        lastUpdatedAt = data.updatedAt;
      }
    });

    return {
      success: true,
      summary: {
        totalBlocks: snap.size,
        visibleBlocks,
        hiddenBlocks,
        categories,
        lastUpdatedAt,
      },
    };
  } catch (error) {
    console.error('Failed to get partner block summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get partner block summary',
    };
  }
}
