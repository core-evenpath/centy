import { NextRequest, NextResponse } from 'next/server';
import { generateScenariosAction } from '@/actions/flow-scenario-actions';

export async function GET(request: NextRequest) {
  const functionId = request.nextUrl.searchParams.get('id') || 'hotels_resorts';
  try {
    const result = await generateScenariosAction(functionId);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}
