"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import { scenarios as initialScenarios } from "@/src/data/scenarios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// --- TYPES ---
type RiskResult = {
  risk_level: string;
  risk_score: number;
  risk_signals: string[];
  triggered_policies: { id: string; name: string }[];
  risk_reduction_tips: string[];
  why_not_low: string;
  explanation: string;
  recommended_action: string;
  business_impact: string;
  recommendation_impact: string;
  confidence_score: number;
};

type AuditLogEntry = {
  id: string;
  timestamp: string;
  caseId: string;
  outcome: string;
  notes: string;
};

export default function Home() {
  const [activeScenarios, setActiveScenarios] = useState(initialScenarios);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<RiskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [decision, setDecision] = useState<"Accepted" | "Overridden" | null>(null);
  const [simulationAction, setSimulationAction] = useState("");

  // Enterprise Controls State
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [sortOrder, setSortOrder] = useState<"Date" | "Score">("Date");
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [savedNotes, setSavedNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  // Persistence: Load on Mount
  useEffect(() => {
    const savedData = localStorage.getItem("risklens_storage_v4");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setAuditLog(parsed.auditLog || []);
      setSavedNotes(parsed.savedNotes || {});
      setFeedback(parsed.feedback || {});
    }
  }, []);

  // Persistence: Save on Change
  useEffect(() => {
    localStorage.setItem("risklens_storage_v4", JSON.stringify({
      auditLog,
      savedNotes,
      feedback
    }));
  }, [auditLog, savedNotes, feedback]);

  // Handle Note Switching
  useEffect(() => {
    if (selectedId) {
      setNotes(savedNotes[selectedId] || "");
      setDecision(null);
      setSimulationAction("");
    }
  }, [selectedId, savedNotes]);

  const saveCurrentNote = (text: string) => {
    setNotes(text);
    if (selectedId) {
      setSavedNotes(prev => ({ ...prev, [selectedId]: text }));
    }
  };

  const handleFeedback = (val: "helpful" | "unhelpful") => {
    if (selectedId) {
      setFeedback(prev => ({ ...prev, [selectedId]: val }));
    }
  };

  // Computed Scenarios for Inbox
  const filteredScenarios = useMemo(() => {
    return activeScenarios
      .filter((s) => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = riskFilter === "All" || s.risk === riskFilter;
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (sortOrder === "Score") {
          const scoreA = a.risk === "High" ? 88 : a.risk === "Medium" ? 65 : 12;
          const scoreB = b.risk === "High" ? 88 : b.risk === "Medium" ? 65 : 12;
          return scoreB - scoreA;
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [searchQuery, riskFilter, sortOrder, activeScenarios]);

  const analyzeRisk = useCallback(async (id: string, scenarioData?: any) => {
    setLoading(true);

    // Optimistic UI updates handled by React state
    const scenario = scenarioData || activeScenarios.find((s) => s.id === id);
    if (!scenario) return;

    if (!scenarioData) setSelectedId(id);

    try {
      const res = await fetch("/api/analyze-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario.data),
      });

      const data = await res.json();
      setResult(data);
      setLoading(false);
    } catch (e) {
      console.error("Analysis failed", e);
      setLoading(false);
    }
  }, [activeScenarios]);

  const handleDecision = (outcome: "Accepted" | "Overridden") => {
    setDecision(outcome);
    if (!selectedId) return;

    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      caseId: selectedId,
      outcome: outcome,
      notes: notes ? notes.slice(0, 40) + "..." : "-"
    };
    setAuditLog(prev => [newLog, ...prev]);
  };

  const currentScenario = useMemo(() =>
    activeScenarios.find(s => s.id === selectedId),
    [activeScenarios, selectedId]);

  // --- WINNING LAYER HELPERS ---
  const getRiskPercentile = useMemo(() => {
    if (!result || !currentScenario) return 0;
    const total = activeScenarios.length;
    let lowerRiskCount = 0;
    if (result.risk_level === "High") {
      lowerRiskCount = activeScenarios.filter(s => s.risk !== "High").length;
    } else if (result.risk_level === "Medium") {
      lowerRiskCount = activeScenarios.filter(s => s.risk === "Low").length;
    } else {
      lowerRiskCount = 0;
    }
    return Math.round((lowerRiskCount / total) * 100);
  }, [result, activeScenarios, currentScenario]);


  // --- SIMULATION LOGIC ---
  const handleSimulation = (action: string) => {
    setSimulationAction(action);
    if (!currentScenario) return;

    const updatedData = { ...currentScenario.data };
    let newHistory = [...currentScenario.visualizationData.history];

    // Mutate mock data based on action
    if (action === "withdrawal") {
      updatedData.withdrawal_attempts += 1;
      newHistory.push({ day: "Now", score: 95 });
    } else if (action === "profile") {
      updatedData.profile_changes += 1;
      newHistory.push({ day: "Now", score: 65 });
    } else if (action === "geo") {
      updatedData.geo_switches += 1;
      newHistory.push({ day: "Now", score: 80 });
    }

    // Update local state
    const updatedScenario = {
      ...currentScenario,
      data: updatedData,
      visualizationData: { ...currentScenario.visualizationData, history: newHistory }
    };

    const newScenarios = activeScenarios.map(s => s.id === selectedId ? updatedScenario : s);
    setActiveScenarios(newScenarios);

    // Re-run analysis immediately
    analyzeRisk(currentScenario.id, updatedScenario);
  };

  // --- EXPORT LOGIC ---
  const handleExportCase = () => {
    if (!result || !currentScenario) return;
    const exportData = {
      metadata: currentScenario,
      analysis: result,
      analyst_notes: notes,
      decision_log: auditLog.filter(l => l.caseId === currentScenario.id)
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CASE-${currentScenario.id}.json`;
    a.click();
  };

  const handleExportQueue = () => {
    const headers = ["ID", "Name", "Date", "Risk", "Active Signals"];
    const rows = activeScenarios.map(s => [
      s.id,
      s.name,
      s.date,
      s.risk,
      "View Detail"
    ]);
    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "risk_queue_export.csv");
    document.body.appendChild(link);
    link.click();
  };


  // --- STYLING HELPERS (Black & Beige Theme) ---

  const getRiskBadgeColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high": return "bg-red-900/40 text-red-200 border border-red-800";
      case "medium": return "bg-amber-900/40 text-amber-200 border border-amber-800";
      case "low": return "bg-emerald-900/40 text-emerald-200 border border-emerald-800";
      default: return "bg-neutral-800 text-neutral-400 border border-neutral-700";
    }
  };

  const getPriority = (risk: string) => {
    if (risk === "High") return { label: "P1", color: "bg-[#1A1A1A] text-[#D4B483] border-[#333]" };
    if (risk === "Medium") return { label: "P2", color: "bg-[#141414] text-[#A6A6A6] border-[#262626]" };
    return { label: "P3", color: "bg-[#0F0F0F] text-[#666] border-[#1F1F1F]" };
  };

  const getSLA = (risk: string) => {
    if (risk === "High") return { text: "4h left", color: "text-red-400 font-medium" };
    if (risk === "Medium") return { text: "24h left", color: "text-amber-400 font-medium" };
    return { text: "3d left", color: "text-[#666]" };
  };

  // Chart Data Preparation - Beige/Gold Tones
  const portfolioData = [
    { name: "High", value: activeScenarios.filter(s => s.risk === "High").length, color: "#991b1b" }, // Red-800
    { name: "Medium", value: activeScenarios.filter(s => s.risk === "Medium").length, color: "#92400e" }, // Amber-800
    { name: "Low", value: activeScenarios.filter(s => s.risk === "Low").length, color: "#166534" }, // Emerald-800
  ];

  return (
    <main className="min-h-screen bg-[#050505] font-sans text-[#E5E5E0] pb-12 selection:bg-[#D4B483] selection:text-black">
      {/* Top Navigation Bar */}
      <nav className="bg-[#0A0A0A] px-6 py-4 border-b border-[#1F1F1F] sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 relative">
                <Image
                  src="/risklens-logo.png"
                  alt="RiskLens"
                  fill
                  className="object-contain" // Preserves transparency/aspect ratio
                />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-[#E5E5E0]">RiskLens</h1>
                <p className="text-[9px] text-[#888] font-medium tracking-widest uppercase">Compliance Engine</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-1 pl-6">
              <button className="px-3 py-1.5 text-[11px] font-medium text-[#D4B483] border-b border-[#D4B483]">Dashboard</button>
              <button className="px-3 py-1.5 text-[11px] font-medium text-[#666] hover:text-[#999] transition-colors">Policies</button>
              <button className="px-3 py-1.5 text-[11px] font-medium text-[#666] hover:text-[#999] transition-colors">Audit Log</button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={handleExportQueue} className="text-[11px] font-medium text-[#666] hover:text-[#D4B483] transition-colors flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              EXPORT CSV
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-[#1F1F1F]">
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-semibold text-[#CCC]">Alex Chen</p>
                <p className="text-[9px] text-[#666] uppercase">Sr. Risk Analyst</p>
              </div>
              <div className="h-7 w-7 rounded bg-[#1A1A1A] border border-[#333] flex items-center justify-center text-[10px] font-bold text-[#D4B483]">
                AC
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">

        {/* LEFT COLUMN: CONTROLS & INBOX (4 cols) */}
        <div className="lg:col-span-4 space-y-4">

          {/* Portfolio & Controls Widget */}
          <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-5">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-2">Caseload Status</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-light text-[#E5E5E0]">{activeScenarios.length}</span>
                  <span className="text-[10px] font-medium text-[#888]">Active Investigations</span>
                </div>
              </div>
              <div className="h-12 w-12 opacity-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={portfolioData} cx="50%" cy="50%" innerRadius={10} outerRadius={22} dataKey="value" stroke="none">
                      {portfolioData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Queue Controls */}
            <div className="space-y-2">
              <div className="relative group">
                <svg className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#444] group-focus-within:text-[#D4B483] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  placeholder="SEARCH CASE ID..."
                  className="w-full text-[11px] font-mono border border-[#1F1F1F] rounded-sm pl-9 py-2 bg-[#0F0F0F] text-[#CCC] focus:border-[#D4B483] focus:ring-0 focus:outline-none placeholder:text-[#444] transition-colors"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="flex-1 text-[11px] font-medium border border-[#1F1F1F] rounded-sm px-2 py-2 bg-[#0F0F0F] text-[#CCC] focus:border-[#D4B483] focus:ring-0 focus:outline-none"
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value as any)}
                >
                  <option value="All">FILTER: ALL RISKS</option>
                  <option value="High">FILTER: HIGH RISK</option>
                  <option value="Medium">FILTER: MEDIUM RISK</option>
                  <option value="Low">FILTER: LOW RISK</option>
                </select>
                <select
                  className="flex-1 text-[11px] font-medium border border-[#1F1F1F] rounded-sm px-2 py-2 bg-[#0F0F0F] text-[#CCC] focus:border-[#D4B483] focus:ring-0 focus:outline-none"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                >
                  <option value="Date">SORT: NEWEST</option>
                  <option value="Score">SORT: CRITICALITY</option>
                </select>
              </div>
            </div>
          </div>

          {/* Case Inbox */}
          <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] overflow-hidden flex flex-col h-[580px]">
            <div className="px-5 py-3 border-b border-[#1F1F1F] flex justify-between items-center bg-[#0F0F0F]">
              <h2 className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Priority Queue</h2>
              <button onClick={() => window.location.reload()} className="text-[9px] font-bold text-[#D4B483] hover:text-[#E5D4A3] uppercase tracking-wide">
                Refresh Data
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-0 scrollbar-thin scrollbar-thumb-[#222] scrollbar-track-transparent">
              {filteredScenarios.map((s) => {
                const priority = getPriority(s.risk);
                const sla = getSLA(s.risk);
                const isSelected = selectedId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => analyzeRisk(s.id)}
                    className={`w-full text-left p-4 border-b border-[#141414] transition-all group relative ${isSelected ? "bg-[#141414] border-l-2 border-l-[#D4B483]" : "bg-[#0A0A0A] hover:bg-[#111] border-l-2 border-l-transparent"}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm border ${priority.color}`}>
                          {priority.label}
                        </span>
                        <span className="text-[10px] font-mono text-[#555]">#{s.id.substring(0, 6).toUpperCase()}</span>
                      </div>
                      <span className={`text-[9px] ${sla.color} tracking-wide uppercase`}>{sla.text}</span>
                    </div>

                    <h3 className={`text-sm font-medium mb-2 truncate pr-4 ${isSelected ? "text-[#E5E5E0]" : "text-[#999] group-hover:text-[#E5E5E0]"}`}>
                      {s.name}
                    </h3>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-medium text-[#444] uppercase tracking-wide">{s.date}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest border ${getRiskBadgeColor(s.risk)}`}>
                        {s.risk}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Decision Audit Trail */}
          <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-0 h-[220px] flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-[#1F1F1F] bg-[#0F0F0F]">
              <h2 className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Session Audit</h2>
            </div>

            <div className="overflow-y-auto flex-1">
              {auditLog.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0A0A0A] text-[#444] font-semibold border-b border-[#141414] sticky top-0">
                    <tr>
                      <th className="px-5 py-2 font-medium">TIME</th>
                      <th className="px-2 py-2 font-medium">CASE</th>
                      <th className="px-2 py-2 font-medium">TYPE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#141414]">
                    {auditLog.map((log) => (
                      <tr key={log.id} className="hover:bg-[#111] transition-colors">
                        <td className="px-5 py-2.5 text-[#666] whitespace-nowrap font-mono text-[10px]">{log.timestamp}</td>
                        <td className="px-2 py-2.5 font-mono text-[#666] text-[10px]">#{log.caseId?.substring(0, 4)}</td>
                        <td className="px-2 py-2.5">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-tight ${log.outcome === "Accepted" ? "text-emerald-500 bg-emerald-950/30 border border-emerald-900" : "text-[#888] bg-[#1A1A1A] border border-[#333]"}`}>
                            {log.outcome === "Accepted" ? "APPROVED" : "OVERRIDE"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-4 text-center opacity-40">
                  <span className="text-[10px] text-[#666] uppercase tracking-widest">No Activity Logged</span>
                </div>
              )}
            </div>
          </div>

        </div>


        {/* RIGHT COLUMN: INTELLIGENCE DASHBOARD (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {!result ? (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] border-dashed text-[#333]">
              <div className="w-16 h-16 mb-4 opacity-20 relative">
                <Image src="/RiskLens.png" alt="Logo" fill className="object-contain grayscale" />
              </div>
              <div className="text-center max-w-xs">
                <p className="text-sm font-medium text-[#666] mb-1 uppercase tracking-widest">System Ready</p>
                <p className="text-xs text-[#444]">Select a case record to initialize risk analysis engine.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">

              {/* HERO CARD: Executive Intelligence */}
              <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-0 overflow-hidden relative">
                <div className={`h-1 w-full ${result.risk_level === "High" ? "bg-red-800" : result.risk_level === "Medium" ? "bg-amber-700" : "bg-emerald-800"}`}></div>

                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Score Logic */}
                    <div className="flex-shrink-0 relative">
                      <div className="flex flex-col items-center">
                        <span className="text-6xl font-light tracking-tighter text-[#E5E5E0] mb-2">{result.risk_score}</span>
                        <span className={`px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest border ${getRiskBadgeColor(result.risk_level)}`}>
                          {result.risk_level} Risk
                        </span>
                      </div>
                    </div>

                    {/* Summary Logic */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4B483]"></div>
                        <h2 className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Executive Summary</h2>
                      </div>
                      <p className="text-lg text-[#CCC] leading-relaxed font-light mb-6 border-l-2 border-[#1F1F1F] pl-4">
                        &quot;{result.explanation}&quot;
                      </p>

                      <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs border-t border-[#1F1F1F] pt-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[#666] uppercase text-[10px] tracking-wider">Queue Percentile:</span>
                          <span className="text-[#E5E5E0] font-mono">Top {100 - getRiskPercentile}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#666] uppercase text-[10px] tracking-wider">Model Confidence:</span>
                          <span className="text-[#D4B483] font-mono">{Math.round(result.confidence_score * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Banner */}
                <div className="bg-[#0F0F0F] px-6 py-4 border-t border-[#1F1F1F] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest block">Recommended Action</span>
                    <span className="text-xs font-bold text-[#D4B483] uppercase tracking-wide flex items-center gap-2">
                      {result.recommended_action}
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </span>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest block">Impact Projection</span>
                    <span className="text-[10px] font-medium text-[#CCC] bg-[#1A1A1A] px-2 py-1 rounded-sm border border-[#333]">
                      {result.recommendation_impact}
                    </span>
                  </div>
                </div>
              </div>


              {/* Comparison & Context Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Business Context */}
                <div className="md:col-span-2 bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-5">
                  <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-3">
                    Strategic Context
                  </h3>
                  <p className="text-sm font-light text-[#BBB] leading-relaxed">
                    {result.business_impact}
                  </p>
                </div>

                {/* Simulation Widget */}
                <div className="bg-[#0F0F0F] rounded-sm border border-[#1F1F1F] p-5">
                  <h3 className="text-[10px] font-bold text-[#D4B483] uppercase tracking-widest mb-3 opacity-80">Simulation Engine</h3>
                  <select
                    className="w-full text-[10px] font-medium uppercase tracking-wide border border-[#333] bg-[#0A0A0A] text-[#CCC] rounded-sm focus:border-[#D4B483] focus:ring-0 focus:outline-none mb-3 py-2"
                    value={simulationAction}
                    onChange={(e) => handleSimulation(e.target.value)}
                  >
                    <option value="">Run Scenario...</option>
                    <option value="withdrawal">Scenario: Withdrawal</option>
                    <option value="profile">Scenario: Profile Edit</option>
                    <option value="geo">Scenario: Geo-Hop</option>
                  </select>
                  {simulationAction && (
                    <p className="text-[9px] text-[#888] border-t border-[#222] pt-2">
                      Running local inference on mock parameters.
                    </p>
                  )}
                </div>
              </div>


              {/* Explainability Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-5 relative overflow-hidden">
                  <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-4 border-b border-[#1F1F1F] pb-2">Analysis Vectors</h3>
                  <ul className="text-xs text-[#999] leading-relaxed space-y-3 font-mono">
                    {result.risk_signals.map((signal, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <div className="mt-1 w-1 h-1 rounded-full bg-[#D4B483]"></div>
                        {signal}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#111] rounded-sm border border-[#1F1F1F] p-5 relative overflow-hidden">
                  <h3 className="text-[10px] font-bold text-[#555] uppercase tracking-widest mb-4 border-b border-[#222] pb-2">Counterfactual</h3>
                  <p className="text-xs leading-relaxed text-[#888] font-mono">
                    &quot;{result.why_not_low}&quot;
                  </p>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Risk Velocity */}
                <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Velocity Trend (72h)</h3>
                    <span className="text-[9px] text-[#D4B483] border border-[#D4B483]/30 px-1.5 py-0.5 rounded-sm">LIVE</span>
                  </div>
                  <div className="h-40 w-full opacity-90">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={currentScenario?.visualizationData.history}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={result.risk_level === "High" ? "#991b1b" : "#D4B483"} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={result.risk_level === "High" ? "#991b1b" : "#D4B483"} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#444', fontFamily: 'monospace' }} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ fontSize: '11px', backgroundColor: '#000', borderColor: '#333', color: '#ccc' }}
                          itemStyle={{ color: '#999' }}
                        />
                        <Area type="monotone" dataKey="score" stroke={result.risk_level === "High" ? "#ef4444" : "#D4B483"} fillOpacity={1} fill="url(#colorScore)" strokeWidth={1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Factor Analysis */}
                <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-5">
                  <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-4">Factor Weighting</h3>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={currentScenario?.visualizationData.breakdown} margin={{ top: 0, right: 10, left: 10, bottom: 0 }} barCategoryGap={10}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="signal" type="category" width={70} tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#666', fontWeight: 400, fontFamily: 'monospace' }} />
                        <Tooltip cursor={{ fill: '#1a1a1a' }} contentStyle={{ fontSize: '11px', backgroundColor: '#000', borderColor: '#333', color: '#ccc' }} />
                        <Bar dataKey="impact" fill="#333" radius={[0, 2, 2, 0]} barSize={8} background={{ fill: '#0F0F0F' }}>
                          {currentScenario?.visualizationData.breakdown.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#555' : '#777'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Decision Workflow */}
              <div className="bg-[#0F0F0F] rounded-sm border border-[#1F1F1F] p-6">
                <h3 className="text-sm font-bold text-[#E5E5E0] mb-6 flex items-center gap-2">
                  <span className="w-1 h-3 bg-[#D4B483]"></span>
                  Compliance Determination
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[9px] font-bold text-[#666] uppercase tracking-widest mb-2">
                      Analyst Notes
                    </label>
                    <textarea
                      className="w-full border border-[#333] rounded-sm bg-[#050505] text-sm text-[#CCC] p-3 focus:border-[#D4B483] focus:ring-0 focus:outline-none min-h-[100px] placeholder-[#333] font-mono"
                      placeholder=">> ENTER CASE JUSTIFICATION..."
                      value={notes}
                      onChange={(e) => saveCurrentNote(e.target.value)}
                    />
                    {/* Analyst Feedback Loop */}
                    <div className="mt-4 flex items-center justify-between text-[10px] text-[#555] border-t border-[#222] pt-3 uppercase tracking-wide">
                      <span>Feedback Loop</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFeedback("helpful")}
                          className={`px-3 py-1.5 rounded-sm border text-[9px] font-bold transition-colors ${selectedId && feedback[selectedId] === 'helpful' ? 'bg-[#1A1A1A] border-[#D4B483] text-[#D4B483]' : 'bg-[#0A0A0A] border-[#333] hover:border-[#666]'}`}
                        >
                          ACCURATE
                        </button>
                        <button
                          onClick={() => handleFeedback("unhelpful")}
                          className={`px-3 py-1.5 rounded-sm border text-[9px] font-bold transition-colors ${selectedId && feedback[selectedId] === 'unhelpful' ? 'bg-[#1A1A1A] border-red-900 text-red-500' : 'bg-[#0A0A0A] border-[#333] hover:border-[#666]'}`}
                        >
                          FLAG ISSUE
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between">
                    <div>
                      <label className="block text-[9px] font-bold text-[#666] uppercase tracking-widest mb-2">
                        Final Outcome
                      </label>
                      <div className="flex gap-3 mb-4">
                        <button
                          onClick={() => handleDecision("Accepted")}
                          className={`flex-1 px-4 py-3 rounded-sm text-xs font-bold uppercase tracking-wider transition-all border ${decision === "Accepted"
                              ? "bg-[#D4B483] border-[#D4B483] text-black"
                              : "bg-[#0A0A0A] border-[#333] text-[#666] hover:text-[#CCC] hover:border-[#666]"
                            }`}
                        >
                          Accept Logic
                        </button>
                        <button
                          onClick={() => handleDecision("Overridden")}
                          className={`flex-1 px-4 py-3 rounded-sm text-xs font-bold uppercase tracking-wider transition-all border ${decision === "Overridden"
                              ? "bg-[#333] border-[#555] text-white"
                              : "bg-[#0A0A0A] border-[#333] text-[#666] hover:text-[#CCC] hover:border-[#666]"
                            }`}
                        >
                          Override
                        </button>
                      </div>

                      {decision && (
                        <div className="bg-[#111] border border-[#222] rounded-sm p-3 text-center animate-in zoom-in-95 duration-200">
                          <p className="text-[9px] text-[#555] uppercase tracking-widest font-bold mb-1">Status</p>
                          <p className={`text-sm font-bold uppercase tracking-wide ${decision === "Accepted" ? "text-emerald-500" : "text-[#D4B483]"}`}>
                            {decision === "Accepted" ? "Recommendation Accepted" : "Overridden by Analyst"}
                          </p>
                        </div>
                      )}
                    </div>

                    <p className="text-[9px] text-[#444] mt-4 leading-tight uppercase tracking-wider">
                      * Decisions logged in immutable audit ledger v4.2
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </main>
  );
}
