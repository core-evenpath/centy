// src/lib/twilio-service.ts
'use server';

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

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
}

export interface SendWhatsAppMessageOptions {
  to: string; // Phone number in E.164 format (e.g., +1234567890)
  body: string;
  mediaUrl?: string;
}

export interface TwilioMessageResponse {
  sid: string;
  status: string;
  to: string;
  from: string | null;
  body: string;
  errorCode?: string | null;
  errorMessage?: string | null;
}

/**
 * Send an SMS message via Twilio using a Messaging Service
 */
export async function sendSMS(options: SendSMSOptions): Promise<TwilioMessageResponse> {
  try {
    const client = getTwilioClient();
    
    if (!messagingServiceSid) {
      throw new Error('TWILIO_MESSAGING_SERVICE_SID not configured');
    }

    const formattedTo = options.to.startsWith('+') 
      ? options.to 
      : `+${options.to}`;
    
    const messageParams: any = {
      messagingServiceSid: messagingServiceSid,
      to: formattedTo,
      body: options.body,
    };

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
    throw new Error(error.message || 'Failed to send SMS');
  }
}

/**
 * Send a WhatsApp message via Twilio using a Messaging Service
 */
export async function sendWhatsAppMessage(options: SendWhatsAppMessageOptions): Promise<TwilioMessageResponse> {
  try {
    const client = getTwilioClient();
    
    if (!messagingServiceSid) {
      throw new Error('TWILIO_MESSAGING_SERVICE_SID not configured');
    }

    const to = `whatsapp:${options.to.startsWith('+') ? options.to : '+' + options.to}`;
    
    const messageParams: any = {
      messagingServiceSid: messagingServiceSid,
      to,
      body: options.body,
    };
    
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
      errorCode: message.errorCode || null,
      errorMessage: message.errorMessage || null,
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
