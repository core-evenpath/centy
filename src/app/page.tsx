'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { FileText, Zap, ArrowRight, Check, Play, Building2, GraduationCap, Home, Stethoscope, Calculator, ShoppingBag, Radio, Users, TrendingUp, Clock, MessageSquare, Upload, Settings } from 'lucide-react';
import { saveEarlyAccessSignupAction } from '@/actions/early-access-actions';
import { useToast } from '@/hooks/use-toast';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const slideInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const pulseAnimation = {
  scale: [1, 1.02, 1],
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
};

export default function HomePage() {
  const [activeDemo, setActiveDemo] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const { scrollY } = useScroll();
  const navBackground = useTransform(scrollY, [0, 100], ['rgba(250, 250, 249, 0)', 'rgba(250, 250, 249, 0.95)']);

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

  const howItWorks = [
    { step: "1", title: "Upload your docs", desc: "Product catalogs, price lists, FAQs — any documents your business runs on.", icon: Upload },
    { step: "2", title: "Connect channels", desc: "Link WhatsApp, Telegram, or SMS. All messages flow into one inbox.", icon: Settings },
    { step: "3", title: "AI starts responding", desc: "Customers message. AI responds with real answers. You approve or edit.", icon: MessageSquare }
  ];

  return (
    <div className="min-h-screen bg-stone-50 font-sans overflow-x-hidden">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "PingBox",
            "applicationCategory": "BusinessApplication",
            "description": "AI-powered customer messaging platform that unifies WhatsApp, Telegram & SMS into one inbox with intelligent automated responses.",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "2999",
              "priceCurrency": "INR",
              "priceValidUntil": "2025-12-31"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "156"
            }
          })
        }}
      />

      {/* Nav */}
      <motion.nav
        style={{ backgroundColor: navBackground }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-stone-200/50"
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-semibold text-stone-900 text-lg">PingBox</span>
          </motion.div>
          <div className="hidden sm:flex items-center gap-6">
            <motion.a
              href="#how"
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              whileHover={{ y: -1 }}
            >
              How it works
            </motion.a>
            <motion.a
              href="#pricing"
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              whileHover={{ y: -1 }}
            >
              Pricing
            </motion.a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/partner/login" className="text-sm text-stone-600 hover:text-stone-900 hidden sm:block">Partner Login</Link>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link href="/early-access" className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                Learn More
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 relative">
        {/* Animated background gradient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-50"
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -bottom-20 -left-40 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-40"
            animate={{
              x: [0, -20, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial="hidden"
            animate={mounted ? "visible" : "hidden"}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="flex justify-center mb-6">
              <motion.div
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full"
                whileHover={{ scale: 1.02 }}
              >
                <span className="flex gap-1">
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-green-500"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                  />
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-blue-500"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  />
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-amber-500"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                  />
                </span>
                <span className="text-xs font-medium text-emerald-700">WhatsApp · Telegram · SMS — One inbox</span>
              </motion.div>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center text-stone-900 leading-tight tracking-tight max-w-4xl mx-auto"
            >
              Instant replies, powered by<br />
              <motion.span
                className="text-emerald-600 inline-block"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                style={{
                  backgroundImage: 'linear-gradient(90deg, #059669, #10b981, #059669)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                your real business data
              </motion.span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mt-6 text-lg text-stone-600 text-center max-w-2xl mx-auto leading-relaxed"
            >
              Upload your catalogs and price lists. Connect your channels. AI responds to customers with real quotes — not templates.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link href="/early-access" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-emerald-700 transition-all hover:shadow-lg hover:shadow-emerald-200">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
              <motion.a
                href="#demo"
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-stone-600 hover:text-stone-900 px-6 py-3.5 group"
                whileHover={{ x: 3 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Play className="w-4 h-4" />
                </motion.div>
                See it work
              </motion.a>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-stone-500"
            >
              {["All channels unified", "Setup in 10 minutes", "No coding"].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-1.5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                >
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{item}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Hero Image */}
            <motion.div
              variants={fadeInScale}
              className="mt-12 relative"
            >
              <div className="relative w-full max-w-4xl mx-auto aspect-[16/9] rounded-2xl overflow-hidden shadow-2xl border border-stone-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/hero.svg"
                  alt="PingBox AI-powered customer messaging dashboard showing unified inbox with WhatsApp, Telegram, and SMS messages"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="py-16 px-4">
        <motion.div
          className="max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden"
            whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-stone-100 px-4 py-3 flex items-center gap-3 border-b border-stone-200">
              <div className="flex gap-1.5">
                <motion.div
                  className="w-3 h-3 rounded-full bg-red-400"
                  whileHover={{ scale: 1.2 }}
                />
                <motion.div
                  className="w-3 h-3 rounded-full bg-yellow-400"
                  whileHover={{ scale: 1.2 }}
                />
                <motion.div
                  className="w-3 h-3 rounded-full bg-green-400"
                  whileHover={{ scale: 1.2 }}
                />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white rounded-md px-4 py-1 text-xs text-stone-500 font-mono">app.pingbox.io</div>
              </div>
            </div>
            <div className="grid lg:grid-cols-5">
              <div className="lg:col-span-3 p-4 sm:p-6 border-b lg:border-b-0 lg:border-r border-stone-100">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeDemo}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm font-semibold text-stone-900">{demos[activeDemo].business}</div>
                        <div className="text-xs text-stone-500">{demos[activeDemo].industry}</div>
                      </div>
                      <motion.div
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${demos[activeDemo].channelBg}`}
                        layoutId="channel-badge"
                      >
                        <motion.div
                          className={`w-1.5 h-1.5 rounded-full ${demos[activeDemo].channelColor}`}
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                        <span className={`text-xs font-medium ${demos[activeDemo].channelText}`}>{demos[activeDemo].channel}</span>
                      </motion.div>
                    </div>
                    <motion.div
                      className="flex gap-3 mb-4"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-xs font-medium text-stone-600 flex-shrink-0">C</div>
                      <div className="flex-1">
                        <div className="bg-stone-100 rounded-2xl rounded-tl-md px-4 py-3 text-sm text-stone-800">{demos[activeDemo].lead}</div>
                        <div className="text-xs text-stone-400 mt-1">Just now</div>
                      </div>
                    </motion.div>
                    <motion.div
                      className="flex gap-3"
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl rounded-tl-md px-4 py-3 text-sm text-stone-800 whitespace-pre-line">{demos[activeDemo].response}</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <motion.span
                            className="text-xs text-emerald-600 font-medium"
                            animate={{ opacity: [1, 0.6, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            AI generated
                          </motion.span>
                          <span className="text-xs text-stone-400">• 2 seconds</span>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="lg:col-span-2 bg-stone-50 p-4 sm:p-6">
                <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-4">How AI knew this</div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeDemo}
                    className="space-y-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {demos[activeDemo].sources.map((source, i) => (
                      <motion.div
                        key={i}
                        className="bg-white rounded-lg p-3 border border-stone-200"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ scale: 1.02, borderColor: '#059669' }}
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm text-stone-700">{source}</span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
                <div className="mt-6 flex gap-2">
                  <motion.button
                    className="flex-1 bg-emerald-600 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-emerald-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    ✓ Send
                  </motion.button>
                  <motion.button
                    className="flex-1 bg-white text-stone-700 text-sm font-medium py-2.5 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Edit
                  </motion.button>
                </div>
                <div className="flex justify-center gap-2 mt-6">
                  {[0, 1, 2].map((i) => (
                    <motion.button
                      key={i}
                      onClick={() => setActiveDemo(i)}
                      className={`h-1.5 rounded-full transition-all ${i === activeDemo ? 'w-6 bg-emerald-600' : 'w-1.5 bg-stone-300 hover:bg-stone-400'}`}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Problem/Solution */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">The problem with "we'll get back to you"</h2>
          </motion.div>
          <motion.div
            className="grid sm:grid-cols-2 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div
              className="bg-red-50 border border-red-100 rounded-xl p-6"
              variants={slideInLeft}
              whileHover={{ scale: 1.01 }}
            >
              <div className="text-sm font-semibold text-red-600 mb-4">WITHOUT PINGBOX</div>
              <ul className="space-y-3">
                {["Customer messages at 9 PM. You see it at 10 AM. They bought from competitor.", "\"Let me check the price\" — then you forget. Lead goes cold.", "Same questions 50 times a day. You're a human FAQ.", "No idea which chats became revenue."].map((item, i) => (
                  <motion.li
                    key={i}
                    className="flex gap-3 text-sm text-stone-700"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <span className="text-red-500 font-medium">✗</span>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              className="bg-emerald-50 border border-emerald-100 rounded-xl p-6"
              variants={slideInRight}
              whileHover={{ scale: 1.01 }}
            >
              <div className="text-sm font-semibold text-emerald-600 mb-4">WITH PINGBOX</div>
              <ul className="space-y-3">
                {["Customer messages at 9 PM. AI responds in 30 seconds with accurate quote.", "AI knows your products, pricing, policies. Answers from your documents.", "You handle complex deals. AI handles the routine.", "See exactly: ₹12L revenue from 47 conversations this month."].map((item, i) => (
                  <motion.li
                    key={i}
                    className="flex gap-3 text-sm text-stone-700"
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <motion.span
                      className="text-emerald-600 font-medium"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, delay: i * 0.2 }}
                    >
                      ✓
                    </motion.span>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
          <motion.div
            className="mt-12 bg-stone-50 rounded-xl p-8 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInScale}
          >
            <motion.div
              className="text-5xl sm:text-6xl font-bold text-emerald-600"
              initial={{ scale: 0.5, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              78%
            </motion.div>
            <div className="mt-2 text-stone-600">of customers buy from the first business that responds</div>
            <div className="mt-1 text-sm text-stone-400">— Lead Connect Research</div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <div className="text-sm font-medium text-emerald-600 mb-2">HOW IT WORKS</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">10 minutes to set up. Runs forever.</h2>
          </motion.div>
          <motion.div
            className="grid sm:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {howItWorks.map((item, i) => (
              <motion.div
                key={i}
                className="bg-white rounded-xl p-6 border border-stone-200 relative overflow-hidden group"
                variants={fadeInUp}
                whileHover={{ y: -5, boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.1)" }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <div className="relative">
                  <motion.div
                    className="w-10 h-10 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-bold mb-4"
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.3 }}
                  >
                    {item.step}
                  </motion.div>
                  <h3 className="font-semibold text-stone-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-stone-600">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <div className="text-sm font-medium text-emerald-600 mb-2">BUILT FOR</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">Businesses that talk to customers daily</h2>
          </motion.div>
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {useCases.map((item, i) => (
              <motion.div
                key={i}
                className="bg-stone-50 rounded-xl p-5 cursor-pointer group"
                variants={fadeInUp}
                whileHover={{
                  scale: 1.02,
                  backgroundColor: "#f5f5f4",
                  boxShadow: "0 10px 30px -15px rgba(0, 0, 0, 0.1)"
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <item.icon className="w-6 h-6 text-emerald-600 mb-3" />
                </motion.div>
                <h3 className="font-semibold text-stone-900 mb-1">{item.title}</h3>
                <p className="text-sm text-stone-600 mb-2">{item.desc}</p>
                <div className="text-xs text-stone-400">{item.example}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Smart Broadcasts */}
      <section className="py-16 px-4 bg-emerald-600 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="grid lg:grid-cols-2 gap-12 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={slideInLeft}>
              <motion.div
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full mb-6"
                animate={pulseAnimation}
              >
                <Radio className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">Smart Broadcasts</span>
              </motion.div>
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
                  <motion.li
                    key={i}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                  >
                    <motion.div
                      className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.3)' }}
                    >
                      <item.icon className="w-4 h-4 text-white" />
                    </motion.div>
                    <span className="text-emerald-50">{item.text}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20"
              variants={slideInRight}
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <motion.div
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Zap className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <div className="font-semibold text-white">AI Suggestion</div>
                  <div className="text-sm text-emerald-200">Based on this week's conversations</div>
                </div>
              </div>
              <motion.div
                className="bg-white/10 rounded-xl p-4 mb-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <p className="text-sm text-white mb-3">
                  I noticed <span className="font-semibold">18 leads</span> inquired about industrial pumps but didn't convert.
                  Want me to send them your new bulk pricing?
                </p>
                <div className="bg-white/10 rounded-lg p-3 text-sm">
                  <div className="text-emerald-200 text-xs mb-2">SUGGESTED MESSAGE</div>
                  <div className="text-emerald-50">"Hi! Following up on your pump inquiry. We now offer 12% off on orders above 200 units. Valid till month-end. Interested?"</div>
                </div>
              </motion.div>
              <div className="flex gap-2">
                <motion.button
                  className="flex-1 bg-white text-emerald-600 text-sm font-semibold py-2.5 rounded-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Send to 18 leads
                </motion.button>
                <motion.button
                  className="flex-1 bg-white/20 text-white text-sm font-medium py-2.5 rounded-lg"
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.3)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  Edit first
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 px-4 bg-stone-900 text-white overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl sm:text-4xl font-bold">Not a chatbot. <span className="text-emerald-400">Your business brain.</span></h2>
            <p className="mt-4 text-stone-400 max-w-2xl mx-auto">Generic chatbots send templates. PingBox reads your documents and responds like your best salesperson.</p>
          </motion.div>
          <motion.div
            className="grid sm:grid-cols-2 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div
              className="bg-stone-800 rounded-xl p-6"
              variants={slideInLeft}
            >
              <div className="text-sm text-stone-500 mb-3">GENERIC CHATBOT</div>
              <motion.div
                className="bg-stone-700/50 rounded-lg p-4 text-sm text-stone-300"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                "Thank you for your inquiry! Our team will get back to you shortly."
              </motion.div>
              <div className="mt-3 text-xs text-stone-500">→ Customer already messaged 3 competitors</div>
            </motion.div>
            <motion.div
              className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-6"
              variants={slideInRight}
              whileHover={{ borderColor: 'rgba(16, 185, 129, 0.8)' }}
            >
              <div className="text-sm text-emerald-400 mb-3">PINGBOX</div>
              <motion.div
                className="bg-emerald-800/30 border border-emerald-700/30 rounded-lg p-4 text-sm text-stone-200"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                "Hi! For 500 units of 2HP pumps, unit price is ₹12,500. With 8% bulk discount, total: ₹57.5L. Want a quote?"
              </motion.div>
              <motion.div
                className="mt-3 text-xs text-emerald-400"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                → Customer: "Yes, send the quote"
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <div className="text-sm font-medium text-emerald-600 mb-2">PRICING</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900">Simple pricing. Real ROI.</h2>
          </motion.div>
          <motion.div
            className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div
              className="bg-white rounded-xl p-6 border border-stone-200"
              variants={fadeInUp}
              whileHover={{ y: -5, boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="text-sm text-stone-500 mb-1">Starter</div>
              <div className="flex items-baseline gap-1">
                <motion.span
                  className="text-4xl font-bold text-stone-900"
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  ₹2,999
                </motion.span>
                <span className="text-stone-500">/mo</span>
              </div>
              <p className="text-sm text-stone-500 mt-2 mb-6">For businesses getting started</p>
              <ul className="space-y-3 mb-6">
                {["1 channel (WhatsApp/Telegram/SMS)", "500 AI responses/month", "50 documents", "Basic analytics"].map((item, i) => (
                  <motion.li
                    key={i}
                    className="flex items-center gap-2 text-sm text-stone-700"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Check className="w-4 h-4 text-emerald-600" />{item}
                  </motion.li>
                ))}
              </ul>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link href="/early-access" className="w-full bg-stone-100 text-stone-800 py-3 rounded-lg font-medium hover:bg-stone-200 transition-colors block text-center">Learn More</Link>
              </motion.div>
            </motion.div>
            <motion.div
              className="bg-white rounded-xl p-6 border-2 border-emerald-600 relative"
              variants={fadeInUp}
              whileHover={{ y: -5, boxShadow: "0 20px 40px -15px rgba(5, 150, 105, 0.2)" }}
            >
              <motion.div
                className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full"
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                POPULAR
              </motion.div>
              <div className="text-sm text-emerald-600 mb-1">Growth</div>
              <div className="flex items-baseline gap-1">
                <motion.span
                  className="text-4xl font-bold text-stone-900"
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  ₹7,999
                </motion.span>
                <span className="text-stone-500">/mo</span>
              </div>
              <p className="text-sm text-stone-500 mt-2 mb-6">For serious lead conversion</p>
              <ul className="space-y-3 mb-6">
                {["All channels (WhatsApp + Telegram + SMS)", "2,000 AI responses/month", "Unlimited documents", "Revenue tracking", "Smart broadcasts", "3 team members"].map((item, i) => (
                  <motion.li
                    key={i}
                    className="flex items-center gap-2 text-sm text-stone-700"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Check className="w-4 h-4 text-emerald-600" />{item}
                  </motion.li>
                ))}
              </ul>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link href="/early-access" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors block text-center">Learn More</Link>
              </motion.div>
            </motion.div>
          </motion.div>
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-sm text-stone-600">Average customer sees <motion.span
              className="font-semibold text-emerald-600"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >23x ROI</motion.span> in first 30 days</span>
          </motion.div>
        </div>
      </section>

      {/* Join Our Select Partners */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-12 md:p-16 text-white shadow-2xl relative overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInScale}
          >
            {/* Animated background shapes */}
            <motion.div
              className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              animate={{
                x: [0, 30, 0],
                y: [0, -30, 0],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl"
              animate={{
                x: [0, -20, 0],
                y: [0, 20, 0],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative">
              <motion.h2
                className="text-5xl font-extrabold mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                Join Our Select Partners
              </motion.h2>
              <motion.p
                className="text-xl mb-6 opacity-90"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.9 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                We're currently working with a select group of invited partners to perfect the PingBox experience. Have an invitation code? Access your dashboard now.
              </motion.p>
              <motion.div
                className="flex justify-center items-center mb-10"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/partner/login"
                    className="group px-10 py-4 bg-white text-stone-900 font-bold rounded-full hover:shadow-xl transition-all inline-flex items-center gap-2"
                  >
                    Partner Login
                    <motion.div
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                className="w-full max-w-lg mx-auto bg-white/10 p-6 rounded-2xl backdrop-blur"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <p className="font-bold mb-3">Want Early Access?</p>
                <p className="text-sm opacity-80 mb-4">Join the waitlist and we'll send you an invite soon.</p>
                {isSubmitted ? (
                  <motion.div
                    className="bg-green-100 border border-green-300 text-green-900 px-4 py-3 rounded-xl text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    ✓ You're on the list! We'll be in touch soon.
                  </motion.div>
                ) : (
                  <form onSubmit={handleEarlyAccessSubmit} className="flex flex-col gap-3">
                    <motion.input
                      name="name"
                      type="text"
                      placeholder="Your name"
                      value={earlyAccessForm.name}
                      onChange={handleEarlyAccessChange}
                      className="flex-1 px-4 py-3 rounded-lg text-stone-900 placeholder-stone-500"
                      disabled={isSubmitting}
                      whileFocus={{ scale: 1.01 }}
                    />
                    <div className="flex flex-col sm:flex-row gap-3">
                      <motion.input
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={earlyAccessForm.email}
                        onChange={handleEarlyAccessChange}
                        className="flex-1 px-4 py-3 rounded-lg text-stone-900 placeholder-stone-500"
                        disabled={isSubmitting}
                        whileFocus={{ scale: 1.01 }}
                      />
                      <motion.button
                        type="submit"
                        className="px-6 py-3 bg-white text-stone-900 font-bold rounded-lg transition-all disabled:opacity-50"
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isSubmitting ? 'Joining...' : 'Request Invite'}
                      </motion.button>
                    </div>
                  </form>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-stone-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="font-semibold text-stone-900">PingBox</span>
          </motion.div>
          <div className="flex items-center gap-6 text-sm text-stone-500">
            <Link href="/privacy" className="hover:text-stone-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-stone-900 transition-colors">Terms</Link>
            <a href="mailto:hello@pingbox.io" className="hover:text-stone-900 transition-colors">Contact</a>
          </div>
          <div className="text-sm text-stone-400">© 2025 PingBox. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
