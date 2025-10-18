"use client";

import React from 'react';
import { Eye, CheckCircle, Brain, Sparkles, Link2, AlertCircle, Loader2 as Loader } from 'lucide-react';
import { FileText } from 'lucide-react';

export default function MonitorTab() {
  const conversations = [
    {
      id: 1,
      client: 'Robert Martinez',
      message: 'What\'s your outlook on tech sector for Q4?',
      aiResponse: 'Based on our Q3 Market Analysis, we maintain a cautiously optimistic outlook on tech. Large-cap technology companies show strong fundamentals with robust earnings growth. However, we recommend selective positioning due to valuation concerns in certain segments.',
      status: 'delivered',
      time: '2 mins ago',
      sources: [
        { doc: 'Q3 2025 Market Analysis.pdf', chunks: ['Section 3: Tech Sector Overview', 'Page 12: Q4 Projections'], confidence: 0.95 }
      ],
      reasoning: 'High confidence response - multiple relevant sections found in primary market analysis document.'
    },
    {
      id: 2,
      client: 'Jennifer Kim',
      message: 'Should I rebalance my portfolio given the current market conditions?',
      aiResponse: 'According to our Portfolio Allocation Strategy, rebalancing is recommended when asset allocation drifts more than 5% from target weights. Given current market volatility, this is an opportune time to review your positions and restore strategic balance.',
      status: 'delivered',
      time: '5 mins ago',
      sources: [
        { doc: 'Portfolio Allocation Strategy.docx', chunks: ['Rebalancing Guidelines', 'Market Timing Considerations'], confidence: 0.92 }
      ],
      reasoning: 'Direct match with rebalancing guidelines in strategy document.'
    },
    {
      id: 3,
      client: 'Michael Stevens',
      message: 'What are the tax implications of selling my bonds now?',
      status: 'composing',
      time: 'Just now',
      sources: [
        { doc: 'Tax Planning Guide 2025.pdf', chunks: ['Bond Taxation', 'Capital Gains'], confidence: 0.88 }
      ],
      reasoning: 'AI is composing response using tax guide - reviewing bond sale implications.'
    },
    {
      id: 4,
      client: 'Sarah Thompson',
      message: 'Can you explain the new cryptocurrency investment options?',
      status: 'needs_review',
      time: '1 min ago',
      confidence: 'low',
      sources: [],
      reasoning: 'No relevant documents found in knowledge base. This topic may require manual response or additional training data.'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Eye className="w-6 h-6 text-blue-600" />
          Live Conversation Monitoring
        </h2>
        <p className="text-gray-600">See exactly how AI uses your training data to respond to clients</p>
      </div>

      <div className="space-y-4">
        {conversations.map(conv => (
          <div key={conv.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold">
                  {conv.client.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900">{conv.client}</h3>
                    <span className="text-sm text-gray-500">{conv.time}</span>
                    {conv.status === 'delivered' && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        <CheckCircle className="w-3 h-3" />
                        Delivered
                      </span>
                    )}
                    {conv.status === 'composing' && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        <Loader className="w-3 h-3 animate-spin" />
                        Composing...
                      </span>
                    )}
                    {conv.status === 'needs_review' && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs">
                        <AlertCircle className="w-3 h-3" />
                        Needs Review
                      </span>
                    )}
                  </div>
                  
                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-600 font-medium mb-1">Client Question:</p>
                    <p className="text-gray-900">{conv.message}</p>
                  </div>

                  {conv.aiResponse && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-blue-700 font-medium mb-2 flex items-center gap-2">
                        <Brain className="w-4 h-4" />
                        AI Response:
                      </p>
                      <p className="text-gray-900 mb-3">{conv.aiResponse}</p>
                    </div>
                  )}

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-purple-900 mb-1">AI Reasoning:</p>
                        <p className="text-sm text-gray-700">{conv.reasoning}</p>
                      </div>
                    </div>

                    {conv.sources && conv.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <p className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                          <Link2 className="w-4 h-4" />
                          Sources Used:
                        </p>
                        <div className="space-y-2">
                          {conv.sources.map((source, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1">
                                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                  <span className="text-sm font-medium text-gray-900">{source.doc}</span>
                                </div>
                                <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                                  {Math.round(source.confidence * 100)}% confidence
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!conv.sources || conv.sources.length === 0) && (
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <div className="flex items-center gap-2 text-sm text-yellow-700">
                          <AlertCircle className="w-4 h-4" />
                          <span>No relevant training data found for this query</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
