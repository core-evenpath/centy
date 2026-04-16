// ── Carrier options + tracking URL builders ────────────────────────────
//
// Pure data module consumed by `TrackingFormDialog`. No React, no I/O —
// easy to reuse if another surface (email, WhatsApp) needs to render a
// tracking link.

export interface CarrierOption {
  value: string;
  label: string;
}

export const CARRIERS: CarrierOption[] = [
  { value: 'delhivery', label: 'Delhivery' },
  { value: 'bluedart', label: 'BlueDart' },
  { value: 'dtdc', label: 'DTDC' },
  { value: 'ecom_express', label: 'Ecom Express' },
  { value: 'xpressbees', label: 'XpressBees' },
  { value: 'shadowfax', label: 'Shadowfax' },
  { value: 'india_post', label: 'India Post' },
  { value: 'fedex', label: 'FedEx' },
  { value: 'ups', label: 'UPS' },
  { value: 'other', label: 'Other' },
];

const TRACKING_URL_BUILDERS: Record<string, (n: string) => string> = {
  delhivery: (n) => `https://www.delhivery.com/track/package/${encodeURIComponent(n)}`,
  bluedart: (n) => `https://www.bluedart.com/tracking/${encodeURIComponent(n)}`,
  dtdc: (n) => `https://www.dtdc.in/tracking/tracking_results.asp?Ession=1&cnNo=${encodeURIComponent(n)}`,
  fedex: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  ups: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
};

export function getTrackingUrl(
  carrierValue: string,
  trackingNumber: string,
): string | undefined {
  if (!trackingNumber || !carrierValue) return undefined;
  const builder = TRACKING_URL_BUILDERS[carrierValue];
  return builder ? builder(trackingNumber) : undefined;
}

/** Look up the human-readable carrier name by its `value` key. */
export function carrierLabel(carrierValue: string): string {
  const match = CARRIERS.find((c) => c.value === carrierValue);
  return match?.label ?? carrierValue;
}

/**
 * Best-effort reverse lookup: given a stored carrier string (saved as
 * the human label, not the value), return the select option value.
 * Used when pre-populating the dialog with existing tracking info.
 */
export function carrierValueFromLabel(label: string | undefined): string {
  if (!label) return '';
  const match = CARRIERS.find(
    (c) => c.label.toLowerCase() === label.toLowerCase(),
  );
  return match?.value ?? 'other';
}
