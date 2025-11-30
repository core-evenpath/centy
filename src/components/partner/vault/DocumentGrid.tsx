'use client';

import React from 'react';
import {
  FileText,
  Loader2,
  Trash2,
  AlertCircle,
  Sparkles,
  FileCheck,
  Tag,
  Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { VaultFile } from '@/lib/types-vault';

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

function getFileIcon(mimeType: string) {
  if (mimeType === 'application/pdf') {
    return <FileText className="h-6 w-6 text-red-500" />;
  }
  if (mimeType.startsWith('text/')) {
    return <FileText className="h-6 w-6 text-blue-500" />;
  }
  return <FileText className="h-6 w-6 text-slate-400" />;
}

function getTagsStatusBadge(file: VaultFile) {
  if (!file.tagsStatus || file.tagsStatus === 'pending') {
    return null;
  }
  if (file.tagsStatus === 'processing') {
    return (
      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Analyzing
      </Badge>
    );
  }
  if (file.tagsStatus === 'completed' && file.tags) {
    return (
      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
        <Tag className="h-3 w-3 mr-1" />
        Tagged
      </Badge>
    );
  }
  if (file.tagsStatus === 'failed') {
    return (
      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
        <AlertCircle className="h-3 w-3 mr-1" />
        Failed
      </Badge>
    );
  }
  return null;
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
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600 mx-auto mb-4" />
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
          <p className="text-slate-500 text-sm">
            Upload your first document to build your intelligent knowledge base.
          </p>
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
                ? 'ring-2 ring-blue-500 border-blue-500'
                : 'hover:border-slate-300'
              }`}
            onClick={() => onSelectFile(file)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors">
                  {file.state === 'PROCESSING' ? (
                    <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                  ) : file.state === 'FAILED' ? (
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  ) : (
                    getFileIcon(file.mimeType)
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {getTagsStatusBadge(file)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this document?')) {
                        onDeleteFile(file.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <h3 className="font-medium text-slate-900 mb-1 truncate" title={file.displayName}>
                {file.displayName}
              </h3>

              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <span>{formatBytes(file.sizeBytes)}</span>
                <span>•</span>
                <span>{formatDate(file.createdAt)}</span>
              </div>

              {file.state === 'ACTIVE' && (
                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                  <FileCheck className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              )}

              {file.state === 'PROCESSING' && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  {file.processingDescription || 'Processing'}
                </Badge>
              )}

              {file.state === 'FAILED' && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Failed
                </Badge>
              )}

              {file.tags && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {file.tags.primaryCategory}
                    </Badge>
                    {file.tags.topics.slice(0, 2).map((topic, i) => (
                      <Badge key={i} variant="outline" className="text-xs text-slate-500">
                        {topic}
                      </Badge>
                    ))}
                  </div>
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
          className={`flex items-center gap-4 p-4 bg-white border rounded-lg cursor-pointer transition-all hover:shadow-sm ${selectedFile?.id === file.id
              ? 'ring-2 ring-blue-500 border-blue-500'
              : 'hover:border-slate-300'
            }`}
          onClick={() => onSelectFile(file)}
        >
          <div className="p-2 bg-slate-50 rounded-lg">
            {file.state === 'PROCESSING' ? (
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
            ) : file.state === 'FAILED' ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              getFileIcon(file.mimeType)
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-slate-900 truncate">{file.displayName}</h3>
              {file.state === 'ACTIVE' && (
                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                  Ready
                </Badge>
              )}
              {file.state === 'PROCESSING' && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  {file.processingDescription || 'Processing'}
                </Badge>
              )}
              {file.state === 'FAILED' && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  Failed
                </Badge>
              )}
              {getTagsStatusBadge(file)}
            </div>

            <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
              <span>{formatBytes(file.sizeBytes)}</span>
              <span>•</span>
              <span>{formatDate(file.createdAt)}</span>
              {file.ragMetadata?.actualEmbeddings && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {file.ragMetadata.actualEmbeddings} embeddings
                  </span>
                </>
              )}
            </div>

            {file.tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {file.tags.primaryCategory}
                </Badge>
                {file.tags.topics.slice(0, 3).map((topic, i) => (
                  <Badge key={i} variant="outline" className="text-xs text-slate-500">
                    {topic}
                  </Badge>
                ))}
                {file.tags.topics.length > 3 && (
                  <Badge variant="outline" className="text-xs text-slate-400">
                    +{file.tags.topics.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Delete this document?')) {
                onDeleteFile(file.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}