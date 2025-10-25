"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Search, Upload, FileText, CheckCircle, Clock, X, ChevronDown,
  MessageSquare, Send, Sparkles, Download, Trash2, Filter,
  Loader2, Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import PartnerHeader from '@/components/partner/PartnerHeader';
import ReactMarkdown from 'react-markdown';

interface FileDocument {
  id: string;
  name: string;
  type: string;
  tags: string[];
  status: 'ready' | 'processing' | 'uploading';
  uploadDate: string;
  uploadedBy: string;
  size: string;
  url: string;
  progress?: number;
  indexedContent: string[];
}

// Formatted Message Component
const FormattedMessage = ({ content }: { content: string }) => {
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2 text-slate-900" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2 text-slate-900" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-sm font-bold mb-1.5 text-slate-900" {...props} />,
          p: ({ node, ...props }) => <p className="mb-3 text-slate-800 leading-relaxed" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
          li: ({ node, ...props }) => <li className="text-slate-800 leading-relaxed" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-semibold text-slate-900" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-slate-800" {...props} />,
          code: ({ node, inline, ...props }: any) => 
            inline ? (
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-900" {...props} />
            ) : (
              <code className="block bg-slate-100 p-3 rounded text-xs font-mono text-slate-900 overflow-x-auto mb-3" {...props} />
            ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-blue-400 pl-4 py-2 mb-3 italic text-slate-700 bg-blue-50" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-blue-600 hover:text-blue-700 underline" target="_blank" rel="noopener noreferrer" {...props} />
          ),
          hr: ({ node, ...props }) => <hr className="my-4 border-slate-300" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default function MissionControlPage() {
  const user = useAuth();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiContext, setAiContext] = useState('all');
  const [aiTagSearch, setAiTagSearch] = useState('');
  const [aiMessages, setAiMessages] = useState<Array<{role: string; content: string; sources?: string[]}>>([]);
  const [aiInput, setAiInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const [files, setFiles] = useState<FileDocument[]>([]);

  // Fetch documents from backend
  const fetchDocs = useCallback(async () => {
    try {
      const response = await fetch('/api/thesis-docs/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.user?.customClaims?.token ?? ""}`
        },
      });
      
      const json = await response.json();
      
      if (json.success && json.data) {
        const formattedFiles: FileDocument[] = json.data.map((doc: any, index: number) => ({
          id: doc.fileId || `file-${index}`,
          name: doc.metaData?.name || `Document ${index + 1}`,
          type: doc.metaData?.name?.split('.').pop()?.toLowerCase() || 'pdf',
          tags: doc.tags || [],
          status: doc.status || 'ready',
          uploadDate: doc.metaData?.ts ? new Date(doc.metaData.ts).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }) : 'Unknown',
          uploadedBy: doc.metaData?.uploadedBy || 'You',
          size: doc.metaData?.size || 'Unknown',
          url: doc.url,
          progress: doc.progress,
          indexedContent: doc.indexedContent || []
        }));
        setFiles(formattedFiles);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user.user) {
      fetchDocs();
    }
  }, [user.user, fetchDocs]);

  const allTags = [...new Set(files.flatMap(f => f.tags))].sort();

  // Stats
  const readyCount = files.filter(f => f.status === 'ready').length;
  const processingCount = files.filter(f => f.status === 'processing' || f.status === 'uploading').length;
  const aiSearchableCount = files.filter(f => f.status === 'ready' && f.tags.length > 0).length;

  const getFileIcon = (type: string) => {
    const typeClass = {
      'pdf': 'bg-red-50 text-red-600',
      'doc': 'bg-blue-50 text-blue-600',
      'docx': 'bg-blue-50 text-blue-600',
      'xls': 'bg-green-50 text-green-600',
      'xlsx': 'bg-green-50 text-green-600',
    }[type.toLowerCase()] || 'bg-slate-50 text-slate-600';

    const label = type.toUpperCase().substring(0, 3);

    return (
      <div className={`w-10 h-10 rounded ${typeClass} flex items-center justify-center text-xs font-bold`}>
        {label}
      </div>
    );
  };

  // Search logic
  const getSearchResults = () => {
    if (!searchQuery) return { fileMatches: [], contentMatches: [] };

    const query = searchQuery.toLowerCase();
    
    const fileMatches = files.filter(file => 
      file.name.toLowerCase().includes(query) ||
      file.tags.some(tag => tag.toLowerCase().includes(query)) ||
      file.uploadedBy.toLowerCase().includes(query)
    );

    const contentMatches = files
      .filter(file => file.status === 'ready')
      .map(file => {
        const matchingSnippets = file.indexedContent.filter((snippet: string) =>
          snippet.toLowerCase().includes(query)
        );
        return matchingSnippets.length > 0 ? { file, snippets: matchingSnippets } : null;
      })
      .filter(Boolean);

    return { fileMatches, contentMatches };
  };

  const { fileMatches } = getSearchResults();

  const filteredFiles = files.filter(file => {
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => file.tags.includes(tag));
    const matchesSearch = !searchQuery || fileMatches.includes(file);
    return matchesTags && matchesSearch;
  });

  const filteredAITags = allTags.filter(tag => 
    tag.toLowerCase().includes(aiTagSearch.toLowerCase())
  );

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const toggleAllFiles = () => {
    if (selectedFiles.length === filteredFiles.filter(f => f.status === 'ready').length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.filter(f => f.status === 'ready').map(f => f.id));
    }
  };

  const openAI = (contextType: string, contextValue: string | null = null) => {
    setAiContext(contextType === 'tag' ? (contextValue || 'all') : contextType);
    setShowAIPanel(true);
    
    let contextMessage = '';
    if (contextType === 'all') {
      contextMessage = `Ready to answer questions about all ${files.filter(f => f.status === 'ready').length} documents in your knowledge base.`;
    } else if (contextType === 'selected') {
      contextMessage = `Ready to answer questions about ${selectedFiles.length} selected documents.`;
    } else if (contextType === 'tag') {
      const count = files.filter(f => f.tags.includes(contextValue || '') && f.status === 'ready').length;
      contextMessage = `Ready to answer questions about ${count} documents tagged with "${contextValue}".`;
    }

    setAiMessages([
      {
        role: 'assistant',
        content: contextMessage
      }
    ]);
  };

  const getContextLabel = () => {
    if (aiContext === 'all') return `All documents (${files.filter(f => f.status === 'ready').length})`;
    if (aiContext === 'selected') return `Selected documents (${selectedFiles.length})`;
    const count = files.filter(f => f.tags.includes(aiContext) && f.status === 'ready').length;
    return `${aiContext} (${count} docs)`;
  };

  const sendAIMessage = async () => {
    if (!aiInput.trim()) return;

    const userMessage = aiInput.trim();
    setAiInput('');
    
    setAiMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch(`/api/thesis-docs/query?query=${encodeURIComponent(userMessage)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.user?.customClaims?.token ?? ""}`
        },
      });

      const result = await response.json();

      if (result.success) {
        setAiMessages(prev => [...prev, {
          role: 'assistant',
          content: result.result,
          sources: ['Document Knowledge Base']
        }]);
      } else {
        throw new Error(result.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error querying AI:', error);
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your question. Please try again.'
      }]);
    }
  };

  // Handle file upload
  const handleFiles = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);

    try {
      toast({
        title: 'Upload started',
        description: file.name
      });

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const metaData = {
          ts: Date.now(),
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          rawSize: file.size,
          uploadedBy: user.user?.displayName || 'You',
        };

        const response = await fetch('/api/thesis-docs/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user.user?.customClaims?.token ?? ""}`
          },
          body: JSON.stringify({ pdfFile: base64Data, metaData }),
        });

        const result = await response.json();

        if (!response.ok || result.error) {
          throw new Error(result.error || 'Failed to upload file');
        }

        toast({
          title: 'File uploaded successfully',
          description: 'Generating smart tags...'
        });

        // Wait a bit for RAG indexing to complete
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate tags for the uploaded file
        await generateTagsForFile(result.url, file.name);
        
        // Refresh documents list
        await fetchDocs();
      };
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        variant: "destructive",
        title: 'Upload failed',
        description: error.message
      });
    } finally {
      setIsUploading(false);
    }
  }, [user, toast, fetchDocs]);

  // Generate tags for a file using mc-loop-2
  const generateTagsForFile = async (fileUrl: string, fileName: string) => {
    try {
      console.log('Generating tags for:', fileUrl);
      
      const response = await fetch('/api/mission-control/generate-tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.user?.customClaims?.token ?? ""}`
        },
        body: JSON.stringify({ fileUrl, fileName }),
      });

      const result = await response.json();
      console.log('Tag generation result:', result);

      if (result.success) {
        toast({
          title: 'Tags generated',
          description: `Generated ${result.tags?.length || 0} tags for the document`
        });
      } else {
        console.error('Tag generation failed:', result.error);
      }
    } catch (error) {
      console.error('Error generating tags:', error);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFiles,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
    disabled: isUploading
  });

  const deleteDocument = async (docUrl: string) => {
    try {
      const response = await fetch('/api/thesis-docs/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.user?.customClaims?.token ?? ""}`
        },
        body: JSON.stringify({ docUrl })
      });
      
      const json = await response.json();
      if (json.success) {
        toast({
          title: 'Document removed',
          description: 'Document removed from knowledge base',
        });
        fetchDocs();
      } else {
        throw new Error(json.error);
      }
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Unable to delete",
        description: e.message
      });
    }
  };

  return (
    <>
      <PartnerHeader
        title="Mission Control"
        subtitle="Search, organize, and interact with your knowledge base using AI"
      />

      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          {/* Search Bar and Actions */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents by name, content, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-5 py-3 rounded-lg font-medium transition-all flex items-center gap-2 border-2 ${
                showFilters || selectedTags.length > 0
                  ? 'border-gray-900 bg-white text-gray-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
            
            <button
              onClick={() => openAI('all')}
              className="px-5 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:border-gray-300 transition-all flex items-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Ask AI
            </button>
            
            <button
              {...getRootProps()}
              disabled={isUploading}
              className="px-5 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <input {...getInputProps()} />
              <Upload className="w-5 h-5" />
              Upload
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mb-6 bg-white rounded-lg border-2 border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">Filter by Tags</h4>
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.length === 0 ? (
                  <p className="text-sm text-gray-500">No tags available yet. Upload documents to generate tags.</p>
                ) : (
                  allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTags(prev =>
                          prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        selectedTags.includes(tag)
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="mb-6 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900">{readyCount}</span>
              <span className="text-gray-600">Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-gray-900">{processingCount}</span>
              <span className="text-gray-600">Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">{aiSearchableCount}</span>
              <span className="text-gray-600">AI Searchable</span>
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="flex items-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <div className="w-10 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={selectedFiles.length === filteredFiles.filter(f => f.status === 'ready').length && filteredFiles.length > 0}
                    onChange={toggleAllFiles}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                </div>
                <div className="flex-1 min-w-0">Name</div>
                <div className="w-48">Status</div>
                <div className="w-40">Uploaded By</div>
                <div className="w-32">Size</div>
                <div className="w-32">Date</div>
                <div className="w-24"></div>
              </div>
            </div>

            {/* Documents */}
            <div className="divide-y divide-gray-100">
              {filteredFiles.map(file => (
                <div key={file.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    {/* Checkbox */}
                    <div className="w-10 flex-shrink-0">
                      {file.status === 'ready' && (
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      )}
                    </div>

                    {/* Name & Icon & Tags */}
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      {getFileIcon(file.type)}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{file.name}</p>
                        {file.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {file.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="w-48">
                      {file.status === 'processing' || file.status === 'uploading' ? (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-600 animate-spin" />
                          <span className="text-sm text-yellow-600 font-medium">
                            {file.progress ? `${file.progress}%` : 'Processing...'}
                          </span>
                          {file.progress && (
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                              <div 
                                className="h-full bg-yellow-500 transition-all" 
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-600 font-medium">Ready</span>
                        </div>
                      )}
                    </div>

                    {/* Uploaded By */}
                    <div className="w-40 text-sm text-gray-600 truncate">
                      {file.uploadedBy}
                    </div>

                    {/* Size */}
                    <div className="w-32 text-sm text-gray-600">
                      {file.size}
                    </div>

                    {/* Date */}
                    <div className="w-32 text-sm text-gray-600">
                      {file.uploadDate}
                    </div>

                    {/* Actions */}
                    <div className="w-24 flex items-center justify-end gap-1">
                      {file.status === 'ready' && (
                        <button
                          onClick={() => {
                            setSelectedFiles([file.id]);
                            openAI('selected');
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Ask AI about this document"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => window.open(file.url, '_blank')}
                        className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteDocument(file.url)}
                        className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredFiles.length === 0 && (
              <div className="py-16 text-center">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="font-medium text-gray-800 mb-1">No documents found</h3>
                <p className="text-sm text-gray-600">
                  {searchQuery || selectedTags.length > 0 
                    ? 'Try adjusting your filters'
                    : 'Upload your first document to get started'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Panel */}
      {showAIPanel && (
        <div className="fixed right-0 top-0 w-[500px] h-full bg-white border-l-2 border-gray-200 shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="px-6 py-4 border-b-2 border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Ask AI Assistant
              </h3>
            </div>
            <button 
              onClick={() => setShowAIPanel(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Context Selector */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <label className="text-xs font-medium text-gray-700 block mb-2 uppercase tracking-wide">
              Ask about
            </label>
            
            {allTags.length > 10 && (
              <div className="relative mb-2">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={aiTagSearch}
                  onChange={(e) => setAiTagSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="relative">
              <select
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white pr-8"
              >
                <option value="all">All documents ({files.filter(f => f.status === 'ready').length})</option>
                {selectedFiles.length > 0 && (
                  <option value="selected">Selected documents ({selectedFiles.length})</option>
                )}
                {filteredAITags.length > 0 && (
                  <optgroup label="Filter by Tag">
                    {filteredAITags.map(tag => {
                      const count = files.filter(f => f.tags.includes(tag) && f.status === 'ready').length;
                      return (
                        <option key={tag} value={tag}>{tag} ({count} docs)</option>
                      );
                    })}
                  </optgroup>
                )}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Active Context Info */}
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
            <div className="flex items-start gap-2 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-blue-900">
                <span className="font-medium">Active context:</span> {getContextLabel()}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {aiMessages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-800 mb-2">Ready to help</h4>
                <p className="text-sm text-gray-600 max-w-xs mx-auto">
                  Search documents by content or ask any question
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {aiMessages.map((msg, idx) => (
                  <div key={idx}>
                    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-lg p-4 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-50 text-gray-900 border-2 border-gray-200'
                      }`}>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">AI Assistant</span>
                          </div>
                        )}
                        {msg.role === 'user' ? (
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <FormattedMessage content={msg.content} />
                        )}
                      </div>
                    </div>
                    {msg.sources && (
                      <div className="mt-2 text-xs text-gray-500 ml-2 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span className="font-medium">Sources:</span> {msg.sources.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t-2 border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendAIMessage()}
                placeholder="Ask a question..."
                className="flex-1 px-4 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendAIMessage}
                disabled={!aiInput.trim()}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Currently asking about: <span className="font-medium">{getContextLabel()}</span>
            </p>
          </div>
        </div>
      )}

      {/* Upload Loading Overlay */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex items-center gap-4 mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <div>
                <h3 className="font-semibold text-gray-900">Uploading document...</h3>
                <p className="text-sm text-gray-600">Please wait while we process your file</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Uploading file</span>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Extracting content</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>Generating smart tags</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}