"use client";

import React, { useState, useEffect } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { getBroadcastGroupsAction, getCampaignsAction, type BroadcastCampaign } from '@/actions/broadcast-actions';
import { getTemplatesForPartnerIndustry } from '@/actions/template-filtering-actions';
import { getPartnerTemplatesAction } from '@/actions/template-actions';
import { SystemTemplate, Contact } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

import { BroadcastFeed } from '@/components/partner/broadcast/BroadcastFeed';
import { BroadcastStudio } from '@/components/partner/broadcast/BroadcastStudio';

interface Group {
    id: string;
    name: string;
    count: number;
    icon?: string;
}

type View = 'feed' | 'studio' | 'success';

export default function PingboxBroadcast() {
    const { currentWorkspace, user } = useMultiWorkspaceAuth();
    const { toast } = useToast();

    const partnerId = currentWorkspace?.partnerId;
    const userId = user?.uid;

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [templates, setTemplates] = useState<SystemTemplate[]>([]);
    const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
    const [partnerIndustries, setPartnerIndustries] = useState<string[]>([]);
    const [partnerFunctionIds, setPartnerFunctionIds] = useState<string[]>([]);
    const [enabledModuleSlugs, setEnabledModuleSlugs] = useState<string[]>([]);
    const [businessName, setBusinessName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const [view, setView] = useState<View>('feed');
    const [selectedTemplate, setSelectedTemplate] = useState<SystemTemplate | null>(null);
    const [channel] = useState<'whatsapp' | 'telegram'>('whatsapp');

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

    useEffect(() => {
        if (!partnerId) return;

        const fetchGroups = async () => {
            const res = await getBroadcastGroupsAction(partnerId);
            if (res.success && res.groups) {
                setGroups([
                    { id: 'all', name: 'All Contacts', count: contacts.length, icon: '📋' },
                    ...res.groups.map((g: any) => ({
                        id: g.id,
                        name: g.name,
                        count: g.count || 0,
                        icon: '👥',
                    })),
                ]);
            }
        };
        fetchGroups();
    }, [partnerId, contacts.length]);

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
            setPartnerFunctionIds(sysRes.partnerFunctionIds || []);
            setEnabledModuleSlugs(sysRes.enabledModuleSlugs || []);

            if (campaignsRes.success && campaignsRes.campaigns) {
                setCampaigns(campaignsRes.campaigns);
            }

            if (partnerDoc.exists()) {
                const data = partnerDoc.data();
                setBusinessName(data?.businessName || data?.name || 'Business');
            }

            setIsLoading(false);
        };

        fetchAll();
    }, [partnerId]);

    const handleSelectTemplate = (t: SystemTemplate) => {
        setSelectedTemplate(t);
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
            title: '🎉 Campaign Sent!',
            description: 'Your broadcast is being delivered to recipients.',
        });
    };

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

    if (view === 'success') {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-6">
                <div className="text-6xl animate-bounce">🎉</div>
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
                    <a
                        href="/partner/campaigns"
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                        View Campaigns →
                    </a>
                </div>
            </div>
        );
    }

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

    return (
        <div className="h-full overflow-y-auto">
            <div className="px-4 py-8">
                <BroadcastFeed
                    templates={templates}
                    campaigns={campaigns}
                    contactCount={contacts.length}
                    partnerIndustries={partnerIndustries}
                    enabledModuleSlugs={enabledModuleSlugs}
                    partnerFunctionIds={partnerFunctionIds}
                    onSelectTemplate={handleSelectTemplate}
                    onCustomBroadcast={handleCustomBroadcast}
                />
            </div>
        </div>
    );
}
