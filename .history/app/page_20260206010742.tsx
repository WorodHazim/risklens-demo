"use client";

import { useState } from "react";
import { scenarios } from "@/src/data/scenarios";

export default function Home() {
  const [selectedId, setSelectedId] = useState(scenarios[0].id);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyzeRisk = async () => {
    setLoading(true);
    setResult(null);

    const scenario = scenarios.find((s) => s.id === selectedId);

    const res = await fetch("/api/analyze-risk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(scenario?.data),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6">
          <h1 className="text-2xl font-bold tracking-tight">RiskLens</h1>
          <p className="text-slate-400 text-sm mt-1">
            Internal decision-support tool for Risk & Compliance teams
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* Case Context Header - Static Mock Data */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4 flex justify-between items-center text-sm">
            <div>
              <span className="text-slate-500 block text-xs uppercase tracking-wider font-semibold mb-1">
                Case ID
              </span>
              <span className="font-mono font-medium text-slate-900">
                RL-1042
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs uppercase tracking-wider font-semibold mb-1">
                Queue
              </span>
              <span className="font-medium text-slate-900">
                Behavior Monitoring
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs uppercase tracking-wider font-semibold mb-1">
                Status
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                Under Review
              </span>
            </div>
          </div>

          {/* Action Panel */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Select Risk Case
            </label>
            <div className="flex gap-4">
              <select
                className="flex-1 block w-full rounded-md border-slate-300 border bg-white py-2 px-3 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 sm:text-sm"
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
                className="bg-slate-900 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                disabled={loading}
              >
                {loading ? "Analyzing..." : "Explain This Case"}
              </button>
            </div>
          </div>

          {/* Analysis Results */}
          {result && (
            <div className="border-t border-slate-200 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">
                    Risk Assessment
                  </h2>
                  <p className="text-sm text-slate-500">
                    AI-generated analysis based on available signals.
                  </p>
                </div>
                <div
                  className={`px-4 py-1.5 rounded-full border text-sm font-bold uppercase tracking-wide ${getRiskBadgeColor(
                    result.risk_level
                  )}`}
                >
                  {result.risk_level} Risk
                </div>
              </div>

              {/* Reasoning Summary */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
                  <span className="mr-2">🧠</span> Reasoning Summary
                </h3>
                <div className="bg-slate-50 rounded-md p-4 border border-slate-200">
                  <ul className="space-y-2">
                    {result.risk_signals.map((signal: string, i: number) => (
                      <li key={i} className="flex items-start text-sm text-slate-700">
                        <span className="text-slate-400 mr-2 mt-0.5">•</span>
                        {signal}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 pt-4 border-t border-slate-200 text-sm">
                    <p className="text-slate-800">
                      <strong>Conclusion:</strong> {result.explanation}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  Recommended Action
                </h3>
                <p className="text-slate-800 text-sm">
                  {result.recommended_action}
                </p>
              </div>

              {/* HITL Clarity Box */}
              <div className="bg-blue-50 border border-blue-100 rounded-md p-3 flex items-start">
                <div className="shrink-0 text-blue-500 mt-0.5 mr-3">
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Human-in-the-Loop:</strong> RiskLens supports human
                  analysts by explaining alerts before decisions are made. It does
                  not automatically block users.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Roadmap Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4">
          <div className="flex justify-between items-center text-xs text-slate-500 max-w-2xl mx-auto">
            <div className="flex items-center font-medium text-slate-900">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Today: Explainable Risk
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-slate-300 rounded-full mr-2"></span>
              Next: AI-based Detection
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-slate-300 rounded-full mr-2"></span>
              Later: Real-time Monitoring
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
