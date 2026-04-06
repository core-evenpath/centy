'use server';

import { db as adminDb } from '@/lib/firebase-admin';
import { SYSTEM_FLOW_TEMPLATES } from '@/lib/flow-templates';
import type {
  FlowDefinition,
  ConversationFlowState,
  SystemFlowTemplate,
  SystemFlowTemplateRecord,
} from '@/lib/types-flow-engine';

// ---------------------------------------------------------------------------
// 1. Get system flow templates (Firestore-first, in-memory fallback)
// ---------------------------------------------------------------------------
export async function getFlowTemplatesAction(
  functionId: string
): Promise<{ success: boolean; templates: SystemFlowTemplate[]; error?: string }> {
  try {
    const dbResult = await getSystemFlowTemplatesFromDB();
    if (dbResult.success && dbResult.templates.length > 0) {
      const templates = functionId
        ? dbResult.templates.filter((t) => t.functionId === functionId && t.status === 'active')
        : dbResult.templates.filter((t) => t.status === 'active');
      return { success: true, templates };
    }
    const templates = functionId
      ? SYSTEM_FLOW_TEMPLATES.filter((t) => t.functionId === functionId)
      : SYSTEM_FLOW_TEMPLATES;
    return { success: true, templates };
  } catch (e: any) {
    console.error('Failed to get flow templates:', e);
    return { success: false, templates: [], error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 2. Get partner's custom flow
// ---------------------------------------------------------------------------
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
      return { success: true, flow: undefined };
    }

    return { success: true, flow: doc.data() as FlowDefinition };
  } catch (e: any) {
    console.error('Failed to get partner flow:', e);
    return { success: false, error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 3. Save partner's custom flow
// ---------------------------------------------------------------------------
export async function savePartnerFlowAction(
  partnerId: string,
  flow: Omit<FlowDefinition, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>,
  userId: string
): Promise<{ success: boolean; flowId?: string; error?: string }> {
  try {
    const now = new Date().toISOString();
    const flowId = `flow_${partnerId}`;

    const flowData: FlowDefinition = {
      ...flow,
      id: flowId,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    };

    await adminDb
      .collection('partners')
      .doc(partnerId)
      .collection('relayConfig')
      .doc('flowDefinition')
      .set(flowData, { merge: true });

    return { success: true, flowId };
  } catch (e: any) {
    console.error('Failed to save partner flow:', e);
    return { success: false, error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 4. Delete partner's custom flow
// ---------------------------------------------------------------------------
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
    console.error('Failed to delete partner flow:', e);
    return { success: false, error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 5. Get conversation flow state
// ---------------------------------------------------------------------------
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
      return { success: true, state: undefined };
    }

    const data = doc.data();
    return { success: true, state: data?.flowState as ConversationFlowState | undefined };
  } catch (e: any) {
    console.error('Failed to get conversation flow state:', e);
    return { success: false, error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 6. Update conversation flow state
// ---------------------------------------------------------------------------
export async function updateConversationFlowStateAction(
  partnerId: string,
  conversationId: string,
  state: ConversationFlowState
): Promise<{ success: boolean; error?: string }> {
  try {
    await adminDb
      .collection('relayConversations')
      .doc(conversationId)
      .update({ flowState: state });

    return { success: true };
  } catch (e: any) {
    console.error('Failed to update conversation flow state:', e);
    return { success: false, error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 7. Get flow analytics for a partner
// ---------------------------------------------------------------------------
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
    const snap = await adminDb
      .collection('relayConversations')
      .where('partnerId', '==', partnerId)
      .orderBy('flowState.lastActivityAt', 'desc')
      .limit(200)
      .get();

    const docs = snap.docs
      .map((d) => d.data()?.flowState as ConversationFlowState | undefined)
      .filter((s): s is ConversationFlowState => !!s);

    const totalConversations = docs.length;

    if (totalConversations === 0) {
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

    // Average lead score
    const totalLeadScore = docs.reduce((sum, s) => sum + s.leadScore, 0);
    const avgLeadScore = Math.round((totalLeadScore / totalConversations) * 10) / 10;

    // Conversion rate
    const convertedCount = docs.filter((s) => s.convertedAt).length;
    const conversionRate = Math.round((convertedCount / totalConversations) * 100) / 100;

    // Handoff rate
    const handoffCount = docs.filter((s) => s.handoffRequested).length;
    const handoffRate = Math.round((handoffCount / totalConversations) * 100) / 100;

    // Top intents
    const intentCounts: Record<string, number> = {};
    for (const s of docs) {
      for (const intent of s.intentHistory) {
        intentCounts[intent] = (intentCounts[intent] || 0) + 1;
      }
    }
    const topIntents = Object.entries(intentCounts)
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Stage dropoff
    const stageEntered: Record<string, number> = {};
    const stageVisitTotal: Record<string, number> = {};
    for (const s of docs) {
      for (const stage of s.visitedStages) {
        stageEntered[stage] = (stageEntered[stage] || 0) + 1;
      }
      for (const [stage, count] of Object.entries(s.stageVisitCounts)) {
        stageVisitTotal[stage] = (stageVisitTotal[stage] || 0) + count;
      }
    }
    const stageDropoff = Object.keys(stageEntered).map((stage) => ({
      stage,
      enteredCount: stageEntered[stage],
      exitedCount: stageVisitTotal[stage] || stageEntered[stage],
    }));

    return {
      success: true,
      analytics: {
        totalConversations,
        avgLeadScore,
        conversionRate,
        handoffRate,
        topIntents,
        stageDropoff,
      },
    };
  } catch (e: any) {
    console.error('Failed to get flow analytics:', e);
    return { success: false, error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 8. Get all system flow templates (Firestore-first, in-memory fallback)
// ---------------------------------------------------------------------------
export async function getAllFlowTemplatesAction(): Promise<{
  success: boolean;
  templates: SystemFlowTemplate[];
  error?: string;
}> {
  try {
    const dbResult = await getSystemFlowTemplatesFromDB();
    if (dbResult.success && dbResult.templates.length > 0) {
      return { success: true, templates: dbResult.templates };
    }
    return { success: true, templates: SYSTEM_FLOW_TEMPLATES };
  } catch (e: any) {
    console.error('Failed to get all flow templates:', e);
    return { success: false, templates: [], error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 9. Admin overview of all partner flows
// ---------------------------------------------------------------------------
export async function getAdminFlowOverviewAction(): Promise<{
  success: boolean;
  partnerFlows: Array<{
    partnerId: string;
    partnerName: string;
    flowName: string;
    industryId: string;
    functionId: string;
    stageCount: number;
    status: string;
    updatedAt: string;
    conversationCount: number;
    avgLeadScore: number;
  }>;
  error?: string;
}> {
  try {
    // Get all partners (limited for performance)
    const partnersSnap = await adminDb.collection('partners').limit(100).get();

    const partnerFlows: Array<{
      partnerId: string;
      partnerName: string;
      flowName: string;
      industryId: string;
      functionId: string;
      stageCount: number;
      status: string;
      updatedAt: string;
      conversationCount: number;
      avgLeadScore: number;
    }> = [];

    // Check each partner for a custom flow definition
    const flowChecks = partnersSnap.docs.map(async (partnerDoc) => {
      const partnerId = partnerDoc.id;
      const partnerName =
        partnerDoc.data()?.businessPersona?.identity?.name ||
        partnerDoc.data()?.name ||
        partnerId;

      try {
        const flowDoc = await adminDb
          .collection('partners')
          .doc(partnerId)
          .collection('relayConfig')
          .doc('flowDefinition')
          .get();

        if (!flowDoc.exists) return;

        const flow = flowDoc.data() as FlowDefinition;

        // Count conversations with flow state for this partner
        let conversationCount = 0;
        let totalLeadScore = 0;
        try {
          const convSnap = await adminDb
            .collection('relayConversations')
            .where('partnerId', '==', partnerId)
            .limit(50)
            .get();

          for (const convDoc of convSnap.docs) {
            const flowState = convDoc.data()?.flowState;
            if (flowState) {
              conversationCount++;
              totalLeadScore += flowState.leadScore || 0;
            }
          }
        } catch {
          // Conversations query failed, use defaults
        }

        partnerFlows.push({
          partnerId,
          partnerName,
          flowName: flow.name || 'Custom Flow',
          industryId: flow.industryId || '',
          functionId: flow.functionId || '',
          stageCount: flow.stages?.length || 0,
          status: flow.status || 'draft',
          updatedAt: flow.updatedAt || '',
          conversationCount,
          avgLeadScore:
            conversationCount > 0
              ? Math.round((totalLeadScore / conversationCount) * 10) / 10
              : 0,
        });
      } catch {
        // Skip this partner if flow check fails
      }
    });

    await Promise.all(flowChecks);

    return { success: true, partnerFlows };
  } catch (e: any) {
    console.error('Failed to get admin flow overview:', e);
    return { success: false, partnerFlows: [], error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 10. Get system flow templates from Firestore
// ---------------------------------------------------------------------------
export async function getSystemFlowTemplatesFromDB(): Promise<{
  success: boolean;
  templates: SystemFlowTemplateRecord[];
  error?: string;
}> {
  try {
    const snap = await adminDb
      .collection('systemFlowTemplates')
      .orderBy('updatedAt', 'desc')
      .get();

    const templates = snap.docs.map((d) => ({
      ...d.data(),
      id: d.id,
    })) as SystemFlowTemplateRecord[];

    return { success: true, templates };
  } catch (e: any) {
    console.error('Failed to get system flow templates from DB:', e);
    return { success: false, templates: [], error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 11. Get single system flow template by ID
// ---------------------------------------------------------------------------
export async function getSystemFlowTemplateByIdAction(
  templateId: string
): Promise<{ success: boolean; template?: SystemFlowTemplateRecord; error?: string }> {
  try {
    const doc = await adminDb.collection('systemFlowTemplates').doc(templateId).get();
    if (!doc.exists) {
      return { success: false, error: 'Template not found' };
    }
    return {
      success: true,
      template: { ...doc.data(), id: doc.id } as SystemFlowTemplateRecord,
    };
  } catch (e: any) {
    console.error('Failed to get system flow template:', e);
    return { success: false, error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 12. Create system flow template
// ---------------------------------------------------------------------------
export async function createSystemFlowTemplateAction(
  data: Omit<SystemFlowTemplateRecord, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>,
  userId: string
): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: 'Template name is required' };
    }
    if (!data.stages || data.stages.length === 0) {
      return { success: false, error: 'At least one stage is required' };
    }

    // Validate block IDs against registry
    const { ALL_BLOCKS } = await import('@/app/admin/relay/blocks/previews/registry');
    const validBlockIds = new Set(ALL_BLOCKS.map(b => b.id));
    for (const stage of data.stages) {
      const blockIds = stage.blockTypes || [];
      for (const blockId of blockIds) {
        if (!validBlockIds.has(blockId)) {
          return { success: false, error: `Unknown block "${blockId}" in stage "${stage.id || stage.label}". Check the block registry.` };
        }
      }
    }

    const now = new Date().toISOString();
    const templateId = `flow_tpl_${Date.now()}`;

    const record: SystemFlowTemplateRecord = {
      ...data,
      id: templateId,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    };

    await adminDb.collection('systemFlowTemplates').doc(templateId).set(record);

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin/relay/flows');

    return { success: true, templateId };
  } catch (e: any) {
    console.error('Failed to create system flow template:', e);
    return { success: false, error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 13. Update system flow template
// ---------------------------------------------------------------------------
export async function updateSystemFlowTemplateAction(
  templateId: string,
  updates: Partial<SystemFlowTemplateRecord>,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const doc = await adminDb.collection('systemFlowTemplates').doc(templateId).get();
    if (!doc.exists) {
      return { success: false, error: 'Template not found' };
    }

    const { id: _id, createdAt: _ca, createdBy: _cb, ...safeUpdates } = updates;

    if (safeUpdates.stages) {
      const { ALL_BLOCKS } = await import('@/app/admin/relay/blocks/previews/registry');
      const validBlockIds = new Set(ALL_BLOCKS.map(b => b.id));
      for (const stage of safeUpdates.stages) {
        const blockIds = stage.blockTypes || [];
        for (const blockId of blockIds) {
          if (!validBlockIds.has(blockId)) {
            return { success: false, error: `Unknown block "${blockId}" in stage "${stage.id || stage.label}". Check the block registry.` };
          }
        }
      }
    }

    await adminDb.collection('systemFlowTemplates').doc(templateId).update({
      ...safeUpdates,
      updatedAt: new Date().toISOString(),
    });

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin/relay/flows');

    return { success: true };
  } catch (e: any) {
    console.error('Failed to update system flow template:', e);
    return { success: false, error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 14. Delete system flow template
// ---------------------------------------------------------------------------
export async function deleteSystemFlowTemplateAction(
  templateId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await adminDb.collection('systemFlowTemplates').doc(templateId).delete();

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin/relay/flows');

    return { success: true };
  } catch (e: any) {
    console.error('Failed to delete system flow template:', e);
    return { success: false, error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 15. Duplicate system flow template
// ---------------------------------------------------------------------------
export async function duplicateSystemFlowTemplateAction(
  templateId: string,
  userId: string
): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    const doc = await adminDb.collection('systemFlowTemplates').doc(templateId).get();
    if (!doc.exists) {
      return { success: false, error: 'Template not found' };
    }

    const existing = doc.data() as SystemFlowTemplateRecord;
    const now = new Date().toISOString();
    const newId = `flow_tpl_${Date.now()}`;

    const copy: SystemFlowTemplateRecord = {
      ...existing,
      id: newId,
      name: `${existing.name} (Copy)`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
    };

    await adminDb.collection('systemFlowTemplates').doc(newId).set(copy);

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin/relay/flows');

    return { success: true, templateId: newId };
  } catch (e: any) {
    console.error('Failed to duplicate system flow template:', e);
    return { success: false, error: e.message };
  }
}

// ---------------------------------------------------------------------------
// 16. Seed in-memory templates to Firestore
// ---------------------------------------------------------------------------
export async function seedSystemFlowTemplatesToDB(
  userId: string
): Promise<{ success: boolean; seeded: number; skipped: number; error?: string }> {
  try {
    const snap = await adminDb.collection('systemFlowTemplates').get();
    const existingFunctionIds = new Set(
      snap.docs.map((d) => d.data()?.functionId).filter(Boolean)
    );

    const now = new Date().toISOString();
    let seeded = 0;
    let skipped = 0;

    for (const tpl of SYSTEM_FLOW_TEMPLATES) {
      if (existingFunctionIds.has(tpl.functionId)) {
        skipped++;
        continue;
      }

      const record: SystemFlowTemplateRecord = {
        ...tpl,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        status: 'active',
      };

      await adminDb.collection('systemFlowTemplates').doc(tpl.id).set(record);
      seeded++;
    }

    const { revalidatePath } = await import('next/cache');
    revalidatePath('/admin/relay/flows');

    return { success: true, seeded, skipped };
  } catch (e: any) {
    console.error('Failed to seed system flow templates:', e);
    return { success: false, seeded: 0, skipped: 0, error: e.message };
  }
}
