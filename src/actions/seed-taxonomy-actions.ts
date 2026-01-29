'use server';

import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { INDUSTRIES, BUSINESS_FUNCTIONS, SPECIALIZATIONS } from '@/lib/business-taxonomy/industries';
import { COUNTRY_OVERRIDES } from '@/lib/business-taxonomy/country-overrides';

/**
 * Broadcast Templates Data
 */
const SEED_BROADCAST_TEMPLATES = [
    {
        templateId: 'welcome_new_client',
        name: 'Welcome New Client',
        description: 'Send a warm welcome to new clients',
        category: 'transactional',
        messageTemplate: `Hi {{clientName}}! 👋\n\nWelcome to {{businessName}}! We're excited to have you.\n\nQuestions? Just reply to this message.\n\nBest regards,\n{{senderName}}`,
        variables: [
            { name: 'clientName', description: 'Client first name', defaultValue: 'there' },
            { name: 'businessName', description: 'Your business name' },
            { name: 'senderName', description: 'Your name' },
        ],
        supportedChannels: ['whatsapp', 'telegram', 'sms'],
        tips: ['Personalization increases open rates by 26%'],
        applicableIndustries: [],
        applicableFunctions: [],
        applicableCountries: [],
        isActive: true,
        sortOrder: 1,
    },
    {
        templateId: 'appointment_reminder',
        name: 'Appointment Reminder',
        description: 'Remind clients about upcoming appointments',
        category: 'transactional',
        messageTemplate: `Hi {{clientName}},\n\nReminder about your appointment:\n📅 {{appointmentDate}}\n⏰ {{appointmentTime}}\n📍 {{location}}\n\nReply YES to confirm.\n\n{{businessName}}`,
        variables: [
            { name: 'clientName', description: 'Client name' },
            { name: 'appointmentDate', description: 'Date' },
            { name: 'appointmentTime', description: 'Time' },
            { name: 'location', description: 'Location' },
            { name: 'businessName', description: 'Business name' },
        ],
        supportedChannels: ['whatsapp', 'sms'],
        tips: ['Send 24-48 hours before', 'Reduces no-shows by 38%'],
        applicableIndustries: ['healthcare_medical', 'personal_wellness', 'business_professional'],
        applicableFunctions: [],
        applicableCountries: [],
        isActive: true,
        sortOrder: 2,
    },
    {
        templateId: 'payment_reminder',
        name: 'Payment Reminder',
        description: 'Gentle reminder for pending payments',
        category: 'transactional',
        messageTemplate: `Hi {{clientName}},\n\nFriendly reminder about your pending payment:\n💰 Amount: {{amount}}\n📅 Due: {{dueDate}}\n\nPay here: {{paymentLink}}\n\n{{businessName}}`,
        variables: [
            { name: 'clientName', description: 'Client name' },
            { name: 'amount', description: 'Amount due' },
            { name: 'dueDate', description: 'Due date' },
            { name: 'paymentLink', description: 'Payment link' },
            { name: 'businessName', description: 'Business name' },
        ],
        supportedChannels: ['whatsapp', 'sms'],
        tips: ['Keep tone friendly', '3x response rate vs email'],
        applicableIndustries: ['financial_services', 'business_professional'],
        applicableFunctions: ['microfinance', 'nbfc_lending', 'accounting_tax'],
        applicableCountries: [],
        isActive: true,
        sortOrder: 3,
    },
    {
        templateId: 'special_offer',
        name: 'Special Offer',
        description: 'Promote a limited-time offer',
        category: 'promotional',
        messageTemplate: `Hi {{clientName}}! 🎁\n\nExclusive offer: {{offerDetails}}\n\n🔥 Valid until: {{expiryDate}}\n\nReply NOW to claim!\n\n{{businessName}}`,
        variables: [
            { name: 'clientName', description: 'Client name' },
            { name: 'offerDetails', description: 'Offer details' },
            { name: 'expiryDate', description: 'Expiry date' },
            { name: 'businessName', description: 'Business name' },
        ],
        supportedChannels: ['whatsapp', 'telegram', 'sms'],
        tips: ['Create urgency with expiry dates'],
        applicableIndustries: [],
        applicableFunctions: [],
        applicableCountries: [],
        isActive: true,
        sortOrder: 4,
    },
    {
        templateId: 'festive_greeting',
        name: 'Festive Greeting',
        description: 'Send festive wishes',
        category: 'festive',
        messageTemplate: `Dear {{clientName}},\n\n{{greeting}} from {{businessName}}! 🎉\n\nWishing you joy and prosperity.\n\nWarm regards,\n{{senderName}}`,
        variables: [
            { name: 'clientName', description: 'Client name' },
            { name: 'greeting', description: 'Festival greeting' },
            { name: 'businessName', description: 'Business name' },
            { name: 'senderName', description: 'Your name' },
        ],
        supportedChannels: ['whatsapp', 'telegram', 'sms'],
        tips: ['45% higher engagement'],
        applicableIndustries: [],
        applicableFunctions: [],
        applicableCountries: [],
        isActive: true,
        sortOrder: 5,
    },
    {
        templateId: 'followup_inquiry',
        name: 'Follow-up on Inquiry',
        description: 'Follow up with leads',
        category: 'followup',
        messageTemplate: `Hi {{clientName}},\n\nThanks for your interest in {{productService}}!\n\nWould you like to:\n1️⃣ Schedule a call\n2️⃣ Get more details\n3️⃣ See pricing\n\nJust reply!\n\n{{businessName}}`,
        variables: [
            { name: 'clientName', description: 'Client name' },
            { name: 'productService', description: 'Product/service' },
            { name: 'businessName', description: 'Business name' },
        ],
        supportedChannels: ['whatsapp', 'telegram'],
        tips: ['Follow up within 24-48 hours', '7x better conversion'],
        applicableIndustries: [],
        applicableFunctions: [],
        applicableCountries: [],
        isActive: true,
        sortOrder: 6,
    },
    {
        templateId: 'document_request',
        name: 'Document Request',
        description: 'Request documents from clients',
        category: 'transactional',
        messageTemplate: `Hi {{clientName}},\n\nFor your {{serviceType}}, we need:\n{{documentList}}\n\nShare here or upload at: {{uploadLink}}\n\n{{businessName}}`,
        variables: [
            { name: 'clientName', description: 'Client name' },
            { name: 'serviceType', description: 'Service type' },
            { name: 'documentList', description: 'Documents needed' },
            { name: 'uploadLink', description: 'Upload link' },
            { name: 'businessName', description: 'Business name' },
        ],
        supportedChannels: ['whatsapp'],
        tips: ['WhatsApp makes document sharing easy'],
        applicableIndustries: ['financial_services', 'education_learning'],
        applicableFunctions: ['microfinance', 'nbfc_lending', 'study_abroad', 'immigration', 'visa_services'],
        applicableCountries: [],
        isActive: true,
        sortOrder: 7,
    },
    {
        templateId: 'status_update',
        name: 'Status Update',
        description: 'Update on application status',
        category: 'transactional',
        messageTemplate: `Hi {{clientName}},\n\n📋 Your {{applicationType}} update:\n\nStatus: {{status}}\n{{nextSteps}}\n\nQuestions? Reply here.\n\n{{businessName}}`,
        variables: [
            { name: 'clientName', description: 'Client name' },
            { name: 'applicationType', description: 'Application type' },
            { name: 'status', description: 'Current status' },
            { name: 'nextSteps', description: 'Next steps' },
            { name: 'businessName', description: 'Business name' },
        ],
        supportedChannels: ['whatsapp', 'sms'],
        tips: ['Reduces support queries by 40%'],
        applicableIndustries: ['financial_services', 'education_learning'],
        applicableFunctions: ['microfinance', 'nbfc_lending', 'study_abroad', 'immigration'],
        applicableCountries: [],
        isActive: true,
        sortOrder: 8,
    },
];

/**
 * Result interface
 */
interface SeedResult {
    success: boolean;
    summary: {
        industries: { seeded: number; errors: number };
        functions: { seeded: number; errors: number };
        specializations: { seeded: number; errors: number };
        countryOverrides: { seeded: number; errors: number };
        broadcastTemplates: { seeded: number; errors: number };
    };
    errors: string[];
}

/**
 * Seed all systemTaxonomy collections
 */
export async function seedSystemTaxonomy(): Promise<SeedResult> {
    const result: SeedResult = {
        success: true,
        summary: {
            industries: { seeded: 0, errors: 0 },
            functions: { seeded: 0, errors: 0 },
            specializations: { seeded: 0, errors: 0 },
            countryOverrides: { seeded: 0, errors: 0 },
            broadcastTemplates: { seeded: 0, errors: 0 },
        },
        errors: [],
    };

    // Check if database is initialized
    if (!db) {
        result.success = false;
        result.errors.push('Database not initialized. Check Firebase Admin SDK environment variables.');
        return result;
    }

    console.log('Starting systemTaxonomy seeding...');

    // Seed Industries
    console.log(`Seeding ${INDUSTRIES.length} industries...`);
    for (let i = 0; i < INDUSTRIES.length; i++) {
        const industry = INDUSTRIES[i];
        try {
            await db
                .collection('systemTaxonomy')
                .doc('industries')
                .collection('items')
                .doc(industry.industryId)
                .set(
                    {
                        ...industry,
                        isActive: true,
                        sortOrder: i + 1,
                        createdAt: Timestamp.now(),
                        updatedAt: Timestamp.now(),
                    },
                    { merge: true }
                );
            result.summary.industries.seeded++;
            console.log(`✓ Seeded industry: ${industry.industryId}`);
        } catch (error: any) {
            result.summary.industries.errors++;
            result.errors.push(`Industry ${industry.industryId}: ${error.message}`);
            console.error(`✗ Error seeding industry ${industry.industryId}:`, error.message);
        }
    }

    // Seed Business Functions
    console.log(`Seeding ${BUSINESS_FUNCTIONS.length} business functions...`);
    for (let i = 0; i < BUSINESS_FUNCTIONS.length; i++) {
        const func = BUSINESS_FUNCTIONS[i];
        try {
            await db
                .collection('systemTaxonomy')
                .doc('businessFunctions')
                .collection('items')
                .doc(func.functionId)
                .set(
                    {
                        ...func,
                        isActive: true,
                        sortOrder: i + 1,
                        createdAt: Timestamp.now(),
                        updatedAt: Timestamp.now(),
                    },
                    { merge: true }
                );
            result.summary.functions.seeded++;
            console.log(`✓ Seeded function: ${func.functionId}`);
        } catch (error: any) {
            result.summary.functions.errors++;
            result.errors.push(`Function ${func.functionId}: ${error.message}`);
            console.error(`✗ Error seeding function ${func.functionId}:`, error.message);
        }
    }

    // Seed Specializations
    console.log(`Seeding ${SPECIALIZATIONS.length} specializations...`);
    for (let i = 0; i < SPECIALIZATIONS.length; i++) {
        const spec = SPECIALIZATIONS[i];
        try {
            await db
                .collection('systemTaxonomy')
                .doc('specializations')
                .collection('items')
                .doc(spec.specializationId)
                .set(
                    {
                        ...spec,
                        isActive: true,
                        sortOrder: i + 1,
                        createdAt: Timestamp.now(),
                        updatedAt: Timestamp.now(),
                    },
                    { merge: true }
                );
            result.summary.specializations.seeded++;
            console.log(`✓ Seeded specialization: ${spec.specializationId}`);
        } catch (error: any) {
            result.summary.specializations.errors++;
            result.errors.push(`Specialization ${spec.specializationId}: ${error.message}`);
            console.error(`✗ Error seeding specialization ${spec.specializationId}:`, error.message);
        }
    }

    // Seed Country Overrides
    console.log(`Seeding ${COUNTRY_OVERRIDES.length} country overrides...`);
    for (let i = 0; i < COUNTRY_OVERRIDES.length; i++) {
        const override = COUNTRY_OVERRIDES[i];
        try {
            await db
                .collection('systemTaxonomy')
                .doc('countryOverrides')
                .collection('items')
                .doc(override.overrideId)
                .set(
                    {
                        ...override,
                        isActive: true,
                        sortOrder: i + 1,
                        createdAt: Timestamp.now(),
                        updatedAt: Timestamp.now(),
                    },
                    { merge: true }
                );
            result.summary.countryOverrides.seeded++;
            console.log(`✓ Seeded override: ${override.overrideId}`);
        } catch (error: any) {
            result.summary.countryOverrides.errors++;
            result.errors.push(`Override ${override.overrideId}: ${error.message}`);
            console.error(`✗ Error seeding override ${override.overrideId}:`, error.message);
        }
    }

    // Seed Broadcast Templates
    console.log(`Seeding ${SEED_BROADCAST_TEMPLATES.length} broadcast templates...`);
    for (let i = 0; i < SEED_BROADCAST_TEMPLATES.length; i++) {
        const template = SEED_BROADCAST_TEMPLATES[i];
        try {
            await db
                .collection('systemTaxonomy')
                .doc('broadcastTemplates')
                .collection('items')
                .doc(template.templateId)
                .set(
                    {
                        ...template,
                        createdAt: Timestamp.now(),
                        updatedAt: Timestamp.now(),
                    },
                    { merge: true }
                );
            result.summary.broadcastTemplates.seeded++;
            console.log(`✓ Seeded template: ${template.templateId}`);
        } catch (error: any) {
            result.summary.broadcastTemplates.errors++;
            result.errors.push(`Template ${template.templateId}: ${error.message}`);
            console.error(`✗ Error seeding template ${template.templateId}:`, error.message);
        }
    }

    // Set overall success based on whether we had any errors
    if (result.errors.length > 0) {
        result.success = false;
    }

    console.log('Seeding complete!');
    console.log('Summary:', result.summary);

    return result;
}

/**
 * Verify taxonomy seeding by counting documents
 */
export async function verifyTaxonomySeeding() {
    if (!db) {
        return {
            success: false,
            error: 'Database not initialized',
        };
    }

    console.log('Verifying taxonomy seeding...');

    try {
        const [
            industriesSnapshot,
            functionsSnapshot,
            specializationsSnapshot,
            overridesSnapshot,
            templatesSnapshot,
        ] = await Promise.all([
            db.collection('systemTaxonomy').doc('industries').collection('items').get(),
            db.collection('systemTaxonomy').doc('businessFunctions').collection('items').get(),
            db.collection('systemTaxonomy').doc('specializations').collection('items').get(),
            db.collection('systemTaxonomy').doc('countryOverrides').collection('items').get(),
            db.collection('systemTaxonomy').doc('broadcastTemplates').collection('items').get(),
        ]);

        const counts = {
            industries: industriesSnapshot.size,
            functions: functionsSnapshot.size,
            specializations: specializationsSnapshot.size,
            countryOverrides: overridesSnapshot.size,
            broadcastTemplates: templatesSnapshot.size,
        };

        console.log('Verification counts:', counts);

        return {
            success: true,
            counts,
        };
    } catch (error: any) {
        console.error('Error verifying taxonomy:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}
