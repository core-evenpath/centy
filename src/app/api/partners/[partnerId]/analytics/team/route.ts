// src/app/api/partners/[partnerId]/analytics/team/route.ts (v2)
import { NextRequest, NextResponse } from 'next/server';
import { db, adminAuth } from '@/lib/firebase-admin';
import { headers } from 'next/headers';

interface TeamAnalytics {
  membershipTrends: {
    totalMembers: number;
    activeMembers: number;
    suspendedMembers: number;
    newMembersThisMonth: number;
    turnoverRate: number;
  };
  activityMetrics: {
    averageLoginFrequency: number;
    mostActiveMembers: any[];
    leastActiveMembers: any[];
    taskCompletionRate: number;
  };
  statusBreakdown: {
    byRole: Record<string, number>;
    byStatus: Record<string, number>;
    byJoinDate: Record<string, number>;
  };
  suspensionAnalytics: {
    totalSuspensions: number;
    averageSuspensionDuration: number;
    commonSuspensionReasons: Record<string, number>;
    reactivationRate: number;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization') || '';
    const partnerId = (await params).partnerId;
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d'; // 7d, 30d, 90d, 1y
    const includeDetails = searchParams.get('includeDetails') === 'true';

    // Verify authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required'
      }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    const customClaims = decodedToken;
    const isPartnerAdmin = customClaims.role === 'partner_admin' && customClaims.partnerId === partnerId;
    const isSuperAdmin = customClaims.role === 'Super Admin' || customClaims.role === 'Admin';
    
    if (!isPartnerAdmin && !isSuperAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Insufficient permissions'
      }, { status: 403 });
    }

    // Calculate date range
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Get team analytics data
    const analytics = await generateTeamAnalytics(partnerId, startDate, now, includeDetails);

    return NextResponse.json({
      success: true,
      data: analytics,
      timeRange,
      generatedAt: now.toISOString()
    });

  } catch (error: any) {
    console.error("Error generating team analytics:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to generate team analytics"
    }, { status: 500 });
  }
}

async function generateTeamAnalytics(
  partnerId: string, 
  startDate: Date, 
  endDate: Date, 
  includeDetails: boolean
): Promise<TeamAnalytics> {
  
  // Get all team members
  const teamMembersSnapshot = await db
    .collection('teamMembers')
    .where('partnerId', '==', partnerId)
    .get();

  const teamMembers = teamMembersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as any));

  // Get audit logs for the time period
  const auditLogsSnapshot = await db
    .collection('auditLogs')
    .where('partnerId', '==', partnerId)
    .where('timestamp', '>=', startDate)
    .where('timestamp', '<=', endDate)
    .get();

  const auditLogs = auditLogsSnapshot.docs.map(doc => doc.data());

  // Get user workspace links
  const workspaceLinksSnapshot = await db
    .collection('userWorkspaceLinks')
    .where('partnerId', '==', partnerId)
    .get();

  const workspaceLinks = workspaceLinksSnapshot.docs.map(doc => doc.data());

  // Get tasks for activity metrics
  const tasksSnapshot = await db
    .collection('tasks')
    .where('partnerId', '==', partnerId)
    .where('createdAt', '>=', startDate)
    .get();

  const tasks = tasksSnapshot.docs.map(doc => doc.data());

  // Calculate membership trends
  const totalMembers = teamMembers.length;
  const activeMembers = teamMembers.filter(m => m.status === 'active').length;
  const suspendedMembers = teamMembers.filter(m => m.status === 'suspended').length;
  
  const newMembersThisMonth = teamMembers.filter(m => {
    const joinDate = m.joinedDate ? new Date(m.joinedDate) : null;
    return joinDate && joinDate >= startDate;
  }).length;

  const suspensionEvents = auditLogs.filter(log => log.action === 'TEAM_MEMBER_DEACTIVATED');
  const reactivationEvents = auditLogs.filter(log => log.action === 'TEAM_MEMBER_REACTIVATED');
  const turnoverRate = totalMembers > 0 ? (suspensionEvents.length / totalMembers) * 100 : 0;

  // Calculate activity metrics
  const memberActivity = teamMembers.map(member => {
    const memberTasks = tasks.filter(t => t.assignedTo === member.id);
    const completedTasks = memberTasks.filter(t => t.status === 'completed');
    
    return {
      ...member,
      totalTasks: memberTasks.length,
      completedTasks: completedTasks.length,
      completionRate: memberTasks.length > 0 ? (completedTasks.length / memberTasks.length) * 100 : 0,
      lastActive: member.lastActive ? new Date(member.lastActive) : null
    };
  });

  const taskCompletionRate = tasks.length > 0 
    ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 
    : 0;

  // Status breakdown
  const roleBreakdown = teamMembers.reduce((acc, member) => {
    acc[member.role] = (acc[member.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusBreakdown = teamMembers.reduce((acc, member) => {
    acc[member.status] = (acc[member.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Suspension analytics
  const suspensionReasons = suspensionEvents.reduce((acc, event) => {
    const reason = event.details?.reason || 'Unknown';
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const reactivationRate = suspensionEvents.length > 0 
    ? (reactivationEvents.length / suspensionEvents.length) * 100 
    : 0;

  // Calculate average suspension duration
  let totalSuspensionDuration = 0;
  let suspensionCount = 0;

  for (const suspension of suspensionEvents) {
    const reactivation = reactivationEvents.find(r => 
      r.targetUserId === suspension.targetUserId && 
      r.timestamp > suspension.timestamp
    );
    
    if (reactivation) {
      const duration = reactivation.timestamp.toDate().getTime() - suspension.timestamp.toDate().getTime();
      totalSuspensionDuration += duration;
      suspensionCount++;
    }
  }

  const averageSuspensionDuration = suspensionCount > 0 
    ? totalSuspensionDuration / suspensionCount / (24 * 60 * 60 * 1000) // Convert to days
    : 0;

  return {
    membershipTrends: {
      totalMembers,
      activeMembers,
      suspendedMembers,
      newMembersThisMonth,
      turnoverRate: Math.round(turnoverRate * 100) / 100
    },
    activityMetrics: {
      averageLoginFrequency: 0, // Would need to track login events
      mostActiveMembers: includeDetails 
        ? memberActivity.sort((a, b) => b.completionRate - a.completionRate).slice(0, 5)
        : [],
      leastActiveMembers: includeDetails 
        ? memberActivity.sort((a, b) => a.completionRate - b.completionRate).slice(0, 5)
        : [],
      taskCompletionRate: Math.round(taskCompletionRate * 100) / 100
    },
    statusBreakdown: {
      byRole: roleBreakdown,
      byStatus: statusBreakdown,
      byJoinDate: {} // Could be implemented to show monthly joins
    },
    suspensionAnalytics: {
      totalSuspensions: suspensionEvents.length,
      averageSuspensionDuration: Math.round(averageSuspensionDuration * 100) / 100,
      commonSuspensionReasons: suspensionReasons,
      reactivationRate: Math.round(reactivationRate * 100) / 100
    }
  };
}