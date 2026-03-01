// src/components/admin/PartnerDetailView.tsx
import React from 'react';
import type { Partner, AdminPartnerStats } from '../../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Building2, Users, Activity, Brain, FileText, Bot } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import PartnerOverview from './PartnerOverview';
import PartnerBusinessProfile from './PartnerBusinessProfile';
import PartnerAIMemory from './PartnerAIMemory';

interface PartnerDetailViewProps {
  partner: Partner;
  stats: AdminPartnerStats | null;
  statsLoading: boolean;
}

export default function PartnerDetailView({ partner, stats, statsLoading }: PartnerDetailViewProps) {

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'suspended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'Enterprise': return 'text-purple-600 bg-purple-50';
      case 'Professional': return 'text-blue-600 bg-blue-50';
      case 'Starter': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">{partner.name}</CardTitle>
                  <p className="text-muted-foreground">{partner.industry?.name || 'Industry not set'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
               <div className={`px-3 py-1 text-xs font-medium rounded-full ${getPlanColor(partner.plan)}`}>
                  {partner.plan} Plan
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${partner.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  <span className={`w-2 h-2 rounded-full ${getStatusColor(partner.status)}`}></span>
                  {partner.status}
                </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview"><Activity className="w-4 h-4 mr-2"/>Overview</TabsTrigger>
          <TabsTrigger value="business_profile"><Building2 className="w-4 h-4 mr-2"/>Business Profile</TabsTrigger>
          <TabsTrigger value="ai_knowledge"><Brain className="w-4 h-4 mr-2"/>AI & Knowledge</TabsTrigger>
          <TabsTrigger value="team"><Users className="w-4 h-4 mr-2"/>Team</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
            <PartnerOverview partner={partner} stats={stats} statsLoading={statsLoading} />
        </TabsContent>
        <TabsContent value="business_profile" className="mt-6">
            <PartnerBusinessProfile partner={partner} />
        </TabsContent>
        <TabsContent value="ai_knowledge" className="mt-6">
            <div className="space-y-6">
                <PartnerAIMemory partner={partner} />
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Documents</CardTitle>
                                <FileText className="w-4 h-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.ai.totalDocuments}</div>
                                <p className="text-xs text-muted-foreground">uploaded to knowledge base</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Active Agents</CardTitle>
                                <Bot className="w-4 h-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.ai.activeAgents}</div>
                                <p className="text-xs text-muted-foreground">AI agents configured</p>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </TabsContent>
        <TabsContent value="team" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Team Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {stats ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-secondary/50 rounded-lg">
                                    <p className="text-2xl font-bold">{stats.team.totalMembers}</p>
                                    <p className="text-sm text-muted-foreground">Total Members</p>
                                </div>
                                <div className="p-4 bg-secondary/50 rounded-lg">
                                    <p className="text-2xl font-bold">{stats.team.adminCount}</p>
                                    <p className="text-sm text-muted-foreground">Admins</p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">View full team management in partner workspace</p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Team data is not available.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
