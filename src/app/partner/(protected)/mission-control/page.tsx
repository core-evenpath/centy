
"use client";

import React, { useState } from 'react';
import { Upload, FileText, MessageSquare, Brain, Sparkles, Send, CheckCircle, Loader2 as Loader, Zap, Users, Clock, TrendingUp, AlertCircle, ArrowRight, Search, Eye, BookOpen, Database, Link2, Filter, BarChart3, FileSearch } from 'lucide-react';
import PartnerHeader from '@/components/partner/PartnerHeader';

export default function MissionControlPage() {
  const [activeTab, setActiveTab] = useState('train');
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [chatInput, setChatInput] = useState('');
  
  const [documents, setDocuments] = useState([
    { 
      id: 1, 
      name: 'Q3 2025 Market Analysis.pdf', 
      size: '2.4 MB', 
      status: 'processed',
      category: 'Market Research',
      categoryIcon: '📊',
      uploadedAt: '2 hours ago',
      chunks: 45,
      timesReferenced: 23,
      lastUsed: '2 mins ago'
    },
    { 
      id: 2, 
      name: 'Portfolio Allocation Strategy.docx', 
      size: '856 KB', 
      status: 'processed',
      category: 'Investment Strategy',
      categoryIcon: '💼',
      uploadedAt: '3 hours ago',
      chunks: 28,
      timesReferenced: 15,
      lastUsed: '5 mins ago'
    },
    { 
      id: 3, 
      name: 'SEC Compliance Guidelines 2025.pdf', 
      size: '3.1 MB', 
      status: 'processing',
      category: 'Compliance',
      categoryIcon: '⚖️',
      uploadedAt: 'Just now',
      chunks: 0,
      timesReferenced: 0
    },
  ]);

  const [conversations, setConversations] = useState([
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
  ]);

  const metrics = {
    activeConversations: 8,
    messagesDelivered: 234,
    avgResponseTime: '0.8s',
    documentsLoaded: documents.filter(d => d.status === 'processed').length,
    totalChunks: documents.reduce((sum, doc) => sum + doc.chunks, 0),
    avgConfidence: 0.91
  };

  const handleFileUpload = () => {
    const newDoc = {
      id: documents.length + 1,
      name: 'ESG Investment Framework.pdf',
      size: '1.8 MB',
      status: 'processing',
      category: 'Investment Strategy',
      categoryIcon: '💼',
      uploadedAt: 'Just now',
      chunks: 0,
      timesReferenced: 0
    };
    setDocuments([newDoc, ...documents]);
    
    setTimeout(() => {
      setDocuments(prev => prev.map(doc => 
        doc.id === newDoc.id ? { ...doc, status: 'processed', chunks: 32 } : doc
      ));
    }, 3000);
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
                {documents.filter(d => d.status === 'processed').length}
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
              {conversations.filter(c => c.status === 'needs_review').length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {conversations.filter(c => c.status === 'needs_review').length}
                </span>
              )}
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

          {/* Train Data Tab */}
          {activeTab === 'train' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Database className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Train Your AI Knowledge Base</h2>
                    <p className="text-gray-600">Upload documents to teach AI your expertise. The more you upload, the better AI understands your approach and methodology.</p>
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <Upload className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Drop files here or click to upload</h3>
                  <p className="text-gray-600 mb-6">AI will automatically process and learn from your documents</p>
                  <button
                    onClick={handleFileUpload}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-medium text-lg"
                  >
                    <Upload className="w-5 h-5" />
                    Select Files
                  </button>
                  <p className="text-sm text-gray-500 mt-4">PDF, Word, Excel, PowerPoint, Text • Max 50MB per file</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Your Knowledge Base</h3>
                      <p className="text-sm text-gray-600">{documents.length} documents • {metrics.totalChunks} knowledge chunks</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <Filter className="w-4 h-4" />
                        Filter
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <Search className="w-4 h-4" />
                        Search
                      </button>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {documents.map(doc => (
                    <div key={doc.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{doc.name}</h4>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span>{doc.size}</span>
                                <span>•</span>
                                <span>{doc.uploadedAt}</span>
                                {doc.status === 'processed' && (
                                  <>
                                    <span>•</span>
                                    <span>{doc.chunks} chunks</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {doc.status === 'processing' ? (
                                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                  <Loader className="w-4 h-4 animate-spin" />
                                  Processing...
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                    <CheckCircle className="w-4 h-4" />
                                    Active
                                  </div>
                                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                    <FileSearch className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {doc.status === 'processed' && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-2xl">{doc.categoryIcon}</span>
                                    <div>
                                      <div className="font-medium text-gray-900">{doc.category}</div>
                                      <div className="text-xs text-gray-500">Category</div>
                                    </div>
                                  </div>
                                  <div className="h-8 w-px bg-gray-300"></div>
                                  <div>
                                    <div className="font-medium text-gray-900">{doc.timesReferenced}</div>
                                    <div className="text-xs text-gray-500">Times Referenced</div>
                                  </div>
                                  <div className="h-8 w-px bg-gray-300"></div>
                                  <div>
                                    <div className="font-medium text-gray-900">{doc.lastUsed}</div>
                                    <div className="text-xs text-gray-500">Last Used</div>
                                  </div>
                                </div>
                                <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                                  <Eye className="w-4 h-4" />
                                  View Usage
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ... Add other tab content here ... */}
        </div>
      </div>
    </>
  );
}
