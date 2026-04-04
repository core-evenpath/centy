'use server';

import { revalidatePath } from 'next/cache';
import { db as adminDb } from '@/lib/firebase-admin';
import { registerAllBlocks } from '@/lib/relay/blocks/index';
import { listBlocks, getRegistrySize } from '@/lib/relay/registry';

let registryReady = false;

function ensureRegistry(): void {
  if (!registryReady) {
    registerAllBlocks();
    registryReady = true;
  }
}

export interface MigrationReport {
  deletedBlockConfigs: number;
  registryBlockCount: number;
  registryFamilies: string[];
  warnings: string[];
}

export async function clearOldRelayBlockConfigsAction(): Promise<{
  success: boolean;
  report?: MigrationReport;
  error?: string;
}> {
  const warnings: string[] = [];

  try {
    let deletedBlockConfigs = 0;
    const snapshot = await adminDb.collection('relayBlockConfigs').get();

    if (!snapshot.empty) {
      const docs = snapshot.docs;
      for (let i = 0; i < docs.length; i += 500) {
        const batch = adminDb.batch();
        const chunk = docs.slice(i, i + 500);
        for (const doc of chunk) {
          batch.delete(doc.ref);
          deletedBlockConfigs++;
        }
        await batch.commit();
      }
    }

    ensureRegistry();
    const registryBlockCount = getRegistrySize();
    const allBlocks = listBlocks();
    const familySet = new Set<string>();
    allBlocks.forEach((b) => familySet.add(b.family));
    const registryFamilies = Array.from(familySet).sort();

    if (registryBlockCount === 0) {
      warnings.push('Registry is empty — no coded blocks found in @/lib/relay/blocks/');
    }

    revalidatePath('/admin/relay');
    revalidatePath('/admin/relay/blocks');

    return {
      success: true,
      report: {
        deletedBlockConfigs,
        registryBlockCount,
        registryFamilies,
        warnings,
      },
    };
  } catch (e: any) {
    console.error('[Migration] Failed to clear old relay data:', e);
    return { success: false, error: e.message };
  }
}

export async function getRegistryHealthAction(): Promise<{
  success: boolean;
  health: {
    totalBlocks: number;
    families: Record<string, number>;
    preloadableCount: number;
    categoryCoverage: string[];
  };
}> {
  try {
    ensureRegistry();
    const all = listBlocks();

    const families: Record<string, number> = {};
    let preloadableCount = 0;
    const categorySet = new Set<string>();

    all.forEach((b) => {
      families[b.family] = (families[b.family] || 0) + 1;
      if (b.preloadable) preloadableCount++;
      b.applicableCategories.forEach((c) => categorySet.add(c));
    });

    return {
      success: true,
      health: {
        totalBlocks: all.length,
        families,
        preloadableCount,
        categoryCoverage: Array.from(categorySet).sort(),
      },
    };
  } catch {
    return {
      success: true,
      health: { totalBlocks: 0, families: {}, preloadableCount: 0, categoryCoverage: [] },
    };
  }
}

export async function clearStaleModuleTemplatesAction(): Promise<{
  success: boolean;
  deleted: number;
  error?: string;
}> {
  try {
    const snapshot = await adminDb.collection('systemModuleTemplates').get();
    let deleted = 0;

    if (!snapshot.empty) {
      for (let i = 0; i < snapshot.docs.length; i += 500) {
        const batch = adminDb.batch();
        const chunk = snapshot.docs.slice(i, i + 500);
        for (const doc of chunk) {
          batch.delete(doc.ref);
          deleted++;
        }
        await batch.commit();
      }
    }

    return { success: true, deleted };
  } catch (e: any) {
    return { success: false, deleted: 0, error: e.message };
  }
}

export async function fullCleanupAction(): Promise<{
  success: boolean;
  blockConfigsDeleted: number;
  moduleTemplatesDeleted: number;
  registryBlockCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let blockConfigsDeleted = 0;
  let moduleTemplatesDeleted = 0;

  const blockResult = await clearOldRelayBlockConfigsAction();
  if (blockResult.success && blockResult.report) {
    blockConfigsDeleted = blockResult.report.deletedBlockConfigs;
    errors.push(...blockResult.report.warnings);
  } else if (blockResult.error) {
    errors.push(`Block cleanup failed: ${blockResult.error}`);
  }

  const templateResult = await clearStaleModuleTemplatesAction();
  if (templateResult.success) {
    moduleTemplatesDeleted = templateResult.deleted;
  } else if (templateResult.error) {
    errors.push(`Template cleanup failed: ${templateResult.error}`);
  }

  ensureRegistry();
  const registryBlockCount = getRegistrySize();

  return {
    success: errors.length === 0 || errors.every((e) => e.startsWith('Registry is empty')),
    blockConfigsDeleted,
    moduleTemplatesDeleted,
    registryBlockCount,
    errors,
  };
}
