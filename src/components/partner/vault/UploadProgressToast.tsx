'use client';

import React from 'react';
import { CheckCircle, Loader2, Database, Zap, Sparkles } from 'lucide-react';

interface UploadProgressToastProps {
  fileName: string;
  fileSize: string;
  progress: number;
  currentStep: number;
  status: 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

const steps = [
  { icon: CheckCircle, label: 'Saving to storage', color: 'text-green-600' },
  { icon: Database, label: 'Creating knowledge base', color: 'text-purple-600' },
  { icon: Zap, label: 'Processing with AI', color: 'text-yellow-600' },
  { icon: Sparkles, label: 'Finalizing', color: 'text-blue-600' },
];

export default function UploadProgressToast({
  fileName,
  fileSize,
  progress,
  currentStep,
  status,
  errorMessage,
}: UploadProgressToastProps) {
  return (
    <div className="w-full max-w-md">
      {/* File Info */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          {status === 'uploading' && <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />}
          {status === 'success' && <CheckCircle className="h-6 w-6 text-green-600" />}
          {status === 'error' && <div className="h-6 w-6 text-red-600">✕</div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{fileName}</p>
          <p className="text-xs text-gray-500">{fileSize}</p>
        </div>
      </div>

      {/* Progress Bar */}
      {status === 'uploading' && (
        <>
          <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
            </div>
          </div>

          {/* Steps */}
          <div className="flex items-center justify-between text-xs">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = idx === currentStep;
              const isComplete = idx < currentStep;

              return (
                <React.Fragment key={idx}>
                  <div
                    className={`flex items-center gap-1 transition-all ${
                      isActive
                        ? step.color + ' font-semibold'
                        : isComplete
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}
                  >
                    <StepIcon className="h-3 w-3" />
                    <span className="hidden sm:inline">{step.label}</span>
                    {isComplete && <CheckCircle className="h-2 w-2" />}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`h-px flex-1 mx-1 ${isComplete ? 'bg-green-400' : 'bg-gray-300'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </>
      )}

      {/* Success Message */}
      {status === 'success' && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
          <Sparkles className="h-4 w-4" />
          <span className="font-medium">Successfully added to knowledge base!</span>
        </div>
      )}

      {/* Error Message */}
      {status === 'error' && errorMessage && (
        <div className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">
          {errorMessage}
        </div>
      )}
    </div>
  );
}