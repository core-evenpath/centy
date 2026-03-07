'use client';

import { useEffect, useState } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { getRelayConfig, getRelayConversations } from '@/actions/relay-partner-actions';
import type { RelayConfig, RelayConversation } from '@/lib/types-relay';
import { RelaySetupPanel } from '@/components/partner/relay/RelaySetupPanel';
import { RelayEmbedPanel } from '@/components/partner/relay/RelayEmbedPanel';
import { RelayDiagnosticsPanel } from '@/components/partner/relay/RelayDiagnosticsPanel';
import { RelayConversationList } from '@/components/partner/relay/RelayConversationList';
import { Loader2, Zap } from 'lucide-react';

export default function RelayPage() {
  const { currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
  const partnerId = currentWorkspace?.partnerId;

  const [config, setConfig] = useState<RelayConfig | null>(null);
  const [conversations, setConversations] = useState<RelayConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!partnerId) return;
    setLoading(true);
    try {
      const [configResult, convsResult] = await Promise.all([
        getRelayConfig(partnerId),
        getRelayConversations(partnerId),
      ]);

      if (configResult.success && configResult.config) {
        setConfig(configResult.config);
      } else {
        setError(configResult.error || 'Failed to load config');
      }

      if (convsResult.success && convsResult.conversations) {
        setConversations(convsResult.conversations);
      }
    } catch (err) {
      setError('Failed to load Relay data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && partnerId) {
      loadData();
    }
  }, [partnerId, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        {error || 'Failed to load Relay configuration'}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#f5f5f5]">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#111]">Relay</h1>
            <p className="text-sm text-gray-500">Embeddable AI chat widget for your website</p>
          </div>
        </div>

        {/* Section 1: Setup */}
        <RelaySetupPanel
          config={config}
          partnerId={partnerId!}
          onSaved={loadData}
        />

        {/* Section 2: Embed & Diagnostics */}
        {config.enabled && (
          <>
            <RelayEmbedPanel config={config} />
            <RelayDiagnosticsPanel partnerId={partnerId!} />
          </>
        )}

        {/* Section 3: Conversations */}
        <RelayConversationList
          conversations={conversations}
          onFilterChange={async (filter) => {
            if (!partnerId) return;
            const result = await getRelayConversations(partnerId, filter);
            if (result.success && result.conversations) {
              setConversations(result.conversations);
            }
          }}
        />
      </div>
    </div>
  );
}
