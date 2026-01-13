/**
 * Module Converter Utilities
 * Pure functions to convert between AI-generated and unified inventory formats
 * These are NOT server actions - just pure conversion utilities
 */

import type {
    InventoryConfig,
    InventoryItem,
    IntegrationsConfig,
    AIToolsConfig,
} from '@/lib/inventory-types';
import { generateItemId } from '@/lib/inventory-types';
import type { GeneratedModule } from '@/actions/module-generator-actions';

/**
 * Convert AI-generated modules to unified InventoryConfig
 */
export function convertToUnifiedInventory(modules: GeneratedModule[]): InventoryConfig | null {
    const inventoryModule = modules.find(m => m.type === 'inventory');
    if (!inventoryModule?.inventoryConfig) return null;

    const config = inventoryModule.inventoryConfig;
    const now = new Date().toISOString();

    // Convert to unified format
    const inventoryConfig: InventoryConfig = {
        itemLabel: config.itemLabel,
        itemLabelPlural: config.itemLabelPlural,
        priceLabel: config.priceLabel,
        currency: 'INR',

        // Map fields
        fields: config.fields.map(f => ({
            id: f.id,
            name: f.name,
            type: f.type,
            description: f.description,
            isRequired: f.isRequired,
            placeholder: f.placeholder,
            options: f.options,
            defaultValue: f.defaultValue,
        })),

        // Map categories
        categories: config.categories.map(c => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            description: c.description,
        })),

        // Map items
        items: config.suggestedItems.map((item, index) => ({
            id: generateItemId(),
            name: item.name,
            description: item.description,
            category: item.category,
            price: item.suggestedPrice,
            currency: 'INR',
            fields: item.fields || {},
            isActive: true,
            sortOrder: index,
            createdAt: now,
            updatedAt: now,
            source: 'ai_generated' as const,
        })),

        source: 'ai_generated',
        industryId: inventoryModule.sourceIndustry,
        functionId: inventoryModule.sourceFunction,
        generatedAt: now,
    };

    return inventoryConfig;
}

/**
 * Convert AI-generated integrations to unified format
 */
export function convertToUnifiedIntegrations(modules: GeneratedModule[]): IntegrationsConfig | null {
    const intModule = modules.find(m => m.type === 'integration');
    if (!intModule?.integrationConfig) return null;

    return {
        platforms: intModule.integrationConfig.platforms.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            category: p.category as any,
            isConnected: false,
        })),
        lastUpdatedAt: new Date().toISOString(),
    };
}

/**
 * Convert AI-generated tools to unified format
 */
export function convertToUnifiedAITools(modules: GeneratedModule[]): AIToolsConfig | null {
    const toolModule = modules.find(m => m.type === 'ai_tool');
    if (!toolModule?.aiToolConfig) return null;

    return {
        tools: toolModule.aiToolConfig.tools.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            useCase: t.useCase,
            category: t.category as any,
            isEnabled: false,
        })),
        lastUpdatedAt: new Date().toISOString(),
    };
}
