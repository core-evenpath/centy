// ── Block-data shape normalizer (Phase 3B extract) ──────────────────
//
// Client-safe pure helper, previously inlined in admin-block-data.ts.
// Coerces a raw partner item (canonical ModuleItem fields + custom
// `fields` bag) into the flat shape block renderers expect — top-level
// name/description/price/currency, image aliases, and the schema-
// defined `fields.{...}` hoisted to the top level.
//
// Defensive fld_X → X aliasing covers historical partner data written
// before the Phase 0 key alignment. Both writers and readers agree on
// the bare-name convention now; the alias is a safety net.

export function normalizeItem(raw: any): Record<string, unknown> {
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
  // keys; legacy writes used the `fld_<name>` field.id token. Both
  // are aliased here so block `reads[]` (always uses bare names)
  // finds the value either way.
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
