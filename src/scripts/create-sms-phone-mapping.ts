import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

async function createSMSPhoneMapping() {
  console.log('🚀 Creating SMS Phone Mapping\n');

  // CONFIGURE YOUR SMS MAPPING HERE
  const smsPhone = '+19107149473'; // Your Twilio SMS number
  const partnerId = 'qYLfafYYCvDt2xXskVfy'; // Your partner ID from Firestore
  const partnerName = 'PropMint'; // Your company name

  try {
    // Verify partner exists
    const partnerDoc = await db.collection('partners').doc(partnerId).get();
    if (!partnerDoc.exists) {
      throw new Error(`Partner ${partnerId} does not exist!`);
    }

    // Create the mapping
    const mappingData = {
      phoneNumber: smsPhone,
      partnerId: partnerId,
      partnerName: partnerName,
      platform: 'sms',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('twilioPhoneMappings').doc(smsPhone).set(mappingData);

    console.log('✅ SMS phone mapping created successfully!');
    console.log('\nMapping Details:');
    console.log(JSON.stringify(mappingData, null, 2));
    console.log('\n📱 Test by sending an SMS to:', smsPhone);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

createSMSPhoneMapping();