"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { getBroadcastGroupsAction, getCampaignsAction, type BroadcastCampaign } from '@/actions/broadcast-actions';
import { getTemplatesForPartnerIndustry } from '@/actions/template-filtering-actions';
import { getPartnerTemplatesAction } from '@/actions/template-actions';
import { generateBroadcastIdeasAction } from '@/actions/broadcast-idea-actions';
import { SystemTemplate, Contact, BroadcastIdea, TemplateCampaignType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { BroadcastFeed } from '@/components/partner/broadcast/BroadcastFeed';
import { BroadcastStudio } from '@/components/partner/broadcast/BroadcastStudio';

interface Group {
    id: string;
    name: string;
    count: number;
    icon?: string;
}

type View = 'feed' | 'studio' | 'success';

/**
 * Convert a BroadcastIdea (AI-generated) to a SystemTemplate shape
 * so BroadcastStudio and all downstream steps work unchanged.
 */
function ideaToTemplate(idea: BroadcastIdea): SystemTemplate {
    return {
        id: idea.id,
        slug: `ai-idea-${idea.id}`,
        name: idea.title,
        language: 'en_US',
        category: idea.category as 'MARKETING' | 'UTILITY' | 'AUTHENTICATION',
        components: [
            {
                type: 'BODY',
                text: idea.message,
            },
        ],
        variableCount: idea.variableMap.length,
        variables: idea.variableMap.map(v => v.token),
        applicableIndustries: [],
        applicableFunctions: [],
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        feedMeta: {
            title: idea.title,
            subtitle: idea.description,
            campaignType: idea.campaignType as TemplateCampaignType,
            signal: {
                icon: '\u2728',
                label: idea.signal?.label || 'AI Suggested',
                color: idea.signal?.color || '#6366f1',
            },
            timing: {
                best: 'Anytime',
                icon: '\uD83D\uDD59',
            },
            sortPriority: idea.sortPriority,
            isTimeSensitive: false,
        },
        variableMap: idea.variableMap,
        enhancementDefaults: {
            image: false,
            buttons: false,
            link: false,
        },
    };
}

export default function PingboxBroadcast() {
    const { currentWorkspace, user } = useMultiWorkspaceAuth();
    const { toast } = useToast();

    const partnerId = currentWorkspace?.partnerId;
    const userId = user?.uid;

    // Data state
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [templates, setTemplates] = useState<SystemTemplate[]>([]);
    const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
    const [partnerIndustries, setPartnerIndustries] = useState<string[]>([]);
    const [businessName, setBusinessName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // AI ideas state
    const [aiIdeas, setAiIdeas] = useState<BroadcastIdea[]>([]);
    const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
    const [hasModuleData, setHasModuleData] = useState(false);

    // View state
    const [view, setView] = useState<View>('feed');
    const [selectedTemplate, setSelectedTemplate] = useState<SystemTemplate | null>(null);
    const [channel] = useState<'whatsapp' | 'telegram'>('whatsapp');

    // ===== Data Fetching =====

    // Contacts (realtime)
    useEffect(() => {
        if (!partnerId) return;

        const contactsQuery = query(collection(db, `partners/${partnerId}/contacts`));
        const unsubscribe = onSnapshot(contactsQuery, (snapshot) => {
            const contactsData = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() } as Contact))
                .filter(c => c.phone);
            setContacts(contactsData);
        }, (err) => {
            console.error('Error loading contacts:', err);
        });

        return () => unsubscribe();
    }, [partnerId]);

    // Groups
    useEffect(() => {
        if (!partnerId) return;

        const fetchGroups = async () => {
            const res = await getBroadcastGroupsAction(partnerId);
            if (res.success && res.groups) {
                setGroups([
                    { id: 'all', name: 'All Contacts', count: contacts.length, icon: '\uD83D\uDCCB' },
                    ...res.groups.map((g: any) => ({
                        id: g.id,
                        name: g.name,
                        count: g.count || 0,
                        icon: '\uD83D\uDC65',
                    })),
                ]);
            }
        };
        fetchGroups();
    }, [partnerId, contacts.length]);

    // Templates, Campaigns, Partner Profile
    useEffect(() => {
        if (!partnerId) return;

        const fetchAll = async () => {
            setIsLoading(true);

            const [sysRes, partnerRes, campaignsRes, partnerDoc] = await Promise.all([
                getTemplatesForPartnerIndustry(partnerId),
                getPartnerTemplatesAction(partnerId),
                getCampaignsAction(partnerId),
                getDoc(doc(db, 'partners', partnerId)),
            ]);

            // Templates
            const allTemplates: SystemTemplate[] = [];
            if (sysRes.success && sysRes.templates) {
                allTemplates.push(...(sysRes.templates as SystemTemplate[]));
            }
            if (partnerRes.success && partnerRes.data) {
                allTemplates.push(...(partnerRes.data as SystemTemplate[]));
            }
            setTemplates(allTemplates);

            if (sysRes.partnerIndustries) {
                setPartnerIndustries(sysRes.partnerIndustries as string[]);
            }

            // Campaigns
            if (campaignsRes.success && campaignsRes.campaigns) {
                setCampaigns(campaignsRes.campaigns);
            }

            // Partner Profile
            if (partnerDoc.exists()) {
                const data = partnerDoc.data();
                setBusinessName(data?.businessName || data?.name || 'Business');
            }

            setIsLoading(false);
        };

        fetchAll();
    }, [partnerId]);

    // AI Ideas (fetched after initial load)
    useEffect(() => {
        if (!partnerId || isLoading) return;

        const fetchIdeas = async () => {
            setIsLoadingIdeas(true);
            try {
                const res = await generateBroadcastIdeasAction(partnerId);
                if (res.success && res.ideas) {
                    setAiIdeas(res.ideas);
                    setHasModuleData(res.hasModuleData);
                }
            } catch (err) {
                console.error('Error fetching AI ideas:', err);
            }
            setIsLoadingIdeas(false);
        };

        fetchIdeas();
    }, [partnerId, isLoading]);

    // ===== View Handlers =====

    const handleSelectTemplate = (t: SystemTemplate) => {
        setSelectedTemplate(t);
        setView('studio');
    };

    const handleSelectIdea = (idea: BroadcastIdea) => {
        const template = ideaToTemplate(idea);
        setSelectedTemplate(template);
        setView('studio');
    };

    const handleCustomBroadcast = () => {
        setSelectedTemplate(null);
        setView('studio');
    };

    const handleStudioBack = () => {
        setSelectedTemplate(null);
        setView('feed');
    };

    const handleSuccess = () => {
        setView('success');
        toast({
            title: '\uD83C\uDF89 Campaign Sent!',
            description: 'Your broadcast is being delivered to recipients.',
        });
    };

    const handleRefreshIdeas = useCallback(async () => {
        if (!partnerId) return;
        setIsLoadingIdeas(true);
        try {
            const res = await generateBroadcastIdeasAction(partnerId, { forceRefresh: true });
            if (res.success && res.ideas) {
                setAiIdeas(res.ideas);
                setHasModuleData(res.hasModuleData);
            }
        } catch (err) {
            console.error('Error refreshing AI ideas:', err);
            toast({
                title: 'Refresh failed',
                description: 'Could not generate new ideas. Please try again.',
                variant: 'destructive',
            });
        }
        setIsLoadingIdeas(false);
    }, [partnerId, toast]);

    // ===== Render =====

    if (!partnerId) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                <span className="text-sm text-gray-500">Loading broadcast studio...</span>
            </div>
        );
    }

    // Success view
    if (view === 'success') {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-6">
                <div className="text-6xl animate-bounce">{'\uD83C\uDF89'}</div>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Sent!</h2>
                    <p className="text-gray-500">Your broadcast is being delivered to recipients.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setView('feed')}
                        className="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
                    >
                        Back to Broadcasts
                    </button>
                    <Link
                        href="/partner/campaigns"
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                        View Campaigns &rarr;
                    </Link>
                </div>
            </div>
        );
    }

    // Studio view
    if (view === 'studio') {
        return (
            <BroadcastStudio
                template={selectedTemplate}
                channel={channel}
                contacts={contacts}
                groups={groups}
                partnerId={partnerId}
                userId={userId || 'unknown'}
                businessName={businessName}
                partnerIndustry={partnerIndustries[0] || 'general'}
                onBack={handleStudioBack}
                onSuccess={handleSuccess}
            />
        );
    }

    // Feed view (default)
    return (
        <div className="h-full overflow-y-auto">
            <div className="px-4 py-8">
                <BroadcastFeed
                    templates={templates}
                    aiIdeas={aiIdeas}
                    isLoadingIdeas={isLoadingIdeas}
                    campaigns={campaigns}
                    contactCount={contacts.length}
                    partnerIndustries={partnerIndustries}
                    hasModuleData={hasModuleData}
                    onSelectTemplate={handleSelectTemplate}
                    onSelectIdea={handleSelectIdea}
                    onCustomBroadcast={handleCustomBroadcast}
                    onRefreshIdeas={handleRefreshIdeas}
                />
                {campaigns.length > 0 && (
                    <div className="max-w-3xl mx-auto mt-6">
                        <Link
                            href="/partner/campaigns"
                            className="flex items-center justify-between w-full px-5 py-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg">📊</span>
                                <div>
                                    <span className="font-medium text-sm text-gray-900">View All Campaigns</span>
                                    <span className="block text-xs text-gray-500">{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} — track performance & analytics</span>
                                </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
