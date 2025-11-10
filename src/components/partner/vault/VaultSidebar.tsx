'use client';

import React from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Filter
} from 'lucide-react';

interface VaultSidebarProps {
  filters: {
    status: string;
    type: string;
    dateRange: string;
  };
  onFiltersChange: (filters: any) => void;
  fileCount: number;
}

export default function VaultSidebar({ filters, onFiltersChange, fileCount }: VaultSidebarProps) {
  const statusOptions = [
    { value: 'all', label: 'All Documents', icon: FileText, count: fileCount, color: 'text-gray-600' },
    { value: 'active', label: 'Active', icon: CheckCircle2, color: 'text-green-600' },
    { value: 'processing', label: 'Processing', icon: Clock, color: 'text-blue-600' },
    { value: 'failed', label: 'Failed', icon: AlertCircle, color: 'text-red-600' },
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'pdf', label: 'PDF Documents' },
    { value: 'text', label: 'Text Files' },
    { value: 'markdown', label: 'Markdown' },
  ];

  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  return (
    <div className="w-56 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-900 flex items-center gap-2">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </h3>
      </div>

      {/* Document Status */}
      <div className="p-3 border-b border-gray-100">
        <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">
          Document Status
        </h4>
        <div className="space-y-0.5">
          {statusOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => onFiltersChange({ ...filters, status: option.value })}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  filters.status === option.value
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 ${option.color || ''}`} />
                  {option.label}
                </span>
                {option.count !== undefined && (
                  <span className={`text-xs ${
                    filters.status === option.value ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {option.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Document Type */}
      <div className="p-3 border-b border-gray-100">
        <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">
          Document Type
        </h4>
        <div className="space-y-0.5">
          {typeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFiltersChange({ ...filters, type: option.value })}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                filters.type === option.value
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className="p-3">
        <h4 className="text-[10px] font-semibold text-gray-500 uppercase mb-2">
          Date Range
        </h4>
        <div className="space-y-0.5">
          {dateOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFiltersChange({ ...filters, dateRange: option.value })}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                filters.dateRange === option.value
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}