'use client';

import React from 'react';
import { File, Trash2, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VaultFile } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface FilesListProps {
  files: VaultFile[];
  onDelete: (fileId: string) => void;
}

export default function FilesList({ files, onDelete }: FilesListProps) {
  if (files.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <FileText className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No files uploaded yet</h3>
        <p className="text-gray-600">
          Upload your first document to start building your knowledge base
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {files.map((file) => (
        <div
          key={file.id}
          className="group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">
                {file.displayName}
              </h4>
              
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-2">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  {file.state}
                </span>
                <span>•</span>
                <span>
                  {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB
                </span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(file.uploadedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(file.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity -ml-2"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}