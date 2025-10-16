// src/app/partner/(protected)/broadcast/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Radio, MessageSquare, Send, X, Users, User, Check, Sparkles, Upload, FileText, ChevronDown, Loader2 } from 'lucide-react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, where, doc, getDoc } from 'firebase/firestore';
import type { Campaign, Contact, ContactGroup } from '@/lib/types';
import { CreateCampaignModal } from '@/components/partner/messaging/CreateCampaignModal';

const CampaignDetailsView = ({ campaign, onBack }: { campaign: Campaign | null, onBack: () => void }) => {
    if (!campaign) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Select a campaign to view details.</p>
        </div>
      );
    }
  
    return (
      <div className="p-6 h-full flex flex-col">
        <Button variant="ghost" onClick={onBack} className="mb-4 self-start">
          &larr; Back to History
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Campaign: {campaign.name}</CardTitle>
            <CardDescription>
              Sent on {campaign.createdAt ? new Date(campaign.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left side: Preview */}
              <div>
                <h4 className="font-semibold mb-2">Broadcast Preview</h4>
                <div className="relative mx-auto border-gray-900 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                  <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white">
                    <div className="p-4 space-y-4">
                      {campaign.mediaUrl && (
                        <img src={campaign.mediaUrl} alt="Campaign media" className="w-full rounded-lg" />
                      )}
                      <p className="text-sm whitespace-pre-wrap">{campaign.message}</p>
                    </div>
                  </div>
                </div>
              </div>
  
              {/* Right side: Stats and Recipients */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Performance</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Delivery Rate</p>
                        <p className="text-2xl font-bold">99.2%</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Open Rate</p>
                        <p className="text-2xl font-bold">94.1%</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Engagement</p>
                        <p className="text-2xl font-bold">89.3%</p>
                      </CardContent>
                    </Card>
                    <Card>
                       <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Revenue</p>
                        <p className="text-2xl font-bold">${campaign.revenueGenerated || 0}</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
  
                <div>
                  <h4 className="font-semibold mb-2">Recipients ({campaign.sentCount})</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {campaign.recipients?.groups?.map((groupName: string, index: number) => (
                      <div key={`group-${index}`} className="flex items-center p-2 bg-gray-50 rounded-md">
                        <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="text-sm font-medium">{groupName}</span>
                      </div>
                    ))}
                    {campaign.recipients?.contacts?.map((contactName: string, index: number) => (
                      <div key={`contact-${index}`} className="flex items-center p-2 bg-gray-50 rounded-md">
                        <User className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">{contactName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

const BroadcastPage = () => {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const partnerId = currentWorkspace?.partnerId;

  useEffect(() => {
    if (!partnerId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(collection(db, `partners/${partnerId}/campaigns`), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const campaignData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Campaign[];
      setCampaigns(campaignData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching campaigns:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [partnerId]);

  if (selectedCampaign) {
    return <CampaignDetailsView campaign={selectedCampaign} onBack={() => setSelectedCampaign(null)} />;
  }

  return (
    <>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Broadcast</h2>
              <p className="text-gray-500 mt-1">Send a message to your audience via WhatsApp or SMS.</p>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <Send className="w-4 h-4 mr-2" />
              New Broadcast
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Broadcast History</CardTitle>
              <CardDescription>View all your previously sent campaigns.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-gray-500">
                          Sent to {campaign.sentCount} recipients on {campaign.createdAt ? new Date(campaign.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={campaign.status === 'sent' ? 'success' : 'secondary'}>{campaign.status}</Badge>
                        <Button variant="outline" size="sm" onClick={() => setSelectedCampaign(campaign)}>View Details</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">No broadcast history yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {partnerId && (
        <CreateCampaignModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          partnerId={partnerId}
        />
      )}
    </>
  );
};

export default BroadcastPage;
