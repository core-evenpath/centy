'use client';

/**
 * Partner: Content Studio
 *
 * A single page at /partner/relay/datamap that shows partners every block
 * their AI storefront can render, what data each needs, and exactly how
 * to provide it. Pulls:
 *  - Generated config from `contentStudioConfigs/{verticalId}` (created
 *    lazily via Gemini on first visit)
 *  - Partner's per-block data-provision state
 *  - Platform-enabled API integrations applicable to this partner's vertical
 */

import React from 'react';
import {
    Loader2,
    Map,
    ChevronDown,
    ChevronRight,
    AlertTriangle,
    Check,
    Upload,
    Database,
    Plug,
    PenLine,
    Package,
    ShoppingBag,
    ShoppingCart,
    CreditCard,
    Calendar,
    Tag,
    Sparkles,
    Search,
    Zap,
    Heart,
    BarChart,
    Headphones,
    BookOpen,
    FileText,
    Users,
    Truck,
    Star,
    Award,
    Shield,
    Clock,
    Gift,
    Repeat,
    ClipboardList,
    Radio,
    Eye,
    MapPin,
    Home,
    Utensils,
    Bed,
    Image as ImageIcon,
    HelpCircle,
    MessageSquare,
    RotateCcw,
    RefreshCw,
    type LucideIcon,
} from 'lucide-react';

import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type {
    ContentStudioConfig,
    ContentStudioBlockEntry,
    PartnerContentStudioState,
} from '@/lib/types-content-studio';
import { DATA_SOURCE_OPTIONS } from '@/lib/types-content-studio';
import {
    getContentStudioConfigAction,
    getPartnerContentStudioStateAction,
    getEnabledApiIntegrationsForPartnerAction,
    getPartnerVerticalIdAction,
} from '@/actions/content-studio-actions';
import { refreshPartnerContentStudioStateAction } from '@/actions/content-studio-refresh-actions';

// ── Icon resolution ──────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
    ShoppingBag,
    ShoppingCart,
    CreditCard,
    Calendar,
    Plug,
    Tag,
    Sparkles,
    Search,
    Zap,
    Heart,
    BarChart,
    Headphones,
    BookOpen,
    FileText,
    Users,
    Truck,
    Star,
    Award,
    Shield,
    Clock,
    Gift,
    Repeat,
    ClipboardList,
    Radio,
    Eye,
    MapPin,
    Home,
    Utensils,
    Bed,
    Image: ImageIcon,
    HelpCircle,
    MessageSquare,
    RotateCcw,
    Upload,
    Database,
    PenLine,
    Package,
    Map,
};

function iconFor(name: string): LucideIcon {
    return ICON_MAP[name] || Package;
}

// ── Page ─────────────────────────────────────────────────────────────

type EnabledIntegration = {
    id: string;
    name: string;
    category: string;
    iconName: string;
};

export default function ContentStudioPage() {
    const { currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const partnerId = currentWorkspace?.partnerId;

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [verticalId, setVerticalId] = React.useState<string | null>(null);
    const [config, setConfig] = React.useState<ContentStudioConfig | null>(null);
    const [partnerState, setPartnerState] = React.useState<PartnerContentStudioState | null>(null);
    const [enabledIntegrations, setEnabledIntegrations] = React.useState<EnabledIntegration[]>([]);
    const [activeSubVertical, setActiveSubVertical] = React.useState<string | null>(null);
    const [expandedBlockId, setExpandedBlockId] = React.useState<string | null>(null);
    const [refreshing, setRefreshing] = React.useState(false);

    const reloadPartnerState = React.useCallback(async (pid: string) => {
        const stateRes = await getPartnerContentStudioStateAction(pid);
        if (stateRes.success && stateRes.state) setPartnerState(stateRes.state);
    }, []);

    const runRefresh = React.useCallback(
        async (pid: string) => {
            setRefreshing(true);
            try {
                const res = await refreshPartnerContentStudioStateAction(pid);
                if (res.success) {
                    await reloadPartnerState(pid);
                }
            } finally {
                setRefreshing(false);
            }
        },
        [reloadPartnerState]
    );

    React.useEffect(() => {
        if (!partnerId) return;
        let cancelled = false;

        (async () => {
            setLoading(true);
            setError(null);

            try {
                const vRes = await getPartnerVerticalIdAction(partnerId);
                if (cancelled) return;
                if (!vRes.success || !vRes.verticalId) {
                    setError(vRes.error || 'Could not resolve your business vertical.');
                    setLoading(false);
                    return;
                }
                const vid = vRes.verticalId;
                setVerticalId(vid);

                const [cfgRes, stateRes, apiRes] = await Promise.all([
                    getContentStudioConfigAction(vid),
                    getPartnerContentStudioStateAction(partnerId),
                    getEnabledApiIntegrationsForPartnerAction(partnerId),
                ]);
                if (cancelled) return;

                if (!cfgRes.success || !cfgRes.config) {
                    setError(cfgRes.error || 'Failed to load Content Studio config.');
                } else {
                    setConfig(cfgRes.config);
                    if (cfgRes.config.subVerticals.length > 0) {
                        setActiveSubVertical(cfgRes.config.subVerticals[0].id);
                    }
                }
                if (stateRes.success && stateRes.state) setPartnerState(stateRes.state);
                if (apiRes.success && apiRes.integrations) setEnabledIntegrations(apiRes.integrations);

                // First visit: if the state doc is empty but the config has
                // blocks, auto-refresh from existing partner data so partners
                // who set up before Content Studio launched don't see 0%.
                const stateIsEmpty =
                    !stateRes.state ||
                    !stateRes.state.blockStates ||
                    Object.keys(stateRes.state.blockStates).length === 0;
                const configHasBlocks = cfgRes.success && (cfgRes.config?.blocks.length || 0) > 0;
                if (stateIsEmpty && configHasBlocks && !cancelled) {
                    // Fire and forget from inside the loader; the reload is
                    // awaited so the page renders the refreshed state.
                    const refreshRes = await refreshPartnerContentStudioStateAction(partnerId);
                    if (cancelled) return;
                    if (refreshRes.success) {
                        const freshState = await getPartnerContentStudioStateAction(partnerId);
                        if (cancelled) return;
                        if (freshState.success && freshState.state) {
                            setPartnerState(freshState.state);
                        }
                    }
                }
            } catch (e: any) {
                if (!cancelled) setError(e?.message || 'Unexpected error');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [partnerId]);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!partnerId) {
        return (
            <div className="container mx-auto py-16 text-center">
                <p className="text-muted-foreground">No workspace selected.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-8 max-w-3xl">
                <Card className="border-destructive">
                    <CardContent className="pt-6 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                        <div>
                            <div className="font-semibold text-destructive">
                                Couldn&apos;t load Content Studio
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{error}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!config) {
        return null;
    }

    // Empty state for stub verticals (no preview config yet).
    if (config.blocks.length === 0) {
        const Icon = iconFor(config.iconName);
        return (
            <div className="container mx-auto py-12 px-6 max-w-3xl">
                <div className="text-center">
                    <div
                        className="inline-flex h-14 w-14 items-center justify-center rounded-full mb-4"
                        style={{ backgroundColor: `${config.accentColor}22`, color: config.accentColor }}
                    >
                        <Icon className="h-7 w-7" />
                    </div>
                    <h1 className="text-2xl font-bold">{config.verticalName}</h1>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                        Content Studio isn&apos;t available for your vertical yet. We&apos;re rolling
                        it out vertical by vertical — check back soon.
                    </p>
                </div>
            </div>
        );
    }

    // Readiness: count non-auto blocks with dataProvided.
    const visibleBlocks = filterBlocks(config.blocks, activeSubVertical);
    const nonAutoBlocks = visibleBlocks.filter(b => !b.autoConfigured);
    const providedCount = nonAutoBlocks.filter(
        b => partnerState?.blockStates?.[b.blockId]?.dataProvided
    ).length;
    const readinessPct = nonAutoBlocks.length > 0
        ? Math.round((providedCount / nonAutoBlocks.length) * 100)
        : 100;

    // Group blocks by family, ordered by lowest-priority-in-family first so
    // "Entry" style blocks (priority 1-2) float to the top.
    const byFamily = groupByFamily(visibleBlocks);

    const HeaderIcon = iconFor(config.iconName);

    return (
        <div className="container mx-auto py-8 px-6 max-w-3xl">
            {/* Header */}
            <div className="mb-8">
                <div
                    className="text-xs font-semibold tracking-widest uppercase mb-2"
                    style={{ color: config.accentColor }}
                >
                    Content Studio
                </div>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div
                            className="flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center"
                            style={{
                                backgroundColor: `${config.accentColor}1A`,
                                color: config.accentColor,
                            }}
                        >
                            <HeaderIcon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold">{config.verticalName}</h1>
                            <p className="text-sm text-muted-foreground">
                                {config.blocks.length} blocks ready — bring them to life with your data.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => partnerId && runRefresh(partnerId)}
                            disabled={refreshing}
                            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Re-scan your modules and profile to update block readiness"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing…' : 'Refresh status'}
                        </button>
                        <ReadinessRing
                            pct={readinessPct}
                            color={config.accentColor}
                            provided={providedCount}
                            total={nonAutoBlocks.length}
                        />
                    </div>
                </div>
            </div>

            {/* Sub-vertical filter */}
            {config.subVerticals.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-3 mb-6 -mx-6 px-6 scrollbar-thin">
                    {config.subVerticals.map(sv => {
                        const active = sv.id === activeSubVertical;
                        return (
                            <button
                                key={sv.id}
                                onClick={() => setActiveSubVertical(sv.id)}
                                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                    active
                                        ? 'text-white border-transparent'
                                        : 'bg-muted/50 border-border text-foreground/70 hover:bg-muted'
                                }`}
                                style={active ? { backgroundColor: config.accentColor } : undefined}
                            >
                                {sv.name}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => setActiveSubVertical(null)}
                        className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                            activeSubVertical === null
                                ? 'bg-foreground text-background border-transparent'
                                : 'bg-muted/50 border-border text-foreground/70 hover:bg-muted'
                        }`}
                    >
                        Show all
                    </button>
                </div>
            )}

            {/* Families */}
            <div className="space-y-8">
                {byFamily.map(({ familyId, blocks }) => {
                    const fam = config.families[familyId];
                    const label = fam?.label || familyId;
                    const color = fam?.color || '#6b7280';

                    return (
                        <section key={familyId}>
                            <div className="flex items-center gap-2 mb-3">
                                <span
                                    className="inline-block h-3 w-1 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                                <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
                                    {label}
                                </h2>
                                <span className="text-xs text-muted-foreground">
                                    {blocks.length} block{blocks.length === 1 ? '' : 's'}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {blocks.map(block => (
                                    <BlockCard
                                        key={block.blockId}
                                        block={block}
                                        partnerState={partnerState?.blockStates?.[block.blockId] || null}
                                        enabledIntegrations={enabledIntegrations}
                                        expanded={expandedBlockId === block.blockId}
                                        onToggle={() =>
                                            setExpandedBlockId(prev =>
                                                prev === block.blockId ? null : block.blockId
                                            )
                                        }
                                    />
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>
        </div>
    );
}

// ── Subcomponents ────────────────────────────────────────────────────

function ReadinessRing({
    pct,
    color,
    provided,
    total,
}: {
    pct: number;
    color: string;
    provided: number;
    total: number;
}) {
    // Simple text-based indicator; a full SVG ring can be dropped in later.
    return (
        <div className="flex-shrink-0 text-right">
            <div
                className="text-2xl font-bold leading-none"
                style={{ color }}
            >
                {pct}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
                {provided} of {total} ready
            </div>
        </div>
    );
}

function BlockCard({
    block,
    partnerState,
    enabledIntegrations,
    expanded,
    onToggle,
}: {
    block: ContentStudioBlockEntry;
    partnerState: PartnerContentStudioState['blockStates'][string] | null;
    enabledIntegrations: EnabledIntegration[];
    expanded: boolean;
    onToggle: () => void;
}) {
    const Icon = iconFor(block.icon);
    const Chevron = expanded ? ChevronDown : ChevronRight;
    const provided = partnerState?.dataProvided === true;

    return (
        <Card className="overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full text-left flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors"
                aria-expanded={expanded}
            >
                <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="h-4 w-4 text-foreground/70" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{block.label}</span>
                        <StatusPill status={block.status} />
                        {block.autoConfigured && (
                            <Badge variant="outline" className="text-[10px] h-5">
                                Auto
                            </Badge>
                        )}
                        {block.moduleDependent && (
                            <Badge variant="outline" className="text-[10px] h-5">
                                Module
                            </Badge>
                        )}
                        {provided && (
                            <Badge
                                variant="outline"
                                className="text-[10px] h-5 border-emerald-500/40 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30"
                            >
                                <Check className="h-3 w-3 mr-1" />
                                Ready
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {block.customerLabel}
                    </p>
                </div>
                <Chevron className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </button>

            {expanded && (
                <CardContent className="pt-0 pb-4 space-y-4 border-t">
                    {/* Partner action */}
                    <div className="pt-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                            What you need to do
                        </div>
                        <p className="text-sm">{block.partnerAction}</p>
                    </div>

                    {/* Miss reason */}
                    {block.missReason && (
                        <div className="rounded-md border border-amber-300/60 bg-amber-50/80 dark:bg-amber-950/20 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
                            <span className="font-medium">Why it matters: </span>
                            {block.missReason}
                        </div>
                    )}

                    {/* Data contract */}
                    {(block.dataContract.required.length > 0 ||
                        block.dataContract.optional.length > 0) && (
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                Data this block uses
                            </div>
                            <div className="rounded-md border divide-y">
                                {block.dataContract.required.map(f => (
                                    <FieldRow key={`r-${f.field}`} field={f} required />
                                ))}
                                {block.dataContract.optional.map(f => (
                                    <FieldRow key={`o-${f.field}`} field={f} required={false} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Data provided banner */}
                    {provided && partnerState && (
                        <div className="rounded-md border border-emerald-300/60 bg-emerald-50/80 dark:bg-emerald-950/20 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-200">
                            <div className="flex items-center gap-2">
                                <Check className="h-4 w-4" />
                                <span className="font-medium">Data provided</span>
                            </div>
                            <div className="text-xs mt-1 opacity-80">
                                Source: {partnerState.sourceType || 'unknown'}
                                {partnerState.itemCount
                                    ? ` • ${partnerState.itemCount} items`
                                    : ''}
                            </div>
                        </div>
                    )}

                    {/* How to provide data */}
                    {!block.autoConfigured && (
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                How to provide this data
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {DATA_SOURCE_OPTIONS.filter(opt => {
                                    // Hide the API option when no platform integration is enabled
                                    // for this partner's vertical.
                                    if (opt.id === 'api') return enabledIntegrations.length > 0;
                                    return true;
                                }).map(opt => {
                                    const OptIcon = iconFor(opt.icon);
                                    return (
                                        <div
                                            key={opt.id}
                                            className="rounded-md border px-3 py-2 hover:bg-muted/40 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <OptIcon className="h-4 w-4 text-muted-foreground" />
                                                {opt.label}
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {opt.description}
                                            </p>
                                            {opt.id === 'api' && enabledIntegrations.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {enabledIntegrations.map(ig => (
                                                        <Badge
                                                            key={ig.id}
                                                            variant="secondary"
                                                            className="text-[10px]"
                                                        >
                                                            {ig.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                            {opt.id === 'upload' &&
                                                block.templateColumns &&
                                                block.templateColumns.length > 0 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        className="mt-2 h-7 text-[11px]"
                                                        onClick={() =>
                                                            downloadCsvTemplate(
                                                                block.label,
                                                                block.templateColumns!
                                                            )
                                                        }
                                                    >
                                                        Download template
                                                    </Button>
                                                )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

function FieldRow({
    field,
    required,
}: {
    field: { field: string; type: string; label: string };
    required: boolean;
}) {
    return (
        <div className="flex items-center gap-3 px-3 py-2 text-sm">
            <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                    required ? 'bg-red-500' : 'bg-muted-foreground/40'
                }`}
                aria-hidden
            />
            <span className="font-medium">{field.label}</span>
            <span className="text-xs text-muted-foreground ml-auto">{field.type}</span>
        </div>
    );
}

function StatusPill({ status }: { status: ContentStudioBlockEntry['status'] }) {
    const map: Record<ContentStudioBlockEntry['status'], string> = {
        active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
        new: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
        planned: 'bg-muted text-muted-foreground',
        disabled: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
    };
    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${map[status]}`}>
            {status}
        </span>
    );
}

// ── Helpers ──────────────────────────────────────────────────────────

function filterBlocks(
    blocks: ContentStudioBlockEntry[],
    activeSubVertical: string | null
): ContentStudioBlockEntry[] {
    if (!activeSubVertical) return blocks;
    return blocks.filter(b => {
        if (b.subVerticals === 'all') return true;
        return b.subVerticals.includes(activeSubVertical);
    });
}

function groupByFamily(
    blocks: ContentStudioBlockEntry[]
): Array<{ familyId: string; blocks: ContentStudioBlockEntry[] }> {
    const map = new Map<string, ContentStudioBlockEntry[]>();
    for (const b of blocks) {
        if (!map.has(b.family)) map.set(b.family, []);
        map.get(b.family)!.push(b);
    }
    const groups = Array.from(map.entries()).map(([familyId, bs]) => ({
        familyId,
        blocks: bs.slice().sort((a, b) => a.priority - b.priority),
    }));
    // Order families by the minimum priority found in each family.
    groups.sort((a, b) => {
        const pa = Math.min(...a.blocks.map(x => x.priority));
        const pb = Math.min(...b.blocks.map(x => x.priority));
        return pa - pb;
    });
    return groups;
}

function downloadCsvTemplate(blockLabel: string, columns: string[]): void {
    const header = columns.map(c => `"${c.replace(/"/g, '""')}"`).join(',');
    const csv = header + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const slug = blockLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    a.href = url;
    a.download = `${slug || 'template'}-template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
