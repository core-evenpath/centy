'use server';

import { GoogleGenAI } from "@google/genai";
import {
  type TagCategory,
  type SuggestedTag,
  type TagGroup,
  type GenerateTagsResult,
  type TagInsight,
  TAG_CATEGORY_META,
} from '@/lib/profile-tags-types';

// Re-export types removed to avoid 'use server' conflicts. Import from @/lib/profile-tags-types directly.

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Generate comprehensive AI-suggested tags based on consolidated business profile data
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
    products?: Array<{ name: string; category?: string; description?: string; price?: number; features?: string[] }>;
    targetAudience?: string[];
    uniqueSellingPoints?: string[];
    location?: { city?: string; state?: string; country?: string };
    specializations?: string[];
    differentiators?: string[];
    areasServed?: string[];
    team?: Array<{ role?: string; qualifications?: string[]; specializations?: string[] }>;
    testimonials?: Array<{ quote?: string; rating?: number }>;
    certifications?: Array<{ name: string }> | string[];
    awards?: Array<{ name: string }> | string[];
    yearEstablished?: number;
    pricingTiers?: Array<{ name: string; price?: number }>;
    packages?: Array<{ name: string; price?: number }>;
    paymentMethods?: string[];
    brandValues?: string[];
    missionStatement?: string;
  }
): Promise<GenerateTagsResult> {
  try {
    if (!ai) {
      return { success: false, error: 'AI service not configured' };
    }

    // Build comprehensive context from profile data
    const contextParts: string[] = [];

    // Core identity
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
    if (profileData.shortDescription) {
      contextParts.push(`Short Description: ${profileData.shortDescription}`);
    }
    if (profileData.tagline) {
      contextParts.push(`Tagline: ${profileData.tagline}`);
    }
    if (profileData.missionStatement) {
      contextParts.push(`Mission: ${profileData.missionStatement}`);
    }

    // Services
    if (profileData.services?.length) {
      contextParts.push(`Services Offered: ${profileData.services.join(', ')}`);
    }

    // Products with details
    if (profileData.products?.length) {
      const productDetails = profileData.products.map(p => {
        let detail = p.name;
        if (p.category) detail += ` (${p.category})`;
        if (p.price) detail += ` - $${p.price}`;
        if (p.features?.length) detail += ` [${p.features.slice(0, 3).join(', ')}]`;
        return detail;
      }).join('; ');
      contextParts.push(`Products: ${productDetails}`);
    }

    // Target audience
    if (profileData.targetAudience?.length) {
      contextParts.push(`Target Audience: ${profileData.targetAudience.join(', ')}`);
    }

    // USPs and differentiators
    if (profileData.uniqueSellingPoints?.length) {
      contextParts.push(`Unique Selling Points: ${profileData.uniqueSellingPoints.join('; ')}`);
    }
    if (profileData.differentiators?.length) {
      contextParts.push(`Differentiators: ${profileData.differentiators.join('; ')}`);
    }

    // Specializations
    if (profileData.specializations?.length) {
      contextParts.push(`Specializations: ${profileData.specializations.join(', ')}`);
    }

    // Location and areas served
    if (profileData.areasServed?.length) {
      contextParts.push(`Areas Served: ${profileData.areasServed.join(', ')}`);
    }
    if (profileData.location) {
      const loc = [profileData.location.city, profileData.location.state, profileData.location.country]
        .filter(Boolean).join(', ');
      if (loc) contextParts.push(`Location: ${loc}`);
    }

    // Team qualifications
    if (profileData.team?.length) {
      const qualifications = profileData.team
        .flatMap(t => t.qualifications || [])
        .filter(Boolean);
      const teamSpecializations = profileData.team
        .flatMap(t => t.specializations || [])
        .filter(Boolean);
      if (qualifications.length) {
        contextParts.push(`Team Qualifications: ${[...new Set(qualifications)].join(', ')}`);
      }
      if (teamSpecializations.length) {
        contextParts.push(`Team Specializations: ${[...new Set(teamSpecializations)].join(', ')}`);
      }
    }

    // Certifications and awards
    if (profileData.certifications?.length) {
      const certNames = profileData.certifications.map(c => typeof c === 'string' ? c : c.name);
      contextParts.push(`Certifications: ${certNames.join(', ')}`);
    }
    if (profileData.awards?.length) {
      const awardNames = profileData.awards.map(a => typeof a === 'string' ? a : a.name);
      contextParts.push(`Awards: ${awardNames.join(', ')}`);
    }

    // Experience
    if (profileData.yearEstablished) {
      const yearsInBusiness = new Date().getFullYear() - profileData.yearEstablished;
      contextParts.push(`Years in Business: ${yearsInBusiness} (Est. ${profileData.yearEstablished})`);
    }

    // Pricing info
    if (profileData.pricingTiers?.length) {
      const tiers = profileData.pricingTiers.map(t => t.price ? `${t.name}: $${t.price}` : t.name).join(', ');
      contextParts.push(`Pricing Tiers: ${tiers}`);
    }
    if (profileData.packages?.length) {
      const pkgs = profileData.packages.map(p => p.price ? `${p.name}: $${p.price}` : p.name).join(', ');
      contextParts.push(`Packages: ${pkgs}`);
    }

    // Payment methods
    if (profileData.paymentMethods?.length) {
      contextParts.push(`Payment Methods: ${profileData.paymentMethods.join(', ')}`);
    }

    // Brand values
    if (profileData.brandValues?.length) {
      contextParts.push(`Brand Values: ${profileData.brandValues.join(', ')}`);
    }

    // Testimonial insights
    if (profileData.testimonials?.length) {
      const avgRating = profileData.testimonials
        .filter(t => t.rating)
        .reduce((sum, t) => sum + (t.rating || 0), 0) / profileData.testimonials.filter(t => t.rating).length;
      if (avgRating) {
        contextParts.push(`Average Rating: ${avgRating.toFixed(1)}/5 from ${profileData.testimonials.length} reviews`);
      }
      // Extract keywords from testimonials
      const testimonialKeywords = profileData.testimonials
        .map(t => t.quote || '')
        .join(' ')
        .toLowerCase();
      if (testimonialKeywords.length > 50) {
        contextParts.push(`Customer Feedback Themes: "${testimonialKeywords.substring(0, 300)}..."`);
      }
    }

    if (contextParts.length < 2) {
      return { success: false, error: 'Not enough data to generate meaningful tags' };
    }

    const prompt = `You are an expert business strategist and SEO specialist. Analyze this business profile and generate comprehensive, strategic tags that will:
1. Improve discoverability and SEO
2. Help customers find this business
3. Enable accurate AI categorization
4. Support targeted marketing

BUSINESS PROFILE:
${contextParts.join('\n')}

Generate 20-30 highly relevant tags across these categories:

CRITICAL CATEGORIES (must have tags):
- industry: Core business sector/vertical (e.g., "real estate", "healthcare", "saas")
- service: Specific services offered (e.g., "property management", "home staging")
- audience: Target customer segments (e.g., "first-time homebuyers", "commercial investors")

HIGH PRIORITY CATEGORIES:
- product: Products or product types (e.g., "luxury homes", "condos", "investment properties")
- specialty: Areas of specialized expertise (e.g., "waterfront properties", "foreclosures")
- location: Geographic areas served (e.g., "downtown boston", "greater miami area")
- benefit: Key customer benefits (e.g., "hassle-free selling", "guaranteed closing")

MEDIUM PRIORITY CATEGORIES:
- feature: Capabilities and features (e.g., "virtual tours", "24/7 support")
- pricing: Pricing positioning (e.g., "affordable", "premium service", "flexible payment")
- quality: Quality indicators (e.g., "award-winning", "top-rated", "certified")
- experience: Experience level (e.g., "20+ years experience", "established 1990")
- certification: Certifications (e.g., "licensed realtor", "iso certified")

LOWER PRIORITY (if relevant):
- technology: Tech used (e.g., "ai-powered", "cloud-based")
- methodology: Approach (e.g., "data-driven", "client-centered")

For each tag, provide:
1. tag: 1-4 words, lowercase, specific and descriptive
2. category: One of the categories above
3. confidence: 0.6-1.0 (how confident this tag applies)
4. reason: 10-20 word explanation of why this tag is valuable
5. relatedTags: 1-3 related/synonym tags (optional)
6. searchVolume: "high", "medium", or "low" - estimated search popularity
7. competitiveness: "high", "medium", or "low" - how competitive this term is

Return ONLY valid JSON with this structure:
{
  "tags": [
    {
      "tag": "luxury real estate",
      "category": "industry",
      "confidence": 0.95,
      "reason": "Core business focus, high-intent search term for target audience",
      "relatedTags": ["premium properties", "high-end homes"],
      "searchVolume": "high",
      "competitiveness": "high"
    }
  ],
  "insights": [
    {
      "type": "suggestion",
      "title": "Missing Location Tags",
      "description": "Consider adding specific neighborhood tags to improve local SEO",
      "actionable": "Add tags like 'downtown boston' or 'back bay properties'"
    }
  ]
}

GUIDELINES:
- Be SPECIFIC: "luxury waterfront condos" > "real estate"
- Be ACTIONABLE: Tags should match how customers search
- Include LONG-TAIL tags: More specific = less competition
- Consider LOCAL SEO: Geographic specificity matters
- Think like a CUSTOMER: What would they search for?
- Avoid GENERIC tags: Skip "business", "company", "services"
- Include BENEFIT tags: What outcomes do customers get?

Analyze the profile deeply and generate strategic, valuable tags.`;

    console.log('[TagGen] Generating comprehensive tags for profile...');

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.4,
      },
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error('[TagGen] No JSON found in response');
      return { success: false, error: 'Failed to parse AI response' };
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('[TagGen] JSON parse error:', e);
      return { success: false, error: 'Failed to parse AI response' };
    }

    const tags: SuggestedTag[] = (parsed.tags || [])
      .filter((t: any) => t.tag && t.category && typeof t.confidence === 'number')
      .map((t: any) => ({
        tag: t.tag.toLowerCase().trim(),
        category: t.category as TagCategory,
        confidence: Math.min(1, Math.max(0.6, t.confidence)),
        reason: t.reason || '',
        relatedTags: t.relatedTags || [],
        searchVolume: t.searchVolume || 'medium',
        competitiveness: t.competitiveness || 'medium',
      }))
      .sort((a: SuggestedTag, b: SuggestedTag) => b.confidence - a.confidence);

    // Group tags by category
    const groups: TagGroup[] = Object.entries(TAG_CATEGORY_META)
      .map(([category, meta]) => ({
        category: category as TagCategory,
        label: meta.label,
        description: meta.description,
        icon: meta.icon,
        importance: meta.importance,
        tags: tags.filter(t => t.category === category),
      }))
      .filter(g => g.tags.length > 0)
      .sort((a, b) => {
        const importanceOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return importanceOrder[a.importance] - importanceOrder[b.importance];
      });

    // Extract insights
    const insights: TagInsight[] = parsed.insights || [];

    // Add automatic insights based on tag analysis
    const categories = new Set(tags.map(t => t.category));
    if (!categories.has('location') && profileData.areasServed?.length) {
      insights.push({
        type: 'suggestion',
        title: 'Add Location Tags',
        description: 'You serve specific areas but have no location tags. Adding them improves local SEO.',
        actionable: 'Select or add location-based tags',
      });
    }
    if (!categories.has('audience')) {
      insights.push({
        type: 'warning',
        title: 'Missing Audience Tags',
        description: 'No target audience tags found. These help AI understand who to target.',
        actionable: 'Define your ideal customer segments',
      });
    }
    if (tags.filter(t => t.confidence >= 0.9).length < 5) {
      insights.push({
        type: 'opportunity',
        title: 'Strengthen Profile Data',
        description: 'Few high-confidence tags generated. Adding more business details would improve tag quality.',
        actionable: 'Add services, products, and USPs in the Review tab',
      });
    }

    console.log('[TagGen] Generated', tags.length, 'tags in', groups.length, 'categories');

    return {
      success: true,
      tags,
      groups,
      insights,
    };
  } catch (error: any) {
    console.error('[TagGen] Error:', error);
    return { success: false, error: error.message || 'Failed to generate tags' };
  }
}

/**
 * Generate industry-specific tag suggestions
 */
export async function generateIndustryTagsAction(
  industry: string,
  subIndustry?: string
): Promise<{ success: boolean; suggestions?: string[]; error?: string }> {
  try {
    if (!ai) {
      return { success: false, error: 'AI service not configured' };
    }

    const prompt = `List 20 common, valuable tags for businesses in the ${industry}${subIndustry ? ` / ${subIndustry}` : ''} industry.
Include a mix of:
- Service types
- Customer segments
- Specializations
- Geographic modifiers (e.g., "local", "nationwide")
- Quality indicators
- Pricing tiers

Return as a simple JSON array of lowercase strings:
["tag 1", "tag 2", ...]

Focus on tags customers actually search for.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { temperature: 0.3 },
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      return { success: false, error: 'Failed to parse response' };
    }

    const suggestions: string[] = JSON.parse(jsonMatch[0]);
    return { success: true, suggestions };
  } catch (error: any) {
    return { success: false, error: error.message };
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
