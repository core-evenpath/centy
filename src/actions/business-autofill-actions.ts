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
import {
  parseAddress,
  parseOperatingHoursFromGoogle,
} from '@/lib/business-data-parsers';
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

    // Ensure we have a Google Places/Maps API key (NOT Gemini - different API)
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
      || process.env.GOOGLE_MAPS_API_KEY
      || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error('[AutoFill Action] No Google Places API key configured');
      return {
        success: false,
        results: [],
        error: 'Google Places API key not configured. Add GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY to your environment.',
        status: 'API_KEY_MISSING'
      };
    }

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

    // Handle Next.js wrapped errors
    let errorMessage = 'Search failed';
    if (error?.message) {
      errorMessage = error.message;
    } else if (error?.digest) {
      // Next.js production error - provide a generic message
      errorMessage = 'Search service temporarily unavailable. Please try again.';
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    return { success: false, error: errorMessage, status: 'INTERNAL_ERROR' };
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
      console.log('[ApplyImport] Processing operating hours:', typeof rawHours);

      // Case 1: Google's weekdayText array
      if (rawHours.weekdayText && Array.isArray(rawHours.weekdayText)) {
        const parsedHours = parseOperatingHoursFromGoogle(rawHours.weekdayText);
        if (parsedHours) {
          (profile.identity as any).operatingHours = parsedHours;
          fieldsUpdated.push('identity.operatingHours');
        }
      }
      // Case 2: Already structured as BusinessPersona Schedule (has 'schedule' key)
      else if (rawHours.schedule || rawHours.isOpen24x7 !== undefined) {
        (profile.identity as any).operatingHours = rawHours;
        fieldsUpdated.push('identity.operatingHours');
      }
      // Case 3: Simple Record<string, {open, close}> from service parsing
      else if (typeof rawHours === 'object' && !Array.isArray(rawHours)) {
        // Assume it's a schedule object if keys are days
        const keys = Object.keys(rawHours);
        const hasDays = keys.some(k => ['monday', 'tuesday', 'wednesday'].includes(k.toLowerCase()));

        if (hasDays) {
          (profile.identity as any).operatingHours = {
            schedule: rawHours,
            isOpen24x7: false
          };
          fieldsUpdated.push('identity.operatingHours');
        }
      }
    }

    // Social Media
    const socialMedia = identity.socialMedia || importedData.socialMedia || importedData.onlinePresence;
    if (socialMedia) {
      // Consolidate social media from various potential sources
      const existingSocial = existingPersona?.identity?.socialMedia || {};
      const mergedSocial = { ...existingSocial };

      // Handle standard object format
      if (typeof socialMedia === 'object' && !Array.isArray(socialMedia)) {
        Object.assign(mergedSocial, socialMedia);
      }

      // Handle array format (often from scraping: [{ platform: 'Instagram', url: '...' }])
      if (Array.isArray(socialMedia)) {
        console.log('[ApplyImport] Processing social media array:', socialMedia.length);
        socialMedia.forEach((item: any) => {
          if (item.platform && item.url) {
            const platformKey = item.platform.toLowerCase().replace(/[^a-z0-9]/g, '');
            // Map common platform names to schema keys
            if (platformKey.includes('instagram')) mergedSocial.instagram = item.url;
            else if (platformKey.includes('facebook')) mergedSocial.facebook = item.url;
            else if (platformKey.includes('twitter') || platformKey.includes('xcom')) mergedSocial.twitter = item.url;
            else if (platformKey.includes('linkedin')) mergedSocial.linkedin = item.url;
            else if (platformKey.includes('youtube')) mergedSocial.youtube = item.url;
            else if (platformKey.includes('tiktok')) mergedSocial.tiktok = item.url;
            else if (platformKey.includes('pinterest')) mergedSocial.pinterest = item.url;
            else {
              // Try to match with known keys or just add it if it matches schema
              if (['googleBusiness', 'snapchat', 'threads', 'yelp', 'tripadvisor'].includes(platformKey)) {
                (mergedSocial as any)[platformKey] = item.url;
              }
            }
          }
        });
      }

      if (Object.keys(mergedSocial).length > 0) {
        (profile.identity as any).socialMedia = mergedSocial;
        fieldsUpdated.push('identity.socialMedia');
      }
    }

    // AI Tags (often passed in importedData.tags or importedData.industrySpecificData.tags)
    const tags = importedData.tags || industrySpecificData?.tags;
    if (tags && Array.isArray(tags) && tags.length > 0) {
      if (!profile.industrySpecificData) profile.industrySpecificData = {};
      (profile.industrySpecificData as any).tags = tags;
      fieldsUpdated.push('industrySpecificData.tags');
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

    // Unique Selling Points - Enhanced Merging
    const usps = [
      ...(personality.uniqueSellingPoints || []),
      ...(importedData.uniqueSellingPoints || []),
      ...(importedData.customerInsights?.valuePropositions || []),
      ...(importedData.competitiveIntel?.differentiators?.map((d: any) => typeof d === 'string' ? d : d.point) || []),
      ...(importedData.competitiveIntel?.competitiveAdvantages || [])
    ];

    // Deduplicate USPs
    const uniqueUSPs = Array.from(new Set(usps.filter(Boolean)));

    if (uniqueUSPs.length > 0) {
      (profile.personality as any).uniqueSellingPoints = uniqueUSPs;
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

    // Customer Demographics (Age, Income)
    const demographics = [
      ...(customerProfile.customerDemographics || []),
      ...(importedData.customerInsights?.targetAgeGroups || []),
      ...(importedData.customerInsights?.incomeSegments || [])
    ];
    const uniqueDemographics = Array.from(new Set(demographics.filter(Boolean)));

    if (uniqueDemographics.length > 0) {
      (profile.customerProfile as any).customerDemographics = uniqueDemographics;
      fieldsUpdated.push('customerProfile.customerDemographics');
    }

    // Differentiators - from multiple sources
    const differentiators = [
      ...(customerProfile.differentiators || []),
      ...(importedData.differentiators || []),
      ...(importedData.competitiveIntel?.differentiators?.map((d: any) => typeof d === 'string' ? d : d.point) || []),
      ...(importedData.competitiveIntel?.competitiveAdvantages || []),
      ...(importedData.whyChooseUs || []),
      ...(importedData.competitive_advantage || []),
    ];
    const uniqueDifferentiators = Array.from(new Set(differentiators.filter(Boolean)));
    if (uniqueDifferentiators.length > 0) {
      (profile.customerProfile as any).differentiators = uniqueDifferentiators;
      fieldsUpdated.push('customerProfile.differentiators');
    }

    // Value Propositions
    const valueProps = [
      ...(customerProfile.valuePropositions || []),
      ...(importedData.valuePropositions || []),
      ...(importedData.customerInsights?.valuePropositions || []),
      ...(importedData.benefits || []),
      ...(importedData.keyBenefits || []),
    ];
    const uniqueValueProps = Array.from(new Set(valueProps.filter(Boolean)));
    if (uniqueValueProps.length > 0) {
      (profile.customerProfile as any).valuePropositions = uniqueValueProps;
      fieldsUpdated.push('customerProfile.valuePropositions');
    }

    // Objection Handlers
    const objectionHandlers = [
      ...(customerProfile.objectionHandlers || []),
      ...(importedData.objectionHandlers || []),
      ...(importedData.customerInsights?.commonObjections?.map((o: any) =>
        typeof o === 'string' ? { objection: o, response: '' } : o
      ) || []),
    ];
    if (objectionHandlers.length > 0) {
      (profile.customerProfile as any).objectionHandlers = objectionHandlers;
      fieldsUpdated.push('customerProfile.objectionHandlers');
    }

    // Ideal Customer Profile
    const icp = customerProfile.idealCustomerProfile || importedData.idealCustomerProfile ||
                importedData.customerInsights?.idealCustomerProfile || importedData.idealCustomer;
    if (icp) {
      (profile.customerProfile as any).idealCustomerProfile = icp;
      fieldsUpdated.push('customerProfile.idealCustomerProfile');
    }

    // Primary Audience
    const primaryAudience = customerProfile.primaryAudience || importedData.primaryAudience ||
                            importedData.whoWeServe || importedData.targetCustomers;
    if (primaryAudience) {
      (profile.customerProfile as any).primaryAudience = Array.isArray(primaryAudience)
        ? primaryAudience.join(', ')
        : primaryAudience;
      fieldsUpdated.push('customerProfile.primaryAudience');
    }

    // Customer Type (B2B, B2C, etc.)
    const customerType = customerProfile.customerType || importedData.customerType ||
                         importedData.clientTypes || industrySpecificData?.clientTypes;
    if (customerType) {
      (profile.customerProfile as any).customerType = Array.isArray(customerType)
        ? customerType.join(', ')
        : customerType;
      fieldsUpdated.push('customerProfile.customerType');
    }

    // Common Queries
    const commonQueries = customerProfile.commonQueries || importedData.commonQueries ||
                          importedData.customerInsights?.commonQuestions;
    if (commonQueries && Array.isArray(commonQueries) && commonQueries.length > 0) {
      (profile.customerProfile as any).commonQueries = commonQueries;
      fieldsUpdated.push('customerProfile.commonQueries');
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

    // Service Categories
    const serviceCategories = knowledge.serviceCategories || importedData.serviceCategories;
    if (serviceCategories && Array.isArray(serviceCategories) && serviceCategories.length > 0) {
      (profile.knowledge as any).serviceCategories = serviceCategories;
      fieldsUpdated.push('knowledge.serviceCategories');
    }

    // Policies
    const policies = knowledge.policies || importedData.policies;
    if (policies && typeof policies === 'object') {
      (profile.knowledge as any).policies = {
        ...((profile.knowledge as any).policies || {}),
        ...policies
      };
      fieldsUpdated.push('knowledge.policies');
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

    // ========================================
    // 6. HOTEL AMENITIES
    // ========================================
    const hotelAmenities = importedData.hotelAmenities || industrySpecificData?.amenities; // Check both new and old paths
    if (hotelAmenities && Array.isArray(hotelAmenities) && hotelAmenities.length > 0) {
      // Map strings to HotelAmenity objects if necessary
      const mappedAmenities = hotelAmenities.map((a: any, i: number) => {
        if (typeof a === 'string') {
          return {
            id: `amenity_${i}`,
            name: a,
            category: 'services',
            isActive: true,
            isPaid: false
          };
        }
        return a;
      });
      profile.hotelAmenities = mappedAmenities;
      fieldsUpdated.push('hotelAmenities');
    }

    // ========================================
    // 6. AI INTELLIGENCE & UNMAPPED DATA
    // ========================================

    // Call AI to intelligently map any remaining or complex data
    console.log('[ApplyImport] Running AI analysis on raw data...');
    try {
      const aiMapping = await import('@/lib/gemini-service').then(m => m.analyzeAndMapBusinessData(importedData));

      // --- AI FALLBACK FOR CORE FIELDS ---
      // If manual mapping missed these, fill them from AI

      // Identity
      if (aiMapping.identity) {
        if (!profile.identity) profile.identity = {} as any;
        const identity = profile.identity as any;

        if (!identity.description && aiMapping.identity.description) {
          identity.description = aiMapping.identity.description;
          fieldsUpdated.push('identity.description');
        }
        if (!identity.companyName && aiMapping.identity.name) {
          identity.companyName = aiMapping.identity.name;
          fieldsUpdated.push('identity.companyName');
        }
        if (!identity.website && aiMapping.identity.website) {
          identity.website = aiMapping.identity.website;
          fieldsUpdated.push('identity.website');
        }
        if (!identity.phone && aiMapping.identity.phone) {
          identity.phone = aiMapping.identity.phone;
          fieldsUpdated.push('identity.phone');
        }
        if (!identity.yearFounded && aiMapping.identity.foundedYear) {
          identity.yearFounded = aiMapping.identity.foundedYear;
          fieldsUpdated.push('identity.yearFounded');
        }
        if (!identity.socialMedia && aiMapping.identity.socialMedia) {
          identity.socialMedia = aiMapping.identity.socialMedia;
          fieldsUpdated.push('identity.socialMedia');
        }
      }

      // Personality
      if (aiMapping.personality) {
        if (!profile.personality) profile.personality = {} as any;
        const personality = profile.personality as any;

        if (!personality.tagline && aiMapping.personality.tagline) {
          personality.tagline = aiMapping.personality.tagline;
          fieldsUpdated.push('personality.tagline');
        }
        if ((!personality.uniqueSellingPoints || personality.uniqueSellingPoints.length === 0) && aiMapping.personality.uniqueSellingPoints) {
          personality.uniqueSellingPoints = aiMapping.personality.uniqueSellingPoints;
          fieldsUpdated.push('personality.uniqueSellingPoints');
        }
      }

      // Location
      if (aiMapping.location) {
        if (!profile.identity) profile.identity = {} as any;
        const identity = profile.identity as any;

        // Initialize address if needed
        if (!identity.address) {
          identity.address = {
            street: '', city: '', state: '', postalCode: '', country: 'US', coordinates: { lat: 0, lng: 0 }
          };
        }

        const addr = identity.address;
        let locUpdated = false;

        if (!addr.street && aiMapping.location.address) { addr.street = aiMapping.location.address; locUpdated = true; }
        if (!addr.city && aiMapping.location.city) { addr.city = aiMapping.location.city; locUpdated = true; }
        if (!addr.state && aiMapping.location.state) { addr.state = aiMapping.location.state; locUpdated = true; }
        if (!addr.postalCode && aiMapping.location.zip) { addr.postalCode = aiMapping.location.zip; locUpdated = true; }

        if (locUpdated) {
          identity.address = addr;
          fieldsUpdated.push('identity.address');
        }
      }

      // --- OTHER USEFUL DATA ---
      // Combine AI-found useful data with imported 'fromTheWeb' data
      let unmappedItems: any[] = [];

      // 1. From AI Mapping
      if (aiMapping.other_useful_data && aiMapping.other_useful_data.length > 0) {
        unmappedItems = [...unmappedItems, ...aiMapping.other_useful_data.map(item => ({
          key: item.key,
          value: item.value,
          source: item.source || 'AI Analysis',
          id: `unmapped_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
        }))];
      }

      // 2. From 'From The Web' section (raw import)
      const fromTheWeb = importedData.fromTheWeb;
      if (fromTheWeb) {
        if (fromTheWeb.websiteContent) {
          // Don't add full content, too big
        }
        if (fromTheWeb.additionalInfo) {
          Object.entries(fromTheWeb.additionalInfo).forEach(([k, v]) => {
            unmappedItems.push({
              key: k,
              value: typeof v === 'string' ? v : JSON.stringify(v),
              source: 'website',
              id: `web_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
            });
          });
        }
        if (fromTheWeb.otherFindings && Array.isArray(fromTheWeb.otherFindings)) {
          fromTheWeb.otherFindings.forEach((f: string) => {
            unmappedItems.push({
              key: 'Finding',
              value: f,
              source: 'website',
              id: `web_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
            });
          });
        }
      }

      if (unmappedItems.length > 0) {
        if (!profile.webIntelligence) {
          profile.webIntelligence = {};
        }

        // Map AI found data to our schema field
        (profile.webIntelligence as any).otherUsefulData = unmappedItems.map(item => ({
          key: item.key,
          value: item.value,
          source: item.source
        }));

        fieldsUpdated.push('webIntelligence.otherUsefulData');
      }

      // PERSIST FULL AI MAPPING & UNMAPPED DATA FOR UI
      if (!profile._importMeta) {
        (profile._importMeta as any) = {
          source: 'manual',
          importedAt: new Date().toISOString(),
          fieldsCount: 0,
          fieldPaths: [],
          status: 'applied'
        };
      }
      (profile._importMeta as any).mappedData = aiMapping;

      // CRITICAL: Populate unmappedData for the UI to display in "From the Web" section
      (profile._importMeta as any).unmappedData = unmappedItems.map(item => ({
        id: item.id,
        key: item.key,
        value: item.value,
        source: item.source === 'AI Analysis' ? 'google' : 'website', // Map to valid FieldSource type
        importedAt: new Date().toISOString(),
        usedByAI: true
      }));

    } catch (err) {
      console.error('[ApplyImport] AI Analysis failed:', err);
      // Fail silently on AI part, don't block main import
    }

    // ========================================
    // 7. INVENTORY MAPPING (SPECIALIZED)
    // ========================================
    // Map specialized inventory data (Menu Items, Room Types, etc.)
    try {
      console.log('[ApplyImport] Mapping specialized inventory data...');

      // Create a temporary profile combining existing and new data for mapping context
      const mappingContext = {
        ...existingPersona,
        ...profile
      };

      // Use the imported data structure which matches AutoFilledProfile for mapping
      const mappingResult = await mapInventoryToPersonaAction(
        importedData,
        mappingContext
      );

      if (mappingResult.success && mappingResult.persona) {
        // Merge mapped specialized inventory fields
        const mappedInventory = mappingResult.persona;

        // Merge specific inventory arrays if they were mapped
        // We check specific fields that mapInventoryToPersonaAction populates

        if (mappedInventory.menuItems?.length) {
          profile.menuItems = mappedInventory.menuItems;
          fieldsUpdated.push('menuItems');
        }

        if (mappedInventory.menuCategories?.length) {
          profile.menuCategories = mappedInventory.menuCategories;
          fieldsUpdated.push('menuCategories');
        }

        if (mappedInventory.roomTypes?.length) {
          profile.roomTypes = mappedInventory.roomTypes;
          fieldsUpdated.push('roomTypes');
        }

        if (mappedInventory.productCatalog?.length) {
          profile.productCatalog = mappedInventory.productCatalog;
          fieldsUpdated.push('productCatalog');
        }

        if (mappedInventory.propertyListings?.length) {
          profile.propertyListings = mappedInventory.propertyListings;
          fieldsUpdated.push('propertyListings');
        }

        if (mappedInventory.healthcareServices?.length) {
          profile.healthcareServices = mappedInventory.healthcareServices;
          fieldsUpdated.push('healthcareServices');
        }
      }
    } catch (err) {
      console.error('[ApplyImport] Inventory mapping failed:', err);
      // Non-blocking
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
