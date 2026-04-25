// Lint: every money-family block declares both `price` and `currency`
// in its reads[]. The schemas auto-generate from union(reads) — so if
// a block forgets `currency`, the resulting schema won't have it
// either, and partner data ends up with bare numbers (PR fix-11
// guardrail).
//
// Money families (must declare both):
//   catalog, parts, service, pricing, valuation, commerce,
//   conversion, booking, packages, real_estate
//
// Run via `node scripts/check-block-currency-reads.js`. Exits 0 when
// clean, 1 (with a punch list) when blocks are missing fields. Wire
// into CI to block regressions.

const fs = require('fs');
const path = require('path');

const REGISTRY_PATH = path.join(
  __dirname,
  '..',
  'src',
  'app',
  'admin',
  'relay',
  'blocks',
  'previews',
  '_registry-data.ts',
);

const MONEY_FAMILIES = new Set([
  'catalog',
  'parts',
  'service',
  'pricing',
  'valuation',
  'commerce',
  'conversion',
  'booking',
  'packages',
  'real_estate',
]);

const REQUIRED = ['price', 'currency'];

const text = fs.readFileSync(REGISTRY_PATH, 'utf8');

// Match each block literal; capture id, family, and reads inner.
// Block lines look like:
//   { id: '...', family: '...', ..., reads: ['a', 'b'] }
const blockRe =
  /id:\s*'([^']+)'[^}]*?family:\s*'([^']+)'[^}]*?reads:\s*\[([^\]]*)\]/g;

const failures = [];
let totalChecked = 0;

for (const m of text.matchAll(blockRe)) {
  const [, id, family, readsInner] = m;
  if (!MONEY_FAMILIES.has(family)) continue;
  totalChecked++;
  const reads = Array.from(readsInner.matchAll(/'([^']+)'/g)).map((x) => x[1]);
  const readSet = new Set(reads);
  const missing = REQUIRED.filter((f) => !readSet.has(f));
  if (missing.length > 0) {
    failures.push({ id, family, missing });
  }
}

if (failures.length === 0) {
  console.log(
    `✓ check-block-currency-reads: ${totalChecked} money-family block(s) ` +
      `declare both price + currency.`,
  );
  process.exit(0);
}

console.error(
  `✗ check-block-currency-reads: ${failures.length} money-family block(s) ` +
    `missing required currency reads. ` +
    `Add the missing fields to the per-vertical preview file or re-run ` +
    `scripts/backfill-block-reads.js.\n`,
);
for (const f of failures) {
  console.error(
    `  - ${f.id} (family=${f.family}) missing: ${f.missing.join(', ')}`,
  );
}
process.exit(1);
