import { NextRequest, NextResponse } from 'next/server';
import { runRelayDiagnostics } from '@/actions/relay-partner-actions';
import { getRelayCORSHeaders, relayOptionsResponse } from '@/lib/relay-cors';

export async function OPTIONS() {
  return relayOptionsResponse();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { partnerId } = body;

    if (!partnerId) {
      return NextResponse.json(
        { error: 'partnerId is required' },
        { status: 400, headers: getRelayCORSHeaders() }
      );
    }

    const result = await runRelayDiagnostics(partnerId);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
      headers: getRelayCORSHeaders(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: getRelayCORSHeaders() }
    );
  }
}
