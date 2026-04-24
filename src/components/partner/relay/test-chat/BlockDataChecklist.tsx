'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    CheckCircle2,
    AlertCircle,
    CircleDashed,
    ExternalLink,
    Loader2,
    Sparkles,
    Clock3,
    Wand2,
    PlusCircle,
    Eraser,
} from 'lucide-react';
import {
    getModuleSampleSummaryAction,
    type ModuleSampleSummary,
} from '@/actions/relay-test-chat-actions';
import {
    quickStartTaxonomyDataAction,
    seedSampleItemsAction,
    clearSampleItemsForModulesAction,
} from '@/actions/relay-sample-data-actions';
import type {
    DataSection,
    FunctionDataGuide,
} from '@/lib/relay/block-data-guide';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// ── Data you need to upload to get your blocks working ──────────────
//
// Drives the upload checklist that sits below the Test Chat phone. For
// each section in the taxonomy-specific guide we show:
//   - live status pill (Checking… → N items / Needs data / Not set up / Preview only)
//   - sample item chips (names of the 3 most-recently-updated items)
//   - last-updated relative time
//   - per-block status chips (ready vs still-needs-data)
//   - deep link CTA into /partner/relay/data/{slug}

interface Props {
    guide: FunctionDataGuide;
    partnerId: string;
    /** Used as `createdBy` on seeded sample items. */
    userId?: string;
    highlightSectionId?: string | null;
    onHighlightConsumed?: () => void;
}

export default function BlockDataChecklist({
    guide,
    partnerId,
    userId,
    highlightSectionId,
    onHighlightConsumed,
}: Props) {
    const [summaries, setSummaries] = useState<Record<string, ModuleSampleSummary>>({});
    const [loadingSlugs, setLoadingSlugs] = useState<Set<string>>(new Set());
    const [isSeedingAll, setIsSeedingAll] = useState(false);
    const [seedingSlug, setSeedingSlug] = useState<string | null>(null);
    const [isClearOpen, setIsClearOpen] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const uniqueSlugs = useMemo(() => {
        const set = new Set<string>();
        guide.sections.forEach((s) => {
            if (s.moduleSlug) set.add(s.moduleSlug);
        });
        return Array.from(set);
    }, [guide]);

    useEffect(() => {
        if (!partnerId || uniqueSlugs.length === 0) return;
        let cancelled = false;
        setLoadingSlugs(new Set(uniqueSlugs));
        // reloadToken is an explicit dep so this effect re-runs whenever
        // the partner triggers a seed action and we want fresh summaries.
        void reloadToken;
        (async () => {
            for (const slug of uniqueSlugs) {
                try {
                    const res = await getModuleSampleSummaryAction(partnerId, slug);
                    if (cancelled) return;
                    if (res.success && res.summary) {
                        setSummaries((prev) => ({ ...prev, [slug]: res.summary! }));
                    }
                } catch {
                    // leave as loading → falls through to "checking…" forever
                    // which is visually distinguishable, but skip noisy errors
                } finally {
                    if (!cancelled) {
                        setLoadingSlugs((prev) => {
                            const next = new Set(prev);
                            next.delete(slug);
                            return next;
                        });
                    }
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [partnerId, uniqueSlugs, reloadToken]);

    const handleSeedSection = async (section: DataSection) => {
        if (!section.moduleSlug || !userId) return;
        setSeedingSlug(section.moduleSlug);
        try {
            const res = await seedSampleItemsAction(partnerId, section.moduleSlug, userId);
            if (res.success) {
                toast.success(
                    res.created && res.created > 0
                        ? `Added ${res.created} sample items to ${section.name}`
                        : `${section.name} is ready`,
                );
                setReloadToken((t) => t + 1);
            } else {
                toast.error(res.error || `Could not load samples for ${section.name}`);
            }
        } catch (err: any) {
            toast.error(err?.message || 'Could not load samples');
        } finally {
            setSeedingSlug(null);
        }
    };

    const handleQuickStart = async () => {
        if (!userId) return;
        setIsSeedingAll(true);
        try {
            const res = await quickStartTaxonomyDataAction(partnerId, guide.functionId, userId);
            if (res.success) {
                const total = res.sectionsSeeded.reduce((acc, s) => acc + s.created, 0);
                toast.success(
                    total > 0
                        ? `Loaded sample data across ${res.sectionsSeeded.length} sections (${total} items)`
                        : 'All sections already have data',
                );
                setReloadToken((t) => t + 1);
            } else {
                toast.error(res.error || 'Could not load sample data');
            }
        } catch (err: any) {
            toast.error(err?.message || 'Could not load sample data');
        } finally {
            setIsSeedingAll(false);
        }
    };

    const handleClearSamples = async () => {
        if (uniqueSlugs.length === 0) {
            setIsClearOpen(false);
            return;
        }
        setIsClearing(true);
        try {
            const res = await clearSampleItemsForModulesAction(partnerId, uniqueSlugs);
            if (res.success) {
                const total = res.sectionsCleared.reduce((acc, s) => acc + s.deleted, 0);
                toast.success(
                    total > 0
                        ? `Cleared ${total} item${total === 1 ? '' : 's'} across ${res.sectionsCleared.length} module${res.sectionsCleared.length === 1 ? '' : 's'}`
                        : 'Modules are already empty',
                );
                setIsClearOpen(false);
                setReloadToken((t) => t + 1);
            } else {
                toast.error(res.error || 'Could not clear sample data');
            }
        } catch (err: any) {
            toast.error(err?.message || 'Could not clear sample data');
        } finally {
            setIsClearing(false);
        }
    };

    // Disable "Clear sample data" when every module-backed section is
    // already empty — nothing to clear, and the destructive dialog would
    // just confuse the partner.
    const hasAnyItems = uniqueSlugs.some((slug) => {
        const sum = summaries[slug];
        return sum && sum.enabled && sum.total > 0;
    });

    useEffect(() => {
        if (!highlightSectionId) return;
        const el = sectionRefs.current[highlightSectionId];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const timer = setTimeout(() => onHighlightConsumed?.(), 1800);
        return () => clearTimeout(timer);
    }, [highlightSectionId, onHighlightConsumed]);

    // Readiness roll-up across required sections.
    const requiredSections = guide.sections.filter((s) => s.status === 'required');
    const readyCount = requiredSections.filter((s) => {
        if (!s.moduleSlug) return false;
        const sum = summaries[s.moduleSlug];
        return sum && sum.enabled && sum.total > 0;
    }).length;

    return (
        <section className="rounded-xl border bg-card">
            <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
                <div>
                    <h2 className="text-base font-semibold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Data you need to upload to get your blocks working
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Each row below is a module in{' '}
                        <Link
                            href="/partner/relay/data"
                            className="underline underline-offset-2 hover:text-foreground"
                        >
                            /partner/relay/data
                        </Link>
                        . Add items there and every block that reads from the module picks them up in the chat.
                    </p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                    {requiredSections.length > 0 && (
                        <div
                            className={`rounded-full border px-3 py-1 text-xs font-medium ${
                                readyCount === requiredSections.length
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'bg-muted/50'
                            }`}
                        >
                            {readyCount} / {requiredSections.length} required ready
                        </div>
                    )}
                    {userId && (
                        <>
                            <button
                                type="button"
                                onClick={handleQuickStart}
                                disabled={isSeedingAll || isClearing}
                                className="inline-flex items-center gap-1.5 rounded-md border bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSeedingAll ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Wand2 className="h-3.5 w-3.5" />
                                )}
                                {isSeedingAll ? 'Loading samples…' : 'Start with sample data'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsClearOpen(true)}
                                disabled={isSeedingAll || isClearing || !hasAnyItems}
                                title={
                                    hasAnyItems
                                        ? 'Delete every item in the modules below'
                                        : 'Nothing to clear yet'
                                }
                                className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isClearing ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Eraser className="h-3.5 w-3.5" />
                                )}
                                {isClearing ? 'Clearing…' : 'Clear sample data'}
                            </button>
                        </>
                    )}
                </div>
            </header>

            <Dialog open={isClearOpen} onOpenChange={setIsClearOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <Eraser className="h-5 w-5" />
                            Clear sample data?
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="space-y-3 pt-2">
                                <p>
                                    This deletes <strong>every item</strong> in the modules that power this
                                    Test Chat — including anything you edited or added yourself.
                                </p>
                                <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs">
                                    <div className="font-semibold text-foreground mb-1">Modules affected</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {uniqueSlugs.map((slug) => (
                                            <span
                                                key={slug}
                                                className="inline-flex items-center rounded border bg-background px-1.5 py-0.5"
                                            >
                                                {slug}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Modules stay enabled so you can re-seed or add items manually right after.
                                </p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => setIsClearOpen(false)}
                            disabled={isClearing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleClearSamples}
                            disabled={isClearing}
                        >
                            {isClearing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Clearing…
                                </>
                            ) : (
                                'Yes, clear everything'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="divide-y">
                {guide.sections.map((section) => {
                    const summary = section.moduleSlug ? summaries[section.moduleSlug] : undefined;
                    const loading = section.moduleSlug
                        ? loadingSlugs.has(section.moduleSlug) && !summary
                        : false;
                    const highlighted = highlightSectionId === section.id;
                    return (
                        <div
                            key={section.id}
                            ref={(el) => {
                                sectionRefs.current[section.id] = el;
                            }}
                            className={[
                                'px-5 py-4 transition-colors',
                                highlighted ? 'bg-primary/5' : '',
                            ].join(' ')}
                        >
                            <div className="flex items-start gap-3">
                                <StatusGlyph section={section} summary={summary} loading={loading} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-sm font-semibold">{section.name}</h3>
                                        <StatusPill section={section} summary={summary} loading={loading} />
                                        {summary?.lastUpdatedAt && (
                                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                                <Clock3 className="h-3 w-3" />
                                                Updated {relativeTime(summary.lastUpdatedAt)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                        {section.description}
                                    </p>
                                    {section.howTo && (
                                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                            <span className="font-medium text-foreground/80">How: </span>
                                            {section.howTo}
                                        </p>
                                    )}

                                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                                        {section.blocks.map((b) => (
                                            <BlockChip
                                                key={b.id}
                                                label={b.label}
                                                status={chipStatus(section, summary, loading)}
                                            />
                                        ))}
                                    </div>

                                    {summary && summary.sampleNames.length > 0 && (
                                        <div className="mt-3 rounded-lg border bg-muted/30 px-3 py-2">
                                            <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                Sample items
                                            </div>
                                            <div className="mt-1 flex flex-wrap gap-1.5">
                                                {summary.sampleNames.map((n) => (
                                                    <span
                                                        key={n}
                                                        className="inline-flex items-center rounded-md border bg-background px-2 py-0.5 text-[11px]"
                                                    >
                                                        {n}
                                                    </span>
                                                ))}
                                                {summary.total > summary.sampleNames.length && (
                                                    <span className="inline-flex items-center px-2 py-0.5 text-[11px] text-muted-foreground">
                                                        +{summary.total - summary.sampleNames.length} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {section.status !== 'design_only' && summary && !summary.enabled && (
                                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                            The <span className="font-semibold">{section.moduleSlug}</span> module
                                            isn't set up yet. Open the editor to enable it and start adding items.
                                        </div>
                                    )}
                                    {section.status === 'required' && summary?.enabled && summary.total === 0 && (
                                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                            The module exists but has zero items. Add your first entries so these
                                            blocks show real content in the chat.
                                        </div>
                                    )}

                                    {(section.route || canSeedSection(section, summary)) && (
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            {section.route && (
                                                <Link
                                                    href={section.route}
                                                    className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                                                >
                                                    {section.ctaLabel || 'Open editor'}
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            )}
                                            {canSeedSection(section, summary) && userId && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSeedSection(section)}
                                                    disabled={seedingSlug === section.moduleSlug}
                                                    className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-60"
                                                >
                                                    {seedingSlug === section.moduleSlug ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <PlusCircle className="h-3 w-3" />
                                                    )}
                                                    {seedingSlug === section.moduleSlug
                                                        ? 'Loading…'
                                                        : 'Load sample data'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function StatusGlyph({
    section,
    summary,
    loading,
}: {
    section: DataSection;
    summary?: ModuleSampleSummary;
    loading: boolean;
}) {
    const cn = 'h-5 w-5 shrink-0 mt-0.5';
    if (section.status === 'design_only') {
        return <CircleDashed className={`${cn} text-muted-foreground`} />;
    }
    if (loading) {
        return <Loader2 className={`${cn} animate-spin text-muted-foreground`} />;
    }
    if (summary?.enabled && summary.total > 0) {
        return <CheckCircle2 className={`${cn} text-emerald-600`} />;
    }
    if (section.status === 'required') {
        return <AlertCircle className={`${cn} text-amber-600`} />;
    }
    return <CircleDashed className={`${cn} text-muted-foreground`} />;
}

function StatusPill({
    section,
    summary,
    loading,
}: {
    section: DataSection;
    summary?: ModuleSampleSummary;
    loading: boolean;
}) {
    const base =
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide';
    if (section.status === 'design_only') {
        return <span className={`${base} border bg-muted/50 text-muted-foreground`}>Preview only</span>;
    }
    if (loading) {
        return <span className={`${base} border bg-muted/50 text-muted-foreground`}>Checking…</span>;
    }
    if (summary?.enabled && summary.total > 0) {
        return (
            <span className={`${base} border border-emerald-200 bg-emerald-50 text-emerald-700`}>
                {summary.total} item{summary.total === 1 ? '' : 's'}
            </span>
        );
    }
    if (summary && !summary.enabled) {
        return <span className={`${base} border border-amber-200 bg-amber-50 text-amber-700`}>Not set up</span>;
    }
    if (summary && summary.enabled && summary.total === 0) {
        if (section.status === 'required') {
            return (
                <span className={`${base} border border-amber-200 bg-amber-50 text-amber-700`}>
                    Needs data
                </span>
            );
        }
        return <span className={`${base} border bg-muted/50 text-muted-foreground`}>Optional</span>;
    }
    return <span className={`${base} border bg-muted/50 text-muted-foreground`}>Unknown</span>;
}

function BlockChip({
    label,
    status,
}: {
    label: string;
    status: 'ready' | 'pending' | 'design' | 'unknown';
}) {
    const tone =
        status === 'ready'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : status === 'pending'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border bg-muted/40 text-muted-foreground';
    const dot =
        status === 'ready' ? 'bg-emerald-500' : status === 'pending' ? 'bg-amber-500' : 'bg-muted-foreground/40';
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${tone}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {label}
        </span>
    );
}

// Sections that are module-backed and currently empty get an inline
// "Load sample data" CTA. Design-only sections (no moduleSlug) and
// already-populated sections are skipped.
function canSeedSection(
    section: DataSection,
    summary: ModuleSampleSummary | undefined,
): boolean {
    if (!section.moduleSlug) return false;
    if (section.status === 'design_only') return false;
    if (summary?.enabled && summary.total > 0) return false;
    return true;
}

function chipStatus(
    section: DataSection,
    summary: ModuleSampleSummary | undefined,
    loading: boolean,
): 'ready' | 'pending' | 'design' | 'unknown' {
    if (section.status === 'design_only') return 'design';
    if (loading) return 'unknown';
    if (summary?.enabled && summary.total > 0) return 'ready';
    if (section.status === 'required') return 'pending';
    return 'unknown';
}

// Naive relative-time formatter — good enough for "Updated 3h ago".
// Accepts ISO strings stored on ModuleItem.updatedAt / createdAt.
function relativeTime(iso: string): string {
    const d = Date.parse(iso);
    if (Number.isNaN(d)) return '';
    const diffMs = Date.now() - d;
    const minute = 60_000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diffMs < minute) return 'just now';
    if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
    if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
    if (diffMs < 30 * day) return `${Math.floor(diffMs / day)}d ago`;
    return new Date(d).toLocaleDateString();
}
