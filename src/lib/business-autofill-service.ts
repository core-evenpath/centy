/**
 * Business Profile Auto-Fill Service
 *
 * Uses Google Places API + Gemini AI with web search grounding
 * to automatically populate business profile data.
 */

import { GoogleGenAI } from "@google/genai";
import type { BusinessPersona, IndustryCategory } from './business-persona-types';

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
};

export interface PlacesAutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
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
  openingHours?: {
    weekdayText: string[];
    isOpen?: boolean;
  };
  photos?: string[];
  reviews?: {
    author: string;
    rating: number;
    text: string;
    time: string;
  }[];
  editorialSummary?: string;
  businessStatus?: string;
}

export interface AutoFilledProfile {
  identity: Partial<BusinessPersona['identity']>;
  personality: Partial<BusinessPersona['personality']>;
  customerProfile: Partial<BusinessPersona['customerProfile']>;
  knowledge: Partial<BusinessPersona['knowledge']>;
  industrySpecificData?: Record<string, any>;
  source: {
    placeId?: string;
    placesData: boolean;
    aiEnriched: boolean;
    fetchedAt: Date;
  };
}

/**
 * Google Places Autocomplete - search for businesses
 */
export async function searchPlacesAutocomplete(
  query: string,
  sessionToken?: string
): Promise<PlacesAutocompleteResult[]> {
  if (!PLACES_API_KEY) {
    console.error('[AutoFill] No Places API key configured');
    return [];
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
  url.searchParams.set('input', query);
  url.searchParams.set('types', 'establishment');
  url.searchParams.set('key', PLACES_API_KEY);
  if (sessionToken) {
    url.searchParams.set('sessiontoken', sessionToken);
  }

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('[AutoFill] Autocomplete error:', data.status, data.error_message);
      return [];
    }

    return (data.predictions || []).map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || p.description,
      secondaryText: p.structured_formatting?.secondary_text || '',
    }));
  } catch (error) {
    console.error('[AutoFill] Autocomplete fetch error:', error);
    return [];
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
    'url'
  ].join(','));
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
      openingHours: place.opening_hours ? {
        weekdayText: place.opening_hours.weekday_text || [],
        isOpen: place.opening_hours.open_now,
      } : undefined,
      photos: place.photos?.slice(0, 5).map((p: any) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${PLACES_API_KEY}`
      ),
      reviews: place.reviews?.slice(0, 5).map((r: any) => ({
        author: r.author_name,
        rating: r.rating,
        text: r.text,
        time: r.relative_time_description,
      })),
      editorialSummary: place.editorial_summary?.overview,
      businessStatus: place.business_status,
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
  existingInfo?: PlacesDetailedInfo
): Promise<{
  description?: string;
  tagline?: string;
  services?: string[];
  products?: string[];
  targetAudience?: string[];
  uniqueSellingPoints?: string[];
  faqs?: { question: string; answer: string }[];
  socialMedia?: { instagram?: string; facebook?: string; linkedin?: string; twitter?: string };
  founders?: string;
  yearEstablished?: string;
  teamSize?: string;
  awards?: string[];
  certifications?: string[];
  languages?: string[];
  paymentMethods?: string[];
  additionalInfo?: Record<string, any>;
}> {
  const industryHint = existingInfo?.types?.find(t => PLACES_TYPE_TO_INDUSTRY[t])
    ? PLACES_TYPE_TO_INDUSTRY[existingInfo.types.find(t => PLACES_TYPE_TO_INDUSTRY[t])!]
    : 'general';

  const prompt = `Search the web and research "${businessName}" located at "${address}"${website ? ` with website ${website}` : ''}.

I need comprehensive business information to auto-fill a business profile. Search their website, social media, review sites, and any other sources.

Please find and return the following in JSON format:

{
  "description": "A compelling 2-3 sentence description of the business, what they do, and what makes them special",
  "tagline": "A short catchy tagline or slogan if they have one",
  "services": ["List of services they offer"],
  "products": ["List of products they sell, if applicable"],
  "targetAudience": ["Who are their typical customers - be specific"],
  "uniqueSellingPoints": ["What makes this business stand out from competitors"],
  "faqs": [
    {"question": "Common question customers ask", "answer": "The answer"}
  ],
  "socialMedia": {
    "instagram": "Instagram handle or URL if found",
    "facebook": "Facebook page URL if found",
    "linkedin": "LinkedIn page URL if found",
    "twitter": "Twitter/X handle if found"
  },
  "founders": "Founder or owner names if publicly available",
  "yearEstablished": "Year the business was established",
  "teamSize": "Approximate team size (e.g., '10-50 employees')",
  "awards": ["Any awards or recognitions"],
  "certifications": ["Business certifications or accreditations"],
  "languages": ["Languages spoken/supported"],
  "paymentMethods": ["Accepted payment methods"],
  "additionalInfo": {
    // Any other relevant business-specific information
    // For restaurants: cuisine types, dietary options, delivery partners
    // For hotels: star rating, room types, amenities
    // For healthcare: specializations, insurance accepted
    // For retail: brands carried, delivery options
  }
}

Industry hint: ${industryHint}
${existingInfo?.rating ? `Google Rating: ${existingInfo.rating} (${existingInfo.reviewCount} reviews)` : ''}
${existingInfo?.editorialSummary ? `Google Summary: ${existingInfo.editorialSummary}` : ''}

Search thoroughly and return ONLY valid JSON. If information is not found, use null for that field.`;

  try {
    console.log('[AutoFill] Researching business with AI...');

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
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

    return JSON.parse(jsonMatch[0]);
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
  placeId: string
): Promise<AutoFilledProfile | null> {
  console.log('[AutoFill] Starting auto-fill for place:', placeId);

  // Step 1: Get Google Places details
  const placesInfo = await getPlaceDetails(placeId);

  if (!placesInfo) {
    console.error('[AutoFill] Could not get place details');
    return null;
  }

  console.log('[AutoFill] Got place details:', placesInfo.name);

  // Step 2: Research with AI
  const aiResearch = await researchBusinessWithAI(
    placesInfo.name,
    placesInfo.formattedAddress,
    placesInfo.website,
    placesInfo
  );

  console.log('[AutoFill] AI research complete');

  // Step 3: Detect industry
  const industry = detectIndustry(placesInfo.types || []);

  // Step 4: Map to BusinessPersona schema
  const profile: AutoFilledProfile = {
    identity: {
      businessName: placesInfo.name,
      industry: industry,
      description: aiResearch.description || placesInfo.editorialSummary,
      tagline: aiResearch.tagline,
      phone: placesInfo.phone,
      email: undefined, // Not available from Places API
      website: placesInfo.website,
      address: {
        street: placesInfo.formattedAddress,
        city: '', // Would need geocoding to extract
        state: '',
        country: '',
        pincode: '',
      },
      location: placesInfo.location,
      operatingHours: placesInfo.openingHours?.weekdayText
        ? parseOperatingHours(placesInfo.openingHours.weekdayText)
        : undefined,
      socialMedia: aiResearch.socialMedia ? {
        instagram: aiResearch.socialMedia.instagram,
        facebook: aiResearch.socialMedia.facebook,
        linkedin: aiResearch.socialMedia.linkedin,
        twitter: aiResearch.socialMedia.twitter,
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
    },
    industrySpecificData: {
      googleRating: placesInfo.rating,
      googleReviewCount: placesInfo.reviewCount,
      googlePhotos: placesInfo.photos,
      googleReviews: placesInfo.reviews,
      priceLevel: placesInfo.priceLevel,
      awards: aiResearch.awards,
      certifications: aiResearch.certifications,
      founders: aiResearch.founders,
      teamSize: aiResearch.teamSize,
      ...aiResearch.additionalInfo,
    },
    source: {
      placeId: placesInfo.placeId,
      placesData: true,
      aiEnriched: Object.keys(aiResearch).length > 0,
      fetchedAt: new Date(),
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
      businessName: '',
      industry: 'custom',
    },
    personality: {},
    customerProfile: {},
    knowledge: {},
    industrySpecificData: {},
    setupProgress: {
      completedSections: [],
      totalSections: 0,
      percentComplete: 0,
    },
  };
}
