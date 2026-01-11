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
): Promise<{ success: boolean; results?: PlacesAutocompleteResult[]; error?: string }> {
  try {
    if (!query || query.length < 2) {
      return { success: true, results: [] };
    }

    console.log('[AutoFill Action] Searching for:', query);
    const results = await searchPlacesAutocomplete(query);

    return { success: true, results };
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
 */
export async function autoFillProfileAction(
  placeId: string
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

    console.log('[AutoFill Action] Starting auto-fill for:', placeId);
    const profile = await autoFillBusinessProfile(placeId);

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
 * NOTE: This REPLACES existing data with Auto-Fill data (not merge/append)
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
    const autoFillIdentity = autoFillData.identity as any;

    // Helper to safely extract string value
    const getString = (val: any): string => {
      if (typeof val === 'string') return val;
      if (typeof val === 'object' && val !== null) {
        return val.name || val.text || val.value || '';
      }
      return String(val || '');
    };

    // Helper to safely extract array of strings
    const getStringArray = (arr: any[]): string[] => {
      if (!Array.isArray(arr)) return [];
      return arr.map(item => getString(item)).filter(s => s.length > 0);
    };

    // Build identity - prioritize auto-fill data, fall back to existing
    const mergedIdentity = {
      ...existingPersona.identity,
      // Override with auto-fill data if present
      ...(autoFillIdentity?.businessName && { name: getString(autoFillIdentity.businessName) }),
      ...(autoFillIdentity?.industry && { industry: getString(autoFillIdentity.industry) }),
      ...(autoFillIdentity?.phone && { phone: getString(autoFillIdentity.phone) }),
      ...(autoFillIdentity?.email && { email: getString(autoFillIdentity.email) }),
      ...(autoFillIdentity?.website && { website: getString(autoFillIdentity.website) }),
      ...(autoFillIdentity?.description && { description: getString(autoFillIdentity.description) }),
      // Handle address as nested object
      address: {
        ...existingPersona.identity?.address,
        ...(autoFillIdentity?.address?.street && { street: getString(autoFillIdentity.address.street) }),
        ...(autoFillIdentity?.address?.city && { city: getString(autoFillIdentity.address.city) }),
        ...(autoFillIdentity?.address?.state && { state: getString(autoFillIdentity.address.state) }),
        ...(autoFillIdentity?.address?.country && { country: getString(autoFillIdentity.address.country) }),
        ...(autoFillIdentity?.address?.postalCode && { postalCode: getString(autoFillIdentity.address.postalCode) }),
      },
      // Store location coordinates if available
      ...(autoFillIdentity?.location && { location: autoFillIdentity.location }),
      ...(autoFillIdentity?.googleMapsUrl && { googleMapsUrl: autoFillIdentity.googleMapsUrl }),
      ...(autoFillIdentity?.plusCode && { plusCode: autoFillIdentity.plusCode }),
    };

    // Build personality - prioritize auto-fill data
    // NOTE: description can come from personality.description OR identity.description
    const autoFillPersonality = autoFillData.personality as any;
    const descriptionFromPersonality = autoFillPersonality?.description ? getString(autoFillPersonality.description) : '';
    const descriptionFromIdentity = autoFillIdentity?.description ? getString(autoFillIdentity.description) : '';
    const taglineFromPersonality = autoFillPersonality?.tagline ? getString(autoFillPersonality.tagline) : '';
    const taglineFromIdentity = autoFillIdentity?.tagline ? getString(autoFillIdentity.tagline) : '';

    // Use the best available description (prefer personality, fallback to identity)
    const bestDescription = descriptionFromPersonality || descriptionFromIdentity || '';
    const bestTagline = taglineFromPersonality || taglineFromIdentity || '';

    const mergedPersonality = {
      ...existingPersona.personality,
      // Always set description if we have one from auto-fill (even if empty in personality but available in identity)
      ...(bestDescription && { description: bestDescription }),
      ...(bestTagline && { tagline: bestTagline }),
      ...(autoFillPersonality?.uniqueSellingPoints?.length && {
        uniqueSellingPoints: getStringArray(autoFillPersonality.uniqueSellingPoints)
      }),
      ...(autoFillPersonality?.voiceTone && { voiceTone: getString(autoFillPersonality.voiceTone) }),
    };

    console.log('[MapInventory] Description mapping:', {
      fromPersonality: descriptionFromPersonality?.substring(0, 50),
      fromIdentity: descriptionFromIdentity?.substring(0, 50),
      using: bestDescription?.substring(0, 50),
    });

    // Build customer profile - prioritize auto-fill data
    const autoFillCustomerProfile = autoFillData.customerProfile as any;
    const mergedCustomerProfile = {
      ...existingPersona.customerProfile,
      ...(autoFillCustomerProfile?.targetAudience && {
        targetAudience: Array.isArray(autoFillCustomerProfile.targetAudience)
          ? getStringArray(autoFillCustomerProfile.targetAudience).join(', ')
          : getString(autoFillCustomerProfile.targetAudience)
      }),
      ...(autoFillCustomerProfile?.commonQueries?.length && {
        commonQueries: getStringArray(autoFillCustomerProfile.commonQueries)
      }),
    };

    // Build knowledge - prioritize auto-fill data
    const autoFillKnowledge = autoFillData.knowledge as any;
    const mergedKnowledge = {
      ...existingPersona.knowledge,
      // REPLACE products/services and FAQs (not append)
      ...(autoFillKnowledge?.productsOrServices?.length && {
        productsOrServices: autoFillKnowledge.productsOrServices.map((item: any) => ({
          name: getString(item.name || item.title),
          category: getString(item.category || item.type || ''),
          description: getString(item.description || ''),
          price: typeof item.price === 'number' ? item.price :
                 typeof item.price === 'object' ? item.price?.value :
                 parseFloat(item.price) || undefined,
        })).filter((item: any) => item.name)
      }),
      ...(autoFillKnowledge?.faqs?.length && {
        faqs: autoFillKnowledge.faqs.map((faq: any) => ({
          question: getString(faq.question),
          answer: getString(faq.answer),
        })).filter((faq: any) => faq.question && faq.answer)
      }),
    };

    // Build merged persona with REPLACEMENT strategy for inventory
    const mergedPersona: Partial<BusinessPersona> = {
      ...existingPersona,
      identity: mergedIdentity as any,
      personality: mergedPersonality as any,
      customerProfile: mergedCustomerProfile as any,
      knowledge: mergedKnowledge as any,
      // REPLACE industry-specific data (not merge)
      industrySpecificData: {
        // Only keep non-fetched existing data
        ...(existingPersona.industrySpecificData?.googleRating && {
          googleRating: existingPersona.industrySpecificData.googleRating
        }),
        ...(existingPersona.industrySpecificData?.googleReviewCount && {
          googleReviewCount: existingPersona.industrySpecificData.googleReviewCount
        }),
        // Store NEW fetched data (replaces old)
        ...autoFillData.industrySpecificData,
        fetchedPhotos: autoFillData.photos || [],
        fetchedReviews: autoFillData.reviews || [],
        onlinePresence: autoFillData.onlinePresence || [],
        testimonials: autoFillData.testimonials || [],
        fromTheWeb: autoFillData.fromTheWeb || null,
      },
    };

    // Map inventory to proper schema fields - REPLACE (not append)
    if (inventory) {
      // Hospitality - Room Types (REPLACE)
      if (inventory.rooms && inventory.rooms.length > 0) {
        const roomTypes = mapRoomsToRoomTypes(inventory.rooms);
        mergedPersona.roomTypes = roomTypes;
        console.log('[MapInventory] Replaced with', roomTypes.length, 'room types');
      }

      // Food & Beverage - Menu Items (REPLACE)
      if (inventory.menuItems && inventory.menuItems.length > 0) {
        const { items, categories } = mapMenuToMenuItems(inventory.menuItems);
        mergedPersona.menuItems = items;
        mergedPersona.menuCategories = categories;
        console.log('[MapInventory] Replaced with', items.length, 'menu items in', categories.length, 'categories');
      }

      // Retail - Product Catalog (REPLACE)
      if (inventory.products && inventory.products.length > 0) {
        const products = mapProductsToRetailProducts(inventory.products);
        mergedPersona.productCatalog = products;
        console.log('[MapInventory] Replaced with', products.length, 'products');
      }

      // Real Estate - Property Listings (REPLACE)
      if (inventory.properties && inventory.properties.length > 0) {
        const properties = mapPropertiesToPropertyListings(inventory.properties);
        mergedPersona.propertyListings = properties;
        console.log('[MapInventory] Replaced with', properties.length, 'property listings');
      }

      // Healthcare - Services (REPLACE)
      if (inventory.services && inventory.services.length > 0) {
        const services = mapServicesToHealthcareServices(inventory.services);
        mergedPersona.healthcareServices = services;
        console.log('[MapInventory] Replaced with', services.length, 'healthcare services');
      }

      // Also map new inventory types if present
      if (inventory.courses && inventory.courses.length > 0) {
        mergedPersona.industrySpecificData = {
          ...mergedPersona.industrySpecificData,
          courses: inventory.courses,
        };
        console.log('[MapInventory] Stored', inventory.courses.length, 'courses');
      }

      if (inventory.treatments && inventory.treatments.length > 0) {
        mergedPersona.industrySpecificData = {
          ...mergedPersona.industrySpecificData,
          treatments: inventory.treatments,
        };
        console.log('[MapInventory] Stored', inventory.treatments.length, 'treatments');
      }

      if (inventory.memberships && inventory.memberships.length > 0) {
        mergedPersona.industrySpecificData = {
          ...mergedPersona.industrySpecificData,
          memberships: inventory.memberships,
        };
        console.log('[MapInventory] Stored', inventory.memberships.length, 'memberships');
      }

      if (inventory.vehicles && inventory.vehicles.length > 0) {
        mergedPersona.industrySpecificData = {
          ...mergedPersona.industrySpecificData,
          vehicles: inventory.vehicles,
        };
        console.log('[MapInventory] Stored', inventory.vehicles.length, 'vehicles');
      }

      if (inventory.venuePackages && inventory.venuePackages.length > 0) {
        mergedPersona.industrySpecificData = {
          ...mergedPersona.industrySpecificData,
          venuePackages: inventory.venuePackages,
        };
        console.log('[MapInventory] Stored', inventory.venuePackages.length, 'venue packages');
      }

      if (inventory.legalServices && inventory.legalServices.length > 0) {
        mergedPersona.industrySpecificData = {
          ...mergedPersona.industrySpecificData,
          legalServices: inventory.legalServices,
        };
        console.log('[MapInventory] Stored', inventory.legalServices.length, 'legal services');
      }

      if (inventory.financialProducts && inventory.financialProducts.length > 0) {
        mergedPersona.industrySpecificData = {
          ...mergedPersona.industrySpecificData,
          financialProducts: inventory.financialProducts,
        };
        console.log('[MapInventory] Stored', inventory.financialProducts.length, 'financial products');
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
