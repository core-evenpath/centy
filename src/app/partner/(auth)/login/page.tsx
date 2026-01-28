"use client";

import { useState } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { useToast } from "../../../../hooks/use-toast";
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../../../../lib/firebase';
import { getTenantForEmailAction } from '../../../../actions/auth-actions';
import { Bot, ArrowRight, ArrowLeft, Lock, Mail } from 'lucide-react';

const auth = getAuth(app);

export default function PartnerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#040d07' }}>
      {/* Background gradient */}
      <div className="fixed inset-0" style={{ background: 'radial-gradient(ellipse at center, #0a1f14 0%, #040d07 70%)' }} />

      {/* Subtle background orbs */}
      <div className="fixed w-[500px] h-[500px] rounded-full blur-3xl bg-emerald-600/5 top-1/4 -left-48" />
      <div className="fixed w-[400px] h-[400px] rounded-full blur-3xl bg-teal-600/5 bottom-1/4 -right-32" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="font-semibold text-white text-2xl tracking-tight">PingBox</span>
          </Link>
        </div>

        {/* Login Card */}
        <div
          className="rounded-2xl p-8 border border-emerald-900/40"
          style={{ background: 'linear-gradient(135deg, rgba(12, 35, 24, 0.8) 0%, rgba(6, 21, 16, 0.9) 100%)' }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-emerald-100/50">
              Sign in to your partner workspace
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-emerald-100/70 text-sm font-medium">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-100/30" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-11 h-12 bg-emerald-950/40 border-emerald-800/40 text-white placeholder-emerald-100/30 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-emerald-100/70 text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-100/30" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-11 h-12 bg-emerald-950/40 border-emerald-800/40 text-white placeholder-emerald-100/30 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-emerald-800/40" />
            <span className="text-emerald-100/30 text-sm">New to PingBox?</span>
            <div className="flex-1 h-px bg-emerald-800/40" />
          </div>

          {/* Join waitlist link */}
          <Link
            href="/early-access"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border border-emerald-800/40 text-emerald-100/70 hover:text-white hover:border-emerald-500/40 transition-all"
          >
            Join the Waitlist
          </Link>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-emerald-100/40 hover:text-emerald-400 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
