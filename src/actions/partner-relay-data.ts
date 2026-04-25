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

    // Partner's enabled module slugs + item counts.
    const itemCountBySlug = new Map<string, number>();
    const enabledSlugs = new Set<string>();
    for (const doc of modulesSnap.docs) {
      const data = doc.data() as any;
      const slug =
        typeof data.moduleSlug === 'string' ? data.moduleSlug : null;
      if (!slug) continue;
      enabledSlugs.add(slug);
      const count =
        typeof data.activeItemCount === 'number'
          ? data.activeItemCount
          : typeof data.itemCount === 'number'
            ? data.itemCount
            : 0;
      itemCountBySlug.set(slug, count);
    }

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
