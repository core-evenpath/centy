// src/app/partner/(protected)/content-studio/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, getDocs, writeBatch } from 'firebase/firestore';
import type { ContactGroup } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import PartnerHeader from '../../../../components/partner/PartnerHeader';
import { Send, Users, FileText, Loader2, AlertCircle } from 'lucide-react';
import contactGroupsData from '@/lib/contact-groups.json';

function MessagingPlatform() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Seed initial contact groups if the collection is empty
  useEffect(() => {
    const seedContactGroups = async () => {
      if (!currentWorkspace?.partnerId) return;
      
      const collectionPath = `partners/${currentWorkspace.partnerId}/contactGroups`;
      const groupsCollection = collection(db, collectionPath);
      
      try {
        const snapshot = await getDocs(groupsCollection);
        if (snapshot.empty) {
          console.log(`Seeding initial contact groups for partner ${currentWorkspace.partnerId}...`);
          const batch = writeBatch(db);
          contactGroupsData.forEach(group => {
            const docRef = doc(groupsCollection); // Auto-generate ID
            batch.set(docRef, {
              ...group,
              partnerId: currentWorkspace.partnerId // Ensure partnerId is set
            });
          });
          await batch.commit();
          console.log('Contact groups seeded successfully.');
        }
      } catch (error) {
        console.error("Error seeding contact groups:", error);
      }
    };
    
    seedContactGroups();
  }, [currentWorkspace?.partnerId]);
  
  // Fetch Contact Groups from Firestore in real-time
  useEffect(() => {
    if (!currentWorkspace?.partnerId) {
      setIsLoadingGroups(false);
      return;
    }
    
    setIsLoadingGroups(true);
    const collectionPath = `partners/${currentWorkspace.partnerId}/contactGroups`;
    const q = query(collection(db, collectionPath));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ContactGroup));
      setContactGroups(groupsData);
      setIsLoadingGroups(false);
      setFirestoreError(null);
    }, (serverError: any) => {
      const permissionError = new FirestorePermissionError({
        path: collectionPath,
        operation: 'list',
        serverError,
      });
      errorEmitter.emit('permission-error', permissionError);
      setIsLoadingGroups(false);
    });

    return () => unsubscribe();
  }, [currentWorkspace?.partnerId]);
  
  if (currentScreen === 'home') {
    const totalContacts = contactGroups.reduce((sum, g) => sum + (g.contactCount || 0), 0);
    return (
      <div className="min-h-full bg-gray-50 p-4 sm:p-6 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 space-y-6">
            <button
              onClick={() => {
                alert("This feature is under development.");
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all mb-6 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-bold text-white mb-1">Send New Campaign</h2>
                    <p className="text-blue-100 text-sm">Create and send messages in 4 simple steps</p>
                  </div>
                </div>
              </div>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card
                onClick={() => alert("This feature is under development.")}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-left border-2 border-transparent hover:border-purple-300 group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <FileText className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                  Message Templates
                </h3>
                <p className="text-gray-600 text-sm">
                  Browse pre-written messages you can customize
                </p>
              </Card>

              <Card
                onClick={() => setCurrentScreen('groups')}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-left border-2 border-transparent hover:border-green-300 group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <Users className="w-10 h-10 text-green-600" />
                   <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    {isLoadingGroups ? <Loader2 className="w-3 h-3 animate-spin"/> : `${totalContacts} CONTACTS`}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                  Contact Groups
                </h3>
                <p className="text-gray-600 text-sm">View and manage your contact lists</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentScreen === 'groups') {
    return (
      <div className="min-h-full bg-gray-50 p-4 sm:p-6 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-4 space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Contact Groups</h1>
                    <p className="text-gray-600 mt-1">Organize and segment your subscriber base</p>
                  </div>
                  <div className="flex items-center gap-3">
                     <Button variant="outline" onClick={() => setCurrentScreen('home')}>
                       ← Back
                     </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {isLoadingGroups && (
              <div className="text-center py-10">
                 <Loader2 className="mx-auto h-12 w-12 animate-spin text-gray-400" />
                 <p className="mt-4 text-sm text-gray-600">Loading contact groups...</p>
              </div>
            )}
            {firestoreError && (
               <div className="text-center py-10 text-red-600">
                 <AlertCircle className="mx-auto h-12 w-12" />
                 <p className="mt-4 text-sm">{firestoreError}</p>
               </div>
            )}
            {!isLoadingGroups && !firestoreError && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {contactGroups.map(group => (
                  <Card key={group.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{group.name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-1">{group.description}</p>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-3xl font-bold text-gray-900 mb-1">{group.contactCount}</p>
                        <p className="text-xs text-gray-600 uppercase font-bold tracking-wide">Total Contacts</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                 {contactGroups.length === 0 && (
                    <Card className="sm:col-span-2 lg:col-span-3">
                        <CardContent className="p-10 text-center">
                            <Users className="w-16 h-16 mx-auto text-gray-300 mb-4"/>
                            <h3 className="text-xl font-semibold">No Contact Groups Found</h3>
                            <p className="text-muted-foreground mt-2">
                                It looks like you haven't created any contact groups yet.
                            </p>
                        </CardContent>
                    </Card>
                 )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function ContentStudioPage() {
  return (
    <>
      <PartnerHeader
        title="Content Studio"
        subtitle="Design, manage and send your content."
      />
      <main className="flex-1 overflow-y-auto">
        <MessagingPlatform />
      </main>
    </>
  );
}
