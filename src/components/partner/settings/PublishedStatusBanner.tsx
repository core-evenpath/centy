'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
    CheckCircle2,
    Brain,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Eye,
    AlertTriangle,
    Loader2,
    Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getCoreAccessibleDataAction } from '@/actions/business-persona-actions';
import type { BusinessPersona } from '@/lib/business-persona-types';

interface PublishedStatusBannerProps {
    partnerId: string;
    persona: BusinessPersona;
    className?: string;
}

export function PublishedStatusBanner({ partnerId, persona, className }: PublishedStatusBannerProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const sections = persona?.coreVisibility?.sections || {};
    const enabledCount = Object.values(sections).filter(Boolean).length || 7;
    const totalCount = 7;

    const hasBasicData = !!(
        persona?.identity?.name ||
        persona?.personality?.tagline ||
        persona?.knowledge?.faqs?.length
    );

    const profileScore = (() => {
        let score = 0;
        if (persona?.identity?.name) score += 15;
        if (persona?.identity?.phone || persona?.identity?.email) score += 10;
        if (persona?.identity?.address?.city) score += 10;
        if (persona?.personality?.tagline) score += 15;
        if (persona?.personality?.description) score += 20;
        if (persona?.knowledge?.faqs?.length) score += 20;
        if (persona?.customerProfile?.targetAudience) score += 10;
        return Math.min(score, 100);
    })();

    const fetchSummary = async () => {
        if (!partnerId || summary) return;
        setLoading(true);
        try {
            const result = await getCoreAccessibleDataAction(partnerId);
            if (result.success && result.data?.summary) {
                setSummary(result.data.summary);
            }
        } catch (err) {
            console.error('Error fetching summary:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isExpanded && !summary) {
            fetchSummary();
        }
    }, [isExpanded]);

    if (!hasBasicData) {
        return (
            <div className={cn(
                "bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5",
                className
            )}>
                <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-amber-100 rounded-xl">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-amber-900 mb-1">Complete Your Profile</h3>
                        <p className="text-sm text-amber-700 mb-3">
                            Add your business information so Core can help answer customer questions accurately.
                        </p>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-amber-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                    style={{ width: `${profileScore}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium text-amber-700">{profileScore}%</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl overflow-hidden transition-all",
            className
        )}>
            <button
                className="w-full p-5 text-left hover:bg-green-100/30 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-green-100 rounded-xl">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-green-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Profile Live & Active
                                <Badge className="bg-green-600 text-white text-xs ml-1">
                                    {enabledCount}/{totalCount} sections
                                </Badge>
                            </h3>
                            <p className="text-sm text-green-700 mt-0.5">
                                Your AI assistant is using this data to help customers
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/partner/settings/core-data"
                            onClick={e => e.stopPropagation()}
                            className="hidden sm:flex"
                        >
                            <Button variant="outline" size="sm" className="gap-1.5 bg-white border-green-200 text-green-700 hover:bg-green-50">
                                <Eye className="w-3.5 h-3.5" />
                                View Details
                            </Button>
                        </Link>
                        {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-green-600" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-green-600" />
                        )}
                    </div>
                </div>
            </button>

            {isExpanded && (
                <div className="px-5 pb-5 border-t border-green-200">
                    <div className="mt-4 p-4 bg-white rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Brain className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                AI Context Preview
                            </span>
                        </div>
                        {loading ? (
                            <div className="flex items-center gap-2 text-slate-400 py-4">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading preview...
                            </div>
                        ) : summary ? (
                            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono bg-slate-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                                {summary}
                            </pre>
                        ) : (
                            <p className="text-sm text-slate-400 italic py-2">No data available</p>
                        )}
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                        <p className="text-xs text-green-600">
                            Changes are published automatically
                        </p>
                        <Link href="/partner/settings/core-data">
                            <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
                                <Brain className="w-4 h-4" />
                                See Full Data
                                <ExternalLink className="w-3 h-3" />
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
