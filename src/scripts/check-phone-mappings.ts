// src/scripts/check-phone-mappings.ts
/**
 * Quick script to check if phone mappings exist for your Twilio numbers
 * 
 * Usage:
 * npx ts-node src/scripts/check-phone-mappings.ts
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

async function checkPhoneMappings() {
  console.log('🔍 Checking Twilio Phone Mappings...\n');

  try {
    const snapshot = await db.collection('twilioPhoneMappings').get();

    if (snapshot.empty) {
      console.log('❌ NO PHONE MAPPINGS FOUND!');
      console.log('\n🚨 This is the issue! You need to create phone mappings.');
      console.log('\nTo fix:');
      console.log('1. Run: npx ts-node src/scripts/create-twilio-phone-mapping.ts');
      console.log('2. Or manually create a document in Firestore:');
      console.log('   Collection: twilioPhoneMappings');
      console.log('   Document ID: whatsapp:+14155238886 (your Twilio number)');
      console.log('   Fields: { phoneNumber, partnerId, partnerName, createdAt, updatedAt }');
      return;
    }

    console.log(`✅ Found ${snapshot.size} phone mapping(s):\n`);

    for (const doc of snapshot.docs) {
      const data = doc.data();
      console.log('---');
      console.log('📱 Phone Number:', doc.id);
      console.log('🏢 Partner ID:', data.partnerId || '❌ MISSING!');
      console.log('📝 Partner Name:', data.partnerName || 'Not set');
      console.log('📅 Created:', data.createdAt?.toDate?.() || data.createdAt || 'Unknown');
      console.log('');

      // Verify partner exists
      if (data.partnerId) {
        const partnerDoc = await db.collection('partners').doc(data.partnerId).get();
        if (partnerDoc.exists) {
          console.log('   ✅ Partner exists in database');
        } else {
          console.log('   ❌ WARNING: Partner ID not found in partners collection!');
        }
      }
      console.log('');
    }

    console.log('\n📋 Testing Instructions:');
    console.log('1. Send a WhatsApp message TO one of the numbers above');
    console.log('2. Check your webhook logs at: /api/webhooks/twilio/whatsapp');
    console.log('3. Look for: "✅ Found mapping: partnerId=..."');
    console.log('4. The message should appear in the UI for that partner');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

checkPhoneMappings();