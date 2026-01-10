'use server';

import { db } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { BusinessPersona } from '@/lib/business-persona-types';

/**
 * Profile Change Log Entry
 */
export interface ProfileChangeEntry {
    id: string;
    field: string;
    fieldLabel: string;
    oldValue: any;
    newValue: any;
    changeType: 'added' | 'updated' | 'removed';
    timestamp: Date;
    source: 'manual' | 'ai' | 'import';
}

/**
 * Profile Summary Document (stored in hubDocuments)
 */
export interface ProfileSummaryDocument {
    id: string;
    name: string;
    type: 'profile_summary';
    content: string;
    lastUpdated: Date;
    version: number;
}

// Field labels for human-readable change logs
const FIELD_LABELS: Record<string, string> = {
    'identity.name': 'Business Name',
    'identity.phone': 'Phone Number',
    'identity.email': 'Email Address',
    'identity.website': 'Website',
    'identity.whatsAppNumber': 'WhatsApp Number',
    'identity.address.street': 'Street Address',
    'identity.address.city': 'City',
    'identity.address.state': 'State',
    'identity.operatingHours': 'Operating Hours',
    'identity.operatingHours.isOpen24x7': '24/7 Availability',
    'personality.tagline': 'Tagline',
    'personality.description': 'Business Description',
    'personality.uniqueSellingPoints': 'Unique Selling Points',
    'personality.voiceTone': 'Voice & Tone',
    'knowledge.productsOrServices': 'Products/Services',
    'knowledge.faqs': 'FAQs',
    'knowledge.policies.returnPolicy': 'Return Policy',
    'knowledge.policies.refundPolicy': 'Refund Policy',
    'knowledge.policies.cancellationPolicy': 'Cancellation Policy',
    'knowledge.acceptedPayments': 'Payment Methods',
    'knowledge.certifications': 'Certifications',
    'knowledge.awards': 'Awards',
};

/**
 * Track a profile change
 */
export async function trackProfileChangeAction(
    partnerId: string,
    field: string,
    oldValue: any,
    newValue: any,
    source: 'manual' | 'ai' | 'import' = 'manual'
): Promise<{ success: boolean; message: string }> {
    if (!db) {
        return { success: false, message: 'Database unavailable' };
    }

    try {
        // Determine change type
        let changeType: 'added' | 'updated' | 'removed' = 'updated';
        if (oldValue === undefined || oldValue === null || oldValue === '') {
            changeType = 'added';
        } else if (newValue === undefined || newValue === null || newValue === '') {
            changeType = 'removed';
        }

        const changeEntry = {
            field,
            fieldLabel: FIELD_LABELS[field] || field.split('.').pop() || field,
            oldValue: oldValue ?? null,
            newValue: newValue ?? null,
            changeType,
            timestamp: new Date(),
            source,
        };

        // Store in profileChanges subcollection
        await db
            .collection('partners')
            .doc(partnerId)
            .collection('profileChanges')
            .add(changeEntry);

        // Update the lastProfileChange field on partner doc
        await db.collection('partners').doc(partnerId).update({
            lastProfileChange: {
                field,
                fieldLabel: changeEntry.fieldLabel,
                changeType,
                timestamp: FieldValue.serverTimestamp(),
            },
            profileChangesCount: FieldValue.increment(1),
        });

        return { success: true, message: 'Change tracked' };
    } catch (error: any) {
        console.error('Error tracking profile change:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Get recent profile changes
 */
export async function getRecentProfileChangesAction(
    partnerId: string,
    limit: number = 10
): Promise<{
    success: boolean;
    changes: ProfileChangeEntry[];
    message?: string;
}> {
    if (!db) {
        return { success: false, changes: [], message: 'Database unavailable' };
    }

    try {
        const snapshot = await db
            .collection('partners')
            .doc(partnerId)
            .collection('profileChanges')
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        const changes = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                field: data.field,
                fieldLabel: data.fieldLabel,
                oldValue: data.oldValue,
                newValue: data.newValue,
                changeType: data.changeType,
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
                source: data.source || 'manual',
            } as ProfileChangeEntry;
        });

        return { success: true, changes };
    } catch (error: any) {
        console.error('Error getting profile changes:', error);
        return { success: false, changes: [], message: error.message };
    }
}

/**
 * Generate and store a Profile Summary document
 * This creates a text document from the business persona that can be used in RAG
 */
export async function generateProfileSummaryDocumentAction(
    partnerId: string
): Promise<{ success: boolean; message: string; documentId?: string }> {
    if (!db) {
        return { success: false, message: 'Database unavailable' };
    }

    try {
        // Fetch current persona
        const partnerDoc = await db.collection('partners').doc(partnerId).get();
        if (!partnerDoc.exists) {
            return { success: false, message: 'Partner not found' };
        }

        const partnerData = partnerDoc.data();
        const persona = partnerData?.businessPersona as BusinessPersona | undefined;

        if (!persona) {
            return { success: false, message: 'No business persona found' };
        }

        // Generate summary text
        const summaryParts: string[] = [];

        // Business Identity
        summaryParts.push('# Business Profile Summary');
        summaryParts.push('');

        if (persona.identity?.name) {
            summaryParts.push(`## ${persona.identity.name}`);
        }

        if (persona.personality?.tagline) {
            summaryParts.push(`*${persona.personality.tagline}*`);
        }

        summaryParts.push('');

        // About
        if (persona.personality?.description) {
            summaryParts.push('### About Us');
            summaryParts.push(persona.personality.description);
            summaryParts.push('');
        }

        // Contact Information
        summaryParts.push('### Contact Information');
        if (persona.identity?.phone) summaryParts.push(`- Phone: ${persona.identity.phone}`);
        if (persona.identity?.email) summaryParts.push(`- Email: ${persona.identity.email}`);
        if (persona.identity?.whatsAppNumber) summaryParts.push(`- WhatsApp: ${persona.identity.whatsAppNumber}`);
        if (persona.identity?.website) summaryParts.push(`- Website: ${persona.identity.website}`);

        if (persona.identity?.address) {
            const addr = persona.identity.address;
            const addressParts = [addr.street, addr.city, addr.state, addr.country].filter(Boolean);
            if (addressParts.length > 0) {
                summaryParts.push(`- Address: ${addressParts.join(', ')}`);
            }
        }
        summaryParts.push('');

        // Operating Hours
        if (persona.identity?.operatingHours) {
            summaryParts.push('### Operating Hours');
            const hours = persona.identity.operatingHours;
            if (hours.isOpen24x7) {
                summaryParts.push('We are open 24/7.');
            } else if (hours.appointmentOnly) {
                summaryParts.push('By appointment only.');
            } else if (hours.onlineAlways) {
                summaryParts.push('Always available online.');
            } else if (hours.specialNote) {
                summaryParts.push(hours.specialNote);
            }
            summaryParts.push('');
        }

        // Unique Selling Points
        if (persona.personality?.uniqueSellingPoints?.length) {
            summaryParts.push('### What Makes Us Special');
            persona.personality.uniqueSellingPoints.forEach(usp => {
                summaryParts.push(`- ${usp}`);
            });
            summaryParts.push('');
        }

        // Products/Services
        if (persona.knowledge?.productsOrServices?.length) {
            summaryParts.push('### Our Products & Services');
            persona.knowledge.productsOrServices.forEach(item => {
                if (item.name) {
                    let line = `- **${item.name}**`;
                    if (item.description) line += `: ${item.description}`;
                    if (item.priceRange) line += ` (${item.priceRange})`;
                    summaryParts.push(line);
                }
            });
            summaryParts.push('');
        }

        // Payment Methods
        if (persona.knowledge?.acceptedPayments?.length) {
            summaryParts.push('### Accepted Payment Methods');
            summaryParts.push(persona.knowledge.acceptedPayments.join(', '));
            summaryParts.push('');
        }

        // Certifications
        if (persona.knowledge?.certifications?.length) {
            summaryParts.push('### Certifications & Credentials');
            persona.knowledge.certifications.forEach(cert => {
                summaryParts.push(`- ${cert}`);
            });
            summaryParts.push('');
        }

        // FAQs
        if (persona.knowledge?.faqs?.length) {
            summaryParts.push('### Frequently Asked Questions');
            persona.knowledge.faqs.forEach(faq => {
                if (faq.question && faq.answer) {
                    summaryParts.push(`**Q: ${faq.question}**`);
                    summaryParts.push(`A: ${faq.answer}`);
                    summaryParts.push('');
                }
            });
        }

        // Policies
        if (persona.knowledge?.policies) {
            const policies = persona.knowledge.policies;
            if (policies.returnPolicy || policies.refundPolicy || policies.cancellationPolicy) {
                summaryParts.push('### Policies');
                if (policies.returnPolicy) {
                    summaryParts.push(`**Return Policy:** ${policies.returnPolicy}`);
                }
                if (policies.refundPolicy) {
                    summaryParts.push(`**Refund Policy:** ${policies.refundPolicy}`);
                }
                if (policies.cancellationPolicy) {
                    summaryParts.push(`**Cancellation Policy:** ${policies.cancellationPolicy}`);
                }
                summaryParts.push('');
            }
        }

        const summaryContent = summaryParts.join('\n');

        // Check if profile summary document already exists
        const existingDocs = await db
            .collection('partners')
            .doc(partnerId)
            .collection('hubDocuments')
            .where('type', '==', 'profile_summary')
            .limit(1)
            .get();

        let documentId: string;

        if (!existingDocs.empty) {
            // Update existing document
            documentId = existingDocs.docs[0].id;
            await db
                .collection('partners')
                .doc(partnerId)
                .collection('hubDocuments')
                .doc(documentId)
                .update({
                    extractedText: summaryContent,
                    summary: `Business profile summary for ${persona.identity?.name || 'this business'}`,
                    updatedAt: FieldValue.serverTimestamp(),
                    version: FieldValue.increment(1),
                });
        } else {
            // Create new document
            const docRef = await db
                .collection('partners')
                .doc(partnerId)
                .collection('hubDocuments')
                .add({
                    name: 'Business Profile Summary',
                    type: 'profile_summary',
                    mimeType: 'text/markdown',
                    size: summaryContent.length,
                    extractedText: summaryContent,
                    summary: `Business profile summary for ${persona.identity?.name || 'this business'}`,
                    tags: ['profile', 'auto-generated', 'business-info'],
                    status: 'completed',
                    visibility: 'both',
                    createdAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp(),
                    version: 1,
                });
            documentId = docRef.id;
        }

        // Update partner with last sync timestamp
        await db.collection('partners').doc(partnerId).update({
            profileSummaryLastSync: FieldValue.serverTimestamp(),
            profileSummaryDocId: documentId,
        });

        console.log(`✅ Profile summary document generated for partner ${partnerId}`);

        return {
            success: true,
            message: 'Profile summary document generated',
            documentId,
        };
    } catch (error: any) {
        console.error('Error generating profile summary:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Get profile changes summary for AI context
 * Returns a formatted string of recent changes for the AI to reference
 */
export async function getProfileChangesContextAction(
    partnerId: string
): Promise<{ success: boolean; context: string }> {
    if (!db) {
        return { success: false, context: '' };
    }

    try {
        // Get changes from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const snapshot = await db
            .collection('partners')
            .doc(partnerId)
            .collection('profileChanges')
            .where('timestamp', '>=', sevenDaysAgo)
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();

        if (snapshot.empty) {
            return { success: true, context: '' };
        }

        const changes = snapshot.docs.map(doc => doc.data());

        // Format changes for AI context
        const contextParts: string[] = ['Recent Profile Updates:'];

        changes.forEach(change => {
            const date = change.timestamp?.toDate
                ? change.timestamp.toDate().toLocaleDateString()
                : 'Recently';

            if (change.changeType === 'added') {
                contextParts.push(`- Added ${change.fieldLabel}: "${change.newValue}" (${date})`);
            } else if (change.changeType === 'updated') {
                contextParts.push(`- Updated ${change.fieldLabel} from "${change.oldValue}" to "${change.newValue}" (${date})`);
            } else if (change.changeType === 'removed') {
                contextParts.push(`- Removed ${change.fieldLabel} (${date})`);
            }
        });

        return { success: true, context: contextParts.join('\n') };
    } catch (error: any) {
        console.error('Error getting profile changes context:', error);
        return { success: false, context: '' };
    }
}
