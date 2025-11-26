import { useMemo } from 'react';
import { useMetaConversations } from '@/hooks/useMetaWhatsApp';
import { useContacts } from '@/hooks/useContacts';
import type { MetaWhatsAppConversation } from '@/lib/types-meta-whatsapp';
import type { Contact } from '@/lib/types';

export interface EnrichedMetaConversation extends MetaWhatsAppConversation {
    contact?: Contact;
    contactName?: string;
    contactEmail?: string;
    contactCompany?: string;
    contactTags?: string[];
}

export function useEnrichedMetaConversations(partnerId?: string) {
    const { conversations, loading: loadingConversations, markAsRead } = useMetaConversations(partnerId);
    const { contacts, loading: loadingContacts } = useContacts(partnerId);

    const enrichedConversations = useMemo(() => {
        if (!conversations || !contacts) return [];

        return conversations.map(conv => {
            // Normalize phone numbers for matching (remove non-digits)
            const convPhone = conv.customerPhone.replace(/\D/g, '');

            // Find matching contact
            const contact = contacts.find(c => {
                // Match by contactId if available
                if (conv.contactId && c.id === conv.contactId) return true;

                // Fallback to phone number matching
                if (!c.phone) return false;
                const contactPhone = c.phone.replace(/\D/g, '');
                return contactPhone.includes(convPhone) || convPhone.includes(contactPhone);
            });

            if (contact) {
                return {
                    ...conv,
                    contact,
                    contactName: contact.name,
                    contactEmail: contact.email,
                    contactCompany: contact.company,
                    contactTags: contact.tags,
                    // If conversation title is just the phone number, use contact name
                    title: conv.title === conv.customerPhone ? contact.name : conv.title
                } as EnrichedMetaConversation;
            }

            return conv as EnrichedMetaConversation;
        });
    }, [conversations, contacts]);

    return {
        conversations: enrichedConversations,
        loading: loadingConversations || loadingContacts,
        markAsRead
    };
}
