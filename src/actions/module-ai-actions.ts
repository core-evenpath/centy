'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
    ModuleSchema,
    ModuleFieldDefinition,
    ModuleCategoryDefinition,
} from '@/lib/modules/types';
import { generateFieldId, generateCategoryId, cleanAndParseJSON } from '@/lib/modules/utils';
import { createSystemModuleAction, getSystemModuleAction } from './modules-actions';
import { BULK_INDUSTRY_CONFIGS, DEFAULT_MODULE_SETTINGS } from '@/lib/modules/constants';

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || ''
);

// ============================================================================
// SINGLE MODULE SCHEMA GENERATION
// ============================================================================

export async function generateModuleSchemaAction(
    industryId: string,
    industryName: string,
    moduleName: string,
    itemLabel: string,
    countryCode: string = 'IN'
): Promise<{
    success: boolean;
    schema?: ModuleSchema;
    suggestedItems?: any[];
    error?: string;
}> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are a business configuration expert. Generate a module schema for "${moduleName}" for ${industryName} businesses in ${countryCode}.

Generate JSON with:
1. "fields" - Array of 8-12 field definitions for ${itemLabel} items
2. "categories" - Array of 5-7 category definitions  
3. "suggestedItems" - Array of 4-6 sample items

FIELD STRUCTURE (each field):
{
  "id": "snake_case_id",
  "name": "Display Name",
  "type": "text|number|currency|select|multi_select|toggle|tags|textarea|date|time",
  "description": "Help text",
  "isRequired": true/false,
  "isSearchable": true/false,
  "showInList": true/false,
  "showInCard": true/false,
  "options": ["opt1", "opt2"] // only for select/multi_select
}

CATEGORY STRUCTURE:
{
  "id": "snake_case_id",
  "name": "Category Name",
  "icon": "🏷️",
  "description": "What belongs here",
  "color": "blue"
}

ITEM STRUCTURE:
{
  "name": "Item Name",
  "description": "Description",
  "category": "category_id",
  "price": 1000,
  "fields": { "field_id": "value" }
}

Currency: ${countryCode === 'IN' ? 'INR' : 'USD'}

Respond with ONLY valid JSON, no markdown:
{"fields": [...], "categories": [...], "suggestedItems": [...]}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        const parsed = cleanAndParseJSON(text);

        const schema: ModuleSchema = {
            fields: (parsed.fields || []).map((f: any, i: number) => ({
                id: f.id || generateFieldId(),
                name: f.name || 'Field',
                type: f.type || 'text',
                description: f.description || '',
                isRequired: f.isRequired ?? false,
                isSearchable: f.isSearchable ?? true,
                showInList: f.showInList ?? (i < 5),
                showInCard: f.showInCard ?? (i < 3),
                options: f.options,
                defaultValue: f.defaultValue,
                order: i + 1,
            })) as ModuleFieldDefinition[],
            categories: (parsed.categories || []).map((c: any, i: number) => ({
                id: c.id || generateCategoryId(),
                name: c.name || 'Category',
                icon: c.icon || '📁',
                description: c.description || '',
                color: c.color || 'slate',
                order: i + 1,
            })) as ModuleCategoryDefinition[],
        };

        return {
            success: true,
            schema,
            suggestedItems: parsed.suggestedItems || []
        };
    } catch (error) {
        console.error('Schema generation error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Generation failed',
        };
    }
}

// ============================================================================
// BULK GENERATION - USING PREDEFINED CONFIGS
// ============================================================================

export async function bulkGenerateModulesAction(
    config?: { industryIds?: string[]; countryCode?: string },
    userId: string = 'system'
): Promise<{
    success: boolean;
    generated: { slug: string; name: string; fieldsCount: number; categoriesCount: number }[];
    failed: { slug: string; name: string; error: string }[];
    totalTime: number;
}> {
    const startTime = Date.now();
    const generated: { slug: string; name: string; fieldsCount: number; categoriesCount: number }[] = [];
    const failed: { slug: string; name: string; error: string }[] = [];
    const countryCode = config?.countryCode || 'IN';

    // Filter industries based on config
    const industries = config?.industryIds
        ? BULK_INDUSTRY_CONFIGS.filter(i => config.industryIds!.includes(i.id))
        : BULK_INDUSTRY_CONFIGS;

    for (const industry of industries) {
        for (const moduleConfig of industry.modules) {
            try {
                // Check if already exists
                const existing = await getSystemModuleAction(moduleConfig.slug);
                if (existing.success && existing.data) {
                    generated.push({
                        slug: moduleConfig.slug,
                        name: moduleConfig.name,
                        fieldsCount: existing.data.schema.fields.length,
                        categoriesCount: existing.data.schema.categories.length,
                    });
                    continue;
                }

                // Generate schema with AI
                const schemaResult = await generateModuleSchemaAction(
                    industry.id,
                    industry.name,
                    moduleConfig.name,
                    moduleConfig.itemLabel,
                    countryCode
                );

                if (!schemaResult.success || !schemaResult.schema) {
                    throw new Error(schemaResult.error || 'Schema generation failed');
                }

                // Create the system module
                const createResult = await createSystemModuleAction({
                    slug: moduleConfig.slug,
                    name: moduleConfig.name,
                    description: `${moduleConfig.name} for ${industry.name} businesses`,
                    icon: industry.icon,
                    color: getIndustryColor(industry.id),
                    itemLabel: moduleConfig.itemLabel,
                    itemLabelPlural: moduleConfig.itemLabel + 's',
                    priceLabel: 'Price',
                    priceType: moduleConfig.priceType as any,
                    defaultCurrency: countryCode === 'IN' ? 'INR' : 'USD',
                    applicableIndustries: [industry.id],
                    applicableFunctions: [],
                    status: 'active',
                    settings: DEFAULT_MODULE_SETTINGS,
                    schema: schemaResult.schema,
                    createdBy: userId,
                });

                if (!createResult.success) {
                    throw new Error(createResult.error || 'Failed to save module');
                }

                generated.push({
                    slug: moduleConfig.slug,
                    name: moduleConfig.name,
                    fieldsCount: schemaResult.schema.fields.length,
                    categoriesCount: schemaResult.schema.categories.length,
                });

                // Rate limit delay
                await new Promise(r => setTimeout(r, 1000));

            } catch (error) {
                console.error(`Failed: ${moduleConfig.slug}`, error);
                failed.push({
                    slug: moduleConfig.slug,
                    name: moduleConfig.name,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
    }

    return {
        success: failed.length === 0,
        generated,
        failed,
        totalTime: Date.now() - startTime,
    };
}

function getIndustryColor(industryId: string): string {
    const colors: Record<string, string> = {
        hospitality: 'blue',
        food_beverage: 'orange',
        business_professional: 'purple',
        healthcare_medical: 'red',
        personal_wellness: 'pink',
        retail_commerce: 'emerald',
        education_learning: 'indigo',
        home_property: 'amber',
    };
    return colors[industryId] || 'slate';
}
