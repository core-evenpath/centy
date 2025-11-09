'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import PartnerHeader from '@/components/partner/PartnerHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Upload, Database, MessageSquare, RefreshCw, AlertCircle } from 'lucide-react';
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
  const { user, customClaims } = useAuth();
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [claimsLoaded, setClaimsLoaded] = useState(false);
  
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [stores, setStores] = useState<FileSearchStore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeStore, setActiveStore] = useState<string | null>(null);
  const { toast } = useToast();

  // Force load custom claims
  useEffect(() => {
    const loadCustomClaims = async () => {
      if (user && auth.currentUser) {
        try {
          console.log('🔄 Force refreshing ID token to get latest claims...');
          const idTokenResult = await auth.currentUser.getIdTokenResult(true); // force refresh
          console.log('✅ Token refreshed, claims:', idTokenResult.claims);
          
          const partnerIdFromClaims = idTokenResult.claims.partnerId as string;
          
          if (partnerIdFromClaims) {
            console.log('✅ Found partnerId in claims:', partnerIdFromClaims);
            setPartnerId(partnerIdFromClaims);
          } else {
            console.error('❌ No partnerId in claims:', idTokenResult.claims);
          }
          
          setClaimsLoaded(true);
        } catch (error) {
          console.error('❌ Error loading claims:', error);
          setClaimsLoaded(true);
        }
      }
    };

    if (user && !claimsLoaded) {
      loadCustomClaims();
    }
  }, [user, claimsLoaded]);

  useEffect(() => {
    console.log('🔍 Vault Page - useEffect triggered');
    console.log('📊 partnerId:', partnerId);
    console.log('👤 user:', user?.uid);
    console.log('🔐 customClaims from useAuth:', customClaims);
    console.log('🔐 claimsLoaded:', claimsLoaded);
    
    if (partnerId && user && claimsLoaded) {
      console.log('✅ Starting loadData...');
      loadData();
    } else {
      console.log('❌ Waiting for auth data');
      console.log('   partnerId:', partnerId);
      console.log('   user:', user?.uid);
      console.log('   claimsLoaded:', claimsLoaded);
      
      if (claimsLoaded && !partnerId) {
        setIsLoading(false);
      }
    }
  }, [partnerId, user, claimsLoaded]);

  const loadData = async () => {
    if (!partnerId) {
      console.error('❌ loadData called without partnerId');
      setLoadError('Partner ID not found. Please ensure you are logged in correctly.');
      setIsLoading(false);
      return;
    }

    console.log('🔄 loadData starting for partnerId:', partnerId);
    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log('📞 Calling listVaultFiles...');
      const filesResult = await listVaultFiles(partnerId);
      console.log('📁 Files result:', filesResult);

      console.log('📞 Calling listFileSearchStores...');
      const storesResult = await listFileSearchStores(partnerId);
      console.log('🗄️ Stores result:', storesResult);

      if (filesResult.success) {
        console.log('✅ Files loaded:', filesResult.files.length);
        setFiles(filesResult.files);
      } else {
        console.error('❌ Files failed to load');
      }

      if (storesResult.success) {
        console.log('✅ Stores loaded:', storesResult.stores.length);
        setStores(storesResult.stores);
        if (storesResult.stores.length > 0 && !activeStore) {
          setActiveStore(storesResult.stores[0].id);
          console.log('📌 Set active store:', storesResult.stores[0].id);
        }
      } else {
        console.error('❌ Stores failed to load');
      }
      
      console.log('✅ loadData completed successfully');
    } catch (error: any) {
      console.error('💥 Error in loadData:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      
      setLoadError(error.message || 'Failed to load vault data');
      
      toast({
        title: 'Error loading data',
        description: error.message || 'Failed to load vault data',
        variant: 'destructive',
      });
    } finally {
      console.log('🏁 loadData finished, setting isLoading to false');
      setIsLoading(false);
    }
  };

  const handleCreateStore = async () => {
    if (!partnerId) {
      toast({
        title: 'Error',
        description: 'Partner ID not found',
        variant: 'destructive',
      });
      return;
    }

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

  console.log('🎨 Rendering Vault Page');
  console.log('   isLoading:', isLoading);
  console.log('   partnerId:', partnerId);
  console.log('   user:', user?.uid);
  console.log('   loadError:', loadError);
  console.log('   claimsLoaded:', claimsLoaded);

  if (!claimsLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {!claimsLoaded ? 'Loading authentication...' : 'Loading vault...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold">Authentication Required</p>
          <p className="text-gray-600 mt-2">Please log in to access the Vault.</p>
        </div>
      </div>
    );
  }

  if (!partnerId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold">Partner ID Not Found</p>
          <p className="text-gray-600 mt-2">Your account is not associated with a partner workspace.</p>
          <div className="mt-4 text-left bg-gray-100 p-4 rounded max-w-md mx-auto">
            <p className="text-sm text-gray-700 font-mono">User: {user.uid}</p>
            <p className="text-sm text-gray-700 font-mono mt-2">
              Claims from useAuth: {JSON.stringify(customClaims, null, 2)}
            </p>
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <>
        <PartnerHeader
          title="Vault"
          subtitle="Upload and train AI on your documents with Gemini File Search"
        />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-red-900 font-semibold mb-2">Error Loading Vault</h3>
                  <p className="text-red-800 mb-4">{loadError}</p>
                  <Button onClick={loadData} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Troubleshooting Tips:</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Check browser console (F12) for detailed errors</li>
                <li>Verify Firestore rules are deployed: <code className="bg-blue-100 px-1">firebase deploy --only firestore:rules</code></li>
                <li>Ensure GEMINI_API_KEY is set in environment variables</li>
                <li>Partner ID: {partnerId}</li>
              </ul>
            </div>
          </div>
        </main>
      </>
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
                <FileUploader
                  partnerId={partnerId}
                  userId={user.uid}
                  onUploadComplete={loadData}
                />
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
                {activeStore && (
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