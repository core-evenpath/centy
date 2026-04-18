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
import { getBookingFlowTemplate } from '@/lib/relay/flow-templates/booking';
import { getCommerceFlowTemplate } from '@/lib/relay/flow-templates/commerce';
import { getLeadFlowTemplate } from '@/lib/relay/flow-templates/lead';
import { getEngagementFlowTemplate } from '@/lib/relay/flow-templates/engagement';
import type {
  ConversationFlowState,
  FlowDefinition,
} from '@/lib/types-flow-engine';
import type { Engine } from '@/lib/relay/engine-types';
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
  activeEngine: Engine | null,
): Promise<FlowDefinition | null> {
  try {
    const doc = await db
      .collection('partners')
      .doc(partnerId)
      .collection('relayConfig')
      .doc('flowDefinition')
      .get();
    if (doc.exists) {
      const data = doc.data() as FlowDefinition;
      // M12: if the partner has a custom flow AND an active engine is
      // set, scope by `flow.engine`. Custom flows without an engine are
      // treated as permissive (pre-pilot behavior).
      if (activeEngine && data.engine && data.engine !== activeEngine) {
        // Partner override is for a different engine — fall through to
        // engine-specific template lookup below.
      } else {
        return data;
      }
    }
  } catch {
    /* non-fatal */
  }
  // M12: engine-specific template resolution. When active engine is
  // 'booking', prefer the M05 booking flow templates (which use real
  // block ids from the engine-scoped registry). Otherwise fall through
  // to the legacy function-id template map.
  if (activeEngine === 'booking') {
    const bookingTpl = getBookingFlowTemplate(functionId);
    if (bookingTpl) return bookingTpl as unknown as FlowDefinition;
  }
  if (activeEngine === 'commerce') {
    const commerceTpl = getCommerceFlowTemplate(functionId);
    if (commerceTpl) return commerceTpl as unknown as FlowDefinition;
  }
  if (activeEngine === 'lead') {
    const leadTpl = getLeadFlowTemplate(functionId);
    if (leadTpl) return leadTpl as unknown as FlowDefinition;
  }
  if (activeEngine === 'engagement') {
    const engagementTpl = getEngagementFlowTemplate(functionId);
    if (engagementTpl) return engagementTpl as unknown as FlowDefinition;
  }
  const template = getFlowTemplateForFunction(functionId);
  return template ? (template as unknown as FlowDefinition) : null;
}

export async function loadFlowSignal(
  ctx: OrchestratorContext,
  functionId: string,
  activeEngine: Engine | null = null,
): Promise<FlowSignal> {
  const [flowState, flowDef] = await Promise.all([
    loadSavedFlowState(ctx.conversationId, ctx.partnerId),
    loadFlowDefinition(ctx.partnerId, functionId, activeEngine),
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
