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

export const DEFAULT_BULK_CONFIG = {
    industries: [
        { id: 'hospitality', name: 'Hospitality', modules: [{ id: 'rooms', name: 'Room Inventory' }, { id: 'food', name: 'Food & Beverage' }] },
        { id: 'food_beverage', name: 'Food & Beverage', modules: [{ id: 'menu', name: 'Menu Items' }] },
        { id: 'business_professional', name: 'Professional Services', modules: [{ id: 'services', name: 'Service Catalog' }] },
        { id: 'healthcare_medical', name: 'Healthcare', modules: [{ id: 'treatments', name: 'Treatments' }, { id: 'appointments', name: 'Appointments' }] },
        { id: 'personal_wellness', name: 'Wellness', modules: [{ id: 'services', name: 'Service Menu' }, { id: 'products', name: 'Retail Products' }] },
        { id: 'retail_commerce', name: 'Retail', modules: [{ id: 'catalog', name: 'Product Catalog' }] },
        { id: 'education_learning', name: 'Education', modules: [{ id: 'courses', name: 'Course Catalog' }] },
        { id: 'home_property', name: 'Real Estate', modules: [{ id: 'properties', name: 'Property Listings' }] },
    ]
};
