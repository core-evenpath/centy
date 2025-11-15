// src/components/partner/vault/TrainingDataDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createTrainingDataFile, updateTrainingDataFile, getVaultFileContent } from '@/actions/vault-actions';
import type { VaultFile } from '@/lib/types';

interface TrainingDataDialogProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
  userId: string;
  onUploadComplete: () => void;
  existingFile?: VaultFile | null;
}

interface TrainingEntry {
  id: string;
  question: string;
  answer: string;
}

export default function TrainingDataDialog({
  isOpen,
  onClose,
  partnerId,
  userId,
  onUploadComplete,
  existingFile = null,
}: TrainingDataDialogProps) {
  const [datasetName, setDatasetName] = useState('');
  const [entries, setEntries] = useState<TrainingEntry[]>([
    { id: crypto.randomUUID(), question: '', answer: '' }
  ]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && existingFile) {
      loadExistingFile();
    } else if (isOpen && !existingFile) {
      resetForm();
    }
  }, [isOpen, existingFile]);

  const loadExistingFile = async () => {
    if (!existingFile) return;

    setIsLoadingExisting(true);
    try {
      const result = await getVaultFileContent(partnerId, existingFile.id);
      if (result.success && result.content) {
        const lines = result.content.split('\n').filter(line => line.trim());
        const parsed = lines.map(line => {
          try {
            const data = JSON.parse(line);
            return {
              id: crypto.randomUUID(),
              question: data.question,
              answer: data.answer,
            };
          } catch {
            return null;
          }
        }).filter((e): e is TrainingEntry => e !== null);

        if (parsed.length > 0) {
          setEntries(parsed);
        }
        setDatasetName(existingFile.displayName.replace('.md', ''));
      }
    } catch (error: any) {
      toast({
        title: 'Failed to load',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingExisting(false);
    }
  };

  const resetForm = () => {
    setDatasetName('');
    setEntries([{ id: crypto.randomUUID(), question: '', answer: '' }]);
  };

  const addEntry = () => {
    setEntries([...entries, { id: crypto.randomUUID(), question: '', answer: '' }]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const updateEntry = (id: string, field: keyof TrainingEntry, value: string) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const generateJSONL = () => {
    return entries
      .filter(e => e.question.trim() && e.answer.trim())
      .map(e => JSON.stringify({
        question: e.question.trim(),
        answer: e.answer.trim(),
      }))
      .join('\n');
  };

  const handleSave = async () => {
    if (!datasetName.trim()) {
      toast({
        title: 'Dataset name required',
        variant: 'destructive',
      });
      return;
    }

    const validEntries = entries.filter(e => e.question.trim() && e.answer.trim());
    if (validEntries.length === 0) {
      toast({
        title: 'No valid entries',
        description: 'Add at least one Q&A pair',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const jsonlContent = generateJSONL();
      let result;
      
      if (existingFile) {
        result = await updateTrainingDataFile(
          partnerId,
          existingFile.id,
          userId,
          datasetName.trim(),
          jsonlContent
        );
      } else {
        result = await createTrainingDataFile(
          partnerId,
          userId,
          datasetName.trim(),
          jsonlContent
        );
      }

      if (result.success) {
        toast({
          title: existingFile ? 'Updated' : 'Created',
          description: `${datasetName}.md with ${validEntries.length} entries`,
        });
        
        resetForm();
        onClose();
        onUploadComplete();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: 'Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            {existingFile ? 'Edit Training Data' : 'Add Training Data'}
          </DialogTitle>
          <DialogDescription>
            Create Q&A pairs - saved as .md for RAG
          </DialogDescription>
        </DialogHeader>

        {isLoadingExisting ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 pr-2">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Dataset Name
                </label>
                <Input
                  placeholder="e.g., Product FAQ"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Q&A Pairs ({entries.filter(e => e.question.trim() && e.answer.trim()).length})
                </label>
                <Button onClick={addEntry} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {entries.map((entry, index) => (
                  <div key={entry.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-500">
                        Entry #{index + 1}
                      </span>
                      {entries.length > 1 && (
                        <button
                          onClick={() => removeEntry(entry.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">
                          Question
                        </label>
                        <Textarea
                          placeholder="What should the AI be asked?"
                          value={entry.question}
                          onChange={(e) => updateEntry(entry.id, 'question', e.target.value)}
                          rows={2}
                          className="resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">
                          Answer
                        </label>
                        <Textarea
                          placeholder="How should the AI respond?"
                          value={entry.answer}
                          onChange={(e) => updateEntry(entry.id, 'answer', e.target.value)}
                          rows={3}
                          className="resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            Will be saved as {datasetName || 'dataset'}.md
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUploading || !datasetName.trim() || isLoadingExisting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? (existingFile ? 'Updating...' : 'Creating...') : (existingFile ? 'Update' : 'Create')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}