'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, Zap, ArrowRight, Check, Play, Building2, GraduationCap, Home, Stethoscope, Calculator, ShoppingBag, Radio, Users, TrendingUp, Clock } from 'lucide-react';
import { saveEarlyAccessSignupAction } from '@/actions/early-access-actions';
import { useToast } from '@/hooks/use-toast';

export default function HomePage() {
  const [activeDemo, setActiveDemo] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  const [earlyAccessForm, setEarlyAccessForm] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveDemo((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleEarlyAccessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEarlyAccessForm({
      ...earlyAccessForm,
      [e.target.name]: e.target.value
    });
  };

  const handleEarlyAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!earlyAccessForm.name || !earlyAccessForm.email) {
      toast({
        variant: 'destructive',
        title: 'Please fill out both name and email.'
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await saveEarlyAccessSignupAction(earlyAccessForm);
      if (result.success) {
        toast({
          title: 'Success!',
          description: "You're on the list. We'll be in touch soon.",
        });
        setIsSubmitted(true);
        setEarlyAccessForm({ name: '', email: '' });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const demos = [
    {
      business: "Industrial Pumps Supplier",
      industry: "Manufacturing",
      channel: "WhatsApp",
      channelColor: "bg-green-500",
      channelBg: "bg-green-50",
      channelText: "text-green-700",
      lead: "Hi, I need 500 units of 2HP industrial pumps. What's your best price?",
      response: `Hi Rajesh! For 500 units of 2HP Industrial Pumps (Model IP-2000):

• Unit price: ₹12,500
• Bulk discount (200+ units): 8% off
• Your total: ₹57,50,000

Delivery to Gujarat: 15-20 days
Payment: 50% advance, 50% on delivery

Want me to send a formal quotation?`,
      sources: ["Product_Catalog.xlsx", "Pricing_Policy.pdf"]
    },
    {
      business: "Study Abroad Consultant",
      industry: "Education",
      channel: "Telegram",
      channelColor: "bg-blue-500",
      channelBg: "bg-blue-50",
      channelText: "text-blue-700",
      lead: "What documents do I need for a Canada student visa?",
      response: `Hi Priya! For a Canada Study Permit, you'll need:

• Acceptance letter from your DLI
• Proof of funds (₹12-15L for first year)
• IELTS score (minimum 6.0)
• Medical exam & police clearance

I see you inquired about University of Toronto earlier — they require 6.5 IELTS minimum.

Would you like me to check your eligibility?`,
      sources: ["Visa_Requirements.pdf", "Previous conversation"]
    },
    {
      business: "CA Firm",
      industry: "Professional Services",
      channel: "SMS",
      channelColor: "bg-amber-500",
      channelBg: "bg-amber-50",
      channelText: "text-amber-700",
      lead: "What's the deadline for GST filing this quarter?",
      response: `Hi! The GSTR-3B deadline for this quarter is January 20th.

Based on your business turnover (₹2.5 Cr), you're also required to file:
• GSTR-1 by January 11th
• Annual return by December 31st

I can help prepare the filing summary from your uploaded invoices.

Should I start the reconciliation?`,
      sources: ["GST_Guidelines.pdf", "Client_Profile.xlsx"]
    }
  ];

  const useCases = [
    { icon: Building2, title: "Manufacturers & Suppliers", desc: "Bulk inquiries answered with accurate specs and pricing.", example: "IndiaMART sellers, exporters" },
    { icon: GraduationCap, title: "Education & Coaching", desc: "Admission queries answered instantly with course details.", example: "Study abroad, coaching" },
    { icon: Home, title: "Real Estate", desc: "Property inquiries with floor plans, pricing, availability.", example: "Agents, builders" },
    { icon: Stethoscope, title: "Healthcare", desc: "Appointment queries, clinic hours — automated.", example: "Clinics, diagnostics" },
    { icon: Calculator, title: "CA & Professional Services", desc: "Compliance queries with deadlines and requirements.", example: "CA firms, legal" },
    { icon: ShoppingBag, title: "E-commerce & D2C", desc: "Product questions, order status — handled with context.", example: "Online stores" }
  ];

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-50/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-semibold text-stone-900 text-lg">PingBox</span>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <a href="#how" className="text-sm text-stone-600 hover:text-stone-900">How it works</a>
            <a href="#pricing" className="text-sm text-stone-600 hover:text-stone-900">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/partner/login" className="text-sm text-stone-600 hover:text-stone-900 hidden sm:block">Partner Login</Link>
            <Link href="/early-access" className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors">Learn More</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                </span>
                <span className="text-xs font-medium text-emerald-700">WhatsApp · Telegram · SMS — One inbox</span>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center text-stone-900 leading-tight tracking-tight max-w-4xl mx-auto">
              Instant replies, powered by<br /><span className="text-emerald-600">your real business data</span>
            </h1>
            <p className="mt-6 text-lg text-stone-600 text-center max-w-2xl mx-auto leading-relaxed">
              Upload your catalogs and price lists. Connect your channels. AI responds to customers with real quotes — not templates.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/early-access" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-emerald-700 transition-all hover:shadow-lg">
                🎯 Learn More <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#demo" className="w-full sm:w-auto flex items-center justify-center gap-2 text-stone-600 hover:text-stone-900 px-6 py-3.5">
                <Play className="w-4 h-4" /> See it work
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-stone-500">
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /><span>All channels unified</span></div>
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /><span>Setup in 10 minutes</span></div>
              <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-600" /><span>No coding</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
            <div className="bg-stone-100 px-4 py-3 flex items-center gap-3 border-b border-stone-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white rounded-md px-4 py-1 text-xs text-stone-500 font-mono">app.pingbox.io</div>
              </div>
            </div>
            <div className="grid lg:grid-cols-5">
              <div className="lg:col-span-3 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-stone-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-semibold text-stone-900">{demos[activeDemo].business}</div>
                    <div className="text-xs text-stone-500">{demos[activeDemo].industry}</div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${demos[activeDemo].channelBg}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${demos[activeDemo].channelColor}`} />
                    <span className={`text-xs font-medium ${demos[activeDemo].channelText}`}>{demos[activeDemo].channel}</span>
                  </div>
                </div>
                <div className="flex gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-medium text-stone-600 flex-shrink-0">C</div>
                  <div className="flex-1">
                    <div className="bg-stone-100 rounded-2xl rounded-tl-md px-4 py-3 text-sm text-stone-800">{demos[activeDemo].lead}</div>
                    <div className="text-xs text-stone-400 mt-1">Just now</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl rounded-tl-md px-4 py-3 text-sm text-stone-800 whitespace-pre-line">{demos[activeDemo].response}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-emerald-600 font-medium">AI generated</span>
                      <span className="text-xs text-stone-400">• 2 seconds</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 bg-stone-50 p-4 sm:p-6">
                <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-4">How AI knew this</div>
                <div className="space-y-3">
                  {demos[activeDemo].sources.map((source, i) => (
                    <div key={i} className="bg-white rounded-lg p-3 border border-stone-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm text-stone-700">{source}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex gap-2">
                  <button className="flex-1 bg-emerald-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-emerald-700 transition-colors">✓ Send</button>
                  <button className="flex-1 bg-white text-stone-700 text-sm font-medium py-2.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors">Edit</button>
                </div>
                <div className="flex justify-center gap-2 mt-6">
                  {[0, 1, 2].map((i) => (
                    <button key={i} onClick={() => setActiveDemo(i)} className={`h-1.5 rounded-full transition-all ${i === activeDemo ? 'w-6 bg-emerald-600' : 'w-1.5 bg-stone-300 hover:bg-stone-400'}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">The problem with "we'll get back to you"</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-red-50 border border-red-100 rounded-xl p-6">
              <div className="text-sm font-semibold text-red-600 mb-4">WITHOUT PINGBOX</div>
              <ul className="space-y-3">
                {["Customer messages at 9 PM. You see it at 10 AM. They bought from competitor.", "\"Let me check the price\" — then you forget. Lead goes cold.", "Same questions 50 times a day. You're a human FAQ.", "No idea which chats became revenue."].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-stone-700"><span className="text-red-500 font-medium">✗</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6">
              <div className="text-sm font-semibold text-emerald-600 mb-4">WITH PINGBOX</div>
              <ul className="space-y-3">
                {["Customer messages at 9 PM. AI responds in 30 seconds with accurate quote.", "AI knows your products, pricing, policies. Answers from your documents.", "You handle complex deals. AI handles the routine.", "See exactly: ₹12L revenue from 47 conversations this month."].map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-stone-700"><span className="text-emerald-600 font-medium">✓</span><span>{item}</span></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-12 bg-stone-50 rounded-xl p-8 text-center">
            <div className="text-5xl sm:text-6xl font-bold text-emerald-600">78%</div>
            <div className="mt-2 text-stone-600">of customers buy from the first business that responds</div>
            <div className="mt-1 text-sm text-stone-400">— Lead Connect Research</div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-sm font-medium text-emerald-600 mb-2">HOW IT WORKS</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">10 minutes to set up. Runs forever.</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Upload your docs", desc: "Product catalogs, price lists, FAQs — any documents your business runs on." },
              { step: "2", title: "Connect channels", desc: "Link WhatsApp, Telegram, or SMS. All messages flow into one inbox." },
              { step: "3", title: "AI starts responding", desc: "Customers message. AI responds with real answers. You approve or edit." }
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-stone-200">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold mb-4">{item.step}</div>
                <h3 className="font-semibold text-stone-900 mb-2">{item.title}</h3>
                <p className="text-sm text-stone-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-sm font-medium text-emerald-600 mb-2">BUILT FOR</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">Businesses that talk to customers daily</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((item, i) => (
              <div key={i} className="bg-stone-50 rounded-xl p-5 hover:bg-stone-100 transition-colors">
                <item.icon className="w-6 h-6 text-emerald-600 mb-3" />
                <h3 className="font-semibold text-stone-900 mb-1">{item.title}</h3>
                <p className="text-sm text-stone-600 mb-2">{item.desc}</p>
                <div className="text-xs text-stone-400">{item.example}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Smart Broadcasts */}
      <section className="py-16 px-4 bg-emerald-600">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full mb-6">
                <Radio className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Smart Broadcasts</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Don't just respond.<br />Reach out intelligently.
              </h2>
              <p className="text-emerald-100 text-lg mb-8">
                AI notices patterns in your conversations and suggests targeted campaigns. Not spam — smart outreach to the right customers at the right time.
              </p>
              <ul className="space-y-4">
                {[
                  { icon: TrendingUp, text: "\"15 leads asked about 2HP pumps this month. Send them the bulk discount?\"" },
                  { icon: Clock, text: "\"23 warm leads haven't replied in 3 days. Follow up?\"" },
                  { icon: Users, text: "\"New product launch — notify 156 customers who bought similar items?\"" }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-emerald-50">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white">AI Suggestion</div>
                  <div className="text-sm text-emerald-200">Based on this week's conversations</div>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 mb-4">
                <p className="text-sm text-white mb-3">
                  I noticed <span className="font-semibold">18 leads</span> inquired about industrial pumps but didn't convert.
                  Want me to send them your new bulk pricing?
                </p>
                <div className="bg-white/10 rounded-lg p-3 text-sm">
                  <div className="text-emerald-200 text-xs mb-2">SUGGESTED MESSAGE</div>
                  <div className="text-emerald-50">"Hi! Following up on your pump inquiry. We now offer 12% off on orders above 200 units. Valid till month-end. Interested?"</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-white text-emerald-600 text-sm font-semibold py-2.5 rounded-lg">Send to 18 leads</button>
                <button className="flex-1 bg-white/20 text-white text-sm font-medium py-2.5 rounded-lg">Edit first</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 px-4 bg-stone-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">Not a chatbot. <span className="text-emerald-400">Your business brain.</span></h2>
            <p className="mt-4 text-stone-400 max-w-2xl mx-auto">Generic chatbots send templates. PingBox reads your documents and responds like your best salesperson.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-stone-800 rounded-xl p-6">
              <div className="text-sm text-stone-500 mb-3">GENERIC CHATBOT</div>
              <div className="bg-stone-700/50 rounded-lg p-4 text-sm text-stone-300">"Thank you for your inquiry! Our team will get back to you shortly."</div>
              <div className="mt-3 text-xs text-stone-500">→ Customer already messaged 3 competitors</div>
            </div>
            <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-6">
              <div className="text-sm text-emerald-400 mb-3">PINGBOX</div>
              <div className="bg-emerald-800/30 border border-emerald-700/30 rounded-lg p-4 text-sm text-stone-200">"Hi! For 500 units of 2HP pumps, unit price is ₹12,500. With 8% bulk discount, total: ₹57.5L. Want a quote?"</div>
              <div className="mt-3 text-xs text-emerald-400">→ Customer: "Yes, send the quote"</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-sm font-medium text-emerald-600 mb-2">PRICING</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">Simple pricing. Real ROI.</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl p-6 border border-stone-200">
              <div className="text-sm text-stone-500 mb-1">Starter</div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-stone-900">₹2,999</span>
                <span className="text-stone-500">/mo</span>
              </div>
              <p className="text-sm text-stone-500 mt-2 mb-6">For businesses getting started</p>
              <ul className="space-y-3 mb-6">
                {["1 channel (WhatsApp/Telegram/SMS)", "500 AI responses/month", "50 documents", "Basic analytics"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-stone-700"><Check className="w-4 h-4 text-emerald-600" />{item}</li>
                ))}
              </ul>
              <Link href="/early-access" className="w-full bg-stone-100 text-stone-800 py-3 rounded-lg font-medium hover:bg-stone-200 transition-colors block text-center">Learn More</Link>
            </div>
            <div className="bg-white rounded-xl p-6 border-2 border-emerald-600 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full">POPULAR</div>
              <div className="text-sm text-emerald-600 mb-1">Growth</div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-stone-900">₹7,999</span>
                <span className="text-stone-500">/mo</span>
              </div>
              <p className="text-sm text-stone-500 mt-2 mb-6">For serious lead conversion</p>
              <ul className="space-y-3 mb-6">
                {["All channels (WhatsApp + Telegram + SMS)", "2,000 AI responses/month", "Unlimited documents", "Revenue tracking", "Smart broadcasts", "3 team members"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-stone-700"><Check className="w-4 h-4 text-emerald-600" />{item}</li>
                ))}
              </ul>
              <Link href="/early-access" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors block text-center">Learn More</Link>
            </div>
          </div>
          <div className="mt-8 text-center">
            <span className="text-sm text-stone-600">Average customer sees <span className="font-semibold text-emerald-600">23x ROI</span> in first 30 days</span>
          </div>
        </div>
      </section>

      {/* Join Our Select Partners - RETAINED */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-12 md:p-16 text-white shadow-2xl">
            <h2 className="text-5xl font-extrabold mb-6">
              Join Our Select Partners
            </h2>
            <p className="text-xl mb-6 opacity-90">
              We're currently working with a select group of invited partners to perfect the PingBox experience. Have an invitation code? Access your dashboard now.
            </p>
            <div className="flex justify-center items-center mb-10">
              <Link
                href="/partner/login"
                className="group px-10 py-4 bg-white text-stone-900 font-bold rounded-full hover:scale-105 transition-transform shadow-xl inline-flex items-center gap-2"
              >
                Partner Login
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="w-full max-w-lg mx-auto bg-white/10 p-6 rounded-2xl">
              <p className="font-bold mb-3">✨ Want Early Access?</p>
              <p className="text-sm opacity-80 mb-4">Join the waitlist and we'll send you an invite soon.</p>
              {isSubmitted ? (
                 <div className="bg-green-100 border border-green-300 text-green-900 px-4 py-3 rounded-xl text-center">
                  ✓ You're on the list! We'll be in touch soon.
                </div>
              ) : (
                <form onSubmit={handleEarlyAccessSubmit} className="flex flex-col gap-3">
                  <input
                    name="name"
                    type="text"
                    placeholder="Your name"
                    value={earlyAccessForm.name}
                    onChange={handleEarlyAccessChange}
                    className="flex-1 px-4 py-3 rounded-lg text-stone-900 placeholder-stone-500"
                    disabled={isSubmitting}
                  />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={earlyAccessForm.email}
                      onChange={handleEarlyAccessChange}
                      className="flex-1 px-4 py-3 rounded-lg text-stone-900 placeholder-stone-500"
                      disabled={isSubmitting}
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-white text-stone-900 font-bold rounded-lg hover:scale-105 transition-transform disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Joining...' : 'Request Invite'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-stone-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">P</span>
                </div>
                <span className="font-semibold text-white text-lg">PingBox</span>
              </div>
              <p className="text-stone-400 text-sm leading-relaxed">
                Instant AI-powered replies using your real business data. Turn conversations into conversions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#how" className="text-stone-400 hover:text-emerald-400 transition-colors">How it works</a></li>
                <li><a href="#pricing" className="text-stone-400 hover:text-emerald-400 transition-colors">Pricing</a></li>
                <li><a href="#demo" className="text-stone-400 hover:text-emerald-400 transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-stone-400 hover:text-emerald-400 transition-colors">About</a></li>
                <li><a href="#" className="text-stone-400 hover:text-emerald-400 transition-colors">Blog</a></li>
                <li><a href="#" className="text-stone-400 hover:text-emerald-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-stone-400 hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-stone-400 hover:text-emerald-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-stone-500">© 2025 PingBox. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <a href="#" className="w-8 h-8 bg-stone-800 rounded-lg flex items-center justify-center text-stone-400 hover:text-emerald-400 hover:bg-stone-700 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 bg-stone-800 rounded-lg flex items-center justify-center text-stone-400 hover:text-emerald-400 hover:bg-stone-700 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
