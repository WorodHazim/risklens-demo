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

  // Navigation & View State
  const [currentView, setCurrentView] = useState<"dashboard" | "policies" | "audit" | "exports">("dashboard");
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Persistence: Load on Mount
  useEffect(() => {
    const savedData = localStorage.getItem("risklens_storage_v5");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setAuditLog(parsed.auditLog || []);
      setSavedNotes(parsed.savedNotes || {});
      setFeedback(parsed.feedback || {});
    }
  }, []);

  // Persistence: Save on Change
  useEffect(() => {
    localStorage.setItem("risklens_storage_v5", JSON.stringify({
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

  // Click Outside Handler for Profile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isProfileOpen && !target.closest("#user-profile-dropdown")) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

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

    // Optimistic UI updates
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
  const handleExportData = () => {
    if (currentView === "audit") {
      // Export Audit Log
      const headers = ["ID", "Time", "Case ID", "Action", "Notes"];
      const rows = auditLog.map(l => [l.id, l.timestamp, l.caseId, l.outcome, l.notes]);
      const csvContent = "data:text/csv;charset=utf-8,"
        + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "compliance_audit_log.csv");
      document.body.appendChild(link);
      link.click();
      return;
    }

    // Default: Export Queue
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
      case "high": return "bg-[#220808] text-red-100 border border-red-900/40";
      case "medium": return "bg-[#1F1206] text-amber-100 border border-amber-900/40";
      case "low": return "bg-[#061F12] text-emerald-100 border border-emerald-900/40";
      default: return "bg-neutral-900 text-neutral-400 border border-neutral-700";
    }
  };

  const getPriority = (risk: string) => {
    if (risk === "High") return { label: "P1", color: "bg-[#0A0A0A] text-[#D4B483] border-[#333]" };
    if (risk === "Medium") return { label: "P2", color: "bg-[#0A0A0A] text-[#999] border-[#262626]" };
    return { label: "P3", color: "bg-[#0A0A0A] text-[#555] border-[#1F1F1F]" };
  };

  const getSLA = (risk: string) => {
    if (risk === "High") return { text: "URGENT (4h)", color: "text-red-400/90 font-bold" };
    if (risk === "Medium") return { text: "Warning (24h)", color: "text-amber-400/90 font-medium" };
    return { text: "Standard (3d)", color: "text-[#444]" };
  };

  // Mock function to generate context based on ID/Risk (for demo polish)
  const getMicroContext = (s: any) => {
    if (s.risk === 'High') return "Triggered by velocity anomaly";
    if (s.risk === 'Medium') return "Multiple geo-hops detected";
    return "Periodic review cycle";
  };

  const getJustificationDetails = (result: RiskResult) => {
    if (result.risk_level === 'High') {
      return {
        chosen: "Cumulative risk score (>85) exceeds critical threshold for automated clearance.",
        rejected: "Passive monitoring or manual review delay would expose platform to immediate capital loss.",
        avoided: "Direct financial liability and potential AML regulatory non-compliance (Tier 1)."
      };
    }
    if (result.risk_level === 'Medium') {
      return {
        chosen: "Signal pattern is ambiguous; heuristic models require human adjudication to prevent false positives.",
        rejected: "Auto-blocking based on current confidence (60-80%) would negatively impact genuine high-value user.",
        avoided: "Unnecessary customer friction and potential loss of lifetime value (LTV)."
      };
    }
    return {
      chosen: "Activity falls within 2-sigma deviation of standard user behavior profiles.",
      rejected: "Manual review of low-risk volume would degrade analyst efficiency and violate SLA.",
      avoided: "Operational bottlenecks and wasted investigative resources."
    };
  };

  // Chart Data Preparation - Beige/Gold Tones
  const portfolioData = [
    { name: "High", value: activeScenarios.filter(s => s.risk === "High").length, color: "#991b1b" },
    { name: "Medium", value: activeScenarios.filter(s => s.risk === "Medium").length, color: "#92400e" },
    { name: "Low", value: activeScenarios.filter(s => s.risk === "Low").length, color: "#166534" },
  ];

  return (
    <main className="min-h-screen bg-[#050505] font-sans text-[#E5E5E0] pb-12 selection:bg-[#D4B483] selection:text-black">
      {/* Top Navigation Bar */}
      <nav className="bg-[#0A0A0A]/95 backdrop-blur-md px-8 py-3.5 border-b border-[#222] sticky top-0 z-50">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-14">
            <div
              className="flex items-center gap-3.5 opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => setCurrentView("dashboard")}
            >
              <div className="h-6 w-6 relative">
                <Image
                  src="/risklens-logo.svg"
                  alt="RiskLens Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-sm font-bold tracking-tight text-[#EFEDE5] leading-none mb-0.5">RiskLens</h1>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-[#666] font-semibold tracking-[0.2em] uppercase">Intelligence</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[8px] font-bold text-[#888] uppercase tracking-wider">AI Live</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => setCurrentView("dashboard")}
                className={`px-5 py-2 text-[10px] uppercase tracking-[0.15em] font-bold transition-all border-b-[2px] ${currentView === "dashboard" ? "text-[#E5E5E0] border-[#D4B483]" : "text-[#555] hover:text-[#999] border-transparent hover:border-[#222]"}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView("policies")}
                className={`px-5 py-2 text-[10px] uppercase tracking-[0.15em] font-bold transition-all border-b-[2px] ${currentView === "policies" ? "text-[#E5E5E0] border-[#D4B483]" : "text-[#555] hover:text-[#999] border-transparent hover:border-[#222]"}`}
              >
                Policies
              </button>
              <button
                onClick={() => setCurrentView("audit")}
                className={`px-5 py-2 text-[10px] uppercase tracking-[0.15em] font-bold transition-all border-b-[2px] ${currentView === "audit" ? "text-[#E5E5E0] border-[#D4B483]" : "text-[#555] hover:text-[#999] border-transparent hover:border-[#222]"}`}
              >
                Audit Ledger
              </button>
            </div>
          </div>

          <div className="flex items-center gap-10">
            <button
              onClick={() => setCurrentView("exports")}
              className={`text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2.5 group px-3 py-1.5 rounded-sm border ${currentView === 'exports' ? 'bg-[#1A1A1A] border-[#D4B483] text-[#D4B483]' : 'bg-[#0F0F0F] hover:bg-[#141414] border-[#222] text-[#666] hover:text-[#D4B483]'}`}
              title="Compliance Export Center"
            >
              <svg className={`w-3 h-3 transition-opacity ${currentView === 'exports' ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export Data
            </button>
            <div className="flex items-center gap-3.5 pl-6 border-l border-[#1F1F1F]">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-[#CCC] uppercase tracking-wider">Alex Chen</p>
                <p className="text-[9px] text-[#555] uppercase tracking-widest">Sr. Risk Analyst</p>
              </div>
              <div className="relative" id="user-profile-dropdown">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="h-8 w-8 rounded-sm bg-[#111] border border-[#262626] flex items-center justify-center text-[10px] font-bold text-[#D4B483] hover:border-[#D4B483]/50 transition-colors cursor-pointer"
                >
                  AC
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 top-11 w-48 bg-[#0F0F0F] border border-[#222] rounded-sm shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3 border-b border-[#222]">
                      <p className="text-[9px] text-[#666] uppercase tracking-widest font-bold">Session Context</p>
                      <p className="text-[10px] text-[#888] font-mono mt-1">RL-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                    </div>
                    <div className="p-1">
                      <button className="w-full text-left px-3 py-2 text-[10px] uppercase font-bold text-[#CCC] hover:bg-[#1A1A1A] rounded-sm transition-colors text-red-500/80 hover:text-red-400" onClick={() => console.log('Sign Out')}>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-[1500px] mx-auto p-6 mt-4">

        {currentView === "policies" && (
          <div className="animate-in fade-in duration-500 space-y-8">
            {/* Hero Top Panel */}
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm p-8 flex justify-between items-center shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#111] to-transparent opacity-50 pointer-events-none"></div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-5 w-5 relative opacity-80">
                    <Image src="/risklens-logo.svg" alt="Logo" fill className="object-contain" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#666]">Governance Layer</span>
                </div>
                <h2 className="text-3xl font-light text-[#E5E5E0] tracking-tight mb-2">Policy Engine</h2>
                <p className="text-sm text-[#888] font-light max-w-2xl leading-relaxed">
                  Global definitions for risk evaluation, signal detection thresholds, and automated enforcement logic.
                  These policies govern the behavior of the entire RiskLens decision stack.
                </p>
              </div>
              <div className="hidden md:block text-right">
                <span className="block text-4xl font-thin text-[#D4B483] mb-1">4</span>
                <span className="text-[10px] uppercase tracking-widest text-[#555] font-bold">Active Definitions</span>
              </div>
            </div>

            {/* Policies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Policy Card 1 */}
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm p-6 hover:border-[#333] transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#CCC] group-hover:text-[#E5E5E0] transition-colors mb-1">High Velocity Withdrawals</h3>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-[10px] text-[#555] uppercase tracking-wide font-medium">Active · Enforced</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-[#1A0505] border border-red-900/30 text-red-200/80 text-[9px] font-bold uppercase tracking-wider rounded-sm">
                    High Risk
                  </span>
                </div>
                <p className="text-xs text-[#888] leading-relaxed mb-6 font-mono border-l-2 border-[#1A1A1A] pl-3">
                  Detects accounts attempting &gt;3 withdrawals exceeding deviation threshold within a rolling 60-minute window.
                </p>
                <div className="bg-[#0F0F0F] p-3 rounded-sm border border-[#1A1A1A]">
                  <p className="text-[9px] text-[#444] uppercase tracking-widest mb-1 font-bold">Threshold Configuration</p>
                  <p className="text-[10px] text-[#666] font-mono">FLOW_RATE &gt; 3.0 AND AMT &gt; 2.5σ</p>
                </div>
              </div>

              {/* Policy Card 2 */}
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm p-6 hover:border-[#333] transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#CCC] group-hover:text-[#E5E5E0] transition-colors mb-1">Geo-Location Switching</h3>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-[10px] text-[#555] uppercase tracking-wide font-medium">Active · Enforced</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-[#1A1005] border border-amber-900/30 text-amber-200/80 text-[9px] font-bold uppercase tracking-wider rounded-sm">
                    Medium Risk
                  </span>
                </div>
                <p className="text-xs text-[#888] leading-relaxed mb-6 font-mono border-l-2 border-[#1A1A1A] pl-3">
                  Flags sessions initializing from disparate IP geolocations with implicit travel velocity exceeding 800km/h.
                </p>
                <div className="bg-[#0F0F0F] p-3 rounded-sm border border-[#1A1A1A]">
                  <p className="text-[9px] text-[#444] uppercase tracking-widest mb-1 font-bold">Threshold Configuration</p>
                  <p className="text-[10px] text-[#666] font-mono">GEO_DIST &gt; 500KM AND TIME_DELTA &lt; 2H</p>
                </div>
              </div>

              {/* Policy Card 3 */}
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm p-6 hover:border-[#333] transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#CCC] group-hover:text-[#E5E5E0] transition-colors mb-1">KYC Attributes Mismatch</h3>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-[10px] text-[#555] uppercase tracking-wide font-medium">Active · Enforced</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-[#1A0505] border border-red-900/30 text-red-200/80 text-[9px] font-bold uppercase tracking-wider rounded-sm">
                    High Risk
                  </span>
                </div>
                <p className="text-xs text-[#888] leading-relaxed mb-6 font-mono border-l-2 border-[#1A1A1A] pl-3">
                  Identifies discrepancies between provided session attributes and immutable KYC ledger records (Name, DOB).
                </p>
                <div className="bg-[#0F0F0F] p-3 rounded-sm border border-[#1A1A1A]">
                  <p className="text-[9px] text-[#444] uppercase tracking-widest mb-1 font-bold">Threshold Configuration</p>
                  <p className="text-[10px] text-[#666] font-mono">FUZZY_MATCH &lt; 0.85 ON [PII_FIELDS]</p>
                </div>
              </div>

              {/* Policy Card 4 */}
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm p-6 hover:border-[#333] transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#CCC] group-hover:text-[#E5E5E0] transition-colors mb-1">Early Lifecycle Velocity</h3>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-[10px] text-[#555] uppercase tracking-wide font-medium">Active · Enforced</span>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-[#051A0A] border border-emerald-900/30 text-emerald-200/80 text-[9px] font-bold uppercase tracking-wider rounded-sm">
                    Low Risk
                  </span>
                </div>
                <p className="text-xs text-[#888] leading-relaxed mb-6 font-mono border-l-2 border-[#1A1A1A] pl-3">
                  Monitors accounts &lt;30 days old for high-value transactions or rapid configuration changes.
                </p>
                <div className="bg-[#0F0F0F] p-3 rounded-sm border border-[#1A1A1A]">
                  <p className="text-[9px] text-[#444] uppercase tracking-widest mb-1 font-bold">Threshold Configuration</p>
                  <p className="text-[10px] text-[#666] font-mono">ACCT_AGE &lt; 30D AND TX_VAL &gt; $5K</p>
                </div>
              </div>

            </div>
          </div>
        )}

        {currentView === "exports" && (
          <div className="animate-in fade-in duration-500 space-y-8">
            {/* Hero */}
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm p-8 flex justify-between items-center shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#111] to-transparent opacity-50 pointer-events-none"></div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-5 w-5 relative opacity-80">
                    <Image src="/risklens-logo.svg" alt="Logo" fill className="object-contain" />
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#666]">Regulatory & Audit</span>
                </div>
                <h2 className="text-3xl font-light text-[#E5E5E0] tracking-tight mb-2">Data Export Center</h2>
                <p className="text-sm text-[#888] font-light max-w-2xl leading-relaxed">
                  Generate immutable, time-stamped snapshots of system state for regulatory compliance, internal audit review, and legal discovery.
                </p>
              </div>
            </div>

            {/* Export Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Case Export */}
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm p-6 hover:border-[#333] transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#CCC] uppercase tracking-wider group-hover:text-[#E5E5E0]">Case Artifact</h3>
                  <span className="text-[9px] font-mono text-[#555] border border-[#222] px-1.5 py-0.5 rounded-sm">JSON / PDF</span>
                </div>
                <p className="text-xs text-[#777] leading-relaxed mb-6 font-mono h-12">
                  Full risk vector analysis, policy triggers, and analyst decision logs for single case files.
                </p>
                <button className="w-full py-2 border border-[#222] text-[10px] font-bold uppercase tracking-widest text-[#555] hover:text-[#CCC] hover:border-[#444] rounded-sm transition-all flex items-center justify-center gap-2">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Generate Preview
                </button>
              </div>

              {/* Card 2: Audit Ledger */}
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm p-6 hover:border-[#333] transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#CCC] uppercase tracking-wider group-hover:text-[#E5E5E0]">Audit Ledger</h3>
                  <span className="text-[9px] font-mono text-[#555] border border-[#222] px-1.5 py-0.5 rounded-sm">CSV / XML</span>
                </div>
                <p className="text-xs text-[#777] leading-relaxed mb-6 font-mono h-12">
                  Chronological, immutable record of all human interventions, overrides, and system outcomes.
                </p>
                <button className="w-full py-2 border border-[#222] text-[10px] font-bold uppercase tracking-widest text-[#555] hover:text-[#CCC] hover:border-[#444] rounded-sm transition-all flex items-center justify-center gap-2">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Generate Preview
                </button>
              </div>

              {/* Card 3: Queue Snapshot */}
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm p-6 hover:border-[#333] transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#CCC] uppercase tracking-wider group-hover:text-[#E5E5E0]">Queue Snapshot</h3>
                  <span className="text-[9px] font-mono text-[#555] border border-[#222] px-1.5 py-0.5 rounded-sm">SQL / CSV</span>
                </div>
                <p className="text-xs text-[#777] leading-relaxed mb-6 font-mono h-12">
                  Point-in-time capture of the entire active risk queue, including pending and processed states.
                </p>
                <button className="w-full py-2 border border-[#222] text-[10px] font-bold uppercase tracking-widest text-[#555] hover:text-[#CCC] hover:border-[#444] rounded-sm transition-all flex items-center justify-center gap-2">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                  Generate Preview
                </button>
              </div>
            </div>

            {/* Mock Preview & Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-[#0F0F0F] border border-[#1F1F1F] rounded-sm p-6 relative overflow-hidden">
                <div className="flex justify-between items-center mb-4 border-b border-[#222] pb-2">
                  <span className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Sample Output Structure (Redacted)</span>
                  <span className="text-[9px] font-mono text-[#444]">JSON-SCHEMA: v2.4</span>
                </div>
                <pre className="font-mono text-[10px] text-[#555] leading-loose overflow-x-hidden">
                  {`{
  "export_id": "EXP-2026-02-06-XJ9",
  "generated_at": "2026-02-06T04:15:22Z",
  "context": "REGULATORY_AUDIT",
  "data": {
    "case_id": "C-92841",
    "risk_score": 88,
    "signals": [
        "VELOCITY_ANOMALY",
        "GEO_HOP_DETECTED"
    ],
    "decision": {
        "outcome": "ACCEPTED",
        "analyst": "AC-8821",
        "timestamp": "2026-02-06T04:12:01Z"
    }
  },
  "signature": "SHA256: 9f86d081884c7d659a2feaa0c55ad015..."
}`}
                </pre>
              </div>

              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm p-6 flex flex-col justify-center text-center">
                <div className="w-10 h-10 mx-auto mb-4 text-[#D4B483] opacity-80">
                  <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <h3 className="text-xs font-bold text-[#E5E5E0] uppercase tracking-wide mb-2">Compliance Guarantee</h3>
                <p className="text-[10px] text-[#666] leading-relaxed">
                  All exports are system-generated and cryptographicly signed. No manual editing or redaction is possible after generation.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentView === "audit" && (
          <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] overflow-hidden flex flex-col h-[750px] animate-in fade-in duration-300 shadow-sm">
            <div className="px-8 py-6 border-b border-[#1F1F1F] bg-[#0F0F0F]/50 flex justify-between items-center">
              <div>
                <h2 className="text-xs font-bold text-[#E5E5E0] uppercase tracking-[0.15em] mb-1.5">Audit Ledger</h2>
                <p className="text-[10px] text-[#555] uppercase tracking-wide">Immutable record of analyst interventions</p>
              </div>
              <span className="text-[9px] font-mono text-[#333] bg-[#0E0E0E] px-2 py-1 rounded-sm border border-[#1A1A1A]">
                LEDGER_VER: v4.2.1
              </span>
            </div>

            <div className="overflow-y-auto flex-1">
              {auditLog.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0A0A0A] text-[#444] font-semibold border-b border-[#1A1A1A] sticky top-0 z-10">
                    <tr>
                      <th className="px-8 py-4 font-bold text-[9px] uppercase tracking-wider text-[#333]">TIMESTAMP</th>
                      <th className="px-6 py-4 font-bold text-[9px] uppercase tracking-wider text-[#333]">CASE ID</th>
                      <th className="px-6 py-4 font-bold text-[9px] uppercase tracking-wider text-[#333]">ACTION TYPE</th>
                      <th className="px-6 py-4 font-bold text-[9px] uppercase tracking-wider text-[#333]">JUSTIFICATION NOTE</th>
                      <th className="px-6 py-4 font-bold text-[9px] uppercase tracking-wider text-[#333]">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#141414]">
                    {auditLog.map((log) => (
                      <tr key={log.id} className="hover:bg-[#0E0E0E] transition-colors group">
                        <td className="px-8 py-4 text-[#555] whitespace-nowrap font-mono text-[10px]">{log.timestamp}</td>
                        <td className="px-6 py-4 font-mono text-[#D4B483] text-[10px]">#{log.caseId?.substring(0, 6)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-tight ${log.outcome === "Accepted" ? "text-emerald-500/80 bg-emerald-950/10 border border-emerald-900/40" : "text-amber-500/80 bg-amber-950/10 border border-amber-900/40"}`}>
                            {log.outcome === "Accepted" ? "APPROVED" : "OVERRIDE"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#777] text-[10px] max-w-md truncate font-mono">{log.notes}</td>
                        <td className="px-6 py-4 text-[9px] text-[#333] font-bold uppercase tracking-widest">COMMITTED</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-30">
                  <span className="text-xs text-[#555] uppercase tracking-[0.2em] mb-2 font-bold">NO RECORDS FOUND</span>
                  <span className="text-[10px] text-[#333] font-mono">Ledger is empty for current session</span>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
            {/* LEFT COLUMN: SIDEBAR (4 cols) */}
            <div className="lg:col-span-4 space-y-8">

              {/* Systems Overview & Filters */}
              <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-8 relative overflow-hidden group hover:border-[#262626] transition-colors shadow-sm">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em] mb-3">Systems Overview</h2>
                    <div className="flex items-baseline gap-3">
                      <span className="text-5xl font-thin text-[#E5E5E0] tracking-tighter">{activeScenarios.length}</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-[#CCC] uppercase tracking-wide">Active Cases</span>
                        <span className="text-[9px] text-[#555] uppercase tracking-wide">Requiring Action</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-16 w-16 opacity-60 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={portfolioData} cx="50%" cy="50%" innerRadius={14} outerRadius={28} dataKey="value" stroke="none">
                          {portfolioData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Filters - Tucked neatly below status */}
                <div className="space-y-3 pt-5 border-t border-[#141414]">
                  <div className="relative group/search">
                    <svg className="w-3.5 h-3.5 absolute left-3 top-3 text-[#444] group-focus-within/search:text-[#D4B483] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                      type="text"
                      placeholder="SEARCH CASE ID..."
                      className="w-full text-[10px] font-bold border border-[#1F1F1F] rounded-sm pl-9 py-2.5 bg-[#0F0F0F] text-[#CCC] focus:border-[#D4B483] focus:ring-0 focus:outline-none placeholder:text-[#333] transition-colors"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 text-[10px] font-bold uppercase border border-[#1F1F1F] rounded-sm px-2 py-2.5 bg-[#0F0F0F] text-[#777] focus:border-[#D4B483] focus:ring-0 focus:outline-none hover:border-[#333] transition-colors"
                      value={riskFilter}
                      onChange={(e) => setRiskFilter(e.target.value as any)}
                    >
                      <option value="All">Filter: All</option>
                      <option value="High">Filter: High</option>
                      <option value="Medium">Filter: Mid</option>
                      <option value="Low">Filter: Low</option>
                    </select>
                    <select
                      className="flex-1 text-[10px] font-bold uppercase border border-[#1F1F1F] rounded-sm px-2 py-2.5 bg-[#0F0F0F] text-[#777] focus:border-[#D4B483] focus:ring-0 focus:outline-none hover:border-[#333] transition-colors"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as any)}
                    >
                      <option value="Date">Sort: Newest</option>
                      <option value="Score">Sort: Impact</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Priority Queue (Inbox) */}
              <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] overflow-hidden flex flex-col h-[650px] shadow-sm">
                <div className="px-6 py-5 border-b border-[#1A1A1A] flex justify-between items-center bg-[#0F0F0F]/50">
                  <div>
                    <h2 className="text-[10px] font-bold text-[#E5E5E0] uppercase tracking-[0.15em] mb-1">Priority Queue</h2>
                    <p className="text-[9px] text-[#555] uppercase tracking-wide font-medium">Cases requiring analyst review</p>
                  </div>
                  <button onClick={() => window.location.reload()} className="text-[9px] font-bold text-[#D4B483] hover:text-[#E5D4A3] uppercase tracking-wider flex items-center gap-1 bg-[#141414] px-2.5 py-1.5 rounded-sm border border-[#222] hover:border-[#333] transition-colors">
                    Sync Queue
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 p-4 space-y-2.5 scrollbar-thin scrollbar-thumb-[#222] scrollbar-track-transparent bg-[#050505]">
                  {filteredScenarios.length > 0 ? (
                    filteredScenarios.map((s) => {
                      const priority = getPriority(s.risk);
                      const sla = getSLA(s.risk);
                      const isSelected = selectedId === s.id;
                      const context = getMicroContext(s);

                      return (
                        <button
                          key={s.id}
                          onClick={() => analyzeRisk(s.id)}
                          className={`w-full text-left p-4 rounded-sm border transition-all duration-200 group relative ${isSelected
                            ? "bg-[#111] border-[#222] border-l-[3px] border-l-[#D4B483] shadow-lg ring-1 ring-[#D4B483]/10 z-10"
                            : "bg-[#0A0A0A] border-[#1A1A1A] hover:bg-[#0E0E0E] hover:border-[#262626] border-l-[3px] border-l-transparent opacity-80 hover:opacity-100"}`}
                        >
                          <div className="flex justify-between items-start mb-2.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm border uppercase tracking-wider ${priority.color}`}>
                                {priority.label}
                              </span>
                              <span className="text-[10px] font-mono font-medium text-[#555] tracking-tight">#{s.id.substring(0, 6).toUpperCase()}</span>
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-wide ${sla.color}`}>{sla.text}</span>
                          </div>

                          <h3 className={`text-sm font-medium mb-1 truncate pr-4 ${isSelected ? "text-[#E5E5E0]" : "text-[#777] group-hover:text-[#AAA]"}`}>
                            {s.name}
                          </h3>
                          <p className={`text-[9px] font-mono uppercase tracking-tight mb-4 truncated ${isSelected ? "text-[#D4B483]" : "text-[#333] group-hover:text-[#444]"}`}>
                                // {context}
                          </p>

                          <div className="flex justify-between items-center pt-3 border-t border-[#141414] mt-auto">
                            <span className="text-[9px] font-bold text-[#444] uppercase tracking-wider">{s.date}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest border ${getRiskBadgeColor(s.risk)}`}>
                              {s.risk}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                      <p className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em] mb-2">No Cases found</p>
                      <p className="text-[9px] text-[#444] uppercase tracking-wide">Adjust filters to broaden search</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Session Audit */}
              <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-0 h-[220px] flex flex-col overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-[#1A1A1A] bg-[#0F0F0F]/50">
                  <h2 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em]">Session Audit</h2>
                </div>

                <div className="overflow-y-auto flex-1">
                  {auditLog.length > 0 ? (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0A0A0A] text-[#444] font-semibold border-b border-[#141414] sticky top-0">
                        <tr>
                          <th className="px-5 py-2 font-bold text-[9px] uppercase tracking-wider text-[#333]">TIME</th>
                          <th className="px-2 py-2 font-bold text-[9px] uppercase tracking-wider text-[#333]">ID</th>
                          <th className="px-2 py-2 font-bold text-[9px] uppercase tracking-wider text-[#333]">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#141414]">
                        {auditLog.map((log) => (
                          <tr key={log.id} className="hover:bg-[#0E0E0E] transition-colors">
                            <td className="px-5 py-2.5 text-[#555] whitespace-nowrap font-mono text-[10px]">{log.timestamp}</td>
                            <td className="px-2 py-2.5 font-mono text-[#D4B483]/80 text-[10px]">#{log.caseId?.substring(0, 4)}</td>
                            <td className="px-2 py-2.5">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-tight ${log.outcome === "Accepted" ? "text-emerald-500/70" : "text-[#777]"}`}>
                                {log.outcome === "Accepted" ? "APPROVED" : "OVERRIDE"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-4 text-center opacity-30">
                      <span className="text-[10px] text-[#555] uppercase tracking-widest font-bold">NO ACTIONS LOGGED</span>
                    </div>
                  )}
                </div>
              </div>

            </div>


            {/* RIGHT COLUMN: INTELLIGENCE DASHBOARD (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              {!result ? (
                <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] border-dashed text-[#333]">
                  <div className="w-20 h-20 mb-6 opacity-10 relative grayscale animate-pulse">
                    <Image src="/risklens-logo.svg" alt="Logo" fill className="object-contain" />
                  </div>
                  <div className="text-center max-w-sm px-8">
                    <p className="text-sm font-bold text-[#666] mb-2 uppercase tracking-[0.2em]">System Active</p>
                    <p className="text-[10px] text-[#555] uppercase tracking-wide leading-relaxed">
                      RiskLens is monitoring transaction vectors in real time. <br />
                      Select a flagged case from the Priority Queue to initialize investigation.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-700">

                  {/* HERO CARD: Executive Intelligence */}
                  <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-0 overflow-hidden relative shadow-lg">
                    <div className={`h-1.5 w-full ${result.risk_level === "High" ? "bg-red-800" : result.risk_level === "Medium" ? "bg-amber-700" : "bg-emerald-800"}`}></div>

                    <div className="p-10">
                      <div className="flex flex-col md:flex-row gap-12 items-start">

                        {/* Score Logic */}
                        <div className="flex-shrink-0 relative pt-2">
                          <div className="flex flex-col items-center">
                            <span className="text-8xl font-thin tracking-tighter text-[#E5E5E0] mb-4 drop-shadow-lg">{result.risk_score}</span>
                            <span className={`px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-[0.2em] border shadow-sm ${getRiskBadgeColor(result.risk_level)}`}>
                              {result.risk_level} Risk
                            </span>
                          </div>
                        </div>

                        {/* Summary Logic */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2.5 mb-5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#D4B483]"></div>
                            <h2 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em]">Executive Summary</h2>
                          </div>
                          <p className="text-xl text-[#CCC] leading-relaxed font-light mb-10 border-l-[3px] border-[#1A1A1A] pl-8">
                            {result.explanation}
                          </p>

                          <div className="flex flex-wrap gap-x-12 gap-y-6 text-xs border-t border-[#141414] pt-8">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-[#111] rounded-sm text-[#444] border border-[#1A1A1A]">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                              </div>
                              <div>
                                <span className="text-[#555] uppercase text-[9px] font-bold tracking-wider block mb-0.5">Global Percentile</span>
                                <span className="text-[#E5E5E0] font-mono font-medium text-sm">Top {100 - getRiskPercentile}%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-[#111] rounded-sm text-[#444] border border-[#1A1A1A]">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </div>
                              <div>
                                <span className="text-[#555] uppercase text-[9px] font-bold tracking-wider block mb-0.5">Model Confidence</span>
                                <span className="text-[#D4B483] font-mono font-medium text-sm">{Math.round(result.confidence_score * 100)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Banner */}
                    <div className="bg-[#0C0C0C] px-10 py-6 border-t border-[#1F1F1F] flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <span className="text-[10px] font-bold text-[#555] uppercase tracking-[0.15em] block">Recommended Action</span>
                        <span className="text-xs font-bold text-[#D4B483] uppercase tracking-wide flex items-center gap-3 px-4 py-2 bg-[#161616] border border-[#222] rounded-sm shadow-sm group cursor-default">
                          {result.recommended_action}
                          <svg className="w-3.5 h-3.5 text-[#D4B483] group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        </span>
                      </div>
                      <div className="text-right flex items-center gap-6">
                        <span className="text-[10px] font-bold text-[#555] uppercase tracking-[0.15em] block">Impact Projection</span>
                        <span className="text-[10px] font-medium text-[#CCC] bg-[#161616] px-3 py-1.5 rounded-sm border border-[#262626]">
                          {result.recommendation_impact}
                        </span>
                      </div>
                    </div>
                  </div>


                  {/* Comparison & Context Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Business Context */}
                    <div className="md:col-span-2 bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-8 shadow-sm">
                      <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        Strategic Context
                      </h3>
                      <p className="text-sm font-light text-[#BBB] leading-loose">
                        {result.business_impact}
                      </p>
                    </div>

                    {/* Simulation Widget */}
                    <div className="bg-[#0F0F0F] rounded-sm border border-[#1F1F1F] p-8 shadow-inner">
                      <h3 className="text-[10px] font-bold text-[#D4B483] uppercase tracking-[0.2em] mb-4 opacity-70">Simulation Engine</h3>
                      <select
                        className="w-full text-[10px] font-medium uppercase tracking-wide border border-[#333] bg-[#0A0A0A] text-[#CCC] rounded-sm focus:border-[#D4B483] focus:ring-0 focus:outline-none mb-6 py-3 px-3 shadow-sm"
                        value={simulationAction}
                        onChange={(e) => handleSimulation(e.target.value)}
                      >
                        <option value="">Simulate Event...</option>
                        <option value="withdrawal">Event: Withdrawal</option>
                        <option value="profile">Event: Profile Edit</option>
                        <option value="geo">Event: Geo-Hop</option>
                      </select>
                      {simulationAction && (
                        <div className="flex items-center gap-2 text-[9px] text-[#888] border-t border-[#222] pt-4 uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4B483] animate-pulse"></span>
                          Running local inference...
                        </div>
                      )}
                    </div>
                  </div>


                  {/* Decision Justification Layer */}
                  <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-8 relative overflow-hidden">
                    <h3 className="text-sm font-bold text-[#E5E5E0] uppercase tracking-[0.15em] mb-6 flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4B483]"></span>
                      Decision Justification
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="relative">
                        <h4 className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-3">Why this action?</h4>
                        <p className="text-xs text-[#CCC] leading-relaxed font-mono border-l border-[#333] pl-3">
                          {getJustificationDetails(result).chosen}
                        </p>
                      </div>
                      <div className="relative">
                        <h4 className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-3">Why not alternatives?</h4>
                        <p className="text-xs text-[#888] leading-relaxed font-mono border-l border-[#222] pl-3">
                          {getJustificationDetails(result).rejected}
                        </p>
                      </div>
                      <div className="relative">
                        <h4 className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-3">Risk Avoidance</h4>
                        <p className="text-xs text-[#D4B483] leading-relaxed font-mono border-l border-[#D4B483]/30 pl-3">
                          {getJustificationDetails(result).avoided}
                        </p>
                      </div>
                    </div>
                  </div>


                  {/* Explainability Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-8 relative overflow-hidden">
                      <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em] mb-5 border-b border-[#1A1A1A] pb-3">Analysis Vectors</h3>
                      <ul className="text-xs text-[#999] leading-relaxed space-y-4 font-mono">
                        {result.risk_signals.map((signal, i) => (
                          <li key={i} className="flex gap-4 items-start">
                            <div className="mt-1.5 w-1 h-1 rounded-full bg-[#D4B483]"></div>
                            {signal}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-[#111] rounded-sm border border-[#1F1F1F] p-8 relative overflow-hidden">
                      <h3 className="text-[10px] font-bold text-[#555] uppercase tracking-[0.2em] mb-5 border-b border-[#222] pb-3">Counterfactual</h3>
                      <p className="text-xs leading-loose text-[#888] font-mono pl-2 border-l border-[#333]">
                        &quot;{result.why_not_low}&quot;
                      </p>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Risk Velocity */}
                    <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-8">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em]">Velocity Trend (72h)</h3>
                        <span className="text-[9px] text-[#D4B483] bg-[#D4B483]/5 border border-[#D4B483]/30 px-2 py-0.5 rounded-sm tracking-wider">LIVE</span>
                      </div>
                      <div className="h-48 w-full opacity-90">
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
                    <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-8">
                      <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em] mb-6">Factor Weighting</h3>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart layout="vertical" data={currentScenario?.visualizationData.breakdown} margin={{ top: 0, right: 10, left: 10, bottom: 0 }} barCategoryGap={18}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="signal" type="category" width={80} tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#666', fontWeight: 400, fontFamily: 'monospace' }} />
                            <Tooltip cursor={{ fill: '#1a1a1a' }} contentStyle={{ fontSize: '11px', backgroundColor: '#000', borderColor: '#333', color: '#ccc' }} />
                            <Bar dataKey="impact" fill="#333" radius={[0, 2, 2, 0]} barSize={8} background={{ fill: '#0F0F0F' }}>
                              {currentScenario?.visualizationData.breakdown.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#444' : '#666'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Decision Workflow */}
                  <div className="bg-[#0F0F0F] rounded-sm border border-[#1F1F1F] p-10">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-sm font-bold text-[#E5E5E0] flex items-center gap-4">
                        <span className="w-1.5 h-4 bg-[#D4B483]"></span>
                        HUMAN REVIEW & OVERRIDE
                      </h3>
                      {!decision && (
                        <span className="text-[9px] font-bold text-[#D4B483] bg-[#D4B483]/10 border border-[#D4B483]/30 px-2 py-1 rounded-sm uppercase tracking-wider animate-pulse">
                          AI Recommendation Pending Human Review
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div>
                        <label className="block text-[9px] font-bold text-[#666] uppercase tracking-[0.2em] mb-4">
                          Analyst Justification {decision === 'Overridden' && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                          className={`w-full border rounded-sm bg-[#050505] text-sm text-[#CCC] p-5 focus:ring-0 focus:outline-none min-h-[140px] placeholder-[#333] font-mono leading-relaxed transition-colors ${!notes && decision !== 'Accepted' ? "border-amber-900/40 focus:border-amber-700/60" : "border-[#333] focus:border-[#D4B483]"}`}
                          placeholder=">> ENTER RATIONALE FOR RECORD..."
                          value={notes}
                          onChange={(e) => saveCurrentNote(e.target.value)}
                        />
                        {!notes && decision !== 'Accepted' && (
                          <div className="mt-3 flex items-center gap-2 animate-in fade-in duration-500">
                            <span className="w-1 h-1 rounded-full bg-amber-500/50"></span>
                            <p className="text-[9px] text-amber-500/60 font-mono tracking-wide uppercase">
                              Justification is required to override AI recommendations.
                            </p>
                          </div>
                        )}
                        {/* Analyst Feedback Loop */}
                        <div className="mt-8 flex items-center justify-between text-[10px] text-[#555] border-t border-[#222] pt-5 uppercase tracking-wide">
                          <span>Model Feedback Loop</span>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleFeedback("helpful")}
                              className={`px-4 py-2 rounded-sm border text-[9px] font-bold transition-colors ${selectedId && feedback[selectedId] === 'helpful' ? 'bg-[#1A1A1A] border-[#D4B483] text-[#D4B483]' : 'bg-[#0A0A0A] border-[#333] hover:border-[#666]'}`}
                            >
                              ACCURATE
                            </button>
                            <button
                              onClick={() => handleFeedback("unhelpful")}
                              className={`px-4 py-2 rounded-sm border text-[9px] font-bold transition-colors ${selectedId && feedback[selectedId] === 'unhelpful' ? 'bg-[#1A1A1A] border-red-900 text-red-500' : 'bg-[#0A0A0A] border-[#333] hover:border-[#666]'}`}
                            >
                              FLAG ISSUE
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between">
                        <div>
                          <label className="block text-[9px] font-bold text-[#666] uppercase tracking-[0.2em] mb-4">
                            Review Outcome
                          </label>
                          <div className="flex gap-5 mb-8">
                            <button
                              onClick={() => {
                                console.log("AI decision accepted by analyst");
                                handleDecision("Accepted");
                              }}
                              className={`flex-1 px-4 py-5 rounded-sm text-[10px] font-bold uppercase tracking-[0.1em] transition-all border ${decision === "Accepted"
                                ? "bg-[#D4B483] border-[#D4B483] text-black shadow-lg shadow-[#D4B483]/20"
                                : "bg-[#0A0A0A] border-[#333] text-[#666] hover:text-[#CCC] hover:border-[#666]"
                                }`}
                            >
                              Accept AI Recommendation
                            </button>
                            <button
                              disabled={!notes}
                              onClick={() => {
                                console.log("AI decision overridden by analyst");
                                handleDecision("Overridden");
                              }}
                              className={`flex-1 px-4 py-5 rounded-sm text-[10px] font-bold uppercase tracking-[0.1em] transition-all border ${decision === "Overridden"
                                ? "bg-[#333] border-[#555] text-white shadow-lg shadow-white/5"
                                : !notes
                                  ? "bg-[#050505] border-[#1A1A1A] text-[#333] cursor-not-allowed opacity-50"
                                  : "bg-[#0A0A0A] border-[#333] text-[#666] hover:text-[#CCC] hover:border-[#666] cursor-pointer"
                                }`}
                            >
                              Override Recommendation
                            </button>
                          </div>

                          {decision && (
                            <div className="bg-[#111] border border-[#222] rounded-sm p-5 text-center animate-in zoom-in-95 duration-300">
                              <p className="text-[9px] text-[#555] uppercase tracking-widest font-bold mb-1.5">Status</p>
                              <p className={`text-sm font-bold uppercase tracking-wide ${decision === "Accepted" ? "text-emerald-500" : "text-[#D4B483]"}`}>
                                {decision === "Accepted" ? "AI Recommendation Accepted" : "Overridden by Analyst"}
                              </p>
                            </div>
                          )}
                        </div>

                        <p className="text-[9px] text-[#444] mt-5 leading-tight uppercase tracking-wider">
                          * All human actions are logged for regulatory review
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </main >
  );
}
