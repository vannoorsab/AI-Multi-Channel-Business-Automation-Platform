'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import Sidebar from '../../components/Sidebar';
import Navbar from '../../components/Navbar';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { token, loading } = useAuth();
  const { loading: workspaceLoading } = useWorkspace();

  if (loading || (token && workspaceLoading)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-dark-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
          <p className="text-sm font-medium tracking-wide text-slate-400">Loading business workspaces...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dark-950">
      {/* Left Sidebar navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Navbar */}
        <Navbar />

        {/* Workspace scrolling board */}
        <main className="flex-1 overflow-y-auto relative z-10 p-6 md:p-8">
          <div className="max-w-7xl w-full mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
