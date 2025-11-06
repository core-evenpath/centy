// src/components/partner/messaging/MessagesDiagnostic.tsx
// TEMPORARY DIAGNOSTIC COMPONENT - Add this to your page to debug
"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DiagnosticProps {
  smsConversationId?: string;
  whatsappConversationId?: string;
}

export default function MessagesDiagnostic({ smsConversationId, whatsappConversationId }: DiagnosticProps) {
  const [smsData, setSmsData] = useState<any>(null);
  const [whatsappData, setWhatsappData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testDirectAccess() {
      console.log('🔬 [DIAGNOSTIC] Starting direct Firestore test...');
      
      // Test SMS Messages
      if (smsConversationId) {
        try {
          console.log('🔬 [DIAGNOSTIC] Querying SMS messages for:', smsConversationId);
          
          const smsQuery = query(
            collection(db, 'smsMessages'),
            where('conversationId', '==', smsConversationId),
            orderBy('createdAt', 'asc')
          );
          
          const smsSnapshot = await getDocs(smsQuery);
          
          const smsMessages = smsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log('🔬 [DIAGNOSTIC] SMS Results:', {
            found: smsMessages.length,
            inbound: smsMessages.filter((m: any) => m.direction === 'inbound').length,
            outbound: smsMessages.filter((m: any) => m.direction === 'outbound').length,
            sample: smsMessages.slice(0, 5).map((m: any) => ({
              id: m.id,
              direction: m.direction,
              content: m.content?.substring(0, 30),
              createdAt: m.createdAt?.toDate?.()?.toISOString()
            }))
          });
          
          setSmsData({
            total: smsMessages.length,
            inbound: smsMessages.filter((m: any) => m.direction === 'inbound').length,
            outbound: smsMessages.filter((m: any) => m.direction === 'outbound').length,
            messages: smsMessages
          });
        } catch (error) {
          console.error('🔬 [DIAGNOSTIC] SMS Error:', error);
          setSmsData({ error: String(error) });
        }
      }

      // Test WhatsApp Messages
      if (whatsappConversationId) {
        try {
          console.log('🔬 [DIAGNOSTIC] Querying WhatsApp messages for:', whatsappConversationId);
          
          const whatsappQuery = query(
            collection(db, 'whatsappMessages'),
            where('conversationId', '==', whatsappConversationId),
            orderBy('createdAt', 'asc')
          );
          
          const whatsappSnapshot = await getDocs(whatsappQuery);
          
          const whatsappMessages = whatsappSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log('🔬 [DIAGNOSTIC] WhatsApp Results:', {
            found: whatsappMessages.length,
            inbound: whatsappMessages.filter((m: any) => m.direction === 'inbound').length,
            outbound: whatsappMessages.filter((m: any) => m.direction === 'outbound').length,
            sample: whatsappMessages.slice(0, 5).map((m: any) => ({
              id: m.id,
              direction: m.direction,
              content: m.content?.substring(0, 30),
              createdAt: m.createdAt?.toDate?.()?.toISOString()
            }))
          });
          
          setWhatsappData({
            total: whatsappMessages.length,
            inbound: whatsappMessages.filter((m: any) => m.direction === 'inbound').length,
            outbound: whatsappMessages.filter((m: any) => m.direction === 'outbound').length,
            messages: whatsappMessages
          });
        } catch (error) {
          console.error('🔬 [DIAGNOSTIC] WhatsApp Error:', error);
          setWhatsappData({ error: String(error) });
        }
      }
      
      setLoading(false);
    }

    if (smsConversationId || whatsappConversationId) {
      testDirectAccess();
    }
  }, [smsConversationId, whatsappConversationId]);

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 max-w-md shadow-lg z-50">
        <h3 className="font-bold text-yellow-900 mb-2">🔬 Diagnostic Running...</h3>
        <p className="text-sm text-yellow-800">Testing direct Firestore access</p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-blue-400 rounded-lg p-4 max-w-md shadow-lg z-50 max-h-96 overflow-auto">
      <h3 className="font-bold text-blue-900 mb-3">🔬 Firestore Diagnostic Results</h3>
      
      {smsConversationId && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <h4 className="font-semibold text-sm text-blue-900 mb-2">📞 SMS Messages</h4>
          {smsData?.error ? (
            <p className="text-xs text-red-600">Error: {smsData.error}</p>
          ) : (
            <div className="text-xs space-y-1">
              <p className="font-mono">Total: {smsData?.total || 0}</p>
              <p className="font-mono text-green-600">Inbound: {smsData?.inbound || 0}</p>
              <p className="font-mono text-blue-600">Outbound: {smsData?.outbound || 0}</p>
            </div>
          )}
        </div>
      )}

      {whatsappConversationId && (
        <div className="mb-4 p-3 bg-green-50 rounded">
          <h4 className="font-semibold text-sm text-green-900 mb-2">💬 WhatsApp Messages</h4>
          {whatsappData?.error ? (
            <p className="text-xs text-red-600">Error: {whatsappData.error}</p>
          ) : (
            <div className="text-xs space-y-1">
              <p className="font-mono">Total: {whatsappData?.total || 0}</p>
              <p className="font-mono text-green-600">Inbound: {whatsappData?.inbound || 0}</p>
              <p className="font-mono text-blue-600">Outbound: {whatsappData?.outbound || 0}</p>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-600 mt-3 pt-3 border-t">
        <p className="font-semibold mb-1">Next Steps:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Check console for detailed logs</li>
          <li>If counts are 0, check Firestore data</li>
          <li>If inbound is 0, check 'direction' field</li>
          <li>Remove this component after testing</li>
        </ul>
      </div>
    </div>
  );
}