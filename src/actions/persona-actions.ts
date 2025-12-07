"use server";

import { db } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import {
    ContactPersona,
    DEFAULT_CONTACT_PERSONA,
    PERSONA_GENERATION_THRESHOLD,
    CommunicationStyle,
    CustomerSentiment,
    CustomerStage
} from '@/lib/types-contact';
import { generatePersonaFromConversation, ConversationMessage } from '@/lib/persona-generator';

export async function triggerPersonaGenerationAction(
    partnerId: string,
    contactId: string,
    force: boolean = false
): Promise<{ success: boolean; message: string; persona?: ContactPersona }> {
    console.log(`🧠 Persona generation triggered for contact: ${contactId}`);

    try {
        if (!db) {
            return { success: false, message: 'Database unavailable' };
        }

        const contactRef = db.collection('partners').doc(partnerId).collection('contacts').doc(contactId);
        const contactDoc = await contactRef.get();

        if (!contactDoc.exists) {
            return { success: false, message: 'Contact not found' };
        }

        const contactData = contactDoc.data();
        const currentMessageCount = contactData?.totalMessageCount || 0;
        const lastGenerationCount = contactData?.persona?.generatedFromMessageCount || 0;
        const messagesSinceLastGeneration = currentMessageCount - lastGenerationCount;

        if (!force && messagesSinceLastGeneration < PERSONA_GENERATION_THRESHOLD) {
            return {
                success: false,
                message: `Not enough new messages. Need ${PERSONA_GENERATION_THRESHOLD - messagesSinceLastGeneration} more.`,
            };
        }

        await contactRef.update({
            personaGenerationStatus: 'generating',
        });

        const conversationsSnapshot = await db
            .collection('partners')
            .doc(partnerId)
            .collection('metaWhatsAppConversations')
            .where('contactId', '==', contactId)
            .limit(5)
            .get();

        const allMessages: ConversationMessage[] = [];

        for (const convDoc of conversationsSnapshot.docs) {
            const messagesSnapshot = await db
                .collection('partners')
                .doc(partnerId)
                .collection('metaWhatsAppMessages')
                .where('conversationId', '==', convDoc.id)
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            messagesSnapshot.docs.forEach(msgDoc => {
                const msgData = msgDoc.data();
                allMessages.push({
                    role: msgData.direction === 'inbound' ? 'customer' : 'business',
                    content: msgData.text || msgData.content || '',
                    timestamp: msgData.createdAt?.toDate() || new Date(),
                });
            });
        }

        allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        if (allMessages.length < 5) {
            await contactRef.update({
                personaGenerationStatus: 'failed',
            });
            return { success: false, message: 'Not enough messages to generate persona' };
        }

        const result = await generatePersonaFromConversation({
            contactName: contactData?.name || contactData?.customerName || 'Customer',
            contactEmail: contactData?.email,
            contactPhone: contactData?.phone,
            contactCompany: contactData?.company,
            messages: allMessages,
            existingPersona: contactData?.persona,
        });

        if (!result.success || !result.persona) {
            await contactRef.update({
                personaGenerationStatus: 'failed',
            });
            return { success: false, message: result.error || 'Persona generation failed' };
        }

        const personaWithTimestamp = {
            ...result.persona,
            generatedAt: Timestamp.now(),
            generatedFromMessageCount: currentMessageCount,
        };

        await contactRef.update({
            persona: personaWithTimestamp,
            personaGenerationStatus: 'completed',
            lastPersonaGenerationAt: Timestamp.now(),
        });

        console.log(`✅ Persona generated successfully for contact: ${contactId}`);

        return {
            success: true,
            message: 'Persona generated successfully',
            persona: result.persona,
        };
    } catch (error: any) {
        console.error('Persona generation error:', error);

        try {
            const contactRef = db?.collection('partners').doc(partnerId).collection('contacts').doc(contactId);
            await contactRef?.update({
                personaGenerationStatus: 'failed',
            });
        } catch (e) {
            // Ignore update error
        }

        return { success: false, message: error.message };
    }
}

export async function updateContactPersonaFieldAction(
    partnerId: string,
    contactId: string,
    field: keyof ContactPersona,
    value: any
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!db) {
            return { success: false, error: 'Database unavailable' };
        }

        const contactRef = db.collection('partners').doc(partnerId).collection('contacts').doc(contactId);

        await contactRef.update({
            [`persona.${field}`]: value,
            [`persona.manualOverrides.${field}`]: true,
            'persona.updatedAt': Timestamp.now(),
        });

        return { success: true };
    } catch (error: any) {
        console.error('Update persona field error:', error);
        return { success: false, error: error.message };
    }
}

export async function incrementContactMessageCountAction(
    partnerId: string,
    contactId: string
): Promise<{ shouldGeneratePersona: boolean; currentCount: number }> {
    try {
        if (!db || !contactId) {
            return { shouldGeneratePersona: false, currentCount: 0 };
        }

        const contactRef = db.collection('partners').doc(partnerId).collection('contacts').doc(contactId);

        await contactRef.update({
            totalMessageCount: FieldValue.increment(1),
        });

        const contactDoc = await contactRef.get();
        const contactData = contactDoc.data();

        const currentCount = contactData?.totalMessageCount || 1;
        const lastGenerationCount = contactData?.persona?.generatedFromMessageCount || 0;
        const generationStatus = contactData?.personaGenerationStatus;

        const shouldGenerate =
            (currentCount - lastGenerationCount) >= PERSONA_GENERATION_THRESHOLD &&
            generationStatus !== 'generating';

        return {
            shouldGeneratePersona: shouldGenerate,
            currentCount,
        };
    } catch (error: any) {
        console.error('Increment message count error:', error);
        return { shouldGeneratePersona: false, currentCount: 0 };
    }
}

export async function getContactPersonaAction(
    partnerId: string,
    contactId: string
): Promise<{ success: boolean; persona?: ContactPersona; error?: string }> {
    try {
        if (!db) {
            return { success: false, error: 'Database unavailable' };
        }

        const contactRef = db.collection('partners').doc(partnerId).collection('contacts').doc(contactId);
        const contactDoc = await contactRef.get();

        if (!contactDoc.exists) {
            return { success: false, error: 'Contact not found' };
        }

        const contactData = contactDoc.data();

        return {
            success: true,
            persona: contactData?.persona || DEFAULT_CONTACT_PERSONA,
        };
    } catch (error: any) {
        console.error('Get persona error:', error);
        return { success: false, error: error.message };
    }
}

export async function resetContactPersonaAction(
    partnerId: string,
    contactId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!db) {
            return { success: false, error: 'Database unavailable' };
        }

        const contactRef = db.collection('partners').doc(partnerId).collection('contacts').doc(contactId);

        await contactRef.update({
            persona: DEFAULT_CONTACT_PERSONA,
            personaGenerationStatus: 'pending',
        });

        return { success: true };
    } catch (error: any) {
        console.error('Reset persona error:', error);
        return { success: false, error: error.message };
    }
}
