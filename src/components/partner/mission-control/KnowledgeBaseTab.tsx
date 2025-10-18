
"use client";

import React, { useState, useCallback } from 'react';
import { Upload, FileText, FileSearch, CheckCircle, Database, Eye, Loader2 as Loader, Sparkles, BookOpen, X, AlertCircle, TrendingUp, Download, Trash2, RefreshCw, Info, Zap, Brain, FileCheck } from 'lucide-react';
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
      case 'extracting': return 'Extracting text from document';
      case 'chunking': return 'Breaking into knowledge chunks';
      case 'embedding': return 'Creating AI embeddings';
      case 'indexing': return 'Indexing for fast retrieval';
      default: return 'Processing document';
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
      progress += Math.random() * 8 + 4; // Smoother progress increments
      
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
      
      // Update stage based on progress
      if (progress > 25 && currentStageIndex === 0) currentStageIndex = 1;
      if (progress > 50 && currentStageIndex === 1) currentStageIndex = 2;
      if (progress > 75 && currentStageIndex === 2) currentStageIndex = 3;
      
      // Update chunk count during chunking stage
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
        toast.success(`✨ Knowledge base updated`, {
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
    const maxSize = 50 * 1024 * 1024; // 50MB
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

    // Show error toasts for invalid files
    if (errors.length > 0) {
      errors.forEach(({ file, error }) => {
        toast.error(`Cannot upload ${file}`, {
          description: error,
          duration: 4000
        });
      });
    }

    // Process valid files
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

      // Show success toast
      if (validFiles.length === 1) {
        toast.success('🚀 Upload started', {
          description: validFiles[0].name
        });
      } else {
        toast.success('🚀 Uploads started', {
          description: `Processing ${validFiles.length} documents`
        });
      }

      // Start upload simulation for each file
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
    toast.info('🔄 Retrying upload', {
      description: doc.name
    });
    simulateUpload(docId, doc.name);
  };

  const downloadDocument = (doc: Document) => {
    toast.success('Download started', {
      description: doc.name
    });
    // Implement actual download logic here
  };
  
  return (
    <div className="space-y-6">
      {/* Header with Live Metrics */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
              <Database className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">AI Knowledge Base</h2>
              <p className="text-blue-100">Train AI with your documents for smarter, context-aware responses</p>
            </div>
          </div>
        </div>

        {/* Live Metrics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <FileCheck className="w-4 h-4 text-blue-200" />
              <span className="text-sm text-blue-200">Documents</span>
            </div>
            <div className="text-2xl font-bold">{metrics.processedDocs}</div>
            <div className="text-xs text-blue-200 mt-1">Active in knowledge base</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-purple-200" />
              <span className="text-sm text-purple-200">Chunks</span>
            </div>
            <div className="text-2xl font-bold">{metrics.totalChunks}</div>
            <div className="text-xs text-purple-200 mt-1">Knowledge segments</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-pink-200" />
              <span className="text-sm text-pink-200">Storage</span>
            </div>
            <div className="text-2xl font-bold">{formatFileSize(metrics.totalSize)}</div>
            <div className="text-xs text-pink-200 mt-1">Total size</div>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-200" />
              <span className="text-sm text-green-200">Training</span>
            </div>
            <div className="text-2xl font-bold">{metrics.activeTraining}</div>
            <div className="text-xs text-green-200 mt-1">Active processes</div>
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
            relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 cursor-pointer overflow-hidden
            ${isDragActive && !isDragReject ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-xl' : ''}
            ${isDragReject ? 'border-red-500 bg-red-50 scale-[0.98]' : ''}
            ${!isDragActive && !isHovering ? 'border-gray-300' : ''}
            ${!isDragActive && isHovering ? 'border-blue-400 bg-blue-50/50 shadow-lg' : ''}
          `}
        >
          {/* Animated Background Effect */}
          {(isDragActive || isHovering) && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-purple-400/10 animate-pulse" />
          )}
          
          <input {...getInputProps()} />
          
          <div className="relative z-10">
            <div className={`
              w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl 
              flex items-center justify-center mx-auto mb-4 transition-all duration-300 shadow-lg
              ${isDragActive ? 'scale-110 rotate-6' : ''}
              ${isHovering ? 'scale-105' : ''}
            `}>
              <Upload className={`w-10 h-10 text-white transition-transform ${isDragActive ? 'animate-bounce' : ''}`} />
            </div>
            
            {isDragReject ? (
              <>
                <h3 className="text-xl font-bold text-red-600 mb-2">⚠️ Invalid file type</h3>
                <p className="text-red-600">Please upload supported file formats only</p>
              </>
            ) : isDragActive ? (
              <>
                <h3 className="text-xl font-bold text-blue-600 mb-2">✨ Drop files here</h3>
                <p className="text-blue-600">Release to start training AI</p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Drop files here or click to upload
                </h3>
                <p className="text-gray-600 mb-6">
                  AI will automatically extract knowledge and create searchable chunks
                </p>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-medium text-lg hover:shadow-xl hover:scale-105"
                >
                  <Upload className="w-5 h-5" />
                  Select Files
                </button>
                <p className="text-sm text-gray-500 mt-4 flex items-center justify-center gap-2">
                  <Info className="w-4 h-4" />
                  PDF, Word, Excel, PowerPoint, Text • Max 50MB per file
                </p>
              </>
            )}
          </div>
        </div>

        {/* Active Upload Queue */}
        {uploadQueue > 0 && (
          <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                <div className="absolute inset-0 w-6 h-6 border-2 border-blue-200 rounded-full animate-ping" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-blue-900">
                  Training AI with {uploadQueue} document{uploadQueue > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-blue-700">Processing and creating knowledge chunks...</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium shadow-md">
                <TrendingUp className="w-4 h-4" />
                {uploadQueue} active
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Best Practices Guide */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          What Makes Great Training Data?
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Best Practices
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>Clear, well-structured documents with headers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>Your actual methodologies and frameworks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>Recent and up-to-date content (last 12 months)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">•</span>
                <span>Specific examples and real case studies</span>
              </li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Recommended Document Types
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
                <span>Compliance & regulatory documents</span>
              </li>
              <li className="flex items-start gap-2">
                <span>❓</span>
                <span>Client FAQs & common scenarios</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Your Knowledge Base</h3>
              <p className="text-sm text-gray-600">
                {documents.length} document{documents.length !== 1 ? 's' : ''} • {metrics.totalChunks} knowledge chunks • {formatFileSize(metrics.totalSize)}
              </p>
            </div>
            {uploadQueue > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-md animate-pulse">
                <Loader className="w-4 h-4 animate-spin" />
                {uploadQueue} processing
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
                  p-6 transition-all duration-200 cursor-pointer
                  ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50'}
                `}
                onClick={() => setSelectedDocId(isSelected ? null : doc.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`
                    w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-all
                    ${doc.status === 'processed' ? 'bg-green-100' : 'bg-blue-100'}
                    ${isSelected ? 'scale-110 shadow-md' : ''}
                  `}>
                    {doc.status === 'processed' ? (
                      <FileCheck className="w-6 h-6 text-green-600" />
                    ) : (
                      <FileText className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                          {doc.name}
                          {doc.status === 'processed' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Ready
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span>{doc.uploadedAt}</span>
                          {doc.status === 'processed' && (
                            <>
                              <span>•</span>
                              <span className="font-medium text-blue-600">{doc.chunks} chunks</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Status Badges */}
                        {doc.status === 'uploading' && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium min-w-[140px]">
                            <Loader className="w-4 h-4 animate-spin" />
                            Uploading {doc.uploadProgress}%
                          </div>
                        )}
                        
                        {doc.status === 'processing' && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium min-w-[140px]">
                            <ProcessingIcon className="w-4 h-4 animate-spin" />
                            {doc.processingProgress}%
                          </div>
                        )}
                        
                        {doc.status === 'error' && (
                          <>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
                              <AlertCircle className="w-4 h-4" />
                              Failed
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                retryUpload(doc.id);
                              }}
                              className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {/* Action Buttons for Processed Docs */}
                        {doc.status === 'processed' && (
                          <>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadDocument(doc);
                              }}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Download document"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                // View usage analytics
                                toast.info('Usage analytics', {
                                  description: `${doc.name} has been referenced ${doc.timesReferenced} times`
                                });
                              }}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View usage"
                            >
                              <FileSearch className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeDocument(doc.id);
                          }}
                          className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                          title="Remove document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Upload Progress Bar */}
                    {doc.status === 'uploading' && doc.uploadProgress !== undefined && (
                      <div className="mt-3 space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-600 to-blue-500 h-2.5 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                            style={{ width: `${doc.uploadProgress}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-blue-700 font-medium">Uploading to cloud...</span>
                          <span className="text-gray-500">{doc.uploadProgress}%</span>
                        </div>
                      </div>
                    )}

                    {/* Processing Progress with Stages */}
                    {doc.status === 'processing' && (
                      <div className="mt-3 space-y-3">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 h-2.5 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                            style={{ width: `${doc.processingProgress}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" 
                                 style={{ animationDuration: '2s' }} />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ProcessingIcon className="w-4 h-4 text-purple-600 animate-pulse" />
                            <span className="text-xs font-medium text-purple-700">
                              {getProcessingStageText(doc.processingStage)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            {doc.chunks > 0 && (
                              <span className="text-purple-700 font-medium animate-pulse">
                                {doc.chunks} chunks created
                              </span>
                            )}
                            <span className="text-gray-500">{doc.processingProgress}%</span>
                          </div>
                        </div>

                        {/* Processing Stage Indicators */}
                        <div className="grid grid-cols-4 gap-2">
                          {['extracting', 'chunking', 'embedding', 'indexing'].map((stage, index) => {
                            const stageProgress = doc.processingProgress || 0;
                            const stageThreshold = (index + 1) * 25;
                            const isActive = doc.processingStage === stage;
                            const isComplete = stageProgress >= stageThreshold;
                            
                            return (
                              <div 
                                key={stage}
                                className={`
                                  flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all
                                  ${isActive ? 'bg-purple-100 text-purple-700 font-medium scale-105 shadow-sm' : ''}
                                  ${isComplete && !isActive ? 'bg-green-100 text-green-700' : ''}
                                  ${!isActive && !isComplete ? 'bg-gray-100 text-gray-400' : ''}
                                `}
                              >
                                {isComplete ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : isActive ? (
                                  <Loader className="w-3 h-3 animate-spin" />
                                ) : (
                                  <div className="w-3 h-3 rounded-full border-2 border-current" />
                                )}
                                <span className="capitalize">{stage}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {doc.status === 'error' && doc.error && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-shake">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-red-900">Upload failed</p>
                          <p className="text-sm text-red-700">{doc.error}</p>
                        </div>
                      </div>
                    )}

                    {/* Document Stats - Expanded View */}
                    {doc.status === 'processed' && isSelected && (
                      <div className="mt-4 p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-gray-200 animate-fadeIn">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{doc.categoryIcon}</span>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{doc.category}</div>
                              <div className="text-xs text-gray-500">Category</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Zap className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{doc.chunks}</div>
                              <div className="text-xs text-gray-500">Chunks</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Eye className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{doc.timesReferenced}</div>
                              <div className="text-xs text-gray-500">References</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Clock className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{doc.lastUsed || 'Never'}</div>
                              <div className="text-xs text-gray-500">Last Used</div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.success('Viewing document insights', {
                                description: `${doc.name} analytics`
                              });
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            View Insights
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.success('Retraining AI', {
                                description: `Reprocessing ${doc.name}`
                              });
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                          >
                            <Brain className="w-4 h-4" />
                            Retrain
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Collapsed View Quick Stats */}
                    {doc.status === 'processed' && !isSelected && (
                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <span className="text-lg">{doc.categoryIcon}</span>
                          <span>{doc.category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-blue-600" />
                          <span>{doc.chunks} chunks</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-green-600" />
                          <span>{doc.timesReferenced} references</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDocId(doc.id);
                          }}
                          className="ml-auto text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View details →
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
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
              <p className="text-gray-600 mb-4">Upload your first document to start training AI</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
