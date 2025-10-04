// src/lib/twilio-service.ts
'use server';

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

let twilioClient: twilio.Twilio | null = null;

function getTwilioClient() {
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.');
  }
  
  if (!twilioClient) {
    twilioClient = twilio(accountSid, authToken);
  }
  
  return twilioClient;
}

export interface SendWhatsAppOptions {
  to: string; // Phone number in E.164 format (e.g., +1234567890)
  body: string;
  mediaUrl?: string;
}

export interface TwilioMessageResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  body: string;
  errorCode?: string;
  errorMessage?: string;
}

/**
 * Send a WhatsApp message via Twilio
 */
export async function sendWhatsAppMessage(options: SendWhatsAppOptions): Promise<TwilioMessageResponse> {
  try {
    const client = getTwilioClient();
    
    if (!whatsappNumber) {
      throw new Error('TWILIO_WHATSAPP_NUMBER not configured');
    }

    // Format phone number for WhatsApp
    const formattedTo = options.to.startsWith('whatsapp:') 
      ? options.to 
      : `whatsapp:${options.to}`;
    
    const messageParams: any = {
      from: whatsappNumber,
      to: formattedTo,
      body: options.body,
    };

    // Add media if provided
    if (options.mediaUrl) {
      messageParams.mediaUrl = [options.mediaUrl];
    }

    const message = await client.messages.create(messageParams);

    return {
      sid: message.sid,
      status: message.status,
      to: message.to,
      from: message.from,
      body: message.body,
      errorCode: message.errorCode || undefined,
      errorMessage: message.errorMessage || undefined,
    };
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    throw new Error(error.message || 'Failed to send WhatsApp message');
  }
}

/**
 * Get message status from Twilio
 */
export async function getMessageStatus(messageSid: string): Promise<string> {
  try {
    const client = getTwilioClient();
    const message = await client.messages(messageSid).fetch();
    return message.status;
  } catch (error: any) {
    console.error('Error fetching message status:', error);
    throw new Error(error.message || 'Failed to fetch message status');
  }
}

/**
 * Validate if a phone number can receive WhatsApp messages
 */
export async function validateWhatsAppNumber(phoneNumber: string): Promise<boolean> {
  try {
    const client = getTwilioClient();
    const lookup = await client.lookups.v1.phoneNumbers(phoneNumber).fetch();
    return !!lookup;
  } catch (error) {
    console.error('Error validating phone number:', error);
    return false;
  }
}