import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SingleOutreach from './components/SingleOutreach';
import BatchProcessor from './components/BatchProcessor';
import KnowledgeBase from './components/KnowledgeBase';
import LangSmithEval from './components/LangSmithEval';
import HistoryView from './components/HistoryView';
import SettingsModal from './components/SettingsModal';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('single'); // single, batch, rag, eval, history
  const [systemStatus, setSystemStatus] = useState(null);
  const [user, setUser] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    // Check backend health & auth
    api.checkHealth().then(setSystemStatus).catch(console.error);
    api.getMe().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={systemStatus}
        user={user}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'single' && <SingleOutreach onSaved={() => {}} />}
        {activeTab === 'batch' && <BatchProcessor />}
        {activeTab === 'rag' && <KnowledgeBase />}
        {activeTab === 'eval' && <LangSmithEval />}
        {activeTab === 'history' && <HistoryView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B0F19]/90 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 ColdReach.ai — Anti-AI Cold Outreach Personaliser</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Mistral AI API</span>
            <span>•</span>
            <span>LangGraph Multi-Agent</span>
            <span>•</span>
            <span>LangSmith Tracing</span>
            <span>•</span>
            <span>MongoDB & RAG</span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        systemStatus={systemStatus}
        user={user}
        setUser={setUser}
      />
    </div>
  );
}
