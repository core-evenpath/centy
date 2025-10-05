import React from 'react';
import { Sparkles, ArrowRight, Zap, Users, BarChart3, MessageSquare, CheckCircle2, Layers, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#3081D0] to-[#6044A6] rounded-lg flex items-center justify-center">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              centy<span className="text-[#3081D0]">.dev</span>
            </span>
          </div>
          
          <nav className="flex items-center gap-8">
            <Link href="#features" className="hidden md:block text-sm font-medium text-gray-600 hover:text-gray-900">
              Features
            </Link>
            <Link href="#pricing" className="hidden md:block text-sm font-medium text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link 
              href="/partner/login" 
              className="px-6 py-2.5 bg-gradient-to-r from-[#3081D0] to-[#6044A6] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Launch App
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-32 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-white -z-10"></div>
        
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#3081D0]/10 to-[#6044A6]/10 border border-[#6044A6]/20 mb-8">
            <Sparkles className="w-4 h-4 text-[#6044A6]" />
            <span className="text-sm font-semibold text-[#6044A6]">AI-Powered Marketing Platform</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black text-gray-900 mb-6 leading-tight">
            MarComm Made
            <br />
            <span className="bg-gradient-to-r from-[#3081D0] to-[#6044A6] bg-clip-text text-transparent">
              Effortless
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Build, launch, and optimize campaigns in minutes with AI-powered automation. 
            The only platform that combines intelligence with simplicity.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link 
              href="/partner/signup"
              className="group px-8 py-4 bg-gradient-to-r from-[#3081D0] to-[#6044A6] text-white rounded-xl font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-lg hover:border-[#3081D0] hover:bg-gray-50 transition-all">
              Watch Demo
            </button>
          </div>

          {/* Dashboard Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div className="relative rounded-2xl border-8 border-gray-900 shadow-2xl overflow-hidden bg-white">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border-b border-gray-800">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="flex-1 text-center text-sm text-gray-400 font-medium">centy.dev/dashboard</div>
              </div>
              <div className="p-8 bg-gradient-to-br from-gray-50 to-white">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="h-3 w-20 bg-gradient-to-r from-[#3081D0] to-[#6044A6] rounded mb-3"></div>
                    <div className="h-8 w-16 bg-gray-900 rounded"></div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="h-3 w-20 bg-gradient-to-r from-[#3081D0] to-[#6044A6] rounded mb-3"></div>
                    <div className="h-8 w-16 bg-gray-900 rounded"></div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="h-3 w-20 bg-gradient-to-r from-[#3081D0] to-[#6044A6] rounded mb-3"></div>
                    <div className="h-8 w-16 bg-gray-900 rounded"></div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <div className="h-40 bg-gradient-to-br from-[#3081D0]/20 to-[#6044A6]/20 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10K+', label: 'Active Campaigns', icon: <TrendingUp className="w-5 h-5" /> },
              { value: '98%', label: 'Delivery Rate', icon: <CheckCircle2 className="w-5 h-5" /> },
              { value: '5M+', label: 'Messages Sent', icon: <MessageSquare className="w-5 h-5" /> },
              { value: '4.9★', label: 'User Rating', icon: <Sparkles className="w-5 h-5" /> }
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-xl bg-white border border-gray-200 hover:border-[#3081D0] hover:shadow-lg transition-all">
                <div className="flex justify-center mb-3 text-[#3081D0]">{stat.icon}</div>
                <div className="text-4xl font-black bg-gradient-to-r from-[#3081D0] to-[#6044A6] bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600">Powerful features for modern marketers</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: 'Unified Dashboard',
                description: 'Monitor all campaigns, contacts, and analytics in one centralized hub.'
              },
              {
                icon: <Sparkles className="w-6 h-6" />,
                title: 'AI Composer',
                description: 'Generate compelling copy with AI-powered suggestions instantly.'
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'Smart Campaigns',
                description: 'Create, schedule, and optimize campaigns with built-in analytics.'
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Contact Management',
                description: 'Organize audiences with smart segmentation and engagement tracking.'
              },
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: 'Template Library',
                description: 'Professional templates for every occasion, fully customizable.'
              },
              {
                icon: <CheckCircle2 className="w-6 h-6" />,
                title: 'Advanced Analytics',
                description: 'Deep insights with beautiful visualizations and ROI tracking.'
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="group p-8 rounded-2xl bg-white border border-gray-200 hover:border-[#3081D0] hover:shadow-xl transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#3081D0] to-[#6044A6] flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#3081D0] to-[#6044A6]">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-5xl font-black mb-6">Ready to Get Started?</h2>
          <p className="text-xl opacity-90 mb-10">
            Join thousands of marketers seeing real results. Start your free trial today.
          </p>
          <Link 
            href="/partner/signup"
            className="inline-flex items-center gap-2 px-10 py-5 bg-white text-[#3081D0] rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-xl"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm opacity-75 mt-6">No credit card required • 14-day free trial</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#3081D0] to-[#6044A6] rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">
              centy<span className="text-[#3081D0]">.dev</span>
            </span>
          </div>
          
          <div className="flex items-center gap-8 text-sm text-gray-600">
            <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-900">Terms</Link>
            <Link href="/contact" className="hover:text-gray-900">Contact</Link>
            <Link href="/docs" className="hover:text-gray-900">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
