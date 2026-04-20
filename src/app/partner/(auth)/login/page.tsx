"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { useToast } from "../../../../hooks/use-toast";
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../../../../lib/firebase';
import { getTenantForEmailAction } from '../../../../actions/auth-actions';
import {
  MessageSquare,
  FileText,
  Users,
  TrendingUp,
  Zap,
  Bot,
  ArrowRight,
  CheckCircle2,
  Shield,
  Sparkles,
} from 'lucide-react';

const auth = getAuth(app);

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

export default function PartnerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const cardInterval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % features.length);
    }, 2500);

    return () => {
      clearInterval(cardInterval);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let tenantId: string | null = null;

    try {
      console.log('Partner Login: Starting login process for', email);

      const tenantLookup = await getTenantForEmailAction(email);
      console.log('Partner Login: Tenant lookup result', tenantLookup);

      if (!tenantLookup.success || !tenantLookup.tenantId) {
        throw new Error(tenantLookup.message || "Your organization could not be found.");
      }

      tenantId = tenantLookup.tenantId;
      console.log('Partner Login: Using tenant ID', tenantId);

      auth.tenantId = tenantId;

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Partner Login: User signed in successfully', userCredential.user.uid);

      await new Promise(resolve => setTimeout(resolve, 1000));

      const tokenResult = await userCredential.user.getIdTokenResult(true);
      console.log('Partner Login: User custom claims', tokenResult.claims);

      toast({ title: "Login Successful", description: "Redirecting to your workspace..." });

      router.push('/partner');

    } catch (error: any) {
      console.error("Partner Login Error:", error);

      let errorMessage = "An unknown error occurred.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          errorMessage = "Invalid email or password. Please try again.";
      } else if (error.code === 'auth/invalid-tenant-id') {
          errorMessage = "Your organization could not be found. Please contact support or try signing up.";
      } else if (error.message) {
          errorMessage = error.message;
      }

      toast({
        variant: "destructive",
        title: "Login Failed",
        description: errorMessage,
      });
    } finally {
        auth.tenantId = null;
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#faf8f5' }}>
      {/* Left Side - Feature Showcase */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden p-8 xl:p-12 flex-col border-r border-stone-200">
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5 mb-10">
          <Link href="/" aria-label="Pingbox home">
            <img src="/images/brand/logo.svg" alt="Pingbox" className="h-12 w-auto" />
          </Link>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-200 mb-5">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span className="text-sm text-rose-600 font-medium">Partner Portal</span>
          </div>
          <h1 className="font-serif text-3xl xl:text-4xl tracking-tight text-stone-900 mb-3 leading-[1.1]">
            Your AI sales team is{' '}
            <br />
            <em>ready and waiting</em>
          </h1>
          <p className="text-stone-500 max-w-md leading-relaxed">
            Sign in to manage your automated customer conversations and close more deals.
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

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <Link href="/" aria-label="Pingbox home">
              <img src="/images/brand/logo.svg" alt="Pingbox" className="h-10 w-auto" />
            </Link>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl p-8 border border-stone-200 bg-white shadow-sm">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <h2 className="font-serif text-2xl tracking-tight text-stone-900 mb-2">Welcome <em>back</em></h2>
              <p className="text-stone-500 text-sm">
                Sign in to your partner workspace
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-stone-700">Email</Label>
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-stone-50 border-stone-200 text-stone-900 placeholder-stone-400 focus:border-rose-500 focus:ring-rose-500/20"
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
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="mr-2">Sign In</span>
                    <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-stone-400 text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/early-access" className="text-rose-500 hover:text-rose-600 transition-colors font-medium">
                  Join Waitlist
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
