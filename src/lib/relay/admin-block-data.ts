/**
 * Build real `blockData` for a block render — admin gallery preview AND
 * partner test-chat — from partner doc + module items.
 *
 * PR fix-26: REWIRED to be GENERIC. Previously a per-blockId switch
 * handled ~10 specific block IDs and fell through to `undefined` for
 * everything else, so 90% of blocks rendered against the renderer's
 * internal sampleData regardless of what the partner had seeded. Now
 * any block whose registry definition has a `module` slug pulls items
 * from the matching partner businessModule — every block, every
 * vertical, no per-blockId allowlist.
 *
 * Two specialized builders remain: `greeting` and `contact` read from
 * the partner's persona (not module items) and emit a custom shape.
 * Everything else routes through the generic items-builder.
 */

import type {
  GreetingPreviewData,
  ContactPreviewData,
} from '@/app/admin/relay/blocks/previews/_preview-props';
import { ALL_BLOCKS_DATA } from '@/app/admin/relay/blocks/previews/_registry-data';

interface ModuleLike {
  slug: string;
  name: string;
  items: any[];
}

interface BuildInput {
  blockId: string;
  partnerData: Record<string, any> | null;
  modules: ModuleLike[];
}

export function buildBlockData({
  blockId,
  partnerData,
  modules,
}: BuildInput): Record<string, unknown> | undefined {
  let result: Record<string, unknown> | undefined;

  // ── Specialized builders — different data shape from `items`. ──
  if (blockId === 'greeting' || blockId === 'ecom_greeting') {
    result = buildGreeting(partnerData) as Record<string, unknown> | undefined;
  } else if (blockId === 'contact' || blockId === 'shared_contact') {
    result = buildContact(partnerData) as Record<string, unknown> | undefined;
  } else {
    // ── Generic dispatch (PR fix-26) ────────────────────────────────
    // Look up the block's `module` slug in the registry, find the
    // partner's matching businessModule, return its items.
    result = buildGenericFromModule(blockId, modules);
  }

  // ── PR fix-15: thread partner currency into every envelope ────────
  if (result && !result.currency) {
    const personaCurrency =
      partnerData?.businessPersona?.identity?.currency;
    if (typeof personaCurrency === 'string' && personaCurrency.trim()) {
      result.currency = personaCurrency.trim().toUpperCase();
    }
  }

  return result;
}

// ── Generic builder (PR fix-26) ────────────────────────────────────
//
// For ANY block that has `block.module` set, find the partner's
// businessModule with that slug and return its items in a uniform
// envelope:
//
//   {
//     ...firstItem,        // flat shape for single-record blocks
//                          // (nudge.headline, promo.title, etc.)
//     items: [...all],     // list shape for catalog/menu/etc blocks
//     moduleSlug,           // for debugging / RAG context
//   }
//
// Both shapes co-exist on the same envelope so block renderers can
// read whichever they expect — list-shaped blocks pick `items`,
// single-record blocks pick top-level fields. Item collisions on
// `items`-named fields are vanishingly rare in practice.

function buildGenericFromModule(
  blockId: string,
  modules: ModuleLike[],
): Record<string, unknown> | undefined {
  const block = ALL_BLOCKS_DATA.find((b) => b.id === blockId);
  const slug = block?.module;
  if (!slug) return undefined;

  const mod = modules.find(
    (m) => m.slug === slug && Array.isArray(m.items) && m.items.length > 0,
  );
  if (!mod) return undefined;

  const items = mod.items.slice(0, 6).map((raw) => normalizeItem(raw));
  if (items.length === 0) return undefined;

  // Spread firstItem at top level for single-record renderers (nudge,
  // promo, etc. that read `data.headline` / `data.title`), then list
  // shape for catalog renderers. `currency` stays on each item but
  // is intentionally NOT spread at envelope level — the persona
  // currency thread (above) owns the top-level currency so partner
  // identity wins over per-item currency for renderers that read
  // `data.currency` as the default.
  const { currency: _itemCurrency, ...firstItemWithoutCurrency } = items[0];
  return {
    ...firstItemWithoutCurrency,
    items,
    moduleSlug: mod.slug,
  };
}

/**
 * Coerce a raw partner item into the shape block renderers expect.
 * Top-level slots (name/description/price/currency/category/imageUrl)
 * pulled from the canonical ModuleItem shape; the `fields` custom
 * bag is hoisted to the top level so renderers reading `data.headline`
 * or `data.calories` find them.
 */
function normalizeItem(raw: any): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, unknown> = {};

  // Canonical top-level fields.
  copyIf(out, raw, 'id');
  copyIf(out, raw, 'name');
  copyIf(out, raw, 'description');
  copyIf(out, raw, 'category');
  copyIf(out, raw, 'price');
  copyIf(out, raw, 'currency');
  copyIf(out, raw, 'isActive');

  // Image normalization: ModuleItem.images[] → imageUrl + thumbnail.
  if (Array.isArray(raw.images) && raw.images.length > 0) {
    const first = raw.images[0];
    if (typeof first === 'string') {
      out.imageUrl = first;
      out.thumbnail = first;
      out.image_url = first;
    }
  }

  // Hoist the custom-fields bag (`fields: {...}`) to top level so
  // schema-defined fields like `headline`, `tagline`, `calories`,
  // `discount_code`, `expires_at`, etc. are reachable as
  // `data.{fieldName}` in renderers.
  //
  // Two write conventions exist in partner data: the sample-data
  // seeder + post-Phase-0 ItemEditor write under bare `field.name`
  // keys; legacy ItemEditor / InventoryManager writes used the
  // `fld_<name>` field.id token. Both are aliased here so block
  // `reads[]` (which always uses bare names) finds the value either
  // way. New writers should standardize on bare names; the alias is
  // a safety net for historical items + any code path we missed.
  if (raw.fields && typeof raw.fields === 'object') {
    for (const [k, v] of Object.entries(raw.fields)) {
      if (out[k] === undefined) out[k] = v;
      if (k.startsWith('fld_')) {
        const bare = k.slice(4);
        if (bare && out[bare] === undefined) out[bare] = v;
      }
    }
  }

  // Aliases used by some renderers.
  if (out.description && !out.subtitle) out.subtitle = out.description;
  if (out.name && !out.title) out.title = out.name;

  return out;
}

function copyIf(out: Record<string, unknown>, src: any, key: string): void {
  const v = src?.[key];
  if (v !== undefined && v !== null) out[key] = v;
}

// ── greeting (specialized — partner persona, not module items) ──────

function buildGreeting(
  partnerData: Record<string, any> | null
): GreetingPreviewData | undefined {
  const identity = partnerData?.businessPersona?.identity;
  if (!identity) return undefined;

  const brandName = typeof identity.name === 'string' ? identity.name : undefined;
  const tagline =
    typeof partnerData?.businessPersona?.personality?.tagline === 'string'
      ? partnerData.businessPersona.personality.tagline
      : typeof partnerData?.businessPersona?.knowledge?.tagline === 'string'
      ? partnerData.businessPersona.knowledge.tagline
      : typeof identity.tagline === 'string'
      ? identity.tagline
      : undefined;

  const data: GreetingPreviewData = {};
  if (brandName) {
    data.brandName = brandName;
    data.initial = brandName.charAt(0).toUpperCase();
  }
  if (tagline) data.tagline = tagline;

  return Object.keys(data).length > 0 ? data : undefined;
}

// ── contact (specialized — partner persona) ─────────────────────────

function buildContact(
  partnerData: Record<string, any> | null
): ContactPreviewData | undefined {
  const identity = partnerData?.businessPersona?.identity;
  if (!identity) return undefined;

  const rows: NonNullable<ContactPreviewData['items']> = [];
  if (identity.phone) rows.push({ label: 'Phone', value: String(identity.phone), icon: '☎' });
  const wa = identity.whatsAppNumber || identity.whatsapp;
  if (wa) rows.push({ label: 'WhatsApp', value: String(wa), icon: '◎' });
  if (identity.email) rows.push({ label: 'Email', value: String(identity.email), icon: '✉' });
  if (identity.website) rows.push({ label: 'Website', value: String(identity.website), icon: '◧' });

  return rows.length > 0 ? { items: rows } : undefined;
}
