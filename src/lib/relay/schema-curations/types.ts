// ── Curated schema types ────────────────────────────────────────────
//
// Per-slug schema definitions that replace the Gemini enrichment path.
// Each slug under `food_beverage/`, `shared/`, etc. exports a default
// `CuratedSchema` describing the canonical shape an admin wants to
// expose to partners on /partner/relay/data.
//
// Authoring rule of thumb: be EXTENSIVE. Block consumers (`reads[]`)
// only need a handful of fields, but the partner can capture far more.
// Extra fields land harmlessly in `ModuleItem.fields` and are ignored
// by renderers that don't read them. Coverage over precision.

import type { ModuleFieldDefinition } from '@/lib/modules/types';
import type { ContentCategory } from '@/lib/relay/content-categories';

/**
 * One field in a curated schema. Trimmed compared to
 * `ModuleFieldDefinition` because authors don't write `id` or `order`
 * — those are derived from `name` and array index at apply time.
 */
export interface CuratedField {
  /** snake_case identifier — also the storage key on partner items. */
  name: string;
  /** One of the 15 ModuleFieldType variants. */
  type: ModuleFieldDefinition['type'];
  isRequired?: boolean;
  isSearchable?: boolean;
  showInList?: boolean;
  showInCard?: boolean;
  /** Closed list values for `select` / `multi_select`. */
  options?: string[];
  /** Partner-facing tooltip / hint copy. */
  description?: string;
  /** Placeholder shown inside the partner-side input. */
  placeholder?: string;
  /** Default value applied when the partner leaves the field blank. */
  defaultValue?: unknown;
  /** Inline validation hints honoured by the partner ItemEditor. */
  validation?: ModuleFieldDefinition['validation'];
}

/**
 * One schema's full curated definition. `fields` is canonical and
 * overwriting; everything else is metadata the apply action writes
 * through to the schema doc unless admin already set their own value
 * (in which case admin wins — same precedence as Step 0).
 */
export interface CuratedSchema {
  /** Partner-facing name. Skipped when the doc already carries an admin-set name. */
  name?: string;
  /** Partner-facing description. Skipped when the doc already has admin prose. */
  description?: string;
  /** Partner-facing content category. Skipped when admin override is present. */
  contentCategory?: ContentCategory;
  /** Singular noun for the "Add {itemLabel}" affordance. */
  itemLabel?: string;
  /** Plural noun used by the partner inventory list. */
  itemLabelPlural?: string;
  /** ISO currency code for items in this schema. */
  defaultCurrency?: string;
  /** Field list — canonical. Overwrites `schema.fields[]` on apply. */
  fields: CuratedField[];
}
