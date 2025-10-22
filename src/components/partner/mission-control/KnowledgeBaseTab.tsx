
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileText, FileSearch, CheckCircle, Database, Eye, Loader2 as Loader, Sparkles, BookOpen, X, AlertCircle, TrendingUp, Download, Trash2, RefreshCw, Info, Zap, Brain, FileCheck, Clock } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

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
  const user = useAuth();
  const { toast } = useToast();
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

  const [isUploading, setIsUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<number>(0);
  const [isHovering, setIsHovering] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);

  const metrics = {
    totalChunks: documents.reduce((sum, doc) => sum + doc.chunks, 0),
    totalSize: documents.reduce((sum, doc) => sum + doc.rawSize, 0),
    processedDocs: documents.filter(doc => doc.status === 'processed').length,
    activeTraining: documents.filter(doc => doc.status === 'uploading' || doc.status === 'processing').length
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

  const [ragInProcess, setRagInProgress] = useState(false);
  const initiateDocumentRag = useCallback(async () => {
    try {
      setRagInProgress(true);

      const response = await fetch('/api/thesis-docs/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.user?.customClaims?.token ?? ""}`
        },
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to upload image.');
      }

      toast({
        variant: "default",
        title: 'RAG Complete',
        description: 'Rag is complete. You can now query'
      });

    } catch (e) {
      console.error("Error with RAG", e);
      toast({
        variant: "destructive",
        title: "Cannot RAG",
        description: `${e}`
      });
    } finally {
      setRagInProgress(false);
    }
  }, [])

  const [actualDocuments, setactualDocuments] = useState<{ url: string; name?: string }[]>([]);
  const fetchDocs = useCallback(async () => {
    const response = await fetch('/api/thesis-docs/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.user?.customClaims?.token ?? ""}`
      },
    })

    const json = await response.json();
    setactualDocuments(json.data ?? []);
  }, []);

  // fetch uploaded docs data on initial load
  useEffect(() => { fetchDocs() }, [])

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
        toast({
          variant: "destructive",
          title: `Cannot upload ${file}`,
          description: error,
          duration: 4000
        });
      });
    }

    if (validFiles.length > 0) {
      try {
        toast({
          title: 'Upload started',
          description: validFiles[0].name
        });
        const file = validFiles[0];
        const { category, icon } = categorizeDocument(file.name);
        const metaData = {
          ts: Date.now(),
          name: file.name,
          size: formatFileSize(file.size),
          rawSize: file.size,
          category,
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {

          const base64Data = reader.result as string;

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
            // throw new Error(result.error || 'Failed to upload image.');
            toast({
              variant: "destructive",
              title: "Cannot upload file",
              description: result.error ?? ""
            });
          } else {
            fetchDocs();
            toast({
              title: 'PDF Uploaded',
              description: 'Your pdf is attached and ready to send.'
            });
          }
        };
        const newDoc = {
          id: Date.now(),
          name: file.name,
          size: formatFileSize(file.size),
          rawSize: file.size,
          status: 'uploading' as const,
          category,
          categoryIcon: icon,
          uploadedAt: 'Uploading...',
          chunks: 0,
          timesReferenced: 0,
          uploadProgress: 0,
          file
        }
        setDocuments(prev => [newDoc, ...prev]);
        return newDoc;
      } catch (error: any) {
        console.error("Error uploading image:", error);
        toast({
          variant: "destructive",
          title: "Cannot upload file",
          description: error.message
        });
      } finally {
        setIsUploading(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: handleFiles,
    accept: {
      'application/pdf': ['.pdf'],
      // 'application/msword': ['.doc'],
      // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      // 'application/vnd.ms-excel': ['.xls'],
      // 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      // 'application/vnd.ms-powerpoint': ['.ppt'],
      // 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      // 'text/plain': ['.txt'],
      // 'text/csv': ['.csv']
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
    disabled: isUploading
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const deleteDocument = async (docUrl: string) => {
    try {
      setIsDeleting(true);
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
          description: `${docUrl} removed from knowledge base`,
        })
        fetchDocs();
      } else {
        toast({
          variant: "destructive",
          title: "Unable to delete",
          description: json.error
        });
      }
    } catch (e) {
      console.error("Error deleting file", e);
      toast({
        variant: "destructive",
        title: "Unable to delete",
        description: `${e}`
      });
    } finally {
      setIsDeleting(false);
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
    toast({
      title: 'Retrying upload',
      description: doc.name
    });
  };

  const downloadDocumentFromUrl = (docUrl: string) => {
    window.open(docUrl, '_blank');
    toast({
      title: 'Download started',
      description: docUrl
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
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            onClick={initiateDocumentRag}
          >
            Rag this!
          </button>
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
          {actualDocuments.map((doc, idx) => {
            const isSelected = selectedDocId === doc.id;

            return (
              <div
                key={idx}
                className={`
                  p-5 transition-colors cursor-pointer animate-fadeIn
                  ${isSelected ? 'bg-blue-50/50 border-l-2 border-l-blue-600' : 'hover:bg-gray-50/50'}
                `}
              >
                <div className="flex items-start gap-4">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-green-50
                  `}>
                    <FileCheck className="w-5 h-5 text-green-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">{doc.metaData?.name ?? doc.url}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{doc.metaData.size}</span>
                          <span>•</span>
                          <span>{doc.metaData.uploadedAt ?? "Just now"}</span>
                          <>
                            <span>•</span>
                            <span className="text-blue-600 font-medium">{doc.metaData.chunks ?? 0} chunks</span>
                          </>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Status */}

                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadDocumentFromUrl(doc.url);
                            }}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toast({
                                title: 'Usage analytics',
                                description: `${doc.name} referenced ${doc.timesReferenced ?? "-"} times`
                              });
                            }}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="View usage"
                          >
                            <FileSearch className="w-3.5 h-3.5" />
                          </button>
                        </>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDocument(doc.url);
                          }}
                          className="p-1.5 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isSelected && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{doc.categoryIcon}</span>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{doc.metaData?.category ?? "No category"}</div>
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
                              toast({
                                title: 'Viewing insights',
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
                              toast({
                                title: 'Retraining',
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
                    {!isSelected && (
                      <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <span>{doc.categoryIcon ?? '📊'}</span>
                          <span>{doc.metaData?.category ?? "No Category"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-blue-600" />
                          <span>{doc.metaData?.chunks ?? 0} chunks</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-green-600" />
                          <span>{doc.timesReferenced ?? 10} refs</span>
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
