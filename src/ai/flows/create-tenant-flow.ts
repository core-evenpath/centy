
'use server';

/**
 * @fileOverview A Genkit flow for creating Firebase Auth tenants and partner documents.
 * This flow only creates the tenant and partner document; user creation is handled separately.
 *
 * - createTenant - A function that handles creating a new Firebase Auth tenant and a partner record in Firestore.
 * - CreateTenantInput - The input type for the createTenant function.
 * - CreateTenantOutput - The return type for the createTenant function.
 */

import { ai } from '../genkit';
import { z } from 'genkit';
import { adminAuth, db } from '../../lib/firebase-admin';
import type { Partner } from '../../lib/types';
import * as admin from 'firebase-admin';

const CreateTenantInputSchema = z.object({
  partnerName: z.string().describe('The name of the partner organization.'),
  email: z.string().email().describe("The primary admin's email for the partner."),
  currency: z.string().optional().describe('The default currency code for the organization (e.g., INR, USD).'),
});
export type CreateTenantInput = z.infer<typeof CreateTenantInputSchema>;

const CreateTenantOutputSchema = z.object({
  success: z.boolean().describe('Whether the operation was successful.'),
  tenantId: z.string().optional().describe('The new tenant ID if creation was successful.'),
  partnerId: z.string().optional().describe('The new partner document ID if creation was successful.'),
  message: z.string().describe('A message detailing the result of the operation.'),
});
export type CreateTenantOutput = z.infer<typeof CreateTenantOutputSchema>;

export async function createTenant(input: CreateTenantInput): Promise<CreateTenantOutput> {
  return createTenantFlow(input);
}

const createTenantFlow = ai.defineFlow(
  {
    name: 'createTenantFlow',
    inputSchema: CreateTenantInputSchema,
    outputSchema: CreateTenantOutputSchema,
  },
  async (input) => {
    if (!adminAuth || !db) {
      return {
        success: false,
        message: "Firebase Admin SDK is not initialized. Cannot create partner. Ensure your service account environment variables are set correctly on the server.",
      };
    }

    try {
      // 1. Sanitize the partner name for tenant display name
      const sanitizedName = input.partnerName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 20);

      let finalDisplayName = sanitizedName;
      if (!/^[a-z]/.test(finalDisplayName)) {
        finalDisplayName = 't-' + finalDisplayName.substring(0, 18);
      }
      if (finalDisplayName.length < 4) {
        finalDisplayName = (finalDisplayName + '-1234').substring(0, 20);
      }

      // 2. Create the Firebase Auth Tenant
      const tenant = await adminAuth.tenantManager().createTenant({
        displayName: finalDisplayName,
        emailSignInConfig: {
          enabled: true,
          passwordRequired: true,
        },
      });
      console.log(`Successfully created tenant for ${input.partnerName} with ID: ${tenant.tenantId}`);

      // 3. Create the Partner document in Firestore with initial business persona
      const initialBusinessPersona = {
        identity: {
          name: input.partnerName,
          industry: null,
          email: input.email,
          phone: '',
          timezone: 'Asia/Kolkata',
          currency: input.currency || '', // From signup selection
          operatingHours: { isOpen24x7: false },
          lastUpdated: new Date(),
          completenessScore: 20,
        },
        personality: {
          voiceTone: ['professional', 'friendly'],
          communicationStyle: 'conversational',
          description: '',
          uniqueSellingPoints: [],
          responseTimeExpectation: 'within_hour',
          escalationPreferences: {
            escalateOnHumanRequest: true,
            escalationKeywords: ['speak to human', 'talk to person', 'real person'],
            escalateOnComplaint: true,
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

      const newPartner: Omit<Partner, 'id'> = {
        tenantId: tenant.tenantId,
        name: input.partnerName,
        businessName: input.partnerName,
        contactPerson: input.partnerName,
        email: input.email,
        phone: '',
        status: 'pending',
        plan: 'Starter',
        joinedDate: new Date().toISOString(),
        industry: null,
        businessSize: 'small',
        employeeCount: 1,
        monthlyRevenue: '0',
        location: { city: '', state: '' },
        aiProfileCompleteness: 20, // Start with 20% for basic signup info
        stats: {
          activeWorkflows: 0,
          totalExecutions: 0,
          successRate: 0,
          avgROI: 0,
          timeSaved: '0 hours/month',
        },
        businessProfile: null,
        aiMemory: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Add businessPersona to the partner document
      const partnerWithPersona = {
        ...newPartner,
        businessPersona: initialBusinessPersona,
      };

      const docRef = await db.collection("partners").add(partnerWithPersona);
      console.log("Partner document created with ID:", docRef.id);

      // NOTE: User creation is now handled in a separate step by the caller.
      // This flow's responsibility is only to set up the tenant and partner document.

      return {
        success: true,
        tenantId: tenant.tenantId,
        partnerId: docRef.id,
        message: `Successfully created workspace for ${input.partnerName}.`,
      };

    } catch (error: any) {
      console.error("Error in createTenantFlow:", error);

      if (error.code === 'PERMISSION_DENIED' || (error.message && error.message.includes('permission'))) {
        if (error.message && error.message.includes('serviceusage.services.use')) {
          return {
            success: false,
            message: `Permission Denied: Your service account needs the 'Service Usage Consumer' role. Please add this in the Google Cloud IAM console for project '${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}'.`,
          };
        }
        return {
          success: false,
          message: `Permission Denied. Please check your service account permissions in the Google Cloud IAM console.`,
        };
      }

      if (error.message && error.message.includes('multi-tenancy')) {
        return {
          success: false,
          message: "Firebase Multi-Tenancy is not enabled for this project. Please go to your Google Cloud Console, find 'Identity Platform', and enable it."
        };
      }

      return {
        success: false,
        message: `Failed to create partner: ${error.message}`,
      };
    }
  }
);
