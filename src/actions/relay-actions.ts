'use server';

import { db as adminDb } from '@/lib/firebase-admin';
import anthropic, { AI_MODEL } from '@/lib/anthropic';

// ── Types ────────────────────────────────────────────────────────────

export interface RelayConfig {
    enabled: boolean;
    brandName: string;
    tagline: string;
    brandEmoji: string;
    accentColor: string;
    welcomeMessage: string;
    relaySlug?: string;
    updatedAt?: string;
}

export interface DiagnosticCheck {
    label: string;
    status: 'pass' | 'warn' | 'fail';
    description: string;
    fix?: string;
}

export interface RelayConversation {
    id: string;
    visitorName: string;
    lastMessage: string;
    timestamp: string;
    messageCount: number;
}

export interface RelayBlockConfigDetail {
    id: string;
    blockType: string;
    label: string;
    description?: string;
    moduleSlug?: string;
    moduleId?: string;
    applicableIndustries: string[];
    applicableFunctions: string[];
    agentConfig?: Record<string, any>;
    dataSchema?: {
        sourceCollection?: string;
        sourceFields?: string[];
        displayTemplate?: string;
        maxItems?: number;
        sortBy?: string;
        sortOrder?: string;
    };
    blockTypeTemplate?: {
        generatedBy: 'claude' | 'manual' | 'default';
        generatedAt: string;
        subcategory: string;
        sampleData: Record<string, any>;
        isDefault: boolean;
    };
    status: string;
    createdAt?: string;
}

// ── Get relay config ─────────────────────────────────────────────────

export async function getRelayConfigAction(partnerId: string): Promise<{
    success: boolean;
    config?: RelayConfig;
    error?: string;
}> {
    try {
        const snap = await adminDb
            .collection('partners')
            .doc(partnerId)
            .collection('relayConfig')
            .doc('config')
            .get();

        if (snap.exists) {
            return { success: true, config: snap.data() as RelayConfig };
        }
        return { success: true, config: undefined };
    } catch (e: any) {
        console.error('Failed to get relay config:', e);
        return { success: false, error: e.message };
    }
}

// ── Save relay config ────────────────────────────────────────────────

export async function saveRelayConfigAction(
    partnerId: string,
    config: RelayConfig
): Promise<{ success: boolean; error?: string }> {
    try {
        await adminDb
            .collection('partners')
            .doc(partnerId)
            .collection('relayConfig')
            .doc('config')
            .set({
                ...config,
                updatedAt: new Date().toISOString(),
            });
        return { success: true };
    } catch (e: any) {
        console.error('Failed to save relay config:', e);
        return { success: false, error: e.message };
    }
}

// ── Run diagnostics ──────────────────────────────────────────────────

export async function runRelayDiagnosticsAction(partnerId: string): Promise<{
    success: boolean;
    checks: DiagnosticCheck[];
}> {
    const checks: DiagnosticCheck[] = [];

    // Check 1: Widget config
    try {
        const snap = await adminDb
            .collection('partners')
            .doc(partnerId)
            .collection('relayConfig')
            .doc('config')
            .get();
        if (snap.exists && snap.data()?.brandName) {
            checks.push({ label: 'Widget Configuration', status: 'pass', description: 'Brand name and config set' });
        } else {
            checks.push({ label: 'Widget Configuration', status: 'warn', description: 'No brand name configured', fix: 'Fill in the Setup tab and save' });
        }
    } catch {
        checks.push({ label: 'Widget Configuration', status: 'fail', description: 'Could not read config', fix: 'Check Firestore setup' });
    }

    // Check 2: RAG Store
    try {
        const snap = await adminDb
            .collection('partners')
            .doc(partnerId)
            .collection('fileSearchStores')
            .where('status', '==', 'active')
            .get();
        if (snap.size > 0) {
            checks.push({ label: 'RAG Store', status: 'pass', description: `${snap.size} active store(s)` });
        } else {
            checks.push({ label: 'RAG Store', status: 'warn', description: 'No active RAG store', fix: 'Upload documents in Core Memory' });
        }
    } catch {
        checks.push({ label: 'RAG Store', status: 'warn', description: 'No RAG store found', fix: 'Upload documents in Core Memory' });
    }

    // Check 3: Knowledge docs
    try {
        const snap = await adminDb
            .collection('partners')
            .doc(partnerId)
            .collection('vaultFiles')
            .where('state', '==', 'ACTIVE')
            .get();
        if (snap.size > 0) {
            checks.push({ label: 'Knowledge Documents', status: 'pass', description: `${snap.size} active document(s)` });
        } else {
            checks.push({ label: 'Knowledge Documents', status: 'warn', description: 'No knowledge documents', fix: 'Upload files in Core Memory' });
        }
    } catch {
        checks.push({ label: 'Knowledge Documents', status: 'warn', description: 'Could not check documents' });
    }

    // Check 4: Module data
    try {
        const snap = await adminDb
            .collection('partners')
            .doc(partnerId)
            .collection('modules')
            .where('isEnabled', '==', true)
            .get();
        if (snap.size > 0) {
            checks.push({ label: 'Module Data', status: 'pass', description: `${snap.size} enabled module(s)` });
        } else {
            checks.push({ label: 'Module Data', status: 'warn', description: 'No enabled modules', fix: 'Enable modules in the Modules tab' });
        }
    } catch {
        checks.push({ label: 'Module Data', status: 'warn', description: 'Could not check modules' });
    }

    // Check 5: Relay block configs (global)
    try {
        const snap = await adminDb.collection('relayBlockConfigs').get();
        if (snap.size > 0) {
            checks.push({ label: 'Relay Block Configs', status: 'pass', description: `${snap.size} block config(s)` });
        } else {
            checks.push({ label: 'Relay Block Configs', status: 'warn', description: 'No relay block configs', fix: 'Generate modules in Admin > Modules' });
        }
    } catch {
        checks.push({ label: 'Relay Block Configs', status: 'warn', description: 'Could not check block configs' });
    }

    return { success: true, checks };
}

// ── Get conversations ────────────────────────────────────────────────

export async function getRelayConversationsAction(partnerId: string): Promise<{
    success: boolean;
    conversations: RelayConversation[];
}> {
    try {
        const snap = await adminDb
            .collection('relayConversations')
            .where('partnerId', '==', partnerId)
            .orderBy('updatedAt', 'desc')
            .limit(20)
            .get();

        const conversations: RelayConversation[] = snap.docs.map(d => {
            const data = d.data();
            let ts = '';
            if (data.updatedAt) {
                ts = typeof data.updatedAt.toDate === 'function'
                    ? data.updatedAt.toDate().toISOString()
                    : data.updatedAt;
            }
            return {
                id: d.id,
                visitorName: data.visitorName || 'Anonymous',
                lastMessage: data.lastMessage || '',
                timestamp: ts,
                messageCount: data.messageCount || 0,
            };
        });

        return { success: true, conversations };
    } catch {
        // Collection may not exist yet
        return { success: true, conversations: [] };
    }
}

// ── Get all relay block configs with module details ─────────────────

export async function getRelayBlockConfigsWithModulesAction(): Promise<{
    success: boolean;
    configs: RelayBlockConfigDetail[];
    error?: string;
}> {
    try {
        const snapshot = await adminDb.collection('relayBlockConfigs').get();

        const configs: RelayBlockConfigDetail[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                blockType: data.blockType || 'card',
                label: data.label || doc.id,
                description: data.description || undefined,
                moduleSlug: data.moduleSlug || undefined,
                moduleId: data.moduleId || undefined,
                applicableIndustries: data.applicableIndustries || [],
                applicableFunctions: data.applicableFunctions || [],
                agentConfig: data.agentConfig || undefined,
                dataSchema: data.dataSchema || undefined,
                blockTypeTemplate: data.blockTypeTemplate || undefined,
                status: data.status || 'active',
                createdAt: data.createdAt || undefined,
            };
        });

        configs.sort((a, b) => {
            const typeCompare = a.blockType.localeCompare(b.blockType);
            if (typeCompare !== 0) return typeCompare;
            return a.label.localeCompare(b.label);
        });

        return { success: true, configs };
    } catch (e: any) {
        console.error('Failed to get relay block configs:', e);
        return { success: false, configs: [], error: e.message };
    }
}

// ── Update a relay block config ─────────────────────────────────────

export async function updateRelayBlockConfigAction(
    id: string,
    updates: Partial<Omit<RelayBlockConfigDetail, 'id'>>
): Promise<{ success: boolean; error?: string }> {
    try {
        const docRef = adminDb.collection('relayBlockConfigs').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return { success: false, error: 'Block config not found' };
        }

        await docRef.update({
            ...updates,
            updatedAt: new Date().toISOString(),
        });

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/relay/blocks');
        revalidatePath('/admin/relay');

        return { success: true };
    } catch (e: any) {
        console.error('Failed to update relay block config:', e);
        return { success: false, error: e.message };
    }
}

// ── Delete a relay block config ─────────────────────────────────────

export async function deleteRelayBlockConfigAction(
    id: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const docRef = adminDb.collection('relayBlockConfigs').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return { success: false, error: 'Block config not found' };
        }

        await docRef.delete();

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/relay/blocks');
        revalidatePath('/admin/relay');

        return { success: true };
    } catch (e: any) {
        console.error('Failed to delete relay block config:', e);
        return { success: false, error: e.message };
    }
}

// ── Generate relay block for a module (AI-powered) ──────────────────

export interface GenerateRelayBlockModuleInput {
    id: string;
    name: string;
    slug: string;
    description?: string;
    schema?: { fields?: Array<{ name: string; type: string; label?: string }> };
    applicableIndustries?: string[];
    applicableFunctions?: string[];
    agentConfig?: Record<string, any>;
}

const BLOCK_TYPE_PROMPT = `You are a UI/UX expert for chat widget block templates. Given a business module, generate the optimal relay chat block configuration.

Available block types (pick the BEST one for this specific module):
- "catalog" = general product/item browsing
- "rooms" = hotel/accommodation room listings
- "products" = e-commerce product catalogs
- "services" = service offerings with pricing
- "menu" = restaurant/food menus
- "listings" = real estate, classified, directory listings
- "compare" = side-by-side item comparison
- "activities" = bookable activities and services
- "experiences" = tours, events, experiences
- "classes" = courses, workshops, training
- "treatments" = spa, medical, beauty treatments
- "book" = general reservation/booking flow
- "reserve" = table/seat reservations
- "appointment" = appointment scheduling
- "inquiry" = lead capture / inquiry forms
- "location" = business location with directions
- "contact" = multi-channel contact methods
- "gallery" = photo/visual gallery
- "info" = key-value information (hours, policies, specs)
- "faq" = frequently asked questions
- "details" = detailed specs or policies
- "greeting" = welcome/brand introduction
- "text" = informational text with suggested follow-ups

Rules:
- Choose the MOST SPECIFIC type. E.g., use "rooms" for hotel rooms, "menu" for restaurant dishes, "treatments" for spa services — not generic "catalog".
- Think about how a visitor would want to SEE this data in a chat widget.
- For modules with bookable items, pair with an appropriate booking type.

Respond with ONLY valid JSON (no markdown, no backticks):
{
  "blockType": "one of the types listed above",
  "displayTemplate": "Template string using {{fieldName}} placeholders from the module fields",
  "suggestedTitle": "Human-readable title for this block",
  "suggestedDescription": "One-line description of what this block shows visitors",
  "maxItems": <number 1-10>,
  "sortBy": "field name to sort by",
  "sampleData": { "field1": "realistic sample value", "field2": "realistic sample value" }
}`;

const VALID_BLOCK_TYPES = [
    'catalog', 'rooms', 'products', 'services', 'menu', 'listings',
    'compare', 'activities', 'experiences', 'classes', 'treatments',
    'book', 'reserve', 'appointment', 'inquiry',
    'location', 'directions', 'contact',
    'gallery', 'photos',
    'info', 'faq', 'details',
    'greeting', 'welcome',
    'text',
];

async function callClaudeForBlockTemplate(module: GenerateRelayBlockModuleInput): Promise<{
    blockType: string;
    displayTemplate: string;
    suggestedTitle: string;
    suggestedDescription: string;
    maxItems: number;
    sortBy: string;
    sampleData: Record<string, any>;
}> {
    const fieldInfo = module.schema?.fields?.map(f => ({
        name: f.name,
        type: f.type,
        label: f.label || f.name,
    })) || [];

    const prompt = `${BLOCK_TYPE_PROMPT}

Module Details:
- Name: ${module.name}
- Slug: ${module.slug}
- Description: ${module.description || 'N/A'}
- Fields: ${JSON.stringify(fieldInfo)}
- Industry: ${(module.applicableIndustries || []).join(', ') || 'general'}
- Business Functions: ${(module.applicableFunctions || []).join(', ') || 'other'}`;

    const response = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const cleaned = text.trim().replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!VALID_BLOCK_TYPES.includes(parsed.blockType)) {
        parsed.blockType = 'catalog';
    }

    return {
        blockType: parsed.blockType,
        displayTemplate: parsed.displayTemplate || '',
        suggestedTitle: parsed.suggestedTitle || module.name,
        suggestedDescription: parsed.suggestedDescription || '',
        maxItems: Math.min(Math.max(parsed.maxItems || 5, 1), 10),
        sortBy: parsed.sortBy || 'createdAt',
        sampleData: parsed.sampleData || {},
    };
}

export async function generateRelayBlockForModule(
    module: GenerateRelayBlockModuleInput
): Promise<{ success: boolean; blockId?: string; error?: string }> {
    const blockConfigId = `module_${module.slug}`;
    const now = new Date().toISOString();
    const subcategory = (module.applicableFunctions || [])[0] || 'general';

    try {
        let aiResult: Awaited<ReturnType<typeof callClaudeForBlockTemplate>>;
        let generatedBy: 'claude' | 'default' = 'claude';
        let isDefault = false;

        try {
            aiResult = await callClaudeForBlockTemplate(module);
        } catch (aiError) {
            console.error(`AI generation failed for ${module.slug}, using fallback:`, aiError);
            const fieldNames = module.schema?.fields?.map(f => f.name) || module.agentConfig?.displayFields || [];
            aiResult = {
                blockType: module.agentConfig?.relayBlockType || 'catalog',
                displayTemplate: fieldNames.map(f => `{{${f}}}`).join(' | '),
                suggestedTitle: module.name,
                suggestedDescription: module.description || '',
                maxItems: 5,
                sortBy: 'createdAt',
                sampleData: Object.fromEntries(fieldNames.map(f => [f, `Sample ${f}`])),
            };
            generatedBy = 'default';
            isDefault = true;
        }

        const relayBlockConfig = {
            id: blockConfigId,
            blockType: aiResult.blockType,
            label: aiResult.suggestedTitle,
            description: aiResult.suggestedDescription,
            moduleSlug: module.slug,
            moduleId: module.id,
            applicableIndustries: module.applicableIndustries || [],
            applicableFunctions: module.applicableFunctions || [],
            agentConfig: module.agentConfig || {},
            dataSchema: {
                sourceCollection: `modules/${module.id}/entries`,
                sourceFields: module.schema?.fields?.map(f => f.name) || [],
                displayTemplate: aiResult.displayTemplate,
                maxItems: aiResult.maxItems,
                sortBy: aiResult.sortBy,
                sortOrder: 'desc',
            },
            blockTypeTemplate: {
                generatedBy,
                generatedAt: now,
                subcategory,
                sampleData: aiResult.sampleData,
                isDefault,
            },
            status: 'active',
            createdAt: now,
            updatedAt: now,
        };

        await adminDb.collection('relayBlockConfigs').doc(blockConfigId).set(relayBlockConfig);

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/relay/blocks');
        revalidatePath('/admin/relay');

        return { success: true, blockId: blockConfigId };
    } catch (e: any) {
        console.error(`Failed to generate relay block for ${module.slug}:`, e);
        return { success: false, error: e.message };
    }
}

// ── Regenerate a block template via AI ──────────────────────────────

export async function regenerateBlockTemplateAction(
    blockId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const blockRef = adminDb.collection('relayBlockConfigs').doc(blockId);
        const blockDoc = await blockRef.get();

        if (!blockDoc.exists) {
            return { success: false, error: 'Block config not found' };
        }

        const blockData = blockDoc.data()!;
        const moduleId = blockData.moduleId;

        if (!moduleId) {
            return { success: false, error: 'No linked module found' };
        }

        const moduleDoc = await adminDb.collection('systemModules').doc(moduleId).get();
        if (!moduleDoc.exists) {
            return { success: false, error: 'Linked module not found' };
        }

        const mod = moduleDoc.data()!;
        const aiResult = await callClaudeForBlockTemplate({
            id: moduleId,
            name: mod.name,
            slug: mod.slug,
            description: mod.description,
            schema: mod.schema,
            applicableIndustries: mod.applicableIndustries,
            applicableFunctions: mod.applicableFunctions,
            agentConfig: mod.agentConfig,
        });

        const now = new Date().toISOString();
        const subcategory = (mod.applicableFunctions || [])[0] || 'general';

        await blockRef.update({
            blockType: aiResult.blockType,
            label: aiResult.suggestedTitle,
            description: aiResult.suggestedDescription,
            dataSchema: {
                sourceCollection: `modules/${moduleId}/entries`,
                sourceFields: mod.schema?.fields?.map((f: any) => f.name) || [],
                displayTemplate: aiResult.displayTemplate,
                maxItems: aiResult.maxItems,
                sortBy: aiResult.sortBy,
                sortOrder: 'desc',
            },
            blockTypeTemplate: {
                generatedBy: 'claude',
                generatedAt: now,
                subcategory,
                sampleData: aiResult.sampleData,
                isDefault: false,
            },
            updatedAt: now,
        });

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/relay/blocks');
        revalidatePath('/admin/relay');

        return { success: true };
    } catch (e: any) {
        console.error('Failed to regenerate block template:', e);
        return { success: false, error: e.message };
    }
}

// ── Clear all relay block configs ───────────────────────────────────

export async function clearAllRelayBlockConfigsAction(): Promise<{
    success: boolean;
    count: number;
    error?: string;
}> {
    try {
        const snapshot = await adminDb.collection('relayBlockConfigs').get();

        if (snapshot.empty) {
            return { success: true, count: 0 };
        }

        let count = 0;
        const docs = snapshot.docs;

        for (let i = 0; i < docs.length; i += 500) {
            const batch = adminDb.batch();
            const chunk = docs.slice(i, i + 500);
            for (const doc of chunk) {
                batch.delete(doc.ref);
                count++;
            }
            await batch.commit();
        }

        const { revalidatePath } = await import('next/cache');
        revalidatePath('/admin/relay/blocks');
        revalidatePath('/admin/relay');

        return { success: true, count };
    } catch (e: any) {
        console.error('Failed to clear relay block configs:', e);
        return { success: false, count: 0, error: e.message };
    }
}

// ── Generate blocks for all modules missing configs ─────────────────

export async function generateMissingRelayBlocksAction(): Promise<{
    success: boolean;
    generated: number;
    errors: string[];
}> {
    let generated = 0;
    const errors: string[] = [];

    try {
        const modulesSnapshot = await adminDb.collection('systemModules')
            .where('status', '==', 'active')
            .get();

        const existingSnapshot = await adminDb.collection('relayBlockConfigs').get();
        const existingIds = new Set(existingSnapshot.docs.map(d => d.id));

        for (const doc of modulesSnapshot.docs) {
            const mod = doc.data();
            const blockId = `module_${mod.slug}`;

            if (existingIds.has(blockId)) {
                continue;
            }

            try {
                const result = await generateRelayBlockForModule({
                    id: doc.id,
                    name: mod.name,
                    slug: mod.slug,
                    description: mod.description,
                    schema: mod.schema,
                    applicableIndustries: mod.applicableIndustries,
                    applicableFunctions: mod.applicableFunctions,
                    agentConfig: mod.agentConfig,
                });

                if (result.success) {
                    generated++;
                } else {
                    errors.push(`${mod.slug}: ${result.error}`);
                }
            } catch (e: any) {
                errors.push(`${mod.slug}: ${e.message}`);
            }
        }

        return { success: true, generated, errors };
    } catch (e: any) {
        console.error('Failed to generate missing relay blocks:', e);
        return { success: false, generated, errors: [e.message] };
    }
}
