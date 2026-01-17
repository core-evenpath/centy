/**
 * Auto-Fill Prompt Builder
 * 
 * Builds country-aware AI prompts for business profile research.
 * Uses country config to inject relevant platforms, currencies, and registrations.
 */

import {
  getCountryConfig,
  getRelevantPlatforms,
  getRelevantRegistrations,
  getRelevantCertifications,
  DEFAULT_COUNTRY,
  type CountryAutoFillConfig,
  type PlatformInfo,
  type RegistrationInfo,
} from './country-autofill-config';

export interface PromptBuilderParams {
  businessName: string;
  address: string;
  website?: string;
  industryHint: string;
  countryCode?: string;
  googleRating?: number;
  googleReviewCount?: number;
  editorialSummary?: string;
}

/**
 * Build a country-aware AI prompt for business research
 */
export function buildAutoFillPrompt(params: PromptBuilderParams): string {
  const {
    businessName,
    address,
    website,
    industryHint,
    countryCode = DEFAULT_COUNTRY,
    googleRating,
    googleReviewCount,
    editorialSummary,
  } = params;

  const config = getCountryConfig(countryCode);
  const platforms = getRelevantPlatforms(industryHint, countryCode);
  const registrations = getRelevantRegistrations(industryHint, countryCode);
  const certifications = getRelevantCertifications(industryHint, countryCode);

  // Build industry-specific inventory and data sections
  const { inventorySchema, industryDataSchema } = buildIndustrySchemas(industryHint, config);

  // Build payment methods list
  const popularPayments = config.paymentMethods
    .filter(p => p.popular)
    .map(p => `${p.name} (${p.type})`)
    .join(', ');

  return `Search the web thoroughly and research "${businessName}" located at "${address}"${website ? ` with website ${website}` : ''}.

I need COMPREHENSIVE business information for auto-filling a business profile. This data will be used to train an AI agent to handle customer queries.

## BUSINESS CONTEXT
- **Country:** ${config.name} (${config.code}) ${config.flag}
- **Currency:** ${config.currency.code} (${config.currency.symbol})
- **Search Language:** ${config.search.languages.join(', ')}
- **Search Suffix:** Add "${config.search.suffix}" to searches for better local results

## SEARCH PRIORITY (${config.name}-specific platforms)
${platforms.slice(0, 10).map((p, i) => `${i + 1}. **${p.name}** (${p.domain}) → Data: ${p.dataAvailable.join(', ')}`).join('\n')}

## COUNTRY-SPECIFIC REQUIREMENTS

### Currency & Pricing
- All prices in **${config.currency.code}** (${config.currency.symbol})
- Format: ${config.currency.position === 'before' ? config.currency.symbol + '1,000' : '1,000 ' + config.currency.symbol}

### Phone Number Format
- Include country code: ${config.phoneCode}
- Example: ${config.phoneCode} XXX-XXX-XXXX

### Address Format
- ${config.address.postalCodeName} required
- Components: ${config.address.components.join(' → ')}

### Popular Payment Methods (${config.name})
${popularPayments}

### Business Registrations to Find
${registrations.slice(0, 8).map(r => `- **${r.name}**: ${r.fullName}${r.verificationUrl ? ` (Verify: ${r.verificationUrl})` : ''}`).join('\n')}

### Industry Certifications (${config.name})
${certifications.slice(0, 10).map(c => `- ${c}`).join('\n')}

${googleRating ? `\n## EXISTING GOOGLE DATA\n- **Rating:** ${googleRating}/5 (${googleReviewCount || 0} reviews)` : ''}
${editorialSummary ? `- **Summary:** ${editorialSummary}` : ''}

## MANDATORY SEARCH TASKS

1. **FIND OFFICIAL SOCIAL MEDIA** - Search: "${businessName} instagram", "${businessName} facebook", "${businessName} linkedin"
2. **FIND TAGLINE/SLOGAN** - Look on their website header, About page, or marketing materials
3. **FIND LANGUAGES** - Check if they mention language support, especially for customer service
4. **FIND PAYMENT METHODS** - Look for payment icons on their website or booking pages
5. **FIND FOUNDERS/LEADERSHIP** - Check About Us or Leadership pages
6. **FIND CUSTOMER PAIN POINTS** - Look at reviews to understand what problems customers had before finding this business
7. **FIND DIFFERENTIATORS** - Search for "why choose ${businessName}", look at their About page or value proposition sections
8. **FIND SUCCESS STORIES** - Look for case studies, client testimonials, or "our work" sections
9. **FIND KEY STATS** - Search for metrics like "X customers served", "Y years experience", awards count
10. **FIND OBJECTION HANDLING** - Look at FAQ sections, pricing pages for how they address common concerns

## OUTPUT FORMAT (JSON)

Return ONLY valid JSON matching this structure:

{
  "description": "A compelling 3-4 sentence description of the business",
  "tagline": "Their official tagline or slogan if they have one",
  "services": ["Comprehensive list of services they offer"],
  "products": ["List of products they sell, if applicable"],
  "targetAudience": ["Detailed customer segments"],
  "uniqueSellingPoints": ["5-7 things that make this business stand out"],
  "faqs": [
    {"question": "Common question", "answer": "Detailed answer"}
  ],
  "socialMedia": {
    "instagram": "Full Instagram URL",
    "facebook": "Full Facebook page URL",
    "linkedin": "Full LinkedIn page URL",
    "twitter": "Full Twitter/X URL",
    "youtube": "YouTube channel URL if exists"
  },
  "founders": "Founder/owner names with titles if publicly available",
  "yearEstablished": "Year the business was established",
  "teamSize": "Team size (e.g., '50-100 employees')",
  "awards": ["Awards and recognitions with year"],
  "certifications": ["Business certifications or accreditations"],
  "languages": ["Languages spoken/supported by staff"],
  "paymentMethods": ["All accepted payment methods"],

  "registrations": {
    ${registrations.slice(0, 6).map(r => `"${r.id}": "Registration number if found"`).join(',\n    ')}
  },

  "customerInsights": {
    "painPoints": [
      {"problem": "What problem customers face", "solution": "How this business solves it"}
    ],
    "targetAgeGroups": ["18-25", "26-35", "36-45", "46-55", "55+"],
    "incomeSegments": ["budget", "middle", "upper_middle", "affluent"],
    "valuePropositions": ["Key benefits customers get from choosing this business"],
    "idealCustomerProfile": "Description of their ideal customer"
  },

  "competitiveIntel": {
    "differentiators": [
      {"point": "What makes them different", "proof": "Evidence or data to support this"}
    ],
    "objectionHandlers": [
      {"objection": "Common customer concern", "response": "How they address it"}
    ],
    "competitiveAdvantages": ["Specific advantages over competitors"],
    "marketPosition": "Budget/Mid-range/Premium/Luxury positioning"
  },

  "successMetrics": {
    "caseStudies": [
      {"title": "Project or success story name", "description": "What was achieved", "result": "Quantifiable outcome"}
    ],
    "keyStats": {
      "customersServed": "Number of customers (e.g., 5000+)",
      "projectsCompleted": "Number of projects (e.g., 200+)",
      "yearsExperience": "Years in business",
      "customStat1": "Any other impressive stat"
    },
    "notableClients": ["Well-known clients or partners if publicly mentioned"]
  },

  "onlineReviews": [
    {
      "source": "Platform name",
      "sourceUrl": "Direct URL to their listing",
      "rating": 4.5,
      "reviewCount": 500,
      "highlights": ["Common positive themes from reviews"]
    }
  ],

  "testimonials": [
    {
      "quote": "Actual customer testimonial or review quote",
      "author": "Customer name if available",
      "source": "Where you found this",
      "sourceUrl": "URL to the original review if possible"
    }
  ],

  "pressMedia": [
    {
      "title": "Article or feature title",
      "source": "Publication name",
      "url": "Article URL",
      "date": "Publication date"
    }
  ],

${inventorySchema}

${industryDataSchema}

  "rawWebData": {
    "websiteContent": "Key content from their website that doesn't fit other fields",
    "additionalInfo": {},
    "otherFindings": ["Other interesting facts about the business"]
  }
}

## CRITICAL RULES

1. **SOCIAL MEDIA IS REQUIRED** - You MUST search and find social media URLs. Return null only if truly not found.
2. **CURRENCY**: All monetary values in ${config.currency.symbol} (${config.currency.code}) - DO NOT convert
3. **PHONE**: Must include ${config.phoneCode} country code
4. **PLATFORMS**: Search ${config.name}-specific platforms listed above FIRST
5. **INVENTORY DATA**: Get COMPLETE pricing from platforms - this is critical
6. **SOURCES**: Include sourceUrl for every data point possible
7. **NULL VALUES**: Return null for fields NOT FOUND (never guess or fabricate)
8. **VERIFIED DATA**: Mark data as verified only if confirmed from official sources
9. **TAGLINE**: Look for official slogan on website, marketing materials, or about page
10. **LANGUAGES**: List ALL languages the business operates in or supports

Search query suggestions:
- "${businessName}${config.search.suffix}"
- "${businessName} official website"
- "${businessName} instagram facebook linkedin"
- "${businessName} customer reviews"
`;
}

/**
 * Build industry-specific inventory and data schemas
 */
function buildIndustrySchemas(
  industryHint: string,
  config: CountryAutoFillConfig
): { inventorySchema: string; industryDataSchema: string } {
  const industry = industryHint.toLowerCase();
  const currency = config.currency.symbol;

  if (industry.includes('hotel') || industry.includes('hospitality') || industry.includes('lodging')) {
    return {
      inventorySchema: `  "inventory": {
    "rooms": [
      {
        "name": "Room type name (e.g., Deluxe Room, Suite)",
        "category": "Standard/Deluxe/Premium/Suite/Villa",
        "description": "Room description",
        "price": 150,
        "priceUnit": "per night",
        "maxOccupancy": 2,
        "bedType": "King/Queen/Twin",
        "amenities": ["WiFi", "AC", "TV", "Mini Bar"],
        "size": "350 sq ft",
        "view": "Sea View/City View/Garden View"
      }
    ]
  },`,
      industryDataSchema: `  "industryData": {
    "starRating": "Official star rating (1-5)",
    "totalRooms": "Total number of rooms",
    "amenities": ["Hotel amenities like pool, gym, spa"],
    "checkInTime": "Check-in time",
    "checkOutTime": "Check-out time",
    "petPolicy": "Pet policy",
    "parkingInfo": "Parking availability and cost",
    "nearbyAttractions": ["Nearby tourist spots"],
    "bookingPartners": ["${getPrimaryPlatforms(config.platforms.hotels)}"],
    "cancellationPolicy": "Cancellation policy summary"
  },`,
    };
  }

  if (industry.includes('food') || industry.includes('restaurant') || industry.includes('cafe')) {
    return {
      inventorySchema: `  "inventory": {
    "menuItems": [
      {
        "name": "Dish name",
        "category": "Starters/Main Course/Desserts/Beverages",
        "description": "Dish description",
        "price": 15,
        "isVeg": true,
        "isVegan": false,
        "spiceLevel": "Mild/Medium/Spicy",
        "servingSize": "Serves 1-2",
        "popular": true
      }
    ]
  },`,
      industryDataSchema: `  "industryData": {
    "cuisineTypes": ["Types of cuisine served"],
    "dietaryOptions": ["Veg, Non-veg, Vegan, Gluten-free options"],
    "mealTypes": ["Breakfast, Lunch, Dinner, etc."],
    "averageCost": "Average cost for two in ${currency}",
    "deliveryPartners": ["${getPrimaryPlatforms(config.platforms.food)}"],
    "specialties": ["Signature dishes or specialties"],
    "seatingCapacity": "Number of seats",
    "reservationRequired": true,
    "alcoholServed": false,
    "menuUrl": "Link to online menu if available"
  },`,
    };
  }

  if (industry.includes('health') || industry.includes('medical') || industry.includes('clinic') || industry.includes('hospital')) {
    return {
      inventorySchema: `  "inventory": {
    "services": [
      {
        "name": "Service/Treatment name",
        "category": "Consultation/Surgery/Diagnostic/Therapy",
        "description": "Service description",
        "price": 100,
        "duration": "30 mins",
        "doctor": "Dr. Name",
        "specialization": "Cardiology/Orthopedics/etc.",
        "availability": "Mon-Sat 9AM-5PM"
      }
    ]
  },`,
      industryDataSchema: `  "industryData": {
    "specializations": ["Medical specializations offered"],
    "doctors": [{"name": "Dr. Name", "specialization": "Field", "experience": "20 years"}],
    "facilities": ["Medical facilities available"],
    "insuranceAccepted": ["Insurance providers accepted"],
    "emergencyServices": true,
    "accreditations": ${JSON.stringify(getRelevantCertifications('healthcare', config.code).slice(0, 4))},
    "bedCount": "Number of beds if hospital",
    "consultationTypes": ["In-person", "Video", "Home visit"],
    "diagnosticTests": ["List of diagnostic tests available"],
    "bookingPlatforms": ["${getPrimaryPlatforms(config.platforms.healthcare)}"]
  },`,
    };
  }

  if (industry.includes('retail') || industry.includes('store') || industry.includes('shop')) {
    return {
      inventorySchema: `  "inventory": {
    "products": [
      {
        "name": "Product name",
        "category": "Category",
        "description": "Product description",
        "price": 50,
        "mrp": 65,
        "brand": "Brand name",
        "inStock": true,
        "specifications": {"Size": "M", "Color": "Blue"}
      }
    ]
  },`,
      industryDataSchema: `  "industryData": {
    "productCategories": ["Main product categories"],
    "brands": ["Brands carried"],
    "priceRange": "Budget/Mid-range/Premium/Luxury",
    "deliveryOptions": ["Home delivery, Store pickup, etc."],
    "returnPolicy": "Return policy summary",
    "loyaltyProgram": "Loyalty/membership program details",
    "onlineStore": "E-commerce website if available",
    "storeSize": "Store size in sq ft"
  },`,
    };
  }

  if (industry.includes('real') || industry.includes('property')) {
    return {
      inventorySchema: `  "inventory": {
    "properties": [
      {
        "title": "Property title",
        "type": "Apartment/Villa/Plot/Commercial",
        "transactionType": "Sale/Rent",
        "price": 500000,
        "priceUnit": "total/per month",
        "location": "Area, City",
        "area": "1500 sq ft",
        "bedrooms": 3,
        "bathrooms": 2,
        "amenities": ["Gym", "Pool", "Parking"],
        "description": "Property description"
      }
    ]
  },`,
      industryDataSchema: `  "industryData": {
    "propertyTypes": ["Types of properties dealt with"],
    "locations": ["Areas/localities served"],
    "services": ["Buying", "Selling", "Renting", "Property Management"],
    "registrationNumber": "Real estate license/registration number",
    "projectsCompleted": "Number of projects completed",
    "priceRange": "Budget range of properties",
    "listingPlatforms": ["${getPrimaryPlatforms(config.platforms.realEstate)}"]
  },`,
    };
  }

  if (industry.includes('finance') || industry.includes('bank') || industry.includes('nbfc') || industry.includes('insurance')) {
    return {
      inventorySchema: `  "inventory": {
    "services": [
      {
        "name": "Service name (e.g., Personal Loan, Fixed Deposit)",
        "category": "Loans/Deposits/Insurance/Payments",
        "description": "Service description",
        "interestRate": "Rate of interest (for loans/deposits)",
        "tenure": "Tenure options",
        "minimumAmount": "Minimum amount required",
        "eligibility": "Eligibility criteria",
        "processingFee": "Processing fee if applicable"
      }
    ]
  },`,
      industryDataSchema: `  "industryData": {
    "regulatedBy": "Regulatory body (e.g., RBI for India, FCA for UK)",
    "licenseNumber": "License/Registration number",
    "financialProducts": ["List of main financial products offered"],
    "interestRates": {
      "fixedDeposit": "FD interest rate range",
      "personalLoan": "Personal loan interest rate range",
      "goldLoan": "Gold loan interest rate range"
    },
    "branchCount": "Total number of branches",
    "aum": "Assets Under Management if available",
    "netWorth": "Company's net worth if available",
    "customerBase": "Number of customers",
    "mobileApp": "Mobile app name if available",
    "onlinePortal": "Online banking/customer portal URL",
    "customerCare": "Customer care number"
  },`,
    };
  }

  // Default for other industries
  return {
    inventorySchema: '',
    industryDataSchema: `  "industryData": {
    // Any industry-specific information relevant to this business
  },`,
  };
}

/**
 * Get primary platform names for an industry
 */
function getPrimaryPlatforms(platforms: PlatformInfo[]): string {
  return platforms.slice(0, 3).map(p => p.name).join(', ');
}

/**
 * Build a simplified prompt for quick research
 */
export function buildQuickResearchPrompt(
  businessName: string,
  address: string,
  countryCode?: string
): string {
  const config = getCountryConfig(countryCode);

  return `Quick research "${businessName}" at "${address}" (${config.name}${config.search.suffix}).

Return JSON with:
{
  "description": "Brief business description",
  "website": "Official website URL",
  "phone": "Phone with ${config.phoneCode} code",
  "rating": "Google/Yelp rating",
  "industry": "Primary industry category",
  "services": ["Main services"],
  "priceRange": "Price range in ${config.currency.symbol}"
}

Return ONLY valid JSON.`;
}
