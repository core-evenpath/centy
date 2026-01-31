import {
    Package, UtensilsCrossed, Bed, Scissors, Stethoscope,
    ShoppingBag, Car, Home, Briefcase, GraduationCap,
    Dumbbell, Camera, Wrench, Plane, Calendar,
    type LucideIcon
} from 'lucide-react';

export const MODULE_ICONS: Record<string, LucideIcon> = {
    room_inventory: Bed,
    food_menu: UtensilsCrossed,
    service_catalog: Briefcase,
    product_catalog: ShoppingBag,
    appointment_types: Calendar,
    vehicle_inventory: Car,
    property_listings: Home,
    course_catalog: GraduationCap,
    treatment_menu: Stethoscope,
    salon_services: Scissors,
    fitness_classes: Dumbbell,
    equipment_rental: Camera,
    repair_services: Wrench,
    travel_packages: Plane,
    default: Package,
};

export const MODULE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    room_inventory: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    food_menu: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    service_catalog: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    product_catalog: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    appointment_types: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' },
    default: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
};

export const FIELD_TYPE_LABELS: Record<string, string> = {
    text: 'Text',
    number: 'Number',
    currency: 'Currency',
    select: 'Dropdown',
    multi_select: 'Multi-Select',
    toggle: 'Toggle',
    tags: 'Tags',
    textarea: 'Long Text',
    image: 'Image',
    date: 'Date',
    time: 'Time',
    duration: 'Duration',
    url: 'URL',
    email: 'Email',
    phone: 'Phone',
};

export const PRICE_TYPE_LABELS: Record<string, string> = {
    one_time: 'One-time',
    per_night: 'Per Night',
    per_hour: 'Per Hour',
    per_session: 'Per Session',
    per_day: 'Per Day',
    per_week: 'Per Week',
    per_month: 'Per Month',
    per_year: 'Per Year',
    custom: 'Custom',
};

export const DEFAULT_MODULE_SETTINGS = {
    allowCustomFields: true,
    allowCustomCategories: true,
    maxItems: 1000,
    maxCustomFields: 10,
    maxCustomCategories: 20,
    requiresPrice: true,
    requiresImage: false,
    requiresCategory: true,
    enableVariants: false,
    enableInventoryTracking: false,
    minSchemaVersion: 1,
};

export const SUPPORTED_CURRENCIES = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

// ============================================================================
// BULK GENERATION CONFIG
// ============================================================================

export interface BulkIndustryConfig {
    id: string;
    name: string;
    icon: string;
    modules: {
        slug: string;
        name: string;
        itemLabel: string;
        priceType: string;
    }[];
}

export const BULK_INDUSTRY_CONFIGS: BulkIndustryConfig[] = [
    {
        id: 'hospitality',
        name: 'Hospitality',
        icon: '🏨',
        modules: [
            { slug: 'room_inventory', name: 'Room Inventory', itemLabel: 'Room', priceType: 'per_night' },
            { slug: 'hotel_fb_menu', name: 'F&B Menu', itemLabel: 'Item', priceType: 'one_time' },
        ]
    },
    {
        id: 'food_beverage',
        name: 'Food & Beverage',
        icon: '🍽️',
        modules: [
            { slug: 'restaurant_menu', name: 'Menu Items', itemLabel: 'Item', priceType: 'one_time' },
        ]
    },
    {
        id: 'business_professional',
        name: 'Professional Services',
        icon: '💼',
        modules: [
            { slug: 'service_catalog', name: 'Service Catalog', itemLabel: 'Service', priceType: 'per_session' },
        ]
    },
    {
        id: 'healthcare_medical',
        name: 'Healthcare',
        icon: '🏥',
        modules: [
            { slug: 'treatment_services', name: 'Treatments', itemLabel: 'Treatment', priceType: 'per_session' },
        ]
    },
    {
        id: 'personal_wellness',
        name: 'Wellness & Beauty',
        icon: '💆',
        modules: [
            { slug: 'salon_services', name: 'Services', itemLabel: 'Service', priceType: 'per_session' },
            { slug: 'beauty_products', name: 'Products', itemLabel: 'Product', priceType: 'one_time' },
        ]
    },
    {
        id: 'retail_commerce',
        name: 'Retail',
        icon: '🛒',
        modules: [
            { slug: 'product_catalog', name: 'Product Catalog', itemLabel: 'Product', priceType: 'one_time' },
        ]
    },
    {
        id: 'education_learning',
        name: 'Education',
        icon: '🎓',
        modules: [
            { slug: 'course_catalog', name: 'Courses', itemLabel: 'Course', priceType: 'one_time' },
        ]
    },
    {
        id: 'home_property',
        name: 'Real Estate',
        icon: '🏠',
        modules: [
            { slug: 'property_listings', name: 'Properties', itemLabel: 'Property', priceType: 'per_month' },
        ]
    },
];

// Keep old export for backwards compatibility but mark deprecated
/** @deprecated Use BULK_INDUSTRY_CONFIGS instead */
export const DEFAULT_BULK_CONFIG = {
    industries: BULK_INDUSTRY_CONFIGS
};
