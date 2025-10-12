
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Building, TrendingUp, CheckCircle, Activity, Zap, Mail, Calendar, User } from "lucide-react";
import { Skeleton } from '../ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';

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
    };
}

export default function SystemOverview() {
  const [earlyAccessSignups, setEarlyAccessSignups] = useState<EarlyAccessSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Use the auth hook

  useEffect(() => {
    async function fetchSignups() {
      if (!user) {
        setLoading(false);
        setError("You must be logged in to view this data.");
        return;
      }

      try {
        const token = await user.customClaims?.token;

        const response = await fetch('/api/admin/early-access', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch signups');
        }
        const data = await response.json();
        setEarlyAccessSignups(data.signups);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
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
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[stat.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-xs text-green-600">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium text-foreground">API Response</span>
              </div>
              <span className="text-sm text-muted-foreground">{mockSystemStats.avgResponseTime}</span>
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
          <CardHeader>
            <CardTitle className="font-headline">Recent Early Access Signups</CardTitle>
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
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
            ) : earlyAccessSignups.length === 0 ? (
                <p className="text-muted-foreground">No signups yet.</p>
            ) : (
              earlyAccessSignups.map((signup) => (
                <div key={signup.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-foreground">{signup.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span>{signup.email}</span>
                        </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(signup.createdAt.seconds * 1000).toLocaleDateString()}
                        </div>
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
