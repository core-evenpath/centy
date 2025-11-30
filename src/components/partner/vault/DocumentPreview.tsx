'use client';

import React from 'react';
import {
  X,
  Download,
  Trash2,
  Edit,
  FileText,
  Calendar,
  User,
  Database,
  Tag,
  Sparkles,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { VaultFile } from '@/lib/types-vault';
import { retryTagExtraction } from '@/actions/vault-actions';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetryTags = async () => {
    setIsRetrying(true);
    try {
      const result = await retryTagExtraction(file.partnerId, file.id);
      if (result.success) {
        toast({
          title: 'Tag extraction started',
          description: 'Tags will be generated shortly.',
        });
      } else {
        toast({
          title: 'Failed to start tag extraction',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-slate-200 shadow-xl flex flex-col z-40">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Document Details</h2>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-900 break-words">{file.displayName}</h3>
            <p className="text-sm text-slate-500 mt-1">{file.mimeType}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={
              file.state === 'ACTIVE' ? 'default' :
                file.state === 'FAILED' ? 'destructive' : 'secondary'
            }
          >
            {file.state === 'ACTIVE' && <CheckCircle className="h-3 w-3 mr-1" />}
            {file.state === 'FAILED' && <AlertCircle className="h-3 w-3 mr-1" />}
            {file.state}
          </Badge>
          <span className="text-sm text-slate-500">{formatBytes(file.sizeBytes)}</span>
        </div>

        {file.tags && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Tag className="h-4 w-4 text-blue-600" />
                Document Tags
              </h3>
              {file.tags.confidence && (
                <span className="text-xs text-slate-500">
                  {Math.round(file.tags.confidence * 100)}% confidence
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase">Category</span>
                <div className="mt-1">
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                    {file.tags.primaryCategory}
                  </Badge>
                </div>
              </div>

              {file.tags.topics.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase">Topics</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {file.tags.topics.map((topic, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {file.tags.entities.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase">Entities</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {file.tags.entities.slice(0, 10).map((entity, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {entity}
                      </Badge>
                    ))}
                    {file.tags.entities.length > 10 && (
                      <Badge variant="outline" className="text-xs text-slate-400">
                        +{file.tags.entities.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {file.tags.keywords.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase">Keywords</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {file.tags.keywords.slice(0, 12).map((keyword, i) => (
                      <span key={i} className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {file.tags.dateReferences && file.tags.dateReferences.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase">Date References</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {file.tags.dateReferences.map((date, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {date}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {(!file.tags && file.tagsStatus !== 'processing') && (
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-slate-700">No Tags Available</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {file.tagsStatus === 'failed'
                    ? 'Tag extraction failed. Click to retry.'
                    : 'Tags will be generated after upload.'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryTags}
                disabled={isRetrying}
              >
                {isRetrying ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {file.tagsStatus === 'processing' && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
              <span className="text-sm text-blue-700">Analyzing document...</span>
            </div>
          </div>
        )}

        {file.ragMetadata && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              RAG Metadata
            </h3>

            <div className="bg-slate-50 rounded-lg p-3 space-y-2">
              {file.ragMetadata.actualEmbeddings && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Embeddings</span>
                  <span className="font-medium text-slate-900">
                    {file.ragMetadata.actualEmbeddings}
                  </span>
                </div>
              )}

              {file.ragMetadata.actualChunks && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Chunks</span>
                  <span className="font-medium text-slate-900">
                    {file.ragMetadata.actualChunks}
                  </span>
                </div>
              )}

              {file.ragMetadata.extractedTextLength && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Text Length</span>
                  <span className="font-medium text-slate-900">
                    {file.ragMetadata.extractedTextLength.toLocaleString()} chars
                  </span>
                </div>
              )}

              {file.ragMetadata.processingTimeMs && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Processing Time</span>
                  <span className="font-medium text-slate-900">
                    {(file.ragMetadata.processingTimeMs / 1000).toFixed(2)}s
                  </span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Model</span>
                <span className="font-medium text-slate-900">
                  {file.ragMetadata.embeddingModel || 'text-embedding-004'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">File Information</h3>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Database className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-slate-600">File ID</div>
                <div className="font-mono text-xs text-slate-900 break-all">{file.id}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-slate-600">Uploaded By</div>
                <div className="text-slate-900 break-all">{file.uploadedByEmail || file.uploadedBy}</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-slate-600">Created</div>
                <div className="text-slate-900">{new Date(file.uploadedAt).toLocaleString()}</div>
              </div>
            </div>

            {file.geminiFileName && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-slate-600">Gemini File ID</div>
                  <div className="font-mono text-xs text-slate-900 break-all">{file.geminiFileName}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 space-y-2">
        {file.sourceType === 'training' && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onEdit(file)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Training Data
          </Button>
        )}

        <Button
          variant="destructive"
          className="w-full"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Document
        </Button>
      </div>
    </div>
  );
}