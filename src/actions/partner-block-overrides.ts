'use server';

// ── Partner block overrides (Phase 2) ────────────────────────────────
//
// "Default-enabled" block visibility for partners. Storage is minimal:
// a single `disabledBlockIds` array on the partner doc. Absence /
// empty array means every consumer block is visible (the default).
// We persist only the *opt-out* set — keeps the data model explicit
// (no per-block doc to seed, no migration when admin adds new blocks).
//
// Read path applies this in two places:
//   • orchestrator/index.ts subtracts from `policy.allowedBlockIds`
//   • api/relay/chat/seed/route.ts filters entryStage.blockTypes
// Both call sites already load the partner doc, so the read is free.

import { db as adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface LoadDisabledBlocksResult {
  success: boolean;
  /** Disabled block ids — empty array when nothing has been overridden. */
  disabled: string[];
  error?: string;
}

export async function loadPartnerDisabledBlocksAction(
  partnerId: string,
): Promise<LoadDisabledBlocksResult> {
  try {
    if (!partnerId) {
      return { success: false, disabled: [], error: 'partnerId is required' };
    }
    const doc = await adminDb.collection('partners').doc(partnerId).get();
    if (!doc.exists) {
      return { success: true, disabled: [] };
    }
    const data = doc.data() as { disabledBlockIds?: unknown };
    const raw = data?.disabledBlockIds;
    const disabled = Array.isArray(raw)
      ? raw.filter((v): v is string => typeof v === 'string' && v.length > 0)
      : [];
    return { success: true, disabled };
  } catch (err: any) {
    console.error('[partner-block-overrides] load failed:', err);
    return { success: false, disabled: [], error: err?.message ?? 'unknown' };
  }
}

export interface SetBlockEnabledResult {
  success: boolean;
  /** Resulting disabled set after the toggle, for optimistic UI sync. */
  disabled?: string[];
  error?: string;
}

export async function setPartnerBlockEnabledAction(
  partnerId: string,
  blockId: string,
  enabled: boolean,
  userId: string,
): Promise<SetBlockEnabledResult> {
  try {
    if (!partnerId) return { success: false, error: 'partnerId is required' };
    if (!blockId) return { success: false, error: 'blockId is required' };

    const ref = adminDb.collection('partners').doc(partnerId);
    const stamp = new Date().toISOString();
    // arrayUnion / arrayRemove are atomic at the Firestore level — safer
    // than read-modify-write under concurrent toggles. blockOverridesAt
    // gives us a single timestamp the partner page can show as
    // "last edited <relative>" without needing per-block metadata.
    if (enabled) {
      await ref.set(
        {
          disabledBlockIds: FieldValue.arrayRemove(blockId),
          blockOverridesAt: stamp,
          blockOverridesBy: userId,
        },
        { merge: true },
      );
    } else {
      await ref.set(
        {
          disabledBlockIds: FieldValue.arrayUnion(blockId),
          blockOverridesAt: stamp,
          blockOverridesBy: userId,
        },
        { merge: true },
      );
    }

    // Re-read to return the canonical post-write set. Confirms the write
    // landed and gives the client an authoritative state to reconcile
    // against any in-flight optimistic updates.
    const doc = await ref.get();
    const data = doc.data() as { disabledBlockIds?: unknown } | undefined;
    const raw = data?.disabledBlockIds;
    const disabled = Array.isArray(raw)
      ? raw.filter((v): v is string => typeof v === 'string' && v.length > 0)
      : [];

    return { success: true, disabled };
  } catch (err: any) {
    console.error('[partner-block-overrides] set failed:', err);
    return { success: false, error: err?.message ?? 'unknown' };
  }
}
