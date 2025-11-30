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
  RefreshCw
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
import type { VaultFile, VaultQueryResult, VaultQuerySource } from '@/lib/types-vault';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: VaultQuerySource[];
  consolidatedTags?: string[];
  timings?: {
    totalMs: number;
    retrievalMs: number;
    generationMs: number;
  };
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

      const result = await queryVault(partnerId, userId, userMessage.content, selectedFileIds);

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.success
          ? result.response || 'No response generated.'
          : `Error: ${result.message}`,
        sources: result.sources,
        consolidatedTags: result.consolidatedTags,
        timings: result.timings,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleExampleClick = (question: string) => {
    setQuery(question);
  };

  const formatTime = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative ml-auto w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Test Knowledge Base</h2>
              <p className="text-sm text-blue-100">
                {documentCount} document{documentCount !== 1 ? 's' : ''} indexed
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 py-3 border-b bg-slate-50">
          <button
            onClick={() => setShowFileSelector(!showFileSelector)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <FileText className="h-4 w-4" />
            <span>
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
                  <p className="text-xs font-medium text-slate-400 uppercase">Try asking:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {exampleQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleExampleClick(q)}
                        className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-300 transition-colors text-left max-w-xs"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isLoadingExamples && (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Loading suggestions...
                </div>
              )}
            </div>
          )}

          {messages.map(message => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 shadow-sm'
                  }`}
              >
                {message.role === 'assistant' ? (
                  <div className="space-y-3">
                    <div className="prose prose-sm max-w-none text-slate-700">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>

                    {message.consolidatedTags && message.consolidatedTags.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1 mb-2">
                          <Tag className="h-3 w-3 text-slate-400" />
                          <span className="text-xs font-medium text-slate-500">Related Topics</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {message.consolidatedTags.slice(0, 8).map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {message.sources && message.sources.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <button
                          onClick={() => toggleSourceExpanded(message.id)}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                        >
                          <BookOpen className="h-3 w-3" />
                          <span>{message.sources.length} source{message.sources.length !== 1 ? 's' : ''}</span>
                          {expandedSources.has(message.id) ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>

                        {expandedSources.has(message.id) && (
                          <div className="mt-2 space-y-2">
                            {message.sources.map((source, i) => (
                              <div key={i} className="p-2 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <FileText className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs font-medium text-slate-700">
                                    {source.fileName}
                                  </span>
                                </div>
                                {source.excerpts[0] && (
                                  <p className="text-xs text-slate-500 line-clamp-2">
                                    "{source.excerpts[0]}..."
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {message.timings && (
                      <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(message.timings.totalMs)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          <span>Retrieval: {formatTime(message.timings.retrievalMs)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {isQuerying && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm text-slate-500">Searching documents...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="flex-1 min-h-[44px] max-h-32 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              onClick={handleSubmit}
              disabled={!query.trim() || isQuerying}
              className="bg-blue-600 hover:bg-blue-700 px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}