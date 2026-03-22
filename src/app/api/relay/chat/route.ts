import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import anthropic, { AI_MODEL } from '@/lib/anthropic';
import { db as adminDb } from '@/lib/firebase-admin';
import {
    getPartnerModulesAction,
    getSystemModuleAction,
    getModuleItemsAction,
} from '@/actions/modules-actions';
import type { ModuleAgentConfig } from '@/lib/modules/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { widgetId, conversationId, messages, partnerId: directPartnerId } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
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
            return NextResponse.json({ error: 'Could not resolve partner' }, { status: 400 });
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

        // Build system prompt
        const systemPrompt = `You are a helpful business assistant for this company. You help visitors find information, browse products/services, and take action (book, inquire, etc.).

RESPONSE FORMAT:
Always respond with a JSON object. Structure:
{
  "text": "Your conversational response text",
  "type": "text|rooms|book|compare|activities|location|contact|gallery|info",
  "items": [...array of items if applicable],
  "suggestions": [...array of follow-up suggestion strings]
}

BLOCK TYPE RULES:
- "text": Default for general conversation. Include helpful suggestion chips.
- "rooms" or card-based: Use when showing items from a module. Include items array with real data.
- "book": Use when the visitor wants to book/reserve. Include the relevant items for selection.
- "compare": Use when comparing 2-3 items. Include the items being compared.
- "activities": Use for listing activities/services with categories.
- "location": Use when asked about location/directions.
- "contact": Use when asked how to reach the business.
- "gallery": Use when asked to see photos/images.
- "info": Use for key-value information display.

Each item in the items array should include: name, price, currency, fields (object with all field values), and any other available data.

IMPORTANT: Only reference real items and real data from the modules below. Never make up items or prices.
${moduleContext}

Respond with ONLY valid JSON. No markdown, no code fences.`;

        // Format messages for Anthropic
        const formattedMessages = messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' as const : 'assistant' as const,
            content: m.content,
        }));

        const response = await anthropic.messages.create({
            model: AI_MODEL,
            max_tokens: 2048,
            system: systemPrompt,
            messages: formattedMessages,
        });

        const text = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map(block => block.text)
            .join('');

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
        });
    } catch (error) {
        console.error('Relay chat error:', error);
        return NextResponse.json(
            { error: 'Chat request failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
