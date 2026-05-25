'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useSocket } from '../../../context/SocketContext';
import { 
  Send, 
  Phone, 
  User, 
  MessageSquare, 
  Sparkles, 
  Tv, 
  Cpu, 
  Info,
  Globe,
  Loader2,
  Instagram,
  ChevronDown,
  UserCheck,
  Filter,
  Check,
  Signal,
  PhoneCall,
  Trash2
} from 'lucide-react';

export default function InboxPage() {
  const { token } = useAuth();
  const { activeWorkspace, updateWorkspaceSettings } = useWorkspace();
  const { socket, connected } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Filters
  const [channelFilter, setChannelFilter] = useState('all'); // 'all' | 'whatsapp' | 'instagram' | 'webchat'
  const [stageFilter, setStageFilter] = useState('all'); // 'all' | 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'

  // Agent reply input
  const [agentText, setAgentText] = useState('');

  // Typing states
  const [isTyping, setIsTyping] = useState(false);
  const [typingSender, setTypingSender] = useState('');
  const typingTimeoutRef = useRef(null);

  // Agent Assignment state
  const [agentDropdown, setAgentDropdown] = useState(false);
  const [assignedAgent, setAssignedAgent] = useState('Unassigned');

  // Customer Sandbox Simulator parameters
  const [simChannel, setSimChannel] = useState('whatsapp'); // 'whatsapp' | 'instagram' | 'webchat'
  const [simPhone, setSimPhone] = useState('+14155552671');
  const [simName, setSimName] = useState('Sarah Jenkins');
  const [simContent, setSimContent] = useState('Hi! How much is your Starter SaaS package?');
  const [simulating, setSimulating] = useState(false);

  // Auto-scroll chat feed ref
  const feedEndRef = useRef(null);

  useEffect(() => {
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Prepopulate simulator parameters on channel change
  useEffect(() => {
    switch (simChannel) {
      case 'whatsapp':
        setSimPhone('+14155552671');
        setSimName('Sarah Jenkins');
        setSimContent('Hi! How much is your Starter SaaS package?');
        break;
      case 'instagram':
        setSimPhone('@ig_sarah_jenkins');
        setSimName('Sarah Jenkins');
        setSimContent('I loved your post! Can I request a live demo?');
        break;
      case 'webchat':
        setSimPhone('webchat_sarah');
        setSimName('Sarah Jenkins');
        setSimContent('Hello, I am testing your website live chat widget.');
        break;
      case 'voice':
        setSimPhone('+14155552671');
        setSimName('Sarah Jenkins (AI Call)');
        setSimContent('Hello! I would like to ask about your SaaS packages and if there is a startup tier.');
        break;
    }
  }, [simChannel]);

  // Fetch active conversations
  const fetchConversations = async () => {
    if (!token || !activeWorkspace) return;
    try {
      setLoadingConversations(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/leads?workspaceId=${activeWorkspace._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        // Build mock conversation container array for CRM links
        const leadsData = data.leads;
        
        // Fetch conversations list or map leads
        const mapped = await Promise.all(leadsData.map(async (lead) => {
          // Retrieve conversation details
          const convRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/messages/${lead._id}?workspaceId=${activeWorkspace._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const convData = await convRes.json();
          return {
            lead,
            _id: convData.conversation?._id || lead._id,
            channel: convData.conversation?.channel || (lead.phone.includes('@') ? 'instagram' : lead.phone.includes('web') ? 'webchat' : 'whatsapp'),
            unreadCount: convData.conversation?.unreadCount || 0,
            lastMessage: convData.conversation?.lastMessage || 'Open thread',
          };
        }));
        
        setConversations(mapped);
        
        if (mapped.length > 0 && !activeConversation) {
          setActiveConversation(mapped[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Fetch messages for active conversation
  const fetchMessages = async (conv) => {
    if (!token || !activeWorkspace || !conv) return;
    try {
      setLoadingMessages(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/messages/${conv.lead._id}?workspaceId=${activeWorkspace._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
        
        // Reset unread count for UI list
        setConversations(prev => prev.map(c => c._id === conv._id ? { ...c, unreadCount: 0 } : c));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [activeWorkspace, token]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
      // Randomize mock assigned agent
      const agents = ['Dwight Schrute', 'Pam Beesly', 'Michael Scott', 'Unassigned'];
      setAssignedAgent(agents[Math.floor(Math.random() * agents.length)]);
    } else {
      setMessages([]);
    }
  }, [activeConversation]);

  // Socket receivers
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (msg) => {
      if (activeConversation && msg.lead === activeConversation.lead._id) {
        setMessages((prev) => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      fetchConversations();
    };

    const handleConversationUpdated = (conv) => {
      setConversations(prev => prev.map(c => c._id === conv._id ? { ...c, unreadCount: conv.unreadCount, lastMessage: conv.lastMessage } : c));
    };

    const handleTyping = ({ leadId, senderName }) => {
      if (activeConversation && leadId === activeConversation.lead._id) {
        setTypingSender(senderName || 'Customer');
        setIsTyping(true);

        // Clear previous timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // Set timeout to clear typing state after 3 seconds of silence
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    };

    socket.on('message_received', handleMessageReceived);
    socket.on('conversation_updated', handleConversationUpdated);
    socket.on('typing', handleTyping);

    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('conversation_updated', handleConversationUpdated);
      socket.off('typing', handleTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, activeConversation]);

  // Submit manual Agent Reply
  const handleSendAgentReply = async (e) => {
    e.preventDefault();
    if (!agentText.trim() || !activeConversation) return;

    try {
      const textToSend = agentText;
      setAgentText(''); // Reset Composer

      // Notify customer we stopped typing
      if (socket) {
        socket.emit('stop_typing', {
          workspaceId: activeWorkspace._id,
          leadId: activeConversation.lead._id
        });
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          leadId: activeConversation.lead._id,
          content: textToSend,
          channel: activeConversation.channel,
          businessId: activeWorkspace._id
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        
        // Update unread count and last message in sidebar
        setConversations(prev => prev.map(c => c._id === activeConversation._id ? { ...c, lastMessage: textToSend } : c));
      }
    } catch (error) {
      console.error('Error sending agent response:', error);
    }
  };

  // Agent composer typing events
  const handleComposerChange = (e) => {
    setAgentText(e.target.value);
    if (socket && activeConversation) {
      socket.emit('typing', {
        workspaceId: activeWorkspace._id,
        leadId: activeConversation.lead._id,
        senderName: 'Agent Support'
      });
    }
  };

  // Send Simulated Webhook customer message
  const handleSimulateIncoming = async (e) => {
    e.preventDefault();
    if (!simContent.trim() || !simPhone.trim()) return;

    try {
      setSimulating(true);
      const textToSimulate = simContent;
      setSimContent('');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/messages/simulate-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          businessId: activeWorkspace._id,
          phone: simPhone,
          customerName: simName,
          content: textToSimulate,
          channel: simChannel
        })
      });

      const data = await response.json();
      if (data.success) {
        // Refresh and switch
        fetchConversations();
        if (activeConversation && activeConversation.lead.phone === simPhone) {
          fetchMessages(activeConversation);
        } else {
          // Find or wait for mapped conversation
          setTimeout(() => {
            fetchConversations();
          }, 800);
        }
      }
    } catch (error) {
      console.error('Webhook simulation error:', error);
    } finally {
      setSimulating(false);
    }
  };

  const handleToggleAIEnabled = async () => {
    if (!activeWorkspace) return;
    const currentStatus = activeWorkspace.settings?.aiEnabled;
    await updateWorkspaceSettings(activeWorkspace.name, {
      ...activeWorkspace.settings,
      aiEnabled: !currentStatus
    });
  };

  const handleDeleteLead = async () => {
    if (!token || !activeWorkspace || !activeConversation) return;
    
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete the lead "${activeConversation.lead.name}"? This will delete all their conversations and messages.`);
    if (!confirmDelete) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/leads/${activeConversation.lead._id}?workspaceId=${activeWorkspace._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        // Remove conversation from local list
        setConversations(prev => prev.filter(c => c.lead._id !== activeConversation.lead._id));
        setActiveConversation(null);
      } else {
        alert(data.error || 'Failed to delete lead.');
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Error deleting lead.');
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    const channelMatch = channelFilter === 'all' || c.channel === channelFilter;
    const stageMatch = stageFilter === 'all' || c.lead.status === stageFilter;
    return channelMatch && stageMatch;
  });

  return (
    <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col select-none">
      
      {/* Inbox Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-slate-950/20 p-2 rounded-2xl">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Unified Inbox</h1>
          <p className="text-slate-400 text-sm mt-1">Simultaneous streams from WhatsApp, Instagram, and Website live chat</p>
        </div>

        {/* Global AI toggle */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-805 rounded-2xl px-4 py-2 self-start sm:self-auto shadow-sm">
          <Cpu className={`w-4 h-4 ${
            activeWorkspace?.settings?.aiEnabled ? 'text-brand-400 animate-pulse' : 'text-slate-500'
          }`} />
          <span className="text-xs font-bold text-slate-350">Gemini AI Auto-Reply</span>
          <button
            onClick={handleToggleAIEnabled}
            className={`w-11 h-6 rounded-full p-1 transition-all duration-300 focus:outline-none cursor-pointer flex ${
              activeWorkspace?.settings?.aiEnabled ? 'bg-brand-650 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white shadow-md block"></span>
          </button>
        </div>
      </div>

      {/* Grid Layout Split 3 Columns */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        
        {/* Left Column: Customers and Filter tabs (1/4 w) */}
        <div className="w-80 bg-slate-900/30 border border-slate-850 rounded-2xl flex flex-col overflow-hidden shrink-0">
          
          {/* Channel Filters Tabs */}
          <div className="p-3 border-b border-slate-850 bg-slate-950/30 flex justify-between gap-1 select-none shrink-0">
            <button
              onClick={() => setChannelFilter('all')}
              className={`flex-1 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wider transition-all cursor-pointer text-center ${
                channelFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setChannelFilter('whatsapp')}
              className={`flex-1 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wider transition-all cursor-pointer text-center ${
                channelFilter === 'whatsapp' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              WA
            </button>
            <button
              onClick={() => setChannelFilter('instagram')}
              className={`flex-1 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wider transition-all cursor-pointer text-center ${
                channelFilter === 'instagram' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/10' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              IG
            </button>
            <button
              onClick={() => setChannelFilter('webchat')}
              className={`flex-1 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wider transition-all cursor-pointer text-center ${
                channelFilter === 'webchat' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/10' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Web
            </button>
            <button
              onClick={() => setChannelFilter('voice')}
              className={`flex-1 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wider transition-all cursor-pointer text-center ${
                channelFilter === 'voice' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Call
            </button>
          </div>

          {/* Pipeline Stage Filters */}
          <div className="px-3 pb-3 border-b border-slate-850 bg-slate-950/30 flex items-center gap-2 select-none shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="flex-1 bg-transparent border border-slate-800 text-[10px] text-slate-400 font-extrabold uppercase rounded-lg px-2 py-1 outline-none transition-all cursor-pointer focus:border-brand-500"
            >
              <option value="all" className="bg-slate-900 text-slate-300">All CRM Stages</option>
              <option value="new" className="bg-slate-900 text-slate-300">New Lead</option>
              <option value="contacted" className="bg-slate-900 text-slate-300">Contacted</option>
              <option value="qualified" className="bg-slate-900 text-slate-300">Qualified</option>
              <option value="proposal" className="bg-slate-900 text-slate-300">Proposal</option>
              <option value="won" className="bg-slate-900 text-slate-300">Won Deal</option>
              <option value="lost" className="bg-slate-900 text-slate-300">Lost Deal</option>
            </select>
          </div>

          {/* Conversations Queue */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingConversations ? (
              <div className="h-20 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs mt-10">
                No active {channelFilter === 'all' ? '' : channelFilter} threads.
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = activeConversation && activeConversation._id === conv._id;
                
                // Color badges
                const channelStyles = {
                  whatsapp: { color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15', icon: Phone },
                  instagram: { color: 'text-pink-400 bg-pink-500/10 border-pink-500/15', icon: Instagram },
                  webchat: { color: 'text-brand-400 bg-brand-500/10 border-brand-500/15', icon: MessageSquare },
                  voice: { color: 'text-blue-400 bg-blue-500/10 border-blue-500/15', icon: PhoneCall }
                };
                
                const style = channelStyles[conv.channel] || { color: 'text-slate-400 bg-slate-800', icon: MessageSquare };
                const Icon = style.icon;

                return (
                  <button
                    key={conv._id}
                    onClick={() => setActiveConversation(conv)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border text-left cursor-pointer group relative ${
                      isActive 
                        ? 'bg-brand-600/10 border-brand-500/35 text-white' 
                        : 'bg-transparent border-transparent hover:bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    {/* Channel avatar border */}
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-750 flex items-center justify-center text-slate-300 font-bold shrink-0">
                        {conv.lead.name.charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Floating channel badge indicator */}
                      <span className={`absolute -bottom-1 -right-1 p-0.5 rounded-full border ${style.color} shrink-0`}>
                        <Icon className="w-2.5 h-2.5" />
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="text-xs font-bold truncate pr-2 group-hover:text-brand-400 transition-colors">{conv.lead.name}</p>
                        
                        {/* Unread indicator counters */}
                        {conv.unreadCount > 0 && (
                          <span className="text-[9px] bg-red-500 font-bold text-white px-1.5 py-0.5 rounded-full shadow-brand-glow shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate leading-relaxed">
                        {conv.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

        </div>

        {/* Center Column: Active Chat Feed (2/4 w) */}
        <div className="flex-1 bg-slate-900/30 border border-slate-850 rounded-2xl flex flex-col overflow-hidden">
          {activeConversation ? (
            <>
              
              {/* Chat Header info with assigned agent selection */}
              <div className="p-4 border-b border-slate-850/80 bg-slate-950/20 flex items-center justify-between shrink-0 select-none">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold shadow-brand-glow/5">
                    {activeConversation.lead.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{activeConversation.lead.name}</h3>
                    <p className="text-xs text-slate-450 flex items-center gap-1.5 mt-0.5 uppercase tracking-wider font-semibold text-[9.5px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span>Channel: {activeConversation.channel}</span>
                    </p>
                  </div>
                </div>

                {/* Header Actions controls */}
                <div className="flex items-center gap-2">
                  {/* Assigned Agent controls */}
                  <div className="relative">
                    <button
                      onClick={() => setAgentDropdown(!agentDropdown)}
                      className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800/80 rounded-xl px-3 py-1.5 text-slate-400 hover:border-slate-700 hover:text-white cursor-pointer select-none"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-brand-400" />
                      <span>Assigned: <span className="text-white font-bold">{assignedAgent}</span></span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    </button>

                    {agentDropdown && (
                      <div className="absolute top-full right-0 mt-1 w-48 bg-slate-900 border border-slate-850 rounded-xl shadow-xl overflow-hidden z-40 p-1 space-y-0.5">
                        <p className="text-[9px] font-bold text-slate-500 uppercase px-2.5 py-1">Assign Operator</p>
                        {['Dwight Schrute', 'Pam Beesly', 'Michael Scott', 'Unassigned'].map((agent) => (
                          <button
                            key={agent}
                            onClick={() => {
                              setAssignedAgent(agent);
                              setAgentDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer text-left ${
                              assignedAgent === agent
                                ? 'bg-brand-600/10 text-brand-400 font-bold'
                                : 'text-slate-350 hover:bg-slate-800'
                            }`}
                          >
                            <span>{agent}</span>
                            {assignedAgent === agent && <Check className="w-3 h-3 text-brand-400" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Delete Lead Button */}
                  <button
                    onClick={handleDeleteLead}
                    className="flex items-center justify-center p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white cursor-pointer transition-all shadow-sm"
                    title="Delete Lead Profile"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Message scroll area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/20">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-550">
                    <MessageSquare className="w-8 h-8 mb-2 stroke-1" />
                    <p className="text-xs">No previous message transcripts found.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isClient = msg.sender === 'lead';
                    const isAI = msg.sender === 'ai';
                    const isSystem = msg.sender === 'system';

                    let bubbleBg = 'bg-brand-600 text-white rounded-br-none ml-auto border border-brand-500/35';
                    let label = 'Support Agent';
                    
                    if (isClient) {
                      bubbleBg = 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none';
                      label = 'Customer';
                    } else if (isAI) {
                      bubbleBg = 'bg-slate-800/80 border border-brand-500/20 text-slate-250 rounded-br-none ml-auto shadow-brand-glow/5';
                      label = 'Gemini Bot';
                    } else if (isSystem) {
                      bubbleBg = 'bg-slate-950/80 border border-dashed border-slate-800/80 text-slate-400 text-center rounded-xl mx-auto max-w-[80%]';
                      label = 'Workflow Automation';
                    }

                    return (
                      <div key={msg._id} className={`flex flex-col ${
                        isSystem ? 'items-center' : isClient ? 'items-start' : 'items-end'
                      } space-y-0.5 max-w-[80%] ${
                        isSystem ? 'mx-auto w-full' : isClient ? 'mr-auto' : 'ml-auto'
                      }`}>
                        
                        {!isSystem && (
                          <span className="text-[8.5px] uppercase font-extrabold text-slate-500 tracking-wider px-1">
                            {label}
                          </span>
                        )}

                        <div className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${bubbleBg}`}>
                          {isAI && (
                            <div className="flex items-center gap-1 mb-1.5 text-[9px] text-brand-400 font-bold border-b border-slate-700/50 pb-1 shrink-0">
                              <Sparkles className="w-2.5 h-2.5 text-brand-400 animate-pulse" />
                              <span>Gemini Auto-Reply</span>
                            </div>
                          )}
                          <p>{msg.content}</p>
                        </div>
                        
                        <span className="text-[7.5px] text-slate-655 px-1 font-semibold">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}

                {/* Bouncing Dots socket typing indicator bubble */}
                {isTyping && (
                  <div className="flex flex-col items-start space-y-0.5 max-w-[80%] mr-auto">
                    <span className="text-[8.5px] uppercase font-extrabold text-slate-500 tracking-wider px-1">
                      {typingSender}
                    </span>
                    <div className="p-3 rounded-2xl rounded-bl-none text-xs leading-relaxed bg-slate-900 border border-slate-800 flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center gap-1 px-1">
                        <span className="w-1.5 h-1.5 bg-slate-450 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-slate-450 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-slate-450 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={feedEndRef} />
              </div>

              {/* Message Composer */}
              <form onSubmit={handleSendAgentReply} className="p-3 border-t border-slate-850/80 bg-slate-900/10 shrink-0 flex items-center gap-2 select-none">
                <input
                  type="text"
                  className="flex-1 glass-input py-2 text-xs bg-slate-950/40"
                  placeholder="Type a manual response as Agent..."
                  value={agentText}
                  onChange={handleComposerChange}
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-brand-650 hover:bg-brand-600 text-white shadow-brand-glow hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-550 p-6 text-center select-none">
              <MessageSquare className="w-12 h-12 mb-2 stroke-1" />
              <h3 className="text-sm font-bold text-slate-450">No thread selected</h3>
              <p className="text-xs max-w-xs mt-1 leading-relaxed">Select a thread on the left queue, or use the multi-channel simulator sandbox on the right.</p>
            </div>
          )}
        </div>

        {/* Right Column: Multi-Channel Sandbox Simulator (1/4 w) */}
        <div className="w-80 bg-slate-900/30 border border-slate-850 rounded-2xl flex flex-col overflow-hidden shrink-0">
          
          <div className="p-4 border-b border-slate-850 bg-slate-950/20 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-brand-400 shrink-0" />
              <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">Multi-Channel Sandbox</h3>
            </div>
            
            {/* Active Link Status */}
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
              <Signal className="w-3 h-3 text-brand-400" />
              <span>Hook active</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Simulator details card */}
            <div className="p-3 bg-brand-500/5 border border-brand-500/10 text-brand-400 rounded-xl space-y-1.5 select-none">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Testing Sandbox</span>
              </div>
              <p className="text-[10.5px] leading-relaxed">
                Choose a customer channel from the selector, type a query, and dispatch. Sockets sync instantly, running workflows and streaming Gemini auto-replies over the active channel!
              </p>
            </div>

            <form onSubmit={handleSimulateIncoming} className="space-y-4 pt-1">
              
              {/* Simulator Channel Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Customer Channel</label>
                <select
                  className="w-full glass-input text-xs pr-4 bg-slate-950 font-semibold"
                  value={simChannel}
                  onChange={(e) => setSimChannel(e.target.value)}
                >
                  <option value="whatsapp">WhatsApp Business API</option>
                  <option value="instagram">Instagram Direct DM</option>
                  <option value="webchat">Website Live Chat Widget</option>
                  <option value="voice">AI Voice Call (Incoming)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Mock Client Address / ID</label>
                <input
                  type="text"
                  required
                  className="w-full glass-input text-xs bg-slate-950 font-medium"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Mock Customer Name</label>
                <input
                  type="text"
                  required
                  className="w-full glass-input text-xs bg-slate-950 font-medium"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450 block">Message Content</label>
                <textarea
                  rows="3"
                  required
                  className="w-full glass-input py-2 text-xs bg-slate-950 resize-none leading-relaxed"
                  value={simContent}
                  onChange={(e) => setSimContent(e.target.value)}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={simulating}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-brand-650 hover:bg-brand-600 text-white rounded-xl text-xs font-bold cursor-pointer shadow-brand-glow hover:scale-[1.02] active:scale-[0.98] transition-all select-none"
              >
                {simulating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Disrupting webhooks...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Simulate Incoming message</span>
                  </>
                )}
              </button>

            </form>

            {/* Sandbox instructions list */}
            <div className="border-t border-slate-800/80 pt-4 mt-2 space-y-2 text-[10px] text-slate-500 select-none">
              <p className="font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Globe className="w-3 h-3 text-brand-400" />
                <span>Simulation Sandbox Cases:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 leading-relaxed pl-1">
                <li>Choose <span className="text-white font-semibold">Instagram</span> to test story reply simulations.</li>
                <li>Write <span className="text-white font-semibold">"demo"</span> to verify chatbot appointments.</li>
                <li>Click unread rows in your active conversation lists to test automatic resetting.</li>
              </ul>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
