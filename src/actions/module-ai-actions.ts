
'use server';

import { GoogleGenAI } from "@google/genai";
import type {
    ModuleGenerationRequest,
    ModuleGenerationResult,
    ModuleSchema,
    ModuleFieldDefinition,
    ModuleCategoryDefinition,
    ModuleFieldType,
    SystemModule
} from '@/lib/modules/types';
import { generateFieldId, generateCategoryId, generateModuleId, slugify, cleanAndParseJSON } from '@/lib/modules/utils';
import { generateModulesFromCategories, type GeneratedModule } from './module-generator-actions';
import { convertToUnifiedInventory } from '@/lib/module-converters';
import { getIndustries, getFunctionsByIndustry } from '@/lib/business-taxonomy';
import { createSystemModuleAction, getSystemModuleAction } from './modules-actions';
import { adminAuth } from '@/lib/firebase-admin';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY
});

import { DEFAULT_BULK_CONFIG } from '@/lib/modules/constants';

// Remove local DEFAULT_BULK_CONFIG export


export interface BulkGenerationConfig {
    industryIds: string[];  // Which industries to generate for
    countryCode: string;
}

export async function bulkGenerateModulesAction(
    config: { industryIds?: string[]; countryCode?: string; } | undefined,
    userId: string = 'system',
    onProgress?: (completed: number, total: number, current: string) => void
): Promise<{
    success: boolean;
    generated: { slug: string; name: string; fieldsCount: number; categoriesCount: number }[];
    failed: { slug: string; name: string; error: string }[];
    totalTime: number;
}> {
    const startTime = Date.now();
    const generated: { slug: string; name: string; fieldsCount: number; categoriesCount: number }[] = [];
    const failed: { slug: string; name: string; error: string }[] = [];

    // Use passed config or default to all industries
    const targetIndustries = config?.industryIds
        ? getIndustries().filter(i => config.industryIds!.includes(i.industryId))
        : getIndustries();

    // Build list of all function combinations we want to generate
    const allCategories: { industryId: string; functionId: string; label: string; googlePlacesTypes?: string[] }[] = [];

    for (const industry of targetIndustries) {
        const functions = getFunctionsByIndustry(industry.industryId);
        // Take first 2-3 functions per industry to avoid crawling everything
        const primaryFunctions = functions.slice(0, 3);

        for (const func of primaryFunctions) {
            allCategories.push({
                industryId: industry.industryId,
                functionId: func.functionId,
                label: func.name,
                googlePlacesTypes: func.googlePlacesTypes,
            });
        }
    }

    const totalModules = allCategories.length;
    let completed = 0;

    // Process in batches to avoid rate limits
    const batchSize = 3;

    for (let i = 0; i < allCategories.length; i += batchSize) {
        const batch = allCategories.slice(i, i + batchSize);

        await Promise.all(batch.map(async (category) => {
            const moduleSlug = `${category.industryId}_${category.functionId}`;

            try {
                // Check if module already exists using server action (mocked check if action not avail directly)
                // We'll trust createSystemModuleAction to handle duplicate checks or we fetch first.
                // Assuming we want to skip if exists:
                const existingResult = await getSystemModuleAction(moduleSlug);
                if (existingResult.success && existingResult.data) {
                    generated.push({
                        slug: moduleSlug,
                        name: existingResult.data.name,
                        fieldsCount: existingResult.data.schema.fields.length,
                        categoriesCount: existingResult.data.schema.categories.length,
                    });
                    return;
                }

                // Use existing generateModulesFromCategories
                const result = await generateModulesFromCategories([{
                    industryId: category.industryId,
                    functionId: category.functionId,
                    label: category.label,
                    googlePlacesTypes: category.googlePlacesTypes || [],
                }], config?.countryCode || 'IN');

                if (!result.success || !result.config) {
                    throw new Error(result.error || 'Generation failed');
                }

                // Convert to unified inventory format
                const inventoryConfig = convertToUnifiedInventory(result.config.modules);

                if (!inventoryConfig) {
                    throw new Error('No inventory config generated');
                }

                // Convert inventory config to SystemModule schema
                const schema = convertInventoryToSchema(inventoryConfig);

                // Create system module
                const createResult = await createSystemModuleAction({
                    slug: moduleSlug,
                    name: inventoryConfig.itemLabelPlural || category.label,
                    description: `AI-generated module for ${category.label}`,
                    icon: getIndustryIcon(category.industryId),
                    color: getIndustryColor(category.industryId),
                    itemLabel: inventoryConfig.itemLabel || 'Item',
                    itemLabelPlural: inventoryConfig.itemLabelPlural || 'Items',
                    priceLabel: inventoryConfig.priceLabel || 'Price',
                    priceType: 'one_time',
                    defaultCurrency: inventoryConfig.currency || (config?.countryCode === 'IN' ? 'INR' : 'USD'),
                    applicableIndustries: [category.industryId],
                    applicableFunctions: [category.functionId],
                    status: 'active',
                    settings: {
                        allowCustomFields: true,
                        allowCustomCategories: true,
                        maxItems: 1000,
                        maxCustomFields: 10,
                        maxCustomCategories: 20,
                        requiresPrice: true,
                        requiresImage: false,
                        requiresCategory: true,
                        enableVariants: false,
                        enableInventoryTracking: false,
                        minSchemaVersion: 1,
                    },
                    schema,
                    createdBy: userId,
                });

                if (!createResult.success) {
                    throw new Error(createResult.error || 'Failed to create module');
                }

                generated.push({
                    slug: moduleSlug,
                    name: inventoryConfig.itemLabelPlural || category.label,
                    fieldsCount: schema.fields.length,
                    categoriesCount: schema.categories.length,
                });

            } catch (error) {
                console.error(`Failed to generate module ${moduleSlug}:`, error);
                failed.push({
                    slug: moduleSlug,
                    name: category.label,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }));

        // Progress update placeholder (in real scenario, we'd use a stream or DB to track progress if client-facing)
        // onProgress?.(completed, totalModules, category.label); // callback not serializable

        completed += batch.length;

        // Small delay between batches
        if (i + batchSize < allCategories.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    return {
        success: failed.length === 0 && generated.length > 0,
        generated,
        failed,
        totalTime: Date.now() - startTime,
    };
}

export async function generateModuleSchemaWithAI(
    request: ModuleGenerationRequest
): Promise<ModuleGenerationResult> {
    const startTime = Date.now();

    try {
        const existingFieldsContext = request.existingSchema
            ? `\n\nEXISTING SCHEMA (improve upon this, maintain backward compatibility where sensible):\nFields: ${request.existingSchema.fields.map(f => `${f.id}: ${f.name} (${f.type})`).join(', ')}\nCategories: ${request.existingSchema.categories.map(c => c.name).join(', ')}`
            : '';

        const enhancementContext = request.enhancementPrompt
            ? `\n\nADDITIONAL REQUIREMENTS:\n${request.enhancementPrompt}`
            : '';

        const prompt = `You are an expert business configuration AI. Generate a comprehensive, production-ready module schema for a business.

BUSINESS CONTEXT:
- Industry: ${request.industryName} (${request.industryId})
- Business Type: ${request.functionName} (${request.functionId})
- Country: ${request.countryCode}
${existingFieldsContext}
${enhancementContext}

Generate a detailed JSON schema with:

## 1. FIELDS (10-15 industry-specific fields)
Design fields that capture ALL important attributes for this business type.

FIELD TYPES AVAILABLE:
- text: Short text input
- number: Numeric value
- currency: Price/money value
- select: Single choice dropdown (provide options array)
- multi_select: Multiple choice (provide options array)
- toggle: Boolean on/off
- tags: Free-form tags array
- textarea: Long text
- image: Image URL
- date: Date picker
- time: Time picker
- duration: Duration in minutes
- url: Website link
- email: Email address
- phone: Phone number

FOR EACH FIELD, specify:
- id: snake_case unique identifier
- name: Human-readable label
- type: One of the types above
- description: Help text explaining the field
- isRequired: true/false
- isSearchable: true if should be included in RAG search
- showInList: true if should show in list view
- showInCard: true if should show in card view
- placeholder: Example input
- options: Array of choices (for select/multi_select only)
- defaultValue: Default value if any
- order: Display order (1-15)

## 2. CATEGORIES (6-10 logical groupings)
Create categories that help organize items logically.

FOR EACH CATEGORY:
- id: snake_case unique identifier
- name: Human-readable name
- icon: Single emoji representing category
- description: What items belong here
- color: Tailwind color (e.g., "blue", "green", "orange")
- order: Display order (1-10)

## 3. SUGGESTED ITEMS (5-8 realistic examples)
Create sample items with realistic data including:
- name, description, category (matching a category id)
- price (realistic for ${request.countryCode} market)
- All field values filled appropriately

OUTPUT FORMAT (valid JSON only, no markdown):
{
  "schema": {
    "fields": [...],
    "categories": [...]
  },
  "suggestedItems": [
    {
      "name": "...",
      "description": "...",
      "category": "category_id",
      "price": 1000,
      "fields": {
        "field_id": "value",
        ...
      }
    }
  ]
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
                responseMimeType: 'application/json',
            }
        });

        const text = response.text || '';

        let parsed: { schema: ModuleSchema; suggestedItems: any[] };
        try {
            parsed = cleanAndParseJSON(text);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.log("Raw text:", text);
            throw new Error('Could not parse AI response as JSON: ' + (e instanceof Error ? e.message : String(e)));
        }

        const schema: ModuleSchema = {
            fields: parsed.schema.fields.map((f: any, index: number) => ({
                ...f,
                id: f.id || generateFieldId(),
                order: f.order || index + 1,
                isSearchable: f.isSearchable ?? true,
                showInList: f.showInList ?? true,
                showInCard: f.showInCard ?? false,
            })) as ModuleFieldDefinition[],
            categories: parsed.schema.categories.map((c: any, index: number) => ({
                ...c,
                id: c.id || generateCategoryId(),
                order: c.order || index + 1,
            })) as ModuleCategoryDefinition[],
        };

        return {
            success: true,
            schema,
            suggestedItems: parsed.suggestedItems || [],
            generatedAt: new Date().toISOString(),
            model: 'gemini-2.5-flash',
            promptTokens: 0,
            completionTokens: 0,
        };
    } catch (error) {
        console.error('AI module generation error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate module schema',
            generatedAt: new Date().toISOString(),
            model: 'gemini-2.5-flash',
            promptTokens: 0,
            completionTokens: 0,
        };
    }
}

export async function generateAdditionalItemsWithAI(
    moduleSlug: string,
    industryName: string,
    functionName: string,
    existingCategories: string[],
    existingItemNames: string[],
    countryCode: string = 'IN',
    count: number = 5
): Promise<{ success: boolean; items?: any[]; error?: string }> {
    try {
        const prompt = `Generate ${count} NEW inventory items for a ${functionName} business in the ${industryName} industry.

COUNTRY: ${countryCode}
AVAILABLE CATEGORIES: ${existingCategories.join(', ')}
EXISTING ITEMS (do NOT duplicate): ${existingItemNames.slice(0, 20).join(', ')}

Generate diverse, realistic items with appropriate pricing for the ${countryCode} market.

OUTPUT (valid JSON only):
{
  "items": [
    {
      "name": "...",
      "description": "...",
      "category": "one_of_the_categories",
      "price": 1000,
      "fields": {}
    }
  ]
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.8,
                responseMimeType: 'application/json'
            }
        });

        const parsed = JSON.parse(response.text || '{}');
        return { success: true, items: parsed.items || [] };
    } catch (error) {
        console.error('AI item generation error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate items'
        };
    }
}

// Helper to convert InventoryConfig to ModuleSchema
function convertInventoryToSchema(inventory: any): ModuleSchema {
    const fields: ModuleFieldDefinition[] = [];
    const categories: ModuleCategoryDefinition[] = [];

    // Convert inventory fields to schema fields
    if (inventory.fields) {
        for (const [index, field] of inventory.fields.entries()) {
            fields.push({
                id: field.id || `field_${index}`,
                name: field.label || field.name,
                type: mapFieldType(field.type),
                description: field.description || field.helpText,
                isRequired: field.required || false,
                isSearchable: true,
                showInList: index < 5, // Show first 5 fields in list
                showInCard: index < 3, // Show first 3 fields in card
                options: field.options?.map((o: any) => typeof o === 'string' ? o : o.value),
                defaultValue: field.defaultValue,
                order: index + 1,
            });
        }
    }

    // Convert categories
    if (inventory.categories) {
        for (const [index, cat] of inventory.categories.entries()) {
            categories.push({
                id: cat.id || `cat_${index}`,
                name: cat.name || cat.label,
                icon: cat.icon,
                description: cat.description,
                color: cat.color,
                order: index + 1,
            });
        }
    }

    return { fields, categories };
}

function mapFieldType(type: string): ModuleFieldType {
    const mapping: Record<string, ModuleFieldType> = {
        'text': 'text',
        'string': 'text',
        'number': 'number',
        'currency': 'currency',
        'price': 'currency',
        'select': 'select',
        'dropdown': 'select',
        'multi_select': 'multi_select',
        'multiselect': 'multi_select',
        'checkbox': 'multi_select',
        'boolean': 'toggle',
        'toggle': 'toggle',
        'switch': 'toggle',
        'textarea': 'textarea',
        'longtext': 'textarea',
        'tags': 'tags',
        'image': 'image',
        'date': 'date',
        'time': 'time',
        'duration': 'duration',
        'url': 'url',
        'email': 'email',
        'phone': 'phone',
    };
    return mapping[type.toLowerCase()] || 'text';
}

function getIndustryIcon(industryId: string): string {
    const icons: Record<string, string> = {
        'financial_services': '🏦',
        'education_learning': '📚',
        'healthcare_medical': '🏥',
        'business_professional': '💼',
        'retail_commerce': '🛒',
        'food_beverage': '🍕',
        'personal_wellness': '✨',
        'automotive_mobility': '🚗',
        'travel_transport': '✈️',
        'hospitality': '🏨',
        'events_entertainment': '🎉',
        'home_property': '🔧',
        'public_nonprofit': '🏛️',
    };
    return icons[industryId] || '📦';
}

function getIndustryColor(industryId: string): string {
    const colors: Record<string, string> = {
        'financial_services': 'emerald',
        'education_learning': 'blue',
        'healthcare_medical': 'red',
        'business_professional': 'purple',
        'retail_commerce': 'orange',
        'food_beverage': 'amber',
        'personal_wellness': 'pink',
        'automotive_mobility': 'slate',
        'travel_transport': 'sky',
        'hospitality': 'indigo',
        'events_entertainment': 'violet',
        'home_property': 'stone',
        'public_nonprofit': 'teal',
    };
    return colors[industryId] || 'slate';
}
