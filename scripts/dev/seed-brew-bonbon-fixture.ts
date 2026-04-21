/* eslint-disable no-console */
/**
 * ═══════════════════════════════════════════════════════════════════════════
 *   DEV-ONLY FIXTURE — NOT FOR PRODUCTION — NEVER IMPORT FROM RUNTIME
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   Seeds realistic businessModules (menu_items, drinks, products) and
 *   enables all cafe-vertical blocks for a development partner so Test
 *   Chat can be exercised against known-good data.
 *
 *   Purpose: close the H3 (partner-prefs filter) inconclusive gap from
 *   the Phase 2 probe report. After running this against Brew & BonBon
 *   Cafe, any remaining Test Chat failure is provably in the emission
 *   layer (parser or buildBlockData), not in partner data.
 *
 *   Safety rails:
 *     - Production-project allowlist guard (see PROD_PROJECT_PATTERNS).
 *       Bypass only via ALLOW_FIXTURE_IN_PROD=true.
 *     - Every written doc carries `_fixture: true` marker for safe
 *       wipe targeting.
 *     - Dry-run is the default. Explicit --commit required to write.
 *     - Reversible via --wipe using the `_fixture: true` sentinel.
 *     - NEVER runs in CI. No npm script alias (intentional).
 *
 *   Usage:
 *     npx tsx scripts/dev/seed-brew-bonbon-fixture.ts                    # dry-run
 *     npx tsx scripts/dev/seed-brew-bonbon-fixture.ts --commit --partner-id <id>
 *     npx tsx scripts/dev/seed-brew-bonbon-fixture.ts --wipe   --partner-id <id>
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import admin from 'firebase-admin';
import readline from 'node:readline';

// No dotenv import here — this repo doesn't carry @types/dotenv (the
// existing scripts tolerate the tsc error; this fixture keeps the tsc
// baseline intact by relying on the caller to surface env vars via
// `source .env` / `node --env-file=.env.local` / shell prefix.

// ── Production-project guard ────────────────────────────────────────
//
// Patterns matching project ids that should never receive a fixture
// write. Add more as prod/staging projects come online. Override
// deliberately via ALLOW_FIXTURE_IN_PROD=true for dev-on-prod
// emergencies (never do this casually).
const PROD_PROJECT_PATTERNS: RegExp[] = [
  /^centy-prod/i,
  /-prod$/i,
  /-production$/i,
];

// ── Fixture marker ─────────────────────────────────────────────────
const FIXTURE_MARKER = '_fixture' as const;
const FIXTURE_MARKER_VALUE = true as const;

// ── Modules to seed ────────────────────────────────────────────────
interface FixtureItemSeed {
  name: string;
  description: string;
  price: number;
  category: string;
}

const BONBON_ITEMS: FixtureItemSeed[] = [
  { name: 'Dark Chocolate Praline',   description: 'Single-origin 70% cacao with hazelnut praline center',           price: 180, category: 'bonbons' },
  { name: 'Hazelnut Truffle',          description: 'Gianduja truffle with roasted Piedmont hazelnuts',               price: 160, category: 'bonbons' },
  { name: 'Salted Caramel Bonbon',     description: 'Fleur de sel caramel in milk chocolate shell',                   price: 170, category: 'bonbons' },
  { name: 'Pistachio Rose Creme',      description: 'Persian rose ganache with slivered pistachios',                   price: 190, category: 'bonbons' },
  { name: 'Coffee Ganache',            description: 'Ethiopian single-origin espresso infused dark ganache',           price: 150, category: 'bonbons' },
];

const COFFEE_ITEMS: FixtureItemSeed[] = [
  { name: 'Single Origin Pour Over',    description: 'Rotating seasonal single-origin, 240ml',            price: 220, category: 'coffee' },
  { name: 'Nilgiri Cold Brew',          description: '14-hour cold extraction from Nilgiri estates',      price: 180, category: 'coffee' },
  { name: 'Cortado',                    description: 'Equal parts espresso and steamed milk',             price: 160, category: 'coffee' },
  { name: 'Masala Chai Latte',          description: 'House-blend chai with cardamom, ginger, clove',     price: 140, category: 'coffee' },
  { name: 'Cardamom Cappuccino',        description: 'Double espresso, cardamom-infused milk foam',       price: 170, category: 'coffee' },
];

interface ModuleSeed {
  slug: string;
  name: string;
  items: FixtureItemSeed[];
}

const MODULE_SEEDS: ModuleSeed[] = [
  { slug: 'menu_items', name: 'Menu (Bonbons)',    items: BONBON_ITEMS },
  { slug: 'drinks',      name: 'Drinks',             items: COFFEE_ITEMS },
  // `products` mirrors the union for any path that reaches it (Layer C
  // fallback, product_card, ecom_product_card)
  { slug: 'products',    name: 'Products',           items: [...BONBON_ITEMS, ...COFFEE_ITEMS] },
];

// ── Blocks to enable (union of cafe template stages) ───────────────
//
// Source: src/lib/relay/flow-templates/commerce/food-delivery.ts:20-26.
// All five stages' blockTypes deduplicated. sortOrder: stage index × 10
// + position within stage.
const BLOCK_SEEDS: Array<{ id: string; sortOrder: number }> = [
  // fd_greeting
  { id: 'greeting',          sortOrder: 10 },
  { id: 'suggestions',       sortOrder: 11 },
  // fd_discovery
  { id: 'menu_item',         sortOrder: 20 },
  { id: 'category_browser',  sortOrder: 21 },
  { id: 'dietary_filter',    sortOrder: 22 },
  { id: 'drink_menu',        sortOrder: 23 },
  // fd_showcase
  { id: 'menu_detail',       sortOrder: 30 },
  { id: 'daily_specials',    sortOrder: 31 },
  { id: 'combo_meal',        sortOrder: 32 },
  { id: 'nutrition',         sortOrder: 33 },
  { id: 'promo',             sortOrder: 34 },
  // fd_conversion
  { id: 'order_customizer',  sortOrder: 40 },
  { id: 'cart',              sortOrder: 41 },
  // fd_handoff
  { id: 'contact',           sortOrder: 50 },
];

// ── Args parsing ───────────────────────────────────────────────────

interface Args {
  commit: boolean;
  wipe: boolean;
  yes: boolean;
  partnerId?: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { commit: false, wipe: false, yes: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--commit') out.commit = true;
    else if (a === '--wipe') out.wipe = true;
    else if (a === '--yes') out.yes = true;
    else if (a === '--partner-id') out.partnerId = argv[++i];
    else if (a === '--help' || a === '-h') {
      printUsage();
      process.exit(0);
    }
  }
  if (out.commit && out.wipe) {
    console.error('Error: pass either --commit or --wipe, not both.');
    process.exit(1);
  }
  return out;
}

function printUsage(): void {
  console.log(`
Brew & BonBon Cafe test-chat fixture seeder

Usage:
  npx tsx scripts/dev/seed-brew-bonbon-fixture.ts                    # dry-run (default)
  npx tsx scripts/dev/seed-brew-bonbon-fixture.ts --commit --partner-id <id>
  npx tsx scripts/dev/seed-brew-bonbon-fixture.ts --wipe --partner-id <id>

Flags:
  --commit              Apply writes to Firestore. Requires --partner-id.
  --wipe                Delete only docs carrying _fixture: true. Requires --partner-id.
  --partner-id <id>     Target partner. Required for --commit and --wipe.
  --yes                 Skip wipe confirmation prompt.

Env (must be present in the shell; this script does NOT load .env):
  NEXT_PUBLIC_FIREBASE_PROJECT_ID
  FIREBASE_CLIENT_EMAIL
  FIREBASE_PRIVATE_KEY            (with literal \\n for newlines)
  ALLOW_FIXTURE_IN_PROD=true      (override production-project guard; never set casually)

To surface env vars:
  source .env.local && npx tsx scripts/dev/seed-brew-bonbon-fixture.ts ...
  # or on Node 20+:
  node --env-file=.env.local --loader tsx scripts/dev/seed-brew-bonbon-fixture.ts ...

Finding the partner id:
  In the Firebase console, query partners where businessName contains "Brew".
`);
}

// ── Firebase admin init (no server-only import) ────────────────────

function initFirebase(): admin.firestore.Firestore {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) {
    console.error('Error: missing Firebase credentials in env.');
    console.error('Required: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }

  const allowProd = process.env.ALLOW_FIXTURE_IN_PROD === 'true';
  for (const pattern of PROD_PROJECT_PATTERNS) {
    if (pattern.test(projectId) && !allowProd) {
      console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  FIXTURE REFUSED TO RUN                                          ║
║                                                                  ║
║  Project id "${projectId}" matches a production pattern.
║                                                                  ║
║  This script is dev-only. It will refuse to write to prod        ║
║  unless you explicitly set ALLOW_FIXTURE_IN_PROD=true.            ║
║                                                                  ║
║  If you meant to run against a dev project, check your .env.     ║
╚══════════════════════════════════════════════════════════════════╝
`);
      process.exit(1);
    }
  }
  if (allowProd) {
    console.warn(`⚠️  ALLOW_FIXTURE_IN_PROD=true — production guard bypassed.`);
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKeyRaw.replace(/\\n/g, '\n'),
      }),
      projectId,
    });
  }
  console.log(`Firebase project: ${projectId}`);
  return admin.firestore();
}

// ── Doc builders (pure) ────────────────────────────────────────────

function moduleDocId(slug: string): string {
  // Deterministic id so re-runs merge cleanly. `fx_` prefix doubles as
  // a human-readable hint that the doc is fixture-origin.
  return `fx_${slug}`;
}

function itemDocId(moduleSlug: string, idx: number): string {
  return `fx_${moduleSlug}_item_${String(idx + 1).padStart(3, '0')}`;
}

function blockDocId(blockId: string): string {
  // Block prefs use the blockId as the doc id (per signal reader + writer
  // convention); fixture matches.
  return blockId;
}

function buildModuleDoc(partnerId: string, mod: ModuleSeed, now: string) {
  const modId = moduleDocId(mod.slug);
  return {
    path: `partners/${partnerId}/businessModules/${modId}`,
    id: modId,
    data: {
      id: modId,
      partnerId,
      moduleSlug: mod.slug,
      moduleId: modId,  // fixture uses self-reference (no systemModule linkage)
      name: mod.name,
      enabled: true,
      schemaVersion: 1,
      upgradeAvailable: false,
      latestVersion: 1,
      lastUpgradeCheck: now,
      customFields: [],
      customCategories: [],
      itemCount: mod.items.length,
      activeItemCount: mod.items.length,
      lastItemAddedAt: now,
      lastItemUpdatedAt: now,
      settings: {
        defaultCurrency: 'INR',
        showInactiveItems: false,
        itemsPerPage: 20,
      },
      createdAt: now,
      updatedAt: now,
      [FIXTURE_MARKER]: FIXTURE_MARKER_VALUE,
    },
  };
}

function buildItemDoc(
  partnerId: string,
  modSlug: string,
  idx: number,
  item: FixtureItemSeed,
  now: string,
) {
  const id = itemDocId(modSlug, idx);
  const modId = moduleDocId(modSlug);
  return {
    path: `partners/${partnerId}/businessModules/${modId}/items/${id}`,
    id,
    data: {
      id,
      moduleId: modId,
      partnerId,
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price,
      currency: 'INR',
      images: [`https://picsum.photos/seed/${encodeURIComponent(item.name)}/400/300`],
      fields: {},
      isActive: true,
      isFeatured: idx === 0,
      sortOrder: (idx + 1) * 10,
      trackInventory: false,
      _schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: 'fixture',
      [FIXTURE_MARKER]: FIXTURE_MARKER_VALUE,
    },
  };
}

function buildBlockPrefDoc(
  partnerId: string,
  block: { id: string; sortOrder: number },
  now: string,
) {
  const id = blockDocId(block.id);
  return {
    path: `partners/${partnerId}/relayConfig/${id}`,
    id,
    data: {
      id,
      blockId: block.id,
      isVisible: true,
      sortOrder: block.sortOrder,
      createdAt: now,
      updatedAt: now,
      [FIXTURE_MARKER]: FIXTURE_MARKER_VALUE,
    },
  };
}

interface DocOp {
  path: string;
  id: string;
  data: Record<string, unknown>;
}

function buildAllDocs(partnerId: string): DocOp[] {
  const now = new Date().toISOString();
  const ops: DocOp[] = [];
  for (const mod of MODULE_SEEDS) {
    ops.push(buildModuleDoc(partnerId, mod, now));
    mod.items.forEach((item, idx) => {
      ops.push(buildItemDoc(partnerId, mod.slug, idx, item, now));
    });
  }
  for (const block of BLOCK_SEEDS) {
    ops.push(buildBlockPrefDoc(partnerId, block, now));
  }
  return ops;
}

// ── Dry-run printing ───────────────────────────────────────────────

function printDryRun(partnerId: string): void {
  const ops = buildAllDocs(partnerId);
  console.log(`\n── DRY RUN (no writes) ──────────────────────────────────────`);
  console.log(`Target partner: ${partnerId}`);
  console.log(`Docs that WOULD be written: ${ops.length}`);
  console.log('');
  const byPrefix = new Map<string, number>();
  for (const op of ops) {
    const prefix = op.path.replace(/\/[^/]+$/, '');
    byPrefix.set(prefix, (byPrefix.get(prefix) ?? 0) + 1);
  }
  for (const [prefix, count] of byPrefix) {
    console.log(`  ${prefix}/*  (${count} doc${count === 1 ? '' : 's'})`);
  }
  console.log('');
  console.log('Sample (first 3 docs):');
  for (const op of ops.slice(0, 3)) {
    console.log(`  ${op.path}`);
    console.log(`    ${JSON.stringify(op.data).slice(0, 240)}`);
  }
  console.log('');
  console.log('To apply: rerun with --commit --partner-id <id>');
  console.log('');
}

// ── Commit ─────────────────────────────────────────────────────────

async function commitAll(
  db: admin.firestore.Firestore,
  partnerId: string,
): Promise<void> {
  const ops = buildAllDocs(partnerId);
  const runId = Math.random().toString(36).slice(2, 10);
  console.log(`\n── COMMIT run=${runId} partner=${partnerId} ──────────────────`);
  console.log(`Writing ${ops.length} docs...`);
  let ok = 0;
  let failed = 0;
  for (const op of ops) {
    try {
      // .set with merge: idempotent re-run won't clobber manually-added
      // fields; fixture fields overwrite fixture fields.
      await db.doc(op.path).set(op.data, { merge: true });
      console.log(`  ✓ ${op.path}`);
      ok++;
    } catch (err) {
      console.error(`  ✗ ${op.path}  ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }
  console.log(`\nRun ${runId}: ${ok} ok / ${failed} failed (${ops.length} total)`);
  if (failed > 0) process.exit(2);
}

// ── Wipe ───────────────────────────────────────────────────────────

async function wipeFixture(
  db: admin.firestore.Firestore,
  partnerId: string,
): Promise<void> {
  console.log(`\n── WIPE partner=${partnerId} ────────────────────────────────`);
  console.log(`Deleting docs with ${FIXTURE_MARKER}: ${FIXTURE_MARKER_VALUE} under partner subtree.`);
  console.log('');
  const paths: string[] = [];

  // Collect fixture module docs + their item subcollections
  for (const mod of MODULE_SEEDS) {
    const modId = moduleDocId(mod.slug);
    const modPath = `partners/${partnerId}/businessModules/${modId}`;
    const itemsSnap = await db.collection(`${modPath}/items`).get();
    for (const doc of itemsSnap.docs) {
      const data = doc.data();
      if (data?.[FIXTURE_MARKER] === FIXTURE_MARKER_VALUE) {
        paths.push(`${modPath}/items/${doc.id}`);
      }
    }
    const modSnap = await db.doc(modPath).get();
    if (modSnap.exists) {
      const data = modSnap.data();
      if (data?.[FIXTURE_MARKER] === FIXTURE_MARKER_VALUE) {
        paths.push(modPath);
      } else {
        console.warn(
          `  !  ${modPath} exists but lacks ${FIXTURE_MARKER} sentinel — skipping (not fixture)`,
        );
      }
    }
  }

  // Collect fixture block pref docs
  for (const block of BLOCK_SEEDS) {
    const blockPath = `partners/${partnerId}/relayConfig/${blockDocId(block.id)}`;
    const blockSnap = await db.doc(blockPath).get();
    if (blockSnap.exists) {
      const data = blockSnap.data();
      if (data?.[FIXTURE_MARKER] === FIXTURE_MARKER_VALUE) {
        paths.push(blockPath);
      } else {
        console.warn(
          `  !  ${blockPath} exists but lacks ${FIXTURE_MARKER} sentinel — skipping (not fixture)`,
        );
      }
    }
  }

  if (paths.length === 0) {
    console.log('No fixture docs found under this partner. Nothing to wipe.');
    return;
  }

  console.log(`Will delete ${paths.length} fixture doc(s):`);
  for (const p of paths.slice(0, 10)) console.log(`  - ${p}`);
  if (paths.length > 10) console.log(`  ... and ${paths.length - 10} more`);
  console.log('');

  console.log('Deleting...');
  let ok = 0;
  let failed = 0;
  for (const p of paths) {
    try {
      await db.doc(p).delete();
      console.log(`  ✓ ${p}`);
      ok++;
    } catch (err) {
      console.error(`  ✗ ${p}  ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }
  console.log(`\nWipe: ${ok} ok / ${failed} failed (${paths.length} total)`);
}

async function confirmWipe(): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise<string>((resolve) => {
    rl.question('CONFIRM WIPE? (type YES to proceed): ', (a) => resolve(a));
  });
  rl.close();
  return answer === 'YES';
}

// ── Entry ──────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.commit && !args.wipe) {
    const partnerId = args.partnerId ?? '<partner-id-not-provided>';
    if (!args.partnerId) {
      console.log('\nNo --partner-id provided. Showing dry-run preview against a placeholder.');
      console.log('To resolve the real partner id, query Firestore:');
      console.log(`  partners where businessName contains "Brew"\n`);
    }
    printDryRun(partnerId);
    return;
  }

  if (!args.partnerId) {
    console.error('Error: --partner-id is required for --commit and --wipe.');
    process.exit(1);
  }

  const db = initFirebase();

  if (args.commit) {
    await commitAll(db, args.partnerId);
    return;
  }

  if (args.wipe) {
    if (!args.yes) {
      const ok = await confirmWipe();
      if (!ok) {
        console.log('Wipe aborted.');
        return;
      }
    }
    await wipeFixture(db, args.partnerId);
    return;
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(99);
});
