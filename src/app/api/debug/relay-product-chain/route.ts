import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getFlowTemplateForFunction } from '@/lib/flow-templates';
import type { FlowDefinition } from '@/lib/types-flow-engine';

// ── /api/debug/relay-product-chain ─────────────────────────────────────
//
// Read-only diagnostic for the product_card render chain in Test Chat.
// Mirrors the structure of /api/debug/sms-flow: each check is isolated
// in its own try/catch so one failure never prevents the rest from
// running. Fixes nothing — surfaces what's broken so the next session
// can fix it from real data.

type Status = 'OK' | 'WARN' | 'FAIL';

interface Check {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  status: Status;
  message: string;
  details?: Record<string, unknown>;
}

// Mirror of admin-block-data.ts:104 PRODUCT_BLOCK_PREFERRED_SLUGS
// (only the product_card row — the other rows aren't relevant here).
// Inlined because the constant isn't exported from admin-block-data.ts
// and the diagnostic's allowlist forbids touching that file. If the
// preferred-slug list changes there, update this mirror.
const PRODUCT_CARD_PREFERRED_SLUGS: readonly string[] = [
  'products',
  'catalog',
  'inventory',
];
const PRODUCT_BLOCK_KEYS: readonly string[] = [
  'product_card',
  'ecom_product_card',
  'menu',
  'fb_menu',
  'services',
  'menu_item',
  'drink_menu',
];

function makeFail(
  step: Check['step'],
  name: string,
  err: unknown,
): Check {
  return {
    step,
    name,
    status: 'FAIL',
    message: 'Check threw — see details',
    details: {
      error: err instanceof Error ? err.message : String(err),
    },
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const partnerId = searchParams.get('partnerId') ?? '';
  const conversationId = searchParams.get('conversationId') ?? '';

  const checks: Check[] = [];

  if (!partnerId) {
    checks.push({
      step: 1,
      name: 'Input parameters',
      status: 'FAIL',
      message: 'partnerId query parameter is required',
    });
    return NextResponse.json({
      partnerId,
      conversationId,
      checks,
      summary: { firstFailure: 1, verdict: 'BROKEN' as const },
    });
  }

  // ── Step 1: Partner exists and has businessModules ─────────────────
  let partnerModules: Array<{
    id: string;
    moduleSlug: string;
    name?: string;
    createdAt?: string;
  }> = [];
  let partnerData: Record<string, unknown> | null = null;
  try {
    const partnerSnap = await db.collection('partners').doc(partnerId).get();
    if (!partnerSnap.exists) {
      checks.push({
        step: 1,
        name: 'Partner has businessModules',
        status: 'FAIL',
        message: `No partner document at partners/${partnerId}`,
      });
    } else {
      partnerData = partnerSnap.data() as Record<string, unknown>;
      const modulesSnap = await db
        .collection(`partners/${partnerId}/businessModules`)
        .orderBy('createdAt', 'desc')
        .get();
      partnerModules = modulesSnap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          moduleSlug: typeof data.moduleSlug === 'string' ? data.moduleSlug : '',
          name: typeof data.name === 'string' ? data.name : undefined,
          createdAt:
            typeof data.createdAt === 'string' ? data.createdAt : undefined,
        };
      });
      checks.push({
        step: 1,
        name: 'Partner has businessModules',
        status: partnerModules.length > 0 ? 'OK' : 'FAIL',
        message:
          partnerModules.length > 0
            ? `${partnerModules.length} module(s) enabled`
            : 'Partner exists but has zero businessModules — Test Chat will render fallback samples',
        details: {
          moduleCount: partnerModules.length,
          slugs: partnerModules.map((m) => m.moduleSlug),
        },
      });
    }
  } catch (err) {
    checks.push(makeFail(1, 'Partner has businessModules', err));
  }

  // ── Step 2: Module-selection: preferred match or fallback? ─────────
  let selectedModule: typeof partnerModules[number] | null = null;
  let selectionReason: 'preferred' | 'fallback' | 'none' = 'none';
  let matchedPreferredSlug: string | null = null;
  try {
    if (partnerModules.length === 0) {
      checks.push({
        step: 2,
        name: 'Module matches preferred slugs (or fallback resolves)',
        status: 'FAIL',
        message: 'Skipped — no modules to choose from (see step 1)',
      });
    } else {
      // Mirror buildProductCard's pickModuleByPurpose: per-slug preference
      // first, then first-with-items fallback. We don't have items loaded
      // here yet; preferred selection ignores items, fallback requires
      // them — step 3 will load items for the selected module to
      // distinguish "selected but empty" from "selected and populated".
      for (const slug of PRODUCT_CARD_PREFERRED_SLUGS) {
        const match = partnerModules.find((m) => m.moduleSlug === slug);
        if (match) {
          selectedModule = match;
          selectionReason = 'preferred';
          matchedPreferredSlug = slug;
          break;
        }
      }
      if (!selectedModule) {
        // Fallback: first module (by createdAt desc, the order returned
        // by getPartnerModulesAction). buildProductCard further requires
        // items.length > 0 for fallback — we approximate with "first
        // module" here and let step 3 confirm whether it has items.
        selectedModule = partnerModules[0] ?? null;
        selectionReason = selectedModule ? 'fallback' : 'none';
      }
      if (selectedModule) {
        checks.push({
          step: 2,
          name: 'Module matches preferred slugs (or fallback resolves)',
          status: selectionReason === 'preferred' ? 'OK' : 'WARN',
          message:
            selectionReason === 'preferred'
              ? `Preferred-slug match: "${matchedPreferredSlug}" → module "${selectedModule.moduleSlug}"`
              : `No preferred-slug match in [${PRODUCT_CARD_PREFERRED_SLUGS.join(', ')}]; falling back to first module by createdAt: "${selectedModule.moduleSlug}"`,
          details: {
            preferredSlugs: [...PRODUCT_CARD_PREFERRED_SLUGS],
            availableSlugs: partnerModules.map((m) => m.moduleSlug),
            selectedModuleId: selectedModule.id,
            selectedModuleSlug: selectedModule.moduleSlug,
            selectionReason,
            matchedPreferredSlug,
          },
        });
      } else {
        checks.push({
          step: 2,
          name: 'Module matches preferred slugs (or fallback resolves)',
          status: 'FAIL',
          message: 'No module could be selected',
        });
      }
    }
  } catch (err) {
    checks.push(makeFail(2, 'Module matches preferred slugs (or fallback resolves)', err));
  }

  // ── Step 3: Selected module has active items ───────────────────────
  try {
    if (!selectedModule) {
      checks.push({
        step: 3,
        name: 'Selected module has active items',
        status: 'FAIL',
        message: 'Skipped — no module selected (see step 2)',
      });
    } else {
      const itemsSnap = await db
        .collection(
          `partners/${partnerId}/businessModules/${selectedModule.id}/items`,
        )
        .get();
      let activeCount = 0;
      let inactiveCount = 0;
      const sampleNames: string[] = [];
      for (const doc of itemsSnap.docs) {
        const data = doc.data() as Record<string, unknown>;
        const isActive = data.isActive === true;
        if (isActive) {
          activeCount += 1;
          if (sampleNames.length < 3) {
            const name =
              typeof data.name === 'string'
                ? data.name
                : typeof data.title === 'string'
                  ? data.title
                  : '(unnamed)';
            sampleNames.push(name);
          }
        } else {
          inactiveCount += 1;
        }
      }
      const status: Status =
        activeCount > 0 ? 'OK' : itemsSnap.size > 0 ? 'WARN' : 'FAIL';
      const message =
        activeCount > 0
          ? `${activeCount} active item(s)${inactiveCount > 0 ? ` (+${inactiveCount} inactive ignored)` : ''}`
          : itemsSnap.size > 0
            ? `${inactiveCount} item(s) but none active — buildProductCard returns undefined → fallback sample renders`
            : `Module "${selectedModule.moduleSlug}" has no items at all`;
      checks.push({
        step: 3,
        name: 'Selected module has active items',
        status,
        message,
        details: {
          moduleId: selectedModule.id,
          moduleSlug: selectedModule.moduleSlug,
          activeCount,
          inactiveCount,
          totalCount: itemsSnap.size,
          sampleActiveNames: sampleNames,
        },
      });
    }
  } catch (err) {
    checks.push(makeFail(3, 'Selected module has active items', err));
  }

  // ── Step 4: product_card in current stage's allowed blocks ─────────
  let flowDef: FlowDefinition | null = null;
  let flowSource: 'partner_override' | 'system_template' | 'none' = 'none';
  let currentStageId: string | null = null;
  try {
    const persona = partnerData?.businessPersona as
      | { identity?: { businessCategories?: Array<{ functionId?: string }> } }
      | undefined;
    const functionId =
      persona?.identity?.businessCategories?.[0]?.functionId ?? 'general';

    try {
      const overrideDoc = await db
        .collection('partners')
        .doc(partnerId)
        .collection('relayConfig')
        .doc('flowDefinition')
        .get();
      if (overrideDoc.exists) {
        flowDef = overrideDoc.data() as FlowDefinition;
        flowSource = 'partner_override';
      }
    } catch {
      /* fall through to template */
    }
    if (!flowDef) {
      const tpl = getFlowTemplateForFunction(functionId);
      if (tpl) {
        flowDef = tpl as unknown as FlowDefinition;
        flowSource = 'system_template';
      }
    }

    if (conversationId) {
      try {
        const convSnap = await db
          .collection('relayConversations')
          .doc(conversationId)
          .get();
        const flowState = convSnap.data()?.flowState as
          | { currentStageId?: string }
          | undefined;
        currentStageId = flowState?.currentStageId ?? null;
      } catch {
        /* leave currentStageId null */
      }
    }

    if (!flowDef) {
      checks.push({
        step: 4,
        name: 'product_card in current stage allowed blocks',
        status: 'FAIL',
        message: `No flow definition resolved for partner (functionId=${functionId})`,
        details: { functionId, flowSource },
      });
    } else if (!currentStageId) {
      checks.push({
        step: 4,
        name: 'product_card in current stage allowed blocks',
        status: 'WARN',
        message:
          'No active conversation stage — send a chat turn first, then re-run',
        details: {
          functionId,
          flowSource,
          flowId: flowDef.id,
          stageCount: flowDef.stages.length,
        },
      });
    } else {
      const stage = flowDef.stages.find((s) => s.id === currentStageId);
      if (!stage) {
        checks.push({
          step: 4,
          name: 'product_card in current stage allowed blocks',
          status: 'FAIL',
          message: `Conversation references stage "${currentStageId}" but flow definition has no such stage`,
          details: {
            functionId,
            flowSource,
            currentStageId,
            availableStageIds: flowDef.stages.map((s) => s.id),
          },
        });
      } else {
        const allowed = stage.blockTypes ?? [];
        const hasProductCard = allowed.includes('product_card');
        const hasEcomProductCard = allowed.includes('ecom_product_card');
        const matched = hasProductCard
          ? 'product_card'
          : hasEcomProductCard
            ? 'ecom_product_card'
            : null;
        checks.push({
          step: 4,
          name: 'product_card in current stage allowed blocks',
          status: matched ? 'OK' : 'FAIL',
          message: matched
            ? `Stage "${stage.label}" allows "${matched}"`
            : `Stage "${stage.label}" does NOT allow product_card or ecom_product_card — Gemini cannot pick it`,
          details: {
            functionId,
            flowSource,
            currentStageId,
            stageLabel: stage.label,
            stageType: stage.type,
            allowedBlocks: allowed,
          },
        });
      }
    }
  } catch (err) {
    checks.push(makeFail(4, 'product_card in current stage allowed blocks', err));
  }

  // ── Step 5: product_card is a known buildBlockData key ─────────────
  try {
    const known = PRODUCT_BLOCK_KEYS.includes('product_card');
    checks.push({
      step: 5,
      name: 'product_card is a known buildBlockData key',
      status: known ? 'OK' : 'FAIL',
      message: known
        ? 'admin-block-data.ts dispatches product_card → buildProductCard'
        : 'product_card missing from admin-block-data.ts dispatch — buildBlockData returns undefined',
      details: { knownProductBlockKeys: [...PRODUCT_BLOCK_KEYS] },
    });
  } catch (err) {
    checks.push(makeFail(5, 'product_card is a known buildBlockData key', err));
  }

  // ── Step 6: Most recent turn picked product_card with items ────────
  try {
    if (!conversationId) {
      checks.push({
        step: 6,
        name: 'Most recent turn resolved to product_card',
        status: 'WARN',
        message: 'No conversationId provided',
      });
    } else {
      const turnsSnap = await db
        .collection('relayConversations')
        .doc(conversationId)
        .collection('turns')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      if (turnsSnap.empty) {
        checks.push({
          step: 6,
          name: 'Most recent turn resolved to product_card',
          status: 'WARN',
          message: 'No turns recorded yet — send a chat turn first',
          details: { conversationId },
        });
      } else {
        const turn = turnsSnap.docs[0].data() as Record<string, unknown>;
        const assistant = turn.assistantResponse as
          | { blockId?: string; blockData?: Record<string, unknown> }
          | undefined;
        const blockId = assistant?.blockId;
        const blockData = assistant?.blockData;
        const items =
          blockData && Array.isArray((blockData as { items?: unknown }).items)
            ? ((blockData as { items: unknown[] }).items as unknown[])
            : [];
        const isProductBlock =
          blockId === 'product_card' || blockId === 'ecom_product_card';
        const status: Status = !blockId
          ? 'WARN'
          : !isProductBlock
            ? 'FAIL'
            : items.length > 0
              ? 'OK'
              : 'FAIL';
        const message = !blockId
          ? 'Last turn returned no blockId (text-only response)'
          : !isProductBlock
            ? `Last turn picked "${blockId}", not product_card — Gemini chose a different block`
            : items.length > 0
              ? `Last turn rendered "${blockId}" with ${items.length} real item(s)`
              : `Last turn picked "${blockId}" but blockData.items is empty → fallback sample renders`;
        checks.push({
          step: 6,
          name: 'Most recent turn resolved to product_card',
          status,
          message,
          details: {
            blockId: blockId ?? null,
            itemCount: items.length,
            userMessage:
              typeof turn.userMessage === 'string' ? turn.userMessage : null,
            createdAt:
              typeof turn.createdAt === 'string' ? turn.createdAt : null,
            blockDataKeys: blockData ? Object.keys(blockData) : [],
          },
        });
      }
    }
  } catch (err) {
    checks.push(makeFail(6, 'Most recent turn resolved to product_card', err));
  }

  const failures = checks.filter((c) => c.status === 'FAIL');
  const warnings = checks.filter((c) => c.status === 'WARN');
  const firstFailure = failures.length > 0 ? failures[0].step : null;
  const verdict: 'ALL_OK' | 'PARTIAL' | 'BROKEN' =
    failures.length > 0
      ? 'BROKEN'
      : warnings.length > 0
        ? 'PARTIAL'
        : 'ALL_OK';

  return NextResponse.json({
    partnerId,
    conversationId,
    checks,
    summary: { firstFailure, verdict },
  });
}
