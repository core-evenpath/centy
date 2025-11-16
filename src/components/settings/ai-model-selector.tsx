'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getPartnerAIConfig, updatePartnerAIConfig } from '@/actions/partner-settings-actions';
import { AI_MODEL_OPTIONS } from '@/lib/types';
import type { AIModelChoice } from '@/lib/types';
import { Loader2, Sparkles } from 'lucide-react';

interface AIModelSelectorProps {
  partnerId: string;
  userId: string;
}

export function AIModelSelector({ partnerId, userId }: AIModelSelectorProps) {
  const [selectedModel, setSelectedModel] = useState<AIModelChoice>('haiku');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, [partnerId]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const config = await getPartnerAIConfig(partnerId);
      setSelectedModel(config);
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updatePartnerAIConfig(partnerId, userId, selectedModel);
      
      if (result.success) {
        toast({
          title: 'Settings saved',
          description: 'AI model configuration updated successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedOption = AI_MODEL_OPTIONS.find(opt => opt.value === selectedModel);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Response Model
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Response Model
        </CardTitle>
        <CardDescription>
          Choose which AI model generates responses to customer questions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">Select Model</label>
          <Select value={selectedModel} onValueChange={(value: AIModelChoice) => setSelectedModel(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_MODEL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground ml-4">
                      {option.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedOption && (
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Provider:</span>
              <span className="font-medium">{selectedOption.provider}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Speed:</span>
              <span className="font-medium">{selectedOption.speed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cost per 1000 queries:</span>
              <span className="font-medium">{selectedOption.costPer1000}</span>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-medium mb-1">How it works:</p>
          <ul className="space-y-1 text-xs">
            <li>• Documents are indexed with Gemini (free, automatic)</li>
            <li>• Relevant content is retrieved from your knowledge base</li>
            <li>• Your selected model generates the final response</li>
          </ul>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
}