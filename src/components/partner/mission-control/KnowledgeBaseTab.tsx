"use client";

import React, { useState, useCallback } from 'react';
import { Upload, FileText, FileSearch, CheckCircle, Database, Eye, Loader2 as Loader, Sparkles, BookOpen, X, AlertCircle, TrendingUp } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

interface Document {
  id: number;
  name: string;
  size: string;
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
}

export default function KnowledgeBaseTab() {
  const [documents, setDocuments] = useState<Document[]>([
    { 
      id: 1, 
      name: 'Q3 2025 Market Analysis.pdf', 
      size: '2.4 MB', 
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
      status: 'processing',
      category: 'Compliance',
      categoryIcon: '⚖️',
      uploadedAt: 'Just now',
      chunks: 0,
      timesReferenced: 0,
      processingProgress: 65
    },
  ]);

  const [uploadQueue, setUploadQueue] = useState<number>(0);

  const metrics = {
    totalChunks: documents.reduce((sum, doc) => sum + doc.chunks, 0),
  };

  // Simulate file upload with progress
  const simulateUpload = (docId: number, fileName: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setDocuments(prev => prev.map(doc => 
          doc.id === docId 
            ? { ...doc, status: 'processing', uploadProgress: 100, processingProgress: 0 } 
            : doc
        ));
        toast.success(`Upload complete: ${fileName}`, {
          description: 'Now processing document...'
        });
        simulateProcessing(docId, fileName);
      } else {
        setDocuments(prev => prev.map(doc => 
          doc.id === docId ? { ...doc, uploadProgress: Math.floor(progress) } : doc
        ));
      }
    }, 300);
  };

  // Simulate document processing with chunking progress
  const simulateProcessing = (docId: number, fileName: string) => {
    let progress = 0;
    let chunks = 0;
    const totalChunks = Math.floor(Math.random() * 30) + 20;
    
    const interval = setInterval(() => {
      progress += Math.random() * 12 + 3;
      chunks = Math.floor((progress / 100) * totalChunks);
      
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
                uploadedAt: 'Just now'
              } 
            : doc
        ));
        setUploadQueue(prev => prev - 1);
        toast.success(`Document ready: ${fileName}`, {
          description: `Created ${chunks} knowledge chunks`
        });
      } else {
        setDocuments(prev => prev.map(doc => 
          doc.id === docId 
            ? { ...doc, processingProgress: Math.floor(progress), chunks } 
            : doc
        ));
      }
    }, 400);
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
          description: error
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

      // Show success toast for starting uploads
      if (validFiles.length === 1) {
        toast.success('Upload started', {
          description: `Processing ${validFiles[0].name}`
        });
      } else {
        toast.success('Uploads started', {
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
        description: `${doc.name} has been removed from your knowledge base`
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
    toast.info('Retrying upload', {
      description: doc.name
    });
    simulateUpload(docId, doc.name);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Database className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Train Your AI Knowledge Base</h2>
            <p className="text-gray-600">Upload documents to teach AI your expertise. The more you upload, the better AI understands your approach and methodology.</p>
          </div>
        </div>

        <div 
          {...getRootProps()} 
          className={`
            border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
            ${isDragActive && !isDragReject ? 'border-blue-500 bg-blue-50 scale-[1.02]' : ''}
            ${isDragReject ? 'border-red-500 bg-red-50' : ''}
            ${!isDragActive ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50/50' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className={`w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform shadow-lg ${isDragActive ? 'scale-110' : ''}`}>
            <Upload className="w-10 h-10 text-white" />
          </div>
          {isDragReject ? (
            <>
              <h3 className="text-xl font-bold text-red-600 mb-2">Invalid file type</h3>
              <p className="text-red-600">Please upload supported file formats only</p>
            </>
          ) : isDragActive ? (
            <>
              <h3 className="text-xl font-bold text-blue-600 mb-2">Drop files here</h3>
              <p className="text-blue-600">Release to start uploading</p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Drop files here or click to upload</h3>
              <p className="text-gray-600 mb-6">AI will automatically process and learn from your documents</p>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-medium text-lg"
              >
                <Upload className="w-5 h-5" />
                Select Files
              </button>
              <p className="text-sm text-gray-500 mt-4">PDF, Word, Excel, PowerPoint, Text • Max 50MB per file</p>
            </>
          )}
        </div>

        {uploadQueue > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Loader className="w-5 h-5 text-blue-600 animate-spin" />
              <div className="flex-1">
                <p className="font-medium text-blue-900">Processing {uploadQueue} document{uploadQueue > 1 ? 's' : ''}</p>
                <p className="text-sm text-blue-700">This may take a few moments...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          What Makes Great Training Data?
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Best Practices
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Clear, well-structured documents</li>
              <li>• Your actual methodologies and frameworks</li>
              <li>• Recent and up-to-date content</li>
              <li>• Specific examples and case studies</li>
            </ul>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Document Types
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>📊 Research reports & market analysis</li>
              <li>💼 Investment strategies & guidelines</li>
              <li>⚖️ Compliance & regulatory docs</li>
              <li>❓ Client FAQs & common scenarios</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Your Knowledge Base</h3>
              <p className="text-sm text-gray-600">{documents.length} documents • {metrics.totalChunks} knowledge chunks</p>
            </div>
            {uploadQueue > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                <TrendingUp className="w-4 h-4" />
                {uploadQueue} in progress
              </div>
            )}
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {documents.map(doc => (
            <div key={doc.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{doc.name}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{doc.size}</span>
                        <span>•</span>
                        <span>{doc.uploadedAt}</span>
                        {doc.status === 'processed' && (
                          <>
                            <span>•</span>
                            <span>{doc.chunks} chunks</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.status === 'uploading' && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm min-w-[140px]">
                          <Loader className="w-4 h-4 animate-spin" />
                          Uploading {doc.uploadProgress}%
                        </div>
                      )}
                      {doc.status === 'processing' && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm min-w-[140px]">
                          <Loader className="w-4 h-4 animate-spin" />
                          Processing {doc.processingProgress}%
                        </div>
                      )}
                      {doc.status === 'processed' && (
                        <>
                          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Active
                          </div>
                          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <FileSearch className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {doc.status === 'error' && (
                        <>
                          <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                            <AlertCircle className="w-4 h-4" />
                            Failed
                          </div>
                          <button 
                            onClick={() => retryUpload(doc.id)}
                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            Retry
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => removeDocument(doc.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Upload Progress Bar */}
                  {doc.status === 'uploading' && doc.uploadProgress !== undefined && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${doc.uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Processing Progress */}
                  {doc.status === 'processing' && (
                    <div className="mt-3 space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${doc.processingProgress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Analyzing document structure...</span>
                        <span>{doc.chunks} chunks created</span>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {doc.status === 'error' && doc.error && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{doc.error}</p>
                    </div>
                  )}

                  {/* Document Stats */}
                  {doc.status === 'processed' && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{doc.categoryIcon}</span>
                            <div>
                              <div className="font-medium text-gray-900">{doc.category}</div>
                              <div className="text-xs text-gray-500">Category</div>
                            </div>
                          </div>
                          <div className="h-8 w-px bg-gray-300"></div>
                          <div>
                            <div className="font-medium text-gray-900">{doc.timesReferenced}</div>
                            <div className="text-xs text-gray-500">References</div>
                          </div>
                          <div className="h-8 w-px bg-gray-300"></div>
                          <div>
                            <div className="font-medium text-gray-900">{doc.lastUsed || 'Not yet'}</div>
                            <div className="text-xs text-gray-500">Last Used</div>
                          </div>
                        </div>
                        <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                          <Eye className="w-4 h-4" />
                          View Usage
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}