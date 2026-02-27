"use client";

import React, { useState } from 'react';
import type { BroadcastIdea } from '@/lib/types';
import { replaceVariablesInPreview, variableMapToMappings } from '@/lib/template-variable-engine';

interface AIIdeaCardProps {
    idea: BroadcastIdea;
    onSelect: () => void;
}

const sourceIcon = (source: string) => {
    switch (source) {
        case 'contact': return '🟢';
        case 'business': return '🔵';
        case 'static': return '🟠';
        case 'module': return '🟣';
        default: return '⚪';
    }
};

const sourceLabel = (source: string) => {
    switch (source) {
        case 'contact': return 'Auto from contact';
        case 'business': return 'From business profile';
        case 'static': return 'You fill in';
        case 'module': return 'From inventory';
        default: return 'Unknown';
    }
};

const campaignTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
        promotion: '#ea580c',
        seasonal: '#0d9488',
        retention: '#7c3aed',
        transactional: '#2563eb',
        'lead-gen': '#ca8a04',
        announcement: '#dc2626',
        daily: '#64748b',
    };
    return colors[type] || '#64748b';
};

export function AIIdeaCard({ idea, onSelect }: AIIdeaCardProps) {
    const [expanded, setExpanded] = useState(false);

    let previewText = idea.message;
    if (idea.variableMap.length > 0) {
        const mappings = variableMapToMappings(idea.variableMap);
        previewText = replaceVariablesInPreview(idea.message, mappings);
    }

    return (
        <div
            className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
                expanded
                    ? 'border-indigo-300 shadow-md ring-1 ring-indigo-100'
                    : 'border-gray-200 hover:border-indigo-200 hover:shadow-sm'
            }`}
            style={{
                backgroundImage: 'linear-gradient(135deg, rgba(99,102,241,0.02) 0%, rgba(139,92,246,0.02) 100%)',
            }}
        >
            <div
                className="p-4 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-indigo-500">&#10024;</span>
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{idea.title}</h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-2.5">{idea.description}</p>
                        <div className="flex flex-wrap items-center gap-2">
                            {idea.signal && (
                                <span
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold"
                                    style={{
                                        background: `${idea.signal.color}15`,
                                        color: idea.signal.color,
                                    }}
                                >
                                    {idea.signal.label}
                                </span>
                            )}
                            {idea.sourceItems && idea.sourceItems.length > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-violet-50 text-violet-600 rounded-full text-[11px] font-medium">
                                    🟣 {idea.sourceItems.length} item{idea.sourceItems.length > 1 ? 's' : ''} referenced
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                            style={{
                                background: `${campaignTypeColor(idea.campaignType)}12`,
                                color: campaignTypeColor(idea.campaignType),
                            }}
                        >
                            {idea.campaignType}
                        </span>
                        <span className={`text-gray-400 text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>
                            &#9660;
                        </span>
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-gray-100 px-4 pb-4">
                    {/* Message preview */}
                    <div className="mt-3 mb-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Message Preview</div>
                        <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {previewText}
                        </div>
                    </div>

                    {/* Variable map */}
                    {idea.variableMap.length > 0 && (
                        <div className="mb-3">
                            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Variables</div>
                            <div className="flex flex-wrap gap-2">
                                {idea.variableMap.map(v => (
                                    <div key={v.token} className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs">
                                        <span>{sourceIcon(v.source)}</span>
                                        <span className="font-mono text-[10px] text-indigo-600 font-bold">{v.token}</span>
                                        <span className="text-gray-500">{v.label}</span>
                                        <span className="text-[10px] text-gray-400">&middot; {sourceLabel(v.source)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Source items */}
                    {idea.sourceItems && idea.sourceItems.length > 0 && (
                        <div className="mb-3">
                            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Referenced Items</div>
                            <div className="flex flex-wrap gap-1.5">
                                {idea.sourceItems.map((item, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2 py-1 bg-violet-50 text-violet-700 rounded-md text-[11px] font-medium"
                                    >
                                        {item.itemName}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={(e) => { e.stopPropagation(); onSelect(); }}
                        className="w-full mt-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                        Use This Idea <span>&rarr;</span>
                    </button>
                </div>
            )}
        </div>
    );
}
