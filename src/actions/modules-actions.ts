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
    PartnerCustomField,
    ModuleSchema,
    ModuleFieldDefinition,
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
import { syncModulesToCoreHub } from './core-hub-actions';
import { evaluatePartnerSaveGate, triggerHealthRecompute } from './relay-health-actions';
import { indexModuleItem } from '@/lib/relay/retrieval/index-items';

/**
 * Trigger Core Hub sync in background after module changes
 */
function triggerCoreHubSync(partnerId: string, reason: string): void {
    syncModulesToCoreHub(partnerId)
        .then(result => {
            if (result.success) {
                console.log(`[CoreHub] Background sync complete (${reason}): ${result.itemsSynced} items`);
            } else {
                console.error(`[CoreHub] Background sync failed (${reason}): ${result.message}`);
            }
        })
        .catch(err => {
            console.error(`[CoreHub] Background sync error (${reason}):`, err);
        });
}

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
        // ── PR E4: Relay-aware resolution ─────────────────────────────
        //
        // Relay-owned schemas live in the dedicated `relaySchemas`
        // collection (introduced PR E2, cut over PR E3). Check there
        // first by slug, then fall back to `systemModules` for platform
        // schemas (task trackers, CRMs, non-Relay use cases).
        //
        // Legacy slug normalization: partner docs still carrying the
        // pre-migration `moduleSlug: 'moduleItems'` are remapped via
        // RELAY_SCHEMA_SLUG_MAP ('moduleItems' → 'items'), so reads
        // succeed even before the backfill runs.
        const { RELAY_SCHEMA_SLUG_MAP } = await import(
            '@/actions/relay-schema-migration'
        );
        const normalized = RELAY_SCHEMA_SLUG_MAP[identifier] ?? identifier;

        // Relay schemas are keyed by slug-as-doc-id, not `mod_*` ids.
        // Direct doc lookup covers both the canonical slug (`items`)
        // and the normalized legacy slug path above.
        if (!normalized.startsWith('mod_')) {
            const relayDoc = await adminDb
                .collection('relaySchemas')
                .doc(normalized)
                .get();
            if (relayDoc.exists) {
                return {
                    success: true,
                    data: { id: relayDoc.id, ...relayDoc.data() } as SystemModule,
                };
            }
        }

        // ── systemModules fallback (platform schemas) ─────────────────
        // If identifier looks like a document ID (starts with 'mod_'), fetch by ID first
        if (normalized.startsWith('mod_')) {
            const doc = await adminDb.collection('systemModules').doc(normalized).get();
            if (doc.exists) {
                return { success: true, data: { id: doc.id, ...doc.data() } as SystemModule };
            }
        }

        // Otherwise (or if ID lookup missed), search by slug
        const snapshot = await adminDb
            .collection('systemModules')
            .where('slug', '==', normalized)
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

        const now = new Date().toISOString();

        await moduleRef.update({
            ...data,
            updatedAt: now,
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

        try {
            await adminDb.collection('relayBlockConfigs').doc(`block_${module.slug}`).delete();
        } catch {}
        try {
            await adminDb.collection('relayBlockConfigs').doc(`module_${module.slug}`).delete();
        } catch {}

        revalidatePath('/admin/modules');
        revalidatePath('/admin/relay');
        revalidatePath('/admin/relay/blocks');
        return { success: true };
    } catch (error) {
        console.error('Error deleting system module:', error);
        return { success: false, error: 'Failed to delete system module' };
    }
}

export async function bulkDeleteSystemModulesAction(
    moduleIds: string[] = [],
    force: boolean = false
): Promise<ModulesActionResponse<{ deletedCount: number; skippedCount: number }>> {
    try {
        let query: FirebaseFirestore.Query = adminDb.collection('systemModules');

        if (moduleIds.length > 0) {
            query = query.where(FieldPath.documentId(), 'in', moduleIds);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            return { success: true, data: { deletedCount: 0, skippedCount: 0 } };
        }

        let deletedCount = 0;
        let skippedCount = 0;
        const docs = snapshot.docs;

        for (let i = 0; i < docs.length; i += 500) {
            const batch = adminDb.batch();
            const relayBatch = adminDb.batch();
            const chunk = docs.slice(i, i + 500);

            for (const doc of chunk) {
                const module = doc.data() as SystemModule;

                if (!force && module.usageCount > 0) {
                    console.warn(`Skipping module ${module.slug} (usageCount: ${module.usageCount})`);
                    skippedCount++;
                    continue;
                }

                batch.delete(doc.ref);
                relayBatch.delete(adminDb.collection('relayBlockConfigs').doc(`block_${module.slug}`));
                relayBatch.delete(adminDb.collection('relayBlockConfigs').doc(`module_${module.slug}`));
                deletedCount++;
            }

            await batch.commit();
            try { await relayBatch.commit(); } catch {}
        }

        revalidatePath('/admin/modules');
        revalidatePath('/admin/relay');
        revalidatePath('/admin/relay/blocks');
        return { success: true, data: { deletedCount, skippedCount } };
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
// PARTNER MODULES - AUTOMATIC MATCHING BY INDUSTRY
// ============================================================================

/**
 * Get available modules for a partner based on their business categories.
 * Automatically matches modules by applicableIndustries - no manual assignments needed.
 */
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

        // Get all active system modules
        const modulesSnapshot = await adminDb
            .collection('systemModules')
            .where('status', '==', 'active')
            .get();

        const allModules = modulesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SystemModule));

        // If no business categories selected, return all modules
        if (businessCategories.length === 0) {
            return {
                success: true,
                data: {
                    modules: allModules,
                    assignment: null
                }
            };
        }

        // Extract unique industry IDs and function IDs from partner's business categories
        const partnerIndustryIds = [...new Set(
            businessCategories
                .map((cat: any) => cat.industryId)
                .filter(Boolean)
        )] as string[];

        const partnerFunctionIds = [...new Set(
            businessCategories
                .map((cat: any) => cat.functionId)
                .filter(Boolean)
        )] as string[];

        // Filter modules that match partner's industries and optionally functions
        const matchedModules = allModules.filter(module => {
            const moduleIndustries = module.applicableIndustries || [];
            const moduleFunctions = module.applicableFunctions || [];

            const industryMatch = moduleIndustries.some((ind: string) => partnerIndustryIds.includes(ind));
            if (!industryMatch) return false;

            // If the module has no function restrictions, match on industry alone
            if (moduleFunctions.length === 0) return true;

            // If the module specifies functions, at least one must match
            return moduleFunctions.some((fn: string) => partnerFunctionIds.includes(fn));
        });

        // If no specific matches, return all modules as fallback
        if (matchedModules.length === 0) {
            return {
                success: true,
                data: {
                    modules: allModules,
                    assignment: null
                }
            };
        }

        return {
            success: true,
            data: {
                modules: matchedModules,
                assignment: null
            }
        };
    } catch (error) {
        console.error('Error fetching available modules for partner:', error);
        return { success: false, error: 'Failed to fetch available modules' };
    }
}

/**
 * Get modules matching specific industries (for use in onboarding flows)
 */
export async function getModulesForIndustriesAction(
    industryIds: string[]
): Promise<ModulesActionResponse<SystemModule[]>> {
    try {
        if (industryIds.length === 0) {
            return { success: true, data: [] };
        }

        const modulesSnapshot = await adminDb
            .collection('systemModules')
            .where('status', '==', 'active')
            .get();

        const allModules = modulesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SystemModule));

        const matchedModules = allModules.filter(module =>
            module.applicableIndustries.some((ind: string) => industryIds.includes(ind))
        );

        return { success: true, data: matchedModules };
    } catch (error) {
        console.error('Error fetching modules for industries:', error);
        return { success: false, error: 'Failed to fetch modules' };
    }
}

function normalizeCustomFields(raw: any): PartnerCustomField[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((field: any) => ({
        ...field,
        addedAt: field.addedAt || field.createdAt || new Date().toISOString(),
        addedBy: field.addedBy || field.createdBy || 'system',
    }));
}

export async function getPartnerModulesAction(
    partnerId: string
): Promise<ModulesActionResponse<PartnerModule[]>> {
    try {
        const snapshot = await adminDb
            .collection(`partners/${partnerId}/businessModules`)
            .orderBy('createdAt', 'desc')
            .get();

        const modules = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                customFields: normalizeCustomFields(data.customFields),
            } as PartnerModule;
        });
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

        const pmData = partnerModuleSnapshot.docs[0].data();
        const partnerModule = {
            id: partnerModuleSnapshot.docs[0].id,
            ...pmData,
            customFields: normalizeCustomFields(pmData.customFields),
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

        revalidatePath(`/partner/relay/data`);
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

        revalidatePath(`/partner/relay/data`);
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
            sortOrder: partnerModule.itemCount,
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

        revalidatePath(`/partner/relay/data/${partnerModule.moduleSlug}`);
        triggerCoreHubSync(partnerId, `item created in ${moduleId}`);
        void indexModuleItem(partnerId, moduleId, itemId).catch((e) => {
            console.error('[relay-index] item indexing failed:', { partnerId, moduleId, itemId, error: e });
        });
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
        // P3.M05.3: Health gate (dormant with flag off). With gating
        // enabled, a partner with any red engine cannot save.
        const gate = await evaluatePartnerSaveGate(partnerId);
        if (!gate.allow) {
            return {
                success: false,
                error: `Health gating blocked this save — engine "${gate.engine}" is red. Fix outstanding issues via /admin/relay/health before editing module items.`,
                code: 'HEALTH_RED',
            };
        }

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

        revalidatePath(`/partner/relay/data`);
        triggerCoreHubSync(partnerId, `item updated in ${moduleId}`);
        // M07: shadow-mode Health recompute. Non-throwing — any failure
        // is logged and swallowed inside the helper.
        await triggerHealthRecompute(partnerId);
        void indexModuleItem(partnerId, moduleId, itemId).catch((e) => {
            console.error('[relay-index] item indexing failed:', { partnerId, moduleId, itemId, error: e });
        });
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
        revalidatePath(`/partner/relay/data`);
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

        revalidatePath(`/partner/relay/data`);
        triggerCoreHubSync(partnerId, `item deleted from ${moduleId}`);
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

        revalidatePath(`/partner/relay/data`);
        triggerCoreHubSync(partnerId, `bulk update in ${moduleId}`);
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

        revalidatePath(`/partner/relay/data`);
        revalidatePath(`/partner/relay/data/${partnerModule.moduleSlug}`);

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

export async function getPartnerModuleByIdAction(
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

// ============================================================================
// BULK OPERATIONS FOR PARTNER MODULE ITEMS
// ============================================================================

export async function bulkCreateModuleItemsAction(
    partnerId: string,
    moduleId: string,
    items: Array<Partial<ModuleItem>>,
    userId: string
): Promise<ModulesActionResponse<{ created: number; failed: number }>> {
    try {
        const partnerModuleResult = await getPartnerModuleByIdAction(partnerId, moduleId);

        if (!partnerModuleResult.success || !partnerModuleResult.data) {
            return { success: false, error: 'Module not found', code: 'NOT_FOUND' };
        }

        const { partnerModule, systemModule } = partnerModuleResult.data;

        if (partnerModule.itemCount + items.length > systemModule.settings.maxItems) {
            return {
                success: false,
                error: `Would exceed maximum items limit (${systemModule.settings.maxItems})`,
                code: 'LIMIT_REACHED'
            };
        }

        const batch = adminDb.batch();
        const now = new Date().toISOString();
        let created = 0;
        let failed = 0;
        let activeCount = 0;

        for (const itemData of items) {
            try {
                const itemId = generateItemId();

                const ragText = generateRAGText(
                    { ...itemData, id: itemId, moduleId, partnerId } as ModuleItem,
                    systemModule.schemaHistory[partnerModule.schemaVersion] || systemModule.schema
                );

                const item: ModuleItem = {
                    name: itemData.name || 'Untitled',
                    description: itemData.description || '',
                    category: itemData.category || 'general',
                    price: itemData.price || 0,
                    currency: itemData.currency || partnerModule.settings.defaultCurrency || 'INR',
                    images: itemData.images || [],
                    fields: itemData.fields || {},
                    isActive: itemData.isActive ?? true,
                    isFeatured: itemData.isFeatured ?? false,
                    sortOrder: partnerModule.itemCount + created,
                    trackInventory: itemData.trackInventory ?? false,
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

                const itemRef = adminDb
                    .collection(`partners/${partnerId}/businessModules/${moduleId}/items`)
                    .doc(itemId);

                batch.set(itemRef, item);
                created++;

                if (item.isActive) {
                    activeCount++;
                }
            } catch (e) {
                console.error('Error preparing item for bulk create:', e);
                failed++;
            }
        }

        await batch.commit();

        await adminDb
            .collection(`partners/${partnerId}/businessModules`)
            .doc(moduleId)
            .update({
                itemCount: FieldValue.increment(created),
                activeItemCount: FieldValue.increment(activeCount),
                lastItemAddedAt: now,
                updatedAt: now,
            });

        revalidatePath(`/partner/relay/data/${partnerModule.moduleSlug}`);
        triggerCoreHubSync(partnerId, `bulk create in ${moduleId}`);
        return { success: true, data: { created, failed } };
    } catch (error) {
        console.error('Error bulk creating module items:', error);
        return { success: false, error: 'Failed to bulk create items' };
    }
}


export async function deleteAllModuleItemsAction(
    partnerId: string,
    moduleId: string
): Promise<ModulesActionResponse<{ deleted: number }>> {
    try {
        const itemsRef = adminDb.collection(`partners/${partnerId}/businessModules/${moduleId}/items`);
        const snapshot = await itemsRef.get();

        if (snapshot.empty) {
            return { success: true, data: { deleted: 0 } };
        }

        const batchSize = 500;
        let deleted = 0;

        const docs = snapshot.docs;
        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = adminDb.batch();
            const chunk = docs.slice(i, i + batchSize);

            for (const doc of chunk) {
                batch.delete(doc.ref);
                deleted++;
            }

            await batch.commit();
        }

        await adminDb
            .collection(`partners/${partnerId}/businessModules`)
            .doc(moduleId)
            .update({
                itemCount: 0,
                activeItemCount: 0,
                updatedAt: new Date().toISOString(),
            });

        const partnerModuleDoc = await adminDb
            .collection(`partners/${partnerId}/businessModules`)
            .doc(moduleId)
            .get();

        const moduleSlug = partnerModuleDoc.data()?.moduleSlug;
        if (moduleSlug) {
            revalidatePath(`/partner/relay/data/${moduleSlug}`);
        }
        revalidatePath(`/partner/relay/data`);
        triggerCoreHubSync(partnerId, `all items deleted from ${moduleId}`);

        return { success: true, data: { deleted } };
    } catch (error) {
        console.error('Error deleting all module items:', error);
        return { success: false, error: 'Failed to delete items' };
    }
}

// ============================================================================
// CSV TEMPLATE GENERATION
// ============================================================================

export async function generateModuleCsvTemplateAction(
    moduleSlug: string
): Promise<ModulesActionResponse<{ csvContent: string; filename: string }>> {
    try {
        const systemModuleResult = await getSystemModuleAction(moduleSlug);

        if (!systemModuleResult.success || !systemModuleResult.data) {
            return { success: false, error: 'Module not found', code: 'NOT_FOUND' };
        }

        const systemModule = systemModuleResult.data;
        const schema = systemModule.schema;

        // Fixed columns
        const fixedColumns = ['name', 'description', 'category', 'price', 'currency', 'isActive', 'isFeatured'];

        // Dynamic columns from schema fields
        const dynamicColumns = schema.fields.map(f => f.name);

        // All headers
        const headers = [...fixedColumns, ...dynamicColumns];

        // Generate placeholder values for each field type
        const getPlaceholderValue = (field: typeof schema.fields[0]): string => {
            switch (field.type) {
                case 'text':
                case 'textarea':
                    return 'Example text';
                case 'number':
                    return '0';
                case 'currency':
                    return '0.00';
                case 'select':
                    return field.options?.[0] || '';
                case 'multi_select':
                    return field.options?.slice(0, 2).join(', ') || '';
                case 'toggle':
                    return 'true';
                case 'tags':
                    return 'tag1, tag2';
                case 'date':
                    return '2025-01-01';
                case 'time':
                    return '09:00';
                case 'duration':
                    return '60';
                case 'url':
                    return 'https://example.com';
                case 'email':
                    return 'example@email.com';
                case 'phone':
                    return '+1234567890';
                case 'image':
                    return 'https://example.com/image.jpg';
                default:
                    return '';
            }
        };

        // Generate hint/description for each field
        const getFieldHint = (field: typeof schema.fields[0]): string => {
            const parts: string[] = [];
            if (field.isRequired) parts.push('Required');
            if (field.description) parts.push(field.description);
            else if (field.placeholder) parts.push(field.placeholder);

            if (field.type === 'select' && field.options?.length) {
                parts.push(`Options: ${field.options.join(' | ')}`);
            }
            if (field.type === 'multi_select' && field.options?.length) {
                parts.push(`Options: ${field.options.join(' | ')} (comma-separated)`);
            }
            if (field.validation?.min !== undefined) parts.push(`Min: ${field.validation.min}`);
            if (field.validation?.max !== undefined) parts.push(`Max: ${field.validation.max}`);

            return parts.length > 0 ? `(${parts.join('; ')})` : '';
        };

        // Category options for hint row
        const categoryOptions = schema.categories.map(c => c.name).join(' | ');

        // Fixed column hints
        const fixedHints = [
            '(Required)',
            '(Optional)',
            categoryOptions ? `(Options: ${categoryOptions})` : '(Category name)',
            '(Number, e.g., 99.99)',
            '(e.g., USD, EUR, INR)',
            '(true or false)',
            '(true or false)',
        ];

        // Dynamic column hints
        const dynamicHints = schema.fields.map(f => getFieldHint(f));

        // Hint row (row 2)
        const hintRow = [...fixedHints, ...dynamicHints];

        // Example values for fixed columns
        const fixedExampleValues = [
            'Sample Item Name',
            'Sample description for this item',
            schema.categories[0]?.name || 'General',
            '99.99',
            systemModule.defaultCurrency || 'INR',
            'true',
            'false',
        ];

        // Example values for dynamic columns
        const dynamicExampleValues = schema.fields.map(f => getPlaceholderValue(f));

        // Example row (row 3)
        const exampleRow = [...fixedExampleValues, ...dynamicExampleValues];

        // Helper to escape CSV values
        const escapeCSV = (value: string): string => {
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        };

        // Build CSV content
        const csvLines = [
            headers.map(escapeCSV).join(','),
            hintRow.map(escapeCSV).join(','),
            exampleRow.map(escapeCSV).join(','),
        ];

        const csvContent = csvLines.join('\n');
        const filename = `${moduleSlug}_template.csv`;

        return { success: true, data: { csvContent, filename } };
    } catch (error) {
        console.error('Error generating CSV template:', error);
        return { success: false, error: 'Failed to generate CSV template' };
    }
}

export async function resetPartnerModulesAction(
    partnerId: string
): Promise<ModulesActionResponse<{ deleted: number }>> {
    try {
        const modulesRef = adminDb.collection(`partners/${partnerId}/businessModules`);
        const snapshot = await modulesRef.get();

        if (snapshot.empty) {
            return { success: true, data: { deleted: 0 } };
        }

        let deleted = 0;

        // We use a simpler approach for the main modules collection since we know the approximate scale
        const docs = snapshot.docs;
        for (let i = 0; i < docs.length; i += 500) {
            const batch = adminDb.batch();
            const chunk = docs.slice(i, i + 500);

            for (const doc of chunk) {
                // We will rely on orphaned subcollections for now as is standard in many Firestore patterns
                // unless cloud functions are set up for recursive delete.
                batch.delete(doc.ref);
                deleted++;
            }

            await batch.commit();
        }

        revalidatePath('/partner/relay/data');
        return { success: true, data: { deleted } };

    } catch (error) {
        console.error('Error resetting partner modules:', error);
        return { success: false, error: 'Failed to reset modules' };
    }
}

// ============================================================================
// PARTNER CUSTOM FIELDS
// ============================================================================

export async function addPartnerCustomFieldAction(
    partnerId: string,
    moduleId: string,
    field: Omit<PartnerCustomField, 'addedAt' | 'addedBy'>,
    userId: string
): Promise<ModulesActionResponse<{ fieldId: string }>> {
    try {
        const moduleRef = adminDb.doc(`partners/${partnerId}/businessModules/${moduleId}`);
        const moduleDoc = await moduleRef.get();

        if (!moduleDoc.exists) {
            return { success: false, error: 'Module not found', code: 'NOT_FOUND' };
        }

        const moduleData = moduleDoc.data() as PartnerModule;
        const existingFields = moduleData.customFields || [];

        if (existingFields.some(f => f.id === field.id)) {
            return { success: false, error: 'Field with this ID already exists', code: 'DUPLICATE_FIELD' };
        }

        const newField: PartnerCustomField = {
            ...field,
            addedAt: new Date().toISOString(),
            addedBy: userId,
        };

        await moduleRef.update({
            customFields: FieldValue.arrayUnion(newField),
            updatedAt: new Date().toISOString(),
        });

        revalidatePath('/partner/relay/data');
        return { success: true, data: { fieldId: field.id } };
    } catch (error) {
        console.error('Error adding custom field:', error);
        return { success: false, error: 'Failed to add custom field' };
    }
}

export async function updatePartnerCustomFieldAction(
    partnerId: string,
    moduleId: string,
    fieldId: string,
    updates: Partial<Omit<PartnerCustomField, 'id' | 'addedAt' | 'addedBy'>>
): Promise<ModulesActionResponse> {
    try {
        const moduleRef = adminDb.doc(`partners/${partnerId}/businessModules/${moduleId}`);
        const moduleDoc = await moduleRef.get();

        if (!moduleDoc.exists) {
            return { success: false, error: 'Module not found', code: 'NOT_FOUND' };
        }

        const moduleData = moduleDoc.data() as PartnerModule;
        const existingFields = moduleData.customFields || [];
        const fieldIndex = existingFields.findIndex(f => f.id === fieldId);

        if (fieldIndex === -1) {
            return { success: false, error: 'Field not found', code: 'NOT_FOUND' };
        }

        const updatedFields = [...existingFields];
        updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], ...updates };

        await moduleRef.update({
            customFields: updatedFields,
            updatedAt: new Date().toISOString(),
        });

        revalidatePath('/partner/relay/data');
        return { success: true };
    } catch (error) {
        console.error('Error updating custom field:', error);
        return { success: false, error: 'Failed to update custom field' };
    }
}

export async function removePartnerCustomFieldAction(
    partnerId: string,
    moduleId: string,
    fieldId: string
): Promise<ModulesActionResponse> {
    try {
        const moduleRef = adminDb.doc(`partners/${partnerId}/businessModules/${moduleId}`);
        const moduleDoc = await moduleRef.get();

        if (!moduleDoc.exists) {
            return { success: false, error: 'Module not found', code: 'NOT_FOUND' };
        }

        const moduleData = moduleDoc.data() as PartnerModule;
        const existingFields = moduleData.customFields || [];
        const updatedFields = existingFields.filter(f => f.id !== fieldId);

        await moduleRef.update({
            customFields: updatedFields,
            updatedAt: new Date().toISOString(),
        });

        revalidatePath('/partner/relay/data');
        return { success: true };
    } catch (error) {
        console.error('Error removing custom field:', error);
        return { success: false, error: 'Failed to remove custom field' };
    }
}

// ── Relay Block Config Backfill ──────────────────────────────────────

export async function backfillRelayBlockConfigsAction(): Promise<{
    success: boolean;
    created: number;
    skipped: number;
    errors: string[];
}> {
    'use server';
    let created = 0, skipped = 0;
    const errors: string[] = [];

    try {
        const modulesSnapshot = await adminDb.collection('systemModules')
            .where('status', '==', 'active')
            .get();

        for (const doc of modulesSnapshot.docs) {
            const mod = doc.data();
            if (!mod.agentConfig) {
                skipped++;
                continue;
            }

            const blockId = `block_${mod.slug}`;
            try {
                await adminDb.collection('relayBlockConfigs').doc(blockId).set({
                    id: blockId,
                    blockType: mod.agentConfig.relayBlockType || 'card',
                    label: mod.name,
                    description: mod.description || '',
                    moduleSlug: mod.slug,
                    moduleId: doc.id,
                    applicableIndustries: mod.applicableIndustries || [],
                    applicableFunctions: mod.applicableFunctions || [],
                    dataSchema: {
                        // Informational — partner items actually live at
                        // partners/{pid}/businessModules/{moduleId}/items.
                        // Use the actual module slug rather than a
                        // legacy hardcoded 'moduleItems' string.
                        sourceCollection: mod.slug,
                        sourceFields: mod.agentConfig.displayFields || [],
                        displayTemplate: mod.agentConfig.relayBlockType || 'card',
                        maxItems: 10,
                        sortBy: 'sortOrder',
                        sortOrder: 'asc',
                    },
                    agentConfig: mod.agentConfig,
                    aiPromptFragment: mod.agentConfig.inboxContext || '',
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }, { merge: true });
                created++;
            } catch (e: any) {
                errors.push(`${mod.slug}: ${e.message}`);
            }
        }

        return { success: true, created, skipped, errors };
    } catch (e: any) {
        return { success: false, created, skipped, errors: [e.message] };
    }
}

// ============================================================================
// DERIVE SYSTEM MODULES FROM BLOCK REGISTRY
// ============================================================================

export async function deriveModulesFromRegistryAction(): Promise<{
    success: boolean;
    created: number;
    skipped: number;
    errors: string[];
}> {
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    try {
        const { ALL_BLOCKS } = await import(
            '@/app/admin/relay/blocks/previews/registry'
        );

        // Collect all unique non-null module slugs and the blocks that reference them
        const moduleSlugs = new Map<string, Array<{
            id: string;
            label: string;
            family: string;
            stage: string;
            desc: string;
        }>>();

        // PR E3: skip slugs owned by the relay-schema-separation rollout
        // so this generic "derive from blocks" action doesn't materialise
        // Relay-bound schemas as stray systemModules docs. Those live in
        // `relaySchemas` now. PR E5/E6 will replace this path with a
        // Relay-aware derivation that writes to `relaySchemas`.
        const { RELAY_SCHEMA_SLUG_MAP } = await import(
            '@/actions/relay-schema-migration'
        );
        const relayBoundSlugs = new Set(Object.values(RELAY_SCHEMA_SLUG_MAP));

        for (const block of ALL_BLOCKS) {
            if (!block.module) continue;
            if (relayBoundSlugs.has(block.module)) continue;
            if (!moduleSlugs.has(block.module)) {
                moduleSlugs.set(block.module, []);
            }
            moduleSlugs.get(block.module)!.push({
                id: block.id,
                label: block.label,
                family: block.family,
                stage: block.stage,
                desc: block.desc,
            });
        }

        for (const [slug, blocks] of moduleSlugs) {
            try {
                // Skip if system module already exists for this slug
                const existing = await getSystemModuleAction(slug);
                if (existing.success && existing.data) {
                    skipped++;
                    continue;
                }

                const families = [...new Set(blocks.map(b => b.family))];
                const primaryFamily = families[0] || 'catalog';

                const schemaFields: ModuleFieldDefinition[] = [
                    { id: 'fld_name', name: 'name', type: 'text', isRequired: true, isSearchable: true, showInList: true, showInCard: true, order: 0 },
                    { id: 'fld_description', name: 'description', type: 'textarea', isRequired: false, isSearchable: true, showInList: false, showInCard: false, order: 1 },
                    { id: 'fld_image_url', name: 'image_url', type: 'url', isRequired: false, isSearchable: false, showInList: true, showInCard: true, order: 2 },
                    { id: 'fld_subtitle', name: 'subtitle', type: 'text', isRequired: false, isSearchable: false, showInList: true, showInCard: true, order: 3 },
                    { id: 'fld_rating', name: 'rating', type: 'number', isRequired: false, isSearchable: false, showInList: true, showInCard: true, order: 4 },
                    { id: 'fld_badges', name: 'badges', type: 'tags', isRequired: false, isSearchable: false, showInList: true, showInCard: true, order: 5 },
                    { id: 'fld_features', name: 'features', type: 'tags', isRequired: false, isSearchable: true, showInList: false, showInCard: false, order: 6 },
                ];

                if (primaryFamily === 'catalog' || primaryFamily === 'commerce') {
                    schemaFields.push(
                        { id: 'fld_sku', name: 'sku', type: 'text', isRequired: false, isSearchable: true, showInList: true, showInCard: false, order: 7 },
                        { id: 'fld_stock_quantity', name: 'stock_quantity', type: 'number', isRequired: false, isSearchable: false, showInList: true, showInCard: false, order: 8 },
                    );
                }

                if (primaryFamily === 'conversion' || primaryFamily === 'marketing') {
                    schemaFields.push(
                        { id: 'fld_cta_label', name: 'cta_label', type: 'text', isRequired: false, isSearchable: false, showInList: false, showInCard: false, order: 7 },
                        { id: 'fld_cta_url', name: 'cta_url', type: 'url', isRequired: false, isSearchable: false, showInList: false, showInCard: false, order: 8 },
                    );
                }

                const result = await createSystemModuleAction({
                    slug,
                    name: slug === 'items' ? 'Items / Products' : slug.replace(/^module/, '').replace(/([A-Z])/g, ' $1').trim(),
                    description: `Auto-derived from ${blocks.length} block(s): ${blocks.slice(0, 5).map(b => b.label).join(', ')}${blocks.length > 5 ? '...' : ''}`,
                    icon: primaryFamily === 'catalog' ? '📦' : primaryFamily === 'commerce' ? '🛒' : '📋',
                    color: 'blue',
                    itemLabel: 'Item',
                    itemLabelPlural: 'Items',
                    priceLabel: 'Price',
                    priceType: 'one_time',
                    defaultCurrency: 'USD',
                    applicableIndustries: [],
                    applicableFunctions: [],
                    status: 'active',
                    settings: {
                        ...DEFAULT_MODULE_SETTINGS,
                    },
                    schema: {
                        fields: schemaFields,
                        categories: [
                            { id: 'cat_general', name: 'General', icon: '📁', order: 0 },
                        ],
                    },
                    agentConfig: {
                        relayBlockType: primaryFamily === 'catalog' ? 'card' : 'list',
                        displayFields: ['name', 'description', 'image_url'],
                        cardTitle: 'name',
                        cardSubtitle: 'subtitle',
                        cardPrice: 'price',
                        cardImage: 'image_url',
                        searchableFields: ['name', 'description', 'features'],
                        comparisonFields: ['name', 'price', 'rating'],
                        broadcastVariables: ['name', 'price'],
                        inboxContext: '{name} - {description}',
                    },
                    createdBy: 'system-registry-derive',
                });

                if (result.success) {
                    created++;
                } else {
                    errors.push(`${slug}: ${result.error}`);
                }
            } catch (e: any) {
                errors.push(`${slug}: ${e.message}`);
            }
        }

        revalidatePath('/admin/modules');
        return { success: true, created, skipped, errors };
    } catch (e: any) {
        return { success: false, created, skipped, errors: [e.message] };
    }
}

// ============================================================================
// EXPORT MODULE ITEMS TO CSV
// ============================================================================

export async function exportModuleItemsAction(
    partnerId: string,
    moduleId: string
): Promise<ModulesActionResponse<{ csvContent: string; filename: string; itemCount: number }>> {
    try {
        const moduleResult = await getPartnerModuleByIdAction(partnerId, moduleId);
        if (!moduleResult.success || !moduleResult.data) {
            return { success: false, error: moduleResult.error || 'Module not found' };
        }

        const { partnerModule, systemModule } = moduleResult.data;
        const schema = systemModule.schema;

        const itemsSnap = await adminDb
            .collection(`partners/${partnerId}/businessModules/${moduleId}/items`)
            .orderBy('sortOrder', 'asc')
            .get();

        const fixedColumns = ['name', 'description', 'category', 'price', 'currency', 'isActive', 'isFeatured'];
        const dynamicColumns = schema.fields.map(f => f.name);
        const headers = [...fixedColumns, ...dynamicColumns];

        const escapeCSV = (val: any): string => {
            if (val === null || val === undefined) return '';
            const str = Array.isArray(val) ? val.join('; ') : String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const rows = itemsSnap.docs.map(doc => {
            const item = doc.data();
            const row: string[] = [];

            row.push(escapeCSV(item.name));
            row.push(escapeCSV(item.description));
            row.push(escapeCSV(item.category));
            row.push(escapeCSV(item.price));
            row.push(escapeCSV(item.currency));
            row.push(escapeCSV(item.isActive));
            row.push(escapeCSV(item.isFeatured));

            for (const field of schema.fields) {
                row.push(escapeCSV(item.fields?.[field.name]));
            }

            return row.join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const filename = `${partnerModule.moduleSlug}_items_export_${new Date().toISOString().split('T')[0]}.csv`;

        return {
            success: true,
            data: { csvContent, filename, itemCount: itemsSnap.size },
        };
    } catch (error: any) {
        console.error('Error exporting module items:', error);
        return { success: false, error: 'Failed to export items' };
    }
}

// ── PR E5: downloadable CSV template ────────────────────────────────
//
// Produces an empty CSV with just the header row derived from the
// partner's current module schema. Headers match exportModuleItemsAction
// so a partner can export existing items, edit a template, and
// re-import without column-alignment surprises.
//
// Resolution goes through getPartnerModuleByIdAction → the Relay-aware
// getSystemModuleAction (PR E4), so the schema comes from relaySchemas
// for Relay-bound modules and systemModules for platform modules.
export async function getRelaySchemaTemplateCSVAction(
    partnerId: string,
    moduleId: string,
): Promise<ModulesActionResponse<{ csvContent: string; filename: string; headerCount: number }>> {
    try {
        const moduleResult = await getPartnerModuleByIdAction(partnerId, moduleId);
        if (!moduleResult.success || !moduleResult.data) {
            return { success: false, error: moduleResult.error || 'Module not found' };
        }

        const { partnerModule, systemModule } = moduleResult.data;
        const schema = systemModule.schema;

        const fixedColumns = ['name', 'description', 'category', 'price', 'currency', 'isActive', 'isFeatured'];
        const dynamicColumns = schema.fields.map((f) => f.name);
        const headers = [...fixedColumns, ...dynamicColumns];

        // Single header row + trailing newline so spreadsheet tools
        // open the file with a single blank data row ready to fill.
        const csvContent = `${headers.join(',')}\n`;
        const filename = `${partnerModule.moduleSlug}_template_${new Date().toISOString().split('T')[0]}.csv`;

        return {
            success: true,
            data: { csvContent, filename, headerCount: headers.length },
        };
    } catch (error: any) {
        console.error('Error generating schema template:', error);
        return { success: false, error: 'Failed to generate template' };
    }
}
