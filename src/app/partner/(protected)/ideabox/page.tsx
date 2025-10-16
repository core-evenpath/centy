// src/app/partner/(protected)/ideabox/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import type { TradingPick } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { 
  Plus, FileText, Search, Edit, Copy, Trash2, TrendingUp, MessageSquare, 
  Bell, Calendar, BarChart3, MoreVertical, User, Eye, EyeOff, 
  CheckCircle, XCircle, Filter, Loader2 
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const templateTypes = [
  { 
    id: 'stock-recommendation', 
    name: 'Stock Recommendation', 
    icon: TrendingUp, 
    description: 'Create buy/sell/hold recommendations with research', 
    color: 'blue' 
  },
  { 
    id: 'market-update', 
    name: 'Market Update', 
    icon: BarChart3, 
    description: 'Weekly/daily market commentary and analysis', 
    color: 'purple' 
  },
  { 
    id: 'economic-alert', 
    name: 'Economic Alert', 
    icon: Bell, 
    description: 'Fed decisions, economic data, policy changes', 
    color: 'orange' 
  },
  { 
    id: 'quick-alert', 
    name: 'Quick Alert', 
    icon: MessageSquare, 
    description: 'Breaking news, earnings alerts, urgent updates', 
    color: 'red' 
  },
  { 
    id: 'event-invitation', 
    name: 'Event Invitation', 
    icon: Calendar, 
    description: 'Webinars, seminars, client meetings', 
    color: 'green' 
  }
];

const IdeaboxPage = () => {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<TradingPick[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  const categories = ['all', ...new Set(ideas.map(idea => idea.sector).filter(Boolean) as string[])];

  const filteredTemplates = ideas.filter(template => {
    const matchesSearch = 
      template.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.ticker?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.thesis?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || template.sector === selectedCategory;
    
    // For now, treat all as active since we don't have status field
    const templateStatus = 'active';
    const matchesStatus = statusFilter === 'all' || templateStatus === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getTemplateTypeInfo = (typeId: string) => {
    return templateTypes.find(t => t.id === typeId) || templateTypes[0];
  };

  const handleDeleteIdea = async (idea: TradingPick) => {
    if (!partnerId || !idea.id) return;
    try {
      await deleteDoc(doc(db, `partners/${partnerId}/tradingPicks`, idea.id));
      toast({
        title: 'Idea Deleted',
        description: `"${idea.companyName}" idea has been removed.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete idea.',
      });
    }
  };

  const handleDuplicate = (template: TradingPick) => {
    toast({
      title: 'Coming Soon',
      description: 'Duplicate functionality will be available soon.',
    });
  };

  const handleToggleStatus = (templateId: string) => {
    toast({
      title: 'Coming Soon',
      description: 'Status toggle functionality will be available soon.',
    });
  };

  const TemplateCard = ({ template }: { template: TradingPick }) => {
    const typeInfo = getTemplateTypeInfo('stock-recommendation');
    const Icon = typeInfo.icon;
    
    const templateStatus = 'active';

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
          
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 ${
              templateStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {templateStatus === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {templateStatus}
            </span>
            
            <div className="relative">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-bold text-lg text-gray-900 mb-2">
            {template.companyName} ({template.ticker})
          </h3>
          
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
              {typeInfo?.name}
            </span>
            {template.sector && <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
              {template.sector}
            </span>}
            {template.ticker && (
              <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-bold">
                {template.ticker}
              </span>
            )}
          </div>
          
          <div className="text-xs text-gray-500 mb-3">
            ID: {template.id?.substring(0, 8)}...
          </div>
          
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {template.thesis}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{currentWorkspace?.partnerName || 'You'}</span>
          </div>
          {template.updatedAt && <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>
              Modified {template.updatedAt 
                ? new Date((template.updatedAt as any).toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Recently'
              }
            </span>
          </div>}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-gray-200">
          <span className="font-semibold">0 broadcasts</span>
        </div>

        <div className="flex gap-2">
          <Button 
            asChild 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Link href={`/partner/ideabox/edit/${template.id}`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
          
          <Button
            onClick={() => handleToggleStatus(template.id || '')}
            variant="outline"
            className={`px-4 ${
              templateStatus === 'active'
                ? 'bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200'
                : 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200'
            }`}
            title={templateStatus === 'active' ? 'Deactivate' : 'Activate'}
          >
            {templateStatus === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          
          <Button
            onClick={() => handleDuplicate(template)}
            variant="outline"
            className="px-4 bg-gray-100 hover:bg-gray-200"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="px-4 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this idea.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDeleteIdea(template)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    );
  };

  const activeCount = ideas.length; 
  const inactiveCount = 0;
  const totalBroadcasts = 0; 

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
          
          <Button asChild className="shadow-lg">
            <Link href="/partner/ideabox/create">
              <Plus className="w-5 h-5 mr-2" />
              Create Idea
            </Link>
          </Button>
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
            <div className="text-2xl font-bold text-gray-900">{totalBroadcasts}</div>
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
            <input
              type="text"
              placeholder="Search ideas by name, label, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <Filter className="w-5 h-5 text-gray-400 shrink-0" />
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors text-sm ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({ideas.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                statusFilter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                statusFilter === 'inactive'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <XCircle className="w-4 h-4" />
              Inactive ({inactiveCount})
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-20 flex items-center justify-center gap-2 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" /> 
            Loading ideas...
          </div>
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
            <p className="text-gray-600 mb-6">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Create your first idea to get started'
              }
            </p>
            <Button asChild>
              <Link href="/partner/ideabox/create">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Idea
              </Link>
            </Button>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Idea Types for Financial Advisors</h3>
          <div className="grid grid-cols-5 gap-4">
            {templateTypes.map((type) => {
              const Icon = type.icon;
              return (
                <div key={type.id} className="bg-white rounded-lg p-3 border border-blue-200 text-center">
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${
                    type.color === 'blue' ? 'text-blue-600' :
                    type.color === 'purple' ? 'text-purple-600' :
                    type.color === 'orange' ? 'text-orange-600' :
                    type.color === 'red' ? 'text-red-600' :
                    'text-green-600'
                  }`} />
                  <div className="text-xs font-semibold text-gray-900">{type.name}</div>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-gray-700 mt-4">
            Each idea type has specific fields you can customize. Only active ideas can be broadcast to clients.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IdeaboxPage;
