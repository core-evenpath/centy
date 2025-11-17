'use client';

import React from 'react';
import { X, Download, Trash2, Edit, FileText, Calendar, User, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { VaultFile } from '@/lib/types';

interface DocumentPreviewProps {
  file: VaultFile;
  onClose: () => void;
  onDelete: () => void;
  onEdit: (file: VaultFile) => void;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default function DocumentPreview({ file, onClose, onDelete, onEdit }: DocumentPreviewProps) {
  const handleDownload = async () => {
    console.log('Download clicked for:', file.displayName);
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Document Details</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 break-words">{file.displayName}</h3>
            <p className="text-sm text-gray-500 mt-1">{file.mimeType}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={
              file.state === 'ACTIVE'
                ? 'default'
                : file.state === 'FAILED'
                ? 'destructive'
                : 'secondary'
            }
          >
            {file.state}
          </Badge>
          {file.sourceType && (
            <Badge variant="outline">
              {file.sourceType}
            </Badge>
          )}
        </div>

        {file.errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{file.errorMessage}</p>
          </div>
        )}

        {file.ragMetadata && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Processing Details</h3>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">File Size</div>
                <div className="font-semibold text-gray-900">
                  {formatBytes(file.sizeBytes)}
                </div>
              </div>

              {file.ragMetadata.actualEmbeddings !== undefined && (
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Embeddings Created</div>
                  <div className="font-semibold text-gray-900">
                    {file.ragMetadata.actualEmbeddings.toLocaleString()}
                  </div>
                </div>
              )}

              {file.ragMetadata.actualChunks !== undefined && (
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Text Chunks</div>
                  <div className="font-semibold text-gray-900">
                    {file.ragMetadata.actualChunks.toLocaleString()}
                  </div>
                </div>
              )}

              {file.ragMetadata.processingTimeMs && (
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Processing Time</div>
                  <div className="font-semibold text-gray-900">
                    {(file.ragMetadata.processingTimeMs / 1000).toFixed(2)}s
                  </div>
                </div>
              )}

              {file.ragMetadata.extractedTextLength > 0 && (
                <div className="bg-indigo-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Text Extracted</div>
                  <div className="font-semibold text-gray-900">
                    {file.ragMetadata.extractedTextLength.toLocaleString()} chars
                  </div>
                </div>
              )}

              {file.ragMetadata.embeddingModel && (
                <div className="bg-pink-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Embedding Model</div>
                  <div className="font-semibold text-gray-900 text-xs">
                    {file.ragMetadata.embeddingModel}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uploaded By:</span>
                <span className="font-medium text-gray-900 truncate ml-2">
                  {file.uploadedByEmail || file.uploadedBy}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Upload Date:</span>
                <span className="font-medium text-gray-900">
                  {new Date(file.uploadedAt).toLocaleString()}
                </span>
              </div>

              {file.ragMetadata.processingCompletedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Indexed At:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(file.ragMetadata.processingCompletedAt).toLocaleString()}
                  </span>
                </div>
              )}

              {file.ragMetadata.chunkSize && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Chunk Size:</span>
                  <span className="font-medium text-gray-900">
                    {file.ragMetadata.chunkSize} chars
                  </span>
                </div>
              )}

              {file.ragMetadata.embeddingDimension && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Embedding Dimension:</span>
                  <span className="font-medium text-gray-900">
                    {file.ragMetadata.embeddingDimension}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-900">File Information</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Database className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-gray-600">File ID</div>
                <div className="font-mono text-xs text-gray-900 break-all">{file.id}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-gray-600">Uploaded By</div>
                <div className="text-gray-900 break-all">{file.uploadedByEmail || file.uploadedBy}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-gray-600">Created</div>
                <div className="text-gray-900">{new Date(file.uploadedAt).toLocaleString()}</div>
              </div>
            </div>

            {file.geminiFileName && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-gray-600">Gemini File ID</div>
                  <div className="font-mono text-xs text-gray-900 break-all">{file.geminiFileName}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {file.metadata && Object.keys(file.metadata).length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Additional Metadata</h3>
            <div className="bg-gray-50 rounded-lg p-3">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all">
                {JSON.stringify(file.metadata, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {file.conversationId && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900">Conversation Context</h3>
            <div className="space-y-1 text-sm">
              {file.customerName && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium text-gray-900">{file.customerName}</span>
                </div>
              )}
              {file.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium text-gray-900">{file.customerPhone}</span>
                </div>
              )}
              {file.conversationPlatform && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform:</span>
                  <span className="font-medium text-gray-900 uppercase">{file.conversationPlatform}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-4 space-y-2">
        {file.sourceType === 'training' && file.state === 'ACTIVE' && (
          <Button
            onClick={() => onEdit(file)}
            variant="outline"
            className="w-full"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Training Data
          </Button>
        )}

        <Button
          onClick={onDelete}
          variant="destructive"
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Document
        </Button>
      </div>
    </div>
  );
}