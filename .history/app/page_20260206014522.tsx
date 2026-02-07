"use client";

import { useState } from "react";
import { scenarios } from "@/src/data/scenarios";

export default function Home() {
  const [selectedId, setSelectedId] = useState(scenarios[0].id);
  const [result, setResult] = useState<any>(null);
  const [analyzedScenario, setAnalyzedScenario] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [decision, setDecision] = useState<"Accepted" | "Overridden" | null>(null);

  const analyzeRisk = async () => {
    setLoading(true);
    setResult(null);
    setAnalyzedScenario(null);
    setDecision(null);
    setNotes("");

    const scenario = scenarios.find((s) => s.id === selectedId);

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
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getConfidenceLevel = (riskLevel: string) => {
    if (riskLevel?.toLowerCase() === "medium") return "Medium";
    return "High";
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      {/* Top Navigation Bar */}
      <nav className="bg-slate-900 text-white px-6 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">RiskLens</h1>
            <p className="text-slate-400 text-xs">Enterprise Decision Support</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold ring-2 ring-slate-800">
              RA
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">

        {/* LEFT COLUMN: CONTEXT & DATA (4 cols) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Case Context Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Case Context</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-500">Case ID</span>
                <span className="font-mono text-sm font-medium text-slate-900">RL-1042</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-sm text-slate-500">Queue</span>
                <span className="text-sm font-medium text-slate-900">Behavior Monitoring</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Status</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  Under Review
                </span>
              </div>
            </div>
          </div>

          {/* Selector Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <label className="block text-sm font-semibold text-slate-900 mb-1">
              Select Risk Case
            </label>
            <p className="text-xs text-slate-500 mb-3">Choose a scenario to analyze.</p>
            <select
              className="block w-full rounded-md border-slate-300 border bg-white py-2 px-3 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 sm:text-sm mb-3"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={analyzeRisk}
              className="w-full bg-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Explain This Case"}
            </button>
          </div>

          {/* Evidence Panel (Show only if analyzed) */}
          {result && analyzedScenario && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-900">Evidence Used</h3>
              </div>
              <table className="min-w-full divide-y divide-slate-100">
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="px-4 py-2.5 text-xs text-slate-500">Account Age</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-900 text-right">{analyzedScenario.data.account_age_days} days</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-xs text-slate-500">Withdrawals</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-900 text-right">{analyzedScenario.data.withdrawal_attempts}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-xs text-slate-500">Geo Switches</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-900 text-right">{analyzedScenario.data.geo_switches}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-xs text-slate-500">Profile Changes</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-900 text-right">{analyzedScenario.data.profile_changes}</td>
                  </tr>
                </tbody>
              </table>
              <div className="bg-slate-50 px-4 py-2 border-t border-slate-100">
                <p className="text-[10px] text-slate-400">
                  Audit Trail ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
                </p>
              </div>
            </div>
          )}

          {/* Roadmap Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Product Roadmap</h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center text-slate-900 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2"></span>
                Explainable Risk
              </li>
              <li className="flex items-center text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-200 mr-2"></span>
                AI-based Detection
              </li>
              <li className="flex items-center text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-200 mr-2"></span>
                Real-time Monitoring
              </li>
            </ul>
          </div>

        </div>


        {/* RIGHT COLUMN: DECISION & WORKFLOW (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {!result && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-lg border border-slate-200 border-dashed text-slate-400">
              <svg className="w-12 h-12 mb-3 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Select a case to begin review</p>
            </div>
          )}

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">

              {/* Primary Decision Header Card */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-bold uppercase tracking-wide ${getRiskBadgeColor(result.risk_level)}`}>
                      {result.risk_level} Risk
                    </span>
                    <span className="text-xs font-medium text-slate-500 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                      Confidence: <span className="text-slate-900">{getConfidenceLevel(result.risk_level)}</span>
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Recommended Action</h3>
                    <p className="text-xl font-semibold text-slate-900">{result.recommended_action}</p>
                  </div>
                </div>
                {/* HITL Badge */}
                <div className="hidden sm:block text-right">
                  <span className="inline-flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded ring-1 ring-inset ring-blue-600/20">
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Human Review Required
                  </span>
                </div>
              </div>

              {/* Reasoning & Explanation Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reasoning */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center mb-4">
                    <span className="mr-2 text-base">🧠</span> Reasoning Summary
                  </h3>
                  <ul className="space-y-3">
                    {result.risk_signals.map((signal: string, i: number) => (
                      <li key={i} className="flex items-start text-sm text-slate-700">
                        <span className="text-slate-400 mr-2 mt-0.5 shrink-0">•</span>
                        <span>{signal}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* AI Explanation */}
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex flex-col">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">AI Explanation</h3>
                  <div className="flex-1 bg-slate-50 rounded p-3 text-sm text-slate-700 leading-relaxed border border-slate-100">
                    {result.explanation}
                  </div>
                </div>
              </div>

              {/* Analyst Workflow */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 border-t-4 border-t-slate-200">
                <h3 className="text-base font-bold text-slate-900 mb-6">Decision Outcome</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Analyst Notes
                    </label>
                    <textarea
                      className="w-full border-slate-300 rounded-md shadow-sm border p-3 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 min-h-[120px] placeholder-slate-400"
                      placeholder="Enter your assessment justification..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col justify-between">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Action
                      </label>
                      <div className="flex gap-3 mb-4">
                        <button
                          onClick={() => setDecision("Accepted")}
                          className={`flex-1 px-4 py-2.5 rounded text-sm font-medium transition-all ${decision === "Accepted"
                              ? "bg-green-600 text-white shadow-md ring-2 ring-green-600 ring-offset-2"
                              : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                            }`}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => setDecision("Overridden")}
                          className={`flex-1 px-4 py-2.5 rounded text-sm font-medium transition-all ${decision === "Overridden"
                              ? "bg-orange-600 text-white shadow-md ring-2 ring-orange-600 ring-offset-2"
                              : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400"
                            }`}
                        >
                          Override
                        </button>
                      </div>

                      {decision && (
                        <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center animate-in zoom-in-95 duration-200">
                          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Final Decision</p>
                          <p className={`text-base font-bold ${decision === "Accepted" ? "text-green-700" : "text-orange-700"}`}>
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
