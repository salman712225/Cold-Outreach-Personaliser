import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Play, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle,
  BarChart3,
  Cpu
} from 'lucide-react';
import { api } from '../services/api';

export default function LangSmithEval() {
  const [evalStatus, setEvalStatus] = useState(null);
  const [running, setRunning] = useState(false);
  const [evalResults, setEvalResults] = useState(null);

  useEffect(() => {
    api.getEvalStatus().then(setEvalStatus).catch(console.error);
  }, []);

  const handleRunSuite = async () => {
    setRunning(true);
    try {
      const data = await api.runEvaluationSuite();
      setEvalResults(data);
    } catch (err) {
      alert(`Evaluation run failed: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" />
            LangSmith Tracing & Evaluation Suite
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            LangSmith Observability & Benchmarking
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Evaluate Anti-AI cold outreach across standardized golden datasets. Tracks latency, cliché suppression, Flesch reading score, and Claude generation metrics.
          </p>
        </div>

        <button
          onClick={handleRunSuite}
          disabled={running}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all ${
            running
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white shadow-emerald-500/25 glow-emerald'
          }`}
        >
          {running ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Running Evaluation Suite...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Run LangSmith Benchmark Suite</span>
            </>
          )}
        </button>
      </div>

      {/* Observability Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Tracing Status
          </span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-bold text-white">
              {evalStatus?.langsmith_tracing ? "Active (V2)" : "Enabled"}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Project: {evalStatus?.project || "cold-outreach-personaliser"}
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            AI Architecture
          </span>
          <div className="text-sm font-bold text-white">
            {evalStatus?.model || "Claude 3.5 Sonnet"}
          </div>
          <p className="text-[11px] text-slate-400">
            Supervisor + Research + RAG + Critic Graph
          </p>
        </div>

        <div className="glass-panel p-5 rounded-2xl space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
            Evaluation Criteria
          </span>
          <div className="text-sm font-bold text-white">
            Anti-AI & Deliverability
          </div>
          <p className="text-[11px] text-slate-400">
            Target Anti-AI Score: &gt; 85%
          </p>
        </div>
      </div>

      {/* Benchmark Results */}
      {evalResults ? (
        <div className="glass-panel p-6 rounded-2xl space-y-6 animate-fadeIn">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-bold">Avg Anti-AI Score</span>
              <div className="text-xl font-black text-emerald-400">
                {evalResults.average_anti_ai_score}%
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-bold">Avg Pipeline Latency</span>
              <div className="text-xl font-black text-cyan-400">
                {evalResults.average_latency_seconds}s
              </div>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase font-bold">Benchmark Profiles</span>
              <div className="text-xl font-black text-purple-400">
                {evalResults.benchmark_count} / {evalResults.benchmark_count} PASSED
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Evaluation Profiles Breakdown:</h3>
            <div className="grid grid-cols-1 gap-4">
              {evalResults.results.map((res, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm text-white">{res.prospect_name}</span>
                      <span className="text-xs text-slate-400 ml-2">({res.prospect_company})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {res.anti_ai_score}% Human Score
                      </span>
                      <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {res.latency_seconds}s
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        {res.status}
                      </span>
                    </div>
                  </div>

                  <div className="font-mono text-xs text-emerald-300">
                    Subject: {res.selected_subject}
                  </div>

                  <div className="text-xs text-slate-300 whitespace-pre-wrap bg-slate-900/60 p-3 rounded-lg">
                    {res.email_body}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 border-dashed border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 border border-slate-700/60">
            <Activity className="w-8 h-8 text-emerald-400/60" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-base font-bold text-slate-200">Evaluation Suite Idle</h3>
            <p className="text-xs text-slate-400">
              Click "Run LangSmith Benchmark Suite" above to run automated regression and anti-AI scoring against test personas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
