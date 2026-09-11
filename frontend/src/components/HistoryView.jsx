import React, { useState, useEffect } from 'react';
import { 
  History, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  Mail, 
  Search,
  User,
  Building2,
  Layers
} from 'lucide-react';
import { api } from '../services/api';

export default function HistoryView() {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory();
      setHistoryItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this history record?")) return;
    try {
      await api.deleteHistoryItem(id);
      fetchHistory();
    } catch (err) {
      alert("Failed to delete item");
    }
  };

  const copyEmail = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = historyItems.filter((item) => {
    const q = search.toLowerCase();
    return (
      (item.prospect_name && item.prospect_name.toLowerCase().includes(q)) ||
      (item.prospect_company && item.prospect_company.toLowerCase().includes(q)) ||
      (item.selected_subject && item.selected_subject.toLowerCase().includes(q)) ||
      (item.email_body && item.email_body.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold">
            <History className="w-3.5 h-3.5 text-emerald-400" />
            Saved Generations & Campaigns
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Outreach History & Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Access, review, and re-copy all previously personalized single emails and campaign runs stored in MongoDB.
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, subject..."
            className="w-full rounded-xl bg-slate-900 border border-slate-700 pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* History List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading history...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-2">
          <p className="text-sm font-bold text-slate-300">No saved emails found</p>
          <p className="text-xs text-slate-500">Generations will automatically appear here once created.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="glass-panel p-5 rounded-2xl space-y-4 glass-panel-hover">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    {item.anti_ai_score || 95}%
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{item.prospect_name || "Prospect"}</span>
                      {item.prospect_company && (
                        <span className="text-xs text-slate-400">@ {item.prospect_company}</span>
                      )}
                      {item.prospect_role && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {item.prospect_role}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyEmail(`Subject: ${item.selected_subject}\n\n${item.email_body}`, item.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Email</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Delete Record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-mono text-xs text-emerald-300">
                  Subject: {item.selected_subject}
                </div>
                <div className="text-xs text-slate-200 whitespace-pre-wrap bg-slate-950/70 p-3.5 rounded-xl font-sans leading-relaxed border border-slate-800/80">
                  {item.email_body}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
