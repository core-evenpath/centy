'use client';

import { useState, useEffect, useCallback } from 'react';
import { Zap, MessageCircle, Code2 } from 'lucide-react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { RelaySetupPanel } from '@/components/partner/relay/RelaySetupPanel';
import { RelayEmbedPanel } from '@/components/partner/relay/RelayEmbedPanel';
import { RelayDiagnosticsPanel } from '@/components/partner/relay/RelayDiagnosticsPanel';
import { RelayConversationList } from '@/components/partner/relay/RelayConversationList';
import { getRelayConfig, getRelayConversations } from '@/actions/relay-partner-actions';
import type { RelayConfig, RelayConversation } from '@/lib/types-relay';

export default function PartnerRelayPage() {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const partnerId = currentWorkspace?.partnerId;

  const [config, setConfig] = useState<RelayConfig | null>(null);
  const [conversations, setConversations] = useState<RelayConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!partnerId) return;
    setIsLoading(true);

    const [configResult, convsResult] = await Promise.all([
      getRelayConfig(partnerId),
      getRelayConversations(partnerId),
    ]);

    if (configResult.success && configResult.config) {
      setConfig(configResult.config);
    }
    if (convsResult.success && convsResult.conversations) {
      setConversations(convsResult.conversations);
    }
    setIsLoading(false);
  }, [partnerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!partnerId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No workspace selected
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F3F4F6]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Relay</h1>
            <p className="text-sm text-gray-500">
              Embeddable AI chat widget for your website
            </p>
          </div>
          {config?.enabled && (
            <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Live
            </span>
          )}
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto space-y-8">
        {/* Section 1: Setup */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="font-semibold text-gray-900">Setup & Configuration</h2>
          </div>
          {config && (
            <RelaySetupPanel
              config={config}
              onSaved={(updated) => setConfig(updated)}
            />
          )}
        </section>

        {/* Section 2: Embed & Diagnostics */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
              2
            </div>
            <h2 className="font-semibold text-gray-900">Embed & Diagnostics</h2>
          </div>
          <div className="space-y-4">
            {config && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Code2 className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Embed Code</span>
                </div>
                <RelayEmbedPanel config={config} />
                <RelayDiagnosticsPanel partnerId={partnerId} />
              </>
            )}
          </div>
        </section>

        {/* Section 3: Conversations */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
              3
            </div>
            <h2 className="font-semibold text-gray-900">Conversations & Leads</h2>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </span>
          </div>
          <RelayConversationList conversations={conversations} />
        </section>
      </div>
    </div>
  );
}
