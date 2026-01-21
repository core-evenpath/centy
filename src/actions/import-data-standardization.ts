'use server';

import { v4 as uuidv4 } from 'uuid';
import type {
  StandardizedImportDataPoint,
  StandardizedImportStorage,
  ImportDataExport
} from '@/lib/business-persona-types';
import { db } from '@/lib/firebase-admin';

// Semantic key mapping for Google data
const GOOGLE_KEY_MAP: Record<string, { key: string; category: string; label: string }> = {
  'name': { key: 'business_name', category: 'identity', label: 'Business Name' },
  'formatted_phone_number': { key: 'phone', category: 'contact', label: 'Phone' },
  'international_phone_number': { key: 'phone_international', category: 'contact', label: 'International Phone' },
  'formatted_address': { key: 'address_formatted', category: 'contact', label: 'Address' },
  'website': { key: 'website', category: 'contact', label: 'Website' },
  'rating': { key: 'google_rating', category: 'reputation', label: 'Google Rating' },
  'user_ratings_total': { key: 'review_count', category: 'reputation', label: 'Review Count' },
  'types': { key: 'business_types', category: 'identity', label: 'Business Types' },
  'opening_hours.weekday_text': { key: 'operating_hours', category: 'operations', label: 'Operating Hours' },
  'reviews': { key: 'reviews', category: 'reputation', label: 'Customer Reviews' },
  'photos': { key: 'photos', category: 'media', label: 'Photos' },
  // Mapped from autofill profile structure
  'identity.name': { key: 'business_name', category: 'identity', label: 'Business Name' },
  'identity.phone': { key: 'phone', category: 'contact', label: 'Phone' },
  'identity.email': { key: 'email', category: 'contact', label: 'Email' },
  'identity.website': { key: 'website', category: 'contact', label: 'Website' },
  'identity.address': { key: 'address', category: 'contact', label: 'Address' },
  'identity.operatingHours': { key: 'operating_hours', category: 'operations', label: 'Operating Hours' },
  'personality.tagline': { key: 'tagline', category: 'identity', label: 'Tagline' },
  'personality.description': { key: 'description', category: 'identity', label: 'Description' },
  'personality.uniqueSellingPoints': { key: 'unique_selling_points', category: 'identity', label: 'USPs' },
  'knowledge.productsOrServices': { key: 'products_services', category: 'offerings', label: 'Products & Services' },
  'knowledge.faqs': { key: 'faqs', category: 'knowledge', label: 'FAQs' },
};

// Semantic key mapping for Website data
const WEBSITE_KEY_MAP: Record<string, { key: string; category: string; label: string }> = {
  'businessName': { key: 'business_name', category: 'identity', label: 'Business Name' },
  'description': { key: 'description', category: 'identity', label: 'Description' },
  'phone': { key: 'phone', category: 'contact', label: 'Phone' },
  'email': { key: 'email', category: 'contact', label: 'Email' },
  'address': { key: 'address', category: 'contact', label: 'Address' },
  'services': { key: 'services', category: 'offerings', label: 'Services' },
  'products': { key: 'products', category: 'offerings', label: 'Products' },
  'socialMedia': { key: 'social_media', category: 'contact', label: 'Social Media' },
  'testimonials': { key: 'testimonials', category: 'reputation', label: 'Testimonials' },
  'faqs': { key: 'faqs', category: 'knowledge', label: 'FAQs' },
  'team': { key: 'team_members', category: 'team', label: 'Team Members' },
  // Mapped from scraper profile structure
  'identity.name': { key: 'business_name', category: 'identity', label: 'Business Name' },
  'identity.phone': { key: 'phone', category: 'contact', label: 'Phone' },
  'identity.email': { key: 'email', category: 'contact', label: 'Email' },
  'identity.website': { key: 'website', category: 'contact', label: 'Website' },
  'identity.address': { key: 'address', category: 'contact', label: 'Address' },
  'identity.operatingHours': { key: 'operating_hours', category: 'operations', label: 'Operating Hours' },
  'identity.socialMedia': { key: 'social_media', category: 'contact', label: 'Social Media' },
  'personality.tagline': { key: 'tagline', category: 'identity', label: 'Tagline' },
  'personality.description': { key: 'description', category: 'identity', label: 'Description' },
  'personality.uniqueSellingPoints': { key: 'unique_selling_points', category: 'identity', label: 'USPs' },
  'personality.brandValues': { key: 'brand_values', category: 'identity', label: 'Brand Values' },
  'personality.missionStatement': { key: 'mission_statement', category: 'identity', label: 'Mission Statement' },
  'knowledge.productsOrServices': { key: 'products_services', category: 'offerings', label: 'Products & Services' },
  'knowledge.services': { key: 'services', category: 'offerings', label: 'Services' },
  'knowledge.faqs': { key: 'faqs', category: 'knowledge', label: 'FAQs' },
  'knowledge.policies': { key: 'policies', category: 'knowledge', label: 'Policies' },
  'customerProfile.targetAudience': { key: 'target_audience', category: 'audience', label: 'Target Audience' },
  'customerProfile.painPoints': { key: 'pain_points', category: 'audience', label: 'Pain Points' },
  'industrySpecificData': { key: 'industry_data', category: 'industry', label: 'Industry Data' },
};

/**
 * Transform raw Google Places data to standardized format
 */
export async function standardizeGoogleImportData(
  rawData: any,
  placeId: string,
  placeName: string,
  checkedFields: Record<string, boolean> = {}
): Promise<StandardizedImportStorage> {
  const sessionId = uuidv4();
  const importedAt = new Date().toISOString();
  const dataPoints: StandardizedImportDataPoint[] = [];

  function extractDataPoints(obj: any, pathPrefix: string = '') {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      const fullPath = pathPrefix ? `${pathPrefix}.${key}` : key;
      const mapping = GOOGLE_KEY_MAP[fullPath] || GOOGLE_KEY_MAP[key];

      if (mapping) {
        const dataPoint: StandardizedImportDataPoint = {
          id: `google_${mapping.key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          key: mapping.key,
          value: value as any,
          source: 'google',
          checked: checkedFields[fullPath] ?? checkedFields[key] ?? true,
          confidence: 0.95, // Google data is generally high confidence
          imported_at: importedAt,
          raw_context: {
            original_key: key,
            original_path: fullPath,
            extraction_method: 'direct',
          },
          display_label: mapping.label,
          category: mapping.category,
        };
        dataPoints.push(dataPoint);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Recurse into nested objects
        extractDataPoints(value, fullPath);
      } else if (Array.isArray(value) && value.length > 0) {
        // Handle arrays that aren't mapped - store as unmapped
        const unmappedPoint: StandardizedImportDataPoint = {
          id: `google_unmapped_${key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          key: `unmapped_${key}`,
          value: value,
          source: 'google',
          checked: false,
          confidence: 0.7,
          imported_at: importedAt,
          raw_context: {
            original_key: key,
            original_path: fullPath,
            extraction_method: 'direct',
          },
          display_label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          category: 'unmapped',
        };
        dataPoints.push(unmappedPoint);
      }
    }
  }

  extractDataPoints(rawData);

  return {
    version: '1.0',
    data_points: dataPoints,
    import_session: {
      id: sessionId,
      source: 'google',
      source_identifier: placeId,
      imported_at: importedAt,
    },
    raw_data_backup: rawData,
  };
}

/**
 * Transform raw website scrape data to standardized format
 */
export async function standardizeWebsiteImportData(
  rawData: any,
  url: string,
  pagesScraped: string[] = [],
  checkedFields: Record<string, boolean> = {}
): Promise<StandardizedImportStorage> {
  const sessionId = uuidv4();
  const importedAt = new Date().toISOString();
  const dataPoints: StandardizedImportDataPoint[] = [];

  function extractDataPoints(obj: any, pathPrefix: string = '') {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      const fullPath = pathPrefix ? `${pathPrefix}.${key}` : key;
      const mapping = WEBSITE_KEY_MAP[fullPath] || WEBSITE_KEY_MAP[key];

      if (mapping) {
        const dataPoint: StandardizedImportDataPoint = {
          id: `website_${mapping.key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          key: mapping.key,
          value: value as any,
          source: 'website',
          checked: checkedFields[fullPath] ?? checkedFields[key] ?? true,
          confidence: 0.8, // Website data slightly lower confidence than Google
          imported_at: importedAt,
          raw_context: {
            original_key: key,
            original_path: fullPath,
            extraction_method: (rawData as any)._aiExtracted ? 'ai' : 'direct',
          },
          display_label: mapping.label,
          category: mapping.category,
        };
        dataPoints.push(dataPoint);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        extractDataPoints(value, fullPath);
      } else if (typeof value === 'string' && value.length > 0) {
        // Store non-mapped string values as unmapped
        const unmappedPoint: StandardizedImportDataPoint = {
          id: `website_unmapped_${key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          key: `unmapped_${key}`,
          value: value,
          source: 'website',
          checked: false,
          confidence: 0.6,
          imported_at: importedAt,
          raw_context: {
            original_key: key,
            original_path: fullPath,
            extraction_method: 'direct',
          },
          display_label: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
          category: 'unmapped',
        };
        dataPoints.push(unmappedPoint);
      }
    }
  }

  extractDataPoints(rawData);

  return {
    version: '1.0',
    data_points: dataPoints,
    import_session: {
      id: sessionId,
      source: 'website',
      source_identifier: url,
      imported_at: importedAt,
      pages_scraped: pagesScraped,
    },
    raw_data_backup: rawData,
  };
}

/**
 * Export standardized import data grouped by key
 * This is the deterministic export mechanism for downstream consumers
 */
export async function exportStandardizedImportData(
  partnerId: string
): Promise<{ success: boolean; export?: ImportDataExport; error?: string }> {
  if (!db) {
    return { success: false, error: 'Database unavailable' };
  }

  try {
    const partnerRef = db.collection('partners').doc(partnerId);
    const partnerDoc = await partnerRef.get();

    if (!partnerDoc.exists) {
      return { success: false, error: 'Partner not found' };
    }

    const data = partnerDoc.data();
    const persona = data?.businessPersona || {};
    const standardizedImports = persona.standardizedImports || {};

    const allDataPoints: StandardizedImportDataPoint[] = [];
    const sources: ImportDataExport['sources'] = {};

    // Collect Google data points
    if (standardizedImports.google?.data_points) {
      allDataPoints.push(...standardizedImports.google.data_points);
      sources.google = {
        place_id: standardizedImports.google.import_session?.source_identifier,
        place_name: persona.importedData?.google?.placeName,
        imported_at: standardizedImports.google.import_session?.imported_at || '',
      };
    }

    // Collect Website data points
    if (standardizedImports.website?.data_points) {
      allDataPoints.push(...standardizedImports.website.data_points);
      sources.website = {
        url: standardizedImports.website.import_session?.source_identifier,
        pages_scraped: standardizedImports.website.import_session?.pages_scraped,
        imported_at: standardizedImports.website.import_session?.imported_at || '',
      };
    }

    // Group by key
    const dataByKey: Record<string, StandardizedImportDataPoint[]> = {};
    for (const point of allDataPoints) {
      if (!dataByKey[point.key]) {
        dataByKey[point.key] = [];
      }
      dataByKey[point.key].push(point);
    }

    const exportData: ImportDataExport = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      partner_id: partnerId,
      data_by_key: dataByKey,
      sources,
    };

    return { success: true, export: exportData };
  } catch (error: any) {
    console.error('[ExportImportData] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update checked status for a data point
 * Called when user toggles checkbox in Import Center UI
 */
export async function updateImportDataPointCheckedStatus(
  partnerId: string,
  dataPointId: string,
  checked: boolean,
  source: 'google' | 'website'
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: 'Database unavailable' };
  }

  try {
    const partnerRef = db.collection('partners').doc(partnerId);
    const partnerDoc = await partnerRef.get();

    if (!partnerDoc.exists) {
      return { success: false, error: 'Partner not found' };
    }

    const data = partnerDoc.data();
    const persona = data?.businessPersona || {};
    const standardizedImports = persona.standardizedImports || {};
    const sourceStorage = standardizedImports[source];

    if (!sourceStorage?.data_points) {
      return { success: false, error: 'No import data found' };
    }

    // Find and update the data point
    const updatedDataPoints = sourceStorage.data_points.map((point: StandardizedImportDataPoint) => {
      if (point.id === dataPointId) {
        return { ...point, checked };
      }
      return point;
    });

    // Save back
    await partnerRef.update({
      [`businessPersona.standardizedImports.${source}.data_points`]: updatedDataPoints,
    });

    return { success: true };
  } catch (error: any) {
    console.error('[UpdateCheckedStatus] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get standardized import data for a partner
 */
export async function getStandardizedImportData(
  partnerId: string
): Promise<{
  success: boolean;
  google?: StandardizedImportStorage;
  website?: StandardizedImportStorage;
  error?: string
}> {
  if (!db) {
    return { success: false, error: 'Database unavailable' };
  }

  try {
    const partnerRef = db.collection('partners').doc(partnerId);
    const partnerDoc = await partnerRef.get();

    if (!partnerDoc.exists) {
      return { success: false, error: 'Partner not found' };
    }

    const data = partnerDoc.data();
    const standardizedImports = data?.businessPersona?.standardizedImports || {};

    return {
      success: true,
      google: standardizedImports.google,
      website: standardizedImports.website,
    };
  } catch (error: any) {
    console.error('[GetStandardizedImportData] Error:', error);
    return { success: false, error: error.message };
  }
}
