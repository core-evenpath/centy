'use server';

import Anthropic from '@anthropic-ai/sdk';
import anthropic, { AI_MODEL } from '@/lib/anthropic';
import type { SelectedBusinessCategory } from '@/lib/business-taxonomy/types';
import { cleanAndParseJSON } from '@/lib/modules/utils';

// ===== TYPES =====
export interface GeneratedModule {
    id: string;
    name: string;
    description: string;
    type: 'inventory' | 'integration' | 'ai_tool' | 'workflow';
    sourceIndustry: string;
    sourceFunction: string;

    // For inventory modules
    inventoryConfig?: {
        itemLabel: string;
        itemLabelPlural: string;
        priceLabel: string;
        fields: GeneratedField[];
        categories: GeneratedCategory[];
        suggestedItems: GeneratedItem[];
    };

    // For integration modules
    integrationConfig?: {
        platforms: GeneratedIntegration[];
    };

    // For AI tool modules
    aiToolConfig?: {
        tools: GeneratedTool[];
    };
}

export interface GeneratedField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'select' | 'toggle' | 'tags' | 'date' | 'time' | 'textarea' | 'image';
    description: string;
    isRequired: boolean;
    options?: string[];
    placeholder?: string;
    defaultValue?: string | number | boolean;
}

export interface GeneratedCategory {
    id: string;
    name: string;
    icon?: string;
    description?: string;
}

export interface GeneratedItem {
    name: string;
    description: string;
    category: string;
    suggestedPrice: number;
    fields: Record<string, any>;
}

export interface GeneratedIntegration {
    id: string;
    name: string;
    description: string;
    category: string; // 'delivery' | 'pos' | 'booking' | 'payment' | 'marketing'
}

export interface GeneratedTool {
    id: string;
    name: string;
    description: string;
    useCase: string;
    category: string; // 'automation' | 'analytics' | 'customer' | 'operations'
}

export interface ModulesConfig {
    generatedAt: string;
    businessCategories: SelectedBusinessCategory[];
    modules: GeneratedModule[];
}

/**
 * Generate modules automatically based on selected business categories
 * Called when user saves their business categories in Business Profile
 */
export async function generateModulesFromCategories(
    categories: SelectedBusinessCategory[],
    countryCode: string = 'IN'
): Promise<{
    success: boolean;
    config?: ModulesConfig;
    error?: string;
}> {
    if (!categories || categories.length === 0) {
        return { success: false, error: 'No business categories provided' };
    }

    try {
        // Build context from all selected categories
        const categoryContext = categories.map(cat =>
            `- ${cat.label} (Industry: ${cat.industryId})`
        ).join('\n');

        // Primary category for main inventory module
        const primary = categories[0];

        const prompt = `You are an expert business configuration AI. Generate comprehensive, production-ready modules for a business.

BUSINESS CONTEXT:
The business operates in the following categories:
${categoryContext}

Primary Business Type: ${primary.label}
Country: ${countryCode}

Generate a comprehensive JSON configuration with these modules:

## 1. INVENTORY MODULE (Required)
Generate ONE main inventory module based on the PRIMARY business type (${primary.label}).

The inventory should be SUPER DETAILED and SPECIFIC:
- itemLabel: What to call items (e.g., "Menu Item", "Product", "Service", "Room", "Property", "Course")
- priceLabel: What pricing is called (e.g., "Price", "Rate", "Fee", "Rent")
- fields: 8-12 industry-specific fields with proper types
- categories: 6-8 logical categories for organizing items
- suggestedItems: 6-8 realistic starter items with market-appropriate pricing (in INR)

FIELD TYPES: text, number, select (with options), toggle, tags, textarea, image

EXAMPLES OF INDUSTRY-SPECIFIC FIELDS:
- Restaurant: prep_time, dietary_type, spice_level, allergens, cuisine_type, portion_size
- Salon: duration_minutes, stylist_level, gender, add_ons, advance_booking
- Hotel: occupancy, bed_type, room_size_sqft, view_type, amenities, check_in_time
- Clinic: consultation_type, duration, specialization, prerequisites
- Retail: sku, brand, stock_quantity, warranty, variants

## 2. INTEGRATIONS MODULE (Required)
Generate 4-6 relevant platform integrations specific to this industry in this country.

For each business type, suggest:
- Category-specific platforms (e.g., Swiggy/Zomato for restaurants, Zenoti for salons)
- Payment gateways (Razorpay, PayTM, etc.)
- POS systems relevant to the industry
- Booking/scheduling tools if applicable

## 3. AI TOOLS MODULE (Required)
Generate 4-6 AI-powered tools that would help THIS SPECIFIC business type:
- Customer engagement AI
- Operational AI
- Analytics AI
- Automation features

OUTPUT FORMAT (valid JSON only, no markdown, no code blocks):
{
    "modules": [
        {
            "id": "inventory_${primary.industryId}",
            "name": "[Industry-Specific Name like 'Menu & Inventory' or 'Service Catalog']",
            "description": "[What this manages]",
            "type": "inventory",
            "sourceIndustry": "${primary.industryId}",
            "sourceFunction": "${primary.functionId || primary.label}",
            "inventoryConfig": {
                "itemLabel": "...",
                "itemLabelPlural": "...",
                "priceLabel": "...",
                "fields": [
                    { "id": "field_id", "name": "Field Name", "type": "text|number|select|toggle|tags|textarea|image", "description": "...", "isRequired": true|false, "options": ["opt1", "opt2"] }
                ],
                "categories": [
                    { "id": "cat_id", "name": "Category Name", "description": "..." }
                ],
                "suggestedItems": [
                    { "name": "Item Name", "description": "...", "category": "Category Name", "suggestedPrice": 299, "fields": {} }
                ]
            }
        },
        {
            "id": "integrations",
            "name": "Integrations",
            "description": "Connect with essential third-party platforms",
            "type": "integration",
            "sourceIndustry": "${primary.industryId}",
            "sourceFunction": "${primary.functionId || primary.label}",
            "integrationConfig": {
                "platforms": [
                    { "id": "platform_id", "name": "Platform Name", "description": "...", "category": "delivery|pos|booking|payment|marketing" }
                ]
            }
        },
        {
            "id": "ai_tools",
            "name": "AI Tools",
            "description": "AI-powered features for your business",
            "type": "ai_tool",
            "sourceIndustry": "${primary.industryId}",
            "sourceFunction": "${primary.functionId || primary.label}",
            "aiToolConfig": {
                "tools": [
                    { "id": "tool_id", "name": "Tool Name", "description": "...", "useCase": "...", "category": "automation|analytics|customer|operations" }
                ]
            }
        }
    ]
}`;

        const response = await anthropic.messages.create({
            model: AI_MODEL,
            max_tokens: 16000,
            system: 'You are a business data architect. You ONLY output valid JSON. No markdown, no explanation, no code fences. Raw JSON only.',
            messages: [{ role: 'user', content: prompt }],
        });

        const text = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map(block => block.text)
            .join('');

        let parsed: { modules: GeneratedModule[] };
        try {
            parsed = cleanAndParseJSON(text);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.log("Raw Text:", text);
            throw new Error('Could not parse AI response: ' + (e instanceof Error ? e.message : String(e)));
        }

        const config: ModulesConfig = {
            generatedAt: new Date().toISOString(),
            businessCategories: categories,
            modules: parsed.modules
        };

        return { success: true, config };
    } catch (error) {
        console.error('Module generation error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate modules'
        };
    }
}

/**
 * Generate additional items for an inventory module
 */
export async function generateMoreInventoryItems(
    industryName: string,
    functionName: string,
    existingCategories: string[],
    existingItemNames: string[],
    count: number = 5
): Promise<{
    success: boolean;
    items?: GeneratedItem[];
    error?: string;
}> {
    try {
        const prompt = `Generate ${count} new inventory items for a ${functionName} business in the ${industryName} industry.

Available categories: ${existingCategories.join(', ')}
Avoid duplicating: ${existingItemNames.slice(0, 10).join(', ')}

Generate diverse items across different categories with realistic INR pricing.

OUTPUT (valid JSON only):
{
    "items": [
        { "name": "...", "description": "...", "category": "...", "suggestedPrice": 299, "fields": {} }
    ]
}`;

        const response = await anthropic.messages.create({
            model: AI_MODEL,
            max_tokens: 4000,
            system: 'You are a business data architect. You ONLY output valid JSON. No markdown, no explanation, no code fences. Raw JSON only.',
            messages: [{ role: 'user', content: prompt }],
        });

        const text = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map(block => block.text)
            .join('');
        const parsed = JSON.parse(text || '{}');
        return { success: true, items: parsed.items || [] };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to generate items' };
    }
}

/**
 * Enhance a single item with AI-generated description and pricing
 */
export async function enhanceInventoryItem(
    itemName: string,
    category: string,
    industryName: string
): Promise<{
    success: boolean;
    enhancement?: { description: string; suggestedPrice: number; tags: string[] };
    error?: string;
}> {
    try {
        const prompt = `For a ${industryName} business, enhance this item:

Item: ${itemName}
Category: ${category}

Generate: description (2-3 sentences), realistic INR price, 3-5 tags.

OUTPUT (valid JSON only):
{ "description": "...", "suggestedPrice": 299, "tags": ["tag1", "tag2"] }`;

        const response = await anthropic.messages.create({
            model: AI_MODEL,
            max_tokens: 2000,
            system: 'You are a business data architect. You ONLY output valid JSON. No markdown, no explanation, no code fences. Raw JSON only.',
            messages: [{ role: 'user', content: prompt }],
        });

        const text = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map(block => block.text)
            .join('');
        const parsed = JSON.parse(text || '{}');
        return { success: true, enhancement: parsed };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
}
