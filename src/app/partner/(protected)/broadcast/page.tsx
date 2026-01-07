"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { createCampaignAction } from '@/actions/broadcast-actions';
import { useToast } from '@/hooks/use-toast';
import RecipientSelector from '@/components/partner/broadcast/RecipientSelector';

// ============================================
// CENTY BROADCAST - AI Marketing Co-pilot
// Chat-based campaign creation with smart AI
// Clean, modern YC-style design
// Firebase-integrated for real data
// ============================================

const TEMPLATES = [
  {
    id: 'intro', icon: '👋', title: 'Introduce Yourself', desc: 'First message to new clients', category: 'engagement', popular: true,
    message: `Hi {{name}}! 👋\n\nI'm {{agent_name}} from *{{business_name}}*.\n\nI specialize in helping clients find their perfect property. Whether you're looking to buy, sell, or invest — I'm here to help.\n\nFeel free to reach out anytime!\n\nBest regards,\n{{agent_name}}`,
    tips: ['Great for new leads', 'Sets professional tone', 'Builds trust early']
  },
  {
    id: 'listing', icon: '🏠', title: 'Property Alert', desc: 'Announce new listings', category: 'property', popular: true,
    message: `Hi {{name}}! 🏠\n\nNew listing matching your criteria:\n\n📍 *{{property_name}}*\n💰 {{price}}\n\n✓ Prime location\n✓ Ready to move\n✓ Loan approved\n\nInterested in a visit this week?`,
    tips: ['Include key specs upfront', 'Add image for 3x engagement', 'End with clear CTA']
  },
  {
    id: 'event', icon: '📅', title: 'Event Invitation', desc: 'Open house & launches', category: 'event', popular: true,
    message: `Hi {{name}}!\n\nYou're invited to an exclusive property showcase:\n\n📅 *{{date}}*\n🕐 10 AM - 4 PM\n📍 {{venue}}\n\n50+ buyers already confirmed.\n\nReply YES to reserve your spot.`,
    tips: ['Social proof increases signups 45%', 'Clear date/time/venue', 'Simple RSVP mechanism']
  },
  {
    id: 'festive', icon: '🎉', title: 'Festive Greetings', desc: 'Seasonal wishes', category: 'engagement', popular: false,
    message: `Happy {{festival}}, {{name}}! 🎉\n\nWishing you and your family joy, prosperity, and new beginnings.\n\nMay this year bring you closer to your dream home!\n\nWarm regards,\n{{agent_name}}\n*{{business_name}}*`,
    tips: ['Send in morning for best engagement', 'Personal touch matters', 'Great for re-engagement']
  },
  {
    id: 'offer', icon: '🏷️', title: 'Special Offer', desc: 'Deals with urgency', category: 'promotional', popular: true,
    message: `Hi {{name}}! 🎯\n\n*Limited Time Offer*\n\nBook before *{{deadline}}* and get:\n\n✓ Zero brokerage (Save ₹2L+)\n✓ Free registration\n✓ Priority support\n\n⏰ Only 5 slots left!\n\nInterested?`,
    tips: ['Deadlines boost conversions 32%', 'Clear value proposition', 'Scarcity drives action']
  },
  {
    id: 'followup', icon: '🔄', title: 'Follow-up', desc: 'Re-engage leads', category: 'engagement', popular: false,
    message: `Hi {{name}}!\n\nJust checking in — still exploring property options?\n\nI have some new listings that might interest you:\n\n🏠 New projects in your preferred areas\n💰 Better financing options available\n\nWhen's a good time for a quick chat?\n\n{{agent_name}}`,
    tips: ['Non-pushy tone works best', 'Provide value/updates', 'Easy response path']
  },
  {
    id: 'pricedrop', icon: '📉', title: 'Price Drop', desc: 'Price reduction alerts', category: 'property', popular: false,
    message: `Hi {{name}}! 📉\n\nGreat news! A property you viewed has a *price drop*:\n\n🏠 *{{property_name}}*\n~~₹2.2 Cr~~ → *{{price}}*\n\nThat's ₹40 Lakhs savings!\n\nInterested in revisiting?`,
    tips: ['Reference past interest', 'Show clear savings', 'Create urgency']
  },
  {
    id: 'review', icon: '⭐', title: 'Request Review', desc: 'Get testimonials', category: 'engagement', popular: false,
    message: `Hi {{name}}! 🙏\n\nThank you for choosing *{{business_name}}*!\n\nYour feedback helps us improve. Would you mind sharing your experience?\n\n⭐ Takes just 2 minutes\n⭐ Helps other buyers decide\n\nThank you!\n{{agent_name}}`,
    tips: ['Best sent post-transaction', 'Make it easy', 'Express gratitude']
  },
];

const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'property', label: 'Property' },
  { id: 'promotional', label: 'Promotional' },
  { id: 'event', label: 'Events' },
];

const VARIABLES = [
  { token: '{{name}}', label: 'Client Name', preview: 'Rajesh' },
  { token: '{{agent_name}}', label: 'Your Name', preview: 'Priya' },
  { token: '{{business_name}}', label: 'Business', preview: 'Prime Properties' },
  { token: '{{property_name}}', label: 'Property', preview: '3BHK Sea View, Powai' },
  { token: '{{price}}', label: 'Price', preview: '₹1.8 Cr' },
  { token: '{{date}}', label: 'Date', preview: 'Sunday, Jan 12' },
  { token: '{{venue}}', label: 'Venue', preview: 'Powai, Mumbai' },
  { token: '{{deadline}}', label: 'Deadline', preview: 'Jan 31' },
  { token: '{{festival}}', label: 'Festival', preview: 'New Year' },
];

// GROUPS and CLIENTS are now loaded from Firebase Firestore
// See RecipientSelector component for the implementation

// Substitute variables for preview
const sub = (t: string | undefined) => t?.replace(/\{\{name\}\}/g, 'Rajesh').replace(/\{\{agent_name\}\}/g, 'Priya').replace(/\{\{business_name\}\}/g, 'Prime Properties').replace(/\{\{property_name\}\}/g, '3BHK Sea View, Powai').replace(/\{\{price\}\}/g, '₹1.8 Cr').replace(/\{\{date\}\}/g, 'Sunday, Jan 12').replace(/\{\{venue\}\}/g, 'Powai, Mumbai').replace(/\{\{deadline\}\}/g, 'Jan 31').replace(/\{\{festival\}\}/g, 'New Year') || '';

// Calculate campaign score with detailed breakdown
const calcScore = (msg: string, hasImage: boolean, buttons: string[]) => {
  if (!msg) return { score: 0, breakdown: [] as { label: string; points: number; positive: boolean }[] };
  let score = 30;
  const breakdown: { label: string; points: number; positive: boolean }[] = [];

  if (msg.length > 20 && msg.length < 300) { score += 15; breakdown.push({ label: 'Good length', points: 15, positive: true }); }
  else if (msg.length >= 300) { breakdown.push({ label: 'Message too long', points: 0, positive: false }); }

  if (msg.includes('{{name}}')) { score += 20; breakdown.push({ label: 'Personalized', points: 20, positive: true }); }
  else { breakdown.push({ label: 'Add personalization', points: 0, positive: false }); }

  if (/[🎉🎯🏠💰📍✅⭐👋✨📅🔥]/.test(msg)) { score += 10; breakdown.push({ label: 'Has emojis', points: 10, positive: true }); }

  if (msg.includes('?')) { score += 10; breakdown.push({ label: 'Ends with question', points: 10, positive: true }); }
  else { breakdown.push({ label: 'Add a question', points: 0, positive: false }); }

  if (hasImage) { score += 10; breakdown.push({ label: 'Image attached', points: 10, positive: true }); }
  if (buttons?.length) { score += 5; breakdown.push({ label: 'Has buttons', points: 5, positive: true }); }

  return { score: Math.min(score, 100), breakdown };
};

// Smart AI insights based on message content and context
const getSmartInsights = (msg: string, hasImage: boolean) => {
  const insights: { type: string; icon: string; text: string }[] = [];
  const hour = new Date().getHours();

  if (!msg) return insights;

  // Length insights
  if (msg.length > 300) {
    insights.push({ type: 'warning', icon: '📏', text: 'Long messages have 25% lower read rates. Consider trimming to under 200 characters.' });
  }

  // Personalization
  if (!msg.includes('{{name}}') && msg.length > 30) {
    insights.push({ type: 'tip', icon: '👤', text: 'Add {{name}} — personalized messages get 26% higher open rates.' });
  }

  // Image suggestion for property messages
  if ((msg.toLowerCase().includes('property') || msg.toLowerCase().includes('bhk') || msg.toLowerCase().includes('listing')) && !hasImage) {
    insights.push({ type: 'tip', icon: '🖼️', text: 'Property messages with images get 3x more responses.' });
  }

  // Question CTA
  if (!msg.includes('?') && msg.length > 100) {
    insights.push({ type: 'tip', icon: '❓', text: 'End with a question to encourage replies (+35% response rate).' });
  }

  // Timing insights
  if (hour >= 10 && hour <= 12) {
    insights.push({ type: 'success', icon: '⏰', text: 'Great timing! 10 AM - 12 PM has the highest engagement rates.' });
  } else if (hour >= 21 || hour <= 7) {
    insights.push({ type: 'warning', icon: '🌙', text: 'Late messages get fewer reads. Consider scheduling for 10 AM tomorrow.' });
  }

  // Success indicators
  if (hasImage && msg.includes('{{name}}') && msg.includes('?')) {
    insights.push({ type: 'success', icon: '🎯', text: 'This message has all key engagement elements. Great job!' });
  }

  return insights.slice(0, 2);
};

// Detect message type/intent
const detectIntent = (text: string) => {
  const lower = text.toLowerCase();
  if (lower.includes('year') || lower.includes('wish') || lower.includes('festive') || lower.includes('diwali') || lower.includes('christmas')) return 'festive';
  if (lower.includes('property') || lower.includes('listing') || lower.includes('bhk') || lower.includes('flat') || lower.includes('apartment')) return 'listing';
  if (lower.includes('offer') || lower.includes('deal') || lower.includes('discount') || lower.includes('save')) return 'offer';
  if (lower.includes('event') || lower.includes('invite') || lower.includes('open house') || lower.includes('launch')) return 'event';
  if (lower.includes('follow') || lower.includes('check in') || lower.includes('touch base')) return 'followup';
  if (lower.includes('intro') || lower.includes('hello') || lower.includes('first message')) return 'intro';
  if (lower.includes('price drop') || lower.includes('reduced')) return 'pricedrop';
  if (lower.includes('review') || lower.includes('feedback') || lower.includes('testimonial')) return 'review';
  return 'intro';
};

interface Template {
  id: string;
  icon: string;
  title: string;
  desc: string;
  category: string;
  popular: boolean;
  message: string;
  tips: string[];
}

interface Campaign {
  message: string;
  hasImage: boolean;
  buttons: string[];
  fromTemplate?: Template;
  recipientType?: 'group' | 'individual' | 'all';
  groupIds?: string[];
  contactIds?: string[];
  recipientCount?: number;
}

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  tip?: string;
  suggestions?: string[];
}

// ============================================
// MAIN EXPORT
// ============================================
export default function BroadcastPage() {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const { toast } = useToast();
  const [view, setView] = useState<'home' | 'studio' | 'recipients' | 'review' | 'success'>('home');
  const [channel, setChannel] = useState<'whatsapp' | 'telegram'>('whatsapp');
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [initialPrompt, setInitialPrompt] = useState('');

  const partnerId = currentWorkspace?.partnerId;

  const startWithPrompt = (prompt: string) => {
    setInitialPrompt(prompt);
    setView('studio');
  };

  const startWithTemplate = (template: Template) => {
    setCampaign({ message: template.message, hasImage: false, buttons: [], fromTemplate: template });
    setView('studio');
  };

  // Handle recipient selection
  const handleRecipientsSelected = (recipientData: {
    recipientType: 'group' | 'individual' | 'all';
    groupIds?: string[];
    contactIds?: string[];
    recipientCount: number;
  }) => {
    setCampaign(prev => ({ ...prev!, ...recipientData }));
    setView('review');
  };

  if (view === 'studio') {
    return <CampaignStudio channel={channel} initialPrompt={initialPrompt} existingCampaign={campaign} onBack={() => { setView('home'); setInitialPrompt(''); setCampaign(null); }} onComplete={(data) => { setCampaign(data); setView('recipients'); }} />;
  }
  if (view === 'recipients' && partnerId) {
    return (
      <RecipientSelector
        channel={channel}
        partnerId={partnerId}
        onBack={() => setView('studio')}
        onContinue={handleRecipientsSelected}
      />
    );
  }
  if (view === 'review') {
    return <ReviewStep channel={channel} campaign={campaign!} onBack={() => setView('recipients')} onSend={async () => {
      // Save campaign to Firebase before showing success
      if (partnerId && currentWorkspace?.uid) {
        try {
          await createCampaignAction(partnerId, currentWorkspace.uid, {
            title: campaign!.message.slice(0, 50) + '...',
            channel,
            status: 'draft', // Can be updated to 'sent' or 'scheduled'
            message: campaign!.message,
            hasImage: campaign!.hasImage || false,
            buttons: campaign!.buttons || [],
            recipientType: campaign!.recipientType || 'individual',
            groupIds: campaign!.groupIds,
            contactIds: campaign!.contactIds,
            recipientCount: campaign!.recipientCount || 0,
          });
          toast({ title: 'Campaign Saved', description: 'Your campaign has been saved successfully.' });
        } catch (error: any) {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to save campaign: ' + error.message });
        }
      }
      setView('success');
    }} />;
  }
  if (view === 'success') {
    return <SuccessView channel={channel} campaign={campaign!} onDone={() => { setCampaign(null); setInitialPrompt(''); setView('home'); }} />;
  }

  const isWA = channel === 'whatsapp';

  // ============================================
  // HOME VIEW
  // ============================================
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-stone-900">Broadcast</h1>
          <p className="text-stone-500 mt-1">Create and send campaigns to your clients</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          {/* Channel Tabs */}
          <div className="flex border-b border-stone-100">
            {[
              { id: 'whatsapp' as const, label: 'WhatsApp', icon: '💬' },
              { id: 'telegram' as const, label: 'Telegram', icon: '✈️' },
            ].map(ch => (
              <button
                key={ch.id}
                onClick={() => setChannel(ch.id)}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${channel === ch.id ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
              >
                <span className="mr-2">{ch.icon}</span>
                {ch.label}
                {channel === ch.id && (
                  <div className={`absolute bottom-0 left-1/4 right-1/4 h-0.5 ${ch.id === 'whatsapp' ? 'bg-emerald-500' : 'bg-sky-500'}`} />
                )}
              </button>
            ))}
            <button disabled className="flex-1 py-4 text-sm font-medium text-stone-300 cursor-not-allowed">
              ✉️ Email <span className="text-xs ml-1 opacity-60">Soon</span>
            </button>
          </div>

          {/* AI Input */}
          <div className="p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg flex-shrink-0">
                ✨
              </div>
              <div>
                <h2 className="font-medium text-stone-900">What would you like to tell your clients?</h2>
                <p className="text-sm text-stone-500 mt-0.5">Describe your message and AI will help you craft the perfect campaign</p>
              </div>
            </div>

            <div className="relative">
              <textarea
                id="mainPrompt"
                placeholder="e.g., Send new year wishes to all my clients..."
                className="w-full px-4 py-4 bg-stone-50 border border-stone-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300 focus:bg-white transition-all h-28"
                onKeyDown={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  if (e.key === 'Enter' && !e.shiftKey && target.value.trim()) {
                    e.preventDefault();
                    startWithPrompt(target.value);
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById('mainPrompt') as HTMLTextAreaElement;
                  if (input.value.trim()) startWithPrompt(input.value);
                }}
                className={`absolute right-3 bottom-3 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-all ${isWA ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'}`}
              >
                Create with AI →
              </button>
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2 mt-4">
              {['New year wishes', 'Property announcement', 'Event invitation', 'Special offer', 'Follow-up message'].map(prompt => (
                <button
                  key={prompt}
                  onClick={() => startWithPrompt(prompt)}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-full text-sm text-stone-600 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center px-6">
            <div className="flex-1 h-px bg-stone-100" />
            <span className="px-4 text-xs text-stone-400 font-medium">OR USE A TEMPLATE</span>
            <div className="flex-1 h-px bg-stone-100" />
          </div>

          {/* Templates */}
          <div className="p-6 pt-4">
            <div className="space-y-2">
              {TEMPLATES.filter(t => t.popular).map(template => (
                <button
                  key={template.id}
                  onClick={() => startWithTemplate(template)}
                  className="w-full flex items-center gap-4 p-4 bg-stone-50 hover:bg-stone-100 rounded-xl text-left transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                    {template.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-stone-900">{template.title}</div>
                    <div className="text-sm text-stone-500">{template.desc}</div>
                  </div>
                  <span className="text-stone-300 group-hover:text-stone-500 group-hover:translate-x-1 transition-all">→</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setView('studio')}
              className="w-full mt-3 py-2.5 text-sm text-stone-500 hover:text-violet-600 font-medium transition-colors"
            >
              View all {TEMPLATES.length} templates →
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Campaigns', value: '12', color: 'text-stone-900' },
            { label: 'Delivered', value: '98%', color: 'text-emerald-600' },
            { label: 'Read Rate', value: '85%', color: 'text-sky-600' },
            { label: 'Replies', value: '23%', color: 'text-violet-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl border border-stone-200 p-4 text-center">
              <div className={`text-xl font-semibold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-stone-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// CAMPAIGN STUDIO - Chat-based AI Interface
// ============================================
interface CampaignStudioProps {
  channel: 'whatsapp' | 'telegram';
  initialPrompt: string;
  existingCampaign: Campaign | null;
  onBack: () => void;
  onComplete: (data: Campaign) => void;
}

function CampaignStudio({ channel, initialPrompt, existingCampaign, onBack, onComplete }: CampaignStudioProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [campaignMsg, setCampaignMsg] = useState(existingCampaign?.message || '');
  const [hasImage, setHasImage] = useState(existingCampaign?.hasImage || false);
  const [buttons, setButtons] = useState<string[]>(existingCampaign?.buttons || []);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [templateCategory, setTemplateCategory] = useState('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isWA = channel === 'whatsapp';
  const { score, breakdown } = calcScore(campaignMsg, hasImage, buttons);
  const insights = getSmartInsights(campaignMsg, hasImage);

  // Initialize conversation
  useEffect(() => {
    if (existingCampaign?.fromTemplate) {
      setMessages([{
        id: '1',
        type: 'ai',
        content: `I've loaded the "${existingCampaign.fromTemplate.title}" template for you.\n\nThis template works well because it ${existingCampaign.fromTemplate.tips[0].toLowerCase()}.\n\nFeel free to customize it, or tell me what changes you'd like!`,
        suggestions: ['Make it shorter', 'More professional', 'Add urgency', 'Looks perfect!'],
      }]);
    } else if (initialPrompt) {
      setMessages([{ id: '0', type: 'user', content: initialPrompt }]);
      processInput(initialPrompt);
    } else {
      setMessages([{
        id: '1',
        type: 'ai',
        content: `Hi! I'm your AI marketing co-pilot. ✨\n\nTell me what you want to communicate to your clients, and I'll help you craft the perfect ${isWA ? 'WhatsApp' : 'Telegram'} message.\n\nYou can also browse templates or just start typing your message directly.`,
        suggestions: ['New year wishes', 'Announce a property', 'Send an offer', 'Browse templates'],
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Process user input and generate AI response
  const processInput = async (text: string, template: Template | null = null) => {
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

    const lower = text.toLowerCase();
    let newMsg = campaignMsg;
    let response = '';
    let tip = '';
    let suggestions: string[] = [];

    // Template selection
    if (template) {
      newMsg = template.message;
      response = `Great choice! "${template.title}" is one of our best performers.\n\n**Why this works:**\n${template.tips.map(t => `• ${t}`).join('\n')}\n\nCustomize it as needed, or let me know what changes you'd like.`;
      suggestions = ['Make shorter', 'More professional', 'Add image', 'Looks perfect!'];
      setShowTemplates(false);
    }
    // Browse templates
    else if (lower.includes('template') || lower.includes('browse')) {
      setShowTemplates(true);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Here are proven templates organized by category. Pick one to get started!',
        suggestions: [],
      }]);
      return;
    }
    // Generate new message
    else if (!campaignMsg || lower.includes('start over') || lower.includes('new message')) {
      const intent = detectIntent(text);
      const matchedTemplate = TEMPLATES.find(t => t.id === intent) || TEMPLATES.find(t => t.id === 'intro');

      newMsg = matchedTemplate!.message;
      const intentLabel = intent === 'festive' ? 'festive greeting' : intent === 'listing' ? 'property announcement' : intent === 'offer' ? 'promotional offer' : intent === 'event' ? 'event invitation' : intent === 'followup' ? 'follow-up message' : 'professional message';

      response = `I've drafted a ${intentLabel} for you.\n\n**Key elements included:**\n• Personalized with client's name\n• Clear value proposition\n• Professional sign-off\n\nEdit the preview on the right, or ask me for changes!`;
      tip = matchedTemplate!.tips[0];
      suggestions = ['Make shorter', 'More formal', 'Add urgency', 'Looks good!'];
    }
    // Modifications
    else {
      if (lower.includes('shorter') || lower.includes('concise') || lower.includes('brief')) {
        const lines = campaignMsg.split('\n').filter(l => l.trim());
        newMsg = lines.slice(0, Math.max(4, Math.floor(lines.length * 0.6))).join('\n');
        response = 'Trimmed it down. Shorter messages typically have 20% higher completion rates.';
        suggestions = ['Even shorter', 'Add urgency', 'Perfect!'];
      } else if (lower.includes('longer') || lower.includes('more detail') || lower.includes('expand')) {
        newMsg = campaignMsg + '\n\n*Why choose us?*\n✓ 10+ years experience\n✓ 500+ happy clients\n✓ Best price guarantee';
        response = 'Added more details with social proof elements. Credibility markers help build trust.';
        suggestions = ['Make shorter', 'Different details', 'Good!'];
      } else if (lower.includes('formal') || lower.includes('professional')) {
        newMsg = campaignMsg.replace(/!/g, '.').replace(/Hi /g, 'Dear ').replace(/Hey /g, 'Dear ').replace(/👋|😊|🎉|✨|🎯/g, '');
        response = 'Made it more formal and professional. This tone works better for corporate clients.';
        suggestions = ['More friendly', 'Add urgency', 'Perfect!'];
      } else if (lower.includes('casual') || lower.includes('friendly') || lower.includes('warm')) {
        newMsg = campaignMsg.replace(/Dear /g, 'Hey ').replace(/\./g, '!');
        response = 'Now it\'s warmer and more conversational. Great for building rapport!';
        suggestions = ['More formal', 'Add emojis', 'Looks good!'];
      } else if (lower.includes('urgent') || lower.includes('urgency') || lower.includes('fomo')) {
        newMsg = campaignMsg + '\n\n⏰ *This offer expires soon!*';
        response = 'Added urgency. Deadlines increase conversion rates by 32%.';
        tip = 'Be honest with urgency — false scarcity hurts trust long-term.';
        suggestions = ['Remove urgency', 'Stronger CTA', 'Perfect!'];
      } else if (lower.includes('emoji')) {
        newMsg = campaignMsg.replace(/\n\n/g, ' ✨\n\n');
        response = 'Added emojis as visual anchors. 1-2 emojis can boost engagement by 25%.';
        suggestions = ['Remove emojis', 'Different emojis', 'Great!'];
      } else if (lower.includes('image') || lower.includes('photo') || lower.includes('picture')) {
        setHasImage(true);
        response = 'Image placeholder added! You can upload the actual image when sending.\n\nProperty images typically get 3x more responses.';
        suggestions = ['Add buttons too', 'Remove image', 'Looks good!'];
        setIsTyping(false);
        setMessages(prev => [...prev, { id: Date.now().toString(), type: 'ai', content: response, suggestions }]);
        return;
      } else if (lower.includes('button') || lower.includes('cta') || lower.includes('quick reply')) {
        setButtons(['Yes, interested!', 'Tell me more', 'Not now']);
        response = 'Added quick reply buttons. These make it easy for clients to respond with one tap.';
        suggestions = ['Change buttons', 'Remove buttons', 'Perfect!'];
        setIsTyping(false);
        setMessages(prev => [...prev, { id: Date.now().toString(), type: 'ai', content: response, suggestions }]);
        return;
      } else if (lower.includes('remove image')) {
        setHasImage(false);
        response = 'Image removed.';
        suggestions = ['Add it back', 'Continue'];
      } else if (lower.includes('remove button')) {
        setButtons([]);
        response = 'Buttons removed.';
        suggestions = ['Add them back', 'Continue'];
      } else if (lower.includes('perfect') || lower.includes('looks good') || lower.includes('great') || lower.includes('done') || lower.includes('ready')) {
        response = 'Excellent! Your campaign looks ready to go. 🚀\n\nClick "Select Recipients" to choose who should receive this message.';
        suggestions = ['Select recipients', 'More changes'];
      } else if (lower.includes('select recipients') || lower.includes('continue') || lower.includes('next')) {
        setIsTyping(false);
        onComplete({ message: campaignMsg, hasImage, buttons });
        return;
      } else {
        // Try to understand the request
        response = 'I\'ve noted your feedback. What specific changes would you like me to make?';
        suggestions = ['Make shorter', 'More formal', 'Add image', 'It\'s good!'];
      }
    }

    setCampaignMsg(newMsg);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'ai',
      content: response,
      tip,
      suggestions,
    }]);
    setIsTyping(false);
  };

  const handleSend = (text: string, template: Template | null = null) => {
    if (!text?.trim() && !template) return;

    if (!template) {
      setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', content: text.trim() }]);
    }
    setInput('');
    processInput(text || '', template);
  };

  const handleVariableInsert = (v: { token: string; label: string; preview: string }) => {
    const newMsg = campaignMsg ? campaignMsg + ' ' + v.token : `Hi ${v.token}! 👋\n\n`;
    setCampaignMsg(newMsg);
    setShowVariables(false);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'ai',
      content: `Added ${v.label}. This will show as "${v.preview}" for each recipient.`,
      suggestions: ['Add another variable', 'Continue editing'],
    }]);
  };

  const filteredTemplates = templateCategory === 'all' ? TEMPLATES : TEMPLATES.filter(t => t.category === templateCategory);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center hover:bg-stone-100 rounded-lg text-stone-500 transition-colors">
              ←
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm">✨</div>
              <div>
                <h1 className="font-semibold text-stone-900 text-sm">Campaign Studio</h1>
                <p className="text-xs text-stone-500">AI-powered editor</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isWA ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>
              {isWA ? '💬' : '✈️'} {isWA ? 'WhatsApp' : 'Telegram'}
            </div>
            {campaignMsg && (
              <button
                onClick={() => onComplete({ message: campaignMsg, hasImage, buttons })}
                className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${isWA ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'}`}
              >
                Select Recipients →
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid lg:grid-cols-5 gap-5">
          {/* Left: Chat Interface */}
          <div className="lg:col-span-3 space-y-4">
            {/* Chat Messages */}
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <div className="p-4 space-y-4 min-h-[320px] max-h-[420px] overflow-y-auto">
                {messages.map(msg => (
                  <div key={msg.id}>
                    {msg.type === 'ai' ? (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm flex-shrink-0">✨</div>
                        <div className="flex-1 space-y-2">
                          <div className="bg-stone-50 rounded-xl rounded-tl-sm px-4 py-3">
                            <p className="text-sm text-stone-700 whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          {msg.tip && (
                            <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                              <span className="text-amber-500 text-sm">💡</span>
                              <p className="text-xs text-amber-800">{msg.tip}</p>
                            </div>
                          )}
                          {msg.suggestions && msg.suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {msg.suggestions.map((s, i) => (
                                <button key={i} onClick={() => handleSend(s)} className="px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 rounded-lg text-xs font-medium text-stone-600 transition-colors">
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <div className="bg-stone-900 text-white rounded-xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm">✨</div>
                    <div className="bg-stone-50 rounded-xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-stone-100 bg-stone-50">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                    placeholder="Ask for changes or describe what you need..."
                    className="flex-1 px-4 py-2.5 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-300"
                    disabled={isTyping}
                  />
                  <button
                    onClick={() => handleSend(input)}
                    disabled={!input.trim() || isTyping}
                    className="px-4 py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-stone-800 transition-colors"
                  >
                    ↑
                  </button>
                </div>
                <div className="flex gap-4 mt-3">
                  <button onClick={() => { setShowTemplates(!showTemplates); setShowVariables(false); }} className={`text-xs flex items-center gap-1.5 transition-colors ${showTemplates ? 'text-violet-600 font-medium' : 'text-stone-500 hover:text-stone-700'}`}>
                    📝 Templates
                  </button>
                  <button onClick={() => { setShowVariables(!showVariables); setShowTemplates(false); }} className={`text-xs flex items-center gap-1.5 transition-colors ${showVariables ? 'text-violet-600 font-medium' : 'text-stone-500 hover:text-stone-700'}`}>
                    @ Variables
                  </button>
                  {campaignMsg && <span className="text-xs text-stone-400 ml-auto">{campaignMsg.length} characters</span>}
                </div>
              </div>
            </div>

            {/* Templates Panel */}
            {showTemplates && (
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-stone-900 text-sm">Templates</span>
                  <button onClick={() => setShowTemplates(false)} className="text-stone-400 hover:text-stone-600 text-sm">✕</button>
                </div>
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setTemplateCategory(cat.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${templateCategory === cat.id ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                      {cat.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {filteredTemplates.map(t => (
                    <button key={t.id} onClick={() => handleSend(t.title, t)} className="w-full flex items-center gap-3 p-3 bg-stone-50 hover:bg-stone-100 rounded-lg text-left transition-colors">
                      <span className="text-lg">{t.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-stone-900 text-sm">{t.title}</div>
                        <div className="text-xs text-stone-500 truncate">{t.desc}</div>
                      </div>
                      <span className="text-stone-300">→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Variables Panel */}
            {showVariables && (
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-stone-900 text-sm">Personalization Variables</span>
                  <button onClick={() => setShowVariables(false)} className="text-stone-400 hover:text-stone-600 text-sm">✕</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {VARIABLES.map(v => (
                    <button key={v.token} onClick={() => handleVariableInsert(v)} className="flex items-center justify-between p-3 bg-stone-50 hover:bg-stone-100 rounded-lg text-left transition-colors">
                      <div>
                        <div className="font-medium text-stone-900 text-xs">{v.label}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{v.token}</div>
                      </div>
                      <span className="text-[10px] text-stone-400">→ {v.preview}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Refinements */}
            {campaignMsg && !showTemplates && !showVariables && (
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">Quick Refinements</div>
                <div className="flex flex-wrap gap-2">
                  {['Make shorter', 'More professional', 'More friendly', 'Add urgency', 'Add emojis', 'Add image', 'Add buttons'].map(action => (
                    <button key={action} onClick={() => handleSend(action)} className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs text-stone-600 transition-colors">
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Preview & Tools */}
          <div className="lg:col-span-2 space-y-4">
            {/* Live Preview */}
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                <span className="font-medium text-stone-900 text-sm">Preview</span>
                {campaignMsg && <button onClick={() => inputRef.current?.focus()} className="text-xs text-stone-500 hover:text-violet-600 transition-colors">✏️ Edit</button>}
              </div>
              <div className="p-4">
                <div className={`rounded-xl overflow-hidden ${isWA ? 'bg-emerald-50/50' : 'bg-sky-50/50'}`}>
                  <div className={`px-4 py-2.5 ${isWA ? 'bg-emerald-700' : 'bg-sky-600'}`}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">PP</div>
                      <span className="text-white font-medium text-sm">Prime Properties</span>
                    </div>
                  </div>
                  <div className="p-4 min-h-[180px]">
                    {campaignMsg ? (
                      <div className="max-w-[92%] ml-auto">
                        {hasImage && (
                          <div className="rounded-lg rounded-tr-sm mb-2 h-24 bg-white flex items-center justify-center text-stone-300 border border-stone-200">
                            🖼️ Property image
                          </div>
                        )}
                        <div className="bg-white rounded-xl rounded-tr-sm p-3 shadow-sm">
                          <p className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">{sub(campaignMsg)}</p>
                          <div className="text-[10px] text-stone-400 text-right mt-2">10:30 AM ✓✓</div>
                        </div>
                        {buttons.map((btn, i) => (
                          <div key={i} className={`mt-1.5 rounded-lg py-2 text-center text-sm font-medium bg-white shadow-sm ${isWA ? 'text-emerald-600' : 'text-sky-600'}`}>
                            {btn}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-stone-400 text-sm py-8">
                        <div className="text-center">
                          <span className="text-2xl block mb-2">💬</span>
                          Your message will appear here
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Score */}
              {campaignMsg && (
                <div className="px-4 py-3 bg-stone-50 border-t border-stone-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-stone-500">Campaign Score</span>
                    <span className={`text-sm font-bold ${score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-stone-400'}`}>
                      {score}/100
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-stone-400'}`} style={{ width: `${score}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* AI Insights */}
            {insights.length > 0 && (
              <div className="space-y-2">
                {insights.map((insight, i) => (
                  <div key={i} className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm ${insight.type === 'success' ? 'bg-emerald-50 text-emerald-800' :
                    insight.type === 'warning' ? 'bg-amber-50 text-amber-800' :
                      'bg-stone-100 text-stone-700'
                    }`}>
                    <span>{insight.icon}</span>
                    <span>{insight.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Enhancements */}
            {campaignMsg && (
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">Add to Campaign</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'image', icon: '🖼️', label: 'Image', done: hasImage },
                    { id: 'button', icon: '▶️', label: 'Buttons', done: buttons.length > 0 },
                    { id: 'link', icon: '🔗', label: 'Link', done: false },
                    { id: 'variable', icon: '@', label: 'Personalize', done: campaignMsg.includes('{{') },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => item.id === 'variable' ? setShowVariables(true) : handleSend(`Add ${item.id}`)}
                      disabled={item.done}
                      className="flex items-center gap-2 p-3 bg-stone-50 hover:bg-stone-100 rounded-lg text-left transition-colors disabled:opacity-50"
                    >
                      <span>{item.icon}</span>
                      <span className="text-sm text-stone-700">{item.label}</span>
                      {item.done && <span className="ml-auto text-emerald-500 text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Score Breakdown */}
            {campaignMsg && breakdown.length > 0 && (
              <div className="bg-white rounded-xl border border-stone-200 p-4">
                <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">Score Breakdown</div>
                <div className="space-y-2">
                  {breakdown.slice(0, 4).map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className={item.positive ? 'text-stone-700' : 'text-stone-400'}>{item.label}</span>
                      <span className={item.positive ? 'text-emerald-600 font-medium' : 'text-stone-300'}>
                        {item.positive ? `+${item.points}` : '—'}
                      </span>
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
// Recipients selection is now handled by RecipientSelector component
// See: /src/components/partner/broadcast/RecipientSelector.tsx
// ============================================

// ============================================
// REVIEW STEP
// ============================================
interface ReviewStepProps {
  channel: 'whatsapp' | 'telegram';
  campaign: Campaign;
  onBack: () => void;
  onSend: () => void;
}

function ReviewStep({ channel, campaign, onBack, onSend }: ReviewStepProps) {
  const [sending, setSending] = useState(false);
  const isWA = channel === 'whatsapp';

  if (sending) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse text-white text-2xl ${isWA ? 'bg-emerald-600' : 'bg-sky-600'}`}>📤</div>
          <h2 className="text-lg font-semibold text-stone-900">Sending campaign...</h2>
          <p className="text-sm text-stone-500 mt-1">{campaign.recipients} messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center hover:bg-stone-100 rounded-lg text-stone-500">←</button>
          <h1 className="font-semibold text-stone-900 text-sm">Review & Send</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4">
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 bg-white rounded-xl border border-stone-200 p-4">
            <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">Preview</div>
            <div className={`rounded-xl overflow-hidden ${isWA ? 'bg-emerald-50/50' : 'bg-sky-50/50'}`}>
              <div className={`px-4 py-2.5 ${isWA ? 'bg-emerald-700' : 'bg-sky-600'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">PP</div>
                  <span className="text-white font-medium text-sm">Prime Properties</span>
                </div>
              </div>
              <div className="p-4">
                <div className="max-w-[90%] ml-auto">
                  {campaign.hasImage && <div className="rounded-lg rounded-tr-sm mb-2 h-20 bg-white flex items-center justify-center text-stone-300 border">🖼️</div>}
                  <div className="bg-white rounded-xl rounded-tr-sm p-3 shadow-sm">
                    <p className="text-sm text-stone-800 whitespace-pre-wrap">{sub(campaign.message)}</p>
                    <div className="text-[10px] text-stone-400 text-right mt-2">10:30 AM ✓✓</div>
                  </div>
                  {campaign.buttons?.map((btn, i) => (
                    <div key={i} className={`mt-1.5 rounded-lg py-2 text-center text-sm font-medium bg-white shadow-sm ${isWA ? 'text-emerald-600' : 'text-sky-600'}`}>{btn}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">Summary</div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500">Channel</span>
                  <span className={`font-medium ${isWA ? 'text-emerald-600' : 'text-sky-600'}`}>{isWA ? 'WhatsApp' : 'Telegram'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500">Recipients</span>
                  <span className="font-semibold text-stone-900">{campaign.recipients}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-stone-500">Est. time</span>
                  <span className="text-stone-700">~{Math.ceil((campaign.recipients || 1) / 60)} min</span>
                </div>
              </div>
            </div>

            <div className="bg-violet-50 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <span className="text-violet-600">✨</span>
                <p className="text-sm text-violet-900">Based on similar campaigns, expect ~25% reply rate within 24 hours.</p>
              </div>
            </div>

            <button onClick={() => { setSending(true); setTimeout(onSend, 2000); }} className={`w-full py-3.5 rounded-xl text-white font-semibold transition-all ${isWA ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'}`}>
              Send to {campaign.recipients} contacts
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button className="py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50">Schedule</button>
              <button className="py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-50">Save draft</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SUCCESS VIEW
// ============================================
interface SuccessViewProps {
  channel: 'whatsapp' | 'telegram';
  campaign: Campaign;
  onDone: () => void;
}

function SuccessView({ channel, campaign, onDone }: SuccessViewProps) {
  const isWA = channel === 'whatsapp';
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white text-2xl ${isWA ? 'bg-emerald-600' : 'bg-sky-600'}`}>✓</div>
        <h1 className="text-xl font-semibold text-stone-900 mb-1">Campaign sent!</h1>
        <p className="text-stone-500 mb-6">{campaign.recipients} messages via {isWA ? 'WhatsApp' : 'Telegram'}</p>

        <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6 text-left">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">What&apos;s next</div>
          <ul className="space-y-2 text-sm text-stone-600">
            <li className="flex items-center gap-2"><span className="text-emerald-500">→</span>Track delivery in Campaigns</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">→</span>Respond to replies in Inbox</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">→</span>Follow up non-responders in 3 days</li>
          </ul>
        </div>

        <button onClick={onDone} className="w-full py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-colors">
          Done
        </button>
      </div>
    </div>
  );
}
