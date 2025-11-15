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
  Sparkles,
  Loader2
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
  const getStatusBadge = (file: VaultFile) => {
    switch (file.state) {
      case 'ACTIVE':
        return (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs font-medium text-green-700">Ready to Query</span>
            </div>
            <Sparkles className="h-4 w-4 text-green-600" />
          </div>
        );
      case 'PROCESSING':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
            <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin" />
            <span className="text-xs font-medium text-blue-700">Processing RAG...</span>
          </div>
        );
      case 'FAILED':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200">
            <AlertCircle className="h-3.5 w-3.5 text-red-600" />
            <span className="text-xs font-medium text-red-700">Failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-sm text-gray-600 mb-4">Upload your first document to get started</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            onClick={() => onSelectFile(file)}
            className={`flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer ${
              selectedFile?.id === file.id
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              file.state === 'ACTIVE' 
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                : file.state === 'PROCESSING'
                ? 'bg-gradient-to-br from-blue-400 to-blue-500'
                : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }`}>
              <FileText className="h-5 w-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {file.displayName}
                </h3>
                {getStatusBadge(file)}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{(file.sizeBytes / 1024).toFixed(2)} KB</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}</span>
                {file.errorMessage && (
                  <>
                    <span>•</span>
                    <span className="text-red-600 truncate max-w-xs">{file.errorMessage}</span>
                  </>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="h-4 w-4 text-gray-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSelectFile(file)}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (file.id) onDeleteFile(file.id);
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {files.map((file) => (
        <div
          key={file.id}
          onClick={() => onSelectFile(file)}
          className={`group relative p-4 rounded-lg border transition-all cursor-pointer ${
            selectedFile?.id === file.id
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
              file.state === 'ACTIVE' 
                ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                : file.state === 'PROCESSING'
                ? 'bg-gradient-to-br from-blue-400 to-blue-500'
                : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }`}>
              <FileText className="h-6 w-6 text-white" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 rounded transition-all">
                  <MoreVertical className="h-4 w-4 text-gray-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSelectFile(file)}>
                  <FileText className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (file.id) onDeleteFile(file.id);
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <h3 className="text-sm font-medium text-gray-900 mb-2 truncate" title={file.displayName}>
            {file.displayName}
          </h3>

          <div className="mb-3">
            {getStatusBadge(file)}
          </div>

          <div className="space-y-1 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="font-medium">Size:</span>
              <span>{(file.sizeBytes / 1024).toFixed(2)} KB</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Uploaded:</span>
              <span>{formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}</span>
            </div>
            {file.errorMessage && (
              <div className="text-red-600 text-xs mt-2 truncate" title={file.errorMessage}>
                Error: {file.errorMessage}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}