'use server';

import { revalidatePath } from 'next/cache';
import { db as adminDb } from '@/lib/firebase-admin';
import { registerAllBlocks } from '@/lib/relay/blocks/index';
import { listBlocks, getBlock } from '@/lib/relay/registry';
import { deriveModuleSchemaAction } from './module-derivation-actions';
import type { BlockDefinition } from '@/lib/relay/types';

let registryReady = false;

function ensureRegistry(): void {
  if (!registryReady) {
    registerAllBlocks();
    registryReady = true;
  }
}

export interface HomeScreenSection {
  blockId: string;
  position: number;
  config: {
    title?: string;
    maxItems?: number;
    filter?: Record<string, any>;
    variant?: string;
  };
}

export interface HomeScreenConfig {
  layout: 'bento' | 'storefront';
  sections: HomeScreenSection[];
}

export interface StageIntentMapping {
  intent: string;
  primaryBlock: string;
  fallbackBlock?: string;
}

export interface FlowStageBlockConfig {
  stageId: string;
  eligibleBlocks: string[];
  intentMappings: StageIntentMapping[];
  suggestedPrompts: string[];
}

export interface FlowBlockEnhancement {
  homeScreen: HomeScreenConfig;
  stageBlocks: FlowStageBlockConfig[];
  preloadBlocks: string[];
  cacheStrategy: 'aggressive' | 'moderate' | 'none';
}

export async function getFlowBlockConfigAction(
  templateId: string
): Promise<{
  success: boolean;
  config?: FlowBlockEnhancement;
  templateName?: string;
  error?: string;
}> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    const doc = await adminDb.collection('systemFlowTemplates').doc(templateId).get();
    if (!doc.exists) {
      return { success: false, error: 'Template not found' };
    }

    const data = doc.data() || {};

    const config: FlowBlockEnhancement = {
      homeScreen: data.homeScreen || { layout: 'bento', sections: [] },
      stageBlocks: data.stageBlocks || [],
      preloadBlocks: data.preloadBlocks || [],
      cacheStrategy: data.cacheStrategy || 'aggressive',
    };

    return { success: true, config, templateName: data.name || '' };
  } catch (error: any) {
    console.error('[FlowComposer] Failed to get block config:', error);
    return { success: false, error: error.message };
  }
}

export async function saveFlowBlockConfigAction(
  templateId: string,
  config: FlowBlockEnhancement
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    const doc = await adminDb.collection('systemFlowTemplates').doc(templateId).get();
    if (!doc.exists) {
      return { success: false, error: 'Template not found' };
    }

    await adminDb.collection('systemFlowTemplates').doc(templateId).update({
      homeScreen: config.homeScreen,
      stageBlocks: config.stageBlocks,
      preloadBlocks: config.preloadBlocks,
      cacheStrategy: config.cacheStrategy,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath('/admin/relay/flows');

    return { success: true };
  } catch (error: any) {
    console.error('[FlowComposer] Failed to save block config:', error);
    return { success: false, error: error.message };
  }
}

export async function updateHomeScreenAction(
  templateId: string,
  homeScreen: HomeScreenConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    ensureRegistry();

    for (const section of homeScreen.sections) {
      const entry = getBlock(section.blockId);
      if (!entry) {
        return { success: false, error: `Block "${section.blockId}" not found in registry` };
      }
    }

    await adminDb.collection('systemFlowTemplates').doc(templateId).update({
      homeScreen,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath('/admin/relay/flows');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateStageBlocksAction(
  templateId: string,
  stageId: string,
  stageConfig: Omit<FlowStageBlockConfig, 'stageId'>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    ensureRegistry();

    for (const blockId of stageConfig.eligibleBlocks) {
      if (!getBlock(blockId)) {
        return { success: false, error: `Block "${blockId}" not found in registry` };
      }
    }

    for (const mapping of stageConfig.intentMappings) {
      if (!getBlock(mapping.primaryBlock)) {
        return { success: false, error: `Primary block "${mapping.primaryBlock}" not found` };
      }
      if (mapping.fallbackBlock && !getBlock(mapping.fallbackBlock)) {
        return { success: false, error: `Fallback block "${mapping.fallbackBlock}" not found` };
      }
    }

    const doc = await adminDb.collection('systemFlowTemplates').doc(templateId).get();
    if (!doc.exists) {
      return { success: false, error: 'Template not found' };
    }

    const data = doc.data() || {};
    const stageBlocks: FlowStageBlockConfig[] = data.stageBlocks || [];

    const existingIndex = stageBlocks.findIndex((sb) => sb.stageId === stageId);
    const newConfig: FlowStageBlockConfig = { stageId, ...stageConfig };

    if (existingIndex >= 0) {
      stageBlocks[existingIndex] = newConfig;
    } else {
      stageBlocks.push(newConfig);
    }

    await adminDb.collection('systemFlowTemplates').doc(templateId).update({
      stageBlocks,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath('/admin/relay/flows');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAvailableBlocksForFlowAction(
  verticalId?: string
): Promise<{
  success: boolean;
  blocks: Array<{
    id: string;
    family: string;
    label: string;
    description: string;
    preloadable: boolean;
    intentKeywords: string[];
  }>;
}> {
  try {
    ensureRegistry();

    let blocks: BlockDefinition[];
    if (verticalId) {
      blocks = listBlocks({ category: verticalId });
      const sharedBlocks = listBlocks().filter((b) => b.family === 'shared');
      const blockIds = new Set(blocks.map((b) => b.id));
      for (const sb of sharedBlocks) {
        if (!blockIds.has(sb.id)) {
          blocks.push(sb);
        }
      }
    } else {
      blocks = listBlocks();
    }

    return {
      success: true,
      blocks: blocks.map((b) => ({
        id: b.id,
        family: b.family,
        label: b.label,
        description: b.description,
        preloadable: b.preloadable,
        intentKeywords: b.intentTriggers.keywords.slice(0, 5),
      })),
    };
  } catch (error: any) {
    return { success: false, blocks: [] };
  }
}

export async function generateDefaultHomeScreenAction(
  verticalId: string
): Promise<{
  success: boolean;
  homeScreen?: HomeScreenConfig;
  error?: string;
}> {
  try {
    ensureRegistry();

    const sections: HomeScreenSection[] = [];
    let position = 0;

    const greeting = getBlock('ecom_greeting');
    if (greeting) {
      sections.push({
        blockId: 'ecom_greeting',
        position: position++,
        config: { variant: 'default' },
      });
    }

    const promo = getBlock('ecom_promo');
    if (promo) {
      sections.push({
        blockId: 'ecom_promo',
        position: position++,
        config: { variant: 'coupon', title: 'Offers' },
      });
    }

    const productCard = getBlock('ecom_product_card');
    if (productCard) {
      sections.push({
        blockId: 'ecom_product_card',
        position: position++,
        config: { title: 'Popular Products', maxItems: 4 },
      });
    }

    const suggestions = getBlock('shared_suggestions');
    if (suggestions) {
      sections.push({
        blockId: 'shared_suggestions',
        position: position++,
        config: {},
      });
    }

    const contact = getBlock('shared_contact');
    if (contact) {
      sections.push({
        blockId: 'shared_contact',
        position: position++,
        config: {},
      });
    }

    return {
      success: true,
      homeScreen: {
        layout: 'bento',
        sections,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function publishFlowAction(
  templateId: string
): Promise<{
  success: boolean;
  blockIds: string[];
  derivedFieldCount: number;
  error?: string;
}> {
  try {
    if (!adminDb) {
      return { success: false, blockIds: [], derivedFieldCount: 0, error: 'Database not available' };
    }

    ensureRegistry();

    const doc = await adminDb.collection('systemFlowTemplates').doc(templateId).get();
    if (!doc.exists) {
      return { success: false, blockIds: [], derivedFieldCount: 0, error: 'Template not found' };
    }

    const data = doc.data() || {};
    const homeScreen: HomeScreenConfig = data.homeScreen || { layout: 'bento', sections: [] };
    const stageBlocks: FlowStageBlockConfig[] = data.stageBlocks || [];

    const blockIdSet = new Set<string>();

    for (const section of homeScreen.sections) {
      blockIdSet.add(section.blockId);
    }

    for (const stage of stageBlocks) {
      for (const blockId of stage.eligibleBlocks) {
        blockIdSet.add(blockId);
      }
      for (const mapping of stage.intentMappings) {
        blockIdSet.add(mapping.primaryBlock);
        if (mapping.fallbackBlock) {
          blockIdSet.add(mapping.fallbackBlock);
        }
      }
    }

    const blockIds = Array.from(blockIdSet);

    const preloadBlocks = blockIds.filter((id) => {
      const entry = getBlock(id);
      return entry?.definition.preloadable === true;
    });

    let derivedFieldCount = 0;
    if (blockIds.length > 0) {
      const derivation = await deriveModuleSchemaAction(blockIds);
      if (derivation.success && derivation.schema) {
        derivedFieldCount = derivation.schema.fields.length;
      }
    }

    await adminDb.collection('systemFlowTemplates').doc(templateId).update({
      status: 'active',
      preloadBlocks,
      publishedAt: new Date().toISOString(),
      publishedBlockIds: blockIds,
      publishedFieldCount: derivedFieldCount,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath('/admin/relay/flows');

    return {
      success: true,
      blockIds,
      derivedFieldCount,
    };
  } catch (error: any) {
    console.error('[FlowComposer] Publish failed:', error);
    return { success: false, blockIds: [], derivedFieldCount: 0, error: error.message };
  }
}

export async function unpublishFlowAction(
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }

    await adminDb.collection('systemFlowTemplates').doc(templateId).update({
      status: 'draft',
      updatedAt: new Date().toISOString(),
    });

    revalidatePath('/admin/relay/flows');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
