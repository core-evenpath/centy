/**
 * Platform Mapping Types
 *
 * Defines types for mapping business functions to external platform categories
 * (e.g., Google, WhatsApp, Telegram, Facebook).
 */

export type PlatformId =
    | 'google'
    | 'whatsapp'
    | 'telegram'
    | 'facebook'
    | 'apple'
    | 'yelp';

export interface PlatformCategory {
    categoryId: string;
    label: string;
    parentId?: string;
    description?: string;
}

export interface PlatformMapping {
    functionId: string;
    platformId: PlatformId;
    primary: string[];           // Primary category IDs
    secondary?: string[];        // Secondary/fallback category IDs
    confidence: 'exact' | 'close' | 'approximate';
    notes?: string;
}

export interface PlatformConfig {
    platformId: PlatformId;
    name: string;
    version: string;
    lastUpdated: string;
    categories: PlatformCategory[];
    mappings: PlatformMapping[];
    fallbackStrategy: 'industry' | 'generic' | 'none';
}

export interface ResolvedPlatformCategory {
    functionId: string;
    functionLabel: string;
    platformId: PlatformId;
    platformCategories: PlatformCategory[];
    confidence: 'exact' | 'close' | 'approximate' | 'fallback';
    isFallback: boolean;
}
