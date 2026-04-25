// One-shot rewrite to give every module-less block a `module` slug,
// fulfilling the "every block has a schema" invariant.
//
// Two cases:
//
//   1. Vertical blocks (14 index.{ts,tsx} files): replace
//      `module: null` with `module: '<vertical>_<family>'` and drop
//      the `noModuleReason: '...'` annotation that's now obsolete.
//
//   2. Shared blocks (shared/index.ts + the extractor template's
//      SHARED_BLOCKS_DATA): family is uniformly 'shared', which would
//      slug to 'shared_shared' if we did the same trick. So we use a
//      hardcoded id → slug map. The slugs are picked to match the
//      block's purpose (greeting/suggestions/nudge → conversation;
//      cart → checkout; etc).
//
// Idempotent: blocks that already have `module: '<something>'` are
// untouched. Run once during PR-fix-2.

const fs = require('fs');
const path = require('path');

const PREVIEWS_DIR = '/home/user/centy/src/app/admin/relay/blocks/previews';
const SCRIPT_PATH = '/home/user/centy/scripts/extract-block-registry-data.js';

const VERTICALS = [
  'automotive',
  'business',
  'ecommerce',
  'education',
  'events_entertainment',
  'financial_services',
  'food_beverage',
  'food_supply',
  'healthcare',
  'home_property',
  'hospitality',
  'personal_wellness',
  'public_nonprofit',
  'travel_transport',
];

// Shared blocks (cross-vertical) get a purpose-derived slug instead
// of `shared_<family>` since their family is always 'shared'.
const SHARED_BLOCK_SLUGS = {
  greeting: 'shared_conversation',
  suggestions: 'shared_conversation',
  nudge: 'shared_conversation',
  promo: 'shared_marketing',
  cart: 'shared_checkout',
  contact: 'shared_navigation',
  booking_confirmation: 'shared_confirmation',
  space_confirmation: 'shared_confirmation',
};

let totalRewrites = 0;

// ── Pass 1: vertical files ─────────────────────────────────────────

function rewriteVerticalFile(vertical, filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split('\n');
  let rewrites = 0;

  const familyRe = /family:\s*'([^']+)'/;
  const moduleNullRe = /module:\s*null/;
  // Match `, noModuleReason: '<x>'` (with leading comma + optional spaces)
  // OR ` noModuleReason: '<x>',` (trailing comma) so the line stays valid.
  const noModuleReasonRe = /,?\s*noModuleReason:\s*'[^']+'/;

  const updated = lines.map((line) => {
    if (!moduleNullRe.test(line)) return line;
    const familyMatch = line.match(familyRe);
    if (!familyMatch) {
      // Should be rare; happens when the literal spans multiple lines
      // (e.g. inline preview JSX). Skip — handle by hand if we hit it.
      return line;
    }
    const family = familyMatch[1];
    const slug = `${vertical}_${family}`;
    let next = line.replace(moduleNullRe, `module: '${slug}'`);
    next = next.replace(noModuleReasonRe, '');
    rewrites++;
    return next;
  });

  if (rewrites > 0) {
    fs.writeFileSync(filePath, updated.join('\n'));
    console.log(`${vertical}: ${rewrites} module-less block(s) annotated`);
    totalRewrites += rewrites;
  } else {
    console.log(`${vertical}: nothing to rewrite`);
  }
}

for (const vertical of VERTICALS) {
  const candidates = ['index.tsx', 'index.ts'];
  let filePath = null;
  for (const c of candidates) {
    const p = path.join(PREVIEWS_DIR, vertical, c);
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }
  if (!filePath) {
    console.warn(`Missing index for ${vertical}`);
    continue;
  }
  rewriteVerticalFile(vertical, filePath);
}

// ── Pass 2: shared/index.ts ────────────────────────────────────────

function rewriteSharedFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split('\n');
  let rewrites = 0;

  const idRe = /id:\s*'([^']+)'/;
  const moduleNullRe = /module:\s*null/;
  const noModuleReasonRe = /,?\s*noModuleReason:\s*'[^']+'/;

  const updated = lines.map((line) => {
    if (!moduleNullRe.test(line)) return line;
    const idMatch = line.match(idRe);
    if (!idMatch) return line;
    const id = idMatch[1];
    const slug = SHARED_BLOCK_SLUGS[id];
    if (!slug) {
      console.warn(`shared: no slug mapping for id='${id}', leaving as null`);
      return line;
    }
    let next = line.replace(moduleNullRe, `module: '${slug}'`);
    next = next.replace(noModuleReasonRe, '');
    rewrites++;
    return next;
  });

  if (rewrites > 0) {
    fs.writeFileSync(filePath, updated.join('\n'));
    console.log(`shared/index.ts: ${rewrites} block(s) annotated`);
    totalRewrites += rewrites;
  } else {
    console.log(`shared/index.ts: nothing to rewrite`);
  }
}

const sharedPath = path.join(PREVIEWS_DIR, 'shared', 'index.ts');
if (fs.existsSync(sharedPath)) {
  rewriteSharedFile(sharedPath);
}

// ── Pass 3: extractor template's hardcoded SHARED_BLOCKS_DATA ─────
//
// scripts/extract-block-registry-data.js carries an inline literal of
// the shared blocks (since shared/index.ts isn't read by the extractor).
// Apply the same rewrite there so future regenerations stay
// consistent.

function rewriteScriptShared() {
  const original = fs.readFileSync(SCRIPT_PATH, 'utf8');
  const lines = original.split('\n');
  let rewrites = 0;

  const idRe = /id:\s*'([^']+)'/;
  const moduleNullRe = /module:\s*null/;
  const noModuleReasonRe = /,?\s*noModuleReason:\s*'[^']+'/;

  const updated = lines.map((line) => {
    if (!moduleNullRe.test(line)) return line;
    const idMatch = line.match(idRe);
    if (!idMatch) return line;
    const id = idMatch[1];
    const slug = SHARED_BLOCK_SLUGS[id];
    if (!slug) return line;
    let next = line.replace(moduleNullRe, `module: '${slug}'`);
    next = next.replace(noModuleReasonRe, '');
    rewrites++;
    return next;
  });

  if (rewrites > 0) {
    fs.writeFileSync(SCRIPT_PATH, updated.join('\n'));
    console.log(`extract-block-registry-data.js: ${rewrites} block(s) annotated`);
    totalRewrites += rewrites;
  } else {
    console.log(`extract-block-registry-data.js: nothing to rewrite`);
  }
}

rewriteScriptShared();

console.log(`\nTotal: ${totalRewrites} module-less blocks annotated`);
