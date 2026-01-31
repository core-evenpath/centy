'use server';

import { revalidatePath } from 'next/cache';
import { unstable_cache } from 'next/cache';
import { db as adminDb } from '@/lib/firebase-admin';
import { FieldValue, FieldPath } from 'firebase-admin/firestore';
import type {
    SystemModule,
    ModuleAssignment,
    PartnerModule,
    ModuleItem,
    PartnerModuleCategory,
    ModuleSchema,
    ModuleMigration,
    MigrationPreview,
    MigrationResult,
    ModulesActionResponse,
    PaginatedResponse,
} from '@/lib/modules/types';
import {
    generateModuleId,
    generateItemId,
    generateCategoryId,
    createAutoMigration,
    applyMigrationToItem,
    generateRAGText,
} from '@/lib/modules/utils';
import { DEFAULT_MODULE_SETTINGS } from '@/lib/modules/constants';

// ============================================================================
// SYSTEM MODULES - ADMIN ACTIONS
// ============================================================================

export async function getSystemModulesAction(): Promise<ModulesActionResponse<SystemModule[]>> {
    try {
        const snapshot = await adminDb.collection('systemModules').orderBy('name').get();
        const modules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemModule));
        return { success: true, data: modules };
    } catch (error) {
        console.error('Error fetching system modules:', error);
        return { success: false, error: 'Failed to fetch system modules' };
    }
}

export const getCachedSystemModules = unstable_cache(
    async () => {
        const result = await getSystemModulesAction();
        return result.data || [];
    },
    ['system-modules'],
    { revalidate: 300 }
);

export async function getSystemModuleAction(
    identifier: string
): Promise<ModulesActionResponse<SystemModule>> {
    try {
        // If identifier looks like a document ID (starts with 'mod_'), fetch by ID first
        if (identifier.startsWith('mod_')) {
            const doc = await adminDb.collection('systemModules').doc(identifier).get();
            if (doc.exists) {
                return { success: true, data: { id: doc.id, ...doc.data() } as SystemModule };
            }
        }

        // Otherwise (or if ID lookup missed), search by slug
        const snapshot = await adminDb
            .collection('systemModules')
            .where('slug', '==', identifier)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return { success: false, error: 'Module not found', code: 'NOT_FOUND' };
        }

        const doc = snapshot.docs[0];
        return { success: true, data: { id: doc.id, ...doc.data() } as SystemModule };
    } catch (error) {
        console.error('Error fetching system module:', error);
        return { success: false, error: 'Failed to fetch system module' };
    }
}

export async function createSystemModuleAction(
    data: Omit<SystemModule, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'currentVersion' | 'schemaHistory' | 'migrations'>
): Promise<ModulesActionResponse<{ moduleId: string }>> {
    try {
        const existingSnapshot = await adminDb
            .collection('systemModules')
            .where('slug', '==', data.slug)
            .limit(1)
            .get();

        if (!existingSnapshot.empty) {
            return { success: false, error: 'Module with this slug already exists', code: 'DUPLICATE_SLUG' };
        }

        const moduleId = generateModuleId();
        const now = new Date().toISOString();

        const moduleData: SystemModule = {
            ...data,
            id: moduleId,
            currentVersion: 1,
            schemaHistory: {
                1: {
                    version: 1,
                    fields: data.schema.fields,
                    categories: data.schema.categories,
                    generatedAt: now,
                    generatedBy: 'manual',
                    status: 'active',
                }
            },
            migrations: {},
            settings: { ...DEFAULT_MODULE_SETTINGS, ...data.settings },
            usageCount: 0,
            createdAt: now,
            updatedAt: now,
        };

        await adminDb.collection('systemModules').doc(moduleId).set(moduleData);

        revalidatePath('/admin/modules');
        return { success: true, data: { moduleId } };
    } catch (error) {
        console.error('Error creating system module:', error);
        return { success: false, error: 'Failed to create system module' };
    }
}

export async function updateSystemModuleAction(
    moduleId: string,
    data: Partial<Omit<SystemModule, 'id' | 'slug' | 'createdAt' | 'schemaHistory' | 'migrations'>>
): Promise<ModulesActionResponse> {
    try {
        const moduleRef = adminDb.collection('systemModules').doc(moduleId);
        const moduleDoc = await moduleRef.get();

        if (!moduleDoc.exists) {
            return { success: false, error: 'Module not found', code: 'NOT_FOUND' };
        }

        await moduleRef.update({
            ...data,
            updatedAt: new Date().toISOString(),
        });

        revalidatePath('/admin/modules');
        revalidatePath(`/admin/modules/${moduleId}`);
        return { success: true };
    } catch (error) {
        console.error('Error updating system module:', error);
        return { success: false, error: 'Failed to update system module' };
    }
}

export async function publishNewSchemaVersionAction(
    moduleId: string,
    newSchema: ModuleSchema,
    generatedBy: 'ai' | 'manual',
    changeNotes?: string,
    aiModel?: string
): Promise<ModulesActionResponse<{ version: number }>> {
    try {
        const moduleRef = adminDb.collection('systemModules').doc(moduleId);
        const moduleDoc = await moduleRef.get();

        if (!moduleDoc.exists) {
            return { success: false, error: 'Module not found', code: 'NOT_FOUND' };
        }

        const module = moduleDoc.data() as SystemModule;
        const newVersion = module.currentVersion + 1;
        const now = new Date().toISOString();

        const migration = createAutoMigration(
            module.currentVersion,
            newVersion,
            module.schema,
            newSchema,
            'system'
        );

        await moduleRef.update({
            currentVersion: newVersion,
            schema: newSchema,
            [`schemaHistory.${newVersion}`]: {
                version: newVersion,
                fields: newSchema.fields,
                categories: newSchema.categories,
                generatedAt: now,
                generatedBy,
                aiModel,
                status: 'active',
                changeNotes,
            },
            [`schemaHistory.${module.currentVersion}.status`]: 'deprecated',
            [`migrations.${module.currentVersion}_to_${newVersion}`]: migration,
            updatedAt: now,
        });

        const partnersSnapshot = await adminDb
            .collection('partners')
            .get();

        const batch = adminDb.batch();

        for (const partnerDoc of partnersSnapshot.docs) {
            const modulesSnapshot = await adminDb
                .collection(`partners/${partnerDoc.id}/businessModules`)
                .where('moduleSlug', '==', module.slug)
                .get();

            for (const moduleInstanceDoc of modulesSnapshot.docs) {
                const partnerModule = moduleInstanceDoc.data() as PartnerModule;
                if (partnerModule.schemaVersion < newVersion) {
                    batch.update(moduleInstanceDoc.ref, {
                        upgradeAvailable: true,
                        latestVersion: newVersion,
                        updatedAt: now,
                    });
                }
            }
        }

        await batch.commit();

        revalidatePath('/admin/modules');
        revalidatePath(`/admin/modules/${moduleId}`);
        return { success: true, data: { version: newVersion } };
    } catch (error) {
        console.error('Error publishing new schema version:', error);
        return { success: false, error: 'Failed to publish new schema version' };
    }
}

export async function deleteSystemModuleAction(
    moduleId: string
): Promise<ModulesActionResponse> {
    try {
        const moduleRef = adminDb.collection('systemModules').doc(moduleId);
        const moduleDoc = await moduleRef.get();

        if (!moduleDoc.exists) {
            return { success: false, error: 'Module not found', code: 'NOT_FOUND' };
        }

        const module = moduleDoc.data() as SystemModule;

        if (module.usageCount > 0) {
            return {
                success: false,
                error: `Cannot delete module that is in use by ${module.usageCount} partners`,
                code: 'IN_USE'
            };
        }

        await moduleRef.delete();

        revalidatePath('/admin/modules');
        return { success: true };
    } catch (error) {
        console.error('Error deleting system module:', error);
        return { success: false, error: 'Failed to delete system module' };
    }
}

export async function bulkDeleteSystemModulesAction(
    moduleIds: string[] = [] // Empty array means delete ALL
): Promise<ModulesActionResponse<{ deletedCount: number }>> {
    try {
        let query: FirebaseFirestore.Query = adminDb.collection('systemModules');

        if (moduleIds.length > 0) {
            query = query.where(FieldPath.documentId(), 'in', moduleIds);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            return { success: true, data: { deletedCount: 0 } };
        }

        const batch = adminDb.batch();
        let deletedCount = 0;

        for (const doc of snapshot.docs) {
            const module = doc.data() as SystemModule;
            // For testing: we allow deleting specific modules even if used, 
            // but maybe we should be careful? 
            // The prompt says "for testing", so usually we want to clear everything.
            // Let's add a safe guard: only delete if usageCount is 0, UNLESS force is implied?
            // Actually, for "bulk remove", let's just delete them. 
            // If they are used, the references will break. Ideally we clean up partners too, but that's expensive.
            // Let's print a warning but allow it for now if usageCount > 0, or maybe skip?
            // The existing deleteSystemModuleAction blocks it.
            // Let's stick to the same logic: Skip unused ones unless we want a "Force Delete" flag.
            // For now, I'll silently skip used ones to be safe, or maybe just delete them if usageCount is low?
            // Re-reading user request: "remove modules... for testing". Usually implies clearing generated stuff.
            // Generated modules usually have 0 usage initially.

            if (module.usageCount > 0) {
                console.warn(`Skipping module ${module.slug} as it is in use.`);
                continue;
            }

            batch.delete(doc.ref);
            deletedCount++;
        }

        await batch.commit();

        revalidatePath('/admin/modules');
        return { success: true, data: { deletedCount } };
    } catch (error) {
        console.error('Error bulk deleting system modules:', error);
        return { success: false, error: 'Failed to bulk delete system modules' };
    }
}

// ============================================================================
// MODULE ASSIGNMENTS - ADMIN ACTIONS
// ============================================================================

export async function getModuleAssignmentsAction(
    industryId?: string
): Promise<ModulesActionResponse<ModuleAssignment[]>> {
    try {
        let query = adminDb.collection('systemTaxonomy').doc('moduleAssignments').collection('items');

        if (industryId) {
            query = query.where('industryId', '==', industryId) as any;
        }

        const snapshot = await query.get();
        const assignments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ModuleAssignment));
        return { success: true, data: assignments };
    } catch (error) {
        console.error('Error fetching module assignments:', error);
        return { success: false, error: 'Failed to fetch module assignments' };
    }
}

export async function updateModuleAssignmentAction(
    industryId: string,
    functionId: string,
    modules: ModuleAssignment['modules'],
    industryName: string,
    functionName: string,
    userId: string
): Promise<ModulesActionResponse> {
    try {
        const assignmentId = `${industryId}_${functionId}`;
        const assignmentRef = adminDb
            .collection('systemTaxonomy')
            .doc('moduleAssignments')
            .collection('items')
            .doc(assignmentId);

        const now = new Date().toISOString();

        await assignmentRef.set({
            id: assignmentId,
            industryId,
            functionId,
            industryName,
            functionName,
            modules,
            updatedAt: now,
            updatedBy: userId,
        }, { merge: true });

        revalidatePath('/admin/modules/assignments');
        return { success: true };
    } catch (error) {
        console.error('Error updating module assignment:', error);
        return { success: false, error: 'Failed to update module assignment' };
    }
}

// ============================================================================
// PARTNER MODULES - PARTNER ACTIONS
// ============================================================================

export async function getAvailableModulesForPartnerAction(
    partnerId: string
): Promise<ModulesActionResponse<{ modules: SystemModule[]; assignment: ModuleAssignment | null }>> {
    try {
        const partnerDoc = await adminDb.collection('partners').doc(partnerId).get();

        if (!partnerDoc.exists) {
            return { success: false, error: 'Partner not found', code: 'NOT_FOUND' };
        }

        const partner = partnerDoc.data();
        const businessCategories = partner?.businessPersona?.identity?.businessCategories || [];

        if (businessCategories.length === 0) {
            const allModulesSnapshot = await adminDb
                .collection('systemModules')
                .where('status', '==', 'active')
                .get();

            const modules = allModulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemModule));
            return { success: true, data: { modules, assignment: null } };
        }

        const primaryCategory = businessCategories[0];
        const assignmentId = `${primaryCategory.industryId}_${primaryCategory.functionId}`;

        const assignmentDoc = await adminDb
            .collection('systemTaxonomy')
            .doc('moduleAssignments')
            .collection('items')
            .doc(assignmentId)
            .get();

        let assignment: ModuleAssignment | null = null;
        let moduleSlugs: string[] = [];

        if (assignmentDoc.exists) {
            assignment = { id: assignmentDoc.id, ...assignmentDoc.data() } as ModuleAssignment;
            moduleSlugs = assignment.modules.map(m => m.moduleSlug);
        }

        const modulesSnapshot = await adminDb
            .collection('systemModules')
            .where('status', '==', 'active')
            .get();

        let modules = modulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemModule));

        if (moduleSlugs.length > 0) {
            modules = modules.filter(m => moduleSlugs.includes(m.slug));
        }

        return { success: true, data: { modules, assignment } };
    } catch (error) {
        console.error('Error fetching available modules:', error);
        return { success: false, error: 'Failed to fetch available modules' };
    }
}

export async function getPartnerModulesAction(
    partnerId: string
): Promise<ModulesActionResponse<PartnerModule[]>> {
    try {
        const snapshot = await adminDb
            .collection(`partners/${partnerId}/businessModules`)
            .orderBy('createdAt', 'desc')
            .get();

        const modules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PartnerModule));
        return { success: true, data: modules };
    } catch (error) {
        console.error('Error fetching partner modules:', error);
        return { success: false, error: 'Failed to fetch partner modules' };
    }
}

export async function getPartnerModuleAction(
    partnerId: string,
    moduleSlug: string
): Promise<ModulesActionResponse<{ partnerModule: PartnerModule; systemModule: SystemModule }>> {
    try {
        const partnerModuleSnapshot = await adminDb
            .collection(`partners/${partnerId}/businessModules`)
            .where('moduleSlug', '==', moduleSlug)
            .limit(1)
            .get();

        if (partnerModuleSnapshot.empty) {
            return { success: false, error: 'Module not enabled for this partner', code: 'NOT_FOUND' };
        }

        const partnerModule = {
            id: partnerModuleSnapshot.docs[0].id,
            ...partnerModuleSnapshot.docs[0].data()
        } as PartnerModule;

        const systemModuleResult = await getSystemModuleAction(moduleSlug);

        if (!systemModuleResult.success || !systemModuleResult.data) {
            return { success: false, error: 'System module not found', code: 'NOT_FOUND' };
        }

        return {
            success: true,
            data: { partnerModule, systemModule: systemModuleResult.data }
        };
    } catch (error) {
        console.error('Error fetching partner module:', error);
        return { success: false, error: 'Failed to fetch partner module' };
    }
}

export async function enablePartnerModuleAction(
    partnerId: string,
    moduleSlug: string,
    customName?: string
): Promise<ModulesActionResponse<{ moduleId: string }>> {
    try {
        const existingSnapshot = await adminDb
            .collection(`partners/${partnerId}/businessModules`)
            .where('moduleSlug', '==', moduleSlug)
            .limit(1)
            .get();

        if (!existingSnapshot.empty) {
            return { success: false, error: 'Module already enabled', code: 'ALREADY_EXISTS' };
        }

        const systemModuleResult = await getSystemModuleAction(moduleSlug);

        if (!systemModuleResult.success || !systemModuleResult.data) {
            return { success: false, error: 'System module not found', code: 'NOT_FOUND' };
        }

        const systemModule = systemModuleResult.data;
        const moduleId = generateModuleId();
        const now = new Date().toISOString();

        const partnerModule: PartnerModule = {
            id: moduleId,
            partnerId,
            moduleSlug,
            moduleId: systemModule.id,
            name: customName || systemModule.name,
            enabled: true,
            schemaVersion: systemModule.currentVersion,
            upgradeAvailable: false,
            latestVersion: systemModule.currentVersion,
            lastUpgradeCheck: now,
            customFields: [],
            customCategories: [],
            itemCount: 0,
            activeItemCount: 0,
            settings: {
                defaultCurrency: systemModule.defaultCurrency || 'INR',
                showInactiveItems: false,
                itemsPerPage: 20,
            },
            createdAt: now,
            updatedAt: now,
        };

        await adminDb
            .collection(`partners/${partnerId}/businessModules`)
            .doc(moduleId)
            .set(partnerModule);

        await adminDb.collection('systemModules').doc(systemModule.id).update({
            usageCount: FieldValue.increment(1),
            lastUsedAt: now,
        });

        const defaultCategories = systemModule.schema.categories;
        const categoriesBatch = adminDb.batch();

        for (const category of defaultCategories) {
            const categoryRef = adminDb
                .collection(`partners/${partnerId}/businessModules/${moduleId}/categories`)
                .doc(category.id);

            categoriesBatch.set(categoryRef, {
                ...category,
                moduleId,
                partnerId,
                itemCount: 0,
                isActive: true,
                createdAt: now,
                updatedAt: now,
            });
        }

        await categoriesBatch.commit();

        revalidatePath(`/partner/modules`);
        return { success: true, data: { moduleId } };
    } catch (error) {
        console.error('Error enabling partner module:', error);
        return { success: false, error: 'Failed to enable module' };
    }
}

export async function disablePartnerModuleAction(
    partnerId: string,
    moduleId: string
): Promise<ModulesActionResponse> {
    try {
        const moduleRef = adminDb.collection(`partners/${partnerId}/businessModules`).doc(moduleId);
        const moduleDoc = await moduleRef.get();

        if (!moduleDoc.exists) {
            return { success: false, error: 'Module not found', code: 'NOT_FOUND' };
        }

        const partnerModule = moduleDoc.data() as PartnerModule;

        await moduleRef.update({
            enabled: false,
            updatedAt: new Date().toISOString(),
        });

        const systemModuleResult = await getSystemModuleAction(partnerModule.moduleSlug);
        if (systemModuleResult.success && systemModuleResult.data) {
            await adminDb.collection('systemModules').doc(systemModuleResult.data.id).update({
                usageCount: FieldValue.increment(-1),
            });
        }

        revalidatePath(`/partner/modules`);
        return { success: true };
    } catch (error) {
        console.error('Error disabling partner module:', error);
        return { success: false, error: 'Failed to disable module' };
    }
}

// ============================================================================
// MODULE ITEMS - PARTNER ACTIONS
// ============================================================================

export async function getModuleItemsAction(
    partnerId: string,
    moduleId: string,
    options?: {
        category?: string;
        search?: string;
        isActive?: boolean;
        page?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }
): Promise<ModulesActionResponse<PaginatedResponse<ModuleItem>>> {
    try {
        const {
            category,
            search,
            isActive,
            page = 1,
            pageSize = 20,
            sortBy = 'sortOrder',
            sortOrder = 'asc'
        } = options || {};

        let query: FirebaseFirestore.Query = adminDb
            .collection(`partners/${partnerId}/businessModules/${moduleId}/items`);

        if (category) {
            query = query.where('category', '==', category);
        }

        if (isActive !== undefined) {
            query = query.where('isActive', '==', isActive);
        }

        query = query.orderBy(sortBy, sortOrder);

        const countSnapshot = await query.count().get();
        const total = countSnapshot.data().count;

        const offset = (page - 1) * pageSize;
        query = query.offset(offset).limit(pageSize);

        const snapshot = await query.get();
        let items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ModuleItem));

        if (search) {
            const searchLower = search.toLowerCase();
            items = items.filter(item =>
                item.name.toLowerCase().includes(searchLower) ||
                item.description?.toLowerCase().includes(searchLower)
            );
        }

        return {
            success: true,
            data: {
                items,
                total,
                page,
                pageSize,
                hasMore: offset + items.length < total,
            }
        };
    } catch (error) {
        console.error('Error fetching module items:', error);
        return { success: false, error: 'Failed to fetch module items' };
    }
}

export async function createModuleItemAction(
    partnerId: string,
    moduleId: string,
    data: Omit<ModuleItem, 'id' | 'moduleId' | 'partnerId' | 'createdAt' | 'updatedAt' | '_schemaVersion' | 'ragText' | 'ragUpdatedAt'>,
    userId: string
): Promise<ModulesActionResponse<{ itemId: string }>> {
    try {
        const partnerModuleResult = await getPartnerModuleByIdAction(partnerId, moduleId);

        if (!partnerModuleResult.success || !partnerModuleResult.data) {
            return { success: false, error: 'Module not found', code: 'NOT_FOUND' };
        }

        const { partnerModule, systemModule } = partnerModuleResult.data;

        if (partnerModule.itemCount >= systemModule.settings.maxItems) {
            return { success: false, error: `Maximum items limit (${systemModule.settings.maxItems}) reached`, code: 'LIMIT_REACHED' };
        }

        const itemId = generateItemId();
        const now = new Date().toISOString();

        const ragText = generateRAGText(
            { ...data, id: itemId, moduleId, partnerId } as ModuleItem,
            systemModule.schemaHistory[partnerModule.schemaVersion] || systemModule.schema
        );

        const item: ModuleItem = {
            ...data,
            id: itemId,
            moduleId,
            partnerId,
            _schemaVersion: partnerModule.schemaVersion,
            ragText,
            ragUpdatedAt: now,
            createdAt: now,
            updatedAt: now,
            createdBy: userId,
        };

        await adminDb
            .collection(`partners/${partnerId}/businessModules/${moduleId}/items`)
            .doc(itemId)
            .set(item);

        await adminDb
            .collection(`partners/${partnerId}/businessModules`)
            .doc(moduleId)
            .update({
                itemCount: FieldValue.increment(1),
                activeItemCount: data.isActive ? FieldValue.increment(1) : FieldValue.increment(0),
                lastItemAddedAt: now,
                updatedAt: now,
            });

        if (data.category) {
            const categorySnapshot = await adminDb
                .collection(`partners/${partnerId}/businessModules/${moduleId}/categories`)
                .where('id', '==', data.category)
                .limit(1)
                .get();

            if (!categorySnapshot.empty) {
                await categorySnapshot.docs[0].ref.update({
                    itemCount: FieldValue.increment(1),
                });
            }
        }

        revalidatePath(`/partner/modules/${partnerModule.moduleSlug}`);
        return { success: true, data: { itemId } };
    } catch (error) {
        console.error('Error creating module item:', error);
        return { success: false, error: 'Failed to create item' };
    }
}

export async function updateModuleItemAction(
    partnerId: string,
    moduleId: string,
    itemId: string,
    data: Partial<Omit<ModuleItem, 'id' | 'moduleId' | 'partnerId' | 'createdAt' | 'createdBy'>>,
    userId: string
): Promise<ModulesActionResponse> {
    try {
        const itemRef = adminDb
            .collection(`partners/${partnerId}/businessModules/${moduleId}/items`)
            .doc(itemId);

        const itemDoc = await itemRef.get();

        if (!itemDoc.exists) {
            return { success: false, error: 'Item not found', code: 'NOT_FOUND' };
        }

        const existingItem = itemDoc.data() as ModuleItem;
        const now = new Date().toISOString();

        const updates: Partial<ModuleItem> = {
            ...data,
            updatedAt: now,
            updatedBy: userId,
        };

        if (data.name || data.description || data.fields) {
            const partnerModuleResult = await getPartnerModuleByIdAction(partnerId, moduleId);
            if (partnerModuleResult.success && partnerModuleResult.data) {
                const { partnerModule, systemModule } = partnerModuleResult.data;
                const mergedItem = { ...existingItem, ...data } as ModuleItem;
                updates.ragText = generateRAGText(
                    mergedItem,
                    systemModule.schemaHistory[partnerModule.schemaVersion] || systemModule.schema
                );
                updates.ragUpdatedAt = now;
            }
        }

        await itemRef.update(updates);

        if (data.isActive !== undefined && data.isActive !== existingItem.isActive) {
            await adminDb
                .collection(`partners/${partnerId}/businessModules`)
                .doc(moduleId)
                .update({
                    activeItemCount: data.isActive ? FieldValue.increment(1) : FieldValue.increment(-1),
                    updatedAt: now,
                });
        }

        if (data.category && data.category !== existingItem.category) {
            const batch = adminDb.batch();

            const oldCategorySnapshot = await adminDb
                .collection(`partners/${partnerId}/businessModules/${moduleId}/categories`)
                .where('id', '==', existingItem.category)
                .limit(1)
                .get();

            if (!oldCategorySnapshot.empty) {
                batch.update(oldCategorySnapshot.docs[0].ref, {
                    itemCount: FieldValue.increment(-1),
                });
            }

            const newCategorySnapshot = await adminDb
                .collection(`partners/${partnerId}/businessModules/${moduleId}/categories`)
                .where('id', '==', data.category)
                .limit(1)
                .get();

            if (!newCategorySnapshot.empty) {
                batch.update(newCategorySnapshot.docs[0].ref, {
                    itemCount: FieldValue.increment(1),
                });
            }

            await batch.commit();
        }

        revalidatePath(`/partner/modules`);
        return { success: true };
    } catch (error) {
        console.error('Error updating module item:', error);
        return { success: false, error: 'Failed to update item' };
    }
}

export async function reorderItemsAction(
    partnerId: string,
    moduleId: string,
    itemIds: string[]
): Promise<ModulesActionResponse> {
    try {
        const batch = adminDb.batch();
        const now = new Date().toISOString();

        for (let i = 0; i < itemIds.length; i++) {
            const itemRef = adminDb
                .collection(`partners/${partnerId}/businessModules/${moduleId}/items`)
                .doc(itemIds[i]);

            batch.update(itemRef, {
                sortOrder: i,
                updatedAt: now,
            });
        }

        await batch.commit();
        revalidatePath(`/partner/modules`);
        return { success: true };
    } catch (error) {
        console.error('Error reordering items:', error);
        return { success: false, error: 'Failed to reorder items' };
    }
}

export async function deleteModuleItemAction(
    partnerId: string,
    moduleId: string,
    itemId: string
): Promise<ModulesActionResponse> {
    try {
        const itemRef = adminDb
            .collection(`partners/${partnerId}/businessModules/${moduleId}/items`)
            .doc(itemId);

        const itemDoc = await itemRef.get();

        if (!itemDoc.exists) {
            return { success: false, error: 'Item not found', code: 'NOT_FOUND' };
        }

        const item = itemDoc.data() as ModuleItem;

        await itemRef.delete();

        await adminDb
            .collection(`partners/${partnerId}/businessModules`)
            .doc(moduleId)
            .update({
                itemCount: FieldValue.increment(-1),
                activeItemCount: item.isActive ? FieldValue.increment(-1) : FieldValue.increment(0),
                updatedAt: new Date().toISOString(),
            });

        if (item.category) {
            const categorySnapshot = await adminDb
                .collection(`partners/${partnerId}/businessModules/${moduleId}/categories`)
                .where('id', '==', item.category)
                .limit(1)
                .get();

            if (!categorySnapshot.empty) {
                await categorySnapshot.docs[0].ref.update({
                    itemCount: FieldValue.increment(-1),
                });
            }
        }

        revalidatePath(`/partner/modules`);
        return { success: true };
    } catch (error) {
        console.error('Error deleting module item:', error);
        return { success: false, error: 'Failed to delete item' };
    }
}

export async function bulkUpdateModuleItemsAction(
    partnerId: string,
    moduleId: string,
    updates: { itemId: string; data: Partial<ModuleItem> }[],
    userId: string
): Promise<ModulesActionResponse<{ updated: number; failed: number }>> {
    try {
        const batch = adminDb.batch();
        const now = new Date().toISOString();
        let updated = 0;
        let failed = 0;

        for (const { itemId, data } of updates) {
            try {
                const itemRef = adminDb
                    .collection(`partners/${partnerId}/businessModules/${moduleId}/items`)
                    .doc(itemId);

                batch.update(itemRef, {
                    ...data,
                    updatedAt: now,
                    updatedBy: userId,
                });
                updated++;
            } catch {
                failed++;
            }
        }

        await batch.commit();

        revalidatePath(`/partner/modules`);
        return { success: true, data: { updated, failed } };
    } catch (error) {
        console.error('Error bulk updating items:', error);
        return { success: false, error: 'Failed to bulk update items' };
    }
}

// ============================================================================
// MIGRATION ACTIONS
// ============================================================================

export async function getMigrationPreviewAction(
    partnerId: string,
    moduleId: string,
    targetVersion: number
): Promise<ModulesActionResponse<MigrationPreview>> {
    try {
        const partnerModuleResult = await getPartnerModuleByIdAction(partnerId, moduleId);

        if (!partnerModuleResult.success || !partnerModuleResult.data) {
            return { success: false, error: 'Module not found', code: 'NOT_FOUND' };
        }

        const { partnerModule, systemModule } = partnerModuleResult.data;

        if (partnerModule.schemaVersion >= targetVersion) {
            return { success: false, error: 'Already on this version or newer', code: 'INVALID_VERSION' };
        }

        if (!systemModule.schemaHistory[targetVersion]) {
            return { success: false, error: 'Target version does not exist', code: 'VERSION_NOT_FOUND' };
        }

        const migrations: ModuleMigration[] = [];
        for (let v = partnerModule.schemaVersion; v < targetVersion; v++) {
            const migrationKey = `${v}_to_${v + 1}`;
            if (systemModule.migrations[migrationKey]) {
                migrations.push(systemModule.migrations[migrationKey]);
            }
        }

        const keptFields: MigrationPreview['keptFields'] = [];
        const addedFields: MigrationPreview['addedFields'] = [];
        const removedFields: MigrationPreview['removedFields'] = [];
        const renamedFields: MigrationPreview['renamedFields'] = [];

        const currentSchema = systemModule.schemaHistory[partnerModule.schemaVersion];
        const targetSchema = systemModule.schemaHistory[targetVersion];

        for (const migration of migrations) {
            for (const mapping of migration.fieldMappings) {
                if (mapping.transform === 'rename' && mapping.oldFieldId !== mapping.newFieldId) {
                    const oldField = currentSchema.fields.find(f => f.id === mapping.oldFieldId);
                    const newField = targetSchema.fields.find(f => f.id === mapping.newFieldId);
                    if (oldField && newField) {
                        renamedFields.push({
                            oldId: mapping.oldFieldId,
                            newId: mapping.newFieldId,
                            oldName: oldField.name,
                            newName: newField.name,
                        });
                    }
                } else {
                    const field = targetSchema.fields.find(f => f.id === mapping.newFieldId);
                    if (field) {
                        keptFields.push({ oldId: mapping.oldFieldId, newId: mapping.newFieldId, name: field.name });
                    }
                }
            }

            for (const fieldId of migration.addedFields) {
                const field = targetSchema.fields.find(f => f.id === fieldId);
                if (field) {
                    addedFields.push({ id: fieldId, name: field.name, defaultValue: migration.defaultValues[fieldId] });
                }
            }

            for (const fieldId of migration.removedFields) {
                const field = currentSchema.fields.find(f => f.id === fieldId);
                if (field) {
                    removedFields.push({ id: fieldId, name: field.name });
                }
            }
        }

        const countSnapshot = await adminDb
            .collection(`partners/${partnerId}/businessModules/${moduleId}/items`)
            .count()
            .get();

        const itemCount = countSnapshot.data().count;
        const estimatedTime = Math.ceil(itemCount / 100) * 2;

        return {
            success: true,
            data: {
                fromVersion: partnerModule.schemaVersion,
                toVersion: targetVersion,
                keptFields,
                addedFields,
                removedFields,
                renamedFields,
                itemCount,
                estimatedTime,
            }
        };
    } catch (error) {
        console.error('Error getting migration preview:', error);
        return { success: false, error: 'Failed to get migration preview' };
    }
}

export async function executeModuleMigrationAction(
    partnerId: string,
    moduleId: string,
    targetVersion: number
): Promise<ModulesActionResponse<MigrationResult>> {
    const startedAt = new Date().toISOString();

    try {
        const partnerModuleResult = await getPartnerModuleByIdAction(partnerId, moduleId);

        if (!partnerModuleResult.success || !partnerModuleResult.data) {
            return { success: false, error: 'Module not found', code: 'NOT_FOUND' };
        }

        const { partnerModule, systemModule } = partnerModuleResult.data;

        const migrations: ModuleMigration[] = [];
        for (let v = partnerModule.schemaVersion; v < targetVersion; v++) {
            const migrationKey = `${v}_to_${v + 1}`;
            if (systemModule.migrations[migrationKey]) {
                migrations.push(systemModule.migrations[migrationKey]);
            }
        }

        const itemsSnapshot = await adminDb
            .collection(`partners/${partnerId}/businessModules/${moduleId}/items`)
            .get();

        let itemsMigrated = 0;
        let itemsFailed = 0;
        let legacyDataPreserved = 0;
        const errors: MigrationResult['errors'] = [];

        const batchSize = 500;
        const items = itemsSnapshot.docs;

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = adminDb.batch();
            const batchItems = items.slice(i, i + batchSize);

            for (const itemDoc of batchItems) {
                try {
                    const item = itemDoc.data() as ModuleItem;
                    const { fields, legacyFields } = applyMigrationToItem(item, migrations);

                    const updates: Partial<ModuleItem> = {
                        fields,
                        _schemaVersion: targetVersion,
                        updatedAt: new Date().toISOString(),
                    };

                    if (Object.keys(legacyFields).length > 0) {
                        updates._legacyFields = {
                            ...item._legacyFields,
                            ...legacyFields,
                        };
                        legacyDataPreserved++;
                    }

                    const targetSchema = systemModule.schemaHistory[targetVersion];
                    updates.ragText = generateRAGText({ ...item, ...updates } as ModuleItem, targetSchema);
                    updates.ragUpdatedAt = new Date().toISOString();

                    batch.update(itemDoc.ref, updates);
                    itemsMigrated++;
                } catch (err) {
                    const item = itemDoc.data() as ModuleItem;
                    errors.push({
                        itemId: itemDoc.id,
                        itemName: item.name,
                        error: err instanceof Error ? err.message : 'Unknown error',
                    });
                    itemsFailed++;
                }
            }

            await batch.commit();
        }

        await adminDb
            .collection(`partners/${partnerId}/businessModules`)
            .doc(moduleId)
            .update({
                schemaVersion: targetVersion,
                upgradeAvailable: targetVersion < systemModule.currentVersion,
                latestVersion: systemModule.currentVersion,
                lastUpgradeCheck: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

        const completedAt = new Date().toISOString();

        revalidatePath(`/partner/modules`);
        revalidatePath(`/partner/modules/${partnerModule.moduleSlug}`);

        return {
            success: itemsFailed === 0,
            data: {
                success: itemsFailed === 0,
                fromVersion: partnerModule.schemaVersion,
                toVersion: targetVersion,
                itemsMigrated,
                itemsFailed,
                errors,
                legacyDataPreserved,
                startedAt,
                completedAt,
                duration: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
            }
        };
    } catch (error) {
        console.error('Error executing migration:', error);
        return { success: false, error: 'Failed to execute migration' };
    }
}

// ============================================================================
// HELPER ACTIONS
// ============================================================================

async function getPartnerModuleByIdAction(
    partnerId: string,
    moduleId: string
): Promise<ModulesActionResponse<{ partnerModule: PartnerModule; systemModule: SystemModule }>> {
    try {
        const moduleDoc = await adminDb
            .collection(`partners/${partnerId}/businessModules`)
            .doc(moduleId)
            .get();

        if (!moduleDoc.exists) {
            return { success: false, error: 'Module not found', code: 'NOT_FOUND' };
        }

        const partnerModule = { id: moduleDoc.id, ...moduleDoc.data() } as PartnerModule;

        const systemModuleResult = await getSystemModuleAction(partnerModule.moduleSlug);

        if (!systemModuleResult.success || !systemModuleResult.data) {
            return { success: false, error: 'System module not found', code: 'NOT_FOUND' };
        }

        return {
            success: true,
            data: { partnerModule, systemModule: systemModuleResult.data }
        };
    } catch (error) {
        console.error('Error fetching partner module by ID:', error);
        return { success: false, error: 'Failed to fetch module' };
    }
}
