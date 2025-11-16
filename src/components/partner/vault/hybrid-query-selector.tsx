'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
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
  const [maxChunks, setMaxChunks] = useState([5]);
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
          description: `Used ${result.geminiChunks?.length || 0} chunks (${result.usage?.input_tokens || 0} tokens)`,
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
        <div className="flex justify-between">
          <label className="text-sm font-medium">Max Chunks to Retrieve</label>
          <span className="text-sm text-muted-foreground">{maxChunks[0]}</span>
        </div>
        <Slider
          value={maxChunks}
          onValueChange={setMaxChunks}
          min={1}
          max={10}
          step={1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Fewer chunks = faster & cheaper. More chunks = more context.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Your Question</label>
        <Textarea
          placeholder="Ask a specific question about your documents..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          💡 Tip: Be specific to get better results with fewer chunks
        </p>
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

            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Retrieval:</span>
                <span>{response.retrievalTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Generation:</span>
                <span>{response.generationTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chunks used:</span>
                <span className="font-medium">{response.geminiChunks?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tokens:</span>
                <span>{response.usage?.input_tokens || 0} / {response.usage?.output_tokens || 0}</span>
              </div>
            </div>
          </div>

          {response.geminiChunks && response.geminiChunks.length > 0 && (
            <details className="border rounded-lg p-4">
              <summary className="font-medium text-sm cursor-pointer">
                View {response.geminiChunks.length} Retrieved Sources
              </summary>
              <div className="space-y-2 mt-3">
                {response.geminiChunks.map((chunk: any, idx: number) => (
                  <div key={idx} className="bg-muted/50 rounded p-3 text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Source {idx + 1}</span>
                      <span className="text-muted-foreground">
                        Score: {chunk.score?.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {chunk.content}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}