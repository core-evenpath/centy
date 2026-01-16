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

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

// Constants for scraping
const MAX_CONTENT_LENGTH = 100000; // 100KB per page
const MAX_TOTAL_CONTENT = 500000; // 500KB total
const FETCH_TIMEOUT = 30000; // 30 seconds
const MAX_SUBPAGES = 5;

// Common relevant subpage patterns
const RELEVANT_SUBPAGE_PATTERNS = [
  /\/(about|about-us|about_us|who-we-are)/i,
  /\/(contact|contact-us|contact_us|get-in-touch)/i,
  /\/(menu|our-menu|food-menu|drinks-menu)/i,
  /\/(services|our-services|what-we-do)/i,
  /\/(products|our-products|shop|store|catalog)/i,
  /\/(team|our-team|meet-the-team|staff)/i,
  /\/(pricing|prices|rates|fees)/i,
  /\/(faq|faqs|frequently-asked-questions)/i,
  /\/(rooms|accommodations|room-types|suites)/i,
  /\/(treatments|therapies|procedures)/i,
  /\/(portfolio|projects|work|case-studies)/i,
  /\/(testimonials|reviews|client-reviews)/i,
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
 * Discover relevant subpages from main page HTML
 */
export function discoverRelevantPages(baseUrl: string, html: string): string[] {
  const baseUrlObj = new URL(baseUrl);
  const discovered = new Set<string>();

  // Extract all links
  const linkMatches = html.matchAll(/<a[^>]*href=["']([^"'#]+)["'][^>]*>/gi);

  for (const match of linkMatches) {
    let href = match[1];

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

      // Check if this is a relevant page
      const path = absoluteUrl.pathname;
      for (const pattern of RELEVANT_SUBPAGE_PATTERNS) {
        if (pattern.test(path)) {
          // Normalize URL (remove trailing slash, lowercase)
          absoluteUrl.pathname = absoluteUrl.pathname.replace(/\/$/, '');
          discovered.add(absoluteUrl.toString());
          break;
        }
      }
    } catch {
      // Invalid URL, skip
    }
  }

  return Array.from(discovered).slice(0, MAX_SUBPAGES);
}

/**
 * Extract social media links from HTML
 */
function extractSocialLinks(html: string): Record<string, string> {
  const social: Record<string, string> = {};

  const patterns: [string, RegExp][] = [
    ['instagram', /href=["'](https?:\/\/(www\.)?instagram\.com\/[^"']+)["']/i],
    ['facebook', /href=["'](https?:\/\/(www\.)?facebook\.com\/[^"']+)["']/i],
    ['twitter', /href=["'](https?:\/\/(www\.)?(twitter\.com|x\.com)\/[^"']+)["']/i],
    ['linkedin', /href=["'](https?:\/\/(www\.)?linkedin\.com\/(company|in)\/[^"']+)["']/i],
    ['youtube', /href=["'](https?:\/\/(www\.)?youtube\.com\/(channel|c|user|@)\/[^"']+)["']/i],
  ];

  for (const [platform, pattern] of patterns) {
    const match = html.match(pattern);
    if (match) {
      social[platform] = match[1];
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

  // Discover and fetch subpages if enabled
  if (includeSubpages && mainPageResult.html) {
    const subpages = discoverRelevantPages(normalizedUrl, mainPageResult.html);
    console.log('[WebsiteScrape] Discovered subpages:', subpages);

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
 * Use Gemini AI to extract structured business data
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
  // Build the prompt
  const prompt = buildWebsiteScrapePrompt({
    url,
    title,
    pageContents,
    extractedSocial,
    extractedContact,
    countryCode,
    pagesScraped,
  });

  console.log('[WebsiteScrape] Sending to AI for extraction...');

  const response = await ai.models.generateContent({
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

  console.log('[WebsiteScrape] AI extraction complete with keys:', Object.keys(parsed));

  // Map to AutoFilledProfile format
  const profile = mapToAutoFilledProfile(parsed, url, countryCode, pagesScraped, extractedSocial);

  return profile;
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
        instagram: socialMedia.instagram,
        facebook: socialMedia.facebook,
        linkedin: socialMedia.linkedin,
        twitter: socialMedia.twitter,
        youtube: socialMedia.youtube,
        pinterest: socialMedia.pinterest,
        tiktok: socialMedia.tiktok,
        whatsappBusiness: socialMedia.whatsappBusiness,
        googleBusiness: socialMedia.googleBusiness,
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
      customerPainPoints: data.customerPainPoints || undefined,
    },
    knowledge: {
      productsOrServices: data.productsOrServices?.map((item: any) => ({
        name: item.name,
        description: item.description || '',
        shortDescription: item.shortDescription || undefined,
        category: item.category || undefined,
        price: item.price || undefined,
        priceUnit: item.priceUnit || undefined,
        priceRange: item.priceRange || undefined,
        duration: item.duration || undefined,
        isService: item.isService ?? true,
        isPopular: item.isPopular || item.popular || false,
        isFeatured: item.isFeatured || false,
        availability: item.availability || undefined,
      })) || [],
      packages: data.packages?.map((pkg: any) => ({
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        duration: pkg.duration,
        includes: pkg.includes || [],
        isPopular: pkg.isPopular || false,
      })) || undefined,
      pricingTiers: data.pricingTiers?.map((tier: any) => ({
        name: tier.name,
        price: tier.price,
        period: tier.period,
        features: tier.features || [],
        isRecommended: tier.isRecommended || false,
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
      paymentMethods: data.paymentMethods || undefined,
      acceptedCards: data.acceptedCards || undefined,
      emiAvailable: data.emiAvailable || undefined,
      codAvailable: data.codAvailable || undefined,
      policies: data.policies ? {
        returnPolicy: data.policies.returnPolicy,
        returnWindow: data.policies.returnWindow,
        refundPolicy: data.policies.refundPolicy,
        refundTimeline: data.policies.refundTimeline,
        cancellationPolicy: data.policies.cancellationPolicy,
        cancellationFee: data.policies.cancellationFee,
        exchangePolicy: data.policies.exchangePolicy,
        warrantyPolicy: data.policies.warrantyPolicy,
        shippingPolicy: data.policies.shippingPolicy,
        freeShippingThreshold: data.policies.freeShippingThreshold,
        deliveryTimeline: data.policies.deliveryTimeline,
        privacyHighlights: data.policies.privacyHighlights,
        termsHighlights: data.policies.termsHighlights,
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
    industrySpecificData: {
      ...(data.industrySpecificData || {}),
      founders: data.founders,
      founderStory: data.founderStory,
      teamSize: data.teamSize,
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
