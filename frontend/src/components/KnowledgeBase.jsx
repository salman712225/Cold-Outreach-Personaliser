import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Plus, 
  Trash2, 
  Search, 
  Tag, 
  BookOpen, 
  CheckCircle2,
  Sparkles,
  FileText,
  Award
} from 'lucide-react';
import { api } from '../services/api';

export default function KnowledgeBase() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('case_study');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  // Search Tester
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const data = await api.listKnowledgeDocs();
      setDocs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleAddDoc = async (e) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      await api.addKnowledgeDoc({
        title,
        category,
        content,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean)
      });
      setTitle('');
      setContent('');
      setTags('');
      setShowAddModal(false);
      fetchDocs();
    } catch (err) {
      alert(`Failed to add doc: ${err.message}`);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this knowledge doc?")) return;
    try {
      await api.deleteKnowledgeDoc(docId);
      fetchDocs();
    } catch (err) {
      alert("Failed to delete doc");
    }
  };

  const handleSearchTest = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await fetch(`http://localhost:8000/api/rag/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
            <Database className="w-3.5 h-3.5" />
            Company Knowledge & Case Studies RAG
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Knowledge Base & Tone Anchors
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Store your verified case studies, ROI metrics, product capabilities, and top-performing cold email templates. The LangGraph RAG agent dynamically injects these into every generation.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition glow-purple"
        >
          <Plus className="w-4 h-4" />
          <span>Add Knowledge Document</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Knowledge Chunks List (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              Active Knowledge Chunks ({docs.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading knowledge base...</div>
          ) : docs.length === 0 ? (
            <div className="glass-panel p-8 rounded-xl text-center text-xs text-slate-400">
              No knowledge documents yet. Click "Add Knowledge Document" to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {docs.map((doc) => (
                <div key={doc.id} className="glass-panel p-5 rounded-xl space-y-3 glass-panel-hover">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{doc.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          {doc.category.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Delete Doc"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950/60 p-3.5 rounded-lg font-sans border border-slate-800/80">
                    {doc.content}
                  </p>

                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {doc.tags.map((tag, i) => (
                        <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 font-mono">
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vector Search Sandbox (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-400" />
              Test Semantic RAG Retrieval
            </h3>
            <p className="text-xs text-slate-400">
              Query your knowledge base to preview which case studies and proof points will be retrieved for a given prospect challenge.
            </p>

            <form onSubmit={handleSearchTest} className="space-y-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. database latency or SDR conversion"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-400 border border-slate-700 transition"
              >
                Search Knowledge Base
              </button>
            </form>

            {searchResults && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Top Matches:</span>
                {searchResults.length === 0 ? (
                  <p className="text-xs text-slate-500">No matching documents found.</p>
                ) : (
                  searchResults.map((r, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                      <span className="font-bold text-slate-200">{r.title}</span>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{r.content}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full space-y-5 border border-slate-700">
            <h3 className="text-base font-bold text-white">Add Knowledge Document</h3>
            <form onSubmit={handleAddDoc} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Document Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Fintech Enterprise Case Study"
                  required
                  className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="case_study">Case Study (Proof & Metrics)</option>
                  <option value="value_prop">Value Proposition (Product Offer)</option>
                  <option value="winning_template">Winning Email Template (Voice Reference)</option>
                  <option value="company_offer">Company Overview</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Content / Case Study Text</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  required
                  placeholder="Describe the exact metrics, pain points solved, and customer outcome..."
                  className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. saas, latency, roi, devops"
                  className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs shadow-lg shadow-purple-500/25"
                >
                  Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
