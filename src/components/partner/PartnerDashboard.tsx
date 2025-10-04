"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Users, CheckSquare, Clock, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { NewCampaignModal, NewGroupModal, NewTemplateModal } from './messaging/SecondLevelModals';

// Mock data for dashboard
const mockStats = {
  totalTeamMembers: 12,
  activeTasks: 8,
  completedTasks: 24,
  pendingApprovals: 3,
  productivity: 87,
  upcomingDeadlines: 5
};

const mockRecentActivity = [
  {
    id: '1',
    type: 'task_completed',
    message: 'John Doe completed "Client Onboarding Process"',
    time: '2 hours ago',
    status: 'success'
  },
  {
    id: '2',
    type: 'team_member_added',
    message: 'Sarah Johnson joined the team',
    time: '4 hours ago',
    status: 'info'
  },
  {
    id: '3',
    type: 'task_overdue',
    message: 'Task "Document Review" is overdue',
    time: '1 day ago',
    status: 'warning'
  },
  {
    id: '4',
    type: 'approval_pending',
    message: 'New approval request from Mike Wilson',
    time: '2 days ago',
    status: 'pending'
  }
];

export default function PartnerDashboard() {
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_completed': return <CheckSquare className="w-4 h-4 text-green-600" />;
      case 'team_member_added': return <Users className="w-4 h-4 text-blue-600" />;
      case 'task_overdue': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'approval_pending': return <Clock className="w-4 h-4 text-orange-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'info': return <Badge variant="default" className="bg-blue-100 text-blue-800">Info</Badge>;
      case 'warning': return <Badge variant="destructive">Warning</Badge>;
      case 'pending': return <Badge variant="secondary">Pending</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                  <p className="text-2xl font-bold">{mockStats.totalTeamMembers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Tasks</p>
                  <p className="text-2xl font-bold">{mockStats.activeTasks}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed Tasks</p>
                  <p className="text-2xl font-bold">{mockStats.completedTasks}</p>
                </div>
                <CheckSquare className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                  <p className="text-2xl font-bold">{mockStats.pendingApprovals}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Productivity Score</p>
                  <p className="text-2xl font-bold">{mockStats.productivity}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming Deadlines</p>
                  <p className="text-2xl font-bold">{mockStats.upcomingDeadlines}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(activity.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setShowNewCampaign(true)} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-left">
                  <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
                  <h3 className="font-medium">New Campaign</h3>
                  <p className="text-sm text-muted-foreground">Launch a new marketing campaign.</p>
                </button>
                <button onClick={() => setShowNewTemplate(true)} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-left">
                  <CheckSquare className="w-8 h-8 text-green-600 mb-2" />
                  <h3 className="font-medium">Create Template</h3>
                  <p className="text-sm text-muted-foreground">Build a new reusable template.</p>
                </button>
                <button onClick={() => setShowNewGroup(true)} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-left">
                  <Users className="w-8 h-8 text-purple-600 mb-2" />
                  <h3 className="font-medium">New Group</h3>
                  <p className="text-sm text-muted-foreground">Create a new contact group.</p>
                </button>
                <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors text-left">
                  <Activity className="w-8 h-8 text-orange-600 mb-2" />
                  <h3 className="font-medium">View Reports</h3>
                  <p className="text-sm text-muted-foreground">Analyze your campaign performance.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {showNewCampaign && <NewCampaignModal setShowNewCampaign={setShowNewCampaign} />}
      {showNewTemplate && <NewTemplateModal setShowNewTemplate={setShowNewTemplate} />}
      {showNewGroup && <NewGroupModal setShowNewGroup={setShowNewGroup} />}
    </>
  );
}
