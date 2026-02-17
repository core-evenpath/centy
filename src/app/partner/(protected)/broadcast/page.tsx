"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { getBroadcastGroupsAction } from '@/actions/broadcast-actions';
import { createCampaignAction } from '@/actions/broadcast-actions';
import { sendBroadcastCampaignAction } from '@/actions/broadcast-send-actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getPartnerTemplatesAction } from '@/actions/template-actions';
import { getTemplatesForPartnerIndustry } from '@/actions/template-filtering-actions';
import { SystemTemplate } from '@/lib/types';
import { PartnerTemplateLibrary } from '@/components/partner/broadcast/PartnerTemplateLibrary';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { doc, getDoc } from 'firebase/firestore';
import {
    VariableMapping,
    extractTemplateVariables,
    autoMapVariables,
    replaceVariablesInPreview,
} from '@/lib/template-variable-engine';
import {
    getIndustryGreeting,
    getDefaultGreeting,
    getIndustrySuggestions,
    getIndustryAiResponses,
} from '@/lib/industry-messaging';

interface Contact {
    id: string;
    name: string;
    phone: string;
    email?: string;
    avatar?: string;
    selected?: boolean;
    tag?: string;
    budget?: string;
    area?: string;
    groups?: string[];
    [key: string]: any;
}

interface Group {
    id: string;
    name: string;
    count: number;
    icon: string;
    contactIds?: string[];
}

// Default variable options used when no template is loaded (manual compose)
const defaultVariableOptions = [
    { token: '{{name}}', label: 'First Name', preview: 'John', icon: '👤' },
    { token: '{{company}}', label: 'Company Name', preview: 'Centy', icon: '🏢' },
];

const quickReplyPresets = [
    { buttons: ['Yes, interested!', 'Schedule viewing', 'More details'], label: 'Interest + Viewing' },
    { buttons: ['Book now', 'Call me', 'Not now'], label: 'Booking Flow' },
    { buttons: ['👍 Yes', '👎 No'], label: 'Simple Yes/No' },
];

const TypingIndicator = () => (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
        <div style={{ padding: '14px 18px', borderRadius: '18px 18px 18px 4px', background: '#f8f8f8' }}>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#bbb', animation: `typingBounce 1.4s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }} />
                ))}
            </div>
        </div>
    </div>
);

export default function PingboxBroadcast() {
    const { currentWorkspace, user } = useMultiWorkspaceAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [view, setView] = useState('home');
    const [channel, setChannel] = useState<'whatsapp' | 'telegram'>('whatsapp');
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [typedResponse, setTypedResponse] = useState('');
    const [currentAiMessage, setCurrentAiMessage] = useState('');
    const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
    const [campaignMessage, setCampaignMessage] = useState('');
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [sendingState, setSendingState] = useState('idle');
    const [sentCount, setSentCount] = useState(0);
    const [metrics, setMetrics] = useState({ delivered: 0, read: 0, replied: 0 });
    const [contactSearch, setContactSearch] = useState('');
    const [hoveredContact, setHoveredContact] = useState<string | null>(null);

    const [headerImage, setHeaderImage] = useState<string | null>(null);
    const [quickReplyButtons, setQuickReplyButtons] = useState<string[]>([]);
    const [ctaButtons, setCtaButtons] = useState<any[]>([]);
    const [footerText, setFooterText] = useState('');

    const [showImageModal, setShowImageModal] = useState(false);
    const [showButtonModal, setShowButtonModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showVariableModal, setShowVariableModal] = useState(false);

    // Templates
    const [availableTemplates, setAvailableTemplates] = useState<SystemTemplate[]>([]);
    const [partnerTemplates, setPartnerTemplates] = useState<SystemTemplate[]>([]);
    const [partnerIndustries, setPartnerIndustries] = useState<string[]>([]);

    // Industry & variable mapping
    const [partnerIndustry, setPartnerIndustry] = useState<string>('default');
    const [variableMappings, setVariableMappings] = useState<VariableMapping[]>([]);


    const [tempLinkText, setTempLinkText] = useState('');
    const [tempLinkUrl, setTempLinkUrl] = useState('');
    const [tempPhoneText, setTempPhoneText] = useState('');
    const [tempPhoneNumber, setTempPhoneNumber] = useState('');
    const [tempQuickReplies, setTempQuickReplies] = useState(['', '', '']);
    const [buttonType, setButtonType] = useState('quick');

    const [recipients, setRecipients] = useState<Contact[]>([]);
    const [groups, setGroups] = useState<Group[]>([
        { id: 'all', name: 'All Contacts', count: 0, icon: '👥' },
    ]);
    const [isLoadingRecipients, setIsLoadingRecipients] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const isWA = channel === 'whatsapp';
    const partnerId = currentWorkspace?.partnerId;
    const userId = user?.uid;

    // Load Contacts and Groups
    useEffect(() => {
        if (!partnerId) return;

        // Load contacts
        const contactsQuery = query(collection(db, `partners/${partnerId}/contacts`), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(contactsQuery, (snapshot) => {
            const contactsData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || 'Unknown',
                    phone: data.phone || '',
                    email: data.email,
                    avatar: data.avatarUrl || getInitials(data.name || '?'),
                    selected: false,
                    tag: (data.tags && data.tags[0]) || 'Client',
                    budget: data.customFields?.budget || '-',
                    area: data.customFields?.area || '-',
                    groups: data.groups || [],
                    ...data
                } as Contact;
            });
            setRecipients(contactsData);

            // Update "All Contacts" count
            setGroups(prevGroups => prevGroups.map(g => g.id === 'all' ? { ...g, count: contactsData.length } : g));
            setIsLoadingRecipients(false);
        }, (err) => {
            console.error("Error loading contacts", err);
            setIsLoadingRecipients(false);
        });

        // Load groups
        const fetchGroups = async () => {
            try {
                const result = await getBroadcastGroupsAction(partnerId);
                if (result.success && result.groups) {
                    const mappedGroups = result.groups.map((g: any) => ({
                        id: g.id,
                        name: g.name,
                        count: g.contactIds?.length || 0,
                        icon: '👥', // Default icon
                        contactIds: g.contactIds
                    }));
                    // Add default groups if needed, or merge
                    setGroups(prev => [prev[0], ...mappedGroups]);
                }
            } catch (err) {
                console.error("Error loading groups", err);
            }
        };
        fetchGroups();

        return () => unsubscribe();
    }, [partnerId]);

    // Fetch Templates
    useEffect(() => {
        if (!partnerId) return;
        async function fetchTemplates() {
            const [sysRes, partnerRes] = await Promise.all([
                getTemplatesForPartnerIndustry(partnerId!),
                getPartnerTemplatesAction(partnerId!)
            ]);

            if (sysRes.success && sysRes.templates) {
                setAvailableTemplates(sysRes.templates);
                if (sysRes.partnerIndustries) {
                    setPartnerIndustries(sysRes.partnerIndustries);
                }
            }
            if (partnerRes.success && partnerRes.data) {
                setPartnerTemplates(partnerRes.data);
            }
        }
        fetchTemplates();
    }, [partnerId]);

    // Fetch Partner Industry
    useEffect(() => {
        if (!partnerId) return;

        async function fetchPartnerIndustry() {
            try {
                const partnerDoc = await getDoc(doc(db, 'partners', partnerId!));
                if (partnerDoc.exists()) {
                    const industry = partnerDoc.data()?.industry?.id || 'default';
                    setPartnerIndustry(industry);
                }
            } catch (err) {
                console.error('Error fetching partner industry:', err);
            }
        }

        fetchPartnerIndustry();
    }, [partnerId]);


    const sampleImages = (() => {
        const imagesByIndustry: Record<string, Array<{ url: string; label: string }>> = {
            'real-estate': [
                { url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop', label: 'Modern Home Exterior' },
                { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop', label: 'Luxury Kitchen' },
                { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop', label: 'Living Room' },
                { url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop', label: 'Pool & Backyard' },
            ],
            'food-beverage': [
                { url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop', label: 'Gourmet Dish' },
                { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop', label: 'Restaurant Interior' },
                { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop', label: 'Fine Dining' },
                { url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop', label: 'Fresh Ingredients' },
            ],
            'beauty-wellness': [
                { url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop', label: 'Salon Interior' },
                { url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop', label: 'Beauty Treatment' },
                { url: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400&h=300&fit=crop', label: 'Spa Setting' },
                { url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=300&fit=crop', label: 'Wellness Vibes' },
            ],
        };
        const defaults = [
            { url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop', label: 'Professional' },
            { url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=300&fit=crop', label: 'Team Meeting' },
            { url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop', label: 'Collaboration' },
            { url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop', label: 'Business Growth' },
        ];
        return imagesByIndustry[partnerIndustry] || defaults;
    })();

    // Industry-aware AI Responses (derived from partner's industry)
    const aiResponses = getIndustryAiResponses(partnerIndustry);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typedResponse]);

    useEffect(() => {
        if (currentAiMessage && typedResponse.length < currentAiMessage.length) {
            const timer = setTimeout(() => setTypedResponse(currentAiMessage.slice(0, typedResponse.length + 3)), 8);
            return () => clearTimeout(timer);
        } else if (currentAiMessage && typedResponse.length >= currentAiMessage.length) {
            setMessages(prev => [...prev, { id: Date.now().toString(), type: 'ai', content: currentAiMessage, suggestions: currentSuggestions }]);
            setCampaignMessage(currentAiMessage);
            setCurrentAiMessage('');
            setTypedResponse('');
            setCurrentSuggestions([]);
            setIsTyping(false);
        }
    }, [currentAiMessage, typedResponse, currentSuggestions]);

    useEffect(() => {
        if (view === 'success') {
            const total = getRecipientCount();
            // Mock metrics for demo/success view
            // In a real app, these would come from live stats or we'd just show 0 or pending
            setTimeout(() => setMetrics({ delivered: total, read: 0, replied: 0 }), 600);
            setTimeout(() => setMetrics({ delivered: total, read: Math.floor(total * 0.82), replied: 0 }), 1800);
            setTimeout(() => setMetrics({ delivered: total, read: Math.floor(total * 0.82), replied: Math.floor(total * 0.28) }), 3200);
        }
    }, [view]);

    const getRecipientCount = () => {
        if (selectedGroup === 'all') return recipients.length;
        if (selectedGroup) {
            const group = groups.find(g => g.id === selectedGroup);
            return group?.contactIds?.length || group?.count || 0;
        }
        return selectedContacts.length;
    };

    const getRecipientIds = () => {
        if (selectedGroup === 'all') return recipients.map(r => r.id);
        if (selectedGroup) {
            const group = groups.find(g => g.id === selectedGroup);
            if (group && group.contactIds) return group.contactIds;
            // Fallback for mock group logic if contactIds missing
            return recipients.map(r => r.id);
        }
        return selectedContacts;
    };

    const processUserInput = (text: string) => {
        const lower = text.toLowerCase();
        for (const response of aiResponses) {
            if (response.trigger.some(t => lower.includes(t))) {
                if (response.action === 'next') { setView('recipients'); return; }
                setIsTyping(true);
                setTimeout(() => {
                    setCurrentSuggestions(response.suggestions || []);
                    setCurrentAiMessage(response.response || '');
                }, 800 + Math.random() * 400);
                return;
            }
        }
        setIsTyping(true);
        setTimeout(() => {
            setCurrentSuggestions(aiResponses[0].suggestions || []);
            setCurrentAiMessage(aiResponses[0].response || '');
        }, 800);
    };

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', content: input }]);
        processUserInput(input);
        setInput('');
    };

    const handleSuggestionClick = (s: string) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', content: s }]);
        processUserInput(s);
    };

    const startStudio = (template: any = null) => {
        setView('studio');

        // If it's a SystemTemplate
        if (template && 'components' in template) {
            const sysTemplate = template as SystemTemplate;
            const body = sysTemplate.components.find(c => c.type === 'BODY')?.text || '';
            const footer = sysTemplate.components.find(c => c.type === 'FOOTER')?.text || '';
            const buttons = sysTemplate.components.find(c => c.type === 'BUTTONS')?.buttons || [];

            // Extract and auto-map template variables
            const variables = extractTemplateVariables(body);
            const sampleContact = recipients[0] || { name: 'Sample User', area: 'Sample Area' };
            const mappings = autoMapVariables(body, variables, partnerIndustry, sampleContact);
            setVariableMappings(mappings);

            setCampaignMessage(body);
            setFooterText(footer);

            // Map Buttons
            const quick: string[] = [];
            const cta: any[] = [];
            buttons.forEach((b: any) => {
                if (b.type === 'QUICK_REPLY') quick.push(b.text);
                else if (b.type === 'URL') cta.push({ type: 'url', text: b.text, value: b.url });
                else if (b.type === 'PHONE_NUMBER') cta.push({ type: 'phone', text: b.text, value: b.phoneNumber });
            });
            setQuickReplyButtons(quick);
            setCtaButtons(cta);

            // Industry-aware greeting
            setTimeout(() => {
                const greeting = getIndustryGreeting(partnerIndustry, sysTemplate.name, mappings.length);
                setMessages([{ id: '1', type: 'ai', content: greeting, suggestions: ['Customize message', 'Select recipients'] }]);
            }, 200);
            return;
        }

        // Default greeting (no template) — industry-aware
        const greeting = getDefaultGreeting(partnerIndustry, user?.displayName);
        const suggestions = getIndustrySuggestions(partnerIndustry);
        setVariableMappings([]); // Reset mappings for manual compose
        setTimeout(() => {
            setMessages([{ id: '1', type: 'ai', content: greeting, suggestions }]);
        }, 200);
    };

    const insertVariable = (variable: any) => {
        const newMsg = campaignMessage ? campaignMessage + ' ' + variable.token : `Hi ${variable.token}! 👋\n\n`;
        setCampaignMessage(newMsg);
        setShowVariableModal(false);
        setMessages(prev => [...prev, { id: Date.now().toString(), type: 'ai', content: `✅ Added "${variable.label}" — will show as "${variable.preview}" for each contact.`, suggestions: ['Add another', 'Perfect! →'] }]);
    };

    const saveQuickReplies = () => {
        const validButtons = tempQuickReplies.filter(b => b.trim());
        setQuickReplyButtons(validButtons);
        setCtaButtons([]);
        setShowButtonModal(false);
        if (validButtons.length > 0) {
            setMessages(prev => [...prev, { id: Date.now().toString(), type: 'ai', content: `✅ Added ${validButtons.length} quick reply button${validButtons.length > 1 ? 's' : ''}: "${validButtons.join('", "')}"`, suggestions: ['Perfect! →'] }]);
        }
    };

    const saveCtaButtons = () => {
        const buttons: { type: string; text: string; value: string }[] = [];
        if (tempLinkText && tempLinkUrl) buttons.push({ type: 'url', text: tempLinkText, value: tempLinkUrl });
        if (tempPhoneText && tempPhoneNumber) buttons.push({ type: 'phone', text: tempPhoneText, value: tempPhoneNumber });
        setCtaButtons(buttons);
        setQuickReplyButtons([]);
        setShowLinkModal(false);
        if (buttons.length > 0) {
            setMessages(prev => [...prev, { id: Date.now().toString(), type: 'ai', content: `✅ Added CTA button${buttons.length > 1 ? 's' : ''}: ${buttons.map(b => `"${b.text}"`).join(', ')}`, suggestions: ['Perfect! →'] }]);
        }
    };

    // Helper for initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const toggleContact = (id: string) => { setSelectedGroup(null); setSelectedContacts(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]); };
    const selectGroup = (id: string) => { setSelectedContacts([]); setSelectedGroup(selectedGroup === id ? null : id); };
    const canProceed = selectedGroup !== null || selectedContacts.length > 0;
    const filteredContacts = recipients.filter(r => r.name?.toLowerCase().includes(contactSearch.toLowerCase()) || r.area?.toLowerCase().includes(contactSearch.toLowerCase()));

    const formatPreview = (msg: string) => {
        // First, replace numbered template variables using mappings
        let preview = variableMappings.length > 0 ? replaceVariablesInPreview(msg, variableMappings) : msg;
        // Then replace text-based variables (from manual compose)
        preview = preview.replace(/\{\{name\}\}/g, 'John').replace(/\{\{company\}\}/g, 'Centy');
        // Strip markdown bold for display
        preview = preview.replace(/\*([^*]+)\*/g, '$1');
        return preview;
    };

    const resetDemo = () => {
        setView('home'); setMessages([]); setCampaignMessage(''); setSelectedContacts([]);
        setSelectedGroup(null); setSendingState('idle'); setSentCount(0);
        setMetrics({ delivered: 0, read: 0, replied: 0 }); setInput(''); setContactSearch('');
        setHeaderImage(null); setQuickReplyButtons([]); setCtaButtons([]); setFooterText('');
        setVariableMappings([]);
    };

    const handleFinalSend = async () => {
        if (!partnerId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Partner information not available' });
            return;
        }

        setSendingState('sending');

        try {
            const recipientType = selectedGroup === 'all' ? 'all' : (selectedGroup ? 'group' : 'individual');
            const contactIds = getRecipientIds();
            const groupIds = selectedGroup && selectedGroup !== 'all' ? [selectedGroup] : undefined;

            // 1. Create campaign (include variable mappings for audit trail)
            const campaignResult = await createCampaignAction(partnerId, userId || 'unknown', {
                title: campaignMessage.slice(0, 50) + '...',
                channel,
                status: 'draft',
                message: campaignMessage,
                hasImage: !!headerImage,
                buttons: [...quickReplyButtons, ...ctaButtons.map(b => b.text)],
                recipientType,
                groupIds,
                contactIds: recipientType === 'individual' ? contactIds : undefined,
                recipientCount: getRecipientCount(),
            } as any);

            if (!campaignResult.success) {
                throw new Error('Failed to create campaign');
            }

            const campaignId = (campaignResult as any).campaign?.id;

            // 2. Send campaign with variable mappings for per-contact personalization
            const sendResult = await sendBroadcastCampaignAction(
                partnerId,
                campaignId,
                channel,
                campaignMessage,
                headerImage || undefined,
                recipientType,
                recipientType === 'individual' ? contactIds : undefined,
                groupIds,
                variableMappings.length > 0 ? variableMappings : undefined
            );

            if (sendResult.success) {
                // Wait for animation to finish
                setTimeout(() => { setSendingState('complete'); setView('success'); }, 2000);
            } else {
                setSendingState('idle');
                toast({ variant: 'destructive', title: 'Send Failed', description: sendResult.message });
            }

        } catch (error: any) {
            console.error('Error sending campaign:', error);
            setSendingState('idle');
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to send campaign' });
        }
    };

    const getEnhancementStatus = () => ({
        image: !!headerImage,
        buttons: quickReplyButtons.length > 0 || ctaButtons.length > 0,
        link: ctaButtons.some(b => b.type === 'url'),
        personalize: campaignMessage.includes('{{'),
    });

    const enhancements = getEnhancementStatus();
    const stepIndex = ['home', 'studio', 'recipients', 'review', 'success'].indexOf(view);

    const Modal = ({ show, onClose, title, children }: any) => {
        if (!show) return null;
        return (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onClose}>
                <div style={{ background: '#fff', borderRadius: 16, width: 420, maxHeight: '80vh', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
                    <div style={{ padding: '18px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 16, fontWeight: 600, color: '#111' }}>{title}</span>
                        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#f5f5f5', cursor: 'pointer', fontSize: 14 }}>✕</button>
                    </div>
                    <div style={{ padding: 20, maxHeight: '60vh', overflow: 'auto' }}>{children}</div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif', background: '#fff' }}>

            {/* Sidebar */}
            <div style={{ width: 260, borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column', background: '#fafafa' }}>
                <div style={{ padding: 20, borderBottom: '1px solid #eee', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #111 0%, #333 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16 }}>⚡</div>
                        <div>
                            <div style={{ fontSize: 17, fontWeight: 700, color: '#111', letterSpacing: '-0.3px' }}>Pingbox</div>
                            <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>Broadcast Studio</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, padding: 4, background: '#f0f0f0', borderRadius: 10 }}>
                        {['whatsapp', 'telegram'].map(ch => (
                            <button key={ch} onClick={() => setChannel(ch as any)} style={{
                                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                                background: channel === ch ? '#fff' : 'transparent',
                                boxShadow: channel === ch ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer',
                            }}>
                                <span style={{ fontSize: 14 }}>{ch === 'whatsapp' ? '💬' : '✈️'}</span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: channel === ch ? '#111' : '#888', marginLeft: 4 }}>{ch === 'whatsapp' ? 'WhatsApp' : 'Telegram'}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>Templates</div>
                    {availableTemplates.length > 0 ? availableTemplates.map(t => (
                        <button key={t.id} onClick={() => startStudio(t)} style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 6,
                            borderRadius: 10, border: '1px solid #eee', background: '#fff', width: '100%',
                            cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s ease',
                        }} onMouseOver={e => { e.currentTarget.style.borderColor = '#ccc'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
                                {t.category === 'MARKETING' ? '📢' : t.category === 'UTILITY' ? '🔔' : '🔑'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{t.name}</div>
                                <div style={{ fontSize: 11, color: '#888' }}>{t.category.toLowerCase()}</div>
                            </div>
                        </button>
                    )) : (
                        <div style={{ fontSize: 12, color: '#999', fontStyle: 'italic', padding: 10 }}>No templates available</div>
                    )}
                </div>

                <div style={{ padding: 16, borderTop: '1px solid #eee', background: '#fff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 600 }}>
                            {getInitials(user?.displayName || 'Unknown User')}
                        </div>
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{user?.displayName || 'User'}</div>
                            <div style={{ fontSize: 11, color: '#888' }}>{currentWorkspace?.role || 'Partner'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f5f5f7' }}>

                {/* Header */}
                <div style={{ height: 64, background: '#fff', borderBottom: '1px solid #eee', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {['Start', 'Create', 'Audience', 'Review', 'Done'].map((label, idx) => (
                            <React.Fragment key={label}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: idx === stepIndex ? '#f0f0f0' : 'transparent' }}>
                                    <div style={{
                                        width: 22, height: 22, borderRadius: 6, fontSize: 11, fontWeight: 600,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: idx < stepIndex ? '#111' : idx === stepIndex ? '#fff' : '#f5f5f5',
                                        color: idx < stepIndex ? '#fff' : idx === stepIndex ? '#111' : '#bbb',
                                        border: idx === stepIndex ? '2px solid #111' : idx < stepIndex ? 'none' : '1px solid #ddd',
                                    }}>
                                        {idx < stepIndex ? '✓' : idx + 1}
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: idx === stepIndex ? 600 : 500, color: idx <= stepIndex ? '#111' : '#999' }}>{label}</span>
                                </div>
                                {idx < 4 && <div style={{ width: 16, height: 2, borderRadius: 1, background: idx < stepIndex ? '#111' : '#e0e0e0' }} />}
                            </React.Fragment>
                        ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, background: isWA ? '#dcf8c6' : '#e3f2fd' }}>
                        <span style={{ fontSize: 12 }}>{isWA ? '💬' : '✈️'}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: isWA ? '#25D366' : '#0088cc' }}>{isWA ? 'WhatsApp' : 'Telegram'}</span>
                    </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>

                    {/* HOME */}
                    {view === 'home' && (
                        <div style={{ maxWidth: 480, margin: '60px auto 0', textAlign: 'center' }}>
                            <div style={{ width: 80, height: 80, borderRadius: 24, background: 'linear-gradient(135deg, #111 0%, #333 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', fontSize: 36 }}>📢</div>
                            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111', marginBottom: 12 }}>Create a Broadcast</h1>
                            <p style={{ fontSize: 15, color: '#666', marginBottom: 36, lineHeight: 1.7, maxWidth: 360, margin: '0 auto 36px' }}>
                                Reach your clients with rich media messages — images, buttons, and personalized content.
                            </p>
                            <div className="flex justify-center gap-4 mb-8">
                                <button onClick={() => startStudio()} style={{
                                    padding: '16px 32px', background: '#111', color: '#fff', borderRadius: 14, fontSize: 15, fontWeight: 600,
                                    border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10,
                                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                                }}>
                                    <span>✨</span> Start with AI
                                </button>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="h-[56px] rounded-[14px] px-8 text-[15px] font-semibold">
                                            📚 Browse Library
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-6xl h-[80vh] flex flex-col p-0">
                                        <ScrollArea className="flex-1 p-6">
                                            {partnerId && <PartnerTemplateLibrary templates={availableTemplates} partnerId={partnerId} partnerIndustries={partnerIndustries} />}
                                        </ScrollArea>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="text-left">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">My Templates</h3>
                                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                    {partnerTemplates.length > 0 ? (
                                        partnerTemplates.slice(0, 4).map(t => (
                                            <button key={t.id} onClick={() => startStudio(t)} style={{
                                                padding: '10px 16px', background: '#fff', border: '1px solid #e5e5e5', borderRadius: 10, fontSize: 13, color: '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                            }}>
                                                {t.category === 'MARKETING' ? '📢' : t.category === 'UTILITY' ? '🔔' : '🔑'} {t.name}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="text-sm text-gray-400 italic">No templates saved yet. Browse Library to add some.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STUDIO */}
                    {view === 'studio' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, height: 'calc(100vh - 160px)', maxWidth: 1050, margin: '0 auto' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {/* Chat */}
                                <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e5e5', display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16 }}>✨</div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>AI Assistant</div>
                                            <div style={{ fontSize: 11, color: '#888' }}>Describe your campaign</div>
                                        </div>
                                    </div>

                                    <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
                                        {messages.map((msg) => (
                                            <div key={msg.id} style={{ marginBottom: 16, display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start' }}>
                                                <div style={{
                                                    maxWidth: '85%', padding: '14px 18px', borderRadius: msg.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                    background: msg.type === 'user' ? '#111' : '#f8f8f8', color: msg.type === 'user' ? '#fff' : '#111',
                                                }}>
                                                    <div style={{ fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                                                    {msg.suggestions && msg.suggestions.length > 0 && (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                                                            {msg.suggestions.map((s: string, i: number) => (
                                                                <button key={i} onClick={() => handleSuggestionClick(s)} style={{
                                                                    padding: '9px 14px', borderRadius: 10, border: 'none', background: '#fff',
                                                                    color: '#111', fontSize: 12, fontWeight: 500, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                                                }}>
                                                                    {s}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {isTyping && !currentAiMessage && <TypingIndicator />}
                                        {currentAiMessage && (
                                            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-start' }}>
                                                <div style={{ maxWidth: '85%', padding: '14px 18px', borderRadius: '18px 18px 18px 4px', background: '#f8f8f8' }}>
                                                    <div style={{ fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap', color: '#111' }}>
                                                        {typedResponse}<span style={{ animation: 'blink 0.7s infinite', opacity: 0.7 }}>|</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    <div style={{ padding: 16, borderTop: '1px solid #eee', background: '#fafafa' }}>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <input ref={inputRef} type="text" placeholder="Describe your campaign..." value={input}
                                                onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
                                                style={{ flex: 1, height: 48, padding: '0 18px', border: '1px solid #e0e0e0', borderRadius: 12, fontSize: 14, outline: 'none', background: '#fff' }}
                                                onFocus={e => e.target.style.borderColor = '#111'} onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
                                            <button onClick={handleSend} style={{ width: 48, height: 48, borderRadius: 12, border: 'none', background: '#111', color: '#fff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↑</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Variable Mapping Display */}
                                {campaignMessage && variableMappings.length > 0 && (
                                    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e5e5', padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', marginBottom: 10 }}>Message Personalization</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            {variableMappings.map(m => (
                                                <div key={m.variable} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#f9f9f9', borderRadius: 8 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#667eea', background: '#eff0ff', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{m.variable}</span>
                                                    <span style={{ fontSize: 12, color: '#bbb' }}>&rarr;</span>
                                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>{m.label}</span>
                                                    <span style={{ fontSize: 11, color: '#999', marginLeft: 'auto' }}>&ldquo;{m.previewValue}&rdquo;</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Add to Campaign Panel */}
                                {campaignMessage && (
                                    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e5e5', padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', marginBottom: 12 }}>Add to Campaign</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                                            {[
                                                { id: 'image', icon: '🖼️', label: 'Image', done: enhancements.image, onClick: () => setShowImageModal(true) },
                                                { id: 'buttons', icon: '▶️', label: 'Buttons', done: enhancements.buttons, onClick: () => setShowButtonModal(true) },
                                                { id: 'link', icon: '🔗', label: 'Link', done: enhancements.link, onClick: () => setShowLinkModal(true) },
                                                { id: 'personalize', icon: '@', label: 'Personalize', done: enhancements.personalize, onClick: () => setShowVariableModal(true) },
                                            ].map(item => (
                                                <button key={item.id} onClick={item.onClick} style={{
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 10px',
                                                    borderRadius: 12, border: item.done ? '2px solid #22c55e' : '1px solid #e5e5e5',
                                                    background: item.done ? '#f0fdf4' : '#fff', cursor: 'pointer', transition: 'all 0.15s ease',
                                                }}>
                                                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                                                    <span style={{ fontSize: 11, fontWeight: 600, color: item.done ? '#22c55e' : '#666' }}>{item.label}</span>
                                                    {item.done && <span style={{ fontSize: 10, color: '#22c55e' }}>✓</span>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Preview */}
                            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e5e5', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '14px 18px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Live Preview</span>
                                    <span style={{ fontSize: 11, color: '#888' }}>{isWA ? 'WhatsApp' : 'Telegram'}</span>
                                </div>
                                <div style={{ padding: 14, flex: 1, overflow: 'auto' }}>
                                    <div style={{ borderRadius: 14, overflow: 'hidden', background: '#efeae2', border: '1px solid #e0dcd4' }}>
                                        <div style={{ padding: '10px 14px', background: isWA ? '#075e54' : '#0088cc', display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600 }}>C</div>
                                            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{currentWorkspace?.partnerName || 'Centy'}</span>
                                        </div>
                                        <div style={{ padding: 12, minHeight: 280, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h60v60H0z\' fill=\'%23efeae2\'/%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'1\' fill=\'%23d4cfc7\'/%3E%3C/svg%3E")' }}>
                                            {campaignMessage ? (
                                                <div style={{ maxWidth: '95%', marginLeft: 'auto' }}>
                                                    {headerImage && (
                                                        <div style={{ borderRadius: '12px 12px 0 0', overflow: 'hidden', marginBottom: -4 }}>
                                                            <img src={headerImage} alt="Header" style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                                                        </div>
                                                    )}
                                                    <div style={{ background: '#dcf8c6', borderRadius: headerImage ? '0 0 12px 12px' : '12px 12px 4px 12px', padding: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
                                                        <div style={{ fontSize: 13, color: '#111', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{formatPreview(campaignMessage)}</div>
                                                        {footerText && <div style={{ fontSize: 11, color: '#667', marginTop: 8, fontStyle: 'italic' }}>{footerText}</div>}
                                                        <div style={{ fontSize: 10, color: '#667', textAlign: 'right', marginTop: 8 }}>10:42 AM ✓✓</div>
                                                    </div>
                                                    {quickReplyButtons.length > 0 && (
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                                            {quickReplyButtons.map((btn, i) => (
                                                                <div key={i} style={{ flex: '1 1 auto', minWidth: '45%', padding: '10px 12px', background: '#fff', borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 500, color: '#0088cc', border: '1px solid #e0dcd4' }}>{btn}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {ctaButtons.length > 0 && (
                                                        <div style={{ marginTop: 8 }}>
                                                            {ctaButtons.map((btn, i) => (
                                                                <div key={i} style={{ padding: '12px', background: '#fff', borderRadius: 8, textAlign: 'center', fontSize: 13, fontWeight: 500, color: '#0088cc', border: '1px solid #e0dcd4', marginTop: i > 0 ? 6 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                                    {btn.type === 'url' ? '🔗' : '📞'} {btn.text}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div style={{ textAlign: 'center', paddingTop: 80, color: '#999' }}>
                                                    <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.5 }}>💬</div>
                                                    <div style={{ fontSize: 12 }}>Your message will appear here</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {campaignMessage && (
                                    <div style={{ padding: '0 14px 14px' }}>
                                        <div style={{ padding: 14, background: '#f8f8f8', borderRadius: 10 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                <span style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>Message Score</span>
                                                <span style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>{50 + (enhancements.image ? 15 : 0) + (enhancements.buttons ? 15 : 0) + (enhancements.personalize ? 14 : 0) + (enhancements.link ? 6 : 0)}/100</span>
                                            </div>
                                            <div style={{ height: 6, background: '#e5e5e5', borderRadius: 3, overflow: 'hidden' }}>
                                                <div style={{ width: `${50 + (enhancements.image ? 15 : 0) + (enhancements.buttons ? 15 : 0) + (enhancements.personalize ? 14 : 0) + (enhancements.link ? 6 : 0)}%`, height: '100%', background: 'linear-gradient(90deg, #22c55e, #16a34a)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                                            </div>
                                            <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                                                {[{ label: 'Image', done: enhancements.image }, { label: 'Buttons', done: enhancements.buttons }, { label: 'Personalized', done: enhancements.personalize }, { label: 'CTA', done: enhancements.link }].map(item => (
                                                    <div key={item.label} style={{ fontSize: 11, color: item.done ? '#22c55e' : '#bbb' }}>{item.done ? '✓' : '○'} {item.label}</div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Select Recipient CTA in Right Panel */}
                                        <div style={{ marginTop: 14 }}>
                                            <button onClick={() => setView('recipients')} style={{
                                                width: '100%', padding: '14px', background: '#111', color: '#fff',
                                                borderRadius: 12, fontSize: 14, fontWeight: 600, border: 'none',
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }}>
                                                Select Recipients <span>→</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* RECIPIENTS */}
                    {view === 'recipients' && (
                        <div style={{ maxWidth: 800, margin: '0 auto' }}>
                            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 8 }}>Choose Your Audience</h2>
                                <p style={{ fontSize: 14, color: '#888' }}>Select a group or pick individual contacts</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
                                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e5e5', padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', marginBottom: 12 }}>Quick Select</div>
                                    {groups.map(g => (
                                        <button key={g.id} onClick={() => selectGroup(g.id)} style={{
                                            display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 16px', marginBottom: 8,
                                            borderRadius: 12, border: selectedGroup === g.id ? '2px solid #111' : '1px solid #eee',
                                            background: selectedGroup === g.id ? '#f5f5f5' : '#fff', cursor: 'pointer', textAlign: 'left',
                                        }}>
                                            <span style={{ fontSize: 18 }}>{g.icon}</span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{g.name}</div>
                                                <div style={{ fontSize: 12, color: '#888' }}>{g.count} contacts</div>
                                            </div>
                                            {selectedGroup === g.id && <span style={{ fontSize: 16, color: '#111' }}>✓</span>}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e5e5', padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>Or Select Individually</span>
                                        <button onClick={() => { setSelectedGroup(null); setSelectedContacts(recipients.map(r => r.id)); }} style={{ fontSize: 12, color: '#666', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Select all</button>
                                    </div>
                                    <input type="text" placeholder="Search by name or area..." value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                                        style={{ width: '100%', padding: '12px 14px', border: '1px solid #e5e5e5', borderRadius: 10, fontSize: 13, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxHeight: 320, overflow: 'auto' }}>
                                        {isLoadingRecipients ? (
                                            <div className="col-span-2 text-center py-8 text-gray-400">Loading contacts...</div>
                                        ) : filteredContacts.length === 0 ? (
                                            <div className="col-span-2 text-center py-8 text-gray-400">No contacts found</div>
                                        ) : (
                                            filteredContacts.map(r => (
                                                <button key={r.id} onClick={() => toggleContact(r.id)} onMouseEnter={() => setHoveredContact(r.id)} onMouseLeave={() => setHoveredContact(null)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 10, padding: '12px', borderRadius: 12, textAlign: 'left',
                                                        border: selectedContacts.includes(r.id) ? '2px solid #111' : hoveredContact === r.id ? '1px solid #ccc' : '1px solid #eee',
                                                        background: selectedContacts.includes(r.id) ? '#f8f8f8' : '#fff', cursor: 'pointer',
                                                    }}>
                                                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{r.avatar}</div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</div>
                                                        <div style={{ fontSize: 11, color: '#888' }}>{r.area} • {r.tag}</div>
                                                    </div>
                                                    {selectedContacts.includes(r.id) && <span style={{ fontSize: 14, color: '#22c55e' }}>✓</span>}
                                                </button>
                                            )))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: 24, padding: '18px 24px', background: '#fff', borderRadius: 14, border: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{getRecipientCount()} recipients selected</div>
                                    <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{selectedGroup === 'all' ? 'All Contacts' : (selectedGroup ? groups.find(g => g.id === selectedGroup)?.name : `${selectedContacts.length} individual contacts`)}</div>
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button onClick={() => setView('studio')} style={{ padding: '12px 20px', background: '#fff', border: '1px solid #ddd', borderRadius: 10, fontSize: 14, fontWeight: 500, color: '#666', cursor: 'pointer' }}>← Back</button>
                                    <button onClick={() => canProceed && setView('review')} disabled={!canProceed}
                                        style={{ padding: '12px 28px', background: canProceed ? '#111' : '#ccc', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600, border: 'none', cursor: canProceed ? 'pointer' : 'not-allowed' }}>
                                        Continue →
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* REVIEW */}
                    {view === 'review' && (
                        <div style={{ maxWidth: 640, margin: '0 auto' }}>
                            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 8 }}>Ready to send?</h2>
                                <p style={{ fontSize: 15, color: '#666' }}>Review your campaign details before sending</p>
                            </div>

                            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e5e5', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <div style={{ padding: 24, borderBottom: '1px solid #eee' }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>Message Preview</div>
                                    <div style={{ background: '#f8f8f8', padding: 16, borderRadius: 12, fontSize: 14, color: '#111', lineHeight: 1.6, whiteSpace: 'pre-wrap', border: '1px solid #eee' }}>
                                        {formatPreview(campaignMessage)}
                                    </div>
                                    {variableMappings.length > 0 && (
                                        <div style={{ marginTop: 8, fontSize: 11, color: '#888', fontStyle: 'italic' }}>
                                            Variables will be replaced with each recipient&apos;s data when sent.
                                        </div>
                                    )}
                                    {(headerImage || ctaButtons.length > 0) && (
                                        <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                                            {headerImage && <div style={{ fontSize: 12, padding: '4px 10px', background: '#f0fdf4', color: '#16a34a', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>🖼️ Image attached</div>}
                                            {ctaButtons.length > 0 && <div style={{ fontSize: 12, padding: '4px 10px', background: '#eff6ff', color: '#2563eb', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>🔗 Links/Buttons included</div>}
                                        </div>
                                    )}
                                </div>
                                <div style={{ padding: 24, background: '#fafafa' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <span style={{ fontSize: 14, color: '#666' }}>Recipients</span>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{getRecipientCount()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <span style={{ fontSize: 14, color: '#666' }}>Channel</span>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: '#111', display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {isWA ? <span style={{ color: '#25D366' }}>💬 WhatsApp</span> : <span style={{ color: '#0088cc' }}>✈️ Telegram</span>}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                                        <span style={{ fontSize: 14, color: '#666' }}>Cost Estimate</span>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Free</span>
                                    </div>

                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button onClick={() => setView('recipients')} style={{ flex: 1, padding: '14px', background: '#fff', border: '1px solid #ddd', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#666', cursor: 'pointer' }}>Edit</button>
                                        <button onClick={handleFinalSend} disabled={sendingState === 'sending'} style={{
                                            flex: 2, padding: '14px', background: sendingState === 'sending' ? '#333' : '#111', color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 600,
                                            border: 'none', cursor: sendingState === 'sending' ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                        }}>
                                            {sendingState === 'sending' ? (
                                                <><span>⏳</span> Sending...</>
                                            ) : (
                                                <><span>🚀</span> Send Campaign</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SUCCESS */}
                    {view === 'success' && (
                        <div style={{ maxWidth: 540, margin: '60px auto 0', textAlign: 'center' }}>
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 24px', boxShadow: '0 0 0 10px #f0fdf4' }}>✓</div>
                            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#111', marginBottom: 12 }}>Campaign Sent!</h2>
                            <p style={{ fontSize: 16, color: '#666', marginBottom: 40 }}>Your message is being delivered to {getRecipientCount()} recipients.</p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
                                {[
                                    { label: 'Delivered', value: metrics.delivered, color: '#22c55e' },
                                    { label: 'Read', value: metrics.read, color: '#0ea5e9' },
                                    { label: 'Replies', value: metrics.replied, color: '#8b5cf6' },
                                ].map((stat, i) => (
                                    <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #eee', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                        <div style={{ fontSize: 24, fontWeight: 700, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
                                        <div style={{ fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>{stat.label}</div>
                                    </div>
                                ))}
                            </div>

                            <button onClick={resetDemo} style={{ padding: '14px 28px', background: '#111', color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                                Start New Campaign
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* MODALS */}
            <Modal show={showImageModal} onClose={() => setShowImageModal(false)} title="Select Image">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {sampleImages.map((img, i) => (
                        <div key={i} onClick={() => { setHeaderImage(img.url); setShowImageModal(false); setMessages(prev => [...prev, { id: Date.now().toString(), type: 'ai', content: `Added image: ${img.label}`, suggestions: ['Great! →'] }]); }}
                            style={{ borderRadius: 10, overflow: 'hidden', cursor: 'pointer', position: 'relative', border: headerImage === img.url ? '3px solid #111' : '1px solid #eee' }}>
                            <img src={img.url} alt={img.label} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                            <div style={{ padding: 8, fontSize: 12, fontWeight: 500, color: '#333', background: '#fff' }}>{img.label}</div>
                        </div>
                    ))}
                    <div style={{ border: '2px dashed #ddd', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 155, cursor: 'pointer', background: '#fafafa' }}>
                        <span style={{ fontSize: 24, marginBottom: 8, color: '#ccc' }}>+</span>
                        <span style={{ fontSize: 13, color: '#888' }}>Upload New</span>
                    </div>
                </div>
            </Modal>

            <Modal show={showVariableModal} onClose={() => setShowVariableModal(false)} title="Insert Variable">
                {variableMappings.length > 0 ? (
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#888', marginBottom: 12 }}>TEMPLATE VARIABLES</div>
                        <div style={{ display: 'grid', gap: 8 }}>
                            {variableMappings.map(m => (
                                <div key={m.variable} style={{
                                    display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10,
                                    border: '1px solid #eee', background: '#f9f9f9',
                                }}>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#667eea', background: '#eff0ff', padding: '4px 8px', borderRadius: 6 }}>{m.variable}</span>
                                    <span style={{ fontSize: 13, color: '#888' }}>&rarr;</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{m.label}</div>
                                        <div style={{ fontSize: 11, color: '#888' }}>Preview: &ldquo;{m.previewValue}&rdquo;</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 12, fontStyle: 'italic' }}>
                            These variables are auto-mapped from the template and will be replaced with each recipient&apos;s data at send time.
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {defaultVariableOptions.map(v => (
                            <button key={v.token} onClick={() => insertVariable(v)} style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10,
                                border: '1px solid #eee', background: '#fff', cursor: 'pointer', textAlign: 'left',
                            }}>
                                <span style={{ fontSize: 20 }}>{v.icon}</span>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{v.label}</div>
                                    <div style={{ fontSize: 11, color: '#888' }}>Example: {v.preview}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </Modal>

            <Modal show={showButtonModal} onClose={() => setShowButtonModal(false)} title="Add Quick Replies">
                <div>
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Presets</div>
                        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                            {quickReplyPresets.map((p, i) => (
                                <button key={i} onClick={() => setTempQuickReplies([...p.buttons])} style={{
                                    padding: '6px 12px', borderRadius: 8, border: '1px solid #eee', background: '#f9f9f9', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap'
                                }}>{p.label}</button>
                            ))}
                        </div>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Button Text (Max 20 chars)</div>
                    {[0, 1, 2].map(i => (
                        <input key={i} type="text" placeholder={`Button ${i + 1}`} value={tempQuickReplies[i]} maxLength={20}
                            onChange={e => { const newReplies = [...tempQuickReplies]; newReplies[i] = e.target.value; setTempQuickReplies(newReplies); }}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }} />
                    ))}
                    <button onClick={saveQuickReplies} style={{ width: '100%', padding: 12, background: '#111', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 10 }}>
                        Save Buttons
                    </button>
                </div>
            </Modal>

            <Modal show={showLinkModal} onClose={() => setShowLinkModal(false)} title="Add Footer Button">
                <div style={{ display: 'flex', background: '#f0f0f0', padding: 4, borderRadius: 8, marginBottom: 20 }}>
                    <button onClick={() => setButtonType('quick')} style={{ flex: 1, padding: 8, borderRadius: 6, border: 'none', background: buttonType === 'quick' ? '#fff' : 'transparent', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Call Action</button>
                    <button onClick={() => setButtonType('url')} style={{ flex: 1, padding: 8, borderRadius: 6, border: 'none', background: buttonType === 'url' ? '#fff' : 'transparent', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Visit Website</button>
                </div>

                {buttonType === 'url' ? (
                    <>
                        <input type="text" placeholder="Button Label (e.g. Visit Website)" value={tempLinkText} onChange={e => setTempLinkText(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
                        <input type="text" placeholder="URL (https://...)" value={tempLinkUrl} onChange={e => setTempLinkUrl(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
                    </>
                ) : (
                    <>
                        <input type="text" placeholder="Button Label (e.g. Call Now)" value={tempPhoneText} onChange={e => setTempPhoneText(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
                        <input type="text" placeholder="Phone Number" value={tempPhoneNumber} onChange={e => setTempPhoneNumber(e.target.value)}
                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 14, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
                    </>
                )}

                <button onClick={saveCtaButtons} style={{ width: '100%', padding: 12, background: '#111', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 10 }}>
                    Add Button
                </button>
            </Modal>

        </div>
    );
}
