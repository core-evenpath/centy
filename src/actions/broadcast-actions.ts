// src/actions/broadcast-actions.ts
'use server';

import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export interface BroadcastGroup {
    id: string;
    partnerId: string;
    name: string;
    description?: string;
    contactIds: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface BroadcastCampaign {
    id: string;
    partnerId: string;
    title: string;
    channel: 'whatsapp' | 'telegram' | 'email';
    status: 'sent' | 'scheduled' | 'draft';
    message: string;
    hasImage: boolean;
    imageUrl?: string;
    buttons: string[];

    // Recipients
    recipientType: 'group' | 'individual' | 'all';
    groupIds?: string[];
    contactIds?: string[];
    recipientCount: number;

    // Scheduling
    sentAt?: Timestamp;
    scheduledFor?: Timestamp;

    // Metrics (for sent campaigns)
    delivered?: number;
    read?: number;
    replied?: number;
    clicked?: number;
    failed?: number;

    // Metadata
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/**
 * Get all broadcast groups for a partner
 */
export async function getBroadcastGroupsAction(partnerId: string) {
    try {
        const groupsSnapshot = await db
            .collection('partners')
            .doc(partnerId)
            .collection('broadcastGroups')
            .orderBy('name', 'asc')
            .get();

        const groups = groupsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }));

        return { success: true, groups };
    } catch (error: any) {
        console.error('Error fetching broadcast groups:', error);
        return { success: false, message: error.message, groups: [] };
    }
}

/**
 * Create a new broadcast group
 */
export async function createBroadcastGroupAction(
    partnerId: string,
    data: { name: string; description?: string; contactIds: string[] }
) {
    try {
        const now = Timestamp.now();
        const groupRef = db
            .collection('partners')
            .doc(partnerId)
            .collection('broadcastGroups')
            .doc();

        const group: Omit<BroadcastGroup, 'id'> = {
            partnerId,
            name: data.name,
            description: data.description,
            contactIds: data.contactIds,
            createdAt: now,
            updatedAt: now,
        };

        await groupRef.set(group);

        return {
            success: true,
            group: { id: groupRef.id, ...group },
        };
    } catch (error: any) {
        console.error('Error creating broadcast group:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Update a broadcast group
 */
export async function updateBroadcastGroupAction(
    partnerId: string,
    groupId: string,
    data: Partial<Pick<BroadcastGroup, 'name' | 'description' | 'contactIds'>>
) {
    try {
        const groupRef = db
            .collection('partners')
            .doc(partnerId)
            .collection('broadcastGroups')
            .doc(groupId);

        await groupRef.update({
            ...data,
            updatedAt: Timestamp.now(),
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error updating broadcast group:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Delete a broadcast group
 */
export async function deleteBroadcastGroupAction(partnerId: string, groupId: string) {
    try {
        await db
            .collection('partners')
            .doc(partnerId)
            .collection('broadcastGroups')
            .doc(groupId)
            .delete();

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting broadcast group:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Get all campaigns for a partner
 */
// Helper to serialize campaign data for client
function serializeCampaign(data: any, id: string): any {
    return {
        id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        sentAt: data.sentAt instanceof Timestamp ? data.sentAt.toDate().toISOString() : data.sentAt,
        scheduledFor: data.scheduledFor instanceof Timestamp ? data.scheduledFor.toDate().toISOString() : data.scheduledFor,
    };
}

/**
 * Get all campaigns for a partner
 */
export async function getCampaignsAction(partnerId: string) {
    try {
        const campaignsSnapshot = await db
            .collection('partners')
            .doc(partnerId)
            .collection('campaigns')
            .orderBy('createdAt', 'desc')
            .get();

        const campaigns = campaignsSnapshot.docs.map(doc => serializeCampaign(doc.data(), doc.id));

        return { success: true, campaigns };
    } catch (error: any) {
        console.error('Error fetching campaigns:', error);
        return { success: false, message: error.message, campaigns: [] };
    }
}

/**
 * Create a new campaign
 */
export async function createCampaignAction(
    partnerId: string,
    userId: string,
    data: Omit<BroadcastCampaign, 'id' | 'partnerId' | 'createdBy' | 'createdAt' | 'updatedAt'>
) {
    try {
        const now = Timestamp.now();
        const campaignRef = db
            .collection('partners')
            .doc(partnerId)
            .collection('campaigns')
            .doc();

        const campaign: Omit<BroadcastCampaign, 'id'> = {
            partnerId,
            ...data,
            createdBy: userId,
            createdAt: now,
            updatedAt: now,
            sentAt: data.sentAt ? Timestamp.fromDate(new Date(data.sentAt as any)) : undefined,
            scheduledFor: data.scheduledFor ? Timestamp.fromDate(new Date(data.scheduledFor as any)) : undefined,
        };

        await campaignRef.set(campaign);

        return {
            success: true,
            campaign: serializeCampaign(campaign, campaignRef.id),
        };
    } catch (error: any) {
        console.error('Error creating campaign:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Update a campaign
 */
export async function updateCampaignAction(
    partnerId: string,
    campaignId: string,
    data: Partial<BroadcastCampaign>
) {
    try {
        const campaignRef = db
            .collection('partners')
            .doc(partnerId)
            .collection('campaigns')
            .doc(campaignId);

        const updateData: any = { ...data, updatedAt: Timestamp.now() };

        // Convert date fields if present
        if (data.sentAt) {
            updateData.sentAt = Timestamp.fromDate(new Date(data.sentAt as any));
        }
        if (data.scheduledFor) {
            updateData.scheduledFor = Timestamp.fromDate(new Date(data.scheduledFor as any));
        }

        await campaignRef.update(updateData);

        return { success: true };
    } catch (error: any) {
        console.error('Error updating campaign:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Delete a campaign
 */
export async function deleteCampaignAction(partnerId: string, campaignId: string) {
    try {
        await db
            .collection('partners')
            .doc(partnerId)
            .collection('campaigns')
            .doc(campaignId)
            .delete();

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting campaign:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Send a campaign (update status and metrics)
 */
export async function sendCampaignAction(
    partnerId: string,
    campaignId: string,
    metrics?: {
        delivered?: number;
        read?: number;
        replied?: number;
        clicked?: number;
        failed?: number;
    }
) {
    try {
        const campaignRef = db
            .collection('partners')
            .doc(partnerId)
            .collection('campaigns')
            .doc(campaignId);

        await campaignRef.update({
            status: 'sent',
            sentAt: Timestamp.now(),
            ...metrics,
            updatedAt: Timestamp.now(),
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error sending campaign:', error);
        return { success: false, message: error.message };
    }
}
