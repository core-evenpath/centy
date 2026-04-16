'use server';

// ── Activate AI collection ─────────────────────────────────────────────
//
// Writes two things when the partner approves "Activate AI collection":
//   1. A new partner module under `partners/{pid}/businessModules/{id}`
//      with prompt-driven custom fields and a flag marking it as
//      AI-collected.
//   2. A pointer under `partners/{pid}/relayConfig/aiCollectionPrompts`
//      keyed by featureId so the chat agent can look up which prompts
//      to ask when it sees that feature intent.
//
// The chat agent wiring that actually asks the prompts ships in a
// follow-up — this action only sets up the config.

import { db } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import type { GeneratedPrompt } from '@/app/partner/(protected)/relay/datamap/types';

export interface ActivateCollectionResult {
  success: boolean;
  moduleId?: string;
  moduleSlug?: string;
  error?: string;
}

function safeSlugSuffix(featureId: string): string {
  return featureId.toLowerCase().replace(/[^a-z0-9_]+/g, '_').slice(0, 40);
}

function truncateLabel(question: string, limit = 40): string {
  return question.length > limit ? `${question.slice(0, limit)}…` : question;
}

export async function activateAICollectionAction(
  partnerId: string,
  featureId: string,
  prompts: GeneratedPrompt[],
  suggestedModuleName: string,
): Promise<ActivateCollectionResult> {
  if (!partnerId || !featureId) {
    return { success: false, error: 'partnerId and featureId are required' };
  }
  if (!prompts.length) {
    return { success: false, error: 'At least one prompt is required' };
  }

  try {
    const moduleSlug = `ai_${safeSlugSuffix(featureId)}_${Date.now()}`;
    const now = new Date().toISOString();

    const pmRef = db
      .collection('partners')
      .doc(partnerId)
      .collection('businessModules')
      .doc();

    await pmRef.set({
      id: pmRef.id,
      partnerId,
      moduleSlug,
      name: suggestedModuleName,
      isCustom: true,
      aiCollectionEnabled: true,
      featureId,
      prompts: prompts.map((p) => ({ id: p.id, question: p.question })),
      itemCount: 0,
      createdAt: now,
      updatedAt: now,
      customFields: prompts.map((p, i) => ({
        id: `answer_${i}`,
        name: truncateLabel(p.question),
        type: 'textarea',
        isRequired: false,
        isSearchable: false,
        showInList: true,
        showInCard: false,
        order: i,
      })),
    });

    await db
      .collection('partners')
      .doc(partnerId)
      .collection('relayConfig')
      .doc('aiCollectionPrompts')
      .set(
        {
          [featureId]: {
            moduleId: pmRef.id,
            moduleSlug,
            prompts: prompts.map((p) => p.question),
            updatedAt: now,
          },
        },
        { merge: true },
      );

    try {
      revalidatePath('/partner/relay/datamap');
      revalidatePath('/partner/relay/modules');
    } catch {
      /* best-effort */
    }

    return { success: true, moduleId: pmRef.id, moduleSlug };
  } catch (err) {
    console.error('[content-studio/activate-collection] failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Activation failed',
    };
  }
}
