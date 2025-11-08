// src/scripts/create-sms-phone-mapping.ts
/**
 * Script to create Twilio phone mapping for SMS
 * This creates a mapping in the twilioPhoneMappings collection
 * so SMS webhooks can route to the correct partner
 * 
 * Usage:
 * npx ts-node src/scripts/create-sms-phone-mapping.ts
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

async function createSMSPhoneMapping(
  twilioPhoneNumber: string,
  partnerId: string,
  partnerName?: string
): Promise<void> {
  try {
    console.log('\n🔨 Creating SMS phone mapping...');
    console.log('Phone Number:', twilioPhoneNumber);
    console.log('Partner ID:', partnerId);

    // Verify partner exists
    const partnerDoc = await db.collection('partners').doc(partnerId).get();
    if (!partnerDoc.exists) {
      throw new Error(`Partner with ID ${partnerId} not found!`);
    }

    const partnerData = partnerDoc.data();
    const resolvedPartnerName = partnerName || partnerData?.name || 'Unknown Partner';

    // Create the mapping (using phone number as document ID)
    const mappingData = {
      phoneNumber: twilioPhoneNumber,
      partnerId: partnerId,
      partnerName: resolvedPartnerName,
      platform: 'sms',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.collection('twilioPhoneMappings').doc(twilioPhoneNumber).set(mappingData);

    console.log('\n✅ SMS phone mapping created successfully!');
    console.log('\nMapping Details:');
    console.log(JSON.stringify(mappingData, null, 2));
    console.log('\n📱 Test by sending an SMS to:', twilioPhoneNumber);
  } catch (error: any) {
    console.error('❌ Error creating SMS phone mapping:', error.message);
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
    console.log('🚀 Twilio SMS Phone Mapping Setup Tool\n');

    // CONFIGURE YOUR SMS MAPPING HERE
    const smsMapping = {
      twilioPhoneNumber: '+19107149473',           // Your Twilio SMS number (with + and country code)
      partnerId: 'qYLfafYYCvDt2xXskVfy',            // Your partner ID from Firestore
      partnerName: 'PropMint',                      // Optional: for reference
    };

    // List existing mappings first
    await listPhoneMappings();

    // Create new SMS mapping
    console.log('\n\n=== Creating New SMS Mapping ===');
    
    await createSMSPhoneMapping(
      smsMapping.twilioPhoneNumber,
      smsMapping.partnerId,
      smsMapping.partnerName
    );

    // List all mappings after creation
    await listPhoneMappings();

    console.log('\n✅ Setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Verify the mapping above is correct');
    console.log('2. Deploy the updated SMS webhook route');
    console.log('3. Send a test SMS to your Twilio number');
    console.log('4. Check webhook logs at /partner/messaging/webhook-test');
    console.log('5. Verify message appears in the UI');

  } catch (error: any) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
