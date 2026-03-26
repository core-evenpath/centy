'use client';

import React from 'react';

const STAGE_EMOJI: Record<string, string> = {
    greeting: '👋',
    discovery: '🔍',
    showcase: '🏪',
    comparison: '⚖️',
    social_proof: '⭐',
    conversion: '🎯',
    objection: '❓',
    handoff: '🤝',
    followup: '📋',
};

const STAGE_COLORS: Record<string, string> = {
    greeting: 'bg-blue-50 text-blue-700 border-blue-200',
    discovery: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    showcase: 'bg-purple-50 text-purple-700 border-purple-200',
    comparison: 'bg-amber-50 text-amber-700 border-amber-200',
    social_proof: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    conversion: 'bg-green-50 text-green-700 border-green-200',
    objection: 'bg-orange-50 text-orange-700 border-orange-200',
    handoff: 'bg-rose-50 text-rose-700 border-rose-200',
    followup: 'bg-gray-50 text-gray-700 border-gray-200',
};

interface FlowVisualizationProps {
    stages: Array<{ type: string; label: string }>;
    compact?: boolean;
}

export default function FlowVisualization({ stages, compact = false }: FlowVisualizationProps) {
    if (stages.length === 0) return null;

    if (compact) {
        return (
            <div className="flex items-center gap-1 text-sm flex-wrap">
                {stages.map((stage, i) => (
                    <React.Fragment key={i}>
                        <span title={stage.label}>
                            {STAGE_EMOJI[stage.type] || '❓'}
                        </span>
                        {i < stages.length - 1 && (
                            <span className="text-muted-foreground text-xs">→</span>
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {stages.map((stage, i) => (
                <React.Fragment key={i}>
                    <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${STAGE_COLORS[stage.type] || STAGE_COLORS.followup}`}
                    >
                        <span>{STAGE_EMOJI[stage.type] || '❓'}</span>
                        <span>{stage.label}</span>
                    </div>
                    {i < stages.length - 1 && (
                        <span className="text-muted-foreground text-sm">→</span>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}
