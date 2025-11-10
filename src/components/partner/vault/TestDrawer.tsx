
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X,
  Send, 
  Loader2, 
  Sparkles, 
  FileText,
  Bot,
  ChevronDown,
  Check,
  Layers,
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { generateExampleQuestions, listVaultFiles } from '@/actions/vault-actions';
import type { VaultFile } from '@/lib/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    text: string;
    score?: number;
    documentName?: string;
  }>;
  timestamp: Date;
}

interface TestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
  userId: string;
  documentCount: number;
}

export default function TestDrawer({ 
  isOpen, 
  onClose, 
  partnerId, 
  userId, 
  documentCount 
}: TestDrawerProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [exampleQuestions, setExampleQuestions] = useState<string[]>([]);
  const [isLoadingExamples, setIsLoadingExamples] = useState(false);
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showGuide, setShowGuide] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && documentCount > 0) {
      loadFiles();
      loadExampleQuestions();
    }
  }, [isOpen, documentCount]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isQuerying]);

  const loadFiles = async () => {
    try {
      const result = await listVaultFiles(partnerId);
      if (result.success) {
        const activeFiles = result.files.filter(f => f.state === 'ACTIVE');
        setFiles(activeFiles);
        // Select all by default
        setSelectedFiles(new Set(activeFiles.map(f => f.id)));
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const loadExampleQuestions = async () => {
    setIsLoadingExamples(true);
    try {
      const result = await generateExampleQuestions(partnerId, 5);
      if (result.success && result.questions) {
        setExampleQuestions(result.questions);
      }
    } catch (error) {
      console.error('Error loading examples:', error);
    } finally {
      setIsLoadingExamples(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isQuerying || selectedFiles.size === 0) return;

    const userMessage: Message = {
      role: 'user',
      content: query,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsQuerying(true);

    try {
      const response = await fetch('/api/vault/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          query: query.trim(),
          selectedFileIds: Array.from(selectedFiles),
        }),
      });

      const result = await response.json();

      console.log('🔍 Query API Response:', result);

      if (result.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: result.answer,
          sources: result.sources || result.groundingChunks || [],
          timestamp: new Date(),
        };
        
        console.log('💬 Assistant message with sources:', assistantMessage);
        
        setMessages(prev => [...prev, assistantMessage]);

        if (result.warning) {
          toast({
            title: 'Note',
            description: result.warning,
            variant: 'default',
          });
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('❌ Query error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      toast({
        title: 'Query failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsQuerying(false);
    }
  };

  const handleSelectAll = () => {
    setSelectedFiles(new Set(files.map(f => f.id)));
  };

  const handleClearSelection = () => {
    setSelectedFiles(new Set());
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-[600px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Vault Chat</h3>
              <p className="text-sm text-gray-600">Ask questions about your documents</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Document Selector */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Select
              value={selectedFiles.size === files.length ? 'all' : 'custom'}
              onValueChange={(value) => {
                if (value === 'all') {
                  handleSelectAll();
                }
              }}
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    <span>
                      {selectedFiles.size === files.length 
                        ? `All documents (${files.length})`
                        : `${selectedFiles.size} of ${files.length} documents`}
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    All documents ({files.length})
                  </div>
                </SelectItem>
                {files.map(file => (
                  <SelectItem key={file.id} value={file.id}>
                    <div className="flex items-center gap-2">
                      {selectedFiles.has(file.id) && <Check className="h-4 w-4 text-blue-600" />}
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="truncate max-w-[400px]">{file.displayName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFiles.size > 0 && selectedFiles.size < files.length && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Collapsible Testing Guide */}
        <Collapsible open={showGuide} onOpenChange={setShowGuide}>
          <div className="border-b border-gray-200">
            <CollapsibleTrigger asChild>
              <button className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
                <span className="text-sm font-medium text-gray-700">Testing Guide</span>
                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showGuide ? 'rotate-180' : ''}`} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-6 py-4 space-y-3 text-sm text-gray-600 bg-gray-50">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Test Individual Documents</p>
                    <p className="text-xs mt-1">Select one document to verify it was indexed correctly</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Test Cross-Document Search</p>
                    <p className="text-xs mt-1">Select multiple documents to test combined knowledge</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Check Source Citations</p>
                    <p className="text-xs mt-1">Verify AI responses cite the correct documents</p>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8 mb-6">
                <Bot className="h-16 w-16 text-blue-600 mx-auto" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Ready to chat with your documents
              </h4>
              <p className="text-gray-600 max-w-sm mb-6">
                Ask questions and get answers from your knowledge base
              </p>
              
              {isLoadingExamples ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading suggestions...</span>
                </div>
              ) : exampleQuestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Try these questions:</p>
                  <div className="flex flex-col gap-2">
                    {exampleQuestions.slice(0, 3).map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuery(question)}
                        className="text-sm bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-4 py-2 rounded-lg border border-gray-200 hover:border-blue-300 transition-all text-left"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-md rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-300 space-y-2">
                        <p className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Sources ({message.sources.length}):
                        </p>
                        {message.sources.slice(0, 3).map((source, idx) => (
                          <div key={idx} className="text-xs bg-white rounded-lg p-2.5 border border-gray-200 shadow-sm">
                            <p className="text-gray-700 line-clamp-3 mb-1.5">{source.text}</p>
                            <div className="flex items-center justify-between">
                              {source.documentName && (
                                <p className="text-gray-500 flex items-center gap-1 font-medium">
                                  <ExternalLink className="h-3 w-3" />
                                  {source.documentName}
                                </p>
                              )}
                              {source.score !== undefined && (
                                <span className="text-gray-400 text-[10px]">
                                  {(source.score * 100).toFixed(0)}% match
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {message.sources.length > 3 && (
                          <p className="text-xs text-gray-500 italic">
                            + {message.sources.length - 3} more source{message.sources.length - 3 !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          {selectedFiles.size === 0 && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                Please select at least one document to start chatting
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                selectedFiles.size === 0 
                  ? "Select documents above to start..." 
                  : "Ask a question about your documents..."
              }
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={isQuerying || selectedFiles.size === 0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={isQuerying || !query.trim() || selectedFiles.size === 0}
              className="self-end h-[60px] px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isQuerying ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}