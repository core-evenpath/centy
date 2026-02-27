"use client";

import React, { useState } from 'react';
import { SystemTemplate } from '@/lib/types';
import { replaceVariablesInPreview, variableMapToMappings } from '@/lib/template-variable-engine';
import type { TemplateStatus } from './BroadcastFeed';

interface FeedCardProps {
    template: SystemTemplate;
    status: TemplateStatus;
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

function StatusBadge({ status }: { status: TemplateStatus }) {
    if (status === 'ready') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[11px] font-semibold">
                ✓ Ready to use
            </span>
        );
    }

    if (status === 'module-needed') {
        return (
            <a
                href="/partner/modules"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[11px] font-semibold hover:bg-amber-100 transition-colors"
            >
                ⚠ Needs module setup
            </a>
        );
    }

    return null;
}

export function FeedCard({ template, status, onSelect }: FeedCardProps) {
    const [expanded, setExpanded] = useState(false);
    const meta = template.feedMeta;

    if (meta) {
        const bodyComp = template.components.find(c => c.type === 'BODY');
        const bodyText = bodyComp?.text || '';

        let previewText = bodyText;
        if (template.variableMap && template.variableMap.length > 0) {
            const mappings = variableMapToMappings(template.variableMap);
            previewText = replaceVariablesInPreview(bodyText, mappings);
        }

        return (
            <div
                className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${expanded ? 'border-gray-300 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
            >
                <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpanded(!expanded)}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 text-sm truncate">{meta.title}</h3>
                                {meta.isTimeSensitive && (
                                    <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded uppercase tracking-wider">
                                        Time-sensitive
                                    </span>
                                )}
                            </div>
                            <div className="mb-2.5">
                                <StatusBadge status={status} />
                            </div>
                            <p className="text-xs text-gray-500 mb-2.5">{meta.subtitle}</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold"
                                    style={{
                                        background: `${meta.signal.color}15`,
                                        color: meta.signal.color,
                                    }}
                                >
                                    {meta.signal.icon} {meta.signal.label}
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-[11px] font-medium">
                                    {meta.timing.icon} {meta.timing.best}
                                </span>
                                {template.tags?.slice(0, 3).map(tag => (
                                    <span key={tag} className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full text-[10px] font-medium">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                                style={{
                                    background: `${campaignTypeColor(meta.campaignType)}12`,
                                    color: campaignTypeColor(meta.campaignType),
                                }}
                            >
                                {meta.campaignType}
                            </span>
                            <span className={`text-gray-400 text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}>
                                ▼
                            </span>
                        </div>
                    </div>
                </div>

                {expanded && (
                    <div className="border-t border-gray-100 px-4 pb-4">
                        <div className="mt-3 mb-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Message Preview</div>
                            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                {previewText}
                            </div>
                        </div>

                        {template.variableMap && template.variableMap.length > 0 && (
                            <div className="mb-3">
                                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Variables</div>
                                <div className="flex flex-wrap gap-2">
                                    {template.variableMap.map(v => (
                                        <div key={v.token} className="flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs">
                                            <span>{sourceIcon(v.source)}</span>
                                            <span className="font-mono text-[10px] text-indigo-600 font-bold">{v.token}</span>
                                            <span className="text-gray-500">{v.label}</span>
                                            <span className="text-[10px] text-gray-400">· {sourceLabel(v.source)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {status === 'module-needed' ? (
                            <a
                                href="/partner/modules"
                                className="w-full mt-1 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                            >
                                Set up module first <span>→</span>
                            </a>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); onSelect(); }}
                                className="w-full mt-1 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                            >
                                Use This Broadcast <span>→</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">
                            {template.category === 'MARKETING' ? '📢' : template.category === 'UTILITY' ? '🔔' : '🔑'}
                        </span>
                        <h3 className="font-semibold text-gray-900 text-sm">{template.name}</h3>
                    </div>
                    <StatusBadge status={status} />
                    {template.description && (
                        <p className="text-xs text-gray-500 mb-2 mt-1 line-clamp-2">{template.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold uppercase">
                            {template.category}
                        </span>
                        {template.variableCount > 0 && (
                            <span className="text-[11px] text-gray-400">
                                {template.variableCount} variable{template.variableCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
                <button
                    onClick={onSelect}
                    className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors flex-shrink-0"
                >
                    Use Template →
                </button>
            </div>
        </div>
    );
}
