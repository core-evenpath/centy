
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import type { TradingPick } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Edit, Send, Loader2, TrendingUp, DollarSign, Calendar, Shield,
  AlertTriangle, Zap, Target, BarChart3, Tag, Image as ImageIcon, 
  MessageSquare, Share2, CheckCircle, Clock, History, XCircle, CheckCircle2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const DetailItem = ({ 
  label, 
  value, 
  className,
  icon: Icon 
}: { 
  label: string, 
  value: React.ReactNode, 
  className?: string,
  icon?: React.ElementType 
}) => (
  <div className={className}>
    <div className="flex items-center gap-2 mb-1">
      {Icon && <Icon className="w-4 h-4 text-gray-400" />}
      <p className="text-sm font-medium text-gray-500">{label}</p>
    </div>
    <div className="text-base text-gray-900 font-semibold">{value}</div>
  </div>
);

const Section = ({ 
  title, 
  icon, 
  children,
  className = ""
}: { 
  title: string, 
  icon: React.ElementType, 
  children: React.ReactNode,
  className?: string 
}) => {
  const Icon = icon;
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Icon className="w-5 h-5 text-blue-600" />
          {title}
        </h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

interface BroadcastRecord {
  id: string;
  method: string;
  recipientCount: number;
  successCount: number;
  failedCount: number;
  message: string;
  createdAt: any;
  status: string;
  timestamp?: any;
  successful?: number;
  failed?: number;
}

export default function ViewIdeaPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const [idea, setIdea] = useState<TradingPick | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastMethod, setBroadcastMethod] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!id || !currentWorkspace?.partnerId) return;

    const fetchIdea = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, `partners/${currentWorkspace.partnerId}/tradingPicks`, id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const ideaData = { id: docSnap.id, ...docSnap.data() } as TradingPick;
          setIdea(ideaData);
          
          // Generate default broadcast message
          const defaultMessage = `🎯 ${ideaData.action.toUpperCase()} Recommendation: ${ideaData.companyName} (${ideaData.ticker})

💰 Target: ${ideaData.priceTarget}
⏱️ Timeframe: ${ideaData.timeframe}
⚠️ Risk: ${ideaData.riskLevel}

📊 Thesis: ${ideaData.thesis.substring(0, 200)}...

View full details and analysis.`;
          
          setBroadcastMessage(defaultMessage);
        } else {
          setError("Idea not found.");
        }
      } catch (err) {
        setError("Failed to load idea.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIdea();
  }, [id, currentWorkspace?.partnerId]);

  // Fetch broadcast history when dialog opens
  useEffect(() => {
    if (broadcastDialogOpen && id && currentWorkspace?.partnerId) {
      fetchBroadcastHistory();
    }
  }, [broadcastDialogOpen, id, currentWorkspace?.partnerId]);

  const fetchBroadcastHistory = async () => {
    if (!id || !currentWorkspace?.partnerId) return;
    
    setLoadingHistory(true);
    try {
      const broadcastsRef = collection(db, 'broadcasts');
      const q = query(
        broadcastsRef,
        where('partnerId', '==', currentWorkspace.partnerId),
        where('ideaId', '==', id),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const history: BroadcastRecord[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as BroadcastRecord));
      
      setBroadcastHistory(history);
    } catch (err) {
      console.error('Error fetching broadcast history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleBroadcast = async () => {
    if (!phoneNumbers.trim()) {
      toast({ title: 'Error', description: 'Please enter at least one phone number', variant: 'destructive'});
      return;
    }

    setBroadcasting(true);
    try {
      // Parse phone numbers (comma or newline separated)
      const numbers = phoneNumbers
        .split(/[,\n]/)
        .map(num => num.trim())
        .filter(num => num.length > 0);

      const response = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: broadcastMethod,
          numbers,
          message: broadcastMessage,
          ideaId: idea?.id,
          partnerId: currentWorkspace?.partnerId,
          mediaUrl: idea?.imageUrl || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Broadcast failed');
      }

      toast({ 
        title: "Success", 
        description: `Successfully broadcasted to ${result.successCount} recipient(s) via ${broadcastMethod.toUpperCase()}. ${result.failedCount > 0 ? `${result.failedCount} failed.` : ''}`
      });
      
      setBroadcastDialogOpen(false);
      setPhoneNumbers('');
      
      // Refresh broadcast history
      fetchBroadcastHistory();
    } catch (err: any) {
      console.error('Broadcast error:', err);
      toast({ 
        title: "Error", 
        description: err.message || 'Failed to broadcast. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setBroadcasting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <span className="text-gray-600 font-medium">Loading idea details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-xl font-semibold text-gray-900 mb-2">Error Loading Idea</p>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={() => router.push('/partner/ideabox')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Ideabox
        </Button>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <AlertTriangle className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-xl font-semibold text-gray-900 mb-2">Idea Not Found</p>
        <p className="text-gray-600 mb-6">Could not find the requested stock recommendation.</p>
        <Button onClick={() => router.push('/partner/ideabox')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Ideabox
        </Button>
      </div>
    );
  }

  const actionColor = idea.action === 'buy' 
    ? 'bg-green-50 text-green-700 border-green-200' 
    : idea.action === 'sell' 
    ? 'bg-red-50 text-red-700 border-red-200' 
    : 'bg-yellow-50 text-yellow-700 border-yellow-200';
  
  const actionBadgeColor = idea.action === 'buy' 
    ? 'bg-green-600' 
    : idea.action === 'sell' 
    ? 'bg-red-600' 
    : 'bg-yellow-600';

  const riskColor = idea.riskLevel === 'high' 
    ? 'text-red-600' 
    : idea.riskLevel === 'medium' 
    ? 'text-yellow-600' 
    : 'text-green-600';

  return (
    <>
      <div className="overflow-y-auto h-full bg-gradient-to-br from-gray-50 to-gray-100/50">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">
          {/* Header with Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/partner/ideabox')} 
              className="flex items-center gap-2 hover:bg-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Ideabox
            </Button>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => setBroadcastDialogOpen(true)}
                className="flex-1 sm:flex-none bg-white hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Broadcast
              </Button>
              <Button 
                asChild
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
              >
                <Link href={`/partner/ideabox/edit/${idea.id}`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Idea
                </Link>
              </Button>
            </div>
          </div>

          {/* Hero Card with Key Information */}
          <div className={`relative overflow-hidden rounded-2xl shadow-lg border-2 ${actionColor} mb-6`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full -mr-32 -mt-32"></div>
            <div className="relative p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="secondary" className="text-xs font-semibold">
                      {idea.sector}
                    </Badge>
                    <Badge variant="secondary" className="text-xs font-semibold capitalize">
                      {idea.ideaType}
                    </Badge>
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                    {idea.companyName}
                  </h1>
                  <p className="text-2xl font-mono font-semibold text-gray-700">
                    {idea.ticker}
                  </p>
                </div>
                
                <div className="flex items-center justify-center lg:justify-end">
                  <div className={`${actionBadgeColor} rounded-2xl px-8 py-6 text-center shadow-lg`}>
                    <div className="text-white text-sm font-medium mb-1">ACTION</div>
                    <div className="text-white text-4xl font-bold uppercase">
                      {idea.action}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-current/10">
                <DetailItem 
                  icon={Target}
                  label="Price Target" 
                  value={<span className="text-xl">{idea.priceTarget}</span>} 
                />
                <DetailItem 
                  icon={DollarSign}
                  label="Current Price" 
                  value={<span className="text-xl">{idea.currentPrice || 'N/A'}</span>} 
                />
                <DetailItem 
                  icon={Clock}
                  label="Timeframe" 
                  value={<span className="text-xl capitalize">{idea.timeframe}</span>} 
                />
                <DetailItem 
                  icon={Shield}
                  label="Risk Level" 
                  value={
                    <span className={`text-xl capitalize font-bold ${riskColor}`}>
                      {idea.riskLevel}
                    </span>
                  } 
                />
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Analysis */}
            <div className="lg:col-span-2 space-y-6">
              <Section title="Investment Thesis" icon={TrendingUp}>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {idea.thesis}
                </div>
              </Section>

              <Section title="Key Risks" icon={AlertTriangle}>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {idea.keyRisks}
                </div>
              </Section>

              {/* Additional Context in Tabs */}
              <Section title="Market Intelligence" icon={BarChart3}>
                <Tabs defaultValue="catalysts" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="catalysts">Catalysts</TabsTrigger>
                    <TabsTrigger value="market">Market</TabsTrigger>
                    <TabsTrigger value="sector">Sector</TabsTrigger>
                  </TabsList>
                  <TabsContent value="catalysts" className="mt-4">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {idea.catalysts || 'No specific catalysts identified.'}
                    </p>
                  </TabsContent>
                  <TabsContent value="market" className="mt-4">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {idea.marketContext || 'No market context provided.'}
                    </p>
                  </TabsContent>
                  <TabsContent value="sector" className="mt-4">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {idea.sectorTrends || 'No sector trends specified.'}
                    </p>
                  </TabsContent>
                </Tabs>
              </Section>
              
               <Section title="Broadcast History" icon={History}>
                {idea.broadcastHistory && idea.broadcastHistory.length > 0 ? (
                  <div className="space-y-3">
                    {idea.broadcastHistory.map((item, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-gray-50 flex items-start gap-3">
                        <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${item.method === 'whatsapp' ? 'bg-green-100' : 'bg-blue-100'}`}>
                          {item.method === 'whatsapp' ? <MessageSquare className="w-4 h-4 text-green-600" /> : <Send className="w-4 h-4 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium capitalize">{item.method} Broadcast</p>
                            <p className="text-xs text-gray-500">
                              {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString() : 'Recent'}
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                            <div className="flex items-center gap-1 text-gray-600"><Users className="w-3 h-3" />{item.recipientCount} Recipients</div>
                            <div className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" />{item.successful} Sent</div>
                            <div className="flex items-center gap-1 text-red-600"><XCircle className="w-3 h-3" />{item.failed} Failed</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No broadcast history for this idea yet.</p>
                )}
              </Section>
            </div>

            {/* Right Column - Image & Metadata */}
            <div className="space-y-6">
              {/* Image Card */}
              <Section title="Visual Card" icon={ImageIcon} className="sticky top-6">
                {idea.imageUrl ? (
                  <div className="space-y-4">
                    <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                      <Image 
                        src={idea.imageUrl} 
                        alt={`${idea.ticker} Recommendation Card`} 
                        width={400} 
                        height={225} 
                        className="w-full h-auto"
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      This card can be shared with clients
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ImageIcon className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">No image generated</p>
                    <p className="text-xs text-gray-400 mt-1">Edit to add a visual card</p>
                  </div>
                )}
              </Section>

              {/* Metadata */}
              <Section title="Tracking Info" icon={Calendar}>
                <div className="space-y-4">
                  <DetailItem 
                    icon={Tag}
                    label="Idea Type" 
                    value={<Badge variant="secondary" className="capitalize">{idea.ideaType}</Badge>} 
                  />
                  <DetailItem 
                    icon={Calendar}
                    label="Created" 
                    value={
                      idea.createdAt 
                        ? new Date((idea.createdAt as any).toDate()).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'
                    } 
                  />
                  <DetailItem 
                    icon={Calendar}
                    label="Last Updated" 
                    value={
                      idea.updatedAt 
                        ? new Date((idea.updatedAt as any).toDate()).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'
                    } 
                  />
                </div>
              </Section>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Dialog */}
      <Dialog open={broadcastDialogOpen} onOpenChange={setBroadcastDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-600" />
              Broadcast Stock Idea
            </DialogTitle>
            <DialogDescription>
              Send this {idea.ticker} recommendation to your clients via WhatsApp or SMS.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="compose" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="compose">
                <Send className="w-4 h-4 mr-2" />
                Compose
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="w-4 h-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-4 py-4">
              {/* Method Selection */}
              <div className="space-y-2">
                <Label>Broadcast Method</Label>
                <Tabs value={broadcastMethod} onValueChange={(v) => setBroadcastMethod(v as 'whatsapp' | 'sms')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="whatsapp">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      WhatsApp
                    </TabsTrigger>
                    <TabsTrigger value="sms">
                      <Send className="w-4 h-4 mr-2" />
                      SMS
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Phone Numbers */}
              <div className="space-y-2">
                <Label htmlFor="phone-numbers">
                  Phone Numbers
                  <span className="text-xs text-gray-500 ml-2">(comma or newline separated)</span>
                </Label>
                <Textarea
                  id="phone-numbers"
                  placeholder="+1234567890, +0987654321&#10;+1122334455"
                  value={phoneNumbers}
                  onChange={(e) => setPhoneNumbers(e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              {/* Message Preview/Edit */}
              <div className="space-y-2">
                <Label htmlFor="broadcast-message">Message</Label>
                <Textarea
                  id="broadcast-message"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={10}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500">
                  Customize this message before sending
                </p>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setBroadcastDialogOpen(false)}
                  disabled={broadcasting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleBroadcast}
                  disabled={broadcasting || !phoneNumbers.trim()}
                >
                  {broadcasting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Broadcast
                    </>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="history" className="py-4">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : broadcastHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No broadcast history for this idea</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {broadcastHistory.map((broadcast) => (
                    <Card key={broadcast.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {broadcast.method === 'whatsapp' ? (
                              <MessageSquare className="w-4 h-4 text-green-600" />
                            ) : (
                              <Send className="w-4 h-4 text-blue-600" />
                            )}
                            <CardTitle className="text-sm font-semibold">
                              {broadcast.method.toUpperCase()} Broadcast
                            </CardTitle>
                          </div>
                          <Badge 
                            variant={broadcast.status === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {broadcast.status}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          {broadcast.createdAt && new Date((broadcast.createdAt as any).toDate()).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Recipients</p>
                            <p className="text-lg font-semibold">{broadcast.recipientCount}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Sent</p>
                            <p className="text-lg font-semibold text-green-600">{broadcast.successCount}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Failed</p>
                            <p className="text-lg font-semibold text-red-600">{broadcast.failedCount}</p>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded p-3">
                          <p className="text-xs text-gray-600 line-clamp-3">
                            {broadcast.message}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
