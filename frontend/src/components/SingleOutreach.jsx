import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  Globe, 
  BookOpen, 
  ChevronRight,
  ArrowRight,
  User,
  Building2,
  Briefcase,
  Mail,
  Sliders
} from 'lucide-react';
import { api } from '../services/api';

const SAMPLE_PERSONAS = [
  {
    label: "VP of Engineering",
    name: "Alex Rivera",
    company: "DataMatrix AI",
    role: "VP of Engineering",
    profile: "VP of Engineering @ DataMatrix AI. Scaling distributed LLM cache architecture from 10k to 2M DAU. Previously Lead Architect at Datadog. Hiring backend engineers.",
    goal: "Book a 15-min discovery call",
    tone: "Casual & Direct",
    valueProp: "Cut cloud vector database compute costs by 52% with semantic deduplication"
  },
  {
    label: "Head of Sales / SDR Leader",
    name: "Marcus Vance",
    company: "Apex Revenue Labs",
    role: "Head of Outbound",
    profile: "Head of Outbound @ Apex Revenue Labs. Passionate about pipeline generation and SDR team productivity. Building outbound playbooks for enterprise accounts.",
    goal: "Product Demo",
    tone: "Value-First Exec",
    valueProp: "Boost SDR meeting reply rates from 1.2% to 6.4% using trigger-based prospect research"
  },
  {
    label: "SaaS Founder & CEO",
    name: "David Sterling",
    company: "CloudVibe",
    role: "Founder & CEO",
    profile: "Founder & CEO at CloudVibe. Just raised $4M Seed round. Passionate about product-led growth and modern remote work productivity.",
    goal: "Book a 15-min discovery call",
    tone: "Founder-to-Founder",
    valueProp: "Help early-stage B2B founders double their demo bookings without hiring full-time SDRs"
  }
];

export default function SingleOutreach({ onSaved }) {
  const [profileText, setProfileText] = useState(SAMPLE_PERSONAS[0].profile);
  const [prospectName, setProspectName] = useState(SAMPLE_PERSONAS[0].name);
  const [prospectCompany, setProspectCompany] = useState(SAMPLE_PERSONAS[0].company);
  const [prospectRole, setProspectRole] = useState(SAMPLE_PERSONAS[0].role);
  const [tone, setTone] = useState(SAMPLE_PERSONAS[0].tone);
  const [goal, setGoal] = useState(SAMPLE_PERSONAS[0].goal);
  const [valueProp, setValueProp] = useState(SAMPLE_PERSONAS[0].valueProp);
  const [customInstructions, setCustomInstructions] = useState('');
  const [enableWebResearch, setEnableWebResearch] = useState(true);
  const [enableRAG, setEnableRAG] = useState(true);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState('email'); // email, followups, critic

  const handleApplyPersona = (p) => {
    setProfileText(p.profile);
    setProspectName(p.name);
    setProspectCompany(p.company);
    setProspectRole(p.role);
    setTone(p.tone);
    setGoal(p.goal);
    setValueProp(p.valueProp);
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!profileText.trim()) return;

    setLoading(true);
    try {
      const data = await api.generateOutreach({
        profile_text: profileText,
        prospect_name: prospectName,
        prospect_company: prospectCompany,
        prospect_role: prospectRole,
        tone: tone,
        goal: goal,
        value_proposition: valueProp,
        custom_instructions: customInstructions,
        enable_web_research: enableWebResearch,
        enable_rag: enableRAG
      });
      setResult(data);
      if (onSaved) onSaved();
    } catch (err) {
      alert(`Generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-[#0B0F19] border border-slate-800 p-6 sm:p-8">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Anti-AI Persona Engine • Claude 3.5 Sonnet
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Paste a Profile. Get an Email That <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Does Not Sound AI-Generated</span>.
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Eliminates sycophantic AI fluff, robot buzzwords, and template clichés. Crafted with human conversational cadence, high-context hooks, and low-friction CTAs.
            </p>
          </div>

          {/* Persona Quick Buttons */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex flex-col gap-2 min-w-[240px]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Try Instant Sample Profile:
            </span>
            <div className="flex flex-col gap-1.5">
              {SAMPLE_PERSONAS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPersona(p)}
                  className="text-left px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 hover:text-emerald-400 transition flex items-center justify-between group border border-slate-700/40"
                >
                  <span className="font-medium">{p.label}</span>
                  <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Input Form & Generated Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleGenerate} className="glass-panel p-6 rounded-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                Prospect Intelligence
              </h2>
              <span className="text-xs text-slate-400">Step 1 of 2</span>
            </div>

            {/* Profile / Bio Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Prospect Profile, Bio or LinkedIn Dump *</span>
                <span className="text-[10px] text-slate-500 font-mono">Unstructured Text OK</span>
              </label>
              <textarea
                value={profileText}
                onChange={(e) => setProfileText(e.target.value)}
                rows={4}
                className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition resize-none font-sans"
                placeholder="Paste prospect bio, LinkedIn summary, recent post, or job responsibilities..."
                required
              />
            </div>

            {/* Quick Metadata Fields */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400">Name (Optional)</label>
                <input
                  type="text"
                  value={prospectName}
                  onChange={(e) => setProspectName(e.target.value)}
                  placeholder="e.g. Alex"
                  className="w-full rounded-lg bg-slate-900/90 border border-slate-700/80 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400">Company</label>
                <input
                  type="text"
                  value={prospectCompany}
                  onChange={(e) => setProspectCompany(e.target.value)}
                  placeholder="e.g. DataMatrix"
                  className="w-full rounded-lg bg-slate-900/90 border border-slate-700/80 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-400">Role / Title</label>
                <input
                  type="text"
                  value={prospectRole}
                  onChange={(e) => setProspectRole(e.target.value)}
                  placeholder="e.g. VP Eng"
                  className="w-full rounded-lg bg-slate-900/90 border border-slate-700/80 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Tone Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Outreach Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Casual & Direct">Casual & Direct (Short, peer-to-peer, punchy)</option>
                <option value="Value-First Exec">Value-First Exec (Quantified metrics, high ROI focus)</option>
                <option value="Founder-to-Founder">Founder-to-Founder (Relatable, startup struggle hook)</option>
                <option value="Curious Problem-Solver">Curious Problem-Solver (Insightful observation question)</option>
                <option value="Ultra-Concise">Ultra-Concise (&lt;60 words, quick loom pitch)</option>
              </select>
            </div>

            {/* Goal Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Outreach Goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Book a 15-min discovery call">Book a 15-min discovery call</option>
                <option value="Product Demo">Show a quick 2-min interactive product demo</option>
                <option value="Partnership Pitch">Partnership / Strategic Collaboration</option>
                <option value="Feedback on tool">Get feedback on a new open-source or B2B tool</option>
                <option value="Follow-up on recent post">Comment on their recent blog / LinkedIn post</option>
              </select>
            </div>

            {/* Value Proposition / Offer */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Our Value Proposition / Specific Proof Point</label>
              <input
                type="text"
                value={valueProp}
                onChange={(e) => setValueProp(e.target.value)}
                placeholder="e.g. Cut cloud database spend by 52% with semantic caching"
                className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Multi-Agent Toggles */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Multi-Agent Tool Calling</span>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  Prospect Web Enrichment Tool
                </span>
                <input
                  type="checkbox"
                  checked={enableWebResearch}
                  onChange={(e) => setEnableWebResearch(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 bg-slate-800"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                  RAG Company Knowledge Base
                </span>
                <input
                  type="checkbox"
                  checked={enableRAG}
                  onChange={(e) => setEnableRAG(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 bg-slate-800"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                loading
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40 glow-emerald'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>LangGraph Agents Working (Research, RAG, Claude, Critic)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Anti-AI Cold Outreach</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Output & Anti-AI Inspector (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="glass-panel p-6 rounded-2xl space-y-6 animate-fadeIn">
              {/* Score Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-lg font-black text-emerald-400">{result.anti_ai_score}%</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-white">Anti-AI Human Score</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                        Top 1% Deliverability
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">Zero robot clichés • Natural conversational cadence</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveResultTab('email')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeResultTab === 'email'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Cold Email
                  </button>
                  <button
                    onClick={() => setActiveResultTab('followups')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeResultTab === 'followups'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Sequence (Day 3 & 7)
                  </button>
                  <button
                    onClick={() => setActiveResultTab('critic')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeResultTab === 'critic'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Critic Breakdown
                  </button>
                </div>
              </div>

              {/* Subject Lines Selector */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  Subject Line Options (A/B Test Hooks):
                </span>
                <div className="space-y-1.5">
                  {(result.subject_lines || [result.selected_subject]).map((sub, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-200 hover:border-slate-700 transition"
                    >
                      <span className="font-mono text-emerald-300">
                        <span className="text-slate-500 mr-2">[{String.fromCharCode(65 + i)}]</span>
                        {sub}
                      </span>
                      <button
                        onClick={() => copyToClipboard(sub, `sub_${i}`)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition"
                        title="Copy Subject"
                      >
                        {copiedField === `sub_${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tab Content: Single Email */}
              {activeResultTab === 'email' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Copy-Ready Email Body:</span>
                    <button
                      onClick={() => copyToClipboard(`Subject: ${result.selected_subject}\n\n${result.email_body}`, 'full_email')}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                    >
                      {copiedField === 'full_email' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Full Email</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative rounded-xl bg-slate-950/80 border border-slate-800 p-4 font-sans text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-emerald-500/30">
                    {result.email_body}
                  </div>
                </div>
              )}

              {/* Tab Content: Multi-Step Follow-Up Sequence */}
              {activeResultTab === 'followups' && (
                <div className="space-y-4">
                  {/* Follow-up 1 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5" />
                        Follow-Up #1 (Send 3 Days Later)
                      </span>
                      <button
                        onClick={() => copyToClipboard(result.followup_1, 'fu1')}
                        className="p-1 text-slate-400 hover:text-cyan-400"
                      >
                        {copiedField === 'fu1' ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 text-xs text-slate-200 whitespace-pre-wrap">
                      {result.followup_1}
                    </div>
                  </div>

                  {/* Follow-up 2 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5" />
                        Follow-Up #2 (Day 7 Polite Breakup)
                      </span>
                      <button
                        onClick={() => copyToClipboard(result.followup_2, 'fu2')}
                        className="p-1 text-slate-400 hover:text-slate-200"
                      >
                        {copiedField === 'fu2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 text-xs text-slate-200 whitespace-pre-wrap">
                      {result.followup_2}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Critic & Evaluator Inspector */}
              {activeResultTab === 'critic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">AI Clichés Found</span>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Zero clichés detected</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Reading Level</span>
                      <div className="mt-1 text-xs text-slate-200 font-semibold">
                        6th - 8th grade (Conversational)
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300">Deliverability Strengths:</span>
                    <ul className="space-y-1">
                      {result.critic_evaluation?.strengths?.map((s, idx) => (
                        <li key={idx} className="text-xs text-emerald-400 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {result.research_summary && (
                    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1">
                      <span className="text-[11px] font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        Live Web Research Hook Extracted
                      </span>
                      <p className="text-xs text-slate-400 whitespace-pre-wrap font-mono">
                        {result.research_summary}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Regenerate Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500">Need a different angle?</span>
                <button
                  onClick={() => handleGenerate()}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Generate New Variation</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 border-dashed border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 border border-slate-700/60">
                <Sparkles className="w-8 h-8 text-emerald-400/60" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-base font-bold text-slate-200">Ready to Personalize</h3>
                <p className="text-xs text-slate-400">
                  Select a sample profile or paste any prospect information on the left and click Generate to see the Anti-AI outreach sequence.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
