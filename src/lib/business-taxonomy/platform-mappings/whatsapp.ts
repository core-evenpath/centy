/**
 * WhatsApp Business Platform Mapping
 *
 * Maps Centy business functions to WhatsApp Business categories.
 * WhatsApp uses a simpler category structure compared to Google.
 */

import type { PlatformConfig, PlatformCategory, PlatformMapping } from './types';

const WHATSAPP_CATEGORIES: PlatformCategory[] = [
    // Finance & Insurance
    { categoryId: 'FINANCE_INSURANCE', label: 'Finance & Insurance' },
    { categoryId: 'BANK_CREDIT_UNION', label: 'Bank/Credit Union', parentId: 'FINANCE_INSURANCE' },
    { categoryId: 'FINANCIAL_PLANNER', label: 'Financial Planner', parentId: 'FINANCE_INSURANCE' },
    { categoryId: 'INSURANCE_COMPANY', label: 'Insurance Company', parentId: 'FINANCE_INSURANCE' },

    // Food & Beverage
    { categoryId: 'FOOD_BEVERAGE', label: 'Food & Beverage' },
    { categoryId: 'RESTAURANT', label: 'Restaurant', parentId: 'FOOD_BEVERAGE' },
    { categoryId: 'CAFE', label: 'Cafe', parentId: 'FOOD_BEVERAGE' },
    { categoryId: 'BAKERY', label: 'Bakery', parentId: 'FOOD_BEVERAGE' },
    { categoryId: 'FOOD_DELIVERY', label: 'Food Delivery Service', parentId: 'FOOD_BEVERAGE' },

    // Health & Medical
    { categoryId: 'HEALTH_MEDICAL', label: 'Health & Medical' },
    { categoryId: 'DOCTOR', label: 'Doctor', parentId: 'HEALTH_MEDICAL' },
    { categoryId: 'DENTIST', label: 'Dentist', parentId: 'HEALTH_MEDICAL' },
    { categoryId: 'PHARMACY', label: 'Pharmacy', parentId: 'HEALTH_MEDICAL' },
    { categoryId: 'HOSPITAL', label: 'Hospital', parentId: 'HEALTH_MEDICAL' },

    // Professional Services
    { categoryId: 'PROFESSIONAL_SERVICES', label: 'Professional Services' },
    { categoryId: 'LAWYER', label: 'Lawyer', parentId: 'PROFESSIONAL_SERVICES' },
    { categoryId: 'ACCOUNTANT', label: 'Accountant', parentId: 'PROFESSIONAL_SERVICES' },
    { categoryId: 'CONSULTANT', label: 'Consultant', parentId: 'PROFESSIONAL_SERVICES' },
    { categoryId: 'REAL_ESTATE_AGENT', label: 'Real Estate Agent', parentId: 'PROFESSIONAL_SERVICES' },

    // Education
    { categoryId: 'EDUCATION', label: 'Education' },
    { categoryId: 'SCHOOL', label: 'School', parentId: 'EDUCATION' },
    { categoryId: 'TUTORING', label: 'Tutoring Service', parentId: 'EDUCATION' },
    { categoryId: 'TRAINING_CENTER', label: 'Training Center', parentId: 'EDUCATION' },

    // Beauty & Personal Care
    { categoryId: 'BEAUTY_PERSONAL_CARE', label: 'Beauty & Personal Care' },
    { categoryId: 'BEAUTY_SALON', label: 'Beauty Salon', parentId: 'BEAUTY_PERSONAL_CARE' },
    { categoryId: 'SPA', label: 'Spa', parentId: 'BEAUTY_PERSONAL_CARE' },
    { categoryId: 'BARBER', label: 'Barber Shop', parentId: 'BEAUTY_PERSONAL_CARE' },

    // Automotive
    { categoryId: 'AUTOMOTIVE', label: 'Automotive' },
    { categoryId: 'CAR_DEALER', label: 'Car Dealer', parentId: 'AUTOMOTIVE' },
    { categoryId: 'AUTO_REPAIR', label: 'Auto Repair', parentId: 'AUTOMOTIVE' },

    // Home Services
    { categoryId: 'HOME_SERVICES', label: 'Home Services' },
    { categoryId: 'PLUMBER', label: 'Plumber', parentId: 'HOME_SERVICES' },
    { categoryId: 'ELECTRICIAN', label: 'Electrician', parentId: 'HOME_SERVICES' },
    { categoryId: 'CLEANING_SERVICE', label: 'Cleaning Service', parentId: 'HOME_SERVICES' },

    // Shopping & Retail
    { categoryId: 'SHOPPING_RETAIL', label: 'Shopping & Retail' },
    { categoryId: 'CLOTHING_STORE', label: 'Clothing Store', parentId: 'SHOPPING_RETAIL' },
    { categoryId: 'GROCERY_STORE', label: 'Grocery Store', parentId: 'SHOPPING_RETAIL' },
    { categoryId: 'ELECTRONICS_STORE', label: 'Electronics Store', parentId: 'SHOPPING_RETAIL' },
];

const WHATSAPP_MAPPINGS: PlatformMapping[] = [
    // Financial Services
    { functionId: 'mutual_fund_distributor', platformId: 'whatsapp', primary: ['FINANCIAL_PLANNER'], confidence: 'close' },
    { functionId: 'insurance_agent', platformId: 'whatsapp', primary: ['INSURANCE_COMPANY'], confidence: 'close' },
    { functionId: 'investment_advisor', platformId: 'whatsapp', primary: ['FINANCIAL_PLANNER'], confidence: 'exact' },
    { functionId: 'ca_firm', platformId: 'whatsapp', primary: ['ACCOUNTANT'], confidence: 'exact' },
    { functionId: 'tax_consultant', platformId: 'whatsapp', primary: ['ACCOUNTANT'], confidence: 'close' },
    { functionId: 'microfinance', platformId: 'whatsapp', primary: ['FINANCE_INSURANCE'], secondary: ['BANK_CREDIT_UNION'], confidence: 'approximate' },
    { functionId: 'wealth_manager', platformId: 'whatsapp', primary: ['FINANCIAL_PLANNER'], confidence: 'exact' },
    { functionId: 'stock_broker', platformId: 'whatsapp', primary: ['FINANCIAL_PLANNER'], confidence: 'close' },
    { functionId: 'loan_agent', platformId: 'whatsapp', primary: ['FINANCE_INSURANCE'], confidence: 'close' },
    { functionId: 'financial_planner', platformId: 'whatsapp', primary: ['FINANCIAL_PLANNER'], confidence: 'exact' },
    { functionId: 'nbfc', platformId: 'whatsapp', primary: ['FINANCE_INSURANCE'], secondary: ['BANK_CREDIT_UNION'], confidence: 'approximate' },

    // Food & Beverage
    { functionId: 'restaurant_casual', platformId: 'whatsapp', primary: ['RESTAURANT'], confidence: 'exact' },
    { functionId: 'restaurant_fine', platformId: 'whatsapp', primary: ['RESTAURANT'], confidence: 'exact' },
    { functionId: 'cafe_coffee', platformId: 'whatsapp', primary: ['CAFE'], confidence: 'exact' },
    { functionId: 'cloud_kitchen', platformId: 'whatsapp', primary: ['FOOD_DELIVERY'], secondary: ['RESTAURANT'], confidence: 'close' },
    { functionId: 'bakery_confectionery', platformId: 'whatsapp', primary: ['BAKERY'], confidence: 'exact' },
    { functionId: 'catering', platformId: 'whatsapp', primary: ['FOOD_BEVERAGE'], confidence: 'approximate' },

    // Healthcare
    { functionId: 'primary_care', platformId: 'whatsapp', primary: ['DOCTOR'], confidence: 'exact' },
    { functionId: 'hospitals', platformId: 'whatsapp', primary: ['HOSPITAL'], confidence: 'exact' },
    { functionId: 'dental_care', platformId: 'whatsapp', primary: ['DENTIST'], confidence: 'exact' },
    { functionId: 'pharmacy_retail', platformId: 'whatsapp', primary: ['PHARMACY'], confidence: 'exact' },

    // Professional Services
    { functionId: 'legal_services', platformId: 'whatsapp', primary: ['LAWYER'], confidence: 'exact' },
    { functionId: 'real_estate', platformId: 'whatsapp', primary: ['REAL_ESTATE_AGENT'], confidence: 'exact' },
    { functionId: 'consulting_advisory', platformId: 'whatsapp', primary: ['CONSULTANT'], confidence: 'exact' },

    // Education
    { functionId: 'schools_k12', platformId: 'whatsapp', primary: ['SCHOOL'], confidence: 'exact' },
    { functionId: 'coaching_tutoring', platformId: 'whatsapp', primary: ['TUTORING'], confidence: 'exact' },
    { functionId: 'training_vocational', platformId: 'whatsapp', primary: ['TRAINING_CENTER'], confidence: 'exact' },
    { functionId: 'study_abroad', platformId: 'whatsapp', primary: ['EDUCATION'], secondary: ['CONSULTANT'], confidence: 'close' },

    // Beauty & Wellness
    { functionId: 'salon_unisex', platformId: 'whatsapp', primary: ['BEAUTY_SALON'], confidence: 'exact' },
    { functionId: 'spa_wellness', platformId: 'whatsapp', primary: ['SPA'], confidence: 'exact' },
    { functionId: 'barbershop', platformId: 'whatsapp', primary: ['BARBER'], confidence: 'exact' },

    // Automotive
    { functionId: 'car_dealership', platformId: 'whatsapp', primary: ['CAR_DEALER'], confidence: 'exact' },
    { functionId: 'auto_service', platformId: 'whatsapp', primary: ['AUTO_REPAIR'], confidence: 'exact' },

    // Home Services
    { functionId: 'plumbing', platformId: 'whatsapp', primary: ['PLUMBER'], confidence: 'exact' },
    { functionId: 'electrical', platformId: 'whatsapp', primary: ['ELECTRICIAN'], confidence: 'exact' },
    { functionId: 'cleaning', platformId: 'whatsapp', primary: ['CLEANING_SERVICE'], confidence: 'exact' },

    // Retail
    { functionId: 'fashion_apparel', platformId: 'whatsapp', primary: ['CLOTHING_STORE'], confidence: 'exact' },
    { functionId: 'grocery_supermarket', platformId: 'whatsapp', primary: ['GROCERY_STORE'], confidence: 'exact' },
    { functionId: 'electronics_appliances', platformId: 'whatsapp', primary: ['ELECTRONICS_STORE'], confidence: 'exact' },
];

// Industry-level fallbacks when no direct function mapping exists
const INDUSTRY_FALLBACKS: Record<string, string[]> = {
    'financial_services': ['FINANCE_INSURANCE'],
    'education_learning': ['EDUCATION'],
    'healthcare_medical': ['HEALTH_MEDICAL'],
    'business_professional': ['PROFESSIONAL_SERVICES'],
    'retail_commerce': ['SHOPPING_RETAIL'],
    'food_beverage': ['FOOD_BEVERAGE'],
    'food_supply': ['GROCERY_STORE'],
    'personal_wellness': ['BEAUTY_PERSONAL_CARE'],
    'automotive_mobility': ['AUTOMOTIVE'],
    'travel_transport': ['PROFESSIONAL_SERVICES'],
    'hospitality': ['PROFESSIONAL_SERVICES'],
    'events_entertainment': ['PROFESSIONAL_SERVICES'],
    'home_property': ['HOME_SERVICES'],
    'public_nonprofit': ['PROFESSIONAL_SERVICES'],
};

export const WHATSAPP_CONFIG: PlatformConfig = {
    platformId: 'whatsapp',
    name: 'WhatsApp Business',
    version: '2024.1',
    lastUpdated: '2024-01-15',
    categories: WHATSAPP_CATEGORIES,
    mappings: WHATSAPP_MAPPINGS,
    fallbackStrategy: 'industry',
};

/**
 * Get a WhatsApp category by ID
 */
export function getWhatsAppCategory(categoryId: string): PlatformCategory | undefined {
    return WHATSAPP_CATEGORIES.find(c => c.categoryId === categoryId);
}

/**
 * Get industry-level fallback categories for WhatsApp
 */
export function getWhatsAppIndustryFallback(industryId: string): string[] {
    return INDUSTRY_FALLBACKS[industryId] || ['PROFESSIONAL_SERVICES'];
}

export default WHATSAPP_CONFIG;
