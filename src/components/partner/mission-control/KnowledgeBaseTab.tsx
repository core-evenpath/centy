
"use client";

import React, { useState, useCallback } from 'react';
import { Upload, FileText, FileSearch, CheckCircle, Database, Eye, Loader2 as Loader, Sparkles, BookOpen, X, AlertCircle, TrendingUp, Download, Trash2, RefreshCw, Info, Zap, Brain, FileCheck, Clock } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

interface Document {
  id: number;
  name: string;
  size: string;
  rawSize: number;
  status: 'uploading' | 'processing' | 'processed' | 'error';
  category: string;
  categoryIcon: string;
  uploadedAt: string;
  chunks: number;
  timesReferenced: number;
  lastUsed?: string;
  uploadProgress?: number;
  processingProgress?: number;
  error?: string;
  file?: File;
  processingStage?: 'extracting' | 'chunking' | 'embedding' | 'indexing';
}

export default function KnowledgeBaseTab() {
  const [documents, setDocuments] = useState<Document[]>([
    { 
      id: 1, 
      name: 'Q3 2025 Market Analysis.pdf', 
      size: '2.4 MB',
      rawSize: 2400000,
      status: 'processed',
      category: 'Market Research',
      categoryIcon: '📊',
      uploadedAt: '2 hours ago',
      chunks: 45,
      timesReferenced: 23,
      lastUsed: '2 mins ago'
    },
    { 
      id: 2, 
      name: 'Portfolio Allocation Strategy.docx', 
      size: '856 KB',
      rawSize: 856000,
      status: 'processed',
      category: 'Investment Strategy',
      categoryIcon: '💼',
      uploadedAt: '3 hours ago',
      chunks: 28,
      timesReferenced: 15,
      lastUsed: '5 mins ago'
    },
    { 
      id: 3, 
      name: 'SEC Compliance Guidelines 2025.pdf', 
      size: '3.1 MB',
      rawSize: 3100000,
      status: 'processing',
      category: 'Compliance',
      categoryIcon: '⚖️',
      uploadedAt: 'Just now',
      chunks: 18,
      timesReferenced: 0,
      processingProgress: 65,
      processingStage: 'chunking'
    },
  ]);

  const [uploadQueue, setUploadQueue] = useState<number>(0);
  const [isHovering, setIsHovering] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);

  const metrics = {
    totalChunks: documents.reduce((sum, doc) => sum + doc.chunks, 0),
    totalSize: documents.reduce((sum, doc) => sum + doc.rawSize, 0),
    processedDocs: documents.filter(doc => doc.status === 'processed').length,
    activeTraining: documents.filter(doc => doc.status === 'uploading' || doc.status === 'processing').length
  };

  const getProcessingStageText = (stage?: string): string => {
    switch(stage) {
      case 'extracting': return 'Extracting text';
      case 'chunking': return 'Creating chunks';
      case 'embedding': return 'Generating embeddings';
      case 'indexing': return 'Indexing content';
      default: return 'Processing';
    }
  };

  const getProcessingStageIcon = (stage?: string) => {
    switch(stage) {
      case 'extracting': return FileText;
      case 'chunking': return Zap;
      case 'embedding': return Brain;
      case 'indexing': return Database;
      default: return Loader;
    }
  };

  // Simulate file upload with realistic progress
  const simulateUpload = (docId: number, fileName: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 8 + 4;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setDocuments(prev => prev.map(doc => 
          doc.id === docId 
            ? { 
                ...doc, 
                status: 'processing', 
                uploadProgress: 100, 
                processingProgress: 0,
                processingStage: 'extracting'
              } 
            : doc
        ));
        toast.success(`Upload complete`, {
          description: `${fileName} - Starting AI processing...`
        });
        simulateProcessing(docId, fileName);
      } else {
        setDocuments(prev => prev.map(doc => 
          doc.id === docId ? { ...doc, uploadProgress: Math.floor(progress) } : doc
        ));
      }
    }, 200);
  };

  // Simulate document processing with detailed stages
  const simulateProcessing = (docId: number, fileName: string) => {
    let progress = 0;
    let chunks = 0;
    const totalChunks = Math.floor(Math.random() * 30) + 20;
    const stages: Array<'extracting' | 'chunking' | 'embedding' | 'indexing'> = ['extracting', 'chunking', 'embedding', 'indexing'];
    let currentStageIndex = 0;
    
    const interval = setInterval(() => {
      progress += Math.random() * 6 + 2;
      
      if (progress > 25 && currentStageIndex === 0) currentStageIndex = 1;
      if (progress > 50 && currentStageIndex === 1) currentStageIndex = 2;
      if (progress > 75 && currentStageIndex === 2) currentStageIndex = 3;
      
      if (currentStageIndex >= 1) {
        chunks = Math.floor(((progress - 25) / 75) * totalChunks);
      }
      
      if (progress >= 100) {
        progress = 100;
        chunks = totalChunks;
        clearInterval(interval);
        setDocuments(prev => prev.map(doc => 
          doc.id === docId 
            ? { 
                ...doc, 
                status: 'processed', 
                processingProgress: 100,
                chunks,
                uploadedAt: 'Just now',
                processingStage: undefined
              } 
            : doc
        ));
        setUploadQueue(prev => prev - 1);
        toast.success(`Knowledge base updated`, {
          description: `${fileName} processed into ${chunks} chunks`
        });
      } else {
        setDocuments(prev => prev.map(doc => 
          doc.id === docId 
            ? { 
                ...doc, 
                processingProgress: Math.floor(progress), 
                chunks,
                processingStage: stages[currentStageIndex]
              } 
            : doc
        ));
      }
    }, 300);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const categorizeDocument = (filename: string): { category: string; icon: string } => {
    const lower = filename.toLowerCase();
    if (lower.includes('market') || lower.includes('analysis') || lower.includes('research')) {
      return { category: 'Market Research', icon: '📊' };
    } else if (lower.includes('portfolio') || lower.includes('investment') || lower.includes('strategy')) {
      return { category: 'Investment Strategy', icon: '💼' };
    } else if (lower.includes('compliance') || lower.includes('sec') || lower.includes('regulatory')) {
      return { category: 'Compliance', icon: '⚖️' };
    } else if (lower.includes('faq') || lower.includes('client') || lower.includes('question')) {
      return { category: 'Client Resources', icon: '❓' };
    }
    return { category: 'General', icon: '📄' };
  };

  const validateFile = (file: File): string | null => {
    const maxSize = 50 * 1024 * 1024;
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv'
    ];

    if (file.size > maxSize) {
      return `File exceeds 50MB limit (${formatFileSize(file.size)})`;
    }

    if (!allowedTypes.includes(file.type)) {
      return `Unsupported file format`;
    }

    return null;
  };

  const handleFiles = useCallback((acceptedFiles: File[]) => {
    const validFiles: File[] = [];
    const errors: { file: string; error: string }[] = [];

    acceptedFiles.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push({ file: file.name, error });
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      errors.forEach(({ file, error }) => {
        toast.error(`Cannot upload ${file}`, {
          description: error,
          duration: 4000
        });
      });
    }

    if (validFiles.length > 0) {
      const newDocs: Document[] = validFiles.map((file, index) => {
        const { category, icon } = categorizeDocument(file.name);
        return {
          id: Date.now() + index,
          name: file.name,
          size: formatFileSize(file.size),
          rawSize: file.size,
          status: 'uploading',
          category,
          categoryIcon: icon,
          uploadedAt: 'Uploading...',
          chunks: 0,
          timesReferenced: 0,
          uploadProgress: 0,
          file
        };
      });

      setDocuments(prev => [...newDocs, ...prev]);
      setUploadQueue(prev => prev + validFiles.length);

      if (validFiles.length === 1) {
        toast.success('Upload started', {
          description: validFiles[0].name
        });
      } else {
        toast.success('Uploads started', {
          description: `Processing ${validFiles.length} documents`
        });
      }

      newDocs.forEach(doc => {
        setTimeout(() => simulateUpload(doc.id, doc.name), 100);
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: handleFiles,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv']
    },
    maxSize: 50 * 1024 * 1024,
    multiple: true
  });

  const removeDocument = (docId: number) => {
    const doc = documents.find(d => d.id === docId);
    setDocuments(prev => prev.filter(d => d.id !== docId));
    if (doc) {
      toast.success('Document removed', {
        description: `${doc.name} removed from knowledge base`,
        action: {
          label: 'Undo',
          onClick: () => {
            setDocuments(prev => [...prev, doc]);
            toast.success('Document restored');
          }
        }
      });
    }
  };

  const retryUpload = (docId: number) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    setDocuments(prev => prev.map(d => 
      d.id === docId 
        ? { ...d, status: 'uploading', uploadProgress: 0, error: undefined }
        : d
    ));
    setUploadQueue(prev => prev + 1);
    toast.info('Retrying upload', {
      description: doc.name
    });
    simulateUpload(docId, doc.name);
  };

  const downloadDocument = (doc: Document) => {
    toast.success('Download started', {
      description: doc.name
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Header with Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Knowledge Base</h2>
              <p className="text-sm text-gray-600">Train AI with your documents for contextual responses</p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Documents</span>
            </div>
            <div className="text-2xl font-semibold text-gray-900">{metrics.processedDocs}</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Chunks</span>
            </div>
            <div className="text-2xl font-semibold text-gray-900">{metrics.totalChunks}</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Storage</span>
            </div>
            <div className="text-2xl font-semibold text-gray-900">{formatFileSize(metrics.totalSize)}</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Training</span>
            </div>
            <div className="text-2xl font-semibold text-gray-900">{metrics.activeTraining}</div>
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div 
          {...getRootProps()} 
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          className={`
            relative border-2 border-dashed rounded-lg p-10 text-center transition-all duration-200 cursor-pointer
            ${isDragActive && !isDragReject ? 'border-blue-400 bg-blue-50/50 scale-105' : ''}
            ${isDragReject ? 'border-red-400 bg-red-50/50' : ''}
            ${!isDragActive && !isHovering ? 'border-gray-300 bg-gray-50/50' : ''}
            ${!isDragActive && isHovering ? 'border-blue-300 bg-blue-50/30' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110">
            <Upload className={`w-8 h-8 text-gray-600 ${isDragActive ? 'scale-110' : ''} transition-transform`} />
          </div>
          
          {isDragReject ? (
            <>
              <h3 className="text-lg font-semibold text-red-600 mb-1">Invalid file type</h3>
              <p className="text-sm text-red-600">Please upload supported formats only</p>
            </>
          ) : isDragActive ? (
            <>
              <h3 className="text-lg font-semibold text-blue-600 mb-1">Drop files here</h3>
              <p className="text-sm text-blue-600">Release to start upload</p>
            </>
          ) : (
            <>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Drop files here or click to browse
              </h3>
              <p className="text-sm text-gray-600 mb-5">
                AI will extract knowledge and create searchable chunks
              </p>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Select Files
              </button>
              <p className="text-xs text-gray-500 mt-4">
                PDF, Word, Excel, PowerPoint, Text • Max 50MB per file
              </p>
            </>
          )}
        </div>

        {/* Active Upload Queue */}
        {uploadQueue > 0 && (
          <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-fadeIn">
            <div className="flex items-center gap-3">
              <Loader className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900">
                  Processing {uploadQueue} document{uploadQueue > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-blue-700">Creating knowledge chunks...</p>
              </div>
              <div className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-medium">
                {uploadQueue}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Best Practices */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gray-600" />
          Best Practices
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Recommendations
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Well-structured documents with clear headers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Your methodologies and frameworks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Recent content (last 12 months)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Specific examples and case studies</span>
              </li>
            </ul>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Document Types
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span>📊</span>
                <span>Research reports & market analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span>💼</span>
                <span>Investment strategies & guidelines</span>
              </li>
              <li className="flex items-start gap-2">
                <span>⚖️</span>
                <span>Compliance documents</span>
              </li>
              <li className="flex items-start gap-2">
                <span>❓</span>
                <span>Client FAQs</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Your Documents</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                {documents.length} document{documents.length !== 1 ? 's' : ''} • {metrics.totalChunks} chunks
              </p>
            </div>
            {uploadQueue > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium">
                <Loader className="w-3.5 h-3.5 animate-spin" />
                {uploadQueue}
              </div>
            )}
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {documents.map(doc => {
            const ProcessingIcon = getProcessingStageIcon(doc.processingStage);
            const isSelected = selectedDocId === doc.id;
            
            return (
              <div 
                key={doc.id} 
                className={`
                  p-5 transition-colors cursor-pointer animate-fadeIn
                  ${isSelected ? 'bg-blue-50/50 border-l-2 border-l-blue-600' : 'hover:bg-gray-50/50'}
                `}
                onClick={() => setSelectedDocId(isSelected ? null : doc.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                    ${doc.status === 'processed' ? 'bg-green-50' : 'bg-blue-50'}
                  `}>
                    {doc.status === 'processed' ? (
                      <FileCheck className="w-5 h-5 text-green-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{doc.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>{doc.uploadedAt}</span>
                          {doc.status === 'processed' && (
                            <>
                              <span>•</span>
                              <span className="text-blue-600 font-medium">{doc.chunks} chunks</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {/* Status */}
                        {doc.status === 'uploading' && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            <Loader className="w-3 h-3 animate-spin" />
                            {doc.uploadProgress}%
                          </div>
                        )}
                        
                        {doc.status === 'processing' && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                            <ProcessingIcon className="w-3 h-3 animate-spin" />
                            {doc.processingProgress}%
                          </div>
                        )}
                        
                        {doc.status === 'error' && (
                          <>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-medium animate-shake">
                              <AlertCircle className="w-3 h-3" />
                              Failed
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                retryUpload(doc.id);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        
                        {doc.status === 'processed' && (
                          <>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadDocument(doc);
                              }}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.info('Usage analytics', {
                                  description: `${doc.name} referenced ${doc.timesReferenced} times`
                                });
                              }}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="View usage"
                            >
                              <FileSearch className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeDocument(doc.id);
                          }}
                          className="p-1.5 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Upload Progress */}
                    {doc.status === 'uploading' && doc.uploadProgress !== undefined && (
                      <div className="mt-3 space-y-1.5">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 relative overflow-hidden"
                            style={{ width: `${doc.uploadProgress}%` }}
                          >
                             <div className="absolute top-0 left-0 h-full w-full bg-white/30 animate-shimmer"></div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600">Uploading...</p>
                      </div>
                    )}

                    {/* Processing Progress */}
                    {doc.status === 'processing' && (
                      <div className="mt-3 space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-purple-600 h-1.5 rounded-full transition-all duration-300 relative overflow-hidden"
                            style={{ width: `${doc.processingProgress}%` }}
                          >
                            <div className="absolute top-0 left-0 h-full w-full bg-white/30 animate-shimmer"></div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <ProcessingIcon className="w-3 h-3" />
                            <span>{getProcessingStageText(doc.processingStage)}</span>
                          </div>
                          {doc.chunks > 0 && (
                            <span className="text-purple-600 font-medium">{doc.chunks} chunks</span>
                          )}
                        </div>

                        {/* Stage Indicators */}
                        <div className="grid grid-cols-4 gap-1.5 pt-1">
                          {['extracting', 'chunking','embedding', 'indexing'].map((stage, index) => {
                            const stageProgress = doc.processingProgress || 0;
                            const stageThreshold = (index + 1) * 25;
                            const isActive = doc.processingStage === stage;
                            const isComplete = stageProgress >= stageThreshold;
                            
                            return (
                              <div 
                                key={stage}
                                className={`
                                  flex items-center gap-1 px-1.5 py-0.5 rounded text-xs transition-all
                                  ${isActive ? 'bg-purple-100 text-purple-700 font-medium' : ''}
                                  ${isComplete && !isActive ? 'bg-green-50 text-green-600' : ''}
                                  ${!isActive && !isComplete ? 'bg-gray-100 text-gray-400' : ''}
                                `}
                              >
                                {isComplete ? (
                                  <CheckCircle className="w-2.5 h-2.5" />
                                ) : isActive ? (
                                  <Loader className="w-2.5 h-2.5 animate-spin" />
                                ) : (
                                  <div className="w-2.5 h-2.5 rounded-full border border-current" />
                                )}
                                <span className="capitalize text-[10px]">{stage}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {doc.status === 'error' && doc.error && (
                      <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded flex items-start gap-2 animate-shake">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-red-900">Upload failed</p>
                          <p className="text-xs text-red-700">{doc.error}</p>
                        </div>
                      </div>
                    )}

                    {/* Expanded Details */}
                    {doc.status === 'processed' && isSelected && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{doc.categoryIcon}</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{doc.category}</div>
                              <div className="text-xs text-gray-500">Category</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                              <Zap className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{doc.chunks}</div>
                              <div className="text-xs text-gray-500">Chunks</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                              <Eye className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{doc.timesReferenced}</div>
                              <div className="text-xs text-gray-500">References</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                              <Clock className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{doc.lastUsed || 'Never'}</div>
                              <div className="text-xs text-gray-500">Last Used</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.success('Viewing insights', {
                                description: `${doc.name} analytics`
                              });
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Insights
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.success('Retraining', {
                                description: `Reprocessing ${doc.name}`
                              });
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                          >
                            <Brain className="w-3.5 h-3.5" />
                            Retrain
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Collapsed Quick Stats */}
                    {doc.status === 'processed' && !isSelected && (
                      <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <span>{doc.categoryIcon}</span>
                          <span>{doc.category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-blue-600" />
                          <span>{doc.chunks} chunks</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-green-600" />
                          <span>{doc.timesReferenced} refs</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocId(doc.id);
                          }}
                          className="ml-auto text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Details →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {documents.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Database className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-1">No documents yet</h3>
              <p className="text-sm text-gray-600">Upload your first document to start training AI</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
