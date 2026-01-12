/**
 * Business Profile Schema Types
 * 
 * Category-specific expertise schemas for different business types.
 * Each category has its own schema defining required and optional fields.
 */

// ==========================================
// COMMON FIELD TYPES
// ==========================================

export type FieldType = 'string' | 'number' | 'boolean' | 'enum' | 'multi_select' | 'list' | 'object' | 'currency' | 'timestamp';

export interface FieldSchema {
    type: FieldType;
    required: boolean;
    options?: string[];
    item_schema?: Record<string, any>;
    properties?: Record<string, any>;
}

export interface LLMUsageContext {
    allowed_topics: string[];
    restricted_topics: string[];
    response_style?: {
        tone: string;
        verbosity: 'low' | 'medium' | 'high';
        upsell_allowed: boolean;
    };
    response_rules?: {
        never_invent_prices?: boolean;
        never_assume_availability?: boolean;
        always_reference_menu_data?: boolean;
    };
}

// ==========================================
// RESTAURANT & DINING SCHEMA
// ==========================================

export interface RestaurantCoreIdentity {
    business_function:
    | 'fine_dining_restaurant'
    | 'casual_dining_restaurant'
    | 'quick_service_restaurant'
    | 'cloud_kitchen'
    | 'cafe_coffee_shop'
    | 'bakery_confectionery'
    | 'dessert_parlor'
    | 'food_truck_street_food'
    | 'bar_pub_brewery'
    | 'catering_service';

    sub_category_tags: Array<
        | 'family_restaurant'
        | 'couple_friendly'
        | 'tourist_friendly'
        | 'local_favorite'
        | 'budget_friendly'
        | 'premium_experience'
        | 'fast_casual'
        | 'experience_driven'
        | 'artisanal'
        | 'chef_led'
        | 'heritage_brand'
    >;
}

export interface SignatureItem {
    name: string;
    category: string;
    is_best_seller: boolean;
    is_chef_special: boolean;
}

export interface CuisineProfile {
    primary_cuisines: string[];
    secondary_cuisines?: string[];
    signature_items?: SignatureItem[];
}

export interface ServiceModel {
    service_modes: Array<'dine_in' | 'takeaway' | 'delivery' | 'pickup' | 'preorder'>;
    ordering_methods?: Array<'table_service' | 'counter_service' | 'self_service' | 'qr_menu' | 'online_ordering'>;
    average_service_time_minutes?: number;
}

export interface MealCoverage {
    meal_times: Array<'breakfast' | 'brunch' | 'lunch' | 'snacks' | 'dinner' | 'late_night'>;
    menu_type?: 'a_la_carte' | 'fixed_menu' | 'tasting_menu' | 'buffet';
}

export interface DietaryAndCustomization {
    dietary_options?: Array<'vegetarian' | 'non_vegetarian' | 'vegan' | 'eggitarian' | 'gluten_free' | 'keto' | 'healthy_options'>;
    spice_levels_supported?: Array<'mild' | 'medium' | 'spicy' | 'extra_spicy'>;
    customization_supported?: boolean;
}

export interface ExperienceAndAmbiance {
    ambiance?: Array<'cozy' | 'casual' | 'romantic' | 'luxury' | 'modern' | 'rustic' | 'minimal' | 'vibrant' | 'family_friendly' | 'work_friendly'>;
    music_and_entertainment?: Array<'background_music' | 'live_music' | 'dj' | 'karaoke' | 'sports_screening' | 'none'>;
    seating_options?: Array<'indoor' | 'outdoor' | 'rooftop' | 'balcony' | 'private_room' | 'communal_seating'>;
}

export interface PricingAndPositioning {
    price_range?: 'budget' | 'mid_range' | 'premium' | 'luxury';
    average_cost_for_two?: number;
    currency?: string;
    value_proposition?: Array<'large_portions' | 'quality_ingredients' | 'authentic_flavors' | 'fast_service' | 'affordable_pricing' | 'premium_experience'>;
}

export interface SpecialFeatures {
    reservation_policy?: 'not_required' | 'recommended' | 'mandatory';
    group_and_event_support?: Array<'birthday_parties' | 'corporate_events' | 'private_events' | 'large_groups' | 'custom_menu_events'>;
    alcohol_service?: 'not_served' | 'beer_wine' | 'full_bar';
}

export interface DeliveryAndMarketplaces {
    delivery_supported?: boolean;
    delivery_partners?: string[];
    cloud_kitchen_brand?: boolean;
}

export interface CustomerRatings {
    average_rating?: number;
    review_count?: number;
    rating_platform?: string;
}

export interface TrustAndQuality {
    certifications?: string[];
    customer_ratings?: CustomerRatings;
    awards_and_mentions?: string[];
}

/**
 * Complete Restaurant & Dining Expertise Schema
 */
export interface RestaurantExpertiseSchema {
    core_identity: RestaurantCoreIdentity;
    cuisine_profile: CuisineProfile;
    service_model: ServiceModel;
    meal_coverage: MealCoverage;
    dietary_and_customization?: DietaryAndCustomization;
    experience_and_ambiance?: ExperienceAndAmbiance;
    pricing_and_positioning?: PricingAndPositioning;
    special_features?: SpecialFeatures;
    delivery_and_marketplaces?: DeliveryAndMarketplaces;
    trust_and_quality?: TrustAndQuality;
    llm_usage_context?: LLMUsageContext;
}

// ==========================================
// CATEGORY SCHEMA DEFINITION
// ==========================================

export interface CategorySchema {
    schema_version: string;
    category_id: string;
    category_label: string;
    expertise_schema: Record<string, any>; // The actual schema definition
}

// ==========================================
// SUPPORTED CATEGORY IDS
// ==========================================

export type CategoryId =
    | 'restaurant_dining'
    | 'retail_commerce'
    | 'healthcare_medical'
    | 'professional_services'
    | 'education_learning'
    | 'beauty_wellness'
    | 'home_services'
    | 'hospitality_travel'
    | 'automotive'
    | 'fitness_sports'
    | 'financial_services'
    | 'real_estate'
    | 'events_entertainment'
    | 'technology_digital';

// ==========================================
// GENERIC CATEGORY EXPERTISE DATA
// ==========================================

/**
 * Generic expertise data structure that can hold any category's data
 */
export interface CategoryExpertiseData {
    category_id: CategoryId;
    schema_version: string;
    data: Record<string, any>;
    last_updated?: string;
}
