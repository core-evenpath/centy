// src/scripts/create-phone-mapping.ts
/**
 * Script to create Twilio phone number to partner mappings for both SMS and WhatsApp
 * Run this to map your Twilio numbers to your partner organizations
 * 
 * Usage:
 * npx ts-node src/scripts/create-phone-mapping.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

interface PhoneMapping {
  phoneNumber: string;
  partnerId: string;
  partnerName?: string;
  platform: 'sms' | 'whatsapp';
  createdAt: any;
  updatedAt: any;
}

async function createMapping(
  twilioNumber: string,
  platform: 'sms' | 'whatsapp',
  partnerId: string,
  partnerName?: string
): Promise<void> {
  try {
    let documentId: string;
    
    if (platform === 'whatsapp') {
      documentId = twilioNumber.startsWith('whatsapp:') ? twilioNumber : `whatsapp:${twilioNumber}`;
    } else {
      documentId = twilioNumber.startsWith('+') ? twilioNumber : `+${twilioNumber.replace(/\D/g, '')}`;
    }
    
    console.log(`\n🔨 Creating ${platform.toUpperCase()} phone mapping...`);
    console.log('   Document ID:', documentId);
    console.log('   Partner ID:', partnerId);

    // Verify partner exists
    const partnerDoc = await db.collection('partners').doc(partnerId).get();
    if (!partnerDoc.exists) {
      throw new Error(`Partner with ID ${partnerId} not found!`);
    }

    const partnerData = partnerDoc.data();
    const resolvedPartnerName = partnerName || partnerData?.name || 'Unknown Partner';

    const mappingData: PhoneMapping = {
      phoneNumber: documentId,
      partnerId: partnerId,
      partnerName: resolvedPartnerName,
      platform: platform,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.collection('twilioPhoneMappings').doc(documentId).set(mappingData);

    console.log(`✅ ${platform.toUpperCase()} phone mapping created successfully!`);
  } catch (error: any) {
    console.error(`❌ Error creating ${platform.toUpperCase()} phone mapping:`, error.message);
    throw error;
  }
}

async function listPhoneMappings(): Promise<void> {
  try {
    console.log('\n=== Existing Phone Mappings ===');
    const snapshot = await db.collection('twilioPhoneMappings').get();

    if (snapshot.empty) {
      console.log('No phone mappings found.');
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log('\n---');
      console.log('Document ID:', doc.id);
      console.log('Phone Number:', data.phoneNumber);
      console.log('Platform:', data.platform);
      console.log('Partner ID:', data.partnerId);
      console.log('Partner Name:', data.partnerName);
      console.log('Created At:', data.createdAt?.toDate?.() || data.createdAt);
    });
  } catch (error: any) {
    console.error('❌ Error listing phone mappings:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Twilio Phone Mapping Setup Tool\n');

    // CONFIGURE YOUR MAPPINGS HERE
    const config = {
      // The ID of the partner these numbers should be associated with
      partnerId: 'qYLfafYYCvDt2xXskVfy',
      // The name of the partner (optional, for reference)
      partnerName: 'PropMint',
      // Your Twilio SMS number (must be in E.164 format, e.g., +1234567890)
      smsNumber: '+19107149473',
      // Your Twilio WhatsApp number (must be in E.164 format)
      whatsappNumber: '+14155238886',
    };

    // List existing mappings first
    await listPhoneMappings();

    // Create/update mappings from config
    console.log('\n\n=== Creating/Updating Mappings ===');
    
    if (config.partnerId === 'your-partner-id-here') {
        console.log('\n⚠️  Skipping example mapping. Please configure with your actual values.');
        console.log('Edit this file and replace "your-partner-id-here" with your actual partner ID and Twilio numbers.');
        return;
    }

    if (config.smsNumber) {
      await createMapping(config.smsNumber, 'sms', config.partnerId, config.partnerName);
    }
    
    if (config.whatsappNumber) {
      await createMapping(config.whatsappNumber, 'whatsapp', config.partnerId, config.partnerName);
    }

    // List all mappings after creation
    await listPhoneMappings();

    console.log('\n✅ Setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Verify the mappings above are correct');
    console.log('2. Send a test SMS and WhatsApp message to your Twilio numbers');
    console.log('3. Check webhook logs at /partner/messaging/webhook-test');
    console.log('4. The messages should appear in the UI');

  } catch (error: any) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
