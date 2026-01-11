'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/firebase-admin';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ============================================
// Comprehensive Business Data Types
// ============================================

export interface BusinessAddress {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode?: string;
}

export interface BusinessLocation {
    lat: number;
    lng: number;
}

export interface DaySchedule {
    open: string;
    close: string;
}

export interface OperatingHoursSchedule {
    monday?: DaySchedule;
    tuesday?: DaySchedule;
    wednesday?: DaySchedule;
    thursday?: DaySchedule;
    friday?: DaySchedule;
    saturday?: DaySchedule;
    sunday?: DaySchedule;
}

export interface SocialMediaLinks {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
}

export interface BusinessIdentityData {
    businessName: string;
    industry: string;
    description?: string;
    tagline?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: BusinessAddress;
    location?: BusinessLocation;
    googleMapsUrl?: string;
    plusCode?: string;
    operatingHours?: OperatingHoursSchedule;
    socialMedia?: SocialMediaLinks;
    languages?: string[];
}

export interface PersonalityData {
    description?: string;
    uniqueSellingPoints?: string[];
}

export interface CustomerProfileData {
    targetAudience?: string[];
}

export interface ProductService {
    name: string;
    description?: string;
    isService: boolean;
    category?: string;
    price?: number;
    priceRange?: string;
}

export interface FAQ {
    question: string;
    answer: string;
}

export interface KnowledgeData {
    productsOrServices?: ProductService[];
    faqs?: FAQ[];
    paymentMethods?: string[];
}

export interface Review {
    author: string;
    authorUrl?: string;
    profilePhoto?: string;
    rating: number;
    text: string;
    time?: string;
    timestamp?: number;
    source: string;
    sourceUrl?: string;
    language?: string;
}

export interface Testimonial {
    quote: string;
    author?: string;
    source?: string;
    sourceUrl?: string;
}

export interface OnlinePresence {
    source: string;
    sourceUrl?: string;
    rating?: number;
    reviewCount?: number;
    highlights?: string[];
}

// Restaurant-specific inventory
export interface MenuItem {
    name: string;
    category: string;
    description?: string;
    price?: number;
    isVeg?: boolean;
    isVegan?: boolean;
    spiceLevel?: string;
    servingSize?: string;
    popular?: boolean;
}

// Hotel-specific inventory
export interface RoomType {
    name: string;
    category: string;
    description?: string;
    price?: number;
    priceUnit?: string;
    maxOccupancy?: number;
    bedType?: string;
    amenities?: string[];
    size?: string;
    view?: string;
}

export interface InventoryData {
    menuItems?: MenuItem[];
    rooms?: RoomType[];
    services?: ProductService[];
    products?: ProductService[];
}

export interface IndustrySpecificData {
    googleRating?: number;
    googleReviewCount?: number;
    awards?: string[];
    certifications?: string[];
    founders?: string;
    teamSize?: string;
    // Restaurant specific
    cuisineTypes?: string[];
    dietaryOptions?: string[];
    mealTypes?: string[];
    averageCost?: string;
    deliveryPartners?: string[];
    specialties?: string[];
    seatingCapacity?: number;
    reservationRequired?: boolean;
    alcoholServed?: boolean;
    menuUrl?: string;
    // Hotel specific
    starRating?: string;
    totalRooms?: string;
    amenities?: string[];
    checkInTime?: string;
    checkOutTime?: string;
    petPolicy?: string;
    parkingInfo?: string;
    nearbyAttractions?: string[];
    bookingPartners?: string[];
    cancellationPolicy?: string;
    // Real Estate specific
    propertyTypes?: string[];
    areasServed?: string[];
    reraRegistration?: string;
    priceRange?: string;
}

export interface FromTheWebData {
    websiteContent?: string;
    additionalInfo?: Record<string, string>;
    otherFindings?: string[];
    rawIndustryData?: Record<string, any>;
}

export interface SourceMetadata {
    placeId?: string;
    placesData?: boolean;
    aiEnriched: boolean;
    fetchedAt: string;
}

// Complete comprehensive business research result
export interface ComprehensiveBusinessData {
    identity: BusinessIdentityData;
    personality?: PersonalityData;
    customerProfile?: CustomerProfileData;
    knowledge?: KnowledgeData;
    photos?: Array<{
        url: string;
        photoReference?: string;
        width?: number;
        height?: number;
        attribution?: string;
        selected?: boolean;
    }>;
    reviews?: Review[];
    testimonials?: Testimonial[];
    onlinePresence?: OnlinePresence[];
    pressMedia?: Array<{ title: string; url: string; date?: string }>;
    inventory?: InventoryData;
    fromTheWeb?: FromTheWebData;
    industrySpecificData?: IndustrySpecificData;
    source: SourceMetadata;
}

// For backward compatibility and UI integration
export interface ResearchDataItem {
    id: string;
    category: string;
    label: string;
    value: string | string[] | Record<string, any>;
    fieldPath?: string;
    isNegative?: boolean;
    confidence?: number;
    source?: string;
}

export interface BusinessResearchResult {
    businessName: string;
    businessType?: string;
    summary?: string;
    rating?: number;
    reviewCount?: number;
    items: ResearchDataItem[];
    comprehensiveData?: ComprehensiveBusinessData;
}

interface SearchResult {
    success: boolean;
    data?: BusinessResearchResult;
    message?: string;
}

export interface AddressSuggestion {
    id: string;
    mainText: string;
    secondaryText?: string;
    displayName: string;
    type?: string;
    placeId?: string;
}

interface SuggestionsResult {
    success: boolean;
    suggestions?: AddressSuggestion[];
    message?: string;
}

/**
 * Gets address/business suggestions based on user input query.
 */
export async function getAddressSuggestionsAction(
    query: string
): Promise<SuggestionsResult> {
    try {
        if (!query || query.length < 2) {
            return { success: true, suggestions: [] };
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const suggestionsPrompt = `You are a business/place search autocomplete assistant. Generate 5-8 realistic business or place suggestions based on this search query.

Search Query: "${query}"

Return a JSON array of suggestions. Each suggestion should include:
- id: unique identifier
- mainText: The primary name of the business/place
- secondaryText: Address or location details
- displayName: Full display name (mainText + location context)
- type: Category like "Restaurant", "Retail Store", "Cafe", "Salon", "Clinic", "Hotel", etc.

Make the suggestions diverse and realistic. Include well-known chains and local businesses mix.

Return ONLY a valid JSON array, no markdown:
[
  {
    "id": "1",
    "mainText": "Business Name",
    "secondaryText": "Area, City",
    "displayName": "Business Name, Area, City",
    "type": "Business Type"
  }
]`;

        const result = await model.generateContent(suggestionsPrompt);
        const response = result.response.text();

        let suggestions: AddressSuggestion[];
        try {
            const cleanedResponse = response
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            suggestions = JSON.parse(cleanedResponse);
        } catch {
            return { success: true, suggestions: [] };
        }

        if (!Array.isArray(suggestions)) {
            return { success: true, suggestions: [] };
        }

        suggestions = suggestions.map((s, i) => ({
            id: s.id || `suggestion-${i}`,
            mainText: s.mainText || query,
            secondaryText: s.secondaryText || '',
            displayName: s.displayName || s.mainText || query,
            type: s.type || 'Business',
        }));

        return { success: true, suggestions: suggestions.slice(0, 8) };
    } catch (error) {
        console.error('Suggestions error:', error);
        return { success: true, suggestions: [] };
    }
}

/**
 * Searches for business information and uses AI to research and extract
 * comprehensive data for the business profile knowledge base.
 */
export async function searchBusinessAndResearchAction(
    partnerId: string,
    searchQuery: string
): Promise<SearchResult> {
    try {
        if (!searchQuery.trim()) {
            return { success: false, message: 'Please enter a search query' };
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const researchPrompt = `You are a comprehensive business research assistant. Research the following business and generate detailed, structured data.

Search Query: "${searchQuery}"

Generate a comprehensive JSON object with ALL of the following sections. Be thorough and realistic.

{
  "identity": {
    "businessName": "Official business name",
    "industry": "food_beverage|hospitality|real_estate|retail|beauty_wellness|healthcare|services|education|automotive|other",
    "description": "Detailed 2-3 sentence description of the business, its history, and what makes it special",
    "tagline": "A catchy tagline or slogan if known",
    "phone": "Phone number in local format",
    "email": "Business email if available",
    "website": "Website URL",
    "address": {
      "street": "Full street address with landmarks",
      "city": "City name",
      "state": "State/Province",
      "country": "Country",
      "pincode": "Postal code"
    },
    "location": {
      "lat": 0.0,
      "lng": 0.0
    },
    "googleMapsUrl": "Google Maps URL if available",
    "operatingHours": {
      "monday": { "open": "HH:MM AM/PM", "close": "HH:MM AM/PM" },
      "tuesday": { "open": "HH:MM AM/PM", "close": "HH:MM AM/PM" },
      "wednesday": { "open": "HH:MM AM/PM", "close": "HH:MM AM/PM" },
      "thursday": { "open": "HH:MM AM/PM", "close": "HH:MM AM/PM" },
      "friday": { "open": "HH:MM AM/PM", "close": "HH:MM AM/PM" },
      "saturday": { "open": "HH:MM AM/PM", "close": "HH:MM AM/PM" },
      "sunday": { "open": "HH:MM AM/PM", "close": "HH:MM AM/PM" }
    },
    "socialMedia": {
      "instagram": "@handle or null",
      "facebook": "page URL or null",
      "linkedin": "URL or null",
      "twitter": "@handle or null"
    },
    "languages": ["English", "Local language"]
  },
  "personality": {
    "description": "Same as identity.description or more detailed version",
    "uniqueSellingPoints": [
      "USP 1 - what makes them different",
      "USP 2",
      "USP 3",
      "At least 5-7 points"
    ]
  },
  "customerProfile": {
    "targetAudience": [
      "Audience segment 1",
      "Audience segment 2",
      "At least 3-5 segments"
    ]
  },
  "knowledge": {
    "productsOrServices": [
      {
        "name": "Product/Service name",
        "description": "Brief description",
        "isService": true/false,
        "category": "Category name",
        "priceRange": "Price range or specific price"
      }
    ],
    "faqs": [
      {
        "question": "Common customer question?",
        "answer": "Detailed helpful answer"
      }
    ],
    "paymentMethods": ["UPI", "Cards", "Cash", "Wallets", "etc."]
  },
  "reviews": [
    {
      "author": "Customer Name",
      "rating": 5,
      "text": "Actual review text - detailed and realistic",
      "time": "X months ago",
      "source": "google|yelp|tripadvisor|zomato|ai_research"
    }
  ],
  "testimonials": [
    {
      "quote": "Direct quote from a satisfied customer - make it specific and authentic",
      "author": "Customer Name",
      "source": "Platform name"
    }
  ],
  "onlinePresence": [
    {
      "source": "Google",
      "rating": 4.5,
      "reviewCount": 150,
      "highlights": ["Key highlight 1", "Key highlight 2"]
    },
    {
      "source": "Yelp/TripAdvisor/Zomato/Justdial (as applicable)",
      "rating": 4.2,
      "reviewCount": 80,
      "highlights": ["Highlight 1", "Highlight 2"]
    }
  ],
  "inventory": {
    // FOR RESTAURANTS/CAFES - include menuItems:
    "menuItems": [
      {
        "name": "Dish/Item name",
        "category": "Starters|Mains|Desserts|Beverages|etc.",
        "description": "Brief description",
        "price": 299,
        "isVeg": true/false,
        "popular": true/false
      }
    ],
    // FOR HOTELS - include rooms:
    "rooms": [
      {
        "name": "Room type name",
        "category": "Standard|Deluxe|Suite|Villa",
        "description": "Room description",
        "price": 5000,
        "priceUnit": "per night",
        "maxOccupancy": 3,
        "bedType": "King/Queen/Twin",
        "amenities": ["WiFi", "AC", "TV", "etc."],
        "size": "300 sq ft",
        "view": "Lake/Garden/City"
      }
    ],
    // FOR OTHER BUSINESSES - include services or products as applicable
    "services": [],
    "products": []
  },
  "fromTheWeb": {
    "additionalInfo": {
      "Key": "Value pairs of additional info"
    },
    "otherFindings": [
      "Other interesting facts found during research"
    ],
    "rawIndustryData": {
      // Industry-specific raw data
      // For restaurants: cuisineTypes, dietaryOptions, deliveryPartners, etc.
      // For hotels: starRating, totalRooms, amenities, checkInTime, etc.
      // For real estate: propertyTypes, areasServed, etc.
    }
  },
  "industrySpecificData": {
    "googleRating": 4.5,
    "googleReviewCount": 150,
    "awards": ["Award 1", "Award 2"],
    "certifications": ["Cert 1"],
    // Include all industry-specific fields based on business type
  }
}

IMPORTANT GUIDELINES:
1. Generate realistic, plausible data based on the business name and location
2. For restaurants: Include at least 15-20 menu items across categories with actual prices
3. For hotels: Include 3-5 room types with detailed amenities and pricing
4. Include at least 5 reviews with varying ratings (mostly positive, 1-2 with minor issues)
5. Include at least 3 testimonials with specific, authentic-sounding quotes
6. Include online presence from 2-4 relevant platforms with ratings
7. FAQs should be practical and answer real customer questions
8. Operating hours should be realistic for the business type
9. Include negative reviews too but mark them appropriately (1-2 star ratings with constructive criticism)
10. All prices should be in local currency (INR for India, USD for US, etc.)

Return ONLY the JSON object, no markdown formatting or explanation.`;

        const result = await model.generateContent(researchPrompt);
        const response = result.response.text();

        let comprehensiveData: ComprehensiveBusinessData;
        try {
            const cleanedResponse = response
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            comprehensiveData = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            return { success: false, message: 'Failed to process research results. Please try again.' };
        }

        // Validate basic structure
        if (!comprehensiveData.identity?.businessName) {
            return { success: false, message: 'Invalid research results. Please try a different search.' };
        }

        // Add source metadata
        comprehensiveData.source = {
            aiEnriched: true,
            fetchedAt: new Date().toISOString(),
        };

        // Convert comprehensive data to ResearchDataItem array for UI compatibility
        const items = convertToResearchItems(comprehensiveData);

        // Build the result
        const businessResult: BusinessResearchResult = {
            businessName: comprehensiveData.identity.businessName,
            businessType: comprehensiveData.identity.industry,
            summary: comprehensiveData.identity.description,
            rating: comprehensiveData.industrySpecificData?.googleRating,
            reviewCount: comprehensiveData.industrySpecificData?.googleReviewCount,
            items,
            comprehensiveData,
        };

        // Log the search for analytics
        try {
            await db.collection('partners').doc(partnerId).collection('autofillSearches').add({
                query: searchQuery,
                businessName: businessResult.businessName,
                itemCount: items.length,
                timestamp: new Date(),
            });
        } catch (logError) {
            console.warn('Failed to log search:', logError);
        }

        return { success: true, data: businessResult };

    } catch (error: any) {
        console.error('Business search error:', error);
        return {
            success: false,
            message: error.message || 'An error occurred during research. Please try again.',
        };
    }
}

/**
 * Converts comprehensive business data to ResearchDataItem array for UI display
 */
function convertToResearchItems(data: ComprehensiveBusinessData): ResearchDataItem[] {
    const items: ResearchDataItem[] = [];
    let idCounter = 0;
    const getId = () => `item-${idCounter++}-${Date.now()}`;

    // Identity items
    if (data.identity) {
        const id = data.identity;
        if (id.businessName) {
            items.push({ id: getId(), category: 'identity', label: 'Business Name', value: id.businessName, fieldPath: 'identity.name', confidence: 0.95, source: 'AI Research' });
        }
        if (id.description) {
            items.push({ id: getId(), category: 'identity', label: 'Description', value: id.description, fieldPath: 'personality.description', confidence: 0.9, source: 'AI Research' });
        }
        if (id.tagline) {
            items.push({ id: getId(), category: 'identity', label: 'Tagline', value: id.tagline, fieldPath: 'personality.tagline', confidence: 0.85, source: 'AI Research' });
        }
        if (id.industry) {
            items.push({ id: getId(), category: 'identity', label: 'Industry', value: id.industry, fieldPath: 'identity.industry', confidence: 0.9, source: 'AI Research' });
        }
        if (id.phone) {
            items.push({ id: getId(), category: 'contact', label: 'Phone', value: id.phone, fieldPath: 'identity.phone', confidence: 0.9, source: 'AI Research' });
        }
        if (id.email) {
            items.push({ id: getId(), category: 'contact', label: 'Email', value: id.email, fieldPath: 'identity.email', confidence: 0.8, source: 'AI Research' });
        }
        if (id.website) {
            items.push({ id: getId(), category: 'contact', label: 'Website', value: id.website, fieldPath: 'identity.website', confidence: 0.9, source: 'AI Research' });
        }
        if (id.address) {
            items.push({ id: getId(), category: 'contact', label: 'Address', value: `${id.address.street}, ${id.address.city}, ${id.address.state} ${id.address.pincode || ''}`, fieldPath: 'identity.address', confidence: 0.9, source: 'AI Research' });
        }
        if (id.googleMapsUrl) {
            items.push({ id: getId(), category: 'contact', label: 'Google Maps', value: id.googleMapsUrl, fieldPath: 'identity.address.googleMapsUrl', confidence: 0.95, source: 'AI Research' });
        }
        if (id.operatingHours) {
            items.push({ id: getId(), category: 'hours', label: 'Operating Hours', value: id.operatingHours, fieldPath: 'identity.operatingHours.schedule', confidence: 0.85, source: 'AI Research' });
        }
        if (id.languages?.length) {
            items.push({ id: getId(), category: 'identity', label: 'Languages', value: id.languages, fieldPath: 'personality.languagePreference', confidence: 0.8, source: 'AI Research' });
        }
        if (id.socialMedia) {
            if (id.socialMedia.instagram) {
                items.push({ id: getId(), category: 'social', label: 'Instagram', value: id.socialMedia.instagram, fieldPath: 'identity.socialMedia.instagram', confidence: 0.85, source: 'AI Research' });
            }
            if (id.socialMedia.facebook) {
                items.push({ id: getId(), category: 'social', label: 'Facebook', value: id.socialMedia.facebook, fieldPath: 'identity.socialMedia.facebook', confidence: 0.85, source: 'AI Research' });
            }
            if (id.socialMedia.twitter) {
                items.push({ id: getId(), category: 'social', label: 'Twitter/X', value: id.socialMedia.twitter, fieldPath: 'identity.socialMedia.twitter', confidence: 0.85, source: 'AI Research' });
            }
            if (id.socialMedia.linkedin) {
                items.push({ id: getId(), category: 'social', label: 'LinkedIn', value: id.socialMedia.linkedin, fieldPath: 'identity.socialMedia.linkedin', confidence: 0.85, source: 'AI Research' });
            }
        }
    }

    // Personality items
    if (data.personality?.uniqueSellingPoints?.length) {
        items.push({ id: getId(), category: 'usp', label: 'Unique Selling Points', value: data.personality.uniqueSellingPoints, fieldPath: 'personality.uniqueSellingPoints', confidence: 0.85, source: 'AI Research' });
    }

    // Customer Profile
    if (data.customerProfile?.targetAudience?.length) {
        items.push({ id: getId(), category: 'identity', label: 'Target Audience', value: data.customerProfile.targetAudience, fieldPath: 'customerProfile.targetAudience', confidence: 0.8, source: 'AI Research' });
    }

    // Knowledge items
    if (data.knowledge) {
        if (data.knowledge.productsOrServices?.length) {
            data.knowledge.productsOrServices.forEach((ps, i) => {
                const category = ps.isService ? 'inventory_general' : 'inventory_retail';
                items.push({ id: getId(), category, label: ps.name, value: { ...ps }, fieldPath: `knowledge.productsOrServices[${i}]`, confidence: 0.85, source: 'AI Research' });
            });
        }
        if (data.knowledge.faqs?.length) {
            data.knowledge.faqs.forEach((faq, i) => {
                items.push({ id: getId(), category: 'faqs', label: faq.question, value: faq.answer, fieldPath: `knowledge.faqs[${i}]`, confidence: 0.8, source: 'AI Research' });
            });
        }
        if (data.knowledge.paymentMethods?.length) {
            items.push({ id: getId(), category: 'payments', label: 'Payment Methods', value: data.knowledge.paymentMethods, fieldPath: 'knowledge.acceptedPayments', confidence: 0.85, source: 'AI Research' });
        }
    }

    // Inventory - Menu Items (Restaurant)
    if (data.inventory?.menuItems?.length) {
        data.inventory.menuItems.forEach((item, i) => {
            const label = item.popular ? `⭐ ${item.name}` : item.name;
            const priceStr = item.price ? ` - ₹${item.price}` : '';
            items.push({
                id: getId(),
                category: 'inventory_restaurant',
                label: `${label}${priceStr}`,
                value: { ...item },
                fieldPath: `knowledge.inventory.menuItems[${i}]`,
                confidence: 0.85,
                source: 'AI Research'
            });
        });
    }

    // Inventory - Rooms (Hotel)
    if (data.inventory?.rooms?.length) {
        data.inventory.rooms.forEach((room, i) => {
            const priceStr = room.price ? ` - ₹${room.price}/${room.priceUnit || 'night'}` : '';
            items.push({
                id: getId(),
                category: 'inventory_hotel',
                label: `${room.name}${priceStr}`,
                value: { ...room },
                fieldPath: `knowledge.inventory.rooms[${i}]`,
                confidence: 0.85,
                source: 'AI Research'
            });
        });
    }

    // Reviews
    if (data.reviews?.length) {
        data.reviews.forEach((review, i) => {
            const isNegative = review.rating <= 2;
            const category = isNegative ? 'reviews_negative' : 'reviews_positive';
            const stars = '⭐'.repeat(Math.round(review.rating));
            items.push({
                id: getId(),
                category,
                label: `${stars} ${review.author}`,
                value: review.text,
                isNegative,
                confidence: 0.9,
                source: review.source
            });
        });
    }

    // Testimonials
    if (data.testimonials?.length) {
        data.testimonials.forEach((testimonial, i) => {
            items.push({
                id: getId(),
                category: 'testimonials',
                label: testimonial.author || 'Customer',
                value: `"${testimonial.quote}"`,
                fieldPath: `knowledge.testimonials[${i}]`,
                confidence: 0.9,
                source: testimonial.source || 'Customer Review'
            });
        });
    }

    // Online Presence / Directory Listings
    if (data.onlinePresence?.length) {
        data.onlinePresence.forEach((presence, i) => {
            const ratingStr = presence.rating ? ` (${presence.rating}/5, ${presence.reviewCount} reviews)` : '';
            items.push({
                id: getId(),
                category: 'directory_listings',
                label: `${presence.source}${ratingStr}`,
                value: { ...presence },
                fieldPath: `knowledge.directoryListings[${i}]`,
                confidence: 0.9,
                source: presence.source
            });
        });
    }

    // Industry-specific data
    if (data.industrySpecificData) {
        const isd = data.industrySpecificData;
        if (isd.cuisineTypes?.length) {
            items.push({ id: getId(), category: 'inventory_restaurant', label: 'Cuisine Types', value: isd.cuisineTypes, confidence: 0.9, source: 'AI Research' });
        }
        if (isd.dietaryOptions?.length) {
            items.push({ id: getId(), category: 'inventory_restaurant', label: 'Dietary Options', value: isd.dietaryOptions, confidence: 0.85, source: 'AI Research' });
        }
        if (isd.deliveryPartners?.length) {
            items.push({ id: getId(), category: 'delivery', label: 'Delivery Partners', value: isd.deliveryPartners, fieldPath: 'knowledge.deliveryOptions', confidence: 0.9, source: 'AI Research' });
        }
        if (isd.specialties?.length) {
            items.push({ id: getId(), category: 'inventory_restaurant', label: 'Specialties', value: isd.specialties, confidence: 0.85, source: 'AI Research' });
        }
        if (isd.averageCost) {
            items.push({ id: getId(), category: 'inventory_restaurant', label: 'Average Cost', value: isd.averageCost, confidence: 0.85, source: 'AI Research' });
        }
        if (isd.starRating) {
            items.push({ id: getId(), category: 'inventory_hotel', label: 'Star Rating', value: isd.starRating, confidence: 0.95, source: 'AI Research' });
        }
        if (isd.totalRooms) {
            items.push({ id: getId(), category: 'inventory_hotel', label: 'Total Rooms', value: isd.totalRooms, confidence: 0.85, source: 'AI Research' });
        }
        if (isd.amenities?.length) {
            items.push({ id: getId(), category: 'inventory_hotel', label: 'Hotel Amenities', value: isd.amenities, confidence: 0.85, source: 'AI Research' });
        }
        if (isd.checkInTime) {
            items.push({ id: getId(), category: 'hours', label: 'Check-in Time', value: isd.checkInTime, confidence: 0.9, source: 'AI Research' });
        }
        if (isd.checkOutTime) {
            items.push({ id: getId(), category: 'hours', label: 'Check-out Time', value: isd.checkOutTime, confidence: 0.9, source: 'AI Research' });
        }
        if (isd.nearbyAttractions?.length) {
            items.push({ id: getId(), category: 'inventory_hotel', label: 'Nearby Attractions', value: isd.nearbyAttractions, confidence: 0.8, source: 'AI Research' });
        }
        if (isd.bookingPartners?.length) {
            items.push({ id: getId(), category: 'directory_listings', label: 'Booking Platforms', value: isd.bookingPartners, confidence: 0.9, source: 'AI Research' });
        }
        if (isd.cancellationPolicy) {
            items.push({ id: getId(), category: 'credentials', label: 'Cancellation Policy', value: isd.cancellationPolicy, fieldPath: 'knowledge.policies.cancellationPolicy', confidence: 0.8, source: 'AI Research' });
        }
        if (isd.awards?.length) {
            items.push({ id: getId(), category: 'credentials', label: 'Awards', value: isd.awards, fieldPath: 'knowledge.awards', confidence: 0.85, source: 'AI Research' });
        }
        if (isd.certifications?.length) {
            items.push({ id: getId(), category: 'credentials', label: 'Certifications', value: isd.certifications, fieldPath: 'knowledge.certifications', confidence: 0.85, source: 'AI Research' });
        }
    }

    // From the web - additional findings
    if (data.fromTheWeb?.otherFindings?.length) {
        data.fromTheWeb.otherFindings.forEach((finding, i) => {
            items.push({ id: getId(), category: 'identity', label: `Additional Info ${i + 1}`, value: finding, confidence: 0.75, source: 'Web Research' });
        });
    }

    // Sort: non-negative first, then negative
    items.sort((a, b) => {
        if (a.isNegative && !b.isNegative) return 1;
        if (!a.isNegative && b.isNegative) return -1;
        return 0;
    });

    return items;
}

/**
 * Applies selected auto-fill data to the business persona
 */
export async function applyAutoFillDataAction(
    partnerId: string,
    selectedItems: ResearchDataItem[]
): Promise<{ success: boolean; message?: string }> {
    try {
        if (!selectedItems.length) {
            return { success: false, message: 'No items selected' };
        }

        const updateData: Record<string, any> = {};

        selectedItems.forEach(item => {
            if (item.fieldPath) {
                const keys = item.fieldPath.split('.');
                let current = updateData;

                for (let i = 0; i < keys.length - 1; i++) {
                    const key = keys[i].replace(/\[\d+\]$/, ''); // Remove array index
                    if (!current[key]) {
                        current[key] = keys[i].match(/\[\d+\]$/) ? [] : {};
                    }
                    current = current[key];
                }

                const finalKey = keys[keys.length - 1].replace(/\[\d+\]$/, '');
                if (keys[keys.length - 1].match(/\[\d+\]$/)) {
                    if (!Array.isArray(current[finalKey])) {
                        current[finalKey] = [];
                    }
                    current[finalKey].push(item.value);
                } else {
                    current[finalKey] = item.value;
                }
            }
        });

        const partnerRef = db.collection('partners').doc(partnerId);
        const partnerDoc = await partnerRef.get();

        if (!partnerDoc.exists) {
            return { success: false, message: 'Partner not found' };
        }

        const existingPersona = partnerDoc.data()?.businessPersona || {};
        const mergedPersona = deepMerge(existingPersona, updateData);

        await partnerRef.update({
            'businessPersona': mergedPersona,
            'businessPersona.updatedAt': new Date(),
        });

        await partnerRef.collection('autofillApplications').add({
            itemCount: selectedItems.length,
            categories: [...new Set(selectedItems.map(i => i.category))],
            timestamp: new Date(),
        });

        return { success: true };

    } catch (error: any) {
        console.error('Apply auto-fill error:', error);
        return {
            success: false,
            message: error.message || 'Failed to apply auto-fill data',
        };
    }
}

function deepMerge(target: any, source: any): any {
    const output = { ...target };

    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (isObject(source[key]) && isObject(target[key])) {
                output[key] = deepMerge(target[key], source[key]);
            } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
                output[key] = [...target[key], ...source[key].filter(
                    (item: any) => !target[key].some((existing: any) =>
                        JSON.stringify(existing) === JSON.stringify(item)
                    )
                )];
            } else {
                output[key] = source[key];
            }
        }
    }

    return output;
}

function isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
}
