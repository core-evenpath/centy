import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, Sparkles, TrendingUp, Users, Zap, MessageSquare, BarChart3, Clock, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">centy</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#product" className="text-sm text-gray-600 hover:text-black transition-colors">
              Product
            </Link>
            <Link href="#story" className="text-sm text-gray-600 hover:text-black transition-colors">
              Story
            </Link>
            <Link href="#pricing" className="text-sm text-gray-600 hover:text-black transition-colors">
              Pricing
            </Link>
            <Link 
              href="/partner/login"
              className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - The Problem */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-700 mb-6">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Now in Beta
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Marketing teams waste
              <br />
              <span className="text-gray-400">60% of their time</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              On repetitive tasks, fragmented tools, and endless revisions.
              <br />What if you could focus on strategy instead?
            </p>
          </div>

          {/* The Transformation */}
          <div className="relative mt-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="inline-block px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-medium">
                  Before Centy
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-gray-600">
                    <span className="text-red-500 mt-1 text-xl">×</span>
                    <span>Switching between 12 different tools daily</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-600">
                    <span className="text-red-500 mt-1 text-xl">×</span>
                    <span>2 weeks to launch a simple campaign</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-600">
                    <span className="text-red-500 mt-1 text-xl">×</span>
                    <span>No clear ROI on marketing spend</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-600">
                    <span className="text-red-500 mt-1 text-xl">×</span>
                    <span>Team always playing catch-up</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-6">
                <div className="inline-block px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm font-medium">
                  After Centy
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-gray-900">
                    <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>One unified platform for everything</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-900">
                    <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>Launch campaigns in under 2 hours</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-900">
                    <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>Real-time attribution & performance tracking</span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-900">
                    <Check className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <span>AI-powered optimization running 24/7</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Hero with Robot */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Meet your new
                <br />marketing co-pilot
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Centy combines AI intelligence with human creativity. It learns your brand voice, understands your audience, and helps you execute campaigns that actually convert.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/partner/login"
                  className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors inline-flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:border-gray-400 transition-colors">
                  Watch Demo
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 shadow-2xl">
                <Image 
                  src="/robot-mascot.png" 
                  alt="Centy AI Assistant" 
                  width={500}
                  height={500}
                  className="w-full h-auto"
                  priority
                />
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-100 rounded-full blur-3xl opacity-60"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-100 rounded-full blur-3xl opacity-60"></div>
            </div>
          </div>
        </div>
      </section>

      {/* The Story - How It Works */}
      <section id="story" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How it actually works
            </h2>
            <p className="text-xl text-gray-600">
              Three steps. Zero complexity.
            </p>
          </div>

          <div className="space-y-32">
            {/* Step 1 */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1">
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center border border-gray-200">
                  <MessageSquare className="w-20 h-20 text-gray-400" />
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="text-sm font-bold text-gray-400 mb-4">STEP 01</div>
                <h3 className="text-3xl font-bold mb-4">Brief your campaign</h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Tell Centy what you&apos;re trying to achieve. Our AI asks the right questions to understand your goals, audience, and brand voice. No templates. No forms. Just conversation.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="text-sm font-bold text-gray-400 mb-4">STEP 02</div>
                <h3 className="text-3xl font-bold mb-4">Watch AI create</h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  In minutes, not days, Centy generates complete campaigns: copy, visuals, targeting strategy, and channel recommendations. Everything aligned with your brand and optimized for performance.
                </p>
              </div>
              <div>
                <div className="aspect-video bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center border border-purple-200">
                  <Sparkles className="w-20 h-20 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="order-2 md:order-1">
                <div className="aspect-video bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center border border-green-200">
                  <TrendingUp className="w-20 h-20 text-green-600" />
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="text-sm font-bold text-gray-400 mb-4">STEP 03</div>
                <h3 className="text-3xl font-bold mb-4">Launch & optimize</h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Deploy across all channels with one click. Centy monitors performance 24/7, automatically adjusting targeting, copy, and spend to maximize ROI. You stay in control, always.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-6 bg-black text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gray-400 mb-12">Trusted by fast-growing companies</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50">
              <div className="text-2xl font-bold">Company</div>
              <div className="text-2xl font-bold">Startup</div>
              <div className="text-2xl font-bold">Brand</div>
              <div className="text-2xl font-bold">Growth</div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-16">
            <div className="grid md:grid-cols-3 gap-12">
              <div>
                <div className="text-5xl font-bold mb-4">300%</div>
                <p className="text-gray-400">Average ROI increase in first 90 days</p>
              </div>
              <div>
                <div className="text-5xl font-bold mb-4">12hrs</div>
                <p className="text-gray-400">Saved per week per marketer</p>
              </div>
              <div>
                <div className="text-5xl font-bold mb-4">95%</div>
                <p className="text-gray-400">Of customers see results in week one</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="product" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Built for performance
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to run world-class campaigns
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: "AI Campaign Builder",
                description: "Generate complete campaigns with copy, targeting, and creative in minutes"
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Team Collaboration",
                description: "Real-time collaboration with version control and approval workflows"
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Unified Analytics",
                description: "See performance across all channels in one dashboard"
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: "24/7 Optimization",
                description: "AI continuously tests and improves your campaigns while you sleep"
              },
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: "Brand Voice AI",
                description: "Maintains your unique voice across all campaigns automatically"
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Enterprise Security",
                description: "SOC 2 compliant with role-based access control"
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="p-6 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center text-white mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to transform
            <br />your marketing?
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Join hundreds of teams shipping better campaigns, faster.
            <br />Start free, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link 
              href="/partner/login"
              className="px-8 py-4 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors inline-flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="px-8 py-4 border border-gray-300 rounded-lg font-medium hover:border-gray-400 transition-colors">
              Book a Demo
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              No credit card
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">centy</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-600">
              <Link href="#product" className="hover:text-black transition-colors">
                Product
              </Link>
              <Link href="#pricing" className="hover:text-black transition-colors">
                Pricing
              </Link>
              <Link href="#" className="hover:text-black transition-colors">
                Docs
              </Link>
              <Link href="#" className="hover:text-black transition-colors">
                Contact
              </Link>
            </div>
            <div className="text-sm text-gray-600">
              © 2025 Centy. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
