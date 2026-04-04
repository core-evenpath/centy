/**
 * Standalone test script for relay server actions.
 *
 * Usage:
 *   npx tsx scripts/test-relay-actions.ts <partnerId>
 *   npx tsx scripts/test-relay-actions.ts               # lists partners, then exits
 *
 * Requires: .env.local with Firebase credentials (FIREBASE_PRIVATE_KEY, etc.)
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

async function main() {
    // Dynamic import to ensure env vars are loaded first
    const { db: adminDb } = await import('../src/lib/firebase-admin');

    const partnerId = process.argv[2];

    // ── If no partnerId, list available partners ─────────────────────
    if (!partnerId) {
        console.log('\n📋 Available partners:\n');
        try {
            const snap = await adminDb.collection('partners').limit(20).get();
            if (snap.empty) {
                console.log('  (no partners found)');
            } else {
                for (const doc of snap.docs) {
                    const d = doc.data();
                    console.log(`  ${doc.id}  →  ${d.businessName || d.name || '(unnamed)'}`);
                }
            }
        } catch (e: any) {
            console.error('  Error listing partners:', e.message);
        }
        console.log('\nUsage: npx tsx scripts/test-relay-actions.ts <partnerId>\n');
        process.exit(0);
    }

    console.log(`\n🧪 Testing relay actions for partner: ${partnerId}\n`);
    let passed = 0, failed = 0;

    function report(name: string, ok: boolean, detail?: string) {
        if (ok) {
            console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ''}`);
            passed++;
        } else {
            console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`);
            failed++;
        }
    }

    // ── Test 1: getRelayConfigAction ─────────────────────────────────
    try {
        const { getRelayConfigAction } = await import('../src/actions/relay-actions');
        const result = await getRelayConfigAction(partnerId);
        report('getRelayConfigAction', result.success, result.config ? 'config exists' : 'no config yet (OK for new partners)');
    } catch (e: any) {
        report('getRelayConfigAction', false, e.message);
    }

    // ── Test 2: saveRelayConfigAction ────────────────────────────────
    try {
        const { saveRelayConfigAction, getRelayConfigAction } = await import('../src/actions/relay-actions');
        const testConfig = {
            enabled: true,
            brandName: `Test ${Date.now()}`,
            tagline: 'Script test',
            brandEmoji: '🧪',
            accentColor: '#6366f1',
            welcomeMessage: 'Hello from test script!',
        };
        const saveResult = await saveRelayConfigAction(partnerId, testConfig);
        if (!saveResult.success) {
            report('saveRelayConfigAction', false, saveResult.error);
        } else {
            // Verify round-trip
            const readBack = await getRelayConfigAction(partnerId);
            const match = readBack.config?.brandName === testConfig.brandName;
            report('saveRelayConfigAction', match, match ? 'saved and verified' : 'save succeeded but read-back mismatch');
        }
    } catch (e: any) {
        report('saveRelayConfigAction', false, e.message);
    }

    // ── Test 3: runRelayDiagnosticsAction ────────────────────────────
    try {
        const { runRelayDiagnosticsAction } = await import('../src/actions/relay-actions');
        const result = await runRelayDiagnosticsAction(partnerId);
        const summary = result.checks.map(c => `${c.status === 'pass' ? '✓' : c.status === 'warn' ? '⚠' : '✗'} ${c.label}`).join(', ');
        report('runRelayDiagnosticsAction', result.success && result.checks.length === 5, `${result.checks.length} checks: ${summary}`);
    } catch (e: any) {
        report('runRelayDiagnosticsAction', false, e.message);
    }

    // ── Test 4: getRelayConversationsAction ──────────────────────────
    try {
        const { getRelayConversationsAction } = await import('../src/actions/relay-actions');
        const result = await getRelayConversationsAction(partnerId);
        report('getRelayConversationsAction', result.success, `${result.conversations.length} conversations`);
    } catch (e: any) {
        report('getRelayConversationsAction', false, e.message);
    }

    // ── Test 5: backfillRelayBlockConfigsAction ──────────────────────
    try {
        const { backfillRelayBlockConfigsAction } = await import('../src/actions/modules-actions');
        const result = await backfillRelayBlockConfigsAction();
        report('backfillRelayBlockConfigsAction', result.success, `${result.created} created, ${result.skipped} skipped, ${result.errors.length} errors`);
    } catch (e: any) {
        report('backfillRelayBlockConfigsAction', false, e.message);
    }

    // ── Test 6: Check block registry ──────────────────────────────────
    try {
        const { registerAllBlocks } = await import('@/lib/relay/blocks/index');
        const { listBlocks, getRegistrySize } = await import('@/lib/relay/registry');
        registerAllBlocks();
        const size = getRegistrySize();
        const blocks = listBlocks();
        report('block registry', true, `${size} blocks registered${size > 0 ? ': ' + blocks.slice(0, 5).map(b => b.label).join(', ') : ''}`);
    } catch (e: any) {
        report('block registry', false, e.message);
    }

    // ── Summary ──────────────────────────────────────────────────────
    console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
    process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});
