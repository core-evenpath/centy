"use client";

import React, { useState } from 'react';
import { Database, BarChart3, Eye, MessageSquare } from 'lucide-react';
import PartnerHeader from '@/components/partner/PartnerHeader';
import AnalyticsTab from '@/components/partner/mission-control/AnalyticsTab';
import KnowledgeBaseTab from '@/components/partner/mission-control/KnowledgeBaseTab';
import MonitorTab from '@/components/partner/mission-control/MonitorTab';
import TestAITab from '@/components/partner/mission-control/TestAITab';

export default function MissionControlPage() {
  const [activeTab, setActiveTab] = useState('train');
  
  const metrics = {
    activeConversations: 8,
    documentsLoaded: 3,
  };

  return (
    <>
      <PartnerHeader
        title="Mission Control"
        subtitle="Train, monitor, and control your AI assistant"
        actions={
          <div className="flex items-center gap-3">
            <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{metrics.activeConversations} Active</div>
                  <div className="text-xs text-gray-600">Client Messages</div>
                </div>
              </div>
            </div>
          </div>
        }
      />

      <div className="flex-1 overflow-auto bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Navigation */}
          <div className="flex gap-3 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('train')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all shadow-sm whitespace-nowrap ${
                activeTab === 'train'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Database className="w-5 h-5" />
              Knowledge Base
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                {metrics.documentsLoaded}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all shadow-sm whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('monitor')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all shadow-sm whitespace-nowrap ${
                activeTab === 'monitor'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Eye className="w-5 h-5" />
              Monitor Live
            </button>
            <button
              onClick={() => setActiveTab('test')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all shadow-sm whitespace-nowrap ${
                activeTab === 'test'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              Test AI
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'train' && <KnowledgeBaseTab />}
          {activeTab === 'overview' && <AnalyticsTab />}
          {activeTab === 'monitor' && <MonitorTab />}
          {activeTab === 'test' && <TestAITab />}
        </div>
      </div>
    </>
  );
}
