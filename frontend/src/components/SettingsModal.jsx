import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Database, 
  Activity, 
  ShieldCheck, 
  UserCheck, 
  LogIn, 
  Sparkles,
  CheckCircle2,
  Sliders,
  ExternalLink,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function SettingsModal({ isOpen, onClose, systemStatus, user, setUser }) {
  const [authMode, setAuthMode] = useState('login'); // login, register
  const [email, setEmail] = useState('demo@coldoutreach.ai');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('Cold Outreach Specialist');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  // LangSmith and API settings (persisted in localStorage)
  const [enableLangSmith, setEnableLangSmith] = useState(() => {
    return localStorage.getItem('enable_langsmith') === 'true';
  });
  const [langchainApiKey, setLangchainApiKey] = useState(() => {
    return localStorage.getItem('langchain_api_key') || '';
  });
  const [langchainProject, setLangchainProject] = useState(() => {
    return localStorage.getItem('langchain_project') || 'cold-outreach-app';
  });
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  useEffect(() => {
    if (systemStatus?.langsmith_tracing) {
      setEnableLangSmith(true);
    }
  }, [systemStatus]);

  if (!isOpen) return null;

  const handleSaveTelemetry = (e) => {
    e.preventDefault();
    localStorage.setItem('enable_langsmith', enableLangSmith ? 'true' : 'false');
    localStorage.setItem('langchain_api_key', langchainApiKey);
    localStorage.setItem('langchain_project', langchainProject);
    setSavedSettingsNotice(true);
    setTimeout(() => setSavedSettingsNotice(false), 3000);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMessage('');
    try {
      let res;
      if (authMode === 'login') {
        res = await api.login(email, password);
      } else {
        res = await api.register(email, password, fullName);
      }
      if (res && res.user) {
        setUser(res.user);
        setAuthMessage(`Logged in as ${res.user.email}`);
      }
    } catch (err) {
      setAuthMessage(`Auth error: ${err.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="glass-panel p-6 sm:p-8 rounded-2xl max-w-xl w-full space-y-6 border border-slate-700 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Settings & Environment</h3>
              <p className="text-xs text-slate-400">Model settings, LangSmith telemetry & MongoDB status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System & Architecture Info */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Active Stack Configuration
          </span>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="flex items-center gap-2 text-slate-300">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Mistral AI Model
              </span>
              <span className="font-mono text-emerald-400 font-semibold">
                {systemStatus?.model || "mistral-small-latest"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="flex items-center gap-2 text-slate-300">
                <Database className="w-4 h-4 text-purple-400" />
                Database Engine
              </span>
              <span className="font-mono text-purple-300 font-semibold">
                {systemStatus?.database === "mongodb_connected" ? "MongoDB Atlas (Connected)" : "In-Memory / Local Store"}
              </span>
            </div>
          </div>
        </div>

        {/* Optional LangSmith Tracing Section */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Optional LangSmith Tracing & Observability
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Monitor token usage, LLM latency, and agent reasoning traces in LangSmith.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={enableLangSmith} 
                onChange={(e) => setEnableLangSmith(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {enableLangSmith && (
            <form onSubmit={handleSaveTelemetry} className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/20 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-[11px] text-cyan-300 bg-cyan-950/40 p-2 rounded-lg border border-cyan-800/30">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  LangSmith tracing can be enabled with your LangChain API Key
                </span>
                <a 
                  href="https://smith.langchain.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-1 text-cyan-400 hover:underline font-semibold"
                >
                  Get Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-300">LANGCHAIN_API_KEY</label>
                <input
                  type="password"
                  value={langchainApiKey}
                  onChange={(e) => setLangchainApiKey(e.target.value)}
                  placeholder="lsv2_pt_..."
                  className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-300">LANGCHAIN_PROJECT</label>
                <input
                  type="text"
                  value={langchainProject}
                  onChange={(e) => setLangchainProject(e.target.value)}
                  placeholder="cold-outreach-app"
                  className="mt-1 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                {savedSettingsNotice ? (
                  <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Settings saved!
                  </span>
                ) : <span />}
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition"
                >
                  Save Telemetry Config
                </button>
              </div>
            </form>
          )}
        </div>

        {/* User Account / Auth */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              User Account & History Session
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded transition ${
                  authMode === 'login' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded transition ${
                  authMode === 'register' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'
                }`}
              >
                Register
              </button>
            </div>
          </div>

          <form onSubmit={handleAuth} className="space-y-3">
            {authMode === 'register' && (
              <div>
                <label className="text-[11px] font-medium text-slate-400">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-medium text-slate-400">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {authMessage && (
              <p className="text-xs text-emerald-400 font-semibold">{authMessage}</p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
            >
              {authLoading ? "Authenticating..." : authMode === 'login' ? "Sign In / Demo Login" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
