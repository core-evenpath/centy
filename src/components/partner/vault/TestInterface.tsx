'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Loader2, 
  Sparkles, 
  FileText,
  AlertCircle,
  Bot,
  User,
  CheckCircle2,
  ExternalLink,
  History,
  Trash2,
  TestTube2,
  Layers,
  Filter,
  Search,
  X,
  ChevronDown,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { generateExampleQuestions, listVaultFiles } from '@/actions/vault-actions';
import type { VaultFile } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    text: string;
    score?: number;
    documentName?: string;
  }>;
  timestamp: Date;
  testedDocuments?: string[];
}

interface TestInterfaceProps {
  partnerId: string;
  userId: string;
  documentCount: number;
}

type TestMode = 'all' | 'selected';

export default function TestInterface({ partnerId, userId, documentCount }: TestInterfaceProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [exampleQuestions, setExampleQuestions] = useState<string[]>([]);
  const [isLoadingExamples, setIsLoadingExamples] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [testMode, setTestMode] = useState<TestMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (documentCount > 0) {
      loadFiles();
      loadExampleQuestions();
    }
  }, [documentCount]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isQuerying]);

  const loadFiles = async () => {
    try {
      const result = await listVaultFiles(partnerId);
      if (result.success) {
        const activeFiles = result.files.filter(f => f.state === 'ACTIVE');
        setFiles(activeFiles);
        // Default to all files selected
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
    
    // If user manually selects/deselects, switch to selected mode
    if (newSelection.size !== files.length) {
      setTestMode('selected');
    }
  };

  const selectAll = () => {
    setSelectedFiles(new Set(files.map(f => f.id)));
    setTestMode('all');
  };

  const deselectAll = () => {
    setSelectedFiles(new Set());
    setTestMode('selected');
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
      const response = await fetch('/api/vault/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          userId,
          message: query.trim(),
          selectedFileIds: Array.from(selectedFiles), // Pass the selected file IDs
        }),
      });

      const result = await response.json();

      if (result.success) {
        const sources = result.groundingChunks?.map((chunk: any) => ({
          text: chunk.retrievedContext?.text || '',
          score: chunk.score,
        })).filter((s: any) => s.text) || [];

        const assistantMessage: Message = {
          role: 'assistant',
          content: result.response || '',
          sources,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Show warning if no sources found from selected documents
        if (sources.length === 0) {
          toast({
            title: 'No relevant information found',
            description: `The selected document${testedDocs.length !== 1 ? 's' : ''} may not contain information about "${query.trim()}"`,
            variant: 'default',
          });
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
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

  const clearChat = () => {
    setMessages([]);
    toast({
      title: 'Chat cleared',
      description: 'Conversation history has been reset',
    });
  };

  const filteredFiles = files.filter(file =>
    file.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (documentCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-14rem)] px-4">
        <div className="text-center max-w-md">
          <div className="bg-blue-100 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            No documents to test
          </h3>
          <p className="text-gray-600 mb-6">
            Upload and train documents first to test your AI knowledge base
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <FileText className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-14rem)] flex">
      {/* Document Selector Sidebar */}
      {showDocumentSelector && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Select Documents
              </h4>
              <button
                onClick={() => setShowDocumentSelector(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                className="flex-1 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                All ({files.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deselectAll}
                className="flex-1 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                None
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm h-9"
              />
            </div>
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredFiles.map((file) => {
              const isSelected = selectedFiles.has(file.id);
              return (
                <button
                  key={file.id}
                  onClick={() => toggleFileSelection(file.id)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isSelected ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {file.displayName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selection Summary */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm">
              <span className="font-semibold text-gray-900">
                {selectedFiles.size}
              </span>
              <span className="text-gray-600"> of {files.length} documents selected</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header with Document Selector */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TestTube2 className="h-5 w-5 text-blue-600" />
                Test Your AI Knowledge Base
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Ask questions to validate your trained documents
              </p>
            </div>
            {messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearChat}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Document Scope Selector */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDocumentSelector(!showDocumentSelector)}
              className={`${showDocumentSelector ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Select Documents
              {selectedFiles.size < files.length && (
                <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">
                  {selectedFiles.size}
                </span>
              )}
            </Button>

            {/* Active Scope Display */}
            <div className="flex-1 flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <Layers className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {selectedFiles.size === files.length ? (
                    <>Testing <strong>all {files.length}</strong> documents</>
                  ) : (
                    <>Testing <strong>{selectedFiles.size}</strong> of {files.length} documents</>
                  )}
                </span>
              </div>

              {selectedFiles.size < files.length && selectedFiles.size > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8">
                      <span className="text-sm text-gray-600">View selected</span>
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64 max-h-64 overflow-y-auto">
                    {Array.from(selectedFiles).map(fileId => {
                      const file = files.find(f => f.id === fileId);
                      return file ? (
                        <DropdownMenuItem key={fileId} className="text-sm">
                          <FileText className="h-3 w-3 mr-2 text-blue-600" />
                          {file.displayName}
                        </DropdownMenuItem>
                      ) : null;
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8 mb-6">
                <Bot className="h-16 w-16 text-blue-600 mx-auto" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                Ready to test {selectedFiles.size === files.length ? 'all your documents' : `${selectedFiles.size} selected document${selectedFiles.size !== 1 ? 's' : ''}`}
              </h4>
              <p className="text-gray-600 max-w-md mb-6">
                Ask questions to verify that your AI is finding and using the right information from your documents.
              </p>
              
              {isLoadingExamples ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading suggestions...</span>
                </div>
              ) : exampleQuestions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Try these questions:</p>
                  <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                    {exampleQuestions.slice(0, 4).map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQuery(question)}
                        className="inline-flex items-center gap-2 text-sm bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-700 px-4 py-2 rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <Sparkles className="h-3 w-3" />
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
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl rounded-2xl shadow-sm ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border-2 border-gray-200 text-gray-900'
                    }`}
                  >
                    {message.role === 'user' && message.testedDocuments && (
                      <div className="px-5 py-2 bg-blue-500 rounded-t-2xl border-b border-blue-400">
                        <div className="flex items-center gap-2 text-xs text-blue-100">
                          <Layers className="h-3 w-3" />
                          <span>
                            Testing {message.testedDocuments.length} document{message.testedDocuments.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="px-5 py-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>

                    {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                      <div className="px-5 py-3 bg-gray-50 border-t-2 border-gray-200 rounded-b-2xl">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Sources Found ({message.sources.length})
                          </p>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {message.sources.map((source, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedSource(source.text)}
                              className="group relative bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700 text-xs px-3 py-1.5 rounded-lg transition-all font-medium"
                            >
                              <span className="flex items-center gap-1">
                                Source {idx + 1}
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </span>
                              {source.score !== undefined && (
                                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                  {(source.score * 100).toFixed(0)}%
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className={`px-5 py-2 text-xs ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </div>
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
                  <div className="bg-white border-2 border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span className="text-sm text-gray-600">
                        Searching {selectedFiles.size} document{selectedFiles.size !== 1 ? 's' : ''}...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Ask a question to test ${selectedFiles.size === files.length ? 'all documents' : `${selectedFiles.size} selected document${selectedFiles.size !== 1 ? 's' : ''}`}...`}
                className="min-h-[60px] max-h-[120px] resize-none pr-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                disabled={isQuerying || selectedFiles.size === 0}
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
              disabled={isQuerying || !query.trim() || selectedFiles.size === 0}
              className="self-end h-[60px] px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {isQuerying ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
          {selectedFiles.size === 0 && (
            <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Please select at least one document to start testing
            </p>
          )}
        </div>
      </div>

      {/* Right Sidebar - Testing Info */}
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <History className="h-4 w-4" />
            Testing Guide
          </h4>
          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Test Individual Documents</p>
                <p className="text-xs mt-1">Select a single document to verify it was indexed correctly</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Test Multiple Documents</p>
                <p className="text-xs mt-1">Select related documents to ensure cross-document search works</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Test All Documents</p>
                <p className="text-xs mt-1">Query across your entire knowledge base for comprehensive testing</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            Test Statistics
          </h4>
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Total Documents</span>
                <span className="text-lg font-bold text-blue-600">{files.length}</span>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Selected for Testing</span>
                <span className="text-lg font-bold text-purple-600">{selectedFiles.size}</span>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Questions Asked</span>
                <span className="text-lg font-bold text-green-600">
                  {messages.filter(m => m.role === 'user').length}
                </span>
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Sources Retrieved</span>
                <span className="text-lg font-bold text-orange-600">
                  {messages
                    .filter(m => m.role === 'assistant')
                    .reduce((acc, m) => acc + (m.sources?.length || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Source Preview Modal */}
      {selectedSource && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedSource(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white rounded-t-2xl">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Source Document Excerpt
              </h3>
              <p className="text-blue-100 text-sm mt-1">
                This text was used to generate the response
              </p>
            </div>
            <div className="flex-grow overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedSource}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <Button onClick={() => setSelectedSource(null)} className="rounded-xl">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}