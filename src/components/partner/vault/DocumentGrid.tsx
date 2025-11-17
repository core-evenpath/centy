'use client';

import React from 'react';
import { FileText, Loader2, Trash2, AlertCircle } from 'lucide-react';
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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p className="text-gray-600">Upload your first document to get started</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {files.map((file) => (
          <Card
            key={file.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedFile?.id === file.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => onSelectFile(file)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate" title={file.displayName}>
                      {file.displayName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatBytes(file.sizeBytes)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(file.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                </Button>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Badge
                  variant={
                    file.state === 'ACTIVE'
                      ? 'default'
                      : file.state === 'FAILED'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="text-xs"
                >
                  {file.state}
                </Badge>
                {file.sourceType && (
                  <Badge variant="outline" className="text-xs">
                    {file.sourceType}
                  </Badge>
                )}
              </div>

              <div className="text-xs text-gray-600 mb-3">
                <div className="flex items-center gap-1 mb-1">
                  <span className="truncate">{file.uploadedByEmail || file.uploadedBy}</span>
                </div>
                <div>{formatDate(file.uploadedAt)}</div>
              </div>

              {file.state === 'PROCESSING' && file.processingDescription && (
                <div className="flex items-center gap-2 text-xs text-blue-600 mb-3">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>{file.processingDescription}</span>
                </div>
              )}

              {file.state === 'FAILED' && file.errorMessage && (
                <div className="flex items-start gap-2 text-xs text-red-600 mb-3">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{file.errorMessage}</span>
                </div>
              )}

              {file.ragMetadata && file.state === 'ACTIVE' && (
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-xs">
                  {file.ragMetadata.actualEmbeddings !== undefined && (
                    <div className="text-center">
                      <div className="text-gray-600">Embeddings</div>
                      <div className="font-semibold text-gray-900">
                        {file.ragMetadata.actualEmbeddings}
                      </div>
                    </div>
                  )}
                  {file.ragMetadata.actualChunks !== undefined && (
                    <div className="text-center">
                      <div className="text-gray-600">Chunks</div>
                      <div className="font-semibold text-gray-900">
                        {file.ragMetadata.actualChunks}
                      </div>
                    </div>
                  )}
                  {file.ragMetadata.processingTimeMs && (
                    <div className="text-center">
                      <div className="text-gray-600">Time</div>
                      <div className="font-semibold text-gray-900">
                        {(file.ragMetadata.processingTimeMs / 1000).toFixed(1)}s
                      </div>
                    </div>
                  )}
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
        <Card
          key={file.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedFile?.id === file.id ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => onSelectFile(file)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 truncate" title={file.displayName}>
                      {file.displayName}
                    </p>
                    <Badge
                      variant={
                        file.state === 'ACTIVE'
                          ? 'default'
                          : file.state === 'FAILED'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="text-xs flex-shrink-0"
                    >
                      {file.state}
                    </Badge>
                    {file.sourceType && (
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {file.sourceType}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{formatBytes(file.sizeBytes)}</span>
                    <span>•</span>
                    <span className="truncate">{file.uploadedByEmail || file.uploadedBy}</span>
                    <span>•</span>
                    <span>{formatDate(file.uploadedAt)}</span>
                  </div>

                  {file.state === 'PROCESSING' && file.processingDescription && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 mt-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>{file.processingDescription}</span>
                    </div>
                  )}

                  {file.state === 'FAILED' && file.errorMessage && (
                    <div className="flex items-start gap-2 text-xs text-red-600 mt-2">
                      <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-1">{file.errorMessage}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                {file.ragMetadata && file.state === 'ACTIVE' && (
                  <div className="flex items-center gap-4 text-xs">
                    {file.ragMetadata.actualEmbeddings !== undefined && (
                      <div className="text-center">
                        <div className="text-gray-600">Embeddings</div>
                        <div className="font-semibold text-gray-900">
                          {file.ragMetadata.actualEmbeddings}
                        </div>
                      </div>
                    )}
                    {file.ragMetadata.actualChunks !== undefined && (
                      <div className="text-center">
                        <div className="text-gray-600">Chunks</div>
                        <div className="font-semibold text-gray-900">
                          {file.ragMetadata.actualChunks}
                        </div>
                      </div>
                    )}
                    {file.ragMetadata.processingTimeMs && (
                      <div className="text-center">
                        <div className="text-gray-600">Time</div>
                        <div className="font-semibold text-gray-900">
                          {(file.ragMetadata.processingTimeMs / 1000).toFixed(1)}s
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(file.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}