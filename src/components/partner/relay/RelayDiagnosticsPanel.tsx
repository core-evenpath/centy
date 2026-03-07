'use client';

import { useState, useEffect } from 'react';
import { runRelayDiagnostics } from '@/actions/relay-partner-actions';
import type { RelayDiagnostics } from '@/lib/types-relay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  partnerId: string;
}

export function RelayDiagnosticsPanel({ partnerId }: Props) {
  const [diagnostics, setDiagnostics] = useState<RelayDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);

  const runChecks = async () => {
    setLoading(true);
    try {
      const result = await runRelayDiagnostics(partnerId);
      if (result.success && result.diagnostics) {
        setDiagnostics(result.diagnostics);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runChecks();
  }, [partnerId]);

  const statusIcon = (status: 'pass' | 'warn' | 'fail') => {
    if (status === 'pass') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'warn') return <AlertCircle className="w-4 h-4 text-amber-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const overallColor = {
    healthy: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-amber-600 bg-amber-50 border-amber-200',
    error: 'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <Card className="bg-white border border-[#e5e5e5]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-[#111]">Diagnostics</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={runChecks}
            disabled={loading}
            className="gap-1 text-xs"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && !diagnostics && (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Running diagnostic checks...
          </div>
        )}

        {diagnostics && (
          <div className="space-y-3">
            {/* Overall status */}
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium',
              overallColor[diagnostics.overallStatus]
            )}>
              {diagnostics.overallStatus === 'healthy' && <CheckCircle className="w-4 h-4" />}
              {diagnostics.overallStatus === 'warning' && <AlertCircle className="w-4 h-4" />}
              {diagnostics.overallStatus === 'error' && <XCircle className="w-4 h-4" />}
              {diagnostics.overallStatus === 'healthy' ? 'All systems operational' :
               diagnostics.overallStatus === 'warning' ? 'Some checks need attention' :
               'Critical issues detected'}
            </div>

            {/* Individual checks */}
            {diagnostics.checks.map(check => (
              <div key={check.id} className="flex items-start gap-3 p-3 bg-[#f5f5f5] rounded-lg">
                <div className="flex-shrink-0 mt-0.5">{statusIcon(check.status)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#111]">{check.name}</p>
                  <p className="text-xs text-gray-500">{check.description}</p>
                  {check.details && (
                    <p className="text-xs text-gray-600 mt-1 font-mono">{check.details}</p>
                  )}
                  {check.fix && check.status !== 'pass' && (
                    <p className="text-xs text-blue-600 mt-1">💡 {check.fix}</p>
                  )}
                </div>
              </div>
            ))}

            <p className="text-xs text-gray-400 text-right">
              Last checked: {new Date(diagnostics.lastCheckedAt).toLocaleTimeString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
