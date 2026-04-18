// Preview Copilot script runner (M13).
//
// Drives a PreviewScript through the production orchestrator in a
// sandboxed conversation. No fork of the orchestrator — we invoke
// the real `orchestrate()` so preview output matches production turn
// for turn (that's the acceptance contract for reproducibility).
//
// Isolation:
//   1. `ctx.preview = true` suppresses the `setActiveEngine` persistence
//      call inside the orchestrator.
//   2. conversationId is prefixed `preview_{partnerId}_{scriptId}_{nonce}`
//      so any residual writes land in isolated Firestore docs.
//   3. The M07 save-hook helper (`triggerHealthRecompute`) is NOT called
//      by the runner — Health stays shadow-mode on production partner
//      data only.
// No cleanup step required: preview_ conversationIds never collide with
// production. A future admin cleanup can sweep `preview_*` docs older
// than TTL if operators want to keep Firestore lean.

import 'server-only';

import { orchestrate } from '../orchestrator';
import type {
  OrchestratorContext,
  OrchestratorResponse,
} from '../orchestrator/types';
import type { PreviewScript } from './booking-scripts';
import type { CommercePreviewScript } from './commerce-scripts';

// Runner accepts either a Booking or Commerce script — both carry the
// same `turns: Array<{role:'user',content:string}>` shape (see Q8).
type AnyRunnablePreviewScript = PreviewScript | CommercePreviewScript;

export interface PreviewTurnResult {
  turnIndex: number;
  userMessage: string;
  blockId?: string;
  text: string;
  suggestions?: string[];
  activeEngine: OrchestratorResponse['signals']['intent'] extends never
    ? never
    : string | null | undefined;
  catalogSize: number;
  compositionPath: string;
  error?: string;
  elapsedMs: number;
}

export interface PreviewRunResult {
  scriptId: string;
  partnerId: string;
  conversationId: string;
  startedAt: number;
  turns: PreviewTurnResult[];
  totalElapsedMs: number;
}

function makeSandboxConversationId(partnerId: string, scriptId: string): string {
  // Low-entropy nonce; re-runs against the same script intentionally
  // produce different conversation ids so the per-turn flow engine
  // doesn't accumulate state across runs.
  const nonce = Math.random().toString(36).slice(2, 10);
  return `preview_${partnerId}_${scriptId}_${nonce}`;
}

export async function runPreviewScript(
  partnerId: string,
  script: AnyRunnablePreviewScript,
): Promise<PreviewRunResult> {
  const conversationId = makeSandboxConversationId(partnerId, script.id);
  const startedAt = Date.now();
  const turns: PreviewTurnResult[] = [];

  // Accumulate the conversation history as turns proceed. Each call to
  // `orchestrate()` sees the full prior history so intent + flow state
  // evolve naturally.
  const messages: OrchestratorContext['messages'] = [];

  for (let i = 0; i < script.turns.length; i++) {
    const userTurn = script.turns[i];
    messages.push(userTurn);

    const tTurnStart = Date.now();
    try {
      const ctx: OrchestratorContext = {
        partnerId,
        conversationId,
        messages: [...messages],
        preview: true,
      };
      const response = await orchestrate(ctx);

      // Accumulate the assistant reply for the next turn's context.
      messages.push({ role: 'assistant', content: response.text });

      turns.push({
        turnIndex: i,
        userMessage: userTurn.content,
        blockId: response.blockId,
        text: response.text,
        suggestions: response.suggestions,
        activeEngine: null, // orchestrator response doesn't bubble activeEngine; surfaced via telemetry log
        catalogSize: response.signals.allowedBlocks.length,
        compositionPath: response.signals.compositionPath,
        elapsedMs: Date.now() - tTurnStart,
      });
    } catch (err) {
      turns.push({
        turnIndex: i,
        userMessage: userTurn.content,
        text: '',
        activeEngine: null,
        catalogSize: 0,
        compositionPath: 'fallback',
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Date.now() - tTurnStart,
      });
      // Don't early-return: capture the failure but continue the rest
      // of the script so the reviewer sees the full attempt.
    }
  }

  return {
    scriptId: script.id,
    partnerId,
    conversationId,
    startedAt,
    turns,
    totalElapsedMs: Date.now() - startedAt,
  };
}
