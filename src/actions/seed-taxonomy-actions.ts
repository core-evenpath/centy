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
    timestamp: string;
}

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
        timestamp: new Date().toISOString(),
    };

    if (!db) {
        result.success = false;
        result.errors.push('Database not initialized');
        return result;
    }

    console.log('🚀 Starting systemTaxonomy seeding with batch operations...');

    try {
        // ========================================
        // SEED INDUSTRIES
        // ========================================
        console.log(`📦 Seeding ${INDUSTRIES.length} industries...`);

        const industriesBatch = db.batch();
        const industriesRef = db.collection('systemTaxonomy').doc('industries').collection('items');

        INDUSTRIES.forEach((industry, index) => {
            const docRef = industriesRef.doc(industry.industryId);
            industriesBatch.set(docRef, {
                industryId: industry.industryId,
                name: industry.name,
                description: industry.description || '',
                iconName: industry.iconName,
                isActive: true,
                sortOrder: index + 1,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            }, { merge: true });
        });

        await industriesBatch.commit();
        result.summary.industries.seeded = INDUSTRIES.length;
        console.log(`✅ Seeded ${INDUSTRIES.length} industries`);

        // ========================================
        // SEED BUSINESS FUNCTIONS (in batches of 450)
        // ========================================
        console.log(`📦 Seeding ${BUSINESS_FUNCTIONS.length} business functions...`);

        const functionsRef = db.collection('systemTaxonomy').doc('businessFunctions').collection('items');
        const functionBatches = chunkArray(BUSINESS_FUNCTIONS, 450); // Firestore batch limit is 500

        for (const batch of functionBatches) {
            const functionsBatch = db.batch();
            batch.forEach((func, index) => {
                const globalIndex = BUSINESS_FUNCTIONS.indexOf(func);
                const docRef = functionsRef.doc(func.functionId);
                functionsBatch.set(docRef, {
                    functionId: func.functionId,
                    industryId: func.industryId,
                    name: func.name,
                    description: func.description || '',
                    googlePlacesTypes: func.googlePlacesTypes || [],
                    keywords: func.keywords || [],
                    isActive: true,
                    sortOrder: globalIndex + 1,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                }, { merge: true });
            });
            await functionsBatch.commit();
        }

        result.summary.functions.seeded = BUSINESS_FUNCTIONS.length;
        console.log(`✅ Seeded ${BUSINESS_FUNCTIONS.length} business functions`);

        // ========================================
        // SEED SPECIALIZATIONS
        // ========================================
        console.log(`📦 Seeding ${SPECIALIZATIONS.length} specializations...`);

        const specializationsRef = db.collection('systemTaxonomy').doc('specializations').collection('items');
        const specBatches = chunkArray(SPECIALIZATIONS, 450);

        for (const batch of specBatches) {
            const specBatch = db.batch();
            batch.forEach((spec, index) => {
                const globalIndex = SPECIALIZATIONS.indexOf(spec);
                const docRef = specializationsRef.doc(spec.specializationId);
                specBatch.set(docRef, {
                    specializationId: spec.specializationId,
                    functionId: spec.functionId,
                    name: spec.name,
                    isActive: true,
                    sortOrder: globalIndex + 1,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                }, { merge: true });
            });
            await specBatch.commit();
        }

        result.summary.specializations.seeded = SPECIALIZATIONS.length;
        console.log(`✅ Seeded ${SPECIALIZATIONS.length} specializations`);

        // ========================================
        // SEED COUNTRY OVERRIDES
        // ========================================
        console.log(`📦 Seeding ${COUNTRY_OVERRIDES.length} country overrides...`);

        const overridesRef = db.collection('systemTaxonomy').doc('countryOverrides').collection('items');
        const overrideBatches = chunkArray(COUNTRY_OVERRIDES, 450);

        for (const batch of overrideBatches) {
            const overridesBatch = db.batch();
            batch.forEach((override, index) => {
                const globalIndex = COUNTRY_OVERRIDES.indexOf(override);
                const docRef = overridesRef.doc(override.overrideId);
                overridesBatch.set(docRef, {
                    overrideId: override.overrideId,
                    functionId: override.functionId,
                    countryCode: override.countryCode,
                    localLabel: override.localLabel,
                    aliases: override.aliases || [],
                    regulationLevel: override.regulationLevel || 'low',
                    // Optional field in overrides
                    // googlePlacesTypes: override.googlePlacesTypes || [], 
                    isActive: true,
                    sortOrder: globalIndex + 1,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                }, { merge: true });
            });
            await overridesBatch.commit();
        }

        result.summary.countryOverrides.seeded = COUNTRY_OVERRIDES.length;
        console.log(`✅ Seeded ${COUNTRY_OVERRIDES.length} country overrides`);

        // ========================================
        // SEED BROADCAST TEMPLATES
        // ========================================
        console.log(`📦 Seeding ${SEED_BROADCAST_TEMPLATES.length} broadcast templates...`);

        const templatesRef = db.collection('systemTaxonomy').doc('broadcastTemplates').collection('items');
        const templateBatches = chunkArray(SEED_BROADCAST_TEMPLATES, 450);

        for (const batch of templateBatches) {
            const templatesBatch = db.batch();
            batch.forEach((template, index) => {
                const docRef = templatesRef.doc(template.templateId);
                templatesBatch.set(docRef, {
                    ...template,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                }, { merge: true });
            });
            await templatesBatch.commit();
        }

        result.summary.broadcastTemplates.seeded = SEED_BROADCAST_TEMPLATES.length;
        console.log(`✅ Seeded ${SEED_BROADCAST_TEMPLATES.length} broadcast templates`);

        // ========================================
        // UPDATE METADATA DOC
        // ========================================
        await db.collection('systemTaxonomy').doc('_metadata').set({
            lastSeededAt: Timestamp.now(),
            version: '2.0.0',
            counts: {
                industries: INDUSTRIES.length,
                functions: BUSINESS_FUNCTIONS.length,
                specializations: SPECIALIZATIONS.length,
                countryOverrides: COUNTRY_OVERRIDES.length,
                broadcastTemplates: SEED_BROADCAST_TEMPLATES.length,
            },
            source: 'code-sync',
        }, { merge: true });

        console.log('🎉 Taxonomy seeding complete!');

    } catch (error: any) {
        result.success = false;
        result.errors.push(error.message);
        console.error('❌ Seeding error:', error);
    }

    return result;
}

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

export async function verifyTaxonomySeeding(): Promise<{
    success: boolean;
    counts: {
        industries: number;
        functions: number;
        specializations: number;
        countryOverrides: number;
        broadcastTemplates: number;
    };
    expected: {
        industries: number;
        functions: number;
        specializations: number;
        countryOverrides: number;
        broadcastTemplates: number;
    };
    inSync: boolean;
    lastSeededAt?: string;
}> {
    if (!db) {
        return {
            success: false,
            counts: { industries: 0, functions: 0, specializations: 0, countryOverrides: 0, broadcastTemplates: 0 },
            expected: {
                industries: INDUSTRIES.length,
                functions: BUSINESS_FUNCTIONS.length,
                specializations: SPECIALIZATIONS.length,
                countryOverrides: COUNTRY_OVERRIDES.length,
                broadcastTemplates: SEED_BROADCAST_TEMPLATES.length,
            },
            inSync: false,
        };
    }

    try {
        const [industriesSnap, functionsSnap, specsSnap, overridesSnap, templatesSnap, metaSnap] = await Promise.all([
            db.collection('systemTaxonomy').doc('industries').collection('items').get(),
            db.collection('systemTaxonomy').doc('businessFunctions').collection('items').get(),
            db.collection('systemTaxonomy').doc('specializations').collection('items').get(),
            db.collection('systemTaxonomy').doc('countryOverrides').collection('items').get(),
            db.collection('systemTaxonomy').doc('broadcastTemplates').collection('items').get(),
            db.collection('systemTaxonomy').doc('_metadata').get(),
        ]);

        const counts = {
            industries: industriesSnap.size,
            functions: functionsSnap.size,
            specializations: specsSnap.size,
            countryOverrides: overridesSnap.size,
            broadcastTemplates: templatesSnap.size,
        };

        const expected = {
            industries: INDUSTRIES.length,
            functions: BUSINESS_FUNCTIONS.length,
            specializations: SPECIALIZATIONS.length,
            countryOverrides: COUNTRY_OVERRIDES.length,
            broadcastTemplates: SEED_BROADCAST_TEMPLATES.length,
        };

        const inSync =
            counts.industries === expected.industries &&
            counts.functions === expected.functions &&
            counts.specializations === expected.specializations &&
            counts.countryOverrides === expected.countryOverrides &&
            counts.broadcastTemplates === expected.broadcastTemplates;

        const metadata = metaSnap.data();

        return {
            success: true,
            counts,
            expected,
            inSync,
            lastSeededAt: metadata?.lastSeededAt?.toDate?.()?.toISOString(),
        };
    } catch (error: any) {
        console.error('Verify error:', error);
        return {
            success: false,
            counts: { industries: 0, functions: 0, specializations: 0, countryOverrides: 0, broadcastTemplates: 0 },
            expected: {
                industries: INDUSTRIES.length,
                functions: BUSINESS_FUNCTIONS.length,
                specializations: SPECIALIZATIONS.length,
                countryOverrides: COUNTRY_OVERRIDES.length,
                broadcastTemplates: SEED_BROADCAST_TEMPLATES.length,
            },
            inSync: false,
        };
    }
}
