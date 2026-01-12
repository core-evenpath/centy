/**
 * Business Schemas - Main Export
 * 
 * Category-specific expertise schemas and module schemas.
 * 
 * Structure:
 * - Expertise Schema: Core business profile data (stored in Business Profile)
 * - Module Schema: Inventory/operational data (stored in Modules section)
 */

// Types
export * from './types';
export * from './modules';

// Category Schemas
export { default as RESTAURANT_DINING_SCHEMA } from './restaurant-dining';

// Schema Registry
import { CategorySchema } from './types';
import RESTAURANT_DINING_SCHEMA from './restaurant-dining';

/**
 * Registry of all category schemas
 */
export const CATEGORY_SCHEMAS: Record<string, CategorySchema> = {
    restaurant_dining: RESTAURANT_DINING_SCHEMA,
    // Add more category schemas here as they are created
};

/**
 * Get schema for a specific category
 */
export function getCategorySchema(categoryId: string): CategorySchema | undefined {
    return CATEGORY_SCHEMAS[categoryId];
}

/**
 * Get all available category IDs with schemas
 */
export function getAvailableCategoryIds(): string[] {
    return Object.keys(CATEGORY_SCHEMAS);
}

/**
 * Check if a category has a detailed schema defined
 */
export function hasCategorySchema(categoryId: string): boolean {
    return categoryId in CATEGORY_SCHEMAS;
}

/**
 * Category metadata for UI display
 */
export const CATEGORY_METADATA: Record<string, { label: string; icon: string; description: string }> = {
    restaurant_dining: {
        label: 'Restaurant & Dining',
        icon: 'UtensilsCrossed',
        description: 'Restaurants, cafes, cloud kitchens, and food service businesses'
    },
    retail_commerce: {
        label: 'Retail & Commerce',
        icon: 'ShoppingBag',
        description: 'Retail stores, e-commerce, and merchandise businesses'
    },
    healthcare_medical: {
        label: 'Healthcare & Medical',
        icon: 'Heart',
        description: 'Clinics, hospitals, pharmacies, and medical practices'
    },
    professional_services: {
        label: 'Professional Services',
        icon: 'Briefcase',
        description: 'Consulting, legal, accounting, and professional firms'
    },
    education_learning: {
        label: 'Education & Learning',
        icon: 'GraduationCap',
        description: 'Schools, coaching centers, and educational institutions'
    },
    beauty_wellness: {
        label: 'Beauty & Wellness',
        icon: 'Sparkles',
        description: 'Salons, spas, gyms, and wellness centers'
    },
    home_services: {
        label: 'Home Services',
        icon: 'Home',
        description: 'Repairs, cleaning, maintenance, and home improvement'
    },
    hospitality_travel: {
        label: 'Hospitality & Travel',
        icon: 'Plane',
        description: 'Hotels, travel agencies, and hospitality businesses'
    },
    automotive: {
        label: 'Automotive',
        icon: 'Car',
        description: 'Dealerships, service centers, and automotive businesses'
    },
    financial_services: {
        label: 'Financial Services',
        icon: 'Landmark',
        description: 'Banks, insurance, lending, and financial advisory'
    },
    real_estate: {
        label: 'Real Estate',
        icon: 'Building',
        description: 'Property agents, developers, and real estate services'
    },
    events_entertainment: {
        label: 'Events & Entertainment',
        icon: 'PartyPopper',
        description: 'Event planners, venues, and entertainment services'
    }
};
