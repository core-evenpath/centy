'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UploadTask {
  id: string;
  file: File;
  progress: number;
  currentStep: number;
  status: 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

const steps = [
  'Saving to storage',
  'Creating knowledge base',
  'Processing with AI',
  'Finalizing'
];

export function useUploadManager() {
  const [tasks, setTasks] = useState<Map<string, UploadTask>>(new Map());
  const { toast } = useToast();

  const getStepEmoji = (step: number) => {
    switch(step) {
      case 0: return '💾';
      case 1: return '📚';
      case 2: return '⚡';
      case 3: return '✨';
      default: return '📤';
    }
  };

  const startUpload = useCallback(
    (file: File, partnerId: string, userId: string, onComplete?: () => void) => {
      const taskId = `${Date.now()}-${file.name}`;

      const task: UploadTask = {
        id: taskId,
        file,
        progress: 0,
        currentStep: 0,
        status: 'uploading',
      };

      setTasks((prev) => new Map(prev).set(taskId, task));

      // Show initial toast
      toast({
        title: `📤 Uploading ${file.name}`,
        description: `${(file.size / 1024 / 1024).toFixed(2)} MB • Starting upload...`,
        duration: Infinity,
      });

      // Perform upload
      performUpload(file, partnerId, userId, taskId, onComplete);
    },
    [toast]
  );

  const performUpload = async (
    file: File,
    partnerId: string,
    userId: string,
    taskId: string,
    onComplete?: () => void
  ) => {
    const fileName = file.name;
    const fileSize = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('partnerId', partnerId);
      formData.append('userId', userId);
      formData.append('displayName', fileName);

      // Step 1: Saving to storage (25%)
      updateTask(taskId, { progress: 25, currentStep: 0 });
      toast({
        title: `${getStepEmoji(0)} ${fileName}`,
        description: `${fileSize} • ${steps[0]}...`,
        duration: Infinity,
      });
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Step 2: Creating knowledge base (50%)
      updateTask(taskId, { progress: 50, currentStep: 1 });
      toast({
        title: `${getStepEmoji(1)} ${fileName}`,
        description: `${fileSize} • ${steps[1]}...`,
        duration: Infinity,
      });

      const response = await fetch('/api/vault/upload', {
        method: 'POST',
        body: formData,
      });

      // Step 3: Processing with AI (75%)
      updateTask(taskId, { progress: 75, currentStep: 2 });
      toast({
        title: `${getStepEmoji(2)} ${fileName}`,
        description: `${fileSize} • ${steps[2]}...`,
        duration: Infinity,
      });

      const result = await response.json();

      if (result.success) {
        // Step 4: Finalizing (100%)
        updateTask(taskId, { progress: 100, currentStep: 3, status: 'success' });

        // Show success toast
        toast({
          title: `✅ ${fileName}`,
          description: `${fileSize} • Successfully added to knowledge base!`,
          duration: 5000,
        });

        // Cleanup task after delay
        setTimeout(() => {
          setTasks((prev) => {
            const newTasks = new Map(prev);
            newTasks.delete(taskId);
            return newTasks;
          });
        }, 5000);

        if (onComplete) {
          onComplete();
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      updateTask(taskId, {
        status: 'error',
        errorMessage: error.message || 'Upload failed',
      });

      toast({
        title: `❌ ${fileName}`,
        description: `${error.message || 'Upload failed'}`,
        variant: 'destructive',
        duration: 7000,
      });

      // Cleanup task after delay
      setTimeout(() => {
        setTasks((prev) => {
          const newTasks = new Map(prev);
          newTasks.delete(taskId);
          return newTasks;
        });
      }, 7000);
    }
  };

  const updateTask = (taskId: string, updates: Partial<UploadTask>) => {
    setTasks((prev) => {
      const newTasks = new Map(prev);
      const task = newTasks.get(taskId);
      if (task) {
        newTasks.set(taskId, { ...task, ...updates });
      }
      return newTasks;
    });
  };

  return {
    tasks,
    startUpload,
  };
}