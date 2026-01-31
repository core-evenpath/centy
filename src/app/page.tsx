'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Check, X, FileText, TrendingUp, MessageSquare, User, Sparkles, Database, CheckCircle2, DollarSign, History, Tag, Package, Phone, Bot, Loader2, Star } from 'lucide-react';

const howItWorks = [
  { step: '1', title: 'Upload your docs', desc: 'Product catalogs, price lists, FAQs — any documents your business runs on.' },
  { step: '2', title: 'Connect channels', desc: 'Link WhatsApp, Telegram, or SMS. All messages flow into one inbox.' },
  { step: '3', title: 'AI starts responding', desc: 'Customers message. AI responds with real answers. You approve or edit.' },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
            backgroundColor: active ? '#fb7185' : '#3f3f46',
            opacity: active ? 0.9 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [activeCards, setActiveCards] = useState<string[]>([]);
  const [isFlowActive, setIsFlowActive] = useState(true);
  const [typedText, setTypedText] = useState('');
  const [currentPhase, setCurrentPhase] = useState(0);

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

  const isActive = (id: string) => activeCards.includes(id);
  const phase = phases[currentPhase] || phases[0];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#faf8f5' }}>
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
              "price": "7999",
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
        .flow-card {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          background: white;
          border: 1px solid #e7e5e4;
        }
        .flow-card.active {
          border-color: #f43f5e;
          box-shadow: 0 4px 24px rgba(244, 63, 94, 0.08);
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
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .animate-pulse-ring { animation: pulse-ring 2s ease-out infinite; }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(244, 63, 94, 0.3), transparent);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-stone-200/60" style={{ backgroundColor: 'rgba(250, 248, 245, 0.9)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-semibold text-stone-900 text-lg tracking-tight">PingBox</span>
          </Link>
          <div className="hidden sm:flex items-center gap-8">
            <a href="#flow" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">How it works</a>
            <a href="#pricing" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/partner/login" className="text-sm text-stone-500 hover:text-stone-900 transition-colors hidden sm:block">Sign in</Link>
            <Link href="/early-access" className="text-sm bg-stone-900 hover:bg-stone-800 text-white px-5 py-2.5 rounded-full font-medium transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 overflow-hidden" style={{ backgroundColor: '#faf8f5' }}>
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 mb-6">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-500">You&apos;re losing leads right now</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl tracking-tight text-stone-900 mb-6 leading-[1.05]">
            <span className="text-stone-400">That message from</span>
            <br />
            <span className="text-stone-900">2 hours ago?</span>
            <br />
            <em className="text-rose-500">Gone.</em>
          </h1>

          <p className="text-lg sm:text-xl text-stone-500 max-w-2xl mx-auto mb-4 leading-relaxed">
            You&apos;re losing 2-3 leads per week to faster competitors. Not because you&apos;re bad — because you&apos;re <span className="text-stone-900 font-medium">busy</span>.
          </p>

          <p className="text-base text-stone-400 max-w-xl mx-auto mb-10">
            PingBox reads your documents and responds on WhatsApp in <span className="text-rose-500 font-semibold">30 seconds</span>. You just approve.
          </p>

          <Link href="/early-access" className="inline-flex items-center bg-stone-900 text-white pl-8 pr-2 py-2 rounded-full font-medium hover:bg-stone-800 transition-colors">
            <span className="mr-4">Connect WhatsApp — Free 14 Days</span>
            <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </Link>

          <p className="text-sm text-stone-400 mt-6">
            No credit card. No sales call. Working in 5 minutes.
          </p>
        </div>
      </section>

      {/* Social Proof Banner */}
      <section className="py-14 px-6 border-y border-stone-200">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-1 mb-5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
            ))}
          </div>
          <blockquote className="font-serif text-2xl sm:text-3xl text-stone-900 mb-5 leading-snug italic">
            &ldquo;I used to lose 5-6 inquiries a month. Last month I closed 23 — responding at 11pm while I was asleep.&rdquo;
          </blockquote>
          <cite className="text-stone-500 not-italic text-sm">
            — Priya M., Consultant, Mumbai
          </cite>
        </div>
      </section>

      {/* Animated Grid Flow Section */}
      <section id="flow" className="py-24 px-4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-14">
            <p className="text-rose-500 text-sm font-medium tracking-widest uppercase mb-4">The platform</p>
            <h2 className="font-serif text-3xl sm:text-5xl tracking-tight text-stone-900 mb-4">
              Watch your AI handle a{' '}
              <br className="hidden sm:block" />
              <em>real conversation</em>
            </h2>
            <p className="text-stone-500 max-w-xl mx-auto leading-relaxed">
              From message to quote in 30 seconds — completely automatically.
            </p>
          </div>

          {/* Grid Layout - Desktop */}
          <div className="relative hidden lg:grid grid-cols-12 gap-3 max-w-6xl mx-auto" style={{ minHeight: '600px' }}>

            {/* Row 1 */}
            <div className={`flow-card col-span-4 rounded-2xl p-4 ${isActive('incoming') ? 'active' : 'inactive'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-xs text-green-600 font-medium">INCOMING MESSAGE</span>
              </div>
              <div className="rounded-xl p-3 bg-stone-50">
                <div className="text-xs text-green-600 mb-1">WhatsApp • Just now</div>
                <div className="text-sm text-stone-700">&ldquo;Hi, I need pricing for 500 units of 2HP pumps. What&apos;s the bulk discount?&rdquo;</div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-stone-400">
                <Phone className="w-3 h-3" />
                <span>+91 98765 43210</span>
              </div>
            </div>

            <div className={`flow-card col-span-4 rounded-2xl p-4 ${isActive('customer') ? 'active' : 'inactive'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs text-blue-600 font-medium">CUSTOMER IDENTIFIED</span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">VK</div>
                <div>
                  <div className="text-sm font-medium text-stone-900">Vikram Industries</div>
                  <div className="text-xs text-stone-400">Gujarat, India</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg p-2 bg-stone-50">
                  <div className="text-stone-400">Lifetime</div>
                  <div className="text-stone-900 font-medium">₹4.2L</div>
                </div>
                <div className="rounded-lg p-2 bg-stone-50">
                  <div className="text-stone-400">Tier</div>
                  <div className="text-amber-600 font-medium">Gold</div>
                </div>
              </div>
            </div>

            <div className={`flow-card col-span-4 rounded-2xl p-4 ${isActive('history') ? 'active' : 'inactive'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <History className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-xs text-purple-600 font-medium">CONVERSATION HISTORY</span>
              </div>
              <div className="space-y-2">
                {[{ date: '15 Jan', msg: 'Ordered 200 units' }, { date: '3 Dec', msg: 'Price inquiry - 1HP' }, { date: '18 Nov', msg: 'Delivery follow-up' }].map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs rounded-lg p-2 bg-stone-50">
                    <span className="text-stone-400">{item.date}</span>
                    <span className="text-stone-600 truncate ml-2">{item.msg}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2 */}
            <div className={`flow-card col-span-3 rounded-2xl p-4 ${isActive('documents') ? 'active' : 'inactive'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Database className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-xs text-orange-600 font-medium">KNOWLEDGE BASE</span>
              </div>
              <div className="space-y-2">
                {[{ name: 'Catalog 2025.pdf', match: 98 }, { name: 'Pricing.xlsx', match: 95 }].map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs rounded-lg p-2 bg-stone-50">
                    <FileText className="w-3 h-3 text-orange-500" />
                    <span className="text-stone-600 truncate flex-1">{doc.name}</span>
                    <span className="text-rose-500 font-medium">{doc.match}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CENTER PHONE */}
            <div className="col-span-6 row-span-2 flex items-center justify-center relative">
              {activeCards.length > 0 && (
                <>
                  <div className="absolute w-72 h-[440px] rounded-[3rem] border border-rose-200 animate-pulse-ring" />
                  <div className="absolute w-80 h-[480px] rounded-[3.5rem] border border-rose-100 animate-pulse-ring" style={{ animationDelay: '0.5s' }} />
                </>
              )}

              <div
                className={`relative w-64 h-[420px] rounded-[2.5rem] border-2 transition-all duration-500 ${activeCards.length > 0 ? 'border-stone-700' : 'border-stone-300'}`}
                style={{
                  background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
                  boxShadow: activeCards.length > 0 ? '0 25px 60px rgba(0, 0, 0, 0.3)' : '0 10px 30px rgba(0, 0, 0, 0.15)'
                }}
              >
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-6 rounded-full flex items-center justify-center gap-2 bg-black">
                  <div className="w-2 h-2 rounded-full bg-neutral-700" />
                  <div className="w-8 h-1 rounded-full bg-neutral-700" />
                </div>

                <div className="absolute top-14 left-3 right-3 bottom-4 rounded-2xl overflow-hidden flex flex-col bg-[#0a0a0a]">
                  <div className="px-4 py-3 border-b border-neutral-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 bg-gradient-to-br from-rose-400 to-rose-600 rounded-xl flex items-center justify-center transition-all duration-300 ${activeCards.length > 0 ? 'scale-110 shadow-lg shadow-rose-500/50' : ''}`}>
                        <span className="text-white font-bold text-xs">P</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm">PingBox</div>
                        <div className="text-rose-400 text-[10px]">AI Assistant</div>
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${activeCards.length > 0 ? 'bg-rose-400 animate-pulse' : 'bg-neutral-700'}`} />
                  </div>

                  <div className="flex-1 p-3 flex flex-col justify-end overflow-hidden">
                    {currentPhase >= 1 && (
                      <div className="flex justify-start mb-3">
                        <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-3 py-2 text-xs bg-white/10">
                          <span className="text-white/90">Need pricing for 500 pumps...</span>
                        </div>
                      </div>
                    )}

                    {currentPhase >= 2 && currentPhase < 6 && (
                      <div className="flex justify-end mb-3">
                        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3 bg-gradient-to-r from-rose-600/30 to-rose-500/20 border border-rose-500/30">
                          <div className="flex items-center gap-2 mb-2">
                            {currentPhase < 5 ? <Loader2 className="w-3 h-3 text-rose-400 animate-spin" /> : <Bot className="w-3 h-3 text-rose-400" />}
                            <span className="text-rose-400 text-[10px] font-medium">{phase.status}</span>
                          </div>
                          <TypingDots />
                        </div>
                      </div>
                    )}

                    {currentPhase >= 5 && (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 bg-gradient-to-r from-rose-600 to-rose-500 shadow-lg shadow-rose-500/30">
                          <span className={`text-white text-xs leading-relaxed ${currentPhase === 5 ? 'typing-cursor' : ''}`}>
                            {currentPhase === 5 ? typedText : responseText}
                          </span>
                        </div>
                      </div>
                    )}

                    {currentPhase >= 6 && (
                      <div className="flex justify-end mt-1">
                        <div className="flex items-center gap-1 text-rose-400 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Delivered</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-3 border-t border-neutral-800/50">
                    <WaveformBars active={currentPhase >= 2 && currentPhase < 6} intensity={currentPhase === 5 ? 1.2 : 0.8} />
                    <div className="flex items-center justify-center gap-2 mt-2">
                      {phase.icon === 'sent' || phase.icon === 'complete' ? (
                        <CheckCircle2 className="w-4 h-4 text-rose-400" />
                      ) : currentPhase > 0 ? (
                        <div className="w-4 h-4 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-neutral-700" />
                      )}
                      <span className={`text-xs font-medium ${phase.icon === 'sent' || phase.icon === 'complete' ? 'text-rose-400' : 'text-white/60'}`}>
                        {phase.status}
                      </span>
                    </div>
                  </div>

                  {activeCards.length > 0 && currentPhase < 6 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 animate-shimmer" />
                  )}
                </div>

                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-white/20" />
              </div>
            </div>

            <div className={`flow-card col-span-3 rounded-2xl p-4 ${isActive('catalog') ? 'active' : 'inactive'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-cyan-50 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-cyan-600" />
                </div>
                <span className="text-xs text-cyan-600 font-medium">PRODUCT FOUND</span>
              </div>
              <div className="rounded-xl p-3 bg-stone-50">
                <div className="text-sm font-medium text-stone-900 mb-1">2HP Submersible Pump</div>
                <div className="text-xs text-stone-400 mb-2">SKU: SUB-2HP-001</div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Base Price</span>
                  <span className="text-stone-900 font-medium">₹12,500</span>
                </div>
              </div>
            </div>

            {/* Row 3 */}
            <div className={`flow-card col-span-3 rounded-2xl p-4 ${isActive('pricing') ? 'active' : 'inactive'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-xs text-amber-600 font-medium">PRICE CALCULATED</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-stone-400">500 × ₹12,500</span><span className="text-stone-900">₹62,50,000</span></div>
                <div className="flex justify-between text-rose-500"><span>Bulk discount</span><span>-8%</span></div>
                <div className="flex justify-between text-rose-500"><span>Gold tier</span><span>-2%</span></div>
                <div className="border-t border-stone-200 pt-2 flex justify-between font-medium"><span className="text-stone-900">Total</span><span className="text-rose-500">₹56,25,000</span></div>
              </div>
            </div>

            <div className={`flow-card col-span-3 rounded-2xl p-4 ${isActive('discounts') ? 'active' : 'inactive'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center">
                  <Tag className="w-4 h-4 text-pink-600" />
                </div>
                <span className="text-xs text-pink-600 font-medium">DISCOUNTS APPLIED</span>
              </div>
              <div className="space-y-2">
                {['500+ units: 8% off', 'Gold customer: +2%', 'Total: 10% discount'].map((rule, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs rounded-lg p-2 bg-stone-50">
                    <CheckCircle2 className="w-3 h-3 text-rose-500" />
                    <span className="text-stone-600">{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 4 */}
            <div className={`flow-card col-span-8 rounded-2xl p-4 ${isActive('response') ? 'active' : 'inactive'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-rose-500" />
                  </div>
                  <span className="text-xs text-rose-500 font-medium">AI RESPONSE</span>
                </div>
                {isActive('sent') && (
                  <div className="flex items-center gap-1 text-rose-500 text-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Sent via WhatsApp</span>
                  </div>
                )}
              </div>
              <div className="rounded-xl p-4 text-sm text-stone-700 leading-relaxed bg-stone-50">
                &ldquo;Hi! For <strong className="text-stone-900">500 units of 2HP submersible pumps</strong>:<br /><br />
                • Unit price: ₹12,500 | Bulk discount: <span className="text-rose-500 font-medium">8% off</span> | Gold bonus: <span className="text-rose-500 font-medium">+2% off</span><br /><br />
                <strong className="text-rose-500">Your total: ₹56,25,000</strong> (₹11,250/unit). Shall I prepare a formal quotation?&rdquo;
              </div>
            </div>

            <div className={`flow-card col-span-4 rounded-2xl p-4 ${isActive('revenue') ? 'active' : 'inactive'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-rose-500" />
                </div>
                <span className="text-xs text-rose-500 font-medium">REVENUE TRACKED</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg p-3 text-center bg-stone-50">
                  <div className="text-lg font-bold text-rose-500">₹56.2L</div>
                  <div className="text-xs text-stone-400">This Deal</div>
                </div>
                <div className="rounded-lg p-3 text-center bg-stone-50">
                  <div className="text-lg font-bold text-stone-900">₹2.1Cr</div>
                  <div className="text-xs text-stone-400">This Month</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Flow View */}
          <div className="lg:hidden max-w-sm mx-auto">
            <div
              className={`relative w-full max-w-[280px] mx-auto h-[500px] rounded-[2.5rem] border-2 transition-all duration-500 ${activeCards.length > 0 ? 'border-stone-700' : 'border-stone-300'}`}
              style={{
                background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
                boxShadow: activeCards.length > 0 ? '0 25px 60px rgba(0, 0, 0, 0.3)' : '0 10px 30px rgba(0, 0, 0, 0.15)'
              }}
            >
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-6 rounded-full flex items-center justify-center gap-2 bg-black">
                <div className="w-2 h-2 rounded-full bg-neutral-700" />
                <div className="w-8 h-1 rounded-full bg-neutral-700" />
              </div>

              <div className="absolute top-14 left-3 right-3 bottom-4 rounded-2xl overflow-hidden flex flex-col bg-[#0a0a0a]">
                <div className="px-4 py-3 border-b border-neutral-800/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 bg-gradient-to-br from-rose-400 to-rose-600 rounded-xl flex items-center justify-center transition-all duration-300 ${activeCards.length > 0 ? 'scale-110 shadow-lg shadow-rose-500/50' : ''}`}>
                      <span className="text-white font-bold text-xs">P</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">PingBox</div>
                      <div className="text-rose-400 text-[10px]">AI Assistant</div>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${activeCards.length > 0 ? 'bg-rose-400 animate-pulse' : 'bg-neutral-700'}`} />
                </div>

                <div className="flex-1 p-3 flex flex-col justify-end overflow-hidden">
                  {currentPhase >= 1 && (
                    <div className="flex justify-start mb-3">
                      <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-3 py-2 text-xs bg-white/10">
                        <span className="text-white/90">Need pricing for 500 pumps...</span>
                      </div>
                    </div>
                  )}

                  {currentPhase >= 2 && currentPhase < 6 && (
                    <div className="flex justify-end mb-3">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3 bg-gradient-to-r from-rose-600/30 to-rose-500/20 border border-rose-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          {currentPhase < 5 ? <Loader2 className="w-3 h-3 text-rose-400 animate-spin" /> : <Bot className="w-3 h-3 text-rose-400" />}
                          <span className="text-rose-400 text-[10px] font-medium">{phase.status}</span>
                        </div>
                        <TypingDots />
                      </div>
                    </div>
                  )}

                  {currentPhase >= 5 && (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-3 py-2 bg-gradient-to-r from-rose-600 to-rose-500 shadow-lg shadow-rose-500/30">
                        <span className={`text-white text-xs leading-relaxed ${currentPhase === 5 ? 'typing-cursor' : ''}`}>
                          {currentPhase === 5 ? typedText : responseText}
                        </span>
                      </div>
                    </div>
                  )}

                  {currentPhase >= 6 && (
                    <div className="flex justify-end mt-1">
                      <div className="flex items-center gap-1 text-rose-400 text-[10px]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Delivered</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-4 py-3 border-t border-neutral-800/50">
                  <WaveformBars active={currentPhase >= 2 && currentPhase < 6} intensity={currentPhase === 5 ? 1.2 : 0.8} />
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {phase.icon === 'sent' || phase.icon === 'complete' ? (
                      <CheckCircle2 className="w-4 h-4 text-rose-400" />
                    ) : currentPhase > 0 ? (
                      <div className="w-4 h-4 rounded-full border-2 border-rose-400 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-neutral-700" />
                    )}
                    <span className={`text-xs font-medium ${phase.icon === 'sent' || phase.icon === 'complete' ? 'text-rose-400' : 'text-white/60'}`}>
                      {phase.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 rounded-full bg-white/20" />
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-10">
            {['incoming', 'customer', 'documents', 'pricing', 'response', 'sent'].map((step) => (
              <div key={step} className={`h-1.5 rounded-full transition-all duration-500 ${isActive(step) ? 'bg-rose-500 w-8' : 'bg-stone-300 w-2'}`} />
            ))}
          </div>

          <p className="text-center mt-6 text-stone-400 text-sm">
            This entire flow happens in <span className="text-rose-500 font-medium">under 30 seconds</span> — automatically.
          </p>
        </div>
      </section>

      {/* Before/After Section */}
      <section className="py-24 px-6 relative bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl sm:text-5xl tracking-tight text-stone-900 mb-4">
              The leads you&apos;re losing{' '}
              <em>aren&apos;t your fault</em>
            </h2>
            <p className="text-lg text-stone-500 max-w-2xl mx-auto leading-relaxed">
              You can&apos;t answer every WhatsApp message in 2 minutes. But your competitors&apos; AI can.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl p-8 border border-red-200 bg-red-50/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <X className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-red-600 font-semibold text-sm tracking-wide uppercase">Without PingBox</span>
              </div>
              <div className="space-y-4">
                {[
                  'Customer messages at 10pm — you respond at 9am',
                  'They\'ve already talked to 3 competitors',
                  'You answer "What\'s the price?" for the 50th time',
                  'Hot leads go cold while you\'re in meetings',
                  'No idea which conversations turned into revenue'
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <X className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-stone-600 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-8 border border-stone-200 bg-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                  <Check className="w-5 h-5 text-rose-500" />
                </div>
                <span className="text-stone-900 font-semibold text-sm tracking-wide uppercase">With PingBox</span>
              </div>
              <div className="space-y-4">
                {[
                  'AI responds in 30 seconds — even at 3am',
                  'Accurate answers from YOUR documents',
                  'You handle complex deals, AI handles routine',
                  'Every conversation tracked with revenue',
                  'Wake up to qualified leads, not missed messages'
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                    <span className="text-stone-600 text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-24 px-6 relative" style={{ backgroundColor: '#faf8f5' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-rose-500 text-sm font-medium tracking-widest uppercase mb-4">How it works</p>
            <h2 className="font-serif text-3xl sm:text-5xl tracking-tight text-stone-900">
              5 minutes to set up.{' '}
              <em>Runs 24/7.</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, i) => (
              <div key={i} className="group text-center">
                <div className="w-16 h-16 bg-white border border-stone-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:border-rose-200 transition-colors shadow-sm">
                  <span className="text-stone-900 text-2xl font-serif">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-stone-900">{item.title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Works For */}
      <section className="py-24 px-6 relative bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-rose-500 text-sm font-medium tracking-widest uppercase mb-4">Works for</p>
            <h2 className="font-serif text-3xl sm:text-5xl tracking-tight text-stone-900">
              Any business that answers{' '}
              <br className="hidden sm:block" />
              <em>the same questions</em> daily
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { name: 'Consultants', examples: 'Study abroad, immigration, financial advisors', question: '"What\'s the fee? What\'s the process?"' },
              { name: 'Service Businesses', examples: 'Real estate, healthcare, professional services', question: '"Is this available? What\'s the price?"' },
              { name: 'B2B Sales', examples: 'Manufacturers, distributors, wholesalers', question: '"What\'s the bulk rate? MOQ?"' },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl p-6 border border-stone-200 hover:border-stone-300 transition-colors bg-white">
                <h3 className="text-lg font-semibold text-stone-900 mb-1">{item.name}</h3>
                <p className="text-sm text-stone-400 mb-4">{item.examples}</p>
                <div className="rounded-xl p-3 bg-stone-50">
                  <p className="text-sm text-stone-500 italic">{item.question}</p>
                  <p className="text-xs text-rose-500 mt-2 font-medium">→ AI answers in 30 seconds</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 relative" style={{ backgroundColor: '#faf8f5' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-rose-500 text-sm font-medium tracking-widest uppercase mb-4">Pricing</p>
            <h2 className="font-serif text-3xl sm:text-5xl tracking-tight text-stone-900">
              One plan. <em>Everything included.</em>
            </h2>
          </div>

          <div className="border border-stone-200 rounded-3xl p-8 md:p-12 relative overflow-hidden bg-white shadow-sm">
            <div className="absolute top-0 right-0 bg-stone-900 text-white text-xs font-semibold px-4 py-1.5 rounded-bl-xl">
              14-DAY FREE TRIAL
            </div>

            <div className="text-center mb-8">
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="font-serif text-5xl md:text-6xl font-bold text-stone-900">₹7,999</span>
                <span className="text-stone-400">/month</span>
              </div>
              <p className="text-stone-500">Close ONE extra lead and it pays for itself</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                'All channels (WhatsApp, Telegram, SMS)',
                'Unlimited documents',
                'Unlimited team members',
                'Unlimited AI responses',
                'Revenue tracking',
                'Smart broadcasts',
                'Priority support',
                'No setup fees',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-rose-500 flex-shrink-0" />
                  <span className="text-stone-600">{item}</span>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link href="/early-access" className="inline-flex items-center bg-stone-900 text-white pl-8 pr-2 py-2 rounded-full font-medium hover:bg-stone-800 transition-colors">
                <span className="mr-4">Start free — no credit card</span>
                <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </Link>
              <p className="text-sm text-stone-400 mt-4">
                Full refund in first 30 days. No questions asked.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="cta" className="py-24 px-6 relative overflow-hidden bg-stone-900">
        <div className="max-w-3xl mx-auto relative text-center">
          <h2 className="font-serif text-3xl sm:text-5xl tracking-tight mb-4 text-white">
            Stop losing leads to{' '}
            <em className="text-rose-400">faster competitors</em>
          </h2>
          <p className="text-lg text-stone-400 mb-10 leading-relaxed">
            Connect your WhatsApp. Upload one document. See your first AI response in 5 minutes.
          </p>

          <Link href="/early-access" className="inline-flex items-center bg-white text-stone-900 pl-8 pr-2 py-2 rounded-full font-medium hover:bg-stone-100 transition-colors">
            <span className="mr-4">Start free trial</span>
            <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
          </Link>

          <p className="text-sm text-stone-500 mt-8">
            Questions? <a href="mailto:hello@pingbox.io" className="text-rose-400 hover:underline">hello@pingbox.io</a>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-stone-200" style={{ backgroundColor: '#faf8f5' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="font-semibold text-stone-900">PingBox</span>
          </Link>
          <div className="flex items-center gap-8 text-sm text-stone-400">
            <Link href="/privacy" className="hover:text-stone-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-stone-900 transition-colors">Terms</Link>
            <a href="mailto:hello@pingbox.io" className="hover:text-stone-900 transition-colors">Contact</a>
          </div>
          <div className="text-sm text-stone-400">© 2025 PingBox. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
