import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import type { Contact } from '@/lib/types';

export function useContacts(partnerId?: string) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!partnerId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const collectionPath = `partners/${partnerId}/contacts`;
        const q = query(collection(db, collectionPath));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const contactsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Contact));

                setContacts(contactsData);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching contacts:", err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [partnerId]);

    return { contacts, loading, error };
}
