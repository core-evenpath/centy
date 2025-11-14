"use client";

import React, { useState, useEffect } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

export default function DebugPage() {
  const { user, currentWorkspace } = useMultiWorkspaceAuth();
  const partnerId = currentWorkspace?.partnerId || user?.customClaims?.partnerId;

  const [convData, setConvData] = useState<any>(null);
  const [msgData, setMsgData] = useState<any>(null);
  const [webhookLogs, setWebhookLogs] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    if (!partnerId || !db) return;
    
    setLoading(true);
    const results: any = {
      partnerId,
      timestamp: new Date().toISOString(),
      conversations: [],
      messages: [],
      webhookLogs: []
    };

    try {
      // Get conversations
      const convQuery = query(
        collection(db, 'whatsappConversations'),
        where('partnerId', '==', partnerId),
        orderBy('lastMessageAt', 'desc'),
        limit(10)
      );
      const convSnap = await getDocs(convQuery);
      results.conversations = convSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastMessageAt: doc.data().lastMessageAt?.toDate?.()?.toISOString() || null
      }));

      // Get messages for each conversation
      for (const conv of results.conversations) {
        const msgQuery = query(
          collection(db, 'whatsappMessages'),
          where('conversationId', '==', conv.id),
          limit(50)
        );
        const msgSnap = await getDocs(msgQuery);
        const msgs = msgSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null
        }));
        
        results.messages.push({
          conversationId: conv.id,
          conversationPhone: conv.customerPhone,
          messageCount: msgs.length,
          messages: msgs
        });
      }

      // Get recent webhook logs
      const webhookQuery = query(
        collection(db, 'webhookLogs'),
        where('platform', '==', 'whatsapp'),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      const webhookSnap = await getDocs(webhookQuery);
      results.webhookLogs = webhookSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || null
      }));

      setConvData(results.conversations);
      setMsgData(results.messages);
      setWebhookLogs(results.webhookLogs);

    } catch (error) {
      console.error('Diagnostic error:', error);
      alert('Error: ' + (error as any).message);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">WhatsApp Debug Tool</h1>
          <p className="text-gray-600 mb-4">Partner ID: {partnerId}</p>
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? 'Running...' : 'Run Diagnostics'}
          </Button>
        </div>

        {convData && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              Conversations ({convData.length})
            </h2>
            <div className="space-y-4">
              {convData.map((conv: any) => (
                <div key={conv.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="font-mono text-sm">
                    <div><strong>ID:</strong> {conv.id}</div>
                    <div><strong>Phone:</strong> {conv.customerPhone}</div>
                    <div><strong>Message Count:</strong> {conv.messageCount}</div>
                    <div><strong>Last Message:</strong> {conv.lastMessageAt}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {msgData && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Messages by Conversation</h2>
            {msgData.map((convMsgs: any) => (
              <div key={convMsgs.conversationId} className="mb-6">
                <h3 className="font-bold text-lg mb-2">
                  {convMsgs.conversationPhone} ({convMsgs.messageCount} messages)
                </h3>
                <div className="space-y-2">
                  {convMsgs.messages.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded ${
                        msg.direction === 'inbound' ? 'bg-gray-100' : 'bg-blue-100'
                      }`}
                    >
                      <div className="font-mono text-xs space-y-1">
                        <div><strong>ID:</strong> {msg.id}</div>
                        <div><strong>Direction:</strong> {msg.direction}</div>
                        <div><strong>Content:</strong> {msg.content}</div>
                        <div><strong>Created:</strong> {msg.createdAt}</div>
                        <div><strong>ConversationId:</strong> {msg.conversationId}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {webhookLogs && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">
              Recent Webhook Calls ({webhookLogs.length})
            </h2>
            <div className="space-y-4">
              {webhookLogs.map((log: any) => (
                <div
                  key={log.id}
                  className={`border-l-4 ${
                    log.success ? 'border-green-500' : 'border-red-500'
                  } pl-4 py-2`}
                >
                  <div className="font-mono text-xs space-y-1">
                    <div><strong>Time:</strong> {log.timestamp}</div>
                    <div><strong>Success:</strong> {log.success ? 'YES' : 'NO'}</div>
                    <div><strong>From:</strong> {log.from}</div>
                    <div><strong>To:</strong> {log.to}</div>
                    <div><strong>Body:</strong> {log.body}</div>
                    <div><strong>MessageSid:</strong> {log.messageSid}</div>
                    {log.error && (
                      <div className="text-red-600">
                        <strong>Error:</strong> {log.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}