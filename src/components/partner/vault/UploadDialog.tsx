'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { uploadFileToVault, getVaultFileStatus } from '@/actions/vault-actions';

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
  userId: string;
  onUploadComplete: () => void;
  onUploadStart?: (id: string, fileName: string) => void;
  onUploadProgress?: (id: string, step: number, description: string) => void;
  onUploadSuccess?: (id: string) => void;
  onUploadError?: (id: string, error: string) => void;
}

export default function UploadDialog({
  isOpen,
  onClose,
  partnerId,
  userId,
  onUploadComplete,
  onUploadStart,
  onUploadProgress,
  onUploadSuccess,
  onUploadError,
}: UploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxSize: 100 * 1024 * 1024,
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const pollFileStatus = async (uploadId: string, fileId: string, partnerId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async (): Promise<void> => {
      if (attempts >= maxAttempts) {
        onUploadError?.(uploadId, 'Upload timeout - please refresh to check status');
        return;
      }

      attempts++;

      try {
        const status = await getVaultFileStatus(partnerId, fileId);

        if (!status.success) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          return poll();
        }

        const { state, processingStep, processingDescription, errorMessage } = status;

        if (state === 'PROCESSING') {
          onUploadProgress?.(uploadId, processingStep || 3, processingDescription || 'Processing...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          return poll();
        }

        if (state === 'ACTIVE') {
          onUploadSuccess?.(uploadId);
          return;
        }

        if (state === 'FAILED') {
          onUploadError?.(uploadId, errorMessage || 'Upload failed');
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
        return poll();
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        return poll();
      }
    };

    await poll();
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || isUploading) return;

    setIsUploading(true);

    for (const file of selectedFiles) {
      const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      try {
        onUploadStart?.(uploadId, file.name);
        onUploadProgress?.(uploadId, 1, 'Reading file...');

        const base64Data = await fileToBase64(file);
        onUploadProgress?.(uploadId, 2, 'Uploading...');

        const result = await uploadFileToVault(partnerId, userId, {
          name: file.name,
          base64Data,
          mimeType: file.type,
          displayName: file.name,
        });

        if (result.success && result.file) {
          onUploadProgress?.(uploadId, 3, 'Processing...');
          pollFileStatus(uploadId, result.file.id, partnerId);
          onUploadComplete();
        } else {
          throw new Error(result.message);
        }
      } catch (error: any) {
        console.error('Upload error:', error);
        onUploadError?.(uploadId, error.message || 'Upload failed');
        toast({
          title: 'Upload failed',
          description: `${file.name}: ${error.message}`,
          variant: 'destructive',
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setSelectedFiles([]);
    setIsUploading(false);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Add PDF, text, or markdown files to your knowledge base.
            Documents will be automatically analyzed and tagged for better search.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
              }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop files here...</p>
            ) : (
              <>
                <p className="text-slate-700 font-medium mb-1">
                  Drag & drop files here, or click to browse
                </p>
                <p className="text-sm text-slate-500">
                  Supports PDF, TXT, and MD files up to 100MB
                </p>
              </>
            )}
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700">
                Selected Files ({selectedFiles.length})
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 text-slate-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}