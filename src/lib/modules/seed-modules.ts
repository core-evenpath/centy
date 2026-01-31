import { db as adminDb } from '@/lib/firebase-admin';
import type { SystemModule, ModuleAssignment } from './types';
import { generateModuleId, generateFieldId, generateCategoryId } from './utils';
import { DEFAULT_MODULE_SETTINGS } from './constants';

const SEED_SYSTEM_MODULES: Omit<SystemModule, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsedAt' | 'schemaHistory' | 'migrations' | 'currentVersion'>[] = [
    {
        slug: 'room_inventory',
        name: 'Room Inventory',
        description: 'Manage hotel rooms, suites, and accommodations',
        icon: '🛏️',
        color: 'blue',
        itemLabel: 'Room',
        itemLabelPlural: 'Rooms',
        priceLabel: 'Rate',
        priceType: 'per_night',
        defaultCurrency: 'INR',
        applicableIndustries: ['hospitality'],
        applicableFunctions: ['hotels', 'resorts', 'hostels', 'homestays', 'serviced_apartments'],
        status: 'active',
        settings: {
            ...DEFAULT_MODULE_SETTINGS,
            requiresImage: true,
            maxItems: 500,
        },
        createdBy: 'system',
        schema: {
            fields: [
                { id: 'bed_type', name: 'Bed Type', type: 'select', description: 'Type of bed configuration', isRequired: true, isSearchable: true, showInList: true, showInCard: true, options: ['Single', 'Double', 'Queen', 'King', 'Twin', 'Bunk'], order: 1 },
                { id: 'room_size', name: 'Room Size (sq ft)', type: 'number', description: 'Room area in square feet', isRequired: false, isSearchable: true, showInList: true, showInCard: false, placeholder: '350', order: 2 },
                { id: 'max_occupancy', name: 'Max Occupancy', type: 'number', description: 'Maximum number of guests', isRequired: true, isSearchable: true, showInList: true, showInCard: true, defaultValue: 2, order: 3 },
                { id: 'view_type', name: 'View', type: 'select', description: 'Room view type', isRequired: false, isSearchable: true, showInList: false, showInCard: true, options: ['City', 'Ocean', 'Garden', 'Pool', 'Mountain', 'No View'], order: 4 },
                { id: 'amenities', name: 'Amenities', type: 'multi_select', description: 'Room amenities', isRequired: false, isSearchable: true, showInList: false, showInCard: false, options: ['AC', 'WiFi', 'TV', 'Mini Bar', 'Safe', 'Balcony', 'Bathtub', 'Workspace', 'Coffee Maker', 'Room Service'], order: 5 },
                { id: 'floor_number', name: 'Floor', type: 'number', description: 'Floor number', isRequired: false, isSearchable: false, showInList: true, showInCard: false, order: 6 },
                { id: 'is_smoking', name: 'Smoking Allowed', type: 'toggle', description: 'Is smoking permitted', isRequired: false, isSearchable: true, showInList: false, showInCard: false, defaultValue: false, order: 7 },
                { id: 'accessibility', name: 'Wheelchair Accessible', type: 'toggle', description: 'Accessible for wheelchairs', isRequired: false, isSearchable: true, showInList: false, showInCard: false, defaultValue: false, order: 8 },
                { id: 'check_in_time', name: 'Check-in Time', type: 'time', description: 'Earliest check-in time', isRequired: false, isSearchable: false, showInList: false, showInCard: false, defaultValue: '14:00', order: 9 },
                { id: 'check_out_time', name: 'Check-out Time', type: 'time', description: 'Latest check-out time', isRequired: false, isSearchable: false, showInList: false, showInCard: false, defaultValue: '11:00', order: 10 },
            ],
            categories: [
                { id: 'standard', name: 'Standard', icon: '🛏️', description: 'Basic comfortable rooms', color: 'slate', order: 1 },
                { id: 'deluxe', name: 'Deluxe', icon: '✨', description: 'Enhanced rooms with extra amenities', color: 'blue', order: 2 },
                { id: 'suite', name: 'Suite', icon: '🏰', description: 'Spacious suites with living area', color: 'purple', order: 3 },
                { id: 'presidential', name: 'Presidential', icon: '👑', description: 'Luxury top-tier suites', color: 'amber', order: 4 },
                { id: 'villa', name: 'Villa', icon: '🏡', description: 'Independent villa accommodations', color: 'emerald', order: 5 },
                { id: 'family', name: 'Family Room', icon: '👨👩👧👦', description: 'Rooms suitable for families', color: 'orange', order: 6 },
            ],
        },
    },
    {
        slug: 'food_menu',
        name: 'Food Menu',
        description: 'Manage restaurant menu items, dishes, and beverages',
        icon: '🍽️',
        color: 'orange',
        itemLabel: 'Item',
        itemLabelPlural: 'Menu Items',
        priceLabel: 'Price',
        priceType: 'one_time',
        defaultCurrency: 'INR',
        applicableIndustries: ['food_beverage', 'hospitality'],
        applicableFunctions: ['restaurants', 'cafes', 'bars', 'cloud_kitchens', 'food_trucks', 'hotels', 'resorts'],
        status: 'active',
        settings: {
            ...DEFAULT_MODULE_SETTINGS,
            requiresImage: true,
            enableVariants: true,
            maxItems: 500,
        },
        createdBy: 'system',
        schema: {
            fields: [
                { id: 'is_veg', name: 'Vegetarian', type: 'toggle', description: 'Is this a vegetarian item', isRequired: true, isSearchable: true, showInList: true, showInCard: true, defaultValue: false, order: 1 },
                { id: 'is_vegan', name: 'Vegan', type: 'toggle', description: 'Is this vegan', isRequired: false, isSearchable: true, showInList: false, showInCard: false, defaultValue: false, order: 2 },
                { id: 'spice_level', name: 'Spice Level', type: 'select', description: 'How spicy is this dish', isRequired: false, isSearchable: true, showInList: true, showInCard: true, options: ['Not Spicy', 'Mild', 'Medium', 'Hot', 'Extra Hot'], order: 3 },
                { id: 'prep_time', name: 'Prep Time (mins)', type: 'number', description: 'Preparation time in minutes', isRequired: false, isSearchable: false, showInList: true, showInCard: false, placeholder: '15', order: 4 },
                { id: 'calories', name: 'Calories', type: 'number', description: 'Calorie count', isRequired: false, isSearchable: false, showInList: false, showInCard: false, order: 5 },
                { id: 'serving_size', name: 'Serving Size', type: 'select', description: 'Portion size', isRequired: false, isSearchable: true, showInList: true, showInCard: false, options: ['Small', 'Regular', 'Large', 'Family'], order: 6 },
                { id: 'allergens', name: 'Allergens', type: 'multi_select', description: 'Contains allergens', isRequired: false, isSearchable: true, showInList: false, showInCard: false, options: ['Gluten', 'Dairy', 'Nuts', 'Eggs', 'Soy', 'Shellfish', 'Fish'], order: 7 },
                { id: 'cuisine', name: 'Cuisine', type: 'select', description: 'Cuisine type', isRequired: false, isSearchable: true, showInList: false, showInCard: false, options: ['Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Japanese', 'Continental', 'Fusion'], order: 8 },
                { id: 'is_popular', name: 'Popular', type: 'toggle', description: 'Mark as popular/bestseller', isRequired: false, isSearchable: false, showInList: true, showInCard: true, defaultValue: false, order: 9 },
                { id: 'available_time', name: 'Available', type: 'select', description: 'When is this available', isRequired: false, isSearchable: false, showInList: false, showInCard: false, options: ['All Day', 'Breakfast', 'Lunch', 'Dinner', 'Late Night'], defaultValue: 'All Day', order: 10 },
            ],
            categories: [
                { id: 'appetizers', name: 'Appetizers', icon: '🥗', description: 'Starters and small plates', color: 'green', order: 1 },
                { id: 'main_course', name: 'Main Course', icon: '🍛', description: 'Main dishes and entrees', color: 'orange', order: 2 },
                { id: 'desserts', name: 'Desserts', icon: '🍰', description: 'Sweet treats and desserts', color: 'pink', order: 3 },
                { id: 'beverages', name: 'Beverages', icon: '🥤', description: 'Drinks and refreshments', color: 'blue', order: 4 },
                { id: 'specials', name: 'Chef Specials', icon: '⭐', description: 'Special recommendations', color: 'amber', order: 5 },
                { id: 'sides', name: 'Sides', icon: '🍟', description: 'Side dishes and accompaniments', color: 'slate', order: 6 },
                { id: 'combos', name: 'Combos', icon: '🎁', description: 'Meal combos and deals', color: 'purple', order: 7 },
            ],
        },
    },
    {
        slug: 'service_catalog',
        name: 'Service Catalog',
        description: 'Manage professional services, appointments, and consultations',
        icon: '💼',
        color: 'purple',
        itemLabel: 'Service',
        itemLabelPlural: 'Services',
        priceLabel: 'Fee',
        priceType: 'per_session',
        defaultCurrency: 'INR',
        applicableIndustries: ['business_professional', 'healthcare_medical', 'personal_wellness', 'education_learning'],
        applicableFunctions: ['consultants', 'lawyers', 'accountants', 'clinics', 'salons', 'spas', 'tutoring', 'coaching'],
        status: 'active',
        settings: {
            ...DEFAULT_MODULE_SETTINGS,
            requiresImage: false,
            maxItems: 200,
        },
        createdBy: 'system',
        schema: {
            fields: [
                { id: 'duration', name: 'Duration (mins)', type: 'duration', description: 'Service duration', isRequired: true, isSearchable: true, showInList: true, showInCard: true, defaultValue: 60, order: 1 },
                { id: 'service_mode', name: 'Service Mode', type: 'multi_select', description: 'How service is delivered', isRequired: true, isSearchable: true, showInList: true, showInCard: false, options: ['In-Person', 'Online', 'Phone', 'Home Visit'], order: 2 },
                { id: 'staff_required', name: 'Staff Required', type: 'number', description: 'Number of staff needed', isRequired: false, isSearchable: false, showInList: false, showInCard: false, defaultValue: 1, order: 3 },
                { id: 'advance_booking', name: 'Advance Booking (days)', type: 'number', description: 'Minimum days to book in advance', isRequired: false, isSearchable: false, showInList: false, showInCard: false, defaultValue: 0, order: 4 },
                { id: 'cancellation_policy', name: 'Cancellation Policy', type: 'select', description: 'Cancellation terms', isRequired: false, isSearchable: false, showInList: false, showInCard: false, options: ['Free Cancellation', '24hr Notice', '48hr Notice', 'No Refund'], order: 5 },
                { id: 'target_audience', name: 'Target Audience', type: 'multi_select', description: 'Who is this service for', isRequired: false, isSearchable: true, showInList: false, showInCard: false, options: ['Individuals', 'Couples', 'Families', 'Businesses', 'Seniors', 'Children'], order: 6 },
                { id: 'prerequisites', name: 'Prerequisites', type: 'textarea', description: 'What client should know/bring', isRequired: false, isSearchable: false, showInList: false, showInCard: false, order: 7 },
                { id: 'follow_up_required', name: 'Follow-up Required', type: 'toggle', description: 'Does this need follow-up', isRequired: false, isSearchable: false, showInList: false, showInCard: false, defaultValue: false, order: 8 },
            ],
            categories: [
                { id: 'consultation', name: 'Consultation', icon: '💬', description: 'Advisory and consultation services', color: 'blue', order: 1 },
                { id: 'treatment', name: 'Treatment', icon: '💆', description: 'Treatment and therapy services', color: 'green', order: 2 },
                { id: 'training', name: 'Training', icon: '📚', description: 'Training and education services', color: 'purple', order: 3 },
                { id: 'assessment', name: 'Assessment', icon: '📋', description: 'Evaluation and assessment services', color: 'orange', order: 4 },
                { id: 'packages', name: 'Packages', icon: '📦', description: 'Bundled service packages', color: 'amber', order: 5 },
            ],
        },
    },
    {
        slug: 'product_catalog',
        name: 'Product Catalog',
        description: 'Manage retail products, inventory, and merchandise',
        icon: '🛒',
        color: 'emerald',
        itemLabel: 'Product',
        itemLabelPlural: 'Products',
        priceLabel: 'Price',
        priceType: 'one_time',
        defaultCurrency: 'INR',
        applicableIndustries: ['retail_commerce'],
        applicableFunctions: ['retail_stores', 'ecommerce', 'wholesale', 'distributors'],
        status: 'active',
        settings: {
            ...DEFAULT_MODULE_SETTINGS,
            requiresImage: true,
            enableVariants: true,
            enableInventoryTracking: true,
            maxItems: 5000,
        },
        createdBy: 'system',
        schema: {
            fields: [
                { id: 'sku', name: 'SKU', type: 'text', description: 'Stock keeping unit', isRequired: false, isSearchable: true, showInList: true, showInCard: false, placeholder: 'PRD-001', order: 1 },
                { id: 'brand', name: 'Brand', type: 'text', description: 'Product brand', isRequired: false, isSearchable: true, showInList: true, showInCard: true, order: 2 },
                { id: 'stock_quantity', name: 'Stock', type: 'number', description: 'Available quantity', isRequired: false, isSearchable: false, showInList: true, showInCard: false, defaultValue: 0, order: 3 },
                { id: 'weight', name: 'Weight (g)', type: 'number', description: 'Product weight in grams', isRequired: false, isSearchable: false, showInList: false, showInCard: false, order: 4 },
                { id: 'dimensions', name: 'Dimensions', type: 'text', description: 'L x W x H in cm', isRequired: false, isSearchable: false, showInList: false, showInCard: false, placeholder: '10 x 5 x 3', order: 5 },
                { id: 'material', name: 'Material', type: 'text', description: 'Primary material', isRequired: false, isSearchable: true, showInList: false, showInCard: false, order: 6 },
                { id: 'warranty', name: 'Warranty', type: 'select', description: 'Warranty period', isRequired: false, isSearchable: true, showInList: false, showInCard: false, options: ['No Warranty', '6 Months', '1 Year', '2 Years', '3 Years', 'Lifetime'], order: 7 },
                { id: 'is_new', name: 'New Arrival', type: 'toggle', description: 'Mark as new arrival', isRequired: false, isSearchable: false, showInList: true, showInCard: true, defaultValue: false, order: 8 },
                { id: 'is_bestseller', name: 'Bestseller', type: 'toggle', description: 'Mark as bestseller', isRequired: false, isSearchable: false, showInList: true, showInCard: true, defaultValue: false, order: 9 },
                { id: 'tags', name: 'Tags', type: 'tags', description: 'Product tags for search', isRequired: false, isSearchable: true, showInList: false, showInCard: false, order: 10 },
            ],
            categories: [
                { id: 'featured', name: 'Featured', icon: '⭐', description: 'Featured products', color: 'amber', order: 1 },
                { id: 'new_arrivals', name: 'New Arrivals', icon: '🆕', description: 'Recently added products', color: 'blue', order: 2 },
                { id: 'bestsellers', name: 'Bestsellers', icon: '🔥', description: 'Top selling products', color: 'orange', order: 3 },
                { id: 'sale', name: 'On Sale', icon: '🏷️', description: 'Discounted products', color: 'red', order: 4 },
                { id: 'clearance', name: 'Clearance', icon: '📤', description: 'Clearance items', color: 'slate', order: 5 },
            ],
        },
    },
];

const SEED_MODULE_ASSIGNMENTS: Omit<ModuleAssignment, 'createdAt' | 'updatedAt' | 'updatedBy'>[] = [
    { id: 'hospitality_hotels', industryId: 'hospitality', functionId: 'hotels', industryName: 'Hospitality', functionName: 'Hotels', modules: [{ moduleSlug: 'room_inventory', isRequired: true, isDefault: true, order: 1 }, { moduleSlug: 'food_menu', isRequired: false, isDefault: false, order: 2 }] },
    { id: 'hospitality_resorts', industryId: 'hospitality', functionId: 'resorts', industryName: 'Hospitality', functionName: 'Resorts', modules: [{ moduleSlug: 'room_inventory', isRequired: true, isDefault: true, order: 1 }, { moduleSlug: 'food_menu', isRequired: false, isDefault: true, order: 2 }, { moduleSlug: 'service_catalog', isRequired: false, isDefault: false, order: 3 }] },
    { id: 'food_beverage_restaurants', industryId: 'food_beverage', functionId: 'restaurants', industryName: 'Food & Beverage', functionName: 'Restaurants', modules: [{ moduleSlug: 'food_menu', isRequired: true, isDefault: true, order: 1 }] },
    { id: 'food_beverage_cafes', industryId: 'food_beverage', functionId: 'cafes', industryName: 'Food & Beverage', functionName: 'Cafes', modules: [{ moduleSlug: 'food_menu', isRequired: true, isDefault: true, order: 1 }] },
    { id: 'business_professional_consultants', industryId: 'business_professional', functionId: 'consultants', industryName: 'Business & Professional', functionName: 'Consultants', modules: [{ moduleSlug: 'service_catalog', isRequired: true, isDefault: true, order: 1 }] },
    { id: 'healthcare_medical_clinics', industryId: 'healthcare_medical', functionId: 'clinics', industryName: 'Healthcare & Medical', functionName: 'Clinics', modules: [{ moduleSlug: 'service_catalog', isRequired: true, isDefault: true, order: 1 }] },
    { id: 'personal_wellness_salons', industryId: 'personal_wellness', functionId: 'salons', industryName: 'Personal & Wellness', functionName: 'Salons', modules: [{ moduleSlug: 'service_catalog', isRequired: true, isDefault: true, order: 1 }, { moduleSlug: 'product_catalog', isRequired: false, isDefault: false, order: 2 }] },
    { id: 'retail_commerce_retail_stores', industryId: 'retail_commerce', functionId: 'retail_stores', industryName: 'Retail & Commerce', functionName: 'Retail Stores', modules: [{ moduleSlug: 'product_catalog', isRequired: true, isDefault: true, order: 1 }] },
    { id: 'retail_commerce_ecommerce', industryId: 'retail_commerce', functionId: 'ecommerce', industryName: 'Retail & Commerce', functionName: 'E-commerce', modules: [{ moduleSlug: 'product_catalog', isRequired: true, isDefault: true, order: 1 }] },
];

export async function seedSystemModules(): Promise<{ success: boolean; created: number; skipped: number; error?: string }> {
    try {
        const batch = adminDb.batch();
        let created = 0;
        let skipped = 0;
        const now = new Date().toISOString();

        for (const moduleData of SEED_SYSTEM_MODULES) {
            const existingSnapshot = await adminDb
                .collection('systemModules')
                .where('slug', '==', moduleData.slug)
                .limit(1)
                .get();

            if (!existingSnapshot.empty) {
                skipped++;
                continue;
            }

            const moduleId = generateModuleId();

            const fullModule: SystemModule = {
                ...moduleData,
                id: moduleId,
                currentVersion: 1,
                schemaHistory: {
                    1: {
                        version: 1,
                        fields: moduleData.schema.fields,
                        categories: moduleData.schema.categories,
                        generatedAt: now,
                        generatedBy: 'manual',
                        status: 'active',
                    }
                },
                migrations: {},
                usageCount: 0,
                createdAt: now,
                updatedAt: now,
            };

            batch.set(adminDb.collection('systemModules').doc(moduleId), fullModule);
            created++;
        }

        await batch.commit();

        return { success: true, created, skipped };
    } catch (error) {
        console.error('Error seeding system modules:', error);
        return { success: false, created: 0, skipped: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function seedModuleAssignments(): Promise<{ success: boolean; created: number; skipped: number; error?: string }> {
    try {
        const batch = adminDb.batch();
        let created = 0;
        let skipped = 0;
        const now = new Date().toISOString();

        const assignmentsRef = adminDb.collection('systemTaxonomy').doc('moduleAssignments').collection('items');

        for (const assignment of SEED_MODULE_ASSIGNMENTS) {
            const existingDoc = await assignmentsRef.doc(assignment.id).get();

            if (existingDoc.exists) {
                skipped++;
                continue;
            }

            const fullAssignment: ModuleAssignment = {
                ...assignment,
                createdAt: now,
                updatedAt: now,
                updatedBy: 'system',
            };

            batch.set(assignmentsRef.doc(assignment.id), fullAssignment);
            created++;
        }

        await batch.commit();

        return { success: true, created, skipped };
    } catch (error) {
        console.error('Error seeding module assignments:', error);
        return { success: false, created: 0, skipped: 0, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function seedAllModuleData(): Promise<{
    success: boolean;
    modules: { created: number; skipped: number };
    assignments: { created: number; skipped: number };
    error?: string;
}> {
    const modulesResult = await seedSystemModules();

    if (!modulesResult.success) {
        return {
            success: false,
            modules: { created: 0, skipped: 0 },
            assignments: { created: 0, skipped: 0 },
            error: modulesResult.error,
        };
    }

    const assignmentsResult = await seedModuleAssignments();

    return {
        success: assignmentsResult.success,
        modules: { created: modulesResult.created, skipped: modulesResult.skipped },
        assignments: { created: assignmentsResult.created, skipped: assignmentsResult.skipped },
        error: assignmentsResult.error,
    };
}
