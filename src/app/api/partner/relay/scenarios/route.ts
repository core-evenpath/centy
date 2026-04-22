import { NextRequest, NextResponse } from 'next/server';
import {
  listScenarios,
  createScenario,
} from '@/lib/relay/scenarios/firestore';
import type { ScenarioInput } from '@/lib/relay/scenarios/types';

export async function GET(req: NextRequest) {
  const partnerId = req.nextUrl.searchParams.get('partnerId');
  if (!partnerId) {
    return NextResponse.json({ error: 'partnerId required' }, { status: 400 });
  }
  try {
    const scenarios = await listScenarios(partnerId);
    return NextResponse.json({ scenarios });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ScenarioInput;
    if (!body || !body.partnerId || !body.title) {
      return NextResponse.json(
        { error: 'partnerId and title required' },
        { status: 400 },
      );
    }
    if (!Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'messages must be an array' },
        { status: 400 },
      );
    }
    const scenario = await createScenario(body.partnerId, body);
    return NextResponse.json({ scenario }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
