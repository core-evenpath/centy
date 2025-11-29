'use client';

import React, { useState, useEffect } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
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
  CheckCircle,
  Clock,
  TrendingUp,
  Zap,
  BarChart3
} from 'lucide-react';
import VaultSidebar from '@/components/partner/vault/VaultSidebar';
import CleanupButton from '@/components/partner/vault/CleanupButton';
import DocumentGrid from '@/components/partner/vault/DocumentGrid';
import DocumentPreview from '@/components/partner/vault/DocumentPreview';
import UploadDialog from '@/components/partner/vault/UploadDialog';
import TestDrawer from '@/components/partner/vault/TestDrawer';
import TrainingDataDialog from '@/components/partner/vault/TrainingDataDialog';
import UploadProgressPanel from '@/components/partner/vault/UploadProgressPanel';
import { useToast } from '@/hooks/use-toast';
import { useUploadProgress } from '@/hooks/use-upload-progress';
import type { VaultFile } from '@/lib/types';
import {
  listVaultFiles,
  deleteVaultFile,
} from '@/actions/vault-actions';

export default function VaultPage() {
  const { user, currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
  const partnerId = currentWorkspace?.partnerId;

  const [files, setFiles] = useState<VaultFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<VaultFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<VaultFile | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isTrainingDataDialogOpen, setIsTrainingDataDialogOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<VaultFile | null>(null);
  const [isTestDrawerOpen, setIsTestDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
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
    if (partnerId && user) {
      loadData(true);
    } else if (!authLoading) {
      setIsLoading(false);
      if (!partnerId) {
        setLoadError('Could not identify your workspace.');
      }
    }
  }, [partnerId, user, authLoading]);

  useEffect(() => {
    filterFiles();
  }, [files, searchQuery, filters]);

  useEffect(() => {
    if (!partnerId) return;

    const hasProcessingFiles = files.some(f => f.state === 'PROCESSING');
    if (!hasProcessingFiles) return;

    const pollInterval = setInterval(() => {
      loadData(false);
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [partnerId, files]);

  useEffect(() => {
    if (uploads.length > 0) {
      setShowUploadProgress(true);
    }
  }, [uploads]);

  const loadData = async (showLoading = true) => {
    if (!partnerId) {
      setLoadError('Partner ID not found.');
      setIsLoading(false);
      return;
    }

    if (showLoading) {
      setIsLoading(true);
    }
    setLoadError(null);

    try {
      const filesResult = await listVaultFiles(partnerId);

      if (filesResult.success) {
        setFiles(filesResult.files);
      } else {
        throw new Error('Failed to load files.');
      }
    } catch (error) {
      console.error('Error loading vault data:', error);
      setLoadError('Failed to load vault data. Please try again.');
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
    if (!partnerId) return;

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

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading vault...</p>
        </div>
      </div>
    );
  }

  if (!user || !partnerId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center bg-white border border-slate-200 rounded-2xl p-12 shadow-sm max-w-md">
          <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h3>
          <p className="text-slate-600">{loadError || 'Please log in to access your vault.'}</p>
        </div>
      </div>
    );
  }

  const activeFileCount = files.filter(f => f.state === 'ACTIVE').length;
  const processingFileCount = files.filter(f => f.state === 'PROCESSING').length;
  const totalEmbeddings = files
    .filter(f => f.state === 'ACTIVE' && f.ragMetadata?.actualEmbeddings)
    .reduce((sum, f) => sum + (f.ragMetadata?.actualEmbeddings || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header Section */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 rounded-xl p-3 shadow-lg shadow-blue-600/20">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Document Vault</h1>
                <p className="text-slate-500 text-sm">Manage your AI knowledge base</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsTestDrawerOpen(true)}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
              >
                <Sparkles className="h-4 w-4 mr-2 text-blue-600" />
                Vault Chat
              </Button>
              <Button
                onClick={() => setIsTrainingDataDialogOpen(true)}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
              >
                <Brain className="h-4 w-4 mr-2 text-purple-600" />
                Training Data
              </Button>
              <Button
                onClick={() => setIsUploadDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </div>

          {/* Stats & Controls */}
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <FileText className="h-4 w-4 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Documents</span>
                  <span className="text-lg font-bold text-slate-900 leading-none">{files.length}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Active</span>
                  <span className="text-lg font-bold text-slate-900 leading-none">{activeFileCount}</span>
                </div>
              </div>

              {processingFileCount > 0 && (
                <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 rounded-lg border border-amber-100">
                  <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
                  <div className="flex flex-col">
                    <span className="text-xs text-amber-600 font-medium uppercase tracking-wider">Processing</span>
                    <span className="text-lg font-bold text-amber-700 leading-none">{processingFileCount}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <Zap className="h-4 w-4 text-purple-500" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Embeddings</span>
                  <span className="text-lg font-bold text-slate-900 leading-none">{totalEmbeddings.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                />
              </div>

              <div className="h-8 w-px bg-slate-200 mx-1"></div>

              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => loadData(false)}
                className="h-10 w-10 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={`h-10 w-10 ${showFilters ? 'text-blue-600 bg-blue-50' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex">
        {showFilters && (
          <div className="w-64 flex-shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-180px)]">
            <VaultSidebar
              filters={filters}
              onFiltersChange={setFilters}
              fileCount={files.length}
            />
          </div>
        )}

        <div className="flex-1 p-8">
          <DocumentGrid
            files={filteredFiles}
            viewMode={viewMode}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            onDeleteFile={handleDeleteFile}
            isLoading={false}
          />
        </div>
      </main>

      {selectedFile && (
        <DocumentPreview
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onDelete={() => handleDeleteFile(selectedFile.id!)}
          onEdit={handleEditFile}
        />
      )}

      {/* Upload Progress Panel */}
      {showUploadProgress && (
        <UploadProgressPanel
          uploads={uploads}
          onClose={() => setShowUploadProgress(false)}
          onClearCompleted={clearCompleted}
        />
      )}

      {/* Dialogs */}
      <UploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        partnerId={partnerId}
        userId={user.uid}
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
        userId={user.uid}
        onUploadComplete={handleUploadComplete}
        existingFile={editingFile}
      />

      <TestDrawer
        isOpen={isTestDrawerOpen}
        onClose={() => setIsTestDrawerOpen(false)}
        partnerId={partnerId}
        userId={user.uid}
        documentCount={activeFileCount}
      />
    </div>
  );
}