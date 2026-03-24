'use server';

import { GoogleGenAI } from '@google/genai';
import type { ModuleFieldDefinition } from '@/lib/modules/types';
import { cleanAndParseJSON } from '@/lib/modules/utils';
import { getPartnerModuleAction, getSystemModuleAction } from './modules-actions';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const IMPORT_MODEL = 'gemini-3-pro-preview';

export async function generateSampleCSVAction(
    partnerId: string,
    moduleSlug: string
): Promise<{ success: boolean; csvContent?: string; filename?: string; error?: string }> {
    try {
        const result = await getPartnerModuleAction(partnerId, moduleSlug);

        if (!result.success || !result.data) {
            return { success: false, error: result.error || 'Module not found' };
        }

        const { systemModule } = result.data;
        const schema = systemModule.schema;

        const coreHeaders = ['name', 'description', 'category', 'price', 'currency', 'isActive', 'isFeatured', 'stock'];
        const schemaHeaders = schema.fields
            .filter(f => f.type !== 'image')
            .map(f => f.name);

        const allHeaders = [...coreHeaders, ...schemaHeaders];

        const generatePlaceholder = (header: string, field?: ModuleFieldDefinition, rowIndex?: number): string => {
            if (field) {
                switch (field.type) {
                    case 'number':
                    case 'currency':
                        return rowIndex === 0 ? '100' : '250';
                    case 'toggle':
                        return rowIndex === 0 ? 'true' : 'false';
                    case 'select':
                        return field.options?.[rowIndex === 0 ? 0 : Math.min(1, (field.options?.length || 1) - 1)] || '';
                    case 'multi_select':
                        return field.options?.slice(0, 2).join('; ') || '';
                    case 'tags':
                        return rowIndex === 0 ? 'tag1; tag2' : 'tag3; tag4';
                    case 'date':
                        return rowIndex === 0 ? '2025-01-15' : '2025-02-20';
                    case 'time':
                        return rowIndex === 0 ? '09:00' : '14:30';
                    case 'duration':
                        return rowIndex === 0 ? '60' : '90';
                    case 'url':
                        return rowIndex === 0 ? 'https://example.com/item-1' : 'https://example.com/item-2';
                    case 'email':
                        return rowIndex === 0 ? 'contact@example.com' : 'info@example.com';
                    case 'phone':
                        return rowIndex === 0 ? '+1234567890' : '+0987654321';
                    case 'textarea':
                    case 'text':
                    default:
                        return rowIndex === 0 ? `Sample ${field.name} 1` : `Sample ${field.name} 2`;
                }
            }

            switch (header) {
                case 'name':
                    return rowIndex === 0 ? 'Sample Item 1' : 'Sample Item 2';
                case 'description':
                    return rowIndex === 0 ? 'Description for item 1' : 'Description for item 2';
                case 'category':
                    return schema.categories?.[0]?.name || 'General';
                case 'price':
                    return rowIndex === 0 ? '99.99' : '149.99';
                case 'currency':
                    return systemModule.defaultCurrency || 'INR';
                case 'isActive':
                    return 'true';
                case 'isFeatured':
                    return 'false';
                case 'stock':
                    return rowIndex === 0 ? '10' : '25';
                default:
                    return '';
            }
        };

        const escapeCSV = (value: string): string => {
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        };

        const headerRow = allHeaders.map(h => escapeCSV(h)).join(',');

        const schemaFieldMap = new Map(
            schema.fields.filter(f => f.type !== 'image').map(f => [f.name, f])
        );

        const row1 = allHeaders.map(h => {
            const field = schemaFieldMap.get(h);
            return escapeCSV(generatePlaceholder(h, field, 0));
        }).join(',');

        const row2 = allHeaders.map(h => {
            const field = schemaFieldMap.get(h);
            return escapeCSV(generatePlaceholder(h, field, 1));
        }).join(',');

        const csvContent = [headerRow, row1, row2].join('\n');
        const filename = `${moduleSlug}-import-template.csv`;

        return { success: true, csvContent, filename };
    } catch (error) {
        console.error('Error generating sample CSV:', error);
        return { success: false, error: 'Failed to generate sample CSV' };
    }
}

export async function mapCSVColumnsAction(
    fileHeaders: string[],
    schemaFields: ModuleFieldDefinition[]
): Promise<{ success: boolean; mappings?: Record<string, string>; confidence?: Record<string, number>; error?: string }> {
    try {
        const schemaFieldLines = schemaFields
            .filter(f => f.type !== 'image')
            .map(f => `${f.id} | ${f.name} | ${f.description || ''} | ${f.type}`)
            .join('\n');

        const prompt = `You are a data field mapping assistant. Map uploaded CSV column headers to the target schema fields of a business module.

Map these uploaded column headers to schema fields.

Uploaded headers: ${fileHeaders.join(', ')}

Target schema fields (id | name | description | type):
${schemaFieldLines}

Core fields available: name, description, category, price, currency, isActive, isFeatured, stock

Return ONLY valid JSON in this exact format:
{
  "mappings": {
    "<uploaded_header>": "<schemaFieldId or core field key or 'skip'>"
  },
  "confidence": {
    "<uploaded_header>": <0.0-1.0>
  }
}

Rules:
- Every uploaded header must appear in mappings
- Use 'skip' if no reasonable match
- Only use exact field IDs from the provided list or the core field keys (name, description, category, price, currency, isActive, isFeatured, stock)
- Match semantically similar headers (e.g. "Product Name" -> "name", "Cost" -> "price")
- Be generous with matching but accurate with field IDs`;

        const response = await genAI.models.generateContent({
            model: IMPORT_MODEL,
            contents: prompt,
            config: {
                systemInstruction: 'You are a data field mapping assistant. You ONLY output valid JSON. No markdown, no explanation, no code fences. Raw JSON only.',
                maxOutputTokens: 4000,
                temperature: 0.1,
            },
        });
        const text = response.text?.trim() || '';
        const parsed = cleanAndParseJSON(text);

        if (!parsed || !parsed.mappings) {
            return { success: false, error: 'AI returned invalid mapping format' };
        }

        return {
            success: true,
            mappings: parsed.mappings,
            confidence: parsed.confidence || {},
        };
    } catch (error) {
        console.error('Error mapping CSV columns:', error);
        return { success: false, error: 'Failed to map columns' };
    }
}
