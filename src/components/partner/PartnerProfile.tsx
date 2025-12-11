// src/components/partner/PartnerProfile.tsx
"use client";

import React from 'react';
import type { Partner } from '../../lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import {
  Building2,
  Users,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Target,
  Briefcase,
  Zap,
  AlertCircle
} from 'lucide-react';

interface PartnerProfileProps {
  partner: Partner;
}

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value?: React.ReactNode;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-foreground">
        {value || <span className="text-muted-foreground italic">Not set</span>}
      </span>
    </div>
  );
}

export default function PartnerProfile({ partner }: PartnerProfileProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      active: { variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      pending: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      suspended: { variant: 'destructive', className: '' },
    };
    const config = statusConfig[status] || { variant: 'secondary' as const, className: '' };
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const planConfig: Record<string, string> = {
      Enterprise: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      Professional: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      Starter: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return (
      <Badge variant="outline" className={planConfig[plan] || ''}>
        {plan}
      </Badge>
    );
  };

  const formatLocation = () => {
    if (!partner.location) return null;
    const parts = [partner.location.city, partner.location.state].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-xl font-bold shadow-lg">
                {(partner.name || partner.businessName || 'O').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{partner.name || partner.businessName}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Organization Profile</p>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(partner.status)}
                  {getPlanBadge(partner.plan)}
                </div>
              </div>
            </div>
            {partner.joinedDate && (
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Member since {new Date(partner.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Completeness */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="font-medium">Profile Completeness</span>
            </div>
            <span className="text-lg font-bold text-primary">
              {partner.aiProfileCompleteness || 0}%
            </span>
          </div>
          <Progress value={partner.aiProfileCompleteness || 0} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Complete your profile to unlock better AI recommendations and insights
          </p>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            <InfoRow icon={Building2} label="Business Name" value={partner.businessName} />
            <InfoRow icon={Users} label="Contact Person" value={partner.contactPerson} />
            <InfoRow icon={Mail} label="Email Address" value={partner.email} />
            <InfoRow icon={Phone} label="Phone Number" value={partner.phone} />
            <InfoRow icon={MapPin} label="Location" value={formatLocation()} />
          </div>
        </CardContent>
      </Card>

      {/* Business Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Business Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            <InfoRow icon={Building2} label="Industry" value={partner.industry?.name} />
            <InfoRow icon={Users} label="Business Size" value={partner.businessSize} />
            <InfoRow icon={Users} label="Employee Count" value={partner.employeeCount} />
            <InfoRow
              icon={BarChart3}
              label="Monthly Revenue"
              value={partner.monthlyRevenue ? `$${partner.monthlyRevenue}` : undefined}
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Context */}
      {partner.businessProfile && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Challenges */}
          {partner.businessProfile.painPoints && partner.businessProfile.painPoints.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <AlertCircle className="w-4 h-4" />
                  Current Challenges
                </CardTitle>
                <CardDescription>Areas that need improvement</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {partner.businessProfile.painPoints.map((point, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-sm"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Goals */}
          {partner.businessProfile.goals && partner.businessProfile.goals.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Target className="w-4 h-4" />
                  Business Goals
                </CardTitle>
                <CardDescription>What you're working towards</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {partner.businessProfile.goals.map((goal, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 text-sm"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
