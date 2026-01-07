"use client";

import React, { useState } from 'react';
import Link from 'next/link';

// ============================================
// CAMPAIGNS PAGE - Campaign Management
// View, analyze, and manage all campaigns
// Matches broadcast-studio-final.jsx design
// ============================================

interface Campaign {
  id: number;
  title: string;
  channel: 'whatsapp' | 'telegram';
  status: 'sent' | 'scheduled' | 'draft';
  sentAt?: string;
  scheduledFor?: string;
  recipients: number;
  delivered?: number;
  read?: number;
  replied?: number;
  clicked?: number;
  message: string;
  hasImage: boolean;
  buttons: string[];
}

const CAMPAIGNS: Campaign[] = [
  {
    id: 1,
    title: 'New Year Wishes 2025',
    channel: 'whatsapp',
    status: 'sent',
    sentAt: '2025-01-01T10:30:00',
    recipients: 145,
    delivered: 142,
    read: 128,
    replied: 34,
    clicked: 0,
    message: `Happy New Year, {{name}}! 🎉✨\n\nWishing you joy, success, and new beginnings!\n\nMay this year bring you closer to your dream home! 🏠\n\nThank you for being part of Prime Properties.\n\nWarm regards,\nPriya`,
    hasImage: false,
    buttons: [],
  },
  {
    id: 2,
    title: 'Price Drop - Sea View 3BHK',
    channel: 'whatsapp',
    status: 'sent',
    sentAt: '2024-12-28T11:00:00',
    recipients: 67,
    delivered: 65,
    read: 58,
    replied: 12,
    clicked: 23,
    message: `Hi {{name}}! 📉\n\nGreat news! A property you viewed has a price drop:\n\n🏠 3BHK Sea View, Powai\n~~₹2.2 Cr~~ → ₹1.8 Cr\n\nThat's ₹40 Lakhs savings!\n\nInterested in revisiting?`,
    hasImage: true,
    buttons: ['Yes, interested!', 'Tell me more'],
  },
  {
    id: 3,
    title: 'Diwali Special Offers',
    channel: 'whatsapp',
    status: 'sent',
    sentAt: '2024-11-10T09:00:00',
    recipients: 156,
    delivered: 152,
    read: 134,
    replied: 45,
    clicked: 67,
    message: `Happy Diwali, {{name}}! 🪔✨\n\nExclusive festive offers just for you:\n\n✓ Zero brokerage on select properties\n✓ Free registration assistance\n✓ Lucky draw entry\n\nOffer valid till Nov 15!\n\nWarm regards,\nPriya`,
    hasImage: true,
    buttons: ['View Offers'],
  },
  {
    id: 4,
    title: 'Weekend Open House - Powai',
    channel: 'telegram',
    status: 'scheduled',
    scheduledFor: '2025-01-12T10:00:00',
    recipients: 89,
    message: `Hi {{name}}!\n\nYou're invited to an exclusive property showcase:\n\n📅 Sunday, Jan 12\n🕐 10 AM - 4 PM\n📍 Powai, Mumbai\n\n50+ buyers already confirmed.\n\nReply YES to reserve your spot.`,
    hasImage: true,
    buttons: ['Yes, I\'ll attend', 'Maybe next time'],
  },
  {
    id: 5,
    title: 'New Project Launch - Andheri',
    channel: 'whatsapp',
    status: 'scheduled',
    scheduledFor: '2025-01-15T11:00:00',
    recipients: 234,
    message: `Hi {{name}}! 🏗️\n\nExciting news! We're launching a new project in Andheri West.\n\n✨ Premium 2 & 3 BHK apartments\n✨ Starting from ₹95 Lakhs\n✨ Early bird discounts\n\nInterested in pre-launch prices?`,
    hasImage: true,
    buttons: ['Tell me more', 'Book a visit'],
  },
  {
    id: 6,
    title: 'Follow-up: Premium Clients',
    channel: 'whatsapp',
    status: 'draft',
    recipients: 0,
    message: `Hi {{name}}!\n\nJust checking in — still exploring property options?\n\nI have some new listings that might interest you.\n\nWhen's a good time for a quick chat?\n\nPriya`,
    hasImage: false,
    buttons: [],
  },
  {
    id: 7,
    title: 'Testimonial Request',
    channel: 'whatsapp',
    status: 'draft',
    recipients: 0,
    message: `Hi {{name}}! 🙏\n\nThank you for choosing Prime Properties!\n\nWould you mind sharing your experience? It helps other buyers.\n\nTakes just 2 minutes.\n\nThank you!`,
    hasImage: false,
    buttons: ['Happy to help!', 'Maybe later'],
  },
];

// Helper functions
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;

  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

const formatScheduledDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatFullDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

// Calculate performance metrics
const getPerformanceMetrics = (campaigns: Campaign[]) => {
  const sent = campaigns.filter(c => c.status === 'sent');
  if (sent.length === 0) return null;

  const totalSent = sent.reduce((a, c) => a + c.recipients, 0);
  const totalDelivered = sent.reduce((a, c) => a + (c.delivered || 0), 0);
  const totalRead = sent.reduce((a, c) => a + (c.read || 0), 0);
  const totalReplied = sent.reduce((a, c) => a + (c.replied || 0), 0);

  return {
    totalSent,
    deliveryRate: Math.round((totalDelivered / totalSent) * 100),
    readRate: Math.round((totalRead / totalDelivered) * 100),
    replyRate: Math.round((totalReplied / totalSent) * 100),
  };
};

interface Insight {
  type: 'success' | 'warning' | 'tip' | 'info';
  icon: string;
  title: string;
  text: string;
}

// AI-powered insights
const getAIInsights = (campaigns: Campaign[]): Insight[] => {
  const sent = campaigns.filter(c => c.status === 'sent');
  if (sent.length === 0) return [];

  const insights: Insight[] = [];

  // Best performing campaign
  const bestCampaign = sent.reduce((best, c) => {
    const rate = ((c.replied || 0) / c.recipients) * 100;
    const bestRate = ((best.replied || 0) / best.recipients) * 100;
    return rate > bestRate ? c : best;
  });
  const bestRate = Math.round(((bestCampaign.replied || 0) / bestCampaign.recipients) * 100);

  insights.push({
    type: 'success',
    icon: '🏆',
    title: 'Top Performer',
    text: `"${bestCampaign.title}" achieved ${bestRate}% reply rate — your best campaign!`,
  });

  // Campaigns with images vs without
  const withImage = sent.filter(c => c.hasImage);
  const withoutImage = sent.filter(c => !c.hasImage);

  if (withImage.length > 0 && withoutImage.length > 0) {
    const avgWithImage = withImage.reduce((a, c) => a + ((c.replied || 0) / c.recipients), 0) / withImage.length * 100;
    const avgWithoutImage = withoutImage.reduce((a, c) => a + ((c.replied || 0) / c.recipients), 0) / withoutImage.length * 100;

    if (avgWithImage > avgWithoutImage) {
      insights.push({
        type: 'tip',
        icon: '🖼️',
        title: 'Image Impact',
        text: `Campaigns with images get ${Math.round(avgWithImage - avgWithoutImage)}% more replies. Keep using them!`,
      });
    }
  }

  // Timing insight
  const hour = new Date().getHours();
  if (hour >= 10 && hour <= 12) {
    insights.push({
      type: 'tip',
      icon: '⏰',
      title: 'Best Time to Send',
      text: 'It\'s peak engagement hours (10 AM - 12 PM). Great time to send a campaign!',
    });
  }

  // Scheduled campaigns reminder
  const scheduled = campaigns.filter(c => c.status === 'scheduled');
  if (scheduled.length > 0) {
    const nextCampaign = scheduled[0];
    insights.push({
      type: 'info',
      icon: '📅',
      title: 'Coming Up',
      text: `"${nextCampaign.title}" scheduled for ${formatScheduledDate(nextCampaign.scheduledFor!)}`,
    });
  }

  // Draft reminder
  const drafts = campaigns.filter(c => c.status === 'draft');
  if (drafts.length > 0) {
    insights.push({
      type: 'warning',
      icon: '📝',
      title: 'Pending Drafts',
      text: `You have ${drafts.length} draft${drafts.length > 1 ? 's' : ''} waiting to be sent.`,
    });
  }

  return insights.slice(0, 3);
};

// Substitute variables for preview
const sub = (t: string | undefined) => t?.replace(/\{\{name\}\}/g, 'Rajesh').replace(/\{\{agent_name\}\}/g, 'Priya') || '';

// ============================================
// MAIN EXPORT
// ============================================
export default function CampaignsPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const filteredCampaigns = CAMPAIGNS.filter(c => {
    const matchesFilter = filter === 'all' || c.status === filter;
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: CAMPAIGNS.length,
    sent: CAMPAIGNS.filter(c => c.status === 'sent').length,
    scheduled: CAMPAIGNS.filter(c => c.status === 'scheduled').length,
    drafts: CAMPAIGNS.filter(c => c.status === 'draft').length,
  };

  const metrics = getPerformanceMetrics(CAMPAIGNS);
  const insights = getAIInsights(CAMPAIGNS);

  // ============================================
  // CAMPAIGN DETAIL VIEW
  // ============================================
  if (selectedCampaign) {
    const c = selectedCampaign;
    const isWA = c.channel === 'whatsapp';

    // Calculate campaign-specific insights
    const campaignInsights: { type: string; icon: string; text: string }[] = [];
    if (c.status === 'sent') {
      const replyRate = Math.round(((c.replied || 0) / c.recipients) * 100);
      const avgReplyRate = metrics?.replyRate || 20;

      if (replyRate > avgReplyRate) {
        campaignInsights.push({
          type: 'success',
          icon: '📈',
          text: `${replyRate}% reply rate is ${replyRate - avgReplyRate}% above your average. Great job!`,
        });
      } else {
        campaignInsights.push({
          type: 'tip',
          icon: '💡',
          text: `Consider adding a question at the end to boost replies. Messages with questions get 35% more responses.`,
        });
      }

      if (c.hasImage) {
        campaignInsights.push({
          type: 'success',
          icon: '🖼️',
          text: 'Image helped! Property images typically boost engagement by 3x.',
        });
      }

      if (c.buttons?.length > 0) {
        campaignInsights.push({
          type: 'success',
          icon: '▶️',
          text: `Quick reply buttons made it easy for ${c.replied} people to respond.`,
        });
      }
    }

    return (
      <div className="min-h-screen bg-stone-50">
        {/* Header */}
        <div className="bg-white border-b border-stone-200 sticky top-0 z-20">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedCampaign(null)} className="w-9 h-9 flex items-center justify-center hover:bg-stone-100 rounded-lg text-stone-500 transition-colors">
                ←
              </button>
              <div>
                <h1 className="font-semibold text-stone-900 text-sm">{c.title}</h1>
                <p className="text-xs text-stone-500">
                  {c.status === 'sent' && c.sentAt && formatDate(c.sentAt)}
                  {c.status === 'scheduled' && c.scheduledFor && `Scheduled for ${formatScheduledDate(c.scheduledFor)}`}
                  {c.status === 'draft' && 'Draft'}
                </p>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${c.status === 'sent' ? 'bg-emerald-50 text-emerald-700' :
              c.status === 'scheduled' ? 'bg-sky-50 text-sky-700' :
                'bg-stone-100 text-stone-600'
              }`}>
              {c.status === 'sent' ? '✓ Sent' : c.status === 'scheduled' ? '🕐 Scheduled' : '📄 Draft'}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4">
          {/* Stats for sent campaigns */}
          {c.status === 'sent' && (
            <div className="bg-white rounded-xl border border-stone-200 p-5 mb-4">
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-stone-900">{c.recipients}</div>
                  <div className="text-xs text-stone-500 mt-1">Sent</div>
                  <div className="w-full h-1 bg-stone-100 rounded-full mt-2">
                    <div className="h-full bg-stone-400 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-emerald-600">{Math.round(((c.delivered || 0) / c.recipients) * 100)}%</div>
                  <div className="text-xs text-stone-500 mt-1">Delivered</div>
                  <div className="w-full h-1 bg-emerald-100 rounded-full mt-2">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${((c.delivered || 0) / c.recipients) * 100}%` }} />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-sky-600">{Math.round(((c.read || 0) / (c.delivered || 1)) * 100)}%</div>
                  <div className="text-xs text-stone-500 mt-1">Read</div>
                  <div className="w-full h-1 bg-sky-100 rounded-full mt-2">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: `${((c.read || 0) / (c.delivered || 1)) * 100}%` }} />
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-violet-600">{Math.round(((c.replied || 0) / c.recipients) * 100)}%</div>
                  <div className="text-xs text-stone-500 mt-1">Replied</div>
                  <div className="w-full h-1 bg-violet-100 rounded-full mt-2">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${((c.replied || 0) / c.recipients) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scheduled info */}
          {c.status === 'scheduled' && c.scheduledFor && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center text-xl">🕐</div>
                  <div>
                    <div className="font-medium text-sky-900">Scheduled</div>
                    <div className="text-sm text-sky-700">{formatFullDate(c.scheduledFor)}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white border border-sky-200 rounded-lg text-sm font-medium text-sky-700 hover:bg-sky-50 transition-colors">
                    Reschedule
                  </button>
                  <button className="px-4 py-2 bg-white border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Draft actions */}
          {c.status === 'draft' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-xl">📝</div>
                  <div>
                    <div className="font-medium text-amber-900">Draft</div>
                    <div className="text-sm text-amber-700">This campaign hasn&apos;t been sent yet</div>
                  </div>
                </div>
                <Link href="/partner/broadcast" className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
                  Continue Editing →
                </Link>
              </div>
            </div>
          )}

          {/* AI Insights for campaign */}
          {campaignInsights.length > 0 && (
            <div className="space-y-2 mb-4">
              {campaignInsights.map((insight, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl ${insight.type === 'success' ? 'bg-emerald-50 text-emerald-800' :
                  insight.type === 'warning' ? 'bg-amber-50 text-amber-800' :
                    'bg-stone-100 text-stone-700'
                  }`}>
                  <span className="text-lg">{insight.icon}</span>
                  <p className="text-sm">{insight.text}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid lg:grid-cols-5 gap-4">
            {/* Message Preview */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-stone-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100">
                <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Message Preview</span>
              </div>
              <div className={`p-4 ${isWA ? 'bg-emerald-50/30' : 'bg-sky-50/30'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${isWA ? 'bg-emerald-600' : 'bg-sky-600'}`}>
                    PP
                  </div>
                  <div>
                    <div className="font-medium text-stone-900 text-sm">Prime Properties</div>
                    <div className="text-xs text-stone-500">{isWA ? 'WhatsApp Business' : 'Telegram'}</div>
                  </div>
                </div>
                <div className="max-w-[300px] ml-auto">
                  {c.hasImage && (
                    <div className="rounded-lg rounded-tr-sm mb-2 h-32 bg-white flex items-center justify-center text-stone-300 border border-stone-200">
                      🖼️ Property Image
                    </div>
                  )}
                  <div className="bg-white rounded-xl rounded-tr-sm p-3 shadow-sm">
                    <p className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">{sub(c.message)}</p>
                    <div className="text-[10px] text-stone-400 text-right mt-2">10:30 AM ✓✓</div>
                  </div>
                  {c.buttons?.map((btn, i) => (
                    <div key={i} className={`mt-1.5 rounded-lg py-2.5 text-center text-sm font-medium bg-white shadow-sm border border-stone-100 ${isWA ? 'text-emerald-600' : 'text-sky-600'}`}>
                      {btn}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Details & Actions */}
            <div className="lg:col-span-2 space-y-4">
              {/* Campaign Details */}
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">Details</div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-stone-100">
                    <span className="text-stone-500">Channel</span>
                    <span className={`font-medium ${isWA ? 'text-emerald-600' : 'text-sky-600'}`}>
                      {isWA ? '💬 WhatsApp' : '✈️ Telegram'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-stone-100">
                    <span className="text-stone-500">Recipients</span>
                    <span className="font-medium text-stone-900">{c.recipients || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-stone-100">
                    <span className="text-stone-500">Message length</span>
                    <span className="text-stone-700">{c.message.length} chars</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-stone-100">
                    <span className="text-stone-500">Image</span>
                    <span className="text-stone-700">{c.hasImage ? '✓ Attached' : '—'}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-stone-500">Quick replies</span>
                    <span className="text-stone-700">{c.buttons?.length ? `${c.buttons.length} buttons` : '—'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">Actions</div>
                <div className="space-y-2">
                  <button className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-sm font-medium text-stone-700 flex items-center justify-center gap-2 transition-colors">
                    📋 Duplicate Campaign
                  </button>
                  {c.status === 'sent' && (
                    <button className="w-full py-2.5 bg-violet-50 hover:bg-violet-100 rounded-lg text-sm font-medium text-violet-700 flex items-center justify-center gap-2 transition-colors">
                      📊 Download Report
                    </button>
                  )}
                  {c.status === 'sent' && (
                    <button className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 rounded-lg text-sm font-medium text-sky-700 flex items-center justify-center gap-2 transition-colors">
                      🔄 Resend to Non-responders
                    </button>
                  )}
                  <button className="w-full py-2.5 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-600 flex items-center justify-center gap-2 transition-colors">
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* Engagement Funnel for sent campaigns */}
              {c.status === 'sent' && (
                <div className="bg-white rounded-xl border border-stone-200 p-4">
                  <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-4">Engagement Funnel</div>
                  <div className="space-y-3">
                    {[
                      { label: 'Sent', value: c.recipients, pct: 100, color: 'bg-stone-400' },
                      { label: 'Delivered', value: c.delivered || 0, pct: Math.round(((c.delivered || 0) / c.recipients) * 100), color: 'bg-emerald-500' },
                      { label: 'Read', value: c.read || 0, pct: Math.round(((c.read || 0) / c.recipients) * 100), color: 'bg-sky-500' },
                      { label: 'Replied', value: c.replied || 0, pct: Math.round(((c.replied || 0) / c.recipients) * 100), color: 'bg-violet-500' },
                    ].map((step, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-stone-600">{step.label}</span>
                          <span className="font-medium text-stone-900">{step.value} <span className="text-stone-400 font-normal">({step.pct}%)</span></span>
                        </div>
                        <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div className={`h-full ${step.color} rounded-full transition-all`} style={{ width: `${step.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN LIST VIEW
  // ============================================
  return (
    <div className="h-full flex flex-col bg-stone-50 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-stone-900">Campaigns</h1>
              <p className="text-stone-500 mt-1">{stats.total} total campaigns</p>
            </div>
            <Link href="/partner/broadcast" className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors">
              + New Campaign
            </Link>
          </div>

          {/* Performance Overview */}
          {metrics && (
            <div className="bg-white rounded-xl border border-stone-200 p-5 mb-6">
              <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-4">Performance Overview</div>
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-semibold text-stone-900">{metrics.totalSent}</div>
                  <div className="text-xs text-stone-500 mt-1">Messages Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-semibold text-emerald-600">{metrics.deliveryRate}%</div>
                  <div className="text-xs text-stone-500 mt-1">Avg. Delivery</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-semibold text-sky-600">{metrics.readRate}%</div>
                  <div className="text-xs text-stone-500 mt-1">Avg. Read Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-semibold text-violet-600">{metrics.replyRate}%</div>
                  <div className="text-xs text-stone-500 mt-1">Avg. Reply Rate</div>
                </div>
              </div>
            </div>
          )}

          {/* AI Insights */}
          {insights.length > 0 && (
            <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-violet-600">✨</span>
                <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">AI Insights</span>
              </div>
              <div className="space-y-3">
                {insights.map((insight, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${insight.type === 'success' ? 'bg-emerald-50' :
                    insight.type === 'warning' ? 'bg-amber-50' :
                      insight.type === 'tip' ? 'bg-violet-50' :
                        'bg-sky-50'
                    }`}>
                    <span className="text-lg">{insight.icon}</span>
                    <div>
                      <div className={`font-medium text-sm ${insight.type === 'success' ? 'text-emerald-900' :
                        insight.type === 'warning' ? 'text-amber-900' :
                          insight.type === 'tip' ? 'text-violet-900' :
                            'text-sky-900'
                        }`}>{insight.title}</div>
                      <div className={`text-sm ${insight.type === 'success' ? 'text-emerald-700' :
                        insight.type === 'warning' ? 'text-amber-700' :
                          insight.type === 'tip' ? 'text-violet-700' :
                            'text-sky-700'
                        }`}>{insight.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Filter Tabs */}
            <div className="flex gap-1 bg-white rounded-xl border border-stone-200 p-1">
              {[
                { id: 'all', label: 'All', count: stats.total },
                { id: 'sent', label: 'Sent', count: stats.sent },
                { id: 'scheduled', label: 'Scheduled', count: stats.scheduled },
                { id: 'draft', label: 'Drafts', count: stats.drafts },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f.id
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                    }`}
                >
                  {f.label}
                  {f.count > 0 && (
                    <span className={`ml-1.5 ${filter === f.id ? 'text-white/70' : 'text-stone-400'}`}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">🔍</span>
              <input
                type="text"
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
              />
            </div>
          </div>

          {/* Campaign List */}
          <div className="space-y-3">
            {filteredCampaigns.length === 0 ? (
              <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
                <span className="text-4xl block mb-3">📭</span>
                <h3 className="font-semibold text-stone-900 mb-1">No campaigns found</h3>
                <p className="text-sm text-stone-500">
                  {search ? 'Try a different search term' : 'Create your first campaign to get started'}
                </p>
              </div>
            ) : (
              filteredCampaigns.map(campaign => {
                const isWA = campaign.channel === 'whatsapp';

                return (
                  <div
                    key={campaign.id}
                    onClick={() => setSelectedCampaign(campaign)}
                    className="bg-white rounded-xl border border-stone-200 p-4 hover:shadow-md hover:border-stone-300 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Channel Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl text-white flex-shrink-0 ${isWA ? 'bg-emerald-600' : 'bg-sky-600'}`}>
                        {isWA ? '💬' : '✈️'}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-stone-900 group-hover:text-violet-600 transition-colors">
                            {campaign.title}
                          </h3>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0 ml-3 ${campaign.status === 'sent' ? 'bg-emerald-50 text-emerald-700' :
                            campaign.status === 'scheduled' ? 'bg-sky-50 text-sky-700' :
                              'bg-stone-100 text-stone-600'
                            }`}>
                            {campaign.status === 'sent' ? '✓ Sent' : campaign.status === 'scheduled' ? '🕐 Scheduled' : '📄 Draft'}
                          </span>
                        </div>

                        <p className="text-sm text-stone-500 truncate mb-2">
                          {sub(campaign.message).slice(0, 80)}...
                        </p>

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 text-xs">
                          {campaign.status === 'sent' && campaign.sentAt && (
                            <>
                              <span className="text-stone-500">
                                <strong className="text-stone-700">{campaign.recipients}</strong> sent
                              </span>
                              <span>
                                <strong className="text-emerald-600">{Math.round(((campaign.delivered || 0) / campaign.recipients) * 100)}%</strong>
                                <span className="text-stone-400 ml-1">delivered</span>
                              </span>
                              <span>
                                <strong className="text-sky-600">{Math.round(((campaign.read || 0) / (campaign.delivered || 1)) * 100)}%</strong>
                                <span className="text-stone-400 ml-1">read</span>
                              </span>
                              <span>
                                <strong className="text-violet-600">{Math.round(((campaign.replied || 0) / campaign.recipients) * 100)}%</strong>
                                <span className="text-stone-400 ml-1">replied</span>
                              </span>
                              <span className="text-stone-400 ml-auto">{formatDate(campaign.sentAt)}</span>
                            </>
                          )}
                          {campaign.status === 'scheduled' && campaign.scheduledFor && (
                            <>
                              <span className="text-sky-600">
                                🕐 {formatScheduledDate(campaign.scheduledFor)}
                              </span>
                              <span className="text-stone-500">
                                {campaign.recipients} recipients
                              </span>
                            </>
                          )}
                          {campaign.status === 'draft' && (
                            <span className="text-stone-400">
                              Not sent yet
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <span className="text-stone-300 group-hover:text-stone-500 group-hover:translate-x-1 transition-all self-center flex-shrink-0">
                        →
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Tips */}
          <div className="mt-8 bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl border border-violet-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-violet-600">💡</span>
              <span className="font-medium text-violet-900 text-sm">Tips to Improve</span>
            </div>
            <ul className="space-y-2 text-sm text-violet-700">
              <li className="flex items-start gap-2">
                <span className="text-violet-400">→</span>
                Messages sent between 10 AM - 12 PM get 23% higher engagement
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400">→</span>
                Add images to property listings for 3x more responses
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400">→</span>
                Follow up with non-responders after 3-5 days for best results
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400">→</span>
                End messages with a question to encourage replies (+35% response rate)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
