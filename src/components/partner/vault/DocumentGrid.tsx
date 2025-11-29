'use client';

import React from 'react';
import { FileText, Loader2, Trash2, AlertCircle, Sparkles, FileCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { VaultFile } from '@/lib/types';

interface DocumentGridProps {
  files: VaultFile[];
  viewMode: 'grid' | 'list';
  selectedFile: VaultFile | null;
  onSelectFile: (file: VaultFile) => void;
  onDeleteFile: (fileId: string) => void;
  isLoading: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  } catch {
    return 'Unknown';
  }
}

export default function DocumentGrid({
  files,
  viewMode,
  selectedFile,
  onSelectFile,
  onDeleteFile,
  isLoading,
}: DocumentGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="bg-slate-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <FileText className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No documents yet</h3>
          <p className="text-slate-500 text-sm leading-relaxed">Upload your first document to build your intelligent knowledge base.</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {files.map((file) => (
          <Card
            key={file.id}
            className={`group cursor-pointer transition-all duration-200 border bg-white hover:shadow-md ${selectedFile?.id === file.id
              ? 'ring-2 ring-blue-600 border-transparent shadow-md'
              : 'border-slate-200 hover:border-blue-300'
              }`}
            onClick={() => onSelectFile(file)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className={`p-2.5 rounded-lg ${file.state === 'ACTIVE'
                  ? 'bg-blue-50 text-blue-600'
                  : file.state === 'PROCESSING'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-red-50 text-red-600'
                  }`}>
                  {file.state === 'ACTIVE' ? (
                    <FileCheck className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(file.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-slate-900 truncate mb-1" title={file.displayName}>
                  {file.displayName}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{formatBytes(file.sizeBytes)}</span>
                  <span>•</span>
                  <span>{formatDate(file.uploadedAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`text-xs font-medium px-2 py-0.5 ${file.state === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : file.state === 'FAILED'
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                >
                  {file.state}
                </Badge>
                {file.sourceType && (
                  <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 text-slate-600">
                    {file.sourceType}
                  </Badge>
                )}
              </div>

              {file.state === 'PROCESSING' && file.processingDescription && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="truncate">{file.processingDescription}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className={`group flex items-center gap-4 p-4 rounded-xl border bg-white cursor-pointer transition-all duration-200 hover:shadow-sm ${selectedFile?.id === file.id
            ? 'ring-2 ring-blue-600 border-transparent z-10'
            : 'border-slate-200 hover:border-blue-300'
            }`}
          onClick={() => onSelectFile(file)}
        >
          <div className={`p-2 rounded-lg flex-shrink-0 ${file.state === 'ACTIVE'
            ? 'bg-blue-50 text-blue-600'
            : file.state === 'PROCESSING'
              ? 'bg-amber-50 text-amber-600'
              : 'bg-red-50 text-red-600'
            }`}>
            {file.state === 'ACTIVE' ? (
              <FileCheck className="h-5 w-5" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
          </div>

          <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
            <div className="col-span-5">
              <h4 className="font-semibold text-slate-900 truncate" title={file.displayName}>
                {file.displayName}
              </h4>
              <p className="text-xs text-slate-500 truncate">
                {file.uploadedByEmail || file.uploadedBy}
              </p>
            </div>

            <div className="col-span-3 text-sm text-slate-600">
              {formatBytes(file.sizeBytes)}
            </div>

            <div className="col-span-4 flex items-center gap-2">
              <Badge
                variant="secondary"
                className={`text-xs font-medium px-2 py-0.5 ${file.state === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : file.state === 'FAILED'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
              >
                {file.state}
              </Badge>
              <span className="text-xs text-slate-400">{formatDate(file.uploadedAt)}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFile(file.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}