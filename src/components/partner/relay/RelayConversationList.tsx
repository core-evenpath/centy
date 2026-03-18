'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RelayConversation } from '@/lib/types-relay';
import { RelayConversationView } from './RelayConversationView';

type ConvFilter = 'all' | 'hot' | 'converted' | 'abandoned';

const LEAD_SCORE_CONFIG = {
  hot: { label: 'Hot', className: 'bg-red-100 text-red-700 border-red-200' },
  warm: { label: 'Warm', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  cold: { label: 'Cold', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

interface RelayConversationListProps {
  conversations: RelayConversation[];
}

export function RelayConversationList({ conversations }: RelayConversationListProps) {
  const [filter, setFilter] = useState<ConvFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = conversations.filter((c) => {
    if (filter === 'hot') return c.leadScore === 'hot';
    if (filter === 'converted') return c.status === 'converted';
    if (filter === 'abandoned') return c.status === 'abandoned';
    return true;
  });

  const getLastMessagePreview = (conv: RelayConversation): string => {
    if (!conv.messages || conv.messages.length === 0) return 'No messages';
    const last = conv.messages[conv.messages.length - 1];
    return last.text || last.block?.text || 'Media message';
  };

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs mt-1">Visitors will appear here once they use your widget</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as ConvFilter)}>
        <TabsList>
          <TabsTrigger value="all">All ({conversations.length})</TabsTrigger>
          <TabsTrigger value="hot">
            Hot Leads ({conversations.filter((c) => c.leadScore === 'hot').length})
          </TabsTrigger>
          <TabsTrigger value="converted">
            Converted ({conversations.filter((c) => c.status === 'converted').length})
          </TabsTrigger>
          <TabsTrigger value="abandoned">
            Abandoned ({conversations.filter((c) => c.status === 'abandoned').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="divide-y border rounded-xl overflow-hidden bg-white">
        {filtered.map((conv, index) => {
          const isExpanded = expandedId === conv.id;
          return (
            <div key={conv.id}>
              <button
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : conv.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                      {conv.visitorName?.charAt(0).toUpperCase() || (index + 1).toString()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {conv.visitorName || `Anonymous #${index + 1}`}
                        </span>
                        <Badge
                          className={cn(
                            'text-xs border',
                            LEAD_SCORE_CONFIG[conv.leadScore].className
                          )}
                        >
                          {LEAD_SCORE_CONFIG[conv.leadScore].label}
                        </Badge>
                        {conv.status === 'converted' && (
                          <Badge className="text-xs bg-green-100 text-green-700 border-green-200 border">
                            Converted
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {getLastMessagePreview(conv)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      {conv.sourceDomain && (
                        <p className="text-xs text-muted-foreground">{conv.sourceDomain}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>
              {isExpanded && (
                <div className="border-t bg-gray-50">
                  <RelayConversationView conversation={conv} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
