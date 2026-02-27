'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';
import { getCoreHubContext, getCoreHubContextString } from './core-hub-actions';
import type { BroadcastIdea } from '@/lib/types';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface GenerateBroadcastIdeasResult {
  success: boolean;
  ideas: BroadcastIdea[];
  cached: boolean;
  generatedAt: string;
  hasModuleData: boolean;
  message?: string;
}

/**
 * Generate AI-powered broadcast campaign ideas for a partner.
 *
 * Uses the partner's business context + module items (via Core Hub)
 * to prompt Gemini for personalized marketing campaign suggestions.
 *
 * Results are cached in Firestore for 24 hours.
 */
export async function generateBroadcastIdeasAction(
  partnerId: string,
  options?: { forceRefresh?: boolean }
): Promise<GenerateBroadcastIdeasResult> {
  try {
    if (!db) {
      return { success: false, ideas: [], cached: false, generatedAt: '', hasModuleData: false, message: 'Database not available' };
    }

    // 1. Check cache unless force refresh
    if (!options?.forceRefresh) {
      const cached = await getCachedIdeas(partnerId);
      if (cached) {
        return {
          success: true,
          ideas: cached.ideas,
          cached: true,
          generatedAt: cached.generatedAt,
          hasModuleData: cached.moduleItemCount > 0,
        };
      }
    }

    // 2. Gather business context via Core Hub
    const [coreHubContext, contextString] = await Promise.all([
      getCoreHubContext(partnerId),
      getCoreHubContextString(partnerId),
    ]);

    const hasModuleData = (coreHubContext.itemCount || 0) > 0;

    // 3. Fetch partner's taxonomy / persona info
    const partnerDoc = await db.collection('partners').doc(partnerId).get();
    const partnerData = partnerDoc.exists ? partnerDoc.data() || {} : {};
    const persona = partnerData.businessPersona || {};
    const identity = persona.identity || {};
    const industryInfo = identity.industry || {};
    const country = identity.address?.country || partnerData.country || '';

    // 4. Build the prompt
    const prompt = buildBroadcastIdeaPrompt(contextString, {
      industry: industryInfo.name || industryInfo.category || partnerData.industry || '',
      subcategory: industryInfo.subcategory || partnerData.subcategory || '',
      country,
      hasModuleData,
    });

    // 5. Call Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.8,
        responseMimeType: 'application/json',
      },
    });

    const responseText = result.text || '';

    // 6. Parse and validate
    let ideas: BroadcastIdea[] = [];
    try {
      const parsed = JSON.parse(responseText);
      const rawIdeas = Array.isArray(parsed) ? parsed : parsed.ideas || [];
      ideas = rawIdeas.map((idea: any, idx: number) => sanitizeIdea(idea, idx));
    } catch (parseErr) {
      console.error('[BroadcastIdeas] Failed to parse Gemini response:', parseErr);
      // Try to recover cached on parse failure
      const fallback = await getCachedIdeas(partnerId);
      if (fallback) {
        return {
          success: true,
          ideas: fallback.ideas,
          cached: true,
          generatedAt: fallback.generatedAt,
          hasModuleData,
          message: 'Using cached suggestions (generation failed)',
        };
      }
      return { success: false, ideas: [], cached: false, generatedAt: '', hasModuleData, message: 'Failed to parse AI response' };
    }

    // 7. Cache in Firestore
    const generatedAt = new Date().toISOString();
    await cacheIdeas(partnerId, ideas, {
      industry: industryInfo.name || '',
      subcategory: industryInfo.subcategory || '',
      moduleItemCount: coreHubContext.itemCount || 0,
    });

    return {
      success: true,
      ideas,
      cached: false,
      generatedAt,
      hasModuleData,
    };
  } catch (error: any) {
    console.error('[BroadcastIdeas] Error:', error);
    // Attempt to return cached ideas on any error
    try {
      const fallback = await getCachedIdeas(partnerId);
      if (fallback) {
        return {
          success: true,
          ideas: fallback.ideas,
          cached: true,
          generatedAt: fallback.generatedAt,
          hasModuleData: fallback.moduleItemCount > 0,
          message: 'Using cached suggestions',
        };
      }
    } catch { /* ignore */ }

    return { success: false, ideas: [], cached: false, generatedAt: '', hasModuleData: false, message: error.message };
  }
}

// ─────────────────────────────────────────────────────────────
// Cache helpers
// ─────────────────────────────────────────────────────────────

interface CachedIdeaDoc {
  ideas: BroadcastIdea[];
  generatedAt: string;
  moduleItemCount: number;
}

async function getCachedIdeas(partnerId: string): Promise<CachedIdeaDoc | null> {
  if (!db) return null;

  try {
    const snapshot = await db
      .collection(`partners/${partnerId}/broadcastIdeas`)
      .orderBy('generatedAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];
    const data = doc.data();

    // Check expiry
    const expiresAt = data.expiresAt?.toDate?.() || null;
    if (expiresAt && expiresAt.getTime() < Date.now()) {
      return null; // expired
    }

    const generatedAtDate = data.generatedAt?.toDate?.();

    return {
      ideas: data.ideas || [],
      generatedAt: generatedAtDate ? generatedAtDate.toISOString() : new Date().toISOString(),
      moduleItemCount: data.moduleItemCount || 0,
    };
  } catch (err) {
    console.error('[BroadcastIdeas] Cache read error:', err);
    return null;
  }
}

async function cacheIdeas(
  partnerId: string,
  ideas: BroadcastIdea[],
  meta: { industry: string; subcategory: string; moduleItemCount: number }
): Promise<void> {
  if (!db) return;

  try {
    const now = FieldValue.serverTimestamp();
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);

    await db.collection(`partners/${partnerId}/broadcastIdeas`).add({
      ideas,
      generatedAt: now,
      expiresAt,
      businessContextHash: `${meta.industry}_${meta.subcategory}_${meta.moduleItemCount}`,
      moduleItemCount: meta.moduleItemCount,
      model: 'gemini-2.5-flash',
    });
  } catch (err) {
    console.error('[BroadcastIdeas] Cache write error:', err);
  }
}

// ─────────────────────────────────────────────────────────────
// Prompt builder
// ─────────────────────────────────────────────────────────────

function buildBroadcastIdeaPrompt(
  contextString: string,
  meta: { industry: string; subcategory: string; country: string; hasModuleData: boolean }
): string {
  const noModuleNote = !meta.hasModuleData
    ? `\nNOTE: This business has NOT configured any products/services yet. Generate ideas using only contact + business variables. Include 2-3 generic campaigns (welcome message, feedback request, business hours announcement) alongside industry-appropriate ideas.\n`
    : '';

  return `You are a marketing campaign strategist for small and medium businesses.
You generate WhatsApp/SMS broadcast campaign ideas based on the business's actual products, services, and profile data.

BUSINESS CONTEXT:
${contextString || 'No business data available.'}
${noModuleNote}
AVAILABLE CONTACT FIELDS FOR PERSONALIZATION:
- name (recipient's name, almost always available)
- phone (recipient's phone)
- email (recipient's email, sometimes available)
- area (recipient's neighborhood/location, sometimes available)
- company (recipient's company name, sometimes available)

INSTRUCTIONS:
Generate 6-8 broadcast campaign ideas for this business.

Each idea MUST:
1. Reference ACTUAL items/products/services from the business data above when available
2. Use numbered WhatsApp-style variables: {{1}}, {{2}}, {{3}} etc.
3. Include a variableMap that maps each variable to its data source
4. Be ready to send — not generic templates, but specific campaigns using real data
5. Mix campaign types: promotions, announcements, seasonal, retention, daily updates
6. Keep message body under 900 characters
7. {{1}} should ALWAYS be mapped to contact name

VARIABLE SOURCE RULES:
- source:"contact" — auto-filled from recipient data. Use contactField to specify which field (name, phone, email, area, company)
- source:"business" — auto-filled from business profile. Use businessField to specify (businessName, businessPhone, address, website)
- source:"module" — filled from a specific inventory/module item. Use moduleRef with moduleSlug and field. Set preview to the ACTUAL value from the business data.
- source:"static" — partner types this manually before sending. Use for time-sensitive values (dates, discount codes, limited offers)

For source:"module" variables, the preview field MUST contain the actual value from the business data (e.g., if referencing a menu item named "Butter Chicken" priced at ₹350, preview should be "Butter Chicken" and "₹350" respectively).

RESPOND WITH THIS EXACT JSON STRUCTURE (return ONLY the JSON, no markdown):
{
  "ideas": [
    {
      "title": "Weekend Special: Butter Chicken",
      "description": "Promote your best-selling dish to drive weekend orders",
      "campaignType": "promotion",
      "message": "Hi {{1}}! \\n\\nThis weekend, treat yourself to our famous {{2}} — just {{3}}!\\n\\nOrder now before it's gone. Reply YES to place your order.",
      "variableMap": [
        {
          "token": "{{1}}",
          "label": "Customer Name",
          "source": "contact",
          "contactField": "name",
          "preview": "Priya",
          "fallback": "Friend"
        },
        {
          "token": "{{2}}",
          "label": "Dish Name",
          "source": "module",
          "moduleRef": {
            "moduleSlug": "menu-items",
            "field": "name"
          },
          "preview": "Butter Chicken",
          "fallback": "our special dish"
        },
        {
          "token": "{{3}}",
          "label": "Price",
          "source": "module",
          "moduleRef": {
            "moduleSlug": "menu-items",
            "field": "price"
          },
          "preview": "₹350",
          "fallback": "a great price"
        }
      ],
      "signal": {
        "label": "Best-seller promotion",
        "color": "#ea580c"
      },
      "sourceItems": [
        {
          "moduleSlug": "menu-items",
          "itemId": "butter_chicken_001",
          "itemName": "Butter Chicken"
        }
      ],
      "category": "MARKETING",
      "suggestedChannel": "whatsapp",
      "sortPriority": 90
    }
  ]
}

CAMPAIGN TYPE must be one of: promotion, seasonal, retention, announcement, lead-gen, daily
CATEGORY must be: MARKETING or UTILITY
sortPriority: 1-100, higher = shown first`;
}

// ─────────────────────────────────────────────────────────────
// Validation / sanitization
// ─────────────────────────────────────────────────────────────

const VALID_CAMPAIGN_TYPES = ['promotion', 'seasonal', 'retention', 'transactional', 'lead-gen', 'announcement', 'daily'];
const VALID_SOURCES = ['contact', 'business', 'module', 'static'];

function sanitizeIdea(raw: any, index: number): BroadcastIdea {
  const id = `ai-idea-${Date.now()}-${index}`;

  return {
    id,
    title: String(raw.title || `Campaign Idea ${index + 1}`),
    description: String(raw.description || ''),
    campaignType: VALID_CAMPAIGN_TYPES.includes(raw.campaignType) ? raw.campaignType : 'promotion',
    message: String(raw.message || ''),
    variableMap: Array.isArray(raw.variableMap)
      ? raw.variableMap.map((v: any) => ({
          token: String(v.token || '{{1}}'),
          label: String(v.label || 'Variable'),
          source: VALID_SOURCES.includes(v.source) ? v.source : 'static',
          contactField: v.contactField || undefined,
          businessField: v.businessField || undefined,
          moduleRef: v.moduleRef
            ? {
                moduleSlug: String(v.moduleRef.moduleSlug || ''),
                field: String(v.moduleRef.field || 'name'),
                aiSuggestionPrompt: v.moduleRef.aiSuggestionPrompt || undefined,
              }
            : undefined,
          preview: String(v.preview || ''),
          fallback: String(v.fallback || ''),
        }))
      : [],
    signal: raw.signal
      ? {
          label: String(raw.signal.label || ''),
          color: String(raw.signal.color || '#6366f1'),
        }
      : undefined,
    sourceItems: Array.isArray(raw.sourceItems)
      ? raw.sourceItems.map((s: any) => ({
          moduleSlug: String(s.moduleSlug || ''),
          itemId: String(s.itemId || ''),
          itemName: String(s.itemName || ''),
        }))
      : undefined,
    category: raw.category === 'UTILITY' ? 'UTILITY' : 'MARKETING',
    suggestedChannel: ['whatsapp', 'sms', 'telegram'].includes(raw.suggestedChannel)
      ? raw.suggestedChannel
      : 'whatsapp',
    sortPriority: typeof raw.sortPriority === 'number' ? raw.sortPriority : 50,
  };
}
