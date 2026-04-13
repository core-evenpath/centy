import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { db as adminDb } from '@/lib/firebase-admin';
import {
    getPartnerModulesAction,
    getSystemModuleAction,
    getModuleItemsAction,
} from '@/actions/modules-actions';
import { getActiveBlocksForPartner, buildBlockSchemasFromConfigs, getGlobalBlockConfigs } from '@/lib/relay/block-config-service';
import { createInitialFlowState, detectIntent, runFlowEngine } from '@/lib/flow-engine';
import { getFlowTemplateForFunction } from '@/lib/flow-templates';
import type { ConversationFlowState, FlowDefinition, FlowEngineDecision } from '@/lib/types-flow-engine';
import { buildSessionData, populateBlock } from '@/lib/relay/rag-populator';
import type { ModuleAgentConfig } from '@/lib/modules/types';

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

            const functionId = partnerData?.businessPersona?.identity?.businessCategories?.[0]?.functionId || 'general';
            if (!flowDef) {
                const template = getFlowTemplateForFunction(functionId);
                if (template) flowDef = template as unknown as FlowDefinition;
            }
            flowDecision = runFlowEngine(flowState, intent, flowDef, functionId);
        } catch (flowErr) {
            console.error('Flow engine error (non-fatal):', flowErr);
        }

        // ── MODULES: enabled modules + items (no details to Gemini) ──────
        const moduleConfigs: Array<{ slug: string; name: string; items: any[]; summary: string }> = [];
        const agentConfigMap = new Map<string, ModuleAgentConfig>();
        const partnerModulesResult = await getPartnerModulesAction(partnerId);
        const partnerModules = partnerModulesResult.success ? partnerModulesResult.data || [] : [];

        for (const pm of partnerModules.slice(0, 10)) {
            const systemResult = await getSystemModuleAction(pm.moduleSlug);
            if (!systemResult.success || !systemResult.data) continue;
            if (systemResult.data.agentConfig) {
                agentConfigMap.set(pm.moduleSlug, systemResult.data.agentConfig);
            }
            const itemsResult = await getModuleItemsAction(partnerId, pm.id, {
                isActive: true,
                pageSize: 20,
                sortBy: 'sortOrder',
                sortOrder: 'asc',
            });
            const items = itemsResult.success ? itemsResult.data?.items || [] : [];
            moduleConfigs.push({
                slug: pm.moduleSlug,
                name: systemResult.data.name,
                items,
                summary: `${systemResult.data.name} (${items.length} items available)`,
            });
        }

        // ── Build block schemas (gated by admin + partner + sub-category) ──
        let blockSchemas = '';
        let allowedShortIds: string[] = [];
        try {
            const [activeBlocks, globalConfigs] = await Promise.all([
                getActiveBlocksForPartner(partnerId),
                getGlobalBlockConfigs(),
            ]);
            allowedShortIds = activeBlocks.map(b => b.id);
            blockSchemas = buildBlockSchemasFromConfigs(activeBlocks, {
                globalEmpty: globalConfigs.length === 0,
            });
        } catch {
            console.warn('Failed to load block configs from Firestore');
        }

        // ── CORE context for Gemini (persona + FAQs, NO item data) ───────
        const personaContext = buildPersonaContext(partnerData);
        const moduleSummary = moduleConfigs.length > 0
            ? `\n\nAVAILABLE DATA SOURCES (actual items will be injected by the UI):\n${moduleConfigs.map(m => `- ${m.summary}`).join('\n')}`
            : '';

        const flowContext = flowDecision?.contextForAI ? `\n${flowDecision.contextForAI}\n\n` : '';

        const systemPrompt = `You are a helpful business assistant. Classify the visitor's request into a block type and reply with a short warm message.
${flowContext}
${blockSchemas}

RULES:
- Only valid JSON, no markdown, no backticks
- "text": 1-3 warm, concise sentences. DO NOT list product names or prices — the UI will show real items.
- ALWAYS include "suggestions" (2-3 short follow-ups)
- Pick the MOST SPECIFIC "type" for the query (catalog/pricing/greeting/contact/promo/booking/etc.)
- Match the visitor's language
${personaContext}${moduleSummary}

Respond with ONLY valid JSON. No markdown, no code fences.`;

        // ── Call Gemini (classifier + text only, no item data) ───────────
        const conversationHistory = messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
        }));
        const lastUserMessage = conversationHistory[conversationHistory.length - 1];
        const priorMessages = conversationHistory.slice(0, -1);

        const response = await genAI.models.generateContent({
            model: RELAY_CHAT_MODEL,
            contents: [
                ...priorMessages,
                { role: 'user', parts: [{ text: lastUserMessage?.parts?.[0]?.text || '' }] },
            ],
            config: { systemInstruction: systemPrompt, maxOutputTokens: 1024, temperature: 0.3 },
        });

        const text = response.text?.trim() || '';
        let parsed: any;
        try {
            const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            parsed = JSON.parse(cleaned);
        } catch {
            parsed = { type: 'text', text, suggestions: [] };
        }

        // ── SERVER-SIDE block population from Modules + Core ─────────────
        try {
            const sessionData = buildSessionData(partnerId, partnerData, moduleConfigs, agentConfigMap);
            const userMsg = messages[messages.length - 1]?.content || '';
            const populated = populateBlock(userMsg, parsed.type, sessionData, allowedShortIds, agentConfigMap);

            console.log('[Relay RAG] Gemini type:', parsed.type, '| cache items:', sessionData.items.length);
            console.log('[Relay RAG] Populated:', JSON.stringify({ blockId: populated.blockId, source: populated.source, itemsUsed: populated.itemsUsed }));

            if (populated.blockId) {
                parsed.blockId = populated.blockId;
                parsed.blockData = populated.blockData;
                if (populated.variant) parsed.blockVariant = populated.variant;
            }
        } catch (blockErr) {
            console.error('Block population error (non-fatal):', blockErr);
        }

        // Store conversation turn
        if (conversationId) {
            try {
                await adminDb.collection('relayConversations').doc(conversationId)
                    .collection('turns').add({
                        conversationId,
                        partnerId,
                        userMessage: messages[messages.length - 1]?.content || '',
                        assistantResponse: parsed,
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
            response: parsed,
            category: partnerData?.businessPersona?.identity?.businessCategories?.[0]?.functionId || 'general',
            allowedBlockIds: allowedShortIds,
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
