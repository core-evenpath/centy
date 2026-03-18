import { NextRequest, NextResponse } from 'next/server';
import { getRelayCORSHeaders, relayOptionsResponse } from '@/lib/relay-cors';
import { runRelayDiagnostics } from '@/actions/relay-partner-actions';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || undefined;
  return relayOptionsResponse(origin);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || undefined;
  const corsHeaders = getRelayCORSHeaders(origin);

  try {
    const body = await request.json();
    const { partnerId } = body as { partnerId: string };

    if (!partnerId) {
      return NextResponse.json(
        { error: 'partnerId is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await runRelayDiagnostics(partnerId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Diagnostics failed' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(result.diagnostics, { headers: corsHeaders });
  } catch (error) {
    console.error('Relay diagnostics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
