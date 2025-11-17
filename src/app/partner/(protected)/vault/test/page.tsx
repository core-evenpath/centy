'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Upload, 
  RefreshCw, 
  Sparkles, 
  Search, 
  Filter,
  X,
  Grid3x3,
  List,
  AlertCircle,
  Database,
  Brain,
  FileText,
  Trash2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import UploadDialog from '@/components/partner/vault/UploadDialog';
import TrainingDataDialog from '@/components/partner/vault/TrainingDataDialog';
import UploadProgressPanel from '@/components/partner/vault/UploadProgressPanel';
import TestDrawer from '@/components/partner/vault/TestDrawer';
import { useToast } from '@/hooks/use-toast';
import { useUploadProgress } from '@/hooks/use-upload-progress';
import type { VaultFile } from '@/lib/types';
import {
  listVaultFiles,
  deleteVaultFile,
} from '@/actions/vault-actions';

export default function VaultTestPage() {
  const partnerId = 'test-partner';
  const userId = 'test-user';
  
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<VaultFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<VaultFile | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isTrainingDataDialogOpen, setIsTrainingDataDialogOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<VaultFile | null>(null);
  const [isTestDrawerOpen, setIsTestDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateRange: 'all'
  });
  
  const { toast } = useToast();
  const {
    uploads,
    startUpload,
    updateUploadStep,
    completeUpload,
    failUpload,
    clearCompleted,
    clearAll,
  } = useUploadProgress();

  useEffect(() => {
    loadData(true);
  }, []);

  useEffect(() => {
    filterFiles();
  }, [files, searchQuery, filters]);

  useEffect(() => {
    const hasProcessingFiles = files.some(f => f.state === 'PROCESSING');
    if (!hasProcessingFiles) return;

    const pollInterval = setInterval(() => {
      loadData(false);
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [files]);

  useEffect(() => {
    if (uploads.length > 0) {
      setShowUploadProgress(true);
    }
  }, [uploads]);

  const loadData = async (showLoading = true) => {
    if (showLoading) {
      setIsLoading(true);
    }
    
    try {
      const filesResult = await listVaultFiles(partnerId);
      
      if (filesResult.success) {
        setFiles(filesResult.files);
      } else {
        throw new Error('Failed to load files.');
      }
    } catch (error) {
      console.error('Error loading vault data:', error);
      toast({
        title: 'Error loading data',
        description: 'Please refresh the page',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterFiles = () => {
    let filtered = [...files];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        file =>
          file.displayName.toLowerCase().includes(query) ||
          file.mimeType.toLowerCase().includes(query)
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(f => f.state === filters.status.toUpperCase());
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(f => {
        const ext = f.displayName.split('.').pop()?.toLowerCase();
        return ext === filters.type;
      });
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      
      if (filters.dateRange === 'today') {
        cutoff.setHours(0, 0, 0, 0);
      } else if (filters.dateRange === 'week') {
        cutoff.setDate(now.getDate() - 7);
      } else if (filters.dateRange === 'month') {
        cutoff.setDate(now.getDate() - 30);
      }

      filtered = filtered.filter(f => {
        const fileDate = f.createdAt ? new Date(f.createdAt) : new Date(0);
        return fileDate >= cutoff;
      });
    }

    setFilteredFiles(filtered);
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Delete this document?')) return;

    try {
      const result = await deleteVaultFile(partnerId, fileId);
      
      if (result.success) {
        setFiles(prev => prev.filter(f => f.id !== fileId));
        setSelectedFile(null);
        toast({
          title: 'Document deleted',
          description: 'The document has been removed',
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUploadComplete = () => {
    loadData(false);
  };

  const handleEditFile = (file: VaultFile) => {
    setEditingFile(file);
    setIsTrainingDataDialogOpen(true);
  };

  const handleTrainingDialogClose = () => {
    setEditingFile(null);
    setIsTrainingDataDialogOpen(false);
  };

  const handleUploadStart = (id: string, fileName: string) => {
    startUpload(fileName);
  };

  const handleUploadProgress = (id: string, step: number, description: string) => {
    updateUploadStep(id, step, description);
  };

  const handleUploadSuccess = (id: string) => {
    completeUpload(id);
    setTimeout(() => {
      loadData(false);
    }, 1000);
  };

  const handleUploadError = (id: string, error: string) => {
    failUpload(id, error);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleString();
  };

  const activeFileCount = files.filter(f => f.state === 'ACTIVE').length;
  const processingFileCount = files.filter(f => f.state === 'PROCESSING').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Document Vault Test</h1>
            <p className="text-gray-600 text-sm mt-1">Upload and manage your documents with AI-powered RAG</p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setIsUploadDialogOpen(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 h-9"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>

              <Button 
                onClick={() => setIsTrainingDataDialogOpen(true)}
                size="sm"
                variant="outline"
                className="h-9"
              >
                <Brain className="h-4 w-4 mr-2" />
                Add Training Data
              </Button>
              
              <Button 
                variant="outline"
                size="sm"
                onClick={() => loadData(false)}
                disabled={isLoading}
                className="h-9"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              {showFilters && (
                <div className="flex items-center gap-2 ml-4">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="h-9 px-3 rounded-md border border-gray-300 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                  </select>

                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    className="h-9 px-3 rounded-md border border-gray-300 text-sm"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">
                  {files.length} document{files.length !== 1 ? 's' : ''}
                </span>
                {processingFileCount > 0 && (
                  <span className="text-blue-600 font-medium">
                    • {processingFileCount} processing
                  </span>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9 h-9 w-64"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`h-9 ${showFilters ? 'bg-gray-100' : ''}`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>

              <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-50'}`}
                  title="Grid view"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-gray-50'}`}
                  title="List view"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-600 mb-4">Upload your first document to get started</p>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
            {filteredFiles.map((file) => (
              <Card 
                key={file.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedFile(file)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-gray-900">{file.displayName}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <span>{formatFileSize(file.sizeBytes)}</span>
                          <span>•</span>
                          <span className="truncate">{formatDate(file.uploadedAt)}</span>
                        </div>
                        {file.sourceType && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {file.sourceType}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          file.state === 'ACTIVE'
                            ? 'default'
                            : file.state === 'FAILED'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {file.state}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {file.ragMetadata && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
                      {file.ragMetadata.estimatedChunks && (
                        <span>~{file.ragMetadata.estimatedChunks} chunks</span>
                      )}
                      {file.ragMetadata.extractedTextLength > 0 && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{file.ragMetadata.extractedTextLength.toLocaleString()} chars</span>
                        </>
                      )}
                      {file.ragMetadata.processingTimeMs && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{(file.ragMetadata.processingTimeMs / 1000).toFixed(1)}s</span>
                        </>
                      )}
                    </div>
                  )}
                  
                  {file.errorMessage && (
                    <p className="mt-2 text-sm text-red-600">{file.errorMessage}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {activeFileCount > 0 && (
        <button
          onClick={() => setIsTestDrawerOpen(true)}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all px-6 py-3 flex items-center gap-3 group z-40"
        >
          <Sparkles className="h-5 w-5" />
          <span className="font-medium">Test Vault Chat</span>
          <div className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
            {activeFileCount} ready
          </div>
        </button>
      )}

      {showUploadProgress && (
        <UploadProgressPanel
          uploads={uploads}
          onClose={() => setShowUploadProgress(false)}
          onClearCompleted={clearCompleted}
        />
      )}

      <UploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        partnerId={partnerId}
        userId={userId}
        onUploadComplete={handleUploadComplete}
        onUploadStart={handleUploadStart}
        onUploadProgress={handleUploadProgress}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
      />

      <TrainingDataDialog
        isOpen={isTrainingDataDialogOpen}
        onClose={handleTrainingDialogClose}
        partnerId={partnerId}
        userId={userId}
        onUploadComplete={handleUploadComplete}
        existingFile={editingFile}
      />

      <TestDrawer
        isOpen={isTestDrawerOpen}
        onClose={() => setIsTestDrawerOpen(false)}
        partnerId={partnerId}
        userId={userId}
        documentCount={activeFileCount}
      />
    </div>
  );
}