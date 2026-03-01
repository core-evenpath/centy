// src/components/admin/SystemOverview.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Mail, Calendar, User, RefreshCw, AlertCircle } from "lucide-react";
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/use-auth';

interface EarlyAccessSignup {
  id: string;
  name: string;
  email: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  } | null;
}

// Helper to get a fresh token from Firebase Auth (handles automatic refresh)
async function getToken(forceRefresh = false): Promise<string> {
  try {
    const { getAuth, getIdToken } = await import('firebase/auth');
    const auth = getAuth();
    if (auth.currentUser) {
      return await getIdToken(auth.currentUser, forceRefresh);
    }

    console.error('No current user in Firebase Auth');
    return '';
  } catch (error) {
    console.error('Error getting token:', error);
    return '';
  }
}

export default function SystemOverview() {
  const [earlyAccessSignups, setEarlyAccessSignups] = useState<EarlyAccessSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { user } = useAuth();

  const fetchSignups = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo(null);

    if (!user) {
      setLoading(false);
      setError("You must be logged in to view this data.");
      console.error('No user found in auth context');
      return;
    }

    try {
      const token = await getToken();

      if (!token) {
        throw new Error("Authentication token not available. Please try logging out and back in.");
      }

      let response = await fetch('/api/admin/early-access', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      // If token expired, force-refresh and retry once
      if (response.status === 401) {
        const freshToken = await getToken(true);
        if (freshToken && freshToken !== token) {
          response = await fetch('/api/admin/early-access', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${freshToken}`,
              'Content-Type': 'application/json'
            },
            cache: 'no-store'
          });
        }
      }

      const data = await response.json();

      if (!response.ok) {
        setDebugInfo({
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data.details,
          code: data.code,
          indexInfo: data.indexInfo
        });

        throw new Error(data.details || data.error || `Failed to fetch signups (${response.status})`);
      }

      setEarlyAccessSignups(data.signups || []);

    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSignups();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-headline">Recent Early Access Signups</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSignups}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">Error Loading Signups</span>
                </div>
                <p className="text-sm mb-3">{error}</p>

                {debugInfo && (
                  <div className="mt-3 p-3 bg-red-100 rounded text-xs space-y-2">
                    <div><strong>Status:</strong> {debugInfo.status}</div>
                    {debugInfo.code && <div><strong>Code:</strong> {debugInfo.code}</div>}
                    {debugInfo.details && <div><strong>Details:</strong> {debugInfo.details}</div>}

                    {debugInfo.indexInfo && (
                      <div className="mt-2 p-2 bg-white rounded">
                        <strong>Required Index:</strong>
                        <div className="ml-2 mt-1">
                          Collection: {debugInfo.indexInfo.collection}<br />
                          Field: {debugInfo.indexInfo.field}<br />
                          Order: {debugInfo.indexInfo.order}
                        </div>
                        <div className="mt-2 text-blue-600">
                          → Check Firebase Console logs for index creation link
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchSignups}
                  className="mt-3"
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : earlyAccessSignups.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No signups yet.</p>
            </div>
          ) : (
            earlyAccessSignups.map((signup) => (
              <div key={signup.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{signup.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{signup.email}</span>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                  {signup.createdAt ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(signup.createdAt.seconds * 1000).toLocaleDateString()}
                    </div>
                  ) : (
                    <span className="text-gray-400">No date</span>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
