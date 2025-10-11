
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
        const currentPrice = searchParams.get('currentPrice') || 'N/A';
        const riskLevel = searchParams.get('riskLevel') || 'N/A';
        const timeframe = searchParams.get('timeframe') || 'N/A';

        const actionColor = getActionColor(action);

        // Construct text parts with color information
        const textParts = [
            `color:FFFFFF;size:60;text:${ticker}`,
            `color:CCCCCC;size:24;text:${companyName}`,
            `color:${actionColor};size:36;text:${action.toUpperCase()}`,
            `color:A0A0A0;size:20;text:Current Price: ${currentPrice}`,
            `color:A0A0A0;size:20;text:Risk: ${riskLevel.toUpperCase()} | Timeframe: ${timeframe}`
        ];
        
        const textString = textParts.join('|');

        // Use placehold.co with advanced text formatting options
        const imageUrl = `https://placehold.co/1200x675/1F2937/FFFFFF/png?text=${encodeURIComponent(textString)}&font=poppins`;

        return NextResponse.json({ imageUrl });

    } catch (error: any) {
        console.error("Error generating stock card image:", error);
        return NextResponse.json(
            { error: 'Failed to generate stock card image', details: error.message },
            { status: 500 }
        );
    }
}
