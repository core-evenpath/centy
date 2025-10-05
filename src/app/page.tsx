
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, Sparkles, TrendingUp, Users, Zap, MessageSquare, BarChart3, Clock, Target, Rocket, Bot } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Centy</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <Link href="#product" className="text-[15px] text-gray-600 hover:text-gray-900 transition-colors">
              Product
            </Link>
            <Link href="#customers" className="text-[15px] text-gray-600 hover:text-gray-900 transition-colors">
              Customers
            </Link>
            <Link href="#pricing" className="text-[15px] text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link 
              href="/partner/login"
              className="px-5 py-2 bg-gray-900 text-white text-[15px] font-medium rounded-md hover:bg-gray-800 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero - The Problem */}
      <section className="pt-40 pb-24 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <h1 className="text-[56px] leading-[1.1] font-semibold text-gray-900 mb-8 tracking-tight">
              Marketing teams spend weeks building campaigns.
              <br />
              <span className="text-gray-400">We made it take hours.</span>
            </h1>
            <p className="text-[21px] text-gray-600 leading-[1.6] mb-10">
              Centy brings your marketing workflow into one place. Plan campaigns, collaborate with your team, and track results—without switching between a dozen tools.
            </p>
            <div className="flex items-center gap-4">
              <Link 
                href="/partner/login"
                className="px-6 py-3 bg-gray-900 text-white text-[15px] font-medium rounded-md hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
              >
                Get started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                href="#product"
                className="text-[15px] text-gray-600 hover:text-gray-900 transition-colors"
              >
                Learn more →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Story Section */}
      <section className="py-24 px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wider mb-6">THE PROBLEM</h2>
              <h3 className="text-[36px] leading-[1.2] font-semibold text-gray-900 mb-6">
                Most marketing teams work across 8-12 different tools
              </h3>
              <p className="text-[17px] text-gray-600 leading-[1.7] mb-6">
                Campaign briefs in Notion. Project management in Asana. Analytics in Google Analytics. Creative assets in Figma. Approvals over email.
              </p>
              <p className="text-[17px] text-gray-600 leading-[1.7]">
                Context gets lost. Deadlines slip. Teams waste time searching for information that should be at their fingertips.
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-gray-500">
                  <span className="text-red-500 mt-1">×</span>
                  <span className="text-[15px]">Campaign planning scattered across multiple documents</span>
                </div>
                <div className="flex items-start gap-3 text-gray-500">
                  <span className="text-red-500 mt-1">×</span>
                  <span className="text-[15px]">No single source of truth for campaign status</span>
                </div>
                <div className="flex items-start gap-3 text-gray-500">
                  <span className="text-red-500 mt-1">×</span>
                  <span className="text-[15px]">Performance data lives in separate analytics tools</span>
                </div>
                <div className="flex items-start gap-3 text-gray-500">
                  <span className="text-red-500 mt-1">×</span>
                  <span className="text-[15px]">Approval workflows happen over email threads</span>
                </div>
                <div className="flex items-start gap-3 text-gray-500">
                  <span className="text-red-500 mt-1">×</span>
                  <span className="text-[15px]">Team members lack visibility into others' work</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution with Robot */}
      <section id="product" className="py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-12 border border-orange-100 flex items-center justify-center">
                 <Bot className="w-64 h-64 text-orange-200" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wider mb-6">THE SOLUTION</h2>
              <h3 className="text-[36px] leading-[1.2] font-semibold text-gray-900 mb-6">
                One workspace for your entire marketing operation
              </h3>
              <p className="text-[17px] text-gray-600 leading-[1.7] mb-8">
                Centy consolidates your marketing workflow. Create campaign briefs, assign tasks to your team, track progress, and measure results—all in one platform.
              </p>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Campaign Planning</h4>
                    <p className="text-[15px] text-gray-600">Define objectives, audience, and deliverables in structured campaign briefs</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Team Collaboration</h4>
                    <p className="text-[15px] text-gray-600">Assign tasks, leave comments, and keep everyone aligned on campaign status</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-5 h-5 text-gray-700" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Unified Analytics</h4>
                    <p className="text-[15px] text-gray-600">Connect your marketing channels and see all performance metrics in one dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="mb-20">
            <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wider mb-6">HOW IT WORKS</h2>
            <h3 className="text-[36px] leading-[1.2] font-semibold text-gray-900 max-w-2xl">
              Built around your existing workflow
            </h3>
          </div>

          <div className="space-y-24">
            {/* Step 1 */}
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div>
                <div className="inline-block px-3 py-1 bg-gray-900 text-white text-[13px] font-medium rounded-full mb-6">
                  Step 1
                </div>
                <h4 className="text-[28px] font-semibold text-gray-900 mb-4">
                  Create your campaign brief
                </h4>
                <p className="text-[17px] text-gray-600 leading-[1.7] mb-6">
                  Start with a structured brief that captures your campaign objectives, target audience, key messages, and success metrics. Share it with your team for input before you begin execution.
                </p>
                <p className="text-[15px] text-gray-500 leading-[1.7]">
                  AI assistance helps you draft clear, comprehensive briefs based on your goals and previous campaigns.
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-8 min-h-[300px] flex items-center justify-center">
                <MessageSquare className="w-20 h-20 text-gray-300" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div className="order-2 lg:order-1">
                <div className="bg-white rounded-lg border border-gray-200 p-8 min-h-[300px] flex items-center justify-center">
                  <Target className="w-20 h-20 text-gray-300" />
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="inline-block px-3 py-1 bg-gray-900 text-white text-[13px] font-medium rounded-full mb-6">
                  Step 2
                </div>
                <h4 className="text-[28px] font-semibold text-gray-900 mb-4">
                  Execute with your team
                </h4>
                <p className="text-[17px] text-gray-600 leading-[1.7] mb-6">
                  Break down your campaign into tasks. Assign owners, set deadlines, and track progress. Your team knows what they're working on and what's coming next.
                </p>
                <p className="text-[15px] text-gray-500 leading-[1.7]">
                  Built-in approval workflows ensure stakeholders review deliverables before launch.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid lg:grid-cols-2 gap-16 items-start">
              <div>
                <div className="inline-block px-3 py-1 bg-gray-900 text-white text-[13px] font-medium rounded-full mb-6">
                  Step 3
                </div>
                <h4 className="text-[28px] font-semibold text-gray-900 mb-4">
                  Measure what matters
                </h4>
                <p className="text-[17px] text-gray-600 leading-[1.7] mb-6">
                  Connect your marketing channels to see performance data alongside your campaign plan. Understand what's working and make informed decisions about where to focus.
                </p>
                <p className="text-[15px] text-gray-500 leading-[1.7]">
                  Track the metrics that matter to your business, from impressions to conversions.
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-8 min-h-[300px] flex items-center justify-center">
                <BarChart3 className="w-20 h-20 text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-20">
            <h2 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wider mb-6">FEATURES</h2>
            <h3 className="text-[36px] leading-[1.2] font-semibold text-gray-900 max-w-2xl">
              Everything you need to run marketing campaigns
            </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            <div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-gray-700" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">AI-Assisted Briefs</h4>
              <p className="text-[15px] text-gray-600 leading-[1.6]">
                Get help drafting campaign objectives, audience definitions, and key messages
              </p>
            </div>
            
            <div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-gray-700" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Team Workspaces</h4>
              <p className="text-[15px] text-gray-600 leading-[1.6]">
                Organize campaigns by team, project, or brand with dedicated workspaces
              </p>
            </div>
            
            <div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                <Target className="w-5 h-5 text-gray-700" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Task Management</h4>
              <p className="text-[15px] text-gray-600 leading-[1.6]">
                Break campaigns into tasks, assign owners, and track completion
              </p>
            </div>
            
            <div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5 text-gray-700" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Comments & Feedback</h4>
              <p className="text-[15px] text-gray-600 leading-[1.6]">
                Discuss campaigns directly where the work happens, no more email chains
              </p>
            </div>
            
            <div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5 text-gray-700" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Analytics Dashboard</h4>
              <p className="text-[15px] text-gray-600 leading-[1.6]">
                Connect marketing channels and view performance metrics in one place
              </p>
            </div>
            
            <div>
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5 text-gray-700" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Timeline View</h4>
              <p className="text-[15px] text-gray-600 leading-[1.6]">
                See all campaigns and deadlines on a visual timeline to prevent conflicts
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-[42px] leading-[1.2] font-semibold text-gray-900 mb-6">
            Try Centy with your team
          </h2>
          <p className="text-[19px] text-gray-600 mb-10 leading-[1.6]">
            See how Centy helps marketing teams plan, execute, and measure campaigns in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/partner/login"
              className="px-6 py-3 bg-gray-900 text-white text-[15px] font-medium rounded-md hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
            >
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-[15px] text-gray-500">
              Free trial available • No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Centy</span>
            </div>
            <div className="flex flex-wrap gap-x-12 gap-y-6 text-[15px]">
              <div className="space-y-3">
                <div className="font-medium text-gray-900">Product</div>
                <div className="space-y-2">
                  <div><Link href="#" className="text-gray-600 hover:text-gray-900">Features</Link></div>
                  <div><Link href="#" className="text-gray-600 hover:text-gray-900">Pricing</Link></div>
                  <div><Link href="#" className="text-gray-600 hover:text-gray-900">Updates</Link></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="font-medium text-gray-900">Company</div>
                <div className="space-y-2">
                  <div><Link href="#" className="text-gray-600 hover:text-gray-900">About</Link></div>
                  <div><Link href="#" className="text-gray-600 hover:text-gray-900">Blog</Link></div>
                  <div><Link href="#" className="text-gray-600 hover:text-gray-900">Contact</Link></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="font-medium text-gray-900">Resources</div>
                <div className="space-y-2">
                  <div><Link href="#" className="text-gray-600 hover:text-gray-900">Documentation</Link></div>
                  <div><Link href="#" className="text-gray-600 hover:text-gray-900">Support</Link></div>
                  <div><Link href="#" className="text-gray-600 hover:text-gray-900">Privacy</Link></div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-100 text-[14px] text-gray-500">
            © 2025 Centy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
