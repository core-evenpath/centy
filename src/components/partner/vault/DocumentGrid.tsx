'use client';

import React from 'react';
import { 
  FileText, 
  MoreVertical, 
  Download, 
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import type { VaultFile } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DocumentGridProps {
  files: VaultFile[];
  viewMode: 'grid' | 'list';
  selectedFile: VaultFile | null;
  onSelectFile: (file: VaultFile) => void;
  onDeleteFile: (fileId: string) => void;
  isLoading: boolean;
}

export default function DocumentGrid({
  files,
  viewMode,
  selectedFile,
  onSelectFile,
  onDeleteFile,
  isLoading,
}: DocumentGridProps) {
  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'ACTIVE':
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
      case 'PROCESSING':
        return <Clock className="h-3.5 w-3.5 text-blue-600 animate-pulse" />;
      case 'FAILED':
        return <AlertCircle className="h-3.5 w-3.5 text-red-600" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'ACTIVE':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'PROCESSING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'FAILED':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (state: string) => {
    switch (state) {
      case 'ACTIVE':
        return 'Active';
      case 'PROCESSING':
        return 'Processing';
      case 'FAILED':
        return 'Failed';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="bg-gray-100 rounded-full p-6 mb-4">
          <FileText className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No documents found
        </h3>
        <p className="text-gray-600 max-w-sm">
          Upload your first document to start building your AI knowledge base
        </p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-1">
        {files.map((file) => (
          <div
            key={file.id}
            onClick={() => onSelectFile(file)}
            className={`group flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
              selectedFile?.id === file.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* File Icon */}
            <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
              file.state === 'ACTIVE' ? 'bg-blue-50' : 'bg-gray-50'
            }`}>
              <FileText className={`h-4 w-4 ${
                file.state === 'ACTIVE' ? 'text-blue-600' : 'text-gray-400'
              }`} />
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {file.displayName}
                </h4>
                {file.state === 'ACTIVE' && (
                  <Sparkles className="h-3 w-3 text-green-600 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-500">
                {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB • {file.createdAt ? formatDistanceToNow(new Date(file.createdAt), { addSuffix: true }) : 'Unknown date'}
              </p>
            </div>

            {/* Status Badge */}
            <div className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${getStatusColor(file.state)}`}>
              {getStatusIcon(file.state)}
              {getStatusLabel(file.state)}
            </div>

            {/* Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-opacity"
                >
                  <MoreVertical className="h-4 w-4 text-gray-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem>
                  <Download className="h-3.5 w-3.5 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(file.id);
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    );
  }

  // Grid View
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {files.map((file) => (
        <div
          key={file.id}
          onClick={() => onSelectFile(file)}
          className={`group relative bg-white rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md ${
            selectedFile?.id === file.id
              ? 'border-blue-500 ring-2 ring-blue-100'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              file.state === 'ACTIVE' ? 'bg-blue-50' : 'bg-gray-50'
            }`}>
              <FileText className={`h-5 w-5 ${
                file.state === 'ACTIVE' ? 'text-blue-600' : 'text-gray-400'
              }`} />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-opacity"
                >
                  <MoreVertical className="h-4 w-4 text-gray-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem>
                  <Download className="h-3.5 w-3.5 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(file.id);
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
              {file.displayName}
            </h4>
            <p className="text-xs text-gray-500">
              {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${getStatusColor(file.state)}`}>
              {getStatusIcon(file.state)}
              {getStatusLabel(file.state)}
            </div>
            {file.state === 'ACTIVE' && (
              <Sparkles className="h-3.5 w-3.5 text-green-600" />
            )}
          </div>

          <p className="text-[10px] text-gray-400 mt-2">
            {file.createdAt ? formatDistanceToNow(new Date(file.createdAt), { addSuffix: true }) : 'Unknown date'}
          </p>
        </div>
      ))}
    </div>
  );
}