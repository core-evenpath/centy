"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import type { TradingPick } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, FileText, Search, Edit, Trash2, TrendingUp, MessageSquare, 
  Bell, Calendar, BarChart3, MoreVertical, Eye, 
  CheckCircle, Filter, Loader2, Sparkles, Target, 
  Clock, Share2, Image as ImageIcon, ArrowRight, Zap
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

function IdeaboxPage() {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<TradingPick[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'sector'>('recent');
  
  const partnerId = currentWorkspace?.partnerId;

  useEffect(() => {
    if (!partnerId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const ideasRef = collection(db, `partners/${partnerId}/tradingPicks`);
    const q = query(ideasRef, orderBy('createdAt', 'desc'));

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

  const filteredAndSortedIdeas = ideas
    .filter(idea => {
      const matchesSearch = 
        idea.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.ticker?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.thesis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.sector?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || idea.sector === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return (a.companyName || '').localeCompare(b.companyName || '');
      } else if (sortBy === 'sector') {
        return (a.sector || '').localeCompare(b.sector || '');
      }
      // Default: recent (already sorted by createdAt desc in query)
      return 0;
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
        description: `"${idea.companyName}" has been removed from your Ideabox.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete idea. Please try again.',
      });
    }
  };

  const handleDuplicateIdea = (idea: TradingPick) => {
    toast({
      title: 'Feature Coming Soon',
      description: 'Duplicate functionality will be available in the next update.',
    });
  };

  const IdeaCard = ({ idea }: { idea: TradingPick }) => {
    const typeInfo = getTemplateTypeInfo('stock-recommendation');
    const Icon = typeInfo.icon;
    
    const actionColors = {
      buy: 'bg-green-100 text-green-700 border-green-200',
      sell: 'bg-red-100 text-red-700 border-red-200',
      hold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    };

    const actionColor = actionColors[idea.action as keyof typeof actionColors] || actionColors.buy;

    return (
      <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-200 overflow-hidden group">
        {/* Card Header with Image or Gradient */}
        {idea.imageUrl ? (
          <div className="relative h-40 overflow-hidden bg-gray-100">
            <Image 
              src={idea.imageUrl} 
              alt={idea.companyName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 right-3">
              <Badge className={`${actionColor} font-bold uppercase shadow-sm`}>
                {idea.action}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-3 right-3">
              <Badge className="bg-white/90 text-blue-700 font-bold uppercase shadow-sm border-0">
                {idea.action}
              </Badge>
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2 text-white/90 text-sm mb-2">
                <Icon className="w-4 h-4" />
                <span className="font-medium">{typeInfo.name}</span>
              </div>
            </div>
          </div>
        )}

        {/* Card Content */}
        <div className="p-5">
          {/* Title and Ticker */}
          <div className="mb-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-bold text-lg text-gray-900 leading-tight line-clamp-1">
                {idea.companyName}
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href={`/partner/ideabox/view/${idea.id}`} className="cursor-pointer">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/partner/ideabox/edit/${idea.id}`} className="cursor-pointer">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDuplicateIdea(idea)}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        onSelect={(e) => e.preventDefault()}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Idea?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{idea.companyName} ({idea.ticker})"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteIdea(idea)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="font-mono font-bold text-blue-700 border-blue-200">
                {idea.ticker}
              </Badge>
              {idea.sector && (
                <Badge variant="secondary" className="text-xs">
                  {idea.sector}
                </Badge>
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <Target className="w-3 h-3" />
                <span>Target</span>
              </div>
              <div className="text-sm font-bold text-gray-900">{idea.priceTarget}</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <Clock className="w-3 h-3" />
                <span>Timeframe</span>
              </div>
              <div className="text-sm font-bold text-gray-900 capitalize">{idea.timeframe}</div>
            </div>
          </div>

          {/* Thesis Preview */}
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4">
            {idea.thesis}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>
                {idea.updatedAt 
                  ? new Date((idea.updatedAt as any).toDate()).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })
                  : 'Recent'
                }
              </span>
            </div>
            
            <Button asChild size="sm" className="h-8">
              <Link href={`/partner/ideabox/view/${idea.id}`}>
                View
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const statsData = [
    {
      label: 'Total Ideas',
      value: ideas.length,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Stock Picks',
      value: ideas.filter(i => i.action).length,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'This Month',
      value: ideas.filter(i => {
        if (!i.createdAt) return false;
        const date = new Date((i.createdAt as any).toDate());
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Categories',
      value: categories.length - 1, // Exclude 'all'
      icon: Filter,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100/50 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Ideabox</h1>
                <p className="text-sm text-gray-600">Create, manage, and broadcast your investment ideas</p>
              </div>
            </div>
            
            <Button asChild size="lg" className="shadow-lg bg-blue-600 hover:bg-blue-700">
              <Link href="/partner/ideabox/create">
                <Plus className="w-5 h-5 mr-2" />
                Create New Idea
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsData.map((stat) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={stat.label}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-xs text-gray-600">{stat.label}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by company, ticker, or thesis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48 h-10">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category} className="capitalize">
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-full md:w-48 h-10">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="name">Company Name</SelectItem>
              <SelectItem value="sector">Sector</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600 font-medium">Loading your ideas...</p>
          </div>
        ) : filteredAndSortedIdeas.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredAndSortedIdeas.length}</span> {filteredAndSortedIdeas.length === 1 ? 'idea' : 'ideas'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedIdeas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {searchQuery || selectedCategory !== 'all' ? 'No Ideas Found' : 'No Ideas Yet'}
            </h3>
            <p className="text-gray-600 mb-8 text-center max-w-md">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters to find what you\'re looking for' 
                : 'Get started by creating your first investment idea to share with clients'
              }
            </p>
            <Button asChild size="lg" className="shadow-lg">
              <Link href="/partner/ideabox/create">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Idea
              </Link>
            </Button>
          </div>
        )}
      </div>

      {/* Info Section - Only show when there are ideas */}
      {ideas.length > 0 && (
        <div className="p-6">
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Professional Investment Ideas at Your Fingertips
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  Create comprehensive stock recommendations, market updates, and client communications. 
                  Each idea type is designed to help you deliver professional insights to your clients.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {templateTypes.map((type) => {
                const Icon = type.icon;
                const colorMap: Record<string, string> = {
                  blue: 'bg-blue-100 text-blue-700 border-blue-200',
                  purple: 'bg-purple-100 text-purple-700 border-purple-200',
                  orange: 'bg-orange-100 text-orange-700 border-orange-200',
                  red: 'bg-red-100 text-red-700 border-red-200',
                  green: 'bg-green-100 text-green-700 border-green-200',
                };
                
                return (
                  <div 
                    key={type.id} 
                    className={`bg-white rounded-xl p-4 border-2 ${colorMap[type.color] || colorMap.blue} text-center hover:shadow-md transition-shadow`}
                  >
                    <Icon className={`w-7 h-7 mx-auto mb-3 ${
                      type.color === 'blue' ? 'text-blue-600' :
                      type.color === 'purple' ? 'text-purple-600' :
                      type.color === 'orange' ? 'text-orange-600' :
                      type.color === 'red' ? 'text-red-600' :
                      'text-green-600'
                    }`} />
                    <div className="text-sm font-bold text-gray-900 mb-1">{type.name}</div>
                    <div className="text-xs text-gray-600 leading-tight">{type.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IdeaboxPage;