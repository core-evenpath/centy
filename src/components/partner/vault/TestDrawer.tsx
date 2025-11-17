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
  const [modalSource, setModalSource] = useState<{ source: SourceChunk; index: number } | null>(null);
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
      toast({
        title: 'No documents selected',
        description: 'Please select at least one document to test',
        variant: 'destructive',
      });
      return;
    }

    const testedDocs = Array.from(selectedFiles).map(id => {
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
          selectedFileIds: Array.from(selectedFiles),
        }),
      });

      const result = await response.json();

      console.log('═══════════════════════════════════════');
      console.log('📦 FULL API RESPONSE:', JSON.stringify(result, null, 2));
      console.log('═══════════════════════════════════════');
      console.log('📊 Response keys:', Object.keys(result));
      console.log('🔍 geminiChunks:', result.geminiChunks);
      console.log('🔍 modelUsed:', result.modelUsed);
      console.log('═══════════════════════════════════════');

      if (result.success) {
        let sources: SourceChunk[] = [];
        
        if (result.geminiChunks && Array.isArray(result.geminiChunks)) {
          console.log('✅ Using geminiChunks format, count:', result.geminiChunks.length);
          sources = result.geminiChunks.map((chunk: any, idx: number) => {
            console.log(`  Chunk ${idx}:`, {
              content: chunk.content?.substring(0, 50),
              source: chunk.source,
              score: chunk.score,
            });
            return {
              content: chunk.content || chunk.text || '',
              source: chunk.source || chunk.documentName || 'Unknown Document',
              score: chunk.score,
            };
          }).filter((s: any) => s.content);
        }

        console.log('✅ Final parsed sources:', sources.length);
        sources.forEach((s, idx) => {
          console.log(`  Source ${idx + 1}:`, {
            source: s.source,
            contentLength: s.content.length,
            score: s.score,
          });
        });

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

        console.log('💬 Assistant message created with', assistantMessage.sources?.length, 'sources');

        setMessages(prev => [...prev, assistantMessage]);

        if (sources.length === 0) {
          console.warn('⚠️ No sources found in response');
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
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white shadow-2xl z-50 flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Vault Chat</h2>
              <p className="text-sm text-blue-100">
                {documentCount} document{documentCount !== 1 ? 's' : ''} • {selectedFiles.size} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-gray-200 bg-gray-50 p-3">
          <button
            onClick={() => setShowDocumentSelector(!showDocumentSelector)}
            className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {selectedFiles.size === files.length
                  ? 'All documents selected'
                  : `${selectedFiles.size} of ${files.length} documents`}
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-gray-600 transition-transform ${
                showDocumentSelector ? 'rotate-180' : ''
              }`}
            />
          </button>

          {showDocumentSelector && (
            <div className="mt-3 bg-white border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-8 text-sm"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs h-8"
                >
                  All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSelection}
                  className="text-xs h-8"
                >
                  None
                </Button>
              </div>

              <div className="space-y-1">
                {filteredFiles.map((file) => (
                  <label
                    key={file.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.id)}
                        onChange={() => toggleFileSelection(file.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {selectedFiles.has(file.id) && (
                        <Check className="absolute h-3 w-3 text-white pointer-events-none" />
                      )}
                    </div>
                    <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate flex-1">
                      {file.displayName}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="inline-flex p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full mb-4">
                <Bot className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Start a conversation
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Ask questions about your documents
              </p>

              {exampleQuestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                    Try asking:
                  </p>
                  {exampleQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleExampleClick(question)}
                      className="block w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm text-gray-700"
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
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                </div>
              )}

              <div
                className={`flex-1 max-w-[85%] ${
                  message.role === 'user' ? 'flex justify-end' : ''
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.role === 'user' ? (
                    <>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      {message.testedDocuments && message.testedDocuments.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/20">
                          <p className="text-xs text-blue-100 mb-1">Testing with:</p>
                          <div className="flex flex-wrap gap-1">
                            {message.testedDocuments.map((doc, i) => (
                              <span
                                key={i}
                                className="text-xs bg-white/20 px-2 py-0.5 rounded"
                              >
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        {message.modelUsed && (
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${getModelBadgeColor(message.modelUsed)}`}>
                            <Brain className="h-3 w-3" />
                            {getModelDisplayName(message.modelUsed)}
                          </div>
                        )}
                      </div>
                      <FormattedMessage content={message.content} />

                      {message.usage && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <Collapsible>
                            <CollapsibleTrigger className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 w-full">
                              <ChevronDown className="h-3 w-3" />
                              <span>Performance Details</span>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-2 space-y-2">
                              {(message.retrievalTime !== undefined || message.generationTime !== undefined) && (
                                <div className="flex items-center gap-4 text-xs text-gray-600">
                                  {message.retrievalTime !== undefined && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>Retrieval: {formatTime(message.retrievalTime)}</span>
                                    </div>
                                  )}
                                  {message.generationTime !== undefined && (
                                    <div className="flex items-center gap-1">
                                      <Zap className="h-3 w-3" />
                                      <span>Generation: {formatTime(message.generationTime)}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {message.usage && (
                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                  <span>Tokens: {message.usage.input_tokens || 0} in / {message.usage.output_tokens || 0} out</span>
                                  {message.usage.cache_read_input_tokens !== undefined && message.usage.cache_read_input_tokens > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      {message.usage.cache_read_input_tokens} cached
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      )}

                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Sources ({message.sources.length})
                          </h4>
                          <div className="space-y-2">
                            {message.sources.map((source, sourceIdx) => (
                              <div
                                key={sourceIdx}
                                className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileText className="h-3 w-3 text-blue-600 flex-shrink-0" />
                                    <span className="text-xs font-medium text-gray-900 truncate">
                                      {source.source}
                                    </span>
                                  </div>
                                  {source.score !== undefined && (
                                    <Badge variant="outline" className="text-xs flex-shrink-0">
                                      {(source.score * 100).toFixed(0)}%
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2">
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

                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {isQuerying && (
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="border-t border-gray-200 bg-white p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
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
              className="self-end bg-blue-600 hover:bg-blue-700"
            >
              {isQuerying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  );
}