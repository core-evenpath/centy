/**
 * Country-Specific Expertise Overrides
 *
 * This file contains country-specific options for industry expertise fields.
 * Similar to business-taxonomy country overrides, these allow localization
 * of regulatory bodies, certifications, payment methods, etc.
 *
 * Structure:
 * - Base schemas in industry-expertise-configs.ts are country-agnostic
 * - This file provides country-specific OPTIONS for select/checkbox fields
 * - AI can be used to generate additional country-specific content
 */

import type { CountryCode } from '../business-taxonomy';

// ============================================
// TYPES
// ============================================

export interface FieldOptionOverride {
    value: string;
    label: string;
    description?: string;
}

export interface FieldOverride {
    options?: FieldOptionOverride[];
    placeholder?: string;
    helpText?: string;
}

export interface ExpertiseFieldOverrides {
    [fieldKey: string]: FieldOverride;
}

export interface IndustryExpertiseOverride {
    [industryId: string]: ExpertiseFieldOverrides;
}

export type CountryExpertiseOverrides = Record<CountryCode, IndustryExpertiseOverride>;

// ============================================
// INDIA (IN) OVERRIDES
// ============================================
const INDIA_OVERRIDES: IndustryExpertiseOverride = {
    finance: {
        regulatoryRegistrations: {
            options: [
                { value: 'amfi', label: 'AMFI Registered (ARN)' },
                { value: 'sebi_ria', label: 'SEBI RIA' },
                { value: 'sebi_ra', label: 'SEBI Research Analyst' },
                { value: 'irdai_life', label: 'IRDAI - Life Insurance' },
                { value: 'irdai_general', label: 'IRDAI - General Insurance' },
                { value: 'irdai_composite', label: 'IRDAI - Composite Broker' },
                { value: 'sebi_broker', label: 'SEBI Stock Broker' },
                { value: 'pfrda', label: 'PFRDA (NPS)' },
                { value: 'rbi_nbfc', label: 'RBI Registered NBFC' },
                { value: 'icai', label: 'ICAI (CA)' },
                { value: 'fpsb', label: 'FPSB India (CFP)' },
            ],
        },
        professionalCertifications: {
            placeholder: 'e.g., CFP, CFA, NISM Series V/VIII/X-A/X-B',
        },
        investmentProducts: {
            options: [
                { value: 'equity_mf', label: 'Equity Mutual Funds' },
                { value: 'debt_mf', label: 'Debt Mutual Funds' },
                { value: 'hybrid_mf', label: 'Hybrid/Balanced Funds' },
                { value: 'index_funds', label: 'Index Funds & ETFs' },
                { value: 'elss', label: 'ELSS (Tax Saving)' },
                { value: 'direct_equity', label: 'Direct Equity' },
                { value: 'ipo', label: 'IPO Advisory' },
                { value: 'nps', label: 'NPS' },
                { value: 'ppf_epf', label: 'PPF/EPF' },
                { value: 'gold', label: 'Gold/Silver (SGB, ETF)' },
                { value: 'real_estate_funds', label: 'REITs/InvITs' },
                { value: 'international', label: 'International Funds' },
            ],
        },
    },
    education: {
        boards: {
            options: [
                { value: 'cbse', label: 'CBSE' },
                { value: 'icse', label: 'ICSE/ISC' },
                { value: 'state', label: 'State Board' },
                { value: 'ib', label: 'IB (International Baccalaureate)' },
                { value: 'cambridge', label: 'Cambridge (IGCSE)' },
                { value: 'nios', label: 'NIOS' },
            ],
            placeholder: 'e.g., CBSE, ICSE, State Board',
        },
        subjects: {
            placeholder: 'e.g., JEE, NEET, UPSC, Mathematics, Science',
        },
    },
    real_estate: {
        priceSegment: {
            options: [
                { value: 'budget', label: 'Budget (< ₹50L)' },
                { value: 'mid_range', label: 'Mid Range (₹50L - 1Cr)' },
                { value: 'premium', label: 'Premium (₹1Cr - 3Cr)' },
                { value: 'luxury', label: 'Luxury (> ₹3Cr)' },
            ],
        },
    },
    healthcare: {
        insuranceProviders: {
            placeholder: 'e.g., Star Health, ICICI Lombard, HDFC Ergo, Max Bupa',
        },
    },
    retail: {
        paymentModes: {
            options: [
                { value: 'cash', label: 'Cash' },
                { value: 'card', label: 'Credit/Debit Card' },
                { value: 'upi', label: 'UPI (GPay, PhonePe, Paytm)' },
                { value: 'bnpl', label: 'Buy Now Pay Later' },
                { value: 'emi', label: 'EMI Available' },
                { value: 'netbanking', label: 'Net Banking' },
            ],
        },
    },
};

// ============================================
// UNITED STATES (US) OVERRIDES
// ============================================
const US_OVERRIDES: IndustryExpertiseOverride = {
    finance: {
        regulatoryRegistrations: {
            options: [
                { value: 'sec_ria', label: 'SEC Registered Investment Adviser' },
                { value: 'finra_series7', label: 'FINRA Series 7' },
                { value: 'finra_series66', label: 'FINRA Series 66' },
                { value: 'finra_series65', label: 'FINRA Series 65' },
                { value: 'cpa', label: 'CPA (Certified Public Accountant)' },
                { value: 'cfp', label: 'CFP Board Certified' },
                { value: 'cfa', label: 'CFA Charterholder' },
                { value: 'state_insurance', label: 'State Insurance License' },
                { value: 'nmls', label: 'NMLS (Mortgage)' },
            ],
        },
        professionalCertifications: {
            placeholder: 'e.g., CFP, CFA, CPA, ChFC, CLU',
        },
        investmentProducts: {
            options: [
                { value: 'stocks', label: 'Individual Stocks' },
                { value: 'bonds', label: 'Bonds (Municipal, Corporate, Treasury)' },
                { value: 'mutual_funds', label: 'Mutual Funds' },
                { value: 'etfs', label: 'ETFs' },
                { value: '401k', label: '401(k) Plans' },
                { value: 'ira', label: 'IRA (Traditional/Roth)' },
                { value: '529', label: '529 College Savings' },
                { value: 'annuities', label: 'Annuities' },
                { value: 'reits', label: 'REITs' },
                { value: 'options', label: 'Options & Derivatives' },
                { value: 'crypto', label: 'Cryptocurrency' },
            ],
        },
    },
    education: {
        boards: {
            options: [
                { value: 'public', label: 'Public School District' },
                { value: 'private', label: 'Private School' },
                { value: 'charter', label: 'Charter School' },
                { value: 'homeschool', label: 'Homeschool' },
                { value: 'college_prep', label: 'College Prep' },
            ],
            placeholder: 'e.g., SAT, ACT, AP, College Prep',
        },
        subjects: {
            placeholder: 'e.g., SAT Prep, ACT Prep, AP Classes, STEM',
        },
    },
    real_estate: {
        priceSegment: {
            options: [
                { value: 'starter', label: 'Starter Home (< $300K)' },
                { value: 'mid_market', label: 'Mid Market ($300K - $600K)' },
                { value: 'move_up', label: 'Move-Up ($600K - $1M)' },
                { value: 'luxury', label: 'Luxury ($1M - $3M)' },
                { value: 'ultra_luxury', label: 'Ultra Luxury (> $3M)' },
            ],
        },
    },
    healthcare: {
        insuranceProviders: {
            placeholder: 'e.g., Blue Cross Blue Shield, Aetna, UnitedHealthcare, Cigna',
        },
    },
    retail: {
        paymentModes: {
            options: [
                { value: 'cash', label: 'Cash' },
                { value: 'card', label: 'Credit/Debit Card' },
                { value: 'apple_pay', label: 'Apple Pay' },
                { value: 'google_pay', label: 'Google Pay' },
                { value: 'venmo', label: 'Venmo' },
                { value: 'paypal', label: 'PayPal' },
                { value: 'bnpl', label: 'Buy Now Pay Later (Affirm, Klarna)' },
                { value: 'check', label: 'Check' },
            ],
        },
    },
};

// ============================================
// UNITED ARAB EMIRATES (AE) OVERRIDES
// ============================================
const UAE_OVERRIDES: IndustryExpertiseOverride = {
    finance: {
        regulatoryRegistrations: {
            options: [
                { value: 'sca', label: 'SCA Licensed (Securities & Commodities Authority)' },
                { value: 'dfsa', label: 'DFSA Licensed (DIFC)' },
                { value: 'cbuae', label: 'CBUAE Licensed (Central Bank)' },
                { value: 'adgm_fsra', label: 'ADGM FSRA Licensed' },
                { value: 'insurance_authority', label: 'Insurance Authority Licensed' },
                { value: 'cfa', label: 'CFA Charterholder' },
                { value: 'cfp', label: 'CFP Certificant' },
            ],
        },
        professionalCertifications: {
            placeholder: 'e.g., CFA, CFP, CISI, CMA',
        },
        investmentProducts: {
            options: [
                { value: 'local_equities', label: 'UAE Equities (DFM, ADX)' },
                { value: 'gcc_equities', label: 'GCC Equities' },
                { value: 'international', label: 'International Markets' },
                { value: 'sukuk', label: 'Sukuk (Islamic Bonds)' },
                { value: 'mutual_funds', label: 'Mutual Funds' },
                { value: 'real_estate', label: 'Real Estate Investments' },
                { value: 'gold', label: 'Gold & Precious Metals' },
                { value: 'sharia_compliant', label: 'Sharia-Compliant Products' },
            ],
        },
    },
    education: {
        boards: {
            options: [
                { value: 'moe', label: 'UAE Ministry of Education' },
                { value: 'british', label: 'British Curriculum' },
                { value: 'american', label: 'American Curriculum' },
                { value: 'ib', label: 'IB (International Baccalaureate)' },
                { value: 'indian_cbse', label: 'Indian CBSE' },
                { value: 'indian_icse', label: 'Indian ICSE' },
                { value: 'french', label: 'French Curriculum' },
            ],
            placeholder: 'e.g., British, American, IB, CBSE',
        },
    },
    real_estate: {
        priceSegment: {
            options: [
                { value: 'affordable', label: 'Affordable (< AED 1M)' },
                { value: 'mid_range', label: 'Mid Range (AED 1M - 3M)' },
                { value: 'premium', label: 'Premium (AED 3M - 10M)' },
                { value: 'luxury', label: 'Luxury (> AED 10M)' },
            ],
        },
    },
    retail: {
        paymentModes: {
            options: [
                { value: 'cash', label: 'Cash' },
                { value: 'card', label: 'Credit/Debit Card' },
                { value: 'apple_pay', label: 'Apple Pay' },
                { value: 'samsung_pay', label: 'Samsung Pay' },
                { value: 'tabby', label: 'Tabby (BNPL)' },
                { value: 'tamara', label: 'Tamara (BNPL)' },
                { value: 'bank_transfer', label: 'Bank Transfer' },
            ],
        },
    },
};

// ============================================
// UNITED KINGDOM (GB) OVERRIDES
// ============================================
const UK_OVERRIDES: IndustryExpertiseOverride = {
    finance: {
        regulatoryRegistrations: {
            options: [
                { value: 'fca', label: 'FCA Authorised' },
                { value: 'pra', label: 'PRA Authorised' },
                { value: 'cii', label: 'CII Qualified' },
                { value: 'cfa', label: 'CFA Charterholder' },
                { value: 'cisi', label: 'CISI Member' },
                { value: 'cfp', label: 'CFP Certificant' },
                { value: 'acca', label: 'ACCA' },
                { value: 'icaew', label: 'ICAEW (ACA)' },
            ],
        },
        professionalCertifications: {
            placeholder: 'e.g., CFA, CFP, DipPFS, CISI Level 4',
        },
        investmentProducts: {
            options: [
                { value: 'stocks_shares_isa', label: 'Stocks & Shares ISA' },
                { value: 'cash_isa', label: 'Cash ISA' },
                { value: 'lifetime_isa', label: 'Lifetime ISA' },
                { value: 'pensions', label: 'Pensions (SIPP, Workplace)' },
                { value: 'funds', label: 'Funds (OEIC, Unit Trusts)' },
                { value: 'etfs', label: 'ETFs' },
                { value: 'bonds', label: 'Bonds & Gilts' },
                { value: 'vcts', label: 'VCTs' },
                { value: 'eis_seis', label: 'EIS/SEIS' },
            ],
        },
    },
    education: {
        boards: {
            options: [
                { value: 'gcse', label: 'GCSE' },
                { value: 'a_levels', label: 'A-Levels' },
                { value: 'btec', label: 'BTEC' },
                { value: 'scottish_highers', label: 'Scottish Highers' },
                { value: 'ib', label: 'IB (International Baccalaureate)' },
                { value: 'cambridge', label: 'Cambridge Pre-U' },
            ],
            placeholder: 'e.g., GCSE, A-Levels, BTEC, IB',
        },
    },
    real_estate: {
        priceSegment: {
            options: [
                { value: 'first_time', label: 'First-Time Buyer (< £250K)' },
                { value: 'mid_market', label: 'Mid Market (£250K - £500K)' },
                { value: 'family', label: 'Family Home (£500K - £1M)' },
                { value: 'prime', label: 'Prime (£1M - £5M)' },
                { value: 'super_prime', label: 'Super Prime (> £5M)' },
            ],
        },
    },
    retail: {
        paymentModes: {
            options: [
                { value: 'cash', label: 'Cash' },
                { value: 'card', label: 'Credit/Debit Card' },
                { value: 'contactless', label: 'Contactless' },
                { value: 'apple_pay', label: 'Apple Pay' },
                { value: 'google_pay', label: 'Google Pay' },
                { value: 'klarna', label: 'Klarna' },
                { value: 'clearpay', label: 'Clearpay' },
                { value: 'paypal', label: 'PayPal' },
            ],
        },
    },
};

// ============================================
// EXPORT COUNTRY OVERRIDES
// ============================================
export const EXPERTISE_COUNTRY_OVERRIDES: Partial<CountryExpertiseOverrides> = {
    'IN': INDIA_OVERRIDES,
    'US': US_OVERRIDES,
    'AE': UAE_OVERRIDES,
    'GB': UK_OVERRIDES,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Map taxonomy industry IDs to expertise config keys
 * The taxonomy uses longer IDs like 'financial_services' while
 * expertise configs use shorter keys like 'finance'
 */
const TAXONOMY_TO_EXPERTISE_KEY: Record<string, string> = {
    'financial_services': 'finance',
    'education_learning': 'education',
    'healthcare_medical': 'healthcare',
    'business_professional': 'services',
    'retail_commerce': 'retail',
    'food_beverage': 'food_beverage',
    'personal_wellness': 'beauty_wellness',
    'automotive_mobility': 'automotive',
    'hospitality': 'hospitality',
    'events_entertainment': 'events',
    'home_property': 'home_services',
    'travel_transport': 'other',
    'food_supply': 'other',
    'public_nonprofit': 'other',
};

/**
 * Convert taxonomy industry ID to expertise key
 */
function toExpertiseKey(industryId: string): string {
    return TAXONOMY_TO_EXPERTISE_KEY[industryId] || industryId;
}

/**
 * Get country-specific field override
 */
export function getFieldOverride(
    countryCode: CountryCode,
    industryId: string,
    fieldKey: string
): FieldOverride | undefined {
    const expertiseKey = toExpertiseKey(industryId);
    return EXPERTISE_COUNTRY_OVERRIDES[countryCode]?.[expertiseKey]?.[fieldKey];
}

/**
 * Get country-specific options for a field, falling back to default options
 */
export function getCountryFieldOptions(
    countryCode: CountryCode,
    industryId: string,
    fieldKey: string,
    defaultOptions: FieldOptionOverride[]
): FieldOptionOverride[] {
    const override = getFieldOverride(countryCode, industryId, fieldKey);
    return override?.options || defaultOptions;
}

/**
 * Get country-specific placeholder for a field
 */
export function getCountryPlaceholder(
    countryCode: CountryCode,
    industryId: string,
    fieldKey: string,
    defaultPlaceholder: string
): string {
    const override = getFieldOverride(countryCode, industryId, fieldKey);
    return override?.placeholder || defaultPlaceholder;
}

/**
 * Check if a country has expertise overrides
 */
export function hasCountryExpertiseOverrides(countryCode: CountryCode): boolean {
    return countryCode in EXPERTISE_COUNTRY_OVERRIDES;
}

/**
 * Get list of supported countries for expertise overrides
 */
export function getSupportedExpertiseCountries(): CountryCode[] {
    return Object.keys(EXPERTISE_COUNTRY_OVERRIDES) as CountryCode[];
}
