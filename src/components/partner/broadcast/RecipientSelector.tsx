"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import type { Contact } from '@/lib/types';
import { getBroadcastGroupsAction } from '@/actions/broadcast-actions';

interface BroadcastGroup {
    id: string;
    name: string;
    description?: string;
    contactIds: string[];
}

interface RecipientSelectorProps {
    channel: 'whatsapp' | 'telegram';
    partnerId: string;
    onBack: () => void;
    onContinue: (data: {
        recipientType: 'group' | 'individual' | 'all';
        groupIds?: string[];
        contactIds?: string[];
        recipientCount: number;
    }) => void;
}

export default function RecipientSelector({
    channel,
    partnerId,
    onBack,
    onContinue,
}: RecipientSelectorProps) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [groups, setGroups] = useState<BroadcastGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const isWA = channel === 'whatsapp';

    // Load contacts from Firestore
    useEffect(() => {
        if (!partnerId) return;

        const contactsQuery = query(collection(db, `partners/${partnerId}/contacts`));

        const unsubscribe = onSnapshot(contactsQuery, (snapshot) => {
            const contactsData = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                } as Contact))
                .filter(c => c.phone && c.phone.trim() !== ''); // Must have phone to receive message

            setContacts(contactsData);
            setIsLoading(false);
        }, (error) => {
            console.error('Error loading contacts:', error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [partnerId]);

    // Load broadcast groups
    useEffect(() => {
        if (!partnerId) return;

        const loadGroups = async () => {
            const result = await getBroadcastGroupsAction(partnerId);
            if (result.success && result.groups) {
                setGroups(result.groups as any);
            }
        };

        loadGroups();
    }, [partnerId]);

    // Filter contacts by search
    const filteredContacts = search
        ? contacts.filter(c =>
            c.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.phone?.includes(search)
        )
        : contacts;

    // Calculate recipient count
    const calculateRecipientCount = () => {
        if (selectedGroup === 'all') {
            return contacts.length;
        } else if (selectedGroup) {
            const group = groups.find(g => g.id === selectedGroup);
            return group?.contactIds?.length || 0;
        } else {
            return selectedContacts.length;
        }
    };

    const recipientCount = calculateRecipientCount();

    // Handle group selection
    const toggleGroup = (id: string) => {
        setSelectedContacts([]);
        setSelectedGroup(selectedGroup === id ? null : id);
    };

    // Handle individual contact selection
    const toggleContact = (id: string) => {
        setSelectedGroup(null);
        setSelectedContacts(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    // Handle continue
    const handleContinue = () => {
        if (recipientCount === 0) return;

        if (selectedGroup === 'all') {
            onContinue({
                recipientType: 'all',
                recipientCount,
            });
        } else if (selectedGroup) {
            onContinue({
                recipientType: 'group',
                groupIds: [selectedGroup],
                recipientCount,
            });
        } else {
            onContinue({
                recipientType: 'individual',
                contactIds: selectedContacts,
                recipientCount,
            });
        }
    };

    // Generate initials from name
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Create "All Contacts" pseudo-group
    const allContactsGroup = {
        id: 'all',
        name: 'All Contacts',
        contactIds: contacts.map(c => c.id),
    };

    const allGroups = [allContactsGroup, ...groups];

    return (
        <div className="h-full overflow-y-auto bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-500"
                        >
                            ←
                        </button>
                        <div>
                            <h1 className="font-semibold text-gray-900 text-sm">Select Recipients</h1>
                            <p className="text-xs text-gray-500">{recipientCount} selected</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4">
                <div className="grid lg:grid-cols-2 gap-4">
                    {/* Groups */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                            Groups
                        </div>
                        {isLoading ? (
                            <div className="text-center py-8 text-gray-400">Loading...</div>
                        ) : (
                            <div className="space-y-2">
                                {allGroups.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => toggleGroup(g.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${selectedGroup === g.id
                                            ? `${isWA ? 'bg-emerald-600' : 'bg-sky-600'} text-white`
                                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        <span className="font-medium text-sm">{g.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`text-sm ${selectedGroup === g.id ? 'text-white/80' : 'text-gray-400'
                                                    }`}
                                            >
                                                {g.contactIds?.length || 0}
                                            </span>
                                            {selectedGroup === g.id && <span>✓</span>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Individual Contacts */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Individual
                            </span>
                            <button
                                onClick={() => {
                                    setSelectedGroup(null);
                                    setSelectedContacts(contacts.map(c => c.id));
                                }}
                                className="text-[10px] text-violet-600 hover:text-violet-700"
                            >
                                Select all
                            </button>
                        </div>
                        <div className="relative mb-3">
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm pl-9 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                🔍
                            </span>
                        </div>
                        <div className="space-y-1 max-h-52 overflow-y-auto">
                            {isLoading ? (
                                <div className="text-center py-8 text-gray-400">Loading contacts...</div>
                            ) : filteredContacts.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    {search ? 'No contacts found' : 'No contacts available'}
                                </div>
                            ) : (
                                filteredContacts.map(c => {
                                    const sel = selectedContacts.includes(c.id);
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => toggleContact(c.id)}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${sel ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${sel ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'
                                                    }`}
                                            >
                                                {getInitials(c.name || '?')}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div
                                                    className={`text-sm font-medium ${sel ? 'text-white' : 'text-gray-900'
                                                        }`}
                                                >
                                                    {c.name}
                                                </div>
                                                <div
                                                    className={`text-[10px] ${sel ? 'text-white/60' : 'text-gray-400'
                                                        }`}
                                                >
                                                    {c.phone}
                                                </div>
                                            </div>
                                            {sel && <span className="text-sm">✓</span>}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleContinue}
                        disabled={recipientCount === 0}
                        className={`px-6 py-3 rounded-xl text-white font-medium text-sm disabled:opacity-40 transition-all ${isWA ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                            }`}
                    >
                        Continue with {recipientCount} recipients →
                    </button>
                </div>
            </div>
        </div>
    );
}
