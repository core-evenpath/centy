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

// Cross-browser compatible UUID generator
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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
    { id: generateUUID(), question: '', answer: '' }
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
              id: generateUUID(),
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
    setEntries([{ id: generateUUID(), question: '', answer: '' }]);
  };

  const addEntry = () => {
    setEntries([...entries, { id: generateUUID(), question: '', answer: '' }]);
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
      <DialogContent className="max-w-5xl max-h-[95vh] flex flex-col p-0 gap-0 border-0 bg-white shadow-2xl">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-200/60 bg-gradient-to-b from-slate-50/50 to-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-3xl font-semibold text-slate-900 mb-2 tracking-tight">
                {existingFile ? 'Edit Training Dataset' : 'New Training Dataset'}
              </DialogTitle>
              <DialogDescription className="text-base text-slate-600 leading-relaxed">
                Create question-answer pairs to train your AI assistant. Each entry helps improve response accuracy.
              </DialogDescription>
            </div>
            <Sparkles className="h-8 w-8 text-blue-500 opacity-60" />
          </div>
        </div>

        {isLoadingExisting ? (
          <div className="flex-1 flex items-center justify-center min-h-[500px]">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 mb-4">
                <div className="animate-spin rounded-full h-14 w-14 border-3 border-slate-200 border-t-blue-500"></div>
              </div>
              <p className="text-sm text-slate-500 font-medium">Loading dataset...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Dataset Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  Dataset Name
                </label>
                <Input
                  placeholder="e.g., Product Support FAQ"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="h-14 text-base px-4 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                />
              </div>

              {/* Section Header */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Question & Answer Pairs</h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {entries.filter(e => e.question.trim() && e.answer.trim()).length} of {entries.length} complete
                  </p>
                </div>
                <Button
                  onClick={addEntry}
                  className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Pair
                </Button>
              </div>

              {/* Entries */}
              <div className="space-y-5">
                {entries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="group relative border border-slate-200 rounded-2xl p-7 bg-white hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300"
                  >
                    {/* Entry Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-slate-700 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-slate-600">
                          Pair #{index + 1}
                        </span>
                      </div>
                      {entries.length > 1 && (
                        <button
                          onClick={() => removeEntry(entry.id)}
                          className="opacity-0 group-hover:opacity-100 p-2.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          aria-label="Remove pair"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>

                    {/* Fields */}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2.5">
                          Question
                        </label>
                        <Textarea
                          placeholder="What should users ask?"
                          value={entry.question}
                          onChange={(e) => updateEntry(entry.id, 'question', e.target.value)}
                          rows={2}
                          className="resize-none text-base px-4 py-3 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2.5">
                          Answer
                        </label>
                        <Textarea
                          placeholder="How should the AI respond?"
                          value={entry.answer}
                          onChange={(e) => updateEntry(entry.id, 'answer', e.target.value)}
                          rows={3}
                          className="resize-none text-base px-4 py-3 border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-200/60 bg-gradient-to-t from-slate-50/50 to-white">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Will be saved as <span className="font-semibold text-slate-900">{datasetName || 'untitled'}.md</span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="h-11 px-6 border-slate-300 hover:bg-slate-50 rounded-xl font-medium transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isUploading || !datasetName.trim() || isLoadingExisting}
                className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <span className="flex items-center gap-2.5">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    {existingFile ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  existingFile ? 'Save Changes' : 'Create Dataset'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}