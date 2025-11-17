'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Sparkles, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { chatWithVaultHybrid } from '@/actions/vault-actions';
import { useToast } from '@/hooks/use-toast';

interface TestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
  userId: string;
  documentCount: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceChunk[];
  modelUsed?: string;
  timestamp: Date;
}

interface SourceChunk {
  content: string;
  source: string;
  score?: number;
}

export default function TestDrawer({
  isOpen,
  onClose,
  partnerId,
  userId,
  documentCount,
}: TestDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modalSource, setModalSource] = useState<SourceChunk | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setInput('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatWithVaultHybrid(
        partnerId,
        userId,
        userMessage.content
      );

      if (result.success && result.response) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: result.response,
          sources: result.geminiChunks?.map(chunk => ({
            content: chunk.content,
            source: chunk.source,
            score: chunk.score,
          })) || [],
          modelUsed: result.modelUsed,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(result.message || 'Query failed');
      }
    } catch (error: any) {
      console.error('Query failed:', error);
      toast({
        title: 'Query failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });

      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMarkdown = (text: string) => {
    if (!text) return '';
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .join('<br/>');
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50" 
        onClick={onClose}
      />
      
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-bold">Vault Chat</h2>
              <p className="text-sm text-white/80">
                {documentCount} document{documentCount !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ask me anything
                </h3>
                <p className="text-gray-600 text-sm max-w-md">
                  I can answer questions based on the {documentCount} document{documentCount !== 1 ? 's' : ''} in your vault
                </p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(message.content),
                    }}
                    className="text-sm leading-relaxed"
                  />

                  {message.role === 'assistant' && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      {message.modelUsed && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Sparkles className="h-3 w-3" />
                            <span>
                              Powered by <strong className="font-semibold">{message.modelUsed}</strong>
                            </span>
                          </div>
                        </div>
                      )}

                      {message.sources && message.sources.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-600 mb-2">
                            Sources ({message.sources.length}):
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {message.sources.map((source, sourceIndex) => (
                              <button
                                key={sourceIndex}
                                onClick={() => setModalSource(source)}
                                className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-xs px-3 py-1.5 rounded-md transition-colors"
                                title={`View source from ${source.source}`}
                              >
                                <FileText className="h-3 w-3" />
                                <span className="font-medium">
                                  Source {sourceIndex + 1}
                                </span>
                                {source.score && (
                                  <Badge variant="secondary" className="text-xs ml-1">
                                    {(source.score * 100).toFixed(0)}%
                                  </Badge>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-5 py-3 bg-gray-100">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your documents..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {modalSource && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
          onClick={() => setModalSource(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    Source Document
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{modalSource.source}</span>
                    {modalSource.score && (
                      <Badge variant="secondary">
                        {(modalSource.score * 100).toFixed(0)}% relevant
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalSource(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto border-t border-b border-gray-200 py-4">
                <div
                  className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(modalSource.content),
                  }}
                />
              </div>

              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => setModalSource(null)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}