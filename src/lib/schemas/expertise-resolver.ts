/**
 * Expertise Schema Resolver
 *
 * Composes expertise schemas based on selected business categories,
 * applying function-based and country-based field conditions.
 */

import type {
    FieldConfig,
    SubSectionConfig,
    IndustryExpertiseConfig,
    ResolvedExpertiseSchema,
} from './business-profile-ui-schema';
import type { SelectedBusinessCategory, CountryCode } from '../business-taxonomy/types';
import { BUSINESS_PROFILE_CONFIG } from './business-profile-ui-schema';

/**
 * Mapping from new taxonomy industryIds to legacy expertise config keys
 * This bridges the gap between the new business taxonomy and existing expertise configs
 */
const INDUSTRY_ID_TO_EXPERTISE_KEY: Record<string, string> = {
    'financial_services': 'finance',
    'education_learning': 'education',
    'healthcare_medical': 'healthcare',
    'business_professional': 'services',
    'retail_commerce': 'retail',
    'food_beverage': 'food_beverage',
    'food_supply': 'food_beverage', // Uses same expertise as F&B
    'personal_wellness': 'beauty_wellness',
    'automotive_mobility': 'automotive',
    'travel_transport': 'hospitality', // Uses hospitality expertise
    'hospitality': 'hospitality',
    'events_entertainment': 'events',
    'home_property': 'home_services',
    'public_nonprofit': 'other',
    // Legacy IDs (for backward compatibility)
    'finance': 'finance',
    'education': 'education',
    'healthcare': 'healthcare',
    'services': 'services',
    'retail': 'retail',
    'beauty_wellness': 'beauty_wellness',
    'automotive': 'automotive',
    'events': 'events',
    'home_services': 'home_services',
    'real_estate': 'real_estate',
    'technology': 'technology',
    'manufacturing': 'manufacturing',
    'other': 'other',
};

/**
 * Get the expertise config key for a given industryId
 */
function getExpertiseKey(industryId: string): string {
    return INDUSTRY_ID_TO_EXPERTISE_KEY[industryId] || industryId;
}


/**
 * Resolve expertise schema for selected business categories
 *
 * @param selectedCategories - Array of selected business categories
 * @param countryCode - Country code for country-specific field visibility
 * @returns Resolved expertise schema with filtered sections and fields
 */
export function resolveExpertiseSchema(
    selectedCategories: SelectedBusinessCategory[],
    countryCode: CountryCode
): ResolvedExpertiseSchema {
    if (selectedCategories.length === 0) {
        return {
            sections: [],
            primaryFunctionId: '',
            allFunctionIds: [],
            industryIds: [],
        };
    }

    const functionIds = selectedCategories.map(c => c.functionId);
    const industryIds = [...new Set(selectedCategories.map(c => c.industryId))];

    const allSections: SubSectionConfig[] = [];
    const seenSectionIds = new Set<string>();
    const seenFieldKeys = new Set<string>();

    // Process each industry's expertise config
    for (const industryId of industryIds) {
        // Map new taxonomy industryIds to legacy expertise config keys
        const expertiseKey = getExpertiseKey(industryId);
        const expertiseConfig = BUSINESS_PROFILE_CONFIG.industryExpertise[expertiseKey];
        if (!expertiseConfig) continue;

        for (const section of expertiseConfig.subSections) {
            // Check section-level conditions
            if (!shouldShowSection(section, functionIds)) continue;

            // If section already exists, merge fields
            if (seenSectionIds.has(section.id)) {
                const existingSection = allSections.find(s => s.id === section.id);
                if (existingSection) {
                    const newFields = section.fields
                        .filter(f => {
                            if (seenFieldKeys.has(f.key)) return false;
                            if (!shouldShowField(f, functionIds, countryCode)) return false;
                            seenFieldKeys.add(f.key);
                            return true;
                        })
                        .map(f => ({
                            ...f,
                            validation: getFieldValidation(f, functionIds)
                        }));
                    existingSection.fields.push(...newFields);
                }
                continue;
            }

            // Filter fields based on conditions
            const filteredFields = section.fields
                .filter(f => {
                    if (seenFieldKeys.has(f.key)) return false;
                    if (!shouldShowField(f, functionIds, countryCode)) return false;
                    seenFieldKeys.add(f.key);
                    return true;
                })
                .map(f => ({
                    ...f,
                    validation: getFieldValidation(f, functionIds)
                }));

            // Only add section if it has visible fields
            if (filteredFields.length > 0) {
                seenSectionIds.add(section.id);
                allSections.push({
                    ...section,
                    fields: filteredFields,
                });
            }
        }
    }

    return {
        sections: allSections,
        primaryFunctionId: functionIds[0] || '',
        allFunctionIds: functionIds,
        industryIds,
    };
}

/**
 * Check if a section should be shown based on function conditions
 */
export function shouldShowSection(
    section: SubSectionConfig,
    functionIds: string[]
): boolean {
    // If showForFunctions is specified, section only shows for those functions
    if (section.showForFunctions && section.showForFunctions.length > 0) {
        return section.showForFunctions.some(f => functionIds.includes(f));
    }

    // If hideForFunctions is specified, section hides for those functions
    if (section.hideForFunctions && section.hideForFunctions.length > 0) {
        return !section.hideForFunctions.some(f => functionIds.includes(f));
    }

    // No conditions - always show
    return true;
}

/**
 * Check if a field should be shown based on function and country conditions
 */
export function shouldShowField(
    field: FieldConfig,
    functionIds: string[],
    countryCode: CountryCode
): boolean {
    // Check function-based visibility
    if (field.showForFunctions && field.showForFunctions.length > 0) {
        if (!field.showForFunctions.some(f => functionIds.includes(f))) {
            return false;
        }
    }

    if (field.hideForFunctions && field.hideForFunctions.length > 0) {
        if (field.hideForFunctions.some(f => functionIds.includes(f))) {
            return false;
        }
    }

    // Check country-based visibility
    if (field.showForCountries && field.showForCountries.length > 0) {
        if (!field.showForCountries.includes(countryCode) && !field.showForCountries.includes('GLOBAL')) {
            return false;
        }
    }

    if (field.hideForCountries && field.hideForCountries.length > 0) {
        if (field.hideForCountries.includes(countryCode)) {
            return false;
        }
    }

    return true;
}

/**
 * Check if a field is required based on function conditions
 */
export function isFieldRequired(
    field: FieldConfig,
    functionIds: string[]
): boolean {
    // Check base validation
    if (field.validation?.required) {
        return true;
    }

    // Check function-specific required conditions
    if (field.requiredForFunctions && field.requiredForFunctions.length > 0) {
        return field.requiredForFunctions.some(f => functionIds.includes(f));
    }

    return false;
}

/**
 * Get field validation with function-based required override
 */
export function getFieldValidation(
    field: FieldConfig,
    functionIds: string[]
): FieldConfig['validation'] {
    const baseValidation = field.validation || {};
    const isRequired = isFieldRequired(field, functionIds);

    return {
        ...baseValidation,
        required: isRequired,
    };
}

/**
 * Get all fields for a set of function IDs (flattened)
 */
export function getAllFieldsForFunctions(
    functionIds: string[],
    countryCode: CountryCode
): FieldConfig[] {
    const result = resolveExpertiseSchema(
        functionIds.map(fid => ({
            functionId: fid,
            industryId: '', // Will be filled by schema lookup
            label: '',
            googlePlacesTypes: [],
        })),
        countryCode
    );

    return result.sections.flatMap(s => s.fields);
}
