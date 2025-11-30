'use client';

import { useState, useCallback } from 'react';

export interface UploadProgress {
  id: string;
  fileName: string;
  status: 'uploading' | 'storing' | 'ragProcessing' | 'complete' | 'failed';
  currentStep: number;
  totalSteps: number;
  stepDescription: string;
  error?: string;
}

export function useUploadProgress() {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);

  const startUpload = useCallback((fileName: string, providedId?: string): string => {
    const id = providedId || `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newUpload: UploadProgress = {
      id,
      fileName,
      status: 'uploading',
      currentStep: 1,
      totalSteps: 6,
      stepDescription: 'Creating file record...',
    };
    setUploads(prev => [...prev, newUpload]);
    return id;
  }, []);

  const updateUploadStep = useCallback((
    id: string,
    step: number,
    description: string,
    status?: UploadProgress['status']
  ) => {
    setUploads(prev => prev.map(upload =>
      upload.id === id
        ? {
          ...upload,
          currentStep: step,
          stepDescription: description,
          status: status || upload.status
        }
        : upload
    ));
  }, []);

  const completeUpload = useCallback((id: string) => {
    setUploads(prev => prev.map(upload =>
      upload.id === id
        ? {
          ...upload,
          status: 'complete' as const,
          currentStep: 6,
          stepDescription: 'Upload complete! Ready to query.'
        }
        : upload
    ));
  }, []);

  const failUpload = useCallback((id: string, error: string) => {
    setUploads(prev => prev.map(upload =>
      upload.id === id
        ? {
          ...upload,
          status: 'failed' as const,
          error,
          stepDescription: 'Upload failed'
        }
        : upload
    ));
  }, []);

  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(u => !['complete', 'failed'].includes(u.status)));
  }, []);

  const clearAll = useCallback(() => {
    setUploads([]);
  }, []);

  return {
    uploads,
    startUpload,
    updateUploadStep,
    completeUpload,
    failUpload,
    clearCompleted,
    clearAll,
  };
}