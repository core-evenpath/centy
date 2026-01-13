/**
 * Centy Settings Schema - Main Export
 * 
 * /partner/settings
 * ├── Business Profile (business-profile-ui-schema.ts)
 * └── Modules (modules-ui-schema.ts)
 */

// Business Profile
export * from './business-profile-ui-schema';

// Industry Expertise Configs
export * from './industry-expertise-configs';

// Modules
export * from './modules-ui-schema';

// Re-export key types for convenience
export type {
    FieldConfig,
    FieldType,
    FieldOption,
    FieldValidation,
    SectionConfig,
    SubSectionConfig,
    IndustryExpertiseConfig,
    BusinessProfileConfig,
} from './business-profile-ui-schema';

export type {
    MenuItem,
    MenuCategory,
    MenuModule,
    Product,
    ProductCategory,
    ProductModule,
    ServiceItem,
    ServiceCategory,
    ServiceModule,
    RoomType,
    RoomModule,
    PropertyListing,
    PropertyModule,
    Integration,
    IntegrationStatus,
    IntegrationCredentials,
    ToolModule,
    ModulesConfig,
    ModuleConfig,
    ModuleStatus,
    SyncFieldMapping,
    IntegrationSyncConfig,
    ImportConfig,
} from './modules-ui-schema';
