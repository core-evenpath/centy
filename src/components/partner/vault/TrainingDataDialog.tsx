// src/components/partner/vault/TrainingDataDialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Code, Sparkles, FileText } from 'lucide-react';
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

export default function TrainingDataDialog({
  isOpen,
  onClose,
  partnerId,
  userId,
  onUploadComplete,
  existingFile = null,
}: TrainingDataDialogProps) {
  const [datasetName, setDatasetName] = useState('');
  const [markdownInput, setMarkdownInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && existingFile) {
      loadExistingFile();
    } else if (isOpen && !existingFile) {
      resetForm();
    }
  }, [isOpen, existingFile]);

  const parseMarkdownToJSONL = (markdown: string): string => {
    const entries: any[] = [];
    const entryBlocks = markdown.split(/---+/).filter(block => block.trim());
    
    entryBlocks.forEach(block => {
      const questionMatch = block.match(/\*\*Question:\*\*\s*(.*?)(?=\n\*\*Answer:\*\*|\n\n\*\*Answer:\*\*)/s);
      const answerMatch = block.match(/\*\*Answer:\*\*\s*(.*?)(?=\n\*\*Category:\*\*|\n\n\*\*Category:\*\*|$)/s);
      const categoryMatch = block.match(/\*\*Category:\*\*\s*(.*?)(?=\n|$)/);
      
      if (questionMatch && answerMatch) {
        const entry: any = {
          question: questionMatch[1].trim(),
          answer: answerMatch[1].trim(),
        };
        if (categoryMatch && categoryMatch[1].trim()) {
          entry.category = categoryMatch[1].trim();
        }
        entries.push(entry);
      }
    });
    
    return entries.map(e => JSON.stringify(e)).join('\n');
  };

  const loadExistingFile = async () => {
    if (!existingFile) return;

    setIsLoadingExisting(true);
    try {
      const result = await getVaultFileContent(partnerId, existingFile.id);
      if (result.success && result.content) {
        const lines = result.content.split('\n').filter(line => line.trim());
        const entries = lines.map(line => {
          try {
            const data = JSON.parse(line);
            let md = `**Question:** ${data.question}\n\n**Answer:** ${data.answer}`;
            if (data.category) {
              md += `\n\n**Category:** ${data.category}`;
            }
            return md;
          } catch {
            return null;
          }
        }).filter(e => e !== null);

        setMarkdownInput(entries.join('\n\n---\n\n'));
        setDatasetName(existingFile.displayName.replace('.md', ''));
      }
    } catch (error: any) {
      toast({
        title: 'Failed to load file',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingExisting(false);
    }
  };

  const resetForm = () => {
    setDatasetName('');
    setMarkdownInput('');
    setShowPreview(false);
  };

  const handleSave = async () => {
    if (!datasetName.trim()) {
      toast({
        title: 'Dataset name required',
        variant: 'destructive',
      });
      return;
    }

    if (!markdownInput.trim()) {
      toast({
        title: 'No content',
        description: 'Please paste Markdown content',
        variant: 'destructive',
      });
      return;
    }

    let jsonlContent: string;
    try {
      jsonlContent = parseMarkdownToJSONL(markdownInput);
      if (!jsonlContent) {
        throw new Error('No valid entries found');
      }
    } catch (error: any) {
      toast({
        title: 'Invalid format',
        description: 'Ensure format has **Question:** and **Answer:** sections separated by ---',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
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
        const entryCount = jsonlContent.split('\n').filter(l => l.trim()).length;
        toast({
          title: existingFile ? 'Updated' : 'Created',
          description: `${datasetName}.md with ${entryCount} entries`,
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

  const generatePreview = () => {
    try {
      const jsonl = parseMarkdownToJSONL(markdownInput);
      const entries = jsonl.split('\n').map(line => JSON.parse(line));
      
      let preview = `# ${datasetName || 'Dataset Name'}\n\n`;
      preview += `*Training Data - ${entries.length} Q&A pairs*\n\n---\n\n`;
      
      entries.forEach((e, i) => {
        preview += `## Entry ${i + 1}\n\n`;
        preview += `**Question:** ${e.question}\n\n`;
        preview += `**Answer:** ${e.answer}\n\n`;
        if (e.category) {
          preview += `**Category:** ${e.category}\n\n`;
        }
        preview += `---\n\n`;
      });
      
      return preview;
    } catch {
      return '// Invalid format';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                {existingFile ? 'Edit Training Data' : 'Add Training Data'}
              </DialogTitle>
              <DialogDescription>
                Paste Markdown Q&A pairs - saved as .md for RAG
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={!showPreview ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant={showPreview ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowPreview(true)}
              >
                <Code className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isLoadingExisting ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
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
                <p className="text-xs text-gray-500 mt-1">Saved as: {datasetName || 'dataset'}.md</p>
              </div>

              {!showPreview ? (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Paste Markdown Content
                  </label>
                  <Textarea
                    placeholder={`**Question:** What is your return policy?\n\n**Answer:** 30-day money back guarantee.\n\n**Category:** Policy\n\n---\n\n**Question:** How to contact support?\n\n**Answer:** Email support@example.com\n\n---`}
                    value={markdownInput}
                    onChange={(e) => setMarkdownInput(e.target.value)}
                    className="font-mono text-xs min-h-[50vh] resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Format: **Question:** ... **Answer:** ... **Category:** (optional) separated by ---
                  </p>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Final Markdown (for RAG)
                  </label>
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg font-mono text-xs max-h-[50vh] overflow-y-auto">
                    <pre className="whitespace-pre-wrap break-words text-gray-800">
                      {generatePreview()}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            {markdownInput.split(/---+/).filter(b => b.trim()).length} entries
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