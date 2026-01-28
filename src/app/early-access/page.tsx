'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, MessageSquare, Bot, Clock, FileText, Zap, Shield, Users, TrendingUp, Sparkles, Send } from 'lucide-react';
import { saveEarlyAccessSignupAction } from '../../actions/early-access-actions';
import { useToast } from '../../hooks/use-toast';

function GlowOrb({ className }: { className: string }) {
  return (
    <div className={`absolute rounded-full blur-3xl ${className}`} />
  );
}

const useCases = [
  {
    icon: MessageSquare,
    title: 'Instant Responses',
    description: 'AI replies to WhatsApp messages in under 30 seconds, even at 3am',
    color: 'emerald'
  },
  {
    icon: FileText,
    title: 'Document Intelligence',
    description: 'Upload catalogs, price lists, FAQs — AI learns your business instantly',
    color: 'teal'
  },
  {
    icon: Users,
    title: 'Customer Memory',
    description: 'Remembers every customer, their history, preferences, and past orders',
    color: 'cyan'
  },
  {
    icon: TrendingUp,
    title: 'Revenue Tracking',
    description: 'Every conversation tracked with deal values and conversion rates',
    color: 'emerald'
  },
  {
    icon: Zap,
    title: 'Smart Pricing',
    description: 'Automatic bulk discounts, loyalty tiers, and custom pricing rules',
    color: 'teal'
  },
  {
    icon: Shield,
    title: 'You Stay in Control',
    description: 'Review and approve AI responses before they go out, or let it fly solo',
    color: 'cyan'
  },
];

const benefits = [
  'Never miss a lead — even at midnight',
  'Stop answering the same questions daily',
  'Close 3-5 more deals per month',
  'Save 20+ hours per week on responses',
];

function FloatingCard({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <div
      className="animate-float"
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: '4s',
      }}
    >
      {children}
    </div>
  );
}

export default function EarlyAccessPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % useCases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await saveEarlyAccessSignupAction(formData);

      if (result.success) {
        setIsSubmitted(true);
        toast({
          title: 'Success!',
          description: "You're on the list. We'll be in touch soon.",
        });
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
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ backgroundColor: '#040d07' }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-pulse-soft { animation: pulse-soft 2s ease-in-out infinite; }
        .card-glow {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-glow:hover, .card-glow.active {
          border-color: rgba(16, 185, 129, 0.5);
          box-shadow: 0 0 40px rgba(16, 185, 129, 0.15);
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
          <Link href="/partner/login" className="text-sm text-emerald-100/60 hover:text-white transition-colors">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, #0a1f14 0%, #040d07 70%)' }} />
        <GlowOrb className="w-[600px] h-[600px] bg-emerald-600/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-300">Beta Access — Limited Spots</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="text-white">Be First to</span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Transform Your Sales
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-emerald-100/60 max-w-2xl mx-auto mb-8 leading-relaxed">
            Join 500+ businesses already on the waitlist. Get early access to AI-powered customer messaging that never sleeps.
          </p>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-emerald-100/70">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Grid */}
      <section className="py-16 px-6 relative">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #040d07 0%, #081a10 50%, #040d07 100%)' }} />

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12">
            <span className="text-emerald-400 text-sm font-medium tracking-wider">WHAT YOU GET</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-4 text-white">
              Everything you need to <span className="text-emerald-100/40">close more deals</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((useCase, i) => {
              const Icon = useCase.icon;
              const isActive = i === activeIndex;
              return (
                <div
                  key={i}
                  className={`card-glow rounded-2xl p-6 border border-emerald-900/30 ${isActive ? 'active' : ''}`}
                  style={{ background: 'linear-gradient(135deg, rgba(12, 35, 24, 0.6) 0%, rgba(6, 21, 16, 0.6) 100%)' }}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    useCase.color === 'emerald' ? 'bg-emerald-500/20' :
                    useCase.color === 'teal' ? 'bg-teal-500/20' : 'bg-cyan-500/20'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      useCase.color === 'emerald' ? 'text-emerald-400' :
                      useCase.color === 'teal' ? 'text-teal-400' : 'text-cyan-400'
                    }`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{useCase.title}</h3>
                  <p className="text-sm text-emerald-100/50">{useCase.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Signup Form Section */}
      <section className="py-20 px-6 relative overflow-hidden">
        <GlowOrb className="w-[800px] h-[800px] bg-emerald-500/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

        <div className="max-w-lg mx-auto relative">
          <div
            className="rounded-3xl p-8 md:p-10 border border-emerald-500/30"
            style={{ background: 'linear-gradient(135deg, rgba(12, 35, 24, 0.8) 0%, rgba(6, 21, 16, 0.9) 100%)' }}
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Join the Waitlist
              </h2>
              <p className="text-emerald-100/50">
                Get notified when we launch. Early birds get special pricing.
              </p>
            </div>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-emerald-100/70 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    required
                    className="w-full px-4 py-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-white placeholder-emerald-100/30 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-emerald-100/70 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                    required
                    className="w-full px-4 py-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/50 text-white placeholder-emerald-100/30 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      Get Early Access
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">You're on the list!</h3>
                <p className="text-emerald-100/50">
                  We'll notify you as soon as PingBox is ready. Check your inbox for confirmation.
                </p>
              </div>
            )}

            <p className="text-emerald-100/30 text-sm text-center mt-6">
              No spam, ever. Unsubscribe anytime.
            </p>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-8 mt-8 text-sm text-emerald-100/40">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Takes 30 seconds</span>
            </div>
          </div>
        </div>
      </section>

      {/* Works For Section */}
      <section className="py-16 px-6 relative" style={{ backgroundColor: '#040d07' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-emerald-400 text-sm font-medium tracking-wider">PERFECT FOR</span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-4 text-white">
              Built for businesses that <span className="text-emerald-100/40">talk to customers</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                title: 'Consultants',
                examples: 'Immigration, Education, Finance',
                icon: '💼'
              },
              {
                title: 'Service Providers',
                examples: 'Real Estate, Healthcare, Legal',
                icon: '🏢'
              },
              {
                title: 'B2B Sales',
                examples: 'Manufacturers, Distributors',
                icon: '🏭'
              },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 border border-emerald-900/30 hover:border-emerald-500/30 transition-all text-center"
                style={{ background: 'linear-gradient(135deg, rgba(12, 35, 24, 0.4) 0%, rgba(6, 21, 16, 0.4) 100%)' }}
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-emerald-100/40">{item.examples}</p>
              </div>
            ))}
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
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
          <div className="text-sm text-emerald-100/30">© 2025 PingBox. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
