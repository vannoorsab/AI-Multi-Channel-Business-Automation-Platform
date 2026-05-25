'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useSocket } from '../../../context/SocketContext';
import { 
  Plus, 
  Trash2, 
  User, 
  Phone, 
  Mail, 
  DollarSign, 
  FileText, 
  ChevronRight, 
  Activity, 
  UserCheck,
  Star,
  Settings,
  Sparkles,
  Loader2,
  X,
  Search,
  Calendar,
  Check,
  Clock,
  ArrowUpDown,
  MessageSquare
} from 'lucide-react';

export default function LeadsPage() {
  const { token } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { socket } = useSocket();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  
  // Modals state
  const [createModal, setCreateModal] = useState(false);
  
  // Create lead form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('new');
  const [value, setValue] = useState(0);
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');

  // Pipeline search, filters & sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('interaction_desc');
  const [agentFilter, setAgentFilter] = useState('all');

  // Input states for Lead timeline slide-out updates
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');
  const [newReminderDesc, setNewReminderDesc] = useState('');

  const stages = [
    { key: 'new', label: 'New Lead', color: 'bg-brand-500' },
    { key: 'contacted', label: 'Contacted', color: 'bg-indigo-500' },
    { key: 'qualified', label: 'Qualified', color: 'bg-blue-500' },
    { key: 'proposal', label: 'Proposal', color: 'bg-teal-500' },
    { key: 'won', label: 'Won', color: 'bg-emerald-500' },
    { key: 'lost', label: 'Lost', color: 'bg-rose-500' },
  ];

  const fetchLeads = async () => {
    if (!token || !activeWorkspace) return;
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/leads?workspaceId=${activeWorkspace._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setLeads(data.leads);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [activeWorkspace, token]);

  // Handle socket updates
  useEffect(() => {
    if (!socket) return;

    const handleSocketLeadCreated = (newLead) => {
      setLeads((prev) => {
        // Prevent duplicates
        if (prev.some(l => l._id === newLead._id)) return prev;
        return [newLead, ...prev];
      });
    };

    const handleSocketLeadUpdated = (updatedLead) => {
      setLeads((prev) => prev.map(l => l._id === updatedLead._id ? updatedLead : l));
      setSelectedLead((prev) => prev && prev._id === updatedLead._id ? updatedLead : prev);
    };

    socket.on('lead_created', handleSocketLeadCreated);
    socket.on('lead_updated', handleSocketLeadUpdated);

    return () => {
      socket.off('lead_created', handleSocketLeadCreated);
      socket.off('lead_updated', handleSocketLeadUpdated);
    };
  }, [socket]);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setErr('');

    if (!name || !phone) {
      setErr('Name and Phone fields are required.');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          status,
          value: Number(value) || 0,
          notes,
          workspaceId: activeWorkspace._id
        })
      });

      const data = await response.json();

      if (data.success) {
        setLeads((prev) => [data.lead, ...prev]);
        setName('');
        setPhone('');
        setEmail('');
        setStatus('new');
        setValue(0);
        setNotes('');
        setCreateModal(false);
      } else {
        setErr(data.error || 'Failed to create lead.');
      }
    } catch (error) {
      setErr('An error occurred during submission.');
    }
  };

  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        setLeads((prev) => prev.map(l => l._id === leadId ? data.lead : l));
        if (selectedLead && selectedLead._id === leadId) {
          setSelectedLead(data.lead);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleUpdateLeadDetails = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/leads/${selectedLead._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: selectedLead.name,
          email: selectedLead.email,
          phone: selectedLead.phone,
          value: Number(selectedLead.value) || 0,
          leadScore: Number(selectedLead.leadScore) || 50,
          notes: selectedLead.notes,
          assignedAgent: selectedLead.assignedAgent || 'Unassigned',
          reminders: selectedLead.reminders || [],
          notesFeed: selectedLead.notesFeed || [],
        })
      });

      const data = await response.json();

      if (data.success) {
        setLeads((prev) => prev.map(l => l._id === selectedLead._id ? data.lead : l));
        setSelectedLead(data.lead);
        alert('CRM lead details updated successfully.');
      }
    } catch (error) {
      console.error('Error updating details:', error);
    }
  };

  const saveLeadUpdates = async (updatedFields) => {
    if (!selectedLead) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/leads/${selectedLead._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });
      const data = await response.json();
      if (data.success) {
        setLeads((prev) => prev.map(l => l._id === selectedLead._id ? data.lead : l));
        setSelectedLead(data.lead);
      }
    } catch (error) {
      console.error('Error saving lead updates:', error);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !selectedLead) return;

    const newNote = {
      content: newNoteContent.trim(),
      author: 'Staff Agent',
      createdAt: new Date(),
    };

    const updatedNotesFeed = [...(selectedLead.notesFeed || []), newNote];
    
    setSelectedLead((prev) => prev ? { ...prev, notesFeed: updatedNotesFeed } : prev);
    setNewNoteContent('');

    await saveLeadUpdates({ notesFeed: updatedNotesFeed });
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!newReminderDate || !newReminderDesc.trim() || !selectedLead) return;

    const dateTimeStr = newReminderTime 
      ? `${newReminderDate}T${newReminderTime}`
      : `${newReminderDate}T12:00`;
    
    const newReminder = {
      date: new Date(dateTimeStr),
      description: newReminderDesc.trim(),
      completed: false,
    };

    const updatedReminders = [...(selectedLead.reminders || []), newReminder];

    setSelectedLead((prev) => prev ? { ...prev, reminders: updatedReminders } : prev);
    setNewReminderDate('');
    setNewReminderTime('');
    setNewReminderDesc('');

    await saveLeadUpdates({ reminders: updatedReminders });
  };

  const handleToggleReminder = async (index) => {
    if (!selectedLead) return;
    
    const updatedReminders = (selectedLead.reminders || []).map((rem, i) => 
      i === index ? { ...rem, completed: !rem.completed } : rem
    );

    setSelectedLead((prev) => prev ? { ...prev, reminders: updatedReminders } : prev);

    await saveLeadUpdates({ reminders: updatedReminders });
  };

  const handleDeleteReminder = async (index) => {
    if (!selectedLead) return;

    const updatedReminders = (selectedLead.reminders || []).filter((_, i) => i !== index);

    setSelectedLead((prev) => prev ? { ...prev, reminders: updatedReminders } : prev);

    await saveLeadUpdates({ reminders: updatedReminders });
  };

  const getFilteredAndSortedLeads = () => {
    let result = [...leads];

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(l => 
        (l.name && l.name.toLowerCase().includes(query)) ||
        (l.phone && l.phone.includes(query)) ||
        (l.email && l.email.toLowerCase().includes(query))
      );
    }

    // 2. Staff operator selection Filter
    if (agentFilter !== 'all') {
      result = result.filter(l => {
        const leadAgent = l.assignedAgent || 'Unassigned';
        return leadAgent.toLowerCase() === agentFilter.toLowerCase();
      });
    }

    // 3. Custom chronological sorting rules
    result.sort((a, b) => {
      if (sortKey === 'value_desc') {
        return (b.value || 0) - (a.value || 0);
      }
      if (sortKey === 'value_asc') {
        return (a.value || 0) - (b.value || 0);
      }
      if (sortKey === 'interaction_desc') {
        return new Date(b.lastInteraction || b.updatedAt || 0) - new Date(a.lastInteraction || a.updatedAt || 0);
      }
      if (sortKey === 'interaction_asc') {
        return new Date(a.lastInteraction || a.updatedAt || 0) - new Date(b.lastInteraction || b.updatedAt || 0);
      }
      return 0;
    });

    return result;
  };

  const processedLeads = getFilteredAndSortedLeads();

  const handleDeleteLead = async (leadId) => {
    if (!confirm('Are you sure you want to delete this lead? This will erase their CRM profile.')) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setLeads((prev) => prev.filter(l => l._id !== leadId));
        setSelectedLead(null);
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* CRM Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Leads Pipeline</h1>
          <p className="text-slate-400 text-sm mt-1">Manage contact flows and track customer values</p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="glass-btn-primary flex items-center justify-center gap-2 self-start sm:self-auto h-11"
        >
          <Plus className="w-4 h-4" />
          <span>Add Manual Lead</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-panel p-4 bg-slate-900/40 border-slate-850 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-950/60 border border-slate-800 focus:border-brand-500/50 rounded-xl text-white placeholder-slate-500 focus:outline-none transition-all"
            placeholder="Search leads by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Agent Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 shrink-0">
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              Agent:
            </span>
            <select
              className="bg-slate-950/60 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500/50 cursor-pointer"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
            >
              <option value="all">All Agents</option>
              <option value="Unassigned">Unassigned</option>
              <option value="Dwight Schrute">Dwight Schrute</option>
              <option value="Pam Beesly">Pam Beesly</option>
              <option value="Michael Scott">Michael Scott</option>
            </select>
          </div>

          {/* Sort Menu */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-teal-400" />
              Sort:
            </span>
            <select
              className="bg-slate-950/60 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500/50 cursor-pointer"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
            >
              <option value="interaction_desc">Last Interaction (Newest First)</option>
              <option value="interaction_asc">Last Interaction (Oldest First)</option>
              <option value="value_desc">Deal Value (High to Low)</option>
              <option value="value_asc">Deal Value (Low to High)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board Layout */}
      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x select-none min-w-full">
          {stages.map((stage) => {
            const stageLeads = processedLeads.filter(l => l.status === stage.key);
            const totalValue = stageLeads.reduce((acc, curr) => acc + (curr.value || 0), 0);

            return (
              <div 
                key={stage.key} 
                className="w-80 shrink-0 snap-start bg-slate-900/20 border border-slate-850 rounded-2xl p-4 max-h-[75vh] flex flex-col overflow-y-auto"
              >
                
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stage.color}`}></span>
                    <span className="text-sm font-semibold text-slate-200 truncate capitalize">{stage.label}</span>
                  </div>
                  <span className="text-xs bg-slate-850 px-2 py-0.5 rounded-full font-bold text-slate-400">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Column value summary */}
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4 px-1 shrink-0">
                  <span>Pipeline Value</span>
                  <span className="text-slate-400">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalValue)}
                  </span>
                </div>

                {/* Cards stack */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {stageLeads.length === 0 ? (
                    <div className="h-20 flex items-center justify-center border border-dashed border-slate-800/60 rounded-xl text-slate-650 text-xs shrink-0">
                      No leads here
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead._id}
                        onClick={() => setSelectedLead(lead)}
                        className="p-4 bg-slate-950/60 hover:bg-slate-900 border border-slate-850 hover:border-brand-500/30 rounded-2xl cursor-pointer shadow-sm transition-all duration-200 group hover:shadow-brand-glow/5 relative flex flex-col justify-between min-h-[140px]"
                      >
                        {/* Top Section: Name and Score */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-slate-250 text-xs leading-tight truncate group-hover:text-brand-400 transition-colors max-w-[70%]">
                              {lead.name}
                            </h4>
                            
                            {/* Lead Score Ribbon */}
                            <div className="flex items-center gap-1 bg-brand-500/10 border border-brand-500/20 text-brand-400 rounded-full px-2 py-0.5 text-[8.5px] font-extrabold shrink-0">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>{lead.leadScore || 50}</span>
                            </div>
                          </div>
                          
                          {/* Contact Info (Phone and Email) */}
                          <div className="space-y-1">
                            <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="truncate">{lead.phone}</span>
                            </p>
                            {lead.email ? (
                              <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-brand-450 shrink-0" />
                                <span className="truncate text-slate-400 font-medium">{lead.email}</span>
                              </p>
                            ) : (
                              <p className="text-[9px] text-slate-650 italic pl-4.5">No email captured</p>
                            )}
                          </div>

                          {/* Owner Assignment and Reminders */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {lead.assignedAgent && lead.assignedAgent !== 'Unassigned' && (
                              <span className="text-[8px] font-extrabold uppercase bg-slate-900 border border-slate-800 text-slate-450 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                <UserCheck className="w-2.5 h-2.5 text-indigo-400" />
                                <span>{lead.assignedAgent}</span>
                              </span>
                            )}
                            
                            {lead.reminders && lead.reminders.length > 0 && (
                              <span className="text-[8px] font-extrabold uppercase bg-teal-500/5 border border-teal-500/15 text-teal-450 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                <Calendar className="w-2.5 h-2.5 text-teal-400" />
                                <span>{lead.reminders.length} scheduled</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom Section: Deal Value */}
                        <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-900/60 text-xs shrink-0 select-none">
                          <span className="font-extrabold text-slate-350">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(lead.value || 0)}
                          </span>
                          
                          {/* Chevron helper */}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-650 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Slide-out CRM Details Panel */}
      {selectedLead && (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-slate-950/90 border-l border-slate-850 shadow-2xl z-40 flex flex-col justify-between backdrop-blur-md">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-850 flex items-center justify-between bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 font-extrabold shadow-brand-glow">
                {selectedLead.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">{selectedLead.name}</h3>
                <span className="text-[10px] text-slate-450">CRM Profile ID: {selectedLead._id}</span>
              </div>
            </div>
            <button 
              onClick={() => setSelectedLead(null)}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* CRM Editor body */}
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            
            {/* Quick Status switches */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Sales Stage</label>
              <div className="grid grid-cols-3 gap-2">
                {stages.map((stage) => (
                  <button
                    key={stage.key}
                    onClick={() => handleUpdateLeadStatus(selectedLead._id, stage.key)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold text-center border capitalize transition-all ${
                      selectedLead.status === stage.key
                        ? 'bg-brand-600/20 border-brand-500 text-brand-400 shadow-brand-glow'
                        : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {stage.key}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Details Form */}
            <form onSubmit={handleUpdateLeadDetails} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    className="w-full glass-input pl-12 text-sm"
                    value={selectedLead.name}
                    onChange={(e) => setSelectedLead({ ...selectedLead, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    className="w-full glass-input pl-12 text-sm bg-slate-950/20 text-slate-400"
                    value={selectedLead.phone}
                    onChange={(e) => setSelectedLead({ ...selectedLead, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    className="w-full glass-input pl-12 text-sm"
                    value={selectedLead.email || ''}
                    placeholder="e.g. buyer@client.com"
                    onChange={(e) => setSelectedLead({ ...selectedLead, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Deal Value ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="number"
                      className="w-full glass-input pl-12 text-sm"
                      value={selectedLead.value}
                      onChange={(e) => setSelectedLead({ ...selectedLead, value: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Lead Score (0-100)</label>
                  <div className="relative">
                    <Sparkles className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      className="w-full glass-input pl-12 text-sm bg-slate-950/20"
                      value={selectedLead.leadScore}
                      onChange={(e) => setSelectedLead({ ...selectedLead, leadScore: e.target.value })}
                    />
                  </div>
                </div>

              </div>

              {/* Staff Operator Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Assigned Agent</label>
                <div className="relative">
                  <UserCheck className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                  <select
                    className="w-full glass-input pl-12 pr-8 text-sm cursor-pointer bg-slate-950 appearance-none focus:outline-none focus:border-brand-500/40"
                    value={selectedLead.assignedAgent || 'Unassigned'}
                    onChange={(e) => setSelectedLead({ ...selectedLead, assignedAgent: e.target.value })}
                  >
                    <option value="Unassigned">Unassigned</option>
                    <option value="Dwight Schrute">Dwight Schrute</option>
                    <option value="Pam Beesly">Pam Beesly</option>
                    <option value="Michael Scott">Michael Scott</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">CRM Deal Notes</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                  <textarea
                    rows="3"
                    className="w-full glass-input pl-12 text-sm resize-none"
                    placeholder="Enter special lead remarks..."
                    value={selectedLead.notes || ''}
                    onChange={(e) => setSelectedLead({ ...selectedLead, notes: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                className="w-full glass-btn-primary py-2.5 text-sm"
              >
                Save CRM Context
              </button>

            </form>

            {/* Follow-up Reminders */}
            <div className="border-t border-slate-850 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                  <Calendar className="w-4 h-4 text-teal-400" />
                  Follow-up Reminders
                </h4>
                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-full font-bold text-slate-400">
                  {(selectedLead.reminders || []).length}
                </span>
              </div>

              {/* Reminders List */}
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {(!selectedLead.reminders || selectedLead.reminders.length === 0) ? (
                  <p className="text-xs text-slate-500 italic">No reminders scheduled.</p>
                ) : (
                  selectedLead.reminders.map((rem, i) => (
                    <div 
                      key={i} 
                      className={`flex items-start justify-between p-3 rounded-xl border transition-all ${
                        rem.completed 
                          ? 'bg-slate-950/20 border-slate-900/40 opacity-60' 
                          : 'bg-slate-900/40 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleReminder(i)}
                          className={`mt-0.5 w-4.5 h-4.5 rounded border flex items-center justify-center transition-all ${
                            rem.completed 
                              ? 'bg-teal-500/20 border-teal-500 text-teal-400' 
                              : 'border-slate-700 hover:border-slate-500 bg-slate-950'
                          }`}
                        >
                          {rem.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div className="min-w-0 flex-1 ml-2">
                          <p className={`text-xs font-semibold text-slate-200 truncate ${rem.completed ? 'line-through text-slate-550' : ''}`}>
                            {rem.description}
                          </p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(rem.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteReminder(i)}
                        className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-red-400 transition-all shrink-0 ml-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Reminder Form */}
              <form onSubmit={handleAddReminder} className="bg-slate-900/30 border border-slate-850 p-3.5 rounded-xl space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Schedule New Reminder</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 uppercase font-semibold">Date</label>
                    <input
                      type="date"
                      required
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-brand-500/40"
                      value={newReminderDate}
                      onChange={(e) => setNewReminderDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 uppercase font-semibold">Time</label>
                    <input
                      type="time"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-brand-500/40"
                      value={newReminderTime}
                      onChange={(e) => setNewReminderTime(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase font-semibold">Task Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Send pricing proposal..."
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-brand-500/40"
                    value={newReminderDesc}
                    onChange={(e) => setNewReminderDesc(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-teal-650/10 hover:bg-teal-650/20 border border-teal-500/30 hover:border-teal-500/50 text-teal-400 text-xs font-bold rounded-lg transition-all"
                >
                  Schedule Reminder
                </button>
              </form>
            </div>

            {/* Notes Timeline Feed */}
            <div className="border-t border-slate-850 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                  <MessageSquare className="w-4 h-4 text-indigo-450" />
                  Chronological Notes
                </h4>
                <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded-full font-bold text-slate-400">
                  {(selectedLead.notesFeed || []).length}
                </span>
              </div>

              {/* Timeline Feed */}
              <div className="relative pl-4 border-l border-slate-800 space-y-4 max-h-56 overflow-y-auto pr-1">
                {(!selectedLead.notesFeed || selectedLead.notesFeed.length === 0) ? (
                  <p className="text-xs text-slate-500 italic -ml-4">No chronological notes posted yet.</p>
                ) : (
                  [...selectedLead.notesFeed].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((note, i) => (
                    <div key={i} className="relative space-y-1">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-slate-950 shadow-brand-glow"></span>
                      
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-indigo-400">{note.author || 'Staff Agent'}</span>
                        <span className="text-slate-500">{new Date(note.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/30 p-2.5 border border-slate-900 rounded-xl">
                        {note.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2">
                <textarea
                  rows="2"
                  placeholder="Post progress updates to timeline..."
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-650 focus:outline-none focus:border-brand-500/40 resize-none text-sm"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                ></textarea>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-650/10 hover:bg-indigo-650/20 border border-indigo-500/30 hover:border-indigo-500/50 text-indigo-400 text-xs font-bold rounded-xl transition-all"
                >
                  Save Note to Timeline
                </button>
              </form>
            </div>

          </div>

          {/* Delete CRM Profile footer */}
          <div className="p-6 border-t border-slate-850 bg-slate-900/20">
            <button
              onClick={() => handleDeleteLead(selectedLead._id)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-red-500/20 text-red-500 bg-red-500/5 hover:bg-red-500/10 text-xs font-bold transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Erase CRM Lead Profile</span>
            </button>
          </div>

        </div>
      )}

      {/* Create Lead Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md glass-panel bg-slate-900 border-slate-850 p-6 relative">
            <h3 className="text-lg font-bold text-white mb-4">Add Lead to CRM</h3>
            
            {err && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                {err}
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full glass-input bg-slate-950"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Phone (Unique)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +14155552671"
                    className="w-full glass-input bg-slate-950"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Email</label>
                  <input
                    type="email"
                    placeholder="e.g. sarah@example.com"
                    className="w-full glass-input bg-slate-950"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

              </div>

              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Deal Value ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    className="w-full glass-input bg-slate-950"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Starter Stage</label>
                  <select
                    className="w-full glass-input bg-slate-950 pr-4 text-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="new">New Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="won">Won Deal</option>
                    <option value="lost">Lost Deal</option>
                  </select>
                </div>

              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Deal Notes</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Met Sarah at convention; interested in our SaaS Starter pack."
                  className="w-full glass-input bg-slate-950 resize-none text-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setName('');
                    setPhone('');
                    setEmail('');
                    setStatus('new');
                    setValue(0);
                    setNotes('');
                    setCreateModal(false);
                  }}
                  className="glass-btn-secondary py-2 px-4 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-btn-primary py-2 px-4 text-sm"
                >
                  Register Lead
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
