import { NextRequest, NextResponse } from 'next/server';

/**
 * TEST: Simple GET handler
 */
export async function GET(request: NextRequest) {
  console.log('✅ GET request received at:', new Date().toISOString());
  return NextResponse.json({ 
    status: 'ok',
    method: 'GET',
    message: 'WhatsApp webhook endpoint is active' 
  }, { status: 200 });
}

/**
 * TEST: Simple POST handler
 */
export async function POST(request: NextRequest) {
  console.log('✅ POST request received at:', new Date().toISOString());
  
  try {
    const formData = await request.formData();
    const payload: any = {};
    
    formData.forEach((value, key) => {
      payload[key] = value.toString();
    });
    
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    return NextResponse.json({ 
      status: 'ok',
      method: 'POST',
      message: 'Message received',
      receivedData: payload
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('Error:', error.message);
    return NextResponse.json({ 
      status: 'error',
      message: error.message 
    }, { status: 500 });
  }
}