/**
 * Modules UI Schema
 * 
 * This schema drives /partner/settings → Modules
 * Covers inventory management, external integrations, and sales tools
 */

// ============================================
// MODULE TYPES
// ============================================

export type ModuleStatus = 'active' | 'inactive' | 'pending_setup' | 'error';
export type IntegrationStatus = 'connected' | 'disconnected' | 'syncing' | 'error';

export interface ModuleConfig {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'inventory' | 'integration' | 'tool';
    industries: string[];              // Which industries this applies to ('*' for all)
    status: ModuleStatus;
    isPremium?: boolean;
    setupRequired?: boolean;
    features: string[];
}

// ============================================
// INVENTORY MODULES
// ============================================

// --------------------------------------------
// MENU MANAGER (Food & Beverage)
// --------------------------------------------

export interface MenuCategory {
    id: string;
    name: string;
    localName?: string;               // Regional name (e.g., "स्टार्टर्स")
    description?: string;
    parentCategoryId?: string;        // For nested categories
    displayOrder: number;
    isActive: boolean;
    image?: string;
    availableMeals?: ('breakfast' | 'lunch' | 'dinner' | 'all_day')[];
    availableFrom?: string;           // "11:00"
    availableUntil?: string;          // "23:00"
}

export interface MenuItemVariant {
    id: string;
    name: string;                     // "Half", "Full", "Small", "Large"
    price: number;
    servingSize?: string;             // "Serves 1-2"
    isDefault?: boolean;
}

export interface MenuItemCustomization {
    id: string;
    name: string;                     // "Spice Level", "Cooking Preference"
    type: 'single' | 'multiple';
    required: boolean;
    minSelections?: number;
    maxSelections?: number;
    options: {
        id: string;
        name: string;
        priceModifier: number;          // Additional charge
        isDefault?: boolean;
        isVeg?: boolean;
    }[];
}

export interface MenuItemAddon {
    id: string;
    name: string;
    price: number;
    category?: string;                // "Extras", "Sides"
    isVeg?: boolean;
    maxQuantity?: number;
}

export interface MenuItem {
    id: string;

    // Basic Info
    name: string;
    localName?: string;
    shortDescription?: string;
    description: string;
    categoryId: string;

    // Categorization
    cuisine?: string;
    course?: 'appetizer' | 'soup' | 'salad' | 'main_course' | 'rice' | 'bread' | 'dessert' | 'beverage' | 'combo';
    mealType?: ('breakfast' | 'lunch' | 'dinner' | 'snacks' | 'all_day')[];

    // Pricing
    basePrice: number;
    currency: string;
    taxInclusive: boolean;
    taxRate?: number;
    hasVariants: boolean;
    variants?: MenuItemVariant[];
    packagingCharge?: number;

    // Dietary
    dietaryType: 'veg' | 'non_veg' | 'egg' | 'vegan';
    isJainFriendly?: boolean;
    isGlutenFree?: boolean;
    isHalal?: boolean;
    allergens?: string[];

    // Spice
    spiceLevel: 'none' | 'mild' | 'medium' | 'hot' | 'very_hot';
    adjustableSpice?: boolean;

    // Customizations
    customizations?: MenuItemCustomization[];
    addons?: MenuItemAddon[];

    // Availability
    isAvailable: boolean;
    isActive: boolean;
    availableFrom?: string;
    availableUntil?: string;
    availableDays?: string[];
    dineInAvailable?: boolean;
    deliveryAvailable?: boolean;
    takeawayAvailable?: boolean;

    // Preparation
    prepTime?: string;                // "15-20 mins"
    servesCount?: string;             // "Serves 2-3"

    // Media
    image?: string;
    images?: { url: string; type: 'main' | 'plated' | 'ingredients' }[];

    // Promotion
    isPopular?: boolean;
    isBestSeller?: boolean;
    isChefSpecial?: boolean;
    isNewItem?: boolean;
    badge?: string;

    // External IDs (for aggregator sync)
    externalIds?: {
        zomatoId?: string;
        swiggyId?: string;
        uberEatsId?: string;
    };

    // SEO / Search
    tags?: string[];
    searchKeywords?: string[];

    // Meta
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface MenuModule {
    moduleId: 'menu_manager';
    categories: MenuCategory[];
    items: MenuItem[];
    settings: {
        currency: string;
        taxRate: number;
        taxInclusive: boolean;
        defaultPrepTime: string;
        showCalories: boolean;
        showAllergens: boolean;
        enableRecommendations: boolean;
    };
    sync: {
        lastSyncedAt?: Date;
        zomato?: { connected: boolean; menuId?: string; lastSync?: Date };
        swiggy?: { connected: boolean; restaurantId?: string; lastSync?: Date };
        whatsapp?: { connected: boolean; catalogId?: string; lastSync?: Date };
    };
}

// --------------------------------------------
// PRODUCT CATALOG (Retail)
// --------------------------------------------

export interface ProductCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    parentCategoryId?: string;
    image?: string;
    displayOrder: number;
    isActive: boolean;
    seoTitle?: string;
    seoDescription?: string;
}

export interface ProductVariant {
    id: string;
    sku: string;
    name: string;                     // "Red - Large"
    attributes: Record<string, string>; // { color: "Red", size: "Large" }
    price: number;
    compareAtPrice?: number;          // Original price (for showing discount)
    costPrice?: number;               // For profit calculation
    stock: number;
    lowStockThreshold?: number;
    weight?: number;
    weightUnit?: 'g' | 'kg' | 'lb' | 'oz';
    barcode?: string;
    image?: string;
    isDefault?: boolean;
}

export interface Product {
    id: string;

    // Basic Info
    name: string;
    slug: string;
    shortDescription?: string;
    description: string;
    categoryId: string;
    brand?: string;

    // Pricing (if no variants)
    basePrice?: number;
    compareAtPrice?: number;
    costPrice?: number;
    currency: string;
    taxable: boolean;
    taxRate?: number;

    // Variants
    hasVariants: boolean;
    variantAttributes?: string[];     // ["Color", "Size"]
    variants?: ProductVariant[];

    // Inventory
    sku?: string;
    barcode?: string;
    stock?: number;
    trackInventory: boolean;
    allowBackorder: boolean;
    lowStockThreshold?: number;

    // Shipping
    weight?: number;
    weightUnit?: 'g' | 'kg' | 'lb' | 'oz';
    dimensions?: { length: number; width: number; height: number; unit: 'cm' | 'in' };
    shippingRequired: boolean;

    // Media
    images: { url: string; alt?: string; isPrimary?: boolean }[];
    video?: string;

    // SEO
    seoTitle?: string;
    seoDescription?: string;
    tags?: string[];

    // Status
    status: 'draft' | 'active' | 'archived';
    publishedAt?: Date;

    // External IDs
    externalIds?: {
        shopifyId?: string;
        wooCommerceId?: string;
        amazonAsin?: string;
    };

    // Meta
    createdAt: Date;
    updatedAt: Date;
}

export interface ProductModule {
    moduleId: 'product_catalog';
    categories: ProductCategory[];
    products: Product[];
    settings: {
        currency: string;
        taxRate: number;
        trackInventory: boolean;
        lowStockAlertEmail: boolean;
        lowStockThreshold: number;
    };
    sync: {
        shopify?: { connected: boolean; storeUrl?: string; lastSync?: Date };
        wooCommerce?: { connected: boolean; storeUrl?: string; lastSync?: Date };
        whatsapp?: { connected: boolean; catalogId?: string; lastSync?: Date };
    };
}

// --------------------------------------------
// SERVICE CATALOG (Healthcare, Services)
// --------------------------------------------

export interface ServiceCategory {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    displayOrder: number;
    isActive: boolean;
}

export interface ServiceItem {
    id: string;

    // Basic Info
    name: string;
    shortDescription?: string;
    description: string;
    categoryId: string;

    // Pricing
    priceType: 'fixed' | 'starting_from' | 'range' | 'on_request';
    price?: number;
    priceMax?: number;                // For range pricing
    currency: string;

    // Duration
    duration?: number;                // In minutes
    durationUnit?: 'minutes' | 'hours' | 'days';

    // Booking
    bookingRequired: boolean;
    bookingLeadTime?: number;         // Hours in advance
    cancellationPolicy?: string;

    // Availability
    isAvailable: boolean;
    availableDays?: string[];
    availableSlots?: { day: string; slots: string[] }[];

    // Assigned Staff
    assignedStaffIds?: string[];

    // Media
    image?: string;

    // Meta
    isPopular?: boolean;
    tags?: string[];
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ServiceModule {
    moduleId: 'service_catalog';
    categories: ServiceCategory[];
    services: ServiceItem[];
    settings: {
        currency: string;
        defaultDuration: number;
        bookingLeadTime: number;
        cancellationPolicy: string;
        allowOnlineBooking: boolean;
    };
}

// --------------------------------------------
// ROOM INVENTORY (Hospitality)
// --------------------------------------------

export interface RoomAmenity {
    id: string;
    name: string;
    icon?: string;
    category: 'basic' | 'comfort' | 'entertainment' | 'bathroom' | 'view' | 'other';
}

export interface RoomType {
    id: string;

    // Basic Info
    name: string;                     // "Deluxe Room", "Suite"
    shortDescription?: string;
    description: string;

    // Capacity
    maxOccupancy: number;
    maxAdults: number;
    maxChildren: number;
    bedConfiguration: string;         // "1 King Bed" or "2 Twin Beds"
    roomSize?: number;
    roomSizeUnit?: 'sqft' | 'sqm';

    // Pricing
    basePrice: number;                // Per night
    currency: string;
    weekendPrice?: number;
    seasonalPricing?: { season: string; price: number; startDate: string; endDate: string }[];
    extraAdultCharge?: number;
    extraChildCharge?: number;

    // Inventory
    totalRooms: number;

    // Amenities
    amenities: string[];              // Amenity IDs

    // Media
    images: { url: string; alt?: string; isPrimary?: boolean }[];
    virtualTourUrl?: string;

    // Policies
    smokingAllowed: boolean;
    petsAllowed: boolean;

    // External IDs
    externalIds?: {
        bookingComId?: string;
        airbnbId?: string;
        goibiboId?: string;
        makemytripId?: string;
    };

    // Meta
    isAvailable: boolean;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface RoomModule {
    moduleId: 'room_inventory';
    amenities: RoomAmenity[];
    roomTypes: RoomType[];
    settings: {
        currency: string;
        checkInTime: string;
        checkOutTime: string;
        cancellationPolicy: string;
        childAgeLimit: number;
        infantAgeLimit: number;
    };
    sync: {
        bookingCom?: { connected: boolean; propertyId?: string; lastSync?: Date };
        airbnb?: { connected: boolean; listingId?: string; lastSync?: Date };
    };
}

// --------------------------------------------
// PROPERTY LISTINGS (Real Estate)
// --------------------------------------------

export interface PropertyListing {
    id: string;

    // Basic Info
    title: string;
    description: string;
    propertyType: 'apartment' | 'villa' | 'plot' | 'commercial' | 'office' | 'shop' | 'warehouse';
    transactionType: 'sale' | 'rent' | 'lease' | 'pg';

    // Location
    address: string;
    locality: string;
    city: string;
    state: string;
    pincode: string;
    latitude?: number;
    longitude?: number;

    // Specifications
    bedrooms?: number;
    bathrooms?: number;
    balconies?: number;
    carpetArea?: number;
    builtUpArea?: number;
    plotArea?: number;
    areaUnit: 'sqft' | 'sqm' | 'sqyd' | 'acre';
    floor?: number;
    totalFloors?: number;
    facing?: 'north' | 'south' | 'east' | 'west' | 'north_east' | 'north_west' | 'south_east' | 'south_west';
    furnishing?: 'unfurnished' | 'semi_furnished' | 'fully_furnished';
    ageOfProperty?: string;
    possession?: 'ready' | 'under_construction' | 'date';
    possessionDate?: Date;

    // Pricing
    price: number;
    pricePerUnit?: number;
    currency: string;
    negotiable: boolean;
    maintenanceCharges?: number;
    maintenancePeriod?: 'monthly' | 'quarterly' | 'yearly';
    securityDeposit?: number;

    // Amenities
    amenities: string[];

    // Media
    images: { url: string; alt?: string; isPrimary?: boolean }[];
    floorPlanImage?: string;
    videoUrl?: string;
    virtualTourUrl?: string;

    // Legal
    reraRegistered: boolean;
    reraNumber?: string;

    // External IDs
    externalIds?: {
        magicBricksId?: string;
        ninetyNineAcresId?: string;
        housingComId?: string;
    };

    // Meta
    status: 'active' | 'sold' | 'rented' | 'inactive';
    featured: boolean;
    viewCount?: number;
    inquiryCount?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface PropertyModule {
    moduleId: 'property_listings';
    listings: PropertyListing[];
    settings: {
        currency: string;
        defaultAreaUnit: 'sqft' | 'sqm';
        showPricePerUnit: boolean;
    };
}

// ============================================
// INTEGRATION MODULES
// ============================================

export interface IntegrationCredentials {
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    storeUrl?: string;
    merchantId?: string;
    [key: string]: any;
}

export interface Integration {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'ecommerce' | 'delivery' | 'payment' | 'social' | 'crm' | 'analytics' | 'communication';
    status: IntegrationStatus;
    credentials?: IntegrationCredentials;
    settings?: Record<string, any>;
    lastSyncAt?: Date;
    syncFrequency?: 'realtime' | 'hourly' | 'daily' | 'manual';
    error?: string;
    connectedAt?: Date;
}

// Pre-configured Integrations
export const INTEGRATIONS: Record<string, Integration> = {
    shopify: {
        id: 'shopify',
        name: 'Shopify',
        description: 'Sync products, orders, and inventory with your Shopify store',
        icon: '🛍️',
        category: 'ecommerce',
        status: 'disconnected',
        syncFrequency: 'realtime',
    },
    woocommerce: {
        id: 'woocommerce',
        name: 'WooCommerce',
        description: 'Connect your WordPress WooCommerce store',
        icon: '🛒',
        category: 'ecommerce',
        status: 'disconnected',
        syncFrequency: 'hourly',
    },
    zomato: {
        id: 'zomato',
        name: 'Zomato',
        description: 'Sync menu, manage orders, and update availability',
        icon: '🍽️',
        category: 'delivery',
        status: 'disconnected',
        syncFrequency: 'realtime',
    },
    swiggy: {
        id: 'swiggy',
        name: 'Swiggy',
        description: 'Manage your Swiggy restaurant listing and orders',
        icon: '🍕',
        category: 'delivery',
        status: 'disconnected',
        syncFrequency: 'realtime',
    },
    uber_eats: {
        id: 'uber_eats',
        name: 'Uber Eats',
        description: 'Connect your Uber Eats restaurant',
        icon: '🚗',
        category: 'delivery',
        status: 'disconnected',
        syncFrequency: 'realtime',
    },
    dunzo: {
        id: 'dunzo',
        name: 'Dunzo',
        description: 'Enable hyperlocal delivery via Dunzo',
        icon: '📦',
        category: 'delivery',
        status: 'disconnected',
    },
    razorpay: {
        id: 'razorpay',
        name: 'Razorpay',
        description: 'Accept payments and create payment links',
        icon: '💳',
        category: 'payment',
        status: 'disconnected',
    },
    stripe: {
        id: 'stripe',
        name: 'Stripe',
        description: 'Global payment processing',
        icon: '💰',
        category: 'payment',
        status: 'disconnected',
    },
    paytm: {
        id: 'paytm',
        name: 'Paytm Business',
        description: 'Accept Paytm payments and wallet transfers',
        icon: '📱',
        category: 'payment',
        status: 'disconnected',
    },
    whatsapp_catalog: {
        id: 'whatsapp_catalog',
        name: 'WhatsApp Catalog',
        description: 'Sync products to WhatsApp Business Catalog',
        icon: '📱',
        category: 'social',
        status: 'disconnected',
        syncFrequency: 'daily',
    },
    google_business: {
        id: 'google_business',
        name: 'Google Business Profile',
        description: 'Keep your Google listing updated automatically',
        icon: '🔍',
        category: 'social',
        status: 'disconnected',
        syncFrequency: 'daily',
    },
    instagram_shop: {
        id: 'instagram_shop',
        name: 'Instagram Shop',
        description: 'Sync products to Instagram Shopping',
        icon: '📸',
        category: 'social',
        status: 'disconnected',
        syncFrequency: 'daily',
    },
    facebook_catalog: {
        id: 'facebook_catalog',
        name: 'Facebook Catalog',
        description: 'Sync products to Facebook Marketplace',
        icon: '👤',
        category: 'social',
        status: 'disconnected',
        syncFrequency: 'daily',
    },
    hubspot: {
        id: 'hubspot',
        name: 'HubSpot',
        description: 'Sync contacts and deals with HubSpot CRM',
        icon: '🧡',
        category: 'crm',
        status: 'disconnected',
    },
    zoho_crm: {
        id: 'zoho_crm',
        name: 'Zoho CRM',
        description: 'Connect your Zoho CRM for contact sync',
        icon: '📊',
        category: 'crm',
        status: 'disconnected',
    },
    google_analytics: {
        id: 'google_analytics',
        name: 'Google Analytics',
        description: 'Track website and catalog performance',
        icon: '📈',
        category: 'analytics',
        status: 'disconnected',
    },
};

// ============================================
// TOOL MODULES
// ============================================

export interface ToolModule {
    id: string;
    name: string;
    description: string;
    icon: string;
    isEnabled: boolean;
    settings?: Record<string, any>;
}

export const TOOLS: Record<string, ToolModule> = {
    invoice_generator: {
        id: 'invoice_generator',
        name: 'Invoice Generator',
        description: 'Create and send professional invoices',
        icon: '🧾',
        isEnabled: false,
        settings: {
            defaultDueDate: 30,
            showLogo: true,
            defaultNotes: '',
            taxEnabled: true,
        },
    },
    payment_links: {
        id: 'payment_links',
        name: 'Payment Links',
        description: 'Generate shareable payment links',
        icon: '🔗',
        isEnabled: false,
    },
    booking_widget: {
        id: 'booking_widget',
        name: 'Booking Widget',
        description: 'Embed booking on your website',
        icon: '📅',
        isEnabled: false,
        settings: {
            primaryColor: '#6366f1',
            showPrices: true,
            requireDeposit: false,
            depositPercentage: 20,
        },
    },
    review_collector: {
        id: 'review_collector',
        name: 'Review Collector',
        description: 'Automated review requests after service',
        icon: '⭐',
        isEnabled: false,
        settings: {
            sendAfterHours: 24,
            platform: 'google',
            customMessage: '',
        },
    },
    qr_code: {
        id: 'qr_code',
        name: 'QR Code Generator',
        description: 'Generate QR codes for menu, catalog, or payments',
        icon: '📱',
        isEnabled: false,
    },
    export_tools: {
        id: 'export_tools',
        name: 'Export Tools',
        description: 'Export data to CSV, Excel, or PDF',
        icon: '📤',
        isEnabled: true,
    },
};

// ============================================
// MODULES CONFIG BY INDUSTRY
// ============================================

export interface ModulesConfig {
    inventory: {
        available: ModuleConfig[];
        active: string[];
    };
    integrations: {
        available: Integration[];
        connected: string[];
    };
    tools: {
        available: ToolModule[];
        enabled: string[];
    };
}

export const FOOD_BEVERAGE_MODULES: ModulesConfig = {
    inventory: {
        available: [
            {
                id: 'menu_manager',
                name: 'Menu Manager',
                description: 'Create and manage your complete menu with categories, items, pricing, and dietary info',
                icon: '🍽️',
                category: 'inventory',
                industries: ['food_beverage'],
                status: 'active',
                features: [
                    'Unlimited menu items',
                    'Categories & subcategories',
                    'Variants (Half/Full, Sizes)',
                    'Customizations & add-ons',
                    'Dietary labels & allergens',
                    'Item availability scheduling',
                    'Photo gallery per item',
                    'Bulk import/export',
                ],
            },
        ],
        active: ['menu_manager'],
    },
    integrations: {
        available: [
            INTEGRATIONS.zomato,
            INTEGRATIONS.swiggy,
            INTEGRATIONS.uber_eats,
            INTEGRATIONS.dunzo,
            INTEGRATIONS.whatsapp_catalog,
            INTEGRATIONS.google_business,
            INTEGRATIONS.razorpay,
            INTEGRATIONS.stripe,
            INTEGRATIONS.paytm,
            INTEGRATIONS.instagram_shop,
            INTEGRATIONS.facebook_catalog,
        ],
        connected: [],
    },
    tools: {
        available: Object.values(TOOLS),
        enabled: ['export_tools'],
    },
};

export const RETAIL_MODULES: ModulesConfig = {
    inventory: {
        available: [
            {
                id: 'product_catalog',
                name: 'Product Catalog',
                description: 'Manage your complete product inventory with variants, pricing, and stock tracking',
                icon: '🛒',
                category: 'inventory',
                industries: ['retail'],
                status: 'active',
                features: [
                    'Unlimited products',
                    'Categories & collections',
                    'Variants (Size, Color, etc.)',
                    'Stock tracking',
                    'Low stock alerts',
                    'SKU & barcode support',
                    'Bulk import/export',
                    'Cost & profit tracking',
                ],
            },
        ],
        active: ['product_catalog'],
    },
    integrations: {
        available: [
            INTEGRATIONS.shopify,
            INTEGRATIONS.woocommerce,
            INTEGRATIONS.whatsapp_catalog,
            INTEGRATIONS.instagram_shop,
            INTEGRATIONS.facebook_catalog,
            INTEGRATIONS.google_business,
            INTEGRATIONS.razorpay,
            INTEGRATIONS.stripe,
            INTEGRATIONS.dunzo,
        ],
        connected: [],
    },
    tools: {
        available: Object.values(TOOLS),
        enabled: ['export_tools'],
    },
};

// ============================================
// INTEGRATION SYNC CONFIGS
// ============================================

export interface SyncFieldMapping {
    source: string;
    target: string;
    transform?: 'direct' | 'currency' | 'boolean' | 'array' | 'custom';
    customTransform?: (value: any) => any;
}

export interface IntegrationSyncConfig {
    integrationId: string;
    moduleId: string;
    direction: 'push' | 'pull' | 'bidirectional';
    fieldMappings: SyncFieldMapping[];
    webhookEvents?: string[];
    apiEndpoints?: {
        list?: string;
        get?: string;
        create?: string;
        update?: string;
        delete?: string;
    };
}

export const SYNC_CONFIGS: Record<string, IntegrationSyncConfig> = {
    shopify_product_catalog: {
        integrationId: 'shopify',
        moduleId: 'product_catalog',
        direction: 'bidirectional',
        fieldMappings: [
            { source: 'name', target: 'title', transform: 'direct' },
            { source: 'description', target: 'body_html', transform: 'direct' },
            { source: 'basePrice', target: 'variants[0].price', transform: 'currency' },
            { source: 'compareAtPrice', target: 'variants[0].compare_at_price', transform: 'currency' },
            { source: 'sku', target: 'variants[0].sku', transform: 'direct' },
            { source: 'stock', target: 'variants[0].inventory_quantity', transform: 'direct' },
            { source: 'images', target: 'images', transform: 'array' },
            { source: 'tags', target: 'tags', transform: 'array' },
            { source: 'status', target: 'status', transform: 'custom', customTransform: (v) => v === 'active' ? 'active' : 'draft' },
        ],
        webhookEvents: ['products/create', 'products/update', 'products/delete', 'inventory_levels/update'],
        apiEndpoints: {
            list: '/admin/api/2024-01/products.json',
            get: '/admin/api/2024-01/products/{id}.json',
            create: '/admin/api/2024-01/products.json',
            update: '/admin/api/2024-01/products/{id}.json',
            delete: '/admin/api/2024-01/products/{id}.json',
        },
    },
    zomato_menu_manager: {
        integrationId: 'zomato',
        moduleId: 'menu_manager',
        direction: 'push',
        fieldMappings: [
            { source: 'name', target: 'name', transform: 'direct' },
            { source: 'description', target: 'description', transform: 'direct' },
            { source: 'basePrice', target: 'price', transform: 'currency' },
            { source: 'categoryId', target: 'category_id', transform: 'direct' },
            { source: 'dietaryType', target: 'is_veg', transform: 'custom', customTransform: (v) => v === 'veg' || v === 'vegan' },
            { source: 'isAvailable', target: 'in_stock', transform: 'boolean' },
            { source: 'image', target: 'image_url', transform: 'direct' },
        ],
        apiEndpoints: {
            list: '/api/v1/menu/items',
            create: '/api/v1/menu/items',
            update: '/api/v1/menu/items/{id}',
            delete: '/api/v1/menu/items/{id}',
        },
    },
    whatsapp_catalog_product_catalog: {
        integrationId: 'whatsapp_catalog',
        moduleId: 'product_catalog',
        direction: 'push',
        fieldMappings: [
            { source: 'name', target: 'name', transform: 'direct' },
            { source: 'description', target: 'description', transform: 'direct' },
            { source: 'basePrice', target: 'price', transform: 'currency' },
            { source: 'currency', target: 'currency', transform: 'direct' },
            { source: 'images[0].url', target: 'image_url', transform: 'direct' },
            { source: 'externalIds.whatsappId', target: 'retailer_id', transform: 'direct' },
            { source: 'status', target: 'availability', transform: 'custom', customTransform: (v) => v === 'active' ? 'in stock' : 'out of stock' },
        ],
        apiEndpoints: {
            list: '/{catalog-id}/products',
            create: '/{catalog-id}/products',
            update: '/{catalog-id}/products',
            delete: '/{product-id}',
        },
    },
};

// ============================================
// IMPORT/EXPORT SCHEMAS
// ============================================

export interface ImportConfig {
    moduleId: string;
    supportedFormats: ('csv' | 'xlsx' | 'json')[];
    templateUrl: string;
    fieldMappings: {
        required: string[];
        optional: string[];
        columnMappings: Record<string, string>;
    };
    validationRules: {
        field: string;
        rules: string[];
    }[];
    batchSize: number;
}

export const IMPORT_CONFIGS: Record<string, ImportConfig> = {
    menu_manager: {
        moduleId: 'menu_manager',
        supportedFormats: ['csv', 'xlsx'],
        templateUrl: '/templates/menu-import-template.xlsx',
        fieldMappings: {
            required: ['name', 'categoryId', 'basePrice'],
            optional: ['description', 'dietaryType', 'spiceLevel', 'image', 'isAvailable', 'tags'],
            columnMappings: {
                'Item Name': 'name',
                'Category': 'categoryId',
                'Price': 'basePrice',
                'Description': 'description',
                'Veg/Non-Veg': 'dietaryType',
                'Spice Level': 'spiceLevel',
                'Image URL': 'image',
                'Available': 'isAvailable',
                'Tags': 'tags',
            },
        },
        validationRules: [
            { field: 'name', rules: ['required', 'maxLength:200'] },
            { field: 'basePrice', rules: ['required', 'numeric', 'min:0'] },
            { field: 'dietaryType', rules: ['in:veg,non_veg,egg,vegan'] },
            { field: 'spiceLevel', rules: ['in:none,mild,medium,hot,very_hot'] },
        ],
        batchSize: 100,
    },
    product_catalog: {
        moduleId: 'product_catalog',
        supportedFormats: ['csv', 'xlsx', 'json'],
        templateUrl: '/templates/product-import-template.xlsx',
        fieldMappings: {
            required: ['name', 'categoryId', 'basePrice', 'sku'],
            optional: ['description', 'stock', 'compareAtPrice', 'images', 'tags', 'weight', 'barcode'],
            columnMappings: {
                'Product Name': 'name',
                'SKU': 'sku',
                'Category': 'categoryId',
                'Price': 'basePrice',
                'Compare At Price': 'compareAtPrice',
                'Description': 'description',
                'Stock': 'stock',
                'Image URLs': 'images',
                'Tags': 'tags',
                'Weight (g)': 'weight',
                'Barcode': 'barcode',
            },
        },
        validationRules: [
            { field: 'name', rules: ['required', 'maxLength:200'] },
            { field: 'sku', rules: ['required', 'unique', 'maxLength:50'] },
            { field: 'basePrice', rules: ['required', 'numeric', 'min:0'] },
            { field: 'stock', rules: ['numeric', 'min:0'] },
        ],
        batchSize: 500,
    },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get modules config for a specific industry
 */
export function getModulesForIndustry(industryId: string): ModulesConfig {
    switch (industryId) {
        case 'food_beverage':
            return FOOD_BEVERAGE_MODULES;
        case 'retail':
            return RETAIL_MODULES;
        default:
            return RETAIL_MODULES;
    }
}

/**
 * Get available integrations for an industry
 */
export function getIntegrationsForIndustry(industryId: string): Integration[] {
    return getModulesForIndustry(industryId).integrations.available;
}

/**
 * Get sync config for a specific integration and module
 */
export function getSyncConfig(integrationId: string, moduleId: string): IntegrationSyncConfig | null {
    return SYNC_CONFIGS[`${integrationId}_${moduleId}`] || null;
}

/**
 * Get import config for a module
 */
export function getImportConfig(moduleId: string): ImportConfig | null {
    return IMPORT_CONFIGS[moduleId] || null;
}
