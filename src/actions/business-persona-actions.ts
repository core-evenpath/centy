// src/actions/business-persona-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { invalidatePartnerBusinessCache } from '@/lib/cache-utils';
import { db } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type {
    BusinessPersona,
    BusinessIdentity,
    BusinessPersonality,
    CustomerProfile,
    BusinessKnowledge,
    SetupProgress,
    FrequentlyAskedQuestion,
    VoiceTone,
    CoreVisibilitySettings,
    OtherUsefulDataItem,
} from '@/lib/business-persona-types';
import { ProcessingStatus } from '@/lib/partnerhub-types';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

/**
 * Helper function to serialize Firestore data for client components
 * Converts Timestamp objects to ISO strings
 */
function serializeForClient(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }

    // Handle Firestore Timestamp
    if (obj instanceof Timestamp || (obj && typeof obj.toDate === 'function')) {
        return obj.toDate().toISOString();
    }

    // Handle Date objects
    if (obj instanceof Date) {
        return obj.toISOString();
    }

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => serializeForClient(item));
    }

    // Handle plain objects
    if (typeof obj === 'object') {
        const result: any = {};
        for (const key of Object.keys(obj)) {
            result[key] = serializeForClient(obj[key]);
        }
        return result;
    }

    // Return primitives as-is
    return obj;
}

/**
 * Calculate setup progress based on filled fields
 */
function calculateSetupProgress(data: Partial<BusinessPersona>): SetupProgress {
    const progress: SetupProgress = {
        basicInfo: false,
        contactInfo: false,
        operatingHours: false,
        businessDescription: false,
        customerProfile: false,
        productsServices: false,
        policies: false,
        faqs: false,
        overallPercentage: 0,
        nextRecommendedStep: 'basicInfo',
    };

    // Check basic info (name + industry)
    if (data.identity?.name && data.identity?.industry) {
        progress.basicInfo = true;
    }

    // Check contact info (at least phone or email + city)
    if ((data.identity?.phone || data.identity?.email) && data.identity?.address?.city) {
        progress.contactInfo = true;
    }

    // Check operating hours
    if (data.identity?.operatingHours?.isOpen24x7 ||
        data.identity?.operatingHours?.appointmentOnly ||
        data.identity?.operatingHours?.onlineAlways ||
        data.identity?.operatingHours?.schedule) {
        progress.operatingHours = true;
    }

    // Check business description (at least 30 chars)
    if (data.personality?.description && data.personality?.description.length > 30) {
        progress.businessDescription = true;
    }

    // Check customer profile
    if (data.customerProfile?.targetAudience || (data.customerProfile?.commonQueries?.length ?? 0) > 0) {
        progress.customerProfile = true;
    }

    // Check products/services (at least 1 with name)
    const products = data.knowledge?.productsOrServices || [];
    if (products.length > 0 && products.some(p => p.name && p.name.length > 0)) {
        progress.productsServices = true;
    }

    // Check policies
    if (data.knowledge?.policies && (
        data.knowledge.policies.returnPolicy ||
        data.knowledge.policies.refundPolicy ||
        data.knowledge.policies.cancellationPolicy ||
        (data.knowledge.policies.customPolicies?.length ?? 0) > 0
    )) {
        progress.policies = true;
    }

    // Check FAQs (at least 1 with answer)
    const faqs = data.knowledge?.faqs || [];
    if (faqs.length > 0 && faqs.some(f => f.question && f.answer && f.answer.length > 0)) {
        progress.faqs = true;
    }

    // Calculate overall percentage with weighted scoring
    const requiredSteps = ['basicInfo', 'contactInfo', 'operatingHours', 'businessDescription'] as const;
    const optionalSteps = ['productsServices', 'faqs'] as const;

    let score = 0;
    const requiredWeight = 20; // Each required step = 20%
    const optionalWeight = 10; // Each optional step = 10%

    // Required steps (80% total)
    requiredSteps.forEach(step => {
        if (progress[step]) score += requiredWeight;
    });

    // Optional steps (20% total)
    optionalSteps.forEach(step => {
        if (progress[step]) score += optionalWeight;
    });

    progress.overallPercentage = Math.min(100, score);

    // Find next recommended step (prioritize required first)
    const allSteps: (keyof SetupProgress)[] = [
        'basicInfo', 'contactInfo', 'operatingHours', 'businessDescription',
        'productsServices', 'faqs'
    ];
    for (const step of allSteps) {
        if (!progress[step]) {
            progress.nextRecommendedStep = step;
            break;
        }
    }

    return progress;
}

/**
 * Get the business persona for a partner
 */
export async function getBusinessPersonaAction(partnerId: string): Promise<{
    success: boolean;
    message: string;
    persona?: BusinessPersona | null;
    setupProgress?: SetupProgress;
    isNewPersona?: boolean;
}> {
    if (!db) {
        return { success: false, message: 'Database unavailable' };
    }

    try {
        const partnerDoc = await db.collection('partners').doc(partnerId).get();

        if (!partnerDoc.exists) {
            return { success: false, message: 'Partner not found' };
        }

        const partnerData = partnerDoc.data();

        // If businessPersona exists, return it
        if (partnerData?.businessPersona) {
            // Serialize to convert Firestore Timestamps to plain objects
            const persona = serializeForClient(partnerData.businessPersona) as BusinessPersona;
            const progress = calculateSetupProgress(persona);
            return {
                success: true,
                message: 'Business persona retrieved',
                persona,
                setupProgress: progress,
            };
        }

        // Otherwise, build a basic persona from existing partner data
        const basicPersona: Partial<BusinessPersona> = {
            identity: {
                name: partnerData?.businessName || partnerData?.name || '',
                industry: serializeForClient(partnerData?.industry) || null,
                email: partnerData?.email || '',
                phone: partnerData?.phone || '',
                whatsAppNumber: partnerData?.whatsAppPhone || '',
                address: partnerData?.location ? {
                    city: partnerData.location.city || '',
                    state: partnerData.location.state || '',
                    country: 'India',
                } : { city: '', state: '', country: 'India' },
                timezone: 'Asia/Kolkata',
                currency: partnerData?.currency || '', // No default - must be selected
                operatingHours: { isOpen24x7: false },
                lastUpdated: new Date() as any, // Will be serialized
                completenessScore: 0,
            },
            personality: {
                voiceTone: ['professional', 'friendly'] as VoiceTone[],
                communicationStyle: 'conversational',
                languagePreference: ['English'],
                description: '',
                uniqueSellingPoints: [],
                responseTimeExpectation: 'within_hour',
                escalationPreferences: {
                    escalateOnHumanRequest: true,
                    escalationKeywords: ['speak to human', 'talk to person', 'real person', 'human agent'],
                    escalateOnComplaint: true,
                    escalateOnUrgent: true,
                    escalationMessage: 'Let me connect you with a team member who can help you better.',
                },
            },
            customerProfile: {
                targetAudience: '',
                commonQueries: [],
                typicalJourneyStages: [],
                customerPainPoints: [],
            },
            knowledge: {
                productsOrServices: [],
                hasPricing: false,
                policies: {},
                faqs: [],
            },
        };

        const progress = calculateSetupProgress(basicPersona);

        // Return the built persona so the form is pre-populated with existing data
        return {
            success: true,
            message: 'Basic persona created from existing data',
            persona: serializeForClient(basicPersona),
            setupProgress: progress,
            isNewPersona: true, // Flag to indicate this is a new persona built from partner data
        };

    } catch (error: any) {
        console.error('Error fetching business persona:', error);
        return { success: false, message: `Failed to fetch: ${error.message}` };
    }
}

/**
 * Save/update the business persona
 */
export async function saveBusinessPersonaAction(
    partnerId: string,
    updates: Partial<BusinessPersona>,
    overwrite: boolean = false
): Promise<{
    success: boolean;
    message: string;
    setupProgress?: SetupProgress;
}> {
    // ADD THIS LOGGING
    console.log(`[SavePersona] Called for partner ${partnerId}`);
    console.log(`[SavePersona] Updates received:`, JSON.stringify(updates, null, 2));

    if (!db) {
        return { success: false, message: 'Database unavailable' };
    }

    try {
        const partnerRef = db.collection('partners').doc(partnerId);
        const partnerDoc = await partnerRef.get();

        if (!partnerDoc.exists) {
            return { success: false, message: 'Partner not found' };
        }

        const existingData = partnerDoc.data();
        // If overwrite is true, ignore existing persona data to allow full reset
        const existingPersona = overwrite ? {} : (existingData?.businessPersona || {});

        // Deep merge identity
        const mergedIdentity = {
            ...existingPersona.identity,
            ...updates.identity,
            address: {
                ...existingPersona.identity?.address,
                ...updates.identity?.address,
            },
            socialMedia: {
                ...existingPersona.identity?.socialMedia,
                ...updates.identity?.socialMedia,
            },
            operatingHours: {
                ...existingPersona.identity?.operatingHours,
                ...updates.identity?.operatingHours,
                schedule: {
                    ...existingPersona.identity?.operatingHours?.schedule,
                    ...updates.identity?.operatingHours?.schedule,
                },
            },
            lastUpdated: new Date(),
        };

        // Deep merge personality
        const mergedPersonality = {
            ...existingPersona.personality,
            ...updates.personality,
            escalationPreferences: {
                ...existingPersona.personality?.escalationPreferences,
                ...updates.personality?.escalationPreferences,
            },
        };

        // Deep merge knowledge
        const mergedKnowledge = {
            ...existingPersona.knowledge,
            ...updates.knowledge,
            policies: {
                ...existingPersona.knowledge?.policies,
                ...updates.knowledge?.policies,
            },
        };

        // Deep merge industrySpecificData (critical for all industry-specific fields)
        const mergedIndustrySpecificData = {
            ...existingPersona.industrySpecificData,
            ...updates.industrySpecificData,
        };

        // Deep merge restaurantInfo (for Food & Restaurant)
        const mergedRestaurantInfo = {
            ...existingPersona.restaurantInfo,
            ...updates.restaurantInfo,
        };

        // Deep merge hotelPolicies (for Hospitality)
        const mergedHotelPolicies = {
            ...existingPersona.hotelPolicies,
            ...updates.hotelPolicies,
            checkIn: {
                ...existingPersona.hotelPolicies?.checkIn,
                ...updates.hotelPolicies?.checkIn,
            },
            checkOut: {
                ...existingPersona.hotelPolicies?.checkOut,
                ...updates.hotelPolicies?.checkOut,
            },
        };

        // Merge updates with existing persona
        const updatedPersona = {
            ...existingPersona,
            identity: mergedIdentity,
            personality: mergedPersonality,
            customerProfile: {
                ...existingPersona.customerProfile,
                ...updates.customerProfile,
            },
            knowledge: mergedKnowledge,
            // Industry-specific data sections
            industrySpecificData: mergedIndustrySpecificData,
            restaurantInfo: mergedRestaurantInfo,
            hotelPolicies: mergedHotelPolicies,
            hotelAmenities: updates.hotelAmenities ?? existingPersona.hotelAmenities,
            // Inventory types (arrays - replace entirely if provided)
            healthcareServices: updates.healthcareServices ?? existingPersona.healthcareServices,
            diagnosticTests: updates.diagnosticTests ?? existingPersona.diagnosticTests,
            menuItems: updates.menuItems ?? existingPersona.menuItems,
            roomTypes: updates.roomTypes ?? existingPersona.roomTypes,
            propertyListings: updates.propertyListings ?? existingPersona.propertyListings,
            productCatalog: updates.productCatalog ?? existingPersona.productCatalog,
            // Import data - merge with existing
            importedData: updates.importedData !== undefined ? {
                ...existingPersona.importedData,
                ...updates.importedData,
            } : existingPersona.importedData,
            // Import history - merge with existing
            importHistory: updates.importHistory !== undefined ? {
                ...existingPersona.importHistory,
                ...updates.importHistory,
            } : existingPersona.importHistory,

            // === NEW FIELDS PERSISTENCE FIX ===
            // Web Intelligence (Other useful data, etc.)
            webIntelligence: updates.webIntelligence !== undefined ? {
                ...existingPersona.webIntelligence,
                ...updates.webIntelligence,
            } : existingPersona.webIntelligence,

            // Import Metadata (Unmapped data, field sources)
            _importMeta: updates._importMeta !== undefined ? {
                ...existingPersona._importMeta,
                ...updates._importMeta,
            } : existingPersona._importMeta,

            // AI Suggestions
            aiSuggestions: updates.aiSuggestions ?? existingPersona.aiSuggestions,

            // Tags
            tags: updates.tags ?? existingPersona.tags,

            // Custom Fields
            customFields: updates.customFields ?? existingPersona.customFields,

            // Courses (Education)
            courses: updates.courses ?? existingPersona.courses,

            // WhatsApp Sync
            whatsappSync: updates.whatsappSync !== undefined ? {
                ...existingPersona.whatsappSync,
                ...updates.whatsappSync,
            } : existingPersona.whatsappSync,
            // Timestamps and version
            updatedAt: new Date(),
            version: (existingPersona.version || 0) + 1,
            createdAt: existingPersona.createdAt || new Date(),
        };

        // Calculate new progress
        const setupProgress = calculateSetupProgress(updatedPersona);
        updatedPersona.setupProgress = setupProgress;
        updatedPersona.identity.completenessScore = setupProgress.overallPercentage;

        // Also update top-level partner fields for backward compatibility
        const topLevelUpdates: any = {
            businessPersona: updatedPersona,
            aiProfileCompleteness: setupProgress.overallPercentage,
            updatedAt: FieldValue.serverTimestamp(),
        };

        // Sync critical fields to top level for other systems that need them
        if (updates.identity?.name !== undefined) {
            topLevelUpdates.businessName = updates.identity.name;
            topLevelUpdates.name = updates.identity.name;
        }
        if (updates.identity?.phone !== undefined) {
            topLevelUpdates.phone = updates.identity.phone;
        }
        if (updates.identity?.email !== undefined) {
            topLevelUpdates.email = updates.identity.email;
        }
        if (updates.identity?.whatsAppNumber !== undefined) {
            topLevelUpdates.whatsAppPhone = updates.identity.whatsAppNumber;
        }
        if (updates.identity?.address) {
            const city = updates.identity.address.city;
            const state = updates.identity.address.state;

            topLevelUpdates.location = {
                city: city !== undefined ? city : (existingData?.location?.city || ''),
                state: state !== undefined ? state : (existingData?.location?.state || ''),
            };
        }
        if (updates.identity?.industry !== undefined) {
            topLevelUpdates.industry = updates.identity.industry;
        }

        // After building updatedPersona, before the partnerRef.update call:
        console.log(`[SavePersona] Merged persona identity:`, JSON.stringify(updatedPersona.identity, null, 2));
        console.log(`[SavePersona] Writing to Firestore...`);

        await partnerRef.update(topLevelUpdates);

        // Track significant changes and regenerate profile summary
        try {
            const { trackProfileChangeAction, generateProfileSummaryDocumentAction } = await import('./profile-sync-actions');

            // Track changes for key fields
            const fieldsToTrack = [
                { path: 'identity.name', update: updates.identity?.name, existing: existingPersona.identity?.name },
                { path: 'identity.phone', update: updates.identity?.phone, existing: existingPersona.identity?.phone },
                { path: 'identity.email', update: updates.identity?.email, existing: existingPersona.identity?.email },
                { path: 'personality.description', update: updates.personality?.description, existing: existingPersona.personality?.description },
                { path: 'personality.tagline', update: updates.personality?.tagline, existing: existingPersona.personality?.tagline },
                { path: 'knowledge.productsOrServices', update: updates.knowledge?.productsOrServices, existing: existingPersona.knowledge?.productsOrServices },
            ];

            let hasSignificantChange = false;
            for (const field of fieldsToTrack) {
                if (field.update !== undefined && JSON.stringify(field.update) !== JSON.stringify(field.existing)) {
                    await trackProfileChangeAction(partnerId, field.path, field.existing, field.update, 'manual');
                    hasSignificantChange = true;
                }
            }

            // Regenerate profile summary if significant changes were made
            if (hasSignificantChange) {
                // Don't await - run in background
                generateProfileSummaryDocumentAction(partnerId).catch(err =>
                    console.error('Error regenerating profile summary:', err)
                );
            }
        } catch (syncError) {
            // Don't fail the save if sync fails
            console.warn('Profile sync error (non-blocking):', syncError);
        }

        console.log(`✅ Business persona saved for partner ${partnerId} (${setupProgress.overallPercentage}% complete)`);

        try {
            await invalidatePartnerBusinessCache(partnerId);
        } catch (e) {
            console.error('Cache invalidation error:', e);
        }

        return {
            success: true,
            message: 'Business persona saved successfully',
            setupProgress,
        };

    } catch (error: any) {
        console.error('Error saving business persona:', error);
        return { success: false, message: `Failed to save: ${error.message}` };
    }
}

/**
 * Quick update for a specific section (for lazy updates)
 */
export async function quickUpdatePersonaSection(
    partnerId: string,
    section: 'identity' | 'personality' | 'customerProfile' | 'knowledge',
    data: any
): Promise<{
    success: boolean;
    message: string;
}> {
    if (!db) {
        return { success: false, message: 'Database unavailable' };
    }

    try {
        const partnerRef = db.collection('partners').doc(partnerId);

        await partnerRef.update({
            [`businessPersona.${section}`]: data,
            [`businessPersona.updatedAt`]: new Date(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        return { success: true, message: `${section} updated successfully` };

    } catch (error: any) {
        console.error(`Error updating ${section}:`, error);
        return { success: false, message: `Failed to update: ${error.message}` };
    }
}

/**
 * Add a FAQ
 */
export async function addFAQAction(
    partnerId: string,
    faq: FrequentlyAskedQuestion
): Promise<{
    success: boolean;
    message: string;
}> {
    if (!db) {
        return { success: false, message: 'Database unavailable' };
    }

    try {
        const partnerRef = db.collection('partners').doc(partnerId);

        await partnerRef.update({
            'businessPersona.knowledge.faqs': FieldValue.arrayUnion(faq),
            'businessPersona.updatedAt': new Date(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        return { success: true, message: 'FAQ added successfully' };

    } catch (error: any) {
        console.error('Error adding FAQ:', error);
        return { success: false, message: `Failed to add FAQ: ${error.message}` };
    }
}

/**
 * Generate AI suggestions based on industry
 */
export async function generateAISuggestionsAction(
    partnerId: string,
    industryCategory: string
): Promise<{
    success: boolean;
    message: string;
    suggestions?: {
        faqs: FrequentlyAskedQuestion[];
        voiceTones: VoiceTone[];
        tagline: string;
        commonQueries: string[];
        suggestedUSPs: string[];
    };
}> {
    // For now, return industry-based suggestions
    // This can be enhanced with Gemini AI later

    const { INDUSTRY_PRESETS } = await import('@/lib/business-persona-types');
    const preset = INDUSTRY_PRESETS[industryCategory as keyof typeof INDUSTRY_PRESETS];

    if (!preset) {
        return { success: false, message: 'Industry not found' };
    }

    const suggestions = {
        faqs: preset.typicalQuestions.map((q, i) => ({
            id: `suggested-${i}`,
            question: q,
            answer: '', // User needs to fill this
            isAutoGenerated: true,
        })),
        voiceTones: preset.voiceSuggestion as VoiceTone[],
        tagline: `Your trusted partner for ${preset.name.toLowerCase()} solutions`,
        commonQueries: preset.typicalQuestions,
        suggestedUSPs: preset.suggestedUSPs || [],
    };

    return {
        success: true,
        message: 'Suggestions generated',
        suggestions,
    };
}

/**
 * Initialize persona for new signup
 */
export async function initializeBusinessPersonaAction(
    partnerId: string,
    initialData: {
        businessName: string;
        email: string;
        industry?: any;
    }
): Promise<{
    success: boolean;
    message: string;
}> {
    if (!db) {
        return { success: false, message: 'Database unavailable' };
    }

    try {
        const initialPersona: Partial<BusinessPersona> = {
            identity: {
                name: initialData.businessName,
                industry: initialData.industry || null,
                email: initialData.email,
                phone: '',
                timezone: 'Asia/Kolkata',
                currency: '', // No default - must be selected by user
                operatingHours: { isOpen24x7: false },
                lastUpdated: new Date(),
                completenessScore: 20,
            },
            personality: {
                voiceTone: ['professional', 'friendly'] as VoiceTone[],
                communicationStyle: 'conversational',
                languagePreference: ['English'],
                description: '',
                uniqueSellingPoints: [],
                responseTimeExpectation: 'within_hour',
                escalationPreferences: {
                    escalateOnHumanRequest: true,
                    escalationKeywords: ['speak to human', 'talk to person', 'real person', 'human agent'],
                    escalateOnComplaint: true,
                    escalateOnUrgent: true,
                    escalationMessage: 'Let me connect you with a team member who can help you better.',
                },
            },
            customerProfile: {
                targetAudience: '',
                commonQueries: [],
                typicalJourneyStages: [],
                customerPainPoints: [],
            },
            knowledge: {
                productsOrServices: [],
                hasPricing: false,
                policies: {},
                faqs: [],
            },
            setupProgress: {
                basicInfo: true,
                contactInfo: true,
                operatingHours: false,
                businessDescription: false,
                customerProfile: false,
                productsServices: false,
                policies: false,
                faqs: false,
                overallPercentage: 20,
                nextRecommendedStep: 'operatingHours',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 1,
        };

        await db.collection('partners').doc(partnerId).update({
            businessPersona: initialPersona,
            updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(`✅ Initialized business persona for partner ${partnerId}`);

        return { success: true, message: 'Business persona initialized' };

    } catch (error: any) {
        console.error('Error initializing persona:', error);
        return { success: false, message: `Failed to initialize: ${error.message}` };
    }
}

/**
 * Get a summary of the business persona for AI prompts
 */
export async function getBusinessPersonaSummaryAction(partnerId: string): Promise<{
    success: boolean;
    summary?: string;
    identity?: any;
    personality?: any;
    knowledge?: any;
}> {
    if (!db) {
        return { success: false };
    }

    try {
        const partnerDoc = await db.collection('partners').doc(partnerId).get();

        if (!partnerDoc.exists) {
            return { success: false };
        }

        const partnerData = partnerDoc.data();
        const rawPersona = partnerData?.businessPersona;

        if (!rawPersona) {
            // Fall back to basic partner data
            return {
                success: true,
                summary: `Business: ${partnerData?.businessName || partnerData?.name || 'Unknown'}`,
                identity: serializeForClient({
                    name: partnerData?.businessName || partnerData?.name,
                    phone: partnerData?.phone,
                    email: partnerData?.email,
                    location: partnerData?.location,
                }),
            };
        }

        // Serialize persona for client
        const persona = serializeForClient(rawPersona);

        // Build a comprehensive summary
        const parts: string[] = [];

        // Identity
        if (persona.identity?.name) {
            parts.push(`Business: ${persona.identity.name}`);
        }
        if (persona.personality?.tagline) {
            parts.push(`Tagline: ${persona.personality.tagline}`);
        }
        if (persona.personality?.description) {
            parts.push(`About: ${persona.personality.description}`);
        }
        if (persona.identity?.industry?.name) {
            parts.push(`Industry: ${persona.identity.industry.name}`);
        }

        // Contact
        if (persona.identity?.phone) {
            parts.push(`Phone: ${persona.identity.phone}`);
        }
        if (persona.identity?.email) {
            parts.push(`Email: ${persona.identity.email}`);
        }
        if (persona.identity?.address?.city && persona.identity?.address?.state) {
            parts.push(`Location: ${persona.identity.address.city}, ${persona.identity.address.state}`);
        }
        if (persona.identity?.website) {
            parts.push(`Website: ${persona.identity.website}`);
        }

        // Hours
        if (persona.identity?.operatingHours?.isOpen24x7) {
            parts.push(`Hours: Open 24/7`);
        } else if (persona.identity?.operatingHours?.appointmentOnly) {
            parts.push(`Hours: By appointment only`);
        } else if (persona.identity?.operatingHours?.specialNote) {
            parts.push(`Hours: ${persona.identity.operatingHours.specialNote}`);
        }

        // USPs
        if (persona.personality?.uniqueSellingPoints?.length > 0) {
            parts.push(`Specialties: ${persona.personality.uniqueSellingPoints.join(', ')}`);
        }

        // Products
        if (persona.knowledge?.productsOrServices?.length > 0) {
            const products = persona.knowledge.productsOrServices
                .slice(0, 5)
                .map((p: any) => p.name)
                .filter(Boolean)
                .join(', ');
            if (products) {
                parts.push(`Offerings: ${products}`);
            }
        }

        // Payment methods
        if (persona.knowledge?.policies?.acceptedPayments?.length > 0) {
            parts.push(`Payment: ${persona.knowledge.policies.acceptedPayments.join(', ')}`);
        }

        return {
            success: true,
            summary: parts.join('\n'),
            identity: persona.identity,
            personality: persona.personality,
            knowledge: persona.knowledge,
        };

    } catch (error: any) {

        console.error('Error getting persona summary:', error);
        return { success: false };
    }
}

/**
 * Chat with the Business Persona Manager AI
 * Allows users to ask questions, simulate interactions, and DIRECTLY update the profile via chat (Vibe Coding).
 * Now includes RAG context from Partner Knowledge Base.
 */
export async function chatWithPersonaManagerAction(
    partnerId: string,
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    currentPersona: BusinessPersona
): Promise<{ success: boolean; response?: string; message?: string; dataUpdated?: boolean }> {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return { success: false, message: 'API Key missing' };
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Fetch Knowledge Base Documents (RAG / Long Context)
        let documentContext = "";
        try {
            const docsSnapshot = await db.collection('partners').doc(partnerId).collection('hubDocuments')
                .where('status', '==', ProcessingStatus.COMPLETED)
                .limit(20) // 1.5 Flash has 1M context, safe to load many docs
                .get();

            const snippets = docsSnapshot.docs
                .map(doc => {
                    const data = doc.data();
                    // Truncate individual docs slightly to ensure we don't hit edge cases if they are massive books
                    const text = data.extractedText ? data.extractedText.substring(0, 30000) : "";
                    return text ? `[Document: ${data.name}]\n${text} ` : null;
                })
                .filter(Boolean);

            if (snippets.length > 0) {
                documentContext = snippets.join('\n\n---\n\n');
            }
        } catch (e) {
            console.warn("[PersonaManager] Failed to fetch document context:", e);
        }

        // Define Tools for Vibe Coding
        const tools = [
            {
                functionDeclarations: [
                    {
                        name: "update_business_profile",
                        description: "Updates a specific field in the business persona/profile. Use this to Apply user changes.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                field: {
                                    type: SchemaType.STRING,
                                    description: "The dot-notation path to update (e.g., 'identity.name', 'personality.voiceTone', 'knowledge.acceptedPayments', 'identity.address.country')."
                                },
                                value: {
                                    type: SchemaType.STRING,
                                    description: "The value to set, serialized as a JSON string. e.g. '\"New Name\"' for strings, '[\"Cash\"]' for arrays."
                                }
                            },
                            required: ["field", "value"]
                        } as any
                    }
                ]
            }
        ];

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            tools: tools
        });

        // Construct System Prompt
        const systemPrompt = `You are the Business Manager AI for ${currentPersona.identity?.name || 'this business'}. 
Your role is to assist the business owner in configuring their Business Persona and understanding how their AI agents will behave.

CURRENT CONFIGURATION:
${JSON.stringify({
            identity: currentPersona.identity,
            personality: currentPersona.personality,
            knowledge: {
                productsOrServices: currentPersona.knowledge?.productsOrServices,
                faqs: currentPersona.knowledge?.faqs,
                acceptedPayments: currentPersona.knowledge?.acceptedPayments
            }
        }, null, 2)
            }

KNOWLEDGE BASE(UPLOADED DOCUMENTS):
${documentContext || "No documents available in Vault."}

        CAPABILITIES:
        1. EXPLAIN & CRITIQUE: Analyze settings and suggest improvements.
2. SIMULATION: If asked, pretend to be a Customer Support Agent using the current Voice & Tone.
3. VIBE CODING(UPDATES): You can DIRECTLY update the profile.
   - If the user says "Change name to XY", call 'update_business_profile'.
   - If user says "Add products from the Menu PDF", READ the Menu PDF in the Knowledge Base above, extract items, and update 'knowledge.productsOrServices'.
   - ALWAYS use valid JSON strings for the 'value' parameter.

            GUIDANCE:
            - Use the Knowledge Base to answer questions about the business's real data (e.g. "What's in my warranty doc ? ").
                - If updating from a document, be precise.
- Be helpful and professional.
- When you update something, confirm the change to the user.
- If the user request is ambiguous, ask for clarification before updating.
`;

        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: systemPrompt + "\n\nHello" }],
                },
                {
                    role: 'model',
                    parts: [{ text: "Hello! I am your Business Manager AI. I can update your profile directly. What would you like to change?" }],
                },
                ...messages.slice(0, -1).map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }]
                }) as any)
            ],
        });

        const result = await chat.sendMessage(messages[messages.length - 1].content);
        const response = result.response;
        const functionCalls = response.functionCalls();

        let finalResponseText = "";
        try {
            if (response.text) {
                finalResponseText = response.text();
            }
        } catch (e) {
            // Ignore if no text (e.g. only function call)
        }
        let dataUpdated = false;

        // Handle Tool Calls
        if (functionCalls && functionCalls.length > 0) {
            const toolParts = [];

            for (const call of functionCalls) {
                if (call.name === 'update_business_profile') {
                    const args = call.args as any;
                    const field = args.field;
                    let value = args.value;

                    console.log(`[VibeCoding] Request to update ${field} with raw value: `, value);

                    let parsedValue;
                    try {
                        // Cleanup if the model adds markdown code blocks or quotes to the value string inappropriately
                        if (typeof value === 'string') {
                            // Handle case where model surrounds JSON with code blocks
                            const cleaned = value.replace(/```json\n ?|\n ? ```/g, '').trim();
                            parsedValue = JSON.parse(cleaned);
                        } else {
                            parsedValue = value;
                        }
                    } catch (e) {
                        console.warn("[VibeCoding] JSON parse failed, using raw string.", e);
                        parsedValue = value;
                    }

                    // Execute Update
                    try {
                        const updatePath = `businessPersona.${field}`;
                        await db.collection('partners').doc(partnerId).update({
                            [updatePath]: parsedValue,
                            'businessPersona.identity.lastUpdated': FieldValue.serverTimestamp()
                        });

                        dataUpdated = true;

                        toolParts.push({
                            functionResponse: {
                                name: 'update_business_profile',
                                response: {
                                    name: 'update_business_profile',
                                    content: { success: true, message: `Successfully updated ${field}.` }
                                }
                            }
                        });
                    } catch (err: any) {
                        console.error("[VibeCoding] DB Error:", err);
                        toolParts.push({
                            functionResponse: {
                                name: 'update_business_profile',
                                response: {
                                    name: 'update_business_profile',
                                    content: { success: false, message: `Failed to update: ${err.message} ` }
                                }
                            }
                        });
                    }
                }
            }

            if (toolParts.length > 0) {
                const result2 = await chat.sendMessage(toolParts as any);
                finalResponseText = result2.response.text();
            }
        }

        return { success: true, response: finalResponseText, dataUpdated };

    } catch (error: any) {
        console.error('Error in chatWithPersonaManagerAction:', error);
        return { success: false, message: error.message };
    }
}
// ==============================================
// CORE VISIBILITY ACTIONS
// ==============================================

/**
 * Get data that Core can access based on visibility settings
 * This is what AI/RAG systems should call, NOT getBusinessPersonaAction
 */
export async function getCoreAccessibleDataAction(
    partnerId: string
): Promise<{
    success: boolean;
    data?: {
        identity?: Partial<BusinessIdentity>;
        personality?: Partial<BusinessPersonality>;
        knowledge?: Partial<BusinessKnowledge>;
        customerProfile?: Partial<CustomerProfile>;
        otherUsefulData?: OtherUsefulDataItem[];
        summary: string;
    };
    message?: string;
}> {
    if (!db) {
        return { success: false, message: 'Database unavailable' };
    }

    try {
        const fetchTimestamp = Date.now();
        console.log(`[CoreData] Fetching fresh data for ${partnerId} at ${fetchTimestamp}`);

        const partnerDoc = await db.collection('partners').doc(partnerId).get();

        console.log(`[CoreData] Document exists: ${partnerDoc.exists}, updateTime: ${partnerDoc.updateTime?.toDate()}`);

        if (!partnerDoc.exists) {
            return { success: false, message: 'Partner not found' };
        }

        const partnerData = partnerDoc.data();
        const persona = partnerData?.businessPersona;

        if (!persona) {
            return { success: false, message: 'No business persona configured' };
        }

        // Get visibility settings (default to all visible)
        const visibility: CoreVisibilitySettings = persona.coreVisibility || {
            sections: {
                identity: true,
                personality: true,
                knowledge: true,
                customerProfile: true,
                webIntelligence: true,
                industrySpecificData: true,
                otherUsefulData: true,
            },
            fields: {},
            lastUpdatedAt: new Date().toISOString(),
            lastUpdatedBy: 'system',
        };

        // Build accessible data based on visibility
        const accessibleData: any = {};
        const summaryParts: string[] = [];

        if (visibility.sections.identity !== false && persona.identity) {
            accessibleData.identity = persona.identity;
            if (persona.identity.name) summaryParts.push(`Business: ${persona.identity.name}`);
            if (persona.identity.phone) summaryParts.push(`Phone: ${persona.identity.phone}`);
            if (persona.identity.email) summaryParts.push(`Email: ${persona.identity.email}`);
            if (persona.identity.address?.city) {
                summaryParts.push(`Location: ${persona.identity.address.city}, ${persona.identity.address.state || ''}`);
            }
        }

        if (visibility.sections.personality !== false && persona.personality) {
            accessibleData.personality = persona.personality;
            if (persona.personality.tagline) summaryParts.push(`Tagline: ${persona.personality.tagline}`);
            if (persona.personality.description) summaryParts.push(`About: ${persona.personality.description}`);
        }

        if (visibility.sections.knowledge !== false && persona.knowledge) {
            accessibleData.knowledge = persona.knowledge;
            const products = persona.knowledge.productsOrServices?.slice(0, 5)?.map((p: any) => p.name).filter(Boolean);
            if (products?.length) summaryParts.push(`Offerings: ${products.join(', ')}`);
        }

        if (visibility.sections.customerProfile !== false && persona.customerProfile) {
            accessibleData.customerProfile = persona.customerProfile;
        }

        if (visibility.sections.industrySpecificData !== false && persona.industrySpecificData) {
            accessibleData.industrySpecificData = persona.industrySpecificData;
        }

        // Other useful data with individual visibility checks
        if (visibility.sections.otherUsefulData !== false) {
            const otherData = persona.otherUsefulData || persona.webIntelligence?.otherUsefulData || [];
            accessibleData.otherUsefulData = otherData.filter(
                (item: OtherUsefulDataItem) => item.visibleToCore !== false
            );

            if (accessibleData.otherUsefulData.length > 0) {
                summaryParts.push(`Additional context: ${accessibleData.otherUsefulData.length} items`);
            }
        }

        return {
            success: true,
            data: serializeForClient(
                filterDataByVisibility({
                    ...accessibleData,
                    summary: summaryParts.join('\n'),
                }, visibility.fields || {})
            ),
        };

    } catch (error: any) {
        console.error('Error getting core accessible data:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Get ALL business data for AI/RAG systems - NO visibility gating
 * This is what AI systems should call for comprehensive context
 * Includes: Business Profile + Module Items + FAQs
 */
export async function getCoreDataForAIAction(
    partnerId: string
): Promise<{
    success: boolean;
    data?: {
        businessContext: string;
        identity: any;
        personality: any;
        knowledge: any;
        moduleItems: Array<{
            moduleName: string;
            moduleSlug: string;
            items: Array<{
                name: string;
                description?: string;
                category: string;
                price?: number;
                currency?: string;
                fields: Record<string, any>;
                ragText?: string;
            }>;
        }>;
        faqs: Array<{ question: string; answer: string }>;
        rawData: any;
    };
    message?: string;
}> {
    if (!db) {
        return { success: false, message: 'Database unavailable' };
    }

    try {
        // 1. Fetch partner document
        const partnerDoc = await db.collection('partners').doc(partnerId).get();

        if (!partnerDoc.exists) {
            return { success: false, message: 'Partner not found' };
        }

        const partnerData = partnerDoc.data();
        const persona = partnerData?.businessPersona;

        // 2. Extract business profile sections (NO visibility checks)
        const identity = persona?.identity || {};
        const personality = persona?.personality || {};
        const knowledge = persona?.knowledge || {};
        const faqs = knowledge?.faqs || [];

        // 3. Fetch Module Items
        const moduleItems: Array<{
            moduleName: string;
            moduleSlug: string;
            items: Array<{
                name: string;
                description?: string;
                category: string;
                price?: number;
                currency?: string;
                fields: Record<string, any>;
                ragText?: string;
            }>;
        }> = [];

        try {
            const modulesSnapshot = await db
                .collection(`partners/${partnerId}/businessModules`)
                .where('enabled', '==', true)
                .get();

            for (const moduleDoc of modulesSnapshot.docs) {
                const moduleData = moduleDoc.data();
                // Simple query without orderBy to avoid composite index requirement
                const itemsSnapshot = await db
                    .collection(`partners/${partnerId}/businessModules/${moduleDoc.id}/items`)
                    .where('isActive', '==', true)
                    .limit(50)
                    .get();

                if (!itemsSnapshot.empty) {
                    const items = itemsSnapshot.docs.map(itemDoc => {
                        const item = itemDoc.data();
                        return {
                            name: item.name || '',
                            description: item.description || '',
                            category: item.category || 'General',
                            price: item.price,
                            currency: item.currency || 'INR',
                            fields: item.fields || {},
                            ragText: item.ragText || '',
                        };
                    });

                    moduleItems.push({
                        moduleName: moduleData.name || moduleData.moduleSlug,
                        moduleSlug: moduleData.moduleSlug,
                        items,
                    });
                }
            }
        } catch (moduleError) {
            console.error('[getCoreDataForAI] Error fetching module items:', moduleError);
        }

        // 4. Build comprehensive context string for AI
        const contextParts: string[] = [];

        // Business Identity
        if (identity.name) contextParts.push(`Business Name: ${identity.name}`);
        if (identity.phone) contextParts.push(`Phone: ${identity.phone}`);
        if (identity.email) contextParts.push(`Email: ${identity.email}`);
        if (identity.website) contextParts.push(`Website: ${identity.website}`);
        if (identity.whatsAppNumber) contextParts.push(`WhatsApp: ${identity.whatsAppNumber}`);

        if (identity.address?.city) {
            const addr = identity.address;
            const addressParts = [addr.street, addr.area, addr.city, addr.state, addr.postalCode || addr.pincode, addr.country].filter(Boolean);
            contextParts.push(`Address: ${addressParts.join(', ')}`);
        }

        // Operating Hours
        if (identity.operatingHours) {
            const hours = identity.operatingHours;
            if (hours.isOpen24x7) {
                contextParts.push('Operating Hours: Open 24/7');
            } else if (hours.appointmentOnly) {
                contextParts.push('Operating Hours: By Appointment Only');
            } else if (hours.schedule) {
                const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                const scheduleLines: string[] = [];
                for (const day of dayOrder) {
                    const sched = hours.schedule[day];
                    if (sched) {
                        const isOpen = sched.isOpen || (sched.openTime && sched.closeTime);
                        const openTime = sched.openTime || sched.open;
                        const closeTime = sched.closeTime || sched.close;
                        const dayName = day.charAt(0).toUpperCase() + day.slice(1);
                        if (isOpen && openTime && closeTime) {
                            scheduleLines.push(`  ${dayName}: ${openTime} - ${closeTime}`);
                        } else {
                            scheduleLines.push(`  ${dayName}: Closed`);
                        }
                    }
                }
                if (scheduleLines.length > 0) {
                    contextParts.push(`Operating Hours:\n${scheduleLines.join('\n')}`);
                }
            }
            if (hours.specialNote) contextParts.push(`Hours Note: ${hours.specialNote}`);
        }

        // Social Media
        if (identity.socialMedia) {
            const platforms = Object.entries(identity.socialMedia)
                .filter(([_, url]) => url && url !== '')
                .map(([platform, url]) => `${platform}: ${url}`);
            if (platforms.length > 0) contextParts.push(`Social Media:\n  ${platforms.join('\n  ')}`);
        }

        // Industry
        if (identity.industry) {
            const ind = identity.industry;
            if (typeof ind === 'string') {
                contextParts.push(`Industry: ${ind}`);
            } else if (ind.name || ind.category) {
                contextParts.push(`Industry: ${ind.category ? ind.category.replace(/_/g, ' ') : ''} ${ind.name ? '- ' + ind.name : ''}`);
            }
        }

        if (identity.currency) contextParts.push(`Currency: ${identity.currency}`);
        if (identity.timezone) contextParts.push(`Timezone: ${identity.timezone}`);

        // Brand & Personality
        if (personality.tagline) contextParts.push(`Tagline: ${personality.tagline}`);
        if (personality.description) contextParts.push(`About: ${personality.description}`);
        if (personality.uniqueSellingPoints?.length > 0) {
            contextParts.push(`Unique Selling Points:\n  - ${personality.uniqueSellingPoints.join('\n  - ')}`);
        }
        if (personality.voiceTone?.length > 0) contextParts.push(`Communication Style: ${personality.voiceTone.join(', ')}`);
        if (personality.brandValues?.length > 0) contextParts.push(`Brand Values: ${personality.brandValues.join(', ')}`);
        if (personality.languagePreference?.length > 0) contextParts.push(`Languages: ${personality.languagePreference.join(', ')}`);

        // Products & Services from knowledge section
        if (knowledge.productsOrServices?.length > 0) {
            const productLines = knowledge.productsOrServices.map((p: any) => {
                let line = p.name;
                if (p.priceRange) line += ` (${p.priceRange})`;
                if (p.description) line += ` - ${p.description}`;
                return `  - ${line}`;
            });
            contextParts.push(`Products/Services:\n${productLines.join('\n')}`);
        }

        // Module Items (Products, Menu Items, Services, etc.)
        if (moduleItems.length > 0) {
            for (const module of moduleItems) {
                const itemLines = module.items.slice(0, 30).map((item: any) => {
                    // Prefer ragText (pre-formatted with all schema fields) over manual formatting
                    if (item.ragText) {
                        return `  - ${item.ragText}`;
                    }
                    let line = `  - ${item.name}`;
                    if (item.price) line += ` (${item.currency} ${item.price})`;
                    if (item.description) line += `: ${item.description}`;
                    // Include dynamic fields
                    if (item.fields && Object.keys(item.fields).length > 0) {
                        const fieldParts = Object.entries(item.fields)
                            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
                            .map(([k, v]) => {
                                if (Array.isArray(v)) return `${k}: ${(v as any[]).join(', ')}`;
                                if (typeof v === 'boolean') return v ? k : '';
                                return `${k}: ${v}`;
                            })
                            .filter(Boolean);
                        if (fieldParts.length > 0) line += ` | ${fieldParts.join(', ')}`;
                    }
                    return line;
                });
                contextParts.push(`\n${module.moduleName}:\n${itemLines.join('\n')}`);
            }
        }

        // FAQs
        if (faqs.length > 0) {
            const faqLines = faqs.slice(0, 10).map((faq: any) =>
                `Q: ${faq.question || faq.q}\nA: ${faq.answer || faq.a}`
            );
            contextParts.push(`\nFrequently Asked Questions:\n${faqLines.join('\n\n')}`);
        }

        // Pricing
        if (knowledge.pricingModel) contextParts.push(`Pricing Model: ${knowledge.pricingModel}`);
        if (knowledge.pricingHighlights) contextParts.push(`Pricing Info: ${knowledge.pricingHighlights}`);
        if (knowledge.acceptedPayments?.length > 0) {
            contextParts.push(`Accepted Payments: ${knowledge.acceptedPayments.join(', ')}`);
        }

        // Policies
        if (knowledge.policies) {
            const policyLines: string[] = [];
            Object.entries(knowledge.policies).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    const label = key.replace(/([A-Z])/g, ' $1').trim();
                    if (typeof value === 'boolean') {
                        policyLines.push(`${label}: ${value ? 'Yes' : 'No'}`);
                    } else {
                        policyLines.push(`${label}: ${value}`);
                    }
                }
            });
            if (policyLines.length > 0) {
                contextParts.push(`\nPolicies:\n  - ${policyLines.join('\n  - ')}`);
            }
        }

        // Current Offers
        if (knowledge.currentOffers?.length > 0) {
            contextParts.push(`Current Offers:\n  - ${knowledge.currentOffers.join('\n  - ')}`);
        }

        // Customer Profile
        const customerProfile = persona?.customerProfile;
        if (customerProfile) {
            if (customerProfile.targetAudience) contextParts.push(`Target Audience: ${customerProfile.targetAudience}`);
            if (customerProfile.customerPainPoints?.length > 0) {
                contextParts.push(`Common Customer Pain Points:\n  - ${customerProfile.customerPainPoints.join('\n  - ')}`);
            }
        }

        // Other Useful Data
        const otherData = persona?.otherUsefulData || [];
        if (otherData.length > 0) {
            const otherLines = otherData
                .filter((item: any) => item.visibleToCore !== false)
                .map((item: any) => `${item.key}: ${item.value}`);
            if (otherLines.length > 0) {
                contextParts.push(`Additional Information:\n  - ${otherLines.join('\n  - ')}`);
            }
        }

        const businessContext = contextParts.join('\n');

        console.log(`[getCoreDataForAI] Partner: ${partnerId}, Modules: ${moduleItems.length}, Total items: ${moduleItems.reduce((sum, m) => sum + m.items.length, 0)}, Context: ${businessContext.length} chars`);

        return {
            success: true,
            data: {
                businessContext,
                identity,
                personality,
                knowledge,
                moduleItems,
                faqs,
                rawData: persona,
            },
        };

    } catch (error: any) {
        console.error('[getCoreDataForAI] Error:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Update Core visibility settings
 */
export async function updateCoreVisibilityAction(
    partnerId: string,
    settings: Partial<CoreVisibilitySettings>
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database unavailable' };
    }

    try {
        const partnerRef = db.collection('partners').doc(partnerId);
        const partnerDoc = await partnerRef.get();

        if (!partnerDoc.exists) {
            return { success: false, message: 'Partner not found' };
        }

        const existingData = partnerDoc.data();
        const existingVisibility = existingData?.businessPersona?.coreVisibility || {};
        const existingSections = existingVisibility.sections || {};

        const mergedSettings: CoreVisibilitySettings = {
            sections: {
                identity: true,
                personality: true,
                knowledge: true,
                customerProfile: true,
                webIntelligence: true,
                industrySpecificData: true,
                otherUsefulData: true,
                ...existingSections,
                ...(settings.sections || {}),
            },
            fields: {
                ...existingVisibility.fields,
                ...(settings.fields || {}),
            },
            fieldOverrides: {
                ...existingVisibility.fieldOverrides,
                ...(settings.fieldOverrides || {}),
            },
            lastUpdatedAt: settings.lastUpdatedAt || new Date().toISOString(),
            lastUpdatedBy: settings.lastUpdatedBy || 'user',
        };

        await partnerRef.update({
            'businessPersona.coreVisibility': mergedSettings,
            updatedAt: FieldValue.serverTimestamp(),
        });

        revalidatePath('/partner/settings');

        return { success: true, message: 'Visibility settings updated' };
    } catch (error: any) {
        console.error('Error updating visibility:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Clean data by removing disallowed fields recursively
 */
function filterDataByVisibility(data: any, fields: Record<string, boolean>, parentPath = ''): any {
    if (!data || typeof data !== 'object') {
        return data;
    }

    // Handle arrays (recurse into items)
    if (Array.isArray(data)) {
        return data.map((item: any) => filterDataByVisibility(item, fields, parentPath));
    }

    // Handle Date/Timestamp objects (return as is, serialization happens later)
    if (data instanceof Date || (data && typeof data.toDate === 'function')) {
        return data;
    }

    const filtered: any = {};

    for (const key of Object.keys(data)) {
        // Construct path
        const currentPath = parentPath ? `${parentPath}.${key}` : key;

        // Check if explicitly hidden
        if (fields[currentPath] === false) {
            continue;
        }

        // Check if this is a nested object that needs recursion
        if (typeof data[key] === 'object' && data[key] !== null) {
            filtered[key] = filterDataByVisibility(data[key], fields, currentPath);
        } else {
            filtered[key] = data[key];
        }
    }

    return filtered;
}


/**
 * Toggle visibility for a single "Other Useful Data" item
 */
export async function toggleOtherDataVisibilityAction(
    partnerId: string,
    itemId: string,
    visible: boolean
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database unavailable' };
    }

    try {
        const partnerRef = db.collection('partners').doc(partnerId);
        const partnerDoc = await partnerRef.get();

        if (!partnerDoc.exists) {
            return { success: false, message: 'Partner not found' };
        }

        const data = partnerDoc.data();
        const otherData = data?.businessPersona?.otherUsefulData || [];

        const updatedData = otherData.map((item: OtherUsefulDataItem) =>
            item.id === itemId ? { ...item, visibleToCore: visible } : item
        );

        await partnerRef.update({
            'businessPersona.otherUsefulData': updatedData,
            updatedAt: FieldValue.serverTimestamp(),
        });

        return { success: true, message: 'Item visibility updated' };
    } catch (error: any) {
        console.error('Error toggling visibility:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Add manual "Other Useful Data" item
 */
export async function addOtherUsefulDataAction(
    partnerId: string,
    item: Omit<OtherUsefulDataItem, 'id' | 'importedAt'>
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database unavailable' };
    }

    try {
        const newItem: OtherUsefulDataItem = {
            ...item,
            id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            importedAt: new Date().toISOString(),
            visibleToCore: item.visibleToCore ?? true,
        };

        const partnerRef = db.collection('partners').doc(partnerId);

        await partnerRef.update({
            'businessPersona.otherUsefulData': FieldValue.arrayUnion(newItem),
            updatedAt: FieldValue.serverTimestamp(),
        });

        return { success: true, message: 'Data added successfully' };
    } catch (error: any) {
        console.error('Error adding other data:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Delete "Other Useful Data" item
 */
export async function deleteOtherUsefulDataAction(
    partnerId: string,
    itemId: string
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database unavailable' };
    }

    try {
        const partnerRef = db.collection('partners').doc(partnerId);
        const partnerDoc = await partnerRef.get();

        if (!partnerDoc.exists) {
            return { success: false, message: 'Partner not found' };
        }

        const data = partnerDoc.data();
        const otherData = data?.businessPersona?.otherUsefulData || [];
        const updatedData = otherData.filter((item: OtherUsefulDataItem) => item.id !== itemId);

        await partnerRef.update({
            'businessPersona.otherUsefulData': updatedData,
            updatedAt: FieldValue.serverTimestamp(),
        });

        return { success: true, message: 'Item deleted' };
    } catch (error: any) {
        console.error('Error deleting other data:', error);
        return { success: false, message: error.message };
    }
}
