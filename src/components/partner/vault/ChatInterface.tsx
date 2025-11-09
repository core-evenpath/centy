'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, GroundingChunk } from '@/lib/types';
import { Send, Loader2, FileText, Sparkles, User, Bot, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
  partnerId: string;
  userId: string;
  documentCount: number;
  exampleQuestions: string[];
}

export default function ChatInterface({
  partnerId,
  userId,
  documentCount,
  exampleQuestions,
}: ChatInterfaceProps) {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState('');
  const [modalContent, setModalContent] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (exampleQuestions.length === 0) {
      setCurrentSuggestion('');
      return;
    }

    setCurrentSuggestion(exampleQuestions[0]);
    let suggestionIndex = 0;
    const intervalId = setInterval(() => {
      suggestionIndex = (suggestionIndex + 1) % exampleQuestions.length;
      setCurrentSuggestion(exampleQuestions[suggestionIndex]);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [exampleQuestions]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isQuerying]);

  const renderMarkdown = (text: string) => {
    if (!text) return { __html: '' };

    const lines = text.split('\n');
    let html = '';
    let listType: 'ul' | 'ol' | null = null;
    let paraBuffer = '';

    function flushPara() {
      if (paraBuffer) {
        html += `<p class="my-2 leading-relaxed">${paraBuffer}</p>`;
        paraBuffer = '';
      }
    }

    function flushList() {
      if (listType) {
        html += `</${listType}>`;
        listType = null;
      }
    }

    for (const rawLine of lines) {
      const line = rawLine
        .replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong class="font-semibold">$1$2</strong>')
        .replace(/\*(.*?)\*|_(.*?)_/g, '<em class="italic">$1$2</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-mono text-sm">$1</code>');

      const isOl = line.match(/^\s*\d+\.\s(.*)/);
      const isUl = line.match(/^\s*[\*\-]\s(.*)/);

      if (isOl) {
        flushPara();
        if (listType !== 'ol') {
          flushList();
          html += '<ol class="list-decimal list-inside my-3 pl-5 space-y-1.5">';
          listType = 'ol';
        }
        html += `<li class="leading-relaxed">${isOl[1]}</li>`;
      } else if (isUl) {
        flushPara();
        if (listType !== 'ul') {
          flushList();
          html += '<ul class="list-disc list-inside my-3 pl-5 space-y-1.5">';
          listType = 'ul';
        }
        html += `<li class="leading-relaxed">${isUl[1]}</li>`;
      } else {
        flushList();
        if (line.trim() === '') {
          flushPara();
        } else {
          paraBuffer += (paraBuffer ? '<br/>' : '') + line;
        }
      }
    }

    flushPara();
    flushList();

    return { __html: html };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isQuerying) return;

    const userMessage: ChatMessage = {
      role: 'user',
      parts: [{ text: query }],
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setQuery('');
    setIsQuerying(true);

    try {
      const response = await fetch('/api/vault/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          userId,
          message: query.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        const modelMessage: ChatMessage = {
          role: 'model',
          parts: [{ text: result.response || '' }],
          groundingChunks: result.groundingChunks,
        };
        setChatHistory((prev) => [...prev, modelMessage]);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        role: 'model',
        parts: [{ text: 'Sorry, I encountered an error. Please try again.' }],
      };
      setChatHistory((prev) => [...prev, errorMessage]);
      toast({
        title: 'Query failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const handleSourceClick = (text: string) => {
    setModalContent(text);
  };

  const closeModal = () => {
    setModalContent(null);
  };

  if (documentCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="bg-blue-100 rounded-full p-6 mb-6">
          <FileText className="h-16 w-16 text-blue-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No documents yet</h3>
        <p className="text-gray-600 max-w-md">
          Upload some documents to start chatting with your AI-powered knowledge base
        </p>
        <Button className="mt-6" onClick={() => window.location.href = '#upload'}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Your First Document
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-grow overflow-y-auto space-y-6 mb-6 pr-2">
        {chatHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8 mb-6">
              <Sparkles className="h-16 w-16 text-blue-600 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Ready to answer your questions
            </h3>
            <p className="text-gray-600 max-w-md">
              Ask anything about your {documentCount} document{documentCount !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {chatHistory.map((message, index) => (
          <div
            key={index}
            className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'model' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Bot className="h-5 w-5 text-white" />
              </div>
            )}

            <div
              className={`max-w-xl lg:max-w-2xl rounded-2xl shadow-sm ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              <div className="px-5 py-4">
                <div dangerouslySetInnerHTML={renderMarkdown(message.parts[0].text)} />
              </div>

              {message.role === 'model' &&
                message.groundingChunks &&
                message.groundingChunks.length > 0 && (
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
                    <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      Sources ({message.groundingChunks.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {message.groundingChunks.map((chunk, chunkIndex) =>
                        chunk.retrievedContext?.text ? (
                          <button
                            key={chunkIndex}
                            onClick={() =>
                              handleSourceClick(chunk.retrievedContext!.text!)
                            }
                            className="bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700 text-xs px-3 py-1.5 rounded-lg transition-all font-medium"
                          >
                            Source {chunkIndex + 1}
                          </button>
                        ) : null
                      )}
                    </div>
                  </div>
                )}
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-lg">
                <User className="h-5 w-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {isQuerying && (
          <div className="flex gap-4 justify-start">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="border-t border-gray-200 pt-4">
        {!isQuerying && currentSuggestion && chatHistory.length === 0 && (
          <div className="mb-4 text-center">
            <button
              onClick={() => setQuery(currentSuggestion)}
              className="inline-flex items-center gap-2 text-sm bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 px-4 py-2 rounded-full border border-blue-200 transition-all hover:scale-105"
            >
              <Sparkles className="h-4 w-4" />
              Try: "{currentSuggestion}"
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="min-h-[60px] max-h-[120px] resize-none pr-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              disabled={isQuerying}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
          <Button
            type="submit"
            disabled={isQuerying || !query.trim()}
            className="self-end h-[60px] px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            {isQuerying ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>

      {modalContent !== null && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white rounded-t-2xl">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Source Document
              </h3>
            </div>
            <div
              className="flex-grow overflow-y-auto p-6 text-gray-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={renderMarkdown(modalContent || '')}
            ></div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <Button onClick={closeModal} className="rounded-xl">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}