'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { 
  Workflow, 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Sparkles, 
  Cpu, 
  ArrowRight,
  MessageSquare,
  Activity,
  Award,
  Loader2,
  Edit3
} from 'lucide-react';

export default function AutomationPage() {
  const { token } = useAuth();
  const { activeWorkspace } = useWorkspace();

  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState('lead_created');
  const [actionType, setActionType] = useState('send_message');
  
  // Action parameters
  const [messageContent, setMessageContent] = useState('');
  const [statusVal, setStatusVal] = useState('contacted');
  const [scoreVal, setScoreVal] = useState(10);
  const [err, setErr] = useState('');

  const fetchWorkflows = async () => {
    if (!token || !activeWorkspace) return;
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workflows?workspaceId=${activeWorkspace._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setWorkflows(data.workflows);
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [activeWorkspace, token]);

  const handleToggleWorkflow = async (id, currentStatus) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workflows/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ active: !currentStatus })
      });
      const data = await response.json();
      if (data.success) {
        setWorkflows((prev) => prev.map(w => w._id === id ? data.workflow : w));
      }
    } catch (error) {
      console.error('Error toggling workflow:', error);
    }
  };

  const handleEditClick = (flow) => {
    setEditingWorkflow(flow);
    setName(flow.name);
    setDescription(flow.description || '');
    setTrigger(flow.trigger);
    const action = flow.actions[0];
    if (action) {
      setActionType(action.type);
      if (action.type === 'send_message') {
        setMessageContent(action.params?.content || '');
      } else if (action.type === 'update_status') {
        setStatusVal(action.params?.status || 'contacted');
      } else if (action.type === 'assign_score') {
        setScoreVal(action.params?.score || 10);
      }
    }
    setCreateModal(true);
  };

  const handleCreateWorkflow = async (e) => {
    e.preventDefault();
    setErr('');

    if (!name) {
      setErr('Workflow name is required.');
      return;
    }

    // Formulate actions array
    let actionParams = {};
    if (actionType === 'send_message') {
      actionParams = { content: messageContent || 'Thank you for reaching out!' };
    } else if (actionType === 'update_status') {
      actionParams = { status: statusVal };
    } else if (actionType === 'assign_score') {
      actionParams = { score: Number(scoreVal) || 10 };
    } // send_ai_reply has no parameters needed

    const actions = [{
      type: actionType,
      params: actionParams
    }];

    const isEdit = !!editingWorkflow;
    const url = isEdit
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workflows/${editingWorkflow._id}`
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workflows`;

    try {
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          trigger,
          actions,
          workspaceId: activeWorkspace._id
        })
      });

      const data = await response.json();

      if (data.success) {
        if (isEdit) {
          setWorkflows((prev) => prev.map(w => w._id === editingWorkflow._id ? data.workflow : w));
        } else {
          setWorkflows((prev) => [data.workflow, ...prev]);
        }
        clearForm();
      } else {
        setErr(data.error || `Failed to ${isEdit ? 'update' : 'construct'} workflow.`);
      }
    } catch (error) {
      setErr('An error occurred.');
    }
  };

  const clearForm = () => {
    setName('');
    setDescription('');
    setTrigger('lead_created');
    setActionType('send_message');
    setMessageContent('');
    setStatusVal('contacted');
    setScoreVal(10);
    setEditingWorkflow(null);
    setCreateModal(false);
  };

  const handleDeleteWorkflow = async (id) => {
    if (!confirm('Are you sure you want to delete this automation workflow?')) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/workflows/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setWorkflows((prev) => prev.filter(w => w._id !== id));
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Workflow Automation</h1>
          <p className="text-slate-400 text-sm mt-1">Configure action scripts triggered by customer events</p>
        </div>
        <button
          onClick={() => setCreateModal(true)}
          className="glass-btn-primary flex items-center justify-center gap-2 self-start sm:self-auto h-11"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Rule</span>
        </button>
      </div>

      {/* Workflows list */}
      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : workflows.length === 0 ? (
        <div className="glass-panel p-12 text-center flex flex-col items-center justify-center text-slate-500">
          <Workflow className="w-12 h-12 mb-3 text-slate-600 stroke-1" />
          <h3 className="text-base font-bold text-slate-400">No automation scripts configured</h3>
          <p className="text-xs max-w-sm mt-1 mb-6">Create automated pipelines, auto-update lead CRM values, or send greetings automatically upon texts.</p>
          <button
            onClick={() => setCreateModal(true)}
            className="glass-btn-secondary px-5 py-2 text-xs"
          >
            Create Your First Workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workflows.map((flow) => {
            const action = flow.actions[0];
            
            return (
              <div 
                key={flow._id}
                className={`glass-panel p-6 bg-slate-900/40 relative flex flex-col justify-between border-slate-850 transition-all ${
                  !flow.active ? 'opacity-60 hover:opacity-80' : 'hover:border-brand-500/20'
                }`}
              >
                
                {/* Upper Details */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-750">
                      Trigger: {flow.trigger.replace('_', ' ')}
                    </span>
                    
                    {/* Active toggle */}
                    <button 
                      onClick={() => handleToggleWorkflow(flow._id, flow.active)}
                      className="p-1 focus:outline-none cursor-pointer"
                    >
                      {flow.active ? (
                        <ToggleRight className="w-8 h-8 text-brand-400" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-slate-650" />
                      )}
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1 leading-tight">{flow.name}</h3>
                  <p className="text-xs text-slate-450 leading-relaxed mb-6">{flow.description || 'No description provided.'}</p>
                </div>

                {/* Workflow Action Graphic Visual */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-850 flex items-center justify-between gap-3 text-xs mb-6">
                  <div className="flex items-center gap-2 text-slate-350 min-w-0">
                    <Activity className="w-4 h-4 text-brand-400 shrink-0" />
                    <span className="truncatecapitalize">{flow.trigger.split('_')[0]} Event</span>
                  </div>
                  
                  <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />

                  <div className="flex items-center gap-2 text-white min-w-0">
                    {action?.type === 'send_message' && <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />}
                    {action?.type === 'send_ai_reply' && <Cpu className="w-4 h-4 text-brand-400 shrink-0" />}
                    {action?.type === 'update_status' && <Activity className="w-4 h-4 text-blue-400 shrink-0" />}
                    {action?.type === 'assign_score' && <Award className="w-4 h-4 text-amber-400 shrink-0" />}
                    <span className="truncate capitalize font-semibold">{action?.type.replace(/_/g, ' ')}</span>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-900/60 mt-auto">
                  <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">
                    Actions: {flow.actions.length} step
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditClick(flow)}
                      className="p-2 hover:bg-brand-500/10 border border-transparent hover:border-brand-500/20 text-slate-500 hover:text-brand-400 rounded-xl transition-all"
                      title="Edit Workflow"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteWorkflow(flow._id)}
                      className="p-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-slate-500 hover:text-red-400 rounded-xl transition-all"
                      title="Delete Workflow"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Create Automation Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md glass-panel bg-slate-900 border-slate-850 p-6 relative">
            <h3 className="text-lg font-bold text-white mb-4">
              {editingWorkflow ? 'Edit Automation Rule' : 'New Automation Rule'}
            </h3>
            
            {err && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                {err}
              </div>
            )}

            <form onSubmit={handleCreateWorkflow} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Workflow Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Welcome auto-message"
                  className="w-full glass-input bg-slate-950"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Automatically sends welcome text when a new client connects."
                  className="w-full glass-input bg-slate-950 text-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Trigger Event</label>
                  <select
                    className="w-full glass-input bg-slate-950 text-sm pr-4"
                    value={trigger}
                    onChange={(e) => setTrigger(e.target.value)}
                  >
                    <option value="lead_created">Lead Created</option>
                    <option value="message_received">Message Received</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Action Type</label>
                  <select
                    className="w-full glass-input bg-slate-950 text-sm pr-4"
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                  >
                    <option value="send_message">Send Msg Template</option>
                    <option value="send_ai_reply">Send Gemini AI Reply</option>
                    <option value="update_status">Update CRM Status</option>
                    <option value="assign_score">Assign CRM Lead Score</option>
                  </select>
                </div>

              </div>

              {/* Action Parameter Render blocks */}
              {actionType === 'send_message' && (
                <div className="space-y-1 p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Auto-Message Template</label>
                  <textarea
                    rows="2"
                    required
                    placeholder="e.g. Hello! Welcome. We have assigned a sales manager to your file."
                    className="w-full glass-input bg-slate-950 resize-none text-sm mt-1"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                  ></textarea>
                </div>
              )}

              {actionType === 'update_status' && (
                <div className="space-y-1 p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Pipeline Shift Target Stage</label>
                  <select
                    className="w-full glass-input bg-slate-950 text-sm pr-4 mt-1"
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                  >
                    <option value="new">New Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="won">Won Deal</option>
                    <option value="lost">Lost Deal</option>
                  </select>
                </div>
              )}

              {actionType === 'assign_score' && (
                <div className="space-y-1 p-3 bg-slate-950/40 rounded-xl border border-slate-800">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Score Modification (+ / -)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 15"
                    className="w-full glass-input bg-slate-950 text-sm mt-1"
                    value={scoreVal}
                    onChange={(e) => setScoreVal(e.target.value)}
                  />
                </div>
              )}

              {actionType === 'send_ai_reply' && (
                <div className="p-3 bg-brand-500/5 rounded-xl border border-brand-500/10 text-brand-450 text-[10.5px] leading-relaxed">
                  <Sparkles className="w-4.5 h-4.5 mb-1 text-brand-400" />
                  When this trigger fires, it automatically fetches lead thread transcripts, builds a Gemini conversation context, evaluates your custom System Prompt instructions, and auto-texts the user in real-time.
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={clearForm}
                  className="glass-btn-secondary py-2 px-4 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-btn-primary py-2 px-4 text-sm"
                >
                  {editingWorkflow ? 'Update Rule' : 'Construct Rule'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
