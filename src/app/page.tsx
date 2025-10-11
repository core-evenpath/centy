'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Zap, Users, BarChart3, Target, Rocket, Heart } from 'lucide-react';

export default function HomePage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
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
      icon: <Zap className="w-7 h-7" />,
      title: "AI Campaign Builder",
      description: "Let AI write your campaigns. You just review and launch.",
      color: "from-yellow-400 to-orange-500"
    },
    {
      icon: <Users className="w-7 h-7" />,
      title: "Team Workspace",
      description: "Collaborate in real-time. Comments, tasks, approvals—all here.",
      color: "from-blue-400 to-cyan-500"
    },
    {
      icon: <BarChart3 className="w-7 h-7" />,
      title: "Smart Analytics",
      description: "Beautiful dashboards that actually make sense.",
      color: "from-purple-400 to-pink-500"
    },
    {
      icon: <Target className="w-7 h-7" />,
      title: "Multi-Channel",
      description: "Email, social, web—manage it all from one place.",
      color: "from-green-400 to-emerald-500"
    },
    {
      icon: <Rocket className="w-7 h-7" />,
      title: "Quick Templates",
      description: "Start with templates. Customize in minutes.",
      color: "from-red-400 to-rose-500"
    },
    {
      icon: <Heart className="w-7 h-7" />,
      title: "Made with Love",
      description: "We actually care about making marketing fun again.",
      color: "from-pink-400 to-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-9 h-9 text-orange-500" />
            <span className="text-xl font-bold text-gray-900">Centy</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Features
            </Link>
            <Link 
              href="/partner/login"
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all"
            >
              Partner Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-orange-200 mb-6">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-700">Obviosly AI Powered</span>
              </div>
              
              <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
                One hub. Connected.
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Stop juggling 10 tools. Centy brings campaigns, team, and analytics into one happy place.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/partner/signup"
                  className="group px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-full hover:shadow-xl hover:scale-105 transition-all inline-flex items-center justify-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 font-bold rounded-full hover:border-orange-300 hover:shadow-lg transition-all">
                  See How It Works
                </button>
              </div>
            </div>

            {/* Right side - Logo */}
            <div className="relative">
              <div className="relative animate-float">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <div className="relative p-8">
                  <Image 
                    src="/centy_logo.svg" 
                    alt="Centy AI Assistant" 
                    width={500}
                    height={500}
                    className="w-full h-auto"
                    priority
                  />
                </div>
              </div>
              
              {/* Floating badges */}
              <div className="absolute -top-4 -left-4 bg-gradient-to-br from-blue-500 to-cyan-400 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm animate-bounce-slow">
                🚀 Fast Setup
              </div>
              <div className="absolute -bottom-4 -right-4 bg-gradient-to-br from-purple-500 to-pink-400 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm animate-bounce-slow" style={{ animationDelay: '0.5s' }}>
                ✨ AI Powered
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Benefits */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Launch in Minutes</h3>
              <p className="text-gray-600">Not weeks. AI helps you build campaigns fast.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">One Dashboard</h3>
              <p className="text-gray-600">See everything. Track everything. From one place.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Team Sync</h3>
              <p className="text-gray-600">Everyone knows what's happening. No more chaos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features with Hover Effects */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-extrabold text-gray-900 mb-4">
              Everything you need,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">nothing you don't</span>
            </h2>
            <p className="text-xl text-gray-600">Simple, powerful, and actually fun to use</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`bg-white rounded-2xl p-8 border-2 transition-all duration-300 cursor-pointer ${
                  hoveredFeature === index
                    ? 'border-orange-300 shadow-2xl scale-105 -translate-y-2'
                    : 'border-gray-200 shadow-lg hover:shadow-xl'
                }`}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-4 transition-transform ${
                  hoveredFeature === index ? 'scale-110 rotate-6' : ''
                }`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-3xl p-12 md:p-16 text-white shadow-2xl">
            <h2 className="text-5xl font-extrabold mb-6">
              Ready to have fun with marketing?
            </h2>
            <p className="text-xl mb-10 opacity-90">
              Join teams who actually enjoy their marketing workflow
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/partner/signup"
                className="px-10 py-4 bg-white text-gray-900 font-bold rounded-full hover:scale-105 transition-transform shadow-xl inline-flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <span className="text-white/80 text-sm">
                ✨ Free forever • No credit card • 2 min setup
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-orange-500" />
              <span className="font-bold text-gray-900">Centy</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-600">
              <Link href="#features" className="hover:text-gray-900">Features</Link>
              <Link href="#" className="hover:text-gray-900">Blog</Link>
              <Link href="#" className="hover:text-gray-900">Contact</Link>
            </div>
            <div className="text-sm text-gray-500">
              © 2025 Centy • Made with ❤️
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
