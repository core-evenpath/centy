"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { createTenant } from '@/ai/flows/create-tenant-flow';
import { createUserInTenant } from '@/ai/flows/user-management-flow';
import { getTenantForEmailAction } from '@/actions/auth-actions';
import { SUPPORTED_REGIONS } from '@/lib/business-persona-types';
import {
  MessageSquare,
  FileText,
  Users,
  TrendingUp,
  Zap,
  Shield,
  Building2,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'Instant AI Responses',
    description: 'Reply to customers in 30 seconds, 24/7',
    stat: '30s',
    statLabel: 'response time',
  },
  {
    icon: FileText,
    title: 'Smart Documents',
    description: 'AI learns from your catalogs & price lists',
    stat: '100%',
    statLabel: 'accuracy',
  },
  {
    icon: Users,
    title: 'Customer Memory',
    description: 'Remember every customer interaction',
    stat: '∞',
    statLabel: 'history',
  },
  {
    icon: TrendingUp,
    title: 'Revenue Tracking',
    description: 'Track deals from message to conversion',
    stat: '3-5x',
    statLabel: 'more deals',
  },
  {
    icon: Zap,
    title: 'Auto Pricing',
    description: 'Bulk discounts & loyalty tiers automatic',
    stat: '10%',
    statLabel: 'avg discount',
  },
  {
    icon: Shield,
    title: 'Full Control',
    description: 'Approve AI responses or let it fly solo',
    stat: '100%',
    statLabel: 'your rules',
  },
];

export default function PartnerSignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [currency, setCurrency] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const cardInterval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % features.length);
    }, 2500);
    return () => clearInterval(cardInterval);
  }, []);

  const handleRegionSelect = (regionId: string) => {
    const region = SUPPORTED_REGIONS.find(r => r.id === regionId);
    if (region) {
      setSelectedRegion(regionId);
      setCurrency(region.currency);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const existingUserCheck = await getTenantForEmailAction(email);
      if (existingUserCheck.success && existingUserCheck.tenantId) {
        throw new Error("An account with this email already exists. Please log in.");
      }

      const tenantResult = await createTenant({
        partnerName: name,
        email: email,
        currency: currency,
      });

      if (!tenantResult.success || !tenantResult.tenantId || !tenantResult.partnerId) {
        throw new Error(tenantResult.message || "Failed to create a new partner workspace.");
      }

      const userResult = await createUserInTenant({
        email: email,
        password: password,
        tenantId: tenantResult.tenantId,
        displayName: name,
        partnerId: tenantResult.partnerId,
        role: 'partner_admin',
      });

      if (!userResult.success) {
        throw new Error(userResult.message || "Workspace created, but failed to set up admin user.");
      }

      const auth = getAuth(app);
      auth.tenantId = tenantResult.tenantId;
      await signInWithEmailAndPassword(auth, email, password);
      auth.tenantId = null;

      await new Promise(resolve => setTimeout(resolve, 1500));

      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.getIdTokenResult(true);
      }

      toast({
        title: "Welcome to PingBox!",
        description: "Let's set up your business profile.",
      });

      router.push('/partner/settings');

    } catch (error: any) {
      console.error("Signup Error:", error);

      let errorMessage = "Failed to create account. Please try again.";
      if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = !isLoading && name.trim().length >= 2 && email.includes('@') && password.length >= 6 && !!selectedRegion;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#faf8f5' }}>
      {/* Left Side - Feature Showcase */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden p-8 xl:p-12 flex-col border-r border-stone-200">
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5 mb-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="font-semibold text-stone-900 text-xl tracking-tight">PingBox</span>
          </Link>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 mb-10">
          <h1 className="font-serif text-3xl xl:text-4xl tracking-tight text-stone-900 mb-3 leading-[1.1]">
            Get your AI sales team{' '}
            <br />
            <em>up and running</em>
          </h1>
          <p className="text-stone-500 max-w-md leading-relaxed">
            Set up your workspace in 30 seconds. Your AI assistant handles the rest.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              const isActive = i === activeCard;
              return (
                <div
                  key={i}
                  className={`rounded-xl p-4 border bg-white transition-all duration-500 ${
                    isActive ? 'border-rose-300 shadow-lg shadow-rose-100' : 'border-stone-200'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-stone-50">
                    <Icon className="w-5 h-5 text-stone-700" />
                  </div>
                  <h3 className="text-sm font-semibold text-stone-900 mb-1">{feature.title}</h3>
                  <p className="text-xs text-stone-400 mb-2">{feature.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-rose-500">{feature.stat}</span>
                    <span className="text-xs text-stone-400">{feature.statLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="font-semibold text-stone-900 text-xl tracking-tight">PingBox</span>
            </Link>
          </div>

          {/* Signup Card */}
          <div className="rounded-2xl p-8 border border-stone-200 bg-white shadow-sm">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <h2 className="font-serif text-2xl tracking-tight text-stone-900 mb-2">Create your workspace</h2>
              <p className="text-stone-500 text-sm">
                Start managing customer conversations with AI
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-stone-700">Organization Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your Company Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-rose-500 focus:ring-rose-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-stone-700">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-rose-500 focus:ring-rose-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-stone-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-rose-500 focus:ring-rose-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-stone-700">Region</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SUPPORTED_REGIONS.map((region) => (
                    <button
                      key={region.id}
                      type="button"
                      onClick={() => handleRegionSelect(region.id)}
                      disabled={isLoading}
                      className={`rounded-xl border px-3 py-2.5 flex items-center gap-2 text-left transition-all ${
                        selectedRegion === region.id
                          ? 'border-rose-400 bg-rose-50 shadow-sm'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <span className="text-lg">{region.flag}</span>
                      <span className="text-sm font-medium text-stone-900">{region.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl h-12 transition-all"
                disabled={!isFormValid}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Setting up...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Create workspace
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-2 text-center">
              <p className="text-stone-500 text-sm">
                Already have an account?{" "}
                <Link href="/partner/login" className="text-rose-500 hover:underline font-medium">
                  Sign in
                </Link>
              </p>
              <p className="text-stone-500 text-sm">
                Have an invite code?{" "}
                <Link href="/partner/join" className="text-rose-500 hover:underline font-medium">
                  Join your team
                </Link>
              </p>
            </div>
          </div>

          {/* Back to home */}
          <div className="text-center mt-8">
            <Link href="/" className="text-stone-400 hover:text-stone-900 text-sm transition-colors">
              &larr; Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
