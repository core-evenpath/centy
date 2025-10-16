
// src/app/partner/(protected)/ideabox/page.tsx
"use client";

import React, { useState } from 'react';
import { Plus, FileText, Search, Edit, Copy, Trash2, TrendingUp, MessageSquare, Bell, Calendar, BarChart3, MoreVertical, X, ArrowLeft, User, Eye, EyeOff, CheckCircle, XCircle, Filter } from 'lucide-react';

const IdeaboxPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'editor'
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Template types for financial advisors
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

  // Mock saved templates
  const savedTemplates = [
    {
      id: '1',
      type: 'stock-recommendation',
      ticker: 'NVDA',
      name: 'NVDA Buy Recommendation',
      label: 'NVDA - AI Infrastructure Play',
      preview: 'Strong buy on AI infrastructure boom. Q2 2026 revenue hit $46.7B...',
      category: 'Technology',
      lastModified: '2025-01-10',
      usageCount: 12,
      createdBy: 'Sarah Johnson',
      status: 'active',
      validFrom: '2025-01-10',
      validUntil: '2025-02-10'
    },
    {
      id: '2',
      type: 'market-update',
      name: 'Weekly Tech Recap',
      label: 'Weekly Tech Sector Update',
      preview: 'This week in tech: Major indices up 2.3%, AI stocks lead rally...',
      category: 'Market Commentary',
      lastModified: '2025-01-08',
      usageCount: 24,
      createdBy: 'Sarah Johnson',
      status: 'active',
      validFrom: '2025-01-05',
      validUntil: '2025-01-12'
    },
    {
      id: '3',
      type: 'economic-alert',
      name: 'Fed Rate Decision',
      label: 'Fed Holds Rates Steady',
      preview: 'Federal Reserve maintains rates at 5.25-5.50%. Powell signals potential cuts in Q2...',
      category: 'Economic',
      lastModified: '2025-01-03',
      usageCount: 45,
      createdBy: 'Mike Chen',
      status: 'inactive',
      validFrom: '2025-01-03',
      validUntil: '2025-01-03'
    },
    {
      id: '4',
      type: 'quick-alert',
      name: 'Earnings Beat Alert',
      label: 'MSFT Earnings Beat Template',
      preview: 'MSFT beats earnings expectations by 12%. Stock up 5% in after-hours...',
      category: 'Earnings',
      lastModified: '2024-12-28',
      usageCount: 18,
      createdBy: 'Robert Kumar',
      status: 'active',
      validFrom: '2024-12-01',
      validUntil: null
    },
    {
      id: '5',
      type: 'event-invitation',
      name: 'Q1 Outlook Webinar',
      label: '2025 Q1 Market Outlook',
      preview: 'Join us for our quarterly market outlook webinar. Jan 15, 2025 at 2PM EST...',
      category: 'Events',
      lastModified: '2024-12-20',
      usageCount: 8,
      createdBy: 'Sarah Johnson',
      status: 'inactive',
      validFrom: '2024-12-15',
      validUntil: '2025-01-15'
    },
    {
      id: '6',
      type: 'market-update',
      name: 'Monthly Market Letter',
      label: 'January 2025 Market Review',
      preview: 'January market performance: S&P 500 up 3.2%, tech leadership continues...',
      category: 'Market Commentary',
      lastModified: '2024-12-15',
      usageCount: 32,
      createdBy: 'Mike Chen',
      status: 'active',
      validFrom: '2025-01-01',
      validUntil: '2025-01-31'
    }
  ];

  const categories = ['all', 'Technology', 'Market Commentary', 'Economic', 'Earnings', 'Events'];

  const filteredTemplates = savedTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.preview.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesStatus = statusFilter === 'all' || template.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
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
          <button
            onClick={() => setShowCreateMenu(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templateTypes.map((type) => {
              const Icon = type.icon;
              const colorClasses: {[key: string]: { bg: string, border: string, icon: string }} = {
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
                    setSelectedTemplate({ type: type.id, isNew: true, typeInfo: type });
                    setViewMode('editor');
                    setShowCreateMenu(false);
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

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Tip:</strong> Ideas are reusable content you create once and broadcast multiple times. 
              Only active ideas can be sent to clients.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const TemplateCard = ({ template }: { template: any }) => {
    const typeInfo = getTemplateTypeInfo(template.type);
    const Icon = typeInfo?.icon || FileText;
    const isExpired = template.validUntil && new Date(template.validUntil) < new Date();
    const displayStatus = isExpired ? 'expired' : template.status;

    const colorMap: {[key: string]: string} = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      red: 'bg-red-100 text-red-600',
      green: 'bg-green-100 text-green-600'
    };

    return (
      <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all group">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorMap[typeInfo?.color as keyof typeof colorMap] || colorMap.blue}`}>
            <Icon className="w-6 h-6" />
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 ${
              displayStatus === 'active' ? 'bg-green-100 text-green-700' :
              displayStatus === 'expired' ? 'bg-orange-100 text-orange-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {displayStatus === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
              {displayStatus}
            </span>
            
            <div className="relative">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <h3 className="font-bold text-lg text-gray-900 mb-2">{template.label}</h3>
          
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
              {typeInfo?.name}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
              {template.category}
            </span>
            {template.ticker && (
              <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-bold">
                {template.ticker}
              </span>
            )}
          </div>
          
          <div className="text-xs text-gray-500 mb-3">ID: {template.name}</div>
          
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{template.preview}</p>
        </div>

        {/* Creator & Date Info */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{template.createdBy}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Modified {new Date(template.lastModified).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Validity Period */}
        {(template.validFrom || template.validUntil) && (
          <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
            <div className="font-semibold text-gray-700 mb-1">Valid Period:</div>
            <div className="text-gray-600">
              {template.validFrom && `From ${new Date(template.validFrom).toLocaleDateString()}`}
              {template.validUntil && ` - Until ${new Date(template.validUntil).toLocaleDateString()}`}
              {!template.validUntil && ' - No expiry'}
            </div>
          </div>
        )}

        {/* Usage Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b border-gray-200">
          <span className="font-semibold">{template.usageCount} broadcasts</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedTemplate({...template, typeInfo});
              setViewMode('editor');
            }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center justify-center"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </button>
          
          <button
            onClick={() => handleToggleStatus(template.id)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center ${
              template.status === 'active'
                ? 'bg-orange-50 hover:bg-orange-100 text-orange-600'
                : 'bg-green-50 hover:bg-green-100 text-green-600'
            }`}
            title={template.status === 'active' ? 'Deactivate' : 'Activate'}
          >
            {template.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          
          <button
            onClick={() => alert(`Duplicating ${template.name}...`)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => alert(`Deleting ${template.name}...`)}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-semibold transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const EditorView = () => {
    const typeInfo = selectedTemplate?.typeInfo || getTemplateTypeInfo(selectedTemplate?.type);
    const Icon = typeInfo?.icon || FileText;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => setViewMode('grid')}
              className="text-blue-600 hover:text-blue-700 font-semibold mb-2 flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Ideabox
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedTemplate?.isNew ? `Create ${typeInfo?.name}` : `Edit ${typeInfo?.name}`}
            </h2>
            <p className="text-gray-600">{typeInfo?.description}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border-2 border-gray-200">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className={`w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                typeInfo?.color === 'blue' ? 'bg-blue-600' :
                typeInfo?.color === 'purple' ? 'bg-purple-600' :
                typeInfo?.color === 'orange' ? 'bg-orange-600' :
                typeInfo?.color === 'red' ? 'bg-red-600' :
                'bg-green-600'
              }`}>
                <Icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{typeInfo?.name} Editor</h3>
              <p className="text-gray-600 max-w-md mb-4">
                {typeInfo?.id === 'stock-recommendation' ? (
                  <>Your existing <strong>StockRecommendationEditor</strong> component renders here.</>
                ) : (
                  <>The editor for <strong>{typeInfo?.name}</strong> will be built with customizable fields.</>
                )}
              </p>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 max-w-lg mx-auto">
                <p className="text-sm text-blue-900 text-left">
                  <strong>This editor will allow you to:</strong>
                </p>
                <ul className="text-sm text-blue-900 text-left mt-2 space-y-1">
                  <li>• Edit all idea fields</li>
                  <li>• Add supporting data and research</li>
                  <li>• Set idea label and category</li>
                  <li>• Configure validity dates</li>
                  <li>• Set as active or inactive</li>
                  <li>• Save for future broadcasting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
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

  const activeCount = savedTemplates.filter(t => t.status === 'active' && (!t.validUntil || new Date(t.validUntil) >= new Date())).length;
  const inactiveCount = savedTemplates.filter(t => t.status === 'inactive' || (t.validUntil && new Date(t.validUntil) < new Date())).length;

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
          
          <button
            onClick={() => setShowCreateMenu(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Idea
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="grid grid-cols-5 gap-6">
          <div>
            <div className="text-2xl font-bold text-gray-900">{savedTemplates.length}</div>
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
            <div className="text-2xl font-bold text-gray-900">{savedTemplates.reduce((sum, t) => sum + t.usageCount, 0)}</div>
            <div className="text-sm text-gray-600">Total Broadcasts</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{templateTypes.length}</div>
            <div className="text-sm text-gray-600">Idea Types</div>
          </div>
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
          <div className="flex gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({savedTemplates.length})
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

      {/* Templates Grid */}
      <div className="p-6">
        {filteredTemplates.length > 0 ? (
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
            <button
              onClick={() => setShowCreateMenu(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors inline-flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Idea
            </button>
          </div>
        )}
      </div>

      {/* Help Section */}
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

      {showCreateMenu && <CreateMenuModal />}
    </div>
  );
};

export default IdeaboxPage;

    