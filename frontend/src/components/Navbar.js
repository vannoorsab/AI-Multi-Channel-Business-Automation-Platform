'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { useSocket } from '../context/SocketContext';
import { 
  Bell, 
  Check, 
  Clock, 
  Activity, 
  Cpu, 
  Sparkles, 
  Smartphone,
  ChevronDown,
  Info,
  Sun,
  Moon
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { token, user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { socket, connected } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [theme, setTheme] = useState('dark');

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

  // Derive active page title
  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard': return 'Overview';
      case '/inbox': return 'Unified Inbox';
      case '/leads': return 'Leads & CRM';
      case '/automation': return 'Workflow Builder';
      case '/chatbot': return 'AI Chatbot Agent';
      case '/analytics': return 'Deep Analytics';
      case '/settings': return 'Integration Settings';
      default: return 'Business Dashboard';
    }
  };

  const fetchNotifications = async () => {
    if (!token || !activeWorkspace) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notifications?businessId=${activeWorkspace._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeWorkspace, token]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Listen to socket alerts
  useEffect(() => {
    if (!socket) return;
    
    const handleNewAlert = (notif) => {
      setNotifications(prev => [notif, ...prev]);
    };

    socket.on('new_notification', handleNewAlert);
    return () => socket.off('new_notification', handleNewAlert);
  }, [socket]);

  const handleMarkAllRead = async () => {
    if (!token || !activeWorkspace) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notifications/read-all?businessId=${activeWorkspace._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  const handleMarkOneRead = async (id) => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      }
    } catch (error) {
      console.error('Error marking read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 select-none shrink-0">
      
      {/* Title */}
      <div>
        <h2 className="text-base font-bold text-white tracking-wide">{getPageTitle()}</h2>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        
        {/* API connection indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800/60 rounded-xl text-[10.5px]">
          <div className="relative flex h-1.5 w-1.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              connected ? 'bg-emerald-400' : 'bg-amber-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
              connected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}></span>
          </div>
          <span className="text-slate-400 font-semibold uppercase tracking-wider">
            {connected ? 'Sockets active' : 'Connecting...'}
          </span>
        </div>

        {/* Theme mode switcher */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-slate-400 hover:text-white cursor-pointer flex items-center justify-center"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
          ) : (
            <Moon className="w-4.5 h-4.5 text-slate-500" />
          )}
        </button>

        {/* Notifications Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-slate-400 hover:text-white relative cursor-pointer"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 shadow-brand-glow animate-pulse"></span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {dropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-slate-900 border border-slate-850 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[75vh]">
              
              {/* Header */}
              <div className="p-4 border-b border-slate-800/80 bg-slate-950/20 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold text-white">Notifications ({unreadCount})</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-brand-400 hover:text-brand-300 font-semibold hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Items feed */}
              <div className="flex-1 overflow-y-auto max-h-[40vh]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-1.5">
                    <Info className="w-6 h-6 text-slate-655" />
                    <span>No notifications received.</span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => handleMarkOneRead(notif._id)}
                      className={`p-3 border-b border-slate-800/30 text-left transition-all hover:bg-slate-800/50 cursor-pointer flex gap-3 ${
                        !notif.read ? 'bg-brand-600/[0.03]' : 'bg-transparent'
                      }`}
                    >
                      <div className="mt-0.5">
                        {notif.type === 'new_lead' && <Sparkles className="w-4 h-4 text-emerald-400" />}
                        {notif.type === 'new_message' && <Smartphone className="w-4 h-4 text-brand-400 animate-bounce" />}
                        {notif.type === 'system_alert' && <Activity className="w-4 h-4 text-blue-400" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <p className={`text-xs font-bold truncate leading-tight ${!notif.read ? 'text-white' : 'text-slate-350'}`}>
                            {notif.title}
                          </p>
                          {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0"></span>}
                        </div>
                        <p className="text-[10.5px] text-slate-450 leading-relaxed line-clamp-2 mb-1.5">
                          {notif.content}
                        </p>
                        <span className="text-[8px] text-slate-600 flex items-center gap-1 font-semibold">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-600 border border-brand-500/30 flex items-center justify-center text-white text-xs font-black shadow-brand-glow">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <span className="hidden md:block text-xs font-semibold text-slate-300 capitalize">{user?.role}</span>
        </div>

      </div>

    </header>
  );
}
