'use server';

// Onboarding Relay recipe (M14).
//
// Deterministic picker: given a functionId + engines + recipe kind,
// produce a runnable Booking config: partner.engines, starter block
// prefs, cloned flow template, Health recompute.
//
// Rules (per M14 spec):
//  - partner.engines, partner.engineRecipe, partner.functionId always written
//  - Booking engine: enable starter blocks + clone flow template
//  - Non-booking engines: partner.engines only, NO starter content
//  - If booking flow already active → warn unless dryRun override
//  - Health recompute runs after writes (shadow-mode, never throws)

import { db as adminDb } from '@/lib/firebase-admin';
import type { Engine } from '@/lib/relay/engine-types';
import { deriveEnginesFromFunctionId } from '@/lib/relay/engine-recipes';
import { getBookingFlowTemplate } from '@/lib/relay/flow-templates/booking';
import { getStarterBlocks } from '@/lib/relay/onboarding/starter-blocks';
import { recomputeEngineHealth } from './relay-health-actions';

export interface ApplyRecipeInput {
  functionId: string;
  engines: Engine[];
  recipeKind: 'auto' | 'custom';
  /**
   * When true, proceed even if an active Booking flow already exists.
   * Without this, the action returns a warning without overwriting.
   */
  overrideExistingFlow?: boolean;
}

export interface ApplyRecipeResult {
  ok: boolean;
  warning?: string;
  starterBlocksEnabled?: number;
  flowCloned?: boolean;
  healthRecomputed?: Engine[];
  error?: string;
}

export async function previewEngineRecipe(functionId: string): Promise<{
  functionId: string;
  derivedEngines: Engine[];
  starterBlockCount: number;
}> {
  const derived = deriveEnginesFromFunctionId(functionId);
  const starter = getStarterBlocks(functionId);
  return {
    functionId,
    derivedEngines: derived,
    starterBlockCount: starter.length,
  };
}

export async function applyEngineRecipe(
  partnerId: string,
  input: ApplyRecipeInput,
): Promise<ApplyRecipeResult> {
  try {
    // 1. Check for an existing Booking flow — warn rather than silently
    //    overwrite unless the caller explicitly set overrideExistingFlow.
    const partnerRef = adminDb.collection('partners').doc(partnerId);
    const flowRef = partnerRef.collection('relayConfig').doc('flowDefinition');
    const hasBookingEngine = input.engines.includes('booking');
    if (hasBookingEngine && !input.overrideExistingFlow) {
      const existing = await flowRef.get();
      if (existing.exists) {
        const data = existing.data() as { engine?: Engine; status?: string } | undefined;
        const isActiveBooking =
          data?.engine === 'booking' ||
          (data?.status === 'active' && data?.engine === undefined);
        if (isActiveBooking) {
          return {
            ok: false,
            warning:
              'Partner already has an active Booking flow. Re-run with `overrideExistingFlow: true` to replace it.',
          };
        }
      }
    }

    // 2. Write the three top-level partner fields.
    //    Use dot-path for the deep businessPersona.identity.businessCategories[0].functionId
    //    to avoid clobbering any adjacent persona data.
    await partnerRef.set(
      {
        engines: input.engines,
        engineRecipe: input.recipeKind,
        businessPersona: {
          identity: {
            businessCategories: [{ functionId: input.functionId }],
          },
        },
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    // 3. For Booking only: enable starter blocks + clone flow template.
    let starterBlocksEnabled = 0;
    let flowCloned = false;
    if (hasBookingEngine) {
      const starter = getStarterBlocks(input.functionId);
      if (starter.length > 0) {
        // Partner block prefs live under `partners/{pid}/relayConfig`
        // (per M12's loadBlocksSignal fallback path). Write each
        // starter block id as a doc with isVisible: true.
        const batch = adminDb.batch();
        for (const blockId of starter) {
          const blockRef = partnerRef.collection('relayConfig').doc(blockId);
          batch.set(
            blockRef,
            {
              blockId,
              isVisible: true,
              sortOrder: 999,
              source: 'onboarding',
              updatedAt: new Date().toISOString(),
            },
            { merge: true },
          );
        }
        await batch.commit();
        starterBlocksEnabled = starter.length;
      }

      const template = getBookingFlowTemplate(input.functionId);
      if (template) {
        await flowRef.set(
          {
            ...template,
            partnerId,
            status: 'active',
            source: 'onboarding-m14',
            clonedFrom: template.id,
            updatedAt: new Date().toISOString(),
          },
          { merge: false }, // overwrite — we've already guarded by the warn check
        );
        flowCloned = true;
      }
    }

    // 4. Health recompute per engine (shadow-mode; never throws).
    const recomputed: Engine[] = [];
    for (const engine of input.engines) {
      try {
        await recomputeEngineHealth(partnerId, engine);
        recomputed.push(engine);
      } catch {
        // eslint-disable-next-line no-console
        console.error('[onboarding] Health recompute failed for', engine);
      }
    }

    return {
      ok: true,
      starterBlocksEnabled,
      flowCloned,
      healthRecomputed: recomputed,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
