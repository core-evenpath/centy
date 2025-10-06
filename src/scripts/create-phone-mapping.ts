// src/scripts/create-phone-mapping.ts
/**
 * Script to create Twilio phone number to partner mappings
 * 
 * Usage:
 * 1. Set your Firebase credentials
 * 2. Run: npx ts-node src/scripts/create-phone-mapping.ts
 * 3. Follow the prompts
 */

import * as admin from 'firebase-admin';
import * as readline from 'readline';

// Initialize Firebase Admin (you may need to adjust the path to your service account key)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('../../serviceAccountKey.json'))
  });
}

const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

async function createPhoneMapping() {
  try {
    console.log('\n=== Create Twilio Phone Mapping ===\n');

    // Get phone number
    const phoneNumber = await question('Enter Twilio WhatsApp phone number (e.g., +19107149473): ');
    if (!phoneNumber) {
      console.error('❌ Phone number is required');
      process.exit(1);
    }

    // Format phone number
    const formattedPhone = phoneNumber.startsWith('whatsapp:') 
      ? phoneNumber 
      : `whatsapp:${phoneNumber}`;

    // Get partner ID
    const partnerId = await question('Enter Partner ID: ');
    if (!partnerId) {
      console.error('❌ Partner ID is required');
      process.exit(1);
    }

    // Verify partner exists
    const partnerDoc = await db.collection('partners').doc(partnerId).get();
    if (!partnerDoc.exists) {
      console.error(`❌ Partner with ID "${partnerId}" not found!`);
      
      // List available partners
      console.log('\nAvailable partners:');
      const partnersSnapshot = await db.collection('partners').limit(10).get();
      partnersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`  - ID: ${doc.id}, Name: ${data.name}`);
      });
      
      process.exit(1);
    }

    const partnerName = partnerDoc.data()?.name || 'Unknown Partner';

    // Create mapping
    const mappingData = {
      phoneNumber: formattedPhone,
      partnerId,
      partnerName,
      platform: 'whatsapp',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('twilioPhoneMappings').doc(formattedPhone).set(mappingData);

    console.log('\n✅ Phone mapping created successfully!');
    console.log(`   Phone: ${formattedPhone}`);
    console.log(`   Partner: ${partnerName} (${partnerId})`);
    console.log('\nYou can now receive WhatsApp messages on this number.');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Run the script
createPhoneMapping();