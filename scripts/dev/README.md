# Dev scripts

Scripts under `scripts/dev/` are **local-only development utilities.** They
are not loaded by any runtime path. They are not part of CI. They exist to
make operator-side debugging and reproduction reliable — not to ship
features.

Rules that apply to every script here:

- Dry-run by default. An explicit `--commit` flag is required for writes.
- Production-project guards are mandatory. Scripts must refuse to run
  against prod project ids unless `ALLOW_FIXTURE_IN_PROD=true` is
  explicitly set (an override reserved for deliberate dev-on-prod
  emergencies — never set casually).
- Every document these scripts write carries a sentinel field (typically
  `_fixture: true`) so reversible wipes can target only script-written
  docs.
- No imports from `src/lib/firebase-admin` (which is `server-only`). Init
  the admin SDK directly from env credentials.

---

## `seed-brew-bonbon-fixture.ts`

### Purpose

Seeds realistic cafe-vertical data for Brew & BonBon Cafe so `/partner/relay`
Test Chat can be verified against known-good partner state. Closes the H3
(partner-prefs filter) inconclusive gap from the Phase 2 probe report
(`docs/phase-4/test-chat-products-audit.md`) and the
`docs/retros/partner-relay-test-chat-emission-retro.md` live-verification
gate.

### What it writes

Under `partners/{partnerId}/`:

- **`businessModules/fx_menu_items`** — 5 bonbon items (with `items/` subcollection)
- **`businessModules/fx_drinks`** — 5 coffee/tea items
- **`businessModules/fx_products`** — 10-item union (belt-and-suspenders for any path that reaches `product_card`)
- **`relayConfig/{blockId}`** (14 docs) — all cafe-template block ids marked `isVisible: true` with per-stage `sortOrder`

Every doc carries `_fixture: true`. Module doc ids use the `fx_` prefix for
human-readable origin hints.

### Decision logic after running

After `--commit`, open Test Chat as Brew & BonBon and send "show menu":

| Result | Diagnosis |
|---|---|
| Block renders with real fixture items | PR #198 emission fix works; prior issue was partner data; no further action |
| Block renders with design-sample placeholders | `buildBlockData` cafe cases incomplete — specific block id still missing from the switch (check for a block id not in `PRODUCT_BLOCK_PREFERRED_SLUGS`) |
| No block renders, prose only | Parser still dropping structured output — re-examine `extractAllText` or its callsite |
| 500 / error in runtime logs | New failure mode — dive into `/api/relay/chat` runtime logs |

### Environment

The script does **not** auto-load `.env` (avoids adding a `dotenv` dep
the repo doesn't currently pay for in its tsc baseline). Surface env
vars in the shell before running:

```
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
ALLOW_FIXTURE_IN_PROD=true    # override the prod guard (rare; deliberate only)
```

Two practical ways to surface them:

```bash
# POSIX shell
source .env.local
npx tsx scripts/dev/seed-brew-bonbon-fixture.ts --commit --partner-id <id>

# Node 20+
node --env-file=.env.local --loader tsx scripts/dev/seed-brew-bonbon-fixture.ts --commit --partner-id <id>
```

### Runbook

```bash
# 1. Dry-run preview (safe; no writes, no partner id needed)
npx tsx scripts/dev/seed-brew-bonbon-fixture.ts

# 2. Resolve the partner id (one-off Firestore console query)
#    Firestore console → partners → where businessName contains "Brew"
#    Copy the doc id.

# 3. Commit fixture
npx tsx scripts/dev/seed-brew-bonbon-fixture.ts --commit --partner-id <id>

# 4. Open /partner/relay Test Chat as Brew & BonBon Cafe admin. Send "show menu".
#    Expected: menu_item or drink_menu block with fixture items.

# 5. After testing, wipe
npx tsx scripts/dev/seed-brew-bonbon-fixture.ts --wipe --partner-id <id>
# (will prompt "CONFIRM WIPE? (type YES)" — or pass --yes to skip)
```

### Flags

| Flag | Effect |
|---|---|
| (none) | Dry-run. Prints would-be doc paths + sample data. |
| `--commit` | Applies writes via `.set({...}, { merge: true })`. Requires `--partner-id`. Idempotent. |
| `--wipe` | Deletes only docs carrying `_fixture: true`. Requires `--partner-id`. Prompts for confirmation unless `--yes` passed. |
| `--partner-id <id>` | Target partner. Required for `--commit` and `--wipe`. |
| `--yes` | Skip wipe confirmation. |
| `--help` / `-h` | Show usage and exit. |

### Safety guarantees

1. **Production guard** — refuses to run against project ids matching
   `/^centy-prod/`, `/-prod$/`, `/-production$/`. Override:
   `ALLOW_FIXTURE_IN_PROD=true`.
2. **Dry-run default** — no writes without `--commit`.
3. **Sentinel-targeted wipe** — `--wipe` deletes only docs carrying
   `_fixture: true`. Docs without the sentinel are left alone with a
   warning (prevents wiping real partner data that happens to share the
   fixture doc path).
4. **Idempotent writes** — `.set` with `{merge: true}`. Re-running
   `--commit` updates existing fixture fields without clobbering
   manually-added fields.
5. **No CI hook** — no `package.json` script alias. Script is only
   runnable via explicit `npx tsx` invocation.
