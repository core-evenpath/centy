// src/components/partner/PartnerProfile.tsx
"use client";

import React from 'react';
import type { Partner } from '../../lib/types';
import { SUPPORTED_CURRENCIES } from '../../lib/business-persona-types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
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
  AlertCircle,
  BarChart3,
  Globe,
  DollarSign,
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
  // Get businessPersona data if available
  const persona = (partner as any).businessPersona;

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
    // Try businessPersona first, then fall back to partner.location
    const address = persona?.identity?.address;
    if (address?.city || address?.state) {
      const parts = [address.city, address.state].filter(Boolean);
      return parts.join(', ');
    }
    if (!partner.location) return null;
    const parts = [partner.location.city, partner.location.state].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  // Get business name from persona or partner
  const businessName = persona?.identity?.name || partner.businessName || partner.name;

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground text-xl font-bold shadow-lg">
                {(businessName || 'O').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{businessName}</h2>
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
              {persona?.setupProgress?.overallPercentage || partner.aiProfileCompleteness || 0}%
            </span>
          </div>
          <Progress value={persona?.setupProgress?.overallPercentage || partner.aiProfileCompleteness || 0} className="h-2" />
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
            <InfoRow
              icon={Mail}
              label="Email Address"
              value={persona?.identity?.email || partner.email}
            />
            <InfoRow
              icon={Phone}
              label="Phone Number"
              value={persona?.identity?.phone || partner.phone}
            />
            <InfoRow
              icon={MapPin}
              label="Location"
              value={formatLocation()}
            />
            {persona?.identity?.website && (
              <InfoRow
                icon={Globe}
                label="Website"
                value={persona.identity.website}
              />
            )}
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
            <InfoRow
              icon={Building2}
              label="Industry"
              value={persona?.identity?.industry?.name || partner.industry?.name}
            />
            {persona?.identity?.currency && (
              <InfoRow
                icon={DollarSign}
                label="Currency"
                value={(() => {
                  const currency = SUPPORTED_CURRENCIES.find(c => c.code === persona.identity.currency);
                  return currency ? `${currency.flag} ${currency.name} (${currency.symbol})` : persona.identity.currency;
                })()}
              />
            )}
            {partner.businessSize && (
              <InfoRow icon={Users} label="Business Size" value={partner.businessSize} />
            )}
            {partner.employeeCount && (
              <InfoRow icon={Users} label="Employee Count" value={partner.employeeCount} />
            )}
            {partner.monthlyRevenue && (
              <InfoRow
                icon={BarChart3}
                label="Monthly Revenue"
                value={(() => {
                  const currencyCode = persona?.identity?.currency;
                  const currency = currencyCode ? SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) : null;
                  const symbol = currency?.symbol || '$';
                  return `${symbol}${partner.monthlyRevenue.toLocaleString()}`;
                })()}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Business Personality - from persona */}
      {persona?.personality && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-4 h-4" />
              Brand Personality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {persona.personality.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">About</p>
                  <p className="text-sm">{persona.personality.description}</p>
                </div>
              )}
              {persona.personality.tagline && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tagline</p>
                  <p className="text-sm font-medium">{persona.personality.tagline}</p>
                </div>
              )}
              {persona.personality.uniqueSellingPoints?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">What Makes Us Special</p>
                  <div className="flex flex-wrap gap-2">
                    {persona.personality.uniqueSellingPoints.map((usp: string, i: number) => (
                      <Badge key={i} variant="secondary">{usp}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {persona.personality.voiceTone?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Communication Style</p>
                  <div className="flex flex-wrap gap-2">
                    {persona.personality.voiceTone.map((tone: string, i: number) => (
                      <Badge key={i} variant="outline" className="capitalize">{tone}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Context - legacy */}
      {partner.businessProfile && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Challenges */}
          {(partner.businessProfile as any).painPoints?.length > 0 && (
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
                  {(partner.businessProfile as any).painPoints.map((point: string, index: number) => (
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
          {partner.businessProfile.goals?.length > 0 && (
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
                  {partner.businessProfile.goals.map((goal: string, index: number) => (
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
