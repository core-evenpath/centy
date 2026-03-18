'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/firebase-admin';

import type { SystemModule } from '@/lib/modules/types';
import type { RelayBlockConfig } from '@/lib/types-relay';
import { cleanAndParseJSON } from '@/lib/modules/utils';

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || ''
);

// ============================================================================
// GENERATE RELAY BLOCKS FOR MODULE (co-generation)
// ============================================================================

export async function generateRelayBlocksForModule(
  systemModule: SystemModule
): Promise<{
  success: boolean;
  blocks?: Omit<RelayBlockConfig, 'id' | 'createdAt' | 'updatedAt'>[];
  error?: string;
}> {
  try {
    const fieldList = systemModule.schema.fields
      .map(f => `- ${f.id} (${f.type}): ${f.name}`)
      .join('\n');

    const categoryList = systemModule.schema.categories
      .map(c => `- ${c.id}: ${c.name}`)
      .join('\n');

    const prompt = `You are an expert at designing AI chat widget block configurations for business knowledge bases.

Given a business module, generate relay block configs that control how an AI chat widget renders responses.

MODULE CONTEXT:
Module: "${systemModule.name}" (slug: ${systemModule.slug})
Item Label: ${systemModule.itemLabel}
Price Type: ${systemModule.priceType}
Industry: ${systemModule.applicableIndustries.join(', ')}
Functions: ${systemModule.applicableFunctions.join(', ')}

Available fields (use ONLY these IDs in sourceFields):
${fieldList}

Available categories:
${categoryList}

INSTRUCTIONS:
1. Generate 2-4 DATA-DRIVEN block configs that reference this module's actual fields
2. Generate 2-3 FUNCTIONAL block configs for this industry (book, contact, location types — no sourceModuleSlug)
3. For data-driven blocks: sourceFields MUST contain only field IDs from the list above
4. Each block needs an aiPromptFragment that tells the AI how to present that data

Block types available: rooms, book, compare, activities, location, contact, gallery, info, menu, services, text

REQUIRED JSON OUTPUT FORMAT (array of block configs):
{
  "blocks": [
    {
      "blockType": "services",
      "label": "Our Services",
      "description": "Service catalog with pricing",
      "applicableIndustries": ["${systemModule.applicableIndustries[0] || 'general'}"],
      "applicableFunctions": ${JSON.stringify(systemModule.applicableFunctions)},
      "sourceModuleSlug": "${systemModule.slug}",
      "dataSchema": {
        "sourceCollection": "modules",
        "sourceModuleSlug": "${systemModule.slug}",
        "sourceFields": ["name", "price"],
        "displayTemplate": "service_card",
        "maxItems": 10,
        "sortBy": "price",
        "sortOrder": "asc"
      },
      "aiPromptFragment": "When showing services, list name and price clearly. Group by category if available.",
      "defaultIntent": {
        "icon": "💼",
        "label": "Services",
        "prompt": "Show me your services and pricing",
        "uiBlock": "services"
      }
    },
    {
      "blockType": "contact",
      "label": "Contact Us",
      "description": "Multi-channel contact options",
      "applicableIndustries": ["${systemModule.applicableIndustries[0] || 'general'}"],
      "applicableFunctions": [],
      "dataSchema": {
        "sourceCollection": "vaultFiles",
        "sourceFields": [],
        "displayTemplate": "contact_card"
      },
      "aiPromptFragment": "When visitor asks to contact, show available contact channels: WhatsApp, phone, email."
    }
  ]
}

Generate appropriate blocks for this specific module. Only output valid JSON.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const parsed = cleanAndParseJSON(text);
    if (!parsed || !Array.isArray(parsed.blocks)) {
      return { success: false, error: 'Invalid AI response format' };
    }

    // Validate that data-driven blocks only reference real field IDs
    const validFieldIds = new Set(systemModule.schema.fields.map(f => f.id));

    const validatedBlocks: Omit<RelayBlockConfig, 'id' | 'createdAt' | 'updatedAt'>[] = parsed.blocks.map(
      (block: Record<string, unknown>) => {
        const dataSchema = (block.dataSchema || {}) as Record<string, unknown>;
        const sourceFields = (dataSchema.sourceFields || []) as string[];
        const sourceModuleSlug = dataSchema.sourceModuleSlug as string | undefined;

        // For data-driven blocks, filter to only valid field IDs
        const filteredFields = sourceModuleSlug
          ? sourceFields.filter((fId: string) => validFieldIds.has(fId))
          : sourceFields;

        return {
          blockType: (block.blockType as RelayBlockConfig['blockType']) || 'info',
          label: (block.label as string) || 'Block',
          description: (block.description as string) || '',
          applicableIndustries: (block.applicableIndustries as string[]) || systemModule.applicableIndustries,
          applicableFunctions: (block.applicableFunctions as string[]) || systemModule.applicableFunctions,
          sourceModuleId: sourceModuleSlug ? systemModule.id : undefined,
          sourceModuleSlug: sourceModuleSlug || undefined,
          dataSchema: {
            sourceCollection: (dataSchema.sourceCollection as string) || 'modules',
            sourceModuleSlug: sourceModuleSlug,
            sourceFields: filteredFields,
            displayTemplate: (dataSchema.displayTemplate as string) || 'default',
            maxItems: (dataSchema.maxItems as number) || 10,
            sortBy: dataSchema.sortBy as string | undefined,
            sortOrder: dataSchema.sortOrder as 'asc' | 'desc' | undefined,
          },
          aiPromptFragment: (block.aiPromptFragment as string) || '',
          defaultIntent: block.defaultIntent as Partial<RelayBlockConfig['defaultIntent']> | undefined,
          status: 'active' as const,
        };
      }
    );

    return { success: true, blocks: validatedBlocks };
  } catch (error) {
    console.error('generateRelayBlocksForModule error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Generation failed',
    };
  }
}

// ============================================================================
// SAVE RELAY BLOCK CONFIGS
// ============================================================================

export async function saveRelayBlockConfigs(
  configs: Omit<RelayBlockConfig, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<{ success: boolean; savedCount: number; error?: string }> {
  if (!db) return { success: false, savedCount: 0, error: 'Database unavailable' };

  try {
    let savedCount = 0;

    for (const config of configs) {
      // Check for duplicate: same blockType + sourceModuleSlug
      if (config.sourceModuleSlug) {
        const existing = await db
          .collection('relayBlockConfigs')
          .where('blockType', '==', config.blockType)
          .where('sourceModuleSlug', '==', config.sourceModuleSlug)
          .limit(1)
          .get();

        if (!existing.empty) {
          console.log(`⏭️ Skipping duplicate relay block: ${config.blockType} / ${config.sourceModuleSlug}`);
          continue;
        }
      }

      const now = new Date().toISOString();
      await db.collection('relayBlockConfigs').add({
        ...config,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      });
      savedCount++;
    }

    return { success: true, savedCount };
  } catch (error) {
    console.error('saveRelayBlockConfigs error:', error);
    return {
      success: false,
      savedCount: 0,
      error: error instanceof Error ? error.message : 'Save failed',
    };
  }
}

// ============================================================================
// GET RELAY BLOCK CONFIGS
// ============================================================================

export async function getRelayBlockConfigs(filters?: {
  industry?: string;
  status?: 'active' | 'draft';
}): Promise<{ success: boolean; configs?: RelayBlockConfig[]; error?: string }> {
  if (!db) return { success: false, error: 'Database unavailable' };

  try {
    let query: FirebaseFirestore.Query = db.collection('relayBlockConfigs');

    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    let configs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as RelayBlockConfig));

    // Client-side filter for industry (Firestore array-contains)
    if (filters?.industry) {
      configs = configs.filter(c =>
        c.applicableIndustries.includes(filters.industry!)
      );
    }

    return { success: true, configs };
  } catch (error) {
    console.error('getRelayBlockConfigs error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Fetch failed',
    };
  }
}

export async function getRelayBlockConfig(
  id: string
): Promise<{ success: boolean; config?: RelayBlockConfig; error?: string }> {
  if (!db) return { success: false, error: 'Database unavailable' };

  try {
    const doc = await db.collection('relayBlockConfigs').doc(id).get();
    if (!doc.exists) return { success: false, error: 'Block config not found' };

    return { success: true, config: { id: doc.id, ...doc.data() } as RelayBlockConfig };
  } catch (error) {
    console.error('getRelayBlockConfig error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Fetch failed' };
  }
}

export async function updateRelayBlockConfig(
  id: string,
  data: Partial<Omit<RelayBlockConfig, 'id' | 'createdAt'>>
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: 'Database unavailable' };

  try {
    await db.collection('relayBlockConfigs').doc(id).update({
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error('updateRelayBlockConfig error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
  }
}

export async function deleteRelayBlockConfig(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!db) return { success: false, error: 'Database unavailable' };

  try {
    await db.collection('relayBlockConfigs').doc(id).delete();
    return { success: true };
  } catch (error) {
    console.error('deleteRelayBlockConfig error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
  }
}
