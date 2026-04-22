import { NextRequest, NextResponse } from 'next/server';
import { db as adminDb } from '@/lib/firebase-admin';
import { buildBlockData } from '@/lib/relay/admin-block-data';
import { resolveFlowDefinition } from '@/lib/relay/flow-loader';
import { getEntryStage } from '@/lib/relay/flow-to-blocks';
import {
  getModuleItemsAction,
  getPartnerModulesAction,
  getSystemModuleAction,
} from '@/actions/modules-actions';

// ── /api/relay/chat/seed ───────────────────────────────────────────────
//
// Returns the entry-stage blocks for a partner's flow so Test Chat can
// mirror the live widget's first impression instead of opening empty.
// CORS-friendly like the rest of the relay endpoints.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Relay-Widget-Id',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

interface SeedBody {
  partnerId?: string;
}

async function loadModuleSummaries(partnerId: string) {
  const modules: Array<{ slug: string; name: string; items: unknown[] }> = [];
  try {
    const pmRes = await getPartnerModulesAction(partnerId);
    const pms = pmRes.success ? pmRes.data ?? [] : [];
    for (const pm of pms.slice(0, 10)) {
      const sysRes = await getSystemModuleAction(pm.moduleSlug);
      if (!sysRes.success || !sysRes.data) continue;
      const itemsRes = await getModuleItemsAction(partnerId, pm.id, {
        isActive: true,
        pageSize: 20,
        sortBy: 'sortOrder',
        sortOrder: 'asc',
      });
      const items = itemsRes.success ? itemsRes.data?.items ?? [] : [];
      modules.push({ slug: pm.moduleSlug, name: sysRes.data.name, items });
    }
  } catch {
    /* non-fatal */
  }
  return modules;
}

export async function POST(request: NextRequest) {
  let body: SeedBody;
  try {
    body = (await request.json()) as SeedBody;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON' },
      { status: 400, headers: corsHeaders },
    );
  }

  const partnerId = body.partnerId;
  if (!partnerId) {
    return NextResponse.json(
      { success: false, error: 'partnerId required' },
      { status: 400, headers: corsHeaders },
    );
  }

  try {
    const partnerDoc = await adminDb.collection('partners').doc(partnerId).get();
    const partnerData: Record<string, unknown> = partnerDoc.data() ?? {};
    const businessPersona = partnerData.businessPersona as
      | Record<string, unknown>
      | undefined;
    const identity = businessPersona?.identity as
      | Record<string, unknown>
      | undefined;
    const businessCategories = identity?.businessCategories as
      | Array<{ functionId?: string }>
      | undefined;
    const functionId =
      (businessCategories?.[0]?.functionId as string | undefined) ?? 'general';

    const { flow: flowDef } = await resolveFlowDefinition(partnerId, functionId);
    const entryStage = getEntryStage(flowDef);
    if (!entryStage) {
      return NextResponse.json(
        { success: true, seedMessages: [], entryStage: null },
        { headers: corsHeaders },
      );
    }

    const modules = await loadModuleSummaries(partnerId);

    const seedMessages = (entryStage.blockTypes ?? []).map(
      (blockId, idx) => ({
        id: `seed_${idx}_${blockId}`,
        role: 'assistant' as const,
        content: '',
        blockId,
        blockData: buildBlockData({
          blockId,
          partnerData: partnerData as Record<string, unknown> | null,
          modules,
        }),
        stageId: entryStage.id,
      }),
    );

    return NextResponse.json(
      {
        success: true,
        seedMessages,
        entryStage: {
          id: entryStage.id,
          label: entryStage.label,
          type: entryStage.type,
        },
      },
      { headers: corsHeaders },
    );
  } catch (err) {
    console.error('[relay/chat/seed] failed:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Seed failed',
      },
      { status: 500, headers: corsHeaders },
    );
  }
}
