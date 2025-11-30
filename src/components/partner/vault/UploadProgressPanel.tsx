'use client';

import React from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload
} from 'lucide-react';
import type { UploadProgress } from '@/hooks/use-upload-progress';

interface UploadProgressPanelProps {
  uploads: UploadProgress[];
  onClose: () => void;
  onClearCompleted: () => void;
}

export default function UploadProgressPanel({
  uploads,
  onClose,
  onClearCompleted
}: UploadProgressPanelProps) {
  if (uploads.length === 0) return null;

  const activeUploads = uploads.filter(u => !['complete', 'failed'].includes(u.status));
  const completedUploads = uploads.filter(u => ['complete', 'failed'].includes(u.status));

  const getStepIcon = (step: number, currentStep: number, status: string) => {
    if (step < currentStep) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    } else if (step === currentStep && status !== 'failed') {
      return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
    } else if (status === 'failed') {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    } else {
      return <div className="h-4 w-4 rounded-full border-2 border-slate-300" />;
    }
  };

  const getStepLabel = (step: number) => {
    switch (step) {
      case 1: return 'Creating record';
      case 2: return 'Uploading file';
      case 3: return 'Storing in vault';
      case 4: return 'Creating embeddings';
      case 5: return 'Finalizing';
      case 6: return 'Ready to query';
      default: return '';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-2xl border border-slate-200 z-50 max-h-[600px] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-slate-900">
            Upload Progress {activeUploads.length > 0 && `(${activeUploads.length} active)`}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white rounded-lg transition-colors"
        >
          <X className="h-4 w-4 text-slate-600" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1">
        {activeUploads.length > 0 && (
          <div className="border-b border-slate-200">
            {activeUploads.map((upload) => (
              <div key={upload.id} className="p-4 border-b border-slate-100 last:border-b-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {upload.fileName}
                    </p>
                    <p className="text-xs text-slate-500">
                      Step {upload.currentStep} of {upload.totalSteps}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6].map((step) => (
                    <div key={step} className="flex items-start gap-2">
                      {getStepIcon(step, upload.currentStep, upload.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${step <= upload.currentStep
                              ? 'text-slate-900 font-medium'
                              : 'text-slate-400'
                            }`}>
                            {getStepLabel(step)}
                          </span>
                          {step < upload.currentStep && (
                            <span className="text-xs text-green-600">✓</span>
                          )}
                        </div>
                        {step === upload.currentStep && step < upload.totalSteps && upload.status !== 'failed' && (
                          <div className="w-full bg-slate-200 rounded-full h-1 mt-1">
                            <div className="bg-blue-600 h-1 rounded-full animate-pulse w-2/3" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {upload.error && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-xs text-red-600">{upload.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {completedUploads.length > 0 && (
          <div className="p-4 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-slate-700">
                Completed ({completedUploads.length})
              </h4>
              <button
                onClick={onClearCompleted}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-2">
              {completedUploads.map((upload) => (
                <div key={upload.id} className="flex items-center gap-2 text-xs p-2 bg-white rounded-lg">
                  {upload.status === 'complete' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="truncate flex-1 text-slate-700">{upload.fileName}</span>
                  <span className={upload.status === 'complete' ? 'text-green-600' : 'text-red-600'}>
                    {upload.status === 'complete' ? 'Done' : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}