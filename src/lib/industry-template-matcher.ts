import { SystemTemplate, Partner } from './types';
import { BusinessPersona } from './business-persona-types';

/**
 * Extracts all relevant industry IDs from a partner's profile
 * including the primary industry and any business categories
 */
export function getPartnerIndustryIds(partner: Partner): Set<string> {
    const industryIds = new Set<string>();

    // 1. Add primary industry
    if (partner.industry?.id) {
        industryIds.add(partner.industry.id);
    }

    // 2. Add industries from business categories (if available in persona)
    if (partner.businessPersona) {
        const persona = partner.businessPersona as BusinessPersona;
        // Check if identity and businessCategories exist
        // Note: The type might be loose in some places, so safe navigation is good
        if (persona.identity?.businessCategories) {
            // Assuming businessCategories is an array of objects with industryId
            // or array of strings if that was the implementation. 
            // Based on user request context: "businessPersona.identity.businessCategories[]"
            // We'll handle both object with industryId or direct string for robustness
            if (Array.isArray(persona.identity.businessCategories)) {
                persona.identity.businessCategories.forEach((cat: any) => {
                    if (typeof cat === 'string') {
                        industryIds.add(cat);
                    } else if (cat && typeof cat === 'object' && cat.industryId) {
                        industryIds.add(cat.industryId);
                    }
                });
            }
        }
    }

    return industryIds;
}

/**
 * Determines if a template is relevant for a specific partner based on their industry
 */
export function matchTemplateToIndustry(
    template: SystemTemplate,
    partnerIndustryIds: Set<string>
): boolean {
    // 1. Universal templates (no specific industries listed) are always a match
    if (!template.applicableIndustries || template.applicableIndustries.length === 0) {
        return true;
    }

    // 2. If template has specific industries, check for overlap
    return template.applicableIndustries.some(industryId =>
        partnerIndustryIds.has(industryId)
    );
}

/**
 * Sorts templates by relevance:
 * 1. Exact industry match (most relevant)
 * 2. Universal templates (fallback)
 */
export function sortTemplatesByRelevance(
    templates: SystemTemplate[],
    partnerIndustryIds: Set<string>
): SystemTemplate[] {
    return [...templates].sort((a, b) => {
        const aIsIndustrySpecific = a.applicableIndustries && a.applicableIndustries.length > 0;
        const bIsIndustrySpecific = b.applicableIndustries && b.applicableIndustries.length > 0;

        const aMatches = aIsIndustrySpecific && matchTemplateToIndustry(a, partnerIndustryIds);
        const bMatches = bIsIndustrySpecific && matchTemplateToIndustry(b, partnerIndustryIds);

        // If both are specific matches, keep original order (or sort by date/name if needed)
        if (aMatches && bMatches) return 0;

        // Specific matches come first
        if (aMatches) return -1;
        if (bMatches) return 1;

        // Then universal templates
        if (!aIsIndustrySpecific && !bIsIndustrySpecific) return 0;
        if (!aIsIndustrySpecific) return -1; // a is universal, b is specific (but didn't match partner)
        if (!bIsIndustrySpecific) return 1;  // b is universal, a is specific (but didn't match)

        return 0;
    });
}
