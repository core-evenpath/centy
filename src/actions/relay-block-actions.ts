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

const ICON_MAP: Record<string, string> = {
  catalog: 'ShoppingBag', products: 'Package', services: 'Wrench',
  menu: 'UtensilsCrossed', rooms: 'BedDouble', listings: 'List',
  activities: 'Activity', experiences: 'Compass', classes: 'GraduationCap',
  treatments: 'Heart', book: 'CalendarCheck', appointment: 'CalendarClock',
  inquiry: 'MessageSquarePlus', location: 'MapPin', contact: 'Phone',
  gallery: 'Image', info: 'Info', faq: 'HelpCircle', pricing: 'DollarSign',
  testimonials: 'Star', schedule: 'Clock', promo: 'Tag',
  lead_capture: 'UserPlus', handoff: 'Users', quick_actions: 'Zap',
};

const CAT_MAP: Record<string, string> = {
  catalog: 'Products', products: 'Products', menu: 'Products', rooms: 'Products',
  services: 'Services', activities: 'Services', treatments: 'Services',
  info: 'Information', faq: 'Information', location: 'Information', contact: 'Information',
  book: 'Actions', appointment: 'Actions', pricing: 'Actions', schedule: 'Actions',
};

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

export async function syncBlocksFromTemplatesAction(partnerId: string): Promise<{
  success: boolean;
  added: number;
  skipped: number;
  error?: string;
}> {
  try {
    const blocksCol = adminDb.collection(`partners/${partnerId}/relayConfig/blocks`);

    const [modulesSnap, templatesSnap, existingSnap] = await Promise.all([
      adminDb
        .collection(`partners/${partnerId}/businessModules`)
        .where('enabled', '==', true)
        .get(),
      adminDb.collection('relayBlockConfigs').get(),
      blocksCol.get(),
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
          blockType: template.blockType || 'catalog',
          label: template.label,
          description: template.description || '',
          moduleSlug: template.moduleSlug,
          moduleId: template.moduleId,
          iconName: ICON_MAP[template.blockType] || 'Layers',
          category: CAT_MAP[template.blockType] || 'Information',
          sortOrder: nextSortOrder,
          isVisible: true,
          dataSchema: template.dataSchema || {},
          blockTypeTemplate: template.blockTypeTemplate || {},
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
        batch.set(blocksCol.doc(block.id), block.data);
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
