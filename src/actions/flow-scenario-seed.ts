'use server';

import { db as adminDb } from '@/lib/firebase-admin';
import { generateScenariosAction } from './flow-scenario-actions';

const COLLECTION = 'flowScenarios';

/**
 * Seed scenarios for ALL sub-verticals that don't already have scenarios.
 * Uses Gemini to generate 10 scenarios per sub-vertical.
 * Rate-limited to 1 call per 2 seconds to respect API quotas.
 */
export async function seedAllScenariosAction(): Promise<{
  success: boolean;
  generated: number;
  skipped: number;
  failed: string[];
  error?: string;
}> {
  try {
    const { ALL_SUB_VERTICALS } = await import('@/app/admin/relay/blocks/previews/registry');

    // Check which sub-verticals already have scenarios
    const parentSnap = await adminDb.collection(COLLECTION).get();
    const existingIds = new Set<string>();

    for (const doc of parentSnap.docs) {
      const scenariosSnap = await doc.ref.collection('scenarios').limit(1).get();
      if (!scenariosSnap.empty) existingIds.add(doc.id);
    }

    let generated = 0;
    let skipped = 0;
    const failed: string[] = [];

    for (const sv of ALL_SUB_VERTICALS) {
      if (existingIds.has(sv.id)) {
        skipped++;
        continue;
      }

      const result = await generateScenariosAction(sv.id);
      if (result.success && result.count > 0) {
        generated++;
        console.log(`Generated ${result.count} scenarios for ${sv.id}`);
      } else {
        failed.push(sv.id);
        console.error(`Failed to generate for ${sv.id}: ${result.error}`);
      }

      // Rate limit: 2s between Gemini calls
      await new Promise(r => setTimeout(r, 2000));
    }

    return { success: true, generated, skipped, failed };
  } catch (e: any) {
    console.error('Failed to seed all scenarios:', e);
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
