'use server';

import { db as adminDb } from '@/lib/firebase-admin';
import { SystemTemplate, Partner } from '@/lib/types';
import {
    getPartnerIndustryIds,
    matchTemplateToIndustry,
    sortTemplatesByRelevance
} from '@/lib/industry-template-matcher';

interface GetTemplatesResult {
    success: boolean;
    templates: SystemTemplate[];
    partnerIndustries: string[];
    error?: string;
}

/**
 * Fetches system templates filtered by the partner's industry and business categories.
 * 
 * @param partnerId The ID of the partner to fetch templates for
 * @returns Filtered and sorted templates
 */
export async function getTemplatesForPartnerIndustry(partnerId: string): Promise<GetTemplatesResult> {
    try {
        // 1. Fetch partner profile
        const partnerDoc = await adminDb.collection('partners').doc(partnerId).get();

        if (!partnerDoc.exists) {
            console.error(`Partner not found: ${partnerId}`);
            return {
                success: false,
                error: 'Partner not found',
                templates: [],
                partnerIndustries: []
            };
        }

        const partnerData = partnerDoc.data() as Partner;

        // 2. Extract industry IDs using our centralized logic
        const partnerIndustryIds = getPartnerIndustryIds(partnerData);
        const partnerIndustryIdsArray = Array.from(partnerIndustryIds);

        console.log(`[TemplateFilter] Partner ${partnerId} industries:`, partnerIndustryIdsArray);

        // 3. Fetch all active system templates
        // Optimization: We could potentially filter by applicableIndustries using array-contains-any 
        // BUT that would exclude Universal templates (empty array). 
        // Since template count is likely < 1000, fetching all active ones and filtering in memory is acceptable and safer for Universal templates.
        const snapshot = await adminDb
            .collection('systemTemplates')
            .where('status', 'in', ['published', 'verified'])
            .get();

        const allTemplates = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SystemTemplate));

        // 4. Filter templates
        const matchedTemplates = allTemplates.filter(template =>
            matchTemplateToIndustry(template, partnerIndustryIds)
        );

        // 5. Sort by relevance (Specific matches first, then Universal)
        const sortedTemplates = sortTemplatesByRelevance(matchedTemplates, partnerIndustryIds);

        console.log(`[TemplateFilter] Returning ${sortedTemplates.length} templates for partner ${partnerId}`);

        return {
            success: true,
            templates: sortedTemplates,
            partnerIndustries: partnerIndustryIdsArray
        };

    } catch (error) {
        console.error('Error filtering templates:', error);
        return {
            success: false,
            error: 'Failed to fetch templates',
            templates: [],
            partnerIndustries: []
        };
    }
}

/**
 * Checks if a specific template is relevant for a partner
 */
export async function checkTemplateRelevance(
    templateId: string,
    partnerId: string
): Promise<boolean> {
    try {
        const [templateDoc, partnerDoc] = await Promise.all([
            adminDb.collection('systemTemplates').doc(templateId).get(),
            adminDb.collection('partners').doc(partnerId).get()
        ]);

        if (!templateDoc.exists || !partnerDoc.exists) return false;

        const template = { id: templateDoc.id, ...templateDoc.data() } as SystemTemplate;
        const partner = partnerDoc.data() as Partner;
        const industryIds = getPartnerIndustryIds(partner);

        return matchTemplateToIndustry(template, industryIds);
    } catch (error) {
        console.error('Error checking template relevance:', error);
        return false;
    }
}

/**
 * Fetches only universal templates (useful for fallbacks)
 */
export async function getUniversalTemplates(): Promise<SystemTemplate[]> {
    try {
        const snapshot = await adminDb
            .collection('systemTemplates')
            .where('status', 'in', ['published', 'verified'])
            .get();

        const allTemplates = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SystemTemplate));

        return allTemplates.filter(t => !t.applicableIndustries || t.applicableIndustries.length === 0);
    } catch (error) {
        console.error('Error fetching universal templates:', error);
        return [];
    }
}
