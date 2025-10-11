
// src/app/api/generate-stock-card-image/route.ts
import { NextRequest, NextResponse } from 'next/server';

function getActionColor(action: string) {
    switch (action.toLowerCase()) {
        case 'buy': return '4CAF50'; // Green
        case 'sell': return 'F44336'; // Red
        case 'hold': return 'FFC107'; // Amber
        default: return '9E9E9E'; // Grey
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        
        const ticker = searchParams.get('ticker') || 'TICK';
        const companyName = searchParams.get('companyName') || 'Company Name';
        const action = searchParams.get('action') || 'N/A';
        const priceTarget = searchParams.get('priceTarget') || 'N/A';
        const currentPrice = searchParams.get('currentPrice') || 'N/A';
        const riskLevel = searchParams.get('riskLevel') || 'N/A';
        const timeframe = searchParams.get('timeframe') || 'N/A';

        const actionColor = getActionColor(action);

        // Construct the URL for placehold.co
        const textParts = [
            `${ticker}`,
            `${companyName}`,
            `Action: ${action.toUpperCase()}`,
            `Price Target: ${priceTarget}`,
            `Current Price: ${currentPrice}`,
            `Risk: ${riskLevel.toUpperCase()}`,
            `Timeframe: ${timeframe}`
        ];
        
        const textString = textParts.join('\\n');

        const imageUrl = `https://placehold.co/1200x675/1F2937/FFFFFF/png?text=${encodeURIComponent(textString)}&font=poppins&color=${actionColor}`;

        return NextResponse.json({ imageUrl });

    } catch (error: any) {
        console.error("Error generating stock card image:", error);
        return NextResponse.json(
            { error: 'Failed to generate stock card image', details: error.message },
            { status: 500 }
        );
    }
}
