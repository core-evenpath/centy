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
import { createUserInTenant } from '@/ai/flows/user-management-flow';
import { getTenantForEmailAction } from '@/actions/auth-actions';
import {
  MessageSquare,
  FileText,
  Users,
  TrendingUp,
  Zap,
  Shield,
  UserPlus,
  ArrowRight,
  CheckCircle2,
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

export default function JoinPartnerPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationCode, setOrganizationCode] = useState('');
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

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const domainEmail = `admin@${organizationCode}`;
      const tenantLookup = await getTenantForEmailAction(domainEmail);

      if (!tenantLookup.success || !tenantLookup.tenantId) {
        throw new Error("Organization not found. Please check your organization code or contact your admin.");
      }

      const userResult = await createUserInTenant({
        email: email,
        password: password,
        tenantId: tenantLookup.tenantId,
        displayName: name,
        partnerId: tenantLookup.tenantId,
      });

      if (!userResult.success) {
        throw new Error(userResult.message || "Failed to create account.");
      }

      const auth = getAuth(app);
      auth.tenantId = tenantLookup.tenantId;
      await signInWithEmailAndPassword(auth, email, password);
      auth.tenantId = null;

      await new Promise(resolve => setTimeout(resolve, 1000));

      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.getIdTokenResult(true);
      }

      toast({
        title: "Welcome to the team!",
        description: "You've joined your organization's workspace.",
      });

      router.push('/partner');

    } catch (error: any) {
      console.error("Join Error:", error);

      let errorMessage = "Failed to join organization. Please try again.";
      if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Join Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = !isLoading && organizationCode.trim().length > 0 && name.trim().length >= 2 && email.includes('@') && password.length >= 6;

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
            Join your team&apos;s{' '}
            <br />
            <em>AI workspace</em>
          </h1>
          <p className="text-stone-500 max-w-md leading-relaxed">
            Accept your invitation and start collaborating with your team's AI sales assistant.
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

      {/* Right Side - Join Form */}
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

          {/* Join Card */}
          <div className="rounded-2xl p-8 border border-stone-200 bg-white shadow-sm">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-7 h-7 text-white" />
              </div>
              <h2 className="font-serif text-2xl tracking-tight text-stone-900 mb-2">Join your organization</h2>
              <p className="text-stone-500 text-sm">
                Enter your invite code to access your team&apos;s workspace
              </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="organizationCode" className="text-stone-700">Organization Code</Label>
                <Input
                  id="organizationCode"
                  type="text"
                  placeholder="your-company-domain"
                  value={organizationCode}
                  onChange={(e) => setOrganizationCode(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-rose-500 focus:ring-rose-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-stone-700">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your Full Name"
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

              <Button
                type="submit"
                className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl h-12 transition-all"
                disabled={!isFormValid}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Joining...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Join workspace
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
                Need a new workspace?{" "}
                <Link href="/partner/signup" className="text-rose-500 hover:underline font-medium">
                  Create one
                </Link>
              </p>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-stone-400">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Secure Login</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Enterprise Ready</span>
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
