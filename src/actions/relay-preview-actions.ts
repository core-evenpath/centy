'use server';

// Preview Copilot server actions (M13).
//
// Callers are the admin Preview panel at /admin/relay/health/preview.
// These actions are safe to expose to admin users — the runner itself
// enforces sandbox isolation via the `preview_` conversationId prefix +
// the `preview: true` flag on OrchestratorContext.

import {
  BOOKING_PREVIEW_SCRIPTS,
  getScriptById,
  type PreviewScript,
} from '@/lib/relay/preview/booking-scripts';
import { runPreviewScript, type PreviewRunResult } from '@/lib/relay/preview/script-runner';

export async function listPreviewScripts(): Promise<PreviewScript[]> {
  // Copy to satisfy `readonly` -> mutable array return signature. Cheap
  // since the total set is 40 items.
  return [...BOOKING_PREVIEW_SCRIPTS];
}

export async function runPreviewScriptAction(
  partnerId: string,
  scriptId: string,
): Promise<{ ok: true; result: PreviewRunResult } | { ok: false; error: string }> {
  try {
    const script = getScriptById(scriptId);
    if (!script) {
      return { ok: false, error: `Unknown script: ${scriptId}` };
    }
    const result = await runPreviewScript(partnerId, script);
    return { ok: true, result };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
