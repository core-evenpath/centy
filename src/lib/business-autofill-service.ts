/**
 * Business Profile Auto-Fill Service
 *
 * Uses Google Places API + Gemini AI with web search grounding
 * to automatically populate business profile data.
 */

import { GoogleGenAI } from "@google/genai";
import type { BusinessPersona, IndustryCategory } from './business-persona-types';
import { buildAutoFillPrompt } from './autofill-prompt-builder';
import { detectCountryFromAddress, DEFAULT_COUNTRY } from './country-autofill-config';

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

// Google Places API key
const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY
  || process.env.GOOGLE_MAPS_API_KEY
  || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  || process.env.GEMINI_API_KEY;

// Industry mapping from Google Places types
const PLACES_TYPE_TO_INDUSTRY: Record<string, IndustryCategory> = {
  'real_estate_agency': 'real_estate',
  'lodging': 'hospitality',
  'hotel': 'hospitality',
  'resort': 'hospitality',
  'guest_house': 'hospitality',
  'restaurant': 'food_beverage',
  'cafe': 'food_beverage',
  'bakery': 'food_beverage',
  'bar': 'food_beverage',
  'meal_delivery': 'food_beverage',
  'meal_takeaway': 'food_beverage',
  'store': 'retail',
  'shopping_mall': 'retail',
  'clothing_store': 'retail',
  'electronics_store': 'retail',
  'furniture_store': 'retail',
  'jewelry_store': 'retail',
  'shoe_store': 'retail',
  'supermarket': 'retail',
  'convenience_store': 'retail',
  'hospital': 'healthcare',
  'doctor': 'healthcare',
  'dentist': 'healthcare',
  'pharmacy': 'healthcare',
  'physiotherapist': 'healthcare',
  'veterinary_care': 'healthcare',
  'health': 'healthcare',
  'school': 'education',
  'university': 'education',
  'primary_school': 'education',
  'secondary_school': 'education',
  'bank': 'finance',
  'accounting': 'finance',
  'insurance_agency': 'finance',
  'finance': 'finance',
  'gym': 'fitness',
  'spa': 'wellness',
  'beauty_salon': 'beauty',
  'hair_care': 'beauty',
  'lawyer': 'legal',
  'car_dealer': 'automotive',
  'car_repair': 'automotive',
  'travel_agency': 'travel',
};

export interface PlacesAutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlacePhoto {
  url: string;
  photoReference: string;
  width: number;
  height: number;
  attribution?: string;
  selected?: boolean;
}

export interface PlaceReview {
  author: string;
  authorUrl?: string;
  profilePhoto?: string;
  rating: number;
  text: string;
  time: string;
  timestamp?: number;
  source: 'google' | 'ai_research';
  sourceUrl?: string;
  language?: string;
}

export interface PlacesDetailedInfo {
  placeId: string;
  name: string;
  formattedAddress: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: number;
  types?: string[];
  location?: { lat: number; lng: number };
  googleMapsUrl?: string;
  openingHours?: {
    weekdayText: string[];
    isOpen?: boolean;
    periods?: {
      open: { day: number; time: string };
      close: { day: number; time: string };
    }[];
  };
  photos?: PlacePhoto[];
  reviews?: PlaceReview[];
  editorialSummary?: string;
  businessStatus?: string;
  addressComponents?: {
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    locality?: string;
    neighborhood?: string;
  };
  plusCode?: string;
  utcOffset?: number;
}

// Inventory item types
export interface RoomInventoryItem {
  name: string;
  category?: string;
  description?: string;
  price?: number;
  priceUnit?: string;
  maxOccupancy?: number;
  bedType?: string;
  amenities?: string[];
  size?: string;
  view?: string;
  images?: string[];
}

export interface MenuInventoryItem {
  name: string;
  category?: string;
  description?: string;
  price?: number;
  isVeg?: boolean;
  isVegan?: boolean;
  spiceLevel?: string;
  servingSize?: string;
  calories?: number;
  allergens?: string[];
  popular?: boolean;
  images?: string[];
}

export interface ProductInventoryItem {
  name: string;
  category?: string;
  description?: string;
  price?: number;
  mrp?: number;
  brand?: string;
  sku?: string;
  inStock?: boolean;
  specifications?: Record<string, string>;
  images?: string[];
}

export interface ServiceInventoryItem {
  name: string;
  category?: string;
  description?: string;
  price?: number;
  duration?: string;
  doctor?: string;
  specialization?: string;
  availability?: string;
}

export interface PropertyInventoryItem {
  title: string;
  type?: string;
  transactionType?: string;
  price?: number;
  priceUnit?: string;
  location?: string;
  area?: string;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  description?: string;
  images?: string[];
}

export interface AIResearchResult {
  description?: string;
  tagline?: string;
  services?: string[];
  products?: string[];
  targetAudience?: string[];
  uniqueSellingPoints?: string[];
  faqs?: { question: string; answer: string }[];
  socialMedia?: { instagram?: string; facebook?: string; linkedin?: string; twitter?: string; youtube?: string };
  founders?: string;
  yearEstablished?: string;
  teamSize?: string;
  awards?: string[];
  certifications?: string[];
  languages?: string[];
  paymentMethods?: string[];
  // Country-specific business registrations (GSTIN, PAN, EIN, etc.)
  registrations?: Record<string, string>;

  // Customer Insights - for filling customerProfile section
  customerInsights?: {
    painPoints?: { problem: string; solution: string }[];
    targetAgeGroups?: string[];
    incomeSegments?: string[];
    valuePropositions?: string[];
    idealCustomerProfile?: string;
  };

  // Competitive Intelligence - for differentiation
  competitiveIntel?: {
    differentiators?: { point: string; proof: string }[];
    objectionHandlers?: { objection: string; response: string }[];
    competitiveAdvantages?: string[];
    marketPosition?: string;
  };

  // Success Metrics - for trust building
  successMetrics?: {
    caseStudies?: { title: string; description: string; result?: string }[];
    keyStats?: Record<string, string>;
    notableClients?: string[];
  };

  onlineReviews?: {
    source: string;
    sourceUrl: string;
    rating?: number;
    reviewCount?: number;
    highlights?: string[];
  }[];
  testimonials?: {
    quote: string;
    author?: string;
    source: string;
    sourceUrl?: string;
  }[];
  pressMedia?: {
    title: string;
    source: string;
    url?: string;
    date?: string;
  }[];
  industryData?: Record<string, any>;
  // Inventory data
  inventory?: {
    rooms?: RoomInventoryItem[];
    menuItems?: MenuInventoryItem[];
    products?: ProductInventoryItem[];
    services?: ServiceInventoryItem[];
    properties?: PropertyInventoryItem[];
  };
  // Raw data from web that doesn't fit standard fields
  rawWebData?: {
    websiteContent?: string;
    additionalInfo?: Record<string, any>;
    scrapedData?: any[];
    otherFindings?: string[];
  };
}

export interface AutoFilledProfile {
  identity: Partial<BusinessPersona['identity']> & {
    location?: { lat: number; lng: number };
    googleMapsUrl?: string;
    plusCode?: string;
  };
  personality: Partial<BusinessPersona['personality']>;
  customerProfile: Partial<BusinessPersona['customerProfile']>;
  knowledge: Partial<BusinessPersona['knowledge']>;
  industrySpecificData?: Record<string, any>;
  photos?: PlacePhoto[];
  reviews?: PlaceReview[];
  testimonials?: {
    quote: string;
    author?: string;
    source: string;
    sourceUrl?: string;
  }[];
  onlinePresence?: {
    source: string;
    sourceUrl: string;
    rating?: number;
    reviewCount?: number;
    highlights?: string[];
  }[];
  pressMedia?: {
    title: string;
    source: string;
    url?: string;
    date?: string;
  }[];
  // Inventory data
  inventory?: {
    rooms?: RoomInventoryItem[];
    menuItems?: MenuInventoryItem[];
    products?: ProductInventoryItem[];
    services?: ServiceInventoryItem[];
    properties?: PropertyInventoryItem[];
  };
  // From the Web - unmapped data
  fromTheWeb?: {
    websiteContent?: string;
    additionalInfo?: Record<string, any>;
    otherFindings?: string[];
    rawIndustryData?: Record<string, any>;
  };
  source: {
    placeId?: string;
    placesData: boolean;
    aiEnriched: boolean;
    fetchedAt: Date;
    detectedCountry?: string;
  };
}

/**
 * Google Places Autocomplete - search for businesses
 * Returns results with potential error information
 */
export interface PlacesSearchResponse {
  results: PlacesAutocompleteResult[];
  error?: string;
  status?: string;
}

export async function searchPlacesAutocomplete(
  query: string,
  sessionToken?: string
): Promise<PlacesSearchResponse> {
  if (!PLACES_API_KEY) {
    console.error('[AutoFill] No Places API key configured');
    return {
      results: [],
      error: 'Google Places API key not configured. Please add GOOGLE_PLACES_API_KEY to your environment variables.',
      status: 'API_KEY_MISSING'
    };
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  url.searchParams.set('input', query);
  url.searchParams.set('types', 'establishment');
  url.searchParams.set('key', PLACES_API_KEY);
  if (sessionToken) {
    url.searchParams.set('sessiontoken', sessionToken);
  }

  try {
    console.log('[AutoFill] Searching for:', query);
    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error('[AutoFill] HTTP error:', response.status, response.statusText);
      return {
        results: [],
        error: `Search request failed: ${response.statusText}`,
        status: 'HTTP_ERROR'
      };
    }

    const data = await response.json();
    console.log('[AutoFill] API Response status:', data.status);

    if (data.status === 'ZERO_RESULTS') {
      return {
        results: [],
        status: 'ZERO_RESULTS'
      };
    }

    if (data.status !== 'OK') {
      const errorMessages: Record<string, string> = {
        'REQUEST_DENIED': 'API request denied. Please check if Places API is enabled in Google Cloud Console.',
        'OVER_QUERY_LIMIT': 'API quota exceeded. Please try again later.',
        'INVALID_REQUEST': 'Invalid search query. Please try a different search term.',
        'UNKNOWN_ERROR': 'Google API error. Please try again.',
      };

      const errorMsg = errorMessages[data.status] || data.error_message || `API error: ${data.status}`;
      console.error('[AutoFill] Autocomplete error:', data.status, data.error_message);

      return {
        results: [],
        error: errorMsg,
        status: data.status
      };
    }

    const results = (data.predictions || []).map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || p.description,
      secondaryText: p.structured_formatting?.secondary_text || '',
    }));

    console.log('[AutoFill] Found', results.length, 'results');

    return {
      results,
      status: 'OK'
    };
  } catch (error: any) {
    console.error('[AutoFill] Autocomplete fetch error:', error);
    return {
      results: [],
      error: error.message || 'Network error while searching. Please check your connection.',
      status: 'NETWORK_ERROR'
    };
  }
}

/**
 * Get detailed place information from Google Places API
 */
export async function getPlaceDetails(placeId: string): Promise<PlacesDetailedInfo | null> {
  if (!PLACES_API_KEY) {
    console.error('[AutoFill] No Places API key configured');
    return null;
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', [
    'name',
    'formatted_address',
    'address_components',
    'formatted_phone_number',
    'international_phone_number',
    'website',
    'rating',
    'user_ratings_total',
    'price_level',
    'types',
    'geometry',
    'opening_hours',
    'photos',
    'reviews',
    'editorial_summary',
    'business_status',
    'url',
    'plus_code',
    'utc_offset'
  ].join(','));
  url.searchParams.set('reviews_sort', 'newest');
  url.searchParams.set('key', PLACES_API_KEY);

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    console.log('[AutoFill] Places Details status:', data.status);

    if (data.status !== 'OK') {
      console.error('[AutoFill] Places Details error:', data.status, data.error_message);
      return null;
    }

    const place = data.result;

    // Parse address components
    const addressComponents: PlacesDetailedInfo['addressComponents'] = {};
    if (place.address_components) {
      for (const component of place.address_components) {
        if (component.types.includes('locality')) {
          addressComponents.city = component.long_name;
        } else if (component.types.includes('administrative_area_level_1')) {
          addressComponents.state = component.long_name;
        } else if (component.types.includes('country')) {
          addressComponents.country = component.long_name;
        } else if (component.types.includes('postal_code')) {
          addressComponents.postalCode = component.long_name;
        } else if (component.types.includes('sublocality') || component.types.includes('neighborhood')) {
          addressComponents.neighborhood = component.long_name;
        }
      }
    }

    return {
      placeId,
      name: place.name,
      formattedAddress: place.formatted_address,
      phone: place.formatted_phone_number || place.international_phone_number,
      website: place.website,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      priceLevel: place.price_level,
      types: place.types,
      location: place.geometry?.location,
      googleMapsUrl: place.url,
      openingHours: place.opening_hours ? {
        weekdayText: place.opening_hours.weekday_text || [],
        isOpen: place.opening_hours.open_now,
        periods: place.opening_hours.periods,
      } : undefined,
      photos: place.photos?.slice(0, 10).map((p: any) => ({
        url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${PLACES_API_KEY}`,
        photoReference: p.photo_reference,
        width: p.width,
        height: p.height,
        attribution: p.html_attributions?.[0],
        selected: false,
      })),
      reviews: place.reviews?.map((r: any) => ({
        author: r.author_name,
        authorUrl: r.author_url,
        profilePhoto: r.profile_photo_url,
        rating: r.rating,
        text: r.text,
        time: r.relative_time_description,
        timestamp: r.time,
        source: 'google' as const,
        language: r.language,
      })),
      editorialSummary: place.editorial_summary?.overview,
      businessStatus: place.business_status,
      addressComponents,
      plusCode: place.plus_code?.global_code,
      utcOffset: place.utc_offset,
    };
  } catch (error) {
    console.error('[AutoFill] Place details fetch error:', error);
    return null;
  }
}

/**
 * Use Gemini AI with Google Search to research the business
 */
export async function researchBusinessWithAI(
  businessName: string,
  address: string,
  website?: string,
  existingInfo?: PlacesDetailedInfo,
  countryCode?: string
): Promise<AIResearchResult> {
  const industryHint = existingInfo?.types?.find(t => PLACES_TYPE_TO_INDUSTRY[t])
    ? PLACES_TYPE_TO_INDUSTRY[existingInfo.types.find(t => PLACES_TYPE_TO_INDUSTRY[t])!]
    : 'general';

  // Use country from address components or default
  const detectedCountry = countryCode || detectCountryFromAddress(existingInfo?.addressComponents);

  // Build industry-specific inventory request
  let inventoryRequest = '';
  let industrySpecificRequest = '';

  switch (industryHint) {
    case 'hospitality':
      inventoryRequest = `
  "inventory": {
    "rooms": [
      {
        "name": "Room type name (e.g., Deluxe Room, Suite)",
        "category": "Standard/Deluxe/Premium/Suite/Villa",
        "description": "Room description",
        "price": 5000,
        "priceUnit": "per night",
        "maxOccupancy": 2,
        "bedType": "King/Queen/Twin",
        "amenities": ["WiFi", "AC", "TV", "Mini Bar"],
        "size": "350 sq ft",
        "view": "Sea View/City View/Garden View"
      }
      // Include ALL room types you can find with pricing
    ]
  },`;
      industrySpecificRequest = `
    "industryData": {
      "starRating": "Official star rating (1-5)",
      "totalRooms": "Total number of rooms",
      "amenities": ["Hotel amenities like pool, gym, spa"],
      "checkInTime": "Check-in time",
      "checkOutTime": "Check-out time",
      "petPolicy": "Pet policy",
      "parkingInfo": "Parking availability and cost",
      "nearbyAttractions": ["Nearby tourist spots"],
      "bookingPartners": ["OTAs where they're listed - MakeMyTrip, Booking.com, etc."],
      "cancellationPolicy": "Cancellation policy summary"
    }`;
      break;

    case 'food_beverage':
      inventoryRequest = `
  "inventory": {
    "menuItems": [
      {
        "name": "Dish name",
        "category": "Starters/Main Course/Desserts/Beverages",
        "description": "Dish description",
        "price": 350,
        "isVeg": true,
        "isVegan": false,
        "spiceLevel": "Mild/Medium/Spicy",
        "servingSize": "Serves 1-2",
        "popular": true
      }
      // Include as many menu items as possible with prices
    ]
  },`;
      industrySpecificRequest = `
    "industryData": {
      "cuisineTypes": ["Types of cuisine served"],
      "dietaryOptions": ["Veg, Non-veg, Vegan, Gluten-free options"],
      "mealTypes": ["Breakfast, Lunch, Dinner, etc."],
      "averageCost": "Average cost for two",
      "deliveryPartners": ["Zomato, Swiggy, etc."],
      "specialties": ["Signature dishes or specialties"],
      "seatingCapacity": "Number of seats",
      "reservationRequired": true,
      "alcoholServed": false,
      "menuUrl": "Link to online menu if available"
    }`;
      break;

    case 'healthcare':
      inventoryRequest = `
  "inventory": {
    "services": [
      {
        "name": "Service/Treatment name",
        "category": "Consultation/Surgery/Diagnostic/Therapy",
        "description": "Service description",
        "price": 500,
        "duration": "30 mins",
        "doctor": "Dr. Name",
        "specialization": "Cardiology/Orthopedics/etc.",
        "availability": "Mon-Sat 9AM-5PM"
      }
      // Include all services, consultations, tests with pricing
    ]
  },`;
      industrySpecificRequest = `
    "industryData": {
      "specializations": ["Medical specializations offered"],
      "doctors": [{"name": "Dr. Name", "specialization": "Field", "experience": "20 years"}],
      "facilities": ["Medical facilities available"],
      "insuranceAccepted": ["Insurance providers accepted"],
      "emergencyServices": true,
      "accreditations": ["NABH, JCI, etc."],
      "bedCount": "Number of beds if hospital",
      "consultationTypes": ["In-person", "Video", "Home visit"],
      "diagnosticTests": ["List of diagnostic tests available"]
    }`;
      break;

    case 'retail':
      inventoryRequest = `
  "inventory": {
    "products": [
      {
        "name": "Product name",
        "category": "Category",
        "description": "Product description",
        "price": 999,
        "mrp": 1299,
        "brand": "Brand name",
        "inStock": true,
        "specifications": {"Size": "M", "Color": "Blue"}
      }
      // Include popular products with prices
    ]
  },`;
      industrySpecificRequest = `
    "industryData": {
      "productCategories": ["Main product categories"],
      "brands": ["Brands carried"],
      "priceRange": "Budget/Mid-range/Premium/Luxury",
      "deliveryOptions": ["Home delivery, Store pickup, etc."],
      "returnPolicy": "Return policy summary",
      "loyaltyProgram": "Loyalty/membership program details",
      "onlineStore": "E-commerce website if available",
      "storeSize": "Store size in sq ft"
    }`;
      break;

    case 'real_estate':
      inventoryRequest = `
  "inventory": {
    "properties": [
      {
        "title": "Property title",
        "type": "Apartment/Villa/Plot/Commercial",
        "transactionType": "Sale/Rent",
        "price": 5000000,
        "priceUnit": "total/per month",
        "location": "Area, City",
        "area": "1500 sq ft",
        "bedrooms": 3,
        "bathrooms": 2,
        "amenities": ["Gym", "Pool", "Parking"],
        "description": "Property description"
      }
      // Include current listings if available
    ]
  },`;
      industrySpecificRequest = `
    "industryData": {
      "propertyTypes": ["Types of properties dealt with"],
      "locations": ["Areas/localities served"],
      "services": ["Buying", "Selling", "Renting", "Property Management"],
      "reraRegistration": "RERA registration number if available",
      "projectsCompleted": "Number of projects completed",
      "developerName": "If a developer, the company name",
      "priceRange": "Budget range of properties"
    }`;
      break;

    default:
      inventoryRequest = '';
      industrySpecificRequest = `
    "industryData": {
      // Any industry-specific information relevant to this business
    }`;
  }

  // Build country-aware prompt using the prompt builder
  const prompt = buildAutoFillPrompt({
    businessName,
    address,
    website,
    industryHint,
    countryCode: detectedCountry,
    googleRating: existingInfo?.rating,
    googleReviewCount: existingInfo?.reviewCount,
    editorialSummary: existingInfo?.editorialSummary,
  });


  try {
    console.log('[AutoFill] Researching business with AI...');

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
        tools: [{
          googleSearch: {}
        }],
      }
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error('[AutoFill] No JSON found in AI response');
      return {};
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('[AutoFill] AI research complete with keys:', Object.keys(parsed));
    if (parsed.inventory) {
      console.log('[AutoFill] Inventory found:', Object.keys(parsed.inventory));
    }
    return parsed;
  } catch (error) {
    console.error('[AutoFill] AI research error:', error);
    return {};
  }
}

/**
 * Detect industry from Google Places types
 */
function detectIndustry(types: string[]): IndustryCategory {
  for (const type of types) {
    if (PLACES_TYPE_TO_INDUSTRY[type]) {
      return PLACES_TYPE_TO_INDUSTRY[type];
    }
  }
  return 'custom';
}

/**
 * Parse operating hours from Google Places format
 */
function parseOperatingHours(weekdayText: string[]): Record<string, { open: string; close: string }> | undefined {
  if (!weekdayText || weekdayText.length === 0) return undefined;

  const hours: Record<string, { open: string; close: string }> = {};
  const dayMap: Record<string, string> = {
    'Monday': 'monday',
    'Tuesday': 'tuesday',
    'Wednesday': 'wednesday',
    'Thursday': 'thursday',
    'Friday': 'friday',
    'Saturday': 'saturday',
    'Sunday': 'sunday',
  };

  for (const line of weekdayText) {
    // Format: "Monday: 9:00 AM – 6:00 PM" or "Monday: Closed"
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const day = dayMap[match[1]];
      const timeStr = match[2];

      if (day && timeStr !== 'Closed') {
        const timeMatch = timeStr.match(/(\d+:\d+\s*[AP]M)\s*[–-]\s*(\d+:\d+\s*[AP]M)/i);
        if (timeMatch) {
          hours[day] = {
            open: timeMatch[1],
            close: timeMatch[2],
          };
        }
      }
    }
  }

  return Object.keys(hours).length > 0 ? hours : undefined;
}

/**
 * Main function: Auto-fill business profile from a Google Place
 */
export async function autoFillBusinessProfile(
  placeId: string,
  countryCode?: string
): Promise<AutoFilledProfile | null> {
  console.log('[AutoFill] Starting auto-fill for place:', placeId);

  // Step 1: Get Google Places details
  const placesInfo = await getPlaceDetails(placeId);

  if (!placesInfo) {
    console.error('[AutoFill] Could not get place details');
    return null;
  }

  console.log('[AutoFill] Got place details:', placesInfo.name);

  // Step 2: Research with AI (country-aware)
  const detectedCountry = countryCode || detectCountryFromAddress(placesInfo.addressComponents);
  console.log('[AutoFill] Detected country:', detectedCountry);

  const aiResearch = await researchBusinessWithAI(
    placesInfo.name,
    placesInfo.formattedAddress,
    placesInfo.website,
    placesInfo,
    detectedCountry
  );

  console.log('[AutoFill] AI research complete');

  // Step 3: Detect industry
  const industry = detectIndustry(placesInfo.types || []);

  // Step 4: Combine reviews from Google and AI research
  const allReviews: PlaceReview[] = [
    ...(placesInfo.reviews || []),
    ...(aiResearch.testimonials || []).map(t => ({
      author: t.author || 'Customer',
      rating: 5,
      text: t.quote,
      time: '',
      source: 'ai_research' as const,
      sourceUrl: t.sourceUrl,
    })),
  ];

  // Step 5: Build "From the Web" section with unmapped data
  const fromTheWeb: AutoFilledProfile['fromTheWeb'] = {};

  if (aiResearch.rawWebData?.websiteContent) {
    fromTheWeb.websiteContent = aiResearch.rawWebData.websiteContent;
  }
  if (aiResearch.rawWebData?.additionalInfo && Object.keys(aiResearch.rawWebData.additionalInfo).length > 0) {
    fromTheWeb.additionalInfo = aiResearch.rawWebData.additionalInfo;
  }
  if (aiResearch.rawWebData?.otherFindings?.length) {
    fromTheWeb.otherFindings = aiResearch.rawWebData.otherFindings;
  }
  // Add any industry data that wasn't specifically mapped
  if (aiResearch.industryData) {
    fromTheWeb.rawIndustryData = aiResearch.industryData;
  }

  // Step 6: Map to BusinessPersona schema
  const profile: AutoFilledProfile = {
    identity: {
      businessName: placesInfo.name,
      industry: industry,
      description: aiResearch.description || placesInfo.editorialSummary,
      tagline: aiResearch.tagline,
      phone: placesInfo.phone,
      email: undefined,
      website: placesInfo.website,
      address: {
        street: placesInfo.formattedAddress,
        city: placesInfo.addressComponents?.city || '',
        state: placesInfo.addressComponents?.state || '',
        country: placesInfo.addressComponents?.country || '',
        pincode: placesInfo.addressComponents?.postalCode || '',
      },
      location: placesInfo.location,
      googleMapsUrl: placesInfo.googleMapsUrl,
      plusCode: placesInfo.plusCode,
      operatingHours: placesInfo.openingHours?.weekdayText
        ? parseOperatingHours(placesInfo.openingHours.weekdayText)
        : undefined,
      socialMedia: aiResearch.socialMedia ? {
        instagram: aiResearch.socialMedia.instagram,
        facebook: aiResearch.socialMedia.facebook,
        linkedin: aiResearch.socialMedia.linkedin,
        twitter: aiResearch.socialMedia.twitter,
        youtube: aiResearch.socialMedia.youtube,
      } : undefined,
      languages: aiResearch.languages,
      yearEstablished: aiResearch.yearEstablished ? parseInt(aiResearch.yearEstablished) : undefined,
    },
    personality: {
      description: aiResearch.description || placesInfo.editorialSummary,
      uniqueSellingPoints: aiResearch.uniqueSellingPoints,
    },
    customerProfile: {
      targetAudience: aiResearch.targetAudience,
      // Map customer insights
      ...(aiResearch.customerInsights ? {
        painPoints: aiResearch.customerInsights.painPoints?.map(p => ({
          problem: p.problem,
          solution: p.solution,
        })),
        ageGroup: aiResearch.customerInsights.targetAgeGroups,
        incomeSegment: aiResearch.customerInsights.incomeSegments,
        valuePropositions: aiResearch.customerInsights.valuePropositions,
        idealCustomerProfile: aiResearch.customerInsights.idealCustomerProfile,
      } : {}),
      // Map competitive intel
      ...(aiResearch.competitiveIntel ? {
        differentiators: aiResearch.competitiveIntel.differentiators?.map(d => ({
          point: d.point,
          proof: d.proof,
        })),
        objectionHandlers: aiResearch.competitiveIntel.objectionHandlers?.map(o => ({
          objection: o.objection,
          response: o.response,
        })),
        competitiveAdvantages: aiResearch.competitiveIntel.competitiveAdvantages,
        marketPosition: aiResearch.competitiveIntel.marketPosition,
      } : {}),
    },
    knowledge: {
      productsOrServices: [
        ...(aiResearch.services || []).map(s => ({ name: s, description: '', isService: true })),
        ...(aiResearch.products || []).map(p => ({ name: p, description: '', isService: false })),
      ],
      faqs: aiResearch.faqs?.map(f => ({
        question: f.question,
        answer: f.answer,
      })),
      paymentMethods: aiResearch.paymentMethods,
      // Map success metrics
      ...(aiResearch.successMetrics ? {
        caseStudies: aiResearch.successMetrics.caseStudies?.map(c => ({
          title: c.title,
          description: c.description,
          result: c.result,
        })),
        keyStats: aiResearch.successMetrics.keyStats,
        notableClients: aiResearch.successMetrics.notableClients,
      } : {}),
    },
    photos: placesInfo.photos,
    reviews: allReviews,
    testimonials: aiResearch.testimonials,
    onlinePresence: aiResearch.onlineReviews,
    pressMedia: aiResearch.pressMedia,
    inventory: aiResearch.inventory,
    fromTheWeb: Object.keys(fromTheWeb).length > 0 ? fromTheWeb : undefined,
    industrySpecificData: {
      googleRating: placesInfo.rating,
      googleReviewCount: placesInfo.reviewCount,
      priceLevel: placesInfo.priceLevel,
      awards: aiResearch.awards,
      certifications: aiResearch.certifications,
      founders: aiResearch.founders,
      teamSize: aiResearch.teamSize,
      // Country-aware registrations (GSTIN, PAN, EIN, etc.)
      registrations: aiResearch.registrations,
      ...(aiResearch.industryData || {}),
    },
    source: {
      placeId: placesInfo.placeId,
      placesData: true,
      aiEnriched: Object.keys(aiResearch).length > 0,
      fetchedAt: new Date(),
      // Track detected country for reference
      detectedCountry: detectedCountry,
    },
  };

  return profile;
}

/**
 * Create empty profile for clearing data
 */
export function createEmptyProfile(): Partial<BusinessPersona> {
  return {
    identity: {
      name: '',
      industry: null,
    },
    personality: {},
    customerProfile: {},
    knowledge: {},
    industrySpecificData: {},
    setupProgress: {
      basicInfo: false,
      contactInfo: false,
      operatingHours: false,
      businessDescription: false,
      customerProfile: false,
      productsServices: false,
      policies: false,
      faqs: false,
      overallPercentage: 0,
      nextRecommendedStep: 'basicInfo',
    },
  };
}

// ============================================
// INVENTORY MAPPING FUNCTIONS
// Convert simplified auto-fill inventory to proper BusinessPersona schema
// ============================================

import type {
  RoomType,
  MenuItem,
  MenuCategory,
  RetailProduct,
  PropertyListing,
  HealthcareService,
} from './business-persona-types';

/**
 * Generate a unique ID for inventory items
 */
function generateId(): string {
  return `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)} `;
}

/**
 * Map room inventory items to RoomType schema
 */
export function mapRoomsToRoomTypes(rooms: RoomInventoryItem[]): RoomType[] {
  return rooms.map((room): RoomType => {
    // Map category string to proper enum
    const categoryMap: Record<string, RoomType['category']> = {
      'standard': 'standard',
      'deluxe': 'deluxe',
      'superior': 'superior',
      'premium': 'premium',
      'suite': 'suite',
      'villa': 'villa',
      'cottage': 'cottage',
      'dormitory': 'dormitory',
      'apartment': 'apartment',
      'penthouse': 'penthouse',
    };

    // Map bed type string to proper enum
    const bedTypeMap: Record<string, 'single' | 'double' | 'twin' | 'queen' | 'king' | 'super_king'> = {
      'single': 'single',
      'double': 'double',
      'twin': 'twin',
      'queen': 'queen',
      'king': 'king',
      'super king': 'super_king',
      'super_king': 'super_king',
    };

    const category = categoryMap[room.category?.toLowerCase() || ''] || 'standard';
    const bedType = bedTypeMap[room.bedType?.toLowerCase() || ''] || 'double';

    return {
      id: generateId(),
      name: room.name,
      description: room.description || '',
      category,
      occupancy: {
        baseOccupancy: Math.min(room.maxOccupancy || 2, 2),
        maxOccupancy: room.maxOccupancy || 2,
        maxAdults: room.maxOccupancy || 2,
        maxChildren: Math.floor((room.maxOccupancy || 2) / 2),
        infantsAllowed: true,
        extraBedAvailable: (room.maxOccupancy || 2) > 2,
      },
      bedding: {
        beds: [{
          type: bedType,
          count: 1,
        }],
      },
      size: room.size ? {
        value: parseInt(room.size) || 0,
        unit: 'sqft',
      } : undefined,
      view: room.view,
      pricing: {
        basePrice: room.price || 0,
        currency: 'INR',
        priceType: 'per_night',
        taxInclusive: false,
      },
      amenities: room.amenities?.map(a => ({
        name: a,
        icon: '✓',
        included: true,
      })) || [],
      images: room.images?.map((url, idx) => ({
        id: `img_${idx} `,
        url,
        isPrimary: idx === 0,
      })) || [],
      status: 'active',
      inventory: {
        totalRooms: 1,
        availableRooms: 1,
      },
      source: 'auto_fill',
    };
  });
}

/**
 * Map menu inventory items to MenuItem schema
 */
export function mapMenuToMenuItems(menuItems: MenuInventoryItem[]): { items: MenuItem[]; categories: MenuCategory[] } {
  // Group items by category
  const categoryMap = new Map<string, MenuInventoryItem[]>();
  menuItems.forEach(item => {
    const cat = item.category || 'Uncategorized';
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, []);
    }
    categoryMap.get(cat)!.push(item);
  });

  // Create categories
  const categories: MenuCategory[] = Array.from(categoryMap.keys()).map((catName, idx): MenuCategory => ({
    id: `cat_${generateId()} `,
    name: catName,
    description: '',
    displayOrder: idx,
    isActive: true,
  }));

  // Create menu items
  const items: MenuItem[] = menuItems.map((item): MenuItem => {
    const category = categories.find(c => c.name === (item.category || 'Uncategorized'));

    // Map course from category name
    const courseMap: Record<string, MenuItem['course']> = {
      'appetizer': 'appetizer',
      'appetizers': 'appetizer',
      'starter': 'appetizer',
      'starters': 'appetizer',
      'soup': 'soup',
      'soups': 'soup',
      'salad': 'salad',
      'salads': 'salad',
      'main': 'main_course',
      'main course': 'main_course',
      'mains': 'main_course',
      'rice': 'rice',
      'biryani': 'rice',
      'bread': 'bread',
      'breads': 'bread',
      'roti': 'bread',
      'naan': 'bread',
      'dessert': 'dessert',
      'desserts': 'dessert',
      'sweet': 'dessert',
      'sweets': 'dessert',
      'beverage': 'beverage',
      'beverages': 'beverage',
      'drinks': 'beverage',
      'drink': 'beverage',
      'combo': 'combo',
      'combos': 'combo',
      'meal': 'combo',
      'thali': 'combo',
    };

    const course = courseMap[item.category?.toLowerCase() || ''] || 'main_course';

    return {
      id: generateId(),
      name: item.name,
      description: item.description || '',
      categoryId: category?.id || '',
      course,
      pricing: {
        price: item.price || 0,
        currency: 'INR',
        hasVariants: false,
      },
      dietary: {
        isVegetarian: item.isVeg || false,
        isVegan: item.isVegan || false,
        isGlutenFree: false,
        isHalal: false,
      },
      availability: {
        isAvailable: true,
        isPopular: item.popular || false,
        isChefSpecial: false,
        isNewItem: false,
        isSeasonal: false,
      },
      preparation: {
        estimatedTime: 15,
        canCustomize: true,
      },
      images: item.images?.map((url, idx) => ({
        id: `img_${idx} `,
        url,
        isPrimary: idx === 0,
      })) || [],
      status: 'active',
      source: 'auto_fill',
    };
  });

  return { items, categories };
}

/**
 * Map product inventory items to RetailProduct schema
 */
export function mapProductsToRetailProducts(products: ProductInventoryItem[]): RetailProduct[] {
  return products.map((product): RetailProduct => ({
    id: generateId(),
    name: product.name,
    description: product.description || '',
    category: product.category || 'General',
    brand: product.brand,
    sku: product.sku,
    pricing: {
      price: product.price || 0,
      mrp: product.mrp,
      currency: 'INR',
    },
    inventory: {
      trackInventory: true,
      stockQuantity: product.inStock ? 100 : 0,
      inStock: product.inStock ?? true,
      stockStatus: product.inStock ? 'in_stock' : 'out_of_stock',
    },
    specifications: product.specifications,
    images: product.images?.map((url, idx) => ({
      id: `img_${idx} `,
      url,
      isPrimary: idx === 0,
    })) || [],
    status: 'active',
    visibility: 'visible',
    source: 'auto_fill',
  }));
}

/**
 * Map property inventory items to PropertyListing schema
 */
export function mapPropertiesToPropertyListings(properties: PropertyInventoryItem[]): PropertyListing[] {
  return properties.map((property): PropertyListing => {
    // Map property type
    const typeMap: Record<string, PropertyListing['type']> = {
      'apartment': 'apartment',
      'flat': 'apartment',
      'villa': 'villa',
      'house': 'independent_house',
      'independent house': 'independent_house',
      'plot': 'plot',
      'land': 'plot',
      'commercial': 'commercial',
      'office': 'office',
      'shop': 'shop',
      'warehouse': 'warehouse',
      'pg': 'pg',
      'penthouse': 'penthouse',
      'studio': 'studio',
      'farmhouse': 'farmhouse',
    };

    const propType = typeMap[property.type?.toLowerCase() || ''] || 'apartment';
    const transactionType = (property.transactionType?.toLowerCase() === 'rent' ? 'rent' : 'sale') as 'sale' | 'rent';

    return {
      id: generateId(),
      title: property.title,
      description: property.description || '',
      type: propType,
      transactionType,
      status: 'available',
      location: {
        locality: property.location || '',
        city: '',
        state: '',
        country: 'India',
      },
      specifications: {
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        carpetArea: property.area ? {
          value: parseInt(property.area) || 0,
          unit: 'sqft',
        } : undefined,
      },
      pricing: {
        price: property.price || 0,
        priceType: transactionType === 'rent' ? 'monthly' : 'total',
        currency: 'INR',
        negotiable: true,
      },
      amenities: property.amenities?.map(a => ({
        name: a,
        available: true,
      })) || [],
      images: property.images?.map((url, idx) => ({
        id: `img_${idx} `,
        url,
        isPrimary: idx === 0,
      })) || [],
      source: 'auto_fill',
    };
  });
}

/**
 * Map service inventory items to HealthcareService schema
 */
export function mapServicesToHealthcareServices(services: ServiceInventoryItem[]): HealthcareService[] {
  return services.map((service): HealthcareService => {
    // Map category
    const categoryMap: Record<string, HealthcareService['category']> = {
      'consultation': 'consultation',
      'treatment': 'treatment',
      'diagnostic': 'diagnostic',
      'test': 'diagnostic',
      'surgery': 'surgery',
      'therapy': 'therapy',
      'vaccination': 'vaccination',
      'checkup': 'checkup',
      'procedure': 'procedure',
    };

    const category = categoryMap[service.category?.toLowerCase() || ''] || 'consultation';

    return {
      id: generateId(),
      name: service.name,
      description: service.description || '',
      category,
      department: service.specialization,
      specialization: service.specialization,
      provider: service.doctor ? {
        type: 'doctor',
        name: service.doctor,
      } : undefined,
      pricing: {
        price: service.price || 0,
        priceType: 'fixed',
        currency: 'INR',
        insuranceCovered: false,
      },
      duration: service.duration ? {
        estimated: parseInt(service.duration) || 30,
        unit: 'minutes',
      } : undefined,
      availability: {
        isAvailable: true,
        schedule: service.availability,
      },
      status: 'active',
      source: 'auto_fill',
    };
  });
}
