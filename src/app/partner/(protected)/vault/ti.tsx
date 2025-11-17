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
import { chatWithVaultHybrid, listVaultFiles } from '@/actions/vault-actions';
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
  metadata?: {
    modelUsed?: string;
    retrievalTime?: number;
    generationTime?: number;
    metadataFilter?: string;
  };
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
        setSelectedFiles(new Set(activeFiles.map(f => f.id)));
      }
    } catch (error) {
      console.error('Failed to load files:', error);
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

    const selectedFileIds = Array.from(selectedFiles);
    const selectedFileNames = files
      .filter(f => selectedFiles.has(f.id))
      .map(f => f.displayName);

    console.log(`🧪 Testing with ${selectedFileIds.length} documents:`, selectedFileNames);

    const userMessage: Message = {
      role: 'user',
      content: query,
      timestamp: new Date(),
      testedDocuments: selectedFileNames,
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setIsQuerying(true);

    try {
      const result = await chatWithVaultHybrid(
        partnerId,
        userId,
        query,
        selectedFileIds
      );

      if (!result.success || !result.response) {
        throw new Error(result.message || 'Query failed');
      }

      const sources = result.geminiChunks?.map((chunk: any, index: number) => ({
        text: chunk.content,
        score: chunk.score,
        documentName: chunk.source || `Source ${index + 1}`,
      })) || [];

      const assistantMessage: Message = {
        role: 'assistant',
        content: result.response,
        sources: sources,
        timestamp: new Date(),
        testedDocuments: selectedFileNames,
        metadata: {
          modelUsed: result.modelUsed,
          retrievalTime: result.retrievalTime,
          generationTime: result.generationTime,
          metadataFilter: result.metadataFilter,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);

      toast({
        title: '✅ Query successful',
        description: `Used ${sources.length} sources from ${selectedFileIds.length} documents`,
      });

    } catch (error: any) {
      console.error('Query failed:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ Error: ${error.message || 'Query failed'}`,
        timestamp: new Date(),
        testedDocuments: selectedFileNames,
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: 'Query failed',
        description: error.message || 'Please try again',
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
      description: 'Started fresh conversation',
    });
  };

  const filteredFiles = files.filter(file =>
    file.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-gray-200 p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <TestTube2 className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Test RAG System</h3>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                onClick={clearChat}
                variant="outline"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <DropdownMenu open={showDocumentSelector} onOpenChange={setShowDocumentSelector}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  {selectedFiles.size === files.length 
                    ? `All Documents (${files.length})`
                    : `${selectedFiles.size} of ${files.length} selected`
                  }
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
              <div className="p-2 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={selectAll}
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    onClick={deselectAll}
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
              <div className="p-1">
                {filteredFiles.map(file => (
                  <DropdownMenuItem
                    key={file.id}
                    onClick={() => toggleFileSelection(file.id)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      selectedFiles.has(file.id) 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-gray-300'
                    }`}>
                      {selectedFiles.has(file.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="flex-1 truncate text-sm">{file.displayName}</span>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {selectedFiles.size > 0 && selectedFiles.size < files.length && (
          <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-md p-2">
            <Filter className="h-3 w-3 inline mr-1" />
            Testing with {selectedFiles.size} selected document{selectedFiles.size !== 1 ? 's' : ''}
            (metadata filtering active)
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="h-16 w-16 text-gray-300 mb-4" />
            <h4 className="text-lg font-medium text-gray-600 mb-2">
              Test Your Documents
            </h4>
            <p className="text-sm text-gray-500 max-w-md">
              Select documents and ask questions to test the RAG system's accuracy.
              The system will only search within your selected documents.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {message.role === 'user' ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <Bot className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      
                      {message.testedDocuments && message.testedDocuments.length > 0 && (
                        <div className={`mt-3 pt-3 border-t ${
                          message.role === 'user' ? 'border-blue-500' : 'border-gray-200'
                        }`}>
                          <p className="text-xs opacity-70 mb-1">
                            Tested documents ({message.testedDocuments.length}):
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {message.testedDocuments.map((doc, i) => (
                              <span
                                key={i}
                                className={`text-xs px-2 py-1 rounded ${
                                  message.role === 'user'
                                    ? 'bg-blue-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600 mb-2 font-medium">
                            Sources ({message.sources.length}):
                          </p>
                          <div className="space-y-2">
                            {message.sources.map((source, i) => (
                              <div
                                key={i}
                                className="text-xs bg-gray-50 p-2 rounded border border-gray-200"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-gray-700">
                                    {source.documentName}
                                  </span>
                                  {source.score && (
                                    <span className="text-xs text-gray-500">
                                      {(source.score * 100).toFixed(0)}% match
                                    </span>
                                  )}
                                </div>
                                <p className="text-gray-600 line-clamp-2">
                                  {source.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {message.metadata && (
                        <div className="mt-2 text-xs opacity-50">
                          {message.metadata.modelUsed && (
                            <span>Model: {message.metadata.modelUsed}</span>
                          )}
                          {message.metadata.retrievalTime && message.metadata.generationTime && (
                            <span className="ml-3">
                              Time: {message.metadata.retrievalTime}ms + {message.metadata.generationTime}ms
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isQuerying && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">Searching documents...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask a question about your ${selectedFiles.size === files.length ? 'documents' : 'selected documents'}...`}
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
            className="px-6"
          >
            {isQuerying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        {selectedFiles.size === 0 && (
          <p className="text-xs text-red-500 mt-2">
            Please select at least one document to start testing
          </p>
        )}
      </div>
    </div>
  );
}