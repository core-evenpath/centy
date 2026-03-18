'use client';

import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, ExternalLink, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { RelayConfig } from '@/lib/types-relay';

interface RelayEmbedPanelProps {
  config: RelayConfig;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );
}

function QRCode({ value, size = 128 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Simple QR code visual placeholder using canvas
    // In production, use a proper QR library
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw a placeholder QR-like pattern
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';

    const cellSize = size / 21;
    // Simple pattern to represent QR code visually
    const pattern = [
      [1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1,0,1,0,1,0,1,0,1,0,0,0,0,0,1],
      [1,0,1,1,1,0,1,0,0,1,0,1,0,0,1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1,0,0,0,0,0,0,0,1,0,1,1,1,0,1],
      [1,0,0,0,0,0,1,0,1,0,1,0,1,0,1,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
      [0,0,0,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,0,0,0],
      [1,0,1,0,1,0,1,0,0,1,0,1,0,0,1,0,1,0,1,0,1],
      [0,1,0,1,0,1,0,1,0,0,1,0,0,1,0,1,0,1,0,1,0],
      [1,0,0,0,1,0,1,0,1,0,0,0,1,0,1,0,0,0,1,0,1],
      [0,0,1,0,0,1,0,0,0,1,0,1,0,0,0,0,1,0,0,1,0],
      [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
      [0,0,0,0,0,0,0,0,1,0,0,1,0,1,0,0,0,0,0,0,0],
      [1,1,1,1,1,1,1,0,0,1,0,0,1,0,0,0,0,0,1,0,1],
      [1,0,0,0,0,0,1,0,1,0,1,0,0,1,0,0,1,0,0,1,0],
      [1,0,1,1,1,0,1,0,0,0,0,1,0,0,1,0,1,0,1,0,1],
      [1,0,1,1,1,0,1,0,1,0,1,0,1,0,0,1,0,0,0,1,0],
      [1,0,1,1,1,0,1,0,0,1,0,0,0,1,0,0,1,0,1,0,1],
      [1,0,0,0,0,0,1,0,1,0,1,0,1,0,1,0,0,1,0,0,0],
      [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,0,0,1,0,1],
    ];

    pattern.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      });
    });
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="border border-gray-200 rounded"
      title={`QR Code for ${value}`}
    />
  );
}

export function RelayEmbedPanel({ config }: RelayEmbedPanelProps) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pingbox.io';
  const standaloneUrl = `${baseUrl}/relay/${config.widgetId}`;

  const scriptTag = `<script src="${baseUrl}/relay/widget.js"></script>`;
  const elementTag = `<pingbox-relay id="${config.widgetId}"></pingbox-relay>`;
  const fullEmbed = `${scriptTag}\n${elementTag}`;

  return (
    <div className="space-y-6">
      {/* Embed code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Embed Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Script Tag</p>
              <CopyButton text={scriptTag} />
            </div>
            <pre className="bg-gray-950 text-green-400 text-xs p-3 rounded-lg overflow-x-auto">
              <code>{scriptTag}</code>
            </pre>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Widget Element</p>
              <CopyButton text={elementTag} />
            </div>
            <pre className="bg-gray-950 text-green-400 text-xs p-3 rounded-lg overflow-x-auto">
              <code>{elementTag}</code>
            </pre>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Embed (copy both)</p>
              <CopyButton text={fullEmbed} />
            </div>
            <p className="text-xs text-muted-foreground">
              Paste both tags into your website's HTML, just before the <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Standalone link + QR */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Standalone Widget Link</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <div className="flex-1 space-y-3">
              <p className="text-sm text-muted-foreground">
                Share this link directly — no embed code needed. Works great for WhatsApp, email, or bio links.
              </p>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <span className="text-sm font-mono text-gray-700 flex-1 truncate">{standaloneUrl}</span>
                <CopyButton text={standaloneUrl} />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(standaloneUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Test Widget
              </Button>
            </div>
            <div className="flex-shrink-0">
              <p className="text-xs text-muted-foreground mb-2 text-center">Scan to open</p>
              <QRCode value={standaloneUrl} size={100} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Widget ID */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Widget ID</p>
              <p className="font-mono text-sm font-medium mt-1">{config.widgetId}</p>
            </div>
            <CopyButton text={config.widgetId} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
