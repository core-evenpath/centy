'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ArrowRight } from 'lucide-react';

export default function AppsPage() {
    return (
        <div className="container max-w-5xl py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">App Integrations</h1>
                <p className="text-gray-600 mt-2">
                    Connect external tools and services to your Centy workspace.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* WhatsApp Business Card */}
                <Link href="/partner/apps/whatsapp-api" className="group">
                    <Card className="h-full transition-all hover:shadow-lg hover:border-green-500 cursor-pointer">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="p-3 bg-green-100 rounded-xl">
                                    <MessageSquare className="w-8 h-8 text-green-600" />
                                </div>
                                <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
                                    Messaging
                                </Badge>
                            </div>
                            <CardTitle className="mt-4 group-hover:text-green-700 transition-colors">
                                WhatsApp Business
                            </CardTitle>
                            <CardDescription>
                                Connect your WhatsApp Business account to send and receive messages directly in Centy.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center text-sm text-green-600 font-medium mt-2">
                                Configure Integration <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Placeholder for future apps */}
                <Card className="h-full border-dashed bg-gray-50/50">
                    <CardHeader>
                        <div className="w-12 h-12 bg-gray-100 rounded-xl mb-4" />
                        <CardTitle className="text-gray-400">Coming Soon</CardTitle>
                        <CardDescription>
                            More integrations are on the way.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
