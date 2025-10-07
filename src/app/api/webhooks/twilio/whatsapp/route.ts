import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  console.log('GET /api/webhooks/twilio/whatsapp');
  return NextResponse.json({ 
    success: true,
    message: 'WhatsApp webhook is active',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  console.log('POST /api/webhooks/twilio/whatsapp');
  console.log('Webhook called at:', new Date().toISOString());
  
  try {
    const formData = await request.formData();
    const data: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });
    
    console.log('Received data:', JSON.stringify(data, null, 2));
    
    return NextResponse.json({ 
      success: true,
      message: 'Webhook received',
      data: data
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}