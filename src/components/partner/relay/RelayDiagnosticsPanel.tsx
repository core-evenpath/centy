'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RelayDiagnostics, RelayDiagnosticCheck } from '@/lib/types-relay';
import { runRelayDiagnostics } from '@/actions/relay-partner-actions';

interface RelayDiagnosticsPanelProps {
  partnerId: string;
}

function CheckRow({ check }: { check: RelayDiagnosticCheck }) {
  const icons = {
    pass: <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />,
    warn: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
    fail: <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
  };

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0">
      {icons[check.status]}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{check.name}</span>
          <span className="text-xs text-muted-foreground">{check.description}</span>
        </div>
        {check.details && (
          <p className="text-xs text-muted-foreground mt-0.5">{check.details}</p>
        )}
        {check.fix && (
          <p className="text-xs text-amber-600 mt-1">
            <span className="font-medium">Fix:</span> {check.fix}
          </p>
        )}
      </div>
    </div>
  );
}

export function RelayDiagnosticsPanel({ partnerId }: RelayDiagnosticsPanelProps) {
  const [diagnostics, setDiagnostics] = useState<RelayDiagnostics | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runChecks = useCallback(async () => {
    setIsRunning(true);
    const result = await runRelayDiagnostics(partnerId);
    if (result.success && result.diagnostics) {
      setDiagnostics(result.diagnostics);
    }
    setIsRunning(false);
  }, [partnerId]);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const statusConfig = {
    healthy: { label: 'Healthy', variant: 'default' as const, className: 'bg-green-100 text-green-700 border-green-200' },
    warning: { label: 'Warnings', variant: 'secondary' as const, className: 'bg-amber-100 text-amber-700 border-amber-200' },
    error: { label: 'Issues Found', variant: 'destructive' as const, className: 'bg-red-100 text-red-700 border-red-200' },
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Diagnostics</CardTitle>
          <div className="flex items-center gap-3">
            {diagnostics && (
              <Badge className={cn('border', statusConfig[diagnostics.overallStatus].className)}>
                {statusConfig[diagnostics.overallStatus].label}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={runChecks} disabled={isRunning}>
              <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', isRunning && 'animate-spin')} />
              Re-run
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isRunning && !diagnostics ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Running checks...
          </div>
        ) : diagnostics ? (
          <>
            <div className="divide-y">
              {diagnostics.checks.map((check) => (
                <CheckRow key={check.id} check={check} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Last checked: {new Date(diagnostics.lastCheckedAt).toLocaleString()}
            </p>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Click Re-run to check your widget status
          </div>
        )}
      </CardContent>
    </Card>
  );
}
