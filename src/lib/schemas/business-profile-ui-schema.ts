/**
 * Business Profile UI Schema
 * 
 * This schema drives the dynamic form rendering for /partner/settings → Business Profile
 * It defines sections, fields, and industry-specific configurations.
 */

// Import all industry expertise configs
import {
    RETAIL_EXPERTISE,
    HEALTHCARE_EXPERTISE,
    EDUCATION_EXPERTISE,
    HOSPITALITY_EXPERTISE,
    REAL_ESTATE_EXPERTISE,
    SERVICES_EXPERTISE,
    BEAUTY_WELLNESS_EXPERTISE,
    FINANCE_EXPERTISE,
    TECHNOLOGY_EXPERTISE,
    AUTOMOTIVE_EXPERTISE,
    EVENTS_EXPERTISE,
    HOME_SERVICES_EXPERTISE,
    MANUFACTURING_EXPERTISE,
    OTHER_EXPERTISE,
} from './industry-expertise-configs';

// ============================================
// FIELD TYPES
// ============================================

export type FieldType =
    | 'text'
    | 'textarea'
    | 'phone'
    | 'email'
    | 'url'
    | 'number'
    | 'currency'
    | 'select'
    | 'multi-select'
    | 'tags'
    | 'toggle'
    | 'radio'
    | 'checkbox-group'
    | 'date'
    | 'time'
    | 'schedule'
    | 'address'
    | 'image'
    | 'image-gallery'
    | 'faq-list'
    | 'key-value-list'
    | 'testimonial-list'
    | 'review-list'
    | 'rich-text';

export interface FieldOption {
    value: string;
    label: string;
    icon?: string;
    description?: string;
}

export interface FieldValidation {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    patternMessage?: string;
}

export interface FieldConfig {
    key: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    helpText?: string;
    validation?: FieldValidation;
    options?: FieldOption[];
    defaultValue?: any;
    schemaPath: string;           // Maps to BusinessPersona path
    showCondition?: {             // Conditional display
        field: string;
        operator: 'equals' | 'notEquals' | 'contains' | 'notEmpty';
        value?: any;
    };
    gridSpan?: 1 | 2;             // For 2-column layouts
    aiSuggestionEnabled?: boolean; // Can AI suggest values?
    fetchable?: boolean;          // Can be auto-filled from web?
}

export interface SubSectionConfig {
    id: string;
    title: string;
    icon?: string;
    description?: string;
    fields: FieldConfig[];
    collapsible?: boolean;
    defaultExpanded?: boolean;
}

export interface SectionConfig {
    id: string;
    title: string;
    icon: string;
    description: string;
    subSections: SubSectionConfig[];
    industrySpecific?: boolean;
}

// ============================================
// SECTION 1: BRAND IDENTITY
// ============================================

export const BRAND_IDENTITY_SECTION: SectionConfig = {
    id: 'brand-identity',
    title: 'Brand Identity',
    icon: '🏢',
    description: 'Who you are - your story, values, and visual identity',
    subSections: [
        {
            id: 'basic-info',
            title: 'Basic Information',
            fields: [
                {
                    key: 'name',
                    label: 'Business Name',
                    type: 'text',
                    placeholder: 'e.g., Spice Garden Restaurant',
                    validation: { required: true, maxLength: 100 },
                    schemaPath: 'identity.name',
                    fetchable: true,
                    gridSpan: 2,
                },
                {
                    key: 'tagline',
                    label: 'Tagline',
                    type: 'text',
                    placeholder: 'e.g., Authentic flavors, unforgettable moments',
                    helpText: 'A short, memorable phrase that captures your essence',
                    validation: { maxLength: 150 },
                    schemaPath: 'personality.tagline',
                    aiSuggestionEnabled: true,
                },
                {
                    key: 'foundedYear',
                    label: 'Founded Year',
                    type: 'text',
                    placeholder: 'e.g., 2015',
                    validation: { pattern: '^\\d{4}$', patternMessage: 'Enter a valid year' },
                    schemaPath: 'identity.foundedYear',
                    fetchable: true,
                },
                {
                    key: 'description',
                    label: 'About Your Business',
                    type: 'textarea',
                    placeholder: 'Tell your story - what makes your business special, your journey, your mission...',
                    helpText: 'This is used by AI to introduce your business to customers',
                    validation: { required: true, minLength: 50, maxLength: 1000 },
                    schemaPath: 'personality.description',
                    fetchable: true,
                    aiSuggestionEnabled: true,
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'unique-value',
            title: 'What Makes You Special',
            fields: [
                {
                    key: 'usps',
                    label: 'Unique Selling Points',
                    type: 'tags',
                    placeholder: 'Add what makes you stand out...',
                    helpText: 'e.g., "Award-winning chef", "Farm-to-table ingredients", "Family recipes since 1990"',
                    schemaPath: 'personality.uniqueSellingPoints',
                    aiSuggestionEnabled: true,
                    gridSpan: 2,
                },
                {
                    key: 'languages',
                    label: 'Languages Supported',
                    type: 'tags',
                    placeholder: 'Add languages...',
                    helpText: 'Languages your team can communicate in',
                    defaultValue: ['English'],
                    schemaPath: 'personality.languagePreference',
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'visual-identity',
            title: 'Visual Identity',
            fields: [
                {
                    key: 'logo',
                    label: 'Logo',
                    type: 'image',
                    helpText: 'Recommended: Square image, at least 400x400px',
                    schemaPath: 'identity.logo',
                },
                {
                    key: 'photos',
                    label: 'Business Photos',
                    type: 'image-gallery',
                    helpText: 'Add photos of your space, products, team (max 20)',
                    schemaPath: 'identity.photos',
                    fetchable: true,
                    gridSpan: 2,
                },
            ],
        },
    ],
};

// ============================================
// SECTION 2: LOCATION & HOURS
// ============================================

export const LOCATION_HOURS_SECTION: SectionConfig = {
    id: 'location-hours',
    title: 'Location & Hours',
    icon: '📍',
    description: 'Where to find you and when you\'re available',
    subSections: [
        {
            id: 'address',
            title: 'Address',
            fields: [
                {
                    key: 'addressLine1',
                    label: 'Street Address',
                    type: 'text',
                    placeholder: 'e.g., 123 MG Road, Ground Floor',
                    validation: { required: true },
                    schemaPath: 'identity.address.street',
                    fetchable: true,
                    gridSpan: 2,
                },
                {
                    key: 'area',
                    label: 'Area / Locality',
                    type: 'text',
                    placeholder: 'e.g., Indiranagar',
                    schemaPath: 'identity.address.area',
                    fetchable: true,
                },
                {
                    key: 'city',
                    label: 'City',
                    type: 'text',
                    placeholder: 'e.g., Bangalore',
                    validation: { required: true },
                    schemaPath: 'identity.address.city',
                    fetchable: true,
                },
                {
                    key: 'state',
                    label: 'State',
                    type: 'text',
                    placeholder: 'e.g., Karnataka',
                    schemaPath: 'identity.address.state',
                    fetchable: true,
                },
                {
                    key: 'postalCode',
                    label: 'PIN Code',
                    type: 'text',
                    placeholder: 'e.g., 560038',
                    validation: { pattern: '^\\d{6}$', patternMessage: 'Enter valid 6-digit PIN' },
                    schemaPath: 'identity.address.postalCode',
                    fetchable: true,
                },
                {
                    key: 'googleMapsUrl',
                    label: 'Google Maps Link',
                    type: 'url',
                    placeholder: 'Paste your Google Maps link',
                    schemaPath: 'identity.address.googleMapsUrl',
                    fetchable: true,
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'service-coverage',
            title: 'Service Coverage',
            fields: [
                {
                    key: 'serviceAreas',
                    label: 'Areas You Serve',
                    type: 'tags',
                    placeholder: 'Add localities/areas...',
                    helpText: 'Where do you deliver or provide services?',
                    schemaPath: 'identity.serviceAreas',
                    gridSpan: 2,
                },
                {
                    key: 'deliveryRadius',
                    label: 'Delivery Radius',
                    type: 'text',
                    placeholder: 'e.g., 10 km',
                    schemaPath: 'industrySpecificData.deliveryRadius',
                },
            ],
        },
        {
            id: 'operating-hours',
            title: 'Operating Hours',
            fields: [
                {
                    key: 'isOpen24x7',
                    label: 'Open 24/7',
                    type: 'toggle',
                    schemaPath: 'identity.operatingHours.isOpen24x7',
                },
                {
                    key: 'schedule',
                    label: 'Weekly Schedule',
                    type: 'schedule',
                    helpText: 'Set your opening and closing hours for each day',
                    schemaPath: 'identity.operatingHours.schedule',
                    showCondition: { field: 'isOpen24x7', operator: 'equals', value: false },
                    gridSpan: 2,
                },
                {
                    key: 'specialNote',
                    label: 'Hours Note',
                    type: 'text',
                    placeholder: 'e.g., Kitchen closes 30 mins before closing',
                    schemaPath: 'identity.operatingHours.specialNote',
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'availability',
            title: 'Availability & Response',
            fields: [
                {
                    key: 'timezone',
                    label: 'Timezone',
                    type: 'select',
                    options: [
                        { value: 'Asia/Kolkata', label: 'India (IST)' },
                        { value: 'America/New_York', label: 'US Eastern' },
                        { value: 'America/Los_Angeles', label: 'US Pacific' },
                        { value: 'Europe/London', label: 'UK (GMT/BST)' },
                        { value: 'Asia/Dubai', label: 'UAE (GST)' },
                        { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
                    ],
                    defaultValue: 'Asia/Kolkata',
                    schemaPath: 'identity.timezone',
                },
                {
                    key: 'responseTime',
                    label: 'Response Time Commitment',
                    type: 'select',
                    options: [
                        { value: 'instant', label: 'Instant (AI handles)' },
                        { value: '1hour', label: 'Within 1 hour' },
                        { value: '2hours', label: 'Within 2 hours' },
                        { value: 'sameDay', label: 'Same day' },
                        { value: 'nextDay', label: 'Next business day' },
                    ],
                    helpText: 'How quickly do you typically respond to inquiries?',
                    schemaPath: 'personality.responseTimeExpectation',
                },
            ],
        },
    ],
};

// ============================================
// SECTION 3: EXPERTISE & SPECIALIZATIONS (Industry-Specific)
// ============================================

export interface IndustryExpertiseConfig {
    industryId: string;
    industryName: string;
    subSections: SubSectionConfig[];
}

// Food & Beverage Configuration
export const FOOD_BEVERAGE_EXPERTISE: IndustryExpertiseConfig = {
    industryId: 'food_beverage',
    industryName: 'Food & Beverage',
    subSections: [
        {
            id: 'cuisine-style',
            title: 'Cuisine & Style',
            icon: '🍽️',
            fields: [
                {
                    key: 'cuisineTypes',
                    label: 'Cuisine Types',
                    type: 'tags',
                    placeholder: 'Add cuisines...',
                    helpText: 'e.g., North Indian, Chinese, Italian, Multi-cuisine',
                    validation: { required: true },
                    schemaPath: 'restaurantInfo.cuisineTypes',
                    fetchable: true,
                    gridSpan: 2,
                },
                {
                    key: 'primaryCuisine',
                    label: 'Primary Cuisine',
                    type: 'select',
                    options: [
                        { value: 'north_indian', label: 'North Indian' },
                        { value: 'south_indian', label: 'South Indian' },
                        { value: 'chinese', label: 'Chinese' },
                        { value: 'italian', label: 'Italian' },
                        { value: 'continental', label: 'Continental' },
                        { value: 'mughlai', label: 'Mughlai' },
                        { value: 'thai', label: 'Thai' },
                        { value: 'japanese', label: 'Japanese' },
                        { value: 'mexican', label: 'Mexican' },
                        { value: 'multi_cuisine', label: 'Multi-Cuisine' },
                        { value: 'other', label: 'Other' },
                    ],
                    schemaPath: 'restaurantInfo.primaryCuisine',
                },
                {
                    key: 'diningStyle',
                    label: 'Dining Style',
                    type: 'multi-select',
                    options: [
                        { value: 'fine_dining', label: 'Fine Dining', description: 'Upscale, formal experience' },
                        { value: 'casual_dining', label: 'Casual Dining', description: 'Relaxed, mid-range' },
                        { value: 'qsr', label: 'Quick Service (QSR)', description: 'Fast food, counter service' },
                        { value: 'cafe', label: 'Café', description: 'Coffee, snacks, light meals' },
                        { value: 'bar_lounge', label: 'Bar / Lounge', description: 'Focus on drinks' },
                        { value: 'cloud_kitchen', label: 'Cloud Kitchen', description: 'Delivery only' },
                        { value: 'food_truck', label: 'Food Truck', description: 'Mobile vendor' },
                        { value: 'takeaway', label: 'Takeaway', description: 'Primarily packed food' },
                    ],
                    schemaPath: 'restaurantInfo.diningStyles',
                    fetchable: true,
                    gridSpan: 2,
                },
                {
                    key: 'ambiance',
                    label: 'Ambiance & Vibe',
                    type: 'tags',
                    placeholder: 'Describe your atmosphere...',
                    helpText: 'e.g., Family-friendly, Romantic, Rooftop, Live music, Pet-friendly',
                    schemaPath: 'industrySpecificData.ambiance',
                    aiSuggestionEnabled: true,
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'dining-experience',
            title: 'Dining Experience',
            icon: '🪑',
            fields: [
                {
                    key: 'seatingCapacity',
                    label: 'Seating Capacity',
                    type: 'number',
                    placeholder: 'e.g., 80',
                    schemaPath: 'restaurantInfo.seatingCapacity',
                    fetchable: true,
                },
                {
                    key: 'seatingTypes',
                    label: 'Seating Options',
                    type: 'checkbox-group',
                    options: [
                        { value: 'indoor', label: 'Indoor' },
                        { value: 'outdoor', label: 'Outdoor' },
                        { value: 'rooftop', label: 'Rooftop' },
                        { value: 'private_dining', label: 'Private Dining' },
                        { value: 'bar_seating', label: 'Bar Seating' },
                        { value: 'booth', label: 'Booth/Cabin' },
                    ],
                    schemaPath: 'restaurantInfo.seatingTypes',
                },
                {
                    key: 'reservationMode',
                    label: 'Reservations',
                    type: 'radio',
                    options: [
                        { value: 'required', label: 'Required' },
                        { value: 'recommended', label: 'Recommended' },
                        { value: 'walk_in', label: 'Walk-in Only' },
                        { value: 'both', label: 'Both Walk-in & Reservations' },
                    ],
                    schemaPath: 'restaurantInfo.reservationMode',
                },
                {
                    key: 'reservationLink',
                    label: 'Reservation Link',
                    type: 'url',
                    placeholder: 'e.g., Dineout, EazyDiner, or your booking page',
                    schemaPath: 'industrySpecificData.reservationLink',
                    showCondition: { field: 'reservationMode', operator: 'notEquals', value: 'walk_in' },
                },
                {
                    key: 'averageCostForTwo',
                    label: 'Average Cost for Two',
                    type: 'currency',
                    placeholder: 'e.g., 800',
                    helpText: 'Approximate cost for 2 people (without alcohol)',
                    schemaPath: 'restaurantInfo.averageCostForTwo',
                    fetchable: true,
                },
                {
                    key: 'priceRange',
                    label: 'Price Segment',
                    type: 'select',
                    options: [
                        { value: '$', label: '$ - Budget Friendly', description: 'Under ₹300 for two' },
                        { value: '$$', label: '$$ - Mid Range', description: '₹300-800 for two' },
                        { value: '$$$', label: '$$$ - Premium', description: '₹800-1500 for two' },
                        { value: '$$$$', label: '$$$$ - Luxury', description: 'Above ₹1500 for two' },
                    ],
                    schemaPath: 'restaurantInfo.priceRange',
                },
            ],
        },
        {
            id: 'dietary-policies',
            title: 'Dietary & Policies',
            icon: '🥗',
            fields: [
                {
                    key: 'pureVeg',
                    label: 'Pure Vegetarian',
                    type: 'toggle',
                    helpText: 'No non-veg items served at all',
                    schemaPath: 'restaurantInfo.pureVeg',
                    fetchable: true,
                },
                {
                    key: 'dietaryOptions',
                    label: 'Dietary Options Available',
                    type: 'checkbox-group',
                    options: [
                        { value: 'vegetarian', label: 'Vegetarian' },
                        { value: 'vegan', label: 'Vegan' },
                        { value: 'eggetarian', label: 'Eggetarian' },
                        { value: 'jain', label: 'Jain' },
                        { value: 'gluten_free', label: 'Gluten-Free' },
                        { value: 'halal', label: 'Halal' },
                        { value: 'keto', label: 'Keto-Friendly' },
                        { value: 'sugar_free', label: 'Sugar-Free' },
                    ],
                    schemaPath: 'industrySpecificData.dietaryOptions',
                    gridSpan: 2,
                },
                {
                    key: 'alcoholServed',
                    label: 'Alcohol Served',
                    type: 'toggle',
                    schemaPath: 'restaurantInfo.alcoholServed',
                    fetchable: true,
                },
                {
                    key: 'hookahAvailable',
                    label: 'Hookah Available',
                    type: 'toggle',
                    schemaPath: 'restaurantInfo.hookahAvailable',
                    showCondition: { field: 'alcoholServed', operator: 'equals', value: true },
                },
                {
                    key: 'signatureDishes',
                    label: 'Signature Dishes',
                    type: 'tags',
                    placeholder: 'Add your must-try dishes...',
                    helpText: 'Your bestsellers and chef specials',
                    schemaPath: 'industrySpecificData.signatureDishes',
                    aiSuggestionEnabled: true,
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'delivery-setup',
            title: 'Delivery & Ordering',
            icon: '🛵',
            fields: [
                {
                    key: 'homeDelivery',
                    label: 'Home Delivery Available',
                    type: 'toggle',
                    schemaPath: 'restaurantInfo.homeDelivery',
                },
                {
                    key: 'takeaway',
                    label: 'Takeaway Available',
                    type: 'toggle',
                    schemaPath: 'restaurantInfo.takeaway',
                },
                {
                    key: 'deliveryPartners',
                    label: 'Delivery Partners',
                    type: 'checkbox-group',
                    options: [
                        { value: 'zomato', label: 'Zomato' },
                        { value: 'swiggy', label: 'Swiggy' },
                        { value: 'uber_eats', label: 'Uber Eats' },
                        { value: 'dunzo', label: 'Dunzo' },
                        { value: 'own_delivery', label: 'Own Delivery Fleet' },
                    ],
                    schemaPath: 'restaurantInfo.deliveryPartners',
                    showCondition: { field: 'homeDelivery', operator: 'equals', value: true },
                    gridSpan: 2,
                },
                {
                    key: 'deliveryRadius',
                    label: 'Delivery Radius',
                    type: 'text',
                    placeholder: 'e.g., 5 km',
                    schemaPath: 'restaurantInfo.deliveryRadius',
                    showCondition: { field: 'homeDelivery', operator: 'equals', value: true },
                },
                {
                    key: 'minimumOrder',
                    label: 'Minimum Order Value',
                    type: 'currency',
                    placeholder: 'e.g., 200',
                    schemaPath: 'restaurantInfo.minimumOrder',
                    showCondition: { field: 'homeDelivery', operator: 'equals', value: true },
                },
                {
                    key: 'deliveryFee',
                    label: 'Delivery Fee',
                    type: 'currency',
                    placeholder: 'e.g., 30',
                    helpText: 'Enter 0 if free delivery',
                    schemaPath: 'restaurantInfo.deliveryFee',
                    showCondition: { field: 'homeDelivery', operator: 'equals', value: true },
                },
                {
                    key: 'freeDeliveryAbove',
                    label: 'Free Delivery Above',
                    type: 'currency',
                    placeholder: 'e.g., 500',
                    schemaPath: 'restaurantInfo.freeDeliveryAbove',
                    showCondition: { field: 'homeDelivery', operator: 'equals', value: true },
                },
                {
                    key: 'deliveryHours',
                    label: 'Delivery Hours',
                    type: 'text',
                    placeholder: 'e.g., 11 AM - 10 PM',
                    schemaPath: 'industrySpecificData.deliveryHours',
                    showCondition: { field: 'homeDelivery', operator: 'equals', value: true },
                },
                {
                    key: 'lastOrderTime',
                    label: 'Last Order Time',
                    type: 'text',
                    placeholder: 'e.g., 10:30 PM',
                    schemaPath: 'industrySpecificData.lastOrderTime',
                },
            ],
        },
        {
            id: 'special-services',
            title: 'Special Services',
            icon: '🎉',
            collapsible: true,
            defaultExpanded: false,
            fields: [
                {
                    key: 'cateringAvailable',
                    label: 'Catering Services',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.cateringAvailable',
                },
                {
                    key: 'cateringMinimum',
                    label: 'Minimum Catering Order',
                    type: 'currency',
                    placeholder: 'e.g., 5000',
                    schemaPath: 'industrySpecificData.cateringMinimum',
                    showCondition: { field: 'cateringAvailable', operator: 'equals', value: true },
                },
                {
                    key: 'partyBooking',
                    label: 'Private Party Booking',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.partyBooking',
                },
                {
                    key: 'partyCapacity',
                    label: 'Max Party Capacity',
                    type: 'number',
                    placeholder: 'e.g., 50',
                    schemaPath: 'industrySpecificData.partyCapacity',
                    showCondition: { field: 'partyBooking', operator: 'equals', value: true },
                },
                {
                    key: 'happyHours',
                    label: 'Happy Hours',
                    type: 'text',
                    placeholder: 'e.g., 4 PM - 7 PM, Mon-Thu',
                    schemaPath: 'industrySpecificData.happyHours',
                    showCondition: { field: 'alcoholServed', operator: 'equals', value: true },
                },
                {
                    key: 'liveMusic',
                    label: 'Live Music / Entertainment',
                    type: 'toggle',
                    schemaPath: 'restaurantInfo.liveMusic',
                },
                {
                    key: 'entertainmentSchedule',
                    label: 'Entertainment Schedule',
                    type: 'text',
                    placeholder: 'e.g., Live band on Fri-Sat, 8 PM',
                    schemaPath: 'industrySpecificData.entertainmentSchedule',
                    showCondition: { field: 'liveMusic', operator: 'equals', value: true },
                },
            ],
        },
    ],
};

// ============================================
// SECTION 4: AUDIENCE & POSITIONING
// ============================================

export const AUDIENCE_POSITIONING_SECTION: SectionConfig = {
    id: 'audience-positioning',
    title: 'Audience & Positioning',
    icon: '🎯',
    description: 'Who you serve and why they should choose you',
    subSections: [
        {
            id: 'target-customers',
            title: 'Target Customers',
            icon: '👥',
            fields: [
                {
                    key: 'customerType',
                    label: 'Customer Type',
                    type: 'radio',
                    options: [
                        { value: 'b2c', label: 'B2C (Individual Consumers)' },
                        { value: 'b2b', label: 'B2B (Businesses)' },
                        { value: 'both', label: 'Both B2B & B2C' },
                    ],
                    schemaPath: 'customerProfile.customerType',
                    gridSpan: 2,
                },
                {
                    key: 'primaryAudience',
                    label: 'Primary Audience',
                    type: 'tags',
                    placeholder: 'Add your main customer groups...',
                    helpText: 'e.g., Families, Young Professionals, Corporate Groups, Tourists',
                    schemaPath: 'customerProfile.primaryAudience',
                    aiSuggestionEnabled: true,
                    gridSpan: 2,
                },
                {
                    key: 'ageGroup',
                    label: 'Typical Age Group',
                    type: 'multi-select',
                    options: [
                        { value: '18-25', label: '18-25 (Gen Z)' },
                        { value: '26-35', label: '26-35 (Young Millennials)' },
                        { value: '36-45', label: '36-45 (Older Millennials)' },
                        { value: '46-55', label: '46-55 (Gen X)' },
                        { value: '55+', label: '55+ (Boomers)' },
                        { value: 'all', label: 'All Ages' },
                    ],
                    schemaPath: 'customerProfile.ageGroup',
                },
                {
                    key: 'incomeSegment',
                    label: 'Income Segment',
                    type: 'multi-select',
                    options: [
                        { value: 'budget', label: 'Budget-Conscious' },
                        { value: 'middle', label: 'Middle Income' },
                        { value: 'upper_middle', label: 'Upper Middle' },
                        { value: 'affluent', label: 'Affluent / Premium' },
                    ],
                    schemaPath: 'customerProfile.incomeSegment',
                },
            ],
        },
        {
            id: 'pain-points',
            title: 'Pain Points You Solve',
            icon: '😫',
            fields: [
                {
                    key: 'painPoints',
                    label: 'Customer Pain Points',
                    type: 'key-value-list',
                    placeholder: 'What problems do your customers face?',
                    helpText: 'AI will use these to position your solutions',
                    schemaPath: 'customerProfile.painPoints',
                    aiSuggestionEnabled: true,
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'why-choose-you',
            title: 'Why Choose You',
            icon: '💪',
            fields: [
                {
                    key: 'differentiators',
                    label: 'Key Differentiators',
                    type: 'key-value-list',
                    placeholder: 'Add differentiator and proof point...',
                    helpText: 'What makes you different + evidence to back it up',
                    schemaPath: 'customerProfile.differentiators',
                    aiSuggestionEnabled: true,
                    gridSpan: 2,
                },
                {
                    key: 'valuePropositions',
                    label: 'Value Propositions',
                    type: 'tags',
                    placeholder: 'Add your value props...',
                    helpText: 'The key benefits customers get from choosing you',
                    schemaPath: 'customerProfile.valuePropositions',
                    aiSuggestionEnabled: true,
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'objection-handlers',
            title: 'Objection Handlers',
            icon: '🤔',
            fields: [
                {
                    key: 'objections',
                    label: 'Common Objections & Responses',
                    type: 'key-value-list',
                    placeholder: 'Objection: "You\'re expensive" → Response: "We use premium..."',
                    helpText: 'AI will use these to handle customer concerns',
                    schemaPath: 'customerProfile.objectionHandlers',
                    aiSuggestionEnabled: true,
                    gridSpan: 2,
                },
            ],
        },
    ],
};

// ============================================
// SECTION 5: TRUST & SUPPORT
// ============================================

export const TRUST_SUPPORT_SECTION: SectionConfig = {
    id: 'trust-support',
    title: 'Trust & Support',
    icon: '🛡️',
    description: 'Your credentials, success stories, and how customers can reach you',
    subSections: [
        {
            id: 'credentials',
            title: 'Credentials & Licenses',
            icon: '🏆',
            fields: [
                {
                    key: 'certifications',
                    label: 'Certifications',
                    type: 'tags',
                    placeholder: 'Add certifications...',
                    helpText: 'e.g., ISO Certified, FSSAI, Organic Certified',
                    schemaPath: 'knowledge.certifications',
                    gridSpan: 2,
                },
                {
                    key: 'licenses',
                    label: 'Licenses & Registrations',
                    type: 'key-value-list',
                    placeholder: 'License type and number...',
                    helpText: 'e.g., FSSAI: 12345678901234, GST: 29ABCDE1234F1Z5',
                    schemaPath: 'industrySpecificData.registrations',
                    gridSpan: 2,
                },
                {
                    key: 'awards',
                    label: 'Awards & Recognition',
                    type: 'tags',
                    placeholder: 'Add awards...',
                    helpText: 'e.g., Times Food Award 2023, Zomato Gold Partner',
                    schemaPath: 'knowledge.awards',
                    fetchable: true,
                    gridSpan: 2,
                },
                {
                    key: 'yearsInBusiness',
                    label: 'Years in Business',
                    type: 'number',
                    placeholder: 'e.g., 8',
                    schemaPath: 'industrySpecificData.yearsInBusiness',
                },
                {
                    key: 'employeeCount',
                    label: 'Team Size',
                    type: 'select',
                    options: [
                        { value: '1-5', label: '1-5 employees' },
                        { value: '6-15', label: '6-15 employees' },
                        { value: '16-50', label: '16-50 employees' },
                        { value: '51-100', label: '51-100 employees' },
                        { value: '100+', label: '100+ employees' },
                    ],
                    schemaPath: 'industrySpecificData.employeeCount',
                },
            ],
        },
        {
            id: 'success-stories',
            title: 'Success Stories',
            icon: '📖',
            fields: [
                {
                    key: 'caseStudies',
                    label: 'Case Studies / Success Stories',
                    type: 'key-value-list',
                    placeholder: 'Title and brief description...',
                    helpText: 'Notable customer wins, transformations, or achievements',
                    schemaPath: 'knowledge.caseStudies',
                    aiSuggestionEnabled: true,
                    gridSpan: 2,
                },
                {
                    key: 'keyStats',
                    label: 'Key Statistics',
                    type: 'key-value-list',
                    placeholder: 'Stat name and value...',
                    helpText: 'e.g., "Happy Customers": "5000+", "Events Catered": "200+"',
                    schemaPath: 'knowledge.keyStats',
                    gridSpan: 2,
                },
                {
                    key: 'notableClients',
                    label: 'Notable Clients',
                    type: 'tags',
                    placeholder: 'Add client names (with permission)...',
                    schemaPath: 'industrySpecificData.notableClients',
                },
            ],
        },
        {
            id: 'faqs',
            title: 'FAQs',
            icon: '❓',
            fields: [
                {
                    key: 'faqs',
                    label: 'Frequently Asked Questions',
                    type: 'faq-list',
                    helpText: 'Add Q&A pairs. AI can suggest based on your industry.',
                    schemaPath: 'knowledge.faqs',
                    aiSuggestionEnabled: true,
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'contact-channels',
            title: 'Contact Channels',
            icon: '📞',
            fields: [
                {
                    key: 'phone',
                    label: 'Phone Number',
                    type: 'phone',
                    placeholder: '+91 98765 43210',
                    validation: { required: true },
                    schemaPath: 'identity.phone',
                    fetchable: true,
                },
                {
                    key: 'whatsapp',
                    label: 'WhatsApp Number',
                    type: 'phone',
                    placeholder: '+91 98765 43210',
                    helpText: 'Leave blank if same as phone',
                    schemaPath: 'identity.whatsAppNumber',
                },
                {
                    key: 'email',
                    label: 'Email',
                    type: 'email',
                    placeholder: 'contact@yourbusiness.com',
                    validation: { required: true },
                    schemaPath: 'identity.email',
                    fetchable: true,
                },
                {
                    key: 'website',
                    label: 'Website',
                    type: 'url',
                    placeholder: 'https://yourbusiness.com',
                    schemaPath: 'identity.website',
                    fetchable: true,
                },
                {
                    key: 'instagram',
                    label: 'Instagram',
                    type: 'text',
                    placeholder: '@yourbusiness',
                    schemaPath: 'identity.socialMedia.instagram',
                    fetchable: true,
                },
                {
                    key: 'facebook',
                    label: 'Facebook',
                    type: 'url',
                    placeholder: 'https://facebook.com/yourbusiness',
                    schemaPath: 'identity.socialMedia.facebook',
                    fetchable: true,
                },
                {
                    key: 'linkedin',
                    label: 'LinkedIn',
                    type: 'url',
                    placeholder: 'https://linkedin.com/company/yourbusiness',
                    schemaPath: 'identity.socialMedia.linkedin',
                },
                {
                    key: 'twitter',
                    label: 'Twitter / X',
                    type: 'text',
                    placeholder: '@yourbusiness',
                    schemaPath: 'identity.socialMedia.twitter',
                },
                {
                    key: 'youtube',
                    label: 'YouTube',
                    type: 'url',
                    placeholder: 'https://youtube.com/@yourbusiness',
                    schemaPath: 'identity.socialMedia.youtube',
                },
                {
                    key: 'googleBusiness',
                    label: 'Google Business Profile',
                    type: 'url',
                    placeholder: 'Your Google Maps / Business link',
                    schemaPath: 'identity.socialMedia.googleBusiness',
                    fetchable: true,
                },
            ],
        },
    ],
};

// ============================================
// SECTION 6: FROM THE WEB
// ============================================

export const FROM_THE_WEB_SECTION: SectionConfig = {
    id: 'from-the-web',
    title: 'From the Web',
    icon: '🌐',
    description: 'Reviews, testimonials, and content we found about your business online',
    subSections: [
        {
            id: 'reviews-ratings',
            title: 'Reviews & Ratings',
            icon: '⭐',
            fields: [
                {
                    key: 'reviewSummary',
                    label: 'AI Analysis',
                    type: 'rich-text',
                    helpText: 'AI-generated summary of customer sentiment',
                    schemaPath: 'webIntelligence.reviewSummary',
                    gridSpan: 2,
                },
                {
                    key: 'reviews',
                    label: 'Customer Reviews',
                    type: 'review-list',
                    helpText: 'Reviews from Google, Zomato, Swiggy, etc.',
                    schemaPath: 'webIntelligence.reviews',
                    fetchable: true,
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'testimonials',
            title: 'Testimonials',
            icon: '💬',
            fields: [
                {
                    key: 'testimonials',
                    label: 'Customer Testimonials',
                    type: 'testimonial-list',
                    helpText: 'Scraped from website + manually added',
                    schemaPath: 'webIntelligence.testimonials',
                    fetchable: true,
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'press-media',
            title: 'Press & Media',
            icon: '📰',
            fields: [
                {
                    key: 'pressMentions',
                    label: 'Press Mentions',
                    type: 'key-value-list',
                    placeholder: 'Publication: Article title or quote',
                    helpText: 'Articles, features, or mentions in media',
                    schemaPath: 'webIntelligence.pressMentions',
                    fetchable: true,
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'website-content',
            title: 'Website Content',
            icon: '🌐',
            fields: [
                {
                    key: 'scrapedContent',
                    label: 'Scraped Website Content',
                    type: 'rich-text',
                    helpText: 'Content extracted from your website',
                    schemaPath: 'webIntelligence.websiteContent',
                    fetchable: true,
                    gridSpan: 2,
                },
            ],
        },
    ],
};

// ============================================
// COMPLETE PROFILE CONFIGURATION
// ============================================

export interface BusinessProfileConfig {
    sections: SectionConfig[];
    industryExpertise: Record<string, IndustryExpertiseConfig>;
}

export const BUSINESS_PROFILE_CONFIG: BusinessProfileConfig = {
    sections: [
        BRAND_IDENTITY_SECTION,
        LOCATION_HOURS_SECTION,
        // Section 3 (Expertise) is dynamically loaded based on industry
        AUDIENCE_POSITIONING_SECTION,
        TRUST_SUPPORT_SECTION,
        FROM_THE_WEB_SECTION,
    ],
    industryExpertise: {
        food_beverage: FOOD_BEVERAGE_EXPERTISE,
        retail: RETAIL_EXPERTISE,
        healthcare: HEALTHCARE_EXPERTISE,
        education: EDUCATION_EXPERTISE,
        hospitality: HOSPITALITY_EXPERTISE,
        real_estate: REAL_ESTATE_EXPERTISE,
        services: SERVICES_EXPERTISE,
        beauty_wellness: BEAUTY_WELLNESS_EXPERTISE,
        finance: FINANCE_EXPERTISE,
        technology: TECHNOLOGY_EXPERTISE,
        automotive: AUTOMOTIVE_EXPERTISE,
        events: EVENTS_EXPERTISE,
        home_services: HOME_SERVICES_EXPERTISE,
        manufacturing: MANUFACTURING_EXPERTISE,
        other: OTHER_EXPERTISE,
    },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Map taxonomy industry IDs to expertise config keys
 * Taxonomy uses different IDs than the expertise config keys
 */
const TAXONOMY_TO_EXPERTISE_MAP: Record<string, string> = {
    // Direct mappings from taxonomy industryId to expertise key
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
    // Also support direct keys for backwards compatibility
    'finance': 'finance',
    'education': 'education',
    'healthcare': 'healthcare',
    'services': 'services',
    'retail': 'retail',
    'beauty_wellness': 'beauty_wellness',
    'automotive': 'automotive',
    'events': 'events',
    'home_services': 'home_services',
    'technology': 'technology',
    'real_estate': 'real_estate',
    'manufacturing': 'manufacturing',
    'other': 'other',
};

/**
 * Get the complete section config for a given industry
 */
export function getProfileSections(industryId: string): SectionConfig[] {
    const sections = [...BUSINESS_PROFILE_CONFIG.sections];

    // Map taxonomy industry ID to expertise config key
    const expertiseKey = TAXONOMY_TO_EXPERTISE_MAP[industryId] || industryId;

    // Insert industry-specific expertise section at position 2
    const expertiseConfig = BUSINESS_PROFILE_CONFIG.industryExpertise[expertiseKey];
    if (expertiseConfig) {
        const expertiseSection: SectionConfig = {
            id: 'expertise',
            title: 'Expertise & Specializations',
            icon: '⭐',
            description: `What makes your ${expertiseConfig.industryName} business special`,
            industrySpecific: true,
            subSections: expertiseConfig.subSections,
        };
        sections.splice(2, 0, expertiseSection);
    }

    return sections;
}

/**
 * Get all fetchable fields (for auto-fill feature)
 */
export function getFetchableFields(industryId: string): FieldConfig[] {
    const sections = getProfileSections(industryId);
    const fetchableFields: FieldConfig[] = [];

    sections.forEach(section => {
        section.subSections.forEach(subSection => {
            subSection.fields.forEach(field => {
                if (field.fetchable) {
                    fetchableFields.push(field);
                }
            });
        });
    });

    return fetchableFields;
}

/**
 * Get all AI-suggestible fields
 */
export function getAISuggestibleFields(industryId: string): FieldConfig[] {
    const sections = getProfileSections(industryId);
    const aiFields: FieldConfig[] = [];

    sections.forEach(section => {
        section.subSections.forEach(subSection => {
            subSection.fields.forEach(field => {
                if (field.aiSuggestionEnabled) {
                    aiFields.push(field);
                }
            });
        });
    });

    return aiFields;
}

/**
 * Calculate section completion percentage
 */
export function calculateSectionCompletion(
    section: SectionConfig,
    data: Record<string, any>
): number {
    let filledCount = 0;
    let totalRequired = 0;

    section.subSections.forEach(subSection => {
        subSection.fields.forEach(field => {
            if (field.validation?.required) {
                totalRequired++;
                const value = getNestedValue(data, field.schemaPath);
                if (value && (Array.isArray(value) ? value.length > 0 : true)) {
                    filledCount++;
                }
            }
        });
    });

    return totalRequired > 0 ? Math.round((filledCount / totalRequired) * 100) : 100;
}

/**
 * Helper to get nested value from object
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
}
