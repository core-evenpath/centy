'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
    CheckCircle2,
    AlertCircle,
    CircleDashed,
    ExternalLink,
    Loader2,
    Sparkles,
} from 'lucide-react';
import {
    getPartnerModuleAction,
    getModuleItemsAction,
} from '@/actions/modules-actions';
import type {
    DataSection,
    FunctionDataGuide,
} from '@/lib/relay/block-data-guide';

// ── Data you need to upload to get your blocks working ──────────────
//
// Reads the taxonomy-specific guide and renders one card per data
// section. Each card shows: which blocks consume the data, current
// upload status (item count for module-backed sections), a short how-to
// hint, and a deep-link CTA that takes the partner straight to the
// editor. Sections tagged `design_only` are listed as preview-only so
// the partner knows they don't need to touch data for them yet.

interface Props {
    guide: FunctionDataGuide;
    partnerId: string;
    highlightSectionId?: string | null;
    onHighlightConsumed?: () => void;
}

interface ModuleStatus {
    state: 'loading' | 'not_enabled' | 'empty' | 'populated' | 'error';
    itemCount?: number;
}

export default function BlockDataChecklist({
    guide,
    partnerId,
    highlightSectionId,
    onHighlightConsumed,
}: Props) {
    // Map of moduleSlug → status. One entry per unique slug referenced
    // by the guide; sections that share a slug share a status row.
    const [moduleStatus, setModuleStatus] = useState<Record<string, ModuleStatus>>({});
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
        setModuleStatus((prev) => {
            const next = { ...prev };
            uniqueSlugs.forEach((slug) => {
                if (!next[slug]) next[slug] = { state: 'loading' };
            });
            return next;
        });

        (async () => {
            for (const slug of uniqueSlugs) {
                try {
                    const pm = await getPartnerModuleAction(partnerId, slug);
                    if (cancelled) return;
                    if (!pm.success || !pm.data) {
                        setModuleStatus((prev) => ({
                            ...prev,
                            [slug]: { state: 'not_enabled' },
                        }));
                        continue;
                    }
                    const items = await getModuleItemsAction(partnerId, pm.data.partnerModule.id, {
                        pageSize: 1,
                    });
                    if (cancelled) return;
                    const total = items.success && items.data ? items.data.total : 0;
                    setModuleStatus((prev) => ({
                        ...prev,
                        [slug]: {
                            state: total > 0 ? 'populated' : 'empty',
                            itemCount: total,
                        },
                    }));
                } catch {
                    if (cancelled) return;
                    setModuleStatus((prev) => ({ ...prev, [slug]: { state: 'error' } }));
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [partnerId, uniqueSlugs]);

    // Scroll to highlighted section when one is requested.
    useEffect(() => {
        if (!highlightSectionId) return;
        const el = sectionRefs.current[highlightSectionId];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        const timer = setTimeout(() => onHighlightConsumed?.(), 1800);
        return () => clearTimeout(timer);
    }, [highlightSectionId, onHighlightConsumed]);

    const requiredCount = guide.sections.filter((s) => s.status === 'required').length;
    const readyCount = guide.sections.filter((s) => {
        if (s.status !== 'required' || !s.moduleSlug) return false;
        return moduleStatus[s.moduleSlug]?.state === 'populated';
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
                        These are the datasets your {guide.functionName} assistant needs. Upload them once and
                        every block picks them up automatically.
                    </p>
                </div>
                {requiredCount > 0 && (
                    <div className="shrink-0 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium">
                        {readyCount} / {requiredCount} required ready
                    </div>
                )}
            </header>

            <div className="divide-y">
                {guide.sections.map((section) => {
                    const status = section.moduleSlug
                        ? moduleStatus[section.moduleSlug]
                        : undefined;
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
                                <StatusGlyph section={section} status={status} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-sm font-semibold">{section.name}</h3>
                                        <StatusPill section={section} status={status} />
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
                                            <span
                                                key={b.id}
                                                className="inline-flex items-center rounded-full border bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                                            >
                                                {b.label}
                                            </span>
                                        ))}
                                    </div>

                                    {section.route && (
                                        <div className="mt-3">
                                            <Link
                                                href={section.route}
                                                className="inline-flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                                            >
                                                {section.ctaLabel || 'Open editor'}
                                                <ExternalLink className="h-3 w-3" />
                                            </Link>
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
    status,
}: {
    section: DataSection;
    status?: ModuleStatus;
}) {
    const cn = 'h-5 w-5 shrink-0 mt-0.5';
    if (section.status === 'design_only') {
        return <CircleDashed className={`${cn} text-muted-foreground`} />;
    }
    if (!status || status.state === 'loading') {
        return <Loader2 className={`${cn} animate-spin text-muted-foreground`} />;
    }
    if (status.state === 'populated') {
        return <CheckCircle2 className={`${cn} text-emerald-600`} />;
    }
    if (section.status === 'required') {
        return <AlertCircle className={`${cn} text-amber-600`} />;
    }
    return <CircleDashed className={`${cn} text-muted-foreground`} />;
}

function StatusPill({
    section,
    status,
}: {
    section: DataSection;
    status?: ModuleStatus;
}) {
    const base =
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide';
    if (section.status === 'design_only') {
        return <span className={`${base} border bg-muted/50 text-muted-foreground`}>Preview only</span>;
    }
    if (!status || status.state === 'loading') {
        return <span className={`${base} border bg-muted/50 text-muted-foreground`}>Checking…</span>;
    }
    if (status.state === 'populated') {
        return (
            <span className={`${base} border border-emerald-200 bg-emerald-50 text-emerald-700`}>
                {status.itemCount ?? 0} items
            </span>
        );
    }
    if (status.state === 'empty') {
        if (section.status === 'required') {
            return (
                <span className={`${base} border border-amber-200 bg-amber-50 text-amber-700`}>
                    Needs data
                </span>
            );
        }
        return <span className={`${base} border bg-muted/50 text-muted-foreground`}>Optional</span>;
    }
    if (status.state === 'not_enabled') {
        return <span className={`${base} border border-amber-200 bg-amber-50 text-amber-700`}>Not set up</span>;
    }
    return <span className={`${base} border bg-muted/50 text-muted-foreground`}>Unknown</span>;
}
