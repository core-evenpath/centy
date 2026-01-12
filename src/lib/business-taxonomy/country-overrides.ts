/**
 * Country-Specific Overrides
 * 
 * These provide localized labels for business functions in specific countries.
 * The global taxonomy remains unchanged - only labels are overridden.
 */

import { CountryOverride, CountryCode } from './types';

/**
 * Supported countries with their display info
 */
export const SUPPORTED_COUNTRIES: { code: CountryCode; name: string; flag: string }[] = [
    { code: 'GLOBAL', name: 'Global (Default)', flag: '🌍' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
];

/**
 * Country overrides - localized labels for specific countries
 */
export const COUNTRY_OVERRIDES: CountryOverride[] = [
    // ==========================================
    // 🇮🇳 INDIA OVERRIDES
    // ==========================================

    // Financial Services
    { overrideId: 'in_nbfc', functionId: 'alternative_lending', countryCode: 'IN', localLabel: 'NBFC / Microfinance', aliases: ['nbfc', 'microfinance', 'mfi'], regulationLevel: 'high' },
    { overrideId: 'in_chit', functionId: 'community_savings', countryCode: 'IN', localLabel: 'Chit Fund / Nidhi Company', aliases: ['chit fund', 'nidhi', 'chit'], regulationLevel: 'medium' },
    { overrideId: 'in_ca', functionId: 'accounting_tax', countryCode: 'IN', localLabel: 'CA Firm', aliases: ['ca', 'chartered accountant', 'ca firm'], regulationLevel: 'high' },
    { overrideId: 'in_dsa', functionId: 'consumer_lending', countryCode: 'IN', localLabel: 'Loan DSA', aliases: ['dsa', 'loan agent', 'finance dsa'], regulationLevel: 'medium' },
    { overrideId: 'in_payment', functionId: 'payments_processing', countryCode: 'IN', localLabel: 'Payment Gateway / UPI', aliases: ['payment gateway', 'upi', 'razorpay'], regulationLevel: 'high' },

    // Education
    { overrideId: 'in_coaching', functionId: 'test_preparation', countryCode: 'IN', localLabel: 'IIT / NEET / UPSC Coaching', aliases: ['iit coaching', 'neet coaching', 'upsc', 'competitive exam'], regulationLevel: 'low' },
    { overrideId: 'in_edtech', functionId: 'online_learning', countryCode: 'IN', localLabel: 'EdTech Company', aliases: ['edtech', 'byju', 'unacademy'], regulationLevel: 'low' },
    { overrideId: 'in_pg', functionId: 'shared_accommodation', countryCode: 'IN', localLabel: 'PG / Hostel', aliases: ['pg', 'paying guest', 'hostel', 'boys hostel', 'girls hostel'], regulationLevel: 'low' },
    { overrideId: 'in_playschool', functionId: 'early_childhood', countryCode: 'IN', localLabel: 'Playschool / Creche', aliases: ['playschool', 'creche', 'anganwadi'], regulationLevel: 'low' },

    // Retail
    { overrideId: 'in_kirana', functionId: 'grocery_convenience', countryCode: 'IN', localLabel: 'Kirana Store', aliases: ['kirana', 'provision store', 'general store'], regulationLevel: 'low' },
    { overrideId: 'in_thela', functionId: 'street_food', countryCode: 'IN', localLabel: 'Thela / Food Cart', aliases: ['thela', 'food cart', 'chaat'], regulationLevel: 'low' },

    // Healthcare
    { overrideId: 'in_ayurveda', functionId: 'alternative_medicine', countryCode: 'IN', localLabel: 'Ayurveda / Homeopathy', aliases: ['ayurveda', 'homeopathy', 'siddha', 'unani'], regulationLevel: 'medium' },
    { overrideId: 'in_pathology', functionId: 'diagnostic_imaging', countryCode: 'IN', localLabel: 'Pathology Lab', aliases: ['pathology', 'diagnostic lab', 'blood test'], regulationLevel: 'medium' },
    { overrideId: 'in_chemist', functionId: 'pharmacy_retail', countryCode: 'IN', localLabel: 'Medical Store / Chemist', aliases: ['chemist', 'medical store', 'dawakhana'], regulationLevel: 'high' },

    // Food
    { overrideId: 'in_tiffin', functionId: 'cloud_kitchen', countryCode: 'IN', localLabel: 'Tiffin Service / Cloud Kitchen', aliases: ['tiffin', 'dabba', 'meal subscription'], regulationLevel: 'low' },
    { overrideId: 'in_sabzi', functionId: 'fresh_produce', countryCode: 'IN', localLabel: 'Sabzi Mandi / Vegetable Vendor', aliases: ['sabzi', 'sabzi wala', 'vegetable vendor', 'mandi'], regulationLevel: 'low' },

    // Hospitality
    { overrideId: 'in_dharamshala', functionId: 'guest_houses', countryCode: 'IN', localLabel: 'Dharamshala / Guest House', aliases: ['dharamshala', 'dharmashala', 'rest house'], regulationLevel: 'low' },

    // Home Services
    { overrideId: 'in_dhobi', functionId: 'laundry_drycleaning', countryCode: 'IN', localLabel: 'Dhobi / Laundry', aliases: ['dhobi', 'laundry', 'ironing'], regulationLevel: 'low' },

    // ==========================================
    // 🇺🇸 UNITED STATES OVERRIDES
    // ==========================================

    // Financial Services
    { overrideId: 'us_cpa', functionId: 'accounting_tax', countryCode: 'US', localLabel: 'CPA Firm', aliases: ['cpa', 'certified public accountant', 'tax preparer'], regulationLevel: 'high' },
    { overrideId: 'us_lender', functionId: 'alternative_lending', countryCode: 'US', localLabel: 'Private Lender', aliases: ['private lender', 'hard money lender'], regulationLevel: 'high' },
    { overrideId: 'us_credit_repair', functionId: 'credit_debt', countryCode: 'US', localLabel: 'Credit Repair Agency', aliases: ['credit repair', 'credit counseling', 'debt settlement'], regulationLevel: 'medium' },
    { overrideId: 'us_payment', functionId: 'payments_processing', countryCode: 'US', localLabel: 'Payment Processor', aliases: ['payment processor', 'merchant services', 'stripe', 'square'], regulationLevel: 'high' },

    // Education
    { overrideId: 'us_sat', functionId: 'test_preparation', countryCode: 'US', localLabel: 'SAT / ACT Prep', aliases: ['sat prep', 'act prep', 'college prep', 'test prep'], regulationLevel: 'low' },
    { overrideId: 'us_prof_dev', functionId: 'corporate_training', countryCode: 'US', localLabel: 'Professional Development', aliases: ['professional development', 'continuing education', 'ceu'], regulationLevel: 'low' },
    { overrideId: 'us_student_housing', functionId: 'shared_accommodation', countryCode: 'US', localLabel: 'Student Housing', aliases: ['student housing', 'dorm', 'off-campus housing'], regulationLevel: 'low' },

    // Home Services
    { overrideId: 'us_smart_home', functionId: 'home_automation', countryCode: 'US', localLabel: 'Smart Home Services', aliases: ['smart home', 'home automation', 'alexa', 'nest'], regulationLevel: 'low' },
    { overrideId: 'us_maid', functionId: 'cleaning_housekeeping', countryCode: 'US', localLabel: 'Maid Service', aliases: ['maid service', 'house cleaning', 'cleaning service'], regulationLevel: 'low' },

    // Healthcare
    { overrideId: 'us_urgent_care', functionId: 'primary_care', countryCode: 'US', localLabel: 'Urgent Care / Primary Care', aliases: ['urgent care', 'walk-in clinic', 'primary care'], regulationLevel: 'high' },

    // ==========================================
    // 🇦🇪 UAE OVERRIDES
    // ==========================================

    // Financial Services
    { overrideId: 'ae_finance_co', functionId: 'alternative_lending', countryCode: 'AE', localLabel: 'Finance Company', aliases: ['finance company', 'islamic finance'], regulationLevel: 'high' },
    { overrideId: 'ae_exchange', functionId: 'forex_remittance', countryCode: 'AE', localLabel: 'Exchange House', aliases: ['exchange house', 'money exchange', 'al ansari'], regulationLevel: 'high' },
    { overrideId: 'ae_insurance', functionId: 'insurance_brokerage', countryCode: 'AE', localLabel: 'Insurance Broker', aliases: ['insurance broker', 'takaful'], regulationLevel: 'high' },

    // Professional Services
    { overrideId: 'ae_property', functionId: 'real_estate', countryCode: 'AE', localLabel: 'Property Broker', aliases: ['property broker', 'real estate', 'rera registered'], regulationLevel: 'high' },
    { overrideId: 'ae_legal', functionId: 'legal_services', countryCode: 'AE', localLabel: 'Legal Consultancy', aliases: ['legal consultancy', 'law firm', 'advocate'], regulationLevel: 'high' },
    { overrideId: 'ae_pro_services', functionId: 'notary_compliance', countryCode: 'AE', localLabel: 'PRO Services', aliases: ['pro services', 'typing center', 'amer'], regulationLevel: 'medium' },

    // Hospitality
    { overrideId: 'ae_hotel_apt', functionId: 'serviced_apartments', countryCode: 'AE', localLabel: 'Hotel Apartments', aliases: ['hotel apartment', 'aparthotel'], regulationLevel: 'medium' },
    { overrideId: 'ae_resort', functionId: 'hotels_resorts', countryCode: 'AE', localLabel: 'Luxury Resort', aliases: ['luxury resort', '5 star', 'beach resort'], regulationLevel: 'medium' },

    // Food
    { overrideId: 'ae_shawarma', functionId: 'qsr', countryCode: 'AE', localLabel: 'Shawarma / QSR', aliases: ['shawarma', 'cafeteria', 'fast food'], regulationLevel: 'medium' },

    // ==========================================
    // 🇬🇧 UNITED KINGDOM OVERRIDES
    // ==========================================

    // Financial Services
    { overrideId: 'uk_chartered', functionId: 'accounting_tax', countryCode: 'UK', localLabel: 'Chartered Accountant', aliases: ['chartered accountant', 'aca', 'acca', 'cima'], regulationLevel: 'high' },
    { overrideId: 'uk_loan_broker', functionId: 'consumer_lending', countryCode: 'UK', localLabel: 'Loan Broker', aliases: ['loan broker', 'mortgage broker', 'finance broker'], regulationLevel: 'high' },
    { overrideId: 'uk_insurance', functionId: 'insurance_brokerage', countryCode: 'UK', localLabel: 'Insurance Adviser', aliases: ['insurance adviser', 'ifa', 'insurance broker'], regulationLevel: 'high' },

    // Education
    { overrideId: 'uk_gcse', functionId: 'test_preparation', countryCode: 'UK', localLabel: 'GCSE / A-Level Prep', aliases: ['gcse', 'a-level', 'sixth form', 'tuition'], regulationLevel: 'low' },
    { overrideId: 'uk_halls', functionId: 'shared_accommodation', countryCode: 'UK', localLabel: 'Student Halls', aliases: ['student halls', 'halls of residence', 'university accommodation'], regulationLevel: 'low' },
    { overrideId: 'uk_nursery', functionId: 'early_childhood', countryCode: 'UK', localLabel: 'Nursery / Childminder', aliases: ['nursery', 'childminder', 'creche', 'preschool'], regulationLevel: 'medium' },

    // Retail
    { overrideId: 'uk_offlicence', functionId: 'grocery_convenience', countryCode: 'UK', localLabel: 'Off-Licence / Convenience Store', aliases: ['off-licence', 'corner shop', 'newsagent', 'convenience store'], regulationLevel: 'low' },

    // Healthcare
    { overrideId: 'uk_chemist', functionId: 'pharmacy_retail', countryCode: 'UK', localLabel: 'Chemist / Pharmacy', aliases: ['chemist', 'boots', 'pharmacy'], regulationLevel: 'high' },
    { overrideId: 'uk_surgery', functionId: 'primary_care', countryCode: 'UK', localLabel: 'GP Surgery', aliases: ['gp surgery', 'doctor surgery', 'nhs'], regulationLevel: 'high' },

    // Home Services
    { overrideId: 'uk_estate_agent', functionId: 'real_estate', countryCode: 'UK', localLabel: 'Estate Agent', aliases: ['estate agent', 'lettings agent', 'property agent'], regulationLevel: 'medium' },
];

/**
 * Get overrides for a specific country
 */
export function getCountryOverrides(countryCode: CountryCode): CountryOverride[] {
    if (countryCode === 'GLOBAL') return [];
    return COUNTRY_OVERRIDES.filter(o => o.countryCode === countryCode);
}

/**
 * Get override for a specific function in a country
 */
export function getFunctionOverride(functionId: string, countryCode: CountryCode): CountryOverride | undefined {
    if (countryCode === 'GLOBAL') return undefined;
    return COUNTRY_OVERRIDES.find(o => o.functionId === functionId && o.countryCode === countryCode);
}
