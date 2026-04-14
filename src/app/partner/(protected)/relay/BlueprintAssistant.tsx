'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Sparkles,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    PlusCircle,
    Link as LinkIcon,
    UserCog,
    ChevronDown,
    ChevronUp,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    proposeBlueprintAction,
    applyBlueprintAction,
    type BlueprintAction,
    type BlueprintPlan,
} from '@/actions/relay-data-bindings-actions';

// ── Blueprint Assistant ──────────────────────────────────────────────
//
// Top-of-page banner on /partner/relay/blocks. Shows a readiness score
// derived from the partner's active blocks and their bindings, and
// offers a Gemini-backed plan to close any gaps.
//
// Three visible states:
//   1. Collapsed banner with ready / unready counts (default).
//   2. Expanded plan with per-action approve/skip (after clicking
//      "Ask Pingbox for a plan").
//   3. Post-apply summary (what ran, what needs partner follow-up).

interface Props {
    partnerId: string;
    activeBlockIds: string[];
    // Called after a plan is applied so the parent can refresh bindings
    // / diagnostics / previews.
    onApplied: () => void;
}

type ViewState =
    | { phase: 'idle' }
    | { phase: 'loading' }
    | { phase: 'plan'; plan: BlueprintPlan; selected: Set<number> }
    | { phase: 'applying' }
    | { phase: 'applied'; results: Array<{ kind: string; detail: string; ok: boolean; error?: string }> }
    | { phase: 'error'; message: string };

export default function BlueprintAssistant({ partnerId, activeBlockIds, onApplied }: Props) {
    const [view, setView] = useState<ViewState>({ phase: 'idle' });
    const [cachedPlan, setCachedPlan] = useState<BlueprintPlan | null>(null);

    // Auto-load readiness (without Gemini) once on mount so the banner
    // shows numbers immediately. We do this by calling propose — it
    // short-circuits to an empty plan when everything's resolved, and
    // we only show Gemini summary if there's real gap analysis.
    useEffect(() => {
        if (activeBlockIds.length === 0) return;
        let cancelled = false;
        proposeBlueprintAction(partnerId, activeBlockIds).then(res => {
            if (cancelled) return;
            if (res.success && res.plan) setCachedPlan(res.plan);
        });
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [partnerId, activeBlockIds.join('|')]);

    const readiness = cachedPlan?.readiness;
    const pct = readiness && readiness.totalBlocks > 0
        ? Math.round((readiness.readyBlocks / readiness.totalBlocks) * 100)
        : null;

    const requestPlan = async () => {
        setView({ phase: 'loading' });
        const res = await proposeBlueprintAction(partnerId, activeBlockIds);
        if (!res.success || !res.plan) {
            setView({ phase: 'error', message: res.error || 'Could not generate a plan.' });
            return;
        }
        setCachedPlan(res.plan);
        const allIdx = new Set<number>(res.plan.actions.map((_, i) => i));
        setView({ phase: 'plan', plan: res.plan, selected: allIdx });
    };

    const toggleAction = (idx: number) => {
        if (view.phase !== 'plan') return;
        const next = new Set(view.selected);
        if (next.has(idx)) next.delete(idx); else next.add(idx);
        setView({ ...view, selected: next });
    };

    const applySelected = async () => {
        if (view.phase !== 'plan') return;
        const toRun = view.plan.actions.filter((_, i) => view.selected.has(i));
        if (toRun.length === 0) return;
        setView({ phase: 'applying' });
        const res = await applyBlueprintAction(partnerId, toRun);
        if (!res.success) {
            setView({ phase: 'error', message: res.error || 'Could not apply plan.' });
            return;
        }
        setView({ phase: 'applied', results: res.executed || [] });
        onApplied();
    };

    const dismiss = () => setView({ phase: 'idle' });

    // ── Render ──────────────────────────────────────────────────────

    // Empty state: no active blocks.
    if (activeBlockIds.length === 0) {
        return null;
    }

    return (
        <div className="rounded-lg border bg-gradient-to-r from-primary/5 to-transparent">
            {/* Banner row */}
            <div className="flex items-start justify-between gap-3 p-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">Data-flow readiness</p>
                            {pct !== null && <ReadinessPill pct={pct} />}
                        </div>
                        {readiness ? (
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {readiness.readyBlocks} of {readiness.totalBlocks} active block
                                {readiness.totalBlocks === 1 ? '' : 's'} are wired to real data.
                                {readiness.unmetCanonicalIds.length > 0 && (
                                    <> <span className="text-amber-700">
                                        {readiness.unmetCanonicalIds.length} field
                                        {readiness.unmetCanonicalIds.length === 1 ? '' : 's'} still need a source.
                                    </span></>
                                )}
                            </p>
                        ) : (
                            <p className="text-xs text-muted-foreground mt-0.5">
                                <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                                Checking which blocks have data…
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {view.phase === 'idle' && readiness && readiness.unmetCanonicalIds.length > 0 && (
                        <Button size="sm" onClick={requestPlan}>
                            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                            Ask Pingbox for a plan
                        </Button>
                    )}
                    {view.phase === 'idle' && readiness && readiness.unmetCanonicalIds.length === 0 && (
                        <span className="text-xs font-medium text-emerald-700 inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            All set
                        </span>
                    )}
                </div>
            </div>

            {/* Plan / applying / applied sections */}
            {view.phase === 'loading' && (
                <div className="border-t px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating a plan…
                </div>
            )}

            {view.phase === 'plan' && (
                <div className="border-t">
                    <div className="px-4 py-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">Proposed plan</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{view.plan.summary}</p>
                        </div>
                        <button onClick={dismiss} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Dismiss">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <ul className="px-4 pb-3 space-y-2">
                        {view.plan.actions.map((a, i) => (
                            <ActionRow
                                key={i}
                                action={a}
                                selected={view.selected.has(i)}
                                onToggle={() => toggleAction(i)}
                            />
                        ))}
                        {view.plan.actions.length === 0 && (
                            <li className="text-xs text-muted-foreground">Nothing to do — every block resolves.</li>
                        )}
                    </ul>
                    {view.plan.actions.length > 0 && (
                        <div className="border-t px-4 py-3 flex items-center justify-between gap-2">
                            <p className="text-xs text-muted-foreground">
                                {view.selected.size} of {view.plan.actions.length} selected
                            </p>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" onClick={dismiss}>Cancel</Button>
                                <Button size="sm" onClick={applySelected} disabled={view.selected.size === 0}>
                                    Apply selected
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {view.phase === 'applying' && (
                <div className="border-t px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Applying plan…
                </div>
            )}

            {view.phase === 'applied' && (
                <div className="border-t">
                    <div className="px-4 py-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">Plan applied</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {view.results.filter(r => r.ok).length} of {view.results.length} action
                                {view.results.length === 1 ? '' : 's'} completed.
                            </p>
                        </div>
                        <button onClick={dismiss} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Close">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <ul className="px-4 pb-3 space-y-1.5">
                        {view.results.map((r, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                                {r.ok
                                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    : <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />}
                                <span className="min-w-0 flex-1">
                                    <span className="text-foreground">{r.detail}</span>
                                    {!r.ok && r.error && (
                                        <span className="text-muted-foreground"> · {r.error}</span>
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {view.phase === 'error' && (
                <div className="border-t px-4 py-3 flex items-start justify-between gap-3 bg-destructive/5">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-destructive font-medium">Something went wrong</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{view.message}</p>
                    </div>
                    <button onClick={dismiss} className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Dismiss">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Sub-components ──────────────────────────────────────────────────

function ReadinessPill({ pct }: { pct: number }) {
    const color = pct >= 80 ? 'bg-emerald-50 text-emerald-700'
        : pct >= 40 ? 'bg-amber-50 text-amber-700'
        : 'bg-rose-50 text-rose-700';
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${color}`}>
            {pct}% ready
        </span>
    );
}

function ActionRow({
    action,
    selected,
    onToggle,
}: {
    action: BlueprintAction;
    selected: boolean;
    onToggle: () => void;
}) {
    const { Icon, title, detail } = describe(action);
    return (
        <li
            className={`rounded-md border px-3 py-2 flex items-start gap-3 cursor-pointer transition-colors ${
                selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/40'
            }`}
            onClick={onToggle}
        >
            <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggle()}
                onClick={(e) => e.stopPropagation()}
                className="mt-0.5 accent-primary"
            />
            <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">{title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{detail}</p>
                {action.kind === 'fill_profile' && (
                    <Link
                        href="/partner/settings"
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1"
                        onClick={(e) => e.stopPropagation()}
                    >
                        Open Business Profile →
                    </Link>
                )}
            </div>
        </li>
    );
}

function describe(action: BlueprintAction): { Icon: typeof PlusCircle; title: string; detail: string } {
    switch (action.kind) {
        case 'create_module':
            return {
                Icon: PlusCircle,
                title: `Create "${action.name}" module`,
                detail: action.reason,
            };
        case 'bind':
            return {
                Icon: LinkIcon,
                title: `Connect ${action.canonicalId}`,
                detail: action.reason,
            };
        case 'fill_profile':
            return {
                Icon: UserCog,
                title: `Add ${action.hint} to Business Profile`,
                detail: action.reason,
            };
    }
}
