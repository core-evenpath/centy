'use client';

import React from 'react';
import { File, Trash2, Download } from 'lucide-react';
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
      <div className="text-center py-12">
        <File className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">No files uploaded yet</p>
        <p className="text-sm text-gray-500 mt-2">
          Upload files to start building your knowledge base
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
        >
          <File className="h-8 w-8 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.displayName}
            </p>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs text-gray-500">
                {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(file.uploadedAt), {
                  addSuffix: true,
                })}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  file.state === 'ACTIVE'
                    ? 'bg-green-100 text-green-700'
                    : file.state === 'PROCESSING'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {file.state}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(file.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}