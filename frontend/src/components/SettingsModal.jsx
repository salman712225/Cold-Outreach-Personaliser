import React, { useState } from 'react';
import { 
  X, 
  Key, 
  Database, 
  Activity, 
  ShieldCheck, 
  UserCheck, 
  LogIn, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';

export default function SettingsModal({ isOpen, onClose, systemStatus, user, setUser }) {
  const [authMode, setAuthMode] = useState('login'); // login, register
  const [email, setEmail] = useState('demo@coldoutreach.ai');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('Cold Outreach Specialist');
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');

  if (!isOpen) return null;

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
      <div className="glass-panel p-6 sm:p-8 rounded-2xl max-w-lg w-full space-y-6 border border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Settings & Environment</h3>
              <p className="text-xs text-slate-400">Environment variables & System status</p>
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
                Claude Model (Anthropic API)
              </span>
              <span className="font-mono text-emerald-400 font-semibold">
                {systemStatus?.model || "claude-3-5-sonnet-20241022"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="flex items-center gap-2 text-slate-300">
                <Activity className="w-4 h-4 text-cyan-400" />
                LangSmith Tracing (V2)
              </span>
              <span className="font-mono text-cyan-400 font-semibold">
                {systemStatus?.langsmith_tracing ? "Active" : "Ready"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="flex items-center gap-2 text-slate-300">
                <Database className="w-4 h-4 text-purple-400" />
                Database Engine
              </span>
              <span className="font-mono text-purple-300 font-semibold">
                {systemStatus?.database === "mongodb_connected" ? "MongoDB (Active)" : "Persistent Local Storage"}
              </span>
            </div>
          </div>
        </div>

        {/* User Account / Auth */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              User Account
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
