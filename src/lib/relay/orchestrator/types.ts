// ── Orchestrator types ─────────────────────────────────────────────────
//
// Shared shapes consumed by `orchestrator/index.ts`, every signal
// loader, the policy layer, and the thin chat route. Pure types — no
// React, no Firestore imports — so anything upstream or downstream
// (API routes, hooks, debug panels) can import safely.

import type {
  ConversationFlowState,
  FlowDefinition,
  FlowEngineDecision,
  IntentSignal,
} from '@/lib/types-flow-engine';
import type { RelaySession } from '@/lib/relay/session-types';
import type { OrderSummary } from '@/lib/relay/order-types';

// ── Input ───────────────────────────────────────────────────────────

export interface OrchestratorContext {
  partnerId: string;
  conversationId: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  /** Force-disable RAG retrieval even when the intent would qualify. */
  skipRag?: boolean;
}

// ── Signal bundle ───────────────────────────────────────────────────

export interface PartnerSignal {
  partnerId: string;
  partnerData: Record<string, unknown> | null;
  functionId: string;
  modules: Array<{ slug: string; name: string; items: unknown[] }>;
}

export interface FlowSignal {
  flowDef: FlowDefinition | null;
  flowState: ConversationFlowState;
  flowDecision: FlowEngineDecision | null;
  intent: IntentSignal | null;
  currentStageId: string | null;
  currentStageLabel: string | null;
  /** Block ids suggested for the current stage by the flow engine. */
  suggestedBlockIds: string[];
}

export interface PartnerBlockPref {
  blockId: string;
  isVisible: boolean;
  customLabel?: string;
  customDescription?: string;
  sortOrder?: number;
}

export interface BlocksSignal {
  /** All partner block prefs keyed by blockId. */
  prefs: Record<string, PartnerBlockPref>;
  /** Block ids the partner has explicitly marked visible (sorted). */
  visibleBlockIds: string[];
  /** True when the partner actually has block prefs; false means permissive. */
  hasPrefs: boolean;
}

export interface DatamapSignal {
  readyBlockIds: string[];
  darkBlockIds: string[];
  /** True when the partner has any content-studio state at all. */
  hasState: boolean;
}

export interface SessionSignal {
  session: RelaySession | null;
  cartItemCount: number;
  cartTotal: number;
  hasCart: boolean;
  hasBookingHold: boolean;
  recentOrders: OrderSummary[];
}

export interface RagChunk {
  text: string;
  source?: string;
  score?: number;
}

export type RagSkipReason =
  | 'factual-intent'
  | 'skipped-transactional'
  | 'skipped-flag'
  | 'no-index'
  | 'empty-result';

export interface RagSignal {
  used: boolean;
  query: string;
  chunks: RagChunk[];
  reason: RagSkipReason;
}

export interface SignalBundle {
  partner: PartnerSignal;
  flow: FlowSignal;
  blocks: BlocksSignal;
  datamap: DatamapSignal;
  session: SessionSignal;
  rag: RagSignal;
}

// ── Policy decision ────────────────────────────────────────────────

export type CompositionPath =
  | 'rag_only'
  | 'block_only'
  | 'block_with_rag'
  | 'fallback';

export interface RejectedBlock {
  blockId: string;
  reason: string;
}

export interface PolicyDecision {
  allowedBlockIds: string[];
  rejectedBlocks: RejectedBlock[];
  boostedBlockIds: string[];
  compositionPath: CompositionPath;
}

// ── Orchestrator response (what the chat route returns to clients) ──

export interface OrchestratorFlowMeta {
  stageId: string | null;
  stageLabel: string | null;
  stageType?: string;
  leadTemperature?: string;
  interactionCount?: number;
  suggestedBlockTypes: string[];
}

export interface OrchestratorSignalsDebug {
  intent: IntentSignal | null;
  ragUsed: boolean;
  ragReason: RagSkipReason;
  ragSources: number;
  cartItems: number;
  hasOrders: boolean;
  allowedBlocks: string[];
  rejectedBlocks: RejectedBlock[];
  compositionPath: CompositionPath;
}

export interface OrchestratorResponse {
  blockId?: string;
  blockData?: unknown;
  text: string;
  suggestions?: string[];
  flowMeta: OrchestratorFlowMeta;
  signals: OrchestratorSignalsDebug;
  /** Persist back to `relayConversations/{cid}.flowState`. */
  updatedFlowState: ConversationFlowState | null;
}
