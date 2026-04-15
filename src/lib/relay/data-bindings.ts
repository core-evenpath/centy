/**
 * Data Bindings
 *
 * A `DataBinding` answers the question "where does this canonical field
 * get its value?" Bindings are the contract between block design (which
 * declares canonical field ids via block-data-contracts.ts) and partner
 * data (profile, modules, documents).
 *
 * Bindings are stored per-partner at:
 *   partners/{id}/relayConfig/dataBindings
 *
 * Each canonical field id maps to one binding. Default bindings come
 * from the block contract; the map stored in Firestore holds the
 * partner's overrides. At runtime, `resolveBinding(contractDefault,
 * override)` picks the override when present, contract default
 * otherwise.
 *
 * Ownership model:
 *  - Partner owns raw data (profile, module items, documents).
 *  - /partner/relay/blocks owns bindings — changes here rewire what
 *    raw data feeds which block.
 *  - Blueprint agent (Gemini) is advisory: it proposes bindings and
 *    module-creation actions but never writes without explicit
 *    approval.
 */

export type DataBinding =
  | { kind: 'profile'; path: string }                               // e.g. 'businessPersona.identity.phone'
  | { kind: 'module'; moduleId: string }                            // partner module doc id
  | { kind: 'document'; docId: string }                             // vault file id
  | { kind: 'literal'; value: unknown }                             // hard-coded value
  | { kind: 'unset' };                                              // explicitly not connected

export type BindingMap = Record<string, DataBinding>;

// Canonical ids used across block contracts. Think of these as the
// shared vocabulary between UI blocks and partner data.
export const CANONICAL_FIELDS = {
  BUSINESS_NAME: 'business.name',
  BUSINESS_TAGLINE: 'business.tagline',
  BUSINESS_PHONE: 'business.phone',
  BUSINESS_EMAIL: 'business.email',
  BUSINESS_WHATSAPP: 'business.whatsapp',
  BUSINESS_WEBSITE: 'business.website',
  // Collections (point at a module id).
  PRODUCTS_ITEMS: 'products.items',
  MENU_ITEMS: 'menu.items',
  SERVICES_ITEMS: 'services.items',
  // Scalar text.
  WELCOME_MESSAGE: 'welcome.message',
} as const;

export type CanonicalFieldId = string;

export function isUnset(b: DataBinding | undefined): boolean {
  return !b || b.kind === 'unset';
}

// Flatten a binding to a human-readable one-liner for logging/UI.
export function describeBinding(b: DataBinding | undefined): string {
  if (!b || b.kind === 'unset') return 'Not connected';
  switch (b.kind) {
    case 'profile': return `Profile › ${b.path}`;
    case 'module': return `Module ${b.moduleId}`;
    case 'document': return `Document ${b.docId}`;
    case 'literal': return `Literal: ${JSON.stringify(b.value).slice(0, 40)}`;
  }
}
