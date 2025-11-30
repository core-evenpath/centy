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
  User,
  Search,
  Clock,
  Zap,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { generateExampleQuestions, listVaultFiles } from '@/actions/vault-actions';
import type { VaultFile } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceChunk[];
  timestamp: Date;
  testedDocuments?: string[];
  modelUsed?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  };
  retrievalTime?: number;
  generationTime?: number;
}

interface SourceChunk {
  content: string;
  source: string;
  score?: number;
}

interface TestDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
  userId: string;
  documentCount: number;
}

const FormattedMessage = ({ content }: { content: string }) => {
  return (
    <div className="prose prose-sm max-w-none text-inherit">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-base font-bold mb-2 mt-3">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold mb-1.5 mt-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2">{children}</h3>,
          p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
            ) : (
              <code className="block bg-slate-100 p-3 rounded-lg text-xs font-mono overflow-x-auto">{children}</code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-300 pl-4 italic text-slate-600">{children}</blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const getModelDisplayName = (modelUsed?: string): string => {
  if (!modelUsed) return 'Unknown';

  const modelMap: Record<string, string> = {
    'gemini-2.0-flash': 'Gemini 2.0 Flash',
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
    'gemini-3-pro-preview': 'Gemini 3 Pro Preview',
    'claude-3-5-haiku-20241022': 'Claude Haiku 3.5',
    'claude-3-5-sonnet-20241022': 'Claude Sonnet 3.5',
    'claude-sonnet-4-20250514': 'Claude Sonnet 4',
  };

  return modelMap[modelUsed] || modelUsed;
};

const getModelBadgeColor = (modelUsed?: string): string => {
  if (!modelUsed) return 'bg-gray-100 text-gray-700';

  if (modelUsed.includes('gemini')) return 'bg-orange-100 text-orange-700';
  if (modelUsed.includes('haiku')) return 'bg-blue-100 text-blue-700';
  if (modelUsed.includes('sonnet')) return 'bg-purple-100 text-purple-700';

  return 'bg-gray-100 text-gray-700';
};

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
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    try {
      const result = await listVaultFiles(partnerId);
      if (result.success) {
        const activeFiles = result.files.filter(f => f.state === 'ACTIVE');
        setFiles(activeFiles);
        setSelectedFiles(new Set(activeFiles.map(f => f.id)));
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const loadExampleQuestions = async () => {
    setIsLoadingExamples(true);
    try {
      const questions = await generateExampleQuestions(partnerId);
      setExampleQuestions(questions);
    } catch (error) {
      console.error('Failed to load example questions:', error);
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

  const formatTime = (ms?: number) => {
    if (!ms) return 'N/A';
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isQuerying) return;

    const testedDocs = selectedFiles.size === 0
      ? ['All Documents']
      : Array.from(selectedFiles).map(id => {
        const file = files.find(f => f.id === id);
        return file?.displayName || 'Unknown';
      });

    const userMessage: Message = {
      role: 'user',
      content: query,
      timestamp: new Date(),
      testedDocuments: testedDocs,
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuery = query.trim();
    setQuery('');
    setIsQuerying(true);

    try {
      console.log('🔍 Sending query to vault API...');
      console.log('📊 Partner:', partnerId);
      console.log('📊 Query:', currentQuery);
      console.log('📊 Selected files:', selectedFiles.size === 0 ? 'ALL' : Array.from(selectedFiles));

      const selectedFileNames = selectedFiles.size === 0
        ? undefined
        : Array.from(selectedFiles).map(id => {
          const file = files.find(f => f.id === id);
          return file?.displayName || file?.name || '';
        }).filter(name => name);

      const response = await fetch('/api/vault/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          userId,
          message: currentQuery,
          selectedFileIds: selectedFiles.size === 0 ? undefined : Array.from(selectedFiles),
          selectedFileNames,
        }),
      });

      const result = await response.json();
      console.log('📊 API Response:', result);

      if (result.success) {
        let sources: SourceChunk[] = [];

        if (result.geminiChunks && Array.isArray(result.geminiChunks)) {
          sources = result.geminiChunks.map((chunk: any) => ({
            content: chunk.content || chunk.text || '',
            source: chunk.source || chunk.documentName || 'Unknown Document',
            score: chunk.score,
          })).filter((s: SourceChunk) => s.content.length > 0);
        }

        const assistantMessage: Message = {
          role: 'assistant',
          content: result.response || 'No response generated.',
          sources,
          modelUsed: result.modelUsed,
          usage: result.usage,
          retrievalTime: result.retrievalTime,
          generationTime: result.generationTime,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);

        if (sources.length === 0) {
          console.warn('⚠️ No source citations returned');
        } else {
          console.log(`✅ ${sources.length} sources returned`);
        }
      } else {
        throw new Error(result.message || 'Query failed');
      }
    } catch (error: any) {
      console.error('❌ Query failed:', error);

      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
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

  const handleExampleClick = (question: string) => {
    setQuery(question);
  };

  const filteredFiles = files.filter(f =>
    f.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200">
        <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Vault Chat</h2>
              <p className="text-sm text-slate-500">
                {documentCount} document{documentCount !== 1 ? 's' : ''} • {selectedFiles.size} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-slate-200 bg-slate-50/50 p-3">
          <button
            onClick={() => setShowDocumentSelector(!showDocumentSelector)}
            className="w-full flex items-center justify-between px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">
                {selectedFiles.size === 0
                  ? 'Searching all documents'
                  : `Searching ${selectedFiles.size} of ${files.length} documents`}
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform ${showDocumentSelector ? 'rotate-180' : ''}`}
            />
          </button>

          {showDocumentSelector && (
            <div className="mt-3 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {selectedFiles.size} of {files.length} selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleClearSelection}
                      className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                {filteredFiles.map(file => (
                  <label
                    key={file.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedFiles.has(file.id)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-slate-300 hover:border-blue-400'
                        }`}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFileSelection(file.id);
                      }}
                    >
                      {selectedFiles.has(file.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <FileText className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-700 truncate flex-1 font-medium">
                      {file.displayName}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex p-4 bg-white rounded-2xl shadow-sm mb-4 border border-slate-100">
                <Bot className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Start a conversation
              </h3>
              <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">
                Ask questions about your documents and get AI-powered answers based on your knowledge base.
              </p>

              {isLoadingExamples ? (
                <div className="flex items-center justify-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading suggestions...</span>
                </div>
              ) : exampleQuestions.length > 0 ? (
                <div className="space-y-2 max-w-sm mx-auto">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Suggested Questions
                  </p>
                  {exampleQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleExampleClick(question)}
                      className="block w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all text-sm text-slate-700 shadow-sm hover:shadow-md"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}

              <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                <div
                  className={`rounded-2xl px-5 py-4 shadow-sm ${message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-900 border border-slate-100 rounded-tl-none'
                    }`}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  ) : (
                    <>
                      {message.modelUsed && (
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={`text-[10px] ${getModelBadgeColor(message.modelUsed)}`}>
                            {getModelDisplayName(message.modelUsed)}
                          </Badge>
                          {message.sources && message.sources.length > 0 && (
                            <Badge variant="outline" className="text-[10px]">
                              {message.sources.length} source{message.sources.length !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      )}

                      <FormattedMessage content={message.content} />

                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <Collapsible>
                            <CollapsibleTrigger className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 w-full transition-colors">
                              <ChevronDown className="h-3 w-3" />
                              <span>Sources ({message.sources.length})</span>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-3 space-y-2">
                              {message.sources.map((source, i) => (
                                <div
                                  key={i}
                                  className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors group"
                                >
                                  <div className="flex items-start justify-between gap-2 mb-1">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-blue-600" />
                                      <span className="text-xs font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                                        {source.source}
                                      </span>
                                    </div>
                                    {source.score !== undefined && (
                                      <Badge variant="secondary" className="text-[10px] h-5 bg-white border border-slate-200 text-slate-600">
                                        {(source.score * 100).toFixed(0)}% match
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed pl-6">
                                    {source.content}
                                  </p>
                                </div>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      )}

                      {(message.retrievalTime !== undefined || message.generationTime !== undefined) && (
                        <div className="mt-3 pt-2 border-t border-slate-100">
                          <Collapsible>
                            <CollapsibleTrigger className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 w-full transition-colors">
                              <ChevronDown className="h-3 w-3" />
                              <span>Performance</span>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2">
                              <div className="flex items-center gap-4 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                                {message.retrievalTime !== undefined && (
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="h-3 w-3 text-slate-400" />
                                    <span>Time: <span className="font-mono font-medium">{formatTime(message.retrievalTime)}</span></span>
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2 px-1">
                  <span className="text-[10px] text-slate-400 font-medium">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {isQuerying && (
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-slate-600">Searching documents...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-slate-200 p-4 bg-white">
          <div className="flex gap-3">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
              disabled={isQuerying}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={!query.trim() || isQuerying}
              className="h-auto px-4 bg-blue-600 hover:bg-blue-700"
            >
              {isQuerying ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </p>
        </form>
      </div>
    </>
  );
}