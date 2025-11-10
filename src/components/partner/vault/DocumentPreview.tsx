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
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Document Details</h3>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
        >
          <X className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Preview */}
        <div className="p-4 border-b border-gray-100">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 flex items-center justify-center mb-3">
            <FileText className="h-16 w-16 text-blue-600" />
          </div>
          <h4 className="text-sm font-semibold text-gray-900 mb-1 break-words">
            {file.displayName}
          </h4>
          <p className="text-xs text-gray-500">
            {file.mimeType}
          </p>
        </div>

        {/* Metadata */}
        <div className="p-4 space-y-3 border-b border-gray-100">
          <h5 className="text-[10px] font-semibold text-gray-500 uppercase">
            Metadata
          </h5>
          
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <HardDrive className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-[10px] text-gray-500">Size</p>
                <p className="text-xs font-medium text-gray-900">
                  {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-[10px] text-gray-500">Uploaded</p>
                <p className="text-xs font-medium text-gray-900">
                  {file.createdAt ? format(new Date(file.createdAt), 'MMM d, yyyy') : 'Unknown'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <User className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-[10px] text-gray-500">Uploaded By</p>
                <p className="text-xs font-medium text-gray-900 truncate">
                  {file.uploadedBy || 'Unknown'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Sparkles className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-[10px] text-gray-500">AI Status</p>
                {file.state === 'ACTIVE' ? (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1 mt-0.5">
                    <div className="h-1.5 w-1.5 bg-green-600 rounded-full"></div>
                    Synced
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 font-medium mt-0.5 block">
                    Pending
                  </span>
                )}
              </div>
            </div>

            {file.geminiFileUri && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5 mt-3">
                <div className="flex items-start gap-2">
                  <Database className="h-3.5 w-3.5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-medium text-blue-900">
                      Knowledge Base ID
                    </p>
                    <p className="text-[10px] text-blue-700 mt-0.5 font-mono break-all">
                      {file.geminiFileUri.split('/').pop() || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Storage Info */}
        <div className="p-4 space-y-3">
          <h5 className="text-[10px] font-semibold text-gray-500 uppercase">
            Storage
          </h5>
          
          <div className="bg-gray-50 rounded-md p-2.5">
            <p className="text-[10px] text-gray-600 mb-1">File Path</p>
            <p className="text-[10px] font-mono text-gray-900 break-all">
              {file.uri}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-gray-200 space-y-2">
        <Button variant="outline" className="w-full justify-start h-9 text-xs">
          <Download className="h-3.5 w-3.5 mr-2" />
          Download Document
        </Button>
        <Button 
          variant="outline" 
          className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 h-9 text-xs"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          Delete Document
        </Button>
      </div>
    </div>
  );
}