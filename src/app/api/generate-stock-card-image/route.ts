
// src/app/api/generate-stock-card-image/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        
        const ticker = searchParams.get('ticker') || 'TICKER';
        const companyName = searchParams.get('companyName') || 'Company Name';
        const action = searchParams.get('action') || 'ACTION';

        // Add emojis to each line for better visual separation
        const text = `📈 ${ticker.toUpperCase()}\\n🏢 ${companyName}\\n⚡️ Action: ${action.toUpperCase()}`;
        
        // Use placehold.co with a clean, dark theme
        const imageUrl = `https://placehold.co/1200x675/1F2937/FFFFFF/png?text=${encodeURIComponent(text)}&font=poppins`;

        return NextResponse.json({ imageUrl });

    } catch (error: any) {
        console.error("Error generating stock card image:", error);
        return NextResponse.json(
            { error: 'Failed to generate stock card image', details: error.message },
            { status: 500 }
        );
    }
}
