// src/lib/twilio-service.ts
'use server';

import twilio from 'twilio';
import { normalizePhoneNumber } from '@/utils/phone-utils';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;


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

export interface SendSMSOptions {
  to: string; // Phone number in E.164 format (e.g., +1234567890)
  body: string;
  mediaUrl?: string; // Add mediaUrl for MMS
}

export interface SendWhatsAppMessageOptions {
  to: string; // Phone number in E.164 format (e.g., +1234567890)
  body?: string;
  mediaUrl?: string;
}

export interface TwilioMessageResponse {
  sid: string;
  status: string;
  to: string;
  from: string | null;
  body: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
}

/**
 * Send an SMS message via Twilio.
 * Uses Messaging Service if configured, otherwise falls back to a 'from' number.
 */
export async function sendSMS(options: SendSMSOptions): Promise<TwilioMessageResponse> {
  try {
    const client = getTwilioClient();
    
    const formattedTo = normalizePhoneNumber(options.to);
    
    const messageParams: any = {
      to: formattedTo,
      body: options.body,
    };

    if (options.mediaUrl) {
      messageParams.mediaUrl = [options.mediaUrl];
    }

    // Use Messaging Service if available, otherwise use 'from' number
    if (messagingServiceSid) {
      messageParams.messagingServiceSid = messagingServiceSid;
    } else if (twilioPhoneNumber) {
      messageParams.from = twilioPhoneNumber;
    } else {
      throw new Error('Neither TWILIO_MESSAGING_SERVICE_SID nor TWILIO_PHONE_NUMBER is configured for SMS.');
    }

    const message = await client.messages.create(messageParams);

    return {
      sid: message.sid,
      status: message.status,
      to: message.to,
      from: message.from,
      body: message.body,
      errorCode: message.errorCode || null,
      errorMessage: message.errorMessage || null,
    };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    throw new Error(`Twilio SMS Error: ${error.message}`);
  }
}

/**
 * Send a WhatsApp message via Twilio.
 * Uses Messaging Service if configured, otherwise falls back to a 'from' number.
 */
export async function sendWhatsAppMessage(options: SendWhatsAppMessageOptions): Promise<TwilioMessageResponse> {
  try {
    const client = getTwilioClient();
    
    const normalizedPhoneNumber = normalizePhoneNumber(options.to);
    const to = `whatsapp:${normalizedPhoneNumber}`;
    
    const messageParams: any = { to };

    // Use Messaging Service if available, otherwise use 'from' number for WhatsApp
    if (messagingServiceSid) {
      messageParams.messagingServiceSid = messagingServiceSid;
    } else if (twilioWhatsAppNumber) {
      const fromNumber = twilioWhatsAppNumber.startsWith('whatsapp:')
        ? twilioWhatsAppNumber
        : `whatsapp:${twilioWhatsAppNumber}`;
      messageParams.from = fromNumber;
    } else {
      throw new Error('Neither TWILIO_MESSAGING_SERVICE_SID nor TWILIO_WHATSAPP_NUMBER is configured for WhatsApp.');
    }
    
    if (options.body) {
      messageParams.body = options.body;
    }
    
    if (options.mediaUrl) {
      messageParams.mediaUrl = [options.mediaUrl];
    }
    
    if (!messageParams.body && !messageParams.mediaUrl) {
        throw new Error('WhatsApp message must have either a body or mediaUrl.');
    }

    const message = await client.messages.create(messageParams);

    return {
      sid: message.sid,
      status: message.status,
      to: message.to,
      from: message.from,
      body: message.body,
      errorCode: message.errorCode || null,
      errorMessage: message.errorMessage || null,
    };
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    throw new Error(`Twilio WhatsApp Error: ${error.message}`);
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
 * Validate if a phone number is valid
 */
export async function validatePhoneNumber(phoneNumber: string): Promise<boolean> {
  try {
    const client = getTwilioClient();
    const lookup = await client.lookups.v1.phoneNumbers(phoneNumber).fetch();
    return !!lookup;
  } catch (error) {
    console.error('Error validating phone number:', error);
    return false;
  }
}
