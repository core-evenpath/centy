import { NextRequest, NextResponse } from 'next/server';
import { db as adminDb } from '@/lib/firebase-admin';
import { orchestrate } from '@/lib/relay/orchestrator';

// ── /api/relay/chat ───────────────────────────────────────────────────
//
// Thin HTTP adapter over `orchestrate()`. Everything about block
// selection, RAG retrieval, cart awareness, and flow-stage policy
// lives in `src/lib/relay/orchestrator/` — this file only resolves
// `partnerId` from the widget, persists the conversation turn +
// updated flow state, and keeps the legacy response shape so existing
// clients don't break.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Relay-Widget-Id',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

interface ChatBody {
  widgetId?: string;
  conversationId?: string;
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  partnerId?: string;
  skipRag?: boolean;
}

export async function POST(request: NextRequest) {
  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: corsHeaders },
    );
  }

  const { widgetId, conversationId, messages, skipRag } = body;
  let { partnerId } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'Messages are required' },
      { status: 400, headers: corsHeaders },
    );
  }

  if (!partnerId && widgetId) {
    try {
      const widgetDoc = await adminDb
        .collection('relayWidgets')
        .doc(widgetId)
        .get();
      if (widgetDoc.exists) {
        partnerId = widgetDoc.data()?.partnerId as string | undefined;
      }
    } catch {
      /* non-fatal */
    }
  }

  if (!partnerId) {
    return NextResponse.json(
      { error: 'Could not resolve partner' },
      { status: 400, headers: corsHeaders },
    );
  }

  const resolvedConversationId = conversationId || `conv_${Date.now()}`;

  try {
    const result = await orchestrate({
      partnerId,
      conversationId: resolvedConversationId,
      messages,
      skipRag,
    });

    // Persist the turn for admin conversation history. Non-blocking so
    // the response isn't gated on the write.
    adminDb
      .collection('relayConversations')
      .doc(resolvedConversationId)
      .collection('turns')
      .add({
        conversationId: resolvedConversationId,
        partnerId,
        userMessage: messages[messages.length - 1]?.content || '',
        assistantResponse: {
          blockId: result.blockId,
          blockData: result.blockData,
          text: result.text,
          suggestions: result.suggestions,
        },
        flowMeta: result.flowMeta,
        signals: result.signals,
        createdAt: new Date().toISOString(),
      })
      .catch((e) => console.error('[relay chat] turn write failed:', e));

    if (result.updatedFlowState) {
      adminDb
        .collection('relayConversations')
        .doc(resolvedConversationId)
        .set(
          { flowState: result.updatedFlowState, partnerId },
          { merge: true },
        )
        .catch((e) => console.error('[relay chat] flow-state write failed:', e));
    }

    return NextResponse.json(
      {
        success: true,
        // Legacy response shape (consumed by Test Chat, live widget,
        // and the public RelayFullPage).
        response: {
          type: 'text' as const,
          blockId: result.blockId,
          blockData: result.blockData,
          text: result.text,
          suggestions: result.suggestions,
        },
        category: result.flowMeta.stageType,
        allowedBlockIds: result.signals.allowedBlocks,
        conversationId: resolvedConversationId,
        flowMeta: result.flowMeta,
        // Additive: full orchestrator signals for the Test Chat debug panel.
        signals: result.signals,
      },
      { headers: corsHeaders },
    );
  } catch (err) {
    console.error('[relay chat] orchestrator failed:', err);
    return NextResponse.json(
      {
        error: 'Chat request failed',
        details: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders },
    );
  }
}
