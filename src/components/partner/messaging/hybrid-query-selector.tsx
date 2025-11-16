'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { chatWithVaultHybrid } from '@/actions/vault-actions';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface HybridQuerySelectorProps {
  partnerId: string;
  userId: string;
}

export function HybridQuerySelector({ partnerId, userId }: HybridQuerySelectorProps) {
  const [question, setQuestion] = useState('');
  const [provider, setProvider] = useState<'claude' | 'openai'>('claude');
  const [claudeModel, setClaudeModel] = useState<'haiku' | 'sonnet-3.5' | 'sonnet-4.5'>('haiku');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const { toast } = useToast();

  const handleQuery = async () => {
    if (!question.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a question',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const result = await chatWithVaultHybrid(
        partnerId,
        userId,
        question,
        provider,
        provider === 'claude' ? claudeModel : undefined
      );

      if (result.success) {
        setResponse(result);
        toast({
          title: 'Success',
          description: `Retrieved ${result.geminiChunks?.length || 0} relevant chunks`,
        });
      } else {
        toast({
          title: 'Query Failed',
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
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Generation Provider</label>
          <Select value={provider} onValueChange={(v: 'claude' | 'openai') => setProvider(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude">Claude (Recommended)</SelectItem>
              <SelectItem value="openai">OpenAI GPT-4o Mini</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {provider === 'claude' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Claude Model</label>
            <Select value={claudeModel} onValueChange={(v: any) => setClaudeModel(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="haiku">Haiku 3.5 (Fastest, Cheapest)</SelectItem>
                <SelectItem value="sonnet-3.5">Sonnet 3.5 (Balanced)</SelectItem>
                <SelectItem value="sonnet-4.5">Sonnet 4.5 (Best Quality)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Your Question</label>
        <Textarea
          placeholder="Ask a question about your documents..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
        />
      </div>

      <Button onClick={handleQuery} disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? 'Querying...' : 'Ask Question'}
      </Button>

      {response && (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-medium mb-2">Response:</h4>
            <p className="text-sm whitespace-pre-wrap">{response.response}</p>

            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Retrieval (Gemini):</span>
                <span>{response.retrievalTime}ms</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Generation ({provider}):</span>
                <span>{response.generationTime}ms</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Chunks retrieved:</span>
                <span>{response.geminiChunks?.length || 0}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tokens used:</span>
                <span>
                  {response.usage?.input_tokens || 0} in / {response.usage?.output_tokens || 0} out
                </span>
              </div>
            </div>
          </div>

          {response.geminiChunks && response.geminiChunks.length > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3 text-sm">Sources Retrieved by Gemini:</h4>
              <div className="space-y-2">
                {response.geminiChunks.map((chunk: any, idx: number) => (
                  <div key={idx} className="bg-muted/50 rounded p-3 text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Source {idx + 1}</span>
                      <span className="text-muted-foreground">Score: {chunk.score?.toFixed(2)}</span>
                    </div>
                    <p className="text-muted-foreground line-clamp-3">{chunk.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}