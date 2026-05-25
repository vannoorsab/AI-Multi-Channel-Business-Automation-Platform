'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { 
  Sliders, 
  Globe, 
  MessageSquare, 
  Instagram, 
  Smartphone, 
  Users, 
  ShieldAlert, 
  Key, 
  Plus, 
  Loader2, 
  Check, 
  UserPlus
} from 'lucide-react';

export default function SettingsPage() {
  const { token, user } = useAuth();
  const { activeWorkspace, updateWorkspaceSettings } = useWorkspace();

  const [activeTab, setActiveTab] = useState('integrations');
  const [saving, setSaving] = useState(false);
  const [inviteModal, setInviteModal] = useState(false);

  // Invitation Form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('support agent');
  const [inviting, setInviting] = useState(false);

  // Mock Integrations Status State
  const [whatsappConnected, setWhatsappConnected] = useState(true);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [webchatConnected, setWebchatConnected] = useState(true);

  // Workspace Profile States
  const [workspaceName, setWorkspaceName] = useState(activeWorkspace?.name || '');
  const [updatingName, setUpdatingName] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  React.useEffect(() => {
    if (activeWorkspace) {
      setWorkspaceName(activeWorkspace.name || '');
    }
  }, [activeWorkspace]);

  const handleUpdateWorkspaceName = async (e) => {
    e.preventDefault();
    if (!workspaceName.trim() || !activeWorkspace) return;

    try {
      setUpdatingName(true);
      setUpdateSuccess(false);
      
      const res = await updateWorkspaceSettings(workspaceName.trim(), activeWorkspace.settings || {});
      
      if (res && res.success) {
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
      } else {
        alert(res?.error || 'Failed to update workspace name.');
      }
    } catch (error) {
      console.error('Error updating workspace name:', error);
      alert('Error updating workspace name.');
    } finally {
      setUpdatingName(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setInviting(true);
      // Simulate inviting user
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert(`Staff invitation dispatched to ${inviteEmail} as "${inviteRole}".`);
      setInviteEmail('');
      setInviteModal(false);
    } catch (error) {
      console.error(error);
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Business Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure integrations, API keys, and staff roles</p>
      </div>

      {/* Tabs list */}
      <div className="flex gap-2 border-b border-slate-850 pb-px shrink-0">
        <button
          onClick={() => setActiveTab('integrations')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'integrations'
              ? 'border-brand-500 text-brand-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          API Integrations
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'staff'
              ? 'border-brand-500 text-brand-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Staff Directory
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'border-brand-500 text-brand-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Workspace Profile
        </button>
      </div>

      {/* TABS CONTAINER */}
      {activeTab === 'integrations' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* WhatsApp API */}
          <div className="glass-panel p-6 bg-slate-900/40 border-slate-850 flex flex-col justify-between h-[360px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/5">
                  <Smartphone className="w-5 h-5 animate-pulse" />
                </div>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  whatsappConnected 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-550'
                }`}>
                  {whatsappConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">WhatsApp Business API</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Automate responses, capture new leads, and view conversations from your official WhatsApp numbers.
              </p>
              <div className="space-y-2 text-[10.5px] p-3 bg-slate-950/40 rounded-xl border border-slate-850 text-slate-400">
                <p><span className="font-bold text-white">Simulator Status:</span> Active Sandbox</p>
                <p className="truncate"><span className="font-bold text-white">Webhook:</span> http://localhost:5000/api/messages/simulate-whatsapp</p>
              </div>
            </div>
            <button
              onClick={() => setWhatsappConnected(!whatsappConnected)}
              className={`w-full py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
                whatsappConnected
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                  : 'glass-btn-primary'
              }`}
            >
              {whatsappConnected ? 'Disconnect API Channel' : 'Connect Channel'}
            </button>
          </div>

          {/* Instagram API */}
          <div className="glass-panel p-6 bg-slate-900/40 border-slate-850 flex flex-col justify-between h-[360px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shadow-sm shadow-pink-500/5">
                  <Instagram className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  instagramConnected 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-slate-850 border-slate-800 text-slate-500'
                }`}>
                  {instagramConnected ? 'Connected' : 'Configure'}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Instagram DM API</h3>
              <p className="text-xs text-slate-450 leading-relaxed mb-4">
                Link your Meta Business Suite Instagram Account. Automate responses to story mentions and DMs.
              </p>
              <div className="space-y-2 text-[10.5px] p-3 bg-slate-950/40 rounded-xl border border-slate-850 text-slate-500">
                <p><span className="font-bold text-slate-400">OAuth Link:</span> Status Pending</p>
                <p className="truncate"><span className="font-bold text-slate-400">Handle:</span> Not configured</p>
              </div>
            </div>
            <button
              onClick={() => setInstagramConnected(!instagramConnected)}
              className={`w-full py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
                instagramConnected
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                  : 'glass-btn-primary'
              }`}
            >
              {instagramConnected ? 'Disconnect IG Profile' : 'Authorize IG Account'}
            </button>
          </div>

          {/* Webchat API Widget */}
          <div className="glass-panel p-6 bg-slate-900/40 border-slate-850 flex flex-col justify-between h-[360px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shadow-sm shadow-brand-glow/5">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  webchatConnected 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-slate-850 border-slate-800 text-slate-500'
                }`}>
                  {webchatConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2">Website Chat Widget</h3>
              <p className="text-xs text-slate-450 leading-relaxed mb-4">
                Deploy an attractive real-time chat bubble on your website. Collect emails, and let Gemini chat live.
              </p>
              <div className="space-y-1.5 text-[9.5px] p-3 bg-slate-950/40 rounded-xl border border-slate-850 text-slate-400 font-mono overflow-x-auto select-all">
                {`<!-- Embed Script -->`} <br />
                {`<script src="http://localhost:5000/widget.js" data-business="${activeWorkspace?._id || ''}"></script>`}
              </div>
            </div>
            <button
              onClick={() => setWebchatConnected(!webchatConnected)}
              className={`w-full py-2 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
                webchatConnected
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
                  : 'glass-btn-primary'
              }`}
            >
              {webchatConnected ? 'Disable Web Widget' : 'Generate Web Widget'}
            </button>
          </div>

        </div>
      ) : (
        <div className="glass-panel p-6 bg-slate-900/40 border-slate-850 space-y-6">
          
          <div className="flex items-center justify-between border-b border-slate-850 pb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-400" />
              <h3 className="font-bold text-white text-base">Active Business Staff</h3>
            </div>
            
            {/* Owner/Admin only invite button */}
            {['business owner', 'admin'].includes(user?.role) && (
              <button
                onClick={() => setInviteModal(true)}
                className="glass-btn-primary flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs h-9"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite Staff Member</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold tracking-wider">
                  <th className="pb-3 px-4">Operator Name</th>
                  <th className="pb-3 px-4">Email Address</th>
                  <th className="pb-3 px-4">RBAC Role</th>
                  <th className="pb-3 px-4">Security Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                
                {/* Simulated Owner */}
                <tr>
                  <td className="py-4 px-4 font-bold text-white flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                      {user?.username?.charAt(0).toUpperCase() || 'O'}
                    </div>
                    <span>{user?.username} (You)</span>
                  </td>
                  <td className="py-4 px-4 text-slate-400">{user?.email}</td>
                  <td className="py-4 px-4">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full">
                      {user?.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-450 font-semibold">Tenant Admin</td>
                </tr>

                {/* Simulated Agent */}
                <tr>
                  <td className="py-4 px-4 font-bold text-white flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                      D
                    </div>
                    <span>Dwight Schrute</span>
                  </td>
                  <td className="py-4 px-4 text-slate-400">dwight@dundermifflin.com</td>
                  <td className="py-4 px-4">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full">
                      support agent
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-450 font-semibold">Lead Resolver</td>
                </tr>

                {/* Simulated System Admin */}
                <tr>
                  <td className="py-4 px-4 font-bold text-white flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                      M
                    </div>
                    <span>Michael Scott</span>
                  </td>
                  <td className="py-4 px-4 text-slate-400">michael@dundermifflin.com</td>
                  <td className="py-4 px-4">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-450 rounded-full">
                      business owner
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-450 font-semibold">Tenant Owner</td>
                </tr>

              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* Invite Staff Modal */}
      {inviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm glass-panel bg-slate-900 border-slate-850 p-6 relative">
            <h3 className="text-sm font-bold text-white mb-4">Invite Team Member</h3>
            <form onSubmit={handleInvite} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Staff Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. pam@company.com"
                  className="w-full glass-input bg-slate-950 text-xs"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Staff RBAC Role</label>
                <select
                  className="w-full glass-input bg-slate-950 text-xs pr-4"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                >
                  <option value="support agent">Support Agent (Answering, CRM views)</option>
                  <option value="business owner">Business Owner (Billing, Settings, API keys)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setInviteEmail('');
                    setInviteModal(false);
                  }}
                  className="glass-btn-secondary py-1.5 px-3 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="glass-btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Dispatch Invitation</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="glass-panel p-6 bg-slate-900/40 border-slate-850 space-y-6 max-w-lg">
          <div className="flex items-center gap-2 border-b border-slate-850 pb-4">
            <Sliders className="w-5 h-5 text-brand-400 animate-pulse" />
            <h3 className="font-bold text-white text-base">Workspace Profile Settings</h3>
          </div>

          <form onSubmit={handleUpdateWorkspaceName} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Workspace / Company Name</label>
              <input
                type="text"
                required
                className="w-full glass-input text-xs"
                placeholder="e.g. Apex Business Automation"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={updatingName || !workspaceName.trim()}
                className="glass-btn-primary py-2 px-4 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {updatingName ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Update Workspace Name</span>
              </button>

              {updateSuccess && (
                <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5 animate-bounce">
                  <Check className="w-3.5 h-3.5" />
                  Synchronized successfully.
                </span>
              )}
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
