import { NextRequest, NextResponse } from 'next/server';
import {
    generateNewCountryExpertise,
    generateCountryExpertiseOptions,
} from '@/actions/expertise-ai-generator';
import type { CountryCode } from '@/lib/business-taxonomy';

/**
 * POST /api/admin/generate-country-expertise
 *
 * Generate country-specific expertise options using Gemini AI
 *
 * Request body:
 * - countryCode: CountryCode (required)
 * - countryName: string (required)
 * - mode: 'full' | 'single' (default: 'full')
 * - industryId?: string (required if mode is 'single')
 * - fieldKey?: string (required if mode is 'single')
 * - fieldLabel?: string (required if mode is 'single')
 * - fieldType?: 'select' | 'checkbox-group' | 'multi-select' | 'radio' (required if mode is 'single')
 *
 * Example - Generate all expertise for Singapore:
 * POST /api/admin/generate-country-expertise
 * { "countryCode": "SG", "countryName": "Singapore" }
 *
 * Example - Generate single field for Canada:
 * POST /api/admin/generate-country-expertise
 * {
 *   "countryCode": "CA",
 *   "countryName": "Canada",
 *   "mode": "single",
 *   "industryId": "finance",
 *   "fieldKey": "regulatoryRegistrations",
 *   "fieldLabel": "Regulatory Registrations",
 *   "fieldType": "checkbox-group"
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { countryCode, countryName, mode = 'full' } = body;

        // Validate required fields
        if (!countryCode || !countryName) {
            return NextResponse.json(
                { error: 'countryCode and countryName are required' },
                { status: 400 }
            );
        }

        if (mode === 'single') {
            const { industryId, fieldKey, fieldLabel, fieldType } = body;

            if (!industryId || !fieldKey || !fieldLabel || !fieldType) {
                return NextResponse.json(
                    { error: 'For single mode, industryId, fieldKey, fieldLabel, and fieldType are required' },
                    { status: 400 }
                );
            }

            const result = await generateCountryExpertiseOptions({
                countryCode: countryCode as CountryCode,
                countryName,
                industryId,
                industryName: industryId, // Will be used in prompt
                fieldKey,
                fieldLabel,
                fieldType,
            });

            if (!result.success) {
                return NextResponse.json(
                    { error: result.error || 'Generation failed' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                countryCode,
                countryName,
                industryId,
                fieldKey,
                data: result.data,
                // Include TypeScript code snippet for easy copy-paste
                codeSnippet: generateCodeSnippet(countryCode, industryId, fieldKey, result.data),
            });
        }

        // Full generation mode
        const result = await generateNewCountryExpertise(
            countryCode as CountryCode,
            countryName
        );

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Generation failed' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            countryCode,
            countryName,
            data: result.data,
            // Include full TypeScript code for the country
            codeSnippet: generateFullCountryCode(countryCode, countryName, result.data),
        });
    } catch (error) {
        console.error('Error generating country expertise:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * Generate TypeScript code snippet for a single field
 */
function generateCodeSnippet(
    countryCode: string,
    industryId: string,
    fieldKey: string,
    data: any
): string {
    const optionsCode = data?.options
        ?.map((opt: any) => {
            const desc = opt.description ? `, description: '${opt.description}'` : '';
            return `                { value: '${opt.value}', label: '${opt.label}'${desc} }`;
        })
        .join(',\n');

    return `// Add to expertise-country-overrides.ts in ${countryCode}_OVERRIDES
${industryId}: {
    ${fieldKey}: {
        options: [
${optionsCode}
        ],${data?.placeholder ? `\n        placeholder: '${data.placeholder}',` : ''}${data?.helpText ? `\n        helpText: '${data.helpText}',` : ''}
    },
},`;
}

/**
 * Generate full TypeScript code for a new country
 */
function generateFullCountryCode(
    countryCode: string,
    countryName: string,
    data: Record<string, any> | undefined
): string {
    if (!data) return '// No data generated';

    const industriesCode = Object.entries(data)
        .map(([industryId, fields]) => {
            const fieldsCode = Object.entries(fields as Record<string, any>)
                .map(([fieldKey, fieldData]: [string, any]) => {
                    const optionsCode = fieldData.options
                        ?.map((opt: any) => {
                            const desc = opt.description ? `, description: '${opt.description}'` : '';
                            return `                { value: '${opt.value}', label: '${opt.label}'${desc} }`;
                        })
                        .join(',\n');

                    return `        ${fieldKey}: {
            options: [
${optionsCode}
            ],${fieldData.placeholder ? `\n            placeholder: '${fieldData.placeholder}',` : ''}
        }`;
                })
                .join(',\n');

            return `    ${industryId}: {\n${fieldsCode}\n    }`;
        })
        .join(',\n');

    return `// Add to expertise-country-overrides.ts

// ============================================
// ${countryName.toUpperCase()} (${countryCode}) OVERRIDES
// ============================================
const ${countryCode}_OVERRIDES: IndustryExpertiseOverride = {
${industriesCode}
};

// Then add to EXPERTISE_COUNTRY_OVERRIDES:
// '${countryCode}': ${countryCode}_OVERRIDES,`;
}
