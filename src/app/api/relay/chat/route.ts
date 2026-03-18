import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { queryWithGeminiRAG } from '@/lib/gemini-rag';
import { getRelayCORSHeaders, relayOptionsResponse } from '@/lib/relay-cors';
import { buildRelaySystemPrompt, parseRelayAIResponse, calculateLeadScore } from '@/lib/relay-ai';
import { resolveWidgetId } from '@/actions/relay-partner-actions';
import type { RelayBlockConfig, RelayConversation, RelayMessage } from '@/lib/types-relay';

async function getActiveBlockConfigs(industries: string[]): Promise<RelayBlockConfig[]> {
  if (!db) return [];

  try {
    const snapshot = await db
      .collection('relayBlockConfigs')
      .where('status', '==', 'active')
      .get();

    const configs = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as RelayBlockConfig)
    );

    // Filter to relevant industries
    if (industries.length > 0) {
      return configs.filter((c) =>
        c.applicableIndustries.some((ind) => industries.includes(ind)) ||
        c.applicableIndustries.length === 0
      );
    }

    return configs;
  } catch {
    return [];
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || undefined;
  return relayOptionsResponse(origin);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || undefined;
  const corsHeaders = getRelayCORSHeaders(origin);

  try {
    const body = await request.json();
    const { widgetId, visitorId, message, conversationId } = body as {
      widgetId: string;
      visitorId: string;
      message: string;
      conversationId?: string;
    };

    if (!widgetId || !visitorId || !message) {
      return NextResponse.json(
        { error: 'widgetId, visitorId, and message are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Resolve widget
    const resolved = await resolveWidgetId(widgetId);
    if (!resolved) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const { partnerId, config } = resolved;

    // Get partner's enabled modules to determine industries
    let industries: string[] = [];
    if (db) {
      try {
        const modulesSnapshot = await db
          .collection(`partners/${partnerId}/modules`)
          .where('enabled', '==', true)
          .limit(10)
          .get();

        // We'll just use all block configs if no module industry info
        industries = [];
      } catch { /* ignore */ }
    }

    // Get active relay block configs
    const blockConfigs = await getActiveBlockConfigs(industries);

    // Build system prompt
    const systemPrompt = buildRelaySystemPrompt(config, blockConfigs);

    // Query RAG with the relay-specific system prompt
    const ragResult = await queryWithGeminiRAG(partnerId, message, { systemInstruction: systemPrompt });

    const responseText = ragResult.success && ragResult.response
      ? ragResult.response
      : "I'm sorry, I don't have information about that right now. Would you like to contact us directly?";

    const block = parseRelayAIResponse(responseText);

    // Create or update conversation
    if (!db) {
      return NextResponse.json({ block, conversationId: 'no-db' }, { headers: corsHeaders });
    }

    const now = new Date().toISOString();
    const visitorMessage: RelayMessage = {
      id: `msg_${Date.now()}_v`,
      role: 'visitor',
      text: message,
      timestamp: now,
    };
    const botMessage: RelayMessage = {
      id: `msg_${Date.now()}_b`,
      role: 'bot',
      block,
      text: block.text,
      timestamp: new Date(Date.now() + 1).toISOString(),
    };

    let convId = conversationId;

    if (convId) {
      // Update existing conversation
      await db
        .collection(`partners/${partnerId}/relayConversations`)
        .doc(convId)
        .update({
          messages: FieldValue.arrayUnion(visitorMessage, botMessage),
          messageCount: FieldValue.increment(2),
          lastMessageAt: now,
          status: 'active',
        });
    } else {
      // Create new conversation
      const convRef = db
        .collection(`partners/${partnerId}/relayConversations`)
        .doc();
      convId = convRef.id;

      const newConv: Omit<RelayConversation, 'id'> = {
        partnerId,
        widgetId,
        visitorId,
        messages: [visitorMessage, botMessage],
        messageCount: 2,
        intentSignals: [],
        leadScore: 'cold',
        sourceUrl: request.headers.get('referer') || undefined,
        sourceDomain: origin || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        startedAt: now,
        lastMessageAt: now,
        status: 'active',
      };

      await convRef.set(newConv);
    }

    // Recalculate lead score
    const convDoc = await db
      .collection(`partners/${partnerId}/relayConversations`)
      .doc(convId)
      .get();

    if (convDoc.exists) {
      const convData = { id: convDoc.id, ...convDoc.data() } as RelayConversation;
      const newScore = calculateLeadScore(convData);
      if (newScore !== convData.leadScore) {
        await convDoc.ref.update({ leadScore: newScore });
      }
    }

    return NextResponse.json(
      { block, conversationId: convId },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Relay chat error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
