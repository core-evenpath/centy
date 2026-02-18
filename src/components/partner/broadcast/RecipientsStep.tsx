"use client";

import React, { useState, useMemo } from 'react';
import { Contact } from '@/lib/types';

interface Group {
    id: string;
    name: string;
    count: number;
    icon?: string;
}

interface RecipientsStepProps {
    contacts: Contact[];
    groups: Group[];
    recipientType: 'all' | 'group' | 'individual';
    setRecipientType: (type: 'all' | 'group' | 'individual') => void;
    selectedGroupId: string;
    setSelectedGroupId: (id: string) => void;
    selectedContactIds: string[];
    setSelectedContactIds: (ids: string[]) => void;
}

export function RecipientsStep({
    contacts,
    groups,
    recipientType,
    setRecipientType,
    selectedGroupId,
    setSelectedGroupId,
    selectedContactIds,
    setSelectedContactIds,
}: RecipientsStepProps) {
    const [search, setSearch] = useState('');

    const contactsWithPhone = useMemo(() =>
        contacts.filter(c => c.phone),
        [contacts]);

    const filteredContacts = useMemo(() =>
        contactsWithPhone.filter(c =>
            c.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.phone?.includes(search)
        ),
        [contactsWithPhone, search]);

    const toggleContact = (id: string) => {
        setSelectedContactIds(
            selectedContactIds.includes(id)
                ? selectedContactIds.filter(x => x !== id)
                : [...selectedContactIds, id]
        );
        setRecipientType('individual');
    };

    const selectAll = () => {
        setRecipientType('all');
        setSelectedGroupId('');
        setSelectedContactIds([]);
    };

    const selectGroup = (groupId: string) => {
        setRecipientType('group');
        setSelectedGroupId(groupId);
        setSelectedContactIds([]);
    };

    const recipientCount = recipientType === 'all'
        ? contactsWithPhone.length
        : recipientType === 'group'
            ? groups.find(g => g.id === selectedGroupId)?.count || 0
            : selectedContactIds.length;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Select Recipients</h3>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full">
                        <span className="text-sm font-bold text-indigo-600">{recipientCount}</span>
                        <span className="text-xs text-indigo-500">recipients</span>
                    </div>
                </div>

                {/* All Contacts */}
                <button
                    onClick={selectAll}
                    className={`w-full p-4 rounded-xl border-2 transition-all mb-3 flex items-center gap-4 text-left ${recipientType === 'all'
                            ? 'border-indigo-500 bg-indigo-50/60'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                >
                    <span className="text-2xl">📋</span>
                    <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900">All Contacts</div>
                        <div className="text-xs text-gray-500">{contactsWithPhone.length} contacts with phone numbers</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${recipientType === 'all' ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-gray-300'
                        }`}>
                        {recipientType === 'all' && <span className="text-[10px]">✓</span>}
                    </div>
                </button>

                {/* Groups */}
                {groups.length > 0 && (
                    <div className="space-y-2 mb-3">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Groups</div>
                        <div className="grid grid-cols-2 gap-2">
                            {groups.filter(g => g.id !== 'all').map(group => (
                                <button
                                    key={group.id}
                                    onClick={() => selectGroup(group.id)}
                                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 text-left ${recipientType === 'group' && selectedGroupId === group.id
                                            ? 'border-indigo-500 bg-indigo-50/60'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                >
                                    <span className="text-xl">{group.icon || '👥'}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm text-gray-900 truncate">{group.name}</div>
                                        <div className="text-xs text-gray-500">{group.count} contacts</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Individual Selection */}
                <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Or pick individuals
                        </div>
                        {selectedContactIds.length > 0 && (
                            <button
                                onClick={() => { setSelectedContactIds([]); if (recipientType === 'individual') setRecipientType('all'); }}
                                className="text-[11px] text-red-500 hover:text-red-600 font-medium"
                            >
                                Clear Selection
                            </button>
                        )}
                    </div>

                    <div className="relative mb-3">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name or phone..."
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-1">
                        {filteredContacts.map(contact => {
                            const isSelected = selectedContactIds.includes(contact.id);
                            return (
                                <button
                                    key={contact.id}
                                    onClick={() => toggleContact(contact.id)}
                                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors text-left ${isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-gray-300'
                                        }`}>
                                        {isSelected && <span className="text-[10px]">✓</span>}
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                        {contact.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">{contact.name || 'Unknown'}</div>
                                        <div className="text-xs text-gray-400">{contact.phone}</div>
                                    </div>
                                </button>
                            );
                        })}
                        {filteredContacts.length === 0 && (
                            <div className="text-center py-8 text-gray-400">
                                <span className="text-2xl block mb-2">🔍</span>
                                <span className="text-sm">No contacts found</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
