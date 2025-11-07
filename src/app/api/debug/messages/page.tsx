"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap } from 'lucide-react';

interface Message {
  id: string;
  conversationId: string;
  partnerId: string;
  direction: string;
  platform: string;
  content: string;
  createdAt: string;
  hasPartnerId: boolean;
}

interface Conversation {
  id: string;
  partnerId: string;
  customerPhone: string;
  platform: string;
  messageCount: number;
  lastMessageAt: string;
}

export default function LiveMessagesDebug() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [limit, setLimit] = useState(10);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/debug/messages-live?limit=${limit}`, {
        cache: 'no-store'
      });
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [limit]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchData();
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, limit]);

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading live messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Zap className="w-8 h-8 text-yellow-500" />
                Live Messages Monitor
              </h1>
              <p className="text-gray-500 mt-1">
                Real-time view of latest messages • Last update: {lastUpdate}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Show:</label>
                <select 
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
              >
                {autoRefresh ? "🟢 Auto-refresh ON" : "⚪ Auto-refresh OFF"}
              </Button>

              <Button
                onClick={fetchData}
                disabled={loading}
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Now
              </Button>
            </div>
          </div>
        </div>

        {/* WhatsApp Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            WhatsApp ({data.results.whatsapp.messages.length} messages)
          </h2>

          {/* Messages */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
            <div className="bg-gray-100 px-6 py-3 border-b">
              <h3 className="font-semibold text-gray-700">Latest Messages</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Direction</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.results.whatsapp.messages.map((msg: Message) => (
                    <tr key={msg.id} className={!msg.hasPartnerId ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          msg.direction === 'inbound' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {msg.direction}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {msg.hasPartnerId ? (
                          <span className="text-green-600 font-mono text-xs">
                            {msg.partnerId.substring(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-red-600 font-bold">❌ MISSING</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                        {msg.conversationId.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                        {msg.content}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Conversations */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-100 px-6 py-3 border-b">
              <h3 className="font-semibold text-gray-700">Active Conversations</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Messages</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.results.whatsapp.conversations.map((conv: Conversation) => (
                    <tr key={conv.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {conv.customerPhone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                        {conv.partnerId.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {conv.messageCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(conv.lastMessageAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SMS Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            SMS ({data.results.sms.messages.length} messages)
          </h2>

          {/* Messages */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
            <div className="bg-gray-100 px-6 py-3 border-b">
              <h3 className="font-semibold text-gray-700">Latest Messages</h3>
            </div>
            {data.results.sms.messages.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No SMS messages found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Direction</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.results.sms.messages.map((msg: Message) => (
                      <tr key={msg.id} className={!msg.hasPartnerId ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            msg.direction === 'inbound' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {msg.direction}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {msg.hasPartnerId ? (
                            <span className="text-green-600 font-mono text-xs">
                              {msg.partnerId.substring(0, 8)}...
                            </span>
                          ) : (
                            <span className="text-red-600 font-bold">❌ MISSING</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {msg.content}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
