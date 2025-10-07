// src/app/partner/(protected)/content-studio/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import type { ContactGroup } from '@/lib/types';
import PartnerHeader from '../../../../components/partner/PartnerHeader';
import { Send, Users, FileText, Loader2, AlertCircle } from 'lucide-react';
import contactGroupsData from '@/lib/contact-groups.json';
import { NewCampaignModal } from '../../../../components/partner/messaging/SecondLevelModals';

function MessagingPlatform() {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [showNewCampaign, setShowNewCampaign] = useState(false);

  // Fetch Contact Groups from Firestore in real-time
  useEffect(() => {
    if (!currentWorkspace?.partnerId) {
      console.log('No current workspace, skipping Firestore listener for contact groups.');
      setIsLoadingGroups(false);
      setContactGroups([]);
      return;
    }

    setIsLoadingGroups(true);
    setFirestoreError(null);
    const collectionPath = `partners/${currentWorkspace.partnerId}/contactGroups`;
    const q = query(collection(db, collectionPath));
    
    console.log(`Setting up Firestore listener for: ${collectionPath}`);

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Seed data if collection is empty
      if (snapshot.empty) {
        console.log(`Contact groups collection is empty. Seeding initial data...`);
        try {
          const batch = writeBatch(db);
          contactGroupsData.forEach(group => {
            const docRef = doc(collection(db, collectionPath)); // Auto-generate ID
            batch.set(docRef, {
              ...group,
              partnerId: currentWorkspace.partnerId // Ensure partnerId is set
            });
          });
          await batch.commit();
          console.log('Contact groups seeded successfully.');
          return;
        } catch (seedError) {
           console.error("Error seeding contact groups:", seedError);
           setFirestoreError("Failed to initialize contact groups data.");
           setIsLoadingGroups(false);
           return;
        }
      }

      const groupsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ContactGroup));
      
      console.log(`Fetched ${groupsData.length} contact groups.`);
      setContactGroups(groupsData);
      setIsLoadingGroups(false);
    }, (error) => {
      console.error("Firestore onSnapshot error:", error);
      setFirestoreError(`Permission denied. Cannot fetch contact groups.`);
      setIsLoadingGroups(false);
    });

    return () => {
      console.log(`Cleaning up Firestore listener for: ${collectionPath}`);
      unsubscribe();
    }
  }, [currentWorkspace?.partnerId]);
  
  const totalContacts = contactGroups.reduce((sum, g) => sum + (g.contactCount || 0), 0);
  
  return (
    <div className="min-h-full bg-gray-50 p-4 sm:p-6 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          <button
            onClick={() => setShowNewCampaign(true)}
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

            <Link href="/partner/contacts">
              <Card
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-left border-2 border-transparent hover:border-green-300 group cursor-pointer h-full"
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
            </Link>
          </div>

          {firestoreError && (
               <Card className="sm:col-span-2 lg:col-span-3 bg-red-50 border-red-200">
                  <CardContent className="p-6 text-center">
                      <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4"/>
                      <h3 className="text-xl font-semibold text-red-800">Permission Error</h3>
                      <p className="text-red-700 mt-2 text-sm whitespace-pre-wrap">{firestoreError}</p>
                  </CardContent>
              </Card>
          )}

        </div>
      </div>
      {showNewCampaign && <NewCampaignModal setShowNewCampaign={setShowNewCampaign} />}
    </div>
  );
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
