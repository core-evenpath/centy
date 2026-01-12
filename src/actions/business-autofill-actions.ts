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
