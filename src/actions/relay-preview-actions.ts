'use server';

// Preview Copilot server actions (M13 + Q8).
//
// Callers are the admin Preview panel at /admin/relay/health/preview.
// These actions are safe to expose to admin users — the runner itself
// enforces sandbox isolation via the `preview_` conversationId prefix +
// the `preview: true` flag on OrchestratorContext.

import {
  ALL_PREVIEW_SCRIPTS,
  getAnyScriptById,
  type AnyPreviewScript,
} from '@/lib/relay/preview/scripts-index';
import { runPreviewScript, type PreviewRunResult } from '@/lib/relay/preview/script-runner';

export async function listPreviewScripts(): Promise<AnyPreviewScript[]> {
  // Copy to satisfy `readonly` -> mutable array return signature.
  return [...ALL_PREVIEW_SCRIPTS];
}

export async function runPreviewScriptAction(
  partnerId: string,
  scriptId: string,
): Promise<{ ok: true; result: PreviewRunResult } | { ok: false; error: string }> {
  try {
    const script = getAnyScriptById(scriptId);
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
