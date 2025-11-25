'use client';

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, HelpCircle } from "lucide-react";

export default function WhatsAppTroubleshooting() {
    return (
        <Card className="mt-6 border-amber-200 bg-amber-50/30">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-600" />
                    <CardTitle className="text-lg text-amber-900">Troubleshooting Guide</CardTitle>
                </div>
                <CardDescription className="text-amber-800">
                    Common issues and how to resolve them
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="text-amber-900">Meta UI looks different?</AccordionTrigger>
                        <AccordionContent className="text-amber-800">
                            Meta frequently updates their dashboard layout. If you can't find a setting:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Look for "WhatsApp" in the left sidebar menu.</li>
                                <li>Check under "API Setup" for phone numbers and tokens.</li>
                                <li>Check under "Configuration" for Webhook settings.</li>
                                <li>Use the search bar in Meta Business Suite if available.</li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2">
                        <AccordionTrigger className="text-amber-900">"Account not registered" Error (#133010)</AccordionTrigger>
                        <AccordionContent className="text-amber-800">
                            This means your phone number is verified but not registered for messaging API.
                            <br />
                            <strong>Fix:</strong> Run the registration curl command (Step 4 in Setup Guide).
                            Make sure to include your 6-digit PIN if you have two-step verification enabled.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3">
                        <AccordionTrigger className="text-amber-900">Incoming messages not appearing?</AccordionTrigger>
                        <AccordionContent className="text-amber-800">
                            Check the following:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Is your Webhook URL verified in Meta?</li>
                                <li>Are you subscribed to the <strong>messages</strong> field?</li>
                                <li>Is your App subscribed to the WABA? (Step 5 in Setup Guide)</li>
                                <li>Check server logs for "Meta Webhook received".</li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4">
                        <AccordionTrigger className="text-amber-900">Token Expired?</AccordionTrigger>
                        <AccordionContent className="text-amber-800">
                            Temporary access tokens expire in 24 hours.
                            <br />
                            <strong>Fix:</strong> Generate a <strong>Permanent Access Token</strong> in Meta Business Settings (Users &gt; System Users) and update it in Centy using the "Edit" button.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}
