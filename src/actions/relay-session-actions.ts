'use server';

import { db } from '@/lib/firebase-admin';
import type {
  RelaySessionData,
  SessionModuleItem,
  SessionBrand,
  SessionContact,
  SessionFlowStage,
  SessionFlowDefinition,
  SessionBlockOverride,
  BlockDefinition,
} from '@/lib/relay/types';

// ── Load full relay session in one shot ─────────────────────────────────

export async function loadRelaySessionAction(partnerId: string): Promise<{
  success: boolean;
  data?: RelaySessionData;
  error?: string;
}> {
  try {
    const [
      partnerSnap,
      relayConfigSnap,
      partnerBlocksSnap,
      coreHubSnap,
      systemModulesSnap,
      flowTemplatesSnap,
    ] = await Promise.all([
      db.collection('partners').doc(partnerId).get(),
      db.collection('partners').doc(partnerId).collection('relayConfig').doc('config').get(),
      db.collection(`partners/${partnerId}/relayConfig/blocks`).orderBy('sortOrder', 'asc').get()
        .catch(() => null),
      db.collection('partners').doc(partnerId).collection('coreHub').doc('data').collection('items').get(),
      db.collection('systemModules').get(),
      db.collection('systemFlowTemplates').where('status', '==', 'active').get(),
    ]);

    // ── Partner & brand ───────────────────────────────────────────────
    const partnerData = partnerSnap.data() || {};
    const relayConfig = relayConfigSnap.exists ? relayConfigSnap.data()! : {};

    const brand: SessionBrand = {
      name: relayConfig.brandName || partnerData.businessName || '',
      tagline: relayConfig.tagline || '',
      emoji: relayConfig.brandEmoji || '🤖',
      accentColor: relayConfig.accentColor || '#c2410c',
      logoUrl: partnerData.logoUrl || undefined,
      welcomeMessage: relayConfig.welcomeMessage || undefined,
    };

    const contact: SessionContact = {
      whatsapp: partnerData.whatsAppPhone || undefined,
      phone: partnerData.phone || undefined,
      email: partnerData.email || undefined,
    };

    // ── Category from industry ────────────────────────────────────────
    const industry = partnerData.industry;
    const category: string = industry?.id || industry?.name?.toLowerCase().replace(/\s+/g, '_') || 'general';

    // ── CoreHub items → SessionModuleItem[] ───────────────────────────
    const items: SessionModuleItem[] = [];
    coreHubSnap.docs.forEach((doc) => {
      const d = doc.data();
      items.push({
        id: doc.id,
        moduleSlug: d.moduleSlug || d.moduleName || '',
        name: d.name || d.title || doc.id,
        description: d.description || undefined,
        price: typeof d.price === 'number' ? d.price : undefined,
        currency: d.currency || undefined,
        imageUrl: d.imageUrl || d.image || undefined,
        tags: Array.isArray(d.tags) ? d.tags : undefined,
        status: d.status || 'active',
        raw: d,
      });
    });

    // ── System modules → BlockDefinition stubs (for registry matching) ─
    const blocks: BlockDefinition[] = [];
    // We don't map system modules to BlockDefinitions here —
    // block definitions come from the client-side registry.
    // This field is reserved for future server-side block metadata.

    // ── Flow template matching ────────────────────────────────────────
    let flow: SessionFlowDefinition | undefined;
    for (const doc of flowTemplatesSnap.docs) {
      const d = doc.data();
      if (d.industryId === category || d.functionId === category) {
        const stages: SessionFlowStage[] = (d.stages || []).map((s: any) => ({
          id: s.id,
          type: s.type,
          label: s.label,
          blockIds: s.blockTypes || [],
          transitions: (d.transitions || [])
            .filter((t: any) => t.from === s.id)
            .map((t: any) => ({ target: t.to, condition: t.trigger || undefined })),
        }));

        flow = {
          id: doc.id,
          vertical: d.functionId || d.industryId || category,
          stages,
          defaultStageId: stages.find((s: SessionFlowStage) => s.type === 'greeting')?.id || stages[0]?.id || '',
        };
        break;
      }
    }

    // ── Partner block overrides ───────────────────────────────────────
    const blockOverrides: SessionBlockOverride[] = [];
    if (partnerBlocksSnap) {
      partnerBlocksSnap.docs.forEach((doc) => {
        const d = doc.data();
        blockOverrides.push({
          blockId: d.templateId || doc.id,
          isVisible: d.isVisible !== false,
          sortOrder: d.sortOrder ?? 0,
          customLabel: d.customLabel || undefined,
          customConfig: d.customConfig || undefined,
        });
      });
    }

    const data: RelaySessionData = {
      partnerId,
      category,
      brand,
      contact,
      items,
      blocks,
      flow,
      blockOverrides,
      cachedAt: Date.now(),
    };

    return { success: true, data };
  } catch (e: any) {
    console.error('Failed to load relay session:', e);
    return { success: false, error: e.message };
  }
}
