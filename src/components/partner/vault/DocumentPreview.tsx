'use client';

import React from 'react';
import { 
  X, 
  FileText, 
  Calendar, 
  HardDrive,
  User,
  Trash2,
  Download,
  Sparkles,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VaultFile } from '@/lib/types';
import { format } from 'date-fns';

interface DocumentPreviewProps {
  file: VaultFile;
  onClose: () => void;
  onDelete: () => void;
}

export default function DocumentPreview({ file, onClose, onDelete }: DocumentPreviewProps) {
  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Document Details</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Preview */}
        <div className="p-6 border-b border-gray-100">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 flex items-center justify-center mb-4">
            <FileText className="h-20 w-20 text-blue-600" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900 mb-1 break-words">
            {file.displayName}
          </h4>
          <p className="text-xs text-gray-500">
            {file.mimeType}
          </p>
        </div>

        {/* Metadata */}
        <div className="p-6 space-y-4 border-b border-gray-100">
          <h5 className="text-xs font-semibold text-gray-500 uppercase">
            Metadata
          </h5>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <HardDrive className="h-4 w-4 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Size</p>
                <p className="text-sm font-medium text-gray-900">
                  {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Uploaded</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(file.uploadedAt), 'MMM dd, yyyy')}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(file.uploadedAt), 'h:mm a')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Uploaded by</p>
                <p className="text-sm font-medium text-gray-900">
                  {file.uploadedBy}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Status */}
        <div className="p-6 space-y-4 border-b border-gray-100">
          <h5 className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Training Status
          </h5>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Embeddings</span>
              {file.state === 'ACTIVE' ? (
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                  Ready
                </span>
              ) : (
                <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                  <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
                  Processing
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Vector Store</span>
              {file.state === 'ACTIVE' ? (
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                  Synced
                </span>
              ) : (
                <span className="text-xs text-gray-400 font-medium">
                  Pending
                </span>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <div className="flex items-start gap-2">
                <Database className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-blue-900">
                    Knowledge Base ID
                  </p>
                  <p className="text-xs text-blue-700 mt-1 font-mono break-all">
                    {file.geminiFileUri?.split('/').pop() || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Storage Info */}
        <div className="p-6 space-y-4">
          <h5 className="text-xs font-semibold text-gray-500 uppercase">
            Storage
          </h5>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-2">File Path</p>
            <p className="text-xs font-mono text-gray-900 break-all">
              {file.uri}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Button variant="outline" className="w-full justify-start">
          <Download className="h-4 w-4 mr-2" />
          Download Document
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Document
        </Button>
      </div>
    </div>
  );
}