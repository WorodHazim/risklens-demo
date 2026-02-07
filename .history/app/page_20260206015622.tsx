"use client";

import { useState } from "react";
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

  const getRiskBadgeColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "low":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getConfidenceLevel = (riskLevel: string) => {
    if (riskLevel?.toLowerCase() === "medium") return "Medium";
    return "High";
  };

  const generateRiskScore = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high":
        return 88;
      case "medium":
        return 65;
      default:
        return 12;
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
      <nav className="bg-slate-900 text-white px-6 py-4 shadow-md sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">RiskLens</h1>
            <p className="text-slate-400 text-xs">Enterprise Decision Intelligence</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-4 text-sm text-slate-300">
              <span>Dashboard</span>
              <span className="text-white font-medium">Cases</span>
              <span>Policies</span>
              <span>Settings</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold ring-2 ring-slate-800">
              RA
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">

        {/* LEFT COLUMN: VISUAL INBOX (4 cols) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Portfolio Widget */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Risk Portfolio Distribution</h2>
            <div className="h-40 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {portfolioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs text-slate-500 mt-2">
              <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>High</div>
              <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-500 mr-1"></span>Medium</div>
              <div className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1"></span>Low</div>
            </div>
          </div>

          {/* Case Inbox */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-900">Case Inbox</h2>
              <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{scenarios.length}</span>
            </div>
            <div className="overflow-y-auto flex-1">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => analyzeRisk(s.id)}
                  className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group ${selectedId === s.id ? "bg-slate-50 ring-2 ring-inset ring-blue-500/10" : ""}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-mono text-slate-400">#{s.id.substring(0, 6).toUpperCase()}</span>
                    <span className="text-xs text-slate-400">{s.date}</span>
                  </div>
                  <h3 className={`text-sm font-medium mb-2 ${selectedId === s.id ? "text-blue-700" : "text-slate-900 group-hover:text-blue-700"}`}>
                    {s.name}
                  </h3>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${s.risk === 'High' ? 'bg-red-50 text-red-700 border-red-100' :
                      s.risk === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                    {s.risk} Risk
                  </span>
                </button>
              ))}
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
              <p className="text-lg font-medium text-slate-300">Select a case to view intelligence</p>
            </div>
          )}

          {result && analyzedScenario && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

              {/* Executive Summary & Header */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${result.risk_level === "High" ? "bg-red-500" : result.risk_level === "Medium" ? "bg-amber-500" : "bg-emerald-500"}`}></div>

                <div className="pl-2 mb-6">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Executive Summary</h2>
                  <p className="text-base text-slate-700 leading-relaxed font-medium">
                    {getExecutiveSummary(result)}
                  </p>
                </div>

                <div className="pl-2 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
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

              {/* Charts & Evidence Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Risk Trend Chart */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Risk Velocity (72h)</h3>
                  <div className="h-48">
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
                  <div className="h-48">
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

              {/* Policy & Explanation Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Policies */}
                <div className="bg-slate-50 rounded-lg border border-slate-200 p-5">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Triggered Policies</h3>
                  {getActivePolicies(result.risk_level).length > 0 ? (
                    <ul className="space-y-2">
                      {getActivePolicies(result.risk_level).map((policy: any) => (
                        <li key={policy.id} className="flex items-start gap-2 text-sm text-slate-700 bg-white p-2 rounded border border-slate-200">
                          <span className="font-mono text-xs text-slate-400 bg-slate-100 px-1 py-0.5 rounded">{policy.id}</span>
                          {policy.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No specific policy violations detected.</p>
                  )}
                </div>

                {/* Reduction Guidance */}
                <div className="bg-blue-50 rounded-lg border border-blue-100 p-5">
                  <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">Risk Reduction Guidance</h3>
                  <ul className="space-y-2">
                    {getRiskReductionSteps(result.risk_level).map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-blue-900">
                        <span className="text-blue-400 mt-0.5">•</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>


              {/* Analyst Decision Workflow */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 border-t-4 border-t-slate-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-bold text-slate-900">Decision Outcome</h3>

                  {/* Simulation Dropdown */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-slate-500">Simulate Action:</label>
                    <select
                      className="text-xs border-slate-300 rounded shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={simulationAction}
                      onChange={(e) => setSimulationAction(e.target.value)}
                    >
                      <option value="">Select action...</option>
                      <option value="verify">User Verified ID</option>
                      <option value="wait">Wait 7 Days</option>
                    </select>
                  </div>
                </div>

                {simulationAction && (
                  <div className="mb-6 bg-purple-50 border border-purple-100 p-3 rounded text-sm text-purple-900 flex items-start gap-2 animate-in fade-in">
                    <span className="font-bold">Prediction:</span>
                    {simulationAction === "verify" ? "Risk Score would likely drop to Low (<20) immediately." : "Risk Score projected to decrease to Medium if no further alerts occur."}
                  </div>
                )}

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
                          onClick={() => setDecision("Accepted")}
                          className={`flex-1 px-4 py-2.5 rounded text-sm font-medium transition-all ${decision === "Accepted"
                              ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600 ring-offset-2"
                              : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                            }`}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => setDecision("Overridden")}
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
