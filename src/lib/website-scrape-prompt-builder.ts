/**
 * Website Scrape Prompt Builder
 *
 * Builds AI prompts specifically for extracting comprehensive business data from website content.
 * Designed to capture all information needed to build a complete business profile.
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

  return `You are an expert business analyst extracting comprehensive profile information from website content.

## TASK
Analyze the website content thoroughly and extract ALL available business information.
This data will be used to build a complete business profile for customer communication.
Be thorough - extract every piece of relevant information you can find.

## WEBSITE INFORMATION
- **URL:** ${url}
- **Page Title:** ${title}
- **Country Context:** ${config.name} (${config.code}) ${config.flag}
- **Currency:** ${config.currency.code} (${config.currency.symbol})
- **Pages Analyzed:** ${pagesScraped.length}

## PRE-EXTRACTED DATA (Already found from HTML)
${extractedDataSection}

## WEBSITE CONTENT

${contentSections}

## EXTRACTION GUIDELINES

1. **BE THOROUGH** - Extract every piece of business information available
2. **BE ACCURATE** - Only include information explicitly stated on the website
3. **PRESERVE TEXT** - Use exact wording for quotes, testimonials, and descriptions
4. **PRICES** - All prices in ${config.currency.code}, as numbers only (e.g., 1500)
5. **STRUCTURED DATA** - If JSON-LD or schema.org data is present, prioritize it
6. **CONTEXT** - Infer industry-specific data based on business type

## OUTPUT FORMAT (JSON)

Return ONLY valid JSON with this comprehensive structure:

{
  "businessName": "Official business name from logo/header/footer",
  "legalName": "Legal/registered name if different",
  "tagline": "Official tagline or slogan",
  "description": "Comprehensive description of what the business does (2-3 sentences)",
  "shortDescription": "One-line elevator pitch",
  "missionStatement": "Mission statement if found",
  "visionStatement": "Vision statement if found",
  "story": "Company story/history/about us narrative",

  "industry": "Primary industry: food_beverage, hospitality, healthcare, real_estate, retail, education, professional_services, beauty_wellness, automotive, travel, entertainment, technology, or other",
  "subIndustry": "More specific category within industry",
  "businessType": "B2B, B2C, or Both",

  "yearEstablished": 2010,
  "founders": "Founder names",
  "founderStory": "Founder background/story if mentioned",

  "contact": {
    "primaryPhone": "Main phone with country code",
    "secondaryPhone": "Alternate phone if available",
    "whatsapp": "WhatsApp number if different",
    "tollFree": "Toll-free number if available",
    "primaryEmail": "Main contact email",
    "supportEmail": "Support email if different",
    "salesEmail": "Sales email if different",
    "bookingEmail": "Booking/reservation email if applicable"
  },

  "address": {
    "street": "Street address line 1",
    "street2": "Street address line 2",
    "landmark": "Nearby landmark",
    "area": "Area/neighborhood",
    "city": "City",
    "state": "State/Province",
    "country": "Country",
    "pincode": "Postal/ZIP code"
  },

  "locations": [
    {
      "name": "Branch name (e.g., Main Branch, Downtown Location)",
      "address": "Full address",
      "phone": "Location-specific phone",
      "isHeadquarters": true
    }
  ],

  "serviceAreas": ["Cities or areas served"],
  "deliveryZones": ["Delivery coverage areas"],
  "internationalShipping": false,

  "socialMedia": {
    "instagram": "Full Instagram URL",
    "facebook": "Full Facebook URL",
    "linkedin": "Full LinkedIn URL",
    "twitter": "Full Twitter/X URL",
    "youtube": "Full YouTube channel URL",
    "pinterest": "Pinterest URL",
    "tiktok": "TikTok URL",
    "whatsappBusiness": "WhatsApp Business link",
    "googleBusiness": "Google Business URL"
  },

  "operatingHours": {
    "monday": { "open": "9:00 AM", "close": "6:00 PM" },
    "tuesday": { "open": "9:00 AM", "close": "6:00 PM" },
    "wednesday": { "open": "9:00 AM", "close": "6:00 PM" },
    "thursday": { "open": "9:00 AM", "close": "6:00 PM" },
    "friday": { "open": "9:00 AM", "close": "6:00 PM" },
    "saturday": { "open": "10:00 AM", "close": "4:00 PM" },
    "sunday": null,
    "specialNote": "Any notes about hours (e.g., 'Closed on public holidays')",
    "timezone": "Timezone if mentioned"
  },

  "languages": ["Languages spoken/supported"],

  "brandVoice": {
    "tone": ["professional", "friendly", "casual", "formal", "playful", "authoritative"],
    "style": "Description of communication style",
    "personality": ["trustworthy", "innovative", "caring", "expert", "approachable"]
  },

  "brandValues": ["Core values mentioned (e.g., Quality, Integrity, Innovation)"],

  "uniqueSellingPoints": [
    "What makes this business unique",
    "Key competitive advantages",
    "Special features or benefits"
  ],

  "targetAudience": [
    "Primary customer segments",
    "Who the business serves"
  ],

  "primaryAudience": "Main customer demographic (e.g., 'Business professionals aged 30-50')",

  "customerPainPoints": [
    "Problems the business solves",
    "Customer challenges addressed"
  ],

  "marketPosition": "How the business positions itself in the market (e.g., 'Premium', 'Budget-friendly', 'Luxury', 'Value leader')",

  "differentiators": [
    "What makes this business different from competitors",
    "Competitive advantages and unique strengths"
  ],

  "valuePropositions": [
    "Key benefits customers get",
    "Value delivered to customers"
  ],

  "idealCustomerProfile": "Description of the ideal customer",

  "customerType": "B2B, B2C, or Both with specifics (e.g., 'B2B - Small businesses', 'B2C - Families')",

  "productsOrServices": [
    {
      "name": "Product/Service name",
      "description": "Detailed description",
      "shortDescription": "One-line description",
      "category": "Category/type",
      "price": 1000,
      "priceUnit": "per unit/hour/session/etc",
      "priceRange": "Budget/Mid-range/Premium",
      "duration": "Service duration if applicable",
      "isService": true,
      "isPopular": false,
      "isFeatured": false,
      "availability": "Always/Limited/Seasonal/By appointment"
    }
  ],

  "packages": [
    {
      "name": "Package name",
      "description": "What's included",
      "price": 5000,
      "duration": "Validity period",
      "includes": ["List of inclusions"],
      "isPopular": false
    }
  ],

  "pricingTiers": [
    {
      "name": "Basic/Standard/Premium",
      "price": 999,
      "period": "monthly/yearly/one-time",
      "features": ["Feature list"],
      "isRecommended": false
    }
  ],

  "currentOffers": [
    {
      "title": "Offer title",
      "description": "Offer details",
      "discount": "20% off / Flat 500 off",
      "code": "Promo code if any",
      "validUntil": "Expiry date if mentioned",
      "conditions": "Terms and conditions"
    }
  ],

  "paymentMethods": ["UPI", "Credit Card", "Debit Card", "Cash", "Net Banking", "EMI", "PayPal"],
  "acceptedCards": ["Visa", "Mastercard", "Amex"],
  "emiAvailable": false,
  "codAvailable": false,

  "faqs": [
    {
      "question": "Exact question from FAQ",
      "answer": "Exact answer from FAQ",
      "category": "Category if FAQs are grouped"
    }
  ],

  "policies": {
    "returnPolicy": "Return policy summary",
    "returnWindow": "30 days",
    "refundPolicy": "Refund policy summary",
    "refundTimeline": "Refund processing time",
    "cancellationPolicy": "Cancellation terms",
    "cancellationFee": "Any cancellation charges",
    "exchangePolicy": "Exchange policy if different from returns",
    "warrantyPolicy": "Warranty information",
    "shippingPolicy": "Shipping terms and timeline",
    "freeShippingThreshold": "Minimum order for free shipping",
    "deliveryTimeline": "Expected delivery time",
    "privacyHighlights": "Key privacy policy points",
    "termsHighlights": "Key terms of service points",
    "checkInCheckOut": {
      "checkIn": "Check-in time (e.g., 2:00 PM)",
      "checkOut": "Check-out time (e.g., 11:00 AM)",
      "earlyCheckIn": "Early check-in policy if available",
      "lateCheckOut": "Late check-out policy if available"
    },
    "petPolicy": "Pet policy details (e.g., 'Pets allowed with $50 fee', 'No pets allowed')",
    "smokingPolicy": "Smoking policy",
    "childPolicy": "Child policy/extra bed policy",
    "dresscode": "Dress code if applicable"
  },

  "amenities": [
    "List of all amenities/facilities available",
    "For hotels: Pool, Spa, Restaurant, Bar, Gym, WiFi, Parking, etc.",
    "For restaurants: WiFi, AC, Outdoor seating, Private dining, etc."
  ],

  "inventory": {
    "rooms": [
      {
        "name": "Room type name",
        "category": "Standard/Deluxe/Premium/Suite/Villa",
        "description": "Room description",
        "shortDescription": "One-line description",
        "price": 5000,
        "priceUnit": "per night",
        "weekendPrice": 6000,
        "maxOccupancy": 2,
        "extraPersonCharge": 500,
        "bedType": "King/Queen/Twin/Double",
        "bedCount": 1,
        "roomSize": "350 sq ft",
        "view": "City View/Sea View/Garden View",
        "amenities": ["WiFi", "AC", "TV", "Mini Bar", "Room Service"],
        "bathroomAmenities": ["Shower", "Bathtub", "Toiletries"],
        "isPopular": false,
        "images": ["Image URLs if found"]
      }
    ],
    "menuItems": [
      {
        "name": "Dish name",
        "description": "Dish description",
        "category": "Starters/Main Course/Desserts/Beverages",
        "subCategory": "More specific category",
        "price": 350,
        "halfPrice": 200,
        "cuisineType": "Italian/Indian/Chinese/etc",
        "isVeg": true,
        "isVegan": false,
        "isGlutenFree": false,
        "spiceLevel": "Mild/Medium/Hot",
        "servingSize": "Serves 1-2",
        "preparationTime": "15-20 mins",
        "calories": 450,
        "isPopular": true,
        "isChefSpecial": false,
        "isNewItem": false,
        "allergens": ["nuts", "dairy"],
        "pairsWith": ["Recommended pairings"]
      }
    ],
    "products": [
      {
        "name": "Product name",
        "description": "Product description",
        "category": "Category",
        "subCategory": "Sub-category",
        "brand": "Brand name",
        "price": 999,
        "mrp": 1299,
        "discount": "23% off",
        "sku": "Product SKU",
        "sizes": ["S", "M", "L", "XL"],
        "colors": ["Red", "Blue", "Black"],
        "material": "Material info",
        "weight": "Product weight",
        "dimensions": "Dimensions",
        "inStock": true,
        "stockQuantity": 50,
        "isPopular": false,
        "isBestseller": false,
        "isNewArrival": false,
        "warranty": "Warranty info",
        "specifications": {"key": "value"}
      }
    ],
    "services": [
      {
        "name": "Service name",
        "description": "Service description",
        "category": "Consultation/Treatment/Procedure",
        "price": 500,
        "priceType": "Starting from/Fixed/Varies",
        "duration": "30 mins",
        "doctor": "Dr. Name",
        "specialist": "Specialization",
        "availableDays": ["Monday", "Wednesday", "Friday"],
        "availableSlots": ["9:00 AM", "2:00 PM", "5:00 PM"],
        "preparationRequired": "Any preparation instructions",
        "insuranceAccepted": true,
        "isEmergency": false
      }
    ],
    "properties": [
      {
        "title": "Property title",
        "type": "Apartment/Villa/Commercial/Plot/PG",
        "subType": "1BHK/2BHK/Studio/Penthouse",
        "transactionType": "Sale/Rent/Lease",
        "price": 5000000,
        "priceUnit": "total/per month/per sq ft",
        "priceNegotiable": true,
        "maintenanceCharges": 5000,
        "securityDeposit": 100000,
        "location": "Area, City",
        "fullAddress": "Complete address",
        "area": 1500,
        "areaUnit": "sq ft",
        "carpetArea": 1200,
        "bedrooms": 3,
        "bathrooms": 2,
        "balconies": 1,
        "parking": "2 covered",
        "floor": "5th of 10",
        "facing": "East",
        "furnishing": "Semi-furnished/Fully furnished/Unfurnished",
        "age": "2 years old",
        "possessionStatus": "Ready to move/Under construction",
        "amenities": ["Gym", "Pool", "Clubhouse", "Security"],
        "nearbyPlaces": ["School", "Hospital", "Metro"],
        "reraId": "RERA registration number",
        "images": ["Image URLs"]
      }
    ],
    "courses": [
      {
        "name": "Course name",
        "description": "Course description",
        "category": "Category",
        "duration": "3 months/6 weeks",
        "mode": "Online/Offline/Hybrid",
        "price": 25000,
        "originalPrice": 35000,
        "emiOption": true,
        "startDate": "Next batch date",
        "schedule": "Weekdays/Weekends",
        "timing": "10 AM - 1 PM",
        "instructor": "Instructor name",
        "certification": true,
        "placementAssistance": true,
        "curriculum": ["Module 1", "Module 2"],
        "prerequisites": ["Requirements"],
        "outcomes": ["What you'll learn"]
      }
    ],
    "treatments": [
      {
        "name": "Treatment name",
        "description": "Treatment description",
        "category": "Facial/Body/Hair",
        "price": 2500,
        "duration": "60 mins",
        "benefits": ["Benefit 1", "Benefit 2"],
        "suitableFor": ["Skin type/condition"],
        "frequency": "Recommended frequency"
      }
    ]
  },

  "team": [
    {
      "name": "Person name",
      "role": "Job title/designation",
      "department": "Department",
      "bio": "Brief biography",
      "qualifications": ["Degrees", "Certifications"],
      "experience": "Years of experience",
      "specializations": ["Areas of expertise"],
      "languages": ["Languages spoken"],
      "image": "Photo URL if found",
      "linkedin": "LinkedIn profile URL",
      "email": "Direct email if provided"
    }
  ],

  "testimonials": [
    {
      "quote": "Exact testimonial text - preserve exactly as written",
      "author": "Customer name",
      "role": "Customer's title/company",
      "location": "Customer's location",
      "rating": 5,
      "date": "Date if mentioned",
      "platform": "Where review was from (Google, website, etc)",
      "verified": true,
      "productService": "What they reviewed"
    }
  ],

  "caseStudies": [
    {
      "title": "Case study title",
      "client": "Client name",
      "industry": "Client's industry",
      "challenge": "Problem faced",
      "solution": "Solution provided",
      "results": "Outcomes/metrics",
      "testimonial": "Client quote"
    }
  ],

  "awards": [
    {
      "name": "Award name",
      "year": 2023,
      "awardedBy": "Awarding organization",
      "category": "Award category"
    }
  ],

  "certifications": [
    {
      "name": "Certification name",
      "issuedBy": "Issuing authority",
      "validUntil": "Expiry if applicable",
      "number": "Certification number"
    }
  ],

  "accreditations": ["Accreditation bodies"],
  "partnerships": ["Partner companies/organizations"],
  "clients": ["Notable clients if mentioned"],
  "featuredIn": ["Media mentions", "Publications"],

  "industrySpecificData": {
    "cuisineTypes": ["For restaurants: Italian, Indian, Chinese"],
    "dietaryOptions": ["Vegetarian", "Vegan", "Gluten-free options"],
    "mealTypes": ["Breakfast", "Lunch", "Dinner"],
    "diningOptions": ["Dine-in", "Takeaway", "Delivery"],
    "reservationRequired": false,
    "dressCode": "Casual/Smart casual/Formal",
    "alcoholServed": true,
    "averageCost": "Average cost for two",
    "seatingCapacity": 100,
    "privateEvents": true,
    "cateringAvailable": true,

    "starRating": "5-star/4-star hotel rating",
    "checkInTime": "2:00 PM",
    "checkOutTime": "11:00 AM",
    "earlyCheckIn": true,
    "lateCheckOut": true,
    "airportTransfer": true,
    "petFriendly": false,
    "wheelchairAccessible": true,
    "hotelAmenities": ["Pool", "Spa", "Restaurant", "Bar", "Gym"],
    "nearbyAttractions": ["Tourist spots nearby"],

    "medicalSpecializations": ["For healthcare: Cardiology, Orthopedics"],
    "doctorsCount": 25,
    "bedsCount": 100,
    "emergencyServices": true,
    "ambulanceService": true,
    "bloodBank": true,
    "pharmacyOnsite": true,
    "insuranceAccepted": ["List of insurance providers"],
    "naabhAccredited": true,
    "jciAccredited": false,

    "reraRegistered": true,
    "reraNumber": "RERA registration",
    "developerName": "Builder/Developer name",
    "projectStatus": "Completed/Under construction",
    "possessionDate": "Expected possession",
    "pricePerSqFt": 8500,
    "loanAvailable": true,
    "banksApproved": ["HDFC", "SBI", "ICICI"],

    "freeTrialAvailable": false,
    "demoAvailable": true,
    "integrations": ["Software integrations"],
    "apiAvailable": true,
    "supportHours": "24/7",
    "slaGuarantee": "99.9% uptime",

    "homeVisitAvailable": false,
    "onlineConsultation": true,
    "subscriptionPlans": true
  },

  "technicalInfo": {
    "platformsSupported": ["Web", "iOS", "Android"],
    "browserSupport": ["Chrome", "Firefox", "Safari"],
    "systemRequirements": "Technical requirements",
    "apiDocumentation": "API docs URL",
    "securityCertifications": ["ISO 27001", "SOC 2"],
    "dataStorage": "Data storage location",
    "backupPolicy": "Backup frequency"
  },

  "sustainability": {
    "ecofriendly": true,
    "carbonNeutral": false,
    "sustainablePractices": ["Practices mentioned"],
    "certifications": ["Green certifications"]
  },

  "accessibility": {
    "wheelchairAccessible": true,
    "parkingAvailable": true,
    "valetParking": false,
    "publicTransport": "Nearest metro/bus stop",
    "elevatorAccess": true
  },

  "additionalInfo": {
    "establishmentType": "Single outlet/Chain/Franchise",
    "seatingCapacity": 50,
    "outdoorSeating": true,
    "privateRooms": true,
    "wifiAvailable": true,
    "acAvailable": true,
    "liveMusic": false,
    "kidsArea": false,
    "smokingArea": false
  },

  "schemaOrgData": "Any structured data found in JSON-LD format",

  "confidence": {
    "overallScore": 85,
    "dataCompleteness": "High/Medium/Low",
    "reliableSources": ["Pages with most reliable data"]
  }
}

## CRITICAL INSTRUCTIONS

1. Return ONLY the JSON object - no markdown, no explanation
2. Use null for fields with no data (not empty strings)
3. Use empty array [] only if category exists but has no items
4. Prices as numbers only (e.g., 1500 not "${config.currency.symbol}1,500")
5. Extract ALL inventory items - don't summarize or skip
6. Preserve exact text for testimonials and quotes
7. Operating hours in 12-hour format with AM/PM
8. Social media URLs must be complete (https://...)
9. Be thorough - this data builds the entire business profile
10. If a field doesn't apply to this business type, use null

EXTRACT THE COMPLETE BUSINESS PROFILE NOW:`;
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

  // All social/business platforms we extract
  const socialPlatforms = [
    // Major social
    'instagram', 'facebook', 'twitter', 'linkedin', 'youtube', 'pinterest', 'tiktok', 'threads', 'snapchat',
    // Messaging
    'whatsapp', 'telegram', 'wechat', 'line',
    // Business/Reviews
    'googleBusiness', 'yelp', 'tripadvisor', 'trustpilot', 'glassdoor',
    // Food/Delivery
    'zomato', 'swiggy', 'ubereats', 'doordash', 'grubhub', 'opentable',
    // Real Estate
    'zillow', 'realtor', 'trulia', 'houzz', 'redfin',
    // Travel
    'booking', 'airbnb', 'expedia',
    // Professional
    'github', 'behance', 'dribbble',
    // Regional
    'vk', 'weibo',
  ];

  for (const platform of socialPlatforms) {
    if (social[platform]) {
      const displayName = platform.charAt(0).toUpperCase() + platform.slice(1).replace(/([A-Z])/g, ' $1');
      lines.push(`${displayName}: ${social[platform]}`);
    }
  }

  return lines.length > 0 ? lines.join('\n') : 'None extracted yet';
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
