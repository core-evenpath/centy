import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { db as adminDb } from '@/lib/firebase-admin';
import {
    getAllowedBlocksForFunction,
    buildBlockCatalogPrompt,
} from '@/lib/relay/admin-block-registry';
import { buildBlockData } from '@/lib/relay/admin-block-data';
import {
    getPartnerModulesAction,
    getSystemModuleAction,
    getModuleItemsAction,
} from '@/actions/modules-actions';
import { createInitialFlowState, detectIntent, runFlowEngine } from '@/lib/flow-engine';
import { getFlowTemplateForFunction } from '@/lib/flow-templates';
import type { ConversationFlowState, FlowDefinition, FlowEngineDecision } from '@/lib/types-flow-engine';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const RELAY_CHAT_MODEL = 'gemini-3.1-pro-preview';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Relay-Widget-Id',
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// ── Relay chat route ─────────────────────────────────────────────────
//
// Gemini is used as a classifier + short copywriter. Given the visitor's
// conversation and a menu of admin-preview block IDs valid for this
// partner's sub-vertical, it returns `{ blockId?, text, suggestions }`.
// The UI then renders the admin preview component (self-contained,
// zero-prop design from `src/app/admin/relay/blocks/previews/**`). No
// RAG population, no partner data flowing into the chat card — the
// preview is a pure design primitive.

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { widgetId, conversationId, messages, partnerId: directPartnerId } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: 'Messages are required' }, { status: 400, headers: corsHeaders });
        }

        // Resolve partnerId from widgetId or direct param
        let partnerId = directPartnerId;
        if (!partnerId && widgetId) {
            const widgetDoc = await adminDb.collection('relayWidgets').doc(widgetId).get();
            if (widgetDoc.exists) partnerId = widgetDoc.data()?.partnerId;
        }
        if (!partnerId) {
            return NextResponse.json({ error: 'Could not resolve partner' }, { status: 400, headers: corsHeaders });
        }

        // ── CORE: partner doc (brand, persona, contact, hours, FAQs) ──────
        let partnerData: Record<string, any> | null = null;
        try {
            const partnerDoc = await adminDb.collection('partners').doc(partnerId).get();
            partnerData = partnerDoc.exists ? (partnerDoc.data() as Record<string, any>) : null;
        } catch { /* continue */ }

        const functionId: string =
            partnerData?.businessPersona?.identity?.businessCategories?.[0]?.functionId || 'general';

        // ── Flow Engine ──────────────────────────────────────────────────
        let flowDecision: FlowEngineDecision | null = null;
        try {
            let flowState: ConversationFlowState | null = null;
            if (conversationId) {
                const convDoc = await adminDb.collection('relayConversations').doc(conversationId).get();
                flowState = (convDoc.data()?.flowState as ConversationFlowState) || null;
            }
            if (!flowState) {
                flowState = createInitialFlowState(conversationId || `conv_${Date.now()}`, partnerId);
            }

            const lastMsg = messages[messages.length - 1]?.content || '';
            const priorHistory = messages.slice(0, -1).map((m: any) => ({
                role: m.role as string,
                content: m.content as string,
            }));
            const intent = detectIntent(lastMsg, priorHistory);

            let flowDef: FlowDefinition | null = null;
            const flowDoc = await adminDb
                .collection('partners').doc(partnerId)
                .collection('relayConfig').doc('flowDefinition')
                .get();
            if (flowDoc.exists) flowDef = flowDoc.data() as FlowDefinition;

            if (!flowDef) {
                const template = getFlowTemplateForFunction(functionId);
                if (template) flowDef = template as unknown as FlowDefinition;
            }
            flowDecision = runFlowEngine(flowState, intent, flowDef, functionId);
        } catch (flowErr) {
            console.error('Flow engine error (non-fatal):', flowErr);
        }

        // ── Partner modules + items (for data-driven block previews) ─────
        const modules: Array<{ slug: string; name: string; items: any[] }> = [];
        try {
            const partnerModulesResult = await getPartnerModulesAction(partnerId);
            const partnerModules = partnerModulesResult.success ? partnerModulesResult.data || [] : [];
            for (const pm of partnerModules.slice(0, 10)) {
                const systemResult = await getSystemModuleAction(pm.moduleSlug);
                if (!systemResult.success || !systemResult.data) continue;
                const itemsResult = await getModuleItemsAction(partnerId, pm.id, {
                    isActive: true,
                    pageSize: 20,
                    sortBy: 'sortOrder',
                    sortOrder: 'asc',
                });
                const items = itemsResult.success ? itemsResult.data?.items || [] : [];
                modules.push({ slug: pm.moduleSlug, name: systemResult.data.name, items });
            }
        } catch (modErr) {
            console.error('Module load error (non-fatal):', modErr);
        }

        // ── Allowed admin-preview blocks for this partner's sub-vertical ─
        const allowedBlocks = getAllowedBlocksForFunction(functionId);
        const allowedBlockIds = allowedBlocks.map(b => b.id);
        const blockCatalog = buildBlockCatalogPrompt(allowedBlocks);

        // ── CORE context for Gemini (persona + FAQs; NO item data) ───────
        const personaContext = buildPersonaContext(partnerData);
        const flowContext = flowDecision?.contextForAI ? `\n${flowDecision.contextForAI}\n\n` : '';

        const systemPrompt = `You are a helpful business assistant for a chat widget.
${flowContext}
${blockCatalog}

RESPONSE FORMAT — reply with ONLY valid JSON, no markdown, no backticks:
{
  "blockId": "<one id from the BLOCK CATALOG above, or omit if none fits>",
  "text": "1–3 warm, concise sentences that answer the visitor. Do NOT list product names, prices, or enumerate items — the chosen block design already shows sample content.",
  "suggestions": ["short follow-up 1", "short follow-up 2", "short follow-up 3"]
}

RULES:
- Pick the single most relevant \`blockId\` for the visitor's latest message. If nothing fits, omit it and answer with text only.
- \`text\` must be plain prose, never JSON.
- Always include 2–3 short \`suggestions\` the visitor could tap next.
- Match the visitor's language and tone.
${personaContext}`;

        // ── Call Gemini (classifier + short reply) ───────────────────────
        const conversationHistory = messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
        }));

        const response = await genAI.models.generateContent({
            model: RELAY_CHAT_MODEL,
            contents: conversationHistory,
            config: { systemInstruction: systemPrompt, maxOutputTokens: 2048, temperature: 0.3 },
        });

        const text = response.text?.trim() || '';
        const parsed = parseGeminiBlockResponse(text);

        // ── Validate blockId against allowed set ────────────────────────
        const rawBlockId = typeof parsed.blockId === 'string' ? parsed.blockId : undefined;
        const blockId = rawBlockId && allowedBlockIds.includes(rawBlockId) ? rawBlockId : undefined;

        const assistantText = typeof parsed.text === 'string' && parsed.text.trim()
            ? parsed.text.trim()
            : "I'm here to help — what would you like to know?";

        const suggestions = Array.isArray(parsed.suggestions)
            ? parsed.suggestions.filter((s: any) => typeof s === 'string').slice(0, 4)
            : [];

        // Build real `blockData` for the chosen preview (greeting,
        // product_card, contact, …). Previews fall back to their design
        // sample when `blockData` is undefined.
        const blockData = blockId
            ? buildBlockData({ blockId, partnerData, modules })
            : undefined;

        // Backward-compat payload: `type: 'text'` keeps the legacy widget
        // happy (it just renders text + suggestions); the new Test Chat
        // UI keys off `blockId` + `blockData` to render the admin preview
        // with real partner data.
        const responsePayload = {
            type: 'text' as const,
            blockId,
            blockData,
            text: assistantText,
            suggestions,
        };

        console.log('[Relay chat] blockId:', blockId, '| hasData:', !!blockData, '| modules:', modules.length);

        // Store conversation turn
        if (conversationId) {
            try {
                await adminDb.collection('relayConversations').doc(conversationId)
                    .collection('turns').add({
                        conversationId,
                        partnerId,
                        userMessage: messages[messages.length - 1]?.content || '',
                        assistantResponse: responsePayload,
                        createdAt: new Date().toISOString(),
                    });
            } catch (e) {
                console.error('Failed to store conversation turn:', e);
            }
        }

        if (conversationId && flowDecision) {
            adminDb.collection('relayConversations').doc(conversationId)
                .set({ flowState: flowDecision.updatedState }, { merge: true })
                .catch((e) => console.error('Failed to save flow state:', e));
        }

        return NextResponse.json({
            success: true,
            response: responsePayload,
            category: functionId,
            allowedBlockIds,
            conversationId: conversationId || `conv_${Date.now()}`,
            ...(flowDecision && {
                flowMeta: {
                    stageType: flowDecision.suggestedStageType,
                    leadTemperature: flowDecision.leadTemperature,
                    leadScore: flowDecision.leadScore,
                    suggestedBlockTypes: flowDecision.suggestedBlockTypes,
                    shouldHandoff: flowDecision.shouldHandoff,
                    interactionCount: flowDecision.updatedState.interactionCount,
                },
            }),
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Relay chat error:', error);
        return NextResponse.json(
            { error: 'Chat request failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500, headers: corsHeaders }
        );
    }
}

// ── Tolerant Gemini response parser ──────────────────────────────────
//
// Gemini occasionally wraps JSON in ```json fences, prefixes it with a
// natural-language preamble, or cuts off mid-string under a tight
// `maxOutputTokens`. We try several recovery strategies before giving
// up; if nothing parses we return a safe user-facing message rather
// than leaking raw model output into the chat bubble.

function parseGeminiBlockResponse(rawText: string): Record<string, any> {
    const text = rawText.trim();
    if (!text) return genericFallback();

    // Strategy 1: strip code fences, try direct parse.
    const stripped = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
    const direct = safeJsonParse(stripped);
    if (direct) return direct;

    // Strategy 2: isolate the first balanced {...} block and parse it.
    const extracted = extractFirstJsonObject(stripped);
    if (extracted) {
        const parsed = safeJsonParse(extracted);
        if (parsed) return parsed;
    }

    // Strategy 3: everything failed — Gemini likely truncated mid-token
    // or emitted prose. Don't dump raw output to the user.
    console.warn('[Relay chat] Gemini response did not parse as JSON:', text.slice(0, 200));
    return genericFallback();
}

function safeJsonParse(s: string): Record<string, any> | null {
    try {
        const v = JSON.parse(s);
        return v && typeof v === 'object' ? v : null;
    } catch {
        return null;
    }
}

// Walk the string tracking brace depth and string-state; return the
// first complete top-level {...} object. Handles escape sequences so
// that `"hello \"world\""` doesn't confuse the scanner.
function extractFirstJsonObject(s: string): string | null {
    const start = s.indexOf('{');
    if (start === -1) return null;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < s.length; i++) {
        const c = s[i];
        if (escape) { escape = false; continue; }
        if (c === '\\') { escape = true; continue; }
        if (c === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (c === '{') depth++;
        else if (c === '}') {
            depth--;
            if (depth === 0) return s.slice(start, i + 1);
        }
    }
    return null;
}

function genericFallback(): Record<string, any> {
    return {
        text: "I didn't quite catch that — could you rephrase your question?",
        suggestions: ['What do you offer?', 'Contact support', 'Learn more'],
    };
}

function buildPersonaContext(partnerData: Record<string, any> | null): string {
    const persona = partnerData?.businessPersona;
    if (!persona) return '';
    const identity = persona.identity || {};
    const knowledge = persona.knowledge || {};
    const parts: string[] = [];
    if (identity.name) parts.push(`Business: ${identity.name}`);
    if (identity.phone) parts.push(`Phone: ${identity.phone}`);
    if (identity.email) parts.push(`Email: ${identity.email}`);
    if (identity.website) parts.push(`Website: ${identity.website}`);
    if (identity.address) {
        const a = identity.address;
        parts.push(`Address: ${[a.street, a.city, a.state, a.country].filter(Boolean).join(', ')}`);
    }
    if (identity.operatingHours?.formatted) parts.push(`Hours: ${identity.operatingHours.formatted}`);
    if (knowledge?.faqs?.length) {
        parts.push('FAQs:\n' + knowledge.faqs.slice(0, 10).map((f: any) => `  Q: ${f.question}\n  A: ${f.answer}`).join('\n'));
    }
    return parts.length > 0 ? `\n\nBUSINESS PROFILE:\n${parts.join('\n')}` : '';
}
