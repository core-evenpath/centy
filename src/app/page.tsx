"use client";

import React from 'react';
import { Sparkles, ArrowRight, Zap, Users, BarChart3, MessageSquare, CheckCircle2, Layers, TrendingUp, Rocket, Target, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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
            <Link href="#features" className="hidden md:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="hidden md:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              How It Works
            </Link>
            <Link href="#pricing" className="hidden md:block text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </Link>
            <Link 
              href="/partner/login" 
              className="px-6 py-2.5 bg-gradient-to-r from-[#3081D0] to-[#6044A6] text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              Launch App
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section - Improved with Robot Mascot */}
      <section className="relative px-6 pt-12 pb-24 overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#3081D0]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#6044A6]/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#3081D0]/10 to-[#6044A6]/10 border border-[#6044A6]/20 mb-6">
                <Sparkles className="w-4 h-4 text-[#6044A6]" />
                <span className="text-sm font-semibold text-[#6044A6]">AI-Powered Marketing Platform</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 mb-6 leading-tight">
                MarComm Made
                <br />
                <span className="bg-gradient-to-r from-[#3081D0] to-[#6044A6] bg-clip-text text-transparent">
                  Effortless
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-xl leading-relaxed">
                Build, launch, and optimize campaigns in minutes with AI-powered automation. 
                The only platform that combines intelligence with simplicity.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link 
                  href="/partner/login"
                  className="group px-8 py-4 bg-gradient-to-r from-[#3081D0] to-[#6044A6] text-white rounded-xl font-bold hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="#how-it-works"
                  className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-900 rounded-xl font-bold hover:border-[#3081D0] hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Watch Demo
                  <Rocket className="w-5 h-5" />
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Right side - Robot Mascot Image */}
            <div className="relative lg:pl-12">
              <div className="relative z-10 transform hover:scale-105 transition-transform duration-300">
                {/* Glowing effect behind robot */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#3081D0] to-[#6044A6] rounded-full blur-3xl opacity-30 scale-110"></div>
                
                {/* Robot Image - Replace with actual uploaded image */}
                <div className="relative bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-3xl p-8 shadow-2xl border-4 border-white">
                  <Image 
                    src="/robot-mascot.png" 
                    alt="Centy.dev AI Marketing Assistant" 
                    width={500}
                    height={500}
                    className="w-full h-auto"
                    priority
                  />
                </div>
              </div>

              {/* Floating stats cards */}
              <div className="absolute top-10 -left-4 bg-white rounded-xl shadow-xl p-4 border border-gray-100 animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">300%</div>
                    <div className="text-xs text-gray-600">ROI Increase</div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-10 -right-4 bg-white rounded-xl shadow-xl p-4 border border-gray-100 animate-float" style={{animationDelay: '0.5s'}}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">80%</div>
                    <div className="text-xs text-gray-600">Time Saved</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 px-6 bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-sm text-gray-600 mb-8">Trusted by 10,000+ marketing teams worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            {/* Logo placeholders - replace with actual client logos */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="text-gray-400 font-bold text-xl">Company {i}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Everything You Need to <span className="text-[#3081D0]">Win</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make your marketing campaigns unstoppable
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'AI Campaign Generator',
                description: 'Create complete campaigns in seconds with our advanced AI that understands your brand.'
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Team Collaboration',
                description: 'Work seamlessly with your team. Real-time updates and smart task management.'
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: 'Real-Time Analytics',
                description: 'Track performance with beautiful dashboards and actionable insights.'
              },
              {
                icon: <Target className="w-6 h-6" />,
                title: 'Multi-Channel Marketing',
                description: 'Reach your audience everywhere - email, social, web, and more from one place.'
              },
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: 'Smart Templates',
                description: 'Professional templates that adapt to your brand. Customize in minutes, not hours.'
              },
              {
                icon: <Rocket className="w-6 h-6" />,
                title: 'Auto-Optimization',
                description: 'AI learns from your campaigns and automatically improves performance over time.'
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="group p-8 rounded-2xl bg-white border-2 border-gray-200 hover:border-[#3081D0] hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
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

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Launch in <span className="text-[#6044A6]">3 Simple Steps</span>
            </h2>
            <p className="text-xl text-gray-600">From idea to execution in minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Tell Us Your Goal',
                description: 'Describe what you want to achieve. Our AI understands your objectives and target audience.',
                icon: <MessageSquare className="w-8 h-8" />
              },
              {
                step: '02',
                title: 'AI Creates Your Campaign',
                description: 'Watch as AI generates copy, designs, and strategies tailored to your brand in seconds.',
                icon: <Sparkles className="w-8 h-8" />
              },
              {
                step: '03',
                title: 'Launch & Optimize',
                description: 'Deploy across channels and let AI continuously optimize for best results.',
                icon: <Rocket className="w-8 h-8" />
              }
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-2xl transition-shadow">
                  <div className="text-6xl font-black text-[#3081D0]/10 mb-4">{step.step}</div>
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#3081D0] to-[#6044A6] flex items-center justify-center text-white mb-6">
                    {step.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-[#3081D0] to-[#6044A6]">
                    <ArrowRight className="absolute -right-2 -top-3 w-6 h-6 text-[#6044A6]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#3081D0] to-[#6044A6] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto text-center text-white relative z-10">
          <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Transform Your Marketing?</h2>
          <p className="text-xl opacity-90 mb-10">
            Join thousands of marketers seeing real results. Start your free trial today - no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/partner/login"
              className="group px-10 py-4 bg-white text-[#3081D0] rounded-xl font-bold hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="#pricing"
              className="px-10 py-4 bg-white/10 backdrop-blur-sm border-2 border-white text-white rounded-xl font-bold hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
            >
              View Pricing
            </Link>
          </div>
          <p className="mt-8 text-sm opacity-75">✨ 14-day free trial • No credit card required • Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#3081D0] to-[#6044A6] rounded-lg flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  centy<span className="text-[#3081D0]">.dev</span>
                </span>
              </div>
              <p className="text-sm">Making marketing effortless with AI.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2025 centy.dev. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
