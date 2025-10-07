
'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Wand2, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { generateCampaignContent } from '@/ai/flows/generate-campaign-content-flow';
import { generateCampaignImage } from '@/ai/flows/generate-campaign-image-flow';

interface AIComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTextGenerated: (text: string) => void;
  onImageGenerated: (imageUrl: string) => void;
}

export default function AIComposerModal({
  isOpen,
  onClose,
  onTextGenerated,
  onImageGenerated,
}: AIComposerModalProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [isLoading, setIsLoading] = useState<'text' | 'image' | false>(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const { toast } = useToast();

  const handleGenerateText = async () => {
    if (!prompt.trim()) return;
    setIsLoading('text');
    setLoadingMessage('Sending prompt to AI...');
    setGeneratedText('');
    setGeneratedImage('');
    try {
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      setLoadingMessage('Processing response...');
      const data = await response.json();
      console.log('Text generation response:', data);

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to generate text');
      }
      setGeneratedText(data.content);
      toast({ title: 'Success', description: 'Text generated successfully!' });
    } catch (error: any) {
      console.error('Error generating text:', error);
      toast({ variant: 'destructive', title: 'Error Generating Text', description: error.message });
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    setIsLoading('image');
    setLoadingMessage('Sending prompt to DALL-E 3...');
    setGeneratedText('');
    setGeneratedImage('');
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      setLoadingMessage('Receiving image data...');
      const data = await response.json();
      console.log('Image generation API response:', data);

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (!data.imageUrl) {
        throw new Error('API response did not contain a valid image URL.');
      }
      
      setLoadingMessage('Image received. Displaying preview...');
      setGeneratedImage(data.imageUrl);
      toast({ title: 'Success', description: 'Image generated and stored successfully!' });
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast({ variant: 'destructive', title: 'Error Generating Image', description: error.message, duration: 8000 });
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleUseText = () => {
    onTextGenerated(generatedText);
    onClose();
  };

  const handleUseImage = () => {
    onImageGenerated(generatedImage);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Composer
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left Panel: Prompt and controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What would you like to create?
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'A dramatic image of a bull and a bear clashing' or 'Write a text alert about a new stock pick, ticker NNE'"
                rows={5}
                disabled={!!isLoading}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGenerateText} disabled={!prompt.trim() || !!isLoading} className="flex-1">
                {isLoading === 'text' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                Generate Text
              </Button>
              <Button onClick={handleGenerateImage} disabled={!prompt.trim() || !!isLoading} className="flex-1">
                {isLoading === 'image' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                Generate Image
              </Button>
            </div>
          </div>

          {/* Right Panel: Preview */}
          <div className="bg-gray-50 rounded-xl p-4 border min-h-[250px] flex flex-col justify-center">
            {!isLoading && !generatedText && !generatedImage && (
              <div className="text-center text-gray-500">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Your AI-generated content will appear here.</p>
              </div>
            )}

            {isLoading && (
              <div className="text-center text-gray-500">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p>{loadingMessage}</p>
              </div>
            )}
            
            {generatedText && (
              <div className="space-y-4">
                <Textarea value={generatedText} readOnly rows={8} />
                <Button onClick={handleUseText} className="w-full" disabled={!generatedText}>Use This Text</Button>
              </div>
            )}

            {generatedImage && (
              <div className="space-y-4">
                <img src={generatedImage} alt="Generated content" className="rounded-lg w-full h-auto object-contain" />
                <Button onClick={handleUseImage} className="w-full" disabled={!generatedImage}>Use This Image</Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
