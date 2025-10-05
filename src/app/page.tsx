'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2, Sparkles, Zap, Users, BarChart3, MessageSquare, Clock, Target, Rocket } from 'lucide-react';

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "AI Campaign Assistant",
      description: "Get intelligent suggestions for campaign copy, targeting, and channel selection",
      gradient: "from-yellow-400 to-orange-500"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Collaboration",
      description: "Work together with built-in workflows, comments, and approval processes",
      gradient: "from-blue-400 to-cyan-500"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Unified Analytics",
      description: "View all campaign performance metrics in one centralized dashboard",
      gradient: "from-purple-400 to-pink-500"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Workflow Automation",
      description: "Automate repetitive tasks and streamline your marketing operations",
      gradient: "from-green-400 to-emerald-500"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Multi-Channel Support",
      description: "Manage campaigns across email, social media, and other channels",
      gradient: "from-red-400 to-rose-500"
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: "Smart Templates",
      description: "Launch faster with customizable templates for every campaign type",
      gradient: "from-indigo-400 to-violet-500"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Define Your Campaign",
      description: "Set objectives, target audience, and key messaging through our intuitive interface",
      color: "bg-blue-500"
    },
    {
      number: "02",
      title: "Build With AI",
      description: "Get intelligent suggestions and customize every element to match your brand",
      color: "bg-purple-500"
    },
    {
      number: "03",
      title: "Launch & Monitor",
      description: "Deploy across channels and track performance with real-time analytics",
      color: "bg-green-500"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background gradient */}
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.15), transparent 80%)`
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/80 backdrop-blur-xl border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image 
              src="/centy_logo.svg" 
              alt="Centy Logo" 
              width={56}
              height={56}
              className="w-14 h-14"
            />
            <span className="text-xl font-bold">Centy</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#product" className="text-sm text-gray-400 hover:text-white transition-colors">
              Product
            </Link>
            <Link href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#workflow" className="text-sm text-gray-400 hover:text-white transition-colors">
              Workflow
            </Link>
            <Link 
              href="/partner/login"
              className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">AI-Powered Marketing Platform</span>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-bold leading-tight">
                Marketing that
                <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  works smarter
                </span>
              </h1>
              
              <p className="text-xl text-gray-400 leading-relaxed max-w-xl">
                Unify your campaigns, automate workflows, and make data-driven decisions. 
                All in one intelligent platform designed for modern marketing teams.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/partner/login"
                  className="group px-8 py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="px-8 py-4 border border-white/20 rounded-xl font-semibold hover:bg-white/5 transition-all">
                  View Demo
                </button>
              </div>

              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Free trial available
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  No credit card required
                </div>
              </div>
            </div>

            {/* Right: Robot Mascot with Floating Elements */}
            <div className="relative">
              <div className="relative z-10">
                {/* Main robot container */}
                <div className="relative bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-3xl p-8 backdrop-blur-sm border border-white/10">
                  <Image 
                    src="/robot-mascot.png" 
                    alt="Centy AI Assistant" 
                    width={500}
                    height={500}
                    className="w-full h-auto animate-float"
                    priority
                  />
                </div>

                {/* Floating metric cards */}
                <div className="absolute -top-4 -left-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-4 shadow-2xl animate-float-delayed">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">AI Powered</div>
                      <div className="text-xs text-white/80">Campaign Builder</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 shadow-2xl animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Real-Time</div>
                      <div className="text-xs text-white/80">Analytics</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Background glow effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Simple workflow,
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                powerful results
              </span>
            </h2>
            <p className="text-xl text-gray-400">Three steps to launch your next campaign</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`relative p-8 rounded-2xl border transition-all duration-500 ${
                  activeStep === index 
                    ? 'border-white/30 bg-white/5 scale-105' 
                    : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}
              >
                <div className={`text-6xl font-bold ${step.color} bg-clip-text text-transparent mb-4`}>
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.description}</p>
                
                {activeStep === index && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-b-2xl"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Everything you need
              <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                in one platform
              </span>
            </h2>
            <p className="text-xl text-gray-400">Integrated tools for modern marketing teams</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative p-16 rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 backdrop-blur-sm">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Ready to transform
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                your marketing?
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              Join teams building better campaigns with Centy. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/partner/login"
                className="group px-8 py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-4 border border-white/20 rounded-xl font-semibold hover:bg-white/5 transition-all">
                Schedule Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Image 
                src="/centy_logo.svg" 
                alt="Centy Logo" 
                width={44}
                height={44}
                className="w-11 h-11"
              />
              <span className="font-bold">Centy</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-400">
              <Link href="#product" className="hover:text-white transition-colors">
                Product
              </Link>
              <Link href="#features" className="hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Documentation
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Contact
              </Link>
            </div>
            <div className="text-sm text-gray-400">
              © 2025 Centy. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
