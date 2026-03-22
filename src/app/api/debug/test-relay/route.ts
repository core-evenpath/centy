import { NextRequest, NextResponse } from 'next/server';
import {
    getRelayConfigAction,
    saveRelayConfigAction,
    runRelayDiagnosticsAction,
    getRelayConversationsAction,
} from '@/actions/relay-actions';
import { backfillRelayBlockConfigsAction } from '@/actions/modules-actions';
import { db as adminDb } from '@/lib/firebase-admin';

/**
 * Debug endpoint to test all relay server actions.
 *
 * Usage:
 *   GET /api/debug/test-relay?partnerId=YOUR_PARTNER_ID
 *   GET /api/debug/test-relay?partnerId=YOUR_PARTNER_ID&run=save
 *   GET /api/debug/test-relay?partnerId=YOUR_PARTNER_ID&run=diagnostics
 *   GET /api/debug/test-relay?partnerId=YOUR_PARTNER_ID&run=backfill
 *   GET /api/debug/test-relay?partnerId=YOUR_PARTNER_ID&run=all
 *
 * Only available in development.
 */
export async function GET(request: NextRequest) {
    // Safety: only allow in development
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    const run = searchParams.get('run') || 'all';

    if (!partnerId) {
        return NextResponse.json({
            error: 'Missing partnerId query parameter',
            usage: 'GET /api/debug/test-relay?partnerId=YOUR_PARTNER_ID&run=all',
            available_runs: ['getConfig', 'save', 'diagnostics', 'conversations', 'backfill', 'listPartners', 'all'],
        }, { status: 400 });
    }

    const results: Record<string, any> = { partnerId, run, timestamp: new Date().toISOString() };

    try {
        // ── List available partners (helpful for finding partnerId) ───
        if (run === 'listPartners' || run === 'all') {
            try {
                const snap = await adminDb.collection('partners').limit(10).get();
                results.availablePartners = snap.docs.map(d => ({
                    id: d.id,
                    name: d.data().businessName || d.data().name || d.id,
                }));
            } catch (e: any) {
                results.availablePartners = { error: e.message };
            }
        }

        // ── Test 1: Get relay config ─────────────────────────────────
        if (run === 'getConfig' || run === 'all') {
            try {
                const configResult = await getRelayConfigAction(partnerId);
                results.getConfig = {
                    status: configResult.success ? 'PASS' : 'FAIL',
                    hasExistingConfig: !!configResult.config,
                    data: configResult,
                };
            } catch (e: any) {
                results.getConfig = { status: 'ERROR', error: e.message };
            }
        }

        // ── Test 2: Save relay config ────────────────────────────────
        if (run === 'save' || run === 'all') {
            try {
                const testConfig = {
                    enabled: true,
                    brandName: `Test Brand (${new Date().toLocaleTimeString()})`,
                    tagline: 'Debug test tagline',
                    brandEmoji: '🧪',
                    accentColor: '#6366f1',
                    welcomeMessage: 'Hello from debug test!',
                };
                const saveResult = await saveRelayConfigAction(partnerId, testConfig);
                results.saveConfig = {
                    status: saveResult.success ? 'PASS' : 'FAIL',
                    data: saveResult,
                };

                // Verify the save by reading it back
                if (saveResult.success) {
                    const readBack = await getRelayConfigAction(partnerId);
                    results.saveConfig.readBackVerification = {
                        status: readBack.success && readBack.config?.brandName === testConfig.brandName ? 'PASS' : 'FAIL',
                        savedBrandName: testConfig.brandName,
                        readBackBrandName: readBack.config?.brandName,
                    };
                }
            } catch (e: any) {
                results.saveConfig = { status: 'ERROR', error: e.message };
            }
        }

        // ── Test 3: Run diagnostics ──────────────────────────────────
        if (run === 'diagnostics' || run === 'all') {
            try {
                const diagResult = await runRelayDiagnosticsAction(partnerId);
                results.diagnostics = {
                    status: diagResult.success ? 'PASS' : 'FAIL',
                    checksCount: diagResult.checks.length,
                    checks: diagResult.checks,
                    summary: {
                        pass: diagResult.checks.filter(c => c.status === 'pass').length,
                        warn: diagResult.checks.filter(c => c.status === 'warn').length,
                        fail: diagResult.checks.filter(c => c.status === 'fail').length,
                    },
                };
            } catch (e: any) {
                results.diagnostics = { status: 'ERROR', error: e.message };
            }
        }

        // ── Test 4: Get conversations ────────────────────────────────
        if (run === 'conversations' || run === 'all') {
            try {
                const convoResult = await getRelayConversationsAction(partnerId);
                results.conversations = {
                    status: convoResult.success ? 'PASS' : 'FAIL',
                    count: convoResult.conversations.length,
                    data: convoResult.conversations.slice(0, 3), // Show first 3
                };
            } catch (e: any) {
                results.conversations = { status: 'ERROR', error: e.message };
            }
        }

        // ── Test 5: Backfill relay block configs ─────────────────────
        if (run === 'backfill' || run === 'all') {
            try {
                const backfillResult = await backfillRelayBlockConfigsAction();
                results.backfill = {
                    status: backfillResult.success ? 'PASS' : 'FAIL',
                    data: backfillResult,
                };
            } catch (e: any) {
                results.backfill = { status: 'ERROR', error: e.message };
            }
        }

        // ── Test 6: Check relay block configs exist ──────────────────
        if (run === 'all') {
            try {
                const snap = await adminDb.collection('relayBlockConfigs').limit(10).get();
                results.relayBlockConfigs = {
                    status: snap.size > 0 ? 'PASS' : 'WARN (empty)',
                    count: snap.size,
                    configs: snap.docs.map(d => ({
                        id: d.id,
                        label: d.data().label,
                        blockType: d.data().blockType,
                        moduleSlug: d.data().moduleSlug,
                    })),
                };
            } catch (e: any) {
                results.relayBlockConfigs = { status: 'ERROR', error: e.message };
            }
        }

        // ── Overall summary ──────────────────────────────────────────
        const statuses = Object.values(results)
            .filter(v => typeof v === 'object' && v !== null && 'status' in v)
            .map((v: any) => v.status);

        results.overall = {
            total: statuses.length,
            passed: statuses.filter(s => s === 'PASS').length,
            failed: statuses.filter(s => s === 'FAIL' || s === 'ERROR').length,
            verdict: statuses.every(s => s === 'PASS' || s?.startsWith('WARN')) ? 'ALL PASS' : 'HAS FAILURES',
        };

        return NextResponse.json(results, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
    }
}
