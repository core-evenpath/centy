'use server';

import {
  searchHotels,
  getHotelDetails,
  enrichHotelDataWithAI,
  importHotelData,
  convertToRoomInventory,
  HotelBasicInfo,
  HotelFullData,
} from '@/lib/hotel-import-service';

/**
 * Search for hotels by name and location
 */
export async function searchHotelsAction(
  query: string,
  location?: string
): Promise<{ success: boolean; hotels?: HotelBasicInfo[]; error?: string }> {
  try {
    const hotels = await searchHotels(query, location);
    return { success: true, hotels };
  } catch (error: any) {
    console.error('searchHotelsAction error:', error);
    return { success: false, error: error.message || 'Failed to search hotels' };
  }
}

/**
 * Get detailed hotel information
 */
export async function getHotelDetailsAction(
  placeId: string
): Promise<{ success: boolean; hotel?: HotelBasicInfo; error?: string }> {
  try {
    const hotel = await getHotelDetails(placeId);
    return { success: true, hotel };
  } catch (error: any) {
    console.error('getHotelDetailsAction error:', error);
    return { success: false, error: error.message || 'Failed to get hotel details' };
  }
}

/**
 * Import complete hotel data with room types
 * Uses Google Places API + Gemini AI with web search grounding
 */
export async function importHotelDataAction(
  hotelName: string,
  location: string
): Promise<{
  success: boolean;
  data?: HotelFullData;
  roomInventory?: any[];
  error?: string;
}> {
  try {
    console.log(`[Hotel Import] Starting import for: ${hotelName} in ${location}`);

    const hotelData = await importHotelData(hotelName, location);

    if (!hotelData) {
      return { success: false, error: 'Could not find or import hotel data' };
    }

    // Convert to room inventory format
    const roomInventory = convertToRoomInventory(hotelData);

    console.log(`[Hotel Import] Successfully imported ${roomInventory.length} room types`);

    return {
      success: true,
      data: hotelData,
      roomInventory,
    };
  } catch (error: any) {
    console.error('importHotelDataAction error:', error);
    return { success: false, error: error.message || 'Failed to import hotel data' };
  }
}

/**
 * Enrich existing hotel data with AI
 * Useful when you have basic info but need room details
 */
export async function enrichHotelWithAIAction(
  hotelName: string,
  location: string
): Promise<{
  success: boolean;
  roomTypes?: any[];
  amenities?: any;
  policies?: any;
  error?: string;
}> {
  try {
    const enrichedData = await enrichHotelDataWithAI(hotelName, location);
    return {
      success: true,
      roomTypes: enrichedData.roomTypes,
      amenities: enrichedData.amenities,
      policies: enrichedData.policies,
    };
  } catch (error: any) {
    console.error('enrichHotelWithAIAction error:', error);
    return { success: false, error: error.message || 'Failed to enrich hotel data' };
  }
}
