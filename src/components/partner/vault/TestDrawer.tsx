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
          h1: ({ node, ...props }) => <h1 className="text-base font-bold mb-2 mt-3" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-sm font-bold mb-1.5 mt-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-sm font-semibold mb-1 mt-2" {...props} />,
          p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
          li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          code: ({ node, inline, ...props }: any) =>
            inline ? (
              <code className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
            ) : (
              <code className="block bg-white/10 p-2 rounded text-xs font-mono overflow-x-auto my-2" {...props} />
            ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-2 border-white/30 pl-3 italic my-2" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="underline hover:no-underline" {...props} />
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
    'claude-3-5-haiku-20241022': 'Claude Haiku 3.5',
    'claude-3-5-sonnet-20241022': 'Claude Sonnet 3.5',
    'claude-sonnet-4-20250514': 'Claude Sonnet 4.5',
    'gpt-4o-mini': 'GPT-4o Mini',
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
  };

  return modelMap[modelUsed] || modelUsed;
};

const getModelBadgeColor = (modelUsed?: string): string => {
  if (!modelUsed) return 'bg-gray-100 text-gray-700';

  if (modelUsed.includes('haiku')) return 'bg-blue-100 text-blue-700';
  if (modelUsed.includes('sonnet-4')) return 'bg-purple-100 text-purple-700';
  if (modelUsed.includes('sonnet-3')) return 'bg-indigo-100 text-indigo-700';
  if (modelUsed.includes('gpt')) return 'bg-green-100 text-green-700';
  if (modelUsed.includes('gemini')) return 'bg-orange-100 text-orange-700';

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

    if (selectedFiles.size === 0) {
      // If no files selected, we default to searching ALL files (replicating messaging behavior)
      console.log('🔍 No specific files selected, searching ALL documents');
    } else if (selectedFiles.size === 1) {
      console.log('🔍 Querying single file:', Array.from(selectedFiles)[0]);
    }

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
    setQuery('');
    setIsQuerying(true);

    try {
      console.log('🔍 Sending query to vault API...');

      const response = await fetch('/api/vault/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          userId,
          message: query.trim(),
          selectedFileIds: selectedFiles.size === 0 ? undefined : Array.from(selectedFiles),
        }),
      });

      const result = await response.json();

      if (result.success) {
        let sources: SourceChunk[] = [];

        if (result.geminiChunks && Array.isArray(result.geminiChunks)) {
          sources = result.geminiChunks.map((chunk: any) => ({
            content: chunk.content || chunk.text || '',
            source: chunk.source || chunk.documentName || 'Unknown Document',
            score: chunk.score,
          })).filter((s: any) => s.content);
        }

        const assistantMessage: Message = {
          role: 'assistant',
          content: result.response || '',
          sources,
          modelUsed: result.modelUsed,
          usage: result.usage,
          retrievalTime: result.retrievalTime,
          generationTime: result.generationTime,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, assistantMessage]);

        if (sources.length === 0) {
          toast({
            title: 'No sources found',
            description: 'The response was generated but no source citations were returned',
            variant: 'default',
          });
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('❌ Query failed:', error);

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
        {/* Header */}
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

        {/* Document Selector */}
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
              className={`h-4 w-4 text-slate-400 transition-transform ${showDocumentSelector ? 'rotate-180' : ''
                }`}
            />
          </button>

          {showDocumentSelector && (
            <div className="mt-3 bg-white border border-slate-200 rounded-lg p-3 max-h-64 overflow-y-auto shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm bg-slate-50 border-slate-200"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs h-9"
                >
                  All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSelection}
                  className="text-xs h-9"
                >
                  None
                </Button>
              </div>

              <div className="space-y-1">
                {filteredFiles.map((file) => (
                  <label
                    key={file.id}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.id)}
                        onChange={() => toggleFileSelection(file.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
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

        {/* Chat Area */}
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

              {exampleQuestions.length > 0 && (
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
              )}
            </div>
          )}

          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}

              <div
                className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'flex justify-end' : ''
                  }`}
              >
                <div
                  className={`rounded-2xl px-5 py-4 shadow-sm ${message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-900 border border-slate-100 rounded-tl-none'
                    }`}
                >
                  {message.role === 'user' ? (
                    <>
                      <p className="text-sm leading-relaxed font-medium">{message.content}</p>
                      {message.testedDocuments && message.testedDocuments.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/20">
                          <p className="text-xs text-blue-100 mb-1 opacity-80">Context:</p>
                          <div className="flex flex-wrap gap-1">
                            {message.testedDocuments.slice(0, 3).map((doc, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white"
                              >
                                {doc}
                              </span>
                            ))}
                            {message.testedDocuments.length > 3 && (
                              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white">
                                +{message.testedDocuments.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        {message.modelUsed && (
                          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${getModelBadgeColor(message.modelUsed)}`}>
                            <Brain className="h-3 w-3" />
                            {getModelDisplayName(message.modelUsed)}
                          </div>
                        )}
                      </div>

                      <FormattedMessage content={message.content} />

                      {message.usage && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <Collapsible>
                            <CollapsibleTrigger className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800 w-full transition-colors">
                              <ChevronDown className="h-3 w-3" />
                              <span>Performance Metrics</span>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-3 space-y-2">
                              {(message.retrievalTime !== undefined || message.generationTime !== undefined) && (
                                <div className="flex items-center gap-4 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                                  {message.retrievalTime !== undefined && (
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="h-3 w-3 text-slate-400" />
                                      <span>Retrieval: <span className="font-mono font-medium">{formatTime(message.retrievalTime)}</span></span>
                                    </div>
                                  )}
                                  {message.generationTime !== undefined && (
                                    <div className="flex items-center gap-1.5">
                                      <Zap className="h-3 w-3 text-slate-400" />
                                      <span>Generation: <span className="font-mono font-medium">{formatTime(message.generationTime)}</span></span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {message.usage && (
                                <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                                  <span>Tokens: <span className="font-mono">{message.usage.input_tokens || 0}</span> in / <span className="font-mono">{message.usage.output_tokens || 0}</span> out</span>
                                </div>
                              )}
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      )}

                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <FileText className="h-3 w-3" />
                            Sources ({message.sources.length})
                          </h4>
                          <div className="space-y-2">
                            {message.sources.map((source, sourceIdx) => (
                              <div
                                key={sourceIdx}
                                className="bg-slate-50 rounded-lg p-3 border border-slate-200 hover:border-blue-300 transition-colors group"
                              >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="bg-white p-1 rounded border border-slate-200">
                                      <FileText className="h-3 w-3 text-blue-600" />
                                    </div>
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
                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed pl-7">
                                  {source.content}
                                </p>
                              </div>
                            ))}
                          </div>
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
              <div className="flex-1">
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm inline-flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-slate-600 font-medium">Analyzing documents...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white p-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="flex-1 min-h-[50px] max-h-[120px] resize-none bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-300 transition-all rounded-xl py-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={isQuerying}
            />
            <Button
              type="submit"
              disabled={!query.trim() || isQuerying}
              className="self-end h-[50px] w-[50px] rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
            >
              {isQuerying ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
          <p className="text-[10px] text-slate-400 mt-2 text-center font-medium">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}