import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getRelayCORSHeaders, relayOptionsResponse } from '@/lib/relay-cors';
import { parseRelayAIResponse, calculateLeadScore } from '@/lib/relay-ai';
import { buildAIContext } from '@/lib/ai-context-builder';
import { buildSystemPrompt } from '@/lib/ai-prompt-builder';
import { GoogleGenAI } from '@google/genai';
import type { RelayConfig, RelayConversation, RelayMessage, RelayBlockType } from '@/lib/types-relay';
import { FieldValue } from 'firebase-admin/firestore';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function OPTIONS() {
  return relayOptionsResponse();
}

interface ChatRequest {
  widgetId: string;
  visitorId: string;
  message: string;
  conversationId?: string;
}

async function findPartnerByWidgetId(
  widgetId: string
): Promise<{ partnerId: string; config: RelayConfig } | null> {
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

/**
 * Builds the Relay-specific system prompt extension that instructs
 * Gemini to respond in JSON matching the RelayUIBlock schema.
 * This is appended AFTER the standard buildSystemPrompt() output.
 */
function buildRelaySystemPromptExtension(config: RelayConfig): string {
  const enabledIntents = config.intents
    .filter(i => i.enabled)
    .map(i => `- "${i.label}" (${i.icon}): when asked "${i.prompt}" → use "${i.uiBlock}" block type`)
    .join('\n');

  const blockTypeGuide = `
## RESPONSE FORMAT (CRITICAL)
You MUST respond with valid JSON matching this exact schema:
{
  "type": "<block_type>",
  "text": "<your natural language response — 2-4 sentences, friendly and helpful>",
  "items": [...],       // optional: array of structured objects for rich rendering
  "suggestions": ["Question 1?", "Question 2?", "Question 3?"]  // always include 2-3 follow-up prompts
}

Valid block types:
- "rooms"      → when asked about rooms, accommodation, suites, pricing
- "book"       → when visitor wants to make a booking or reservation
- "compare"    → when comparing multiple options side by side
- "activities" → when asked about activities, experiences, tours, services
- "location"   → when asked about location, directions, address, how to get there
- "contact"    → when visitor wants to speak to staff, get contact info, or needs direct help
- "gallery"    → when showing photos, images, visual content
- "info"       → general information presented as structured key-value data
- "menu"       → food/beverage items with pricing
- "services"   → service catalog with pricing
- "text"       → general conversational responses, FAQs, open-ended questions

## INTENT MAPPINGS
${enabledIntents || 'Use the most appropriate block type based on the visitor question.'}

## CRITICAL RULES
1. ALWAYS return valid JSON — never plain text
2. Keep "text" concise and warm (2-4 sentences)
3. When "items" are included, each item should have: name, description, price (if applicable)
4. Always include 2-3 follow-up "suggestions"
5. Use "contact" block when the visitor seems frustrated or needs human help
6. When in doubt, use "text" block type`;

  if (config.systemPrompt) {
    return `\n\n## CUSTOM INSTRUCTIONS\n${config.systemPrompt}${blockTypeGuide}`;
  }

  return blockTypeGuide;
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

    // 1. Resolve widgetId → partnerId + config
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

    // 2. Build previous conversation messages for history context
    let conversationHistoryText = '';
    if (conversationId) {
      try {
        const convDoc = await db
          .collection(`partners/${partnerId}/relayConversations`)
          .doc(conversationId)
          .get();

        if (convDoc.exists) {
          const convData = convDoc.data() as RelayConversation;
          const recentMessages = (convData.messages || []).slice(-6); // Last 3 exchanges
          if (recentMessages.length > 0) {
            conversationHistoryText = recentMessages
              .map(m =>
                m.role === 'visitor'
                  ? `Visitor: ${m.text || ''}`
                  : `Assistant: ${m.block?.text || ''}`
              )
              .join('\n');
          }
        }
      } catch {
        // Non-critical — proceed without history
      }
    }

    // 3. Build AI context using the SAME pipeline as /partner/inbox
    //    This fetches: business profile, module items, RAG docs from vault
    let aiContext;
    try {
      aiContext = await buildAIContext({
        partnerId,
        customerMessage: message,
        maxHistoryMessages: 0, // We handle relay history separately above
        maxRagResults: 5,
      });
    } catch (contextError) {
      console.error('[Relay Chat] buildAIContext failed:', contextError);
      // Return a graceful fallback
      const fallbackBlock = parseRelayAIResponse(
        JSON.stringify({
          type: 'text',
          text: "I'm here to help! I'm having a moment connecting to the knowledge base — please try again.",
          suggestions: ['Try again', 'Contact us directly'],
        })
      );
      return NextResponse.json(
        { block: fallbackBlock, conversationId },
        { status: 200, headers: getRelayCORSHeaders(config.embedDomain) }
      );
    }

    // 4. Build the full system prompt:
    //    Standard business context (from ai-prompt-builder) + Relay JSON schema instructions
    const baseSystemPrompt = buildSystemPrompt(aiContext);
    const relayExtension = buildRelaySystemPromptExtension(config);
    const fullSystemPrompt = baseSystemPrompt + relayExtension;

    // 5. Build the user message with conversation history
    const userMessage = conversationHistoryText
      ? `## CONVERSATION HISTORY\n${conversationHistoryText}\n\n## CURRENT VISITOR MESSAGE\nVisitor: "${message}"\n\nRespond in the required JSON format.`
      : `Visitor: "${message}"\n\nRespond in the required JSON format.`;

    // 6. Call Gemini — same model as inbox (gemini-3-pro-preview)
    const geminiResult = await genAI.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: userMessage,
      config: {
        systemInstruction: fullSystemPrompt,
        temperature: 0.7,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    });

    const rawResponse = geminiResult.text || '';

    // 7. Parse AI response into a RelayUIBlock
    const block = parseRelayAIResponse(rawResponse);

    // 8. Create/update conversation in Firestore
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
      timestamp: new Date(Date.now() - 50).toISOString(),
    };

    let activeConversationId = conversationId;

    if (conversationId) {
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

      // Update analytics counter
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
