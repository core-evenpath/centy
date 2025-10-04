// src/lib/twilio-service.ts
'use server';

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

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
 * Send an SMS message via Twilio
 */
export async function sendSMS(options: SendSMSOptions): Promise<TwilioMessageResponse> {
  try {
    const client = getTwilioClient();
    
    if (!twilioPhoneNumber) {
      throw new Error('TWILIO_PHONE_NUMBER not configured');
    }

    // Format phone number for SMS (E.164 format)
    const formattedTo = options.to.startsWith('+') 
      ? options.to 
      : `+${options.to}`;
    
    const messageParams: any = {
      from: twilioPhoneNumber,
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
      errorCode: message.errorCode || undefined,
      errorMessage: message.errorMessage || undefined,
    };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    throw new Error(error.message || 'Failed to send SMS');
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