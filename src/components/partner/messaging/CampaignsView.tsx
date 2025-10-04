import React from 'react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Plus } from 'lucide-react';

export default function CampaignsView() {
  const campaigns = [
    { id: 1, name: 'Morning Stock Picks', status: 'live', sent: 142, engagement: 89.3, revenue: 12450 },
    { id: 2, name: 'Weekly Analysis', status: 'scheduled', sent: 48, engagement: 91.2, revenue: 8230 },
    { id: 3, name: 'Breaking News', status: 'paused', sent: 23, engagement: 94.1, revenue: 15890 }
  ];

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Campaigns</h2>
            <p className="text-gray-500 mt-1">Manage and monitor your messaging campaigns</p>
          </div>
          <Button>
            <Plus className="w-5 h-5 mr-2" />
            New Campaign
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {campaigns.map(campaign => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{campaign.name}</h3>
                  </div>
                  <Badge variant={campaign.status === 'live' ? 'default' : 'secondary'}>
                    {campaign.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Sent</p>
                    <p className="text-xl font-bold text-gray-900">{campaign.sent}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Engagement</p>
                    <p className="text-xl font-bold text-green-600">{campaign.engagement}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Revenue</p>
                    <p className="text-xl font-bold text-gray-900">${campaign.revenue}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
