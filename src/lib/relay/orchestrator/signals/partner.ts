import 'server-only';

// ── Partner signal ─────────────────────────────────────────────────────
//
// Loads the partner document + its top 10 enabled modules with their
// active items. Shape matches what `buildBlockData` expects so the
// orchestrator can pass it straight through to block-data builders.

import { db } from '@/lib/firebase-admin';
import {
  getModuleItemsAction,
  getPartnerModulesAction,
  getSystemModuleAction,
} from '@/actions/modules-actions';
import type { PartnerSignal } from '../types';

const MAX_MODULES = 10;
const ITEMS_PAGE_SIZE = 20;

export async function loadPartnerSignal(
  partnerId: string,
): Promise<PartnerSignal> {
  let partnerData: Record<string, unknown> | null = null;
  try {
    const snap = await db.collection('partners').doc(partnerId).get();
    partnerData = snap.exists ? (snap.data() as Record<string, unknown>) : null;
  } catch {
    /* non-fatal */
  }

  const persona = partnerData?.businessPersona as
    | { identity?: { businessCategories?: Array<{ functionId?: string }> } }
    | undefined;
  const functionId =
    persona?.identity?.businessCategories?.[0]?.functionId ?? 'general';

  const modules: PartnerSignal['modules'] = [];
  try {
    const pmRes = await getPartnerModulesAction(partnerId);
    const partnerModules = pmRes.success ? pmRes.data ?? [] : [];
    for (const pm of partnerModules.slice(0, MAX_MODULES)) {
      const sysRes = await getSystemModuleAction(pm.moduleSlug);
      if (!sysRes.success || !sysRes.data) continue;
      const itemsRes = await getModuleItemsAction(partnerId, pm.id, {
        isActive: true,
        pageSize: ITEMS_PAGE_SIZE,
        sortBy: 'sortOrder',
        sortOrder: 'asc',
      });
      const items = itemsRes.success ? itemsRes.data?.items ?? [] : [];
      modules.push({ slug: pm.moduleSlug, name: sysRes.data.name, items });
    }
  } catch {
    /* non-fatal — orchestrator degrades gracefully without modules */
  }

  return { partnerId, partnerData, functionId, modules };
}
