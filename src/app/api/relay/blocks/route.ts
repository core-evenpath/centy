import { NextRequest, NextResponse } from 'next/server';
import { db as adminDb, adminAuth } from '@/lib/firebase-admin';
import { getGlobalBlockConfigs } from '@/lib/relay/block-config-service';
import type {
    MergedBlockDesign,
    BlocksDesignResponse,
    UnifiedBlockConfig,
} from '@/lib/relay/types';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Relay-Widget-Id',
};

interface PartnerBlockOverride {
    id: string;
    templateId?: string;
    isVisible?: boolean;
    sortOrder?: number;
    customLabel?: string;
    customDescription?: string;
}

export async function OPTIONS() {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const widgetId = searchParams.get('widgetId') || undefined;
        const partnerIdParam = searchParams.get('partnerId') || undefined;
        const familyFilter = searchParams.get('family') || undefined;
        const categoryFilter = searchParams.get('category') || undefined;

        // ── Resolve partnerId ────────────────────────────────────────────
        // Public path: ?widgetId=... (no auth, CORS *)
        // Admin path: ?partnerId=... (requires Bearer token matching partnerId)

        let partnerId: string | undefined;
        let isPublicPath = false;

        if (widgetId) {
            const widgetDoc = await adminDb.collection('relayWidgets').doc(widgetId).get();
            if (!widgetDoc.exists) {
                return NextResponse.json(
                    { error: 'Widget not found' },
                    { status: 404, headers: corsHeaders },
                );
            }
            partnerId = widgetDoc.data()?.partnerId;
            if (!partnerId) {
                return NextResponse.json(
                    { error: 'Partner not found for widget' },
                    { status: 404, headers: corsHeaders },
                );
            }
            isPublicPath = true;
        } else if (partnerIdParam) {
            const authHeader = request.headers.get('authorization') || '';
            if (!authHeader.startsWith('Bearer ')) {
                return NextResponse.json(
                    { error: 'Missing or invalid authorization header' },
                    { status: 401, headers: corsHeaders },
                );
            }
            try {
                const idToken = authHeader.split('Bearer ')[1];
                const decoded = await adminAuth.verifyIdToken(idToken);
                const isPartnerAdmin =
                    decoded.role === 'partner_admin' && decoded.partnerId === partnerIdParam;
                const isSuperAdmin =
                    decoded.role === 'Super Admin' || decoded.role === 'Admin';
                if (!isPartnerAdmin && !isSuperAdmin) {
                    return NextResponse.json(
                        { error: 'Insufficient permissions' },
                        { status: 403, headers: corsHeaders },
                    );
                }
            } catch {
                return NextResponse.json(
                    { error: 'Invalid token' },
                    { status: 401, headers: corsHeaders },
                );
            }
            partnerId = partnerIdParam;
        } else {
            return NextResponse.json(
                { error: 'widgetId or partnerId is required' },
                { status: 400, headers: corsHeaders },
            );
        }

        // ── Load global block designs + partner overrides in parallel ────

        const [globalConfigsRaw, overrideSnap] = await Promise.all([
            getGlobalBlockConfigs(),
            adminDb.collection(`partners/${partnerId}/relayConfig/blocks`).get(),
        ]);

        // ── Apply filters ────────────────────────────────────────────────

        let globalConfigs: UnifiedBlockConfig[] = globalConfigsRaw;
        if (familyFilter) {
            globalConfigs = globalConfigs.filter((b) => b.family === familyFilter);
        }
        if (categoryFilter) {
            globalConfigs = globalConfigs.filter((b) =>
                b.applicableCategories.includes(categoryFilter),
            );
        }

        // ── Index partner overrides by templateId ────────────────────────

        const overridesByTemplateId = new Map<string, PartnerBlockOverride>();
        overrideSnap.docs.forEach((doc) => {
            const data = doc.data() as Omit<PartnerBlockOverride, 'id'>;
            const templateId = data.templateId;
            if (templateId) {
                overridesByTemplateId.set(templateId, { id: doc.id, ...data });
            }
        });

        // ── Merge ────────────────────────────────────────────────────────

        const merged: MergedBlockDesign[] = globalConfigs.map((g) => {
            const override = overridesByTemplateId.get(g.id);
            const hasPartnerOverride = !!override;
            return {
                id: g.id,
                family: g.family,
                label: override?.customLabel || g.label,
                description: override?.customDescription || g.description,
                applicableCategories: g.applicableCategories,
                intents: g.intents,
                fields_req: g.fields_req,
                fields_opt: g.fields_opt,
                variants: g.variants,
                sampleData: g.sampleData,
                preloadable: g.preloadable,
                streamable: g.streamable,
                cacheDuration: g.cacheDuration,
                isVisible: override?.isVisible ?? true,
                sortOrder: override?.sortOrder ?? Number.MAX_SAFE_INTEGER,
                hasPartnerOverride,
                ...(override?.customLabel ? { customLabel: override.customLabel } : {}),
                ...(override?.customDescription
                    ? { customDescription: override.customDescription }
                    : {}),
            };
        });

        // Sort: sortOrder asc, then family, then label
        merged.sort((a, b) => {
            if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
            if (a.family !== b.family) return a.family.localeCompare(b.family);
            return a.label.localeCompare(b.label);
        });

        // ── Families (computed from the unfiltered list so the UI can
        //    build a complete family filter, similar to getRegisteredBlocksAction) ─

        const families = Array.from(new Set(globalConfigsRaw.map((b) => b.family))).sort();

        const body: BlocksDesignResponse = {
            partnerId,
            blocks: merged,
            families,
            totalCount: globalConfigsRaw.length,
        };

        return NextResponse.json(body, {
            headers: {
                ...corsHeaders,
                'Cache-Control': isPublicPath ? 'public, max-age=60' : 'no-store',
            },
        });
    } catch (error) {
        console.error('[relay/blocks] fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch blocks design' },
            { status: 500, headers: corsHeaders },
        );
    }
}
