import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getRelayCORSHeaders, relayOptionsResponse } from '@/lib/relay-cors';
import { buildRelaySystemPrompt, parseRelayAIResponse, calculateLeadScore } from '@/lib/relay-ai';
import { queryWithGeminiRAG } from '@/lib/gemini-rag';
import type { RelayConfig, RelayBlockConfig, RelayConversation, RelayMessage } from '@/lib/types-relay';
import { FieldValue } from 'firebase-admin/firestore';

export async function OPTIONS() {
  return relayOptionsResponse();
}

interface ChatRequest {
  widgetId: string;
  visitorId: string;
  message: string;
  conversationId?: string;
}

async function findPartnerByWidgetId(widgetId: string): Promise<{ partnerId: string; config: RelayConfig } | null> {
  const partnersSnapshot = await db.collection('partners').limit(200).get();

  for (const partnerDoc of partnersSnapshot.docs) {
    const configSnapshot = await db
      .collection(`partners/${partnerDoc.id}/relayConfig`)
      .where('widgetId', '==', widgetId)
      .limit(1)
      .get();

    if (!configSnapshot.empty) {
      const configDoc = configSnapshot.docs[0];
      return {
        partnerId: partnerDoc.id,
        config: { id: configDoc.id, ...configDoc.data() } as RelayConfig,
      };
    }
  }
  return null;
}

async function getActiveBlockConfigs(applicableIndustries?: string[]): Promise<RelayBlockConfig[]> {
  try {
    const snapshot = await db
      .collection('relayBlockConfigs')
      .where('status', '==', 'active')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as RelayBlockConfig);
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { widgetId, visitorId, message, conversationId } = body;

    if (!widgetId || !visitorId || !message) {
      return NextResponse.json(
        { error: 'widgetId, visitorId, and message are required' },
        { status: 400, headers: getRelayCORSHeaders() }
      );
    }

    // Resolve widgetId → partnerId + config
    const partner = await findPartnerByWidgetId(widgetId);
    if (!partner) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404, headers: getRelayCORSHeaders() }
      );
    }

    if (!partner.config.enabled) {
      return NextResponse.json(
        { error: 'Widget is not active' },
        { status: 403, headers: getRelayCORSHeaders(partner.config.embedDomain) }
      );
    }

    const { partnerId, config } = partner;

    // Load active block configs
    const blockConfigs = await getActiveBlockConfigs();

    // Build system prompt
    const systemPrompt = buildRelaySystemPrompt(config, blockConfigs);

    // Build the full question with system prompt context
    const fullQuestion = `${systemPrompt}\n\n---\nVisitor question: ${message}\n\nRespond with valid JSON matching the RelayUIBlock schema.`;

    // Call the RAG pipeline (same as inbox)
    const ragResult = await queryWithGeminiRAG(partnerId, fullQuestion);

    let block = parseRelayAIResponse(
      ragResult.response || JSON.stringify({
        type: 'text',
        text: "I'm here to help! Could you tell me more about what you're looking for?",
        suggestions: ['Tell me about rooms', 'Book a stay', 'Contact us'],
      })
    );

    // Create/update conversation
    const convPath = `partners/${partnerId}/relayConversations`;
    const now = new Date().toISOString();

    const botMessage: RelayMessage = {
      id: `bot-${Date.now()}`,
      role: 'bot',
      block,
      timestamp: now,
    };

    const visitorMessage: RelayMessage = {
      id: `vis-${Date.now()}`,
      role: 'visitor',
      text: message,
      timestamp: new Date(Date.now() - 100).toISOString(), // Slightly before bot response
    };

    let activeConversationId = conversationId;

    if (conversationId) {
      // Update existing conversation
      const convRef = db.collection(convPath).doc(conversationId);
      const convDoc = await convRef.get();

      if (convDoc.exists) {
        const existingData = convDoc.data() as RelayConversation;
        const updatedMessages = [...(existingData.messages || []), visitorMessage, botMessage];
        const updatedIntentSignals = [
          ...new Set([...(existingData.intentSignals || []), block.type]),
        ];

        const partialConv: Partial<RelayConversation> = {
          messages: updatedMessages,
          messageCount: updatedMessages.length,
          lastMessageAt: now,
          intentSignals: updatedIntentSignals,
          status: 'active',
        };

        partialConv.leadScore = calculateLeadScore({
          ...existingData,
          ...partialConv,
        } as RelayConversation);

        await convRef.update(partialConv);
      }
    } else {
      // Create new conversation
      const newConv: Omit<RelayConversation, 'id'> = {
        partnerId,
        widgetId,
        visitorId,
        messages: [visitorMessage, botMessage],
        messageCount: 2,
        intentSignals: [block.type],
        leadScore: 'cold',
        startedAt: now,
        lastMessageAt: now,
        status: 'active',
      };

      newConv.leadScore = calculateLeadScore(newConv as RelayConversation);

      const convRef = await db.collection(convPath).add(newConv);
      activeConversationId = convRef.id;

      // Update analytics
      try {
        await db
          .collection(`partners/${partnerId}/relayConfig`)
          .doc(config.id)
          .update({ totalConversations: FieldValue.increment(1) });
      } catch {
        // Non-critical
      }
    }

    return NextResponse.json(
      { block, conversationId: activeConversationId },
      { status: 200, headers: getRelayCORSHeaders(config.embedDomain) }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error';
    console.error('[Relay Chat API]', message);
    return NextResponse.json(
      { error: message },
      { status: 500, headers: getRelayCORSHeaders() }
    );
  }
}
