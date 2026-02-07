"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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
    const savedData = localStorage.getItem("risk_lens_storage_v3");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setAuditLog(parsed.auditLog || []);
      setSavedNotes(parsed.savedNotes || {});
      setFeedback(parsed.feedback || {});
    }
  }, []);

  // Persistence: Save on Change
  useEffect(() => {
    localStorage.setItem("risk_lens_storage_v3", JSON.stringify({
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

    // Optimistic UI updates handled by React state, but API call still async
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


  // --- HELPERS ---

  const getRiskBadgeColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high": return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10";
      case "medium": return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/10";
      case "low": return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10";
      default: return "bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/10";
    }
  };

  // Using strictly neutral badges for P1/P2/P3 to reduce color noise in inbox
  const getPriority = (risk: string) => {
    if (risk === "High") return { label: "P1", color: "bg-slate-100 text-slate-600 border-slate-200" };
    if (risk === "Medium") return { label: "P2", color: "bg-slate-50 text-slate-500 border-slate-100" };
    return { label: "P3", color: "bg-white text-slate-400 border-slate-100" };
  };

  const getSLA = (risk: string) => {
    if (risk === "High") return { text: "4h left", color: "text-red-600 font-medium" };
    if (risk === "Medium") return { text: "24h left", color: "text-amber-600 font-medium" };
    return { text: "3d left", color: "text-slate-400" };
  };

  // Chart Data Preparation
  const portfolioData = [
    { name: "High", value: activeScenarios.filter(s => s.risk === "High").length, color: "#ef4444" },
    { name: "Medium", value: activeScenarios.filter(s => s.risk === "Medium").length, color: "#f59e0b" },
    { name: "Low", value: activeScenarios.filter(s => s.risk === "Low").length, color: "#10b981" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12 selection:bg-blue-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white px-6 py-4 border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-slate-900">RiskLens</h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-wide">ENTERPRISE INTELLIGENCE</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
              <button className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white rounded shadow-sm">Dashboard</button>
              <button className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700">Policies</button>
              <button className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700">Audit</button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleExportQueue} className="text-xs font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export Queue
            </button>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-700">Alex Chen</p>
                <p className="text-[10px] text-slate-400">Sr. Risk Analyst</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-700">
                AC
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">

        {/* LEFT COLUMN: CONTROLS & INBOX (4 cols) */}
        <div className="lg:col-span-4 space-y-4">

          {/* Portfolio & Controls Widget */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Queue Overview</h2>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">{activeScenarios.length}</span>
                  <span className="text-xs font-medium text-slate-500">Active Cases</span>
                </div>
              </div>
              <div className="h-14 w-14">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={portfolioData} cx="50%" cy="50%" innerRadius={12} outerRadius={26} dataKey="value" stroke="none">
                      {portfolioData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Queue Controls */}
            <div className="space-y-3">
              <div className="relative group">
                <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  placeholder="Filter by ID or Name..."
                  className="w-full text-xs font-medium border-slate-200 rounded-lg pl-9 py-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 transition-all placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="flex-1 text-xs font-medium border-slate-200 rounded-lg px-2 py-2 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-600"
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value as any)}
                >
                  <option value="All">All Risk Levels</option>
                  <option value="High">High Risk Only</option>
                  <option value="Medium">Medium Risk Only</option>
                  <option value="Low">Low Risk Only</option>
                </select>
                <select
                  className="flex-1 text-xs font-medium border-slate-200 rounded-lg px-2 py-2 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-600"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                >
                  <option value="Date">Sort: Newest First</option>
                  <option value="Score">Sort: Highest Risk</option>
                </select>
              </div>
            </div>
          </div>

          {/* Case Inbox */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[580px]">
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Priority Queue</h2>
              <button onClick={() => window.location.reload()} className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors">
                REFRESH
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {filteredScenarios.map((s) => {
                const priority = getPriority(s.risk);
                const sla = getSLA(s.risk);
                const isSelected = selectedId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => analyzeRisk(s.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all group relative ${isSelected ? "bg-blue-50 border-blue-200 shadow-sm z-10" : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-100"}`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${priority.color}`}>
                          {priority.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">#{s.id.substring(0, 6).toUpperCase()}</span>
                      </div>
                      <span className={`text-[10px] ${sla.color} tracking-tight`}>{sla.text}</span>
                    </div>

                    <h3 className={`text-sm font-semibold mb-2 truncate pr-4 ${isSelected ? "text-blue-700" : "text-slate-700 group-hover:text-slate-900"}`}>
                      {s.name}
                    </h3>

                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-medium text-slate-400">{s.date}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getRiskBadgeColor(s.risk)}`}>
                        {s.risk}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Decision Audit Trail */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-0 h-[220px] flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Session Activity</h2>
            </div>

            <div className="overflow-y-auto flex-1">
              {auditLog.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-white text-slate-400 font-semibold border-b border-slate-50 sticky top-0">
                    <tr>
                      <th className="px-5 py-2">Time</th>
                      <th className="px-2 py-2">Case</th>
                      <th className="px-2 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {auditLog.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-2.5 text-slate-500 whitespace-nowrap font-mono text-[10px]">{log.timestamp}</td>
                        <td className="px-2 py-2.5 font-mono text-slate-500 text-[10px]">#{log.caseId?.substring(0, 4)}</td>
                        <td className="px-2 py-2.5">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${log.outcome === "Accepted" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {log.outcome}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                  <svg className="w-8 h-8 text-slate-200 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-xs text-slate-400 font-medium">No recent decisions.</p>
                </div>
              )}
            </div>
          </div>

        </div>


        {/* RIGHT COLUMN: INTELLIGENCE DASHBOARD (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {!result ? (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200 border-dashed text-slate-400">
              <div className="p-8 bg-slate-50 rounded-full mb-4">
                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div className="text-center max-w-xs">
                <p className="text-base font-semibold text-slate-700 mb-1">Select a Case</p>
                <p className="text-sm text-slate-500">Choose a case from the priority queue to view full risk intelligence.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-500">

              {/* HERO CARD: Executive Intelligence */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-0 overflow-hidden relative">
                <div className={`h-1.5 w-full ${result.risk_level === "High" ? "bg-red-500" : result.risk_level === "Medium" ? "bg-amber-500" : "bg-emerald-500"}`}></div>

                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Score Logic */}
                    <div className="flex-shrink-0 relative">
                      <div className="flex flex-col items-center">
                        <span className="text-5xl font-bold tracking-tighter text-slate-900 mb-1">{result.risk_score}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getRiskBadgeColor(result.risk_level)}`}>
                          {result.risk_level} Risk
                        </span>
                      </div>
                    </div>

                    {/* Summary Logic */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-blue-50 rounded text-blue-600">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Executive Summary</h2>
                      </div>
                      <p className="text-base md:text-lg text-slate-800 leading-snug font-medium mb-4">
                        {result.explanation}
                      </p>

                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                        <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded border border-slate-100">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                          <span className="text-slate-500 font-medium">Calculated Percentile:</span>
                          <span className="text-slate-900 font-bold">Top {100 - getRiskPercentile}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded border border-slate-100">
                          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className="text-slate-500 font-medium">Confidence:</span>
                          <span className="text-slate-900 font-bold">{Math.round(result.confidence_score * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Banner */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recommended Action</span>
                    <span className="text-sm font-bold text-blue-700 flex items-center gap-2">
                      {result.recommended_action}
                      <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Projected Impact</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                      {result.recommendation_impact}
                    </span>
                  </div>
                </div>
              </div>


              {/* Comparison & Context Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Business Context */}
                <div className="md:col-span-2 bg-gradient-to-br from-white to-slate-50 rounded-xl border border-slate-200 p-5 shadow-sm">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                    Strategic Context
                  </h3>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">
                    {result.business_impact}
                  </p>
                </div>

                {/* Simulation Widget */}
                <div className="bg-purple-50/50 rounded-xl border border-purple-100 p-5 shadow-sm">
                  <h3 className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-3">Predictive Sim</h3>
                  <select
                    className="w-full text-xs border-purple-200 bg-white rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 mb-2 py-2"
                    value={simulationAction}
                    onChange={(e) => handleSimulation(e.target.value)}
                  >
                    <option value="">Simulate Event...</option>
                    <option value="withdrawal">Attempt Withdrawal</option>
                    <option value="profile">Edit Profile</option>
                    <option value="geo">Change Location</option>
                  </select>
                  {simulationAction && (
                    <p className="text-[10px] text-purple-700 font-medium animate-in fade-in">
                      Risk recalculated based on simulated input.
                    </p>
                  )}
                </div>
              </div>


              {/* Explainability Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 relative overflow-hidden group hover:border-blue-200 transition-colors">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">Why High Risk?</h3>
                  <ul className="text-sm text-slate-700 leading-relaxed space-y-3">
                    {result.risk_signals.map((signal, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-blue-400 transition-colors"></div>
                        {signal}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-900 rounded-xl shadow-lg p-5 text-slate-300 relative overflow-hidden">
                  <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Counterfactual</h3>
                  <p className="text-sm leading-relaxed text-slate-200">
                    &quot;{result.why_not_low}&quot;
                  </p>
                  <div className="absolute -bottom-4 -right-4 text-[80px] text-white/5 font-serif font-bold italic select-none">
                    ?
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Risk Velocity */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Velocity Trend (72h)</h3>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">Live</span>
                  </div>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={currentScenario?.visualizationData.history}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={result.risk_level === "High" ? "#ef4444" : "#f59e0b"} stopOpacity={0.1} />
                            <stop offset="95%" stopColor={result.risk_level === "High" ? "#ef4444" : "#f59e0b"} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ fontSize: '11px', borderRadius: '4px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          itemStyle={{ color: '#64748b' }}
                        />
                        <Area type="monotone" dataKey="score" stroke={result.risk_level === "High" ? "#ef4444" : "#f59e0b"} fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Factor Analysis */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Factor Contribution</h3>
                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={currentScenario?.visualizationData.breakdown} margin={{ top: 0, right: 10, left: 10, bottom: 0 }} barCategoryGap={10}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="signal" type="category" width={70} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: '11px', borderRadius: '4px' }} />
                        <Bar dataKey="impact" fill="#3b82f6" radius={[0, 3, 3, 0]} barSize={12} background={{ fill: '#f1f5f9' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Decision Workflow */}
              <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-slate-300 rounded-sm"></span>
                  Analyst Decision
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Justification Notes
                    </label>
                    <textarea
                      className="w-full border-slate-200 rounded-lg shadow-sm border p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[100px] placeholder-slate-400 bg-white"
                      placeholder="Enter case assessment notes here..."
                      value={notes}
                      onChange={(e) => saveCurrentNote(e.target.value)}
                    />
                    {/* Analyst Feedback Loop */}
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-200 pt-3">
                      <span>Was this AI recommendation helpful?</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFeedback("helpful")}
                          className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${selectedId && feedback[selectedId] === 'helpful' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => handleFeedback("unhelpful")}
                          className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${selectedId && feedback[selectedId] === 'unhelpful' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                        >
                          Wait
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Final Determination
                      </label>
                      <div className="flex gap-3 mb-4">
                        <button
                          onClick={() => handleDecision("Accepted")}
                          className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all shadow-sm ${decision === "Accepted"
                              ? "bg-emerald-600 text-white shadow-emerald-200 ring-2 ring-emerald-600 ring-offset-2"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDecision("Overridden")}
                          className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all shadow-sm ${decision === "Overridden"
                              ? "bg-slate-800 text-white shadow-slate-300 ring-2 ring-slate-800 ring-offset-2"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                        >
                          Override
                        </button>
                      </div>

                      {decision && (
                        <div className="bg-white border border-slate-200 rounded-lg p-3 text-center animate-in zoom-in-95 duration-200 shadow-sm">
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Status</p>
                          <p className={`text-base font-bold ${decision === "Accepted" ? "text-emerald-700" : "text-slate-700"}`}>
                            {decision === "Accepted" ? "Recommendation Accepted" : "Overridden by Analyst"}
                          </p>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 mt-4 leading-tight">
                      Final decisions remain with human analysts. RiskLens provides decision support, not enforcement.
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
