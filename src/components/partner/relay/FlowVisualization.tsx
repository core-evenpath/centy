'use client';

import type { FlowStage, FlowTransition, FlowStageType } from '@/lib/types-flow-engine';
import { STAGE_TYPE_LABELS, STAGE_TYPE_COLORS } from './FlowStageCard';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

interface FlowVisualizationProps {
    stages: FlowStage[];
    transitions: FlowTransition[];
    currentStageId?: string;
}

export default function FlowVisualization({ stages, transitions, currentStageId }: FlowVisualizationProps) {
    if (stages.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground text-sm">
                No stages defined yet. Add stages to visualize the flow.
            </div>
        );
    }

    // Build adjacency: for each stage, find outgoing transitions
    const outgoing = new Map<string, Array<{ toId: string; condition: string }>>();
    transitions.forEach(t => {
        const list = outgoing.get(t.fromStageId) || [];
        list.push({ toId: t.toStageId, condition: t.condition });
        outgoing.set(t.fromStageId, list);
    });

    // Sort: entry stages first, then by index
    const sorted = [...stages].sort((a, b) => {
        if (a.isEntry && !b.isEntry) return -1;
        if (!a.isEntry && b.isEntry) return 1;
        return 0;
    });

    return (
        <div className="space-y-1">
            <div className="flex items-center flex-wrap gap-2">
                {sorted.map((stage, i) => {
                    const isActive = stage.id === currentStageId;
                    const stageTransitions = outgoing.get(stage.id) || [];

                    return (
                        <div key={stage.id} className="flex items-center gap-2">
                            <div
                                className={`
                                    flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 transition-all min-w-[80px]
                                    ${isActive ? 'border-primary shadow-md' : 'border-muted'}
                                `}
                            >
                                <Badge className={`text-[10px] ${STAGE_TYPE_COLORS[stage.type]}`}>
                                    {STAGE_TYPE_LABELS[stage.type]}
                                </Badge>
                                <span className="text-xs font-medium text-center leading-tight">
                                    {stage.label}
                                </span>
                                {stage.leadScoreImpact > 0 && (
                                    <span className="text-[10px] text-muted-foreground">
                                        +{stage.leadScoreImpact} pts
                                    </span>
                                )}
                            </div>
                            {i < sorted.length - 1 && (
                                <div className="flex flex-col items-center">
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    {stageTransitions.length > 0 && (
                                        <span className="text-[9px] text-muted-foreground max-w-[60px] text-center leading-tight">
                                            {stageTransitions.map(t => t.condition).join(', ')}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Transition summary */}
            {transitions.length > 0 && (
                <div className="mt-4 pt-3 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Transitions ({transitions.length})</p>
                    <div className="flex flex-wrap gap-1">
                        {transitions.map((t, i) => {
                            const from = stages.find(s => s.id === t.fromStageId);
                            const to = stages.find(s => s.id === t.toStageId);
                            if (!from || !to) return null;
                            return (
                                <Badge key={i} variant="outline" className="text-[10px] font-normal">
                                    {from.label} → {to.label} ({t.condition})
                                </Badge>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
