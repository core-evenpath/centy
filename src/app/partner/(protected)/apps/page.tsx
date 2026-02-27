'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, ArrowRight, Zap, ShoppingBag } from 'lucide-react';

export default function AppsPage() {
    return (
        <div className="container max-w-5xl py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">App Integrations</h1>
                <p className="text-gray-600 mt-2">
                    Connect external tools and services to your Pingbox workspace.
                </p>
            </div>

            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Messaging Channels</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                    Connect your WhatsApp Business account to send and receive messages directly in Pingbox.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-sm text-green-600 font-medium mt-2">
                                    Configure Integration <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/partner/apps/telegram-api" className="group">
                        <Card className="h-full transition-all hover:shadow-lg hover:border-blue-500 cursor-pointer">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="p-3 bg-blue-100 rounded-xl">
                                        <Send className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                                        Messaging
                                    </Badge>
                                </div>
                                <CardTitle className="mt-4 group-hover:text-blue-700 transition-colors">
                                    Telegram Bot
                                </CardTitle>
                                <CardDescription>
                                    Connect your Telegram bot to receive and respond to messages from Telegram users.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-sm text-blue-600 font-medium mt-2">
                                    Configure Integration <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Card className="h-full border-dashed bg-gray-50/50">
                        <CardHeader>
                            <div className="w-12 h-12 bg-gray-100 rounded-xl mb-4" />
                            <CardTitle className="text-gray-400">Coming Soon</CardTitle>
                            <CardDescription>
                                More messaging integrations are on the way. Instagram, Facebook Messenger, and more.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">E-Commerce</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/partner/apps/shopify" className="group">
                        <Card className="h-full transition-all hover:shadow-lg hover:border-green-500 cursor-pointer">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="p-3 bg-green-100 rounded-xl">
                                        <ShoppingBag className="w-8 h-8 text-green-600" />
                                    </div>
                                    <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
                                        E-Commerce
                                    </Badge>
                                </div>
                                <CardTitle className="mt-4 group-hover:text-green-700 transition-colors">
                                    Shopify
                                </CardTitle>
                                <CardDescription>
                                    Connect your Shopify store to sync products, customers, and orders automatically.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-sm text-green-600 font-medium mt-2">
                                    Configure Integration <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>

            <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Productivity Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="h-full border-dashed bg-gray-50/50">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <Zap className="w-6 h-6 text-gray-400" />
                                </div>
                                <Badge variant="outline" className="text-gray-500">
                                    Coming Soon
                                </Badge>
                            </div>
                            <CardTitle className="mt-4 text-gray-400">Zapier</CardTitle>
                            <CardDescription>
                                Automate workflows by connecting Pingbox to thousands of other apps.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="h-full border-dashed bg-gray-50/50">
                        <CardHeader>
                            <div className="w-12 h-12 bg-gray-100 rounded-xl mb-4" />
                            <CardTitle className="text-gray-400">Google Calendar</CardTitle>
                            <CardDescription>
                                Sync appointments and schedule meetings with your contacts.
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    <Card className="h-full border-dashed bg-gray-50/50">
                        <CardHeader>
                            <div className="w-12 h-12 bg-gray-100 rounded-xl mb-4" />
                            <CardTitle className="text-gray-400">CRM Integration</CardTitle>
                            <CardDescription>
                                Connect to popular CRM systems like Salesforce and HubSpot.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        </div>
    );
}
