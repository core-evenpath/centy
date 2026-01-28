"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Button } from "../../../../components/ui/button";
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
  Sparkles,
  CheckCircle2,
  Clock,
  DollarSign,
  Shield
} from 'lucide-react';

const auth = getAuth(app);

function GlowOrb({ className }: { className: string }) {
  return (
    <div className={`absolute rounded-full blur-3xl ${className}`} />
  );
}

const useCases = [
  {
    icon: MessageSquare,
    title: 'Instant AI Responses',
    description: 'Reply to customers in 30 seconds, 24/7',
    stat: '30s',
    statLabel: 'response time',
    color: 'emerald'
  },
  {
    icon: FileText,
    title: 'Smart Documents',
    description: 'AI learns from your catalogs & price lists',
    stat: '100%',
    statLabel: 'accuracy',
    color: 'teal'
  },
  {
    icon: Users,
    title: 'Customer Memory',
    description: 'Remember every customer interaction',
    stat: '∞',
    statLabel: 'history',
    color: 'cyan'
  },
  {
    icon: TrendingUp,
    title: 'Revenue Tracking',
    description: 'Track deals from message to conversion',
    stat: '3-5x',
    statLabel: 'more deals',
    color: 'emerald'
  },
  {
    icon: Zap,
    title: 'Auto Pricing',
    description: 'Bulk discounts & loyalty tiers automatic',
    stat: '10%',
    statLabel: 'avg discount',
    color: 'teal'
  },
  {
    icon: Shield,
    title: 'Full Control',
    description: 'Approve AI responses or let it fly solo',
    stat: '100%',
    statLabel: 'your rules',
    color: 'cyan'
  },
];

const testimonials = [
  {
    quote: "Closed 23 deals last month while I was asleep",
    author: "Priya M.",
    role: "Consultant, Mumbai"
  },
  {
    quote: "Response time went from 2 hours to 30 seconds",
    author: "Vikram K.",
    role: "Distributor, Gujarat"
  },
  {
    quote: "Best investment for my real estate business",
    author: "Sarah J.",
    role: "Real Estate, Bangalore"
  },
];

export default function PartnerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const cardInterval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % useCases.length);
    }, 2500);

    const testimonialInterval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    return () => {
      clearInterval(cardInterval);
      clearInterval(testimonialInterval);
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
    <div className="min-h-screen flex" style={{ backgroundColor: '#040d07' }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes slide-up {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.2); }
          50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.4); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-ring { animation: pulse-ring 2s ease-out infinite; }
        .animate-shimmer {
          background: linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.2), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }
        .animate-slide-up { animation: slide-up 0.5s ease-out forwards; }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
        .card-hover {
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover.active {
          transform: scale(1.02);
          border-color: rgba(16, 185, 129, 0.5);
          box-shadow: 0 0 30px rgba(16, 185, 129, 0.2);
        }
        .stat-glow {
          text-shadow: 0 0 20px rgba(52, 211, 153, 0.5);
        }
      `}</style>

      {/* Left Side - Animated Showcase */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden p-8 flex-col">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, #0a1f14 0%, #040d07 70%)' }} />
        <GlowOrb className="w-[600px] h-[600px] bg-emerald-600/10 top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        <GlowOrb className="w-[400px] h-[400px] bg-teal-600/10 bottom-1/4 right-1/4 animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5 mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="font-semibold text-white text-xl tracking-tight">PingBox</span>
          </Link>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-300">Welcome back</span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold text-white mb-3">
            Your AI sales team is
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              ready and waiting
            </span>
          </h1>
          <p className="text-emerald-100/50 max-w-md">
            Sign in to manage your automated customer conversations and close more deals.
          </p>
        </div>

        {/* Use Cases Grid */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {useCases.map((useCase, i) => {
              const Icon = useCase.icon;
              const isActive = i === activeCard;
              return (
                <div
                  key={i}
                  className={`card-hover rounded-xl p-4 border border-emerald-900/30 ${isActive ? 'active' : ''}`}
                  style={{
                    background: 'linear-gradient(135deg, rgba(12, 35, 24, 0.7) 0%, rgba(6, 21, 16, 0.7) 100%)',
                    animationDelay: `${i * 100}ms`
                  }}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    useCase.color === 'emerald' ? 'bg-emerald-500/20' :
                    useCase.color === 'teal' ? 'bg-teal-500/20' : 'bg-cyan-500/20'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      useCase.color === 'emerald' ? 'text-emerald-400' :
                      useCase.color === 'teal' ? 'text-teal-400' : 'text-cyan-400'
                    }`} />
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{useCase.title}</h3>
                  <p className="text-xs text-emerald-100/40 mb-2">{useCase.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-bold stat-glow ${
                      useCase.color === 'emerald' ? 'text-emerald-400' :
                      useCase.color === 'teal' ? 'text-teal-400' : 'text-cyan-400'
                    }`}>{useCase.stat}</span>
                    <span className="text-xs text-emerald-100/30">{useCase.statLabel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 mt-8">
          <div
            className="rounded-xl p-5 border border-emerald-500/20"
            style={{ background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.2) 0%, rgba(4, 13, 7, 0.8) 100%)' }}
          >
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-white text-sm mb-3 italic">"{testimonials[activeTestimonial].quote}"</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {testimonials[activeTestimonial].author.charAt(0)}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{testimonials[activeTestimonial].author}</p>
                <p className="text-emerald-100/40 text-xs">{testimonials[activeTestimonial].role}</p>
              </div>
            </div>
            {/* Testimonial dots */}
            <div className="flex justify-center gap-1.5 mt-4">
              {testimonials.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === activeTestimonial ? 'w-6 bg-emerald-400' : 'w-1.5 bg-emerald-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="absolute inset-0 lg:hidden" style={{ background: 'radial-gradient(ellipse at center, #0a1f14 0%, #040d07 70%)' }} />
        <GlowOrb className="w-[400px] h-[400px] bg-emerald-600/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse lg:hidden" />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="font-semibold text-white text-xl tracking-tight">PingBox</span>
            </Link>
          </div>

          {/* Login Card */}
          <div
            className="rounded-2xl p-8 border border-emerald-500/20 animate-glow"
            style={{ background: 'linear-gradient(135deg, rgba(12, 35, 24, 0.9) 0%, rgba(6, 21, 16, 0.95) 100%)' }}
          >
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-emerald-100/50 text-sm">
                Sign in to your partner workspace
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-emerald-100/70">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-emerald-950/50 border-emerald-800/50 text-white placeholder-emerald-100/30 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-emerald-100/70">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-emerald-950/50 border-emerald-800/50 text-white placeholder-emerald-100/30 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold py-5 rounded-xl transition-all shadow-lg shadow-emerald-500/25"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-emerald-100/40 text-sm">
                Don't have an account?{" "}
                <Link href="/early-access" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                  Join Waitlist
                </Link>
              </p>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-emerald-100/30">
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
            <Link href="/" className="text-emerald-100/40 hover:text-emerald-400 text-sm transition-colors">
              ← Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
