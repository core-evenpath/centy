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
  Grid3x3,
  List,
  AlertCircle,
  FileText,
  CheckCircle,
  Clock,
  Brain
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
import type { VaultFile } from '@/lib/types-vault';
import { listVaultFiles, deleteVaultFile } from '@/actions/vault-actions';

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
    applyFilters();
  }, [files, filters, searchQuery]);

  useEffect(() => {
    if (uploads.length > 0) {
      setShowUploadProgress(true);
    }
  }, [uploads]);

  const loadData = async (showLoading = false) => {
    if (!partnerId) return;

    if (showLoading) setIsLoading(true);
    setLoadError(null);

    try {
      const result = await listVaultFiles(partnerId);
      if (result.success) {
        setFiles(result.files);
      } else {
        setLoadError('Failed to load documents');
      }
    } catch (error: any) {
      setLoadError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...files];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.displayName.toLowerCase().includes(query) ||
        f.tags?.primaryCategory?.toLowerCase().includes(query) ||
        f.tags?.topics?.some(t => t.toLowerCase().includes(query)) ||
        f.tags?.keywords?.some(k => k.toLowerCase().includes(query))
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(f => f.state.toLowerCase() === filters.status);
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(f => {
        const ext = f.name.split('.').pop()?.toLowerCase();
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
          description: 'The document has been removed from your knowledge base.',
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
  const handleEditFile = (file: VaultFile) => {
    setEditingFile(file);
    setIsTrainingDataDialogOpen(true);
  };
  const handleUploadStart = (id: string, fileName: string) => {
    startUpload(fileName, id);
  };
  const handleUploadProgress = (id: string, step: number, description: string) => {
    updateUploadStep(id, step, description);
  };
  const handleUploadSuccess = (id: string) => {
    completeUpload(id);
  };
  const handleUploadError = (id: string, error: string) => {
    failUpload(id, error);
  };
  const activeCount = files.filter(f => f.state === 'ACTIVE').length;
  const processingCount = files.filter(f => f.state === 'PROCESSING').length;
  if (authLoading || (isLoading && files.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading your vault...</p>
        </div>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Unable to load vault</h2>
          <p className="text-slate-600 mb-4">{loadError}</p>
          <Button onClick={() => loadData(true)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-2">
                <FileText className="h-6 w-6" />
              </div>
              Document Vault
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-slate-600">{files.length} documents</span>
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                {activeCount} active
              </span>
              {processingCount > 0 && (
                <span className="text-amber-600 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {processingCount} processing
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CleanupButton partnerId={partnerId!} onCleanupComplete={() => loadData(true)} />
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setIsTrainingDataDialogOpen(true)}
            >
              <Brain className="h-4 w-4 mr-2" />
              Training Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={() => setIsTestDrawerOpen(true)}
              disabled={activeCount === 0}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Test RAG
            </Button>
            <Button
              size="sm"
              className="h-9 bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search documents, tags, topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            className={`h-10 ${showFilters ? 'bg-blue-50 border-blue-300' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>

          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => loadData(false)}
            className="h-10 w-10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {showFilters && (
          <div className="w-64 border-r border-slate-200 bg-white flex-shrink-0">
            <VaultSidebar
              filters={filters}
              onFiltersChange={setFilters}
              fileCount={files.length}
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          <DocumentGrid
            files={filteredFiles}
            viewMode={viewMode}
            selectedFile={selectedFile}
            onSelectFile={setSelectedFile}
            onDeleteFile={handleDeleteFile}
            isLoading={isLoading}
          />
        </div>
      </div>

      {selectedFile && (
        <DocumentPreview
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onDelete={() => handleDeleteFile(selectedFile.id)}
          onEdit={handleEditFile}
        />
      )}

      <UploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        partnerId={partnerId!}
        userId={user?.uid || ''}
        onUploadComplete={() => loadData(false)}
        onUploadStart={handleUploadStart}
        onUploadProgress={handleUploadProgress}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
      />

      <TrainingDataDialog
        isOpen={isTrainingDataDialogOpen}
        onClose={() => {
          setIsTrainingDataDialogOpen(false);
          setEditingFile(null);
        }}
        partnerId={partnerId!}
        userId={user?.uid || ''}
        onUploadComplete={() => loadData(false)}
        existingFile={editingFile}
      />

      <TestDrawer
        isOpen={isTestDrawerOpen}
        onClose={() => setIsTestDrawerOpen(false)}
        partnerId={partnerId!}
        userId={user?.uid || ''}
        documentCount={activeCount}
      />

      {showUploadProgress && (
        <UploadProgressPanel
          uploads={uploads}
          onClose={() => setShowUploadProgress(false)}
          onClearCompleted={clearCompleted}
        />
      )}
    </div>
  );
}