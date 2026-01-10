"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { useToast } from '../../../hooks/use-toast';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth, app } from '../../../lib/firebase';
import { Phone, KeyRound, Building2, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { handlePhoneAuthAction } from '../../../actions/employee-phone-actions';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export default function EmployeeLoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    // Initialize reCAPTCHA verifier only if it doesn't exist
    if (!recaptchaVerifierRef.current) {
      try {
        const container = document.getElementById('recaptcha-container');
        if (container) {
          recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response: any) => {
              console.log("reCAPTCHA solved, automatically submitting form.");
            },
            'expired-callback': () => {
              setRecaptchaError("reCAPTCHA token expired. Please try sending the code again.");
            }
          });
        }
      } catch (error: any) {
        console.error("Error initializing reCAPTCHA:", error);
        setRecaptchaError("reCAPTCHA initialization failed. Please refresh the page.");
      }
    }

    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (error: any) {
          // Silent catch for internal-error as it's just cleanup
          console.warn("Error clearing reCAPTCHA:", error);
        } finally {
          recaptchaVerifierRef.current = null;
        }
      }
    };
  }, []);


  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('1') && cleaned.length === 11) return `+${cleaned}`;
    if (cleaned.length === 10) return `+1${cleaned}`;
    if (!phone.startsWith('+')) return `+${cleaned}`;
    return phone;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\+[1-9]\d{7,14}$/;
    return phoneRegex.test(phone);
  };

  const handleAuthError = (error: any) => {
    let title = "Failed to Send OTP";
    let description = "Please try again.";

    switch (error.code) {
      case 'auth/invalid-phone-number':
        description = "Invalid phone number format. Please include the country code (e.g., +1234567890).";
        break;
      case 'auth/too-many-requests':
        description = "Too many requests. Please wait a moment and try again.";
        break;
      case 'auth/internal-error':
      case 'auth/missing-client-identifier': // This often indicates a config issue
        title = "Configuration Error";
        description = "Phone authentication is not enabled for this project. Please go to your Firebase Console -> Authentication -> Sign-in method -> and enable the Phone provider.";
        break;
      case 'auth/captcha-check-failed':
        description = "reCAPTCHA verification failed. Please try again. If this issue persists, your domain may not be authorized.";
        setRecaptchaError(description);
        break;
      default:
        description = error.message || "An unexpected error occurred.";
        break;
    }
    toast({ variant: "destructive", title: title, description: description, duration: 8000 });
  };


  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setRecaptchaError(null);

    const appVerifier = recaptchaVerifierRef.current;
    if (!appVerifier) {
      toast({ variant: 'destructive', title: "Error", description: "reCAPTCHA not initialized. Please refresh." });
      setIsLoading(false);
      return;
    }

    try {
      auth.tenantId = null;
      const formattedPhone = formatPhoneNumber(phoneNumber);
      if (!validatePhoneNumber(formattedPhone)) {
        throw new Error("Please enter a valid phone number with country code (e.g., +1234567890)");
      }

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      setPhoneNumber(formattedPhone);
      toast({ title: "OTP Sent! 📱", description: "Please check your phone for the verification code." });
    } catch (error: any) {
      handleAuthError(error);
      // Fallback for certain environments where invisible reCAPTCHA fails.
      if (error.code === 'auth/captcha-check-failed') {
        try {
          const widgetId = await appVerifier.render();
          appVerifier.verify().then(async () => {
            const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            window.confirmationResult = confirmationResult;
            setOtpSent(true);
            toast({ title: "reCAPTCHA Verified!", description: "OTP sent. Please check your phone." });
          });
        } catch (renderError) {
          console.error("reCAPTCHA render fallback failed", renderError);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!window.confirmationResult) throw new Error("No confirmation result found.");
      if (otp.length !== 6) throw new Error("Please enter the complete 6-digit code.");

      const userCredential = await window.confirmationResult.confirm(otp);
      const user = userCredential.user;

      const setupResult = await handlePhoneAuthAction(user.phoneNumber!, user.uid);
      if (!setupResult.success) {
        throw new Error(setupResult.message);
      }

      toast({ title: "Login Successful! ✅", description: "Redirecting to your dashboard..." });
      router.push('/employee');
    } catch (error: any) {
      let description = "Please check the code and try again.";
      if (error.code === 'auth/invalid-verification-code') {
        description = "Invalid verification code. Please check the 6-digit code from your SMS.";
      } else if (error.code === 'auth/code-expired') {
        description = "Verification code has expired. Please request a new one.";
      }
      toast({ variant: "destructive", title: "Verification Failed", description });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setOtpSent(false);
    setOtp('');
    setRecaptchaError(null);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Phone className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl">Employee Login</CardTitle>
            <CardDescription>
              {otpSent
                ? "Enter the verification code sent to your phone"
                : "Sign in with your phone number to access your workspace"
              }
            </CardDescription>
          </CardHeader>

          {recaptchaError && (
            <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{recaptchaError}</p>
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" placeholder="+1 (555) 123-4567" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="pl-10" required disabled={isLoading} />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3">
                <Button type="submit" className="w-full" disabled={isLoading || !!recaptchaError}>
                  {isLoading ? 'Sending OTP...' : "Send Verification Code"}
                </Button>
                <div className="text-center text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link href="/employee/join" className="text-primary hover:underline">
                    Join a workspace
                  </Link>
                </div>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="otp" placeholder="123456" type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} className="pl-10 text-center text-lg tracking-widest" maxLength={6} required disabled={isLoading} autoFocus />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? 'Verifying...' : "Verify & Login"}
                </Button>
                <Button type="button" variant="outline" onClick={handleRetry} className="w-full" disabled={isLoading}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
      <div id="recaptcha-container"></div>
    </div>
  );
}