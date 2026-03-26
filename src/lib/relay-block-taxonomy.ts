import { BUSINESS_FUNCTIONS } from './business-taxonomy/industries';

export interface TaxonomyBlockMapping {
    functionId: string;
    primaryBlocks: string[];
    secondaryBlocks: string[];
    excludedBlocks: string[];
}

const FALLBACK_MAPPING: TaxonomyBlockMapping = {
    functionId: 'unknown',
    primaryBlocks: ['services', 'contact', 'greeting', 'quick_actions'],
    secondaryBlocks: ['testimonials', 'info', 'location', 'lead_capture'],
    excludedBlocks: [],
};

const TAXONOMY_BLOCK_MAPPINGS: TaxonomyBlockMapping[] = [
    // ========================================================================
    // FINANCIAL SERVICES (13)
    // ========================================================================
    { functionId: 'retail_banking', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'info', 'quick_actions'], secondaryBlocks: ['testimonials', 'lead_capture', 'location'], excludedBlocks: ['catalog', 'menu', 'gallery', 'book', 'rooms'] },
    { functionId: 'alternative_lending', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'info'], secondaryBlocks: ['testimonials', 'lead_capture', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'gallery', 'book', 'rooms', 'schedule'] },
    { functionId: 'consumer_lending', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'info'], secondaryBlocks: ['testimonials', 'lead_capture', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'gallery', 'book', 'rooms', 'schedule'] },
    { functionId: 'commercial_lending', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'gallery', 'book', 'rooms', 'schedule'] },
    { functionId: 'payments_processing', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'info', 'quick_actions'], secondaryBlocks: ['testimonials', 'lead_capture'], excludedBlocks: ['catalog', 'menu', 'gallery', 'book', 'rooms', 'schedule'] },
    { functionId: 'wealth_management', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'gallery', 'book', 'rooms', 'schedule'] },
    { functionId: 'insurance_brokerage', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'info'], secondaryBlocks: ['testimonials', 'lead_capture', 'compare', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'gallery', 'book', 'rooms', 'schedule'] },
    { functionId: 'accounting_tax', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'info', 'schedule'], secondaryBlocks: ['testimonials', 'lead_capture', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'gallery', 'book', 'rooms'] },
    { functionId: 'investment_trading', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'info'], secondaryBlocks: ['testimonials', 'lead_capture', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'gallery', 'book', 'rooms', 'schedule'] },
    { functionId: 'forex_remittance', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'info'], secondaryBlocks: ['testimonials', 'location', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'gallery', 'book', 'rooms', 'schedule'] },
    { functionId: 'credit_debt', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'gallery', 'book', 'rooms', 'schedule'] },
    { functionId: 'fintech', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'quick_actions'], secondaryBlocks: ['testimonials', 'info', 'lead_capture'], excludedBlocks: ['catalog', 'menu', 'gallery', 'book', 'rooms', 'schedule'] },
    { functionId: 'community_savings', primaryBlocks: ['services', 'info', 'contact', 'greeting', 'location'], secondaryBlocks: ['testimonials', 'lead_capture', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'gallery', 'book', 'rooms', 'pricing'] },

    // ========================================================================
    // EDUCATION & LEARNING (10)
    // ========================================================================
    { functionId: 'early_childhood', primaryBlocks: ['services', 'schedule', 'contact', 'greeting', 'gallery'], secondaryBlocks: ['testimonials', 'pricing', 'info', 'location'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'compare'] },
    { functionId: 'k12_education', primaryBlocks: ['services', 'schedule', 'contact', 'greeting', 'info'], secondaryBlocks: ['testimonials', 'gallery', 'location', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'pricing'] },
    { functionId: 'higher_education', primaryBlocks: ['services', 'contact', 'greeting', 'info', 'quick_actions'], secondaryBlocks: ['testimonials', 'gallery', 'location', 'lead_capture'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'pricing', 'schedule'] },
    { functionId: 'test_preparation', primaryBlocks: ['services', 'schedule', 'pricing', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'info', 'lead_capture', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery'] },
    { functionId: 'language_learning', primaryBlocks: ['classes', 'schedule', 'pricing', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'info', 'lead_capture'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery'] },
    { functionId: 'skill_vocational', primaryBlocks: ['services', 'schedule', 'pricing', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'info', 'lead_capture', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery'] },
    { functionId: 'corporate_training', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'schedule', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery'] },
    { functionId: 'online_learning', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'quick_actions'], secondaryBlocks: ['testimonials', 'info', 'lead_capture'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'schedule', 'location'] },
    { functionId: 'academic_counseling', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'schedule', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery'] },
    { functionId: 'creative_arts', primaryBlocks: ['classes', 'activities', 'schedule', 'pricing', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'gallery', 'info'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'compare'] },

    // ========================================================================
    // HEALTHCARE & MEDICAL (11)
    // ========================================================================
    { functionId: 'primary_care', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'location', 'schedule'], excludedBlocks: ['catalog', 'menu', 'rooms', 'gallery', 'promo', 'compare'] },
    { functionId: 'hospitals', primaryBlocks: ['services', 'contact', 'greeting', 'info', 'location'], secondaryBlocks: ['testimonials', 'lead_capture', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'gallery', 'promo', 'pricing', 'book'] },
    { functionId: 'diagnostic_imaging', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['info', 'location', 'schedule'], excludedBlocks: ['catalog', 'menu', 'rooms', 'gallery', 'promo', 'compare'] },
    { functionId: 'pharmacy_retail', primaryBlocks: ['products', 'catalog', 'contact', 'greeting', 'location'], secondaryBlocks: ['info', 'promo', 'quick_actions'], excludedBlocks: ['rooms', 'book', 'schedule', 'lead_capture', 'compare'] },
    { functionId: 'dental_care', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture', 'appointment'], secondaryBlocks: ['testimonials', 'info', 'location', 'gallery'], excludedBlocks: ['catalog', 'menu', 'rooms', 'promo', 'compare'] },
    { functionId: 'vision_care', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'appointment'], secondaryBlocks: ['testimonials', 'info', 'location', 'lead_capture'], excludedBlocks: ['catalog', 'menu', 'rooms', 'gallery', 'promo', 'compare'] },
    { functionId: 'mental_health', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'schedule'], excludedBlocks: ['catalog', 'menu', 'rooms', 'gallery', 'promo', 'compare', 'location'] },
    { functionId: 'physical_therapy', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'schedule'], secondaryBlocks: ['testimonials', 'info', 'location', 'lead_capture'], excludedBlocks: ['catalog', 'menu', 'rooms', 'gallery', 'promo', 'compare'] },
    { functionId: 'alternative_medicine', primaryBlocks: ['treatments', 'pricing', 'contact', 'greeting', 'schedule'], secondaryBlocks: ['testimonials', 'info', 'location', 'lead_capture'], excludedBlocks: ['catalog', 'menu', 'rooms', 'gallery', 'compare'] },
    { functionId: 'home_healthcare', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'gallery', 'promo', 'location', 'schedule'] },
    { functionId: 'veterinary', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'appointment'], secondaryBlocks: ['testimonials', 'info', 'location', 'gallery'], excludedBlocks: ['catalog', 'menu', 'rooms', 'promo', 'compare'] },

    // ========================================================================
    // BUSINESS & PROFESSIONAL SERVICES (11)
    // ========================================================================
    { functionId: 'real_estate', primaryBlocks: ['listings', 'gallery', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['compare', 'testimonials', 'info', 'location', 'quick_actions'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'pricing'] },
    { functionId: 'construction_dev', primaryBlocks: ['services', 'gallery', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'location', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'schedule', 'pricing'] },
    { functionId: 'legal_services', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'schedule', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery'] },
    { functionId: 'architecture_design', primaryBlocks: ['services', 'gallery', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'pricing', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'schedule'] },
    { functionId: 'hr_recruitment', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'schedule'] },
    { functionId: 'marketing_advertising', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'gallery', 'info', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'schedule'] },
    { functionId: 'software_it', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'quick_actions'], secondaryBlocks: ['testimonials', 'info', 'lead_capture'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'schedule', 'location'] },
    { functionId: 'consulting_advisory', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'schedule', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery'] },
    { functionId: 'pr_communications', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'schedule'] },
    { functionId: 'translation_docs', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'schedule'] },
    { functionId: 'notary_compliance', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'info'], secondaryBlocks: ['testimonials', 'location', 'schedule', 'lead_capture'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery'] },

    // ========================================================================
    // RETAIL & COMMERCE (13)
    // ========================================================================
    { functionId: 'physical_retail', primaryBlocks: ['catalog', 'products', 'contact', 'greeting', 'promo'], secondaryBlocks: ['compare', 'testimonials', 'location', 'quick_actions'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'lead_capture'] },
    { functionId: 'ecommerce_d2c', primaryBlocks: ['catalog', 'products', 'compare', 'contact', 'greeting', 'promo'], secondaryBlocks: ['testimonials', 'gallery', 'quick_actions'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'location'] },
    { functionId: 'fashion_apparel', primaryBlocks: ['catalog', 'products', 'gallery', 'contact', 'greeting', 'promo'], secondaryBlocks: ['compare', 'testimonials', 'quick_actions'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'lead_capture'] },
    { functionId: 'electronics_gadgets', primaryBlocks: ['catalog', 'products', 'compare', 'contact', 'greeting', 'promo'], secondaryBlocks: ['testimonials', 'info', 'quick_actions'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'gallery'] },
    { functionId: 'jewelry_luxury', primaryBlocks: ['catalog', 'products', 'gallery', 'contact', 'greeting'], secondaryBlocks: ['compare', 'testimonials', 'promo', 'location'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'lead_capture'] },
    { functionId: 'furniture_home', primaryBlocks: ['catalog', 'products', 'gallery', 'contact', 'greeting', 'promo'], secondaryBlocks: ['compare', 'testimonials', 'location'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'lead_capture'] },
    { functionId: 'grocery_convenience', primaryBlocks: ['catalog', 'products', 'contact', 'greeting', 'promo', 'location'], secondaryBlocks: ['info', 'quick_actions'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'lead_capture', 'compare'] },
    { functionId: 'health_wellness_retail', primaryBlocks: ['catalog', 'products', 'contact', 'greeting', 'promo'], secondaryBlocks: ['testimonials', 'info', 'quick_actions'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'lead_capture'] },
    { functionId: 'books_stationery', primaryBlocks: ['catalog', 'products', 'contact', 'greeting', 'promo'], secondaryBlocks: ['testimonials', 'info', 'location'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'lead_capture', 'compare'] },
    { functionId: 'sports_outdoor', primaryBlocks: ['catalog', 'products', 'contact', 'greeting', 'promo'], secondaryBlocks: ['compare', 'testimonials', 'gallery', 'quick_actions'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'lead_capture'] },
    { functionId: 'baby_kids', primaryBlocks: ['catalog', 'products', 'contact', 'greeting', 'promo'], secondaryBlocks: ['testimonials', 'info', 'quick_actions'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'lead_capture', 'compare'] },
    { functionId: 'pet_supplies', primaryBlocks: ['catalog', 'products', 'contact', 'greeting', 'promo'], secondaryBlocks: ['testimonials', 'info', 'quick_actions'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'lead_capture'] },
    { functionId: 'wholesale_distribution', primaryBlocks: ['catalog', 'products', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['pricing', 'info', 'quick_actions'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'gallery', 'promo'] },

    // ========================================================================
    // FOOD & BEVERAGE (9)
    // ========================================================================
    { functionId: 'full_service_restaurant', primaryBlocks: ['menu', 'gallery', 'location', 'contact', 'greeting'], secondaryBlocks: ['promo', 'testimonials', 'book'], excludedBlocks: ['catalog', 'pricing', 'schedule', 'lead_capture', 'compare', 'rooms'] },
    { functionId: 'casual_dining', primaryBlocks: ['menu', 'gallery', 'location', 'contact', 'greeting'], secondaryBlocks: ['promo', 'testimonials', 'book'], excludedBlocks: ['catalog', 'pricing', 'schedule', 'lead_capture', 'compare', 'rooms'] },
    { functionId: 'qsr', primaryBlocks: ['menu', 'location', 'contact', 'greeting', 'promo'], secondaryBlocks: ['gallery', 'testimonials', 'quick_actions'], excludedBlocks: ['catalog', 'pricing', 'schedule', 'lead_capture', 'compare', 'rooms', 'book'] },
    { functionId: 'beverage_cafe', primaryBlocks: ['menu', 'gallery', 'location', 'contact', 'greeting'], secondaryBlocks: ['promo', 'testimonials', 'info'], excludedBlocks: ['catalog', 'pricing', 'schedule', 'lead_capture', 'compare', 'rooms', 'book'] },
    { functionId: 'bakery_desserts', primaryBlocks: ['menu', 'gallery', 'photos', 'location', 'contact', 'greeting'], secondaryBlocks: ['promo', 'testimonials'], excludedBlocks: ['catalog', 'pricing', 'schedule', 'lead_capture', 'compare', 'rooms', 'book'] },
    { functionId: 'cloud_kitchen', primaryBlocks: ['menu', 'contact', 'greeting', 'promo'], secondaryBlocks: ['gallery', 'testimonials', 'quick_actions'], excludedBlocks: ['catalog', 'pricing', 'schedule', 'lead_capture', 'compare', 'rooms', 'book', 'location'] },
    { functionId: 'catering_events', primaryBlocks: ['menu', 'gallery', 'contact', 'greeting', 'book'], secondaryBlocks: ['pricing', 'testimonials', 'lead_capture', 'promo'], excludedBlocks: ['catalog', 'schedule', 'compare', 'rooms'] },
    { functionId: 'bars_pubs', primaryBlocks: ['menu', 'gallery', 'location', 'contact', 'greeting', 'promo'], secondaryBlocks: ['testimonials', 'info', 'schedule'], excludedBlocks: ['catalog', 'pricing', 'lead_capture', 'compare', 'rooms', 'book'] },
    { functionId: 'street_food', primaryBlocks: ['menu', 'location', 'contact', 'greeting'], secondaryBlocks: ['gallery', 'testimonials', 'promo'], excludedBlocks: ['catalog', 'pricing', 'schedule', 'lead_capture', 'compare', 'rooms', 'book'] },

    // ========================================================================
    // FOOD SUPPLY & DISTRIBUTION (8)
    // ========================================================================
    { functionId: 'grocery_delivery', primaryBlocks: ['catalog', 'products', 'contact', 'greeting', 'promo'], secondaryBlocks: ['info', 'quick_actions', 'location'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'lead_capture', 'compare'] },
    { functionId: 'fresh_produce', primaryBlocks: ['catalog', 'products', 'contact', 'greeting', 'promo'], secondaryBlocks: ['info', 'location', 'quick_actions'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'lead_capture', 'compare'] },
    { functionId: 'meat_fish', primaryBlocks: ['catalog', 'products', 'contact', 'greeting', 'location'], secondaryBlocks: ['info', 'promo', 'quick_actions'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'lead_capture', 'compare'] },
    { functionId: 'dairy_beverage', primaryBlocks: ['catalog', 'products', 'contact', 'greeting', 'promo'], secondaryBlocks: ['info', 'quick_actions', 'location'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'lead_capture', 'compare'] },
    { functionId: 'packaged_specialty', primaryBlocks: ['catalog', 'products', 'contact', 'greeting', 'promo'], secondaryBlocks: ['info', 'gallery', 'quick_actions'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'lead_capture', 'compare'] },
    { functionId: 'organic_health_foods', primaryBlocks: ['catalog', 'products', 'contact', 'greeting', 'info'], secondaryBlocks: ['promo', 'testimonials', 'quick_actions'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'lead_capture', 'compare'] },
    { functionId: 'farm_agricultural', primaryBlocks: ['catalog', 'products', 'contact', 'greeting', 'info'], secondaryBlocks: ['gallery', 'location', 'quick_actions'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'lead_capture', 'compare', 'pricing'] },
    { functionId: 'food_wholesale', primaryBlocks: ['catalog', 'products', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['pricing', 'info', 'quick_actions'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'gallery', 'promo'] },

    // ========================================================================
    // PERSONAL CARE & WELLNESS (9)
    // ========================================================================
    { functionId: 'hair_beauty', primaryBlocks: ['services', 'pricing', 'schedule', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'gallery', 'promo', 'book'], excludedBlocks: ['catalog', 'menu', 'rooms', 'compare', 'lead_capture'] },
    { functionId: 'skin_aesthetic', primaryBlocks: ['treatments', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'gallery', 'schedule', 'info'], excludedBlocks: ['catalog', 'menu', 'rooms', 'compare'] },
    { functionId: 'spa_wellness', primaryBlocks: ['treatments', 'pricing', 'schedule', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'gallery', 'promo', 'book'], excludedBlocks: ['catalog', 'menu', 'rooms', 'compare'] },
    { functionId: 'fitness_gym', primaryBlocks: ['classes', 'schedule', 'pricing', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'promo', 'gallery', 'lead_capture'], excludedBlocks: ['catalog', 'menu', 'rooms', 'compare'] },
    { functionId: 'yoga_mindfulness', primaryBlocks: ['classes', 'schedule', 'pricing', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'gallery', 'info', 'promo'], excludedBlocks: ['catalog', 'menu', 'rooms', 'compare', 'lead_capture'] },
    { functionId: 'personal_training', primaryBlocks: ['services', 'pricing', 'schedule', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'lead_capture', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'compare', 'gallery'] },
    { functionId: 'cosmetic_surgery', primaryBlocks: ['treatments', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'gallery', 'info', 'schedule'], excludedBlocks: ['catalog', 'menu', 'rooms', 'compare', 'promo'] },
    { functionId: 'body_art', primaryBlocks: ['services', 'gallery', 'pricing', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'schedule', 'info'], excludedBlocks: ['catalog', 'menu', 'rooms', 'compare', 'lead_capture', 'promo'] },
    { functionId: 'wellness_retreat', primaryBlocks: ['treatments', 'gallery', 'pricing', 'contact', 'greeting', 'book'], secondaryBlocks: ['testimonials', 'activities', 'location', 'info'], excludedBlocks: ['catalog', 'menu', 'compare', 'lead_capture'] },

    // ========================================================================
    // AUTOMOTIVE & MOBILITY (12)
    // ========================================================================
    { functionId: 'vehicle_sales_new', primaryBlocks: ['catalog', 'products', 'compare', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'gallery', 'promo', 'lead_capture', 'location'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule'] },
    { functionId: 'vehicle_sales_used', primaryBlocks: ['catalog', 'products', 'compare', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'gallery', 'promo', 'lead_capture', 'location'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule'] },
    { functionId: 'motorcycle_sales', primaryBlocks: ['catalog', 'products', 'compare', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'gallery', 'promo', 'lead_capture'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule'] },
    { functionId: 'vehicle_maintenance', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'location'], secondaryBlocks: ['testimonials', 'promo', 'schedule', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'compare'] },
    { functionId: 'car_wash', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'location'], secondaryBlocks: ['testimonials', 'promo', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'compare', 'gallery'] },
    { functionId: 'auto_parts', primaryBlocks: ['catalog', 'products', 'contact', 'greeting', 'promo'], secondaryBlocks: ['info', 'location', 'quick_actions'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'lead_capture'] },
    { functionId: 'tires_batteries', primaryBlocks: ['catalog', 'products', 'pricing', 'contact', 'greeting'], secondaryBlocks: ['promo', 'location', 'quick_actions'], excludedBlocks: ['menu', 'rooms', 'book', 'schedule', 'lead_capture', 'gallery'] },
    { functionId: 'vehicle_rental', primaryBlocks: ['catalog', 'products', 'book', 'contact', 'greeting'], secondaryBlocks: ['compare', 'pricing', 'testimonials', 'location'], excludedBlocks: ['menu', 'rooms', 'schedule', 'lead_capture'] },
    { functionId: 'driving_education', primaryBlocks: ['services', 'pricing', 'schedule', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'info', 'lead_capture', 'location'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery'] },
    { functionId: 'auto_insurance', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['compare', 'testimonials', 'info', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'schedule'] },
    { functionId: 'ev_infrastructure', primaryBlocks: ['services', 'info', 'contact', 'greeting', 'location'], secondaryBlocks: ['pricing', 'lead_capture', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'schedule'] },
    { functionId: 'fleet_services', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['info', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'schedule', 'promo'] },

    // ========================================================================
    // TRAVEL, TRANSPORT & LOGISTICS (9)
    // ========================================================================
    { functionId: 'travel_agency', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['gallery', 'testimonials', 'promo', 'location'], excludedBlocks: ['catalog', 'menu', 'rooms', 'schedule'] },
    { functionId: 'visa_immigration', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'schedule'] },
    { functionId: 'ticketing_booking', primaryBlocks: ['services', 'book', 'contact', 'greeting', 'quick_actions'], secondaryBlocks: ['pricing', 'info', 'promo'], excludedBlocks: ['catalog', 'menu', 'rooms', 'gallery', 'lead_capture'] },
    { functionId: 'taxi_ride', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'quick_actions'], secondaryBlocks: ['testimonials', 'info', 'location'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'schedule'] },
    { functionId: 'public_transport', primaryBlocks: ['services', 'info', 'contact', 'greeting', 'location'], secondaryBlocks: ['schedule', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'pricing'] },
    { functionId: 'logistics_courier', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'quick_actions'], secondaryBlocks: ['info', 'lead_capture', 'testimonials'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'schedule'] },
    { functionId: 'moving_relocation', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'schedule'] },
    { functionId: 'airport_transfer', primaryBlocks: ['services', 'pricing', 'book', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'info', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'gallery', 'schedule', 'lead_capture'] },
    { functionId: 'luxury_adventure', primaryBlocks: ['services', 'gallery', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'promo', 'location', 'book'], excludedBlocks: ['catalog', 'menu', 'rooms', 'schedule'] },

    // ========================================================================
    // HOSPITALITY & ACCOMMODATION (10)
    // ========================================================================
    { functionId: 'hotels_resorts', primaryBlocks: ['rooms', 'book', 'gallery', 'location', 'contact', 'greeting'], secondaryBlocks: ['compare', 'promo', 'testimonials', 'info', 'activities'], excludedBlocks: ['pricing', 'lead_capture', 'menu', 'schedule'] },
    { functionId: 'budget_accommodation', primaryBlocks: ['rooms', 'book', 'location', 'contact', 'greeting'], secondaryBlocks: ['gallery', 'testimonials', 'info', 'promo'], excludedBlocks: ['pricing', 'lead_capture', 'menu', 'compare', 'schedule'] },
    { functionId: 'boutique_bnb', primaryBlocks: ['rooms', 'book', 'gallery', 'location', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'info', 'promo', 'activities'], excludedBlocks: ['pricing', 'lead_capture', 'menu', 'compare', 'schedule'] },
    { functionId: 'serviced_apartments', primaryBlocks: ['rooms', 'book', 'gallery', 'contact', 'greeting'], secondaryBlocks: ['compare', 'location', 'testimonials', 'info'], excludedBlocks: ['pricing', 'lead_capture', 'menu', 'schedule'] },
    { functionId: 'shared_accommodation', primaryBlocks: ['rooms', 'book', 'location', 'contact', 'greeting'], secondaryBlocks: ['gallery', 'testimonials', 'info', 'promo'], excludedBlocks: ['pricing', 'lead_capture', 'menu', 'compare', 'schedule'] },
    { functionId: 'vacation_rentals', primaryBlocks: ['listings', 'gallery', 'book', 'location', 'contact', 'greeting'], secondaryBlocks: ['compare', 'testimonials', 'info', 'activities'], excludedBlocks: ['pricing', 'lead_capture', 'menu', 'schedule'] },
    { functionId: 'guest_houses', primaryBlocks: ['rooms', 'book', 'location', 'contact', 'greeting'], secondaryBlocks: ['gallery', 'testimonials', 'info'], excludedBlocks: ['pricing', 'lead_capture', 'menu', 'compare', 'schedule'] },
    { functionId: 'camping_glamping', primaryBlocks: ['listings', 'gallery', 'activities', 'location', 'contact', 'greeting'], secondaryBlocks: ['book', 'testimonials', 'info', 'promo'], excludedBlocks: ['pricing', 'lead_capture', 'menu', 'compare', 'rooms'] },
    { functionId: 'corporate_housing', primaryBlocks: ['rooms', 'book', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['compare', 'location', 'info', 'gallery'], excludedBlocks: ['pricing', 'menu', 'schedule', 'promo'] },
    { functionId: 'event_venues', primaryBlocks: ['gallery', 'schedule', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['pricing', 'testimonials', 'info', 'location'], excludedBlocks: ['rooms', 'book', 'menu', 'catalog', 'compare'] },

    // ========================================================================
    // EVENTS, MEDIA & ENTERTAINMENT (10)
    // ========================================================================
    { functionId: 'event_planning', primaryBlocks: ['services', 'gallery', 'pricing', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'lead_capture', 'info', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'schedule'] },
    { functionId: 'wedding_private', primaryBlocks: ['services', 'gallery', 'contact', 'greeting', 'book'], secondaryBlocks: ['testimonials', 'pricing', 'lead_capture', 'promo'], excludedBlocks: ['catalog', 'menu', 'rooms', 'schedule', 'compare'] },
    { functionId: 'corporate_events', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'gallery', 'info', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'schedule'] },
    { functionId: 'photography_video', primaryBlocks: ['gallery', 'photos', 'services', 'pricing', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'lead_capture', 'promo'], excludedBlocks: ['catalog', 'menu', 'rooms', 'schedule', 'compare'] },
    { functionId: 'decor_floral', primaryBlocks: ['services', 'gallery', 'pricing', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'promo', 'lead_capture'], excludedBlocks: ['catalog', 'menu', 'rooms', 'schedule', 'compare'] },
    { functionId: 'live_entertainment', primaryBlocks: ['services', 'gallery', 'pricing', 'contact', 'greeting'], secondaryBlocks: ['testimonials', 'schedule', 'promo', 'lead_capture'], excludedBlocks: ['catalog', 'menu', 'rooms', 'compare'] },
    { functionId: 'av_production', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'gallery', 'info'], excludedBlocks: ['catalog', 'menu', 'rooms', 'schedule', 'compare', 'promo'] },
    { functionId: 'printing_invitations', primaryBlocks: ['services', 'catalog', 'pricing', 'contact', 'greeting'], secondaryBlocks: ['gallery', 'testimonials', 'promo'], excludedBlocks: ['menu', 'rooms', 'schedule', 'compare', 'lead_capture'] },
    { functionId: 'hosts_anchors', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'gallery', 'info'], excludedBlocks: ['catalog', 'menu', 'rooms', 'schedule', 'compare', 'promo'] },
    { functionId: 'cinemas_theaters', primaryBlocks: ['services', 'schedule', 'gallery', 'contact', 'greeting', 'book'], secondaryBlocks: ['promo', 'info', 'location'], excludedBlocks: ['catalog', 'menu', 'rooms', 'compare', 'lead_capture', 'pricing'] },

    // ========================================================================
    // HOME & PROPERTY SERVICES (11)
    // ========================================================================
    { functionId: 'plumbing_electrical', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'location', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'schedule'] },
    { functionId: 'appliance_repair', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'schedule'] },
    { functionId: 'carpentry_furniture', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'gallery', 'info'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'schedule', 'compare'] },
    { functionId: 'painting_renovation', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'gallery', 'info', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'schedule', 'compare'] },
    { functionId: 'pest_control', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'promo', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'schedule'] },
    { functionId: 'cleaning_housekeeping', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'promo', 'quick_actions', 'schedule'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery'] },
    { functionId: 'laundry_drycleaning', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'location'], secondaryBlocks: ['promo', 'testimonials', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'schedule', 'lead_capture'] },
    { functionId: 'security_surveillance', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'schedule'] },
    { functionId: 'landscaping_gardening', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'gallery', 'promo', 'info'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'schedule'] },
    { functionId: 'solar_renewable', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture', 'info'], secondaryBlocks: ['testimonials', 'gallery', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'schedule'] },
    { functionId: 'home_automation', primaryBlocks: ['services', 'pricing', 'contact', 'greeting', 'lead_capture'], secondaryBlocks: ['testimonials', 'info', 'gallery', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'schedule'] },

    // ========================================================================
    // PUBLIC, NON-PROFIT & UTILITIES (6)
    // ========================================================================
    { functionId: 'government', primaryBlocks: ['services', 'info', 'contact', 'greeting', 'quick_actions'], secondaryBlocks: ['location', 'schedule'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'pricing', 'promo', 'lead_capture'] },
    { functionId: 'ngo_nonprofit', primaryBlocks: ['services', 'info', 'contact', 'greeting', 'location'], secondaryBlocks: ['gallery', 'testimonials', 'quick_actions', 'lead_capture'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'pricing', 'promo'] },
    { functionId: 'religious', primaryBlocks: ['services', 'info', 'contact', 'greeting', 'location', 'schedule'], secondaryBlocks: ['gallery', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'pricing', 'promo', 'lead_capture'] },
    { functionId: 'community_association', primaryBlocks: ['services', 'info', 'contact', 'greeting', 'location'], secondaryBlocks: ['gallery', 'schedule', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'pricing', 'promo', 'lead_capture'] },
    { functionId: 'utilities', primaryBlocks: ['services', 'info', 'contact', 'greeting', 'quick_actions'], secondaryBlocks: ['location', 'lead_capture'], excludedBlocks: ['catalog', 'menu', 'rooms', 'book', 'gallery', 'pricing', 'promo', 'schedule'] },
    { functionId: 'cultural_institutions', primaryBlocks: ['services', 'gallery', 'info', 'contact', 'greeting', 'schedule'], secondaryBlocks: ['location', 'testimonials', 'promo', 'quick_actions'], excludedBlocks: ['catalog', 'menu', 'rooms', 'pricing', 'lead_capture'] },
];

const MAPPING_LOOKUP = new Map<string, TaxonomyBlockMapping>(
    TAXONOMY_BLOCK_MAPPINGS.map(m => [m.functionId, m])
);

const FUNCTION_TO_INDUSTRY = new Map<string, string>(
    BUSINESS_FUNCTIONS.map(bf => [bf.functionId, bf.industryId])
);

export function getBlockMappingForFunction(functionId: string): TaxonomyBlockMapping {
    return MAPPING_LOOKUP.get(functionId) || FALLBACK_MAPPING;
}

export function getBlockMappingsForIndustry(industryId: string): TaxonomyBlockMapping[] {
    const functionIds = BUSINESS_FUNCTIONS
        .filter(bf => bf.industryId === industryId)
        .map(bf => bf.functionId);
    return functionIds
        .map(fid => MAPPING_LOOKUP.get(fid))
        .filter((m): m is TaxonomyBlockMapping => m !== undefined);
}

export function getAllPrimaryBlockTypes(functionId: string): string[] {
    const mapping = getBlockMappingForFunction(functionId);
    return mapping.primaryBlocks;
}