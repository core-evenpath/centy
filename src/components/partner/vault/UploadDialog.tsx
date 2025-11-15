'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText } from 'lucide-react';
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
    setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
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
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
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

  const pollFileStatus = async (
    uploadId: string,
    fileId: string,
    partnerId: string
  ) => {
    const maxAttempts = 60; // 3 minutes max
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
          // Update with REAL backend progress
          onUploadProgress?.(
            uploadId, 
            processingStep || 1, 
            processingDescription || 'Processing...'
          );
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          return poll();
        } else if (state === 'ACTIVE') {
          onUploadProgress?.(uploadId, 5, 'Complete! Ready to query.');
          onUploadSuccess?.(uploadId);
          return;
        } else if (state === 'FAILED') {
          onUploadError?.(uploadId, errorMessage || 'Upload failed');
          return;
        }
      } catch (error) {
        console.error('Error polling status:', error);
        await new Promise(resolve => setTimeout(resolve, 3000));
        return poll();
      }
    };
  
    poll();
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const filesToUpload = [...selectedFiles];
    setSelectedFiles([]);

    for (const file of filesToUpload) {
      const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        // Step 1: Start upload
        onUploadStart?.(uploadId, file.name);
        onUploadProgress?.(uploadId, 1, 'Preparing file...');

        // Convert file to base64
        const base64Data = await fileToBase64(file);

        onUploadProgress?.(uploadId, 2, 'Uploading to server...');

        // Step 2: Call server action
        const result = await uploadFileToVault(partnerId, userId, {
          name: file.name,
          base64Data: base64Data,
          mimeType: file.type,
          displayName: file.name,
        });

        if (result.success && result.file?.id) {
          // Step 3: Poll for status updates
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

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setIsUploading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogDescription>
            Add PDF, text, or markdown files to your knowledge base
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-sm text-blue-600 font-medium">Drop files here...</p>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  Supported: PDF, TXT, MD (max 100MB)
                </p>
              </>
            )}
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                Selected Files ({selectedFiles.length})
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
            >
              {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}