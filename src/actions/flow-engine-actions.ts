'use server';

import { db as adminDb } from '@/lib/firebase-admin';
import type {
  FlowDefinition,
  ConversationFlowState,
  SystemFlowTemplate,
} from '@/lib/types-flow-engine';
import {
  SYSTEM_FLOW_TEMPLATES,
  getFlowTemplateForFunction,
} from '@/lib/flow-templates';

export async function getFlowTemplatesAction(
  functionId: string
): Promise<{ success: boolean; templates: SystemFlowTemplate[]; error?: string }> {
  try {
    const exact = getFlowTemplateForFunction(functionId);
    if (exact) {
      return { success: true, templates: [exact] };
    }
    return { success: true, templates: [] };
  } catch (e: any) {
    return { success: false, templates: [], error: e.message };
  }
}

export async function getPartnerFlowAction(
  partnerId: string
): Promise<{ success: boolean; flow?: FlowDefinition; error?: string }> {
  try {
    const doc = await adminDb
      .collection('partners')
      .doc(partnerId)
      .collection('relayConfig')
      .doc('flowDefinition')
      .get();

    if (!doc.exists) {
      return { success: true };
    }

    return { success: true, flow: doc.data() as FlowDefinition };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function savePartnerFlowAction(
  partnerId: string,
  flow: Omit<FlowDefinition, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
): Promise<{ success: boolean; flowId?: string; error?: string }> {
  try {
    const flowId = `flow_${partnerId}`;
    const now = new Date().toISOString();
    const fullFlow: FlowDefinition = {
      ...flow,
      id: flowId,
      createdAt: now,
      updatedAt: now,
      createdBy: partnerId,
    };

    await adminDb
      .collection('partners')
      .doc(partnerId)
      .collection('relayConfig')
      .doc('flowDefinition')
      .set(fullFlow);

    return { success: true, flowId };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deletePartnerFlowAction(
  partnerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await adminDb
      .collection('partners')
      .doc(partnerId)
      .collection('relayConfig')
      .doc('flowDefinition')
      .delete();

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getConversationFlowStateAction(
  partnerId: string,
  conversationId: string
): Promise<{ success: boolean; state?: ConversationFlowState; error?: string }> {
  try {
    const doc = await adminDb
      .collection('relayConversations')
      .doc(conversationId)
      .get();

    if (!doc.exists) {
      return { success: true };
    }

    const data = doc.data();
    if (data?.partnerId !== partnerId) {
      return { success: false, error: 'Conversation does not belong to this partner' };
    }

    return { success: true, state: data?.flowState as ConversationFlowState | undefined };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateConversationFlowStateAction(
  partnerId: string,
  conversationId: string,
  state: ConversationFlowState
): Promise<{ success: boolean; error?: string }> {
  try {
    await adminDb
      .collection('relayConversations')
      .doc(conversationId)
      .set(
        {
          flowState: state,
          partnerId,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getFlowAnalyticsAction(
  partnerId: string
): Promise<{
  success: boolean;
  analytics?: {
    totalConversations: number;
    avgLeadScore: number;
    conversionRate: number;
    handoffRate: number;
    topIntents: Array<{ intent: string; count: number }>;
    stageDropoff: Array<{ stage: string; enteredCount: number; exitedCount: number }>;
  };
  error?: string;
}> {
  try {
    const snapshot = await adminDb
      .collection('relayConversations')
      .where('partnerId', '==', partnerId)
      .limit(500)
      .get();

    if (snapshot.empty) {
      return {
        success: true,
        analytics: {
          totalConversations: 0,
          avgLeadScore: 0,
          conversionRate: 0,
          handoffRate: 0,
          topIntents: [],
          stageDropoff: [],
        },
      };
    }

    let totalScore = 0;
    let convertedCount = 0;
    let handoffCount = 0;
    const intentCounts: Record<string, number> = {};
    const stageEntered: Record<string, number> = {};
    const stageExited: Record<string, number> = {};
    let conversationsWithFlow = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const fs = data?.flowState as ConversationFlowState | undefined;
      if (!fs) return;

      conversationsWithFlow++;
      totalScore += fs.leadScore || 0;

      if (fs.convertedAt) convertedCount++;
      if (fs.handoffRequested) handoffCount++;

      (fs.intentHistory || []).forEach(intent => {
        intentCounts[intent] = (intentCounts[intent] || 0) + 1;
      });

      const stages = fs.visitedStages || [];
      stages.forEach((s, idx) => {
        stageEntered[s] = (stageEntered[s] || 0) + 1;
        if (idx < stages.length - 1) {
          stageExited[s] = (stageExited[s] || 0) + 1;
        }
      });
    });

    const total = conversationsWithFlow || 1;
    const topIntents = Object.entries(intentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([intent, count]) => ({ intent, count }));

    const allStages = new Set([...Object.keys(stageEntered), ...Object.keys(stageExited)]);
    const stageDropoff = Array.from(allStages).map(s => ({
      stage: s,
      enteredCount: stageEntered[s] || 0,
      exitedCount: stageExited[s] || 0,
    }));

    return {
      success: true,
      analytics: {
        totalConversations: snapshot.size,
        avgLeadScore: Math.round((totalScore / total) * 10) / 10,
        conversionRate: Math.round((convertedCount / total) * 1000) / 10,
        handoffRate: Math.round((handoffCount / total) * 1000) / 10,
        topIntents,
        stageDropoff,
      },
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getAllFlowTemplatesAction(): Promise<{
  success: boolean;
  templates: SystemFlowTemplate[];
  error?: string;
}> {
  return { success: true, templates: SYSTEM_FLOW_TEMPLATES };
}
