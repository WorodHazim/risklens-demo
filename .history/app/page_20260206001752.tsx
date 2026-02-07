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

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-2">RiskLens</h1>
        <p className="text-gray-600 mb-6">
          Explainable behavior risk analysis for digital platforms.
        </p>

        <label className="block mb-2 font-medium">Select scenario</label>
        <select
          className="w-full border rounded p-2 mb-4"
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
          className="w-full bg-black text-white py-2 rounded mb-6"
          disabled={loading}
        >
          {loading ? "Analyzing..." : "Analyze Risk"}
        </button>

        {result && (
          <div className="border-t pt-4">
            <p className="mb-2">
              <strong>Risk Level:</strong>{" "}
              <span className="font-semibold">{result.risk_level}</span>
            </p>

            <p className="mb-2 font-semibold">Risk Signals:</p>
            <ul className="list-disc ml-5 mb-4">
              {result.risk_signals.map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>

            <p className="mb-2">
              <strong>Explanation:</strong> {result.explanation}
            </p>

            <p className="mt-2">
              <strong>Recommended Action:</strong>{" "}
              {result.recommended_action}
            </p>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6">
          Mock AI mode – LLM integration planned.
        </p>
      </div>
    </main>
  );
}
