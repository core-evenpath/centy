import { NextRequest, NextResponse } from 'next/server';
import { generateScenariosAction } from '@/actions/flow-scenario-actions';

// Hardcoded test context for hotels_resorts (avoids registry import server-side)
const TEST_CTX = {
  subVerticalName: 'Hotels & Resorts',
  verticalName: 'Hospitality',
  industryId: 'hospitality',
  stageBlocks: [
    { stage: 'greeting', blocks: [
      { label: 'Greeting', desc: 'Welcome message with brand identity and quick action buttons', intents: ['hello', 'hi', 'start'], isShared: true },
    ] },
    { stage: 'discovery', blocks: [
      { label: 'Room Browser', desc: 'Browsable room cards with rates, amenities, and availability', intents: ['rooms', 'browse', 'availability'], isShared: false },
      { label: 'Amenity Explorer', desc: 'Visual amenity showcase with categories', intents: ['amenities', 'pool', 'spa', 'gym'], isShared: false },
    ] },
    { stage: 'showcase', blocks: [
      { label: 'Room Detail', desc: 'Full room view with photos, amenities, and booking CTA', intents: ['details', 'room info'], isShared: false },
    ] },
    { stage: 'comparison', blocks: [
      { label: 'Rate Compare', desc: 'Side-by-side rate comparison for room types', intents: ['compare', 'rates', 'prices'], isShared: false },
    ] },
    { stage: 'conversion', blocks: [
      { label: 'Booking Form', desc: 'Reservation form with dates, guests, and room selection', intents: ['book', 'reserve'], isShared: false },
    ] },
    { stage: 'social_proof', blocks: [
      { label: 'Guest Reviews', desc: 'Guest ratings and reviews with verified stay badges', intents: ['reviews', 'ratings'], isShared: false },
    ] },
    { stage: 'handoff', blocks: [
      { label: 'Front Desk Connect', desc: 'Direct connection to front desk with context transfer', intents: ['front desk', 'reception'], isShared: false },
      { label: 'Contact Card', desc: 'Business contact info with click-to-call, email, WhatsApp', intents: ['contact', 'phone', 'email'], isShared: true },
    ] },
  ],
};

export async function GET(request: NextRequest) {
  const functionId = request.nextUrl.searchParams.get('id') || 'hotels_resorts';
  try {
    const result = await generateScenariosAction(functionId, TEST_CTX);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}
