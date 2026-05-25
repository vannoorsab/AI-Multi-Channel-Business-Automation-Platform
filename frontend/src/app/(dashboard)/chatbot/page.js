'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { 
  Cpu, 
  Sparkles, 
  Settings, 
  Send, 
  Info,
  Key,
  MessageSquare,
  Loader2,
  CheckCircle2,
  FileText,
  Trash2,
  CloudUpload,
  Plus,
  Compass,
  Database
} from 'lucide-react';

export default function ChatbotConfigPage() {
  const { token } = useAuth();
  const { activeWorkspace, updateWorkspaceSettings } = useWorkspace();

  // Settings form states
  const [systemPrompt, setSystemPrompt] = useState('');
  const [greetingMessage, setGreetingMessage] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live Prompt Sandbox state
  const [sandboxMessages, setSandboxMessages] = useState([]);
  const [sandboxText, setSandboxText] = useState('');
  const [sandboxLoading, setSandboxLoading] = useState(false);

  // RAG Training Center states
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  
  // File Uploader states
  const [manualText, setManualText] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [indexing, setIndexing] = useState(false);
  const [indexingStatus, setIndexingStatus] = useState('');

  // Load active workspace settings on mount
  useEffect(() => {
    if (activeWorkspace) {
      setSystemPrompt(activeWorkspace.settings?.aiSystemPrompt || '');
      setGreetingMessage(activeWorkspace.settings?.aiGreetingMessage || '');
      setCustomKey(activeWorkspace.settings?.geminiApiKey || '');
      
      // Initialize sandbox greeting
      setSandboxMessages([
        {
          sender: 'ai',
          content: activeWorkspace.settings?.aiGreetingMessage || 'Hello! Welcome to our automated customer service. How can we help you today?'
        }
      ]);
      
      fetchTrainedDocuments();
    }
  }, [activeWorkspace]);

  const fetchTrainedDocuments = async () => {
    if (!token || !activeWorkspace) return;
    try {
      setLoadingDocs(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/documents?businessId=${activeWorkspace._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!activeWorkspace) return;

    try {
      setSaving(true);
      setSaveSuccess(false);

      const res = await updateWorkspaceSettings(activeWorkspace.name, {
        ...activeWorkspace.settings,
        aiSystemPrompt: systemPrompt,
        aiGreetingMessage: greetingMessage,
        geminiApiKey: customKey
      });

      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  // Upload and train AI RAG
  const handleTrainAI = async (e) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualText.trim() || !activeWorkspace) return;

    try {
      setIndexing(true);
      setIndexingStatus('Parsing text document...');
      await new Promise(resolve => setTimeout(resolve, 800));

      setIndexingStatus('Splitting text into overlapping chunks...');
      await new Promise(resolve => setTimeout(resolve, 800));

      setIndexingStatus('Calculating semantic embeddings via Gemini text-embedding-004...');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fileName: manualTitle.endsWith('.txt') ? manualTitle : `${manualTitle}.txt`,
          text: manualText,
          businessId: activeWorkspace._id
        })
      });

      const data = await response.json();

      if (data.success) {
        setIndexingStatus('Syncing chunks with database...');
        await new Promise(resolve => setTimeout(resolve, 600));
        
        setManualTitle('');
        setManualText('');
        fetchTrainedDocuments();
        alert('Chatbot successfully trained with knowledge document!');
      } else {
        alert(data.error || 'Failed to train chatbot.');
      }
    } catch (error) {
      console.error('Error training:', error);
      alert('An error occurred during indexing.');
    } finally {
      setIndexing(false);
      setIndexingStatus('');
    }
  };

  // Handle standard .txt file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setManualTitle(file.name);
      setManualText(event.target.result);
    };
    reader.readAsText(file);
  };

  // Detrain AI - Delete document
  const handleDeleteDocument = async (id) => {
    if (!confirm('Are you sure you want to detrain the chatbot by deleting this knowledge document? All associated vector chunks will be erased.')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setDocuments(prev => prev.filter(d => d._id !== id));
        alert('Document purged and AI detrained.');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  // Sandbox testing chat
  const handleSandboxSubmit = async (e) => {
    e.preventDefault();
    if (!sandboxText.trim() || sandboxLoading) return;

    const userQuery = sandboxText;
    setSandboxText('');
    
    // Add client query
    const updatedMessages = [
      ...sandboxMessages,
      { sender: 'lead', content: userQuery }
    ];
    setSandboxMessages(updatedMessages);

    try {
      setSandboxLoading(true);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/messages/simulate-whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          businessId: activeWorkspace._id,
          phone: '+10005550000', // sandbox phone
          customerName: 'Sandbox Tester',
          content: userQuery
        })
      });

      const data = await response.json();

      if (data.success) {
        // Fetch message logs
        const historyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/messages/${data.lead._id}?workspaceId=${activeWorkspace._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const historyData = await historyRes.json();
        if (historyData.success) {
          setSandboxMessages(historyData.messages);
        }
      }
    } catch (error) {
      console.error(error);
      setSandboxMessages((prev) => [
        ...prev,
        { sender: 'ai', content: '*(Sandbox Error)*: Chatbot handshake failed.' }
      ]);
    } finally {
      setSandboxLoading(false);
    }
  };

  const handleClearSandbox = async () => {
    setSandboxMessages([
      {
        sender: 'ai',
        content: greetingMessage || 'Hello! Welcome to our automated customer service. How can we help you today?'
      }
    ]);

    if (!token || !activeWorkspace) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/messages/reset-sandbox`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          businessId: activeWorkspace._id
        })
      });
    } catch (error) {
      console.error('Error resetting sandbox backend records:', error);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">AI Agent Settings & RAG Training</h1>
        <p className="text-slate-400 text-sm mt-1">Configure Gemini prompts and train your chatbot with business documents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Column: Config Panel (3/5 w) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Chatbot Personality Panel */}
          <div className="glass-panel p-6 bg-slate-900/40 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-850 pb-4">
              <Settings className="w-5 h-5 text-brand-400" />
              <h3 className="font-bold text-white text-base">Chatbot Personality Config</h3>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              
              <div className="space-y-2">
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-450 flex items-center justify-between">
                  <span>System Instructions Prompt</span>
                  <span className="text-brand-400 font-semibold lowercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    defines basic persona
                  </span>
                </label>
                <textarea
                  rows="5"
                  required
                  className="w-full glass-input text-xs font-mono leading-relaxed"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-450">Opening Greeting</label>
                  <input
                    type="text"
                    required
                    className="w-full glass-input text-xs"
                    value={greetingMessage}
                    onChange={(e) => setGreetingMessage(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-slate-500" />
                    <span>Gemini API Key override</span>
                  </label>
                  <input
                    type="password"
                    className="w-full glass-input text-xs"
                    placeholder="Leave blank to use platform defaults"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-3 border-t border-slate-900/60">
                <button
                  type="submit"
                  disabled={saving}
                  className="glass-btn-primary py-2 px-4 text-xs flex items-center gap-1.5"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Save Bot Settings</span>
                </button>

                {saveSuccess && (
                  <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    AI Config synchronized.
                  </span>
                )}
              </div>

            </form>
          </div>

          {/* AI Knowledge RAG Training Center */}
          <div className="glass-panel p-6 bg-slate-900/40 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-850 pb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-brand-400 animate-bounce" />
                <h3 className="font-bold text-white text-base">RAG Training Knowledge Base</h3>
              </div>
              <span className="text-[10px] bg-brand-500/10 border border-brand-500/15 text-brand-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Trained: {documents.length} files
              </span>
            </div>

            {/* Document Training uploader form */}
            <form onSubmit={handleTrainAI} className="space-y-4">
              
              <div className="p-4 border-2 border-dashed border-slate-800/80 rounded-2xl bg-slate-950/20 text-center relative group hover:border-brand-500/35 transition-all">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <CloudUpload className="w-8 h-8 text-slate-500 group-hover:text-brand-400 transition-colors mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-350">Drag & drop or click to upload training file</p>
                <p className="text-[10px] text-slate-500 mt-1">Supports UTF-8 Text (.txt) formats</p>
              </div>

              {/* Direct Text input fallbacks */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">Document Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FAQ sheet"
                    className="w-full glass-input text-xs bg-slate-950"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                  />
                </div>
                
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-450">Manual FAQ/Knowledge Text Loader</label>
                  <textarea
                    rows="2"
                    required
                    placeholder="Type or copy-paste business training facts, FAQ answers, or procedures here..."
                    className="w-full glass-input text-xs bg-slate-950 resize-none leading-relaxed"
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                  ></textarea>
                </div>
              </div>

              {indexing && (
                <div className="p-3 bg-brand-500/5 border border-brand-500/10 text-brand-400 rounded-xl text-xs flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
                  <span className="font-semibold">{indexingStatus}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={indexing || !manualText.trim()}
                className="glass-btn-primary py-2 px-5 text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Index Document Facts (Train AI)</span>
              </button>

            </form>

            {/* List of active trained files */}
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Active Trained Fact Sheets</h4>
              
              {loadingDocs ? (
                <div className="h-20 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                </div>
              ) : documents.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-800/40 rounded-xl text-slate-550 text-xs">
                  No training documents active. Chatbot uses general system prompts only.
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div 
                      key={doc._id}
                      className="p-3.5 bg-slate-950/60 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-4 h-4 text-brand-400 shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-slate-200 truncate leading-tight group-hover:text-brand-400 transition-colors">
                            {doc.fileName}
                          </p>
                          <p className="text-[9px] text-slate-500 mt-1">
                            Chars: {doc.characterCount} • Vectors Chunk count: <span className="text-white font-bold">{doc.chunkCount}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteDocument(doc._id)}
                        className="p-2 bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 text-slate-500 hover:text-red-400 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Right Column: Sandbox Playground (2/5 w) */}
        <div className="lg:col-span-2 glass-panel bg-slate-950/40 flex flex-col justify-between border-slate-850 overflow-hidden h-[75vh]">
          
          {/* Sandbox Header */}
          <div className="p-4 border-b border-slate-850 bg-slate-950/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Cpu className="w-4.5 h-4.5 text-brand-400" />
              <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">AI Sandbox Playground</h3>
            </div>
            
            <button
              onClick={handleClearSandbox}
              className="text-[9px] text-slate-450 hover:text-white px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg transition-all"
            >
              Reset Playground
            </button>
          </div>

          {/* Sandbox Chat Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/10">
            
            <div className="p-3 bg-brand-500/5 border border-brand-500/10 text-brand-400 rounded-xl space-y-1 text-[10.5px] leading-relaxed shrink-0">
              <div className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span className="font-bold uppercase tracking-wider">Test Prompt Sandbox</span>
              </div>
              <p>Type queries below to chat live with the chatbot. Gemini will automatically run semantic vector similarity searches over your active trained documents, retrieve contexts, and answer queries accordingly!</p>
            </div>

            {sandboxMessages.map((msg, idx) => {
              const isClient = msg.sender === 'lead';
              const isSystem = msg.sender === 'system';
              const isAI = msg.sender === 'ai';

              let bubbleBg = 'bg-brand-650 text-white rounded-br-none ml-auto border border-brand-600/35';
              if (isClient) bubbleBg = 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none';
              else if (isSystem) bubbleBg = 'bg-slate-950/40 text-slate-500 italic text-center mx-auto max-w-[80%] border-none';

              return (
                <div key={idx} className={`flex flex-col ${
                  isSystem ? 'items-center' : isClient ? 'items-start' : 'items-end'
                } space-y-0.5 max-w-[85%] ${
                  isSystem ? 'mx-auto w-full' : isClient ? 'mr-auto' : 'ml-auto'
                }`}>
                  <div className={`p-2.5 rounded-2xl text-xs leading-relaxed ${bubbleBg}`}>
                    {isAI && idx > 0 && (
                      <div className="flex items-center gap-1 mb-1 text-[9px] text-brand-400 font-bold border-b border-slate-700/50 pb-1">
                        <Sparkles className="w-3 h-3 text-brand-400 animate-pulse" />
                        <span>Gemini RAG response</span>
                      </div>
                    )}
                    <p>{msg.content}</p>
                  </div>
                </div>
              );
            })}

            {sandboxLoading && (
              <div className="flex items-center gap-2 mr-auto bg-slate-900 border border-slate-850 p-2.5 rounded-2xl rounded-bl-none text-xs text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
                <span>Gemini chatbot is thinking...</span>
              </div>
            )}

          </div>

          {/* Sandbox Composer */}
          <form onSubmit={handleSandboxSubmit} className="p-3 border-t border-slate-850/80 bg-slate-950/20 shrink-0 flex items-center gap-2">
            <input
              type="text"
              className="flex-1 glass-input py-2 text-xs bg-slate-950/50"
              placeholder="Test the chatbot's RAG knowledge retrieve here..."
              value={sandboxText}
              onChange={(e) => setSandboxText(e.target.value)}
            />
            <button
              type="submit"
              disabled={sandboxLoading}
              className="p-2.5 rounded-xl bg-brand-650 hover:bg-brand-600 text-white cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
