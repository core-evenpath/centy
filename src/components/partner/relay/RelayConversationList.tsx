'use client';

import { useState } from 'react';
import type { RelayConversation } from '@/lib/types-relay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RelayConversationView } from './RelayConversationView';
import { MessageSquare, ChevronDown, ChevronUp, Flame, Thermometer, Snowflake } from 'lucide-react';

type Filter = 'all' | 'hot' | 'converted' | 'abandoned';

interface Props {
  conversations: RelayConversation[];
  onFilterChange: (filter: Filter) => void;
}

const LEAD_ICONS = {
  hot: <Flame className="w-3 h-3" />,
  warm: <Thermometer className="w-3 h-3" />,
  cold: <Snowflake className="w-3 h-3" />,
};

const LEAD_COLORS = {
  hot: 'bg-red-100 text-red-700 border-red-200',
  warm: 'bg-amber-100 text-amber-700 border-amber-200',
  cold: 'bg-blue-100 text-blue-700 border-blue-200',
};

export function RelayConversationList({ conversations, onFilterChange }: Props) {
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleFilter = (filter: Filter) => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  const FILTERS: { label: string; value: Filter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Hot Leads', value: 'hot' },
    { label: 'Converted', value: 'converted' },
    { label: 'Abandoned', value: 'abandoned' },
  ];

  return (
    <Card className="bg-white border border-[#e5e5e5]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold text-[#111]">Conversations & Leads</CardTitle>
            <Badge variant="secondary" className="text-xs">{conversations.length}</Badge>
          </div>
          <div className="flex gap-1">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => handleFilter(f.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  activeFilter === f.value
                    ? 'bg-[#111] text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No conversations yet</p>
            <p className="text-gray-400 text-xs mt-1">Conversations will appear here when visitors use your widget</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(conv => (
              <div key={conv.id} className="border border-[#e5e5e5] rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 p-3 hover:bg-[#f5f5f5] transition-colors text-left"
                  onClick={() => setExpandedId(expandedId === conv.id ? null : conv.id)}
                >
                  {/* Lead score */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${LEAD_COLORS[conv.leadScore]}`}>
                    {LEAD_ICONS[conv.leadScore]}
                    {conv.leadScore}
                  </div>

                  {/* Visitor info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#111] truncate">
                      {conv.visitorName || 'Anonymous Visitor'}
                    </p>
                    <div className="flex items-center gap-2">
                      {conv.visitorContact && (
                        <span className="text-xs text-gray-500 truncate">{conv.visitorContact}</span>
                      )}
                      {conv.sourceDomain && (
                        <span className="text-xs text-gray-400">· {conv.sourceDomain}</span>
                      )}
                    </div>
                  </div>

                  {/* Status + meta */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {conv.conversionType && (
                      <Badge variant="outline" className="text-xs">
                        {conv.conversionType.replace('_', ' ')}
                      </Badge>
                    )}
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{conv.messageCount} msgs</p>
                      <p className="text-xs text-gray-400">
                        {new Date(conv.lastMessageAt).toLocaleDateString()}
                      </p>
                    </div>
                    {expandedId === conv.id
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </div>
                </button>

                {expandedId === conv.id && (
                  <div className="border-t border-[#e5e5e5]">
                    <RelayConversationView conversation={conv} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
