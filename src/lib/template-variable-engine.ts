/**
 * Template Variable Engine
 *
 * Handles extraction, mapping, preview replacement, and send-time replacement
 * of template variables ({{1}}, {{2}}, etc.) in broadcast templates.
 *
 * Supports 4 variable sources:
 *  - contact: auto-filled from recipient contact data (name, phone, email, area)
 *  - business: auto-filled from partner's business profile (businessName, phone, address)
 *  - module: AI-assisted fill from partner's module inventory (rooms, products, etc.)
 *  - static: manually entered by the partner in the studio
 */

import type { VariableDefinition } from '@/lib/types';

export interface VariableMapping {
    variable: string;        // '{{1}}'
    field: string;           // 'name', 'area', 'budget', 'email', 'businessName', etc.
    label: string;           // 'Recipient Name', 'Hotel Name', etc.
    source: 'contact' | 'business' | 'module' | 'static';
    previewValue: string;    // 'Michael Chen', 'Downtown', etc.
    fallback?: string;       // fallback if data missing
    businessField?: string;  // for source:'business' — 'businessName', 'businessPhone', etc.
    moduleRef?: {            // for source:'module' — slug + field + AI hint
        moduleSlug: string;
        field: string;
        aiSuggestionPrompt?: string;
    };
}

/**
 * Extract all numbered template variables ({{1}}, {{2}}, etc.) from template body text.
 * Returns unique variables in order.
 */
export function extractTemplateVariables(templateBody: string): string[] {
    const regex = /\{\{(\d+)\}\}/g;
    const matches = templateBody.match(regex) || [];
    // Dedupe while preserving order
    return Array.from(new Set(matches));
}

/**
 * Get surrounding text context around a variable occurrence for smart inference.
 */
function getContextAroundVariable(text: string, variable: string): string {
    const index = text.indexOf(variable);
    if (index === -1) return '';

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + variable.length + 50);
    return text.substring(start, end).toLowerCase();
}

/**
 * Get a fallback value for a field when contact data is missing.
 */
export function getFallbackValue(field: string): string {
    const fallbacks: Record<string, string> = {
        name: 'Friend',
        area: 'your area',
        budget: 'competitive pricing',
        email: '',
        company: 'your company',
        phone: '',
        businessName: 'our business',
        businessPhone: '',
        address: 'our location',
    };
    return fallbacks[field] || '';
}

/**
 * Convert a VariableDefinition (from template's variableMap) to a VariableMapping.
 * This bridges the new architecture types with the existing mapping system.
 */
export function variableDefinitionToMapping(def: VariableDefinition): VariableMapping {
    return {
        variable: def.token,
        field: def.contactField || def.businessField || def.moduleRef?.field || 'custom',
        label: def.label,
        source: def.source,
        previewValue: def.preview,
        fallback: def.fallback,
        businessField: def.businessField,
        moduleRef: def.moduleRef,
    };
}

/**
 * Convert a template's variableMap (VariableDefinition[]) to VariableMapping[].
 * Used when the template has pre-defined variable intelligence.
 */
export function variableMapToMappings(variableMap: VariableDefinition[]): VariableMapping[] {
    return variableMap.map(variableDefinitionToMapping);
}

/**
 * Auto-map template variables to contact fields using context clues.
 *
 * - First variable ({{1}}) always maps to contact name.
 * - Subsequent variables are inferred from surrounding text (location, price, etc.)
 * - Industry context is used for friendlier labels.
 *
 * IMPORTANT: If the template has a variableMap, prefer variableMapToMappings() instead.
 * This function is the fallback for templates without variableMap.
 */
export function autoMapVariables(
    templateBody: string,
    variables: string[],
    partnerIndustry: string,
    sampleContact: Record<string, any>
): VariableMapping[] {
    const mappings: VariableMapping[] = [];

    variables.forEach((variable, index) => {
        // First variable is always the recipient name
        if (index === 0) {
            mappings.push({
                variable,
                field: 'name',
                label: 'Recipient Name',
                source: 'contact',
                previewValue: sampleContact.name || 'Friend',
                fallback: 'Friend',
            });
            return;
        }

        const context = getContextAroundVariable(templateBody, variable);

        // Location / area inference
        if (context.includes('location') || context.includes('area') || context.includes('address') || context.includes('neighborhood') || context.includes('city')) {
            const industryLabel = partnerIndustry === 'real-estate' ? 'Property Location' : 'Location';
            mappings.push({
                variable,
                field: 'area',
                label: industryLabel,
                source: 'contact',
                previewValue: sampleContact.area || sampleContact.customFields?.area || 'Downtown',
                fallback: 'your area',
            });
            return;
        }

        // Price / budget inference
        if (context.includes('price') || context.includes('budget') || context.includes('$') || context.includes('cost') || context.includes('amount')) {
            const industryLabel = partnerIndustry === 'real-estate' ? 'Price' : 'Amount';
            mappings.push({
                variable,
                field: 'budget',
                label: industryLabel,
                source: 'contact',
                previewValue: sampleContact.budget || sampleContact.customFields?.budget || '$450,000',
                fallback: 'competitive pricing',
            });
            return;
        }

        // Business name inference
        if (context.includes('business') || context.includes('hotel') || context.includes('restaurant') || context.includes('store') || context.includes('shop') || context.includes('clinic')) {
            mappings.push({
                variable,
                field: 'businessName',
                label: 'Business Name',
                source: 'business',
                previewValue: 'Your Business',
                fallback: 'our business',
                businessField: 'businessName',
            });
            return;
        }

        // Company inference
        if (context.includes('company') || context.includes('firm')) {
            mappings.push({
                variable,
                field: 'company',
                label: 'Company',
                source: 'contact',
                previewValue: sampleContact.company || sampleContact.customFields?.company || 'Acme Inc',
                fallback: 'your company',
            });
            return;
        }

        // Email inference
        if (context.includes('email') || context.includes('mail') || context.includes('contact')) {
            mappings.push({
                variable,
                field: 'email',
                label: 'Email',
                source: 'contact',
                previewValue: sampleContact.email || 'info@example.com',
                fallback: '',
            });
            return;
        }

        // Fallback: generic custom field
        mappings.push({
            variable,
            field: `custom_${index}`,
            label: `Field ${index + 1}`,
            source: 'static',
            previewValue: `[Field ${index + 1}]`,
            fallback: `[Field ${index + 1}]`,
        });
    });

    return mappings;
}

/**
 * Replace template variables in a message with their preview values.
 * Used for live preview display.
 */
export function replaceVariablesInPreview(
    messageText: string,
    mappings: VariableMapping[]
): string {
    let preview = messageText;

    for (const mapping of mappings) {
        const escapedVar = mapping.variable.replace(/[{}]/g, '\\$&');
        preview = preview.replace(new RegExp(escapedVar, 'g'), mapping.previewValue);
    }

    return preview;
}

/**
 * Replace template variables for a specific contact at send time.
 * Supports all 4 sources: contact, business, module, static.
 * Falls back to default values if data is missing.
 */
export function replaceVariablesForContact(
    messageTemplate: string,
    mappings: VariableMapping[],
    contact: Record<string, any>,
    businessData?: Record<string, any>
): string {
    let finalMessage = messageTemplate;

    for (const mapping of mappings) {
        let value = '';

        switch (mapping.source) {
            case 'contact':
                value = contact[mapping.field]
                    || contact.customFields?.[mapping.field]
                    || mapping.fallback
                    || getFallbackValue(mapping.field);
                break;

            case 'business':
                value = businessData?.[mapping.businessField || mapping.field]
                    || mapping.fallback
                    || getFallbackValue(mapping.field);
                break;

            case 'module':
                // Module values are resolved in the studio (pre-set by partner or AI suggestion)
                // At send time, they should already be set as preview values
                value = mapping.previewValue || mapping.fallback || '';
                break;

            case 'static':
                // Static values are typed by the partner in the studio
                value = mapping.previewValue || mapping.fallback || '';
                break;

            default:
                value = mapping.previewValue || '';
        }

        const escapedVar = mapping.variable.replace(/[{}]/g, '\\$&');
        finalMessage = finalMessage.replace(new RegExp(escapedVar, 'g'), value);
    }

    return finalMessage;
}
