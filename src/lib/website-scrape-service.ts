/**
 * Website Scrape Service
 *
 * Scrapes business websites to extract profile data using Gemini AI.
 * Returns data in the same AutoFilledProfile format as the Google Places auto-fill.
 */

import { GoogleGenAI } from "@google/genai";
import type { AutoFilledProfile, RoomInventoryItem, MenuInventoryItem, ProductInventoryItem, ServiceInventoryItem, PropertyInventoryItem } from './business-autofill-service';
import { buildWebsiteScrapePrompt } from './website-scrape-prompt-builder';
import { detectCountryFromAddress, DEFAULT_COUNTRY } from './country-autofill-config';

// Lazy initialization for Gemini to avoid module load errors when API key is missing
let ai: GoogleGenAI | null = null;

function getGeminiAI(): GoogleGenAI | null {
  if (ai) return ai;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    console.warn('[WebsiteScrape] Gemini API key not configured - AI extraction will fail');
    return null;
  }

  try {
    ai = new GoogleGenAI({ apiKey });
    return ai;
  } catch (error) {
    console.error('[WebsiteScrape] Failed to initialize Gemini AI:', error);
    return null;
  }
}

// Constants for scraping
const MAX_CONTENT_LENGTH = 100000; // 100KB per page
const MAX_TOTAL_CONTENT = 500000; // 500KB total
const FETCH_TIMEOUT = 30000; // 30 seconds
const MAX_SUBPAGES = 8; // Increased from 5

// Comprehensive relevant subpage patterns for all industries
const RELEVANT_SUBPAGE_PATTERNS = [
  // About/Company
  /\/(about|about-us|about_us|who-we-are|our-story|company|overview)/i,
  // Contact
  /\/(contact|contact-us|contact_us|get-in-touch|reach-us|locations?)/i,
  // Services
  /\/(services?|our-services|what-we-do|solutions|offerings|capabilities)/i,
  // Products
  /\/(products?|our-products|shop|store|catalog|inventory|buy)/i,
  // Team/People
  /\/(team|our-team|meet-the-team|staff|people|leadership|management|doctors?|experts?)/i,
  // Pricing
  /\/(pricing|prices|rates|fees|cost|packages|plans)/i,
  // FAQ
  /\/(faq|faqs|frequently-asked|help|support|knowledge-base)/i,
  // Testimonials/Reviews
  /\/(testimonials?|reviews?|client-reviews|success-stories|case-studies?)/i,
  // Portfolio/Gallery
  /\/(portfolio|projects?|work|gallery|showcase|our-work|completed-projects)/i,

  // HOSPITALITY specific
  /\/(rooms?|accommodations?|room-types|suites?|villas?|stay|amenities)/i,
  /\/(dining|restaurant|menu|food|bar|spa|facilities)/i,

  // HEALTHCARE specific
  /\/(treatments?|therapies|procedures|specialties|departments|conditions)/i,
  /\/(doctors?|physicians|specialists|consultants|medical-team)/i,
  /\/(appointments?|book|schedule|patient-info)/i,

  // REAL ESTATE specific
  /\/(properties|listings?|homes|houses|apartments|rentals?|sales?)/i,
  /\/(buy|sell|rent|lease|invest|commercial|residential)/i,
  /\/(neighborhoods?|areas?|communities|locations?|markets?)/i,
  /\/(buyers?|sellers?|investors?|landlords?|tenants?)/i,
  /\/(agents?|realtors?|brokers?|team)/i,
  /\/(featured|new-listings|just-sold|available)/i,

  // EDUCATION specific
  /\/(courses?|programs?|curriculum|classes|training|workshops?)/i,
  /\/(admissions?|enrollment|apply|register|fees)/i,
  /\/(faculty|instructors?|teachers?|professors?)/i,

  // FOOD & BEVERAGE specific
  /\/(menu|our-menu|food-menu|drinks?-menu|specials?)/i,
  /\/(catering|events?|private-dining|reservations?)/i,

  // PROFESSIONAL SERVICES specific
  /\/(practice-areas|industries|sectors|expertise|specializations?)/i,
  /\/(clients?|partners?|affiliations?)/i,
  /\/(resources?|insights?|blog|news|articles?)/i,

  // RETAIL/E-COMMERCE specific
  /\/(collections?|categories|brands?|new-arrivals|sale|offers?)/i,
  /\/(shipping|delivery|returns?|warranty)/i,
];

export interface WebsiteScrapeOptions {
  includeSubpages?: boolean;
  maxPages?: number;
  countryCode?: string;
}

export interface WebsiteScrapeResult {
  success: boolean;
  profile?: AutoFilledProfile;
  error?: string;
  pagesScraped?: string[];
}

export interface ScrapedPageContent {
  url: string;
  title: string;
  content: string;
  html: string;
}

/**
 * Validate and normalize URL
 */
export function validateAndNormalizeUrl(url: string): { valid: boolean; url?: string; error?: string } {
  try {
    // Add protocol if missing
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    const parsed = new URL(normalizedUrl);

    // Basic validation
    if (!parsed.hostname.includes('.')) {
      return { valid: false, error: 'Invalid domain name' };
    }

    // Upgrade HTTP to HTTPS
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:';
    }

    return { valid: true, url: parsed.toString() };
  } catch (e) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Fetch website content with proper headers and timeout
 */
export async function fetchWebsiteContent(url: string): Promise<{
  success: boolean;
  content?: string;
  html?: string;
  title?: string;
  error?: string;
  redirectedTo?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BusinessProfileBot/1.0; +https://centy.ai/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    // Check for redirect to different domain
    const finalUrl = response.url;
    const originalDomain = new URL(url).hostname.replace(/^www\./, '');
    const finalDomain = new URL(finalUrl).hostname.replace(/^www\./, '');

    if (originalDomain !== finalDomain) {
      return {
        success: false,
        error: 'Redirected to different domain',
        redirectedTo: finalUrl,
      };
    }

    if (!response.ok) {
      if (response.status === 403) {
        return { success: false, error: 'Website blocked automated access (403 Forbidden)' };
      }
      if (response.status === 404) {
        return { success: false, error: 'Page not found (404)' };
      }
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return { success: false, error: 'Not an HTML page' };
    }

    let html = await response.text();

    // Truncate if too large
    if (html.length > MAX_CONTENT_LENGTH) {
      html = html.substring(0, MAX_CONTENT_LENGTH);
    }

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract text content (simplified)
    const textContent = extractTextContent(html);

    return {
      success: true,
      html,
      content: textContent,
      title,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Request timeout (30 seconds)' };
    }
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return { success: false, error: 'Could not reach website - DNS or connection error' };
    }
    return { success: false, error: error.message || 'Failed to fetch website' };
  }
}

/**
 * Extract readable text content from HTML
 */
function extractTextContent(html: string): string {
  // Remove script, style, and other non-content tags
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' [NAV] ')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' [FOOTER] ')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ' [HEADER] ');

  // Extract structured data if present
  const structuredDataMatches = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  let structuredData = '';
  if (structuredDataMatches) {
    structuredData = '\n\n[STRUCTURED DATA (JSON-LD)]\n' + structuredDataMatches.map(m => {
      const content = m.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
      try {
        return JSON.stringify(JSON.parse(content), null, 2);
      } catch {
        return content;
      }
    }).join('\n');
  }

  // Extract meta tags
  let metaInfo = '';
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  if (descMatch) {
    metaInfo += `Meta Description: ${descMatch[1]}\n`;
  }

  const keywordsMatch = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([^"']+)["']/i);
  if (keywordsMatch) {
    metaInfo += `Keywords: ${keywordsMatch[1]}\n`;
  }

  // Extract Open Graph data
  const ogMatches = html.matchAll(/<meta[^>]*property=["']og:([^"']+)["'][^>]*content=["']([^"']+)["']/gi);
  for (const match of ogMatches) {
    if (['title', 'description', 'site_name'].includes(match[1])) {
      metaInfo += `OG ${match[1]}: ${match[2]}\n`;
    }
  }

  // Convert HTML to text
  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();

  return (metaInfo ? `[META INFORMATION]\n${metaInfo}\n\n` : '') + text + structuredData;
}

/**
 * Discover relevant subpages from main page HTML - enhanced with smart prioritization
 */
export function discoverRelevantPages(baseUrl: string, html: string): string[] {
  const baseUrlObj = new URL(baseUrl);
  const discovered = new Map<string, number>(); // URL -> priority score

  // Priority scores for different page types (higher = more important)
  const priorityPatterns: [RegExp, number][] = [
    // High priority - core business info
    [/\/(about|about-us|who-we-are|our-story)/i, 100],
    [/\/(services?|what-we-do|solutions)/i, 95],
    [/\/(contact|contact-us|locations?)/i, 90],
    [/\/(team|our-team|staff|leadership|agents?)/i, 85],

    // High priority - industry specific
    [/\/(properties|listings?|portfolio|projects?)/i, 90],
    [/\/(menu|products?|rooms?|treatments?|courses?)/i, 90],
    [/\/(pricing|prices|rates|packages|plans)/i, 85],

    // Medium priority - credibility
    [/\/(testimonials?|reviews?|success-stories|case-studies?)/i, 80],
    [/\/(gallery|showcase|our-work|completed)/i, 75],
    [/\/(faq|faqs|help)/i, 70],

    // Lower priority but still useful
    [/\/(blog|news|resources?|insights?)/i, 50],
    [/\/(careers?|jobs)/i, 30],
  ];

  // Extract all links with their context
  const linkMatches = html.matchAll(/<a[^>]*href=["']([^"'#]+)["'][^>]*>([^<]*)</gi);

  for (const match of linkMatches) {
    let href = match[1];
    const linkText = match[2]?.toLowerCase() || '';

    // Skip external links, javascript, mailto, tel
    if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue;
    }

    // Resolve relative URLs
    try {
      const absoluteUrl = new URL(href, baseUrl);

      // Only include same-domain links
      if (absoluteUrl.hostname !== baseUrlObj.hostname) {
        continue;
      }

      const path = absoluteUrl.pathname.toLowerCase();

      // Skip common non-content pages
      if (path.match(/\/(login|signin|signup|register|cart|checkout|account|privacy|terms|cookie)/i)) {
        continue;
      }

      // Skip file downloads
      if (path.match(/\.(pdf|doc|docx|xls|xlsx|zip|jpg|png|gif)$/i)) {
        continue;
      }

      // Calculate priority score
      let priority = 0;
      for (const [pattern, score] of priorityPatterns) {
        if (pattern.test(path)) {
          priority = Math.max(priority, score);
        }
      }

      // Boost priority if link text contains relevant keywords
      const boostKeywords = ['about', 'service', 'contact', 'team', 'price', 'testimonial', 'portfolio', 'properties', 'listing'];
      for (const keyword of boostKeywords) {
        if (linkText.includes(keyword)) {
          priority += 10;
        }
      }

      // Check against standard patterns if no priority yet
      if (priority === 0) {
        for (const pattern of RELEVANT_SUBPAGE_PATTERNS) {
          if (pattern.test(path)) {
            priority = 40; // Default priority for matched patterns
            break;
          }
        }
      }

      if (priority > 0) {
        // Normalize URL (remove trailing slash)
        absoluteUrl.pathname = absoluteUrl.pathname.replace(/\/$/, '');
        const normalizedUrl = absoluteUrl.toString();

        // Keep highest priority for each URL
        const existingPriority = discovered.get(normalizedUrl) || 0;
        if (priority > existingPriority) {
          discovered.set(normalizedUrl, priority);
        }
      }
    } catch {
      // Invalid URL, skip
    }
  }

  // Sort by priority and return top N
  const sortedUrls = Array.from(discovered.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([url]) => url)
    .slice(0, MAX_SUBPAGES);

  return sortedUrls;
}

/**
 * Extract navigation menu links - these are usually the most important pages
 */
function extractNavigationLinks(baseUrl: string, html: string): string[] {
  const baseUrlObj = new URL(baseUrl);
  const navLinks = new Set<string>();

  // Find navigation sections
  const navPatterns = [
    /<nav[^>]*>([\s\S]*?)<\/nav>/gi,
    /<header[^>]*>([\s\S]*?)<\/header>/gi,
    /<div[^>]*class="[^"]*(?:nav|menu|header)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<ul[^>]*class="[^"]*(?:nav|menu)[^"]*"[^>]*>([\s\S]*?)<\/ul>/gi,
  ];

  for (const pattern of navPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      const navContent = match[1] || match[0];
      const linkMatches = navContent.matchAll(/<a[^>]*href=["']([^"'#]+)["'][^>]*>/gi);

      for (const linkMatch of linkMatches) {
        try {
          const href = linkMatch[1];
          if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            continue;
          }

          const absoluteUrl = new URL(href, baseUrl);
          if (absoluteUrl.hostname !== baseUrlObj.hostname) {
            continue;
          }

          const path = absoluteUrl.pathname.toLowerCase();
          // Skip common non-content pages
          if (path.match(/\/(login|signin|signup|register|cart|checkout|account)/i)) {
            continue;
          }

          absoluteUrl.pathname = absoluteUrl.pathname.replace(/\/$/, '');
          navLinks.add(absoluteUrl.toString());
        } catch {
          // Invalid URL, skip
        }
      }
    }
  }

  return Array.from(navLinks);
}

/**
 * Discover ALL important pages combining navigation + pattern matching
 */
export function discoverAllRelevantPages(baseUrl: string, html: string): string[] {
  // Get navigation links (usually the most important)
  const navLinks = extractNavigationLinks(baseUrl, html);

  // Get pattern-matched links
  const patternLinks = discoverRelevantPages(baseUrl, html);

  // Combine and deduplicate, prioritizing nav links
  const allLinks = new Set([...navLinks, ...patternLinks]);

  // Remove the base URL itself
  const normalizedBase = baseUrl.replace(/\/$/, '');
  allLinks.delete(normalizedBase);
  allLinks.delete(normalizedBase + '/');

  return Array.from(allLinks).slice(0, MAX_SUBPAGES + 2); // Allow a bit more for nav links
}

/**
 * Extract social media links from HTML - comprehensive patterns for all platforms
 */
function extractSocialLinks(html: string): Record<string, string> {
  const social: Record<string, string> = {};

  // Comprehensive patterns with multiple variations for each platform
  // Each pattern returns either: [1] = full URL, or username that needs base URL construction
  const patterns: [string, RegExp[], string][] = [
    // Major Social Platforms
    ['instagram', [
      /href=["'](https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?)[^"'\s]*/i,
      /(?:instagram\.com|instagr\.am)\/([a-zA-Z0-9_.]+)/i,
    ], 'https://instagram.com/'],
    ['facebook', [
      /href=["'](https?:\/\/(www\.)?(facebook\.com|fb\.com)\/[a-zA-Z0-9.]+\/?)[^"'\s]*/i,
      /(?:facebook\.com|fb\.com)\/([a-zA-Z0-9.]+)/i,
    ], 'https://facebook.com/'],
    ['twitter', [
      /href=["'](https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?)[^"'\s]*/i,
      /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/i,
    ], 'https://twitter.com/'],
    ['linkedin', [
      /href=["'](https?:\/\/(www\.)?linkedin\.com\/(company|in|school)\/[a-zA-Z0-9-]+\/?)[^"'\s]*/i,
      /linkedin\.com\/(company|in|school)\/([a-zA-Z0-9-]+)/i,
    ], 'https://linkedin.com/company/'],
    ['youtube', [
      /href=["'](https?:\/\/(www\.)?youtube\.com\/(channel|c|user|@)[\/]?[a-zA-Z0-9_-]+\/?)[^"'\s]*/i,
      /href=["'](https?:\/\/(www\.)?youtube\.com\/@[a-zA-Z0-9_-]+\/?)[^"'\s]*/i,
      /youtube\.com\/(channel|c|user|@)?\/?([a-zA-Z0-9_-]+)/i,
    ], 'https://youtube.com/@'],
    ['pinterest', [
      /href=["'](https?:\/\/(www\.)?pinterest\.(com|co\.\w+)\/[a-zA-Z0-9_]+\/?)[^"'\s]*/i,
      /pinterest\.(com|co\.\w+)\/([a-zA-Z0-9_]+)/i,
    ], 'https://pinterest.com/'],
    ['tiktok', [
      /href=["'](https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+\/?)[^"'\s]*/i,
      /tiktok\.com\/@([a-zA-Z0-9_.]+)/i,
    ], 'https://tiktok.com/@'],
    ['threads', [
      /href=["'](https?:\/\/(www\.)?threads\.net\/@?[a-zA-Z0-9_.]+\/?)[^"'\s]*/i,
      /threads\.net\/@?([a-zA-Z0-9_.]+)/i,
    ], 'https://threads.net/@'],
    ['snapchat', [
      /href=["'](https?:\/\/(www\.)?snapchat\.com\/add\/[a-zA-Z0-9_.]+\/?)[^"'\s]*/i,
      /snapchat\.com\/add\/([a-zA-Z0-9_.]+)/i,
    ], 'https://snapchat.com/add/'],

    // Messaging Platforms
    ['whatsapp', [
      /href=["'](https?:\/\/(wa\.me|api\.whatsapp\.com\/send\?phone=|chat\.whatsapp\.com)[\/=]?[0-9+]+)[^"'\s]*/i,
      /wa\.me\/([0-9+]+)/i,
      /whatsapp\.com\/send\?phone=([0-9+]+)/i,
    ], 'https://wa.me/'],
    ['telegram', [
      /href=["'](https?:\/\/(t\.me|telegram\.me|telegram\.org)\/[a-zA-Z0-9_]+\/?)[^"'\s]*/i,
      /(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/i,
    ], 'https://t.me/'],
    ['wechat', [
      /wechat[:\s]+([a-zA-Z0-9_]+)/i,
      /weixin[:\s]+([a-zA-Z0-9_]+)/i,
    ], ''],
    ['line', [
      /href=["'](https?:\/\/line\.me\/[^"'\s]+)/i,
      /line\.me\/ti\/p\/([@%]?[a-zA-Z0-9_-]+)/i,
    ], 'https://line.me/ti/p/'],

    // Business & Review Platforms
    ['googleBusiness', [
      /href=["'](https?:\/\/(www\.)?(google\.com\/maps|maps\.google\.com|g\.page|goo\.gl\/maps)[^"'\s]+)["']/i,
      /href=["'](https?:\/\/g\.page\/[^"'\s]+)["']/i,
      /href=["'](https?:\/\/maps\.app\.goo\.gl\/[^"'\s]+)["']/i,
    ], ''],
    ['yelp', [
      /href=["'](https?:\/\/(www\.)?yelp\.(com|co\.\w+|ca|ie)\/biz\/[^"'\s]+)["']/i,
    ], ''],
    ['tripadvisor', [
      /href=["'](https?:\/\/(www\.)?tripadvisor\.(com|co\.\w+|in|ca|ie)\/[^"'\s]+)["']/i,
    ], ''],
    ['trustpilot', [
      /href=["'](https?:\/\/(www\.)?trustpilot\.com\/review\/[^"'\s]+)["']/i,
    ], ''],
    ['glassdoor', [
      /href=["'](https?:\/\/(www\.)?glassdoor\.(com|co\.\w+|in)\/[^"'\s]+)["']/i,
    ], ''],

    // Food & Delivery Platforms
    ['zomato', [
      /href=["'](https?:\/\/(www\.)?zomato\.com\/[^"'\s]+)["']/i,
    ], ''],
    ['swiggy', [
      /href=["'](https?:\/\/(www\.)?swiggy\.com\/[^"'\s]+)["']/i,
    ], ''],
    ['ubereats', [
      /href=["'](https?:\/\/(www\.)?ubereats\.com\/[^"'\s]+)["']/i,
    ], ''],
    ['doordash', [
      /href=["'](https?:\/\/(www\.)?doordash\.com\/[^"'\s]+)["']/i,
    ], ''],
    ['grubhub', [
      /href=["'](https?:\/\/(www\.)?grubhub\.com\/[^"'\s]+)["']/i,
    ], ''],
    ['opentable', [
      /href=["'](https?:\/\/(www\.)?opentable\.(com|co\.\w+)\/[^"'\s]+)["']/i,
    ], ''],

    // Real Estate Platforms
    ['zillow', [
      /href=["'](https?:\/\/(www\.)?zillow\.com\/profile\/[^"'\s]+)["']/i,
      /href=["'](https?:\/\/(www\.)?zillow\.com\/[^"'\s]+)["']/i,
    ], ''],
    ['realtor', [
      /href=["'](https?:\/\/(www\.)?realtor\.com\/[^"'\s]+)["']/i,
    ], ''],
    ['trulia', [
      /href=["'](https?:\/\/(www\.)?trulia\.com\/[^"'\s]+)["']/i,
    ], ''],
    ['houzz', [
      /href=["'](https?:\/\/(www\.)?houzz\.(com|co\.\w+|in)\/[^"'\s]+)["']/i,
    ], ''],
    ['redfin', [
      /href=["'](https?:\/\/(www\.)?redfin\.com\/[^"'\s]+)["']/i,
    ], ''],

    // Travel & Hospitality
    ['booking', [
      /href=["'](https?:\/\/(www\.)?booking\.com\/hotel\/[^"'\s]+)["']/i,
    ], ''],
    ['airbnb', [
      /href=["'](https?:\/\/(www\.)?airbnb\.(com|co\.\w+|in)\/[^"'\s]+)["']/i,
    ], ''],
    ['expedia', [
      /href=["'](https?:\/\/(www\.)?expedia\.(com|co\.\w+)\/[^"'\s]+)["']/i,
    ], ''],

    // Professional/Business
    ['github', [
      /href=["'](https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_-]+\/?)[^"'\s]*/i,
      /github\.com\/([a-zA-Z0-9_-]+)/i,
    ], 'https://github.com/'],
    ['behance', [
      /href=["'](https?:\/\/(www\.)?behance\.net\/[a-zA-Z0-9_-]+\/?)[^"'\s]*/i,
    ], ''],
    ['dribbble', [
      /href=["'](https?:\/\/(www\.)?dribbble\.com\/[a-zA-Z0-9_-]+\/?)[^"'\s]*/i,
    ], ''],

    // Regional Platforms
    ['vk', [
      /href=["'](https?:\/\/(www\.)?vk\.com\/[a-zA-Z0-9_]+\/?)[^"'\s]*/i,
    ], ''],
    ['weibo', [
      /href=["'](https?:\/\/(www\.)?weibo\.com\/[a-zA-Z0-9_]+\/?)[^"'\s]*/i,
    ], ''],
  ];

  for (const [platform, regexList, baseUrl] of patterns) {
    if (social[platform]) continue; // Already found

    for (const pattern of regexList) {
      const match = html.match(pattern);
      if (match) {
        let url = '';

        // Check if we got a full URL (starts with http) or just a username/path
        if (match[1]?.startsWith('http')) {
          url = match[1];
        } else if (match[2]) {
          // Second capture group (username from path patterns)
          url = baseUrl ? baseUrl + match[2] : match[2];
        } else if (match[1] && baseUrl) {
          // First capture group but not a full URL
          url = baseUrl + match[1];
        }

        // Clean up URL - remove trailing quotes, spaces, extra chars
        url = url.replace(/["'\s>].*$/, '').replace(/\/$/, '');

        if (url && (url.startsWith('http') || platform === 'wechat')) {
          social[platform] = url;
          break;
        }
      }
    }
  }

  // Also look for social icons/links in common containers
  const socialContainerPatterns = [
    /<div[^>]*class="[^"]*social[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<ul[^>]*class="[^"]*social[^"]*"[^>]*>([\s\S]*?)<\/ul>/gi,
    /<footer[^>]*>([\s\S]*?)<\/footer>/gi,
  ];

  for (const containerPattern of socialContainerPatterns) {
    const containerMatches = html.matchAll(containerPattern);
    for (const containerMatch of containerMatches) {
      const containerHtml = containerMatch[1] || containerMatch[0];

      // Re-run extraction on container HTML for any missing platforms
      for (const [platform, regexList, baseUrl] of patterns) {
        if (social[platform]) continue;

        for (const pattern of regexList) {
          const match = containerHtml.match(pattern);
          if (match) {
            let url = '';
            if (match[1]?.startsWith('http')) {
              url = match[1];
            } else if (match[2] && baseUrl) {
              url = baseUrl + match[2];
            } else if (match[1] && baseUrl) {
              url = baseUrl + match[1];
            }

            url = url.replace(/["'\s>].*$/, '').replace(/\/$/, '');

            if (url && url.startsWith('http')) {
              social[platform] = url;
              break;
            }
          }
        }
      }
    }
  }

  return social;
}

/**
 * Extract contact information from HTML using patterns
 */
function extractBasicContactInfo(html: string): {
  phone?: string;
  email?: string;
  address?: string;
} {
  const result: { phone?: string; email?: string; address?: string } = {};

  // Email pattern
  const emailMatch = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i) ||
    html.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) {
    result.email = emailMatch[1];
  }

  // Phone pattern (various formats)
  const phoneMatch = html.match(/tel:([+\d\s\-()]+)/i) ||
    html.match(/href=["']tel:([^"']+)["']/i);
  if (phoneMatch) {
    result.phone = phoneMatch[1].replace(/\s+/g, ' ').trim();
  }

  return result;
}

/**
 * Main function: Scrape website and extract business profile
 */
export async function scrapeWebsiteForProfile(
  url: string,
  options: WebsiteScrapeOptions = {}
): Promise<WebsiteScrapeResult> {
  const {
    includeSubpages = true,
    maxPages = MAX_SUBPAGES,
    countryCode = DEFAULT_COUNTRY,
  } = options;

  console.log('[WebsiteScrape] Starting scrape for:', url);

  // Validate URL
  const validation = validateAndNormalizeUrl(url);
  if (!validation.valid || !validation.url) {
    return { success: false, error: validation.error || 'Invalid URL' };
  }
  const normalizedUrl = validation.url;
  console.log('[WebsiteScrape] Normalized URL:', normalizedUrl);

  // Fetch main page
  const mainPageResult = await fetchWebsiteContent(normalizedUrl);
  if (!mainPageResult.success || !mainPageResult.content) {
    return { success: false, error: mainPageResult.error || 'Failed to fetch main page' };
  }

  const pagesScraped: string[] = [normalizedUrl];
  const allContent: Record<string, string> = {
    'main': mainPageResult.content,
  };

  // Extract social links from HTML
  const extractedSocial = extractSocialLinks(mainPageResult.html || '');
  const extractedContact = extractBasicContactInfo(mainPageResult.html || '');

  // Discover and fetch subpages if enabled - use enhanced discovery
  if (includeSubpages && mainPageResult.html) {
    const subpages = discoverAllRelevantPages(normalizedUrl, mainPageResult.html);
    console.log('[WebsiteScrape] Discovered subpages:', subpages.length, 'pages');

    let totalContentSize = mainPageResult.content.length;

    for (const subpageUrl of subpages.slice(0, maxPages)) {
      if (totalContentSize >= MAX_TOTAL_CONTENT) {
        console.log('[WebsiteScrape] Max content size reached, stopping');
        break;
      }

      try {
        console.log('[WebsiteScrape] Fetching subpage:', subpageUrl);
        const subpageResult = await fetchWebsiteContent(subpageUrl);

        if (subpageResult.success && subpageResult.content) {
          const pageName = getPageNameFromUrl(subpageUrl);
          allContent[pageName] = subpageResult.content;
          pagesScraped.push(subpageUrl);
          totalContentSize += subpageResult.content.length;

          // Also extract social/contact from subpages
          if (subpageResult.html) {
            const subSocial = extractSocialLinks(subpageResult.html);
            Object.assign(extractedSocial, subSocial);

            const subContact = extractBasicContactInfo(subpageResult.html);
            if (subContact.email) extractedContact.email = subContact.email;
            if (subContact.phone) extractedContact.phone = subContact.phone;
          }
        }
      } catch (e) {
        console.log('[WebsiteScrape] Failed to fetch subpage:', subpageUrl);
      }
    }
  }

  console.log('[WebsiteScrape] Total pages scraped:', pagesScraped.length);

  // Extract with AI
  try {
    const profile = await extractBusinessDataWithAI(
      normalizedUrl,
      allContent,
      mainPageResult.title || '',
      extractedSocial,
      extractedContact,
      countryCode,
      pagesScraped
    );

    return {
      success: true,
      profile,
      pagesScraped,
    };
  } catch (error: any) {
    console.error('[WebsiteScrape] AI extraction error:', error);
    return {
      success: false,
      error: error.message || 'Failed to extract business data',
    };
  }
}

/**
 * Get a readable page name from URL
 */
function getPageNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\/|\/$/g, '');
    return path.replace(/[-_]/g, ' ').replace(/\//g, ' - ') || 'main';
  } catch {
    return 'page';
  }
}

/**
 * Use Gemini AI to extract structured business data - Enhanced with two-pass extraction
 */
async function extractBusinessDataWithAI(
  url: string,
  pageContents: Record<string, string>,
  title: string,
  extractedSocial: Record<string, string>,
  extractedContact: { phone?: string; email?: string },
  countryCode: string,
  pagesScraped: string[]
): Promise<AutoFilledProfile> {
  // Get Gemini AI instance
  const geminiAI = getGeminiAI();
  if (!geminiAI) {
    throw new Error('Gemini API key not configured. Please check your environment variables.');
  }

  // Build the main comprehensive prompt
  const prompt = buildWebsiteScrapePrompt({
    url,
    title,
    pageContents,
    extractedSocial,
    extractedContact,
    countryCode,
    pagesScraped,
  });

  console.log('[WebsiteScrape] PASS 1: Comprehensive extraction...');

  // First pass - comprehensive extraction
  const response = await geminiAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      temperature: 0.1,
    },
  });

  const text = response.text || '';

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('[WebsiteScrape] No JSON found in AI response');
    throw new Error('Could not extract structured data from website');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.error('[WebsiteScrape] Failed to parse AI response JSON');
    throw new Error('Invalid response format from AI');
  }

  console.log('[WebsiteScrape] PASS 1 complete. Keys extracted:', Object.keys(parsed).length);

  // Second pass - deep extraction for specific areas that might need more detail
  // Focus on: services, products, team, testimonials, USPs
  const deepExtractionNeeded = shouldDoDeepExtraction(parsed);

  if (deepExtractionNeeded) {
    console.log('[WebsiteScrape] PASS 2: Deep extraction for enhanced details...');

    try {
      const deepData = await performDeepExtraction(pageContents, countryCode, parsed.industry);

      // Merge deep extraction data with first pass
      if (deepData) {
        parsed = mergeExtractionResults(parsed, deepData);
        console.log('[WebsiteScrape] PASS 2 complete. Enhanced fields:', Object.keys(deepData).length);
      }
    } catch (e) {
      console.log('[WebsiteScrape] PASS 2 skipped due to error:', e);
      // Continue with first pass data
    }
  }

  // Map to AutoFilledProfile format
  const profile = mapToAutoFilledProfile(parsed, url, countryCode, pagesScraped, extractedSocial);

  return profile;
}

/**
 * Check if we need a second pass for more detailed extraction
 */
function shouldDoDeepExtraction(data: any): boolean {
  // Check if key areas are missing or minimal
  const productCount = (data.productsOrServices?.length || 0) +
                       (data.inventory?.products?.length || 0) +
                       (data.inventory?.services?.length || 0) +
                       (data.inventory?.properties?.length || 0) +
                       (data.inventory?.menuItems?.length || 0) +
                       (data.inventory?.rooms?.length || 0);

  // Check if products have pricing details
  const productsWithPricing = [...(data.productsOrServices || []), ...(data.inventory?.products || []), ...(data.inventory?.services || [])]
    .filter((p: any) => p.price !== undefined && p.price !== null).length;

  const hasTeam = (data.team?.length || 0) > 0;
  const hasTestimonials = (data.testimonials?.length || 0) > 0;
  const hasUSPs = (data.uniqueSellingPoints?.length || 0) > 0;

  // Do deep pass if:
  // 1. Missing products entirely
  // 2. Have products but most lack pricing
  // 3. Missing multiple other areas
  const needsProductEnrichment = productCount === 0 || (productCount > 0 && productsWithPricing < productCount * 0.5);
  const missingAreas = [productCount === 0, !hasTeam, !hasTestimonials, !hasUSPs].filter(Boolean).length;

  return needsProductEnrichment || missingAreas >= 2;
}

/**
 * Perform deep extraction focusing on specific high-value areas
 */
async function performDeepExtraction(
  pageContents: Record<string, string>,
  countryCode: string,
  detectedIndustry?: string
): Promise<any | null> {
  // Get Gemini AI instance
  const geminiAI = getGeminiAI();
  if (!geminiAI) {
    console.warn('[WebsiteScrape] Deep extraction skipped - Gemini API not available');
    return null;
  }

  // Build combined content focusing on relevant sections
  const combinedContent = Object.entries(pageContents)
    .map(([page, content]) => `=== ${page.toUpperCase()} ===\n${content.substring(0, 15000)}`)
    .join('\n\n');

  if (combinedContent.length < 500) {
    return null; // Not enough content for deep extraction
  }

  const industryContext = getIndustryExtractionContext(detectedIndustry || 'services');

  // Detect currency from content
  const currencyPatterns = [
    { pattern: /\$\s*[\d,]+/g, currency: 'USD', symbol: '$' },
    { pattern: /₹\s*[\d,]+|Rs\.?\s*[\d,]+|INR\s*[\d,]+/gi, currency: 'INR', symbol: '₹' },
    { pattern: /€\s*[\d,]+|EUR\s*[\d,]+/gi, currency: 'EUR', symbol: '€' },
    { pattern: /£\s*[\d,]+|GBP\s*[\d,]+/gi, currency: 'GBP', symbol: '£' },
    { pattern: /AED\s*[\d,]+|د\.إ\s*[\d,]+/gi, currency: 'AED', symbol: 'AED' },
  ];

  let detectedCurrency = 'USD';
  let maxMatches = 0;
  for (const { pattern, currency } of currencyPatterns) {
    const matches = combinedContent.match(pattern);
    if (matches && matches.length > maxMatches) {
      maxMatches = matches.length;
      detectedCurrency = currency;
    }
  }

  const deepPrompt = `You are a data extraction specialist. Your job is to find EVERY product, service, and pricing detail from this business website.

CRITICAL INSTRUCTIONS:
1. Extract ALL products/services with their EXACT prices as shown
2. Look for prices in formats like: $99, $99.99, $99/mo, $99 per month, Starting at $99, From $99
3. Include price ranges (e.g., "$50-$100" becomes price: 50, priceMax: 100)
4. Capture ALL variants, sizes, tiers, packages
5. Note any discounts, original prices (MRP), sale prices
6. Extract features, specifications, what's included
7. Find team members with their qualifications

DETECTED CURRENCY: ${detectedCurrency}

CONTENT TO ANALYZE:
${combinedContent.substring(0, 60000)}

INDUSTRY CONTEXT: ${industryContext}

Return JSON with these DETAILED fields - extract EVERYTHING you find:

{
  "productsOrServices": [
    {
      "name": "EXACT product/service name as displayed",
      "description": "Full description - include all details mentioned",
      "shortDescription": "One-line summary",
      "price": 99.99,
      "priceMax": null,
      "originalPrice": null,
      "priceUnit": "one-time/per month/per year/per hour/per session/per night/per sq ft/etc",
      "currency": "${detectedCurrency}",
      "category": "Category/Type",
      "subcategory": "More specific category",
      "features": ["Feature 1", "Feature 2", "Feature 3"],
      "specifications": {"key": "value"},
      "variants": [{"name": "Size/Option", "price": 0}],
      "duration": "Service duration if applicable",
      "availability": "Always/Limited/By appointment/etc",
      "popular": false,
      "featured": false,
      "isService": true
    }
  ],
  "packages": [
    {
      "name": "Package name",
      "description": "Full description",
      "price": 199,
      "originalPrice": 299,
      "includes": ["Item 1", "Item 2"],
      "duration": "Validity period",
      "popular": false
    }
  ],
  "pricingTiers": [
    {
      "name": "Basic/Standard/Pro/Enterprise",
      "price": 29,
      "period": "monthly/yearly/one-time",
      "features": ["Feature 1", "Feature 2"],
      "limitations": ["Limit 1", "Limit 2"],
      "recommended": false,
      "savings": "Save 20%"
    }
  ],
  "team": [
    {
      "name": "Full name",
      "role": "Title/Position/Designation",
      "qualifications": ["Degree 1", "Certification 2", "License 3"],
      "specializations": ["Area 1", "Area 2"],
      "experience": "X years / description",
      "bio": "Brief bio if found",
      "image": "Image URL if found"
    }
  ],
  "testimonials": [
    {
      "quote": "EXACT customer quote - preserve word-for-word",
      "author": "Customer name",
      "role": "Title/Company/Location",
      "rating": 5,
      "productService": "What they reviewed"
    }
  ],
  "uniqueSellingPoints": [
    "Specific competitive advantage",
    "What makes them unique",
    "Key differentiator"
  ],
  "differentiators": ["How they stand out from competitors"],
  "processSteps": [{"step": 1, "name": "Step name", "description": "Details"}],
  "areasServed": ["City/Area 1", "City/Area 2"],
  "clientTypes": ["Who they serve - residential/commercial/enterprise/etc"],
  "projectTypes": ["Types of projects/work they do"],
  "additionalServices": ["Secondary services not yet captured"],
  "paymentOptions": ["Credit Card", "PayPal", "Financing", "etc"],
  "guarantees": ["Money-back guarantee", "Satisfaction guarantee", "etc"]
}

IMPORTANT:
- Extract EVERY product/service/package you can find
- Include ALL pricing information - don't skip items without clear prices
- For items with "Contact for price" or "Custom quote", set price to null but still include them
- Preserve exact text for quotes and descriptions
- Return ONLY valid JSON - no markdown, no explanation`;

  const response = await geminiAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: deepPrompt,
    config: {
      temperature: 0.1,
    },
  });

  const text = response.text || '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    return null;
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

/**
 * Get industry-specific extraction context
 */
function getIndustryExtractionContext(industry: string): string {
  const contexts: Record<string, string> = {
    real_estate: 'Real Estate: Look for properties (sale/rent), listing details, agents/realtors, areas served, property types, prices, square footage, bedrooms/bathrooms, amenities, neighborhoods served.',
    healthcare: 'Healthcare: Look for doctors/specialists, treatments/procedures, departments, qualifications, appointment types, insurance accepted, facilities, certifications.',
    hospitality: 'Hospitality: Look for room types, rates, amenities, dining options, facilities, check-in times, packages, seasonal rates.',
    food_beverage: 'Food & Beverage: Look for menu items with prices, cuisine types, dietary options, specials, catering, delivery options, seating capacity.',
    professional_services: 'Professional Services: Look for service offerings, expertise areas, team qualifications, case studies, process steps, pricing models.',
    retail: 'Retail: Look for products, categories, prices, brands, shipping info, return policies, payment options.',
    education: 'Education: Look for courses, programs, faculty, fees, schedules, certifications, outcomes, admission requirements.',
    services: 'Services: Look for service offerings, pricing, process, team expertise, areas served, client types, guarantees.',
  };

  return contexts[industry] || contexts.services;
}

/**
 * Merge results from first and second extraction passes
 */
function mergeExtractionResults(first: any, second: any): any {
  const merged = { ...first };

  // Merge arrays with complex objects - add unique items from second pass
  const arrayFields = ['productsOrServices', 'team', 'testimonials', 'uniqueSellingPoints', 'differentiators', 'packages', 'pricingTiers'];

  for (const field of arrayFields) {
    if (second[field]?.length > 0) {
      const existing = merged[field] || [];
      const existingNames = new Set(existing.map((item: any) =>
        (item.name || item.quote || item.title || item)?.toLowerCase?.()
      ));

      for (const item of second[field]) {
        const itemName = (item.name || item.quote || item.title || item)?.toLowerCase?.();
        if (!existingNames.has(itemName)) {
          existing.push(item);
          existingNames.add(itemName);
        } else if (item.price !== undefined) {
          // If item exists but second pass has pricing, update with pricing
          const existingItem = existing.find((e: any) =>
            (e.name || e.quote || e.title || e)?.toLowerCase?.() === itemName
          );
          if (existingItem && existingItem.price === undefined) {
            Object.assign(existingItem, item);
          }
        }
      }
      merged[field] = existing;
    }
  }

  // Merge simple arrays
  const simpleArrayFields = ['areasServed', 'clientTypes', 'projectTypes', 'additionalServices', 'paymentOptions', 'guarantees'];
  for (const field of simpleArrayFields) {
    if (second[field]?.length > 0) {
      const existing = new Set(merged[field] || []);
      for (const item of second[field]) {
        existing.add(item);
      }
      merged[field] = Array.from(existing);
    }
  }

  // Add new fields from second pass if not present in first
  if (second.processSteps?.length > 0 && !merged.processSteps) {
    merged.processSteps = second.processSteps;
  }

  // Merge inventory if present in second pass
  if (second.inventory) {
    merged.inventory = merged.inventory || {};
    const inventoryTypes = ['products', 'services', 'rooms', 'menuItems', 'properties', 'treatments', 'courses'];

    for (const invType of inventoryTypes) {
      if (second.inventory[invType]?.length > 0) {
        const existing = merged.inventory[invType] || [];
        const existingNames = new Set(existing.map((item: any) => item.name?.toLowerCase?.()));

        for (const item of second.inventory[invType]) {
          const itemName = item.name?.toLowerCase?.();
          if (!existingNames.has(itemName)) {
            existing.push(item);
            existingNames.add(itemName);
          }
        }
        merged.inventory[invType] = existing;
      }
    }
  }

  return merged;
}

/**
 * Map AI extracted data to AutoFilledProfile schema
 */
function mapToAutoFilledProfile(
  data: any,
  url: string,
  countryCode: string,
  pagesScraped: string[],
  extractedSocial: Record<string, string>
): AutoFilledProfile {
  // Merge extracted social with AI-found social
  const socialMedia = {
    ...extractedSocial,
    ...(data.socialMedia || {}),
  };

  // Detect industry from data
  const industry = data.industry || detectIndustryFromData(data);

  // Parse operating hours if present - convert to OperatingHours format
  let operatingHours: any;
  if (data.operatingHours && typeof data.operatingHours === 'object') {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
    const schedule: Record<string, { isOpen: boolean; openTime?: string; closeTime?: string }> = {};
    let hasSchedule = false;

    for (const day of days) {
      const dayData = data.operatingHours[day];
      if (dayData && dayData.open && dayData.close) {
        schedule[day] = {
          isOpen: true,
          openTime: dayData.open,
          closeTime: dayData.close,
        };
        hasSchedule = true;
      } else {
        schedule[day] = { isOpen: false };
      }
    }

    if (hasSchedule) {
      operatingHours = {
        isOpen24x7: false,
        schedule,
        specialNote: data.operatingHours.specialNote,
        timezone: data.operatingHours.timezone,
      };
    }
  }

  // Extract contact information from nested contact object or direct fields
  const contact = data.contact || {};
  const primaryPhone = contact.primaryPhone || data.phone;
  const primaryEmail = contact.primaryEmail || data.email;

  // Note: Using type assertion to match the field names expected by AutoFillPreviewModal
  // The AutoFilledProfile type uses Partial<BusinessIdentity> which has 'name',
  // but the actual usage throughout the codebase uses 'businessName' and 'pincode'
  // This matches the pattern in business-autofill-service.ts
  const profile = {
    identity: {
      businessName: data.businessName || data.name || undefined,
      legalName: data.legalName || undefined,
      industry: industry,
      subIndustry: data.subIndustry || undefined,
      businessType: data.businessType || undefined,
      description: data.description || undefined,
      shortDescription: data.shortDescription || undefined,
      tagline: data.tagline || undefined,
      phone: primaryPhone || undefined,
      secondaryPhone: contact.secondaryPhone || undefined,
      whatsapp: contact.whatsapp || undefined,
      tollFree: contact.tollFree || undefined,
      email: primaryEmail || undefined,
      supportEmail: contact.supportEmail || undefined,
      salesEmail: contact.salesEmail || undefined,
      bookingEmail: contact.bookingEmail || undefined,
      website: url,
      address: data.address ? {
        street: data.address.street || data.address.line1 || undefined,
        street2: data.address.street2 || undefined,
        landmark: data.address.landmark || undefined,
        area: data.address.area || undefined,
        city: data.address.city || '',
        state: data.address.state || data.address.province || '',
        country: data.address.country || '',
        pincode: data.address.pincode || data.address.zip || data.address.postalCode || undefined,
      } : undefined,
      locations: data.locations?.map((loc: any) => ({
        name: loc.name,
        address: loc.address,
        phone: loc.phone,
        isHeadquarters: loc.isHeadquarters || false,
      })) || undefined,
      serviceAreas: data.serviceAreas || undefined,
      deliveryZones: data.deliveryZones || undefined,
      internationalShipping: data.internationalShipping || undefined,
      socialMedia: Object.keys(socialMedia).length > 0 ? {
        // Major social platforms
        instagram: socialMedia.instagram,
        facebook: socialMedia.facebook,
        linkedin: socialMedia.linkedin,
        twitter: socialMedia.twitter,
        youtube: socialMedia.youtube,
        pinterest: socialMedia.pinterest,
        tiktok: socialMedia.tiktok,
        threads: socialMedia.threads,
        snapchat: socialMedia.snapchat,
        // Messaging
        whatsappBusiness: socialMedia.whatsapp || socialMedia.whatsappBusiness,
        telegram: socialMedia.telegram,
        wechat: socialMedia.wechat,
        line: socialMedia.line,
        // Business & Reviews
        googleBusiness: socialMedia.googleBusiness,
        yelp: socialMedia.yelp,
        tripadvisor: socialMedia.tripadvisor,
        trustpilot: socialMedia.trustpilot,
        glassdoor: socialMedia.glassdoor,
        // Food & Delivery
        zomato: socialMedia.zomato,
        swiggy: socialMedia.swiggy,
        ubereats: socialMedia.ubereats,
        doordash: socialMedia.doordash,
        grubhub: socialMedia.grubhub,
        opentable: socialMedia.opentable,
        // Real Estate
        zillow: socialMedia.zillow,
        realtor: socialMedia.realtor,
        trulia: socialMedia.trulia,
        houzz: socialMedia.houzz,
        redfin: socialMedia.redfin,
        // Travel
        booking: socialMedia.booking,
        airbnb: socialMedia.airbnb,
        expedia: socialMedia.expedia,
        // Professional
        github: socialMedia.github,
        behance: socialMedia.behance,
        dribbble: socialMedia.dribbble,
        // Regional
        vk: socialMedia.vk,
        weibo: socialMedia.weibo,
      } : undefined,
      operatingHours,
      languages: data.languages,
      yearEstablished: data.yearEstablished ? parseInt(data.yearEstablished) : undefined,
    },
    personality: {
      description: data.description || data.about || data.story || undefined,
      shortDescription: data.shortDescription || undefined,
      missionStatement: data.missionStatement || undefined,
      visionStatement: data.visionStatement || undefined,
      story: data.story || data.founderStory || undefined,
      uniqueSellingPoints: data.uniqueSellingPoints || data.usps || undefined,
      tagline: data.tagline || data.slogan || undefined,
      brandVoice: data.brandVoice || undefined,
      brandValues: data.brandValues || undefined,
    },
    customerProfile: {
      targetAudience: data.targetAudience || undefined,
      primaryAudience: data.primaryAudience || undefined,
      customerPainPoints: data.customerPainPoints || data.painPoints || undefined,
      differentiators: data.differentiators || data.competitiveAdvantages || undefined,
      valuePropositions: data.valuePropositions || data.benefits || undefined,
      marketPosition: data.marketPosition || data.positioning || undefined,
      idealCustomerProfile: data.idealCustomerProfile || data.idealCustomer || undefined,
      objectionHandlers: data.objectionHandlers || undefined,
      customerType: data.customerType || data.clientTypes || undefined,
      customerDemographics: data.customerDemographics || data.demographics || undefined,
      commonQueries: data.commonQueries || data.commonQuestions || undefined,
    },
    knowledge: {
      productsOrServices: data.productsOrServices?.map((item: any) => ({
        name: item.name,
        description: item.description || '',
        shortDescription: item.shortDescription || undefined,
        category: item.category || undefined,
        subcategory: item.subcategory || undefined,
        price: item.price || undefined,
        priceMax: item.priceMax || undefined,
        originalPrice: item.originalPrice || item.mrp || undefined,
        priceUnit: item.priceUnit || undefined,
        priceRange: item.priceRange || undefined,
        currency: item.currency || undefined,
        duration: item.duration || undefined,
        features: item.features || undefined,
        specifications: item.specifications || undefined,
        variants: item.variants || undefined,
        isService: item.isService ?? true,
        isPopular: item.isPopular || item.popular || false,
        isFeatured: item.isFeatured || item.featured || false,
        availability: item.availability || undefined,
      })) || [],
      packages: data.packages?.map((pkg: any) => ({
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        originalPrice: pkg.originalPrice || undefined,
        duration: pkg.duration,
        includes: pkg.includes || [],
        isPopular: pkg.isPopular || pkg.popular || false,
        isFeatured: pkg.isFeatured || pkg.featured || false,
      })) || undefined,
      pricingTiers: data.pricingTiers?.map((tier: any) => ({
        name: tier.name,
        price: tier.price,
        period: tier.period,
        features: tier.features || [],
        limitations: tier.limitations || undefined,
        isRecommended: tier.isRecommended || tier.recommended || false,
        savings: tier.savings || undefined,
      })) || undefined,
      currentOffers: data.currentOffers?.map((offer: any) => ({
        title: offer.title,
        description: offer.description,
        discount: offer.discount,
        code: offer.code,
        validUntil: offer.validUntil,
        conditions: offer.conditions,
      })) || undefined,
      faqs: data.faqs?.map((faq: any) => ({
        question: faq.question,
        answer: faq.answer,
        category: faq.category || undefined,
      })) || [],
      paymentMethods: data.paymentMethods || data.paymentOptions || undefined,
      acceptedCards: data.acceptedCards || undefined,
      emiAvailable: data.emiAvailable || undefined,
      codAvailable: data.codAvailable || undefined,
      guarantees: data.guarantees || undefined,
      policies: data.policies || data.checkInCheckOut || data.petPolicy ? {
        returnPolicy: data.policies?.returnPolicy,
        returnWindow: data.policies?.returnWindow,
        refundPolicy: data.policies?.refundPolicy,
        refundTimeline: data.policies?.refundTimeline,
        cancellationPolicy: data.policies?.cancellationPolicy || data.cancellationPolicy,
        cancellationFee: data.policies?.cancellationFee,
        exchangePolicy: data.policies?.exchangePolicy,
        warrantyPolicy: data.policies?.warrantyPolicy,
        shippingPolicy: data.policies?.shippingPolicy,
        freeShippingThreshold: data.policies?.freeShippingThreshold,
        deliveryTimeline: data.policies?.deliveryTimeline,
        privacyHighlights: data.policies?.privacyHighlights,
        termsHighlights: data.policies?.termsHighlights,
        // Hotel/Hospitality specific policies
        checkInCheckOut: data.policies?.checkInCheckOut || data.checkInCheckOut || data.checkInTime || data.checkOutTime ? {
          checkIn: data.policies?.checkInCheckOut?.checkIn || data.checkInTime,
          checkOut: data.policies?.checkInCheckOut?.checkOut || data.checkOutTime,
          earlyCheckIn: data.policies?.checkInCheckOut?.earlyCheckIn,
          lateCheckOut: data.policies?.checkInCheckOut?.lateCheckOut,
        } : undefined,
        petPolicy: data.policies?.petPolicy || data.petPolicy,
        smokingPolicy: data.policies?.smokingPolicy || data.smokingPolicy,
        childPolicy: data.policies?.childPolicy || data.childPolicy,
        dresscode: data.policies?.dresscode || data.dresscode,
      } : undefined,
    },
    inventory: mapInventoryData(data.inventory),
    testimonials: data.testimonials?.map((t: any) => ({
      quote: t.quote || t.text,
      author: t.author || t.name,
      role: t.role || undefined,
      location: t.location || undefined,
      rating: t.rating || undefined,
      date: t.date || undefined,
      platform: t.platform || undefined,
      verified: t.verified || undefined,
      productService: t.productService || undefined,
      source: 'website',
      sourceUrl: url,
    })) || [],
    team: data.team?.map((member: any) => ({
      name: member.name,
      role: member.role,
      department: member.department,
      bio: member.bio,
      qualifications: member.qualifications || [],
      experience: member.experience,
      specializations: member.specializations || [],
      languages: member.languages || [],
      image: member.image,
      linkedin: member.linkedin,
      email: member.email,
    })) || undefined,
    caseStudies: data.caseStudies?.map((cs: any) => ({
      title: cs.title,
      client: cs.client,
      industry: cs.industry,
      challenge: cs.challenge,
      solution: cs.solution,
      results: cs.results,
      testimonial: cs.testimonial,
    })) || undefined,
    awards: data.awards?.map((award: any) =>
      typeof award === 'string' ? { name: award } : {
        name: award.name,
        year: award.year,
        awardedBy: award.awardedBy,
        category: award.category,
      }
    ) || undefined,
    certifications: data.certifications?.map((cert: any) =>
      typeof cert === 'string' ? { name: cert } : {
        name: cert.name,
        issuedBy: cert.issuedBy,
        validUntil: cert.validUntil,
        number: cert.number,
      }
    ) || undefined,
    accreditations: data.accreditations || undefined,
    partnerships: data.partnerships || undefined,
    clients: data.clients || undefined,
    featuredIn: data.featuredIn || undefined,
    // Hotel/Hospitality amenities
    hotelAmenities: (data.amenities || data.hotelAmenities || data.keyAmenities || data.facilities)?.map((a: any, i: number) =>
      typeof a === 'string' ? {
        id: `amenity_${i}`,
        name: a,
        category: 'general',
        isActive: true,
      } : {
        id: a.id || `amenity_${i}`,
        name: a.name,
        category: a.category || 'general',
        description: a.description,
        isActive: a.isActive ?? true,
        isPaid: a.isPaid,
        price: a.price,
      }
    ) || undefined,
    industrySpecificData: {
      ...(data.industrySpecificData || {}),
      founders: data.founders,
      founderStory: data.founderStory,
      teamSize: data.teamSize,
      // New fields from deep extraction
      areasServed: data.areasServed || data.serviceAreas,
      clientTypes: data.clientTypes,
      projectTypes: data.projectTypes,
      additionalServices: data.additionalServices,
      processSteps: data.processSteps,
      differentiators: data.differentiators,
      // Hotel/Hospitality specific
      starRating: data.starRating || data.rating,
      propertyType: data.propertyType,
      totalRooms: data.totalRooms || data.numberOfRooms,
      checkInTime: data.checkInTime,
      checkOutTime: data.checkOutTime,
      parking: data.parking,
      wifi: data.wifi || data.internet,
      pool: data.pool,
      gym: data.gym || data.fitness,
      spa: data.spa,
      restaurant: data.restaurant || data.dining,
      // Restaurant specific
      cuisineType: data.cuisineType || data.cuisine,
      seatingCapacity: data.seatingCapacity,
      reservationsRequired: data.reservationsRequired,
      // Common
      priceRange: data.priceRange,
      specialties: data.specialties,
    },
    technicalInfo: data.technicalInfo || undefined,
    sustainability: data.sustainability || undefined,
    accessibility: data.accessibility || undefined,
    additionalInfo: data.additionalInfo || undefined,
    fromTheWeb: {
      websiteContent: data.rawContent || undefined,
      otherFindings: data.otherFindings || [],
      additionalInfo: data.schemaOrgData || undefined,
      confidence: data.confidence || undefined,
      // Additional context from deep extraction
      areasServed: data.areasServed,
      clientTypes: data.clientTypes,
      projectTypes: data.projectTypes,
      processSteps: data.processSteps,
    },
    source: {
      placesData: false,
      aiEnriched: true,
      fetchedAt: new Date(),
      detectedCountry: countryCode,
    },
  };

  // Add scraped pages info
  (profile.source as any).websiteUrl = url;
  (profile.source as any).pagesScraped = pagesScraped;

  return profile as AutoFilledProfile;
}

/**
 * Detect industry from extracted data
 */
function detectIndustryFromData(data: any): string {
  const text = JSON.stringify(data).toLowerCase();

  if (text.includes('menu') || text.includes('cuisine') || text.includes('dish') || text.includes('food')) {
    return 'food_beverage';
  }
  if (text.includes('room') || text.includes('hotel') || text.includes('booking') || text.includes('check-in')) {
    return 'hospitality';
  }
  if (text.includes('treatment') || text.includes('doctor') || text.includes('patient') || text.includes('clinic')) {
    return 'healthcare';
  }
  if (text.includes('property') || text.includes('real estate') || text.includes('apartment') || text.includes('listing')) {
    return 'real_estate';
  }
  if (text.includes('product') || text.includes('shop') || text.includes('cart') || text.includes('price')) {
    return 'retail';
  }
  if (text.includes('course') || text.includes('training') || text.includes('learn') || text.includes('class')) {
    return 'education';
  }

  return 'services';
}

/**
 * Map inventory data to the correct format
 */
function mapInventoryData(inventory: any): AutoFilledProfile['inventory'] {
  if (!inventory) return undefined;

  const result: AutoFilledProfile['inventory'] = {};

  if (inventory.rooms?.length > 0) {
    result.rooms = inventory.rooms.map((room: any): RoomInventoryItem => ({
      name: room.name,
      category: room.category || room.type,
      description: room.description,
      price: parsePrice(room.price),
      priceUnit: room.priceUnit || 'per night',
      maxOccupancy: room.maxOccupancy || room.capacity,
      bedType: room.bedType,
      amenities: room.amenities,
      size: room.size,
      view: room.view,
    }));
  }

  if (inventory.menuItems?.length > 0) {
    result.menuItems = inventory.menuItems.map((item: any): MenuInventoryItem => ({
      name: item.name,
      category: item.category,
      description: item.description,
      price: parsePrice(item.price),
      isVeg: item.isVeg ?? item.vegetarian,
      isVegan: item.isVegan ?? item.vegan,
      spiceLevel: item.spiceLevel,
      servingSize: item.servingSize || item.serves,
      popular: item.popular || item.recommended || item.bestseller,
    }));
  }

  if (inventory.products?.length > 0) {
    result.products = inventory.products.map((product: any): ProductInventoryItem => ({
      name: product.name,
      category: product.category,
      description: product.description,
      price: parsePrice(product.price),
      mrp: parsePrice(product.mrp || product.originalPrice),
      brand: product.brand,
      sku: product.sku,
      inStock: product.inStock ?? true,
      specifications: product.specifications || product.specs,
    }));
  }

  if (inventory.services?.length > 0) {
    result.services = inventory.services.map((service: any): ServiceInventoryItem => ({
      name: service.name,
      category: service.category,
      description: service.description,
      price: parsePrice(service.price),
      duration: service.duration,
      doctor: service.doctor || service.provider,
      specialization: service.specialization,
      availability: service.availability,
    }));
  }

  if (inventory.properties?.length > 0) {
    result.properties = inventory.properties.map((property: any): PropertyInventoryItem => ({
      title: property.title || property.name,
      type: property.type,
      transactionType: property.transactionType || property.listingType,
      price: parsePrice(property.price),
      priceUnit: property.priceUnit,
      location: property.location,
      area: property.area || property.size,
      bedrooms: property.bedrooms || property.bhk,
      bathrooms: property.bathrooms,
      amenities: property.amenities,
      description: property.description,
    }));
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Parse price from various formats
 */
function parsePrice(price: any): number | undefined {
  if (typeof price === 'number') return price;
  if (!price) return undefined;

  const priceStr = String(price);
  // Remove currency symbols and commas
  const cleaned = priceStr.replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleaned);

  return isNaN(parsed) ? undefined : parsed;
}

/**
 * Scrape multiple specific pages (for manual selection)
 */
export async function scrapeMultiplePages(urls: string[]): Promise<{
  success: boolean;
  contents: Record<string, string>;
  errors: Record<string, string>;
}> {
  const contents: Record<string, string> = {};
  const errors: Record<string, string> = {};

  for (const url of urls.slice(0, MAX_SUBPAGES + 1)) {
    const result = await fetchWebsiteContent(url);
    if (result.success && result.content) {
      contents[url] = result.content;
    } else {
      errors[url] = result.error || 'Failed to fetch';
    }
  }

  return {
    success: Object.keys(contents).length > 0,
    contents,
    errors,
  };
}

/**
 * Check if a URL is reachable
 */
export async function checkUrlReachable(url: string): Promise<{
  reachable: boolean;
  error?: string;
  finalUrl?: string;
}> {
  try {
    const validation = validateAndNormalizeUrl(url);
    if (!validation.valid || !validation.url) {
      return { reachable: false, error: validation.error };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(validation.url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BusinessProfileBot/1.0)',
      },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (response.ok) {
      return { reachable: true, finalUrl: response.url };
    }

    // Try GET if HEAD fails (some servers don't support HEAD)
    if (response.status === 405) {
      const getResponse = await fetch(validation.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BusinessProfileBot/1.0)',
        },
        redirect: 'follow',
      });
      if (getResponse.ok) {
        return { reachable: true, finalUrl: getResponse.url };
      }
    }

    return {
      reachable: false,
      error: `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { reachable: false, error: 'Connection timeout' };
    }
    return { reachable: false, error: error.message || 'Connection failed' };
  }
}
