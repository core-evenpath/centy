import 'server-only';

// ── RAG retrieval signal ──────────────────────────────────────────────
//
// Pulls top-k knowledge chunks from Firestore when the intent or cue
// keywords suggest a factual answer. Transactional intents skip RAG
// entirely to save tokens + latency.

import { ai } from '@/ai/genkit';
import {
  RAGINDEX_COLLECTION_NAME,
  firestoreRetriever,
} from '@/ai/fireRagSetup';
import type { IntentSignal } from '@/lib/types-flow-engine';
import type { OrchestratorContext, RagSignal } from '../types';

// IntentSignal values that should get a RAG lookup.
const FACTUAL_INTENTS = new Set<IntentSignal>([
  'inquiry',
  'complaint',
  'returning',
  'location',
  'contact',
]);

// Hard cues in free-form text that flip on RAG even when the intent
// classifier picks something else.
const FACTUAL_CUES = [
  'how do you',
  'what is your',
  'what are your',
  'do you',
  'are you',
  'can i',
  'policy',
  'hours',
  'refund',
  'shipping',
  'warranty',
  'return',
];

const TOP_K = 4;

export function shouldUseRag(
  intent: IntentSignal | null,
  userMessage: string,
): boolean {
  if (intent && FACTUAL_INTENTS.has(intent)) return true;
  const lower = userMessage.toLowerCase();
  return FACTUAL_CUES.some((c) => lower.includes(c));
}

interface RetrievedDoc {
  text?: string;
  content?: Array<{ text?: string }>;
  metadata?: { source?: string; title?: string; score?: number };
}

export async function loadRagSignal(
  ctx: OrchestratorContext,
  intent: IntentSignal | null,
): Promise<RagSignal> {
  const lastMsg = ctx.messages[ctx.messages.length - 1]?.content ?? '';

  if (ctx.skipRag) {
    return { used: false, query: lastMsg, chunks: [], reason: 'skipped-flag' };
  }
  if (!shouldUseRag(intent, lastMsg)) {
    return {
      used: false,
      query: lastMsg,
      chunks: [],
      reason: 'skipped-transactional',
    };
  }

  try {
    const retriever = firestoreRetriever(RAGINDEX_COLLECTION_NAME);
    const docs = (await ai.retrieve({
      retriever,
      query: lastMsg,
      options: {
        k: TOP_K,
        where: { partnerId: ctx.partnerId },
      },
    })) as RetrievedDoc[];

    if (!docs || docs.length === 0) {
      return { used: false, query: lastMsg, chunks: [], reason: 'empty-result' };
    }

    const chunks = docs
      .map((d) => ({
        text: d.text ?? d.content?.[0]?.text ?? '',
        source: d.metadata?.source ?? d.metadata?.title,
        score: d.metadata?.score,
      }))
      .filter((c) => c.text.length > 0);

    if (chunks.length === 0) {
      return { used: false, query: lastMsg, chunks: [], reason: 'empty-result' };
    }

    return { used: true, query: lastMsg, chunks, reason: 'factual-intent' };
  } catch (err) {
    console.error('[orchestrator/rag] retrieval failed:', err);
    return { used: false, query: lastMsg, chunks: [], reason: 'no-index' };
  }
}
