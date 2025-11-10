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
  Database,
  TestTube2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VaultSidebar from '@/components/partner/vault/VaultSidebar';
import DocumentGrid from '@/components/partner/vault/DocumentGrid';
import DocumentPreview from '@/components/partner/vault/DocumentPreview';
import UploadDialog from '@/components/partner/vault/UploadDialog';
import TestInterface from '@/components/partner/vault/TestInterface';
import { useToast } from '@/hooks/use-toast';
import type { VaultFile } from '@/lib/types';
import {
  listVaultFiles,
  deleteVaultFile,
  generateExampleQuestions,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateRange: 'all'
  });
  const { toast } = useToast();

  useEffect(() => {
    if (partnerId && user) {
      loadData(true); // Show loading on initial load
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
    } catch (error: any) {
      setLoadError(error.message || 'Failed to load vault data');
      if (showLoading) {
        toast({
          title: 'Error loading data',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const filterFiles = () => {
    let filtered = [...files];

    if (searchQuery) {
      filtered = filtered.filter(file =>
        file.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(file => file.state === filters.status.toUpperCase());
    }

    setFilteredFiles(filtered);
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!partnerId) return;

    try {
      const result = await deleteVaultFile(partnerId, fileId);

      if (result.success) {
        setFiles(prev => prev.filter(f => f.id !== fileId));
        if (selectedFile?.id === fileId) {
          setSelectedFile(null);
        }
        toast({
          title: 'File deleted',
          description: 'Document removed successfully',
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUploadComplete = () => {
    // Simply reload the file list without refreshing the page
    loadData(false); // Don't show loading spinner
  };

  const handleTrain = async () => {
    if (!partnerId) return;
    
    toast({
      title: 'Training started',
      description: 'Generating AI suggestions from your documents...',
    });

    try {
      await generateExampleQuestions(partnerId);
      toast({
        title: 'Training complete',
        description: 'Your knowledge base is ready!',
      });
    } catch (error) {
      toast({
        title: 'Training failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
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
        subtitle="Document Management & AI Training"
      />

      <main className="flex-1 bg-gray-50 overflow-hidden">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Actions */}
              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => setIsUploadDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => loadData(false)} // Don't show loading spinner
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Sync
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={handleTrain}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Train
                </Button>
              </div>

              {/* Center: Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    <strong className="text-gray-900">{files.length}</strong> total
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-green-500" />
                  <span className="text-gray-600">
                    <strong className="text-gray-900">{activeFileCount}</strong> trained
                  </span>
                </div>
              </div>

              {/* Right: Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
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
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="border-b-0">
                <TabsTrigger value="documents" className="gap-2">
                  <Database className="h-4 w-4" />
                  Documents
                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                    {files.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="test" className="gap-2">
                  <TestTube2 className="h-4 w-4" />
                  Test AI
                  {activeFileCount > 0 && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                      Ready
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Tab Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Documents Tab */}
          <TabsContent value="documents" className="m-0">
            <div className="flex h-[calc(100vh-14rem)]">
              {/* Left Sidebar - Filters */}
              {showFilters && (
                <VaultSidebar
                  filters={filters}
                  onFiltersChange={setFilters}
                  fileCount={files.length}
                />
              )}

              {/* Center - Document Grid/List */}
              <div className="flex-1 overflow-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {filteredFiles.length} Document{filteredFiles.length !== 1 ? 's' : ''}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className={showFilters ? 'bg-gray-100' : ''}
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                      </Button>
                      
                      <div className="flex border border-gray-200 rounded-lg">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                        >
                          <Grid3x3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                        >
                          <List className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

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

              {/* Right Drawer - Document Preview */}
              {selectedFile && (
                <DocumentPreview
                  file={selectedFile}
                  onClose={() => setSelectedFile(null)}
                  onDelete={() => handleDeleteFile(selectedFile.id)}
                />
              )}
            </div>
          </TabsContent>

          {/* Test AI Tab */}
          <TabsContent value="test" className="m-0">
            <TestInterface
              partnerId={partnerId}
              userId={user.uid}
              documentCount={activeFileCount}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Upload Dialog */}
      <UploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        partnerId={partnerId}
        userId={user.uid}
        onUploadComplete={handleUploadComplete}
      />
    </>
  );
}