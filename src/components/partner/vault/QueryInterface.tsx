'use client';

import React, { useState } from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface QueryInterfaceProps {
  partnerId: string;
  userId: string;
  storeId: string;
}

interface QueryResult {
  query: string;
  response: string;
  timestamp: Date;
}

export default function QueryInterface({
  partnerId,
  userId,
  storeId,
}: QueryInterfaceProps) {
  const [query, setQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const { toast } = useToast();

  const handleQuery = async () => {
    if (!query.trim()) {
      toast({
        title: 'Query required',
        description: 'Please enter a query',
        variant: 'destructive',
      });
      return;
    }

    setIsQuerying(true);

    try {
      const response = await fetch('/api/vault/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          userId,
          storeId,
          query: query.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setResults((prev) => [
          {
            query: query.trim(),
            response: result.response || '',
            timestamp: new Date(),
          },
          ...prev,
        ]);
        setQuery('');
        toast({
          title: 'Query successful',
          description: 'Results retrieved from knowledge base',
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: 'Query failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Ask a question about your files
        </label>
        <div className="flex gap-2">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your question here..."
            className="flex-1"
            rows={3}
            disabled={isQuerying}
          />
          <Button
            onClick={handleQuery}
            disabled={isQuerying || !query.trim()}
            className="self-end"
          >
            {isQuerying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Query Results</h3>
          {results.map((result, index) => (
            <div key={index} className="bg-white border rounded-lg p-4 space-y-3">
              <div>
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {result.query}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {result.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="pl-7">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {result.response}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}