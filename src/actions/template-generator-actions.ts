'use server';

import { GoogleGenAI } from "@google/genai";
import { db } from '@/lib/firebase-admin';
import { cleanAndParseJSON } from '@/lib/modules/utils';
import { SystemTemplate, TemplateCategory } from '@/lib/types';
import { getIndustryById } from '@/services/taxonomy-service';
import { revalidatePath } from 'next/cache';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY });


export async function generateSystemTemplatesBatchAction(industryId: string, count: number = 10): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
        // 1. Fetch Industry Name
        const industry = await getIndustryById(industryId);
        if (!industry) {
            return { success: false, error: 'Industry not found' };
        }

        const prompt = `You are a top-tier Marketing Strategist & Copywriter for the "${industry.name}" industry.
Your goal is to generate ${count} HIGH-CONVERTING WhatsApp templates that business owners will actually want to send.

DISTRIBUTION STRATEGY (for 10 templates):
- 4x DIRECT OFFER (Hard Sell): Flash sales, limited-time discounts, "back in stock" alerts.
- 4x NURTURE & VALUE (Soft Sell): Useful tips, industry news, "how-to" guides, re-engagement (we missed you).
- 2x UTILITY / TRANSACTIONAL: Order confirmation, appointment reminder.

CRITICAL WRITING RULES:
1. **Tone**: Professional but engaging. Avoid robotic "Dear Customer". Use emojis regarding the context (🎉, 🔥, 📅) but don't overdo it.
2. **Structure**: 
   - **Hook**: First line must grab attention.
   - **Value**: Clear benefit to the customer.
   - **Call to Action**: Clear instruction on what to do next.
   - Utility templates must be strictly informational (no marketing fluff).

4. **Metadata**:
    - **Tags**: Add 3-5 relevant tags (e.g. "urgent", "sales", "new_arrival", "retention").
    - **Description**: A 1-sentence summary of what this template achieves (for an AI agent to select it later).

FORMATTING RULES:
1. **Variables**: Use {{1}}, {{2}}, etc. sequential. NO named variables.
2. **Buttons**:
   - Marketing: "Shop Now" (URL), "Claim Offer" (Quick Reply).
   - Utility: "View Details" (URL), "Reschedule" (Phone).

OUTPUT JSON FORMAT:
{
  "templates": [
    {
      "name": "industry_campaign_type_v1", // e.g. real_estate_market_update_v1
      "slug": "unique_slug",
      "category": "MARKETING" | "UTILITY" | "AUTHENTICATION",
      "tags": ["tag1", "tag2"],
      "description": "Short summary...",
      "components": [
        { "type": "HEADER", "format": "TEXT", "text": "..." }, // Optional
        { "type": "BODY", "text": "Hi {{1}}, ..." },
        { "type": "FOOTER", "text": "..." }, // Required for Marketing
        { "type": "BUTTONS", "buttons": [...] }
      ]
    }
  ]
}
`;

        // 2. Call AI
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

        // 3. Process and Save to Firestore
        const batch = db.batch();
        const collectionRef = db.collection('systemTemplates');
        const now = new Date().toISOString();

        let generatedCount = 0;
        for (const template of parsed.templates) {
            if (!template.name || !template.components) continue;

            const docRef = collectionRef.doc();

            // Extract variables
            const body = template.components.find((c: any) => c.type === 'BODY')?.text || '';
            const variables = body.match(/\{\{\d+\}\}/g) || [];
            const uniqueVariables = Array.from(new Set(variables)) as string[];

            const validTemplate: SystemTemplate = {
                id: docRef.id,
                name: template.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), // Humanize name
                slug: template.slug,
                language: 'en_US',
                category: template.category,
                components: template.components,
                variableCount: uniqueVariables.length,
                variables: uniqueVariables,
                applicableIndustries: [industryId],
                applicableFunctions: [],
                tags: template.tags || [],
                description: template.description || '',
                status: 'verified', // Auto-verify AI templates for now as per "Part 1" request? Or maybe draft? Let's use 'verified' as requested.
                isSystem: true,
                createdAt: now,
                updatedAt: now,
                rawContent: JSON.stringify(template.components),
            };

            batch.set(docRef, validTemplate);
            generatedCount++;
        }

        await batch.commit();
        revalidatePath('/admin/templates');

        return { success: true, count: generatedCount };

    } catch (error) {
        console.error('Error generating templates:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown generation error' };
    }
}
