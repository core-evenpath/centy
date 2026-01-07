import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Broadcast, BroadcastStatus } from '@/lib/types-broadcast';

interface UseBroadcastsOptions {
  partnerId: string | undefined;
  status?: BroadcastStatus | 'all';
  limitCount?: number;
}

interface UseBroadcastsReturn {
  broadcasts: Broadcast[];
  loading: boolean;
  error: string | null;
  stats: {
    total: number;
    sent: number;
    scheduled: number;
    drafts: number;
  };
  metrics: {
    totalSent: number;
    deliveryRate: number;
    readRate: number;
    replyRate: number;
  } | null;
  refresh: () => void;
}

export function useBroadcasts({
  partnerId,
  status = 'all',
  limitCount = 50,
}: UseBroadcastsOptions): UseBroadcastsReturn {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!partnerId || !db) {
      setBroadcasts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let q = query(
        collection(db, 'broadcasts'),
        where('partnerId', '==', partnerId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      // Note: Firestore doesn't support inequality filters on different fields
      // So we filter status client-side if needed

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          let broadcastList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Broadcast[];

          // Filter by status if specified
          if (status !== 'all') {
            broadcastList = broadcastList.filter((b) => b.status === status);
          }

          setBroadcasts(broadcastList);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching broadcasts:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('Error setting up broadcasts listener:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [partnerId, status, limitCount, refreshTrigger]);

  // Calculate stats
  const stats = {
    total: broadcasts.length,
    sent: broadcasts.filter((b) => b.status === 'sent').length,
    scheduled: broadcasts.filter((b) => b.status === 'scheduled').length,
    drafts: broadcasts.filter((b) => b.status === 'draft').length,
  };

  // Calculate aggregate metrics from sent broadcasts
  const sentBroadcasts = broadcasts.filter((b) => b.status === 'sent');
  const metrics =
    sentBroadcasts.length > 0
      ? {
          totalSent: sentBroadcasts.reduce((sum, b) => sum + b.metrics.sent, 0),
          deliveryRate: Math.round(
            sentBroadcasts.reduce((sum, b) => sum + b.metrics.deliveryRate, 0) /
              sentBroadcasts.length
          ),
          readRate: Math.round(
            sentBroadcasts.reduce((sum, b) => sum + b.metrics.readRate, 0) /
              sentBroadcasts.length
          ),
          replyRate: Math.round(
            sentBroadcasts.reduce((sum, b) => sum + b.metrics.replyRate, 0) /
              sentBroadcasts.length
          ),
        }
      : null;

  return {
    broadcasts,
    loading,
    error,
    stats,
    metrics,
    refresh,
  };
}

// Hook for a single broadcast
export function useBroadcast(broadcastId: string | undefined, partnerId: string | undefined) {
  const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!broadcastId || !partnerId || !db) {
      setBroadcast(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      doc(db, 'broadcasts', broadcastId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          if (data.partnerId === partnerId) {
            setBroadcast({ id: docSnapshot.id, ...data } as Broadcast);
          } else {
            setError('Unauthorized');
          }
        } else {
          setError('Broadcast not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching broadcast:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [broadcastId, partnerId]);

  return { broadcast, loading, error };
}

// Hook to get contact groups for recipient selection
export function useContactGroups(partnerId: string | undefined) {
  const [groups, setGroups] = useState<Array<{ id: string; name: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partnerId || !db) {
      // Return default groups based on contact tags
      setGroups([
        { id: 'all', name: 'All Contacts', count: 0 },
        { id: 'buyers', name: 'Active Buyers', count: 0 },
        { id: 'investors', name: 'Investors', count: 0 },
        { id: 'premium', name: 'Premium Clients', count: 0 },
        { id: 'new', name: 'New Leads (30 days)', count: 0 },
      ]);
      setLoading(false);
      return;
    }

    // Fetch contacts and calculate group counts
    const fetchCounts = async () => {
      try {
        const contactsRef = collection(db, 'contacts');
        const q = query(contactsRef, where('partnerId', '==', partnerId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const contacts = snapshot.docs.map((doc) => doc.data());
          const total = contacts.length;
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

          setGroups([
            { id: 'all', name: 'All Contacts', count: total },
            {
              id: 'buyers',
              name: 'Active Buyers',
              count: contacts.filter((c) => c.tags?.includes('buyer') || c.customerStage === 'active').length,
            },
            {
              id: 'investors',
              name: 'Investors',
              count: contacts.filter((c) => c.tags?.includes('investor')).length,
            },
            {
              id: 'premium',
              name: 'Premium Clients',
              count: contacts.filter((c) => c.tags?.includes('premium') || c.customerStage === 'vip').length,
            },
            {
              id: 'new',
              name: 'New Leads (30 days)',
              count: contacts.filter((c) => {
                const createdAt = c.createdAt?.toDate?.() || new Date(c.createdAt);
                return createdAt > thirtyDaysAgo;
              }).length,
            },
          ]);
          setLoading(false);
        });

        return unsubscribe;
      } catch (err) {
        console.error('Error fetching contact groups:', err);
        setLoading(false);
      }
    };

    fetchCounts();
  }, [partnerId]);

  return { groups, loading };
}

// Hook to get contacts for individual selection
export function useBroadcastContacts(partnerId: string | undefined, searchQuery: string = '') {
  const [contacts, setContacts] = useState<Array<{
    id: string;
    name: string;
    initials: string;
    phone: string;
    tags: string[];
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partnerId || !db) {
      setContacts([]);
      setLoading(false);
      return;
    }

    const contactsRef = collection(db, 'contacts');
    const q = query(
      contactsRef,
      where('partnerId', '==', partnerId),
      orderBy('name'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let contactList = snapshot.docs.map((doc) => {
        const data = doc.data();
        const name = data.name || data.displayName || 'Unknown';
        const initials = name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        return {
          id: doc.id,
          name,
          initials,
          phone: data.phone || data.waPhone || '',
          tags: data.tags || [],
        };
      });

      // Filter by search query
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        contactList = contactList.filter(
          (c) =>
            c.name.toLowerCase().includes(lowerQuery) ||
            c.phone.includes(searchQuery)
        );
      }

      setContacts(contactList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [partnerId, searchQuery]);

  return { contacts, loading };
}
