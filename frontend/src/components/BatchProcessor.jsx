import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  Download, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Layers, 
  Table, 
  Play, 
  Copy,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function BatchProcessor() {
  const [file, setFile] = useState(null);
  const [tone, setTone] = useState("Casual & Direct");
  const [goal, setGoal] = useState("Book a 15-min discovery call");
  const [valueProp, setValueProp] = useState("Cut cloud vector database compute costs by 52% with semantic deduplication");

  const [loading, setLoading] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadAndRun = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tone", tone);
    formData.append("goal", goal);
    formData.append("value_proposition", valueProp);

    try {
      const job = await api.uploadBatchCSV(formData);
      setActiveJob(job);
      startPolling(job.id);
    } catch (err) {
      alert(`Batch upload failed: ${err.message}`);
      setLoading(false);
    }
  };

  const startPolling = (jobId) => {
    const interval = setInterval(async () => {
      try {
        const updated = await api.getBatchStatus(jobId);
        setActiveJob(updated);
        if (updated.status === 'completed' || updated.status === 'failed') {
          clearInterval(interval);
          setLoading(false);
        }
      } catch (err) {
        clearInterval(interval);
        setLoading(false);
      }
    }, 1500);
    setPollingInterval(interval);
  };

  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  const progressPct = activeJob && activeJob.total_rows > 0
    ? Math.round((activeJob.completed_rows / activeJob.total_rows) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            High-Throughput Batch Personaliser Engine
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Batch Outreach CSV Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Upload a CSV of prospects and generate personalized Anti-AI emails, subject lines, and multi-step follow-ups for every single contact at scale.
          </p>
        </div>

        {/* Download Sample CSV */}
        <a
          href={api.getSampleTemplateUrl()}
          download
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition shadow-sm"
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Download Sample CSV Template</span>
        </a>
      </div>

      {/* Upload Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleUploadAndRun} className="glass-panel p-6 rounded-2xl space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              Upload Prospects CSV
            </h2>

            {/* Dropzone */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Select CSV File</label>
              <div className="relative border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-6 text-center transition cursor-pointer bg-slate-900/60">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <UploadCloud className="w-8 h-8 text-cyan-400/80" />
                  <div className="text-xs text-slate-300">
                    {file ? (
                      <span className="font-bold text-emerald-400">{file.name}</span>
                    ) : (
                      <span>Drop your CSV here or <span className="text-cyan-400 underline">browse</span></span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">Supported columns: Name, Company, Role, Profile, Notes</p>
                </div>
              </div>
            </div>

            {/* Campaign Parameters */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Campaign Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Casual & Direct">Casual & Direct</option>
                  <option value="Value-First Exec">Value-First Exec</option>
                  <option value="Founder-to-Founder">Founder-to-Founder</option>
                  <option value="Curious Problem-Solver">Curious Problem-Solver</option>
                  <option value="Ultra-Concise">Ultra-Concise</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Campaign Goal</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Book a 15-min discovery call">Book a 15-min discovery call</option>
                  <option value="Product Demo">Product Demo</option>
                  <option value="Partnership Pitch">Partnership Pitch</option>
                  <option value="Feedback on tool">Feedback on tool</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Value Proposition / Offer</label>
                <input
                  type="text"
                  value={valueProp}
                  onChange={(e) => setValueProp(e.target.value)}
                  className="mt-1 w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Cut cloud database spend by 52%"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                loading || !file
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 glow-cyan'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Processing Batch Campaign ({progressPct}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Launch Batch Personalization</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Progress & Enriched Results (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {activeJob ? (
            <div className="glass-panel p-6 rounded-2xl space-y-6 animate-fadeIn">
              {/* Status & Export Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{activeJob.filename}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      activeJob.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    }`}>
                      {activeJob.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {activeJob.completed_rows} of {activeJob.total_rows} prospects generated
                  </p>
                </div>

                {activeJob.completed_rows > 0 && (
                  <a
                    href={api.getDownloadCSVUrl(activeJob.id)}
                    download
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition glow-emerald"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Enriched CSV</span>
                  </a>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Batch Completion</span>
                  <span className="font-mono font-bold text-cyan-400">{progressPct}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Enriched Rows Table */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-cyan-400" />
                  Live Enriched Output Preview:
                </span>
                <div className="max-h-[360px] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 divide-y divide-slate-800">
                  {activeJob.rows.map((row, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedRow(row)}
                      className={`p-3 text-xs transition cursor-pointer hover:bg-slate-900/80 flex items-center justify-between ${
                        selectedRow?.row_index === row.row_index ? 'bg-slate-800/80 border-l-2 border-emerald-400' : ''
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{row.name}</span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            {row.role} {row.company ? `@ ${row.company}` : ''}
                          </span>
                        </div>
                        {row.generated_subject && (
                          <div className="font-mono text-[11px] text-emerald-400 truncate max-w-md">
                            Subject: {row.generated_subject}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {row.anti_ai_score && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                            {row.anti_ai_score}% Human
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          row.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : row.status === 'processing'
                            ? 'bg-cyan-500/10 text-cyan-400 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {row.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Row Detail View */}
              {selectedRow && selectedRow.generated_email && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">
                      Prospect Preview: {selectedRow.name} ({selectedRow.company || 'Company'})
                    </span>
                    <button
                      onClick={() => {
                        const fullText = `Subject: ${selectedRow.generated_subject || ''}\n\n${selectedRow.generated_email}`;
                        navigator.clipboard.writeText(fullText);
                        alert(`Copied email for ${selectedRow.name}!`);
                      }}
                      className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-xs text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full Email</span>
                    </button>
                  </div>

                  {selectedRow.generated_subject && (
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                      <span className="font-bold text-slate-400 uppercase text-[10px] mr-2">Subject:</span>
                      <span className="font-mono text-emerald-300 font-semibold">{selectedRow.generated_subject}</span>
                    </div>
                  )}

                  <div className="text-xs text-slate-200 whitespace-pre-wrap bg-slate-950 p-3.5 rounded-lg font-sans leading-relaxed border border-slate-800">
                    {selectedRow.generated_email}
                  </div>

                  {selectedRow.generated_followup_1 && (
                    <details className="text-xs text-slate-300">
                      <summary className="cursor-pointer font-bold text-cyan-400 hover:underline">
                        View Follow-Up Sequence (Day 3 & Day 7)
                      </summary>
                      <div className="mt-2 space-y-2">
                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                          <span className="text-[10px] font-bold text-cyan-400 block mb-1">Follow-Up #1 (Day 3):</span>
                          <p className="whitespace-pre-wrap">{selectedRow.generated_followup_1}</p>
                        </div>
                        {selectedRow.generated_followup_2 && (
                          <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 block mb-1">Follow-Up #2 (Day 7 Breakup):</span>
                            <p className="whitespace-pre-wrap">{selectedRow.generated_followup_2}</p>
                          </div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 border-dashed border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 border border-slate-700/60">
                <Layers className="w-8 h-8 text-cyan-400/60" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-base font-bold text-slate-200">No Active Batch Job</h3>
                <p className="text-xs text-slate-400">
                  Upload a CSV file containing your prospects on the left to start generating personalized emails in bulk.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
