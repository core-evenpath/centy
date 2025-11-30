'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
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
import type { VaultFile } from '@/lib/types-vault';

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
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && !existingFile) {
      resetForm();
    }
  }, [isOpen, existingFile]);

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

  const handleSubmit = async () => {
    if (!datasetName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a name for this training dataset',
        variant: 'destructive',
      });
      return;
    }

    const validEntries = entries.filter(e => e.question.trim() && e.answer.trim());
    if (validEntries.length === 0) {
      toast({
        title: 'Entries required',
        description: 'Please add at least one Q&A pair',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const { uploadFileToVault } = await import('@/actions/vault-actions');

      const markdownContent = `# ${datasetName}\n\n*Training Data - ${validEntries.length} Q&A pairs*\n\n---\n\n` +
        validEntries.map((e, i) =>
          `## Entry ${i + 1}\n\n**Question:** ${e.question}\n\n**Answer:** ${e.answer}\n\n---\n\n`
        ).join('');

      const base64Data = Buffer.from(markdownContent).toString('base64');

      const result = await uploadFileToVault(partnerId, userId, {
        name: `${datasetName.replace(/[^a-z0-9]/gi, '_')}.md`,
        base64Data,
        mimeType: 'text/markdown',
        displayName: `${datasetName}.md`,
      });

      if (result.success) {
        toast({
          title: 'Training data created',
          description: `${validEntries.length} Q&A pairs added to knowledge base`,
        });
        onUploadComplete();
        onClose();
        resetForm();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            {existingFile ? 'Edit Training Data' : 'Add Training Data'}
          </DialogTitle>
          <DialogDescription>
            Add Q&A pairs to train your knowledge base with custom information.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Dataset Name</label>
            <Input
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              placeholder="e.g., Product FAQs, Company Policies"
              className="mt-1"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Q&A Pairs ({entries.length})
              </label>
              <Button variant="outline" size="sm" onClick={addEntry}>
                <Plus className="h-4 w-4 mr-1" />
                Add Entry
              </Button>
            </div>

            {entries.map((entry, index) => (
              <div key={entry.id} className="p-4 bg-slate-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Entry {index + 1}</span>
                  {entries.length > 1 && (
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500">Question</label>
                  <Textarea
                    value={entry.question}
                    onChange={(e) => updateEntry(entry.id, 'question', e.target.value)}
                    placeholder="What question might users ask?"
                    className="mt-1 min-h-[60px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500">Answer</label>
                  <Textarea
                    value={entry.answer}
                    onChange={(e) => updateEntry(entry.id, 'answer', e.target.value)}
                    placeholder="What is the correct answer?"
                    className="mt-1 min-h-[80px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isUploading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Save Training Data
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}