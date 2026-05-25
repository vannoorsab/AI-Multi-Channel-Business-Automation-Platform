'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Activity, 
  Cpu, 
  Sparkles, 
  Smartphone, 
  Workflow, 
  CheckCircle2, 
  Play, 
  Mail, 
  Layers, 
  Bot, 
  ShieldCheck, 
  Zap, 
  BarChart3,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MarketingPage() {
  const [theme, setTheme] = useState('dark');
  const { token } = useAuth();

  // Load theme state
  useEffect(() => {
    const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') || 'dark' : 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    if (newTheme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-slate-950 text-slate-100 font-sans selection:bg-brand-500 selection:text-white transition-colors duration-300">
      
      {/* Decorative Floating Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-brand-600/10 blur-[120px] pointer-events-none z-0 glow-effect"></div>
      <div className="absolute bottom-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-brand-500/5 blur-[100px] pointer-events-none z-0"></div>
      
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full bg-slate-950/40 backdrop-blur-md border-b border-slate-900/60 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo Brand */}
          <Link href="/dashboard" className="flex items-center gap-2.5 z-10 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-extrabold shadow-brand-glow">
              <Zap className="w-5.5 h-5.5 fill-white/10" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white uppercase">Apex</span>
              <span className="text-[10px] block font-bold text-brand-400 tracking-widest uppercase mt-[-4px]">Autoflow</span>
            </div>
          </Link>

          {/* Quick links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Key Channels</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#builder" className="hover:text-white transition-colors">Workflow Automation</a>
            <a href="#spotlight" className="hover:text-white transition-colors">Advanced Tools</a>
          </nav>

          {/* CTAs */}
          <div className="flex items-center gap-4 z-10">
            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-slate-400 hover:text-white cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-700" />}
            </button>

            {token ? (
              <Link 
                href="/dashboard"
                className="glass-btn-primary px-5 py-2.5 text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-brand-glow text-white"
              >
                <span>Console Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/login"
                  className="text-xs sm:text-sm font-bold text-slate-350 hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link 
                  href="/signup"
                  className="glass-btn-primary px-5 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-1 cursor-pointer shadow-brand-glow text-white"
                >
                  <span>Sign Up</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Enterprise Automation Platform</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1] text-balance">
            Automate Customer Journeys in <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 via-brand-500 to-indigo-400">Real-Time</span>
          </h1>

          {/* Sub headline */}
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Unify simulated WhatsApp, webhooks, lead databases, and Gemini 2.0. Capture emails, auto-schedule consultation calendars, score hot prospects, and close deals instantly.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href={token ? "/dashboard" : "/signup"} 
              className="w-full sm:w-auto glass-btn-primary px-8 py-3.5 font-bold text-sm flex items-center justify-center gap-2 text-white"
            >
              <span>{token ? 'Go to Console' : 'Get Started Free'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a 
              href="#how-it-works" 
              className="w-full sm:w-auto glass-btn-secondary px-8 py-3.5 font-bold text-sm flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-brand-400 fill-brand-400/20" />
              <span>See How it Works</span>
            </a>
          </div>

        </div>

        {/* Dashboard Live Mockup Asset Display */}
        <div className="mt-16 relative rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 max-w-5xl mx-auto shadow-glass overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-slate-950 pointer-events-none z-10"></div>
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-500/40 to-transparent"></div>
          <img 
            src="/images/saas_hero_preview.png" 
            alt="Apex SaaS automation dashboard overview" 
            className="w-full h-auto rounded-xl shadow-2xl transition-all duration-700 group-hover:scale-[1.01]"
          />
        </div>

      </section>

      {/* Core Features Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-slate-900/60">
        
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            One Unified Workspace, Three Key Channels
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Eliminate fragmented tools. Connect your entire lead generation, marketing responses, and CRM sales pipelines into a single interface.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card 1: Multi-Channel */}
          <div className="glass-panel p-8 bg-slate-900/30 flex flex-col justify-between border-slate-850 hover:border-brand-500/25 group transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">WhatsApp & Webhooks</h3>
              <p className="text-slate-450 text-xs sm:text-sm leading-relaxed mb-6">
                Receive Simulated customer texts, listen to live WhatsApp Webhook APIs, and reply directly from the Unified Inbox in milliseconds.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Simulated outbound dispatch active</span>
            </div>
          </div>

          {/* Card 2: AI */}
          <div className="glass-panel p-8 bg-slate-900/30 flex flex-col justify-between border-slate-850 hover:border-brand-500/25 group transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Gemini 2.0 AI Smart Agent</h3>
              <p className="text-slate-450 text-xs sm:text-sm leading-relaxed mb-6">
                Deploy advanced intake models. RAG fact sheet training, conversational filters, and smart appointment booking coordinates automatically.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Fact sheets auto-resolver synced</span>
            </div>
          </div>

          {/* Card 3: CRM */}
          <div className="glass-panel p-8 bg-slate-900/30 flex flex-col justify-between border-slate-850 hover:border-brand-500/25 group transition-all duration-300">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">CRM Pipeline & Scoring</h3>
              <p className="text-slate-450 text-xs sm:text-sm leading-relaxed mb-6">
                Organize leads on Kanban cards. Auto-capture emails, schedule reminders, document customer interactions, and calculate real-time deal scoring.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Horizontal drag-and-drop board</span>
            </div>
          </div>

        </div>

      </section>

      {/* How it Works Vertical Timeline */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-slate-900/60 bg-slate-950/20">
        
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            How The Automation Ecosystem Works
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            From initial text to a finalized, high-scoring won deal—witness how our backend pipelines manage customer lifecycles.
          </p>
        </div>

        {/* Timeline Grid layout */}
        <div className="relative max-w-4xl mx-auto">
          {/* Vertical Center Line */}
          <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-[2px] bg-slate-900"></div>

          <div className="space-y-16">
            
            {/* Step 1 */}
            <div className="relative flex flex-col sm:flex-row items-start justify-between gap-8 sm:gap-0">
              <div className="absolute left-2 sm:left-1/2 transform -translate-x-1/2 w-5 h-5 rounded-full bg-brand-500 border-4 border-slate-950 z-20 shadow-brand-glow"></div>
              
              <div className="w-full sm:w-[45%] pl-12 sm:pl-0 sm:text-right">
                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Phase 01</span>
                <h4 className="text-lg font-bold text-white mt-1 mb-2">Simulated Sandbox Text Received</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  A potential customer inputs simulated messages on your custom simulator dashboard or triggers real Twilio WhatsApp API endpoints.
                </p>
              </div>
              <div className="hidden sm:block w-[10%]"></div>
              <div className="w-full sm:w-[45%] hidden sm:block"></div>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col sm:flex-row items-start justify-between gap-8 sm:gap-0">
              <div className="absolute left-2 sm:left-1/2 transform -translate-x-1/2 w-5 h-5 rounded-full bg-indigo-500 border-4 border-slate-950 z-20 shadow-indigo-glow"></div>
              
              <div className="w-full sm:w-[45%] hidden sm:block"></div>
              <div className="hidden sm:block w-[10%]"></div>
              <div className="w-full sm:w-[45%] pl-12 sm:pl-0">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Phase 02</span>
                <h4 className="text-lg font-bold text-white mt-1 mb-2">Trigger Event Processing</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Apex checks your database for automated triggers (`lead_created` or `message_received`). Workflow rules launch actions instantly.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col sm:flex-row items-start justify-between gap-8 sm:gap-0">
              <div className="absolute left-2 sm:left-1/2 transform -translate-x-1/2 w-5 h-5 rounded-full bg-pink-500 border-4 border-slate-950 z-20 shadow-pink-glow"></div>
              
              <div className="w-full sm:w-[45%] pl-12 sm:pl-0 sm:text-right">
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">Phase 03</span>
                <h4 className="text-lg font-bold text-white mt-1 mb-2">Gemini AI Auto-Response</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  If the trigger invokes a Gemini Auto-Reply, Apex evaluates past transcripts, references chatbot config fact sheets, and auto-captures contact information.
                </p>
              </div>
              <div className="hidden sm:block w-[10%]"></div>
              <div className="w-full sm:w-[45%] hidden sm:block"></div>
            </div>

            {/* Step 4 */}
            <div className="relative flex flex-col sm:flex-row items-start justify-between gap-8 sm:gap-0">
              <div className="absolute left-2 sm:left-1/2 transform -translate-x-1/2 w-5 h-5 rounded-full bg-emerald-500 border-4 border-slate-950 z-20 shadow-emerald-glow"></div>
              
              <div className="w-full sm:w-[45%] hidden sm:block"></div>
              <div className="hidden sm:block w-[10%]"></div>
              <div className="w-full sm:w-[45%] pl-12 sm:pl-0">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Phase 04</span>
                <h4 className="text-lg font-bold text-white mt-1 mb-2">Automatic Calendar CRM Booking</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Upon receiving calendar/email inputs, Apex schedules calendar reminders (`lead.reminders`), records detailed client logs, and assigns qualified reps.
                </p>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* Visual Product Showcase */}
      <section id="builder" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-slate-900/60">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-6">
            <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Drag-and-Drop Rules</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Create Powerful Workflow Scripts
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Design automations tailored to your exact industry. Build custom rules combining instant templates, Gemini generative agents, real-time CRM updates, and deal scoring multipliers.
            </p>

            <ul className="space-y-3.5 text-xs text-slate-350">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Trigger on Lead Created or Message Received</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Auto-reply templates or raw generative AI responses</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant visual action pipelines tracking triggering status changes</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>**New Feature:** Complete inline pipeline editing and updates</span>
              </li>
            </ul>

            <div className="pt-2">
              <Link 
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-450 hover:text-brand-350 transition-colors uppercase tracking-wider"
              >
                <span>Try the Workflow Builder</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* AI Robot Avatar Showcase graphic */}
          <div className="lg:col-span-7 relative p-6 bg-slate-900/40 border border-slate-800 rounded-2xl shadow-glass flex items-center justify-center">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-brand-500/20 to-transparent"></div>
            <img 
              src="/images/ai_bot_avatar.png" 
              alt="Intelligent AI robot asset" 
              className="max-w-[80%] h-auto rounded-xl hover:scale-105 transition-transform duration-500"
            />
          </div>

        </div>

      </section>

      {/* Advanced Tools spotlight section */}
      <section id="spotlight" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-slate-900/60 bg-slate-950/20">
        
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Advanced SaaS Tools & Utilities
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Apex Autoflow is packed with professional-grade utilities to guarantee zero downtime and maximum customization.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="glass-panel p-6 bg-slate-900/20 border-slate-850 hover:border-brand-500/10 transition-all duration-300">
            <ShieldCheck className="w-8 h-8 text-brand-400 mb-4" />
            <h4 className="text-sm font-extrabold text-white mb-2">RAG Knowledge Config</h4>
            <p className="text-slate-450 text-[11px] leading-relaxed">
              Upload custom text blocks or FAQ guides. If external APIs fail, our keyword auto-matcher intercepts and handles queries.
            </p>
          </div>

          <div className="glass-panel p-6 bg-slate-900/20 border-slate-850 hover:border-brand-500/10 transition-all duration-300">
            <Zap className="w-8 h-8 text-emerald-400 mb-4" />
            <h4 className="text-sm font-extrabold text-white mb-2">Simulated playground reset</h4>
            <p className="text-slate-450 text-[11px] leading-relaxed">
              Clear sandboxed client lists, reset testing logs, and provision new simulation states at the press of a single playground button.
            </p>
          </div>

          <div className="glass-panel p-6 bg-slate-900/20 border-slate-850 hover:border-brand-500/10 transition-all duration-300">
            <BarChart3 className="w-8 h-8 text-blue-400 mb-4" />
            <h4 className="text-sm font-extrabold text-white mb-2">Deep Analytics Engine</h4>
            <p className="text-slate-450 text-[11px] leading-relaxed">
              Analyze incoming channel velocity, capture lead conversion rates, and map average pipeline deal scores in high-definition.
            </p>
          </div>

          <div className="glass-panel p-6 bg-slate-900/20 border-slate-850 hover:border-brand-500/10 transition-all duration-300">
            <Bot className="w-8 h-8 text-indigo-400 mb-4" />
            <h4 className="text-sm font-extrabold text-white mb-2">Workspace Renamer Settings</h4>
            <p className="text-slate-450 text-[11px] leading-relaxed">
              Reprovision your workspaces from a modern company profile portal to update corporate database models instantly.
            </p>
          </div>

        </div>

      </section>

      {/* Floating CTA Banner */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-28">
        
        <div className="glass-panel p-10 bg-slate-900/40 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 border-slate-800">
          {/* Subtle gradient */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-brand-500/5 blur-[80px] pointer-events-none"></div>
          
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Ready to scale customer engagement?
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-md">
              Launch the Apex Autoflow console panel and test real-time AI conversation management.
            </p>
          </div>

          <Link 
            href={token ? "/dashboard" : "/signup"}
            className="w-full sm:w-auto glass-btn-primary px-8 py-3.5 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-brand-glow shrink-0 text-white"
          >
            <span>{token ? 'Launch Workspace' : 'Get Started Free'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 px-6 py-8 text-center text-xs text-slate-500 relative z-10 transition-colors duration-300">
        <p>© 2026 Apex Autoflow Inc. All rights reserved. Built for intelligent business workflow automation.</p>
      </footer>

    </div>
  );
}
