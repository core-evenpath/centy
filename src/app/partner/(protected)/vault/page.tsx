'use client';

import React, { useState, useEffect } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import PartnerHeader from '@/components/partner/PartnerHeader';
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
  Database
} from 'lucide-react';
import VaultSidebar from '@/components/partner/vault/VaultSidebar';
import DocumentGrid from '@/components/partner/vault/DocumentGrid';
import DocumentPreview from '@/components/partner/vault/DocumentPreview';
import UploadDialog from '@/components/partner/vault/UploadDialog';
import TestDrawer from '@/components/partner/vault/TestDrawer';
import { useToast } from '@/hooks/use-toast';
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
  const [isTestDrawerOpen, setIsTestDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateRange: 'all'
  });
  const { toast } = useToast();

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

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vault...</p>
        </div>
      </div>
    );
  }

  if (!user || !partnerId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold">Access Error</p>
          <p className="text-gray-600 mt-2">{loadError || 'Please log in again.'}</p>
        </div>
      </div>
    );
  }

  const activeFileCount = files.filter(f => f.state === 'ACTIVE').length;

  return (
    <>
      <PartnerHeader
        title="Vault"
        subtitle="Manage your documents and AI knowledge base"
      />

      <main className="flex-1 bg-gray-50 overflow-hidden">
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-3">
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
                  variant="outline"
                  size="sm"
                  onClick={() => loadData(false)}
                  disabled={isLoading}
                  className="h-9"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Sync
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-9 ${showFilters ? 'bg-gray-100' : ''}`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    {files.length} document{files.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

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

        <div className="flex h-[calc(100vh-14rem)]">
          {showFilters && (
            <VaultSidebar
              filters={filters}
              onFiltersChange={setFilters}
              fileCount={files.length}
            />
          )}

          <div className="flex-1 overflow-auto">
            <div className="p-6">
              <DocumentGrid
                files={filteredFiles}
                viewMode={viewMode}
                selectedFile={selectedFile}
                onSelectFile={setSelectedFile}
                onDeleteFile={handleDeleteFile}
                isLoading={false}
              />
            </div>
          </div>

          {selectedFile && (
            <DocumentPreview
              file={selectedFile}
              onClose={() => setSelectedFile(null)}
              onDelete={() => handleDeleteFile(selectedFile.id)}
            />
          )}
        </div>
      </main>

      {activeFileCount > 0 && (
        <button
          onClick={() => setIsTestDrawerOpen(true)}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all px-6 py-3 flex items-center gap-3 group z-40"
        >
          <Sparkles className="h-5 w-5" />
          <span className="font-medium">Vault Chat</span>
          <div className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-medium">
            {activeFileCount} ready
          </div>
        </button>
      )}

      <UploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        partnerId={partnerId}
        userId={user.uid}
        onUploadComplete={handleUploadComplete}
      />

      <TestDrawer
        isOpen={isTestDrawerOpen}
        onClose={() => setIsTestDrawerOpen(false)}
        partnerId={partnerId}
        userId={user.uid}
        documentCount={activeFileCount}
      />
    </>
  );
}