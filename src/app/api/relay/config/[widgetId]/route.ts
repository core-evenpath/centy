import { NextRequest, NextResponse } from 'next/server';
import { db as adminDb } from '@/lib/firebase-admin';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Relay-Widget-Id',
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ widgetId: string }> }
) {
    try {
        const { widgetId } = await params;

        if (!widgetId) {
            return NextResponse.json({ error: 'widgetId is required' }, { status: 400, headers: corsHeaders });
        }

        // Look up partnerId from widgetId
        const widgetDoc = await adminDb.collection('relayWidgets').doc(widgetId).get();
        if (!widgetDoc.exists) {
            return NextResponse.json({ error: 'Widget not found' }, { status: 404, headers: corsHeaders });
        }

        const partnerId = widgetDoc.data()?.partnerId;
        if (!partnerId) {
            return NextResponse.json({ error: 'Partner not found' }, { status: 404, headers: corsHeaders });
        }

        // Read relay config
        const configSnap = await adminDb
            .collection('partners')
            .doc(partnerId)
            .collection('relayConfig')
            .doc('config')
            .get();

        if (!configSnap.exists) {
            return NextResponse.json({ error: 'Config not found' }, { status: 404, headers: corsHeaders });
        }

        const config = configSnap.data();

        // Return only public-safe fields
        return NextResponse.json({
            brandName: config?.brandName || '',
            tagline: config?.tagline || '',
            brandEmoji: config?.brandEmoji || '',
            accentColor: config?.accentColor || '#6366f1',
            welcomeMessage: config?.welcomeMessage || 'Hi! How can I help you today?',
            enabled: config?.enabled || false,
        }, {
            headers: {
                ...corsHeaders,
                'Cache-Control': 'public, max-age=300',
            },
        });
    } catch (error) {
        console.error('Config fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch config' },
            { status: 500, headers: corsHeaders }
        );
    }
}
