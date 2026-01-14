'use server';

import { GoogleGenAI } from "@google/genai";
import type { CountryCode } from '@/lib/business-taxonomy';
import type { FieldOptionOverride, ExpertiseFieldOverrides } from '@/lib/schemas/expertise-country-overrides';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY });

// ============================================
// TYPES
// ============================================

export interface CountryExpertiseRequest {
    countryCode: CountryCode;
    countryName: string;
    industryId: string;
    industryName: string;
    fieldKey: string;
    fieldLabel: string;
    fieldType: 'select' | 'checkbox-group' | 'multi-select' | 'radio';
    context?: string; // Additional context about what the field is for
}

export interface GeneratedFieldOptions {
    options: FieldOptionOverride[];
    placeholder?: string;
    helpText?: string;
}

export interface CountryExpertiseResult {
    success: boolean;
    data?: ExpertiseFieldOverrides;
    error?: string;
}

// ============================================
// PROMPTS
// ============================================

const SYSTEM_PROMPT = `You are an expert in international business regulations, certifications, and industry standards.
Your task is to generate country-specific options for business profile fields.

Guidelines:
1. Only include options that are relevant and recognized in the specified country
2. Use the correct local terminology and abbreviations
3. Include regulatory bodies, certifications, licenses that are officially recognized
4. For financial services, include central bank, securities, insurance regulators
5. For education, include local examination boards and accreditation bodies
6. For healthcare, include local insurance providers and regulatory bodies
7. Keep option values in snake_case (e.g., 'sec_registered', 'fca_authorized')
8. Provide clear, concise labels
9. Add descriptions only when the abbreviation might not be clear

Return JSON in this exact format:
{
    "options": [
        { "value": "snake_case_value", "label": "Human Readable Label", "description": "Optional description" }
    ],
    "placeholder": "Example placeholder text",
    "helpText": "Optional help text for the field"
}`;

// ============================================
// GENERATE COUNTRY-SPECIFIC OPTIONS
// ============================================

export async function generateCountryExpertiseOptions(
    request: CountryExpertiseRequest
): Promise<{ success: boolean; data?: GeneratedFieldOptions; error?: string }> {
    try {
        const prompt = `Generate country-specific options for the following business profile field:

Country: ${request.countryName} (${request.countryCode})
Industry: ${request.industryName} (${request.industryId})
Field: ${request.fieldLabel} (${request.fieldKey})
Field Type: ${request.fieldType}
${request.context ? `Context: ${request.context}` : ''}

Provide options that are:
1. Specifically relevant to ${request.countryName}
2. Use local regulatory bodies, certifications, or standards
3. In the correct local language/terminology
4. Currently active and recognized (not outdated)

Return only valid JSON.`;

        const result = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: 'application/json',
                temperature: 0.3, // Lower temperature for more consistent results
            },
        });

        const text = result.text?.trim();
        if (!text) {
            return { success: false, error: 'No response from AI' };
        }

        // Parse the JSON response
        const parsed = JSON.parse(text) as GeneratedFieldOptions;

        // Validate the response structure
        if (!parsed.options || !Array.isArray(parsed.options)) {
            return { success: false, error: 'Invalid response structure' };
        }

        // Validate each option has required fields
        for (const opt of parsed.options) {
            if (!opt.value || !opt.label) {
                return { success: false, error: 'Options missing required value or label' };
            }
        }

        return { success: true, data: parsed };
    } catch (error) {
        console.error('Error generating country expertise options:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// ============================================
// GENERATE FULL INDUSTRY OVERRIDES
// ============================================

export async function generateCountryIndustryOverrides(
    countryCode: CountryCode,
    countryName: string,
    industryId: string,
    industryName: string,
    fieldsToGenerate: Array<{
        key: string;
        label: string;
        type: 'select' | 'checkbox-group' | 'multi-select' | 'radio';
        context?: string;
    }>
): Promise<CountryExpertiseResult> {
    try {
        const overrides: ExpertiseFieldOverrides = {};

        for (const field of fieldsToGenerate) {
            const result = await generateCountryExpertiseOptions({
                countryCode,
                countryName,
                industryId,
                industryName,
                fieldKey: field.key,
                fieldLabel: field.label,
                fieldType: field.type,
                context: field.context,
            });

            if (result.success && result.data) {
                overrides[field.key] = {
                    options: result.data.options,
                    placeholder: result.data.placeholder,
                    helpText: result.data.helpText,
                };
            }
        }

        return { success: true, data: overrides };
    } catch (error) {
        console.error('Error generating country industry overrides:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// ============================================
// BATCH GENERATE FOR NEW COUNTRY
// ============================================

/**
 * Generate expertise overrides for a new country across key industries
 * This is useful when adding support for a new country
 */
export async function generateNewCountryExpertise(
    countryCode: CountryCode,
    countryName: string
): Promise<{ success: boolean; data?: Record<string, ExpertiseFieldOverrides>; error?: string }> {
    try {
        const results: Record<string, ExpertiseFieldOverrides> = {};

        // Define the key fields that need country-specific options
        const industriesConfig = [
            {
                industryId: 'finance',
                industryName: 'Finance',
                fields: [
                    { key: 'regulatoryRegistrations', label: 'Regulatory Registrations', type: 'checkbox-group' as const, context: 'Financial regulators, licenses, and certifications required to operate in the country' },
                    { key: 'professionalCertifications', label: 'Professional Certifications', type: 'tags' as const, context: 'Industry certifications for financial advisors and professionals' },
                    { key: 'investmentProducts', label: 'Investment Products', type: 'checkbox-group' as const, context: 'Investment products available and regulated in the country' },
                ]
            },
            {
                industryId: 'education',
                industryName: 'Education',
                fields: [
                    { key: 'boards', label: 'Boards/Affiliations', type: 'checkbox-group' as const, context: 'Educational boards, examination bodies, and accreditation organizations' },
                ]
            },
            {
                industryId: 'real_estate',
                industryName: 'Real Estate',
                fields: [
                    { key: 'priceSegment', label: 'Price Segment', type: 'checkbox-group' as const, context: 'Property price ranges using local currency' },
                ]
            },
            {
                industryId: 'healthcare',
                industryName: 'Healthcare',
                fields: [
                    { key: 'insuranceProviders', label: 'Insurance Providers', type: 'tags' as const, context: 'Major health insurance providers in the country' },
                ]
            },
            {
                industryId: 'retail',
                industryName: 'Retail',
                fields: [
                    { key: 'paymentModes', label: 'Payment Modes', type: 'checkbox-group' as const, context: 'Popular payment methods including local digital wallets and BNPL services' },
                ]
            },
        ];

        for (const industry of industriesConfig) {
            const result = await generateCountryIndustryOverrides(
                countryCode,
                countryName,
                industry.industryId,
                industry.industryName,
                industry.fields
            );

            if (result.success && result.data) {
                results[industry.industryId] = result.data;
            }
        }

        return { success: true, data: results };
    } catch (error) {
        console.error('Error generating new country expertise:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
