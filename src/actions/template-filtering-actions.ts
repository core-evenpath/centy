'use server';

import { db as adminDb } from '@/lib/firebase-admin';
import { SystemTemplate, Partner } from '@/lib/types';
import {
    getPartnerIndustryIds,
    matchTemplateToIndustry,
    sortTemplatesByRelevance
} from '@/lib/industry-template-matcher';
import type { PartnerModule } from '@/lib/modules/types';

interface GetTemplatesResult {
    success: boolean;
    templates: SystemTemplate[];
    partnerIndustries: string[];
    partnerFunctionIds: string[];
    enabledModuleSlugs: string[];
    error?: string;
}

export async function getTemplatesForPartnerIndustry(partnerId: string): Promise<GetTemplatesResult> {
    try {
        const partnerDoc = await adminDb.collection('partners').doc(partnerId).get();

        if (!partnerDoc.exists) {
            console.error(`Partner not found: ${partnerId}`);
            return {
                success: false,
                error: 'Partner not found',
                templates: [],
                partnerIndustries: [],
                partnerFunctionIds: [],
                enabledModuleSlugs: [],
            };
        }

        const partnerData = partnerDoc.data() as Partner;

        const partnerIndustryIds = getPartnerIndustryIds(partnerData);
        const partnerIndustryIdsArray = Array.from(partnerIndustryIds);

        const partnerFunctionIds: string[] = [];
        const persona = (partnerData as any).businessPersona;
        if (persona?.identity?.businessCategories && Array.isArray(persona.identity.businessCategories)) {
            persona.identity.businessCategories.forEach((cat: any) => {
                if (cat && typeof cat === 'object' && cat.functionId) {
                    partnerFunctionIds.push(cat.functionId);
                }
            });
        }

        console.log(`[TemplateFilter] Partner ${partnerId} industries:`, partnerIndustryIdsArray);

        const [templatesSnapshot, modulesSnapshot] = await Promise.all([
            adminDb
                .collection('systemTemplates')
                .where('status', 'in', ['published', 'verified', 'active'])
                .get(),
            adminDb
                .collection(`partners/${partnerId}/businessModules`)
                .where('enabled', '==', true)
                .get(),
        ]);

        const enabledModuleSlugs = modulesSnapshot.docs.map(doc => {
            const data = doc.data() as PartnerModule;
            return data.moduleSlug;
        }).filter(Boolean);

        const allTemplates = templatesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SystemTemplate));

        const matchedTemplates = allTemplates.filter(template =>
            matchTemplateToIndustry(template, partnerIndustryIds)
        );

        const sortedTemplates = sortTemplatesByRelevance(matchedTemplates, partnerIndustryIds);

        console.log(`[TemplateFilter] Returning ${sortedTemplates.length} templates for partner ${partnerId}`);

        return {
            success: true,
            templates: sortedTemplates,
            partnerIndustries: partnerIndustryIdsArray,
            partnerFunctionIds,
            enabledModuleSlugs,
        };

    } catch (error) {
        console.error('Error filtering templates:', error);
        return {
            success: false,
            error: 'Failed to fetch templates',
            templates: [],
            partnerIndustries: [],
            partnerFunctionIds: [],
            enabledModuleSlugs: [],
        };
    }
}

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
