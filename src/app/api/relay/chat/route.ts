import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { db as adminDb } from '@/lib/firebase-admin';
import {
    getPartnerModulesAction,
    getSystemModuleAction,
    getModuleItemsAction,
} from '@/actions/modules-actions';
import type { ModuleAgentConfig } from '@/lib/modules/types';
import { createInitialFlowState, detectIntent, runFlowEngine } from '@/lib/flow-engine';
import { getFlowTemplateForFunction } from '@/lib/flow-templates';
import type { ConversationFlowState, FlowDefinition } from '@/lib/types-flow-engine';

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
            if (widgetDoc.exists) {
                partnerId = widgetDoc.data()?.partnerId;
            }
        }

        if (!partnerId) {
            return NextResponse.json({ error: 'Could not resolve partner' }, { status: 400, headers: corsHeaders });
        }

        // Fetch partner's enabled modules with agentConfig and items
        const moduleConfigs: Array<{
            name: string;
            slug: string;
            priceType: string;
            agentConfig: ModuleAgentConfig;
            items: any[];
        }> = [];

        const partnerModulesResult = await getPartnerModulesAction(partnerId);
        const partnerModules = partnerModulesResult.success ? partnerModulesResult.data || [] : [];

        for (const pm of partnerModules.slice(0, 10)) {
            const systemResult = await getSystemModuleAction(pm.moduleSlug);
            if (systemResult.success && systemResult.data?.agentConfig) {
                const itemsResult = await getModuleItemsAction(partnerId, pm.id, {
                    isActive: true,
                    pageSize: 20,
                    sortBy: 'sortOrder',
                    sortOrder: 'asc',
                });
                moduleConfigs.push({
                    name: systemResult.data.name,
                    slug: pm.moduleSlug,
                    priceType: systemResult.data.priceType,
                    agentConfig: systemResult.data.agentConfig,
                    items: itemsResult.success ? (itemsResult.data?.items || []) : [],
                });
            }
        }

        // Build dynamic block instructions from agentConfig
        const blockInstructions = moduleConfigs.map(mc => {
            const ac = mc.agentConfig;
            const itemSummary = mc.items.slice(0, 10).map(item => {
                const fields = ac.displayFields
                    .map(f => `${f}: ${item.fields?.[f] || item[f] || 'N/A'}`)
                    .join(', ');
                return `  - ${item.name} (${item.price ? `${item.currency || 'INR'} ${item.price}` : 'No price'}): ${fields}`;
            }).join('\n');

            return `MODULE: ${mc.name} (slug: ${mc.slug})
Block type: "${ac.relayBlockType}"
Price type: ${mc.priceType}
When visitor asks about: ${ac.inboxContext}
Display fields: ${ac.displayFields.join(', ')}
Card: title=${ac.cardTitle}, subtitle=${ac.cardSubtitle || 'N/A'}, price=${ac.cardPrice || 'N/A'}, image=${ac.cardImage || 'N/A'}
Comparison fields: ${ac.comparisonFields.join(', ') || 'N/A'}
Available items (${mc.items.length} total):
${itemSummary || '  (no items yet)'}`;
        }).join('\n\n');

        const moduleContext = moduleConfigs.length > 0
            ? `\n\nBUSINESS DATA (from partner's modules — use ONLY this data to answer):\n${blockInstructions}`
            : '\n\nNo business data modules configured yet. Answer general questions only.';

        // Load business persona for richer context
        let personaContext = '';
        try {
            const partnerDoc = await adminDb.collection('partners').doc(partnerId).get();
            const persona = partnerDoc.data()?.businessPersona;
            if (persona) {
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
                if (parts.length > 0) {
                    personaContext = `\n\nBUSINESS PROFILE:\n${parts.join('\n')}`;
                }
            }
        } catch {
            // Persona not available, continue without it
        }

        // Determine partner's business function from persona
        let partnerFunctionId = 'general';
        try {
            const partnerDoc2 = await adminDb.collection('partners').doc(partnerId).get();
            const personaData = partnerDoc2.data()?.businessPersona;
            const businessCategories = personaData?.identity?.businessCategories;
            if (Array.isArray(businessCategories) && businessCategories.length > 0) {
                partnerFunctionId = businessCategories[0].functionId || 'general';
            }
        } catch {
            // Use 'general' fallback
        }

        // Load or create conversation flow state
        let flowState: ConversationFlowState | null = null;
        if (conversationId) {
            try {
                const convDoc = await adminDb.collection('relayConversations').doc(conversationId).get();
                if (convDoc.exists && convDoc.data()?.flowState) {
                    flowState = convDoc.data()!.flowState as ConversationFlowState;
                }
            } catch { /* use null */ }
        }
        if (!flowState) {
            flowState = createInitialFlowState(
                conversationId || `conv_${Date.now()}`,
                partnerId
            );
        }

        // Load partner's custom flow or fall back to system template
        let flowDefinition: FlowDefinition | null = null;
        try {
            const flowDoc = await adminDb.collection('partners').doc(partnerId)
                .collection('relayConfig').doc('flowDefinition').get();
            if (flowDoc.exists) {
                flowDefinition = flowDoc.data() as FlowDefinition;
            }
        } catch { /* use null */ }

        if (!flowDefinition) {
            const template = getFlowTemplateForFunction(partnerFunctionId);
            if (template) {
                flowDefinition = {
                    id: `system_${template.id}`,
                    name: template.name,
                    industryId: template.industryId,
                    functionId: template.functionId,
                    stages: template.stages,
                    transitions: template.transitions,
                    settings: template.settings,
                    status: 'active',
                    isSystem: true,
                    createdAt: '',
                    updatedAt: '',
                    createdBy: 'system',
                };
            }
        }

        // Run flow engine
        const userMessageText = messages[messages.length - 1]?.content || '';
        const detectedIntent = detectIntent(userMessageText, messages);
        const flowDecision = runFlowEngine(flowState, detectedIntent, flowDefinition, partnerFunctionId);
        flowState = flowDecision.updatedState;

        // Build system prompt
        const systemPrompt = `You are a helpful business assistant for this company. You help visitors find information, browse products/services, and take action (book, inquire, etc.).

RESPOND ONLY IN JSON. Choose the most appropriate type:

{"type":"catalog","text":"...","items":[{"id":"...","name":"...","price":0,"currency":"₹","subtitle":"...","emoji":"...","color":"#...","rating":4.5,"reviewCount":100,"features":["..."],"specs":[{"label":"...","value":"..."}]}],"suggestions":["..."]}
— For showing products, services, rooms, menu items, listings

{"type":"compare","text":"...","items":[...same as catalog items...],"suggestions":["..."]}
— For side-by-side comparison of 2-3 items

{"type":"activities","text":"...","items":[{"id":"...","name":"...","description":"...","icon":"🏷️","price":"₹X,XXX","duration":"X hours","category":"...","bookable":true}],"suggestions":["..."]}
— For listing activities, experiences, classes, treatments

{"type":"book","text":"...","items":[...catalog items for selection...],"suggestions":["..."]}
— When the user wants to book, reserve, or schedule

{"type":"location","text":"...","location":{"name":"...","address":"...","area":"...","directions":[{"icon":"✈️","label":"Airport","detail":"45 min"}]},"suggestions":["..."]}
— For location, directions, how to get there

{"type":"contact","text":"...","methods":[{"type":"whatsapp","label":"WhatsApp","value":"+91...","icon":"💬"},{"type":"phone","label":"Call","value":"+91...","icon":"📞"},{"type":"email","label":"Email","value":"...@...","icon":"📧"}],"suggestions":["..."]}
— For contact information

{"type":"gallery","text":"...","items":[{"emoji":"📸","label":"...","span":1}],"suggestions":["..."]}
— For showing photos/visual gallery

{"type":"info","text":"...","items":[{"label":"...","value":"..."}],"suggestions":["..."]}
— For FAQ, policies, key-value information

{"type":"pricing","text":"...","pricingTiers":[{"id":"...","name":"...","price":0,"currency":"INR","unit":"/month","features":["..."],"isPopular":false,"emoji":"..."}],"suggestions":["..."]}
— For showing pricing plans, packages, tiers

{"type":"testimonials","text":"...","testimonials":[{"id":"...","name":"...","text":"...","rating":5,"date":"...","source":"Google"}],"suggestions":["..."]}
— For social proof, reviews

{"type":"quick_actions","text":"...","quickActions":[{"id":"...","label":"...","emoji":"...","prompt":"...","description":"..."}],"suggestions":["..."]}
— For showing actionable buttons/menu

{"type":"schedule","text":"...","schedule":[{"id":"...","time":"10:00 AM","endTime":"11:00 AM","title":"...","instructor":"...","spots":5,"price":"...","emoji":"...","isAvailable":true}],"suggestions":["..."]}
— For showing time slots, timetable, availability

{"type":"promo","text":"...","promos":[{"id":"...","title":"...","description":"...","discount":"30% OFF","code":"SAVE30","validUntil":"...","emoji":"...","ctaLabel":"Claim"}],"suggestions":["..."]}
— For promotional offers, deals

{"type":"lead_capture","text":"...","fields":[{"id":"...","label":"...","type":"text","placeholder":"...","required":true}],"title":"...","subtitle":"...","suggestions":["..."]}
— For capturing visitor contact info (name, phone, email forms)

{"type":"handoff","text":"...","handoffOptions":[{"id":"...","type":"whatsapp","label":"...","value":"...","icon":"...","description":"..."}],"title":"Talk to our team","suggestions":["..."]}
— For connecting visitor to a human agent

{"type":"text","text":"...","suggestions":["suggestion 1","suggestion 2","suggestion 3"]}
— For general conversation. ALWAYS include 2-3 suggestions.

RULES:
- Only valid JSON, no markdown, no backticks
- "text" field: 1-3 warm, concise sentences
- ALWAYS include a "suggestions" array with 2-3 follow-up suggestions
- Use real business data when available
- Match the visitor's language
- For catalog/activities items, include id, name, price, currency at minimum

${flowDecision.contextForAI}
${personaContext}${moduleContext}

Respond with ONLY valid JSON. No markdown, no code fences.`;

        // Format conversation history for Gemini
        const conversationHistory = messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content }],
        }));

        // Build the full contents array: system instruction as first user turn context + conversation
        const lastUserMessage = conversationHistory[conversationHistory.length - 1];
        const priorMessages = conversationHistory.slice(0, -1);

        const response = await genAI.models.generateContent({
            model: RELAY_CHAT_MODEL,
            contents: [
                ...priorMessages,
                {
                    role: 'user',
                    parts: [{ text: lastUserMessage?.parts?.[0]?.text || '' }],
                },
            ],
            config: {
                systemInstruction: systemPrompt,
                maxOutputTokens: 2048,
                temperature: 0.3,
            },
        });

        const text = response.text?.trim() || '';

        // Try to parse as JSON block response
        let parsed: any;
        try {
            const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            parsed = JSON.parse(cleaned);
        } catch {
            // If not valid JSON, wrap as text response
            parsed = { type: 'text', text, suggestions: [] };
        }

        // Update flow state with response data
        flowState.lastBlockType = parsed.type || 'text';
        flowState.interactionCount += 1;
        flowState.lastActivityAt = new Date().toISOString();

        if (['catalog', 'rooms', 'products', 'services', 'menu', 'listings', 'pricing'].includes(parsed.type)) {
            const itemIds = (parsed.items || parsed.pricingTiers || [])
                .map((i: any) => i.id).filter(Boolean);
            flowState.itemsViewed = [...new Set([...flowState.itemsViewed, ...itemIds])];
        }
        if (parsed.type === 'compare') {
            const itemIds = (parsed.items || []).map((i: any) => i.id).filter(Boolean);
            flowState.itemsCompared = [...new Set([...flowState.itemsCompared, ...itemIds])];
        }

        // Store conversation turn and flow state
        const activeConversationId = conversationId || `conv_${Date.now()}`;
        if (conversationId) {
            try {
                const turnData = {
                    conversationId,
                    partnerId,
                    userMessage: messages[messages.length - 1]?.content || '',
                    assistantResponse: parsed,
                    createdAt: new Date().toISOString(),
                };
                await adminDb.collection('relayConversations').doc(conversationId)
                    .collection('turns').add(turnData);

                await adminDb.collection('relayConversations').doc(conversationId).set(
                    { flowState, partnerId, updatedAt: new Date().toISOString() },
                    { merge: true }
                );
            } catch (e) {
                console.error('Failed to store conversation turn:', e);
            }
        }

        return NextResponse.json({
            success: true,
            response: parsed,
            conversationId: activeConversationId,
            flowMeta: {
                stage: flowDecision.suggestedStageType,
                leadTemperature: flowDecision.leadTemperature,
                leadScore: flowDecision.leadScore,
                shouldHandoff: flowDecision.shouldHandoff,
                turnCount: flowState.interactionCount,
            },
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Relay chat error:', error);
        return NextResponse.json(
            { error: 'Chat request failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
