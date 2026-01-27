'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, X, FileText, TrendingUp, MessageSquare, User, Sparkles, Database, CheckCircle2, DollarSign, History, Tag, Package, Phone, Building2, GraduationCap, Home, Stethoscope, Calculator, ShoppingBag, Upload, Zap, Bot, Loader2, Send, Bell } from 'lucide-react';
import { saveEarlyAccessSignupAction } from '@/actions/early-access-actions';
import { useToast } from '@/hooks/use-toast';

function GlowOrb({ className }: { className: string }) {
  return (
    <div className={`absolute rounded-full blur-3xl ${className}`} />
  );
}

const useCases = [
  { icon: Building2, name: 'Manufacturers & Suppliers', desc: 'Bulk inquiries answered with accurate specs and pricing.', tag: 'IndiaMART sellers, exporters' },
  { icon: GraduationCap, name: 'Education & Coaching', desc: 'Admission queries answered instantly with course details.', tag: 'Study abroad, coaching' },
  { icon: Home, name: 'Real Estate', desc: 'Property inquiries with floor plans, pricing, availability.', tag: 'Agents, builders' },
  { icon: Stethoscope, name: 'Healthcare', desc: 'Appointment queries, clinic hours — automated.', tag: 'Clinics, diagnostics' },
  { icon: Calculator, name: 'CA & Professional Services', desc: 'Compliance queries with deadlines and requirements.', tag: 'CA firms, legal' },
  { icon: ShoppingBag, name: 'E-commerce & D2C', desc: 'Product questions, order status — handled with context.', tag: 'Online stores' },
];

const howItWorks = [
  { step: '1', title: 'Upload your docs', desc: 'Product catalogs, price lists, FAQs — any documents your business runs on.', icon: Upload },
  { step: '2', title: 'Connect channels', desc: 'Link WhatsApp, Telegram, or SMS. All messages flow into one inbox.', icon: MessageSquare },
  { step: '3', title: 'AI starts responding', desc: 'Customers message. AI responds with real answers. You approve or edit.', icon: Zap },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

function WaveformBars({ active, intensity = 1 }: { active: boolean; intensity?: number }) {
  const [heights, setHeights] = useState(Array(20).fill(4));

  useEffect(() => {
    if (!active) {
      setHeights(Array(20).fill(4));
      return;
    }
    const interval = setInterval(() => {
      setHeights(prev => prev.map((_, i) => {
        const base = Math.sin(Date.now() * 0.01 + i * 0.5) * 0.5 + 0.5;
        return 4 + base * 28 * intensity;
      }));
    }, 50);
    return () => clearInterval(interval);
  }, [active, intensity]);

  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full transition-all duration-75"
          style={{
            height: `${h}px`,
            backgroundColor: active ? '#34d399' : '#065f46',
            opacity: active ? 0.9 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeCards, setActiveCards] = useState<string[]>([]);
  const [isFlowActive, setIsFlowActive] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [currentPhase, setCurrentPhase] = useState(0);
  const { toast } = useToast();

  const phases = [
    { status: 'Ready', icon: 'idle' },
    { status: 'Message received', icon: 'received' },
    { status: 'Identifying customer...', icon: 'searching' },
    { status: 'Searching documents...', icon: 'searching' },
    { status: 'Calculating pricing...', icon: 'processing' },
    { status: 'Generating response...', icon: 'generating' },
    { status: 'Response sent!', icon: 'sent' },
    { status: 'Deal tracked: ₹56.2L', icon: 'complete' },
  ];

  const responseText = "Hi! For 500 units of 2HP pumps: ₹56,25,000 (10% off). Shall I send a quote?";

  useEffect(() => {
    if (!isFlowActive) {
      setActiveCards([]);
      setCurrentPhase(0);
      setTypedText('');
      return;
    }

    const sequence = [
      ['incoming'],
      ['incoming', 'customer'],
      ['incoming', 'customer', 'history'],
      ['incoming', 'customer', 'history', 'documents', 'catalog'],
      ['incoming', 'customer', 'history', 'documents', 'catalog', 'pricing', 'discounts'],
      ['incoming', 'customer', 'history', 'documents', 'catalog', 'pricing', 'discounts', 'response'],
      ['incoming', 'customer', 'history', 'documents', 'catalog', 'pricing', 'discounts', 'response', 'sent'],
      ['response', 'sent', 'revenue'],
      [],
    ];

    let index = 0;
    setActiveCards(sequence[0]);
    setCurrentPhase(1);

    const interval = setInterval(() => {
      index = (index + 1) % sequence.length;
      setActiveCards(sequence[index]);
      setCurrentPhase(index + 1 >= phases.length ? 0 : index + 1);
      if (index === 0) setTypedText('');
    }, 2200);

    return () => clearInterval(interval);
  }, [isFlowActive, phases.length]);

  useEffect(() => {
    if (currentPhase === 5 && isFlowActive) {
      let charIndex = 0;
      setTypedText('');
      const typeInterval = setInterval(() => {
        if (charIndex < responseText.length) {
          setTypedText(responseText.slice(0, charIndex + 1));
          charIndex++;
        } else {
          clearInterval(typeInterval);
        }
      }, 30);
      return () => clearInterval(typeInterval);
    }
  }, [currentPhase, isFlowActive]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsFlowActive(entry.isIntersecting),
      { threshold: 0.2 }
    );
    const flowSection = document.getElementById('flow');
    if (flowSection) observer.observe(flowSection);
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast({
        variant: 'destructive',
        title: 'Please fill out both name and email.'
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await saveEarlyAccessSignupAction(formData);
      if (result.success) {
        toast({
          title: 'Success!',
          description: "You're on the list. We'll be in touch soon.",
        });
        setIsSubmitted(true);
        setFormData({ name: '', email: '' });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isActive = (id: string) => activeCards.includes(id);
  const phase = phases[currentPhase] || phases[0];

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ backgroundColor: '#040d07' }}>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "PingBox",
            "applicationCategory": "BusinessApplication",
            "description": "AI-powered customer messaging platform that unifies WhatsApp, Telegram & SMS into one inbox with intelligent automated responses.",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "2999",
              "priceCurrency": "INR",
              "priceValidUntil": "2025-12-31"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "156"
            }
          })
        }}
      />

      <style>{`
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(12px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-scroll { animation: scrollBounce 2s ease-in-out infinite; }
        .animate-pulse-ring { animation: pulse-ring 2s ease-out infinite; }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.3), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        .flow-card {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          background: linear-gradient(135deg, rgba(16, 30, 22, 0.95) 0%, rgba(8, 20, 14, 0.98) 100%);
          border: 1px solid rgba(16, 185, 129, 0.1);
        }
        .flow-card.active {
          border-color: rgba(16, 185, 129, 0.5);
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.2), inset 0 0 20px rgba(16, 185, 129, 0.05);
        }
        .flow-card.inactive { opacity: 0.25; }
        .typing-cursor::after {
          content: '|';
          animation: blink 0.8s infinite;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-emerald-900/30" style={{ backgroundColor: 'rgba(4, 13, 7, 0.9)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-semibold text-white text-lg tracking-tight">PingBox</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6">
            <a href="#how" className="text-sm text-emerald-100/60 hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="text-sm text-emerald-100/60 hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/partner/login" className="text-sm text-emerald-100/60 hover:text-white transition-colors hidden sm:block">Partner Login</Link>
            <a href="#cta" className="text-sm bg-white text-gray-900 px-5 py-2.5 rounded-full font-medium hover:bg-emerald-100 transition-colors">
              Request Demo
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, #0a1f14 0%, #040d07 70%)' }} />
        <GlowOrb className="w-[800px] h-[800px] bg-emerald-600/15 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm text-emerald-300/80">For Service Businesses</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="text-emerald-100/40">Every Customer Message</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
              Answered Instantly
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-emerald-100/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            The AI platform for businesses that talk to customers daily.
            Responds on WhatsApp, Telegram, and SMS with real answers from your documents.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a href="#flow" className="group flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-8 py-4 rounded-full font-semibold hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/25">
              See How It Works
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a href="#cta" className="flex items-center gap-2 text-emerald-100/50 hover:text-white transition-colors px-6 py-4">
              Request Demo
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-emerald-100/40">
            {['All channels unified', 'Setup in 10 minutes', 'No coding'].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 rounded-full border-2 border-emerald-800 flex items-start justify-center p-2">
            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-scroll" />
          </div>
        </div>
      </section>

      {/* Animated Grid Flow Section */}
      <section id="flow" className="py-24 px-4 relative overflow-hidden min-h-screen">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #040d07 0%, #081a10 50%, #040d07 100%)' }} />
        <GlowOrb className="w-[1000px] h-[1000px] bg-emerald-600/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-12">
            <span className="text-emerald-400 text-sm font-medium tracking-wider">THE PLATFORM</span>
            <h2 className="text-3xl sm:text-5xl font-bold mt-4 mb-4">
              <span className="text-emerald-100/40">Your AI handles</span>
              <br />
              <span className="text-white">every conversation</span>
            </h2>
            <p className="text-emerald-100/50 max-w-xl mx-auto">
              Watch how PingBox handles a real customer inquiry — from message to quote in 30 seconds.
            </p>
          </div>

          {/* Grid Layout - Desktop */}
          <div className="relative hidden lg:grid grid-cols-12 gap-3 max-w-6xl mx-auto" style={{ minHeight: '600px' }}>

            {/* Row 1 */}
            <div className={`flow-card col-span-4 rounded-2xl p-4 ${isActive('incoming') ? 'active' : 'inactive'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-xs text-green-400 font-medium">INCOMING MESSAGE</span>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                <div className="text-xs text-green-400 mb-1">WhatsApp • Just now</div>
                <div className="text-sm text-white/90">"Hi, I need pricing for 500 units of 2HP pumps. What's the bulk discount?"</div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-emerald-100/40">
                <Phone className="w-3 h-3" />
                <span>+91 98765 43210</span>
              </div>
            </div>

            <div className={`flow-card col-span-4 rounded-2xl p-4 ${isActive('customer') ? 'active' : 'inactive'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs text-blue-400 font-medium">CUSTOMER IDENTIFIED</span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">VK</div>
                <div>
                  <div className="text-sm font-medium text-white">Vikram Industries</div>
                  <div className="text-xs text-emerald-100/40">Gujarat, India</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                  <div className="text-emerald-100/40">Lifetime</div>
                  <div className="text-emerald-400 font-medium">₹4.2L</div>
                </div>
                <div className="rounded-lg p-2" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                  <div className="text-emerald-100/40">Tier</div>
                  <div className="text-amber-400 font-medium">Gold</div>
                </div>
              </div>
            </div>

            <div className={`flow-card col-span-4 rounded-2xl p-4 ${isActive('history') ? 'active' : 'inactive'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <History className="w-4 h-4 text-purple-400" />
                </div>
                <span className="text-xs text-purple-400 font-medium">CONVERSATION HISTORY</span>
              </div>
              <div className="space-y-2">
                {[{ date: '15 Jan', msg: 'Ordered 200 units' }, { date: '3 Dec', msg: 'Price inquiry - 1HP' }, { date: '18 Nov', msg: 'Delivery follow-up' }].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs rounded-lg p-2" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <span className="text-emerald-100/40">{item.date}</span>
                    <span className="text-white/70 truncate ml-2">{item.msg}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2 */}
            <div className={`flow-card col-span-3 rounded-2xl p-4 ${isActive('documents') ? 'active' : 'inactive'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Database className="w-4 h-4 text-orange-400" />
                </div>
                <span className="text-xs text-orange-400 font-medium">KNOWLEDGE BASE</span>
              </div>
              <div className="space-y-2">
                {[{ name: 'Catalog 2025.pdf', match: 98 }, { name: 'Pricing.xlsx', match: 95 }].map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs rounded-lg p-2" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <FileText className="w-3 h-3 text-orange-400" />
                    <span className="text-white/70 truncate flex-1">{doc.name}</span>
                    <span className="text-emerald-400">{doc.match}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CENTER PHONE */}
            <div className="col-span-6 row-span-2 flex items-center justify-center relative">
              {activeCards.length > 0 && (
                <>
                  <div className="absolute w-72 h-[440px] rounded-[3rem] border border-emerald-500/20 animate-pulse-ring" />
                  <div className="absolute w-80 h-[480px] rounded-[3.5rem] border border-emerald-500/10 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
                </>
              )}

              <div
                className={`relative w-64 h-[420px] rounded-[2.5rem] border-2 transition-all duration-500 ${activeCards.length > 0 ? 'border-emerald-500/60' : 'border-emerald-900/40'}`}
                style={{
                  background: 'linear-gradient(180deg, #0c2318 0%, #061510 100%)',
                  boxShadow: activeCards.length > 0 ? '0 0 80px rgba(16, 185, 129, 0.4), inset 0 0 40px rgba(16, 185, 129, 0.1)' : '0 0 20px rgba(0, 0, 0, 0.5)'
                }}
              >
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-6 rounded-full flex items-center justify-center gap-2" style={{ backgroundColor: '#040d07' }}>
                  <div className="w-2 h-2 rounded-full bg-emerald-900" />
                  <div className="w-8 h-1 rounded-full bg-emerald-900" />
                </div>

                <div className="absolute top-14 left-3 right-3 bottom-4 rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#040d07' }}>
                  <div className="px-4 py-3 border-b border-emerald-900/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center transition-all duration-300 ${activeCards.length > 0 ? 'scale-110 shadow-lg shadow-emerald-500/50' : ''}`}>
                        <span className="text-white font-bold text-xs">P</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm">PingBox</div>
                        <div className="text-emerald-400 text-[10px]">AI Assistant</div>
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${activeCards.length > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-900'}`} />
                  </div>

                  <div className="flex-1 p-3 flex flex-col justify-end overflow-hidden">
                    {currentPhase >= 1 && (
                      <div className="flex justify-start mb-3">
                        <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-3 py-2 text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                          <span className="text-white/90">Need pricing for 500 pumps...</span>
                        </div>
                      </div>
                    )}

                    {currentPhase >= 2 && currentPhase < 6 && (
                      <div className="flex justify-end mb-3">
                        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3 bg-gradient-to-r from-emerald-600/30 to-emerald-500/20 border border-emerald-500/30">
                          <div className="flex items-center gap-2 mb-2">
                            {currentPhase < 5 ? <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" /> : <Bot className="w-3 h-3 text-emerald-400" />}
                            <span className="text-emerald-400 text-[10px] font-medium">{phase.status}</span>
                          </div>
                          <TypingDots />
                        </div>
                      </div>
                    )}

                    {currentPhase >= 5 && (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/30">
                          <span className={`text-white text-xs leading-relaxed ${currentPhase === 5 ? 'typing-cursor' : ''}`}>
                            {currentPhase === 5 ? typedText : responseText}
                          </span>
                        </div>
                      </div>
                    )}

                    {currentPhase >= 6 && (
                      <div className="flex justify-end mt-1">
                        <div className="flex items-center gap-1 text-emerald-400 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Delivered</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-3 border-t border-emerald-900/30">
                    <WaveformBars active={currentPhase >= 2 && currentPhase < 6} intensity={currentPhase === 5 ? 1.2 : 0.8} />
                    <div className="flex items-center justify-center gap-2 mt-2">
                      {phase.icon === 'sent' || phase.icon === 'complete' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : currentPhase > 0 ? (
                        <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-emerald-900" />
                      )}
                      <span className={`text-xs font-medium ${phase.icon === 'sent' || phase.icon === 'complete' ? 'text-emerald-400' : 'text-emerald-100/60'}`}>
                        {phase.status}
                      </span>
                    </div>
                  </div>

                  {activeCards.length > 0 && currentPhase < 6 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 animate-shimmer" />
                  )}
                </div>

                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-emerald-100/20" />
              </div>
            </div>

            <div className={`flow-card col-span-3 rounded-2xl p-4 ${isActive('catalog') ? 'active' : 'inactive'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="text-xs text-cyan-400 font-medium">PRODUCT FOUND</span>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                <div className="text-sm font-medium text-white mb-1">2HP Submersible Pump</div>
                <div className="text-xs text-emerald-100/40 mb-2">SKU: SUB-2HP-001</div>
                <div className="flex justify-between text-xs">
                  <span className="text-emerald-100/40">Base Price</span>
                  <span className="text-white font-medium">₹12,500</span>
                </div>
              </div>
            </div>

            {/* Row 3 */}
            <div className={`flow-card col-span-3 rounded-2xl p-4 ${isActive('pricing') ? 'active' : 'inactive'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <span className="text-xs text-amber-400 font-medium">PRICE CALCULATED</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-emerald-100/40">500 × ₹12,500</span><span className="text-white">₹62,50,000</span></div>
                <div className="flex justify-between text-emerald-400"><span>Bulk discount</span><span>-8%</span></div>
                <div className="flex justify-between text-emerald-400"><span>Gold tier</span><span>-2%</span></div>
                <div className="border-t border-emerald-900/50 pt-2 flex justify-between font-medium"><span className="text-white">Total</span><span className="text-emerald-400">₹56,25,000</span></div>
              </div>
            </div>

            <div className={`flow-card col-span-3 rounded-2xl p-4 ${isActive('discounts') ? 'active' : 'inactive'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-pink-500/20 rounded-lg flex items-center justify-center">
                  <Tag className="w-4 h-4 text-pink-400" />
                </div>
                <span className="text-xs text-pink-400 font-medium">DISCOUNTS APPLIED</span>
              </div>
              <div className="space-y-2">
                {['500+ units: 8% off', 'Gold customer: +2%', 'Total: 10% discount'].map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs rounded-lg p-2" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span className="text-white/70">{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 4 */}
            <div className={`flow-card col-span-8 rounded-2xl p-4 ${isActive('response') ? 'active' : 'inactive'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">AI RESPONSE</span>
                </div>
                {isActive('sent') && (
                  <div className="flex items-center gap-1 text-emerald-400 text-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Sent via WhatsApp</span>
                  </div>
                )}
              </div>
              <div className="rounded-xl p-4 text-sm text-white/90 leading-relaxed" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                "Hi! For <strong>500 units of 2HP submersible pumps</strong>:<br /><br />
                • Unit price: ₹12,500 | Bulk discount: <span className="text-emerald-400">8% off</span> | Gold bonus: <span className="text-emerald-400">+2% off</span><br /><br />
                <strong className="text-emerald-400">Your total: ₹56,25,000</strong> (₹11,250/unit). Shall I prepare a formal quotation?"
              </div>
            </div>

            <div className={`flow-card col-span-4 rounded-2xl p-4 ${isActive('revenue') ? 'active' : 'inactive'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-xs text-emerald-400 font-medium">REVENUE TRACKED</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                  <div className="text-lg font-bold text-emerald-400">₹56.2L</div>
                  <div className="text-xs text-emerald-100/40">This Deal</div>
                </div>
                <div className="rounded-lg p-3 text-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                  <div className="text-lg font-bold text-white">₹2.1Cr</div>
                  <div className="text-xs text-emerald-100/40">This Month</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Flow View */}
          <div className="lg:hidden max-w-sm mx-auto">
            <div
              className={`relative w-full max-w-[280px] mx-auto h-[500px] rounded-[2.5rem] border-2 transition-all duration-500 ${activeCards.length > 0 ? 'border-emerald-500/60' : 'border-emerald-900/40'}`}
              style={{
                background: 'linear-gradient(180deg, #0c2318 0%, #061510 100%)',
                boxShadow: activeCards.length > 0 ? '0 0 80px rgba(16, 185, 129, 0.4), inset 0 0 40px rgba(16, 185, 129, 0.1)' : '0 0 20px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-6 rounded-full flex items-center justify-center gap-2" style={{ backgroundColor: '#040d07' }}>
                <div className="w-2 h-2 rounded-full bg-emerald-900" />
                <div className="w-8 h-1 rounded-full bg-emerald-900" />
              </div>

              <div className="absolute top-14 left-3 right-3 bottom-4 rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#040d07' }}>
                <div className="px-4 py-3 border-b border-emerald-900/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center transition-all duration-300 ${activeCards.length > 0 ? 'scale-110 shadow-lg shadow-emerald-500/50' : ''}`}>
                      <span className="text-white font-bold text-xs">P</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">PingBox</div>
                      <div className="text-emerald-400 text-[10px]">AI Assistant</div>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${activeCards.length > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-900'}`} />
                </div>

                <div className="flex-1 p-3 flex flex-col justify-end overflow-hidden">
                  {currentPhase >= 1 && (
                    <div className="flex justify-start mb-3">
                      <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-3 py-2 text-xs" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                        <span className="text-white/90">Need pricing for 500 pumps...</span>
                      </div>
                    </div>
                  )}

                  {currentPhase >= 2 && currentPhase < 6 && (
                    <div className="flex justify-end mb-3">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3 bg-gradient-to-r from-emerald-600/30 to-emerald-500/20 border border-emerald-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          {currentPhase < 5 ? <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" /> : <Bot className="w-3 h-3 text-emerald-400" />}
                          <span className="text-emerald-400 text-[10px] font-medium">{phase.status}</span>
                        </div>
                        <TypingDots />
                      </div>
                    </div>
                  )}

                  {currentPhase >= 5 && (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/30">
                        <span className={`text-white text-xs leading-relaxed ${currentPhase === 5 ? 'typing-cursor' : ''}`}>
                          {currentPhase === 5 ? typedText : responseText}
                        </span>
                      </div>
                    </div>
                  )}

                  {currentPhase >= 6 && (
                    <div className="flex justify-end mt-1">
                      <div className="flex items-center gap-1 text-emerald-400 text-[10px]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Delivered</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-4 py-3 border-t border-emerald-900/30">
                  <WaveformBars active={currentPhase >= 2 && currentPhase < 6} intensity={currentPhase === 5 ? 1.2 : 0.8} />
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {phase.icon === 'sent' || phase.icon === 'complete' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : currentPhase > 0 ? (
                      <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-emerald-900" />
                    )}
                    <span className={`text-xs font-medium ${phase.icon === 'sent' || phase.icon === 'complete' ? 'text-emerald-400' : 'text-emerald-100/60'}`}>
                      {phase.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-emerald-100/20" />
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-10">
            {['incoming', 'customer', 'documents', 'pricing', 'response', 'sent'].map((step) => (
              <div key={step} className={`h-1.5 rounded-full transition-all duration-500 ${isActive(step) ? 'bg-emerald-400 w-8' : 'w-2'}`} style={{ backgroundColor: isActive(step) ? undefined : 'rgba(16, 185, 129, 0.2)' }} />
            ))}
          </div>

          <p className="text-center mt-6 text-emerald-100/40 text-sm">
            This entire flow happens in <span className="text-emerald-400 font-medium">under 30 seconds</span> — automatically.
          </p>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-24 px-6 relative" style={{ backgroundColor: '#040d07' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              The problem with <span className="text-red-400">"we'll get back to you"</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Without PingBox */}
            <div className="rounded-2xl p-8 border border-red-500/20" style={{ background: 'linear-gradient(135deg, rgba(127, 29, 29, 0.2) 0%, rgba(4, 13, 7, 0.9) 100%)' }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <X className="w-5 h-5 text-red-400" />
                </div>
                <span className="text-red-400 font-semibold">WITHOUT PINGBOX</span>
              </div>
              <div className="space-y-4">
                {[
                  'Customer messages at 9 PM. You see it at 10 AM. They bought from competitor.',
                  '"Let me check the price" — then you forget. Lead goes cold.',
                  'Same questions 50 times a day. You\'re a human FAQ.',
                  'No idea which chats became revenue.'
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-emerald-100/70 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* With PingBox */}
            <div className="rounded-2xl p-8 border border-emerald-500/30" style={{ background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.3) 0%, rgba(4, 13, 7, 0.9) 100%)' }}>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-emerald-400 font-semibold">WITH PINGBOX</span>
              </div>
              <div className="space-y-4">
                {[
                  'Customer messages at 9 PM. AI responds in 30 seconds with accurate quote.',
                  'AI knows your products, pricing, policies. Answers from your documents.',
                  'You handle complex deals. AI handles the routine.',
                  'See exactly: ₹12L revenue from 47 conversations this month.'
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-emerald-100/70 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 78% Stat */}
          <div className="mt-16 text-center rounded-2xl p-10 border border-emerald-900/30" style={{ background: 'linear-gradient(135deg, rgba(12, 35, 24, 0.5) 0%, rgba(6, 21, 16, 0.5) 100%)' }}>
            <div className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-3">78%</div>
            <p className="text-emerald-100/60 text-lg">of customers buy from the first business that responds</p>
            <p className="text-emerald-100/40 text-sm mt-2">— Lead Connect Research</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-24 px-6 relative" style={{ background: 'linear-gradient(180deg, #040d07 0%, #081a10 50%, #040d07 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-emerald-400 text-sm font-medium tracking-wider">HOW IT WORKS</span>
            <h2 className="text-3xl sm:text-5xl font-bold mt-4 text-white">10 minutes to set up. <span className="text-emerald-100/40">Runs forever.</span></h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {howItWorks.map((item, i) => (
              <div key={i} className="group rounded-2xl p-8 border border-emerald-900/30 hover:border-emerald-500/30 transition-all text-center" style={{ background: 'linear-gradient(135deg, rgba(12, 35, 24, 0.3) 0%, rgba(6, 21, 16, 0.3) 100%)' }}>
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-500/20 transition-colors">
                  <span className="text-emerald-400 text-2xl font-bold">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">{item.title}</h3>
                <p className="text-emerald-100/50 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built For Section */}
      <section className="py-24 px-6 relative" style={{ backgroundColor: '#040d07' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-emerald-400 text-sm font-medium tracking-wider">BUILT FOR</span>
            <h2 className="text-3xl sm:text-5xl font-bold mt-4 text-white">Businesses that talk to <span className="text-emerald-100/40">customers daily</span></h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((item, i) => (
              <div key={i} className="group border border-emerald-900/30 rounded-2xl p-6 hover:border-emerald-500/30 transition-all" style={{ background: 'linear-gradient(135deg, rgba(12, 35, 24, 0.4) 0%, rgba(6, 21, 16, 0.4) 100%)' }}>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                  <item.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.name}</h3>
                <p className="text-sm text-emerald-100/60 mb-2">{item.desc}</p>
                <p className="text-xs text-emerald-400">{item.tag}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Smart Broadcasts */}
      <section className="py-24 px-6 relative" style={{ background: 'linear-gradient(180deg, #040d07 0%, #081a10 50%, #040d07 100%)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-emerald-400 text-sm font-medium tracking-wider">SMART BROADCASTS</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-4 text-white">Don't just respond. <span className="text-emerald-100/40">Reach out intelligently.</span></h2>
            <p className="text-emerald-100/50 mt-4 max-w-2xl mx-auto">
              AI notices patterns in your conversations and suggests targeted campaigns. Not spam — smart outreach to the right customers at the right time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              {[
                '"15 leads asked about 2HP pumps this month. Send them the bulk discount?"',
                '"23 warm leads haven\'t replied in 3 days. Follow up?"',
                '"New product launch — notify 156 customers who bought similar items?"'
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-emerald-900/30" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                  <Bell className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-emerald-100/70 text-sm">{item}</span>
                </div>
              ))}
            </div>

            {/* AI Suggestion Card */}
            <div className="rounded-2xl border border-emerald-500/30 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(12, 35, 24, 0.6) 0%, rgba(6, 21, 16, 0.8) 100%)' }}>
              <div className="px-5 py-3 border-b border-emerald-900/30 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm font-medium">AI Suggestion</span>
                <span className="text-emerald-100/40 text-xs ml-auto hidden sm:inline">Based on this week's conversations</span>
              </div>
              <div className="p-5">
                <p className="text-white/90 text-sm mb-4">
                  I noticed <strong>18 leads</strong> inquired about industrial pumps but didn't convert. Want me to send them your new bulk pricing?
                </p>
                <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                  <div className="text-emerald-400 text-xs font-medium mb-2">SUGGESTED MESSAGE</div>
                  <p className="text-white/80 text-sm">
                    "Hi! Following up on your pump inquiry. We now offer 12% off on orders above 200 units. Valid till month-end. Interested?"
                  </p>
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors">
                    <Send className="w-4 h-4" />
                    Send to 18 leads
                  </button>
                  <button className="flex-1 border border-emerald-500/30 text-emerald-400 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-500/10 transition-colors">
                    Edit first
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Not a Chatbot Section */}
      <section className="py-24 px-6 relative" style={{ backgroundColor: '#040d07' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Not a chatbot. <span className="text-emerald-400">Your business brain.</span></h2>
            <p className="text-emerald-100/50 mt-4">Generic chatbots send templates. PingBox reads your documents and responds like your best salesperson.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Generic Chatbot */}
            <div className="rounded-2xl p-6 border border-red-500/20" style={{ background: 'linear-gradient(135deg, rgba(127, 29, 29, 0.15) 0%, rgba(4, 13, 7, 0.9) 100%)' }}>
              <div className="text-red-400 text-sm font-medium mb-4">GENERIC CHATBOT</div>
              <div className="rounded-xl p-4 mb-3" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                <p className="text-white/70 text-sm">"Thank you for your inquiry! Our team will get back to you shortly."</p>
              </div>
              <p className="text-red-400/70 text-xs flex items-center gap-1">
                <ArrowRight className="w-3 h-3" />
                Customer already messaged 3 competitors
              </p>
            </div>

            {/* PingBox */}
            <div className="rounded-2xl p-6 border border-emerald-500/30" style={{ background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.2) 0%, rgba(4, 13, 7, 0.9) 100%)' }}>
              <div className="text-emerald-400 text-sm font-medium mb-4">PINGBOX</div>
              <div className="rounded-xl p-4 mb-3 border border-emerald-500/20" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <p className="text-white/90 text-sm">"Hi! For 500 units of 2HP pumps, unit price is ₹12,500. With 8% bulk discount, total: ₹57.5L. Want a quote?"</p>
              </div>
              <p className="text-emerald-400 text-xs flex items-center gap-1">
                <ArrowRight className="w-3 h-3" />
                Customer: "Yes, send the quote"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 relative" style={{ background: 'linear-gradient(180deg, #040d07 0%, #081a10 50%, #040d07 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-emerald-400 text-sm font-medium tracking-wider">PRICING</span>
            <h2 className="text-3xl sm:text-5xl font-bold mt-4 text-white">Simple pricing. <span className="text-emerald-100/40">Real ROI.</span></h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-emerald-900/30 rounded-2xl p-8" style={{ background: 'linear-gradient(135deg, rgba(12, 35, 24, 0.5) 0%, rgba(6, 21, 16, 0.5) 100%)' }}>
              <div className="text-sm text-emerald-100/50 mb-1">Starter</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold text-white">₹2,999</span>
                <span className="text-emerald-100/50">/mo</span>
              </div>
              <p className="text-sm text-emerald-100/40 mb-6">For businesses getting started</p>
              <ul className="space-y-3 mb-8">
                {['1 channel (WhatsApp/Telegram/SMS)', '500 AI responses/month', '50 documents', 'Basic analytics'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-emerald-100/70">
                    <Check className="w-4 h-4 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/early-access" className="block w-full text-center py-3 rounded-xl font-medium border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                Learn More
              </Link>
            </div>

            <div className="border-2 border-emerald-500/50 rounded-2xl p-8 relative" style={{ background: 'linear-gradient(135deg, rgba(12, 35, 24, 0.7) 0%, rgba(6, 21, 16, 0.7) 100%)' }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">POPULAR</div>
              <div className="text-sm text-emerald-400 mb-1">Growth</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold text-white">₹7,999</span>
                <span className="text-emerald-100/50">/mo</span>
              </div>
              <p className="text-sm text-emerald-100/40 mb-6">For serious lead conversion</p>
              <ul className="space-y-3 mb-8">
                {['All channels (WhatsApp + Telegram + SMS)', '2,000 AI responses/month', 'Unlimited documents', 'Revenue tracking', 'Smart broadcasts', '3 team members'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-emerald-100/70">
                    <Check className="w-4 h-4 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/early-access" className="block w-full text-center py-3 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-400 hover:to-emerald-500 transition-colors">
                Learn More
              </Link>
            </div>
          </div>

          <p className="text-center mt-8 text-emerald-100/40 text-sm">
            Average customer sees <span className="text-emerald-400 font-semibold">23x ROI</span> in first 30 days
          </p>
        </div>
      </section>

      {/* Join Our Select Partners CTA */}
      <section id="cta" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #040d07 50%, #064e3b 100%)' }} />
        <GlowOrb className="w-[800px] h-[800px] bg-emerald-500/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        <div className="max-w-3xl mx-auto relative text-center">
          <h2 className="text-4xl sm:text-6xl font-bold mb-6 text-white">Join Our Select Partners</h2>
          <p className="text-xl text-emerald-100/70 mb-4">
            We're currently working with a select group of invited partners to perfect the PingBox experience.
          </p>
          <p className="text-emerald-100/50 mb-10">
            Have an invitation code? Access your dashboard now.
          </p>

          <Link href="/partner/login" className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-full font-semibold hover:bg-emerald-100 transition-all mb-12">
            Partner Login
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="max-w-md mx-auto rounded-2xl p-8 border border-emerald-500/30" style={{ background: 'rgba(4, 13, 7, 0.8)' }}>
            <h3 className="text-xl font-semibold text-white mb-2">Want Early Access?</h3>
            <p className="text-emerald-100/50 text-sm mb-6">Join the waitlist and we'll send you an invite soon.</p>

            {isSubmitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-white font-medium">You're on the list!</p>
                <p className="text-emerald-100/50 text-sm">We'll be in touch soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-emerald-900/50 text-white placeholder-emerald-100/30 outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50"
                />
                <input
                  type="email"
                  placeholder="Work email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-xl bg-black/30 border border-emerald-900/50 text-white placeholder-emerald-100/30 outline-none focus:border-emerald-500/50 transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Joining...' : 'Request Invite'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-emerald-900/30" style={{ backgroundColor: '#040d07' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="font-semibold text-white">PingBox</span>
          </Link>
          <div className="flex items-center gap-8 text-sm text-emerald-100/40">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <a href="mailto:hello@pingbox.io" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="text-sm text-emerald-100/30">© 2025 PingBox. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
