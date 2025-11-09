'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
  partnerId: string;
  userId: string;
  onUploadComplete?: () => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  message?: string;
}

export default function FileUploader({
  partnerId,
  userId,
  onUploadComplete,
}: FileUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => ({
        file,
        progress: 0,
        status: 'uploading' as const,
      }));

      setUploadingFiles((prev) => [...prev, ...newFiles]);

      for (const fileItem of newFiles) {
        try {
          const formData = new FormData();
          formData.append('file', fileItem.file);
          formData.append('partnerId', partnerId);
          formData.append('userId', userId);
          formData.append('displayName', fileItem.file.name);

          const response = await fetch('/api/vault/upload', {
            method: 'POST',
            body: formData,
          });

          const result = await response.json();

          if (result.success) {
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.file === fileItem.file
                  ? { ...f, progress: 100, status: 'success' }
                  : f
              )
            );

            toast({
              title: 'File uploaded',
              description: `${fileItem.file.name} uploaded successfully`,
            });
          } else {
            throw new Error(result.message);
          }
        } catch (error: any) {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === fileItem.file
                ? { ...f, status: 'error', message: error.message }
                : f
            )
          );

          toast({
            title: 'Upload failed',
            description: error.message,
            variant: 'destructive',
          });
        }
      }

      if (onUploadComplete) {
        onUploadComplete();
      }

      setTimeout(() => {
        setUploadingFiles([]);
      }, 3000);
    },
    [partnerId, userId, toast, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
      'text/markdown': ['.md'],
    },
  });

  const removeFile = (file: File) => {
    setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop files here...</p>
        ) : (
          <>
            <p className="text-gray-600 mb-2">
              Drag and drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF, TXT, DOC, DOCX, MD files (max 100MB)
            </p>
          </>
        )}
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-white border rounded-lg"
            >
              <File className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(item.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {item.status === 'uploading' && (
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              )}
              {item.status === 'success' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {item.status === 'error' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(item.file)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}