/**
 * Template Variable Engine
 *
 * Handles extraction, mapping, preview replacement, and send-time replacement
 * of template variables ({{1}}, {{2}}, etc.) in broadcast templates.
 */

export interface VariableMapping {
    variable: string;        // '{{1}}'
    field: string;           // 'name', 'area', 'budget', 'email', etc.
    label: string;           // 'Recipient Name', 'Location', etc.
    source: 'contact' | 'static';
    previewValue: string;    // 'Michael Chen', 'Downtown', etc.
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
    };
    return fallbacks[field] || '';
}

/**
 * Auto-map template variables to contact fields using context clues.
 *
 * - First variable ({{1}}) always maps to contact name.
 * - Subsequent variables are inferred from surrounding text (location, price, etc.)
 * - Industry context is used for friendlier labels.
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
            });
            return;
        }

        // Company inference
        if (context.includes('company') || context.includes('business') || context.includes('firm')) {
            mappings.push({
                variable,
                field: 'company',
                label: 'Company',
                source: 'contact',
                previewValue: sampleContact.company || sampleContact.customFields?.company || 'Acme Inc',
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
 * Falls back to default values if contact data is missing.
 */
export function replaceVariablesForContact(
    messageTemplate: string,
    mappings: VariableMapping[],
    contact: Record<string, any>
): string {
    let finalMessage = messageTemplate;

    for (const mapping of mappings) {
        let value = '';

        if (mapping.source === 'contact') {
            value = contact[mapping.field]
                || contact.customFields?.[mapping.field]
                || getFallbackValue(mapping.field);
        } else {
            // Static source: use preview value as-is
            value = mapping.previewValue;
        }

        const escapedVar = mapping.variable.replace(/[{}]/g, '\\$&');
        finalMessage = finalMessage.replace(new RegExp(escapedVar, 'g'), value);
    }

    return finalMessage;
}
