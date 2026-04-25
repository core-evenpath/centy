'use server';

// ── Partner-side Relay schema list (PR fix-17) ──────────────────────
//
// Replaces the legacy systemModules-driven /partner/relay/data page.
// The partner now sees their available schemas — sourced from
// `relaySchemas` (the canonical store managed at /admin/relay/data)
// — grouped by vertical, with item counts pulled from the partner's
// `businessModules` collection.
//
// This is the partner-side companion to the admin's /admin/relay/data:
//   - Admin manages the schema (fields, sample data, enrichment)
//   - Partner sees what schemas apply to their business + adds items
//
// No "enable / reset module" lifecycle. Schemas are intrinsic to
// what the partner's business is — partners just fill them with data.

import { db as adminDb } from '@/lib/firebase-admin';
import {
  getVerticalForSlug,
  RELAY_VERTICALS,
  type RelayVertical,
} from '@/lib/relay/relay-verticals';
import { seedSampleItemsAction } from '@/actions/relay-sample-data-actions';
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';

export interface PartnerSchemaCard {
  slug: string;
  name: string;
  description?: string;
  vertical: RelayVertical | null;
  fieldCount: number;
  /** Partner's items in the matching businessModule, 0 if none. */
  itemCount: number;
  /** True when partner already has an enabled businessModule with this slug. */
  hasModule: boolean;
  /** First N items as `{ name, subtitle? }` for the inline preview on
   *  the consolidated /partner/relay/data view (PR fix-21). Empty
   *  when the schema has no items. */
  previewItems?: Array<{ id: string; name: string; subtitle?: string }>;
}

export interface PartnerSchemasResult {
  success: boolean;
  schemas?: PartnerSchemaCard[];
  /** Best guess at partner's primary vertical (drives UI default-expanded
   *  section). Null when undetectable from identity. */
  partnerVertical?: RelayVertical | null;
  partnerCurrency?: string;
  partnerCountry?: string;
  partnerCategoryLabel?: string;
  error?: string;
}

// Most industryId values we've seen in the wild map to one Relay
// vertical. Falls back to null when no mapping exists — page expands
// nothing by default rather than guessing wrong.
const INDUSTRY_TO_VERTICAL: Record<string, RelayVertical> = {
  retail_commerce: 'ecommerce',
  ecommerce: 'ecommerce',
  food_dining: 'food_beverage',
  food_beverage: 'food_beverage',
  professional_services: 'business',
  business_services: 'business',
  healthcare: 'healthcare',
  health_wellness: 'personal_wellness',
  hospitality: 'hospitality',
  travel_hospitality: 'hospitality',
  travel: 'travel_transport',
  travel_transport: 'travel_transport',
  automotive: 'automotive',
  education: 'education',
  events_entertainment: 'events_entertainment',
  financial_services: 'financial_services',
  food_supply: 'food_supply',
  home_property: 'home_property',
  personal_wellness: 'personal_wellness',
  public_nonprofit: 'public_nonprofit',
};

function derivePartnerVertical(identity: any): RelayVertical | null {
  // Source 1: BusinessIdentityCard writes identity.industry.category
  // as the industryId (or sometimes a vertical name directly).
  const direct = identity?.industry?.category;
  if (typeof direct === 'string') {
    if ((RELAY_VERTICALS as readonly string[]).includes(direct)) {
      return direct as RelayVertical;
    }
    if (INDUSTRY_TO_VERTICAL[direct]) return INDUSTRY_TO_VERTICAL[direct];
  }

  // Source 2: businessCategories[0].industryId from onboarding flow.
  const categories = identity?.businessCategories;
  if (Array.isArray(categories) && categories.length > 0) {
    const industryId = categories[0]?.industryId;
    if (typeof industryId === 'string' && INDUSTRY_TO_VERTICAL[industryId]) {
      return INDUSTRY_TO_VERTICAL[industryId];
    }
  }

  return null;
}

function deriveCategoryLabel(identity: any): string | undefined {
  const directName = identity?.industry?.name;
  if (typeof directName === 'string' && directName) return directName;
  const cat = identity?.businessCategories?.[0];
  if (cat?.label) return cat.label;
  if (cat?.name) return cat.name;
  return undefined;
}

export async function listPartnerSchemasAction(
  partnerId: string,
): Promise<PartnerSchemasResult> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not available' };
    }
    if (!partnerId) {
      return { success: false, error: 'partnerId is required' };
    }

    // ── Identity for vertical hint + UI banner ──
    const partnerDoc = await adminDb.collection('partners').doc(partnerId).get();
    const persona = partnerDoc.exists
      ? (partnerDoc.data() as any)?.businessPersona
      : null;
    const identity = persona?.identity ?? {};
    const partnerVertical = derivePartnerVertical(identity);
    const partnerCurrency =
      typeof identity.currency === 'string' ? identity.currency : undefined;
    const partnerCountry =
      typeof identity?.address?.country === 'string'
        ? identity.address.country
        : undefined;
    const partnerCategoryLabel = deriveCategoryLabel(identity);

    // ── All schemas + partner module item counts in parallel ──
    const [schemasSnap, modulesSnap] = await Promise.all([
      adminDb.collection('relaySchemas').get(),
      adminDb.collection(`partners/${partnerId}/businessModules`).get(),
    ]);

    // Partner's enabled module slugs + item counts + moduleIds for
    // the preview-items fetch below.
    const itemCountBySlug = new Map<string, number>();
    const enabledSlugs = new Set<string>();
    const moduleIdBySlug = new Map<string, string>();
    for (const doc of modulesSnap.docs) {
      const data = doc.data() as any;
      const slug =
        typeof data.moduleSlug === 'string' ? data.moduleSlug : null;
      if (!slug) continue;
      enabledSlugs.add(slug);
      moduleIdBySlug.set(slug, doc.id);
      const count =
        typeof data.activeItemCount === 'number'
          ? data.activeItemCount
          : typeof data.itemCount === 'number'
            ? data.itemCount
            : 0;
      itemCountBySlug.set(slug, count);
    }

    // ── Inline previews (PR fix-21) ──
    // For schemas with items, fetch the first 3 items so the
    // consolidated view can show what's in there at a glance. Done
    // in parallel; capped to 50 modules to stay well under any
    // request budget.
    const previewBySlug = new Map<
      string,
      Array<{ id: string; name: string; subtitle?: string }>
    >();
    const slugsWithItems = Array.from(itemCountBySlug.entries())
      .filter(([, count]) => count > 0)
      .map(([slug]) => slug)
      .slice(0, 50);
    await Promise.all(
      slugsWithItems.map(async (slug) => {
        const moduleId = moduleIdBySlug.get(slug);
        if (!moduleId) return;
        try {
          const itemsSnap = await adminDb
            .collection(
              `partners/${partnerId}/businessModules/${moduleId}/items`,
            )
            .where('isActive', '==', true)
            .limit(3)
            .get();
          previewBySlug.set(
            slug,
            itemsSnap.docs.map((d) => {
              const it = d.data() as any;
              return {
                id: d.id,
                name:
                  typeof it.name === 'string' && it.name ? it.name : '(unnamed)',
                subtitle:
                  typeof it.description === 'string'
                    ? it.description
                    : typeof it.category === 'string'
                      ? it.category
                      : undefined,
              };
            }),
          );
        } catch {
          // non-fatal — preview is decorative
        }
      }),
    );

    const schemas: PartnerSchemaCard[] = schemasSnap.docs.map((doc) => {
      const data = doc.data() as any;
      const slug = doc.id;
      const fieldsRaw =
        data?.schema?.fields ?? data?.fields ?? [];
      const fieldCount = Array.isArray(fieldsRaw) ? fieldsRaw.length : 0;
      return {
        slug,
        name: typeof data?.name === 'string' && data.name ? data.name : slug,
        description:
          typeof data?.description === 'string' ? data.description : undefined,
        vertical: getVerticalForSlug(slug),
        fieldCount,
        itemCount: itemCountBySlug.get(slug) ?? 0,
        hasModule: enabledSlugs.has(slug),
        previewItems: previewBySlug.get(slug),
      };
    });

    // Sort: vertical first (alphabetical, with null/orphan last), then name.
    schemas.sort((a, b) => {
      const av = a.vertical ?? '~';
      const bv = b.vertical ?? '~';
      if (av !== bv) return av.localeCompare(bv);
      return a.name.localeCompare(b.name);
    });

    return {
      success: true,
      schemas,
      partnerVertical,
      partnerCurrency,
      partnerCountry,
      partnerCategoryLabel,
    };
  } catch (err: any) {
    console.error('[partner-relay-data] listPartnerSchemasAction failed:', err);
    return { success: false, error: err?.message ?? 'unknown' };
  }
}

// ── Bulk vertical seed (PR fix-20) ────────────────────────────────────
//
// "Start with sample data" — one click that populates every schema in
// the partner's vertical with sample items. Replaces the prior
// test-chat sample/live toggle (which only changed render path, never
// persisted). After this runs:
//   • test-chat's live mode renders against real partner items
//   • /partner/relay/data shows item counts on every schema card
//   • partner can edit / extend the seeded items immediately
//
// Skip-if-items-exist semantics: schemas that already have items are
// left alone. Re-runs are safe and idempotent.

export interface SeedAllVerticalSchemasResult {
  success: boolean;
  /** Vertical derived from partner identity. */
  vertical?: RelayVertical | null;
  /** Schemas iterated (vertical + 'shared'). */
  totalSchemas?: number;
  /** Schemas where items were freshly created. */
  schemasSeeded?: number;
  /** Schemas skipped because items already existed. */
  schemasAlreadyHadItems?: number;
  /** Total items created across all schemas. */
  totalItemsCreated?: number;
  /** Per-slug breakdown for UI feedback. */
  perSchema?: Array<{
    slug: string;
    name?: string;
    created: number;
    skipped: boolean;
    error?: string;
  }>;
  error?: string;
}

export async function seedAllVerticalSchemasAction(
  partnerId: string,
  userId: string,
): Promise<SeedAllVerticalSchemasResult> {
  try {
    if (!adminDb) return { success: false, error: 'Database not available' };
    if (!partnerId) {
      return { success: false, error: 'partnerId is required' };
    }

    // ── Identity → vertical ──
    const partnerDoc = await adminDb.collection('partners').doc(partnerId).get();
    const persona = partnerDoc.exists
      ? (partnerDoc.data() as any)?.businessPersona
      : null;
    const identity = persona?.identity ?? {};
    const vertical = derivePartnerVertical(identity);

    // PR fix-24: full partner context for the AI prompt.
    const seedCtx = {
      vertical: vertical ?? null,
      category: deriveCategoryLabel(identity) ?? null,
      country:
        typeof identity?.address?.country === 'string'
          ? identity.address.country
          : null,
      currency:
        typeof identity?.currency === 'string' ? identity.currency : null,
      brandName:
        typeof identity?.name === 'string' ? identity.name : null,
    };

    if (!vertical) {
      return {
        success: false,
        error:
          'Set your Business Identity (category) in Settings first — without a vertical we don\'t know which schemas to seed.',
      };
    }

    // ── Slugs in this vertical (+ shared) ──
    //
    // PR fix-22: iterate the BLOCK REGISTRY (the partner-visible
    // catalog) instead of relaySchemas (admin store). The mismatch
    // between the two is exactly what made some "Data you need to
    // upload" sections silently empty: the checklist references
    // block.module slugs the admin hasn't generated relaySchemas docs
    // for yet. seedSampleItemsAction → deriveSampleItemsFromSchema's
    // minimal-items fallback handles those slugs gracefully.
    const targetSlugs = new Set<string>();
    for (const block of ALL_BLOCKS_DATA) {
      if (!block.module) continue;
      const v = getVerticalForSlug(block.module);
      if (v === vertical || v === 'shared') {
        targetSlugs.add(block.module);
      }
    }
    const targetSchemas = Array.from(targetSlugs).map((slug) => {
      // Prefer relaySchemas doc when available (richer name), but
      // synthesize a stub when missing so the rest of the action
      // works the same.
      return { id: slug, data: () => ({ name: undefined }) };
    });

    // Hydrate names from relaySchemas in one pass for nicer per-schema
    // breakdown messages.
    const schemasSnap = await adminDb.collection('relaySchemas').get();
    const nameBySlug = new Map<string, string>();
    for (const doc of schemasSnap.docs) {
      const data = doc.data() as any;
      if (typeof data?.name === 'string') nameBySlug.set(doc.id, data.name);
    }

    if (targetSchemas.length === 0) {
      return {
        success: true,
        vertical,
        totalSchemas: 0,
        schemasSeeded: 0,
        schemasAlreadyHadItems: 0,
        totalItemsCreated: 0,
        perSchema: [],
      };
    }

    // ── Seed each schema in parallel (capped concurrency via Promise.all
    // since the underlying action is largely Firestore-bound and Firebase
    // SDK already batches reads). seedSampleItemsAction with
    // skipIfItemsExist preserves any existing partner data. ──
    const perSchema = await Promise.all(
      targetSchemas.map(async (doc) => {
        const slug = doc.id;
        const name = nameBySlug.get(slug);
        try {
          const res = await seedSampleItemsAction(partnerId, slug, userId, {
            skipIfItemsExist: true,
            ctx: seedCtx,
          });
          if (!res.success) {
            return {
              slug,
              name,
              created: 0,
              skipped: false,
              error: res.error,
            };
          }
          return {
            slug,
            name,
            created: res.created ?? 0,
            // res.created === 0 with success === true means existing
            // items were left alone (skipIfItemsExist branch).
            skipped: (res.created ?? 0) === 0,
          };
        } catch (err: any) {
          return {
            slug,
            name,
            created: 0,
            skipped: false,
            error: err?.message ?? 'unknown',
          };
        }
      }),
    );

    const schemasSeeded = perSchema.filter((s) => s.created > 0).length;
    const schemasAlreadyHadItems = perSchema.filter(
      (s) => s.skipped && !s.error,
    ).length;
    const totalItemsCreated = perSchema.reduce((sum, s) => sum + s.created, 0);

    return {
      success: true,
      vertical,
      totalSchemas: perSchema.length,
      schemasSeeded,
      schemasAlreadyHadItems,
      totalItemsCreated,
      perSchema,
    };
  } catch (err: any) {
    console.error(
      '[partner-relay-data] seedAllVerticalSchemasAction failed:',
      err,
    );
    return { success: false, error: err?.message ?? 'unknown' };
  }
}
