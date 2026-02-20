"use client";

import React, { useState, useMemo } from 'react';
import { SystemTemplate, TemplateCampaignType } from '@/lib/types';
import { type BroadcastCampaign } from '@/actions/broadcast-actions';
import { FeedCard } from './FeedCard';

export type TemplateStatus = 'ready' | 'module-needed' | 'standard';

interface BroadcastFeedProps {
    templates: SystemTemplate[];
    campaigns: BroadcastCampaign[];
    contactCount: number;
    partnerIndustries: string[];
    enabledModuleSlugs: string[];
    partnerFunctionIds: string[];
    onSelectTemplate: (t: SystemTemplate) => void;
    onCustomBroadcast: () => void;
}

type FilterTab = 'all' | TemplateCampaignType;

const filterTabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'promotion', label: 'Promotions' },
    { id: 'seasonal', label: 'Seasonal' },
    { id: 'retention', label: 'Retention' },
    { id: 'transactional', label: 'Reminders' },
    { id: 'lead-gen', label: 'Lead Gen' },
    { id: 'announcement', label: 'Announcements' },
];

function getTemplateStatus(
    template: SystemTemplate,
    enabledModuleSlugs: string[],
    _partnerFunctionIds: string[]
): TemplateStatus {
    const moduleRefs = (template.variableMap || []).filter(
        v => v.source === 'module' && v.moduleRef?.moduleSlug
    );

    if (moduleRefs.length === 0) {
        return 'standard';
    }

    const allSatisfied = moduleRefs.every(
        v => enabledModuleSlugs.includes(v.moduleRef!.moduleSlug)
    );

    return allSatisfied ? 'ready' : 'module-needed';
}

const STATUS_PRIORITY: Record<TemplateStatus, number> = {
    'ready': 0,
    'standard': 1,
    'module-needed': 2,
};

export function BroadcastFeed({
    templates,
    campaigns,
    contactCount,
    enabledModuleSlugs,
    partnerFunctionIds,
    onSelectTemplate,
    onCustomBroadcast,
}: BroadcastFeedProps) {
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

    const sentCampaigns = campaigns.filter(c => c.status === 'sent');
    const totalSent = sentCampaigns.reduce((a, c) => a + c.recipientCount, 0);
    const totalDelivered = sentCampaigns.reduce((a, c) => a + (c.delivered || 0), 0);
    const totalRead = sentCampaigns.reduce((a, c) => a + (c.read || 0), 0);
    const totalReplied = sentCampaigns.reduce((a, c) => a + (c.replied || 0), 0);

    const openRate = totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : null;
    const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : null;

    const sortedTemplates = useMemo(() => {
        const withStatus = templates.map(t => ({
            template: t,
            status: getTemplateStatus(t, enabledModuleSlugs, partnerFunctionIds),
        }));

        withStatus.sort((a, b) => {
            const statusDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
            if (statusDiff !== 0) return statusDiff;

            const aPriority = a.template.feedMeta?.sortPriority || 0;
            const bPriority = b.template.feedMeta?.sortPriority || 0;
            return bPriority - aPriority;
        });

        return withStatus;
    }, [templates, enabledModuleSlugs, partnerFunctionIds]);

    const filteredTemplates = useMemo(() => {
        if (activeFilter === 'all') return sortedTemplates;
        return sortedTemplates.filter(({ template: t }) =>
            t.feedMeta?.campaignType === activeFilter || !t.feedMeta
        );
    }, [sortedTemplates, activeFilter]);

    const stats = [
        { label: 'Your Contacts', value: contactCount.toString(), color: '#111' },
        { label: 'Campaigns Sent', value: sentCampaigns.length.toString(), color: '#7c3aed' },
        { label: 'Open Rate', value: openRate !== null ? `${openRate}%` : '—', color: '#0ea5e9' },
        { label: 'Reply Rate', value: replyRate !== null ? `${replyRate}%` : '—', color: '#16a34a' },
    ];

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Broadcasts</h1>
                    <p className="text-sm text-gray-500 mt-1">Choose a campaign or start from scratch</p>
                </div>
                <button
                    onClick={onCustomBroadcast}
                    className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm"
                >
                    Custom Broadcast <span>✨</span>
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {stats.map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                        <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                        <div className="text-[11px] font-medium text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 mb-6 overflow-x-auto no-scrollbar">
                {filterTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveFilter(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeFilter === tab.id
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {filteredTemplates.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <span className="text-4xl block mb-3 opacity-60">📭</span>
                    <h3 className="font-semibold text-gray-900 mb-1">No templates found</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        {activeFilter !== 'all'
                            ? 'Try a different category or browse all templates'
                            : 'No templates are available for your industry yet'}
                    </p>
                    <button
                        onClick={onCustomBroadcast}
                        className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
                    >
                        Start from Scratch ✨
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredTemplates.map(({ template: t, status }) => (
                        <FeedCard
                            key={t.id}
                            template={t}
                            status={status}
                            onSelect={() => onSelectTemplate(t)}
                        />
                    ))}
                </div>
            )}

            <div className="mt-8 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100 p-6 text-center">
                <p className="text-sm font-medium text-violet-900 mb-3">
                    Can&apos;t find the right campaign?
                </p>
                <button
                    onClick={onCustomBroadcast}
                    className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors"
                >
                    Start from scratch ✨
                </button>
            </div>
        </div>
    );
}
