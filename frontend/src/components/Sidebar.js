'use client';

import React, { useState } from 'react';
import Link from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  LayoutDashboard, 
  Inbox, 
  Users, 
  Cpu, 
  Workflow, 
  Settings, 
  LogOut, 
  Plus, 
  Building,
  User as UserIcon,
  ChevronsUpDown,
  BarChart3,
  Sliders
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { workspaces, activeWorkspace, switchWorkspace, createWorkspace } = useWorkspace();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [newWorkspaceModal, setNewWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Unified Inbox', icon: Inbox, path: '/inbox' },
    { name: 'Leads & CRM', icon: Users, path: '/leads' },
    { name: 'Workflow Builder', icon: Workflow, path: '/automation' },
    { name: 'Deep Analytics', icon: BarChart3, path: '/analytics' },
    { name: 'Chatbot Config', icon: Cpu, path: '/chatbot' },
    { name: 'Settings', icon: Sliders, path: '/settings' },
  ];

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    const res = await createWorkspace(newWorkspaceName);
    if (res.success) {
      setNewWorkspaceName('');
      setNewWorkspaceModal(false);
    }
  };

  return (
    <aside className="w-64 border-r border-slate-800/85 bg-slate-950/70 backdrop-blur-lg flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none z-30">
      
      {/* Upper Navigation & Switcher */}
      <div className="flex flex-col flex-1 p-4 overflow-y-auto">
        
        {/* Workspace Switcher Header */}
        <div className="relative mb-6">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-brand-650 flex items-center justify-center text-white shrink-0 font-black text-sm shadow-brand-glow">
                {activeWorkspace?.name?.charAt(0).toUpperCase() || 'B'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {activeWorkspace?.name || 'Loading Business...'}
                </p>
                <p className="text-[10px] text-slate-500 truncate leading-none mt-1 uppercase tracking-wider font-semibold">
                  Active Business
                </p>
              </div>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
          </button>

          {/* Switcher Dropdown */}
          {dropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-850 rounded-2xl shadow-xl overflow-hidden z-40 p-2 space-y-1">
              <p className="text-[9px] font-bold tracking-wider text-slate-500 uppercase px-3 py-1.5">Switch Business</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {workspaces.map((ws) => (
                  <button
                    key={ws._id}
                    onClick={() => {
                      switchWorkspace(ws._id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                      activeWorkspace?._id === ws._id
                        ? 'bg-brand-600/10 text-brand-400 font-bold'
                        : 'text-slate-350 hover:bg-slate-800'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span className="truncate">{ws.name}</span>
                  </button>
                ))}
              </div>
              <hr className="border-slate-800 my-1" />
              <button
                onClick={() => {
                  setNewWorkspaceModal(true);
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-brand-400 hover:bg-brand-600/5 hover:text-brand-300 rounded-lg transition-all text-left"
              >
                <Plus className="w-4 h-4" />
                <span>Create Workspace</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1 flex-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <a
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs transition-all group relative ${
                  isActive
                    ? 'bg-brand-600/10 border-l-2 border-brand-500 text-brand-400 font-bold shadow-brand-glow'
                    : 'text-slate-350 hover:bg-slate-900/60 hover:text-white'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 shrink-0 ${
                  isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'
                }`} />
                <span>{item.name}</span>
                {isActive && (
                  <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                )}
              </a>
            );
          })}
        </nav>
      </div>

      {/* User Session details bottom */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user?.username || 'SaaS Operator'}
              </p>
              <p className="text-[10px] text-slate-500 truncate leading-none mt-1">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all mt-4 font-bold cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out Session</span>
        </button>
      </div>

      {/* Workspace Creation Modal Overlay */}
      {newWorkspaceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm glass-panel bg-slate-900 border-slate-800 p-6 relative">
            <h3 className="text-sm font-bold text-white mb-4">New Business Workspace</h3>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Business Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summit Operations"
                  className="w-full glass-input bg-slate-950 text-xs"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewWorkspaceName('');
                    setNewWorkspaceModal(false);
                  }}
                  className="glass-btn-secondary py-1.5 px-3 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="glass-btn-primary py-1.5 px-3 text-xs"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
