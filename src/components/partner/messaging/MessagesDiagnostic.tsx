
// src/components/partner/messaging/MessagesDiagnostic.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DiagnosticProps {
  partnerId: string;
}

export default function MessagesDiagnostic({ partnerId }: DiagnosticProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testDirectAccess() {
        console.log('🔬 [DIAGNOSTIC] Starting direct Firestore test for partner:', partnerId);
        setLoading(true);
        const results: any = {};
      
        try {
          // Check conversations
          const convosQuery = query(
            collection(db, 'whatsappConversations'),
            where('partnerId', '==', partnerId)
          );
          const convosSnap = await getDocs(convosQuery);
          results.conversations = convosSnap.docs.map(d => ({id: d.id, ...d.data()}));
          console.log(`🔬 [DIAGNOSTIC] Conversations found: ${convosSnap.size}`);

          // Check messages
          const msgsQuery = query(
            collection(db, 'whatsappMessages'),
            where('partnerId', '==', partnerId)
          );
          const msgsSnap = await getDocs(msgsQuery);
          results.messages = msgsSnap.docs.map(d => ({id: d.id, ...d.data()}));
          console.log(`🔬 [DIAGNOSTIC] Messages found: ${msgsSnap.size}`);
          
          setData(results);

        } catch (error) {
          console.error('🔬 [DIAGNOSTIC] Error:', error);
          setData({ error: String(error) });
        } finally {
            setLoading(false);
        }
    }

    if (partnerId) {
      testDirectAccess();
    }
  }, [partnerId]);

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 max-w-md shadow-lg z-50">
        <h3 className="font-bold text-yellow-900 mb-2">🔬 Diagnostic Running...</h3>
        <p className="text-sm text-yellow-800">Testing direct Firestore access for this partner.</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-blue-400 rounded-lg p-4 max-w-md shadow-lg z-50 max-h-96 overflow-auto">
      <h3 className="font-bold text-blue-900 mb-3">🔬 Firestore Diagnostic Results</h3>
      {data?.error ? (
          <p className="text-xs text-red-600">Error: {data.error}</p>
      ) : (
        <div className="text-xs space-y-2">
            <div>
                <p className="font-semibold">Conversations Found:</p>
                <p className="font-mono">{data?.conversations?.length || 0}</p>
            </div>
            <div>
                <p className="font-semibold">Messages Found:</p>
                <p className="font-mono">{data?.messages?.length || 0}</p>
            </div>
             {data?.messages?.length > 0 && (
                <details>
                    <summary>View Message Sample</summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-2 max-h-48 overflow-auto">
                        {JSON.stringify(data.messages.slice(0, 3), null, 2)}
                    </pre>
                </details>
             )}
        </div>
      )}
    </div>
  );
}
