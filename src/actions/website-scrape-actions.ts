'use server';

import {
  validateAndNormalizeUrl,
  checkUrlReachable,
  scrapeWebsiteForProfile,
  scrapeMultiplePages,
  type WebsiteScrapeOptions,
} from '@/lib/website-scrape-service';
import type { AutoFilledProfile } from '@/lib/business-autofill-service';

/**
 * Validate a website URL and check if it's reachable
 */
export async function validateWebsiteUrlAction(
  url: string
): Promise<{
  success: boolean;
  valid?: boolean;
  normalizedUrl?: string;
  reachable?: boolean;
  error?: string;
}> {
  try {
    if (!url || url.trim().length === 0) {
      return { success: false, valid: false, error: 'Please enter a URL' };
    }

    // First validate the URL format
    const validation = validateAndNormalizeUrl(url);
    if (!validation.valid || !validation.url) {
      return {
        success: true,
        valid: false,
        error: validation.error || 'Invalid URL format',
      };
    }

    // Then check if the URL is reachable
    const reachability = await checkUrlReachable(validation.url);

    return {
      success: true,
      valid: true,
      normalizedUrl: reachability.finalUrl || validation.url,
      reachable: reachability.reachable,
      error: reachability.error,
    };
  } catch (error: any) {
    console.error('[WebsiteScrape Action] Validation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to validate URL',
    };
  }
}

/**
 * Scrape a website and extract business profile data
 */
export async function scrapeWebsiteAction(
  url: string,
  options?: {
    includeSubpages?: boolean;
    maxPages?: number;
    countryCode?: string;
  }
): Promise<{
  success: boolean;
  profile?: AutoFilledProfile;
  pagesScraped?: string[];
  error?: string;
}> {
  try {
    // Check API keys
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!geminiKey) {
      return {
        success: false,
        error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables.',
      };
    }

    console.log('[WebsiteScrape Action] Starting scrape for:', url);

    const result = await scrapeWebsiteForProfile(url, {
      includeSubpages: options?.includeSubpages ?? true,
      maxPages: options?.maxPages ?? 5,
      countryCode: options?.countryCode,
    });

    if (!result.success || !result.profile) {
      return {
        success: false,
        error: result.error || 'Failed to scrape website',
      };
    }

    console.log('[WebsiteScrape Action] Scrape complete, pages:', result.pagesScraped?.length);

    return {
      success: true,
      profile: result.profile,
      pagesScraped: result.pagesScraped,
    };
  } catch (error: any) {
    console.error('[WebsiteScrape Action] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to scrape website',
    };
  }
}

/**
 * Scrape multiple specific pages (for advanced use)
 */
export async function scrapeMultiplePagesAction(
  urls: string[]
): Promise<{
  success: boolean;
  contents?: Record<string, string>;
  errors?: Record<string, string>;
  error?: string;
}> {
  try {
    if (!urls || urls.length === 0) {
      return { success: false, error: 'No URLs provided' };
    }

    if (urls.length > 10) {
      return { success: false, error: 'Maximum 10 URLs allowed' };
    }

    console.log('[WebsiteScrape Action] Scraping multiple pages:', urls.length);

    const result = await scrapeMultiplePages(urls);

    return {
      success: result.success,
      contents: result.contents,
      errors: result.errors,
    };
  } catch (error: any) {
    console.error('[WebsiteScrape Action] Multi-page error:', error);
    return {
      success: false,
      error: error.message || 'Failed to scrape pages',
    };
  }
}

/**
 * Quick check if a URL is accessible (lightweight, no full scrape)
 */
export async function checkWebsiteAccessAction(
  url: string
): Promise<{
  accessible: boolean;
  finalUrl?: string;
  error?: string;
}> {
  try {
    const validation = validateAndNormalizeUrl(url);
    if (!validation.valid || !validation.url) {
      return { accessible: false, error: validation.error };
    }

    const result = await checkUrlReachable(validation.url);

    return {
      accessible: result.reachable,
      finalUrl: result.finalUrl,
      error: result.error,
    };
  } catch (error: any) {
    return {
      accessible: false,
      error: error.message || 'Failed to check URL',
    };
  }
}
