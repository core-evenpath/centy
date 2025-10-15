// src/app/partner/(protected)/broadcast/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Plus, FileText, ArrowLeft, Radio, Sparkles, History, Send } from 'lucide-react';
import PartnerHeader from '../../../../components/partner/PartnerHeader';
import StockRecommendationEditor from '@/components/partner/templates/StockRecommendationEditor';
import type { TradingPick, Campaign } from '@/lib/types';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import AIComposerModal from '@/components/partner/messaging/AIComposerModal';
import { Badge } from '@/components/ui/badge';

const mockTemplates = [
    { id: '1', name: 'Stock Pick Alert', category: 'Trading', content: '💰 GS Foundation - {{Date}} Selected Quality Stock...'},
    { id: '2', name: 'Quick Update', category: 'General', content: 'Quick update: {{Stock}} has performed really well...'},
    { id: '3', name: 'Market Analysis', category: 'Analysis', content: 'This week in the markets: {{Summary}}'},
];

export default function BroadcastPage() {
  const [view, setView] = useState('list'); // 'list' or 'editor'
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [templates, setTemplates] = useState<TradingPick[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const [showAiComposer, setShowAiComposer] = useState(false);
  const [aiComposerPrompt, setAiComposerPrompt] = useState('');

  useEffect(() => {
    if (!currentWorkspace?.partnerId) return;

    // Fetch TradingPicks (Ideas)
    const templatesRef = collection(db, `partners/${currentWorkspace.partnerId}/tradingPicks`);
    const qTemplates = query(templatesRef);
    const unsubTemplates = onSnapshot(qTemplates, (snapshot) => {
      const fetchedTemplates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TradingPick[];
      setTemplates(fetchedTemplates);
    });

    // Fetch Campaigns (Broadcast History)
    const campaignsRef = collection(db, `partners/${currentWorkspace.partnerId}/campaigns`);
    const qCampaigns = query(campaignsRef, orderBy('createdAt', 'desc'));
    const unsubCampaigns = onSnapshot(qCampaigns, (snapshot) => {
      const fetchedCampaigns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Campaign[];
      setCampaigns(fetchedCampaigns);
    });


    return () => {
      unsubTemplates();
      unsubCampaigns();
    };
  }, [currentWorkspace?.partnerId]);


  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    setAiComposerPrompt(template.thesis || '');
    setShowAiComposer(true);
  };
  
  const handleSelectMessageTemplate = (template: any) => {
    setSelectedTemplate({ thesis: template.content });
    setView('editor');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedTemplate(null);
  };
  
  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setAiComposerPrompt('');
    setShowAiComposer(true);
  };

  const handleAiCompose = () => {
    setAiComposerPrompt('');
    setShowAiComposer(true);
  };
  
  const handleAiTextGenerated = (text: string) => {
    // If we started from a template, keep its data but update the thesis
    const newTemplateData = selectedTemplate ? { ...selectedTemplate, thesis: text } : { thesis: text };
    setSelectedTemplate(newTemplateData);
    setView('editor');
    setShowAiComposer(false);
  };

  if (view === 'editor') {
    return (
      <div className="flex-1 flex flex-col h-full">
        <header className="bg-card border-b p-4">
          <Button variant="outline" onClick={handleBackToList}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Ideas
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto">
          <StockRecommendationEditor initialData={selectedTemplate} />
        </div>
      </div>
    );
  }

  return (
    <>
      <PartnerHeader
        title="Broadcast from an Idea"
        subtitle="Select a template to start creating your broadcast."
        actions={
          <div className="flex gap-2">
            <Button onClick={handleAiCompose}>
              <Sparkles className="w-4 h-4 mr-2" />
              AI Composer
            </Button>
            <Button onClick={handleCreateNew}><Plus className="w-4 h-4 mr-2" />New Idea</Button>
          </div>
        }
      />
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>My Ideas</CardTitle>
            <CardDescription>
              Click one to create a new broadcast from it. This will open an AI composer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <div 
                  key={template.id} 
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleSelectTemplate(template)}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded">
                           <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <h3 className="font-semibold flex-1 truncate">{template.ticker}: {template.companyName}</h3>
                    </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{template.thesis}</p>
                  <p className="text-xs text-muted-foreground mt-2">{template.sector}</p>
                </div>
              ))}
              <div 
                className="p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center hover:border-primary hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={handleCreateNew}
              >
                  <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Create New Idea</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>My Templates</CardTitle>
                <CardDescription>
                    Quick-start a new broadcast from a pre-defined message template.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockTemplates.map(template => (
                    <div 
                    key={template.id} 
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleSelectMessageTemplate(template)}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-100 rounded">
                            <FileText className="w-4 h-4 text-purple-600" />
                            </div>
                            <h3 className="font-semibold flex-1 truncate">{template.name}</h3>
                        </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{template.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">{template.category}</p>
                    </div>
                ))}
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-gray-500"/>
                  Broadcast History
                </CardTitle>
                <CardDescription>
                    A log of all previously sent campaigns.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {campaigns.length > 0 ? campaigns.map(campaign => (
                        <div key={campaign.id} className="p-4 border rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded">
                                    <Send className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">{campaign.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Sent on {new Date(campaign.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge variant="secondary">{campaign.sentCount} recipients</Badge>
                                <Badge variant={campaign.status === 'sent' ? 'success' : 'outline'}>
                                  {campaign.status}
                                </Badge>
                                <Button variant="ghost" size="sm">View Details</Button>
                            </div>
                        </div>
                    )) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No campaigns have been sent yet.
                      </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </main>

      <AIComposerModal
        isOpen={showAiComposer}
        onClose={() => setShowAiComposer(false)}
        initialPrompt={aiComposerPrompt}
        onTextGenerated={handleAiTextGenerated}
        onImageGenerated={(imageUrl) => {
            // Handle image if needed, e.g., open editor with image pre-filled
            console.log("Image generated:", imageUrl);
        }}
      />
    </>
  );
}
