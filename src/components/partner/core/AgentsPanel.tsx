"use client";

import React from 'react';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import {
    AgentRole,
    EssentialAgent,
} from '@/lib/partnerhub-types';
import { cn } from '@/lib/utils';
import {
    Bot,
    Play,
    FileText,
    TrendingUp,
    Megaphone,
    HeadphonesIcon,
    Power,
    Trash2,
    Settings2,
    ChevronRight,
    CheckCircle,
    Circle,
} from 'lucide-react';
import { BASE_AGENT_TEMPLATES } from '@/lib/business-type-agents';

// ============================================================================
// TYPES & PROPS
// ============================================================================

interface AgentsPanelProps {
    agents: EssentialAgent[];
    onTestAgent: (agent: EssentialAgent) => void;
    onConfigureAgent: (agent: EssentialAgent) => void;
    onToggleActive: (agent: EssentialAgent, isActive: boolean) => void;
    onDeleteAgent?: (agent: EssentialAgent) => void;
    isCustomSection?: boolean;
}

// ============================================================================
// VISUAL CONFIGURATION - Professional subdued palette
// ============================================================================

export const AGENT_VISUALS = {
    [AgentRole.CUSTOMER_CARE]: {
        icon: HeadphonesIcon,
        accentColor: 'text-slate-700',
        accentBg: 'bg-slate-100',
        iconBg: 'bg-slate-800',
        label: 'Support',
    },
    [AgentRole.SALES_ASSISTANT]: {
        icon: TrendingUp,
        accentColor: 'text-slate-700',
        accentBg: 'bg-slate-100',
        iconBg: 'bg-slate-800',
        label: 'Sales',
    },
    [AgentRole.MARKETING_COMMS]: {
        icon: Megaphone,
        accentColor: 'text-slate-700',
        accentBg: 'bg-slate-100',
        iconBg: 'bg-slate-800',
        label: 'Marketing',
    },
    [AgentRole.CUSTOM]: {
        icon: Bot,
        accentColor: 'text-slate-700',
        accentBg: 'bg-slate-100',
        iconBg: 'bg-slate-700',
        label: 'Custom',
    },
};

// ============================================================================
// AGENT CARD COMPONENT
// ============================================================================

interface AgentCardProps {
    agent: EssentialAgent;
    visuals: typeof AGENT_VISUALS[AgentRole.CUSTOMER_CARE];
    docCount: number;
    onConfigure: () => void;
    onTest: () => void;
    onToggleActive: (isActive: boolean) => void;
    onDelete?: () => void;
    isCustom?: boolean;
}

export function AgentCard({
    agent,
    visuals,
    docCount,
    onConfigure,
    onTest,
    onToggleActive,
    onDelete,
    isCustom,
}: AgentCardProps) {
    const Icon = visuals.icon;

    return (
        <div
            className={cn(
                "bg-white rounded-lg border transition-all duration-200",
                agent.isActive
                    ? "border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300"
                    : "border-slate-200 opacity-60"
            )}
        >
            <div className="p-5">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={cn(
                        "w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0",
                        agent.isActive ? visuals.iconBg : "bg-slate-400"
                    )}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-base font-semibold text-slate-900">{agent.name}</h3>
                                    {(isCustom || agent.isCustomAgent) && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium uppercase tracking-wide">
                                            Custom
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{agent.description}</p>
                            </div>

                            {/* Status Toggle */}
                            <button
                                onClick={() => onToggleActive(!agent.isActive)}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors",
                                    agent.isActive
                                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                )}
                            >
                                {agent.isActive ? (
                                    <>
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Active
                                    </>
                                ) : (
                                    <>
                                        <Circle className="w-3.5 h-3.5" />
                                        Inactive
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Use Cases - only for standard agents */}
                        {!isCustom && !agent.isCustomAgent && agent.role !== AgentRole.CUSTOM && (
                            <div className="mt-4">
                                <div className="flex flex-wrap gap-1.5">
                                    {(BASE_AGENT_TEMPLATES[agent.role]?.useCases || []).slice(0, 3).map((useCase: string, i: number) => (
                                        <span
                                            key={i}
                                            className="text-xs px-2 py-1 rounded bg-slate-50 text-slate-600 border border-slate-100"
                                        >
                                            {useCase}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        {agent.useAllDocuments ? 'All docs' : `${docCount} docs`}
                    </span>
                    <span className="capitalize">
                        {agent.tones.slice(0, 2).join(', ')}
                    </span>
                    {agent.escalationSettings?.onHumanRequest && (
                        <span className="flex items-center gap-1">
                            <HeadphonesIcon className="w-3.5 h-3.5" />
                            Escalation
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={onTest}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                    >
                        <Play className="w-3.5 h-3.5" />
                        Test
                    </button>
                    <button
                        onClick={onConfigure}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-900 rounded transition-colors"
                    >
                        <Settings2 className="w-3.5 h-3.5" />
                        Configure
                    </button>
                    {(isCustom || agent.isCustomAgent) && onDelete && (
                        <button
                            onClick={onDelete}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete agent"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AgentsPanel({
    agents,
    onTestAgent,
    onConfigureAgent,
    onToggleActive,
    onDeleteAgent,
    isCustomSection = false
}: AgentsPanelProps) {
    const { documents } = usePartnerHub();

    const getDocumentCount = (agent: EssentialAgent) => {
        if (agent.useAllDocuments) return documents.length;
        return agent.attachedDocumentIds.length;
    };

    if (agents.length === 0) {
        return (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50">
                <Bot className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No agents in this section</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {agents.map((agent) => (
                <AgentCard
                    key={agent.id}
                    agent={agent}
                    visuals={AGENT_VISUALS[agent.role] || AGENT_VISUALS[AgentRole.CUSTOM]}
                    docCount={getDocumentCount(agent)}
                    onConfigure={() => onConfigureAgent(agent)}
                    onTest={() => onTestAgent(agent)}
                    onToggleActive={(isActive) => onToggleActive(agent, isActive)}
                    onDelete={onDeleteAgent ? () => onDeleteAgent(agent) : undefined}
                    isCustom={isCustomSection || agent.isCustomAgent || agent.role === AgentRole.CUSTOM}
                />
            ))}
        </div>
    );
}
