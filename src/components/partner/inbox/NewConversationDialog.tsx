'use client';

import React, { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Phone, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Contact } from '@/lib/types';

interface NewConversationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStartConversation: (phoneNumber: string, contactName?: string) => Promise<void>;
    contacts: Contact[];
    contactsLoading: boolean;
}

export function NewConversationDialog({
    open,
    onOpenChange,
    onStartConversation,
    contacts,
    contactsLoading,
}: NewConversationDialogProps) {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Filter contacts with phone numbers
    const contactsWithPhone = useMemo(() => {
        return contacts.filter(c => c.phone);
    }, [contacts]);

    // Filter by search query
    const filteredContacts = useMemo(() => {
        if (!searchQuery.trim()) return contactsWithPhone;
        const lower = searchQuery.toLowerCase();
        return contactsWithPhone.filter(c =>
            c.name?.toLowerCase().includes(lower) ||
            c.email?.toLowerCase().includes(lower) ||
            c.phone?.includes(searchQuery) ||
            c.company?.toLowerCase().includes(lower)
        );
    }, [contactsWithPhone, searchQuery]);

    const handleSelectContact = (contact: Contact) => {
        setSelectedContact(contact);
        setPhoneNumber(contact.phone || '');
        setError('');
    };

    const handlePhoneChange = (value: string) => {
        setPhoneNumber(value);
        setSelectedContact(null);
        setError('');
    };

    const normalizePhone = (phone: string): string => {
        // Remove all non-digit characters except +
        let normalized = phone.replace(/[^\d+]/g, '');
        // Ensure it starts with a + if it doesn't already
        if (!normalized.startsWith('+') && normalized.length > 0) {
            // Assume it's a number that needs country code - user should add it
            normalized = normalized;
        }
        return normalized;
    };

    const validatePhone = (phone: string): boolean => {
        const normalized = normalizePhone(phone);
        // Basic validation: should have at least 10 digits
        const digitsOnly = normalized.replace(/\D/g, '');
        return digitsOnly.length >= 10;
    };

    const handleSubmit = async () => {
        const normalized = normalizePhone(phoneNumber);

        if (!validatePhone(normalized)) {
            setError('Please enter a valid phone number with country code (e.g., +1234567890)');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await onStartConversation(normalized, selectedContact?.name);
            // Reset state on success
            setPhoneNumber('');
            setSearchQuery('');
            setSelectedContact(null);
            onOpenChange(false);
        } catch (err: any) {
            setError(err.message || 'Failed to start conversation');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setPhoneNumber('');
        setSearchQuery('');
        setSelectedContact(null);
        setError('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>New Conversation</DialogTitle>
                    <DialogDescription>
                        Enter a phone number or select from your contacts to start a new WhatsApp conversation.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Phone Number Input */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                id="phone"
                                value={phoneNumber}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                placeholder="+1234567890"
                                className="pl-10"
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            Include country code (e.g., +1 for US, +44 for UK)
                        </p>
                    </div>

                    {/* Contact Search */}
                    {contactsWithPhone.length > 0 && (
                        <div className="space-y-2">
                            <Label>Or select a contact</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search contacts..."
                                    className="pl-10"
                                />
                            </div>

                            <ScrollArea className="h-48 border rounded-md">
                                {contactsLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                    </div>
                                ) : filteredContacts.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-sm text-gray-500">
                                        No contacts with phone numbers
                                    </div>
                                ) : (
                                    <div className="p-2 space-y-1">
                                        {filteredContacts.map((contact) => (
                                            <button
                                                key={contact.id}
                                                type="button"
                                                onClick={() => handleSelectContact(contact)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors",
                                                    selectedContact?.id === contact.id
                                                        ? "bg-blue-50 border border-blue-200"
                                                        : "hover:bg-gray-50"
                                                )}
                                            >
                                                <Avatar className="w-8 h-8">
                                                    <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                                                        {contact.name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {contact.name || 'Unknown'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {contact.phone}
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-red-600">{error}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!phoneNumber.trim() || isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Starting...
                            </>
                        ) : (
                            'Start Conversation'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
