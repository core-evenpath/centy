'use server';

import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface SuggestedTag {
  tag: string;
  category: 'industry' | 'service' | 'specialty' | 'audience' | 'location' | 'feature' | 'benefit';
  confidence: number;
  reason: string;
}

export interface GenerateTagsResult {
  success: boolean;
  tags?: SuggestedTag[];
  error?: string;
}

/**
 * Generate AI-suggested tags based on consolidated business profile data
 */
export async function generateProfileTagsAction(
  profileData: {
    businessName?: string;
    industry?: string;
    subIndustry?: string;
    description?: string;
    shortDescription?: string;
    tagline?: string;
    services?: string[];
    products?: Array<{ name: string; category?: string; description?: string }>;
    targetAudience?: string[];
    uniqueSellingPoints?: string[];
    location?: { city?: string; state?: string; country?: string };
    specializations?: string[];
    differentiators?: string[];
    areasServed?: string[];
  }
): Promise<GenerateTagsResult> {
  try {
    if (!ai) {
      return { success: false, error: 'AI service not configured' };
    }

    // Build context from profile data
    const contextParts: string[] = [];

    if (profileData.businessName) {
      contextParts.push(`Business Name: ${profileData.businessName}`);
    }
    if (profileData.industry) {
      contextParts.push(`Industry: ${profileData.industry}`);
    }
    if (profileData.subIndustry) {
      contextParts.push(`Sub-Industry: ${profileData.subIndustry}`);
    }
    if (profileData.description) {
      contextParts.push(`Description: ${profileData.description}`);
    }
    if (profileData.tagline) {
      contextParts.push(`Tagline: ${profileData.tagline}`);
    }
    if (profileData.services?.length) {
      contextParts.push(`Services: ${profileData.services.join(', ')}`);
    }
    if (profileData.products?.length) {
      const productNames = profileData.products.map(p => p.name).join(', ');
      const categories = [...new Set(profileData.products.map(p => p.category).filter(Boolean))].join(', ');
      contextParts.push(`Products: ${productNames}`);
      if (categories) contextParts.push(`Product Categories: ${categories}`);
    }
    if (profileData.targetAudience?.length) {
      contextParts.push(`Target Audience: ${profileData.targetAudience.join(', ')}`);
    }
    if (profileData.uniqueSellingPoints?.length) {
      contextParts.push(`USPs: ${profileData.uniqueSellingPoints.join(', ')}`);
    }
    if (profileData.specializations?.length) {
      contextParts.push(`Specializations: ${profileData.specializations.join(', ')}`);
    }
    if (profileData.differentiators?.length) {
      contextParts.push(`Differentiators: ${profileData.differentiators.join(', ')}`);
    }
    if (profileData.areasServed?.length) {
      contextParts.push(`Areas Served: ${profileData.areasServed.join(', ')}`);
    }
    if (profileData.location) {
      const loc = [profileData.location.city, profileData.location.state, profileData.location.country]
        .filter(Boolean).join(', ');
      if (loc) contextParts.push(`Location: ${loc}`);
    }

    if (contextParts.length < 2) {
      return { success: false, error: 'Not enough data to generate tags' };
    }

    const prompt = `You are a business profile expert. Based on the following business information, generate relevant tags that would help categorize this business and improve its discoverability.

BUSINESS INFORMATION:
${contextParts.join('\n')}

Generate 10-15 relevant tags. For each tag, provide:
1. The tag itself (2-4 words max, lowercase, no special characters)
2. Category: industry, service, specialty, audience, location, feature, or benefit
3. Confidence: 0.0-1.0 (how relevant this tag is)
4. Reason: Brief explanation why this tag fits

Return ONLY valid JSON array:
[
  {
    "tag": "real estate services",
    "category": "industry",
    "confidence": 0.95,
    "reason": "Core business type"
  },
  {
    "tag": "property management",
    "category": "service",
    "confidence": 0.9,
    "reason": "Key service offered"
  }
]

Focus on:
- Industry/vertical tags
- Specific services offered
- Target audience/customer type
- Geographic relevance
- Key features/benefits
- Specializations

Make tags specific and useful for categorization. Avoid generic tags like "business" or "company".`;

    console.log('[TagGen] Generating tags for profile...');

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.error('[TagGen] No JSON array found in response');
      return { success: false, error: 'Failed to parse AI response' };
    }

    const tags: SuggestedTag[] = JSON.parse(jsonMatch[0]);

    // Validate and clean tags
    const validTags = tags
      .filter(t => t.tag && t.category && typeof t.confidence === 'number')
      .map(t => ({
        tag: t.tag.toLowerCase().trim(),
        category: t.category,
        confidence: Math.min(1, Math.max(0, t.confidence)),
        reason: t.reason || '',
      }))
      .sort((a, b) => b.confidence - a.confidence);

    console.log('[TagGen] Generated', validTags.length, 'tags');

    return { success: true, tags: validTags };
  } catch (error: any) {
    console.error('[TagGen] Error:', error);
    return { success: false, error: error.message || 'Failed to generate tags' };
  }
}

/**
 * Quick tag generation from just business name and industry
 */
export async function generateQuickTagsAction(
  businessName: string,
  industry: string,
  description?: string
): Promise<GenerateTagsResult> {
  return generateProfileTagsAction({
    businessName,
    industry,
    description,
  });
}
