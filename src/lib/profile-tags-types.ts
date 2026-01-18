// Extended tag categories for comprehensive business categorization
export type TagCategory =
    | 'industry'      // Core industry/vertical
    | 'service'       // Services offered
    | 'product'       // Product types
    | 'specialty'     // Specialized expertise
    | 'audience'      // Target customers
    | 'location'      // Geographic coverage
    | 'feature'       // Key features/capabilities
    | 'benefit'       // Customer benefits
    | 'pricing'       // Pricing model/tier
    | 'quality'       // Quality indicators
    | 'experience'    // Years/level of experience
    | 'certification' // Certifications/accreditations
    | 'technology'    // Tech stack/tools used
    | 'methodology';  // Approach/methodology

export interface SuggestedTag {
    tag: string;
    category: TagCategory;
    confidence: number;
    reason: string;
    relatedTags?: string[];
    searchVolume?: 'high' | 'medium' | 'low';
    competitiveness?: 'high' | 'medium' | 'low';
}

export interface TagGroup {
    category: TagCategory;
    label: string;
    description: string;
    icon: string;
    tags: SuggestedTag[];
    importance: 'critical' | 'high' | 'medium' | 'low';
}

export interface GenerateTagsResult {
    success: boolean;
    tags?: SuggestedTag[];
    groups?: TagGroup[];
    insights?: TagInsight[];
    error?: string;
}

export interface TagInsight {
    type: 'suggestion' | 'warning' | 'opportunity';
    title: string;
    description: string;
    actionable?: string;
}

// Category metadata for UI display
export const TAG_CATEGORY_META: Record<TagCategory, { label: string; description: string; icon: string; importance: 'critical' | 'high' | 'medium' | 'low' }> = {
    industry: {
        label: 'Industry',
        description: 'Core business vertical and sector',
        icon: 'building',
        importance: 'critical',
    },
    service: {
        label: 'Services',
        description: 'Services you offer to customers',
        icon: 'briefcase',
        importance: 'critical',
    },
    product: {
        label: 'Products',
        description: 'Products you sell or provide',
        icon: 'package',
        importance: 'high',
    },
    specialty: {
        label: 'Specializations',
        description: 'Areas of specialized expertise',
        icon: 'star',
        importance: 'high',
    },
    audience: {
        label: 'Target Audience',
        description: 'Who you serve',
        icon: 'users',
        importance: 'critical',
    },
    location: {
        label: 'Location',
        description: 'Geographic areas served',
        icon: 'map-pin',
        importance: 'high',
    },
    feature: {
        label: 'Features',
        description: 'Key capabilities and features',
        icon: 'zap',
        importance: 'medium',
    },
    benefit: {
        label: 'Benefits',
        description: 'Value propositions for customers',
        icon: 'gift',
        importance: 'high',
    },
    pricing: {
        label: 'Pricing',
        description: 'Pricing model and positioning',
        icon: 'dollar-sign',
        importance: 'medium',
    },
    quality: {
        label: 'Quality',
        description: 'Quality indicators and standards',
        icon: 'award',
        importance: 'medium',
    },
    experience: {
        label: 'Experience',
        description: 'Years and level of experience',
        icon: 'clock',
        importance: 'medium',
    },
    certification: {
        label: 'Certifications',
        description: 'Professional certifications and accreditations',
        icon: 'shield-check',
        importance: 'medium',
    },
    technology: {
        label: 'Technology',
        description: 'Technologies and tools used',
        icon: 'cpu',
        importance: 'low',
    },
    methodology: {
        label: 'Methodology',
        description: 'Approach and methods',
        icon: 'compass',
        importance: 'low',
    },
};
