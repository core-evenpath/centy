import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { db as adminDb } from '@/lib/firebase-admin';
import {
    getPartnerModulesAction,
    getSystemModuleAction,
    getModuleItemsAction,
} from '@/actions/modules-actions';
import type { ModuleAgentConfig } from '@/lib/modules/types';
import { RELAY_BLOCK_SCHEMAS } from '@/lib/relay-chat-schemas';

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

        // Fetch correct block types from relayBlockConfigs
        const relayBlockTypes = new Map<string, string>();
        if (moduleConfigs.length > 0) {
            try {
                const slugs = moduleConfigs.map(mc => `module_${mc.slug}`);
                const chunkSize = 10;
                for (let i = 0; i < slugs.length; i += chunkSize) {
                    const chunk = slugs.slice(i, i + chunkSize);
                    const snap = await adminDb.collection('relayBlockConfigs')
                        .where('__name__', 'in', chunk)
                        .get();
                    snap.docs.forEach(doc => {
                        const data = doc.data();
                        if (data.moduleSlug && data.blockType) {
                            relayBlockTypes.set(data.moduleSlug, data.blockType);
                        }
                    });
                }
            } catch {
                // relayBlockConfigs not available — will fall back to module slug-based inference
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
Block type: "${relayBlockTypes.get(mc.slug) || 'catalog'}"
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

        // Build system prompt
        const systemPrompt = `You are a helpful business assistant for this company. You help visitors find information, browse products/services, and take action (book, inquire, etc.).

${RELAY_BLOCK_SCHEMAS}

RULES:
- Only valid JSON, no markdown, no backticks
- "text" field: 1-3 warm, concise sentences
- ALWAYS include a "suggestions" array with 2-3 follow-up suggestions
- Use real business data when available
- Match the visitor's language
- For catalog/activities items, include id, name, price, currency at minimum
- Use "pricing" type (not "catalog") when visitor asks about prices, rates, or plans
- Use "greeting" type when conversation starts or visitor says hello/hi
- Use "quick_actions" when visitor seems unsure or asks "what can you help with"
- Use "handoff" when you cannot resolve the query or visitor asks for a human
- Use "schedule" when visitor asks about available times or slots
- Use "testimonials" when visitor asks about reviews, ratings, or experiences
- Use "lead_capture" when visitor wants a callback, quote, or to submit an inquiry
- Use "promo" when visitor asks about offers, deals, or discounts
- Choose the MOST SPECIFIC block type for the query — prefer "pricing" over "catalog" for price questions, prefer "schedule" over "info" for availability questions
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

        // Store conversation turn if conversationId provided
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
            } catch (e) {
                console.error('Failed to store conversation turn:', e);
            }
        }

        return NextResponse.json({
            success: true,
            response: parsed,
            conversationId: conversationId || `conv_${Date.now()}`,
        }, { headers: corsHeaders });
    } catch (error) {
        console.error('Relay chat error:', error);
        return NextResponse.json(
            { error: 'Chat request failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500, headers: corsHeaders }
        );
    }
}
