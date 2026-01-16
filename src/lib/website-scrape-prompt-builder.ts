/**
 * Website Scrape Prompt Builder
 *
 * Builds AI prompts specifically for extracting business data from website content.
 * Designed to work with the website-scrape-service.
 */

import {
  getCountryConfig,
  DEFAULT_COUNTRY,
  type CountryAutoFillConfig,
} from './country-autofill-config';

export interface WebsiteScrapePromptParams {
  url: string;
  title: string;
  pageContents: Record<string, string>;
  extractedSocial: Record<string, string>;
  extractedContact: { phone?: string; email?: string };
  countryCode?: string;
  pagesScraped: string[];
}

/**
 * Build a comprehensive prompt for extracting business data from website content
 */
export function buildWebsiteScrapePrompt(params: WebsiteScrapePromptParams): string {
  const {
    url,
    title,
    pageContents,
    extractedSocial,
    extractedContact,
    countryCode = DEFAULT_COUNTRY,
    pagesScraped,
  } = params;

  const config = getCountryConfig(countryCode);

  // Build page content sections
  const contentSections = Object.entries(pageContents)
    .map(([pageName, content]) => {
      // Truncate very long content
      const truncatedContent = content.length > 30000
        ? content.substring(0, 30000) + '\n... [content truncated]'
        : content;
      return `=== ${pageName.toUpperCase()} PAGE ===\n${truncatedContent}`;
    })
    .join('\n\n');

  // Build extracted data section
  const extractedDataSection = buildExtractedDataSection(extractedSocial, extractedContact);

  // Build industry-specific inventory schemas
  const { inventorySchema, industryDataSchema } = buildIndustrySchemas(config);

  return `You are an expert at extracting structured business information from website content.

## TASK
Analyze the following website content and extract comprehensive business profile information.
Return the data in the specified JSON format.

## WEBSITE INFORMATION
- **URL:** ${url}
- **Page Title:** ${title}
- **Country Context:** ${config.name} (${config.code}) ${config.flag}
- **Currency:** ${config.currency.code} (${config.currency.symbol})
- **Pages Scraped:** ${pagesScraped.length}

## PRE-EXTRACTED DATA (Already found from HTML)
${extractedDataSection}

## WEBSITE CONTENT

${contentSections}

## EXTRACTION RULES

1. **ACCURACY IS CRITICAL** - Only extract information that is explicitly stated on the website
2. **DO NOT INVENT DATA** - Return null for any field where information is not found
3. **PRESERVE EXACT TEXT** - For testimonials, quotes, and descriptions, use the exact wording from the website
4. **CURRENCY** - All prices should be in ${config.currency.code} (${config.currency.symbol})
5. **CONTACT INFO** - Prefer the pre-extracted data for phone/email/social if AI-extracted matches
6. **STRUCTURED DATA** - If JSON-LD or schema.org data is present, prioritize it
7. **INVENTORY** - Extract ALL products/services/menu items with prices when available
8. **OPERATING HOURS** - Extract if clearly stated on the website

## OUTPUT FORMAT (JSON)

Return ONLY valid JSON matching this structure:

{
  "businessName": "Extract from logo, header, title, or footer",
  "tagline": "Official tagline or slogan if present",
  "description": "About the business - combine from About page and meta descriptions",
  "industry": "Detect: food_beverage, hospitality, healthcare, real_estate, retail, education, services, or custom",

  "phone": "Primary phone number with country code",
  "email": "Primary contact email",
  "address": {
    "street": "Street address",
    "city": "City name",
    "state": "State/Province",
    "country": "Country",
    "pincode": "Postal/ZIP code"
  },

  "socialMedia": {
    "instagram": "Full Instagram URL or null",
    "facebook": "Full Facebook URL or null",
    "linkedin": "Full LinkedIn URL or null",
    "twitter": "Full Twitter/X URL or null",
    "youtube": "Full YouTube URL or null"
  },

  "operatingHours": {
    "monday": { "open": "9:00 AM", "close": "6:00 PM" },
    "tuesday": { "open": "9:00 AM", "close": "6:00 PM" },
    "wednesday": { "open": "9:00 AM", "close": "6:00 PM" },
    "thursday": { "open": "9:00 AM", "close": "6:00 PM" },
    "friday": { "open": "9:00 AM", "close": "6:00 PM" },
    "saturday": { "open": "10:00 AM", "close": "4:00 PM" },
    "sunday": null
  },

  "languages": ["Languages spoken or supported"],
  "yearEstablished": "Year as number if mentioned",
  "founders": "Founder/owner names if mentioned",
  "teamSize": "Team size if mentioned (e.g., '10-50 employees')",

  "uniqueSellingPoints": [
    "What makes this business unique",
    "Key differentiators mentioned",
    "Special features or benefits"
  ],

  "targetAudience": [
    "Who the business serves",
    "Customer segments"
  ],

  "productsOrServices": [
    {
      "name": "Product or service name",
      "description": "Brief description",
      "price": null,
      "isService": true
    }
  ],

  "faqs": [
    {
      "question": "Question from FAQ section",
      "answer": "Answer as stated on website"
    }
  ],

  "paymentMethods": ["Accepted payment methods if mentioned"],

${inventorySchema}

  "testimonials": [
    {
      "quote": "Exact testimonial text from website",
      "author": "Customer name if available",
      "role": "Customer title/company if available"
    }
  ],

  "awards": ["Awards or recognitions mentioned"],
  "certifications": ["Business certifications or accreditations"],

${industryDataSchema}

  "otherFindings": [
    "Any other interesting facts not fitting other categories"
  ]
}

## IMPORTANT NOTES

- Return ONLY the JSON object, no markdown formatting or explanation
- Use null for fields with no data (not empty strings or arrays)
- For arrays, use empty array [] only if the category exists but has no items
- Prices should be numbers only (e.g., 1500 not "${config.currency.symbol}1,500")
- Include all menu items, products, or services found with their prices
- Operating hours should use 12-hour format with AM/PM
- Social media URLs should be complete URLs (https://...)

Extract the business profile now:`;
}

/**
 * Build the extracted data section of the prompt
 */
function buildExtractedDataSection(
  social: Record<string, string>,
  contact: { phone?: string; email?: string }
): string {
  const lines: string[] = [];

  if (contact.phone) {
    lines.push(`Phone: ${contact.phone}`);
  }
  if (contact.email) {
    lines.push(`Email: ${contact.email}`);
  }

  const socialPlatforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'youtube'];
  for (const platform of socialPlatforms) {
    if (social[platform]) {
      lines.push(`${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${social[platform]}`);
    }
  }

  return lines.length > 0 ? lines.join('\n') : 'None extracted yet';
}

/**
 * Build industry-specific inventory and data schemas
 */
function buildIndustrySchemas(
  config: CountryAutoFillConfig
): { inventorySchema: string; industryDataSchema: string } {
  const currency = config.currency.symbol;

  // Since we don't know the industry yet, include all possible inventory schemas
  return {
    inventorySchema: `  "inventory": {
    "rooms": [
      {
        "name": "Room type name (e.g., Deluxe Room)",
        "category": "Standard/Deluxe/Premium/Suite",
        "description": "Room description",
        "price": 5000,
        "priceUnit": "per night",
        "maxOccupancy": 2,
        "bedType": "King/Queen/Twin",
        "amenities": ["WiFi", "AC", "TV"],
        "size": "350 sq ft",
        "view": "City View"
      }
    ],
    "menuItems": [
      {
        "name": "Dish name",
        "category": "Starters/Main Course/Desserts",
        "description": "Dish description",
        "price": 350,
        "isVeg": true,
        "isVegan": false,
        "spiceLevel": "Medium",
        "popular": true
      }
    ],
    "products": [
      {
        "name": "Product name",
        "category": "Category",
        "description": "Description",
        "price": 999,
        "mrp": 1299,
        "brand": "Brand name",
        "inStock": true
      }
    ],
    "services": [
      {
        "name": "Service name",
        "category": "Consultation/Treatment",
        "description": "Service description",
        "price": 500,
        "duration": "30 mins",
        "doctor": "Dr. Name if applicable"
      }
    ],
    "properties": [
      {
        "title": "Property title",
        "type": "Apartment/Villa/Commercial",
        "transactionType": "Sale/Rent",
        "price": 5000000,
        "priceUnit": "total or per month",
        "location": "Area, City",
        "area": "1500 sq ft",
        "bedrooms": 3,
        "bathrooms": 2,
        "amenities": ["Gym", "Pool"]
      }
    ]
  },`,

    industryDataSchema: `  "industryData": {
    "cuisineTypes": ["Types of cuisine if restaurant"],
    "starRating": "Hotel star rating if applicable",
    "specializations": ["Medical specializations if healthcare"],
    "propertyTypes": ["Types of properties if real estate"],
    "productCategories": ["Main product categories if retail"],
    "accreditations": ["Professional accreditations"],
    "deliveryOptions": ["Delivery/shipping options"],
    "bookingRequired": "Whether booking is required",
    "parkingInfo": "Parking availability"
  },`,
  };
}

/**
 * Build a simpler prompt for quick extraction (single page, basic info only)
 */
export function buildQuickScrapePrompt(
  url: string,
  content: string,
  countryCode?: string
): string {
  const config = getCountryConfig(countryCode);

  return `Extract basic business information from this website content.

URL: ${url}
Country: ${config.name}
Currency: ${config.currency.symbol}

CONTENT:
${content.substring(0, 20000)}

Return JSON with:
{
  "businessName": "Name from logo/header/title",
  "description": "Brief description",
  "phone": "Phone with country code",
  "email": "Contact email",
  "website": "${url}",
  "industry": "Detected industry type",
  "services": ["Main services offered"],
  "priceRange": "Price range if visible"
}

Return ONLY valid JSON.`;
}

/**
 * Build prompt for extracting specific sections
 */
export function buildSectionExtractionPrompt(
  section: 'menu' | 'services' | 'products' | 'rooms' | 'team' | 'testimonials',
  content: string,
  countryCode?: string
): string {
  const config = getCountryConfig(countryCode);
  const currency = config.currency.symbol;

  const sectionPrompts: Record<string, string> = {
    menu: `Extract ALL menu items from this restaurant content.

Return JSON:
{
  "menuItems": [
    {
      "name": "Dish name",
      "category": "Category",
      "description": "Description if available",
      "price": 250,
      "isVeg": true,
      "popular": false
    }
  ]
}

IMPORTANT: Extract ALL dishes with exact prices in ${config.currency.code}. Do not summarize or skip items.`,

    services: `Extract ALL services from this business content.

Return JSON:
{
  "services": [
    {
      "name": "Service name",
      "description": "Service description",
      "price": 500,
      "duration": "Duration if mentioned"
    }
  ]
}

Extract ALL services with prices in ${config.currency.code}.`,

    products: `Extract ALL products from this content.

Return JSON:
{
  "products": [
    {
      "name": "Product name",
      "category": "Category",
      "price": 999,
      "mrp": 1299,
      "description": "Description"
    }
  ]
}

Extract ALL products with prices in ${config.currency.code}.`,

    rooms: `Extract ALL room types from this hotel content.

Return JSON:
{
  "rooms": [
    {
      "name": "Room type name",
      "category": "Category",
      "price": 5000,
      "priceUnit": "per night",
      "maxOccupancy": 2,
      "amenities": ["WiFi", "AC"],
      "size": "Size if mentioned"
    }
  ]
}

Extract ALL room types with prices in ${config.currency.code}.`,

    team: `Extract team member information from this content.

Return JSON:
{
  "team": [
    {
      "name": "Person name",
      "role": "Job title",
      "bio": "Brief bio if available",
      "image": "Image URL if found"
    }
  ]
}`,

    testimonials: `Extract ALL testimonials/reviews from this content.

Return JSON:
{
  "testimonials": [
    {
      "quote": "Exact quote text",
      "author": "Author name",
      "role": "Author title/company if available"
    }
  ]
}

Use EXACT quotes as written on the website.`,
  };

  return `${sectionPrompts[section]}

CONTENT:
${content}

Return ONLY valid JSON.`;
}
