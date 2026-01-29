/**
 * Global Business Taxonomy Types
 * 
 * Multi-level taxonomy with country-specific overrides:
 * - Level 1: Industry
 * - Level 2: Business Function  
 * - Level 3: Specialization (optional)
 * - Country Override Layer for localized labels
 */

// Countries that have specific label overrides defined
export type OverrideCountryCode = 'IN' | 'US' | 'AE' | 'GB';

// All country codes (string to support 70+ countries)
export type CountryCode = string;

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

export interface TaxonomyIndustry extends Industry {
    isActive: boolean;
    sortOrder: number;
    createdAt?: any;
    updatedAt?: any;
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

export interface TaxonomyFunction extends BusinessFunction {
    isActive: boolean;
    sortOrder: number;
}

/**
 * Level 3: Specialization (optional)
 */
export interface Specialization {
    specializationId: string;
    functionId: string;
    name: string;
}

export interface TaxonomySpecialization extends Specialization {
    isActive: boolean;
    sortOrder: number;
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

export interface TaxonomyCountryOverride extends CountryOverride {
    // Firestore specific fields if any
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
