'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  Tag,
  BookOpen,
  Zap,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import {
  queryVault,
  listVaultFiles,
  generateExampleQuestions
} from '@/actions/vault-actions';
import type { VaultFile, VaultQuerySource } from '@/lib/types-vault';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: VaultQuerySource[];
  consolidatedTags?: string[];
  groundingChunksCount?: number;
  timings?: {
    totalMs: number;
    retrievalMs: number;
    generationMs: number;
  };
  timestamp: Date;
  error?: string;
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
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && documentCount > 0) {
      loadFiles();
      loadExampleQuestions();
    }
  }, [isOpen, documentCount, partnerId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isQuerying]);

  const loadFiles = async () => {
    const result = await listVaultFiles(partnerId);
    if (result.success) {
      const activeFiles = result.files.filter(f => f.state === 'ACTIVE');
      setFiles(activeFiles);
    }
  };

  const loadExampleQuestions = async () => {
    setIsLoadingExamples(true);
    try {
      const questions = await generateExampleQuestions(partnerId);
      setExampleQuestions(questions);
    } catch (error) {
      console.error('Failed to load examples:', error);
    } finally {
      setIsLoadingExamples(false);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const handleSelectAll = () => {
    setSelectedFiles(new Set(files.map(f => f.id)));
  };

  const handleClearSelection = () => {
    setSelectedFiles(new Set());
  };

  const toggleSourceExpanded = (messageId: string) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedSources(newExpanded);
  };

  const handleSubmit = async () => {
    if (!query.trim() || isQuerying) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsQuerying(true);

    try {
      const selectedFileIds = selectedFiles.size > 0
        ? Array.from(selectedFiles)
        : undefined;

      console.log('📤 Sending query to vault...');
      const result = await queryVault(partnerId, userId, userMessage.content, selectedFileIds);
      console.log('📥 Query result:', result);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.success && result.response
          ? result.response
          : result.message || 'Failed to get response',
        sources: result.sources,
        consolidatedTags: result.consolidatedTags,
        groundingChunksCount: result.groundingChunks?.length || 0,
        timings: result.timings,
        timestamp: new Date(),
        error: !result.success ? result.message : undefined,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (!result.success) {
        toast({
          title: 'Query failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Query error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date(),
        error: error.message,
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

  const handleExampleClick = (question: string) => {
    setQuery(question);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-white shadow-2xl border-l border-slate-200 flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Test RAG</h2>
            <p className="text-xs text-slate-500">
              {documentCount} document{documentCount !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat}>
              Clear
            </Button>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="p-3 border-b border-slate-200 bg-slate-50">
        <button
          onClick={() => setShowFileSelector(!showFileSelector)}
          className="w-full flex items-center justify-between p-2 text-sm text-slate-600 hover:bg-white rounded-lg transition-colors"
        >
          <span className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            {selectedFiles.size === 0
              ? 'Searching all documents'
              : `${selectedFiles.size} document${selectedFiles.size !== 1 ? 's' : ''} selected`}
          </span>
          {showFileSelector ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showFileSelector && (
          <div className="mt-3 p-3 bg-white rounded-lg border max-h-48 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-slate-500">SELECT DOCUMENTS</span>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Select All
                </button>
                <button
                  onClick={handleClearSelection}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {files.map(file => (
                <label
                  key={file.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.id)}
                    onChange={() => toggleFileSelection(file.id)}
                    className="rounded border-slate-300"
                  />
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700 truncate flex-1">{file.displayName}</span>
                  {file.tags && (
                    <Badge variant="outline" className="text-xs">
                      {file.tags.primaryCategory}
                    </Badge>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Ask anything about your documents</h3>
            <p className="text-sm text-slate-500 mb-6">
              Your AI assistant will search through {documentCount} document{documentCount !== 1 ? 's' : ''} to find answers.
            </p>

            {exampleQuestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-400 uppercase">Try asking</p>
                <div className="space-y-2">
                  {exampleQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(question)}
                      className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-sm text-slate-700 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isLoadingExamples && (
              <div className="flex items-center justify-center gap-2 text-slate-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading suggestions...</span>
              </div>
            )}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl p-4 ${message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.error
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-slate-100 text-slate-900'
                }`}
            >
              {message.role === 'assistant' && message.error && (
                <div className="flex items-center gap-2 mb-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Error</span>
                </div>
              )}

              <div className={`prose prose-sm max-w-none ${message.role === 'user' ? 'prose-invert' : ''}`}>
                {message.role === 'assistant' ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  <p className="m-0">{message.content}</p>
                )}
              </div>

              {message.role === 'assistant' && !message.error && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                  {message.timings && (
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {message.timings.totalMs}ms total
                      </span>
                      <span>
                        Retrieval: {message.timings.retrievalMs}ms
                      </span>
                      <span>
                        Generation: {message.timings.generationMs}ms
                      </span>
                    </div>
                  )}

                  {message.groundingChunksCount !== undefined && message.groundingChunksCount > 0 && (
                    <div className="flex items-center gap-2 text-xs text-emerald-600">
                      <Check className="h-3 w-3" />
                      <span>{message.groundingChunksCount} grounding chunks retrieved</span>
                    </div>
                  )}

                  {message.sources && message.sources.length > 0 && (
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleSourceExpanded(message.id)}
                        className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700"
                      >
                        <BookOpen className="h-3 w-3" />
                        <span>{message.sources.length} source{message.sources.length > 1 ? 's' : ''}</span>
                        {expandedSources.has(message.id) ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>

                      {expandedSources.has(message.id) && (
                        <div className="space-y-2 mt-2">
                          {message.sources.map((source, index) => (
                            <div
                              key={index}
                              className="p-3 bg-white rounded-lg border border-slate-200"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-slate-400" />
                                <span className="text-sm font-medium text-slate-700 truncate">
                                  {source.fileName}
                                </span>
                                <Badge variant="outline" className="text-xs ml-auto">
                                  {Math.round(source.relevanceScore * 100)}%
                                </Badge>
                              </div>
                              {source.excerpts && source.excerpts.length > 0 && (
                                <div className="space-y-1">
                                  {source.excerpts.slice(0, 2).map((excerpt, i) => (
                                    <p key={i} className="text-xs text-slate-500 line-clamp-2">
                                      "{excerpt}"
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {message.consolidatedTags && message.consolidatedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {message.consolidatedTags.slice(0, 8).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Tag className="h-2.5 w-2.5 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {message.consolidatedTags.length > 8 && (
                        <Badge variant="outline" className="text-xs text-slate-400">
                          +{message.consolidatedTags.length - 8} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isQuerying && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-slate-500">Searching documents...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-2">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your documents..."
            className="resize-none min-h-[80px]"
            disabled={isQuerying}
          />
          <Button
            onClick={handleSubmit}
            disabled={!query.trim() || isQuerying}
            className="h-auto px-4 bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}