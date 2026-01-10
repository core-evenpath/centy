/**
 * Hotel Data Import Service
 *
 * Uses Google Places API + Gemini AI with web search grounding
 * to fetch comprehensive hotel data for inventory import.
 */

import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

// Google Places API key (same or different key)
const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.GEMINI_API_KEY;

// Types for hotel data
export interface HotelBasicInfo {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: number; // 1-4 scale
  photos?: string[];
  location?: {
    lat: number;
    lng: number;
  };
  openingHours?: string[];
  types?: string[];
}

export interface HotelRoomType {
  id: string;
  name: string;
  description?: string;
  category: 'standard' | 'deluxe' | 'superior' | 'premium' | 'suite' | 'villa';
  occupancy: {
    maxOccupancy: number;
    maxAdults: number;
    maxChildren: number;
  };
  bedding: {
    beds: { type: string; count: number }[];
  };
  specifications: {
    size?: { value: number; unit: 'sqft' | 'sqm' };
    view?: string;
  };
  amenities: {
    inRoom: string[];
    bathroom: string[];
  };
  pricing: {
    basePrice: number;
    currency: string;
  };
  availability: {
    totalRooms: number;
    isActive: boolean;
    cancellationPolicy: string;
  };
}

export interface HotelFullData {
  basic: HotelBasicInfo;
  roomTypes: HotelRoomType[];
  amenities: {
    property: string[];
    dining: string[];
    recreation: string[];
    business: string[];
  };
  policies: {
    checkIn: string;
    checkOut: string;
    cancellation?: string;
    childPolicy?: string;
    petPolicy?: string;
  };
  nearbyPlaces?: {
    type: string;
    name: string;
    distance: string;
  }[];
  source: 'google_places' | 'ai_enriched' | 'manual';
  fetchedAt: Date;
}

/**
 * Search for hotels using Google Places API
 */
export async function searchHotels(query: string, location?: string): Promise<HotelBasicInfo[]> {
  const searchQuery = location ? `${query} hotel ${location}` : `${query} hotel`;

  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', searchQuery);
  url.searchParams.set('type', 'lodging');
  url.searchParams.set('key', PLACES_API_KEY || '');

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', data.status, data.error_message);
      throw new Error(`Places API error: ${data.status}`);
    }

    return (data.results || []).slice(0, 5).map((place: any) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      priceLevel: place.price_level,
      location: place.geometry?.location,
      types: place.types,
      photos: place.photos?.slice(0, 3).map((p: any) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${p.photo_reference}&key=${PLACES_API_KEY}`
      ),
    }));
  } catch (error) {
    console.error('Error searching hotels:', error);
    throw error;
  }
}

/**
 * Get detailed hotel info from Google Places API
 */
export async function getHotelDetails(placeId: string): Promise<HotelBasicInfo> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,price_level,photos,geometry,opening_hours,types,reviews,editorial_summary');
  url.searchParams.set('key', PLACES_API_KEY || '');

  try {
    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Places API error: ${data.status}`);
    }

    const place = data.result;

    return {
      placeId: placeId,
      name: place.name,
      address: place.formatted_address,
      phone: place.formatted_phone_number,
      website: place.website,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      priceLevel: place.price_level,
      location: place.geometry?.location,
      openingHours: place.opening_hours?.weekday_text,
      types: place.types,
      photos: place.photos?.slice(0, 10).map((p: any) =>
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${p.photo_reference}&key=${PLACES_API_KEY}`
      ),
    };
  } catch (error) {
    console.error('Error getting hotel details:', error);
    throw error;
  }
}

/**
 * Use Gemini AI with Google Search grounding to enrich hotel data
 * This fetches room types, amenities, and pricing from the web
 */
export async function enrichHotelDataWithAI(hotelName: string, location: string): Promise<{
  roomTypes: HotelRoomType[];
  amenities: HotelFullData['amenities'];
  policies: HotelFullData['policies'];
}> {
  const prompt = `Search the web for detailed information about "${hotelName}" hotel in ${location}.

I need the following information in a structured JSON format:

1. **Room Types**: Find all room categories/types offered by this hotel. For each room type, include:
   - Name (e.g., "Deluxe Room", "Executive Suite")
   - Description
   - Category (standard/deluxe/superior/premium/suite/villa)
   - Max occupancy, max adults, max children
   - Bed configuration (bed types and count)
   - Room size in sqft or sqm if available
   - View type if mentioned
   - In-room amenities (AC, TV, WiFi, minibar, etc.)
   - Bathroom amenities
   - Approximate price per night in INR (or convert to INR)
   - Number of such rooms if mentioned

2. **Hotel Amenities**: Categorize into:
   - Property amenities (Pool, Gym, Spa, Parking, etc.)
   - Dining options (Restaurant names, bars, room service)
   - Recreation (Kids area, games, activities)
   - Business facilities (Meeting rooms, conference hall)

3. **Policies**:
   - Check-in time
   - Check-out time
   - Cancellation policy
   - Child policy
   - Pet policy

Search multiple sources including the hotel's official website, booking.com, tripadvisor, makemytrip, and goibibo to get comprehensive data.

Return ONLY valid JSON matching this structure:
{
  "roomTypes": [
    {
      "name": "string",
      "description": "string",
      "category": "deluxe",
      "maxOccupancy": 3,
      "maxAdults": 2,
      "maxChildren": 1,
      "beds": [{"type": "king", "count": 1}],
      "sizeValue": 350,
      "sizeUnit": "sqft",
      "view": "City View",
      "inRoomAmenities": ["AC", "TV", "WiFi"],
      "bathroomAmenities": ["Shower", "Toiletries"],
      "pricePerNight": 5000,
      "totalRooms": 20
    }
  ],
  "amenities": {
    "property": ["Swimming Pool", "Gym"],
    "dining": ["Restaurant Name"],
    "recreation": ["Spa"],
    "business": ["Conference Hall"]
  },
  "policies": {
    "checkIn": "2:00 PM",
    "checkOut": "12:00 PM",
    "cancellation": "Free cancellation up to 24 hours",
    "childPolicy": "Children under 5 stay free",
    "petPolicy": "Pets not allowed"
  }
}`;

  try {
    // Use Gemini with Google Search grounding
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

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response');
      return getDefaultHotelData();
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Transform to our schema
    const roomTypes: HotelRoomType[] = (parsed.roomTypes || []).map((room: any, idx: number) => ({
      id: `room-${Date.now()}-${idx}`,
      name: room.name || 'Standard Room',
      description: room.description || '',
      category: mapCategory(room.category),
      occupancy: {
        maxOccupancy: room.maxOccupancy || 2,
        maxAdults: room.maxAdults || 2,
        maxChildren: room.maxChildren || 0,
      },
      bedding: {
        beds: room.beds || [{ type: 'double', count: 1 }],
      },
      specifications: {
        size: room.sizeValue ? { value: room.sizeValue, unit: room.sizeUnit || 'sqft' } : undefined,
        view: room.view,
      },
      amenities: {
        inRoom: room.inRoomAmenities || ['AC', 'TV', 'WiFi'],
        bathroom: room.bathroomAmenities || ['Shower', 'Toiletries'],
      },
      pricing: {
        basePrice: room.pricePerNight || 3000,
        currency: 'INR',
      },
      availability: {
        totalRooms: room.totalRooms || 10,
        isActive: true,
        cancellationPolicy: 'flexible',
      },
    }));

    return {
      roomTypes,
      amenities: {
        property: parsed.amenities?.property || [],
        dining: parsed.amenities?.dining || [],
        recreation: parsed.amenities?.recreation || [],
        business: parsed.amenities?.business || [],
      },
      policies: {
        checkIn: parsed.policies?.checkIn || '2:00 PM',
        checkOut: parsed.policies?.checkOut || '12:00 PM',
        cancellation: parsed.policies?.cancellation,
        childPolicy: parsed.policies?.childPolicy,
        petPolicy: parsed.policies?.petPolicy,
      },
    };
  } catch (error) {
    console.error('Error enriching hotel data with AI:', error);
    return getDefaultHotelData();
  }
}

function mapCategory(cat: string): HotelRoomType['category'] {
  const lower = (cat || '').toLowerCase();
  if (lower.includes('villa')) return 'villa';
  if (lower.includes('suite')) return 'suite';
  if (lower.includes('premium') || lower.includes('executive')) return 'premium';
  if (lower.includes('superior')) return 'superior';
  if (lower.includes('deluxe')) return 'deluxe';
  return 'standard';
}

function getDefaultHotelData() {
  return {
    roomTypes: [],
    amenities: {
      property: [],
      dining: [],
      recreation: [],
      business: [],
    },
    policies: {
      checkIn: '2:00 PM',
      checkOut: '12:00 PM',
    },
  };
}

/**
 * Complete hotel import flow
 * 1. Search for hotel using Places API
 * 2. Get detailed info from Places API
 * 3. Enrich with AI web search for room types and amenities
 */
export async function importHotelData(
  hotelName: string,
  location: string
): Promise<HotelFullData | null> {
  try {
    // Step 1: Search for the hotel
    console.log(`Searching for hotel: ${hotelName} in ${location}`);
    const searchResults = await searchHotels(hotelName, location);

    if (searchResults.length === 0) {
      console.log('No hotels found');
      // Still try AI enrichment even without Places data
      const aiData = await enrichHotelDataWithAI(hotelName, location);
      return {
        basic: {
          placeId: '',
          name: hotelName,
          address: location,
        },
        roomTypes: aiData.roomTypes,
        amenities: aiData.amenities,
        policies: aiData.policies,
        source: 'ai_enriched',
        fetchedAt: new Date(),
      };
    }

    // Step 2: Get detailed info for the best match
    const bestMatch = searchResults[0];
    console.log(`Found hotel: ${bestMatch.name}`);
    const details = await getHotelDetails(bestMatch.placeId);

    // Step 3: Enrich with AI
    console.log('Enriching with AI web search...');
    const aiData = await enrichHotelDataWithAI(details.name, location);

    return {
      basic: details,
      roomTypes: aiData.roomTypes,
      amenities: aiData.amenities,
      policies: aiData.policies,
      source: 'ai_enriched',
      fetchedAt: new Date(),
    };
  } catch (error) {
    console.error('Error importing hotel data:', error);
    return null;
  }
}

/**
 * Convert imported hotel data to RoomType inventory format
 */
export function convertToRoomInventory(hotelData: HotelFullData): any[] {
  return hotelData.roomTypes.map(room => ({
    id: room.id,
    name: room.name,
    description: room.description,
    category: room.category,
    occupancy: {
      baseOccupancy: 2,
      maxOccupancy: room.occupancy.maxOccupancy,
      maxAdults: room.occupancy.maxAdults,
      maxChildren: room.occupancy.maxChildren,
      infantsAllowed: true,
      extraBedAvailable: true,
    },
    bedding: room.bedding,
    specifications: {
      size: room.specifications.size,
      view: room.specifications.view,
    },
    amenities: {
      inRoom: room.amenities.inRoom,
      bathroom: room.amenities.bathroom,
      entertainment: [],
      comfort: [],
      food: ['Electric Kettle'],
    },
    pricing: {
      basePrice: room.pricing.basePrice,
      currency: room.pricing.currency,
      taxInclusive: false,
    },
    availability: {
      totalRooms: room.availability.totalRooms,
      isActive: true,
      instantBooking: true,
      cancellationPolicy: room.availability.cancellationPolicy,
      prepaymentRequired: true,
    },
    media: { images: [] },
    displayOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}
