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
    MessageCircle,
    FileText,
    TrendingUp,
    Megaphone,
    HeadphonesIcon,
    ToggleLeft,
    ToggleRight,
    Trash2,
    Sliders
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
// VISUAL CONFIGURATION
// ============================================================================

export const AGENT_VISUALS = {
    [AgentRole.CUSTOMER_CARE]: {
        icon: HeadphonesIcon,
        color: 'blue',
        gradient: 'from-blue-500 to-blue-600',
        bgLight: 'bg-blue-50',
        bgDark: 'bg-blue-500',
        text: 'text-blue-600',
        border: 'border-blue-200',
        ring: 'ring-blue-500/20',
    },
    [AgentRole.SALES_ASSISTANT]: {
        icon: TrendingUp,
        color: 'amber',
        gradient: 'from-amber-500 to-orange-500',
        bgLight: 'bg-amber-50',
        bgDark: 'bg-amber-500',
        text: 'text-amber-600',
        border: 'border-amber-200',
        ring: 'ring-amber-500/20',
    },
    [AgentRole.MARKETING_COMMS]: {
        icon: Megaphone,
        color: 'purple',
        gradient: 'from-purple-500 to-pink-500',
        bgLight: 'bg-purple-50',
        bgDark: 'bg-purple-500',
        text: 'text-purple-600',
        border: 'border-purple-200',
        ring: 'ring-purple-500/20',
    },
    [AgentRole.CUSTOM]: {
        icon: Bot,
        color: 'slate',
        gradient: 'from-indigo-500 to-violet-500',
        bgLight: 'bg-indigo-50',
        bgDark: 'bg-indigo-500',
        text: 'text-indigo-600',
        border: 'border-indigo-200',
        ring: 'ring-indigo-500/20',
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
                "bg-white rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg",
                agent.isActive ? visuals.border : "border-slate-200 opacity-75"
            )}
        >
            <div className="p-5">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br",
                        agent.isActive ? visuals.gradient : "from-slate-400 to-slate-500"
                    )}>
                        <Icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold text-slate-900">{agent.name}</h3>
                                    {(isCustom || agent.isCustomAgent) && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                                            Custom
                                        </span>
                                    )}
                                    {/* Active Toggle */}
                                    <button
                                        onClick={() => onToggleActive(!agent.isActive)}
                                        className={cn(
                                            "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
                                            agent.isActive
                                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        )}
                                    >
                                        {agent.isActive ? (
                                            <>
                                                <ToggleRight className="w-3.5 h-3.5" />
                                                Active
                                            </>
                                        ) : (
                                            <>
                                                <ToggleLeft className="w-3.5 h-3.5" />
                                                Inactive
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p className="text-slate-500 mt-1">{agent.description}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={onTest}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <Play className="w-4 h-4" />
                                    Test
                                </button>
                                <button
                                    onClick={onConfigure}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                                        `bg-gradient-to-r ${visuals.gradient} text-white hover:shadow-md`
                                    )}
                                >
                                    <Sliders className="w-4 h-4" />
                                    Configure
                                </button>
                                {(isCustom || agent.isCustomAgent) && onDelete && (
                                    <button
                                        onClick={onDelete}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete agent"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Best For & Use Cases - only for standard agents */}
                        {!isCustom && !agent.isCustomAgent && agent.role !== AgentRole.CUSTOM && (
                            <div className="mt-4 grid sm:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                        Best for
                                    </h4>
                                    <p className={cn("text-sm font-medium", visuals.text)}>
                                        {BASE_AGENT_TEMPLATES[agent.role]?.bestFor || 'General customer interactions'}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                        Handles
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(BASE_AGENT_TEMPLATES[agent.role]?.useCases || []).slice(0, 3).map((useCase: string, i: number) => (
                                            <span
                                                key={i}
                                                className={cn(
                                                    "text-xs px-2 py-0.5 rounded-full",
                                                    visuals.bgLight, visuals.text
                                                )}
                                            >
                                                {useCase}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Indicators for specific features */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            {agent.role === AgentRole.SALES_ASSISTANT && agent.leadSettings && (
                                <span className="text-xs px-2 py-1 rounded-full bg-amber-200/50 text-amber-700">
                                    Lead qualification {agent.leadSettings.askNeed ? 'on' : 'off'}
                                </span>
                            )}
                            {agent.role === AgentRole.MARKETING_COMMS && agent.campaignSettings && (
                                <span className="text-xs px-2 py-1 rounded-full bg-purple-200/50 text-purple-700">
                                    Campaigns {agent.campaignSettings.enableBirthday ? 'enabled' : 'disabled'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className={cn("px-5 py-3 border-t flex items-center justify-between", visuals.bgLight)}>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-slate-400" />
                        {agent.useAllDocuments ? 'All' : docCount} documents
                    </span>
                    <span className="flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-slate-400" />
                        {agent.tones.slice(0, 2).join(', ')} tone
                    </span>
                    {agent.escalationSettings.onHumanRequest && (
                        <span className="flex items-center gap-1.5">
                            <HeadphonesIcon className="w-4 h-4 text-slate-400" />
                            Escalation enabled
                        </span>
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
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <Bot className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No agents available in this section.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
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