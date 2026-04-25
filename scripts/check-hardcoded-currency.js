// Scan: partner-rendered code for hardcoded currency symbols. The
// canonical formatter is `formatMoney(amount, currency, locale?)`
// from `src/lib/currency.ts`. Anything else (string concat with `'$'`,
// template literals like `\`₹${price}\``) silently breaks for
// partners in a different region.
//
// PR fix-11 ships this in WARN mode — it lists every suspicious site
// without failing the build. The migration to formatMoney is a
// separate PR; once those callers are clean, flip FAIL_ON_FIND below
// to true and the lint becomes a blocking CI gate.
//
// Scope: only paths that render to partners or external recipients.
// Admin previews under src/app/admin/relay/blocks/previews/** are
// explicitly excluded — they're static mockups, not partner data.

const fs = require('fs');
const path = require('path');

const FAIL_ON_FIND = false; // flip once existing hits are migrated

const ROOT = path.join(__dirname, '..', 'src');

const INCLUDE_DIRS = [
  path.join(ROOT, 'app', 'partner'),
  path.join(ROOT, 'lib', 'relay'),
  path.join(ROOT, 'components', 'partner'),
];

const EXCLUDE_PATH_PARTS = [
  // Admin gallery mockups — explicitly static, not partner-rendered.
  path.join('admin', 'relay', 'blocks', 'previews'),
  // The canonical helper itself.
  path.join('lib', 'currency.ts'),
];

// Currency-symbol heuristics. We're conservative — only flag when
// the symbol is unambiguously sitting next to a price.
//
// `$` is the tricky one: it's also JS template-literal syntax and a
// regex backreference (`$1`, `$2`). To avoid those false positives:
//   - `$\d{2,}` — multi-digit number (`$99`, `$1500`)
//   - `$\d[.,]` — decimal/grouped (`$1.50`, `$1,000`)
//   - `$$\{`   — literal `$` before a template interp (`\`$${price}\``)
// Single-digit `$1` is treated as a backreference and skipped.
//
// `₹€£¥` have no other JS meaning so we flag them whenever they sit
// next to a digit or a `${` interpolation.
const PATTERNS = [
  { re: /₹\s*(\$\{|\d)/g, label: '₹ + amount' },
  { re: /£\s*(\$\{|\d)/g, label: '£ + amount' },
  { re: /€\s*(\$\{|\d)/g, label: '€ + amount' },
  { re: /¥\s*(\$\{|\d)/g, label: '¥ + amount' },
  { re: /\$\d{2,}/g, label: '$ + multi-digit amount' },
  { re: /\$\d[.,]/g, label: '$ + decimal/grouped amount' },
  { re: /\$\$\{/g, label: '$ before ${...} interpolation' },
];

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (EXCLUDE_PATH_PARTS.some((p) => full.includes(p))) continue;
    if (e.isDirectory()) {
      walk(full, out);
    } else if (
      e.isFile() &&
      (full.endsWith('.ts') || full.endsWith('.tsx'))
    ) {
      out.push(full);
    }
  }
}

const files = [];
for (const d of INCLUDE_DIRS) walk(d, files);

const hits = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip comments — false positives in jsdoc/inline comments.
    const stripped = line.replace(/\/\/.*$/, '');
    for (const { re, label } of PATTERNS) {
      re.lastIndex = 0;
      if (re.test(stripped)) {
        hits.push({
          file: path.relative(path.join(__dirname, '..'), file),
          line: i + 1,
          label,
          snippet: line.trim().slice(0, 140),
        });
      }
    }
  }
}

if (hits.length === 0) {
  console.log(
    '✓ check-hardcoded-currency: no hardcoded currency symbols found in ' +
      'partner-rendered paths.',
  );
  process.exit(0);
}

const verb = FAIL_ON_FIND ? 'FAIL' : 'WARN';
console.log(
  `${verb === 'FAIL' ? '✗' : '⚠'} check-hardcoded-currency: ${hits.length} ` +
    `hardcoded currency symbol(s) found. Migrate to ` +
    `\`formatMoney(amount, currency)\` from src/lib/currency.ts.\n`,
);

for (const h of hits) {
  console.log(`  ${h.file}:${h.line} [${h.label}]`);
  console.log(`    ${h.snippet}`);
}

process.exit(FAIL_ON_FIND ? 1 : 0);
