'use client';

// ── SourcePickerModal ──────────────────────────────────────────────────
//
// Two-stage modal: (1) choose a source tile, (2) render the matching
// form. Each form submits via `onSubmit`, which the parent hook turns
// into a POST to `/api/relay/ai-ingest`.
//
// Kept in one file because the per-source forms are small (≤40 lines
// each) and sharing the same step-container + back-button is cheaper
// than splitting. If a form ever grows, pull it out.

import { useRef, useState } from 'react';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { IngestSourceInput } from '@/hooks/useAIIngest';
import { SOURCE_OPTIONS, type PickableSource } from './source-options';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: IngestSourceInput) => void;
  loading: boolean;
  moduleName: string;
}

type Step = 'pick' | PickableSource;

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error ?? new Error('File read failed'));
    r.readAsDataURL(file);
  });
}

export default function SourcePickerModal({
  open,
  onClose,
  onSubmit,
  loading,
  moduleName,
}: Props) {
  const [step, setStep] = useState<Step>('pick');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('pick');
    setWebsiteUrl('');
    setRawText('');
    setAiPrompt('');
    setPdfFile(null);
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const handleWebsiteSubmit = () => {
    if (!websiteUrl) return;
    onSubmit({ source: 'website', websiteUrl });
  };

  const handleTextSubmit = () => {
    if (!rawText.trim()) return;
    onSubmit({ source: 'text', rawText });
  };

  const handleAIPromptSubmit = () => {
    if (!aiPrompt.trim()) return;
    onSubmit({ source: 'ai_generate', aiPrompt });
  };

  const handlePdfSubmit = async () => {
    if (!pdfFile) return;
    try {
      const pdfBase64 = await readFileAsBase64(pdfFile);
      onSubmit({
        source: 'pdf',
        pdfBase64,
        pdfFilename: pdfFile.name,
      });
    } catch {
      /* readFileAsBase64 rarely errors; swallow silently — UI stays open */
    }
  };

  const activeOption = SOURCE_OPTIONS.find((o) => o.id === step);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          {step !== 'pick' && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep('pick')}
              disabled={loading}
              className="w-fit -ml-2 mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          <DialogTitle>
            {step === 'pick'
              ? `Let AI fill in your ${moduleName}`
              : activeOption?.title ?? 'Import'}
          </DialogTitle>
          <DialogDescription>
            {step === 'pick'
              ? 'Pick a source — AI extracts items matching your module schema, then you review before anything is saved.'
              : 'AI will analyse the content and extract structured items for you to review.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'pick' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3">
            {SOURCE_OPTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStep(s.id)}
                  className="text-left p-4 rounded-xl border border-border hover:border-primary hover:shadow-md transition-all"
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.bg}`}
                  >
                    <Icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <h3 className="font-medium text-sm mb-1">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {s.description}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {step === 'website' && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ai-ingest-url">Website URL</Label>
              <Input
                id="ai-ingest-url"
                type="url"
                placeholder="https://your-business.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                AI scrapes up to 5 pages, including product / menu routes.
              </p>
            </div>
            <Button
              onClick={handleWebsiteSubmit}
              disabled={!websiteUrl || loading}
              className="w-full"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? 'Extracting…' : 'Extract items'}
            </Button>
          </div>
        )}

        {step === 'pdf' && (
          <div className="space-y-4 py-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                pdfFile
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary'
              }`}
              disabled={loading}
            >
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium mb-1">
                {pdfFile ? pdfFile.name : 'Click to select a PDF'}
              </p>
              <p className="text-xs text-muted-foreground">
                {pdfFile
                  ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB`
                  : 'Menu, catalog, price list, brochure…'}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && f.type === 'application/pdf') setPdfFile(f);
                }}
                className="hidden"
                disabled={loading}
              />
            </button>
            <Button
              onClick={handlePdfSubmit}
              disabled={!pdfFile || loading}
              className="w-full"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? 'Analysing PDF…' : 'Extract items from PDF'}
            </Button>
          </div>
        )}

        {step === 'text' && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ai-ingest-text">Paste content</Label>
              <Textarea
                id="ai-ingest-text"
                rows={10}
                placeholder="Product list, menu, service descriptions, FAQs…"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {rawText.length} characters
              </p>
            </div>
            <Button
              onClick={handleTextSubmit}
              disabled={!rawText.trim() || loading}
              className="w-full"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? 'Extracting…' : 'Extract items'}
            </Button>
          </div>
        )}

        {step === 'ai_generate' && (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="ai-ingest-prompt">Describe what you want</Label>
              <Textarea
                id="ai-ingest-prompt"
                rows={5}
                placeholder="e.g. 10 vegetarian Indian mains between ₹200 and ₹500, mixing rice / curry / bread dishes."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                AI generates realistic starter items — you can edit or remove
                them before saving.
              </p>
            </div>
            <Button
              onClick={handleAIPromptSubmit}
              disabled={!aiPrompt.trim() || loading}
              className="w-full"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? 'Generating…' : 'Generate items'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
