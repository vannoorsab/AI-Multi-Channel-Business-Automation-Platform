'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useSocket } from '../../../context/SocketContext';
import { 
  TrendingUp, 
  Users, 
  Cpu, 
  MessageSquare, 
  DollarSign, 
  Activity, 
  ShieldCheck, 
  Building,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';

export default function DashboardPage() {
  const { token } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { connected } = useSocket();
  
  const [stats, setStats] = useState({
    totalLeadCount: 0,
    totalPipelineValue: 0,
    wonPipelineValue: 0,
    funnelData: [],
    channels: { whatsapp: 0, webchat: 0 },
    responseStats: { aiCount: 0, agentCount: 0, aiRate: 0 }
  });
  
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    if (!token || !activeWorkspace) return;
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/analytics?workspaceId=${activeWorkspace._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [activeWorkspace, token]);

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome & System Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Dashboard Overview</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time metrics for {activeWorkspace?.name || 'your business'}</p>
        </div>
        
        {/* Real-time Status Badge */}
        <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl px-4 py-2 self-start md:self-auto">
          <div className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              connected ? 'bg-emerald-400' : 'bg-amber-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              connected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}></span>
          </div>
          <span className="text-xs font-semibold text-slate-300">
            {connected ? 'Socket.IO Server Connected' : 'Socket Server Reconnecting...'}
          </span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Pipeline Value */}
        <div className="glass-panel glass-panel-hover p-6 bg-slate-900/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-brand-500/10 group-hover:text-brand-500/20 transition-colors">
            <DollarSign className="w-20 h-20 -mr-4 -mt-4" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pipeline Value</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white">{formatCurrency(stats.totalPipelineValue)}</h3>
          <p className="text-xs text-slate-450 mt-2">
            Won Deals: <span className="text-emerald-400 font-semibold">{formatCurrency(stats.wonPipelineValue)}</span>
          </p>
        </div>

        {/* Total CRM Leads */}
        <div className="glass-panel glass-panel-hover p-6 bg-slate-900/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-brand-500/10 group-hover:text-brand-500/20 transition-colors">
            <Users className="w-20 h-20 -mr-4 -mt-4" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Leads</span>
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white">{stats.totalLeadCount}</h3>
          <p className="text-xs text-slate-450 mt-2">
            Across all sales pipelines
          </p>
        </div>

        {/* AI Reply rate */}
        <div className="glass-panel glass-panel-hover p-6 bg-slate-900/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-brand-500/10 group-hover:text-brand-500/20 transition-colors">
            <Cpu className="w-20 h-20 -mr-4 -mt-4" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Automation Rate</span>
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Cpu className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white">{stats.responseStats.aiRate}%</h3>
          <p className="text-xs text-slate-450 mt-2">
            Replies generated: <span className="text-brand-400 font-semibold">{stats.responseStats.aiCount}</span>
          </p>
        </div>

        {/* Message volume */}
        <div className="glass-panel glass-panel-hover p-6 bg-slate-900/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 text-brand-500/10 group-hover:text-brand-500/20 transition-colors">
            <MessageSquare className="w-20 h-20 -mr-4 -mt-4" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Inbox Threads</span>
            <div className="p-2 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white">
            {stats.channels.whatsapp + stats.channels.webchat}
          </h3>
          <p className="text-xs text-slate-450 mt-2">
            WhatsApp: <span className="text-emerald-400 font-medium">{stats.channels.whatsapp}</span> | Webchat: <span className="text-brand-400 font-medium">{stats.channels.webchat}</span>
          </p>
        </div>

      </div>

      {/* Main Charts & Visual Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Funnel Conversion board */}
        <div className="glass-panel p-6 bg-slate-900/40 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Sales Funnel Analysis</h3>
              <p className="text-xs text-slate-400">Client progression from discovery to closing</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-lg">Funnel Pipeline</span>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : stats.funnelData.length === 0 || stats.totalLeadCount === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500">
              <Users className="w-10 h-10 mb-2 stroke-1" />
              <p className="text-sm">No lead pipeline metrics found yet.</p>
              <p className="text-xs mt-1">Register leads inside your CRM to visualize your sales funnel.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.funnelData.map((item, idx) => {
                const percentage = stats.totalLeadCount > 0 ? Math.round((item.count / stats.totalLeadCount) * 100) : 0;
                
                // Color scaling based on stages
                const colors = {
                  new: 'from-brand-500 to-indigo-600',
                  contacted: 'from-indigo-600 to-blue-600',
                  qualified: 'from-blue-600 to-teal-600',
                  proposal: 'from-teal-600 to-emerald-600',
                  won: 'from-emerald-600 to-green-500',
                  lost: 'from-rose-600 to-red-500'
                };

                return (
                  <div key={item.stage} className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-medium">
                      <span className="capitalize text-slate-300 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${colors[item.stage] || 'from-slate-500 to-slate-600'}`}></span>
                        {item.stage}
                      </span>
                      <span className="text-slate-400">
                        {item.count} Leads ({percentage}%) • <span className="text-white font-semibold">{formatCurrency(item.value)}</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-950/60 rounded-full h-3 overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${colors[item.stage] || 'from-slate-500 to-slate-600'} transition-all duration-500`}
                        style={{ width: `${Math.max(5, percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI Efficiency & Conversational Breakdown */}
        <div className="glass-panel p-6 bg-slate-900/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">AI Response Share</h3>
                <p className="text-xs text-slate-400">Automation vs human interaction ratios</p>
              </div>
            </div>

            {loading ? (
              <div className="h-44 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : stats.responseStats.aiCount === 0 && stats.responseStats.agentCount === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-slate-500">
                <Cpu className="w-10 h-10 mb-2 stroke-1" />
                <p className="text-sm">No messages simulated yet.</p>
                <p className="text-xs mt-1">Use the simulated WhatsApp inbox client to trigger conversations.</p>
              </div>
            ) : (
              <div className="space-y-6 my-4">
                
                {/* Visual Circle chart breakdown using CSS borders */}
                <div className="flex justify-center">
                  <div className="relative w-36 h-36 rounded-full flex items-center justify-center border-8 border-slate-850" style={{
                    backgroundImage: `conic-gradient(#8b5cf6 0% ${stats.responseStats.aiRate}%, #334155 ${stats.responseStats.aiRate}% 100%)`
                  }}>
                    <div className="absolute inset-2 bg-slate-950 rounded-full flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-white">{stats.responseStats.aiRate}%</span>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">AI Automated</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-center">
                    <span className="block text-[10px] uppercase font-bold text-brand-400">AI replies</span>
                    <span className="text-lg font-black text-white">{stats.responseStats.aiCount}</span>
                  </div>
                  <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-center">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Agent manual</span>
                    <span className="text-lg font-black text-white">{stats.responseStats.agentCount}</span>
                  </div>
                </div>

              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4 text-[10px] text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            <span>AI responses dynamically use Google Gemini models</span>
          </div>
        </div>

      </div>

    </div>
  );
}
