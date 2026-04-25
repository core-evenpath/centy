// Backfill `reads: [...]` on every block missing the annotation.
//
// Context: PR C annotated reads[] on the 57 originally-module-backed
// blocks. PR-fix-2 promoted the other 143 blocks from module-less to
// module-backed (giving them schema slugs) but didn't backfill reads.
// Result: those 143 tiles in the Block Gallery render with no reads
// chips, which was confusing.
//
// This script gives every block a reads[] using family-based
// defaults. Idempotent — leaves existing reads[] alone, only adds
// when missing.
//
// Family defaults (combined with universal):
//   universal:                 name, description, image_url
//   catalog/parts/service:     + price, category
//   real_estate:               + price, subtitle
//   people:                    + subtitle, badges
//   proof / social_proof:      + rating, review_count
//   booking:                   + date, time, service_name
//   tracking / operations:     + status, last_updated
//   commerce / conversion:     + price, cta_label
//   marketing:                 + cta_label, expires_at
//   info / navigation:         + (universal only)
//   trust:                     + badges
//   pricing / valuation:       + price, currency
//   engagement / packages /
//     entertainment / venues /
//     production / fleet / ev / etc:  (universal only)

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
  catalog: ['price', 'category'],
  parts: ['price', 'category'],
  service: ['price', 'category'],
  real_estate: ['price', 'subtitle'],
  people: ['subtitle', 'badges'],
  proof: ['rating', 'review_count'],
  social_proof: ['rating', 'review_count'],
  booking: ['date', 'time', 'service_name'],
  tracking: ['status', 'last_updated'],
  operations: ['status', 'last_updated'],
  commerce: ['price', 'cta_label'],
  conversion: ['price', 'cta_label'],
  marketing: ['cta_label', 'expires_at'],
  trust: ['badges'],
  pricing: ['price', 'currency'],
  valuation: ['price', 'currency'],
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

// Match `reads:` on a block literal line. We only insert when this
// match is FALSE — never overwrite an existing reads[].
const readsRe = /reads:\s*\[/;
const familyRe = /family:\s*'([^']+)'/;
const idRe = /id:\s*'([^']+)'/;
// Insert after `module: '<slug>'` or `module: null` plus optional
// fields like status/engines that may follow. We match the closing
// `}` of the literal and inject before it.
const closingBraceRe = /(\s*)}/;

function annotateLine(line) {
  // Skip if line doesn't look like a block literal (must have id +
  // family on the same line).
  const idMatch = line.match(idRe);
  const familyMatch = line.match(familyRe);
  if (!idMatch || !familyMatch) return line;
  if (readsRe.test(line)) return line; // already annotated

  const blockId = idMatch[1];
  const family = familyMatch[1];
  const reads = buildReads(family, blockId);
  const readsLiteral = `reads: [${reads.map((r) => `'${r}'`).join(', ')}]`;

  // Inject right before the closing `}` of the object literal.
  // Block literals end with ` }` or ` },`. Replace the FIRST such
  // closing on the line.
  const closingMatch = line.match(/( ?})(\s*,?)\s*$/);
  if (!closingMatch) return line;
  const prefix = line.slice(0, closingMatch.index);
  const suffix = line.slice(closingMatch.index);
  // Add a comma if prefix doesn't already end in comma + space.
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
    console.log(`${label}: ${count} block(s) annotated`);
  } else {
    console.log(`${label}: nothing to annotate`);
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

console.log(`\nTotal: ${totalAnnotations} block(s) gained reads[]`);
