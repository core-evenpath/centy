// src/app/partner/(protected)/campaigns/page.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Plus, Radio, CheckCheck, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import PartnerHeader from '../../../../components/partner/PartnerHeader';
import { CreateCampaignModal } from '@/components/partner/messaging/CreateCampaignModal';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import type { Campaign } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const mockCampaigns: Partial<Campaign>[] = [
  { id: '1', name: 'Q3 Stock Pick: NVDA', status: 'sent', sentCount: 142, engagementRate: 89.3, revenueGenerated: 12450, sentAt: new Date('2024-07-28T10:00:00Z') },
  { id: '2', name: 'Weekly Market Analysis', status: 'scheduled', sentCount: 0, engagementRate: 0, revenueGenerated: 0, sentAt: new Date('2024-08-05T09:00:00Z') },
  { id: '3', name: 'Urgent Alert: Market Dip', status: 'draft', sentCount: 0, engagementRate: 0, revenueGenerated: 0, createdAt: new Date('2024-07-29T14:00:00Z') },
  { id: '4', name: 'Tesla Earnings Recap', status: 'archived', sentCount: 210, engagementRate: 78.5, revenueGenerated: 9800, sentAt: new Date('2024-07-20T11:00:00Z') },
];


export default function CampaignsPage() {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [campaigns, setCampaigns] = useState(mockCampaigns);

  const handleCampaignCreated = () => {
    // In a real app, you'd refresh the campaign list from the server
    console.log('Campaign created, refresh list here.');
  };
  
  const getStatusBadge = (status: Campaign['status']) => {
    switch (status) {
      case 'sent': return <Badge variant="success" className="bg-green-100 text-green-800">Sent</Badge>;
      case 'scheduled': return <Badge variant="info" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'draft': return <Badge variant="outline">Draft</Badge>;
      case 'archived': return <Badge variant="secondary">Archived</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };


  return (
    <>
      <PartnerHeader
        title="Campaigns"
        subtitle="Manage and monitor your messaging campaigns."
        actions={
          currentWorkspace && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          )
        }
      />
      <main className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Overview</CardTitle>
            <CardDescription>
              A summary of your recent and upcoming campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
                 <div className="text-center p-8">
                    <Radio className="w-12 h-12 mx-auto text-muted-foreground mb-4"/>
                    <h3 className="font-semibold">No campaigns yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Create your first campaign to engage your audience.
                    </p>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Campaign
                    </Button>
                 </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {campaigns.map(campaign => (
                        <div key={campaign.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                                <h3 className="font-semibold">{campaign.name}</h3>
                                {getStatusBadge(campaign.status)}
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs">Sent</p>
                                    <p className="font-medium">{campaign.sentCount}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Engagement</p>
                                    <p className="font-medium text-green-600">{campaign.engagementRate}%</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Revenue</p>
                                    <p className="font-medium">${campaign.revenueGenerated?.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {campaign.status === 'scheduled' ? `Scheduled for ${new Date(campaign.sentAt!).toLocaleDateString()}` : 
                                 campaign.status === 'sent' ? `Sent on ${new Date(campaign.sentAt!).toLocaleDateString()}` :
                                 `Created on ${new Date(campaign.createdAt!).toLocaleDateString()}`}
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </CardContent>
        </Card>
      </main>

      {currentWorkspace?.partnerId && (
        <CreateCampaignModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          partnerId={currentWorkspace.partnerId}
          onConversationStarted={handleCampaignCreated}
        />
      )}
    </>
  );
}
