
"use client";

import { useState } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { useToast } from "../../../../hooks/use-toast";
import { createTenant } from '../../../../ai/flows/create-tenant-flow';
import { createUserInTenant } from '../../../../ai/flows/user-management-flow';
import { getTenantForEmailAction } from '../../../../actions/auth-actions';
import { SUPPORTED_CURRENCIES } from '../../../../lib/business-persona-types';
import { cn } from '../../../../lib/utils';
import { Building2, Mail, Lock, ChevronRight, ChevronLeft } from 'lucide-react';

// Most common currencies shown first
const POPULAR_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

export default function PartnerSignupPage() {
    const [step, setStep] = useState<1 | 2>(1);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [currency, setCurrency] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const popularCurrencies = SUPPORTED_CURRENCIES.filter(c => POPULAR_CURRENCIES.includes(c.code));
    const otherCurrencies = SUPPORTED_CURRENCIES.filter(c => !POPULAR_CURRENCIES.includes(c.code));

    const canProceedToStep2 = name.trim().length >= 2 && email.includes('@') && password.length >= 6;

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currency) {
            toast({
                variant: "destructive",
                title: "Currency Required",
                description: "Please select your business currency.",
            });
            return;
        }

        setIsLoading(true);

        try {
            // Step 1: Check if a user with this email already exists
            const existingUserCheck = await getTenantForEmailAction(email);
            if (existingUserCheck.success && existingUserCheck.tenantId) {
                throw new Error("An account with this email already exists. Please log in.");
            }

            // Step 2: Create the tenant with currency
            const tenantResult = await createTenant({
                partnerName: name,
                email: email,
                currency: currency,
            });

            if (!tenantResult.success || !tenantResult.tenantId || !tenantResult.partnerId) {
                throw new Error(tenantResult.message || "Failed to create a new partner workspace.");
            }

            console.log(`New tenant created: ${tenantResult.tenantId} for partner ${tenantResult.partnerId}`);

            // Step 3: Create the primary admin user
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

            toast({
                title: "Account Created!",
                description: "Your organization workspace has been set up. You can now sign in.",
            });

            router.push('/partner/login');

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

    return (
        <Card className="w-full max-w-md">
            <form onSubmit={handleSignup}>
                <CardHeader className="text-center pb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="font-headline text-2xl">Create Partner Account</CardTitle>
                    <CardDescription>
                        {step === 1 ? "Set up your organization's workspace" : "Select your business currency"}
                    </CardDescription>

                    {/* Step Indicator */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <div className={cn(
                            "w-8 h-1 rounded-full transition-all",
                            step === 1 ? "bg-indigo-500" : "bg-indigo-200"
                        )} />
                        <div className={cn(
                            "w-8 h-1 rounded-full transition-all",
                            step === 2 ? "bg-indigo-500" : "bg-indigo-200"
                        )} />
                    </div>
                </CardHeader>

                <CardContent className="grid gap-4">
                    {step === 1 ? (
                        <>
                            {/* Step 1: Basic Info */}
                            <div className="grid gap-2">
                                <Label htmlFor="name" className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                    Organization Name
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Your Company Name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isLoading}
                                    className="h-11"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    Work Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    className="h-11"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password" className="flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    placeholder="Minimum 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    className="h-11"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Step 2: Currency Selection */}
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    This will be used for pricing, invoices, and financial displays.
                                </p>

                                {/* Popular Currencies */}
                                <div className="grid grid-cols-3 gap-2">
                                    {popularCurrencies.map((curr) => (
                                        <button
                                            key={curr.code}
                                            type="button"
                                            onClick={() => setCurrency(curr.code)}
                                            className={cn(
                                                'p-3 rounded-lg border-2 text-left transition-all',
                                                currency === curr.code
                                                    ? 'bg-indigo-50 border-indigo-400 shadow-sm'
                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                            )}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{curr.flag}</span>
                                                <div>
                                                    <div className="font-medium text-sm">{curr.code}</div>
                                                    <div className="text-xs text-muted-foreground">{curr.symbol}</div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Other Currencies */}
                                <details className="group">
                                    <summary className="text-sm text-indigo-600 cursor-pointer hover:underline list-none flex items-center gap-1">
                                        <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
                                        More currencies
                                    </summary>
                                    <div className="grid grid-cols-3 gap-2 mt-3">
                                        {otherCurrencies.map((curr) => (
                                            <button
                                                key={curr.code}
                                                type="button"
                                                onClick={() => setCurrency(curr.code)}
                                                className={cn(
                                                    'p-2 rounded-lg border-2 text-left transition-all',
                                                    currency === curr.code
                                                        ? 'bg-indigo-50 border-indigo-400 shadow-sm'
                                                        : 'bg-white border-gray-200 hover:border-gray-300'
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">{curr.flag}</span>
                                                    <div className="font-medium text-xs">{curr.code}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </details>
                            </div>
                        </>
                    )}
                </CardContent>

                <CardFooter className="flex flex-col gap-4">
                    {step === 1 ? (
                        <Button
                            type="button"
                            className="w-full h-11"
                            disabled={!canProceedToStep2}
                            onClick={() => setStep(2)}
                        >
                            Continue
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <div className="flex gap-2 w-full">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-11"
                                onClick={() => setStep(1)}
                                disabled={isLoading}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 h-11"
                                disabled={isLoading || !currency}
                            >
                                {isLoading ? 'Creating Account...' : 'Create Organization'}
                            </Button>
                        </div>
                    )}

                    <div className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/partner/login" className="text-indigo-600 hover:underline font-medium">
                            Sign in
                        </Link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    );
}
