'use client';

import React from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Tag
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
    { value: 'all', label: 'All Documents', icon: FileText, count: fileCount },
    { value: 'active', label: 'Active', icon: CheckCircle2, color: 'text-emerald-600' },
    { value: 'processing', label: 'Processing', icon: Clock, color: 'text-amber-600' },
    { value: 'failed', label: 'Failed', icon: AlertCircle, color: 'text-red-600' },
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'pdf', label: 'PDF Documents' },
    { value: 'txt', label: 'Text Files' },
    { value: 'md', label: 'Markdown' },
  ];

  const dateOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  return (
    <div className="h-full bg-white overflow-y-auto">
      <div className="p-5 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Filter className="h-4 w-4 text-blue-600" />
          Filters
        </h3>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
            Status
          </h4>
          <div className="space-y-1">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = filters.status === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => onFiltersChange({ ...filters, status: option.value })}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 ${isSelected
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-blue-600' : option.color || 'text-slate-400'}`} />
                    {option.label}
                  </span>
                  {option.count !== undefined && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isSelected
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-500'
                      }`}>
                      {option.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
            File Type
          </h4>
          <div className="space-y-1">
            {typeOptions.map((option) => {
              const isSelected = filters.type === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => onFiltersChange({ ...filters, type: option.value })}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200 ${isSelected
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
            Date Added
          </h4>
          <div className="space-y-1">
            {dateOptions.map((option) => {
              const isSelected = filters.dateRange === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => onFiltersChange({ ...filters, dateRange: option.value })}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200 ${isSelected
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}