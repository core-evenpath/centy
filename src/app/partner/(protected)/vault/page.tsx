'use client';

import React, { useState, useEffect } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import PartnerHeader from '@/components/partner/PartnerHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Upload, Database, MessageSquare, RefreshCw } from 'lucide-react';
import FileUploader from '@/components/partner/vault/FileUploader';
import FilesList from '@/components/partner/vault/FilesList';
import QueryInterface from '@/components/partner/vault/QueryInterface';
import { useToast } from '@/hooks/use-toast';
import type { VaultFile, FileSearchStore } from '@/lib/types';
import {
  listVaultFiles,
  deleteVaultFile,
  createFileSearchStore,
  listFileSearchStores,
} from '@/actions/vault-actions';

export default function VaultPage() {
  const { user, partnerId, partnerAuth } = useMultiWorkspaceAuth();
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [stores, setStores] = useState<FileSearchStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStore, setActiveStore] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (partnerId) {
      loadData();
    }
  }, [partnerId]);

  const loadData = async () => {
    if (!partnerId) return;

    setIsLoading(true);
    try {
      const [filesResult, storesResult] = await Promise.all([
        listVaultFiles(partnerId),
        listFileSearchStores(partnerId),
      ]);

      if (filesResult.success) {
        setFiles(filesResult.files);
      }

      if (storesResult.success) {
        setStores(storesResult.stores);
        if (storesResult.stores.length > 0 && !activeStore) {
          setActiveStore(storesResult.stores[0].id);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error loading data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStore = async () => {
    if (!partnerId) return;

    try {
      const result = await createFileSearchStore(
        partnerId,
        `Knowledge Base ${new Date().toLocaleDateString()}`
      );

      if (result.success && result.store) {
        setStores((prev) => [result.store!, ...prev]);
        setActiveStore(result.store!.id);
        toast({
          title: 'Store created',
          description: 'New knowledge base created successfully',
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: 'Error creating store',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!partnerId) return;

    try {
      const result = await deleteVaultFile(partnerId, fileId);

      if (result.success) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        toast({
          title: 'File deleted',
          description: 'File removed successfully',
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: 'Error deleting file',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!partnerAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <PartnerHeader
        title="Vault"
        subtitle="Upload and train AI on your documents with Gemini File Search"
      />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={loadData}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
              {stores.length === 0 && (
                <Button onClick={handleCreateStore} size="sm">
                  <Database className="h-4 w-4 mr-2" />
                  Create Knowledge Base
                </Button>
              )}
            </div>
          </div>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList>
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </TabsTrigger>
              <TabsTrigger value="files">
                <Database className="h-4 w-4 mr-2" />
                Manage Files ({files.length})
              </TabsTrigger>
              <TabsTrigger value="query" disabled={stores.length === 0}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Query Knowledge Base
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">Upload Documents</h2>
                {partnerId && user && (
                  <FileUploader
                    partnerId={partnerId}
                    userId={user.uid}
                    onUploadComplete={loadData}
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="files" className="space-y-6">
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">Your Files</h2>
                <FilesList files={files} onDelete={handleDeleteFile} />
              </div>
            </TabsContent>

            <TabsContent value="query" className="space-y-6">
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Query Your Knowledge Base
                </h2>
                {partnerId && user && activeStore && (
                  <QueryInterface
                    partnerId={partnerId}
                    userId={user.uid}
                    storeId={activeStore}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              About Gemini File Search
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Upload documents to build a searchable knowledge base</li>
              <li>• Supports PDF, TXT, DOC, DOCX, and MD files up to 100MB</li>
              <li>• Query your documents using natural language</li>
              <li>• AI-powered semantic search finds relevant information</li>
            </ul>
          </div>
        </div>
      </main>
    </>
  );
}