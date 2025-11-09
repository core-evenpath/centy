'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, Loader2, FileText, AlertCircle, Sparkles, Database, Zap } from 'lucide-react';
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
  step?: string;
}

const uploadSteps = [
  { icon: Upload, label: 'Saving to storage', color: 'text-blue-600' },
  { icon: Database, label: 'Creating knowledge base', color: 'text-purple-600' },
  { icon: Zap, label: 'Processing with AI', color: 'text-yellow-600' },
  { icon: Sparkles, label: 'Finalizing', color: 'text-green-600' },
];

export default function FileUploader({
  partnerId,
  userId,
  onUploadComplete,
}: FileUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => ({
        file,
        progress: 0,
        status: 'uploading' as const,
        step: uploadSteps[0].label,
      }));

      setUploadingFiles(newFiles);

      for (const fileItem of newFiles) {
        try {
          const formData = new FormData();
          formData.append('file', fileItem.file);
          formData.append('partnerId', partnerId);
          formData.append('userId', userId);
          formData.append('displayName', fileItem.file.name);

          setCurrentStep(0);
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === fileItem.file
                ? { ...f, progress: 25, step: uploadSteps[0].label }
                : f
            )
          );

          await new Promise(resolve => setTimeout(resolve, 300));
          setCurrentStep(1);
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === fileItem.file
                ? { ...f, progress: 50, step: uploadSteps[1].label }
                : f
            )
          );

          const response = await fetch('/api/vault/upload', {
            method: 'POST',
            body: formData,
          });

          setCurrentStep(2);
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === fileItem.file
                ? { ...f, progress: 75, step: uploadSteps[2].label }
                : f
            )
          );

          const result = await response.json();

          if (result.success) {
            setCurrentStep(3);
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.file === fileItem.file
                  ? { ...f, progress: 100, status: 'success', step: 'Complete!' }
                  : f
              )
            );

            toast({
              title: '✨ Upload successful!',
              description: `${fileItem.file.name} is now in your knowledge base`,
            });
          } else {
            throw new Error(result.message);
          }
        } catch (error: any) {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === fileItem.file
                ? { ...f, status: 'error', message: error.message, progress: 0 }
                : f
            )
          );

          toast({
            title: '❌ Upload failed',
            description: error.message,
            variant: 'destructive',
          });
        }
      }

      if (onUploadComplete) {
        setTimeout(() => {
          onUploadComplete();
          setUploadingFiles([]);
        }, 2000);
      }
    },
    [partnerId, userId, toast, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxSize: 100 * 1024 * 1024,
  });

  const removeFile = (file: File) => {
    setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
  };

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 scale-105'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all ${
            isDragActive ? 'bg-blue-600 scale-110' : 'bg-gray-100'
          }`}>
            <Upload className={`h-10 w-10 ${isDragActive ? 'text-white' : 'text-gray-400'}`} />
          </div>
          {isDragActive ? (
            <>
              <p className="text-xl font-semibold text-blue-600">Drop your files here!</p>
              <p className="text-sm text-blue-500">Release to upload to your knowledge base</p>
            </>
          ) : (
            <>
              <div>
                <p className="text-xl font-semibold text-gray-700 mb-2">
                  Drag & drop your documents here
                </p>
                <p className="text-sm text-gray-500">
                  or click to browse your files
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  PDF
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  TXT
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  MD
                </span>
                <span className="text-gray-400">•</span>
                <span>Max 100MB</span>
              </div>
            </>
          )}
        </div>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-4">
          {uploadingFiles.map((item, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${
                  item.status === 'success' ? 'bg-green-100' :
                  item.status === 'error' ? 'bg-red-100' :
                  'bg-blue-100'
                }`}>
                  {item.status === 'uploading' && (
                    <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                  )}
                  {item.status === 'success' && (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {item.file.name}
                    </p>
                    <span className="text-xs text-gray-500 ml-2">
                      {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>

                  {item.status === 'uploading' && (
                    <>
                      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                        <div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 rounded-full"
                          style={{ width: `${item.progress}%` }}
                        >
                          <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {uploadSteps.map((step, idx) => {
                          const StepIcon = step.icon;
                          const isActive = idx === currentStep;
                          const isComplete = idx < currentStep;
                          
                          return (
                            <React.Fragment key={idx}>
                              <div className={`flex items-center gap-1 ${
                                isActive ? step.color + ' font-semibold' :
                                isComplete ? 'text-green-600' :
                                'text-gray-400'
                              }`}>
                                <StepIcon className="h-4 w-4" />
                                <span className="text-xs">{step.label}</span>
                                {isComplete && <CheckCircle className="h-3 w-3" />}
                              </div>
                              {idx < uploadSteps.length - 1 && (
                                <span className="text-gray-300">→</span>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {item.status === 'success' && (
                    <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Successfully added to your knowledge base!
                    </p>
                  )}

                  {item.status === 'error' && (
                    <div className="space-y-2">
                      <p className="text-sm text-red-600 font-medium">
                        {item.message || 'Upload failed'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(item.file)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}