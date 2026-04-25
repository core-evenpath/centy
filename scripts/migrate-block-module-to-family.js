// One-shot rewrite to migrate block.module from the old shared
// 'items' slug to per-(vertical, family) slugs. Each block literal
// in the per-vertical index.{ts,tsx} files has `family: '<X>'` and
// `module: 'items'` on the same line — replace 'items' with
// `<vertical>_<family>` so the generator emits one schema per
// (vertical, family) pair instead of one global one.
//
// Idempotent: skips already-renamed blocks. Run once during PR E8.

const fs = require('fs');
const path = require('path');

const PREVIEWS_DIR = '/home/user/centy/src/app/admin/relay/blocks/previews';

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

let totalRewrites = 0;

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
    console.warn(`Missing index for vertical: ${vertical}`);
    continue;
  }

  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split('\n');
  let rewrites = 0;

  const familyRe = /family:\s*'([^']+)'/;
  const moduleRe = /module:\s*'items'/;

  const updated = lines.map((line) => {
    if (!moduleRe.test(line)) return line;
    const familyMatch = line.match(familyRe);
    if (!familyMatch) {
      // No family on this line — leave untouched. Should be rare.
      console.warn(
        `[${vertical}] line has module: 'items' but no family — skipping:\n  ${line.trim()}`,
      );
      return line;
    }
    const family = familyMatch[1];
    const newSlug = `${vertical}_${family}`;
    const next = line.replace(moduleRe, `module: '${newSlug}'`);
    rewrites++;
    return next;
  });

  if (rewrites > 0) {
    fs.writeFileSync(filePath, updated.join('\n'));
    console.log(`${vertical}: ${rewrites} block(s) rewritten`);
    totalRewrites += rewrites;
  } else {
    console.log(`${vertical}: nothing to rewrite (already migrated?)`);
  }
}

// Also sweep _manifest.ts so the legacy planning doc stays consistent.
// _manifest is grouped by vertical, but blocks are nested two levels
// deep (vertical → subvertical → blocks). Each block has family and
// module on the same line, but no enclosing vertical id — extract
// the vertical from the surrounding `id: '<x>'` of the parent vertical
// object.
const manifestPath = path.join(PREVIEWS_DIR, '_manifest.ts');
if (fs.existsSync(manifestPath)) {
  const manifestText = fs.readFileSync(manifestPath, 'utf8');
  const lines = manifestText.split('\n');
  let currentVertical = null;
  let manifestRewrites = 0;

  // Match top-level vertical entries: `{ id: 'automotive', ...`
  // (only top-level; subverticals also have id but we don't care for module rewrite).
  // We'll track by indentation: top-level vertical objects start at column 2.
  const verticalIdRe = /^\s{2}\{\s*id:\s*'([^']+)'/;

  const updated = lines.map((line) => {
    const vMatch = line.match(verticalIdRe);
    if (vMatch && VERTICALS.includes(vMatch[1])) {
      currentVertical = vMatch[1];
      return line;
    }
    if (!currentVertical) return line;
    if (!/module:\s*'items'/.test(line)) return line;
    const familyMatch = line.match(/family:\s*'([^']+)'/);
    if (!familyMatch) return line;
    const newSlug = `${currentVertical}_${familyMatch[1]}`;
    manifestRewrites++;
    return line.replace(/module:\s*'items'/, `module: '${newSlug}'`);
  });

  if (manifestRewrites > 0) {
    fs.writeFileSync(manifestPath, updated.join('\n'));
    console.log(`_manifest.ts: ${manifestRewrites} block(s) rewritten`);
    totalRewrites += manifestRewrites;
  } else {
    console.log(`_manifest.ts: nothing to rewrite`);
  }
}

console.log(`\nTotal: ${totalRewrites} block.module values rewritten`);
