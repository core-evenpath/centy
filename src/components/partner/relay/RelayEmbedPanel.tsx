'use client';

import { useState } from 'react';
import type { RelayConfig } from '@/lib/types-relay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, ExternalLink, QrCode } from 'lucide-react';

interface Props {
  config: RelayConfig;
}

export function RelayEmbedPanel({ config }: Props) {
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.centy.dev';
  const standaloneUrl = `${baseUrl}/relay/${config.widgetId}`;

  const embedCode = `<!-- Pingbox Relay Widget -->
<script src="${baseUrl}/relay/widget.js" defer></script>
<pingbox-relay id="${config.widgetId}"></pingbox-relay>`;

  const copyToClipboard = async (text: string, type: 'script' | 'link') => {
    await navigator.clipboard.writeText(text);
    if (type === 'script') {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <Card className="bg-white border border-[#e5e5e5]">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-[#111]">Embed & Share</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Widget ID */}
        <div className="p-3 bg-[#f5f5f5] rounded-lg">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Widget ID</p>
          <p className="font-mono text-sm text-[#111] font-bold">{config.widgetId}</p>
        </div>

        {/* Embed Code */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Embed Code</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => copyToClipboard(embedCode, 'script')}
            >
              {copiedScript ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              {copiedScript ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <pre className="bg-[#111] text-green-400 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
            {embedCode}
          </pre>
          <p className="text-xs text-gray-500 mt-2">
            Add this code to the <code className="bg-gray-100 px-1 rounded">&lt;body&gt;</code> of any webpage to embed the Relay widget.
          </p>
        </div>

        {/* Standalone Link */}
        <div>
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Standalone Page</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-2 bg-[#f5f5f5] rounded-lg font-mono text-xs text-[#111] truncate">
              {standaloneUrl}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              onClick={() => copyToClipboard(standaloneUrl, 'link')}
            >
              {copiedLink ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1"
              onClick={() => window.open(standaloneUrl, '_blank')}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Share this link for a full-page widget experience (no embed needed)</p>
        </div>

        {/* QR Code hint */}
        <div className="flex items-center gap-3 p-3 border border-dashed border-[#e5e5e5] rounded-xl">
          <div className="w-8 h-8 bg-[#f5f5f5] rounded-lg flex items-center justify-center flex-shrink-0">
            <QrCode className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#111]">QR Code</p>
            <p className="text-xs text-gray-500">
              Scan or share: <span className="font-mono">/relay/{config.widgetId}</span>
            </p>
          </div>
        </div>

        {/* Preview link */}
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => window.open(standaloneUrl, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
          Open Live Preview
        </Button>
      </CardContent>
    </Card>
  );
}
