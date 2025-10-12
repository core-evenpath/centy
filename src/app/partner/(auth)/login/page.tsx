"use client";

import { useState } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { useToast } from "../../../../hooks/use-toast";
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { app } from '../../../../lib/firebase';
import { getTenantForEmailAction } from '../../../../actions/auth-actions';

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
      
      // 1. Find the tenant ID for the user's email
      const tenantLookup = await getTenantForEmailAction(email);
      console.log('Partner Login: Tenant lookup result', tenantLookup);
      
      if (!tenantLookup.success || !tenantLookup.tenantId) {
        throw new Error(tenantLookup.message || "Your organization could not be found.");
      }
      
      tenantId = tenantLookup.tenantId;
      console.log('Partner Login: Using tenant ID', tenantId);

      // 2. Set the tenant ID on the auth instance
      auth.tenantId = tenantId;
      
      // 3. Sign in the user within their tenant
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Partner Login: User signed in successfully', userCredential.user.uid);
      
      // 4. Wait a moment for custom claims to be available
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 5. Get the latest token with claims
      const tokenResult = await userCredential.user.getIdTokenResult(true);
      console.log('Partner Login: User custom claims', tokenResult.claims);
      
      toast({ title: "Login Successful", description: "Redirecting to your workspace..." });
      
      // 6. Redirect to partner dashboard
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
        // Always reset the tenantId
        auth.tenantId = null;
        setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Partner Login</CardTitle>
        <CardDescription>
          Sign in to access your organization's workspace
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
          <div className="hidden text-center text-sm text-muted-foreground">
            Don't have an organization?{" "}
            <Link href="/partner/signup" className="underline">Create one</Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
