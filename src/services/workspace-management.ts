// src/services/workspace-management.ts
'use server';

import { db, adminAuth } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { UserWorkspaceLink, WorkspaceInvitation, WorkspaceAccess, TeamMember } from '../lib/types';
import type { UserRecord } from 'firebase-admin/auth';

export interface InviteUserToWorkspaceInput {
  email: string;
  partnerId: string;
  tenantId: string;
  role: 'partner_admin' | 'employee';
  invitedBy: string; // User ID of inviter
  permissions?: string[];
}

export interface InviteUserToWorkspaceOutput {
  success: boolean;
  message: string;
  invitationId?: string;
}

/**
 * Invite a user to join a workspace
 */
export async function inviteUserToWorkspace(input: InviteUserToWorkspaceInput): Promise<InviteUserToWorkspaceOutput> {
  if (!db || !adminAuth) {
    return {
      success: false,
      message: 'Database or Auth not available'
    };
  }

  try {
    // Check if user already exists in the system
    let existingUser = null;
    try {
      existingUser = await adminAuth.getUserByEmail(input.email);
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Get partner details using admin SDK
    const partnerDoc = await db.collection('partners').doc(input.partnerId).get();
    if (!partnerDoc.exists) {
      return {
        success: false,
        message: 'Partner not found'
      };
    }

    // Get inviter details (who is a tenant user)
    const tenantAuth = adminAuth.tenantManager().authForTenant(input.tenantId);
    const inviterUser = await tenantAuth.getUser(input.invitedBy);


    // Create workspace invitation using admin SDK
    const invitationRef = db.collection('workspaceInvitations').doc();
    const invitation: WorkspaceInvitation = {
      id: invitationRef.id,
      email: input.email.toLowerCase(),
      partnerId: input.partnerId,
      tenantId: input.tenantId,
      role: input.role,
      invitedBy: input.invitedBy,
      invitedAt: FieldValue.serverTimestamp() as any,
      expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'pending',
      partnerName: partnerDoc.data()?.name || 'Unknown Organization',
      inviterName: inviterUser?.displayName || 'Unknown',
      inviterEmail: inviterUser?.email || 'unknown@example.com'
    };

    await invitationRef.set(invitation);

    return {
      success: true,
      message: 'Invitation sent successfully',
      invitationId: invitationRef.id
    };

  } catch (error: any) {
    console.error('Error inviting user to workspace:', error);
    return {
      success: false,
      message: `Failed to send invitation: ${error.message}`
    };
  }
}
