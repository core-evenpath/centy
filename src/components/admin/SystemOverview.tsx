"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Building, CheckCircle, Activity, Zap, Mail, Calendar, User, RefreshCw, AlertCircle } from "lucide-react";
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/use-auth';
import type { FirebaseAuthUser } from '../../lib/types';

const mockSystemStats = {
  totalPartners: 15,
  activeWorkflows: 42,
  totalTasks: 12456,
  systemUptime: "99.9%",
  avgResponseTime: "245ms",
  dailyActiveUsers: 342,
  monthlyGrowth: "+23%",
  storageUsed: "2.4TB"
};

interface EarlyAccessSignup {
  id: string;
  name: string;
  email: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  } | null;
}

// Helper to get the token from our custom user type
async function getToken(user: FirebaseAuthUser): Promise<string> {
  try {
    if (user.customClaims?.token) {
      return user.customClaims.token;
    }
    
    // Fallback - get fresh token
    const { getAuth, getIdToken } = await import('firebase/auth');
    const auth = getAuth();
    if (auth.currentUser) {
      const token = await getIdToken(auth.currentUser);
      console.log('Got fresh token from Firebase Auth');
      return token;
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

    console.log('User role:', user.customClaims?.role);
    console.log('User email:', user.email);

    try {
      const token = await getToken(user);
      
      if (!token) {
        throw new Error("Authentication token not available. Please try logging out and back in.");
      }

      console.log('Fetching signups from API...');
      
      const response = await fetch('/api/admin/early-access', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        // Store debug info for display
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
      console.log(`Successfully loaded ${data.signups?.length || 0} signups`);
      
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignups();
  }, [user]);

  const statCards = [
    {
      label: "Total Partners",
      value: mockSystemStats.totalPartners,
      change: "+2 this month",
      icon: Building,
      color: "blue",
    },
    {
      label: "Active Workflows",
      value: mockSystemStats.activeWorkflows,
      change: "+8 this week",
      icon: Zap,
      color: "green",
    },
    {
      label: "Total Tasks",
      value: mockSystemStats.totalTasks.toLocaleString(),
      change: mockSystemStats.monthlyGrowth,
      icon: CheckCircle,
      color: "purple",
    },
    {
      label: "System Uptime",
      value: mockSystemStats.systemUptime,
      change: "Last 30 days",
      icon: Activity,
      color: "emerald",
    },
  ];

  const colorClasses: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    emerald: "bg-emerald-100 text-emerald-600"
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-foreground">API Services</span>
              </div>
              <span className="text-sm text-muted-foreground">Operational</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-foreground">Database</span>
              </div>
              <span className="text-sm text-muted-foreground">Healthy</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-foreground">Storage Usage</span>
              </div>
              <span className="text-sm text-muted-foreground">{mockSystemStats.storageUsed}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-foreground">Daily Active Users</span>
              </div>
              <span className="text-sm text-muted-foreground">{mockSystemStats.dailyActiveUsers}</span>
            </div>
          </CardContent>
        </Card>

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
                            Collection: {debugInfo.indexInfo.collection}<br/>
                            Field: {debugInfo.indexInfo.field}<br/>
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
    </div>
  );
}