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
            { slug: 'hotel_rooms', name: 'Hotel Room Inventory', itemLabel: 'Room', priceType: 'per_night' },
            { slug: 'hotel_fb_menu', name: 'Hotel F&B Menu', itemLabel: 'Item', priceType: 'one_time' },
            { slug: 'hotel_banquet', name: 'Banquet & Events', itemLabel: 'Package', priceType: 'custom' },
            { slug: 'hotel_spa', name: 'Spa & Wellness Services', itemLabel: 'Service', priceType: 'per_session' },
            { slug: 'hotel_housekeeping', name: 'Housekeeping Supplies', itemLabel: 'Item', priceType: 'one_time' },
            { slug: 'hotel_amenities', name: 'Guest Amenities', itemLabel: 'Amenity', priceType: 'one_time' },
            { slug: 'hotel_tours', name: 'Tours & Activities', itemLabel: 'Activity', priceType: 'per_session' },
            { slug: 'hotel_transport', name: 'Transport Services', itemLabel: 'Service', priceType: 'per_session' },
        ]
    },
    {
        id: 'food_beverage',
        name: 'Food & Beverage',
        icon: '🍽️',
        modules: [
            { slug: 'restaurant_menu', name: 'Restaurant Menu', itemLabel: 'Dish', priceType: 'one_time' },
            { slug: 'restaurant_beverages', name: 'Beverage Menu', itemLabel: 'Drink', priceType: 'one_time' },
            { slug: 'catering_packages', name: 'Catering Packages', itemLabel: 'Package', priceType: 'custom' },
            { slug: 'bakery_items', name: 'Bakery & Confectionery', itemLabel: 'Item', priceType: 'one_time' },
            { slug: 'cloud_kitchen_menu', name: 'Cloud Kitchen Menu', itemLabel: 'Item', priceType: 'one_time' },
            { slug: 'food_truck_menu', name: 'Food Truck Menu', itemLabel: 'Item', priceType: 'one_time' },
            { slug: 'cafe_menu', name: 'Cafe & Coffee Shop', itemLabel: 'Item', priceType: 'one_time' },
            { slug: 'bar_lounge_menu', name: 'Bar & Lounge Menu', itemLabel: 'Item', priceType: 'one_time' },
            { slug: 'tiffin_meal_plans', name: 'Tiffin / Meal Plans', itemLabel: 'Plan', priceType: 'per_month' },
            { slug: 'raw_materials_inventory', name: 'Raw Materials & Inventory', itemLabel: 'Item', priceType: 'one_time' },
        ]
    },
    {
        id: 'retail_commerce',
        name: 'Retail & Commerce',
        icon: '🛒',
        modules: [
            { slug: 'product_catalog', name: 'Product Catalog', itemLabel: 'Product', priceType: 'one_time' },
            { slug: 'fashion_apparel', name: 'Fashion & Apparel', itemLabel: 'Product', priceType: 'one_time' },
            { slug: 'electronics_catalog', name: 'Electronics & Gadgets', itemLabel: 'Product', priceType: 'one_time' },
            { slug: 'grocery_inventory', name: 'Grocery & FMCG', itemLabel: 'Product', priceType: 'one_time' },
            { slug: 'pharmacy_catalog', name: 'Pharmacy & Medicine', itemLabel: 'Product', priceType: 'one_time' },
            { slug: 'auto_parts', name: 'Auto Parts & Accessories', itemLabel: 'Part', priceType: 'one_time' },
            { slug: 'hardware_tools', name: 'Hardware & Tools', itemLabel: 'Product', priceType: 'one_time' },
            { slug: 'stationery_office', name: 'Stationery & Office Supplies', itemLabel: 'Product', priceType: 'one_time' },
            { slug: 'jewelry_catalog', name: 'Jewelry & Accessories', itemLabel: 'Product', priceType: 'one_time' },
            { slug: 'home_furniture', name: 'Home & Furniture', itemLabel: 'Product', priceType: 'one_time' },
        ]
    },
    {
        id: 'healthcare_medical',
        name: 'Healthcare & Medical',
        icon: '🏥',
        modules: [
            { slug: 'treatment_services', name: 'Treatments & Procedures', itemLabel: 'Treatment', priceType: 'per_session' },
            { slug: 'diagnostic_tests', name: 'Diagnostic Tests', itemLabel: 'Test', priceType: 'one_time' },
            { slug: 'health_packages', name: 'Health Checkup Packages', itemLabel: 'Package', priceType: 'one_time' },
            { slug: 'pharmacy_inventory', name: 'Pharmacy / Medicines', itemLabel: 'Medicine', priceType: 'one_time' },
            { slug: 'medical_equipment', name: 'Medical Equipment', itemLabel: 'Equipment', priceType: 'one_time' },
            { slug: 'consultation_services', name: 'Consultation Services', itemLabel: 'Consultation', priceType: 'per_session' },
            { slug: 'dental_services', name: 'Dental Services', itemLabel: 'Service', priceType: 'per_session' },
            { slug: 'physiotherapy_services', name: 'Physiotherapy Services', itemLabel: 'Session', priceType: 'per_session' },
            { slug: 'optical_catalog', name: 'Optical & Eye Care', itemLabel: 'Product', priceType: 'one_time' },
            { slug: 'ayurveda_services', name: 'Ayurveda & Alternative Medicine', itemLabel: 'Treatment', priceType: 'per_session' },
        ]
    },
    {
        id: 'personal_wellness',
        name: 'Beauty & Wellness',
        icon: '💆',
        modules: [
            { slug: 'salon_services', name: 'Salon Services', itemLabel: 'Service', priceType: 'per_session' },
            { slug: 'spa_treatments', name: 'Spa Treatments', itemLabel: 'Treatment', priceType: 'per_session' },
            { slug: 'beauty_products', name: 'Beauty Products', itemLabel: 'Product', priceType: 'one_time' },
            { slug: 'fitness_classes', name: 'Gym & Fitness Classes', itemLabel: 'Class', priceType: 'per_month' },
            { slug: 'yoga_programs', name: 'Yoga & Meditation', itemLabel: 'Program', priceType: 'per_session' },
            { slug: 'massage_therapy', name: 'Massage Therapy', itemLabel: 'Session', priceType: 'per_session' },
            { slug: 'nail_art_services', name: 'Nail Art & Care', itemLabel: 'Service', priceType: 'per_session' },
            { slug: 'bridal_packages', name: 'Bridal & Event Packages', itemLabel: 'Package', priceType: 'custom' },
            { slug: 'skincare_treatments', name: 'Skincare & Derma', itemLabel: 'Treatment', priceType: 'per_session' },
        ]
    },
    {
        id: 'education_learning',
        name: 'Education & Learning',
        icon: '🎓',
        modules: [
            { slug: 'course_catalog', name: 'Courses & Programs', itemLabel: 'Course', priceType: 'one_time' },
            { slug: 'tutoring_services', name: 'Tutoring Services', itemLabel: 'Subject', priceType: 'per_session' },
            { slug: 'coaching_programs', name: 'Coaching & Test Prep', itemLabel: 'Program', priceType: 'per_month' },
            { slug: 'workshop_events', name: 'Workshops & Events', itemLabel: 'Workshop', priceType: 'one_time' },
            { slug: 'study_materials', name: 'Study Materials', itemLabel: 'Material', priceType: 'one_time' },
            { slug: 'school_admissions', name: 'School Admissions', itemLabel: 'Program', priceType: 'per_year' },
            { slug: 'study_abroad', name: 'Study Abroad Programs', itemLabel: 'Program', priceType: 'one_time' },
            { slug: 'skill_certifications', name: 'Skill Certifications', itemLabel: 'Certification', priceType: 'one_time' },
            { slug: 'language_courses', name: 'Language Courses', itemLabel: 'Course', priceType: 'per_month' },
        ]
    },
    {
        id: 'home_property',
        name: 'Real Estate & Property',
        icon: '🏠',
        modules: [
            { slug: 'property_listings', name: 'Property Listings', itemLabel: 'Property', priceType: 'one_time' },
            { slug: 'rental_properties', name: 'Rental Properties', itemLabel: 'Property', priceType: 'per_month' },
            { slug: 'pg_hostel_rooms', name: 'PG / Hostel Rooms', itemLabel: 'Room', priceType: 'per_month' },
            { slug: 'commercial_spaces', name: 'Commercial Spaces', itemLabel: 'Space', priceType: 'per_month' },
            { slug: 'coworking_spaces', name: 'Coworking & Desks', itemLabel: 'Space', priceType: 'per_month' },
            { slug: 'interior_services', name: 'Interior Design Services', itemLabel: 'Service', priceType: 'custom' },
            { slug: 'construction_services', name: 'Construction Services', itemLabel: 'Service', priceType: 'custom' },
            { slug: 'home_maintenance', name: 'Home Maintenance', itemLabel: 'Service', priceType: 'per_session' },
        ]
    },
    {
        id: 'business_professional',
        name: 'Professional Services',
        icon: '💼',
        modules: [
            { slug: 'consulting_services', name: 'Consulting Services', itemLabel: 'Service', priceType: 'per_session' },
            { slug: 'legal_services', name: 'Legal Services', itemLabel: 'Service', priceType: 'per_session' },
            { slug: 'accounting_services', name: 'Accounting & Tax', itemLabel: 'Service', priceType: 'per_month' },
            { slug: 'marketing_services', name: 'Marketing & Advertising', itemLabel: 'Service', priceType: 'custom' },
            { slug: 'it_services', name: 'IT & Software Services', itemLabel: 'Service', priceType: 'custom' },
            { slug: 'hr_staffing', name: 'HR & Staffing', itemLabel: 'Service', priceType: 'custom' },
            { slug: 'event_management', name: 'Event Management', itemLabel: 'Package', priceType: 'custom' },
            { slug: 'photography_services', name: 'Photography & Videography', itemLabel: 'Package', priceType: 'per_session' },
            { slug: 'printing_services', name: 'Printing & Design', itemLabel: 'Service', priceType: 'one_time' },
            { slug: 'travel_agency', name: 'Travel & Tourism', itemLabel: 'Package', priceType: 'one_time' },
        ]
    },
    {
        id: 'financial_services',
        name: 'Financial Services',
        icon: '🏦',
        modules: [
            { slug: 'loan_products', name: 'Loan Products', itemLabel: 'Product', priceType: 'custom' },
            { slug: 'insurance_plans', name: 'Insurance Plans', itemLabel: 'Plan', priceType: 'per_year' },
            { slug: 'investment_products', name: 'Investment Products', itemLabel: 'Product', priceType: 'custom' },
            { slug: 'microfinance_products', name: 'Microfinance Products', itemLabel: 'Product', priceType: 'custom' },
            { slug: 'tax_advisory', name: 'Tax Advisory Services', itemLabel: 'Service', priceType: 'per_session' },
            { slug: 'wealth_management', name: 'Wealth Management', itemLabel: 'Plan', priceType: 'per_year' },
        ]
    },
    {
        id: 'automotive',
        name: 'Automotive',
        icon: '🚗',
        modules: [
            { slug: 'vehicle_inventory', name: 'Vehicle Inventory', itemLabel: 'Vehicle', priceType: 'one_time' },
            { slug: 'service_workshop', name: 'Service & Workshop', itemLabel: 'Service', priceType: 'one_time' },
            { slug: 'spare_parts', name: 'Spare Parts', itemLabel: 'Part', priceType: 'one_time' },
            { slug: 'car_rental', name: 'Car Rental Fleet', itemLabel: 'Vehicle', priceType: 'per_day' },
            { slug: 'car_wash_detailing', name: 'Car Wash & Detailing', itemLabel: 'Service', priceType: 'per_session' },
            { slug: 'driving_school', name: 'Driving School', itemLabel: 'Course', priceType: 'one_time' },
        ]
    },
    {
        id: 'agriculture',
        name: 'Agriculture & Farming',
        icon: '🌾',
        modules: [
            { slug: 'crop_produce', name: 'Crop & Produce', itemLabel: 'Product', priceType: 'one_time' },
            { slug: 'seeds_fertilizers', name: 'Seeds & Fertilizers', itemLabel: 'Product', priceType: 'one_time' },
            { slug: 'farm_equipment', name: 'Farm Equipment', itemLabel: 'Equipment', priceType: 'one_time' },
            { slug: 'dairy_products', name: 'Dairy Products', itemLabel: 'Product', priceType: 'one_time' },
            { slug: 'nursery_plants', name: 'Nursery & Plants', itemLabel: 'Plant', priceType: 'one_time' },
            { slug: 'organic_products', name: 'Organic Products', itemLabel: 'Product', priceType: 'one_time' },
        ]
    },
    {
        id: 'logistics_transport',
        name: 'Logistics & Transport',
        icon: '🚚',
        modules: [
            { slug: 'freight_services', name: 'Freight Services', itemLabel: 'Service', priceType: 'custom' },
            { slug: 'courier_services', name: 'Courier Services', itemLabel: 'Service', priceType: 'one_time' },
            { slug: 'warehouse_inventory', name: 'Warehouse Inventory', itemLabel: 'Item', priceType: 'one_time' },
            { slug: 'fleet_vehicles', name: 'Fleet Vehicles', itemLabel: 'Vehicle', priceType: 'per_day' },
            { slug: 'packers_movers', name: 'Packers & Movers', itemLabel: 'Package', priceType: 'custom' },
        ]
    },
];

// Keep old export for backwards compatibility but mark deprecated
/** @deprecated Use BULK_INDUSTRY_CONFIGS instead */
export const DEFAULT_BULK_CONFIG = {
    industries: BULK_INDUSTRY_CONFIGS
};
