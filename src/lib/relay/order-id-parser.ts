// ── Order ID parsing ────────────────────────────────────────────────────
//
// Pure text helpers shared by the intent engine and the order tracker
// input form. Kept isolated (no runtime imports) so it's cheap to pull
// into any edge — the client widget, the chat classifier, and future
// surfaces like the WhatsApp / SMS handlers.
//
// The canonical `generateOrderId()` shape is `ORD-{6 alphanumeric}`
// using the unambiguous alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` —
// see `src/lib/relay/order-helpers.ts`. For chat parsing we also
// recognise the legacy `#PBX-NNNNNN` pattern used by pre-Phase-3
// design samples so partners testing with old sample data still get a
// sensible match.

/**
 * Match either our canonical ORD- id or the legacy PBX / arbitrary
 * alpha-prefixed formats. Case-insensitive, `#` optional, separator
 * optional. Returns the first capture group (the raw id without the
 * leading `#`).
 */
export const ORDER_ID_REGEX =
  /#?\b(ORD-[A-Z0-9]{4,10}|[A-Z]{2,5}[-_]?\d{4,})\b/i;

/** Strict regex for the canonical shape — used by input validation. */
export const CANONICAL_ORDER_ID_REGEX = /^ORD-[A-Z0-9]{6}$/;

/**
 * Pull the first order id out of a free-form message, normalise case,
 * strip any leading `#`, and return it — or null if nothing matches.
 */
export function extractOrderId(message: string): string | null {
  if (!message) return null;
  const match = message.match(ORDER_ID_REGEX);
  if (!match) return null;
  // Group 1 excludes the optional leading `#`.
  return match[1].toUpperCase();
}

/** True when the string looks like a canonical ORD- id. */
export function isCanonicalOrderId(value: string): boolean {
  return CANONICAL_ORDER_ID_REGEX.test(value);
}

/**
 * Accept whatever the user typed into the input box — trim, uppercase,
 * prepend `ORD-` if they only entered the suffix — and return it
 * normalised. Returns null when the input can't be coerced into a
 * plausible id.
 */
export function normalizeOrderIdInput(raw: string): string | null {
  const trimmed = raw.trim().toUpperCase().replace(/^#/, '');
  if (!trimmed) return null;
  if (isCanonicalOrderId(trimmed)) return trimmed;
  // User typed only the suffix (e.g. `ABCDEF`) — prepend the prefix.
  if (/^[A-Z0-9]{6}$/.test(trimmed)) return `ORD-${trimmed}`;
  const match = trimmed.match(ORDER_ID_REGEX);
  return match ? match[1].toUpperCase() : null;
}
