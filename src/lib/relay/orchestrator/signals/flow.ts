import 'server-only';

// ── Flow signal ────────────────────────────────────────────────────────
//
// Loads the partner's saved flow state (or creates a fresh one),
// resolves the flow definition (partner override → function template),
// detects intent from the latest message, and runs the flow engine.
// Returns both the raw decision and the pre-computed stage id/label so
// callers don't need to re-look-up the stage.

import { db } from '@/lib/firebase-admin';
import {
  createInitialFlowState,
  detectIntent,
  runFlowEngine,
} from '@/lib/flow-engine';
import { getFlowTemplateForFunction } from '@/lib/flow-templates';
import type {
  ConversationFlowState,
  FlowDefinition,
} from '@/lib/types-flow-engine';
import type { FlowSignal, OrchestratorContext } from '../types';

async function loadSavedFlowState(
  conversationId: string,
  partnerId: string,
): Promise<ConversationFlowState> {
  try {
    const convDoc = await db
      .collection('relayConversations')
      .doc(conversationId)
      .get();
    const saved = convDoc.data()?.flowState as
      | ConversationFlowState
      | undefined;
    if (saved) return saved;
  } catch {
    /* non-fatal */
  }
  return createInitialFlowState(conversationId, partnerId);
}

async function loadFlowDefinition(
  partnerId: string,
  functionId: string,
): Promise<FlowDefinition | null> {
  try {
    const doc = await db
      .collection('partners')
      .doc(partnerId)
      .collection('relayConfig')
      .doc('flowDefinition')
      .get();
    if (doc.exists) return doc.data() as FlowDefinition;
  } catch {
    /* non-fatal */
  }
  const template = getFlowTemplateForFunction(functionId);
  return template ? (template as unknown as FlowDefinition) : null;
}

export async function loadFlowSignal(
  ctx: OrchestratorContext,
  functionId: string,
): Promise<FlowSignal> {
  const [flowState, flowDef] = await Promise.all([
    loadSavedFlowState(ctx.conversationId, ctx.partnerId),
    loadFlowDefinition(ctx.partnerId, functionId),
  ]);

  const lastMsg = ctx.messages[ctx.messages.length - 1]?.content ?? '';
  const priorHistory = ctx.messages.slice(0, -1).map((m) => ({
    role: m.role,
    content: m.content,
  }));
  const intent = detectIntent(lastMsg, priorHistory);

  const flowDecision = flowDef
    ? runFlowEngine(flowState, intent, flowDef, functionId)
    : null;

  const nextState = flowDecision?.updatedState ?? flowState;
  const currentStageId = nextState.currentStageId ?? null;
  const currentStage = flowDef?.stages.find((s) => s.id === currentStageId);
  const suggestedBlockIds = flowDecision?.suggestedBlockTypes?.length
    ? Array.from(new Set(flowDecision.suggestedBlockTypes))
    : (currentStage?.blockTypes ?? []);

  return {
    flowDef,
    flowState: nextState,
    flowDecision,
    intent,
    currentStageId,
    currentStageLabel: currentStage?.label ?? null,
    suggestedBlockIds,
  };
}
