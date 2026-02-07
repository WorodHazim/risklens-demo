"use client";

import { useState, useMemo } from "react";
import { scenarios } from "@/src/data/scenarios";
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

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [analyzedScenario, setAnalyzedScenario] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [decision, setDecision] = useState<"Accepted" | "Overridden" | null>(null);
  const [simulationAction, setSimulationAction] = useState("");

  // Enterprise Controls State
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"All" | "High" | "Medium" | "Low">("All");
  const [sortOrder, setSortOrder] = useState<"Date" | "Score">("Date");
  const [auditLog, setAuditLog] = useState<any[]>([]);

  // Computed Scenarios for Inbox
  const filteredScenarios = useMemo(() => {
    return scenarios
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
  }, [searchQuery, riskFilter, sortOrder]);

  const analyzeRisk = async (id: string) => {
    setLoading(true);
    setResult(null);
    setAnalyzedScenario(null);
    setDecision(null);
    setNotes("");
    setSimulationAction("");
    setSelectedId(id);

    const scenario = scenarios.find((s) => s.id === id);

    const res = await fetch("/api/analyze-risk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scenario?.data),
    });

    const data = await res.json();
    setResult(data);
    setAnalyzedScenario(scenario);
    setLoading(false);
  };

  const handleDecision = (outcome: "Accepted" | "Overridden") => {
    setDecision(outcome);
    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      caseId: selectedId,
      outcome: outcome,
      notes: notes ? notes.slice(0, 40) + "..." : "-"
    };
    setAuditLog([newLog, ...auditLog]);
  };

  // --- HELPERS ---

  const getRiskBadgeColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high": return "bg-red-50 text-red-700 border-red-200";
      case "medium": return "bg-amber-50 text-amber-700 border-amber-200";
      case "low": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getPriority = (risk: string) => {
    if (risk === "High") return { label: "P1", color: "bg-red-100 text-red-700 border-red-200 ring-red-600/10" };
    if (risk === "Medium") return { label: "P2", color: "bg-amber-100 text-amber-700 border-amber-200 ring-amber-600/10" };
    return { label: "P3", color: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-600/10" };
  };

  const getSLA = (risk: string) => {
    if (risk === "High") return { text: "4h left", color: "text-red-600 font-bold" };
    if (risk === "Medium") return { text: "24h left", color: "text-amber-600 font-medium" };
    return { text: "3d left", color: "text-slate-400" };
  };

  const generateRiskScore = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high": return 88;
      case "medium": return 65;
      default: return 12;
    }
  };

  const getActivePolicies = (level: string) => {
    if (level === "High") return [
      { id: "POL-AML-001", name: "Velocity Limits Exceeded" },
      { id: "POL-KYC-055", name: "Sensitive geo-location patterns" }
    ];
    if (level === "Medium") return [
      { id: "POL-TXN-102", name: "Unusual withdrawal frequency" }
    ];
    return [];
  };

  const getRiskReductionSteps = (level: string) => {
    if (level === "High" || level === "Medium") return [
      "Verify user identity via video call.",
      "Request proof of funds for recent deposits."
    ];
    return ["Maintain standard monitoring period."];
  };

  const getRiskExplanation = (level: string) => {
    if (level === "High") return "User activity triggers multiple critical thresholds, specifically regarding rapid velocity and potential account takeover indicators.";
    if (level === "Medium") return "Activity deviates from normal patterns but lacks definitive indicators of compromise. Caution warranted.";
    return "All signals are within standard operating baselines. Account behavior is consistent with verified user cohorts.";
  };

  const getWhyNotLower = (level: string) => {
    if (level === "High") return "Presence of rapid geo-switching combined with profile edits prevents classification as Medium risk.";
    if (level === "Medium") return "Recent withdrawal spikes prevent Low risk classification, despite account age.";
    return "N/A - Risk is already at lowest tier.";
  };

  const getExecutiveSummary = (result: any) => {
    if (result.risk_level === "High") return "Critical risk vector identified. Multiple high-severity signals indicate potential account compromise or AML activity. Immediate analyst review required.";
    if (result.risk_level === "Medium") return "Elevated risk detected due to behavioral anomalies. Patterns suggest deviation from established baseline. Enhanced due diligence recommended.";
    return "Low risk profile. User behavior aligns with expected patterns for this segment. No immediate intervention required.";
  };

  // Chart Data Preparation
  const portfolioData = [
    { name: "High", value: scenarios.filter(s => s.risk === "High").length, color: "#ef4444" },
    { name: "Medium", value: scenarios.filter(s => s.risk === "Medium").length, color: "#f59e0b" },
    { name: "Low", value: scenarios.filter(s => s.risk === "Low").length, color: "#10b981" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      {/* Top Navigation Bar */}
      <nav className="bg-slate-900 text-white px-6 py-4 shadow-md sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">R</span>
              </div>
              <h1 className="text-lg font-bold tracking-tight">RiskLens</h1>
            </div>
            <p className="text-slate-400 text-[10px] ml-8">Enterprise Decision Intelligence</p>
          </div>
          <div className="flex items-center space-x-8">
            <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-400">
              <span className="text-white hover:text-white cursor-pointer transition-colors">Cases</span>
              <span className="hover:text-white cursor-pointer transition-colors">Policies</span>
              <span className="hover:text-white cursor-pointer transition-colors">Audit Logs</span>
              <span className="hover:text-white cursor-pointer transition-colors">Settings</span>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-700">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-white font-medium">Alex Chen</p>
                <p className="text-[10px] text-slate-400">Sr. Risk Analyst</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold ring-2 ring-slate-800">
                AC
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">

        {/* LEFT COLUMN: CONTROLS & INBOX (4 cols) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Portfolio & Controls Widget */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Queue</h2>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-slate-900">{scenarios.length}</span>
                  <span className="text-xs text-slate-500">Open Cases</span>
                </div>
              </div>
              <div className="h-16 w-16">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={portfolioData} cx="50%" cy="50%" innerRadius={15} outerRadius={30} dataKey="value">
                      {portfolioData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Queue Controls */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="relative">
                <svg className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input
                  type="text"
                  placeholder="Search Case ID..."
                  className="w-full text-xs border-slate-300 rounded pl-8 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="flex-1 text-xs border-slate-300 rounded px-2 py-1.5 bg-slate-50"
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value as any)}
                >
                  <option value="All">All Risks</option>
                  <option value="High">High Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="Low">Low Risk</option>
                </select>
                <select
                  className="flex-1 text-xs border-slate-300 rounded px-2 py-1.5 bg-slate-50"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                >
                  <option value="Date">Sort: Date</option>
                  <option value="Score">Sort: Score</option>
                </select>
              </div>
            </div>
          </div>

          {/* Case Inbox */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Queue: {riskFilter === 'All' ? 'Main' : riskFilter}</h2>
              <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full font-medium">{filteredScenarios.length}</span>
            </div>
            <div className="overflow-y-auto flex-1">
              {filteredScenarios.map((s) => {
                const priority = getPriority(s.risk);
                const sla = getSLA(s.risk);
                return (
                  <button
                    key={s.id}
                    onClick={() => analyzeRisk(s.id)}
                    className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group ${selectedId === s.id ? "bg-blue-50/50 ring-2 ring-inset ring-blue-500/10" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${priority.color} ring-1 ring-inset`}>
                          {priority.label}
                        </span>
                        <span className="text-xs font-mono text-slate-400">#{s.id.substring(0, 6).toUpperCase()}</span>
                      </div>
                      <span className={`text-[10px] ${sla.color}`}>{sla.text}</span>
                    </div>

                    <h3 className={`text-sm font-medium mb-3 truncate pr-4 ${selectedId === s.id ? "text-blue-700" : "text-slate-900 group-hover:text-blue-700"}`}>
                      {s.name}
                    </h3>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">{s.date}</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getRiskBadgeColor(s.risk)}`}>
                        {s.risk}
                      </span>
                    </div>
                  </button>
                );
              })}
              {filteredScenarios.length === 0 && (
                <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400 gap-2 h-full">
                  <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <p className="text-xs italic">No cases match your filters.</p>
                </div>
              )}
            </div>
          </div>

          {/* Decision Audit Trail */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-0 h-[250px] flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Session Audit Log</h2>
            </div>

            <div className="overflow-y-auto flex-1">
              {auditLog.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-medium">
                    <tr>
                      <th className="px-4 py-2 font-medium">Time</th>
                      <th className="px-4 py-2 font-medium">Case</th>
                      <th className="px-4 py-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLog.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                        <td className="px-4 py-2 font-mono text-slate-500">#{log.caseId?.substring(0, 4)}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${log.outcome === "Accepted" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"}`}>
                            {log.outcome}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                  <p className="text-xs text-slate-400 italic">No decisions recorded yet.<br />Actions taken will appear here.</p>
                </div>
              )}
            </div>
          </div>

        </div>


        {/* RIGHT COLUMN: INTELLIGENCE DASHBOARD (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {!result && (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-white rounded-lg border border-slate-200 border-dashed text-slate-400">
              <svg className="w-16 h-16 mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div className="text-center">
                <p className="text-lg font-medium text-slate-300">Workspace Ready</p>
                <p className="text-sm text-slate-400">Select a case from the queue to begin analysis</p>
              </div>
            </div>
          )}

          {result && analyzedScenario && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

              {/* Executive Summary & Header */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${result.risk_level === "High" ? "bg-red-500" : result.risk_level === "Medium" ? "bg-amber-500" : "bg-emerald-500"}`}></div>

                <div className="pl-3 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Executive Summary</h2>
                  </div>
                  <p className="text-base text-slate-800 leading-relaxed font-medium">
                    {getExecutiveSummary(result)}
                  </p>
                </div>

                <div className="pl-3 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Risk Score</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-slate-900">{generateRiskScore(result.risk_level)}</span>
                      <span className="text-sm text-slate-400">/ 100</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Risk Level</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold uppercase tracking-wide border ${getRiskBadgeColor(result.risk_level)}`}>
                      {result.risk_level} Risk
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Recommended Action</p>
                    <span className="text-sm font-bold text-blue-700">{result.recommended_action}</span>
                  </div>
                </div>
              </div>

              {/* New: Explainability Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 relative overflow-hidden">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Reasoning Analysis</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">{getRiskExplanation(result.risk_level)}</p>
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" /></svg>
                  </div>
                </div>
                <div className="bg-slate-800 rounded-lg shadow-sm p-5 text-slate-300 relative overflow-hidden">
                  <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Counterfactual Check</h3>
                  <p className="text-sm leading-relaxed text-white">
                    &quot;{getWhyNotLower(result.risk_level)}&quot;
                  </p>
                  <div className="absolute bottom-2 right-4 text-[10px] text-white/20">why-not-lower</div>
                </div>
              </div>

              {/* Charts & Evidence Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Risk Trend Chart */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Risk Velocity (72h)</h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyzedScenario.visualizationData.history}>
                        <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={result.risk_level === "High" ? "#ef4444" : "#f59e0b"} stopOpacity={0.1} />
                            <stop offset="95%" stopColor={result.risk_level === "High" ? "#ef4444" : "#f59e0b"} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip contentStyle={{ fontSize: '12px' }} />
                        <Area type="monotone" dataKey="score" stroke={result.risk_level === "High" ? "#ef4444" : "#f59e0b"} fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Score Breakdown Chart */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Risk Contribution Factors</h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={analyzedScenario.visualizationData.breakdown} margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="signal" type="category" width={80} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="impact" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Policy & Reduction Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Policies */}
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Triggered Policies</h3>
                  {getActivePolicies(result.risk_level).length > 0 ? (
                    <ul className="space-y-2">
                      {getActivePolicies(result.risk_level).map((policy: any) => (
                        <li key={policy.id} className="flex items-start gap-2 text-sm text-slate-700 bg-white p-2 rounded border border-slate-200 shadow-sm">
                          <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1 py-0.5 rounded border border-slate-200">{policy.id}</span>
                          {policy.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No specific policy violations detected.</p>
                  )}
                </div>

                {/* Simulation Dropdown */}
                <div className="bg-purple-50 rounded-lg border border-purple-100 p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-purple-800 uppercase tracking-wider">Predictive Simulation</h3>
                    <select
                      className="text-xs border-purple-200 bg-white rounded shadow-sm focus:border-purple-500 focus:ring-purple-500"
                      value={simulationAction}
                      onChange={(e) => setSimulationAction(e.target.value)}
                    >
                      <option value="">Simulate Next Action...</option>
                      <option value="verify">User Verified ID</option>
                      <option value="wait">Wait 7 Days</option>
                    </select>
                  </div>
                  {simulationAction ? (
                    <div className="text-sm text-purple-900 flex items-start gap-2 animate-in fade-in">
                      <span className="font-bold">Forecast:</span>
                      {simulationAction === "verify" ? "Risk Score projected to drop to 15 (Low). Standard limits would apply." : "Risk Score likely to decrease to 60 (Medium) if velocity stabilizes."}
                    </div>
                  ) : (
                    <p className="text-xs text-purple-400 italic">Select an action (e.g., ID check) to see predicted risk impact.</p>
                  )}
                </div>
              </div>


              {/* Analyst Decision Workflow */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 border-t-4 border-t-slate-200">
                <h3 className="text-base font-bold text-slate-900 mb-6">Decision Outcome</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Analyst Notes
                    </label>
                    <textarea
                      className="w-full border-slate-300 rounded-md shadow-sm border p-3 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 min-h-[100px] placeholder-slate-400"
                      placeholder="Enter your assessment justification..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="flex gap-3 mb-4">
                        <button
                          onClick={() => handleDecision("Accepted")}
                          className={`flex-1 px-4 py-2.5 rounded text-sm font-medium transition-all ${decision === "Accepted"
                              ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600 ring-offset-2"
                              : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                            }`}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDecision("Overridden")}
                          className={`flex-1 px-4 py-2.5 rounded text-sm font-medium transition-all ${decision === "Overridden"
                              ? "bg-slate-800 text-white shadow-md ring-2 ring-slate-800 ring-offset-2"
                              : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                            }`}
                        >
                          Override
                        </button>
                      </div>

                      {decision && (
                        <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center animate-in zoom-in-95 duration-200">
                          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Final Decision</p>
                          <p className={`text-base font-bold ${decision === "Accepted" ? "text-emerald-700" : "text-slate-700"}`}>
                            {decision === "Accepted" ? "Recommendation Accepted" : "Overridden by Analyst"}
                          </p>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 mt-4 leading-tight">
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
