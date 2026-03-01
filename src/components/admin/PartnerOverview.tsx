import React from 'react';
import type { Partner, AdminPartnerStats } from '../../lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { MessageCircle, Send, MessageSquare, Users, FileText, Bot, AlertTriangle, Loader2 } from 'lucide-react';

interface PartnerOverviewProps {
  partner: Partner;
  stats: AdminPartnerStats | null;
  statsLoading: boolean;
}

function ChannelStatusBadge({ status }: { status: AdminPartnerStats['channels']['whatsapp']['status'] }) {
  switch (status) {
    case 'active':
      return <Badge variant="success">Connected</Badge>;
    case 'pending':
      return <Badge variant="warning">Pending</Badge>;
    case 'pending_billing':
      return <Badge variant="warning">Billing Required</Badge>;
    case 'disconnected':
    case 'error':
      return <Badge variant="destructive">Disconnected</Badge>;
    default:
      return <Badge variant="secondary">Not Connected</Badge>;
  }
}

function QualityDot({ rating }: { rating?: string }) {
  if (!rating) return null;
  const colorMap: Record<string, string> = {
    GREEN: 'bg-green-500',
    YELLOW: 'bg-yellow-500',
    RED: 'bg-red-500',
  };
  const color = colorMap[rating] || 'bg-gray-400';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      Quality: {rating}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-6 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function PartnerOverview({ partner, stats, statsLoading }: PartnerOverviewProps) {
  if (statsLoading) {
    return <LoadingSkeleton />;
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold">No Data Available</h3>
          <p>Stats for this partner could not be loaded.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-600" />
              WhatsApp
            </CardTitle>
            <ChannelStatusBadge status={stats.channels.whatsapp.status} />
          </CardHeader>
          <CardContent>
            {stats.channels.whatsapp.connected ? (
              <div className="space-y-1.5">
                <p className="text-sm font-semibold">{stats.channels.whatsapp.phoneNumber}</p>
                <QualityDot rating={stats.channels.whatsapp.qualityRating} />
                {stats.channels.whatsapp.wabaId && (
                  <p className="text-xs text-muted-foreground font-mono">WABA: {stats.channels.whatsapp.wabaId}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Partner has not connected WhatsApp yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-500" />
              Telegram
            </CardTitle>
            <Badge variant={stats.channels.telegram.connected ? 'success' : 'secondary'}>
              {stats.channels.telegram.connected ? 'Connected' : 'Not Connected'}
            </Badge>
          </CardHeader>
          <CardContent>
            {stats.channels.telegram.connected && stats.channels.telegram.botUsername ? (
              <p className="text-sm font-semibold">@{stats.channels.telegram.botUsername}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Not connected</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Conversations</CardTitle>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messaging.totalConversations.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Contacts</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messaging.activeContactsCount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Documents Uploaded</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ai.totalDocuments.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active AI Agents</CardTitle>
            <Bot className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ai.activeAgents}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">AI Configuration Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={stats.ai.personaCompleteness} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {stats.ai.personaCompleteness}% Business Profile Complete
          </p>
          {stats.ai.personaCompleteness < 30 && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              Low profile completeness — AI responses may be generic
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {stats.team.totalMembers} team members ({stats.team.adminCount} admins)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
