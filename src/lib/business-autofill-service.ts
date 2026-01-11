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
const PLACES_TYPE_TO_INDUSTRY: Record<string, string> = {
  // Real Estate
  'real_estate_agency': 'real_estate',

  // Hospitality
  'lodging': 'hospitality',
  'hotel': 'hospitality',
  'resort': 'hospitality',
  'guest_house': 'hospitality',
  'motel': 'hospitality',
  'campground': 'hospitality',

  // Food & Beverage
  'restaurant': 'food_beverage',
  'cafe': 'food_beverage',
  'bakery': 'food_beverage',
  'bar': 'food_beverage',
  'meal_delivery': 'food_beverage',
  'meal_takeaway': 'food_beverage',
  'night_club': 'food_beverage',

  // Retail
  'store': 'retail',
  'shopping_mall': 'retail',
  'clothing_store': 'retail',
  'electronics_store': 'retail',
  'furniture_store': 'retail',
  'jewelry_store': 'retail',
  'shoe_store': 'retail',
  'supermarket': 'retail',
  'convenience_store': 'retail',
  'department_store': 'retail',
  'book_store': 'retail',
  'hardware_store': 'retail',
  'pet_store': 'retail',
  'florist': 'retail',

  // Healthcare
  'hospital': 'healthcare',
  'doctor': 'healthcare',
  'dentist': 'healthcare',
  'pharmacy': 'healthcare',
  'physiotherapist': 'healthcare',
  'veterinary_care': 'healthcare',
  'health': 'healthcare',
  'medical_lab': 'healthcare',

  // Education
  'school': 'education',
  'university': 'education',
  'primary_school': 'education',
  'secondary_school': 'education',
  'library': 'education',
  'training_centre': 'education',

  // Finance
  'bank': 'finance',
  'accounting': 'finance',
  'insurance_agency': 'finance',
  'finance': 'finance',
  'atm': 'finance',

  // Fitness & Wellness
  'gym': 'fitness',
  'spa': 'wellness',
  'yoga_studio': 'fitness',

  // Beauty
  'beauty_salon': 'beauty',
  'hair_care': 'beauty',
  'nail_salon': 'beauty',

  // Legal
  'lawyer': 'legal',
  'courthouse': 'legal',

  // Automotive
  'car_dealer': 'automotive',
  'car_repair': 'automotive',
  'car_rental': 'automotive',
  'car_wash': 'automotive',
  'gas_station': 'automotive',
  'parking': 'automotive',

  // Events & Venues
  'event_venue': 'events',
  'wedding_venue': 'events',
  'banquet_hall': 'events',
  'convention_center': 'events',

  // Travel
  'travel_agency': 'travel',
  'tourist_attraction': 'travel',
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

// ========== NEW INVENTORY TYPES ==========

// Source tracking for all inventory items - ensures data accuracy
export interface InventorySource {
  platform: 'official_website' | 'zomato' | 'swiggy' | 'booking' | 'makemytrip' | 'practo' | 'google' | 'justdial' | 'amazon' | 'flipkart' | 'shiksha' | 'sulekha' | 'urbanclap' | 'other';
  url?: string;              // Direct URL to verify the data
  fetchedAt?: string;        // ISO date string when data was captured
  confidence: 'high' | 'medium' | 'low';  // Based on source reliability
}

// Price verification when data comes from multiple sources
export interface PriceVerification {
  sources: { platform: string; price: number; url?: string }[];
  hasVariance: boolean;      // True if prices differ between sources
  lowestPrice?: number;
  highestPrice?: number;
}

// Education - Courses & Programs
export interface CourseInventoryItem {
  name: string;
  category?: string;         // e.g., "Engineering", "Medical", "Arts"
  type?: string;             // e.g., "Degree", "Diploma", "Certificate", "Coaching"
  description?: string;
  fee?: number;
  feeStructure?: string;     // e.g., "Per Semester", "Full Course", "Per Month"
  duration?: string;         // e.g., "4 years", "6 months", "3 months"
  eligibility?: string;      // e.g., "10+2 with Science"
  batchTiming?: string;      // e.g., "Morning 9-12", "Weekend"
  startDate?: string;
  seats?: number;
  mode?: 'online' | 'offline' | 'hybrid';
  certificationBody?: string; // e.g., "University name", "ISO certified"
  placement?: boolean;
  placementRate?: string;
  _source?: InventorySource;
  _priceVerification?: PriceVerification;
}

// Beauty & Wellness - Treatments & Services
export interface TreatmentInventoryItem {
  name: string;
  category?: string;         // e.g., "Facial", "Massage", "Hair", "Nail"
  description?: string;
  price?: number;
  duration?: string;         // e.g., "60 mins", "90 mins"
  therapist?: string;        // Specialist name if applicable
  packageDeal?: boolean;     // Is this part of a package?
  packageDetails?: string;   // e.g., "5 sessions for price of 4"
  benefits?: string[];
  suitableFor?: string;      // e.g., "All skin types", "Dry skin"
  ingredients?: string[];    // Key ingredients used
  _source?: InventorySource;
  _priceVerification?: PriceVerification;
}

// Fitness - Memberships & Classes
export interface MembershipInventoryItem {
  name: string;
  type?: string;             // e.g., "Monthly", "Annual", "Pay-per-class"
  description?: string;
  price?: number;
  validity?: string;         // e.g., "1 month", "1 year"
  inclusions?: string[];     // e.g., ["Gym access", "Pool", "Classes"]
  classes?: string[];        // e.g., ["Yoga", "Zumba", "CrossFit"]
  timings?: string;          // e.g., "5 AM - 10 PM"
  trainerIncluded?: boolean;
  freezePolicy?: string;     // Can membership be paused?
  guestPasses?: number;
  _source?: InventorySource;
  _priceVerification?: PriceVerification;
}

// Automotive - Vehicles
export interface VehicleInventoryItem {
  name: string;              // Model name
  brand?: string;
  variant?: string;          // e.g., "Base", "Top", "Mid"
  type?: string;             // e.g., "SUV", "Sedan", "Hatchback", "Bike"
  price?: number;
  priceType?: 'ex-showroom' | 'on-road' | 'used';
  year?: number;
  fuelType?: string;         // e.g., "Petrol", "Diesel", "Electric", "Hybrid"
  transmission?: string;     // e.g., "Manual", "Automatic"
  mileage?: string;          // e.g., "18 kmpl"
  kmDriven?: number;         // For used vehicles
  color?: string;
  availability?: 'in_stock' | 'booking_open' | 'on_order';
  emi?: string;              // e.g., "Starting ₹15,000/month"
  _source?: InventorySource;
  _priceVerification?: PriceVerification;
}

// Events & Hospitality - Venue Packages
export interface VenuePackageInventoryItem {
  name: string;
  type?: string;             // e.g., "Wedding", "Conference", "Birthday", "Corporate"
  description?: string;
  price?: number;
  priceUnit?: string;        // e.g., "per plate", "per day", "per event"
  capacity?: {
    min?: number;
    max?: number;
  };
  inclusions?: string[];     // e.g., ["Catering", "Decoration", "DJ"]
  venueType?: string;        // e.g., "Indoor", "Outdoor", "Poolside"
  duration?: string;         // e.g., "4 hours", "Full day"
  cateringOptions?: string[];
  decorIncluded?: boolean;
  accommodationIncluded?: boolean;
  _source?: InventorySource;
  _priceVerification?: PriceVerification;
}

// Legal Services
export interface LegalServiceInventoryItem {
  name: string;
  category?: string;         // e.g., "Criminal", "Civil", "Corporate", "Family"
  description?: string;
  consultationFee?: number;
  feeType?: string;          // e.g., "Per hearing", "Fixed", "Retainer"
  estimatedFee?: string;     // e.g., "₹50,000 - ₹2,00,000"
  experience?: string;       // Lawyer's experience
  courtsPracticed?: string[]; // e.g., ["Supreme Court", "High Court"]
  successRate?: string;
  languages?: string[];
  _source?: InventorySource;
  _priceVerification?: PriceVerification;
}

// Financial Products
export interface FinancialProductInventoryItem {
  name: string;
  type?: string;             // e.g., "Personal Loan", "Home Loan", "Insurance", "Investment"
  description?: string;
  interestRate?: string;     // e.g., "10.5% - 12%"
  tenure?: string;           // e.g., "1-5 years"
  minAmount?: number;
  maxAmount?: number;
  processingFee?: string;    // e.g., "1% of loan amount"
  eligibility?: string;
  documents?: string[];      // Required documents
  features?: string[];
  provider?: string;         // Bank/NBFC name
  _source?: InventorySource;
  _priceVerification?: PriceVerification;
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
  // Inventory data - comprehensive inventory for all industries
  inventory?: {
    // Existing types
    rooms?: RoomInventoryItem[];
    menuItems?: MenuInventoryItem[];
    products?: ProductInventoryItem[];
    services?: ServiceInventoryItem[];
    properties?: PropertyInventoryItem[];
    // New types
    courses?: CourseInventoryItem[];
    treatments?: TreatmentInventoryItem[];
    memberships?: MembershipInventoryItem[];
    vehicles?: VehicleInventoryItem[];
    venuePackages?: VenuePackageInventoryItem[];
    legalServices?: LegalServiceInventoryItem[];
    financialProducts?: FinancialProductInventoryItem[];
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
  // Inventory data - comprehensive for all industries
  inventory?: {
    // Existing types
    rooms?: RoomInventoryItem[];
    menuItems?: MenuInventoryItem[];
    products?: ProductInventoryItem[];
    services?: ServiceInventoryItem[];
    properties?: PropertyInventoryItem[];
    // New types
    courses?: CourseInventoryItem[];
    treatments?: TreatmentInventoryItem[];
    memberships?: MembershipInventoryItem[];
    vehicles?: VehicleInventoryItem[];
    venuePackages?: VenuePackageInventoryItem[];
    legalServices?: LegalServiceInventoryItem[];
    financialProducts?: FinancialProductInventoryItem[];
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
  existingInfo?: PlacesDetailedInfo
): Promise<AIResearchResult> {
  const industryHint = existingInfo?.types?.find(t => PLACES_TYPE_TO_INDUSTRY[t])
    ? PLACES_TYPE_TO_INDUSTRY[existingInfo.types.find(t => PLACES_TYPE_TO_INDUSTRY[t])!]
    : 'general';

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
        "description": "Property description",
        "_source": { "platform": "official_website", "url": "source URL", "confidence": "high" }
      }
      // Include current listings from 99acres, MagicBricks, Housing.com, or official website
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

    case 'education':
      inventoryRequest = `
  "inventory": {
    "courses": [
      {
        "name": "Course/Program name",
        "category": "Engineering/Medical/Arts/Commerce/Science",
        "type": "Degree/Diploma/Certificate/Coaching/Tuition",
        "description": "Course description",
        "fee": 150000,
        "feeStructure": "Per Year/Per Semester/Full Course",
        "duration": "4 years/6 months/3 months",
        "eligibility": "10+2 with Science, 50% marks",
        "batchTiming": "Morning 9-12/Evening 5-8/Weekend",
        "mode": "offline/online/hybrid",
        "certificationBody": "University/Board name",
        "placement": true,
        "placementRate": "85%",
        "_source": { "platform": "official_website", "url": "source URL", "confidence": "high" }
      }
      // Search Shiksha, Collegedunia, Careers360, official website for courses and fees
    ]
  },`;
      industrySpecificRequest = `
    "industryData": {
      "institutionType": "School/College/University/Coaching/Training Institute",
      "affiliations": ["University/Board affiliations"],
      "accreditations": ["NAAC, NBA, AICTE, UGC approved"],
      "rankings": ["Any notable rankings"],
      "totalStudents": "Approximate student count",
      "facultyCount": "Number of faculty members",
      "campusFacilities": ["Library", "Labs", "Hostel", "Sports"],
      "placementPartners": ["Companies that recruit from here"],
      "averagePackage": "Average placement package",
      "admissionProcess": "Admission process summary"
    }`;
      break;

    case 'beauty':
    case 'wellness':
    case 'spa':
      inventoryRequest = `
  "inventory": {
    "treatments": [
      {
        "name": "Treatment/Service name",
        "category": "Facial/Massage/Hair/Nail/Body/Makeup",
        "description": "Treatment description",
        "price": 2500,
        "duration": "60 mins/90 mins",
        "therapist": "Specialist name if applicable",
        "packageDeal": false,
        "packageDetails": "Package offer details if any",
        "benefits": ["Relaxation", "Skin rejuvenation"],
        "suitableFor": "All skin types/Oily skin/Dry skin",
        "_source": { "platform": "official_website", "url": "source URL", "confidence": "high" }
      }
      // Search UrbanClap/Urban Company, official website, Justdial for services and prices
    ]
  },`;
      industrySpecificRequest = `
    "industryData": {
      "salonType": "Unisex/Men/Women",
      "specializations": ["Bridal", "Hair Color", "Spa", "Makeup"],
      "brands": ["Product brands used - L'Oreal, Schwarzkopf, etc."],
      "stylists": [{"name": "Stylist name", "specialization": "Hair/Makeup", "experience": "10 years"}],
      "packages": ["Popular package deals"],
      "membershipPlans": ["Any membership or loyalty programs"],
      "homeService": true,
      "bookingPlatforms": ["UrbanClap, Justdial, etc."]
    }`;
      break;

    case 'fitness':
    case 'gym':
      inventoryRequest = `
  "inventory": {
    "memberships": [
      {
        "name": "Membership plan name",
        "type": "Monthly/Quarterly/Annual/Pay-per-class",
        "description": "Plan description",
        "price": 3000,
        "validity": "1 month/3 months/1 year",
        "inclusions": ["Gym access", "Pool", "Group classes", "Personal training"],
        "classes": ["Yoga", "Zumba", "CrossFit", "Spinning"],
        "timings": "5 AM - 10 PM",
        "trainerIncluded": false,
        "freezePolicy": "Can pause for 1 month",
        "_source": { "platform": "official_website", "url": "source URL", "confidence": "high" }
      }
      // Search Cult.fit, official website, Justdial for membership plans
    ]
  },`;
      industrySpecificRequest = `
    "industryData": {
      "facilityType": "Gym/Fitness Studio/CrossFit Box/Yoga Studio",
      "equipment": ["Types of equipment available"],
      "classTypes": ["Classes offered - Yoga, Zumba, etc."],
      "trainers": [{"name": "Trainer name", "certification": "ACE/ISSA", "specialization": "Strength training"}],
      "operatingHours": "Gym operating hours",
      "trialSession": "Free trial available?",
      "personalTrainingRates": "PT session rates",
      "amenities": ["Locker", "Shower", "Parking", "Cafe"]
    }`;
      break;

    case 'legal':
    case 'lawyer':
      inventoryRequest = `
  "inventory": {
    "legalServices": [
      {
        "name": "Service/Practice area",
        "category": "Criminal/Civil/Corporate/Family/Property/Tax",
        "description": "Service description",
        "consultationFee": 2000,
        "feeType": "Per hearing/Fixed/Retainer",
        "estimatedFee": "₹50,000 - ₹2,00,000 depending on complexity",
        "experience": "15 years in this practice area",
        "courtsPracticed": ["Supreme Court", "High Court", "District Court"],
        "_source": { "platform": "official_website", "url": "source URL", "confidence": "high" }
      }
      // Search LegalKart, Vakil Search, official website for services
    ]
  },`;
      industrySpecificRequest = `
    "industryData": {
      "practiceAreas": ["All practice areas"],
      "barCouncilRegistration": "Bar Council registration number",
      "courtsPracticed": ["Courts where they practice"],
      "notableCases": ["Notable cases handled if public"],
      "teamSize": "Number of lawyers in firm",
      "consultationModes": ["In-person", "Video", "Phone"],
      "proBonoServices": "Do they offer pro-bono services?",
      "languages": ["Languages for consultation"]
    }`;
      break;

    case 'finance':
    case 'insurance_agency':
      inventoryRequest = `
  "inventory": {
    "financialProducts": [
      {
        "name": "Product name",
        "type": "Personal Loan/Home Loan/Car Loan/Insurance/Investment/Credit Card",
        "description": "Product description",
        "interestRate": "10.5% - 12% p.a.",
        "tenure": "1-5 years/5-30 years",
        "minAmount": 50000,
        "maxAmount": 5000000,
        "processingFee": "1% of loan amount",
        "eligibility": "Salaried, min income 25k, age 21-58",
        "documents": ["Aadhaar", "PAN", "Salary slips", "Bank statements"],
        "provider": "Bank/NBFC name if applicable",
        "_source": { "platform": "official_website", "url": "source URL", "confidence": "high" }
      }
      // Search BankBazaar, PaisaBazaar, official website for products
    ]
  },`;
      industrySpecificRequest = `
    "industryData": {
      "serviceTypes": ["Loans", "Insurance", "Investments", "Tax Planning"],
      "registrations": ["RBI registered", "SEBI registered", "IRDA licensed"],
      "partneredBanks": ["Banks/NBFCs they work with"],
      "minimumInvestment": "Minimum investment amount if applicable",
      "advisoryFee": "Fee structure for advisory services",
      "onlineServices": "Online application/tracking available?",
      "branchNetwork": "Number of branches"
    }`;
      break;

    case 'automotive':
    case 'car_dealer':
    case 'car_repair':
      inventoryRequest = `
  "inventory": {
    "vehicles": [
      {
        "name": "Model name",
        "brand": "Brand name",
        "variant": "Base/Mid/Top variant",
        "type": "SUV/Sedan/Hatchback/Bike/Scooter",
        "price": 1500000,
        "priceType": "ex-showroom/on-road",
        "year": 2024,
        "fuelType": "Petrol/Diesel/Electric/CNG/Hybrid",
        "transmission": "Manual/Automatic/CVT",
        "mileage": "18 kmpl",
        "availability": "in_stock/booking_open/on_order",
        "emi": "Starting ₹15,000/month",
        "_source": { "platform": "official_website", "url": "source URL", "confidence": "high" }
      }
      // Search CarDekho, CarWale, official website for inventory
    ],
    "services": [
      {
        "name": "Service type",
        "category": "Regular Service/Repair/Denting-Painting/Accessories",
        "price": 5000,
        "duration": "4 hours",
        "_source": { "platform": "official_website", "url": "source URL", "confidence": "high" }
      }
    ]
  },`;
      industrySpecificRequest = `
    "industryData": {
      "dealerType": "Authorized Dealer/Multi-brand/Used Cars/Service Center",
      "brands": ["Brands dealt with"],
      "servicesOffered": ["Sales", "Service", "Spare Parts", "Insurance", "Finance"],
      "workshopFacilities": ["Service bays", "Painting", "Denting"],
      "pickupDrop": "Pickup & drop service available?",
      "loanFacility": "On-site finance available?",
      "exchangePolicy": "Old car exchange policy",
      "warranty": "Warranty terms offered"
    }`;
      break;

    case 'events':
    case 'hospitality_venue':
      inventoryRequest = `
  "inventory": {
    "venuePackages": [
      {
        "name": "Package name",
        "type": "Wedding/Conference/Birthday/Corporate/Exhibition",
        "description": "Package description",
        "price": 150000,
        "priceUnit": "per plate/per day/per event",
        "capacity": { "min": 50, "max": 500 },
        "inclusions": ["Catering", "Decoration", "DJ", "Valet"],
        "venueType": "Indoor/Outdoor/Poolside/Lawn/Banquet Hall",
        "duration": "4 hours/8 hours/Full day",
        "cateringOptions": ["Veg", "Non-veg", "Multi-cuisine"],
        "decorIncluded": true,
        "_source": { "platform": "official_website", "url": "source URL", "confidence": "high" }
      }
      // Search WedMeGood, ShaadiSaga, official website for packages
    ],
    "rooms": [
      // Include if they have accommodation
    ]
  },`;
      industrySpecificRequest = `
    "industryData": {
      "venueTypes": ["Types of venues available"],
      "totalCapacity": "Maximum guest capacity",
      "cateringType": "In-house/External allowed",
      "decorPolicy": "In-house/External decorator allowed",
      "djPolicy": "In-house DJ/External allowed",
      "alcoholPolicy": "Alcohol serving policy",
      "parkingCapacity": "Number of parking spots",
      "accommodationAvailable": true,
      "nearbyAttractions": ["Nearby tourist/photo spots"]
    }`;
      break;

    default:
      inventoryRequest = '';
      industrySpecificRequest = `
    "industryData": {
      // Any industry-specific information relevant to this business
    }`;
  }

  const prompt = `Search the web thoroughly and research "${businessName}" located at "${address}"${website ? ` with website ${website}` : ''}.

I need COMPREHENSIVE business information for auto-filling a business profile. This data will be used to train an AI agent to handle customer queries.

Search these sources:
1. Their official website (scrape menu/products/services if available)
2. Google reviews and ratings
3. Social media (Instagram, Facebook, LinkedIn, Twitter/X)
4. Review platforms (TripAdvisor, Yelp, Zomato, Justdial, Practo, etc.)
5. News articles and press coverage
6. Business directories
7. Booking/e-commerce platforms for pricing info

Return the following in JSON format:

{
  "description": "A compelling 3-4 sentence description of the business - what they do, their history, and what makes them special",
  "tagline": "Their official tagline or slogan if they have one",
  "services": ["Comprehensive list of services they offer with details"],
  "products": ["List of products they sell, if applicable"],
  "targetAudience": ["Detailed customer segments - be specific about demographics, needs"],
  "uniqueSellingPoints": ["5-7 things that make this business stand out"],
  "faqs": [
    {"question": "Common question 1", "answer": "Detailed answer"},
    {"question": "Common question 2", "answer": "Detailed answer"}
    // Include 5-10 FAQs
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
  "paymentMethods": ["All accepted payment methods - UPI, cards, wallets, etc."],

  "onlineReviews": [
    {
      "source": "Platform name (TripAdvisor, Zomato, Yelp, Justdial, etc.)",
      "sourceUrl": "Direct URL to their listing on that platform",
      "rating": 4.5,
      "reviewCount": 500,
      "highlights": ["Common positive themes from reviews"]
    }
  ],

  "testimonials": [
    {
      "quote": "Actual customer testimonial or review quote",
      "author": "Customer name if available",
      "source": "Where you found this (Google, TripAdvisor, etc.)",
      "sourceUrl": "URL to the original review if possible"
    }
    // Include 3-5 notable testimonials
  ],

  "pressMedia": [
    {
      "title": "Article or feature title",
      "source": "Publication name",
      "url": "Article URL",
      "date": "Publication date"
    }
  ],

  ${inventoryRequest}

  ${industrySpecificRequest},

  "rawWebData": {
    "websiteContent": "Key content from their website that doesn't fit other fields",
    "additionalInfo": {
      // Any other useful information found that doesn't fit standard fields
    },
    "otherFindings": ["Other interesting facts or information about the business"]
  }
}

Industry: ${industryHint}
${existingInfo?.rating ? `Google Rating: ${existingInfo.rating}/5 (${existingInfo.reviewCount} reviews)` : ''}
${existingInfo?.editorialSummary ? `Google Summary: ${existingInfo.editorialSummary}` : ''}

CRITICAL INSTRUCTIONS - DATA ACCURACY IS PARAMOUNT:

1. SOURCE TRACKING - For ALL inventory items, include "_source" with:
   - "platform": Where you found this data (official_website, zomato, swiggy, booking, makemytrip, practo, justdial, amazon, flipkart, shiksha, urbanclap, etc.)
   - "url": Direct URL to verify the information
   - "confidence": "high" (official source/verified), "medium" (aggregator), "low" (inferred)

2. INVENTORY & PRICING - This is the MOST important data:
   - Hotels: Search Booking.com, MakeMyTrip, Agoda, Goibibo, AND official website for room rates
   - Restaurants: Search Zomato, Swiggy, EazyDiner, AND official website/menu for prices
   - Healthcare: Search Practo, Lybrate, 1mg, AND official website for consultation fees
   - Retail: Search official store, Amazon, Flipkart for product prices
   - Education: Search Shiksha, Collegedunia, Careers360, AND official website for course fees
   - Fitness: Search Cult.fit, ClassPass, AND official website for membership prices
   - Beauty: Search Urban Company, Justdial, AND official website for service prices
   - Automotive: Search CarDekho, CarWale, BikeWale, AND official website for prices
   - Events: Search WedMeGood, ShaadiSaga, AND official website for package prices
   - Legal/Finance: Search official website, LegalKart, BankBazaar for fee structures

3. VERIFICATION RULES:
   - ONLY include data you can VERIFY from actual sources
   - DO NOT hallucinate or make up prices, services, or features
   - If price differs between sources, note the range and sources
   - Prefer official website data over aggregator data
   - If information is not found, use null - DO NOT guess

4. WHAT TO CAPTURE:
   - All services/products with EXACT prices where available
   - Package deals, discounts, and offers
   - Operating hours and availability
   - Booking/ordering methods

Return ONLY valid JSON. If information cannot be verified, use null for that field.`;

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
      ...(aiResearch.industryData || {}),
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
      phone: '',
      email: '',
      website: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
      },
      operatingHours: {},
    },
    personality: {
      voiceTone: 'professional',
      description: '',
      tagline: '',
      uniqueSellingPoints: [],
    },
    customerProfile: {
      targetAudience: '',
      commonQueries: [],
      customerPainPoints: [],
    },
    knowledge: {
      productsOrServices: [],
      faqs: [],
      policies: {},
    },
    // Explicitly clear all industry-specific data
    industrySpecificData: {
      fetchedPhotos: [],
      fetchedReviews: [],
      onlinePresence: [],
      testimonials: [],
      fromTheWeb: null,
    },
    // Explicitly clear all inventory arrays
    roomTypes: [],
    menuItems: [],
    menuCategories: [],
    productCatalog: [],
    propertyListings: [],
    healthcareServices: [],
    diagnosticTests: [],
    // Clear other industry fields
    restaurantInfo: {},
    hotelPolicies: {},
    hotelAmenities: [],
    // Reset progress
    setupProgress: {
      completedSections: [],
      totalSections: 0,
      percentComplete: 0,
      overallPercentage: 0,
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
  return `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
        id: `img_${idx}`,
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
    id: `cat_${generateId()}`,
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
        isJain: false,
        isHalal: false,
        containsEgg: false,
        spiceLevel: (item.spiceLevel?.toLowerCase() as 'none' | 'mild' | 'medium' | 'hot' | 'extra_hot') || 'medium',
        allergens: item.allergens || [],
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
        id: `img_${idx}`,
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
      id: `img_${idx}`,
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
        id: `img_${idx}`,
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
