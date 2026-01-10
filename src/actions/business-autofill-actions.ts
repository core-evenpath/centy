'use server';

import {
  searchPlacesAutocomplete,
  getPlaceDetails,
  autoFillBusinessProfile,
  createEmptyProfile,
  PlacesAutocompleteResult,
  PlacesDetailedInfo,
  AutoFilledProfile,
} from '@/lib/business-autofill-service';
import type { BusinessPersona } from '@/lib/business-persona-types';

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
