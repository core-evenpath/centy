// src/services/partner-service.ts
import 'server-only';
import { db } from '@/lib/firebase-admin';
import { mockPartners } from '@/lib/mockData';
import type { Partner } from '../lib/types';
import * as admin from 'firebase-admin';

/**
 * Fetches partners. If a tenantId is provided, it fetches the specific partner for that tenant.
 * If no tenantId is provided (e.g., for an admin), it fetches all partners.
 * @param {string} [tenantId] - The tenant ID to filter partners.
 * @returns {Promise<Partner[]>} A promise that resolves to an array of partners.
 */
export async function getPartners(tenantId?: string): Promise<Partner[]> {
    if (!db) {
        throw new Error("Database not connected. Cannot fetch partners.");
    }
    
    const partnersRef = db.collection('partners');
    let query: admin.firestore.Query = partnersRef;

    // If a tenantId is provided, filter the query to only get that partner.
    if (tenantId) {
        query = partnersRef.where('tenantId', '==', tenantId).limit(1);
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
        return [];
    }

    const partners: Partner[] = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        
        // Convert Firestore Timestamps to ISO strings
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt;

        const partnerData: Partner = {
            id: doc.id,
            ...data,
            createdAt,
            updatedAt,
            employeeCount: Number(data.employeeCount) || 0,
            aiProfileCompleteness: Number(data.aiProfileCompleteness) || 0,
        } as Partner;
        partners.push(partnerData);
    });
    
    return partners;
}

/**
 * Seeds the Firestore database with initial mock partner data if the collection is empty
 * and a database connection is available.
 */
export async function seedInitialPartners(): Promise<void> {
    if (!db) {
        console.warn("Database not connected, skipping partner seeding.");
        return;
    }

    const partnersRef = db.collection('partners');
    const snapshot = await partnersRef.limit(1).get();

    if (!snapshot.empty) {
        // console.log('Partners collection is not empty. Skipping seed.');
        return;
    }

    console.log('Seeding initial partner data...');
    const batch = db.batch();
    
    mockPartners.forEach(partnerData => {
        // Use the ID from mock data if available, otherwise let Firestore generate one
        const docRef = partnerData.id ? partnersRef.doc(partnerData.id) : partnersRef.doc();
        const { id, ...dataToSeed } = partnerData;

        const partnerToSeed = {
            ...dataToSeed,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        batch.set(docRef, partnerToSeed);
    });

    await batch.commit();
    console.log('Seeding complete.');
}
