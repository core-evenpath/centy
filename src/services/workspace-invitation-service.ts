// src/services/workspace-invitation-service.ts
'use server';

import { db, adminAuth } from '@/lib/firebase-admin';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import type { WorkspaceInvitation, UserWorkspaceLink } from '../lib/types';

export interface AcceptInvitationResult {
  success: boolean;
  message: string;
  workspaceInfo?: {
    partnerId: string;
    partnerName: string;
    role: string;
  };
}

/**
 * Accept a workspace invitation by phone number
 */
export async function acceptInvitationByPhone(
  phoneNumber: string, 
  userId: string
): Promise<AcceptInvitationResult> {
  if (!db || !adminAuth) {
    return {
      success: false,
      message: 'Database or Auth not available'
    };
  }

  try {
    // Find pending invitations for this phone number
    // Note: This requires that invitations can be created with phone numbers
    const invitationsQuery = db.collection('workspaceInvitations').where('phoneNumber', '==', phoneNumber).where('status', '==', 'pending')

    const invitationsSnapshot = await invitationsQuery.get()
    
    if (invitationsSnapshot.empty) {
      return {
        success: false,
        message: 'No pending invitations found for this phone number.'
      };
    }

    // Accept all pending invitations for this phone number
    const acceptedWorkspaces = [];
    
    for (const invitationDoc of invitationsSnapshot.docs) {
      const invitation = invitationDoc.data() as WorkspaceInvitation;
      
      // Check if invitation hasn't expired
      const now = new Date();
      const expiresAt = (invitation.expiresAt as any).toDate();
      
      if (now > expiresAt) {
        await db.collection('workspaceInvitations').doc(invitationDoc.id).update({
          status: 'expired'
        });
        continue;
      }

      // Create workspace link
      const workspaceLink: Omit<UserWorkspaceLink, 'id'> = {
        userId,
        partnerId: invitation.partnerId,
        tenantId: invitation.tenantId,
        role: invitation.role,
        status: 'active',
        permissions: [],
        joinedAt: serverTimestamp() as any,
        invitedBy: invitation.invitedBy,
        invitedAt: invitation.invitedAt,
        partnerName: invitation.partnerName,
        partnerAvatar: null,
        lastAccessedAt: serverTimestamp() as any
      };

      const linkId = `${userId}_${invitation.partnerId}`;
      await db.collection('userWorkspaceLinks').doc(linkId).set(workspaceLink);

      // Update invitation status
      await db.collection('workspaceInvitations').doc(invitationDoc.id).update({
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        acceptedBy: userId
      });

      acceptedWorkspaces.push({
        partnerId: invitation.partnerId,
        partnerName: invitation.partnerName,
        role: invitation.role
      });
    }

    if (acceptedWorkspaces.length === 0) {
      return {
        success: false,
        message: 'All invitations have expired. Please request new invitations.'
      };
    }

    // Update user's custom claims with the first workspace as active
    const primaryWorkspace = acceptedWorkspaces[0];
    await updateUserCustomClaimsWithWorkspaces(userId, acceptedWorkspaces, primaryWorkspace.partnerId);

    return {
      success: true,
      message: `Successfully joined ${acceptedWorkspaces.length} workspace(s).`,
      workspaceInfo: primaryWorkspace
    };

  } catch (error: any) {
    console.error('Error accepting invitation by phone:', error);
    return {
      success: false,
      message: `Failed to accept invitation: ${error.message}`
    };
  }
}

/**
 * Update user's custom claims with workspace information
 */
async function updateUserCustomClaimsWithWorkspaces(
  userId: string, 
  workspaces: any[], 
  activePartnerId: string
): Promise<void> {
  if (!adminAuth) {
    throw new Error('Firebase Admin Auth not available');
  }

  const activeWorkspace = workspaces.find(w => w.partnerId === activePartnerId);
  
  const customClaims = {
    role: activeWorkspace.role,
    partnerId: activeWorkspace.partnerId,
    tenantId: activeWorkspace.tenantId || activeWorkspace.partnerId, // Fallback
    partnerIds: workspaces.map(w => w.partnerId),
    workspaces: workspaces.map(w => ({
      partnerId: w.partnerId,
      tenantId: w.tenantId || w.partnerId,
      role: w.role,
      permissions: [],
      status: 'active'
    })),
    activePartnerId: activeWorkspace.partnerId,
    activeTenantId: activeWorkspace.tenantId || activeWorkspace.partnerId
  };

  await adminAuth.setCustomUserClaims(userId, customClaims);
}

/**
 * Create workspace invitation with phone number support
 */
export async function createWorkspaceInvitationWithPhone(input: {
  phoneNumber?: string;
  email?: string;
  partnerId: string;
  tenantId: string;
  role: 'partner_admin' | 'employee';
  invitedBy: string;
  partnerName: string;
  inviterName: string;
  inviterEmail: string;
}): Promise<{ success: boolean; message: string; invitationId?: string }> {
  if (!db) {
    return {
      success: false,
      message: 'Database not available'
    };
  }

  if (!input.phoneNumber && !input.email) {
    return {
      success: false,
      message: 'Either phone number or email must be provided'
    };
  }

  try {
    const invitationId = db.collection('workspaceInvitations').doc().id;
    
    const invitation: Omit<WorkspaceInvitation, 'id'> = {
      email: input.email || '',
      phoneNumber: input.phoneNumber || '',
      partnerId: input.partnerId,
      tenantId: input.tenantId,
      role: input.role,
      invitedBy: input.invitedBy,
      invitedAt: serverTimestamp() as any,
      expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'pending',
      partnerName: input.partnerName,
      inviterName: input.inviterName,
      inviterEmail: input.inviterEmail
    };

    await db.collection('workspaceInvitations').doc(invitationId).set(invitation);

    return {
      success: true,
      message: `Invitation sent to ${input.phoneNumber || input.email}`,
      invitationId
    };

  } catch (error: any) {
    console.error('Error creating workspace invitation:', error);
    return {
      success: false,
      message: `Failed to create invitation: ${error.message}`
    };
  }
}

/**
 * Get pending invitations for a user (by phone or email)
 */
export async function getPendingInvitations(
  phoneNumber?: string, 
  email?: string
): Promise<WorkspaceInvitation[]> {
  if (!db) return [];

  try {
    const invitations: WorkspaceInvitation[] = [];
    
    if (phoneNumber) {
      const phoneQuery = db.collection('workspaceInvitations').
        where('phoneNumber', '==', phoneNumber).
        where('status', '==', 'pending');
      
      const phoneSnapshot = await phoneQuery.get();
      invitations.push(...phoneSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as WorkspaceInvitation)));
    }
    
    if (email) {
      const emailQuery = db.collection('workspaceInvitations').
        where('email', '==', email.toLowerCase()).
        where('status', '==', 'pending')
      
      const emailSnapshot = await emailQuery.get();
      invitations.push(...emailSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as WorkspaceInvitation)));
    }

    // Filter out expired invitations
    const now = new Date();
    return invitations.filter(invitation => {
      const expiresAt = (invitation.expiresAt as any).toDate();
      return now <= expiresAt;
    });

  } catch (error) {
    console.error('Error getting pending invitations:', error);
    return [];
  }
}
