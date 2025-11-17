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
  Zap
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
      console.log('🔍 groundingChunks:', result.groundingChunks);
      console.log('🔍 sources:', result.sources);
      console.log('🔍 retrievalContext:', result.retrievalContext);
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
              source: chunk.source || chunk.documentName || 'Unknown',
              score: chunk.score,
            };
          }).filter((s: any) => s.content);
        }
        else if (result.groundingChunks && Array.isArray(result.groundingChunks)) {
          console.log('✅ Using groundingChunks format, count:', result.groundingChunks.length);
          sources = result.groundingChunks.map((chunk: any, idx: number) => {
            console.log(`  Chunk ${idx}:`, {
              text: chunk.retrievedContext?.text?.substring(0, 50),
              documentName: chunk.documentName,
              score: chunk.score,
            });
            return {
              content: chunk.retrievedContext?.text || chunk.text || chunk.content || '',
              source: chunk.documentName || chunk.source || 'Unknown',
              score: chunk.score,
            };
          }).filter((s: any) => s.content);
        }
        else if (result.sources && Array.isArray(result.sources)) {
          console.log('✅ Using sources format, count:', result.sources.length);
          sources = result.sources.map((chunk: any, idx: number) => {
            console.log(`  Source ${idx}:`, chunk);
            return {
              content: chunk.content || chunk.text || '',
              source: chunk.source || chunk.documentName || 'Unknown',
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

  const filteredFiles = files.filter(file =>
    file.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 bottom-0 w-[600px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
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

        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <Collapsible open={showDocumentSelector} onOpenChange={setShowDocumentSelector}>
            <div className="flex items-center justify-between">
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2"
                >
                  <Layers className="h-4 w-4" />
                  <span>
                    {selectedFiles.size === files.length 
                      ? `All documents (${files.length})`
                      : `${selectedFiles.size} of ${files.length} documents`
                    }
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showDocumentSelector ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>

              {selectedFiles.size !== files.length && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-8 text-xs"
                  >
                    Select All
                  </Button>
                  {selectedFiles.size > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSelection}
                      className="h-8 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              )}
            </div>

            <CollapsibleContent className="mt-3">
              <div className="bg-white rounded-lg border border-gray-200 p-3 max-h-80 overflow-y-auto">
                <div className="mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  {filteredFiles.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      No documents found
                    </div>
                  ) : (
                    filteredFiles.map((file) => (
                      <button
                        key={file.id}
                        onClick={() => toggleFileSelection(file.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                          selectedFiles.has(file.id)
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedFiles.has(file.id)
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedFiles.has(file.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.displayName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8 mb-6">
                <Bot className="h-16 w-16 text-blue-600 mx-auto" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Ready to test your documents
              </h4>
              <p className="text-gray-600 mb-6 max-w-md">
                Ask questions about {selectedFiles.size === files.length 
                  ? 'all your documents' 
                  : `${selectedFiles.size} selected document${selectedFiles.size !== 1 ? 's' : ''}`
                }
              </p>
              {exampleQuestions.length > 0 && (
                <div className="w-full max-w-md space-y-2">
                  <p className="text-sm font-medium text-gray-700 mb-3">Try asking:</p>
                  {exampleQuestions.slice(0, 3).map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => setQuery(question)}
                      className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm text-gray-700"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            messages.map((message, idx) => (
              <div key={idx} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}
                <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                  <div className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    {message.role === 'user' && message.testedDocuments && message.testedDocuments.length > 0 && (
                      <div className="mb-2 pb-2 border-b border-blue-500/30">
                        <p className="text-xs text-blue-100 mb-1">Testing documents:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.testedDocuments.slice(0, 3).map((doc, i) => (
                            <span key={i} className="text-xs bg-blue-500/30 px-2 py-0.5 rounded">
                              {doc}
                            </span>
                          ))}
                          {message.testedDocuments.length > 3 && (
                            <span className="text-xs bg-blue-500/30 px-2 py-0.5 rounded">
                              +{message.testedDocuments.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="text-sm">
                      <FormattedMessage content={message.content} />
                    </div>
                    
                    {message.role === 'assistant' && (
                      <div className="mt-4 pt-3 border-t border-gray-200 space-y-3">
                        
                        {(message.modelUsed || message.retrievalTime || message.generationTime || message.usage) && (
                          <div className="space-y-2">
                            {message.modelUsed && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Sparkles className="h-3 w-3" />
                                <span>
                                  Query Model: <strong className="font-semibold">{message.modelUsed}</strong>
                                </span>
                              </div>
                            )}
                            
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
                          </div>
                        )}

                        {message.sources && message.sources.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              Sources:
                            </h4>
                            <div className="space-y-2">
                              {message.sources.map((source, sourceIndex) => (
                                <button
                                  key={sourceIndex}
                                  onClick={() => setModalSource({ source, index: sourceIndex + 1 })}
                                  className="w-full text-left bg-white hover:bg-gray-50 border border-gray-300 px-3 py-2 rounded-md transition-colors"
                                  title={`Click to view full text from ${source.source}`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                        <span className="text-xs font-bold text-blue-600">{sourceIndex + 1}</span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-gray-900 truncate">{source.source}</p>
                                        <p className="text-xs text-gray-500 line-clamp-1">{source.content.substring(0, 60)}...</p>
                                      </div>
                                    </div>
                                    {source.score && (
                                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                                        {(source.score * 100).toFixed(0)}%
                                      </Badge>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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
            ))
          )}
          {isQuerying && (
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-600">Analyzing documents...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="border-t border-gray-200 p-4 bg-white">
          {selectedFiles.size === 0 && (
            <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Please select at least one document to start testing
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={selectedFiles.size === 0 
                ? "Select documents above to start..." 
                : "Ask a question about your documents..."
              }
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
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
              className="self-end h-[60px] px-6"
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

      {modalSource && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4"
          onClick={() => setModalSource(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-600">{modalSource.index}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Source {modalSource.index}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap pl-11">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">{modalSource.source.source}</span>
                    </div>
                    {modalSource.source.score && (
                      <Badge variant="secondary">
                        {(modalSource.source.score * 100).toFixed(0)}% relevance
                      </Badge>
                    )}
                    <div className="text-xs text-gray-500">
                      {modalSource.source.content.length.toLocaleString()} characters
                    </div>
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

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <p className="text-xs text-blue-800">
                  💡 <strong>This is the exact text chunk</strong> retrieved from <strong>{modalSource.source.source}</strong> that was used to generate the answer above.
                </p>
              </div>

              <div className="max-h-[50vh] overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {modalSource.source.content}
                </div>
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