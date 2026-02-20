"use client";

import React, { useState, useMemo } from 'react';
import { SystemTemplate, TemplateCampaignType, BroadcastIdea } from '@/lib/types';
import { type BroadcastCampaign } from '@/actions/broadcast-actions';
import { FeedCard } from './FeedCard';
import { AIIdeaCard } from './AIIdeaCard';

interface BroadcastFeedProps {
    templates: SystemTemplate[];
    aiIdeas: BroadcastIdea[];
    isLoadingIdeas: boolean;
    campaigns: BroadcastCampaign[];
    contactCount: number;
    partnerIndustries: string[];
    hasModuleData: boolean;
    onSelectTemplate: (t: SystemTemplate) => void;
    onSelectIdea: (idea: BroadcastIdea) => void;
    onCustomBroadcast: () => void;
    onRefreshIdeas: () => void;
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

export function BroadcastFeed({
    templates,
    aiIdeas,
    isLoadingIdeas,
    campaigns,
    contactCount,
    hasModuleData,
    onSelectTemplate,
    onSelectIdea,
    onCustomBroadcast,
    onRefreshIdeas,
}: BroadcastFeedProps) {
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

    const sentCampaigns = campaigns.filter(c => c.status === 'sent');
    const totalSent = sentCampaigns.reduce((a, c) => a + c.recipientCount, 0);
    const totalDelivered = sentCampaigns.reduce((a, c) => a + (c.delivered || 0), 0);
    const totalRead = sentCampaigns.reduce((a, c) => a + (c.read || 0), 0);
    const totalReplied = sentCampaigns.reduce((a, c) => a + (c.replied || 0), 0);

    const openRate = totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : null;
    const replyRate = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : null;

    // Sort and filter AI ideas
    const sortedIdeas = useMemo(() => {
        return [...aiIdeas].sort((a, b) => (b.sortPriority || 0) - (a.sortPriority || 0));
    }, [aiIdeas]);

    const filteredIdeas = useMemo(() => {
        if (activeFilter === 'all') return sortedIdeas;
        return sortedIdeas.filter(idea => idea.campaignType === activeFilter);
    }, [sortedIdeas, activeFilter]);

    // Sort and filter templates
    const sortedTemplates = useMemo(() => {
        const withMeta = templates.filter(t => t.feedMeta).sort((a, b) => (b.feedMeta!.sortPriority || 0) - (a.feedMeta!.sortPriority || 0));
        const withoutMeta = templates.filter(t => !t.feedMeta);
        return [...withMeta, ...withoutMeta];
    }, [templates]);

    const filteredTemplates = useMemo(() => {
        if (activeFilter === 'all') return sortedTemplates;
        return sortedTemplates.filter(t =>
            t.feedMeta?.campaignType === activeFilter || !t.feedMeta
        );
    }, [sortedTemplates, activeFilter]);

    const stats = [
        { label: 'Your Contacts', value: contactCount.toString(), color: '#111' },
        { label: 'Campaigns Sent', value: sentCampaigns.length.toString(), color: '#7c3aed' },
        { label: 'Open Rate', value: openRate !== null ? `${openRate}%` : '\u2014', color: '#0ea5e9' },
        { label: 'Reply Rate', value: replyRate !== null ? `${replyRate}%` : '\u2014', color: '#16a34a' },
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
                    Custom Broadcast <span>&#10024;</span>
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

            {/* AI-Suggested Campaigns Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-indigo-500">&#10024;</span>
                        <h2 className="text-sm font-semibold text-gray-900">AI-Suggested Campaigns</h2>
                    </div>
                    <button
                        onClick={onRefreshIdeas}
                        disabled={isLoadingIdeas}
                        className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoadingIdeas ? 'Generating...' : 'Refresh Ideas &#10024;'}
                    </button>
                </div>

                {isLoadingIdeas ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                        <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
                                        <div className="flex gap-2">
                                            <div className="h-5 bg-gray-100 rounded-full w-28" />
                                            <div className="h-5 bg-gray-100 rounded-full w-20" />
                                        </div>
                                    </div>
                                    <div className="h-5 bg-gray-100 rounded w-16" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredIdeas.length > 0 ? (
                    <div className="space-y-3">
                        {filteredIdeas.map(idea => (
                            <AIIdeaCard
                                key={idea.id}
                                idea={idea}
                                onSelect={() => onSelectIdea(idea)}
                            />
                        ))}
                    </div>
                ) : aiIdeas.length > 0 && activeFilter !== 'all' ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                        <p className="text-sm text-gray-500">No AI suggestions for this category. Try &quot;All&quot; to see all ideas.</p>
                    </div>
                ) : !isLoadingIdeas && !hasModuleData ? (
                    <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-100 p-6 text-center">
                        <span className="text-2xl block mb-2">&#128230;</span>
                        <h3 className="font-semibold text-gray-900 mb-1 text-sm">Add your products to unlock AI campaigns</h3>
                        <p className="text-xs text-gray-500 mb-3">
                            Go to Settings &rarr; Modules to add your products, services, or menu items. AI will create personalized campaign ideas using your actual data.
                        </p>
                    </div>
                ) : null}
            </div>

            {/* Admin Templates Section */}
            {filteredTemplates.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-sm font-semibold text-gray-900 mb-3">Templates</h2>
                    <div className="space-y-3">
                        {filteredTemplates.map(t => (
                            <FeedCard
                                key={t.id}
                                template={t}
                                onSelect={() => onSelectTemplate(t)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {filteredIdeas.length === 0 && filteredTemplates.length === 0 && !isLoadingIdeas && (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <span className="text-4xl block mb-3 opacity-60">&#128237;</span>
                    <h3 className="font-semibold text-gray-900 mb-1">No campaigns found</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        {activeFilter !== 'all'
                            ? 'Try a different category or browse all campaigns'
                            : 'No campaigns are available yet'}
                    </p>
                    <button
                        onClick={onCustomBroadcast}
                        className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
                    >
                        Start from Scratch &#10024;
                    </button>
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
                    Start from scratch &#10024;
                </button>
            </div>
        </div>
    );
}
