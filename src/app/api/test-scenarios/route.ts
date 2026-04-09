import { NextRequest, NextResponse } from 'next/server';
import { generateScenariosAction } from '@/actions/flow-scenario-actions';

// Hardcoded test context for hotels_resorts (avoids registry import server-side)
const TEST_CTX = {
  subVerticalName: 'Hotels & Resorts',
  verticalName: 'Hospitality',
  industryId: 'hospitality',
  stageBlocks: [
    { stage: 'discovery', blockLabels: ['Room Browser', 'Amenity Explorer'] },
    { stage: 'showcase', blockLabels: ['Room Detail', 'Virtual Tour'] },
    { stage: 'comparison', blockLabels: ['Rate Compare'] },
    { stage: 'conversion', blockLabels: ['Booking Form', 'Date Picker'] },
    { stage: 'social_proof', blockLabels: ['Guest Reviews'] },
    { stage: 'handoff', blockLabels: ['Front Desk Connect'] },
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
