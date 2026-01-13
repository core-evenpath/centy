/**
 * Unified Inventory Types
 * Supports both AutoFill (Google Places) and AI-Generated inventory
 */

// ===== FIELD DEFINITIONS =====
export interface InventoryFieldDefinition {
    id: string;
    name: string;
    type: 'text' | 'number' | 'select' | 'toggle' | 'tags' | 'textarea' | 'image' | 'date' | 'time';
    description?: string;
    isRequired: boolean;
    placeholder?: string;
    options?: string[]; // For select type
    defaultValue?: string | number | boolean;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
    };
}

// ===== CATEGORY DEFINITIONS =====
export interface InventoryCategoryDefinition {
    id: string;
    name: string;
    icon?: string;
    description?: string;
    color?: string;
}

// ===== INVENTORY ITEM =====
export interface InventoryItem {
    id: string;
    name: string;
    description?: string;
    category: string;
    price: number;
    currency: string;
    image?: string;

    // Dynamic fields based on schema
    fields: Record<string, any>;

    // Metadata
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
    source: 'autofill' | 'ai_generated' | 'manual';
}

// ===== INVENTORY CONFIGURATION =====
export interface InventoryConfig {
    // Labels (customized per industry)
    itemLabel: string;           // "Menu Item", "Product", "Room", "Service"
    itemLabelPlural: string;     // "Menu Items", "Products", "Rooms", "Services"
    priceLabel: string;          // "Price", "Rate", "Fee", "Rent"
    currency: string;            // "INR", "USD"

    // Schema
    fields: InventoryFieldDefinition[];
    categories: InventoryCategoryDefinition[];

    // Items
    items: InventoryItem[];

    // Metadata
    source: 'autofill' | 'ai_generated' | 'manual' | 'hybrid';
    industryId?: string;
    functionId?: string;
    generatedAt?: string;
    lastModifiedAt?: string;
}

// ===== INTEGRATION CONFIG =====
export interface IntegrationPlatform {
    id: string;
    name: string;
    description: string;
    category: 'delivery' | 'pos' | 'booking' | 'payment' | 'marketing' | 'communication';
    icon?: string;
    isConnected: boolean;
    config?: Record<string, any>;
}

export interface IntegrationsConfig {
    platforms: IntegrationPlatform[];
    lastUpdatedAt?: string;
}

// ===== AI TOOLS CONFIG =====
export interface AITool {
    id: string;
    name: string;
    description: string;
    useCase: string;
    category: 'automation' | 'analytics' | 'customer' | 'operations';
    isEnabled: boolean;
    config?: Record<string, any>;
}

export interface AIToolsConfig {
    tools: AITool[];
    lastUpdatedAt?: string;
}

// ===== COMPLETE MODULES CONFIG =====
export interface ModulesConfig {
    inventory: InventoryConfig | null;
    integrations: IntegrationsConfig | null;
    aiTools: AIToolsConfig | null;

    // Metadata
    generatedAt?: string;
    lastModifiedAt?: string;
}

// ===== HELPER FUNCTIONS =====

/**
 * Create an empty inventory config for a business type
 */
export function createEmptyInventoryConfig(
    itemLabel: string = 'Item',
    priceLabel: string = 'Price',
    currency: string = 'INR'
): InventoryConfig {
    return {
        itemLabel,
        itemLabelPlural: itemLabel + 's',
        priceLabel,
        currency,
        fields: [
            { id: 'name', name: 'Name', type: 'text', isRequired: true },
            { id: 'description', name: 'Description', type: 'textarea', isRequired: false },
            { id: 'price', name: priceLabel, type: 'number', isRequired: true },
        ],
        categories: [
            { id: 'uncategorized', name: 'Uncategorized' }
        ],
        items: [],
        source: 'manual',
        generatedAt: new Date().toISOString(),
    };
}

/**
 * Generate a unique ID for new items
 */
export function generateItemId(): string {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new inventory item with defaults
 */
export function createInventoryItem(
    name: string,
    category: string,
    price: number,
    source: 'autofill' | 'ai_generated' | 'manual' = 'manual'
): InventoryItem {
    const now = new Date().toISOString();
    return {
        id: generateItemId(),
        name,
        category,
        price,
        currency: 'INR',
        fields: {},
        isActive: true,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
        source,
    };
}

/**
 * Map legacy persona data to unified inventory config
 */
export function mapLegacyToInventoryConfig(
    persona: any,
    industryId?: string
): InventoryConfig | null {
    // Detect what type of inventory data exists
    const menuItems = persona.menuItems || persona.industrySpecificData?.menuItems;
    const roomTypes = persona.roomTypes || persona.industrySpecificData?.rooms;
    const products = persona.productCatalog || persona.industrySpecificData?.products;
    const services = persona.healthcareServices || persona.industrySpecificData?.services;
    const properties = persona.propertyListings || persona.industrySpecificData?.properties;

    if (menuItems?.length > 0) {
        return mapMenuItemsToConfig(menuItems);
    }
    if (roomTypes?.length > 0) {
        return mapRoomTypesToConfig(roomTypes);
    }
    if (products?.length > 0) {
        return mapProductsToConfig(products);
    }
    if (services?.length > 0) {
        return mapServicesToConfig(services);
    }
    if (properties?.length > 0) {
        return mapPropertiesToConfig(properties);
    }

    return null;
}

// ===== MAPPERS FOR LEGACY DATA =====

function mapMenuItemsToConfig(menuItems: any[]): InventoryConfig {
    const categories = new Set<string>();
    const items: InventoryItem[] = menuItems.map((item, index) => {
        const cat = item.category || 'Uncategorized';
        categories.add(cat);
        return {
            id: item.id || generateItemId(),
            name: item.name,
            description: item.description,
            category: cat,
            price: item.price || 0,
            currency: 'INR',
            image: item.image,
            fields: {
                isVeg: item.isVeg,
                spiceLevel: item.spiceLevel,
                popular: item.popular,
                prepTime: item.prepTime,
            },
            isActive: true,
            sortOrder: index,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'autofill' as const,
        };
    });

    return {
        itemLabel: 'Menu Item',
        itemLabelPlural: 'Menu Items',
        priceLabel: 'Price',
        currency: 'INR',
        fields: [
            { id: 'name', name: 'Name', type: 'text', isRequired: true },
            { id: 'description', name: 'Description', type: 'textarea', isRequired: false },
            { id: 'price', name: 'Price', type: 'number', isRequired: true },
            { id: 'isVeg', name: 'Vegetarian', type: 'toggle', isRequired: false },
            { id: 'spiceLevel', name: 'Spice Level', type: 'select', isRequired: false, options: ['Mild', 'Medium', 'Hot', 'Extra Hot'] },
            { id: 'prepTime', name: 'Prep Time (mins)', type: 'number', isRequired: false },
            { id: 'popular', name: 'Popular', type: 'toggle', isRequired: false },
        ],
        categories: Array.from(categories).map(name => ({ id: name.toLowerCase().replace(/\s+/g, '_'), name })),
        items,
        source: 'autofill',
        generatedAt: new Date().toISOString(),
    };
}

function mapRoomTypesToConfig(rooms: any[]): InventoryConfig {
    const categories = new Set<string>();
    const items: InventoryItem[] = rooms.map((room, index) => {
        const cat = room.category || room.bedType || 'Standard';
        categories.add(cat);
        return {
            id: room.id || generateItemId(),
            name: room.name,
            description: room.description,
            category: cat,
            price: room.price || 0,
            currency: 'INR',
            image: room.image,
            fields: {
                maxOccupancy: room.maxOccupancy,
                bedType: room.bedType,
                size: room.size,
                view: room.view,
                amenities: room.amenities,
            },
            isActive: true,
            sortOrder: index,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'autofill' as const,
        };
    });

    return {
        itemLabel: 'Room Type',
        itemLabelPlural: 'Room Types',
        priceLabel: 'Rate',
        currency: 'INR',
        fields: [
            { id: 'name', name: 'Room Name', type: 'text', isRequired: true },
            { id: 'description', name: 'Description', type: 'textarea', isRequired: false },
            { id: 'price', name: 'Rate per Night', type: 'number', isRequired: true },
            { id: 'maxOccupancy', name: 'Max Occupancy', type: 'number', isRequired: false },
            { id: 'bedType', name: 'Bed Type', type: 'select', isRequired: false, options: ['Single', 'Double', 'Queen', 'King', 'Twin'] },
            { id: 'size', name: 'Room Size (sq ft)', type: 'number', isRequired: false },
            { id: 'view', name: 'View', type: 'text', isRequired: false },
            { id: 'amenities', name: 'Amenities', type: 'tags', isRequired: false },
        ],
        categories: Array.from(categories).map(name => ({ id: name.toLowerCase().replace(/\s+/g, '_'), name })),
        items,
        source: 'autofill',
        generatedAt: new Date().toISOString(),
    };
}

function mapProductsToConfig(products: any[]): InventoryConfig {
    const categories = new Set<string>();
    const items: InventoryItem[] = products.map((product, index) => {
        const cat = product.category || 'General';
        categories.add(cat);
        return {
            id: product.id || generateItemId(),
            name: product.name,
            description: product.description,
            category: cat,
            price: product.price || 0,
            currency: 'INR',
            image: product.image,
            fields: {
                brand: product.brand,
                sku: product.sku,
                mrp: product.mrp,
                stock: product.stock,
            },
            isActive: true,
            sortOrder: index,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'autofill' as const,
        };
    });

    return {
        itemLabel: 'Product',
        itemLabelPlural: 'Products',
        priceLabel: 'Price',
        currency: 'INR',
        fields: [
            { id: 'name', name: 'Product Name', type: 'text', isRequired: true },
            { id: 'description', name: 'Description', type: 'textarea', isRequired: false },
            { id: 'price', name: 'Price', type: 'number', isRequired: true },
            { id: 'mrp', name: 'MRP', type: 'number', isRequired: false },
            { id: 'brand', name: 'Brand', type: 'text', isRequired: false },
            { id: 'sku', name: 'SKU', type: 'text', isRequired: false },
            { id: 'stock', name: 'Stock', type: 'number', isRequired: false },
        ],
        categories: Array.from(categories).map(name => ({ id: name.toLowerCase().replace(/\s+/g, '_'), name })),
        items,
        source: 'autofill',
        generatedAt: new Date().toISOString(),
    };
}

function mapServicesToConfig(services: any[]): InventoryConfig {
    const categories = new Set<string>();
    const items: InventoryItem[] = services.map((service, index) => {
        const cat = service.category || service.specialization || 'General';
        categories.add(cat);
        return {
            id: service.id || generateItemId(),
            name: service.name,
            description: service.description,
            category: cat,
            price: service.price || service.fee || 0,
            currency: 'INR',
            fields: {
                duration: service.duration,
                doctor: service.doctor,
                specialization: service.specialization,
            },
            isActive: true,
            sortOrder: index,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'autofill' as const,
        };
    });

    return {
        itemLabel: 'Service',
        itemLabelPlural: 'Services',
        priceLabel: 'Fee',
        currency: 'INR',
        fields: [
            { id: 'name', name: 'Service Name', type: 'text', isRequired: true },
            { id: 'description', name: 'Description', type: 'textarea', isRequired: false },
            { id: 'price', name: 'Fee', type: 'number', isRequired: true },
            { id: 'duration', name: 'Duration', type: 'text', isRequired: false },
            { id: 'doctor', name: 'Doctor/Provider', type: 'text', isRequired: false },
        ],
        categories: Array.from(categories).map(name => ({ id: name.toLowerCase().replace(/\s+/g, '_'), name })),
        items,
        source: 'autofill',
        generatedAt: new Date().toISOString(),
    };
}

function mapPropertiesToConfig(properties: any[]): InventoryConfig {
    const categories = new Set<string>();
    const items: InventoryItem[] = properties.map((property, index) => {
        const cat = property.type || property.category || 'Residential';
        categories.add(cat);
        return {
            id: property.id || generateItemId(),
            name: property.title || property.name,
            description: property.description,
            category: cat,
            price: property.price || 0,
            currency: 'INR',
            image: property.image,
            fields: {
                location: property.location,
                size: property.size,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                status: property.status,
            },
            isActive: true,
            sortOrder: index,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            source: 'autofill' as const,
        };
    });

    return {
        itemLabel: 'Property',
        itemLabelPlural: 'Properties',
        priceLabel: 'Price',
        currency: 'INR',
        fields: [
            { id: 'name', name: 'Property Title', type: 'text', isRequired: true },
            { id: 'description', name: 'Description', type: 'textarea', isRequired: false },
            { id: 'price', name: 'Price', type: 'number', isRequired: true },
            { id: 'location', name: 'Location', type: 'text', isRequired: false },
            { id: 'size', name: 'Size (sq ft)', type: 'number', isRequired: false },
            { id: 'bedrooms', name: 'Bedrooms', type: 'number', isRequired: false },
            { id: 'bathrooms', name: 'Bathrooms', type: 'number', isRequired: false },
            { id: 'status', name: 'Status', type: 'select', isRequired: false, options: ['Available', 'Sold', 'Under Offer'] },
        ],
        categories: Array.from(categories).map(name => ({ id: name.toLowerCase().replace(/\s+/g, '_'), name })),
        items,
        source: 'autofill',
        generatedAt: new Date().toISOString(),
    };
}
