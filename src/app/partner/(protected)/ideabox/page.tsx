// src/app/partner/(protected)/ideabox/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import type { TradingPick } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import StockRecommendationEditor from '@/components/partner/templates/StockRecommendationEditor';
import { Plus, FileText, Search, Edit, Copy, Trash2, TrendingUp, MessageSquare, Bell, Calendar, BarChart3, MoreVertical, X, ArrowLeft, User, Eye, EyeOff, CheckCircle, XCircle, Filter, Zap, Database, Globe } from 'lucide-react';

const IdeaboxPage = () => {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<TradingPick[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'editor'
  const [selectedIdea, setSelectedIdea] = useState<TradingPick | { isNew: true, typeInfo: any } | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const partnerId = currentWorkspace?.partnerId;

  useEffect(() => {
    if (!partnerId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const ideasRef = collection(db, `partners/${partnerId}/tradingPicks`);
    const q = query(ideasRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedIdeas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TradingPick[];
      setIdeas(fetchedIdeas);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching trading picks:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load ideas. Please check your connection and permissions."
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [partnerId, toast]);
  

  const templateTypes = [
    { id: 'stock-recommendation', name: 'Stock Recommendation', icon: TrendingUp, description: 'Create buy/sell/hold recommendations with research', color: 'blue' },
    { id: 'market-update', name: 'Market Update', icon: BarChart3, description: 'Weekly/daily market commentary and analysis', color: 'purple' },
    { id: 'economic-alert', name: 'Economic Alert', icon: Bell, description: 'Fed decisions, economic data, policy changes', color: 'orange' },
    { id: 'quick-alert', name: 'Quick Alert', icon: MessageSquare, description: 'Breaking news, earnings alerts, urgent updates', color: 'red' },
    { id: 'event-invitation', name: 'Event Invitation', icon: Calendar, description: 'Webinars, seminars, client meetings', color: 'green' }
  ];

  const categories = [...new Set(ideas.map(idea => idea.sector).filter(Boolean) as string[])];

  const filteredTemplates = ideas.filter(template => {
    const matchesSearch = 
      template.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.ticker?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.thesis?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.sector === selectedCategory;
    // const matchesStatus = statusFilter === 'all' || template.status === statusFilter; // Add status to your data model if needed
    return matchesSearch && matchesCategory;
  });

  const getTemplateTypeInfo = (typeId: string) => {
    return templateTypes.find(t => t.id === typeId);
  };

  const handleToggleStatus = (templateId: string) => {
    alert(`Toggling status for template ${templateId}`);
  };

  const CreateMenuModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Idea</h2>
            <p className="text-gray-600">Choose a type for your new idea</p>
          </div>
          <button onClick={() => setShowCreateMenu(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templateTypes.map((type) => {
              const Icon = type.icon;
              const colorClasses = {
                blue: { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200 hover:border-blue-400', icon: 'bg-blue-600' },
                purple: { bg: 'from-purple-50 to-pink-50', border: 'border-purple-200 hover:border-purple-400', icon: 'bg-purple-600' },
                orange: { bg: 'from-orange-50 to-amber-50', border: 'border-orange-200 hover:border-orange-400', icon: 'bg-orange-600' },
                red: { bg: 'from-red-50 to-rose-50', border: 'border-red-200 hover:border-red-400', icon: 'bg-red-600' },
                green: { bg: 'from-green-50 to-emerald-50', border: 'border-green-200 hover:border-green-400', icon: 'bg-green-600' }
              };
              const colors = colorClasses[type.color as keyof typeof colorClasses];

              return (
                <button
                  key={type.id}
                  onClick={() => {
                    if (type.id === 'stock-recommendation') {
                      setSelectedIdea({ isNew: true, typeInfo: type });
                      setViewMode('editor');
                      setShowCreateMenu(false);
                    } else {
                      toast({
                        title: "Coming Soon!",
                        description: `The "${type.name}" template is under development.`
                      })
                    }
                  }}
                  className={`text-left p-6 rounded-xl border-2 hover:shadow-lg transition-all bg-gradient-to-br ${colors.bg} ${colors.border}`}
                >
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${colors.icon}`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{type.name}</h3>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const TemplateCard = ({ template }: { template: TradingPick }) => {
    const typeInfo = getTemplateTypeInfo('stock-recommendation'); // Assuming all are stock recommendations for now
    const Icon = typeInfo?.icon || FileText;

    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      red: 'bg-red-100 text-red-600',
      green: 'bg-green-100 text-green-600'
    };

    return (
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all group">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorMap[typeInfo?.color as keyof typeof colorMap] || colorMap.blue}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <div className="mb-4">
          <h3 className="font-bold text-lg text-gray-900 mb-2">{template.companyName} ({template.ticker})</h3>
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
              {typeInfo?.name}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
              {template.sector}
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{template.thesis}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedIdea(template);
              setViewMode('editor');
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </button>
        </div>
      </div>
    );
  };

  const EditorView = () => {
    if (!selectedIdea) return null;
    const typeInfo = 'typeInfo' in selectedIdea ? selectedIdea.typeInfo : getTemplateTypeInfo('stock-recommendation');
    
    return (
      <div className="space-y-6">
        <button
          onClick={() => setViewMode('grid')}
          className="text-blue-600 hover:text-blue-700 font-semibold mb-2 flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Ideabox
        </button>
        
        {typeInfo.id === 'stock-recommendation' ? (
          <StockRecommendationEditor initialData={'isNew' in selectedIdea ? null : selectedIdea} />
        ) : (
          <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
             <h2 className="text-2xl font-bold text-gray-900">
              {'isNew' in selectedIdea ? `Create ${typeInfo?.name}` : `Edit ${typeInfo?.name}`}
            </h2>
          </div>
        )}
      </div>
    );
  };

  if (viewMode === 'editor') {
    return (
      <div className="w-full h-full bg-gray-50 overflow-auto">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Ideabox</h1>
              <p className="text-sm text-gray-600">Create and manage communication ideas</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <EditorView />
        </div>
      </div>
    );
  }

  const activeCount = ideas.length; // Simplified
  const inactiveCount = 0;

  return (
    <div className="w-full h-full bg-gray-50 overflow-auto">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Ideabox</h1>
              <p className="text-sm text-gray-600">Create and manage your communication ideas</p>
            </div>
          </div>
          <button onClick={() => setShowCreateMenu(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center shadow-lg">
            <Plus className="w-5 h-5 mr-2" />
            Create Idea
          </button>
        </div>
      </div>
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="grid grid-cols-5 gap-6">
          <div>
            <div className="text-2xl font-bold text-gray-900">{ideas.length}</div>
            <div className="text-sm text-gray-600">Total Ideas</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-600">{inactiveCount}</div>
            <div className="text-sm text-gray-600">Inactive/Expired</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{ideas.reduce((sum, t) => sum + (t.usageCount || 0), 0)}</div>
            <div className="text-sm text-gray-600">Total Broadcasts</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{templateTypes.length}</div>
            <div className="text-sm text-gray-600">Idea Types</div>
          </div>
        </div>
      </div>
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search ideas by name, label, or content..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <button onClick={() => setSelectedCategory('all')} className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>all</button>
            {categories.map((category) => (
              <button key={category} onClick={() => setSelectedCategory(category)} className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors ${selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{category}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-20">Loading ideas...</div>
        ) : filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Ideas Found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search or create a new idea</p>
            <button onClick={() => setShowCreateMenu(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors inline-flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Idea
            </button>
          </div>
        )}
      </div>
      {showCreateMenu && <CreateMenuModal />}
    </div>
  );
};

export default IdeaboxPage;
