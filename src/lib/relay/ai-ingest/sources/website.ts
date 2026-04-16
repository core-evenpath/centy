import 'server-only';

// ── Website source adapter ─────────────────────────────────────────────
//
// Runs the existing `scrapeWebsiteAction` and collapses the returned
// `AutoFilledProfile` into a single text blob the extractor can feed
// to Gemini. We deliberately prefer the structured `knowledge.*`
// sections (packages, services, products, faqs, pricingTiers) because
// they carry more signal than raw page text; falls back to persona
// description when nothing structured is available.

import { scrapeWebsiteAction } from '@/actions/website-scrape-actions';
import type { SourceExtractionResult } from './types';

const KNOWLEDGE_KEYS = [
  'packages',
  'services',
  'products',
  'menuItems',
  'faqs',
  'pricingTiers',
  'offerings',
] as const;

interface WebsiteOptions {
  maxPages?: number;
  countryCode?: string;
}

export async function extractFromWebsite(
  url: string,
  options: WebsiteOptions = {},
): Promise<SourceExtractionResult> {
  let hostname = url;
  try {
    hostname = new URL(url).hostname;
  } catch {
    /* keep the raw url if it fails to parse */
  }

  try {
    const result = await scrapeWebsiteAction(url, {
      includeSubpages: true,
      maxPages: options.maxPages ?? 5,
      countryCode: options.countryCode,
    });
    if (!result.success || !result.profile) {
      return {
        success: false,
        content: '',
        sourceLabel: hostname,
        error: result.error || 'Scrape failed',
      };
    }

    const profile = result.profile as unknown as Record<string, unknown>;
    const knowledge = (profile.knowledge ?? {}) as Record<string, unknown>;
    const parts: string[] = [];

    for (const key of KNOWLEDGE_KEYS) {
      const value = knowledge[key];
      if (!value) continue;
      parts.push(`${key.toUpperCase()}:\n${JSON.stringify(value, null, 2)}`);
    }

    if (parts.length === 0) {
      const personality = (profile.personality ?? {}) as Record<string, unknown>;
      const desc = personality.description;
      if (typeof desc === 'string' && desc.length > 0) {
        parts.push(desc);
      }
    }

    return {
      success: true,
      content: parts.join('\n\n'),
      sourceLabel: hostname,
      pagesScraped: result.pagesScraped,
    };
  } catch (err) {
    return {
      success: false,
      content: '',
      sourceLabel: hostname,
      error: err instanceof Error ? err.message : 'Scrape failed',
    };
  }
}
