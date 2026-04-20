'use server';

// M15: seed-template + CSV import server actions.
//
// applySeedTemplate: append the items in a template to the partner's
// module collection. Never overwrites; re-running produces N × runs
// items. Triggers Health recompute after the batch.
//
// importModuleItemsFromCSVAction: accept raw CSV text, run the pure
// parser from @/lib/import/module-csv-import, and bulk-write the valid
// rows.

import { db as adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getSeedTemplate as getBookingSeedTemplate } from '@/lib/relay/seed-templates/booking';
import { getCommerceSeedTemplate } from '@/lib/relay/seed-templates/commerce';
import { getLeadSeedTemplate } from '@/lib/relay/seed-templates/lead';
import { getEngagementSeedTemplate } from '@/lib/relay/seed-templates/engagement';
import { getInfoSeedTemplate } from '@/lib/relay/seed-templates/info';
import { importModuleItemsFromCSV } from '@/lib/import/module-csv-import';

// Unified lookup: seed templates ids are globally unique (prefix
// `booking.*` / `commerce.*` / `lead.*` / `engagement.*` / `info.*`).
// Look up every registry in order.
function getSeedTemplate(id: string) {
  return (
    getBookingSeedTemplate(id) ??
    getCommerceSeedTemplate(id) ??
    getLeadSeedTemplate(id) ??
    getEngagementSeedTemplate(id) ??
    getInfoSeedTemplate(id)
  );
}
import { generateItemId } from '@/lib/modules/utils';
import type { ModuleItem, SystemModule } from '@/lib/modules/types';
import { evaluatePartnerSaveGate, triggerHealthRecompute } from './relay-health-actions';

export interface ApplySeedResult {
  ok: boolean;
  itemsCreated?: number;
  moduleSlug?: string;
  error?: string;
}

// Resolve the partner-specific module id for a given system-module slug.
// Falls back to creating no items if the partner hasn't enabled this
// module (the seed action assumes the module is already assigned).
async function resolvePartnerModuleId(
  partnerId: string,
  slug: string,
): Promise<{ moduleId: string | null; systemModule: SystemModule | null }> {
  // Find the system module
  const systemSnap = await adminDb
    .collection('systemModules')
    .where('slug', '==', slug)
    .limit(1)
    .get();
  if (systemSnap.empty) return { moduleId: null, systemModule: null };
  const systemModule = {
    id: systemSnap.docs[0].id,
    ...systemSnap.docs[0].data(),
  } as SystemModule;

  // Find the partner's assignment
  const assignSnap = await adminDb
    .collection('moduleAssignments')
    .where('partnerId', '==', partnerId)
    .where('systemModuleId', '==', systemModule.id)
    .limit(1)
    .get();
  if (assignSnap.empty) {
    return { moduleId: null, systemModule };
  }
  const assign = assignSnap.docs[0].data() as { partnerModuleId?: string };
  return {
    moduleId: assign.partnerModuleId ?? null,
    systemModule,
  };
}

export async function applySeedTemplate(
  partnerId: string,
  templateId: string,
): Promise<ApplySeedResult> {
  try {
    // P3.M05.3: Health gate (dormant with flag off). Seeds write many
    // rows in one batch — gating before the batch prevents compounding
    // already-red engine state.
    const gate = await evaluatePartnerSaveGate(partnerId);
    if (!gate.allow) {
      return {
        ok: false,
        error: `Health gating blocked this seed apply — engine "${gate.engine}" is red. Fix outstanding issues via /admin/relay/health first.`,
      };
    }

    const template = getSeedTemplate(templateId);
    if (!template) {
      return { ok: false, error: `Unknown seed template: ${templateId}` };
    }
    const { moduleId, systemModule } = await resolvePartnerModuleId(
      partnerId,
      template.moduleSlug,
    );
    if (!moduleId || !systemModule) {
      return {
        ok: false,
        error: `Partner has not enabled the ${template.moduleSlug} module. Assign the module first via /admin/modules.`,
      };
    }

    const collection = adminDb.collection(
      `partners/${partnerId}/businessModules/${moduleId}/items`,
    );
    const now = FieldValue.serverTimestamp();

    const batch = adminDb.batch();
    let created = 0;
    for (const item of template.items) {
      const id = generateItemId();
      const doc: Omit<ModuleItem, 'createdAt' | 'updatedAt'> & {
        createdAt: unknown;
        updatedAt: unknown;
      } = {
        id,
        moduleId,
        partnerId,
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        currency: item.currency,
        images: item.images,
        fields: item.fields,
        isActive: item.isActive,
        isFeatured: false,
        sortOrder: item.sortOrder,
        trackInventory: false,
        _schemaVersion: systemModule.currentVersion ?? 1,
        createdBy: 'seed-template',
        createdAt: now,
        updatedAt: now,
      };
      batch.set(collection.doc(id), doc);
      created++;
    }
    await batch.commit();

    // Shadow-mode Health recompute — never blocks, logs failures.
    await triggerHealthRecompute(partnerId);

    return { ok: true, itemsCreated: created, moduleSlug: template.moduleSlug };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── CSV import ────────────────────────────────────────────────────────

export interface CsvImportActionResult {
  ok: boolean;
  rowsImported?: number;
  rowsSkipped?: number;
  errors?: Array<{ rowIndex: number; errors: string[] }>;
  error?: string;
}

export async function importModuleItemsFromCSVAction(
  partnerId: string,
  moduleSlug: string,
  csvText: string,
): Promise<CsvImportActionResult> {
  try {
    const { moduleId, systemModule } = await resolvePartnerModuleId(partnerId, moduleSlug);
    if (!moduleId || !systemModule) {
      return {
        ok: false,
        error: `Partner has not enabled the ${moduleSlug} module. Assign the module first via /admin/modules.`,
      };
    }

    const result = importModuleItemsFromCSV(csvText, systemModule.schema);
    if (result.valid.length === 0 && result.invalid.length === 0) {
      return { ok: false, error: 'CSV is empty or has no detectable rows.' };
    }

    const collection = adminDb.collection(
      `partners/${partnerId}/businessModules/${moduleId}/items`,
    );
    const now = FieldValue.serverTimestamp();

    // Batch writes in chunks of 400 (Firestore batch limit 500).
    for (let offset = 0; offset < result.valid.length; offset += 400) {
      const chunk = result.valid.slice(offset, offset + 400);
      const batch = adminDb.batch();
      for (const row of chunk) {
        const id = generateItemId();
        const category = (row as typeof row & { category?: string }).category ?? 'imported';
        const currency = (row as typeof row & { currency?: string }).currency ?? 'INR';
        batch.set(collection.doc(id), {
          id,
          moduleId,
          partnerId,
          name: row.name!,
          description: row.description,
          category,
          price: row.price,
          currency,
          images: [],
          fields: row.fields,
          isActive: true,
          isFeatured: false,
          sortOrder: 999,
          trackInventory: false,
          _schemaVersion: systemModule.currentVersion ?? 1,
          createdBy: 'csv-import',
          createdAt: now,
          updatedAt: now,
        });
      }
      await batch.commit();
    }

    await triggerHealthRecompute(partnerId);

    return {
      ok: true,
      rowsImported: result.valid.length,
      rowsSkipped: result.invalid.length,
      errors: result.invalid.map((r) => ({ rowIndex: r.rowIndex, errors: r.errors })),
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function listSeedTemplatesAction(): Promise<
  Array<{ id: string; label: string; description: string; moduleSlug: string; itemCount: number }>
> {
  const { listSeedTemplates } = await import('@/lib/relay/seed-templates/booking');
  return listSeedTemplates().map((t) => ({
    id: t.id,
    label: t.label,
    description: t.description,
    moduleSlug: t.moduleSlug,
    itemCount: t.items.length,
  }));
}
