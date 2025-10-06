// src/app/api/diagnostics/messaging/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const smsNumber = process.env.TWILIO_PHONE_NUMBER;
  const whatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;

  const diagnostics = {
    configOk: !!(accountSid && authToken && smsNumber && whatsAppNumber),
    accountSid: !!accountSid,
    authToken: !!authToken,
    smsNumber: !!smsNumber,
    whatsAppNumber: !!whatsAppNumber,
    baseUrl: baseUrl,
  };

  return NextResponse.json(diagnostics);
}
