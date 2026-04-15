'use server';

/**
 * Content Studio — registry reader.
 *
 * Exposes the block registry (vertical configs + per-block data contracts)
 * in a server-friendly shape, stripped of React component references.
 *
 * All 14 verticals with preview configs are registered in
 * `VERTICAL_CONFIG_MAP`. Verticals without a matching key fall back to a
 * stub with `blocks: []` on the partner page.
 */

import { ECOM_CONFIG } from '@/app/admin/relay/blocks/previews/ecommerce';
import { EDU_CONFIG } from '@/app/admin/relay/blocks/previews/education';
import { HOSP_CONFIG } from '@/app/admin/relay/blocks/previews/hospitality';
import { HC_CONFIG } from '@/app/admin/relay/blocks/previews/healthcare';
import { BIZ_CONFIG } from '@/app/admin/relay/blocks/previews/business';
import { FB_CONFIG } from '@/app/admin/relay/blocks/previews/food_beverage';
import { FS_CONFIG } from '@/app/admin/relay/blocks/previews/food_supply';
import { PW_CONFIG } from '@/app/admin/relay/blocks/previews/personal_wellness';
import { AUTO_CONFIG } from '@/app/admin/relay/blocks/previews/automotive';
import { TL_CONFIG } from '@/app/admin/relay/blocks/previews/travel_transport';
import { EVT_CONFIG } from '@/app/admin/relay/blocks/previews/events_entertainment';
import { PU_CONFIG } from '@/app/admin/relay/blocks/previews/public_nonprofit';
import { HP_CONFIG } from '@/app/admin/relay/blocks/previews/home_property';
import { FIN_CONFIG } from '@/app/admin/relay/blocks/previews/financial_services';
import type { VerticalConfig } from '@/app/admin/relay/blocks/previews/_types';

// ── Ecommerce block definitions (data contracts) ─────────────────────
import { definition as ecomProductCard } from '@/lib/relay/blocks/ecommerce/product-card';
import { definition as ecomProductDetail } from '@/lib/relay/blocks/ecommerce/product-detail';
import { definition as ecomCompare } from '@/lib/relay/blocks/ecommerce/compare';
import { definition as ecomCart } from '@/lib/relay/blocks/ecommerce/cart';
import { definition as ecomOrderConfirmation } from '@/lib/relay/blocks/ecommerce/order-confirmation';
import { definition as ecomOrderTracker } from '@/lib/relay/blocks/ecommerce/order-tracker';
import { definition as ecomPromo } from '@/lib/relay/blocks/ecommerce/promo';
import { definition as ecomGreeting } from '@/lib/relay/blocks/ecommerce/greeting';

// ── Education block definitions (data contracts) ─────────────────────
import { definition as eduCourseCard } from '@/lib/relay/blocks/education/course-card';
import { definition as eduCourseDetail } from '@/lib/relay/blocks/education/course-detail';
import { definition as eduCurriculum } from '@/lib/relay/blocks/education/curriculum';
import { definition as eduInstructor } from '@/lib/relay/blocks/education/instructor';
import { definition as eduSchedule } from '@/lib/relay/blocks/education/schedule';
import { definition as eduFeeStructure } from '@/lib/relay/blocks/education/fee-structure';
import { definition as eduEnrollment } from '@/lib/relay/blocks/education/enrollment';
import { definition as eduBatchSelector } from '@/lib/relay/blocks/education/batch-selector';
import { definition as eduAssessment } from '@/lib/relay/blocks/education/assessment';
import { definition as eduProgress } from '@/lib/relay/blocks/education/progress';
import { definition as eduCertificate } from '@/lib/relay/blocks/education/certificate';
import { definition as eduResources } from '@/lib/relay/blocks/education/resources';
import { definition as eduFacility } from '@/lib/relay/blocks/education/facility';
import { definition as eduStudentReview } from '@/lib/relay/blocks/education/student-review';

import type { BlockDefinition } from '@/lib/relay/types';
import { VERTICAL_IDS, type VerticalId } from './verticals';

const VERTICAL_CONFIG_MAP: Partial<Record<VerticalId, VerticalConfig>> = {
    ecommerce: ECOM_CONFIG,
    education: EDU_CONFIG,
    hospitality: HOSP_CONFIG,
    healthcare: HC_CONFIG,
    business: BIZ_CONFIG,
    food_beverage: FB_CONFIG,
    food_supply: FS_CONFIG,
    personal_wellness: PW_CONFIG,
    automotive: AUTO_CONFIG,
    travel_transport: TL_CONFIG,
    events_entertainment: EVT_CONFIG,
    public_nonprofit: PU_CONFIG,
    home_property: HP_CONFIG,
    financial_services: FIN_CONFIG,
};

/**
 * Per-vertical map of preview-registry block id → BlockDefinition. Keyed
 * by the short id used in the preview registry (e.g. 'product_card'),
 * not the fully qualified id (e.g. 'ecom_product_card').
 */
const BLOCK_DATA_CONTRACTS: Partial<Record<VerticalId, Record<string, BlockDefinition>>> = {
    ecommerce: {
        product_card: ecomProductCard,
        product_detail: ecomProductDetail,
        compare: ecomCompare,
        // The preview registry uses ids like 'order_confirmation'; the
        // definitions use prefixed ids like 'ecom_order_confirmation'. We
        // expose by the short key so the consumer doesn't need to know.
        order_confirmation: ecomOrderConfirmation,
        order_tracker: ecomOrderTracker,
        // Bonus defs not in the preview registry but available if added:
        cart: ecomCart,
        promo: ecomPromo,
        greeting: ecomGreeting,
    },
    education: {
        course_card: eduCourseCard,
        course_detail: eduCourseDetail,
        curriculum: eduCurriculum,
        instructor: eduInstructor,
        schedule: eduSchedule,
        fee_structure: eduFeeStructure,
        enrollment: eduEnrollment,
        batch_selector: eduBatchSelector,
        assessment: eduAssessment,
        progress: eduProgress,
        certificate: eduCertificate,
        resources: eduResources,
        facility: eduFacility,
        student_review: eduStudentReview,
    },
};

export interface VerticalRegistryData {
    verticalId: string;
    config: {
        name: string;
        industryId: string;
        iconName: string;
        accentColor: string;
    };
    blocks: Array<{
        id: string;
        family: string;
        label: string;
        stage: string;
        status: string;
        desc: string;
        intents: string[];
        module: string | null;
        subVerticals: string[];
    }>;
    families: Record<string, { label: string; color: string }>;
    subVerticals: Array<{ id: string; name: string; blockIds: string[] }>;
}

export interface DataContractInfo {
    required: Array<{ field: string; type: string; label: string }>;
    optional: Array<{ field: string; type: string; label: string }>;
}

function titleCase(id: string): string {
    return id
        .replace(/[_-]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

export async function getAllVerticalIds(): Promise<string[]> {
    return [...VERTICAL_IDS];
}

/**
 * Given an arbitrary slug from a partner doc (vertical id, sub-vertical id,
 * or industry id), resolve it to a Content Studio vertical id — or null if
 * no match. Checks, in order:
 *   1. exact match against `VERTICAL_IDS`
 *   2. sub-vertical membership across loaded preview configs
 *      (e.g. `ecommerce_d2c` → `ecommerce`)
 *   3. industryId match (e.g. `retail_commerce` → `ecommerce`)
 */
export async function resolveVerticalFromSlug(slug: string): Promise<string | null> {
    if (!slug) return null;
    if ((VERTICAL_IDS as readonly string[]).includes(slug)) return slug;
    for (const [vId, cfg] of Object.entries(VERTICAL_CONFIG_MAP)) {
        if (!cfg) continue;
        const subs = Array.isArray(cfg.subVerticals) ? cfg.subVerticals : [];
        if (subs.some(sv => sv?.id === slug)) return vId;
        if (cfg.industryId === slug) return vId;
    }
    return null;
}

export async function getVerticalRegistryData(
    verticalId: string
): Promise<VerticalRegistryData | null> {
    const cfg = VERTICAL_CONFIG_MAP[verticalId as VerticalId];
    if (!cfg) {
        // Stub for verticals without a preview config yet.
        if (!(VERTICAL_IDS as readonly string[]).includes(verticalId)) {
            return null;
        }
        return {
            verticalId,
            config: {
                name: titleCase(verticalId),
                industryId: verticalId,
                iconName: 'Package',
                accentColor: '#6b7280',
            },
            blocks: [],
            families: {},
            subVerticals: [],
        };
    }

    // Invert sub-vertical membership so each block knows which sub-verticals
    // it belongs to (surfaces in the partner UI filter).
    const blockSubVerticals: Record<string, string[]> = {};
    const safeSubs = Array.isArray(cfg.subVerticals) ? cfg.subVerticals : [];
    for (const sv of safeSubs) {
        if (!sv || !Array.isArray(sv.blocks)) continue;
        for (const blockId of sv.blocks) {
            if (!blockSubVerticals[blockId]) blockSubVerticals[blockId] = [];
            blockSubVerticals[blockId].push(sv.id);
        }
    }

    return {
        verticalId: cfg.id,
        config: {
            name: cfg.name,
            industryId: cfg.industryId,
            iconName: cfg.iconName,
            accentColor: cfg.accentColor,
        },
        blocks: (Array.isArray(cfg.blocks) ? cfg.blocks : []).map(b => ({
            id: b.id,
            family: b.family,
            label: b.label,
            stage: b.stage,
            status: b.status || 'active',
            desc: b.desc,
            intents: Array.isArray(b.intents) ? b.intents : [],
            module: b.module ?? null,
            subVerticals: blockSubVerticals[b.id] || [],
        })),
        families: cfg.families
            ? Object.fromEntries(
                Object.entries(cfg.families).map(([k, v]) => [k, { label: v.label, color: v.color }])
            )
            : {},
        subVerticals: safeSubs.map(sv => ({
            id: sv.id,
            name: sv.name,
            blockIds: sv.blocks,
        })),
    };
}

export async function getBlockDataContract(
    verticalId: string,
    blockId: string
): Promise<DataContractInfo> {
    const verticalMap = BLOCK_DATA_CONTRACTS[verticalId as VerticalId];
    const def = verticalMap?.[blockId];
    if (!def) {
        return { required: [], optional: [] };
    }

    return {
        required: def.dataContract.required.map(f => ({
            field: f.field,
            type: f.type,
            label: f.label || titleCase(f.field),
        })),
        optional: def.dataContract.optional.map(f => ({
            field: f.field,
            type: f.type,
            label: f.label || titleCase(f.field),
        })),
    };
}
