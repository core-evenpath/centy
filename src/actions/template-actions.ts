'use server';

import { revalidatePath } from 'next/cache';
import { db as adminDb } from '@/lib/firebase-admin';
import type { SystemTemplate } from '@/lib/types';
// import { getUserProfileAction } from './auth-actions';

// ============================================================================
// TEMPLATE ACTIONS
// ============================================================================

export async function getSystemTemplatesAction(): Promise<{ success: boolean; data?: SystemTemplate[]; error?: string }> {
    try {
        const snapshot = await adminDb.collection('systemTemplates').orderBy('updatedAt', 'desc').get();
        const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemTemplate));
        return { success: true, data: templates };
    } catch (error) {
        console.error('Error fetching system templates:', error);
        return { success: false, error: 'Failed to fetch system templates' };
    }
}

export async function createSystemTemplateAction(
    data: Omit<SystemTemplate, 'id' | 'createdAt' | 'updatedAt' | 'variableCount' | 'variables'>
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
    try {
        // Extract variables from body component
        let variableCount = 0;
        const variables: string[] = [];

        const bodyComponent = data.components.find(c => c.type === 'BODY');
        if (bodyComponent && bodyComponent.text) {
            const matches = bodyComponent.text.match(/{{(\d+)}}/g);
            if (matches) {
                variables.push(...matches);
                variableCount = matches.length;
            }
        }

        const now = new Date().toISOString();
        const newTemplateRef = adminDb.collection('systemTemplates').doc();

        const templateData: SystemTemplate = {
            ...data,
            id: newTemplateRef.id,
            variableCount,
            variables,
            createdAt: now,
            updatedAt: now,
        };

        await newTemplateRef.set(templateData);

        revalidatePath('/admin/templates');
        return { success: true, data: { id: newTemplateRef.id } };

    } catch (error) {
        console.error('Error creating system template:', error);
        return { success: false, error: 'Failed to create system template' };
    }
}

export async function updateSystemTemplateAction(
    templateId: string,
    data: Partial<Omit<SystemTemplate, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<{ success: boolean; error?: string }> {
    try {
        const templateRef = adminDb.collection('systemTemplates').doc(templateId);

        const updateData: any = {
            ...data,
            updatedAt: new Date().toISOString(),
        };

        // Re-calculate variables if components changed
        if (data.components) {
            let variableCount = 0;
            const variables: string[] = [];
            const bodyComponent = data.components.find(c => c.type === 'BODY');
            if (bodyComponent && bodyComponent.text) {
                const matches = bodyComponent.text.match(/{{(\d+)}}/g);
                if (matches) {
                    variables.push(...matches);
                    variableCount = matches.length;
                }
            }
            updateData.variableCount = variableCount;
            updateData.variables = variables;
        }

        await templateRef.update(updateData);
        revalidatePath('/admin/templates');
        return { success: true };
    } catch (error) {
        console.error('Error updating system template:', error);
        return { success: false, error: 'Failed to update system template' };
    }
}


export async function deleteSystemTemplateAction(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await adminDb.collection('systemTemplates').doc(templateId).delete();
        revalidatePath('/admin/templates');
        return { success: true };
    } catch (error) {
        console.error('Error deleting system template:', error);
        return { success: false, error: 'Failed to delete system template' };
    }
}

export async function deleteAllSystemTemplatesAction(): Promise<{ success: boolean; error?: string }> {
    try {
        const snapshot = await adminDb.collection('systemTemplates').get();
        if (snapshot.empty) {
            return { success: true };
        }

        const batch = adminDb.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        revalidatePath('/admin/templates');
        return { success: true };
    } catch (error) {
        console.error('Error deleting all system templates:', error);
        return { success: false, error: 'Failed to delete all system templates' };
    }
}


export async function deleteSystemTemplatesBatchAction(templateIds: string[]): Promise<{ success: boolean; error?: string }> {
    try {
        if (!templateIds.length) return { success: true };

        const batch = adminDb.batch();
        templateIds.forEach(id => {
            const ref = adminDb.collection('systemTemplates').doc(id);
            batch.delete(ref);
        });

        await batch.commit();
        revalidatePath('/admin/templates');
        return { success: true };
    } catch (error) {
        console.error('Error deleting system templates batch:', error);
        return { success: false, error: 'Failed to delete selected templates' };
    }
}

// ============================================================================
// PARTNER TEMPLATE ACTIONS
// ============================================================================

export async function getAvailableTemplatesForPartnerAction(
    partnerId: string
): Promise<{ success: boolean; data?: SystemTemplate[]; error?: string }> {
    try {
        // 1. Get partner profile to find industries
        const partnerDoc = await adminDb.collection('partners').doc(partnerId).get();
        if (!partnerDoc.exists) {
            return { success: false, error: 'Partner not found' };
        }

        const partnerData = partnerDoc.data();
        const industryId = partnerData?.industry?.id; // Assuming industry is stored as { id, name } or similar
        // Fallback to checking businessCategories if industry not directly on partner root
        const businessCategories = partnerData?.businessPersona?.identity?.businessCategories || [];
        const industryIds = new Set<string>();

        if (industryId) industryIds.add(industryId);
        businessCategories.forEach((cat: any) => {
            if (cat.industryId) industryIds.add(cat.industryId);
        });

        // 2. Fetch all published/verified templates
        const snapshot = await adminDb
            .collection('systemTemplates')
            .where('status', 'in', ['published', 'verified'])
            .orderBy('updatedAt', 'desc')
            .get();

        const allTemplates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemTemplate));

        // 3. Filter by industry
        const filteredTemplates = allTemplates.filter(template => {
            // Include universal templates (no specific industries)
            if (!template.applicableIndustries || template.applicableIndustries.length === 0) {
                return true;
            }
            // Include if partner matches at least one industry
            return template.applicableIndustries.some(id => industryIds.has(id));
        });

        return { success: true, data: filteredTemplates };

    } catch (error) {
        console.error('Error fetching partner templates:', error);
        return { success: false, error: 'Failed to fetch partner templates' };
    }
}

export async function instantiateTemplateForPartnerAction(
    partnerId: string,
    templateId: string
): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
    try {
        // 1. Fetch system template
        const templateDoc = await adminDb.collection('systemTemplates').doc(templateId).get();
        if (!templateDoc.exists) {
            return { success: false, error: 'Template not found' };
        }
        const systemTemplate = templateDoc.data() as SystemTemplate;

        // 2. Prepare partner copy
        const partnerTemplateRef = adminDb.collection('partners').doc(partnerId).collection('templates').doc();

        const now = new Date().toISOString();
        const partnerTemplate = {
            ...systemTemplate,
            id: partnerTemplateRef.id,
            isSystem: false,
            originSystemTemplateId: templateId,
            partnerId: partnerId,
            status: 'draft', // Draft until they review/publish it
            createdAt: now,
            updatedAt: now,
        };

        // 3. Save to partner's subcollection
        await partnerTemplateRef.set(partnerTemplate);

        // 4. Revalidate cache (if necessary, though partner pages might be client-side fetched or different path)
        revalidatePath(`/partner/broadcast`);


        return { success: true, data: { id: partnerTemplateRef.id } };

    } catch (error) {
        console.error('Error instantiating template:', error);
        return { success: false, error: 'Failed to copy template' };
    }
}

export async function getPartnerTemplatesAction(partnerId: string): Promise<{ success: boolean; data?: SystemTemplate[]; error?: string }> {
    try {
        const snapshot = await adminDb
            .collection('partners')
            .doc(partnerId)
            .collection('templates')
            .orderBy('updatedAt', 'desc')
            .get();

        const templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemTemplate));
        return { success: true, data: templates };
    } catch (error) {
        console.error('Error fetching partner templates:', error);
        return { success: false, error: 'Failed to fetch partner templates' };
    }
}
