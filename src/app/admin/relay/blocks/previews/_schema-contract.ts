// ── Block ↔ Module field contract (PR A of the schema-contract rollout) ──
//
// A block declares which module fields it reads and, when it has no
// module binding, why. This closes the gap between "block.module =
// 'food_menu'" (today) and "block reads name + description + price
// from food_menu" (explicit contract).
//
// Both fields are optional so every block can opt in over time. Empty
// / absent values are legal and surface as "unannotated" in the admin
// analytics (PR B) — not as drift.

export type NoModuleReason =
  /** Renders with built-in design samples; no data contract yet. */
  | 'design_only'
  /** Text-only / welcome / Q&A block — no structured data. */
  | 'conversation'
  /** Content generated on the fly by the AI from conversation context. */
  | 'ai_generated'
  /** Owns its own transactional protocol (e.g. cart, checkout, orders). */
  | 'checkout'
  /** Renders from partner settings or other non-module state (contact card, etc). */
  | 'navigation';

export const NO_MODULE_REASON_LABELS: Record<NoModuleReason, string> = {
  design_only: 'Preview-only — design sample',
  conversation: 'Conversation — no structured data',
  ai_generated: 'AI-generated content',
  checkout: 'Owns its own transactional protocol',
  navigation: 'Renders from partner settings, not a module',
};

// ── Shape shared by VerticalBlockDef + ServerBlockData ──────────────
//
// Extending interfaces on both sides would require one file to import
// the other; co-locating the field shape in this neutral module keeps
// types/data symmetric without forcing an import cycle.

export interface BlockSchemaContract {
  /**
   * Module field names this block reads. When `module` is set, these
   * should appear in that module's Firestore schema; mismatches surface
   * as drift in the admin analytics.
   *
   * Intentionally permissive (string[]) rather than a stronger enum —
   * the source of truth is the module's schema, not TypeScript.
   */
  reads?: string[];
  /**
   * Required when `module === null`. Explains why this block
   * intentionally doesn't bind a module, so admins don't flag it as
   * broken. Validated at analytics-time (PR B).
   */
  noModuleReason?: NoModuleReason;
}
