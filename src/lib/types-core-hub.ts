import { Timestamp } from 'firebase-admin/firestore';

/**
 * Core Hub configuration document
 * Stored at: partners/{partnerId}/coreHub/config
 */
export interface CoreHubConfig {
  partnerId: string;
  lastSyncedAt: Timestamp | null;

  businessContext: {
    name: string;
    industry: string;
    subcategory: string;
    country: string;
    description: string;
    hours: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    website: string;
  };

  moduleSyncStatus: {
    [moduleSlug: string]: {
      lastSyncedAt: Timestamp;
      itemCount: number;
      enabled: boolean;
    };
  };

  totalItemCount: number;
  syncVersion: number;
}

/**
 * Flattened module item in Core Hub
 * Stored at: partners/{partnerId}/coreHub/data/items/{itemId}
 */
export interface CoreHubItem {
  id: string;
  partnerId: string;

  // Source tracking
  sourceModule: string;
  sourceItemId: string;

  // Content
  name: string;
  description: string;
  category: string;

  // Pricing
  price: number | null;
  priceUnit: string | null;
  currency: string;

  // Flexible metadata
  metadata: Record<string, any>;

  // Search
  searchText: string;
  keywords: string[];

  // State
  isActive: boolean;
  syncedAt: Timestamp;
}

/**
 * Result of Core Hub context retrieval
 */
export interface CoreHubContext {
  success: boolean;
  businessContext?: CoreHubConfig['businessContext'];
  moduleItems?: CoreHubItem[];
  itemCount?: number;
  lastSyncedAt?: Date;
  message?: string;
}

/**
 * Result of Core Hub sync operation
 */
export interface CoreHubSyncResult {
  success: boolean;
  message: string;
  itemsSynced?: number;
  modulesProcessed?: number;
  errors?: string[];
  duration?: number;
}
