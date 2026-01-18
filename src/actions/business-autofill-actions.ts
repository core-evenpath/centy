'use server';

import {
  searchPlacesAutocomplete,
  getPlaceDetails,
  autoFillBusinessProfile,
  createEmptyProfile,
  mapRoomsToRoomTypes,
  mapMenuToMenuItems,
  mapProductsToRetailProducts,
  mapPropertiesToPropertyListings,
  mapServicesToHealthcareServices,
  PlacesAutocompleteResult,
  PlacesDetailedInfo,
  AutoFilledProfile,
} from '@/lib/business-autofill-service';
import type { BusinessPersona, IndustryCategory } from '@/lib/business-persona-types';

/**
 * Search for businesses using Google Places Autocomplete
 */
export async function searchBusinessesAction(
  query: string
): Promise<{ success: boolean; results?: PlacesAutocompleteResult[]; error?: string; status?: string }> {
  try {
    if (!query || query.length < 2) {
      return { success: true, results: [] };
    }

    console.log('[AutoFill Action] Searching for:', query);
    const response = await searchPlacesAutocomplete(query);

    if (response.error) {
      console.error('[AutoFill Action] Search error:', response.error, response.status);
      return {
        success: false,
        results: [],
        error: response.error,
        status: response.status
      };
    }

    return {
      success: true,
      results: response.results,
      status: response.status
    };
  } catch (error: any) {
    console.error('[AutoFill Action] Search error:', error);
    return { success: false, error: error.message || 'Search failed' };
  }
}

/**
 * Get detailed place information
 */
export async function getPlaceDetailsAction(
  placeId: string
): Promise<{ success: boolean; place?: PlacesDetailedInfo; error?: string }> {
  try {
    console.log('[AutoFill Action] Getting details for:', placeId);
    const place = await getPlaceDetails(placeId);

    if (!place) {
      return { success: false, error: 'Could not fetch place details' };
    }

    return { success: true, place };
  } catch (error: any) {
    console.error('[AutoFill Action] Details error:', error);
    return { success: false, error: error.message || 'Failed to get details' };
  }
}

/**
 * Auto-fill complete business profile from a Google Place
 * This fetches Google Places data + does AI research
 * @param placeId - Google Place ID
 * @param countryCode - Optional country code (US, IN, AE, GB) - defaults to US
 */
export async function autoFillProfileAction(
  placeId: string,
  countryCode?: string
): Promise<{ success: boolean; profile?: AutoFilledProfile; error?: string }> {
  try {
    // Check API keys
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!geminiKey) {
      return {
        success: false,
        error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables.'
      };
    }

    console.log('[AutoFill Action] Starting auto-fill for:', placeId, 'country:', countryCode || 'auto-detect');
    const profile = await autoFillBusinessProfile(placeId, countryCode);

    if (!profile) {
      return { success: false, error: 'Could not auto-fill profile. Please try again.' };
    }

    console.log('[AutoFill Action] Auto-fill complete');
    return { success: true, profile };
  } catch (error: any) {
    console.error('[AutoFill Action] Auto-fill error:', error);
    return { success: false, error: error.message || 'Auto-fill failed' };
  }
}

/**
 * Get empty profile template for clearing data
 */
export async function getEmptyProfileAction(): Promise<{
  success: boolean;
  profile?: Partial<BusinessPersona>;
}> {
  return {
    success: true,
    profile: createEmptyProfile(),
  };
}

/**
 * Map auto-fill inventory data to proper BusinessPersona fields
 * This converts simplified inventory items to the full schema types
 */
export async function mapInventoryToPersonaAction(
  autoFillData: AutoFilledProfile,
  existingPersona: Partial<BusinessPersona>
): Promise<{
  success: boolean;
  persona?: Partial<BusinessPersona>;
  error?: string;
}> {
  try {
    const inventory = autoFillData.inventory;
    const autoIdentity = autoFillData.identity as any;
    const autoPersonality = autoFillData.personality as any;

    // Map auto-fill identity fields to BusinessPersona identity fields
    const mappedIdentity = {
      ...existingPersona.identity,
      // Core identity fields - map businessName to name
      name: autoIdentity?.businessName || autoIdentity?.name || existingPersona.identity?.name,
      phone: autoIdentity?.phone || existingPersona.identity?.phone,
      email: autoIdentity?.email || existingPersona.identity?.email,
      website: autoIdentity?.website || existingPersona.identity?.website,
      whatsAppNumber: autoIdentity?.whatsAppNumber || existingPersona.identity?.whatsAppNumber,
      // Industry
      industry: autoIdentity?.industry ? {
        category: typeof autoIdentity.industry === 'string' ? autoIdentity.industry : autoIdentity.industry.category,
        name: typeof autoIdentity.industry === 'string' ? autoIdentity.industry : autoIdentity.industry.name,
      } : existingPersona.identity?.industry,
      // Address
      address: {
        ...existingPersona.identity?.address,
        ...autoIdentity?.address,
      },
      // Social media
      socialMedia: {
        ...existingPersona.identity?.socialMedia,
        ...autoIdentity?.socialMedia,
      },
      // Operating hours
      operatingHours: autoIdentity?.operatingHours || existingPersona.identity?.operatingHours,
    };

    // Map auto-fill personality fields to BusinessPersona personality fields
    const mappedPersonality = {
      ...existingPersona.personality,
      // Description (could come from identity or personality in auto-fill)
      description: autoPersonality?.description || autoIdentity?.description || existingPersona.personality?.description,
      // Tagline (could come from identity or personality in auto-fill)
      tagline: autoIdentity?.tagline || autoPersonality?.tagline || existingPersona.personality?.tagline,
      // Founded year - map yearEstablished to foundedYear
      foundedYear: autoIdentity?.yearEstablished || autoPersonality?.foundedYear || existingPersona.personality?.foundedYear,
      // USPs
      uniqueSellingPoints: autoPersonality?.uniqueSellingPoints || existingPersona.personality?.uniqueSellingPoints,
      // Voice tone
      voiceTone: autoPersonality?.voiceTone || existingPersona.personality?.voiceTone,
    };

    // Start with merged basic data
    const mergedPersona: Partial<BusinessPersona> = {
      ...existingPersona,
      identity: mappedIdentity as any,
      personality: mappedPersonality as any,
      customerProfile: {
        ...existingPersona.customerProfile,
        ...(autoFillData.customerProfile as any),
      } as any,
      knowledge: {
        ...existingPersona.knowledge,
        ...(autoFillData.knowledge as any),
        // Awards and certifications often come in industrySpecificData from auto-fill
        awards: (autoFillData.knowledge as any)?.awards ||
          (autoFillData.industrySpecificData as any)?.awards ||
          existingPersona.knowledge?.awards,
        certifications: (autoFillData.knowledge as any)?.certifications ||
          (autoFillData.industrySpecificData as any)?.certifications ||
          existingPersona.knowledge?.certifications,
      } as any,
      industrySpecificData: {
        ...existingPersona.industrySpecificData,
        ...autoFillData.industrySpecificData,
        // Store raw fetched data for reference
        fetchedPhotos: autoFillData.photos,
        fetchedReviews: autoFillData.reviews,
        onlinePresence: autoFillData.onlinePresence,
        testimonials: autoFillData.testimonials,
        fromTheWeb: autoFillData.fromTheWeb,
      },
    };

    // Map inventory to proper schema fields based on industry
    if (inventory) {
      // Hospitality - Room Types
      if (inventory.rooms && inventory.rooms.length > 0) {
        const roomTypes = mapRoomsToRoomTypes(inventory.rooms);
        mergedPersona.roomTypes = [
          ...(existingPersona.roomTypes || []),
          ...roomTypes,
        ];
        console.log('[MapInventory] Mapped', roomTypes.length, 'room types');
      }

      // Food & Beverage - Menu Items
      if (inventory.menuItems && inventory.menuItems.length > 0) {
        const { items, categories } = mapMenuToMenuItems(inventory.menuItems);
        mergedPersona.menuItems = [
          ...(existingPersona.menuItems || []),
          ...items,
        ];
        mergedPersona.menuCategories = [
          ...(existingPersona.menuCategories || []),
          ...categories,
        ];
        console.log('[MapInventory] Mapped', items.length, 'menu items in', categories.length, 'categories');
      }

      // Retail - Product Catalog
      if (inventory.products && inventory.products.length > 0) {
        const products = mapProductsToRetailProducts(inventory.products);
        mergedPersona.productCatalog = [
          ...(existingPersona.productCatalog || []),
          ...products,
        ];
        console.log('[MapInventory] Mapped', products.length, 'products');
      }

      // Real Estate - Property Listings
      if (inventory.properties && inventory.properties.length > 0) {
        const properties = mapPropertiesToPropertyListings(inventory.properties);
        mergedPersona.propertyListings = [
          ...(existingPersona.propertyListings || []),
          ...properties,
        ];
        console.log('[MapInventory] Mapped', properties.length, 'property listings');
      }

      // Healthcare - Services
      if (inventory.services && inventory.services.length > 0) {
        const services = mapServicesToHealthcareServices(inventory.services);
        mergedPersona.healthcareServices = [
          ...(existingPersona.healthcareServices || []),
          ...services,
        ];
        console.log('[MapInventory] Mapped', services.length, 'healthcare services');
      }
    }

    return { success: true, persona: mergedPersona };
  } catch (error: any) {
    console.error('[MapInventory] Error:', error);
    return { success: false, error: error.message || 'Failed to map inventory' };
  }
}

/**
 * Process fetched data for RAG system
 * This action prepares the auto-fill data for the RAG knowledge base
 */
export async function processForRAGAction(
  partnerId: string,
  autoFillData: AutoFilledProfile
): Promise<{
  success: boolean;
  message?: string;
  ragDocumentId?: string;
  error?: string;
}> {
  try {
    console.log('[RAG Processing] Starting for partner:', partnerId);

    // Prepare RAG document from auto-fill data
    const identity = autoFillData.identity as any;
    const ragDocument = {
      partnerId,
      source: 'auto_fill',
      fetchedAt: autoFillData.source.fetchedAt,
      placeId: autoFillData.source.placeId,

      // Business Identity
      businessName: identity?.businessName,
      industry: identity?.industry,
      description: identity?.description,
      tagline: identity?.tagline,
      address: identity?.address,
      phone: identity?.phone,
      website: identity?.website,
      location: identity?.location,

      // Knowledge Base Content
      productsOrServices: autoFillData.knowledge?.productsOrServices,
      faqs: autoFillData.knowledge?.faqs,
      policies: autoFillData.knowledge?.policies,

      // Reviews & Testimonials (for sentiment training)
      reviews: autoFillData.reviews?.map(r => ({
        text: r.text,
        rating: r.rating,
        source: r.source,
        author: r.author,
      })),
      testimonials: autoFillData.testimonials,

      // Online Presence (for external references)
      onlinePresence: autoFillData.onlinePresence,
      pressMedia: autoFillData.pressMedia,

      // Inventory Data (for product/service knowledge)
      inventory: autoFillData.inventory,

      // Raw Web Data (additional context)
      fromTheWeb: autoFillData.fromTheWeb,

      // Industry Specific Data
      industrySpecificData: autoFillData.industrySpecificData,

      // Metadata
      processedAt: new Date(),
      status: 'pending_embedding',
    };

    // Log the RAG document for now (in production, this would be sent to a vector database)
    console.log('[RAG Processing] Document prepared:', {
      partnerId,
      businessName: ragDocument.businessName,
      sections: {
        hasReviews: (ragDocument.reviews?.length || 0) > 0,
        hasTestimonials: (ragDocument.testimonials?.length || 0) > 0,
        hasFAQs: (ragDocument.faqs?.length || 0) > 0,
        hasInventory: !!ragDocument.inventory,
        hasFromTheWeb: !!ragDocument.fromTheWeb,
      },
    });

    // TODO: In production, send to vector database / RAG pipeline
    // await vectorDB.upsert(ragDocument);
    // await embeddingService.process(ragDocument);

    // For now, store in industrySpecificData with RAG marker
    const ragDocumentId = `rag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('[RAG Processing] Complete. Document ID:', ragDocumentId);

    return {
      success: true,
      message: `Data prepared for RAG processing. ${ragDocument.reviews?.length || 0} reviews, ${ragDocument.faqs?.length || 0} FAQs, and inventory data queued for embedding.`,
      ragDocumentId,
    };
  } catch (error: any) {
    console.error('[RAG Processing] Error:', error);
    return { success: false, error: error.message || 'Failed to process for RAG' };
  }
}

/**
 * Parse Google's weekdayText format to structured OperatingHours
 * Input: ["Monday: 9:00 AM – 10:00 PM", "Tuesday: Closed", ...]
 * Output: OperatingHours with WeeklySchedule
 */
function parseOperatingHoursFromGoogle(weekdayText: string[]): any {
  if (!weekdayText || weekdayText.length === 0) {
    return undefined;
  }

  const dayMapping: Record<string, string> = {
    'Monday': 'monday',
    'Tuesday': 'tuesday',
    'Wednesday': 'wednesday',
    'Thursday': 'thursday',
    'Friday': 'friday',
    'Saturday': 'saturday',
    'Sunday': 'sunday'
  };

  const schedule: Record<string, any> = {};
  let isOpen24x7 = true;
  let hasAnyHours = false;

  weekdayText.forEach(dayText => {
    // Parse: "Monday: 9:00 AM – 10:00 PM" or "Monday: Closed" or "Monday: Open 24 hours"
    const match = dayText.match(/^(\w+):\s*(.+)$/);
    if (!match) return;

    const [, dayName, hoursStr] = match;
    const dayKey = dayMapping[dayName];
    if (!dayKey) return;

    if (hoursStr.toLowerCase() === 'closed') {
      schedule[dayKey] = { isOpen: false };
      isOpen24x7 = false;
      hasAnyHours = true;
    } else if (hoursStr.toLowerCase().includes('open 24 hours')) {
      schedule[dayKey] = { isOpen: true, openTime: '00:00', closeTime: '23:59' };
      hasAnyHours = true;
    } else {
      // Parse time range: "9:00 AM – 10:00 PM"
      const timeMatch = hoursStr.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*[–-]\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
      if (timeMatch) {
        isOpen24x7 = false;
        hasAnyHours = true;
        schedule[dayKey] = {
          isOpen: true,
          openTime: convertTo24Hour(timeMatch[1]),
          closeTime: convertTo24Hour(timeMatch[2])
        };
      }
    }
  });

  if (!hasAnyHours) {
    return undefined;
  }

  // Fill in missing days with closed
  Object.values(dayMapping).forEach(day => {
    if (!schedule[day]) {
      schedule[day] = { isOpen: false };
    }
  });

  return {
    isOpen24x7,
    schedule,
    specialNote: isOpen24x7 ? 'Open 24/7' : undefined
  };
}

/**
 * Convert 12-hour time format to 24-hour format
 * "9:00 AM" -> "09:00", "10:30 PM" -> "22:30"
 */
function convertTo24Hour(time12h: string): string {
  const match = time12h.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return time12h;

  let [, hours, minutes, period] = match;
  let hour = parseInt(hours, 10);

  if (period.toUpperCase() === 'PM' && hour !== 12) {
    hour += 12;
  } else if (period.toUpperCase() === 'AM' && hour === 12) {
    hour = 0;
  }

  return `${hour.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Parse address from imported data to BusinessAddress format
 */
function parseAddress(address: any): any {
  if (!address) return undefined;

  // If it's already properly structured
  if (typeof address === 'object') {
    return {
      street: address.street || address.line1 || address.formattedAddress,
      area: address.area || address.locality || address.neighborhood,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode || address.pincode || address.zip,
      country: address.country,
      googleMapsUrl: address.googleMapsUrl,
    };
  }

  // If it's a string, use as street
  if (typeof address === 'string') {
    return { street: address };
  }

  return undefined;
}

/**
 * Apply imported data to BusinessPersona profile with intelligent transformations
 * This is the main action for "Apply to Profile" in import-center
 */
export async function applyImportToProfileAction(
  importedData: any,
  existingPersona?: Partial<BusinessPersona>
): Promise<{
  success: boolean;
  profile?: Partial<BusinessPersona>;
  fieldsUpdated?: string[];
  error?: string;
}> {
  try {
    console.log('[ApplyImport] Starting intelligent mapping...');

    const fieldsUpdated: string[] = [];
    const profile: Partial<BusinessPersona> = {};

    // Get nested data structures
    const identity = importedData?.identity || {};
    const personality = importedData?.personality || {};
    const knowledge = importedData?.knowledge || {};
    const customerProfile = importedData?.customerProfile || {};
    const industrySpecificData = importedData?.industrySpecificData || {};

    // ========================================
    // 1. IDENTITY SECTION
    // ========================================
    profile.identity = {
      ...(existingPersona?.identity || {}),
    } as any;

    // Business Name
    const name = identity.businessName || identity.name || importedData.businessName;
    if (name) {
      (profile.identity as any).name = name;
      fieldsUpdated.push('identity.name');
    }

    // Phone
    const phone = identity.phone || importedData.phone;
    if (phone) {
      (profile.identity as any).phone = phone;
      fieldsUpdated.push('identity.phone');
    }

    // Email
    const email = identity.email || importedData.email;
    if (email) {
      (profile.identity as any).email = email;
      fieldsUpdated.push('identity.email');
    }

    // Website
    const website = identity.website || importedData.website;
    if (website) {
      (profile.identity as any).website = website;
      fieldsUpdated.push('identity.website');
    }

    // Address - with transformation
    const rawAddress = identity.address || importedData.address;
    if (rawAddress) {
      (profile.identity as any).address = parseAddress(rawAddress);
      fieldsUpdated.push('identity.address');
    }

    // Operating Hours - THE KEY TRANSFORMATION
    const rawHours = identity.operatingHours || importedData.operatingHours;
    if (rawHours) {
      // Check if it's Google's weekdayText format
      if (rawHours.weekdayText && Array.isArray(rawHours.weekdayText)) {
        const parsedHours = parseOperatingHoursFromGoogle(rawHours.weekdayText);
        if (parsedHours) {
          (profile.identity as any).operatingHours = parsedHours;
          fieldsUpdated.push('identity.operatingHours');
        }
      } else if (rawHours.schedule || rawHours.isOpen24x7 !== undefined) {
        // Already in correct format
        (profile.identity as any).operatingHours = rawHours;
        fieldsUpdated.push('identity.operatingHours');
      }
    }

    // Social Media
    const socialMedia = identity.socialMedia || importedData.socialMedia;
    if (socialMedia && Object.keys(socialMedia).some(k => socialMedia[k])) {
      (profile.identity as any).socialMedia = {
        ...(existingPersona?.identity?.socialMedia || {}),
        ...socialMedia,
      };
      fieldsUpdated.push('identity.socialMedia');
    }

    // Languages
    const languages = identity.languages || importedData.languages;
    if (languages && Array.isArray(languages) && languages.length > 0) {
      (profile.identity as any).languages = languages;
      fieldsUpdated.push('identity.languages');
    }

    // ========================================
    // 2. PERSONALITY SECTION
    // ========================================
    profile.personality = {
      ...(existingPersona?.personality || {}),
    } as any;

    // Description
    const description = personality.description || identity.description || importedData.description;
    if (description) {
      (profile.personality as any).description = description;
      fieldsUpdated.push('personality.description');
    }

    // Tagline
    const tagline = personality.tagline || identity.tagline || importedData.tagline;
    if (tagline) {
      (profile.personality as any).tagline = tagline;
      fieldsUpdated.push('personality.tagline');
    }

    // Unique Selling Points
    const usps = personality.uniqueSellingPoints || importedData.uniqueSellingPoints;
    if (usps && Array.isArray(usps) && usps.length > 0) {
      (profile.personality as any).uniqueSellingPoints = usps;
      fieldsUpdated.push('personality.uniqueSellingPoints');
    }

    // Founded Year
    const yearEstablished = identity.yearEstablished || importedData.yearEstablished;
    if (yearEstablished) {
      (profile.personality as any).foundedYear = typeof yearEstablished === 'string'
        ? parseInt(yearEstablished, 10)
        : yearEstablished;
      fieldsUpdated.push('personality.foundedYear');
    }

    // Language Preference
    if (languages && languages.length > 0) {
      (profile.personality as any).languagePreference = languages;
      fieldsUpdated.push('personality.languagePreference');
    }

    // ========================================
    // 3. CUSTOMER PROFILE SECTION
    // ========================================
    profile.customerProfile = {
      ...(existingPersona?.customerProfile || {}),
    } as any;

    // Target Audience
    const targetAudience = customerProfile.targetAudience || importedData.targetAudience;
    if (targetAudience) {
      (profile.customerProfile as any).targetAudience = Array.isArray(targetAudience)
        ? targetAudience.join(', ')
        : targetAudience;
      fieldsUpdated.push('customerProfile.targetAudience');
    }

    // Pain Points
    const painPoints = customerProfile.painPoints || importedData.customerInsights?.painPoints;
    if (painPoints && Array.isArray(painPoints) && painPoints.length > 0) {
      (profile.customerProfile as any).customerPainPoints = painPoints.map(p =>
        typeof p === 'string' ? p : p.problem
      );
      fieldsUpdated.push('customerProfile.customerPainPoints');
    }

    // ========================================
    // 4. KNOWLEDGE SECTION
    // ========================================
    profile.knowledge = {
      ...(existingPersona?.knowledge || {}),
    } as any;

    // FAQs
    const faqs = knowledge.faqs || importedData.faqs;
    if (faqs && Array.isArray(faqs) && faqs.length > 0) {
      (profile.knowledge as any).faqs = faqs.map((faq: any, idx: number) => ({
        id: faq.id || `faq_${idx}`,
        question: faq.question,
        answer: faq.answer,
        category: faq.category || 'General',
      }));
      fieldsUpdated.push('knowledge.faqs');
    }

    // Products/Services
    const services = importedData.services || knowledge.services || [];
    const products = importedData.products || knowledge.products || [];
    if (services.length > 0 || products.length > 0) {
      (profile.knowledge as any).productsOrServices = [
        ...services.map((s: string, idx: number) => ({
          id: `svc_${idx}`,
          name: s,
          description: '',
          isService: true,
        })),
        ...products.map((p: string, idx: number) => ({
          id: `prd_${idx}`,
          name: p,
          description: '',
          isService: false,
        })),
      ];
      fieldsUpdated.push('knowledge.productsOrServices');
    }

    // Payment Methods
    const paymentMethods = knowledge.paymentMethods || importedData.paymentMethods;
    if (paymentMethods && Array.isArray(paymentMethods) && paymentMethods.length > 0) {
      (profile.knowledge as any).acceptedPayments = paymentMethods;
      fieldsUpdated.push('knowledge.acceptedPayments');
    }

    // Awards
    const awards = knowledge.awards || industrySpecificData.awards || importedData.awards;
    if (awards && Array.isArray(awards) && awards.length > 0) {
      (profile.knowledge as any).awards = awards;
      fieldsUpdated.push('knowledge.awards');
    }

    // Certifications
    const certifications = knowledge.certifications || industrySpecificData.certifications || importedData.certifications;
    if (certifications && Array.isArray(certifications) && certifications.length > 0) {
      (profile.knowledge as any).certifications = certifications;
      fieldsUpdated.push('knowledge.certifications');
    }

    // ========================================
    // 5. INDUSTRY SPECIFIC DATA
    // ========================================
    if (Object.keys(industrySpecificData).length > 0) {
      profile.industrySpecificData = {
        ...(existingPersona?.industrySpecificData || {}),
        ...industrySpecificData,
        // Add ratings if available
        googleRating: industrySpecificData.googleRating,
        googleReviewCount: industrySpecificData.googleReviewCount,
      };
      fieldsUpdated.push('industrySpecificData');
    }

    console.log('[ApplyImport] Complete. Fields updated:', fieldsUpdated.length);

    return {
      success: true,
      profile,
      fieldsUpdated,
    };
  } catch (error: any) {
    console.error('[ApplyImport] Error:', error);
    return { success: false, error: error.message || 'Failed to apply import' };
  }
}
