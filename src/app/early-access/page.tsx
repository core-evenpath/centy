'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, MessageSquare, Bot, Clock, FileText, Zap, Shield, Users, TrendingUp, Sparkles } from 'lucide-react';
import { saveEarlyAccessSignupAction } from '../../actions/early-access-actions';
import { useToast } from '../../hooks/use-toast';

const useCases = [
  {
    icon: MessageSquare,
    title: 'Instant Responses',
    description: 'AI replies to WhatsApp messages in under 30 seconds, even at 3am',
  },
  {
    icon: FileText,
    title: 'Document Intelligence',
    description: 'Upload catalogs, price lists, FAQs — AI learns your business instantly',
  },
  {
    icon: Users,
    title: 'Customer Memory',
    description: 'Remembers every customer, their history, preferences, and past orders',
  },
  {
    icon: TrendingUp,
    title: 'Revenue Tracking',
    description: 'Every conversation tracked with deal values and conversion rates',
  },
  {
    icon: Zap,
    title: 'Smart Pricing',
    description: 'Automatic bulk discounts, loyalty tiers, and custom pricing rules',
  },
  {
    icon: Shield,
    title: 'You Stay in Control',
    description: 'Review and approve AI responses before they go out, or let it fly solo',
  },
];

const benefits = [
  'Never miss a lead — even at midnight',
  'Stop answering the same questions daily',
  'Close 3-5 more deals per month',
  'Save 20+ hours per week on responses',
];

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
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#faf8f5' }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-stone-200/60" style={{ backgroundColor: 'rgba(250, 248, 245, 0.9)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" aria-label="Pingbox home">
            <img src="/images/brand/logo.svg" alt="Pingbox" className="h-10 w-auto" />
          </Link>
          <Link href="/partner/login" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-200 mb-6">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span className="text-sm text-rose-600 font-medium">Beta Access — Limited Spots</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight text-stone-900 mb-6 leading-[1.1]">
            Be first to{' '}
            <br className="hidden sm:block" />
            <em>transform your sales</em>
          </h1>

          <p className="text-lg sm:text-xl text-stone-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join 500+ businesses already on the waitlist. Get early access to AI-powered customer messaging that never sleeps.
          </p>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mb-8">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-stone-600">
                <Check className="w-4 h-4 text-rose-500" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signup Form Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-lg mx-auto">
          <div className="rounded-3xl p-8 md:p-10 border border-stone-200 bg-white shadow-sm">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-stone-900 mb-2">
                Join the <em>waitlist</em>
              </h2>
              <p className="text-stone-500">
                Get notified when we launch. Early birds get special pricing.
              </p>
            </div>

            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-2">
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
                    className="w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-2">
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
                    className="w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 placeholder-stone-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center bg-stone-900 text-white pl-6 pr-2 py-2 rounded-full font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2 py-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Joining...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="mr-2">Get Early Access</span>
                      <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center">
                        <ArrowRight className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-semibold text-stone-900 mb-2">You&apos;re on the list!</h3>
                <p className="text-stone-500">
                  We&apos;ll notify you as soon as PingBox is ready. Check your inbox for confirmation.
                </p>
              </div>
            )}

            <p className="text-stone-400 text-sm text-center mt-6">
              No spam, ever. Unsubscribe anytime.
            </p>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-8 mt-8 text-sm text-stone-400">
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

      {/* Use Cases Grid */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-rose-500 text-sm font-medium tracking-widest uppercase mb-4">What you get</p>
            <h2 className="font-serif text-3xl sm:text-4xl tracking-tight text-stone-900">
              Everything you need to <em>close more deals</em>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {useCases.map((useCase, i) => {
              const Icon = useCase.icon;
              const isActive = i === activeIndex;
              return (
                <div
                  key={i}
                  className={`rounded-2xl p-6 border bg-white transition-all duration-500 ${
                    isActive ? 'border-rose-300 shadow-lg shadow-rose-100' : 'border-stone-200'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-stone-50">
                    <Icon className="w-6 h-6 text-stone-700" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 mb-2">{useCase.title}</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">{useCase.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Works For Section */}
      <section className="py-16 px-6" style={{ backgroundColor: '#faf8f5' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-rose-500 text-sm font-medium tracking-widest uppercase mb-4">Perfect for</p>
            <h2 className="font-serif text-2xl sm:text-3xl tracking-tight text-stone-900">
              Built for businesses that <em>talk to customers</em>
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { title: 'Consultants', examples: 'Immigration, Education, Finance' },
              { title: 'Service Providers', examples: 'Real Estate, Healthcare, Legal' },
              { title: 'B2B Sales', examples: 'Manufacturers, Distributors' },
            ].map((item, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 border border-stone-200 hover:border-stone-300 transition-colors bg-white text-center"
              >
                <h3 className="text-lg font-semibold text-stone-900 mb-1">{item.title}</h3>
                <p className="text-sm text-stone-400">{item.examples}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-stone-200" style={{ backgroundColor: '#faf8f5' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" aria-label="Pingbox home">
            <img src="/images/brand/logo.svg" alt="Pingbox" className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-8 text-sm text-stone-400">
            <Link href="/" className="hover:text-stone-900 transition-colors">Home</Link>
            <Link href="/privacy" className="hover:text-stone-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-stone-900 transition-colors">Terms</Link>
          </div>
          <div className="text-sm text-stone-400">&copy; 2025 PingBox. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
