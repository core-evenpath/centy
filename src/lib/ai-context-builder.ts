import { db } from '@/lib/firebase-admin';
import { getCoreHubContext } from '@/actions/core-hub-actions';
import { queryVaultRAG } from '@/lib/rag-query-engine';
import { getSkillsForIndustry, getApplicableSkills, buildSkillsPrompt } from './industry-skills';

export interface AIContext {
    businessProfile: {
        name: string;
        industry: string;
        subcategory?: string;
        description?: string;
        hours?: string;
        phone?: string;
        email?: string;
        website?: string;
        address?: string;
        country?: string;
    };
    moduleItems: Array<{
        id: string;
        name: string;
        description?: string;
        price?: number | null;
        currency?: string;
        category?: string;
        sourceModule: string;
        isActive: boolean;
        metadata?: Record<string, any>;
    }>;
    ragResults: Array<{
        content: string;
        source: string;
        relevance?: number;
    }>;
    conversationHistory: Array<{
        role: 'customer' | 'business';
        content: string;
        timestamp: Date;
    }>;
    customerProfile?: {
        name?: string;
        email?: string;
        phone?: string;
        tags?: string[];
        notes?: string;
        previousInteractions?: number;
    };
    industrySkills: string;
}

export interface BuildContextOptions {
    partnerId: string;
    conversationId?: string;
    customerMessage: string;
    contactId?: string;
    maxHistoryMessages?: number;
    maxRagResults?: number;
}

export async function buildAIContext(options: BuildContextOptions): Promise<AIContext> {
    const {
        partnerId,
        conversationId,
        customerMessage,
        contactId,
        maxHistoryMessages = 10,
        maxRagResults = 5
    } = options;

    if (!db) {
        throw new Error('Database not available');
    }

    // 1. Fetch Business Profile
    const partnerDoc = await db.collection('partners').doc(partnerId).get();
    const partnerData = partnerDoc.data() || {};
    const persona = partnerData.businessPersona || {};
    const identity = persona.identity || {};
    const personality = persona.personality || {};

    // Build hours string
    let hoursStr = '';
    if (identity.operatingHours) {
        const oh = identity.operatingHours;
        if (oh.isOpen24x7) {
            hoursStr = 'Open 24/7';
        } else if (oh.appointmentOnly) {
            hoursStr = 'By Appointment Only';
        } else if (oh.schedule) {
            const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const parts: string[] = [];
            for (const day of dayOrder) {
                const sched = oh.schedule[day];
                if (sched && (sched.isOpen || (sched.openTime && sched.closeTime))) {
                    const dayName = day.charAt(0).toUpperCase() + day.slice(1);
                    parts.push(`${dayName}: ${sched.openTime}-${sched.closeTime}`);
                }
            }
            hoursStr = parts.join(', ');
        }
    }

    const businessProfile = {
        name: identity.name || partnerData.businessName || partnerData.name || '',
        industry: typeof identity.industry === 'string'
            ? identity.industry
            : identity.industry?.name || partnerData.industry || '',
        subcategory: identity.industry?.subcategory || partnerData.subcategory || '',
        description: personality.description || partnerData.description || '',
        hours: hoursStr || partnerData.businessHours || '',
        phone: identity.phone || partnerData.phone || '',
        email: identity.email || partnerData.email || '',
        website: identity.website || partnerData.website || '',
        address: identity.address ? [identity.address.street, identity.address.area, identity.address.city].filter(Boolean).join(', ') : '',
        country: identity.address?.country || partnerData.country || '',
    };

    // 2. Fetch Module Items
    const coreHubResult = await getCoreHubContext(partnerId);
    const moduleItems = (coreHubResult.success && coreHubResult.moduleItems)
        ? coreHubResult.moduleItems.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            currency: item.currency,
            category: item.category,
            sourceModule: item.sourceModule,
            isActive: item.isActive,
            metadata: item.metadata,
        }))
        : [];

    // 3. Query RAG Documents
    const ragResult = await queryVaultRAG(partnerId, customerMessage, { maxChunks: maxRagResults });
    const ragResults = (ragResult.success && ragResult.groundingChunks)
        ? ragResult.groundingChunks.map(chunk => ({
            content: chunk.content,
            source: chunk.source,
            relevance: chunk.score
        }))
        : [];

    // 4. Fetch Conversation History
    let conversationHistory: AIContext['conversationHistory'] = [];
    if (conversationId) {
        // Try metaWhatsAppMessages first, then telegramMessages
        let messagesSnapshot = await db
            .collection('partners')
            .doc(partnerId)
            .collection('metaWhatsAppMessages')
            .where('conversationId', '==', conversationId)
            .orderBy('timestamp', 'desc')
            .limit(maxHistoryMessages)
            .get();

        if (messagesSnapshot.empty) {
            messagesSnapshot = await db
                .collection('partners')
                .doc(partnerId)
                .collection('telegramMessages')
                .where('conversationId', '==', conversationId)
                .orderBy('timestamp', 'desc')
                .limit(maxHistoryMessages)
                .get();
        }

        conversationHistory = messagesSnapshot.docs
            .map(doc => {
                const data = doc.data();
                return {
                    role: data.direction === 'inbound' ? 'customer' : 'business',
                    content: data.content || '',
                    timestamp: data.timestamp?.toDate() || new Date(),
                };
            })
            .reverse() as AIContext['conversationHistory'];
    }

    // 5. Fetch Customer Profile
    let customerProfile: AIContext['customerProfile'] | undefined;
    if (contactId) {
        const contactDoc = await db.collection('partners').doc(partnerId).collection('contacts').doc(contactId).get();
        if (contactDoc.exists) {
            const data = contactDoc.data()!;
            customerProfile = {
                name: data.name,
                email: data.email,
                phone: data.phone,
                tags: data.tags,
                notes: data.notes,
                previousInteractions: data.interactionCount || 0,
            };
        }
    }

    // 6. Industry Skills
    const industrySkillsList = getSkillsForIndustry(businessProfile.industry);
    const applicableSkills = getApplicableSkills(industrySkillsList, customerMessage);
    const industrySkills = buildSkillsPrompt(applicableSkills);

    return {
        businessProfile,
        moduleItems,
        ragResults,
        conversationHistory,
        customerProfile,
        industrySkills,
    };
}
