'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Eye, EyeOff, ExternalLink, Settings2 } from 'lucide-react';
import type { BusinessPersona } from '@/lib/business-persona-types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CoreVisibilityPanelProps {
    partnerId: string;
    persona: BusinessPersona;
    className?: string;
}

const SECTION_LABELS: Record<string, string> = {
    identity: 'Business Identity',
    personality: 'Brand & Voice',
    knowledge: 'Products & Services',
    customerProfile: 'Customer Profile',
    webIntelligence: 'Web Data',
    industrySpecificData: 'Industry Data',
    otherUsefulData: 'Other Data',
};

export function CoreVisibilityPanel({ partnerId, persona, className }: CoreVisibilityPanelProps) {
    const sections = persona?.coreVisibility?.sections || {};
    const enabledSections = Object.entries(sections).filter(([_, v]) => v !== false);
    const disabledSections = Object.entries(sections).filter(([_, v]) => v === false);

    const hasData = !!(
        persona?.identity?.name ||
        persona?.personality?.tagline ||
        persona?.knowledge?.productsOrServices?.length
    );

    return (
        <Card className={cn("border-2 border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30", className)}>
            <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <BrainCircuit className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <div className="font-medium text-indigo-900 flex items-center gap-2">
                            What "Core" Can Access
                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 h-5 px-1.5 ml-2">
                                {hasData ? (
                                    <>
                                        {enabledSections.length} sections visible
                                        {disabledSections.length > 0 && (
                                            <span className="opacity-60 ml-1"> · {disabledSections.length} hidden</span>
                                        )}
                                    </>
                                ) : (
                                    'Add business data to enable AI features'
                                )}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/partner/settings/core-data">
                        <Button variant="outline" size="sm" className="h-8 gap-2 bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                            <Settings2 className="w-3.5 h-3.5" />
                            Manage Access
                        </Button>
                    </Link>
                </div>
            </CardContent>

            {hasData && (
                <div className="px-4 pb-3 flex flex-wrap gap-2">
                    {enabledSections.map(([key]) => (
                        <div key={key} className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded border border-indigo-100/50">
                            <Eye className="w-3 h-3 opacity-70" />
                            {SECTION_LABELS[key] || key}
                        </div>
                    ))}
                    {disabledSections.map(([key]) => (
                        <div key={key} className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                            <EyeOff className="w-3 h-3 opacity-70" />
                            {SECTION_LABELS[key] || key}
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
