'use server';

// ── Module match lookup for Content Studio ─────────────────────────────
//
// Used by the datamap's "Let AI collect it for you" flow. Given a
// moduleSlug, checks whether the partner already has a module with
// items and returns the top 5 field labels so the UI can show a
// "matching module found" card.
//
// Reads from `partners/{pid}/businessModules` (the canonical partner
// module subcollection, despite older docs still calling it
// "partnerModules").

import { db } from '@/lib/firebase-admin';
import { getSystemModuleAction } from '@/actions/modules-actions';
import type { MatchedModule } from '@/app/partner/(protected)/relay/datamap/types';

export interface MatchModuleResult {
  success: boolean;
  match?: MatchedModule;
  error?: string;
}

function toIso(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString();
    } catch {
      /* fall through */
    }
  }
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

export async function matchExistingModuleAction(
  partnerId: string,
  moduleSlug: string,
): Promise<MatchModuleResult> {
  if (!partnerId || !moduleSlug) {
    return { success: false, error: 'partnerId and moduleSlug are required' };
  }

  try {
    const snap = await db
      .collection('partners')
      .doc(partnerId)
      .collection('businessModules')
      .where('moduleSlug', '==', moduleSlug)
      .limit(1)
      .get();

    if (snap.empty) return { success: true };

    const pmDoc = snap.docs[0];
    const pm = pmDoc.data() as Record<string, unknown>;

    const systemRes = await getSystemModuleAction(moduleSlug);
    if (!systemRes.success || !systemRes.data) return { success: true };

    const systemModule = systemRes.data;
    const fields = systemModule.schema.fields
      .slice(0, 5)
      .map((f) => f.name || f.id);

    return {
      success: true,
      match: {
        moduleId: pmDoc.id,
        moduleSlug,
        moduleName: systemModule.name,
        itemCount: typeof pm.itemCount === 'number' ? pm.itemCount : 0,
        createdAt: toIso(pm.createdAt),
        updatedAt: toIso(pm.updatedAt),
        fields,
      },
    };
  } catch (err) {
    console.error('[content-studio/module-match] failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Match failed',
    };
  }
}
