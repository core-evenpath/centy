'use server';

import { db as adminDb } from '@/lib/firebase-admin';
import { generateScenariosAction } from './flow-scenario-actions';
import type { GenerateContext } from './flow-scenario-actions';

const COLLECTION = 'flowScenarios';

/**
 * Seed scenarios for a batch of sub-verticals.
 * Context must be computed client-side (registry can't be imported server-side).
 */
export async function seedScenariosAction(
  items: { functionId: string; ctx: GenerateContext }[],
): Promise<{
  success: boolean;
  generated: number;
  skipped: number;
  failed: string[];
  error?: string;
}> {
  try {
    const parentSnap = await adminDb.collection(COLLECTION).get();
    const existingIds = new Set<string>();

    for (const doc of parentSnap.docs) {
      const scenariosSnap = await doc.ref.collection('scenarios').limit(1).get();
      if (!scenariosSnap.empty) existingIds.add(doc.id);
    }

    let generated = 0;
    let skipped = 0;
    const failed: string[] = [];

    for (const { functionId, ctx } of items) {
      if (existingIds.has(functionId)) {
        skipped++;
        continue;
      }

      const result = await generateScenariosAction(functionId, ctx);
      if (result.success && result.count > 0) {
        generated++;
      } else {
        failed.push(functionId);
      }

      await new Promise(r => setTimeout(r, 2000));
    }

    return { success: true, generated, skipped, failed };
  } catch (e: any) {
    return { success: false, generated: 0, skipped: 0, failed: [], error: e.message };
  }
}

/**
 * Get seeding progress: how many sub-verticals have scenarios vs total.
 */
export async function getSeedingProgressAction(): Promise<{
  success: boolean;
  total: number;
  seeded: number;
  error?: string;
}> {
  try {
    const { ALL_SUB_VERTICALS } = await import('@/app/admin/relay/blocks/previews/registry');
    const snap = await adminDb.collection(COLLECTION).get();

    let seeded = 0;
    for (const doc of snap.docs) {
      const scenariosSnap = await doc.ref.collection('scenarios').limit(1).get();
      if (!scenariosSnap.empty) seeded++;
    }

    return { success: true, total: ALL_SUB_VERTICALS.length, seeded };
  } catch (e: any) {
    return { success: false, total: 0, seeded: 0, error: e.message };
  }
}
