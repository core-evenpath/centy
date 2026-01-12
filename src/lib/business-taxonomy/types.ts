/**
 * Global Business Taxonomy Types
 * 
 * Multi-level taxonomy with country-specific overrides:
 * - Level 1: Industry
 * - Level 2: Business Function  
 * - Level 3: Specialization (optional)
 * - Country Override Layer for localized labels
 */

export type CountryCode = 'IN' | 'US' | 'AE' | 'UK' | 'GLOBAL';

export type DeliveryMode = 'online' | 'offline' | 'hybrid';
export type CustomerType = 'B2C' | 'B2B' | 'B2B2C';
export type RegulationLevel = 'low' | 'medium' | 'high';

/**
 * Level 1: Industry
 */
export interface Industry {
    industryId: string;
    name: string;
    description?: string;
    iconName: string;
}

/**
 * Level 2: Business Function
 */
export interface BusinessFunction {
    functionId: string;
    industryId: string;
    name: string;
    description?: string;
    googlePlacesTypes: string[];
    keywords?: string[];
}

/**
 * Level 3: Specialization (optional)
 */
export interface Specialization {
    specializationId: string;
    functionId: string;
    name: string;
}

/**
 * Country Override - Localized labels for specific countries
 */
export interface CountryOverride {
    overrideId: string;
    functionId: string;
    countryCode: CountryCode;
    localLabel: string;
    aliases?: string[];
    regulationLevel?: RegulationLevel;
    googlePlacesTypes?: string[]; // Override Google types if different
}

/**
 * Selected business category stored in the profile
 */
export interface SelectedBusinessCategory {
    industryId: string;
    functionId: string;
    specializationId?: string;
    label: string; // The display label (localized if applicable)
    googlePlacesTypes: string[];
}

/**
 * Business Attributes (metadata, not categories)
 */
export interface BusinessAttributes {
    deliveryMode?: DeliveryMode;
    customerType?: CustomerType;
    physicalPresence?: boolean;
}

/**
 * Full taxonomy data structure
 */
export interface TaxonomyData {
    industries: Industry[];
    functions: BusinessFunction[];
    specializations: Specialization[];
    countryOverrides: CountryOverride[];
}

/**
 * Computed/resolved function with localized label
 */
export interface ResolvedFunction extends BusinessFunction {
    displayLabel: string; // Localized label if override exists, otherwise global name
    industryName: string;
    isLocalized: boolean;
}
