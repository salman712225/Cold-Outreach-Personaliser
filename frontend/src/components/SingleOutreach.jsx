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
  Sliders,
  UserCheck,
  Target
} from 'lucide-react';
import { api } from '../services/api';

const SAMPLE_PERSONAS = [
  {
    label: "🎓 Student Leave Letter",
    senderName: "Mohammed Salman",
    senderRole: "B.Tech CSE Student",
    senderCompany: "Crescent Institute",
    recipientName: "Dr. Sharma",
    recipientRole: "HOD & Professor (Computer Science)",
    recipientCompany: "Crescent Institute",
    profile: "Professor & HOD of Computer Science department overseeing B.Tech coursework and semester attendance.",
    goal: "Leave Application / Permission",
    tone: "Formal & Respectful",
    valueProp: "Severe viral fever requiring 3 days of medical rest (Oct 12 to Oct 15). Doctor certificate attached.",
    customInstructions: "Student Roll Number: CS-2024-88"
  },
  {
    label: "💼 AIML Job Application",
    senderName: "Mohammed Salman",
    senderRole: "AIML Candidate & Graduate",
    senderCompany: "Crescent Institute",
    recipientName: "Hiring Manager",
    recipientRole: "Lead AI Engineer",
    recipientCompany: "DataMatrix AI",
    profile: "Lead AI Engineer hiring for the Junior AIML role. Focused on LLM latency optimization, vector deduplication, and production inference.",
    goal: "Job Application / Interview Request",
    tone: "Polite & Professional",
    valueProp: "Cut cloud vector database compute costs by 52% with semantic deduplication",
    customInstructions: "Highlight practical hands-on project and GitHub demo link"
  },
  {
    label: "🤝 B2B Partnership",
    senderName: "Alex Rivera",
    senderRole: "Head of Technical Partnerships",
    senderCompany: "VectorDB Labs",
    recipientName: "Sarah Jenkins",
    recipientRole: "VP of Engineering",
    recipientCompany: "ScaleFlow Systems",
    profile: "VP of Engineering @ ScaleFlow. Scaling microservices architecture from 50k to 2M DAU. Interested in developer tooling.",
    goal: "Partnership / Strategic Collaboration",
    tone: "Value-First Exec",
    valueProp: "Cut incident MTTR by 45% via automated root-cause diagnosis",
    customInstructions: "Low-friction 5-minute benchmark comparison"
  },
  {
    label: "🚀 Founder Networking",
    senderName: "David Sterling",
    senderRole: "Founder & CEO",
    senderCompany: "CloudVibe",
    recipientName: "Mark Vance",
    recipientRole: "Founder & CEO",
    recipientCompany: "HyperGrowth Tech",
    profile: "Founder at HyperGrowth Tech. Scaling outbound sales pipeline with a lean remote team.",
    goal: "Book a 15-min discovery call",
    tone: "Founder-to-Founder",
    valueProp: "Boost qualified meeting booking rates by 3.2x without extra SDR headcount",
    customInstructions: "Peer founder collaboration"
  }
];

export default function SingleOutreach({ onSaved }) {
  // Sender (From) Details
  const [senderName, setSenderName] = useState(SAMPLE_PERSONAS[0].senderName);
  const [senderRole, setSenderRole] = useState(SAMPLE_PERSONAS[0].senderRole);
  const [senderCompany, setSenderCompany] = useState(SAMPLE_PERSONAS[0].senderCompany);

  // Recipient (To) Details
  const [recipientName, setRecipientName] = useState(SAMPLE_PERSONAS[0].recipientName);
  const [recipientRole, setRecipientRole] = useState(SAMPLE_PERSONAS[0].recipientRole);
  const [recipientCompany, setRecipientCompany] = useState(SAMPLE_PERSONAS[0].recipientCompany);
  const [profileText, setProfileText] = useState(SAMPLE_PERSONAS[0].profile);

  // Intent, Tone & Value Details
  const [tone, setTone] = useState(SAMPLE_PERSONAS[0].tone);
  const [goal, setGoal] = useState(SAMPLE_PERSONAS[0].goal);
  const [valueProp, setValueProp] = useState(SAMPLE_PERSONAS[0].valueProp);
  const [customInstructions, setCustomInstructions] = useState(SAMPLE_PERSONAS[0].customInstructions);
  const [enableWebResearch, setEnableWebResearch] = useState(true);
  const [enableRAG, setEnableRAG] = useState(true);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [activeResultTab, setActiveResultTab] = useState('email'); // email, followups, critic
  const [variationCount, setVariationCount] = useState(1);

  const handleApplyPersona = (p) => {
    setSenderName(p.senderName);
    setSenderRole(p.senderRole);
    setSenderCompany(p.senderCompany);
    setRecipientName(p.recipientName);
    setRecipientRole(p.recipientRole);
    setRecipientCompany(p.recipientCompany);
    setProfileText(p.profile);
    setTone(p.tone);
    setGoal(p.goal);
    setValueProp(p.valueProp);
    setCustomInstructions(p.customInstructions || '');
  };

  const handleGenerate = async (e, isVariation = false) => {
    if (e) e.preventDefault();
    if (!profileText.trim() && !recipientName.trim()) return;

    setLoading(true);
    try {
      const nextCount = isVariation ? variationCount + 1 : variationCount;
      if (isVariation) setVariationCount(nextCount);

      const instructions = isVariation 
        ? `${customInstructions ? customInstructions + '\n' : ''}[Variation Request #${nextCount}: Generate a completely distinct hook, fresh perspective, and alternative subject lines]`.trim()
        : customInstructions;

      const data = await api.generateOutreach({
        sender_name: senderName,
        sender_role: senderRole,
        sender_company: senderCompany,
        recipient_name: recipientName,
        recipient_role: recipientRole,
        recipient_company: recipientCompany,
        prospect_name: recipientName,
        prospect_company: recipientCompany,
        prospect_role: recipientRole,
        profile_text: profileText,
        tone: tone,
        goal: goal,
        value_proposition: valueProp,
        custom_instructions: instructions,
        variation_count: nextCount,
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

  const handleSelectSubject = (sub) => {
    if (result) {
      setResult({ ...result, selected_subject: sub });
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
              100% Anti-AI Persona Engine • Mistral AI
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Paste a Profile. Get an Email That <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Does Not Sound AI-Generated</span>.
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Clean separation of <strong>Sender (From)</strong> and <strong>Recipient (To)</strong>. Eliminates sycophantic AI fluff, robot buzzwords, and template clichés with human conversational cadence.
            </p>
          </div>

          {/* Persona Quick Buttons */}
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl flex flex-col gap-2 min-w-[240px]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Try Instant Sample Setup:
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
            
            {/* 1. FROM (Sender / You) */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" />
                  1. FROM (Sender / Your Details)
                </span>
                <span className="text-[10px] text-slate-400">Used for email sign-off</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-300">Your Full Name *</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g. Mohammed Salman"
                    className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-300">Your Role / Title</label>
                  <input
                    type="text"
                    value={senderRole}
                    onChange={(e) => setSenderRole(e.target.value)}
                    placeholder="e.g. B.Tech Student / AIML"
                    className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-300">Your Org / College</label>
                  <input
                    type="text"
                    value={senderCompany}
                    onChange={(e) => setSenderCompany(e.target.value)}
                    placeholder="e.g. Crescent Institute"
                    className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. TO (Recipient Details) */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  2. TO (Recipient / Prospect / Professor)
                </span>
                <span className="text-[10px] text-slate-400">Used for greeting & hook</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-300">Recipient Name</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Dr. Sharma / Sarah"
                    className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-300">Recipient Role</label>
                  <input
                    type="text"
                    value={recipientRole}
                    onChange={(e) => setRecipientRole(e.target.value)}
                    placeholder="e.g. HOD / Lead AI Engineer"
                    className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-300">Recipient Org / Univ</label>
                  <input
                    type="text"
                    value={recipientCompany}
                    onChange={(e) => setRecipientCompany(e.target.value)}
                    placeholder="e.g. Crescent / DataMatrix"
                    className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Recipient Profile / Bio */}
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-medium text-slate-300 flex items-center justify-between">
                  <span>Recipient Profile, Bio or Context Notes *</span>
                  <span className="text-[10px] text-slate-500 font-mono">Unstructured Text OK</span>
                </label>
                <textarea
                  value={profileText}
                  onChange={(e) => setProfileText(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition resize-none font-sans"
                  placeholder="Paste LinkedIn bio, department summary, job requirements, or background..."
                  required
                />
              </div>
            </div>

            {/* 3. PURPOSE, GOAL & TONE */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tone Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Email Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <optgroup label="Academic & Formal">
                      <option value="Formal & Respectful">Formal & Respectful (Professors, Management, HR)</option>
                      <option value="Polite & Professional">Polite & Professional (Job Applications, Career Outreach)</option>
                    </optgroup>
                    <optgroup label="Modern Outbound & Networking">
                      <option value="Casual & Direct">Casual & Direct (Short, peer-to-peer, punchy)</option>
                      <option value="Value-First Exec">Value-First Exec (Quantified metrics, high ROI focus)</option>
                      <option value="Founder-to-Founder">Founder-to-Founder (Relatable startup collaboration)</option>
                      <option value="Curious Problem-Solver">Curious Problem-Solver (Insightful observation)</option>
                      <option value="Ultra-Concise">Ultra-Concise (&lt;60 words, quick note)</option>
                    </optgroup>
                  </select>
                </div>

                {/* Goal Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Email Goal / Intent</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <optgroup label="🎓 Student & Academic">
                      <option value="Leave Application / Permission">Leave Application / Permission (Sick / Urgent / Family)</option>
                      <option value="Request Letter of Recommendation">Request Letter of Recommendation (LOR / Reference)</option>
                      <option value="Internship Application / Inquiry">Internship Application / Academic Project Inquiry</option>
                      <option value="Academic Admin Query">Fee / Exam / Admin Query to College</option>
                    </optgroup>
                    <optgroup label="💼 Job Seeker & Career">
                      <option value="Job Application / Interview Request">Job Application / Interview Request</option>
                      <option value="Cold Networking with Recruiter">Cold Networking with Hiring Manager / Recruiter</option>
                      <option value="Interview Follow-up & Thank You">Interview Follow-up & Thank You</option>
                    </optgroup>
                    <optgroup label="🤝 Business, Outbound & Networking">
                      <option value="Partnership / Strategic Collaboration">Partnership / Strategic Collaboration</option>
                      <option value="Book a 15-min discovery call">Book a 15-min discovery call</option>
                      <option value="Product Demo">Show a quick 2-min interactive product demo</option>
                      <option value="Feedback on tool">Get feedback on a new open-source or B2B tool</option>
                      <option value="Quick Question">Quick professional question re: workflow</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Value Proposition / Offer */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Key Reason / Value Proposition / Proof Point
                </label>
                <input
                  type="text"
                  value={valueProp}
                  onChange={(e) => setValueProp(e.target.value)}
                  placeholder="e.g. Viral fever from Oct 12-15 or Cut cloud database spend by 52%"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Custom Instructions (e.g. Roll number, links) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Additional Notes / Specific Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Student Roll No: CS-2024-88 or Include GitHub portfolio link"
                  className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
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
                  <span>Generating Persona-Aware Email with Mistral AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Anti-AI Email ({senderName || 'Sender'} ➔ {recipientName || 'Recipient'})</span>
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
                    Email Output
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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-400" />
                    Subject Line Options (Click to Select):
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">Active: {result.selected_subject ? 'Selected' : 'A'}</span>
                </div>
                <div className="space-y-1.5">
                  {(result.subject_lines || [result.selected_subject]).map((sub, i) => {
                    const isSelected = result.selected_subject === sub || (!result.selected_subject && i === 0);
                    return (
                      <div
                        key={i}
                        onClick={() => handleSelectSubject(sub)}
                        className={`cursor-pointer flex items-center justify-between p-2.5 rounded-lg border text-xs transition ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/30 shadow-sm'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isSelected ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-800 text-slate-400'
                          }`}>
                            Option {String.fromCharCode(65 + i)}
                          </span>
                          <span className="font-medium truncate">{sub}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {isSelected && (
                            <span className="text-[10px] font-semibold text-emerald-400 mr-1 hidden sm:inline">Active</span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(sub, `sub_${i}`);
                            }}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition"
                            title="Copy Subject"
                          >
                            {copiedField === `sub_${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tab Content: Single Email */}
              {activeResultTab === 'email' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">Copy-Ready Email Output:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(`Subject: ${result.selected_subject || result.subject_lines?.[0] || ''}\n\n${result.email_body}`, 'full_email')}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                      >
                        {copiedField === 'full_email' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied (Subject + Body)!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Subject + Body</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Subject Display Preview */}
                  <div className="rounded-xl bg-slate-900 border border-slate-800 p-3 flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">Subject:</span>
                    <span className="font-mono text-emerald-300 font-semibold">{result.selected_subject || result.subject_lines?.[0]}</span>
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
                  onClick={() => handleGenerate(null, true)}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Generate New Variation (#{variationCount})</span>
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
                  Select a sample profile or fill in your details (From) and your recipient (To) on the left to see the Anti-AI email output.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
