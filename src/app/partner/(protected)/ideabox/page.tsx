// src/app/partner/(protected)/ideabox/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import type { TradingPick } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Search, Edit, Copy, Trash2, TrendingUp, MessageSquare, Bell, Calendar, BarChart3, MoreVertical, X, ArrowLeft, User, Eye, EyeOff, CheckCircle, XCircle, Filter, Zap, Database, Globe, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const templateTypes = [
    { id: 'stock-recommendation', name: 'Stock Recommendation', icon: TrendingUp, description: 'Create buy/sell/hold recommendations with research', color: 'blue' },
    { id: 'market-update', name: 'Market Update', icon: BarChart3, description: 'Weekly/daily market commentary and analysis', color: 'purple' },
    { id: 'economic-alert', name: 'Economic Alert', icon: Bell, description: 'Fed decisions, economic data, policy changes', color: 'orange' },
    { id: 'quick-alert', name: 'Quick Alert', icon: MessageSquare, description: 'Breaking news, earnings alerts, urgent updates', color: 'red' },
    { id: 'event-invitation', name: 'Event Invitation', icon: Calendar, description: 'Webinars, seminars, client meetings', color: 'green' }
  ];

const IdeaboxPage = () => {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<TradingPick[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
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
  

  const categories = [...new Set(ideas.map(idea => idea.sector).filter(Boolean) as string[])];

  const filteredTemplates = ideas.filter(template => {
    const matchesSearch = 
      template.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.ticker?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.thesis?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.sector === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getTemplateTypeInfo = (typeId: string) => {
    return templateTypes.find(t => t.id === typeId);
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
                <div className="relative">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
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
                <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center">
                    <Link href={`/partner/ideabox/edit/${template.id}`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Link>
                </Button>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="px-4 py-2 text-red-600 rounded-lg font-semibold transition-colors border-red-200 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone. This will permanently delete this idea.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteIdea(template)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
  };

  const activeCount = ideas.length; // Simplified
  const inactiveCount = 0;

  return (
    <div className="w-full h-full bg-gray-50 overflow-auto">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Ideabox</h1>
              <p className="text-sm text-gray-600">Create and manage your communication ideas</p>
            </div>
          </div>
          
          <Button asChild>
            <Link href="/partner/ideabox/create">
              <Plus className="w-5 h-5 mr-2" />
              Create Idea
            </Link>
          </Button>
        </div>
      </div>

      {/* Search, Filter, and Status Bar */}
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
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto">
            <Filter className="w-5 h-5 text-gray-400 shrink-0 mt-2" />
            <button onClick={() => setSelectedCategory('all')} className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors text-sm ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>all</button>
            {categories.map((category) => (
              <button key={category} onClick={() => setSelectedCategory(category)} className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors text-sm ${selectedCategory === category ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{category}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-20 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading ideas...
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
            <p className="text-gray-600 mb-6">Try adjusting your search or create a new idea</p>
            <Button asChild>
                <Link href="/partner/ideabox/create">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Idea
                </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdeaboxPage;
