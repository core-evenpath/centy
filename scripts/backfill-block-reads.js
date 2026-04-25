// Backfill `reads: [...]` on every block.
//
// PR fix-10: the original backfill (PRs C/fix-5) only put 3-5
// universal-ish fields on each block. The visual previews actually
// render far more (Product Card shows price, currency, rating,
// review_count, badges, variants, sku, etc.) so the "Schemas" tab and
// the gallery's reads chips were under-reporting what backend each
// block needs. This pass widens FAMILY_EXTRAS to cover what the
// previews actually consume — so the schemas the page generates from
// reads[] are a complete brief, not a 3-field stub.
//
// Behaviour change: instead of skipping when reads[] already exists,
// we now MERGE missing family-default fields into the existing array
// (preserving order, deduping). That way previously-annotated blocks
// pick up the new fields without losing any handcrafted entries.
//
// Family defaults (combined with universal):
//   universal:                 name, description, image_url
//   catalog/parts/service:     + price, currency, category, subtitle, rating, review_count, badges, variants, sku
//   real_estate:               + price, currency, subtitle, badges, rating, review_count, square_feet, bedrooms
//   people:                    + subtitle, badges, rating, review_count, specialties, years_experience
//   proof / social_proof:      + rating, review_count, subtitle, badges, outcome_metric, completion_date
//   booking:                   + date, time, service_name, status, duration, location, price
//   tracking / operations:     + status, last_updated, eta, location, progress
//   commerce / conversion:     + price, currency, cta_label, badges, discount_percent, original_price
//   marketing:                 + cta_label, expires_at, headline, badges, discount_code
//   info / navigation:         + cta_label, icon
//   trust:                     + badges, rating, review_count, subtitle
//   pricing / valuation:       + price, currency, subtitle, features, period
//   engagement / packages /
//     entertainment / venues /
//     production / fleet / ev / etc:  + price, currency, badges, rating, review_count

const fs = require('fs');
const path = require('path');

const PREVIEWS_DIR = '/home/user/centy/src/app/admin/relay/blocks/previews';
const SCRIPT_PATH = '/home/user/centy/scripts/extract-block-registry-data.js';

const VERTICALS = [
  'automotive', 'business', 'ecommerce', 'education',
  'events_entertainment', 'financial_services', 'food_beverage',
  'food_supply', 'healthcare', 'home_property', 'hospitality',
  'personal_wellness', 'public_nonprofit', 'travel_transport',
];

const UNIVERSAL = ['name', 'description', 'image_url'];

const FAMILY_EXTRAS = {
  catalog: [
    'price', 'currency', 'category', 'subtitle',
    'rating', 'review_count', 'badges', 'variants', 'sku',
  ],
  parts: [
    'price', 'currency', 'category', 'subtitle',
    'rating', 'review_count', 'badges', 'sku', 'in_stock',
  ],
  service: [
    'price', 'currency', 'category', 'subtitle',
    'rating', 'review_count', 'badges', 'duration',
  ],
  real_estate: [
    'price', 'currency', 'subtitle', 'badges',
    'rating', 'review_count', 'square_feet', 'bedrooms', 'bathrooms', 'address',
  ],
  people: [
    'subtitle', 'badges', 'rating', 'review_count',
    'specialties', 'years_experience', 'role', 'availability',
  ],
  proof: [
    'rating', 'review_count', 'subtitle', 'badges',
    'outcome_metric', 'completion_date', 'author',
  ],
  social_proof: [
    'rating', 'review_count', 'subtitle', 'badges',
    'author', 'verified', 'date',
  ],
  booking: [
    'date', 'time', 'service_name', 'status',
    'duration', 'location', 'price', 'currency', 'attendee_name',
  ],
  tracking: [
    'status', 'last_updated', 'eta', 'location',
    'progress', 'destination',
  ],
  operations: [
    'status', 'last_updated', 'progress',
    'assignee', 'priority',
  ],
  commerce: [
    'price', 'currency', 'cta_label', 'badges',
    'discount_percent', 'original_price', 'in_stock',
  ],
  conversion: [
    'price', 'currency', 'cta_label', 'badges',
    'discount_percent', 'urgency_text',
  ],
  marketing: [
    'cta_label', 'expires_at', 'headline',
    'badges', 'discount_code',
  ],
  info: ['cta_label', 'icon', 'subtitle'],
  navigation: ['cta_label', 'icon', 'subtitle'],
  trust: ['badges', 'rating', 'review_count', 'subtitle'],
  pricing: ['price', 'currency', 'subtitle', 'features', 'period'],
  valuation: ['price', 'currency', 'subtitle', 'change_percent', 'period'],
  engagement: ['price', 'currency', 'badges', 'rating', 'review_count'],
  packages: ['price', 'currency', 'badges', 'features', 'duration'],
  entertainment: ['price', 'currency', 'badges', 'rating', 'review_count', 'date'],
  venues: ['price', 'currency', 'badges', 'rating', 'review_count', 'capacity'],
  production: ['price', 'currency', 'subtitle', 'duration', 'status'],
  fleet: ['price', 'currency', 'subtitle', 'rating', 'capacity', 'status'],
  ev: ['price', 'currency', 'subtitle', 'rating', 'connector_type', 'status'],
  // shared block ids handled below by id
};

// Shared block reads — ids match SHARED_BLOCK_SLUGS from the
// previous migration. Booking_confirmation/space_confirmation
// have unique field shapes worth annotating explicitly.
const SHARED_READS_BY_ID = {
  greeting: ['welcome_message', 'brand_emoji', 'cta_label'],
  suggestions: ['prompt_text'],
  nudge: ['headline', 'body', 'icon'],
  promo: ['title', 'discount_code', 'expires_at', 'cta_label'],
  cart: ['items', 'subtotal', 'currency'],
  contact: ['phone', 'email', 'address'],
  booking_confirmation: ['booking_id', 'service_name', 'date', 'time', 'status'],
  space_confirmation: ['reservation_id', 'resource_id', 'check_in', 'check_out', 'status'],
};

function buildReads(family, blockId) {
  const sharedReads = SHARED_READS_BY_ID[blockId];
  if (sharedReads) return sharedReads;
  const extras = FAMILY_EXTRAS[family] ?? [];
  // Dedupe in case extras overlap with universal.
  return Array.from(new Set([...UNIVERSAL, ...extras]));
}

let totalAnnotations = 0;
let totalMergedAdditions = 0;

// Match `reads: [ ... ]` on a block literal line, capturing the inner
// list so we can merge new entries into it.
const readsLiteralRe = /reads:\s*\[([^\]]*)\]/;
const familyRe = /family:\s*'([^']+)'/;
const idRe = /id:\s*'([^']+)'/;

function parseReadsList(inner) {
  // Inner is the contents between `[` and `]` of a `reads: [...]`.
  // Entries are simple single-quoted strings separated by commas.
  const out = [];
  const re = /'([^']+)'/g;
  let m;
  while ((m = re.exec(inner)) !== null) out.push(m[1]);
  return out;
}

function annotateLine(line) {
  // Skip if line doesn't look like a block literal (must have id +
  // family on the same line).
  const idMatch = line.match(idRe);
  const familyMatch = line.match(familyRe);
  if (!idMatch || !familyMatch) return line;

  const blockId = idMatch[1];
  const family = familyMatch[1];
  const desired = buildReads(family, blockId);

  const existingMatch = line.match(readsLiteralRe);
  if (existingMatch) {
    // Merge: keep existing entries, append any desired ones missing.
    const existing = parseReadsList(existingMatch[1]);
    const seen = new Set(existing);
    const additions = desired.filter((r) => !seen.has(r));
    if (additions.length === 0) return line;
    const merged = [...existing, ...additions];
    const newLiteral = `reads: [${merged.map((r) => `'${r}'`).join(', ')}]`;
    totalMergedAdditions += additions.length;
    return line.slice(0, existingMatch.index) +
      newLiteral +
      line.slice(existingMatch.index + existingMatch[0].length);
  }

  // No existing reads[] — insert before the closing `}` of the
  // object literal. Block literals end with ` }` or ` },`.
  const readsLiteral = `reads: [${desired.map((r) => `'${r}'`).join(', ')}]`;
  const closingMatch = line.match(/( ?})(\s*,?)\s*$/);
  if (!closingMatch) return line;
  const prefix = line.slice(0, closingMatch.index);
  const suffix = line.slice(closingMatch.index);
  const sep = /,\s*$/.test(prefix) ? ' ' : ', ';
  totalAnnotations++;
  return `${prefix}${sep}${readsLiteral}${suffix}`;
}

function rewriteFile(filePath, label) {
  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split('\n');
  let count = 0;
  const updated = lines.map((line) => {
    const next = annotateLine(line);
    if (next !== line) count++;
    return next;
  });
  if (count > 0) {
    fs.writeFileSync(filePath, updated.join('\n'));
    console.log(`${label}: ${count} line(s) updated`);
  } else {
    console.log(`${label}: nothing to update`);
  }
}

// 1. Per-vertical files
for (const v of VERTICALS) {
  const candidates = ['index.tsx', 'index.ts'];
  let filePath = null;
  for (const c of candidates) {
    const p = path.join(PREVIEWS_DIR, v, c);
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }
  if (!filePath) continue;
  rewriteFile(filePath, v);
}

// 2. shared/index.ts
const sharedPath = path.join(PREVIEWS_DIR, 'shared', 'index.ts');
if (fs.existsSync(sharedPath)) rewriteFile(sharedPath, 'shared/index.ts');

// 3. extractor template's hardcoded SHARED_BLOCKS_DATA
if (fs.existsSync(SCRIPT_PATH)) rewriteFile(SCRIPT_PATH, 'extract-block-registry-data.js');

console.log(
  `\nTotal: ${totalAnnotations} block(s) gained a reads[] literal, ` +
    `${totalMergedAdditions} field(s) merged into existing reads[].`,
);
