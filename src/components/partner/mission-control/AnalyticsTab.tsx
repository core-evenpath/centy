"use client";

import React from 'react';
import { CheckCircle, TrendingUp, Clock, Users, Database } from 'lucide-react';

export default function AnalyticsTab() {
  const documents = [
    { 
      id: 1, 
      name: 'Q3 2025 Market Analysis.pdf',
      status: 'processed',
      categoryIcon: '📊',
      timesReferenced: 23,
      lastUsed: '2 mins ago'
    },
    { 
      id: 2, 
      name: 'Portfolio Allocation Strategy.docx',
      status: 'processed',
      categoryIcon: '💼',
      timesReferenced: 15,
      lastUsed: '5 mins ago'
    },
    { 
      id: 3, 
      name: 'SEC Compliance Guidelines 2025.pdf',
      status: 'processing',
      categoryIcon: '⚖️',
      timesReferenced: 0,
      lastUsed: ''
    },
  ];

  const metrics = {
    activeConversations: 8,
    messagesDelivered: 234,
    avgResponseTime: '0.8s',
    documentsLoaded: documents.filter(d => d.status === 'processed').length,
    totalChunks: 45 + 28,
    avgConfidence: 0.91
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.documentsLoaded}</div>
          <div className="text-sm text-gray-600">Documents Trained</div>
          <div className="text-xs text-gray-500 mt-1">{metrics.totalChunks} knowledge chunks</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.messagesDelivered}</div>
          <div className="text-sm text-gray-600">AI Responses Today</div>
          <div className="text-xs text-gray-500 mt-1">{metrics.avgConfidence * 100}% avg confidence</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.avgResponseTime}</div>
          <div className="text-sm text-gray-600">Avg Response Time</div>
          <div className="text-xs text-gray-500 mt-1">Faster than manual</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.activeConversations}</div>
          <div className="text-sm text-gray-600">Active Conversations</div>
          <div className="text-xs text-gray-500 mt-1">Being handled now</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Referenced Documents</h3>
        <div className="space-y-3">
          {documents
            .filter(d => d.status === 'processed')
            .sort((a, b) => b.timesReferenced - a.timesReferenced)
            .map(doc => (
              <div key={doc.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{doc.categoryIcon}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{doc.name}</h4>
                      <p className="text-xs text-gray-500">Last used {doc.lastUsed}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{doc.timesReferenced}</div>
                  <div className="text-xs text-gray-500">references</div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
