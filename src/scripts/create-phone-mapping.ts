// src/scripts/create-twilio-phone-mapping.ts
/**
 * Script to create Twilio phone number to partner mappings
 * Run this to map your Twilio WhatsApp numbers to your partner organizations
 * 
 * Usage:
 * npx ts-node src/scripts/create-twilio-phone-mapping.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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
  phoneNumber: string; // e.g., "whatsapp:+14155238886"
  partnerId: string;   // Your partner/organization ID
  partnerName?: string; // Optional: Name for reference
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a phone number mapping
 */
async function createPhoneMapping(
  twilioWhatsAppNumber: string,
  partnerId: string,
  partnerName?: string
): Promise<void> {
  try {
    // Ensure the phone number has the whatsapp: prefix
    const phoneNumber = twilioWhatsAppNumber.startsWith('whatsapp:')
      ? twilioWhatsAppNumber
      : `whatsapp:${twilioWhatsAppNumber}`;

    console.log('\n=== Creating Phone Mapping ===');
    console.log('Phone Number:', phoneNumber);
    console.log('Partner ID:', partnerId);
    console.log('Partner Name:', partnerName || 'Not provided');

    // Verify partner exists
    const partnerDoc = await db.collection('partners').doc(partnerId).get();
    if (!partnerDoc.exists) {
      throw new Error(`Partner ${partnerId} does not exist!`);
    }

    const partnerData = partnerDoc.data();
    const actualPartnerName = partnerName || partnerData?.name || partnerData?.businessName || 'Unknown';

    const mappingData: PhoneMapping = {
      phoneNumber,
      partnerId,
      partnerName: actualPartnerName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Create the mapping document
    // Document ID is the phone number itself (with whatsapp: prefix)
    await db.collection('twilioPhoneMappings').doc(phoneNumber).set(mappingData);

    console.log('✅ Phone mapping created successfully!');
    console.log('\nMapping Details:');
    console.log(JSON.stringify(mappingData, null, 2));
    console.log('\n📱 Test by sending a WhatsApp message to:', phoneNumber);
  } catch (error: any) {
    console.error('❌ Error creating phone mapping:', error.message);
    throw error;
  }
}

/**
 * List all existing phone mappings
 */
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
      console.log('Partner ID:', data.partnerId);
      console.log('Partner Name:', data.partnerName);
      console.log('Created At:', data.createdAt?.toDate?.() || data.createdAt);
    });
  } catch (error: any) {
    console.error('❌ Error listing phone mappings:', error.message);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Twilio Phone Mapping Setup Tool\n');

    // CONFIGURE YOUR MAPPINGS HERE
    // Replace with your actual Twilio WhatsApp numbers and partner IDs
    const mappings = [
      {
        twilioWhatsAppNumber: 'whatsapp:+19107149473', // Your Twilio WhatsApp number
        partnerId: 'qYLfafYYCvDt2xXskVfy',              // Your partner ID from Firestore
        partnerName: 'PropMint',               // Optional: for reference
      },
      // Add more mappings as needed for multiple partners
      // {
      //   twilioWhatsAppNumber: 'whatsapp:+14155238887',
      //   partnerId: 'another-partner-id',
      //   partnerName: 'Another Company',
      // },
    ];

    // List existing mappings first
    await listPhoneMappings();

    // Create new mappings
    console.log('\n\n=== Creating New Mappings ===');
    for (const mapping of mappings) {
      if (mapping.partnerId === 'your-partner-id-here') {
        console.log('\n⚠️  Skipping example mapping. Please configure with your actual values.');
        console.log('Edit this file and replace "your-partner-id-here" with your actual partner ID.');
        continue;
      }

      await createPhoneMapping(
        mapping.twilioWhatsAppNumber,
        mapping.partnerId,
        mapping.partnerName
      );
    }

    // List all mappings after creation
    await listPhoneMappings();

    console.log('\n✅ Setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Verify the mappings above are correct');
    console.log('2. Send a test WhatsApp message to your Twilio number');
    console.log('3. Check your application logs for webhook activity');
    console.log('4. The message should now appear in the UI for the correct partner');

  } catch (error: any) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();