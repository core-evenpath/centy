// ── Partner identity prefill (Phase 3A) ─────────────────────────────
//
// "The platform automatically works the best way" — when a schema
// field's name matches a known persona attribute (phone/email/etc.),
// the partner-side editor pre-fills it from
// `partners/{id}.businessPersona` so partners don't have to hand-type
// data the platform already knows about. Schema `defaultValue` still
// wins when it's set; identity is the next-tier fallback.
//
// Pure module — no Firestore imports, no React. Safe from server
// actions, the ItemEditor client, and any test path.
//
// Field-name → identity-path mapping is intentionally explicit (not
// regex / fuzzy match) so we don't accidentally prefill something
// like `customer_phone` with the partner's own phone. Adding new
// mappings is a one-line edit; the bar for inclusion is "this field
// CAN'T mean anything other than the partner's own attribute."

export interface PartnerIdentity {
  /** Business name. */
  name?: string;
  phone?: string;
  /** WhatsApp number — kept distinct from `phone` since they often differ. */
  whatsapp?: string;
  email?: string;
  website?: string;
  /** ISO country code where the business operates. */
  country?: string;
  city?: string;
  /** Free-form street/area string from the address sub-object. */
  street?: string;
  /** Currency code, e.g. 'INR', 'USD'. */
  currency?: string;
  /** Partner's tagline — pulled from `personality | knowledge | identity`. */
  tagline?: string;
}

// Each entry is { fieldName: identity-key }. Field names are
// normalized lower-case + snake-case for the lookup.
const FIELD_NAME_TO_IDENTITY_KEY: Record<string, keyof PartnerIdentity> = {
  // Business name / brand
  business_name: 'name',
  brand_name: 'name',
  brand: 'name',
  // Contact channels
  phone: 'phone',
  contact_phone: 'phone',
  phone_number: 'phone',
  whatsapp: 'whatsapp',
  whatsapp_number: 'whatsapp',
  email: 'email',
  contact_email: 'email',
  email_address: 'email',
  website: 'website',
  website_url: 'website',
  homepage: 'website',
  // Address
  country: 'country',
  country_code: 'country',
  city: 'city',
  address: 'street',
  street_address: 'street',
  // Commerce
  currency: 'currency',
  default_currency: 'currency',
  // Marketing
  tagline: 'tagline',
  slogan: 'tagline',
};

/**
 * Resolve a schema field name to its identity-driven prefill, or
 * undefined when the field has no known mapping. Always returns
 * undefined when identity itself is empty/null — the caller falls
 * back to whatever default behaviour they had before identity prefill.
 */
export function getIdentityPrefillForField(
  fieldName: string | undefined,
  identity: PartnerIdentity | null | undefined,
): unknown {
  if (!fieldName || !identity) return undefined;
  const key = FIELD_NAME_TO_IDENTITY_KEY[fieldName.toLowerCase()];
  if (!key) return undefined;
  const value = identity[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

/**
 * Field names with a known identity prefill. Used by tests + future
 * UI hints ("this will be auto-filled from your business identity").
 */
export const IDENTITY_PREFILL_FIELD_NAMES: ReadonlyArray<string> =
  Object.keys(FIELD_NAME_TO_IDENTITY_KEY);
