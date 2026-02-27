'use server';

import { GoogleGenAI } from "@google/genai";
import { db } from '@/lib/firebase-admin';
import { cleanAndParseJSON } from '@/lib/modules/utils';
import { SystemTemplate, TemplateCategory } from '@/lib/types';
import { getIndustryById } from '@/services/taxonomy-service';
import { getFunctionsByIndustry } from '@/lib/business-taxonomy';
import { revalidatePath } from 'next/cache';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY });

const REQUIRED_TYPES = ['promotion', 'seasonal', 'retention', 'transactional', 'lead-gen', 'announcement'] as const;
const MIN_PER_TYPE = 3;

const TYPE_DESCRIPTIONS: Record<string, string> = {
    'promotion': 'Flash sales, discounts, BOGO, limited-time offers, clearance',
    'seasonal': 'Festival greetings, holiday specials, season-change campaigns, deadline-driven',
    'retention': 'Re-engage lapsed customers, loyalty rewards, "we miss you", anniversary',
    'transactional': 'Appointment reminders, payment due, order confirmations, follow-ups',
    'lead-gen': 'New service announcements, referral programs, free consultation offers',
    'announcement': 'Business updates, new launches, schedule changes, team introductions',
};

/**
 * Generate broadcast templates with full architecture metadata:
 * WhatsApp components + feedMeta + variableMap + enhancementDefaults
 *
 * Ensures minimum 3 templates per campaign type (6 types × 3 = 18 minimum).
 */
export async function generateSystemTemplatesBatchAction(
    industryId: string,
    count: number = 20
): Promise<{ success: boolean; count?: number; coverage?: Record<string, number>; error?: string }> {
    try {
        // 1. Fetch Industry Name
        const industry = await getIndustryById(industryId);
        if (!industry) {
            return { success: false, error: 'Industry not found' };
        }

        // 2. Fetch business functions for this industry
        const functions = getFunctionsByIndustry(industryId);
        const functionsBlock = functions.length > 0
            ? `BUSINESS FUNCTIONS IN THIS INDUSTRY:\n${functions.map(f => `- ${f.name} (${f.functionId})`).join('\n')}`
            : 'No specific business functions defined for this industry.';

        const prompt = buildMainPrompt(industry.name, functionsBlock, count);

        // 3. Call AI
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
                responseMimeType: 'application/json',
            }
        });

        const text = result.text || '';
        const parsed = cleanAndParseJSON(text) as { templates: any[] };

        if (!parsed.templates || !Array.isArray(parsed.templates)) {
            throw new Error('Invalid AI response structure');
        }

        let allTemplates = parsed.templates;

        // 4. Check coverage and fill gaps
        const typeCounts = countByType(allTemplates);
        const gaps = REQUIRED_TYPES.filter(type => (typeCounts[type] || 0) < MIN_PER_TYPE);

        if (gaps.length > 0) {
            const supplementPrompt = buildSupplementPrompt(industry.name, gaps, functionsBlock);
            const supplementResult = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: supplementPrompt,
                config: {
                    temperature: 0.7,
                    responseMimeType: 'application/json',
                }
            });

            const supplementText = supplementResult.text || '';
            const supplementParsed = cleanAndParseJSON(supplementText) as { templates: any[] };
            if (supplementParsed.templates && Array.isArray(supplementParsed.templates)) {
                allTemplates = [...allTemplates, ...supplementParsed.templates];
            }
        }

        // 5. Save to Firestore
        const batch = db.batch();
        const collectionRef = db.collection('systemTemplates');
        const now = new Date().toISOString();

        let generatedCount = 0;
        for (const template of allTemplates) {
            if (!template.name || !template.components) continue;

            const docRef = collectionRef.doc();

            // Extract variables from body
            const body = template.components.find((c: any) => c.type === 'BODY')?.text || '';
            const variables = body.match(/\{\{\d+\}\}/g) || [];
            const uniqueVariables = Array.from(new Set(variables)) as string[];

            const validTemplate: SystemTemplate = {
                id: docRef.id,
                name: template.name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                slug: template.slug || template.name,
                language: 'en_US',
                category: template.category as TemplateCategory,
                components: template.components,
                variableCount: uniqueVariables.length,
                variables: uniqueVariables,
                applicableIndustries: [industryId],
                applicableFunctions: [],
                tags: template.tags || [],
                description: template.description || '',
                status: 'draft', // Admin must review before publishing
                isSystem: true,
                createdAt: now,
                updatedAt: now,
                rawContent: JSON.stringify(template.components),

                // New architecture fields
                feedMeta: template.feedMeta || undefined,
                variableMap: template.variableMap || undefined,
                enhancementDefaults: template.enhancementDefaults || undefined,
            };

            batch.set(docRef, validTemplate);
            generatedCount++;
        }

        await batch.commit();
        revalidatePath('/admin/templates');

        // Return coverage info
        const finalCoverage = countByType(allTemplates);
        return { success: true, count: generatedCount, coverage: finalCoverage };

    } catch (error) {
        console.error('Error generating templates:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown generation error' };
    }
}

function buildMainPrompt(industryName: string, functionsBlock: string, count: number): string {
    return `You are a senior Marketing Strategist creating broadcast templates for the "${industryName}" industry on Pingbox, a WhatsApp-based business messaging platform.

CONTEXT:
- These templates appear in a "Broadcast Feed" — a curated list of suggested campaigns that business owners browse and send with one tap.
- Business owners are NON-TECHNICAL. They will never see raw {{1}} variables. The UI shows friendly labels and auto-fills most fields.
- Each template must work as both: (a) a valid WhatsApp Business API template, and (b) a rich feed card with editorial metadata.

${functionsBlock}

GENERATE ${count} TEMPLATES with this EXACT distribution:
- EXACTLY 3-4 templates with campaignType "promotion": Flash sales, discounts, BOGO, limited-time offers, clearance
- EXACTLY 3-4 templates with campaignType "seasonal": Festival greetings, holiday specials, season-change campaigns, deadline-driven
- EXACTLY 3-4 templates with campaignType "retention": Re-engage lapsed customers, loyalty rewards, "we miss you", anniversary
- EXACTLY 3-4 templates with campaignType "transactional": Appointment reminders, payment due, order confirmations, follow-ups
- EXACTLY 3 templates with campaignType "lead-gen": New service announcements, referral programs, free consultation offers
- EXACTLY 3 templates with campaignType "announcement": Business updates, new launches, schedule changes, team introductions

CRITICAL: Each campaignType MUST have AT LEAST 3 templates. Do NOT generate more than 4 for any single type. Each template within a type must be MEANINGFULLY DIFFERENT (different angle, different CTA, different audience segment).

FOR EACH TEMPLATE, OUTPUT this exact JSON structure:

{
  "templates": [
    {
      "name": "industry_campaign_type_v1",
      "slug": "industry_campaign_type",
      "category": "MARKETING",
      "tags": ["promotion", "weekend", "discount"],
      "description": "Drive weekend bookings with a time-limited room discount",

      "components": [
        { "type": "HEADER", "format": "IMAGE" },
        { "type": "BODY", "text": "Hi {{1}}! 🌴\\n\\nEscape the routine this weekend! Book a stay at {{2}} and enjoy {{3}} off.\\n\\n🛏️ Complimentary breakfast\\n📍 Check-in from 2 PM\\n\\nBook by Friday midnight!" },
        { "type": "FOOTER", "text": "Reply STOP to unsubscribe" },
        { "type": "BUTTONS", "buttons": [
          { "type": "QUICK_REPLY", "text": "Book Now" },
          { "type": "QUICK_REPLY", "text": "More Details" }
        ]}
      ],

      "feedMeta": {
        "title": "Weekend Getaway Deal",
        "subtitle": "Best sent Thursday–Friday for weekend bookings",
        "campaignType": "promotion",
        "signal": {
          "icon": "🔥",
          "label": "High engagement",
          "color": "#ea580c"
        },
        "timing": {
          "best": "Thu 10am",
          "icon": "🕙"
        },
        "sortPriority": 85,
        "isTimeSensitive": true
      },

      "variableMap": [
        {
          "token": "{{1}}",
          "label": "Guest Name",
          "source": "contact",
          "contactField": "name",
          "preview": "Priya",
          "fallback": "there"
        },
        {
          "token": "{{2}}",
          "label": "Business Name",
          "source": "business",
          "businessField": "businessName",
          "preview": "The Grand Orchid",
          "fallback": "our business"
        },
        {
          "token": "{{3}}",
          "label": "Discount",
          "source": "static",
          "preview": "20%",
          "fallback": "a special discount"
        }
      ],

      "enhancementDefaults": {
        "image": true,
        "imageSource": "upload",
        "buttons": true,
        "buttonPreset": ["Book Now", "More Details"],
        "link": false
      }
    }
  ]
}

VARIABLE MAPPING RULES:
1. {{1}} is ALWAYS source:"contact", contactField:"name"
2. Business name / phone / address use source:"business" with businessField
3. Values that come from partner's inventory use source:"module" with moduleRef
4. Values the partner types manually use source:"static"
5. When a static variable COULD come from a module, include moduleRef with aiSuggestionPrompt

SIGNAL GUIDELINES (qualitative, NOT fake stats):
- Promotional: "🔥 High engagement" or "⚡ Creates FOMO"
- Retention: "♻️ Win back lapsed customers"
- Transactional: "📋 Reduces missed payments" or "📋 Reduces no-shows"
- Seasonal: "🗓️ Seasonal must-send" or "⏰ Deadline-driven"
- Lead Gen: "🎯 High reply potential" or "💼 B2B lead driver"

campaignType VALUES (must be one of):
"promotion" | "seasonal" | "retention" | "transactional" | "lead-gen" | "announcement" | "daily"

CRITICAL RULES:
- Body text max 1024 characters
- Footer required for MARKETING category
- Max 3 buttons per template
- Variables must be sequential: {{1}}, {{2}}, {{3}}
- No named variables like {{name}} — only numbered
- signal.label must be a SHORT qualitative phrase, never fake percentages
- feedMeta.title should be human-friendly (not slugified)
- Every template must have a clear call-to-action
- sortPriority range: 1-100 (higher = shown first in feed)
`;
}

function buildSupplementPrompt(
    industryName: string,
    missingTypes: readonly string[],
    functionsBlock: string
): string {
    const blocks = missingTypes.map(type => {
        return `- Generate ${MIN_PER_TYPE} templates with campaignType "${type}": ${TYPE_DESCRIPTIONS[type] || type}`;
    }).join('\n');

    return `Generate additional broadcast templates for the "${industryName}" industry.

${functionsBlock}

GENERATE THESE SPECIFIC TEMPLATES TO FILL COVERAGE GAPS:
${blocks}

Each template within a type must be MEANINGFULLY DIFFERENT (different angle, different CTA, different audience segment).

Use the same JSON structure as before — each template must include:
- name, slug, category, tags, description
- components (with HEADER, BODY, FOOTER, BUTTONS)
- feedMeta (with title, subtitle, campaignType, signal, timing, sortPriority, isTimeSensitive)
- variableMap (with token, label, source, preview, fallback)
- enhancementDefaults (with image, buttons, link)

{{1}} is ALWAYS source:"contact", contactField:"name". Variables must be sequential.
Body text max 1024 characters. Footer required for MARKETING category.

Return JSON: { "templates": [...] }`;
}

function countByType(templates: any[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const t of templates) {
        const type = t.feedMeta?.campaignType || 'promotion';
        counts[type] = (counts[type] || 0) + 1;
    }
    return counts;
}
