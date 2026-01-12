/**
 * Module Schema Types
 * 
 * Inventory and operational data for Modules section (/partner/settings -> Modules)
 * Separated from core business expertise data.
 */

// ==========================================
// COMMON MODULE TYPES
// ==========================================

export type ModuleType =
    | 'inventory_menu'
    | 'appointments_booking'
    | 'services_catalog'
    | 'products_catalog'
    | 'courses_programs'
    | 'rooms_facilities';

export interface ModuleConfig {
    module_type: ModuleType;
    category_id: string;
    enabled: boolean;
    schema_version: string;
    last_updated?: string;
}

// ==========================================
// INVENTORY MENU MODULE (Restaurant/F&B)
// ==========================================

export interface MenuCategory {
    category_id: string;
    display_name: string;
    description?: string;
    display_order: number;
    meal_times?: Array<'breakfast' | 'brunch' | 'lunch' | 'snacks' | 'dinner' | 'late_night'>;
}

export interface PriceVariant {
    label: string;
    price: number;
}

export interface ItemPricing {
    base_price: number;
    discounted_price?: number;
    price_variants?: PriceVariant[];
}

export interface ItemDietary {
    vegetarian?: boolean;
    vegan?: boolean;
    eggitarian?: boolean;
    gluten_free?: boolean;
    contains_allergens?: Array<'nuts' | 'dairy' | 'gluten' | 'soy' | 'shellfish' | 'eggs'>;
}

export interface CustomizationChoice {
    label: string;
    additional_price: number;
}

export interface CustomizationOption {
    option_name: string;
    choices: CustomizationChoice[];
}

export interface ItemAvailability {
    is_available: boolean;
    available_meal_times?: Array<'breakfast' | 'brunch' | 'lunch' | 'snacks' | 'dinner' | 'late_night'>;
}

export interface HighlightFlags {
    is_best_seller?: boolean;
    is_chef_special?: boolean;
    is_new_item?: boolean;
    is_recommended?: boolean;
}

export interface OperationalMetadata {
    preparation_time_minutes?: number;
    calories?: number;
    alcoholic?: boolean;
}

export interface MenuItem {
    item_id: string;
    name: string;
    category_id: string;
    description?: string;
    pricing: ItemPricing;
    dietary?: ItemDietary;
    spice_level?: 'mild' | 'medium' | 'spicy' | 'extra_spicy';
    customization_options?: CustomizationOption[];
    availability: ItemAvailability;
    highlight_flags?: HighlightFlags;
    image_urls?: string[];
    operational_metadata?: OperationalMetadata;
}

export interface MenuRules {
    supports_dynamic_pricing?: boolean;
    supports_time_based_menu?: boolean;
    supports_out_of_stock?: boolean;
}

export interface MenuLLMContext {
    allowed_topics: string[];
    restricted_topics: string[];
    response_rules: {
        never_invent_prices: boolean;
        never_assume_availability: boolean;
        always_reference_menu_data: boolean;
    };
}

/**
 * Complete Inventory Menu Module Data
 */
export interface InventoryMenuModule {
    schema_version: string;
    module: 'inventory_menu';
    category_id: string;

    inventory_context: {
        menu_type: 'food_menu' | 'beverage_menu' | 'dessert_menu' | 'bar_menu' | 'all_day_menu';
        currency: string;
        tax_inclusive_pricing?: boolean;
        last_updated_at?: string;
    };

    menu_structure: {
        categories: MenuCategory[];
    };

    menu_items: MenuItem[];
    menu_rules?: MenuRules;
    llm_usage_context?: MenuLLMContext;
}

// ==========================================
// APPOINTMENTS MODULE (Services/Healthcare)
// ==========================================

export interface ServiceSlot {
    day_of_week: number; // 0-6
    start_time: string; // HH:MM
    end_time: string;
    capacity: number;
}

export interface ServiceOffering {
    service_id: string;
    name: string;
    category?: string;
    description?: string;
    duration_minutes: number;
    price: number;
    currency: string;
    requires_consultation?: boolean;
    available_slots?: ServiceSlot[];
}

export interface AppointmentsModule {
    schema_version: string;
    module: 'appointments_booking';
    category_id: string;

    booking_context: {
        booking_type: 'appointment' | 'consultation' | 'session';
        advance_booking_days: number;
        cancellation_policy?: string;
        requires_deposit?: boolean;
        deposit_amount?: number;
    };

    services: ServiceOffering[];

    availability: {
        timezone: string;
        business_hours: Record<string, { open: string; close: string }>;
        blocked_dates?: string[];
    };
}

// ==========================================
// PRODUCTS CATALOG MODULE (Retail)
// ==========================================

export interface ProductVariant {
    variant_id: string;
    name: string;
    sku?: string;
    price: number;
    compare_at_price?: number;
    stock_quantity?: number;
    attributes?: Record<string, string>;
}

export interface Product {
    product_id: string;
    name: string;
    category_id: string;
    description?: string;
    brand?: string;
    variants: ProductVariant[];
    image_urls?: string[];
    is_featured?: boolean;
    is_new_arrival?: boolean;
    tags?: string[];
}

export interface ProductsModule {
    schema_version: string;
    module: 'products_catalog';
    category_id: string;

    catalog_context: {
        currency: string;
        tax_inclusive_pricing?: boolean;
        inventory_tracking?: boolean;
    };

    categories: {
        category_id: string;
        name: string;
        parent_id?: string;
        display_order: number;
    }[];

    products: Product[];
}

// ==========================================
// MODULE DATA UNION TYPE
// ==========================================

export type ModuleData =
    | InventoryMenuModule
    | AppointmentsModule
    | ProductsModule;

/**
 * Generic module wrapper for storage
 */
export interface StoredModule {
    module_id: string;
    partner_id: string;
    module_type: ModuleType;
    enabled: boolean;
    data: ModuleData;
    created_at: string;
    updated_at: string;
}
