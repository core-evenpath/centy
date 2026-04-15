'use client';

/**
 * Partner: Content Studio — `/partner/relay/datamap`
 *
 * Slim orchestrator. Visual sub-components live in ./components.
 * Theme + vertical-aware preview content lives in ./constants.
 * Block → feature mapping lives in ./feature-mapper.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import {
    getPartnerSubVerticalsAction,
    getContentStudioConfigAction,
    getPartnerContentStudioStateAction,
    getEnabledApiIntegrationsForPartnerAction,
    regenerateContentStudioConfigAction,
} from '@/actions/content-studio-actions';
import { refreshPartnerContentStudioStateAction } from '@/actions/content-studio-refresh-actions';

import { Icon } from './components/ic';
import { ProgressRing } from './components/progress-ring';
import { PhonePreview } from './components/phone-preview';
import { DataInputPanel } from './components/data-input-panel';
import { FeatureList } from './components/feature-list';
import { SubVerticalBar } from './components/sub-vertical-bar';
import { DependentFeatures } from './components/dependent-features';

import { ACCENT, theme } from './constants';
import { mapAllFeatures, partitionFeatures } from './feature-mapper';
import type {
    SubVerticalOption,
    ContentStudioConfig,
    ContentStudioState,
} from './types';

export default function ContentStudioPage() {
    const { currentWorkspace, loading: wsLoading } = useMultiWorkspaceAuth();
    const partnerId = currentWorkspace?.partnerId;

    // ── Core state ──────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [config, setConfig] = useState<ContentStudioConfig | null>(null);
    const [state, setState] = useState<ContentStudioState | null>(null);
    const [enabledApis, setEnabledApis] = useState<string[]>([]);

    // ── Sub-vertical state ──────────────────────────────────────
    const [subVerticals, setSubVerticals] = useState<SubVerticalOption[]>([]);
    const [selectedSV, setSelectedSV] = useState<string | null>(null);

    // ── UI state ────────────────────────────────────────────────
    const [refreshing, setRefreshing] = useState(false);
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [regenerating, setRegenerating] = useState(false);
    const [regenError, setRegenError] = useState<string | null>(null);

    // BUG 6 FIX — track whether the initial load has happened so
    // setting selectedSV from inside the effect doesn't re-fetch.
    const initialLoadDone = useRef(false);

    // ── Helpers ─────────────────────────────────────────────────
    const fetchState = useCallback(async (pid: string) => {
        const res = await getPartnerContentStudioStateAction(pid);
        if (res.success && res.state) setState(res.state);
    }, []);

    const handleRefresh = useCallback(
        async (pid: string) => {
            setRefreshing(true);
            try {
                const res = await refreshPartnerContentStudioStateAction(pid);
                if (res.success) await fetchState(pid);
                setLastSync(
                    new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                    })
                );
            } finally {
                setRefreshing(false);
            }
        },
        [fetchState]
    );

    // ── Data input handlers (placeholders — wire to real logic) ─
    const handleFileUpload = useCallback((featureId: string, file: File) => {
        // TODO: call a server action to process the uploaded file
        console.log(`[Content Studio] Upload file for ${featureId}:`, file.name);
    }, []);

    const handleUseMemory = useCallback((featureId: string) => {
        // TODO: navigate to document picker
        console.log(`[Content Studio] Use Core Memory for ${featureId}`);
    }, []);

    const handleFetchApi = useCallback((featureId: string, apiName: string) => {
        // TODO: trigger API integration fetch
        console.log(`[Content Studio] Fetch API ${apiName} for ${featureId}`);
    }, []);

    const handleManualEntry = useCallback((featureId: string) => {
        // TODO: open inline form / navigate to editor
        console.log(`[Content Studio] Manual entry for ${featureId}`);
    }, []);

    const handleConnectService = useCallback((featureId: string) => {
        // TODO: open service connection flow
        console.log(`[Content Studio] Connect service for ${featureId}`);
    }, []);

    // Force a fresh Gemini-backed regenerate for the current vertical.
    const handleRegenerate = useCallback(async () => {
        const svOption = subVerticals.find(o => o.key === selectedSV);
        const verticalId = svOption?.verticalId;
        if (!verticalId) {
            setRegenError(
                'No vertical resolved for this sub-vertical — finish your business profile first.'
            );
            return;
        }
        setRegenerating(true);
        setRegenError(null);
        try {
            const res = await regenerateContentStudioConfigAction(verticalId);
            if (res.success && res.config) {
                setConfig(res.config);
                if (res.config.blocks.length === 0) {
                    setRegenError(
                        'AI returned no blocks for this vertical. Try again in a moment.'
                    );
                }
            } else {
                setRegenError(res.error || 'Regeneration failed — try again shortly.');
            }
        } catch (err: any) {
            setRegenError(err?.message || 'Unexpected error during regeneration.');
        } finally {
            setRegenerating(false);
        }
    }, [selectedSV, subVerticals]);

    // ── Main data loading effect ────────────────────────────────
    useEffect(() => {
        if (!partnerId) return;
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError(null);

            try {
                // Step 1 — sub-verticals
                const svRes = await getPartnerSubVerticalsAction(partnerId);
                if (cancelled) return;

                if (!svRes.success || !svRes.options || svRes.options.length === 0) {
                    setError(
                        svRes.error ||
                            'Your business profile is missing an industry. Complete onboarding and try again.'
                    );
                    setLoading(false);
                    return;
                }

                setSubVerticals(svRes.options);

                const targetKey =
                    (selectedSV && svRes.options.find(o => o.key === selectedSV)?.key) ||
                    svRes.defaultKey ||
                    svRes.options[0].key;

                // BUG 6 FIX — if we'd be changing selectedSV from inside the
                // effect for the first time, just set it and let the second
                // run handle the actual fetch. Avoids the double-fetch.
                if (targetKey !== selectedSV) {
                    setSelectedSV(targetKey);
                    if (initialLoadDone.current) {
                        return;
                    }
                }

                const svOption = svRes.options.find(o => o.key === targetKey);
                if (!svOption?.verticalId) {
                    setConfig(null);
                    setState(null);
                    setEnabledApis([]);
                    setLoading(false);
                    initialLoadDone.current = true;
                    return;
                }

                // Step 2 — config + state + integrations in parallel
                const [configRes, stateRes, apiRes] = await Promise.all([
                    getContentStudioConfigAction(svOption.verticalId),
                    getPartnerContentStudioStateAction(partnerId),
                    getEnabledApiIntegrationsForPartnerAction(partnerId),
                ]);
                if (cancelled) return;

                if (configRes.success && configRes.config) {
                    if (configRes.config.blocks?.length) {
                        setConfig(configRes.config);
                    } else {
                        // Stale empty config — try a one-shot regenerate.
                        const regenRes = await regenerateContentStudioConfigAction(
                            svOption.verticalId
                        );
                        if (cancelled) return;
                        setConfig(
                            regenRes.success && regenRes.config
                                ? regenRes.config
                                : configRes.config
                        );
                    }
                } else {
                    setError(configRes.error || 'Failed to load Content Studio config.');
                }

                if (stateRes.success && stateRes.state) {
                    setState(stateRes.state);
                }

                if (apiRes.success && apiRes.integrations) {
                    setEnabledApis(apiRes.integrations.map(i => i.name));
                }

                // Auto-refresh if state empty but config has blocks
                const stateEmpty =
                    !stateRes.state?.blockStates ||
                    Object.keys(stateRes.state.blockStates).length === 0;
                const hasBlocks = (configRes.config?.blocks?.length || 0) > 0;

                if (stateEmpty && hasBlocks && !cancelled) {
                    const refreshRes =
                        await refreshPartnerContentStudioStateAction(partnerId);
                    if (cancelled) return;
                    if (refreshRes.success) {
                        const fresh =
                            await getPartnerContentStudioStateAction(partnerId);
                        if (!cancelled && fresh.success && fresh.state) {
                            setState(fresh.state);
                        }
                    }
                }
            } catch (err: any) {
                if (!cancelled) setError(err?.message || 'Unexpected error');
            } finally {
                if (!cancelled) {
                    setLoading(false);
                    initialLoadDone.current = true;
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [partnerId, selectedSV]);

    // ── Derived data ────────────────────────────────────────────
    // Resolve the sub-vertical slug we should filter blocks by. The
    // `key` on SubVerticalOption is the partner's raw business-category
    // slug (e.g. `ecommerce_d2c`); that's the id that appears in each
    // block's `subVerticals` array inside the generated config.
    const selectedSVSlug =
        subVerticals.find(o => o.key === selectedSV)?.slug || selectedSV || null;

    // Only apply sub-vertical filtering if we can confirm the partner's
    // slug is one the config actually knows about — otherwise fall back
    // to showing all blocks so a mismatched slug never produces a blank
    // page for an otherwise-valid vertical.
    const configSubVerticalIds = new Set(
        (config?.subVerticals || []).map(sv => sv.id)
    );
    const shouldFilterBySV =
        !!selectedSVSlug && configSubVerticalIds.has(selectedSVSlug);

    const visibleBlocks = (config?.blocks || []).filter(b => {
        if (!shouldFilterBySV) return true;
        if (b.subVerticals === 'all') return true;
        if (!Array.isArray(b.subVerticals) || b.subVerticals.length === 0)
            return true;
        return b.subVerticals.includes(selectedSVSlug!);
    });

    const features = visibleBlocks.length
        ? mapAllFeatures(visibleBlocks, state ?? undefined)
        : [];

    const {
        independent,
        dependent,
        ready,
        notReady,
        readyCount,
        total,
        pct,
        isEmpty,
        isComplete,
    } = partitionFeatures(features);

    const verticalName =
        config?.verticalName || currentWorkspace?.partnerName || 'Your Business';

    const primaryFeature =
        features.find(f => f.id.includes('product') || f.id.includes('catalog')) ||
        features[0];

    // ── Loading state ───────────────────────────────────────────
    if (wsLoading || loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 256,
                    fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    <div
                        style={{
                            width: 28,
                            height: 28,
                            border: `3px solid ${theme.bdrL}`,
                            borderTopColor: ACCENT,
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                        }}
                    />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <span style={{ fontSize: 12, color: theme.t3 }}>
                        Loading Content Studio…
                    </span>
                </div>
            </div>
        );
    }

    if (!partnerId) {
        return (
            <div
                style={{
                    textAlign: 'center',
                    padding: '64px 20px',
                    color: theme.t3,
                    fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
            >
                No workspace selected.
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    maxWidth: 560,
                    margin: '0 auto',
                    padding: '32px 20px',
                    fontFamily:
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}
            >
                <div
                    style={{
                        padding: 16,
                        borderRadius: 10,
                        border: `1px solid ${theme.red}33`,
                        background: theme.redBg,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                    }}
                >
                    <Icon name="x" size={18} color={theme.red} />
                    <div>
                        <div style={{ fontWeight: 600, color: theme.red, fontSize: 14 }}>
                            Couldn&apos;t load Content Studio
                        </div>
                        <div style={{ fontSize: 12, color: theme.t3, marginTop: 4 }}>
                            {error}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Empty state — either the config is missing entirely, has zero
    // blocks, or the sub-vertical filter produced no matches. In every
    // case we let the partner trigger a fresh Gemini generation.
    const configHasNoBlocks = !config || config.blocks.length === 0;
    const filterProducedNoBlocks =
        !!config && config.blocks.length > 0 && visibleBlocks.length === 0;
    if (configHasNoBlocks || filterProducedNoBlocks) {
        const svLabel =
            subVerticals.find(o => o.key === selectedSV)?.label ||
            config?.verticalName ||
            'your vertical';
        const canRegen = !!subVerticals.find(o => o.key === selectedSV)?.verticalId;
        return (
            <>
                <SubVerticalBar
                    options={subVerticals}
                    selected={selectedSV}
                    onChange={setSelectedSV}
                />
                <div
                    style={{
                        maxWidth: 560,
                        margin: '0 auto',
                        padding: '40px 20px',
                        textAlign: 'center',
                        fontFamily:
                            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    }}
                >
                    <div
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 14,
                            background: theme.accentBg2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 14px',
                        }}
                    >
                        <Icon name={config?.iconName || 'box'} size={26} color={ACCENT} />
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: theme.t1 }}>
                        {svLabel}
                    </div>
                    <div
                        style={{
                            fontSize: 13,
                            color: theme.t3,
                            marginTop: 8,
                            maxWidth: 440,
                            margin: '8px auto 0',
                            lineHeight: 1.5,
                        }}
                    >
                        Content Studio for {svLabel} is empty. We tried to
                        regenerate it — click below to retry, or try again in a moment.
                    </div>
                    {regenError && (
                        <div
                            style={{
                                marginTop: 14,
                                padding: '10px 14px',
                                borderRadius: 8,
                                background: theme.redBg,
                                border: `1px solid ${theme.red}33`,
                                color: theme.red,
                                fontSize: 12,
                                maxWidth: 440,
                                margin: '14px auto 0',
                                textAlign: 'left',
                            }}
                        >
                            {regenError}
                        </div>
                    )}
                    <button
                        onClick={handleRegenerate}
                        disabled={regenerating || !canRegen}
                        style={{
                            marginTop: 20,
                            padding: '10px 18px',
                            borderRadius: 8,
                            border: `1px solid ${ACCENT}`,
                            background: regenerating ? theme.accentBg : ACCENT,
                            color: regenerating ? ACCENT : '#fff',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor:
                                regenerating || !canRegen ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            opacity: canRegen ? 1 : 0.6,
                        }}
                    >
                        <Icon
                            name="refresh"
                            size={13}
                            color={regenerating ? ACCENT : '#fff'}
                        />
                        {regenerating ? 'Regenerating with AI…' : 'Regenerate config'}
                    </button>
                    {!canRegen && (
                        <div
                            style={{
                                marginTop: 10,
                                fontSize: 11,
                                color: theme.t4,
                                maxWidth: 420,
                                margin: '10px auto 0',
                            }}
                        >
                            Finish your business profile (industry &amp; category) so we
                            can match a Content Studio template.
                        </div>
                    )}
                </div>
            </>
        );
    }

    const inputHandlers = {
        onFileUpload: handleFileUpload,
        onUseMemory: handleUseMemory,
        onFetchApi: handleFetchApi,
        onManualEntry: handleManualEntry,
        onConnectService: handleConnectService,
    };

    return (
        <div
            style={{
                fontFamily:
                    "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                color: theme.t1,
            }}
        >
            <h2 className="sr-only">Content Studio for {verticalName}</h2>

            <SubVerticalBar
                options={subVerticals}
                selected={selectedSV}
                onChange={setSelectedSV}
            />

            {/* Header bar */}
            <div
                style={{
                    padding: '10px 20px',
                    borderBottom: `1px solid ${theme.bdrL}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    flexWrap: 'wrap',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                        style={{
                            width: 28,
                            height: 28,
                            borderRadius: 7,
                            background: ACCENT,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon name="radio" size={13} color="#fff" />
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: ACCENT,
                                letterSpacing: 0.5,
                            }}
                        >
                            CONTENT STUDIO
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: theme.t1 }}>
                            {verticalName}{' '}
                            <span style={{ fontWeight: 400, color: theme.t4, fontSize: 11 }}>
                                {config.verticalId
                                    .replace(/_/g, ' ')
                                    .replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {lastSync && (
                        <span style={{ fontSize: 9, color: theme.t4 }}>
                            Synced {lastSync}
                        </span>
                    )}
                    <button
                        onClick={() => partnerId && handleRefresh(partnerId)}
                        disabled={refreshing}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: `1px solid ${theme.bdrL}`,
                            background: theme.surface,
                            cursor: refreshing ? 'wait' : 'pointer',
                            fontSize: 10,
                            fontWeight: 500,
                            color: theme.t3,
                            opacity: refreshing ? 0.5 : 1,
                        }}
                    >
                        <Icon name="refresh" size={11} color={theme.t4} />
                        {refreshing ? 'Scanning...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Main content area */}
            <div style={{ overflowY: 'auto', minHeight: 500, paddingBottom: 30 }}>
                {isEmpty ? (
                    /* ── Welcome / empty state ── */
                    <div style={{ maxWidth: 620, margin: '0 auto', padding: '0 20px' }}>
                        <div style={{ textAlign: 'center', padding: '28px 0 18px' }}>
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 11,
                                    background: theme.accentBg2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 10px',
                                }}
                            >
                                <Icon name="sparkle" size={20} color={ACCENT} />
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: theme.t1 }}>
                                Welcome to your AI storefront
                            </div>
                            <div
                                style={{
                                    fontSize: 13,
                                    color: theme.t3,
                                    marginTop: 5,
                                    lineHeight: 1.5,
                                    maxWidth: 420,
                                    margin: '5px auto 0',
                                }}
                            >
                                When customers message you, AI answers using your real
                                business data. Add your data below and the storefront goes
                                live.
                            </div>
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 230px',
                                gap: 20,
                                alignItems: 'start',
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: theme.t2,
                                        marginBottom: 8,
                                    }}
                                >
                                    Your customers will be able to:
                                </div>
                                {independent.map(f => (
                                    <div
                                        key={f.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 10,
                                            padding: '9px 12px',
                                            marginBottom: 3,
                                            borderRadius: 8,
                                            border: `1px solid ${theme.bdrL}`,
                                            background: theme.surface,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: 7,
                                                background: f.auto ? theme.greenBg : theme.bg,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Icon
                                                name={f.icon}
                                                size={13}
                                                color={f.auto ? theme.green : theme.t4}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    fontWeight: 500,
                                                    color: theme.t1,
                                                }}
                                            >
                                                {f.customer}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 10,
                                                    color: f.auto ? theme.green : theme.t4,
                                                    marginTop: 1,
                                                }}
                                            >
                                                {f.auto ? 'Works automatically' : f.you}
                                            </div>
                                        </div>
                                        {f.auto && (
                                            <Icon name="check" size={14} color={theme.green} />
                                        )}
                                    </div>
                                ))}

                                <DependentFeatures
                                    dependent={dependent}
                                    allFeatures={features}
                                />
                            </div>

                            <div style={{ position: 'sticky', top: 16 }}>
                                <PhonePreview
                                    features={features}
                                    verticalName={verticalName}
                                    verticalId={config.verticalId}
                                />
                                <div
                                    style={{
                                        textAlign: 'center',
                                        marginTop: 8,
                                        fontSize: 9,
                                        color: theme.t4,
                                    }}
                                >
                                    This updates as you add data
                                </div>
                            </div>
                        </div>

                        {primaryFeature && (
                            <div
                                style={{
                                    margin: '20px 0',
                                    padding: 16,
                                    borderRadius: 10,
                                    background: theme.accentBg,
                                    border: `1px solid ${theme.accentBg2}`,
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: ACCENT,
                                        marginBottom: 3,
                                    }}
                                >
                                    Start with your products
                                </div>
                                <div
                                    style={{
                                        fontSize: 11,
                                        color: theme.t2,
                                        lineHeight: 1.5,
                                        marginBottom: 12,
                                    }}
                                >
                                    Add your products first — everything else builds on top
                                    of them.
                                </div>
                                <DataInputPanel
                                    feature={primaryFeature}
                                    enabledApis={enabledApis}
                                    {...inputHandlers}
                                />
                            </div>
                        )}
                    </div>
                ) : isComplete ? (
                    /* ── Complete state ── */
                    <div style={{ maxWidth: 620, margin: '0 auto', padding: '0 20px' }}>
                        <div style={{ textAlign: 'center', padding: '28px 0 16px' }}>
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 99,
                                    background: theme.greenBg,
                                    border: `2px solid ${theme.greenBdr}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 10px',
                                }}
                            >
                                <Icon name="check" size={22} color={theme.green} />
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: theme.t1 }}>
                                Your storefront is fully live
                            </div>
                            <div style={{ fontSize: 13, color: theme.t3, marginTop: 3 }}>
                                Every customer question is answered with your real business
                                data.
                            </div>
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 230px',
                                gap: 20,
                                alignItems: 'start',
                            }}
                        >
                            <div>
                                <FeatureList
                                    notReady={[]}
                                    ready={ready}
                                    enabledApis={enabledApis}
                                    {...inputHandlers}
                                />
                                <DependentFeatures
                                    dependent={dependent}
                                    allFeatures={features}
                                />
                            </div>
                            <div style={{ position: 'sticky', top: 16 }}>
                                <PhonePreview
                                    features={features}
                                    verticalName={verticalName}
                                    verticalId={config.verticalId}
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ── Progress state ── */
                    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 20px' }}>
                        <div
                            style={{
                                padding: '16px 0 12px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                gap: 14,
                            }}
                        >
                            <div>
                                <div style={{ fontSize: 17, fontWeight: 700, color: theme.t1 }}>
                                    Your AI storefront
                                </div>
                                <div style={{ fontSize: 12, color: theme.t3, marginTop: 2 }}>
                                    {readyCount} of {total} features live. Complete{' '}
                                    {notReady.length} more to handle every customer question.
                                </div>
                            </div>
                            <ProgressRing pct={pct} />
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 230px',
                                gap: 20,
                                alignItems: 'start',
                            }}
                        >
                            <div>
                                <FeatureList
                                    notReady={notReady}
                                    ready={ready}
                                    enabledApis={enabledApis}
                                    {...inputHandlers}
                                />
                                <DependentFeatures
                                    dependent={dependent}
                                    allFeatures={features}
                                />
                            </div>

                            <div style={{ position: 'sticky', top: 16 }}>
                                <PhonePreview
                                    features={features}
                                    verticalName={verticalName}
                                    verticalId={config.verticalId}
                                />
                                {notReady.length > 0 && (
                                    <div
                                        style={{
                                            marginTop: 10,
                                            padding: '7px 9px',
                                            borderRadius: 7,
                                            background: theme.amberBg,
                                            border: `1px solid ${theme.amberBdr}`,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 9,
                                                fontWeight: 600,
                                                color: theme.amber,
                                                marginBottom: 2,
                                            }}
                                        >
                                            Not yet answered
                                        </div>
                                        <div
                                            style={{
                                                fontSize: 10,
                                                color: theme.t2,
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            Questions about{' '}
                                            {notReady
                                                .slice(0, 2)
                                                .map(f =>
                                                    f.customer
                                                        .toLowerCase()
                                                        .replace(
                                                            /^(browse |check |read |see |get |add to |track )/,
                                                            ''
                                                        )
                                                )
                                                .join(' and ')}{' '}
                                            get a generic answer.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
