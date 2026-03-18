'use client';

import { useState, useEffect, useCallback } from 'react';
import { Zap, MessageCircle, Code2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!partnerId) return;
    setIsLoading(true);
    setLoadError(null);

    const [configResult, convsResult] = await Promise.all([
      getRelayConfig(partnerId),
      getRelayConversations(partnerId),
    ]);

    if (configResult.success && configResult.config) {
      setConfig(configResult.config);
    } else if (!configResult.success) {
      setLoadError(configResult.error || 'Failed to load relay settings');
    }

    if (convsResult.success && convsResult.conversations) {
      setConversations(convsResult.conversations);
    }

    setIsLoading(false);
  }, [partnerId]);

  useEffect(() => {
    if (partnerId) {
      loadData();
    }
  }, [loadData, partnerId]);

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

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <div>
          <p className="font-semibold text-gray-900">Failed to load Relay settings</p>
          <p className="text-sm text-gray-500 mt-1">{loadError}</p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
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
          {config ? (
            <RelaySetupPanel
              config={config}
              onSaved={(updated) => setConfig(updated)}
              onReset={(freshConfig) => setConfig(freshConfig)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3 bg-white rounded-xl border border-dashed border-gray-300">
              <Zap className="w-8 h-8 text-gray-300" />
              <p className="text-sm text-gray-500">Relay is not configured yet.</p>
              <Button size="sm" onClick={loadData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Initialize Relay
              </Button>
            </div>
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
              </>
            )}
            <RelayDiagnosticsPanel partnerId={partnerId} />
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
