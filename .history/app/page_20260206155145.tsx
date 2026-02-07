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
  ReferenceLine,
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
  const [caseStatus, setCaseStatus] = useState<Record<string, 'NEW' | 'IN-REVIEW' | 'RESOLVED'>>({});
  const [caseOpenedAt, setCaseOpenedAt] = useState<Record<string, number>>({});

  // Navigation & View State
  const [currentView, setCurrentView] = useState<"dashboard" | "policies" | "audit" | "exports">("dashboard");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"All" | "Urgent" | "Active" | "Resolved">("All");

  // Interactive Action Panel State
  const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);
  const [actionExecutionState, setActionExecutionState] = useState<'idle' | 'loading' | 'applied'>('idle');
  const [isImpactExpanded, setIsImpactExpanded] = useState(false);

  // Final Polish State
  const [userRole, setUserRole] = useState<"Senior Analyst" | "Compliance Manager">("Senior Analyst");
  const [justificationError, setJustificationError] = useState(false);
  const [ledgerSort, setLedgerSort] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'timestamp', direction: 'desc' });
  const [exportProgress, setExportProgress] = useState<Record<string, number>>({});
  const [impactGlow, setImpactGlow] = useState(false);

  const handleLedgerSort = (key: string) => {
    setLedgerSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedAuditLog = useMemo(() => {
    return [...auditLog].sort((a, b) => {
      const { key, direction } = ledgerSort;
      let valA = (a as any)[key];
      let valB = (b as any)[key];

      if (key === 'timestamp') {
        return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return direction === 'asc' ? (valA < valB ? -1 : 1) : (valB < valA ? -1 : 1);
    });
  }, [auditLog, ledgerSort]);

  const handleExportSimulation = (id: string, format: string) => {
    setExportProgress(prev => ({ ...prev, [id]: 1 }));
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setExportProgress(prev => ({ ...prev, [id]: progress }));
    }, 300);
  };

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

  // Computed Scenarios for Inbox with Smart Queue Sorting
  const filteredScenarios = useMemo(() => {
    const now = Date.now();
    return activeScenarios
      .filter((s) => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = riskFilter === "All" || s.risk === riskFilter;

        // Header Metric Filters
        const status = caseStatus[s.id] || 'NEW';
        if (activeFilter === "Urgent" && s.risk !== "High") return false;
        if (activeFilter === "Active" && status === "RESOLVED") return false;
        if (activeFilter === "Resolved" && status !== "RESOLVED") return false;

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        // Smart Queue: Sort by status (RESOLVED last), then urgency (High first), then date
        const statusA = caseStatus[a.id] || 'NEW';
        const statusB = caseStatus[b.id] || 'NEW';
        if (statusA === 'RESOLVED' && statusB !== 'RESOLVED') return 1;
        if (statusB === 'RESOLVED' && statusA !== 'RESOLVED') return -1;

        // Then by urgency (risk level)
        const riskOrder = { High: 0, Medium: 1, Low: 2 };
        const riskDiff = riskOrder[a.risk as keyof typeof riskOrder] - riskOrder[b.risk as keyof typeof riskOrder];
        if (riskDiff !== 0) return riskDiff;

        // Finally by sort preference
        if (sortOrder === "Score") {
          const scoreA = a.risk === "High" ? 88 : a.risk === "Medium" ? 65 : 12;
          const scoreB = b.risk === "High" ? 88 : b.risk === "Medium" ? 65 : 12;
          return scoreB - scoreA;
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [searchQuery, riskFilter, sortOrder, activeScenarios, caseStatus]);

  const analyzeRisk = useCallback(async (id: string, scenarioData?: any) => {
    setLoading(true);

    // Optimistic UI updates
    const scenario = scenarioData || activeScenarios.find((s) => s.id === id);
    if (!scenario) return;

    if (!scenarioData) {
      setSelectedId(id);
      // Mark as IN-REVIEW when opened
      setCaseStatus(prev => ({ ...prev, [id]: 'IN-REVIEW' }));
      setCaseOpenedAt(prev => ({ ...prev, [id]: Date.now() }));
    }

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
    if (!selectedId) return;

    // MANDATORY CHECK: Justification required for Overridden status
    if (outcome === 'Overridden' && !notes.trim()) {
      setJustificationError(true);
      return;
    }
    setJustificationError(false);

    setDecision(outcome);

    // Apply simulation if accepted (simulating that the recommendation works)
    if (outcome === 'Accepted' && currentScenario) {
      // Generic improvement if accepted
      handleSimulation("profile");
    }

    // Mark case as RESOLVED
    setCaseStatus(prev => ({ ...prev, [selectedId]: 'RESOLVED' }));

    const newLog = {
      id: `DEC-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      caseId: selectedId,
      outcome: outcome,
      notes: notes.trim() ? notes.trim() : "Accepted automated recommendation."
    };
    setAuditLog(prev => [newLog, ...prev]);

    // Clear notes for next case
    setNotes("");
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
      visualizationData: {
        ...currentScenario.visualizationData,
        history: newHistory,
        interventionPoints: [...((currentScenario.visualizationData as any).interventionPoints || []), "Now"]
      } as any
    };

    const newScenarios = activeScenarios.map(s => s.id === selectedId ? updatedScenario : s);
    setActiveScenarios(newScenarios);

    // Re-run analysis immediately
    analyzeRisk(currentScenario.id, updatedScenario);
  };

  // --- ACTION PANEL LOGIC ---
  // Simulates executing the recommended action (demo-safe, no real backend)
  const handleExecuteAction = () => {
    setActionExecutionState('loading');

    // Simulate network delay for realistic feel
    setTimeout(() => {
      setActionExecutionState('applied');

      // TRIGGER SIMULATION EFFECT
      if (currentScenario) {
        let actionKey = "";
        if (result?.recommended_action.toLowerCase().includes("withdrawal")) actionKey = "withdrawal";
        else if (result?.recommended_action.toLowerCase().includes("verification")) actionKey = "profile"; // Verification is linked to profile sync
        else actionKey = "geo";

        handleSimulation(actionKey);
      }

      // Auto-set decision as Accepted if it was the recommended one
      setDecision("Accepted");
      if (selectedId) {
        setCaseStatus(prev => ({ ...prev, [selectedId]: 'RESOLVED' }));
      }

      // Auto-close panel after applied
      setTimeout(() => {
        setIsActionPanelOpen(false);
        // Reset state after panel closes
        setTimeout(() => setActionExecutionState('idle'), 300);
      }, 1500);
    }, 1200);
  };

  // Generate mock data for action panel based on current result
  const getActionPanelData = useMemo(() => {
    if (!result) return null;

    // Mock triggered policies based on risk level
    const triggeredPolicies = result.risk_level === 'High'
      ? ['POL-AML-001: High Velocity Withdrawals', 'POL-FRAUD-001: Account Takeover Detection']
      : result.risk_level === 'Medium'
        ? ['POL-KYC-002: Early Lifecycle Velocity']
        : ['POL-KYC-001: Standard KYC Review'];

    // Mock impact metrics
    const impactMetrics = {
      falsePositiveRate: result.risk_level === 'High' ? '-12%' : result.risk_level === 'Medium' ? '-8%' : '-3%',
      slaImprovement: result.risk_level === 'High' ? '+45 min saved' : '+20 min saved',
      analystWorkload: result.risk_level === 'High' ? '-2 cases/day' : '-1 case/day',
    };

    // Mock outcome projections
    const expectedOutcome = result.risk_level === 'High'
      ? 'Immediate freeze of suspicious activity. Customer notified within 24h. SAR filed if confirmed.'
      : result.risk_level === 'Medium'
        ? 'Enhanced monitoring activated. Step-up authentication required for high-value transactions.'
        : 'Case cleared for standard processing. No further action required.';

    const riskIfIgnored = result.risk_level === 'High'
      ? 'Potential regulatory fine up to $500K. Reputational damage if fraud proceeds. SAR filing deadline violation.'
      : result.risk_level === 'Medium'
        ? 'Elevated exposure to false negatives. Possible escalation to high-risk if pattern continues.'
        : 'Minimal risk. Case may resurface if new signals emerge.';

    return {
      triggeredPolicies,
      impactMetrics,
      expectedOutcome,
      riskIfIgnored,
      reasoningChain: [
        `Risk score of ${result.risk_score} exceeds ${result.risk_level === 'High' ? 'critical' : 'elevated'} threshold`,
        `${result.risk_signals.length} distinct risk signals detected`,
        `Model confidence: ${Math.round(result.confidence_score * 100)}%`,
        `Action aligns with ${triggeredPolicies.length} active policies`
      ]
    };
  }, [result]);

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

          {/* ZONE 1: Brand + Navigation */}
          <div className="flex items-center gap-14">
            <div
              className="flex items-center gap-3.5 opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => setCurrentView("dashboard")}
              title="Return to the live case queue and risk analysis interface."
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
                  <span
                    className="px-1.5 py-0.5 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center gap-1.5"
                    title="Real-time status of the RiskLens inference engine."
                  >
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
                title="Access the live case queue and risk analysis interface."
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView("policies")}
                className={`px-5 py-2 text-[10px] uppercase tracking-[0.15em] font-bold transition-all border-b-[2px] ${currentView === "policies" ? "text-[#E5E5E0] border-[#D4B483]" : "text-[#555] hover:text-[#999] border-transparent hover:border-[#222]"}`}
                title="Review the compliance policy engine governing AI decisions."
              >
                Policies
              </button>
              <button
                onClick={() => setCurrentView("audit")}
                className={`px-5 py-2 text-[10px] uppercase tracking-[0.15em] font-bold transition-all border-b-[2px] ${currentView === "audit" ? "text-[#E5E5E0] border-[#D4B483]" : "text-[#555] hover:text-[#999] border-transparent hover:border-[#222]"}`}
                title="Inspect the immutable record of all analyst interventions."
              >
                Audit Ledger
              </button>
            </div>
          </div>

          {/* ZONE 2: System State (Persistent Metrics) */}
          <div className="hidden lg:flex items-center gap-6 px-6 border-l border-r border-[#1F1F1F]">
            <div
              className={`flex items-center gap-2 cursor-pointer py-1.5 px-3 rounded-sm transition-all ${activeFilter === 'Active' ? 'bg-[#D4B483]/10 border border-[#D4B483]/30' : 'hover:bg-[#111]'}`}
              onClick={() => setActiveFilter(activeFilter === 'Active' ? 'All' : 'Active')}
              title="Filter for all active cases pending review."
            >
              <span className={`text-[9px] font-bold uppercase tracking-wider ${activeFilter === 'Active' ? 'text-[#D4B483]' : 'text-[#555]'}`}>Active</span>
              <span className={`text-sm font-bold font-mono ${activeFilter === 'Active' ? 'text-[#D4B483]' : 'text-[#E5E5E0]'}`}>{activeScenarios.length}</span>
            </div>
            <div
              className={`flex items-center gap-2 cursor-pointer py-1.5 px-3 rounded-sm transition-all ${activeFilter === 'Urgent' ? 'bg-red-950/20 border border-red-900/30' : 'hover:bg-[#111]'}`}
              onClick={() => setActiveFilter(activeFilter === 'Urgent' ? 'All' : 'Urgent')}
              title="Filter for urgent cases (High Risk)."
            >
              <span className={`text-[9px] font-bold uppercase tracking-wider ${activeFilter === 'Urgent' ? 'text-red-400' : 'text-[#555]'}`}>Urgent</span>
              <span className={`text-sm font-bold font-mono ${activeFilter === 'Urgent' ? 'text-red-400' : activeScenarios.filter(s => s.risk === 'High').length > 0 ? 'text-red-400/80' : 'text-[#666]'}`}>
                {activeScenarios.filter(s => s.risk === 'High').length}
              </span>
            </div>
            <div
              className={`flex items-center gap-2 cursor-pointer py-1.5 px-3 rounded-sm transition-all ${activeFilter === 'Resolved' ? 'bg-emerald-950/20 border border-emerald-900/30' : 'hover:bg-[#111]'}`}
              onClick={() => setActiveFilter(activeFilter === 'Resolved' ? 'All' : 'Resolved')}
              title="Filter for resolved cases in current session."
            >
              <span className={`text-[9px] font-bold uppercase tracking-wider ${activeFilter === 'Resolved' ? 'text-emerald-500' : 'text-[#555]'}`}>Resolved</span>
              <span className={`text-sm font-bold font-mono ${activeFilter === 'Resolved' ? 'text-emerald-500' : 'text-emerald-500/80'}`}>{auditLog.length}</span>
            </div>
          </div>

          {/* ZONE 3: User Actions */}
          <div className="flex items-center gap-10">
            <button
              onClick={() => setCurrentView("exports")}
              className={`text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2.5 group px-3 py-1.5 rounded-sm border ${currentView === 'exports' ? 'bg-[#1A1A1A] border-[#D4B483] text-[#D4B483]' : 'bg-[#0F0F0F] hover:bg-[#141414] border-[#222] text-[#666] hover:text-[#D4B483]'}`}
              title="Generate cryptographically signed compliance artifacts."
            >
              <svg className={`w-3 h-3 transition-opacity ${currentView === 'exports' ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export Data
            </button>
            <div className="flex items-center gap-3.5 pl-6 border-l border-[#1F1F1F]">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-bold text-[#CCC] uppercase tracking-wider">Alex Chen</p>
                <p className="text-[9px] text-[#D4B483] uppercase tracking-widest font-mono">{userRole.toUpperCase()}</p>
              </div>
              <div className="relative" id="user-profile-dropdown">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="h-8 w-8 rounded-sm bg-[#111] border border-[#262626] flex items-center justify-center text-[10px] font-bold text-[#D4B483] hover:border-[#D4B483]/50 transition-colors cursor-pointer"
                  title="View session context and manage authenticated session."
                >
                  AC
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 top-11 w-52 bg-[#0F0F0F] border border-[#222] rounded-sm shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 py-1">
                    <div className="px-4 py-3 border-b border-[#222] bg-[#0A0A0A]">
                      <p className="text-[9px] text-[#555] uppercase tracking-widest font-bold mb-1">Session Context</p>
                      <p className="text-[10px] text-[#D4B483] font-mono">RL-8829-QX-P4</p>
                    </div>
                    <button className="w-full text-left px-4 py-2.5 text-[10px] uppercase font-bold text-[#888] hover:text-[#E5E5E0] hover:bg-[#161616] transition-colors flex items-center gap-3">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      Account Profile
                    </button>
                    <button className="w-full text-left px-4 py-2.5 text-[10px] uppercase font-bold text-[#888] hover:text-[#E5E5E0] hover:bg-[#161616] transition-colors flex items-center gap-3">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Preferences
                    </button>
                    <button
                      onClick={() => setUserRole(userRole === "Senior Analyst" ? "Compliance Manager" : "Senior Analyst")}
                      className="w-full text-left px-4 py-2.5 text-[10px] uppercase font-bold text-[#D4B483] hover:text-[#E5C594] hover:bg-[#161616] transition-colors flex items-center gap-3"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                      Switch Role: {userRole === "Senior Analyst" ? "Manager" : "Analyst"}
                    </button>
                    <div className="h-[1px] bg-[#222] my-1"></div>
                    <button
                      className="w-full text-left px-4 py-2.5 text-[10px] uppercase font-bold text-red-500/70 hover:text-red-400 hover:bg-red-950/10 transition-colors flex items-center gap-3"
                      onClick={() => window.location.reload()}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Sign Out
                    </button>
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
                  Compliance rule definitions governing AI risk evaluation. All policies are version-controlled, audit-logged, and require dual approval for modifications.
                </p>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <div className="text-center">
                  <span className="block text-4xl font-thin text-[#D4B483] mb-1">6</span>
                  <span className="text-[9px] uppercase tracking-widest text-[#555] font-bold">Active Policies</span>
                </div>
                <div className="text-center">
                  <span className="block text-4xl font-thin text-emerald-500/80 mb-1">100%</span>
                  <span className="text-[9px] uppercase tracking-widest text-[#555] font-bold">Enforced</span>
                </div>
              </div>
            </div>

            {/* Policy Categories */}
            <div className="space-y-6">

              {/* AML Section */}
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#1A1A1A] bg-[#0F0F0F]/50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-red-500/60"></span>
                    <h3 className="text-[11px] font-bold text-[#CCC] uppercase tracking-[0.15em]">Anti-Money Laundering (AML)</h3>
                  </div>
                  <span className="text-[8px] font-mono text-[#444] bg-[#111] border border-[#222] px-2 py-1 rounded-sm uppercase tracking-wider">
                    Regulatory: BSA · FinCEN · FATF
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-x divide-[#1A1A1A]">
                  {/* AML Policy 1 */}
                  <div className="p-6 hover:bg-[#0C0C0C] transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-[#CCC] mb-1">High Velocity Withdrawals</h4>
                        <span className="text-[9px] text-[#555] font-mono">POL-AML-001</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[9px] text-emerald-500/70 font-bold uppercase tracking-wide">Enforced</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#666] leading-relaxed mb-4 font-mono border-l-2 border-[#1A1A1A] pl-3">
                      Detects structuring behavior: multiple withdrawals designed to evade reporting thresholds.
                    </p>
                    <div className="bg-[#080808] p-3 rounded-sm border border-[#151515] mb-4">
                      <p className="text-[8px] text-[#444] uppercase tracking-widest mb-1.5 font-bold">Business Intent</p>
                      <p className="text-[10px] text-[#888] leading-relaxed">
                        Prevent regulatory violations under BSA $10,000 CTR requirements. Structuring is a federal crime (31 USC § 5324).
                      </p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[8px] text-[#444] uppercase tracking-widest font-bold">Threshold</p>
                        <p className="text-[10px] text-[#D4B483] font-mono">FLOW_RATE &gt; 3 txns/hr AND AMT &gt; 2.5σ</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] text-[#444] uppercase tracking-widest font-bold">Affected</p>
                        <p className="text-[10px] text-[#CCC] font-mono">{activeScenarios.filter(s => s.risk === 'High').length} cases</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#151515] flex justify-between items-center">
                      <span className="text-[8px] text-[#333] font-mono">Last triggered: 2h ago</span>
                      <button
                        onClick={() => handleSimulation("withdrawal")}
                        className="text-[9px] text-[#D4B483] hover:text-[#E5C594] font-bold uppercase tracking-widest flex items-center gap-1.5 px-2 py-1 rounded-sm hover:bg-[#D4B483]/5 transition-all"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                        Test Policy
                      </button>
                    </div>
                  </div>

                  {/* AML Policy 2 */}
                  <div className="p-6 hover:bg-[#0C0C0C] transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-[#CCC] mb-1">Rapid Geo-Location Switching</h4>
                        <span className="text-[9px] text-[#555] font-mono">POL-AML-002</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[9px] text-emerald-500/70 font-bold uppercase tracking-wide">Enforced</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#666] leading-relaxed mb-4 font-mono border-l-2 border-[#1A1A1A] pl-3">
                      Identifies impossible travel patterns suggesting credential compromise or proxy usage.
                    </p>
                    <div className="bg-[#080808] p-3 rounded-sm border border-[#151515] mb-4">
                      <p className="text-[8px] text-[#444] uppercase tracking-widest mb-1.5 font-bold">Business Intent</p>
                      <p className="text-[10px] text-[#888] leading-relaxed">
                        Flag account takeover attempts. Protects customer assets and limits platform liability under negligence claims.
                      </p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[8px] text-[#444] uppercase tracking-widest font-bold">Threshold</p>
                        <p className="text-[10px] text-[#D4B483] font-mono">GEO_DIST &gt; 500km AND TIME &lt; 2h</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] text-[#444] uppercase tracking-widest font-bold">Affected</p>
                        <p className="text-[10px] text-[#CCC] font-mono">{activeScenarios.filter(s => s.data?.geo_switches > 0).length} cases</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#151515] flex justify-between items-center">
                      <span className="text-[8px] text-[#333] font-mono">Last triggered: 45m ago</span>
                      <button
                        onClick={() => handleSimulation("geo")}
                        className="text-[9px] text-[#D4B483] hover:text-[#E5C594] font-bold uppercase tracking-widest flex items-center gap-1.5 px-2 py-1 rounded-sm hover:bg-[#D4B483]/5 transition-all"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                        Test Policy
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* KYC Section */}
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#1A1A1A] bg-[#0F0F0F]/50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-amber-500/60"></span>
                    <h3 className="text-[11px] font-bold text-[#CCC] uppercase tracking-[0.15em]">Know Your Customer (KYC)</h3>
                  </div>
                  <span className="text-[8px] font-mono text-[#444] bg-[#111] border border-[#222] px-2 py-1 rounded-sm uppercase tracking-wider">
                    Regulatory: CDD Rule · OFAC · EU AMLD
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-x divide-[#1A1A1A]">
                  {/* KYC Policy 1 */}
                  <div className="p-6 hover:bg-[#0C0C0C] transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-[#CCC] mb-1">Identity Document Mismatch</h4>
                        <span className="text-[9px] text-[#555] font-mono">POL-KYC-001</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[9px] text-emerald-500/70 font-bold uppercase tracking-wide">Enforced</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#666] leading-relaxed mb-4 font-mono border-l-2 border-[#1A1A1A] pl-3">
                      Detects discrepancies between session data and verified KYC records (name, DOB, address).
                    </p>
                    <div className="bg-[#080808] p-3 rounded-sm border border-[#151515] mb-4">
                      <p className="text-[8px] text-[#444] uppercase tracking-widest mb-1.5 font-bold">Business Intent</p>
                      <p className="text-[10px] text-[#888] leading-relaxed">
                        Prevent synthetic identity fraud. Ensures compliance with CDD beneficial ownership requirements.
                      </p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[8px] text-[#444] uppercase tracking-widest font-bold">Threshold</p>
                        <p className="text-[10px] text-[#D4B483] font-mono">FUZZY_MATCH &lt; 0.85 ON [PII]</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] text-[#444] uppercase tracking-widest font-bold">Affected</p>
                        <p className="text-[10px] text-[#CCC] font-mono">{activeScenarios.filter(s => s.data?.profile_changes > 2).length} cases</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#151515] flex justify-between items-center">
                      <span className="text-[8px] text-[#333] font-mono">Last triggered: 1d ago</span>
                      <span className="text-[8px] text-red-500/50 font-bold uppercase tracking-wider flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m10-6a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Read-Only
                      </span>
                    </div>
                  </div>

                  {/* KYC Policy 2 */}
                  <div className="p-6 hover:bg-[#0C0C0C] transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-[#CCC] mb-1">Early Lifecycle Velocity</h4>
                        <span className="text-[9px] text-[#555] font-mono">POL-KYC-002</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[9px] text-emerald-500/70 font-bold uppercase tracking-wide">Enforced</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#666] leading-relaxed mb-4 font-mono border-l-2 border-[#1A1A1A] pl-3">
                      Monitors new accounts (&lt;30 days) for unusual transaction patterns or rapid config changes.
                    </p>
                    <div className="bg-[#080808] p-3 rounded-sm border border-[#151515] mb-4">
                      <p className="text-[8px] text-[#444] uppercase tracking-widest mb-1.5 font-bold">Business Intent</p>
                      <p className="text-[10px] text-[#888] leading-relaxed">
                        Catch mule accounts early. New account fraud represents 15% of platform losses.
                      </p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[8px] text-[#444] uppercase tracking-widest font-bold">Threshold</p>
                        <p className="text-[10px] text-[#D4B483] font-mono">ACCT_AGE &lt; 30d AND TX &gt; $5K</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] text-[#444] uppercase tracking-widest font-bold">Affected</p>
                        <p className="text-[10px] text-[#CCC] font-mono">{activeScenarios.filter(s => s.data?.account_age_days < 30).length} cases</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#151515] flex justify-between items-center">
                      <span className="text-[8px] text-[#333] font-mono">Last triggered: 3h ago</span>
                      <span className="text-[8px] text-red-500/50 font-bold uppercase tracking-wider flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m10-6a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Read-Only
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fraud Section */}
              <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#1A1A1A] bg-[#0F0F0F]/50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-cyan-500/60"></span>
                    <h3 className="text-[11px] font-bold text-[#CCC] uppercase tracking-[0.15em]">Fraud Prevention</h3>
                  </div>
                  <span className="text-[8px] font-mono text-[#444] bg-[#111] border border-[#222] px-2 py-1 rounded-sm uppercase tracking-wider">
                    Internal: Risk Appetite Framework
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-x divide-[#1A1A1A]">
                  {/* Fraud Policy 1 */}
                  <div className="p-6 hover:bg-[#0C0C0C] transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-[#CCC] mb-1">Account Takeover Detection</h4>
                        <span className="text-[9px] text-[#555] font-mono">POL-FRD-001</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[9px] text-emerald-500/70 font-bold uppercase tracking-wide">Enforced</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#666] leading-relaxed mb-4 font-mono border-l-2 border-[#1A1A1A] pl-3">
                      Multi-signal detection for established accounts showing sudden behavioral changes.
                    </p>
                    <div className="bg-[#080808] p-3 rounded-sm border border-[#151515] mb-4">
                      <p className="text-[8px] text-[#444] uppercase tracking-widest mb-1.5 font-bold">Business Intent</p>
                      <p className="text-[10px] text-[#888] leading-relaxed">
                        Protect high-value customers. ATO losses average $12K per incident with reputational damage.
                      </p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[8px] text-[#444] uppercase tracking-widest font-bold">Threshold</p>
                        <p className="text-[10px] text-[#D4B483] font-mono">BEHAV_DELTA &gt; 3σ AND ACCT &gt; 90d</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] text-[#444] uppercase tracking-widest font-bold">Affected</p>
                        <p className="text-[10px] text-[#CCC] font-mono">{activeScenarios.filter(s => s.data?.account_age_days > 90 && s.risk === 'High').length} cases</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#151515] flex justify-between items-center">
                      <span className="text-[8px] text-[#333] font-mono">Last triggered: 30m ago</span>
                      <span className="text-[8px] text-red-500/50 font-bold uppercase tracking-wider flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m10-6a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Read-Only
                      </span>
                    </div>
                  </div>

                  {/* Fraud Policy 2 */}
                  <div className="p-6 hover:bg-[#0C0C0C] transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-[#CCC] mb-1">Dormant Account Reactivation</h4>
                        <span className="text-[9px] text-[#555] font-mono">POL-FRD-002</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[9px] text-emerald-500/70 font-bold uppercase tracking-wide">Enforced</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#666] leading-relaxed mb-4 font-mono border-l-2 border-[#1A1A1A] pl-3">
                      Flags long-dormant accounts that suddenly initiate high-value transactions.
                    </p>
                    <div className="bg-[#080808] p-3 rounded-sm border border-[#151515] mb-4">
                      <p className="text-[8px] text-[#444] uppercase tracking-widest mb-1.5 font-bold">Business Intent</p>
                      <p className="text-[10px] text-[#888] leading-relaxed">
                        Detect credential stuffing on forgotten accounts. Common vector for money mule networks.
                      </p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[8px] text-[#444] uppercase tracking-widest font-bold">Threshold</p>
                        <p className="text-[10px] text-[#D4B483] font-mono">LAST_LOGIN &gt; 180d AND TX &gt; $1K</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] text-[#444] uppercase tracking-widest font-bold">Affected</p>
                        <p className="text-[10px] text-[#CCC] font-mono">{activeScenarios.filter(s => s.data?.account_age_days > 500).length} cases</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#151515] flex justify-between items-center">
                      <span className="text-[8px] text-[#333] font-mono">Last triggered: 6h ago</span>
                      <span className="text-[8px] text-red-500/50 font-bold uppercase tracking-wider flex items-center gap-1">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m10-6a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Read-Only
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Disclaimer */}
            <div className="bg-[#080808] border border-[#151515] rounded-sm p-4 text-center">
              <p className="text-[9px] text-[#444] uppercase tracking-widest leading-relaxed">
                Policy modifications require dual approval from Compliance Officer and Risk Committee. All changes are version-controlled and audit-logged per SOC 2 Type II requirements.
              </p>
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
                <button
                  onClick={() => handleExportSimulation('case', 'JSON')}
                  disabled={exportProgress['case'] > 0 && exportProgress['case'] < 100}
                  className="w-full py-2 border border-[#222] text-[10px] font-bold uppercase tracking-widest text-[#555] hover:text-[#CCC] hover:border-[#444] rounded-sm transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
                >
                  {exportProgress['case'] > 0 && exportProgress['case'] < 100 && (
                    <div className="absolute inset-0 bg-[#D4B483]/10" style={{ width: `${exportProgress['case']}%` }}></div>
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {exportProgress['case'] === 100 ? (
                      <><svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Download Document</>
                    ) : exportProgress['case'] > 0 ? (
                      `Compiling Manifest... ${exportProgress['case']}%`
                    ) : (
                      <><svg className="w-3 h-3 min-w-[12px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Compile Artifact</>
                    )}
                  </span>
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
                <button
                  onClick={() => handleExportSimulation('ledger', 'CSV')}
                  disabled={exportProgress['ledger'] > 0 && exportProgress['ledger'] < 100}
                  className="w-full py-2 border border-[#222] text-[10px] font-bold uppercase tracking-widest text-[#555] hover:text-[#CCC] hover:border-[#444] rounded-sm transition-all flex items-center justify-center gap-2 relative overflow-hidden"
                >
                  {exportProgress['ledger'] > 0 && exportProgress['ledger'] < 100 && (
                    <div className="absolute inset-0 bg-[#D4B483]/10" style={{ width: `${exportProgress['ledger']}%` }}></div>
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {exportProgress['ledger'] === 100 ? (
                      <><svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Download Ledger</>
                    ) : exportProgress['ledger'] > 0 ? (
                      `Sealing Records... ${exportProgress['ledger']}%`
                    ) : (
                      <><svg className="w-3 h-3 min-w-[12px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Compile Artifact</>
                    )}
                  </span>
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
                <button
                  onClick={() => handleExportSimulation('snapshot', 'PDF')}
                  disabled={exportProgress['snapshot'] > 0 && exportProgress['snapshot'] < 100}
                  className="w-full py-2 border border-[#222] text-[10px] font-bold uppercase tracking-widest text-[#555] hover:text-[#CCC] hover:border-[#444] rounded-sm transition-all flex items-center justify-center gap-2 relative overflow-hidden"
                >
                  {exportProgress['snapshot'] > 0 && exportProgress['snapshot'] < 100 && (
                    <div className="absolute inset-0 bg-[#D4B483]/10" style={{ width: `${exportProgress['snapshot']}%` }}></div>
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {exportProgress['snapshot'] === 100 ? (
                      <><svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Download Snapshot</>
                    ) : exportProgress['snapshot'] > 0 ? (
                      `Capturing Queue... ${exportProgress['snapshot']}%`
                    ) : (
                      <><svg className="w-3 h-3 min-w-[12px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg> Compile Artifact</>
                    )}
                  </span>
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
                <pre className="font-mono text-[10px] text-[#555] leading-loose overflow-x-hidden p-4 bg-[#050505]/50 rounded-sm border border-[#111]">
                  {JSON.stringify({
                    export_id: `EXP-2026-02-06-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
                    generated_at: new Date().toISOString(),
                    context: "REGULATORY_AUDIT",
                    data: {
                      active_records: activeScenarios.length,
                      session_decisions: auditLog.length,
                      risk_distribution: {
                        high: activeScenarios.filter(s => s.risk === 'High').length,
                        medium: activeScenarios.filter(s => s.risk === 'Medium').length,
                        low: activeScenarios.filter(s => s.risk === 'Low').length
                      }
                    },
                    signature: "SHA256: 9f86d081884c7d659a2feaa0c55ad015..."
                  }, null, 2)}
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
          <div className="animate-in fade-in duration-300 space-y-6">
            {/* Audit Ledger Header */}
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm p-8 flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#111] to-transparent opacity-50 pointer-events-none"></div>
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500/50 animate-pulse"></span>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#666]">Immutable Record</span>
                </div>
                <h2 className="text-3xl font-light text-[#E5E5E0] tracking-tight mb-2">Audit Ledger</h2>
                <p className="text-sm text-[#888] font-light max-w-2xl leading-relaxed">
                  Cryptographically sealed record of all AI recommendations and human decisions. Each entry is hash-chained for regulatory compliance.
                </p>
              </div>
              <div className="hidden md:flex items-center gap-8">
                <div className="text-center">
                  <span className="block text-4xl font-thin text-[#D4B483] mb-1">{auditLog.length}</span>
                  <span className="text-[9px] uppercase tracking-widest text-[#555] font-bold">Total Records</span>
                </div>
                <div className="text-center">
                  <span className="block text-4xl font-thin text-emerald-500/80 mb-1">{auditLog.filter(l => l.outcome === 'Overridden').length}</span>
                  <span className="text-[9px] uppercase tracking-widest text-[#555] font-bold">Overrides</span>
                </div>
              </div>
            </div>

            {/* Export Controls */}
            <div className="bg-[#080808] border border-[#151515] rounded-sm p-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="text-[9px] text-[#444] uppercase tracking-widest font-bold">Export Format:</span>
                <div className="flex gap-2">
                  {['JSON', 'CSV', 'PDF', 'XML'].map(format => (
                    <button
                      key={format}
                      className="text-[9px] font-bold uppercase tracking-wider text-[#555] hover:text-[#CCC] bg-[#0F0F0F] px-3 py-1.5 rounded-sm border border-[#1A1A1A] hover:border-[#333] transition-colors"
                      onClick={() => console.log(`Export as ${format}`)}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[8px] text-[#333] font-mono">SHA-256 VERIFICATION ENABLED</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                {auditLog.length > 0 ? (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#080808] text-[#444] font-semibold border-b border-[#1A1A1A]">
                      <tr>
                        <th
                          className="px-6 py-4 font-bold text-[8px] uppercase tracking-wider text-[#333] cursor-pointer hover:text-[#D4B483] transition-colors"
                          onClick={() => handleLedgerSort('id')}
                        >
                          RECORD ID {ledgerSort.key === 'id' && (ledgerSort.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th
                          className="px-4 py-4 font-bold text-[8px] uppercase tracking-wider text-[#333] cursor-pointer hover:text-[#D4B483] transition-colors"
                          onClick={() => handleLedgerSort('timestamp')}
                        >
                          TIMESTAMP (UTC) {ledgerSort.key === 'timestamp' && (ledgerSort.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th
                          className="px-4 py-4 font-bold text-[8px] uppercase tracking-wider text-[#333] cursor-pointer hover:text-[#D4B483] transition-colors"
                          onClick={() => handleLedgerSort('actor')}
                        >
                          ACTOR {ledgerSort.key === 'actor' && (ledgerSort.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-4 py-4 font-bold text-[8px] uppercase tracking-wider text-[#333]">CASE REF</th>
                        <th className="px-4 py-4 font-bold text-[8px] uppercase tracking-wider text-[#333]">OUTCOME</th>
                        <th className="px-4 py-4 font-bold text-[8px] uppercase tracking-wider text-[#333]">RATIONALE</th>
                        <th className="px-4 py-4 font-bold text-[8px] uppercase tracking-wider text-[#333] text-right">SEAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#111]">
                      {sortedAuditLog.map((log) => {
                        const isOverride = log.outcome === 'Overridden';

                        return (
                          <tr key={log.id} className={`hover:bg-[#0C0C0C] transition-colors group ${isOverride ? 'bg-amber-950/5' : ''}`}>
                            {/* Record ID */}
                            <td className="px-6 py-5 font-mono text-[9px] text-[#444]" title={`Full hash: ${log.id}`}>
                              <span className="flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-emerald-500/50"></span>
                                {log.id.slice(0, 8).toUpperCase()}
                              </span>
                            </td>

                            {/* Timestamp */}
                            <td className="px-4 py-5 font-mono text-[9px] text-[#555] whitespace-nowrap">
                              <div className="flex flex-col">
                                <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</span>
                                <span className="text-[8px] text-[#333]">{log.timestamp} UTC</span>
                              </div>
                            </td>

                            {/* Actor */}
                            <td className="px-4 py-5">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[8px] font-bold uppercase tracking-wider ${isOverride
                                ? 'text-cyan-400 bg-cyan-950/30 border border-cyan-800/40'
                                : 'text-violet-400 bg-violet-950/30 border border-violet-800/40'
                                }`}>
                                <span className={`w-1 h-1 rounded-full ${isOverride ? 'bg-cyan-400' : 'bg-violet-400'}`}></span>
                                {isOverride ? 'HUMAN_ANALYST' : 'AI_SYSTEM'}
                              </span>
                            </td>

                            {/* Case Ref */}
                            <td className="px-4 py-5">
                              <span className="text-[10px] font-mono text-[#D4B483] bg-[#0A0A0A] px-2 py-1 rounded-sm border border-[#222]">
                                {log.caseId.toUpperCase()}
                              </span>
                            </td>

                            {/* Outcome */}
                            <td className="px-4 py-5">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase tracking-tight ${isOverride
                                ? 'text-amber-500 bg-amber-950/30 border border-amber-900/40'
                                : 'text-emerald-500 bg-emerald-950/30 border border-emerald-900/40'
                                }`}>
                                {isOverride ? '⚠ OVERRIDDEN' : '✓ ACCEPTED'}
                              </span>
                            </td>

                            {/* Justification */}
                            <td className="px-4 py-5 text-[10px] text-[#888] max-w-xs group-hover:max-w-md transition-all">
                              <div className="flex items-start gap-2">
                                <span className="text-[8px] text-[#444] font-mono shrink-0">{"//"}</span>
                                <span className="truncate font-mono group-hover:whitespace-normal group-hover:text-[#CCC]" title={log.notes}>{log.notes || '—'}</span>
                              </div>
                            </td>

                            {/* Seal Status */}
                            <td className="px-4 py-5 text-right">
                              <span className="inline-flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.2em] text-emerald-500/60" title="Record is cryptographically sealed and immutable">
                                VERIFIED
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#111] border border-[#1A1A1A] flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-[#333]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-[10px] text-[#555] uppercase tracking-[0.2em] mb-2 font-bold">Ledger Empty</span>
                    <span className="text-[9px] text-[#333] font-mono">No decisions recorded in current session</span>
                  </div>
                )}
              </div>
            </div>

            {/* Compliance Footer */}
            <div className="bg-[#080808] border border-[#151515] rounded-sm p-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="text-[8px] text-[#333] font-mono uppercase tracking-wider">LEDGER VERSION: v4.2.1</span>
                <span className="text-[8px] text-[#222]">|</span>
                <span className="text-[8px] text-[#333] font-mono uppercase tracking-wider">RETENTION: 7 YEARS (SOX)</span>
                <span className="text-[8px] text-[#222]">|</span>
                <span className="text-[8px] text-[#333] font-mono uppercase tracking-wider">ENCRYPTION: AES-256-GCM</span>
              </div>
              <span className="text-[8px] text-red-500/40 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m10-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Tamper-Protected
              </span>
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

              {/* Analyst Decision Queue (Case Inbox) */}
              <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] overflow-hidden flex flex-col h-[650px] shadow-sm">
                <div className="px-6 py-5 border-b border-[#1A1A1A] flex justify-between items-center bg-[#0F0F0F]/50">
                  <div>
                    <h2 className="text-[10px] font-bold text-[#E5E5E0] uppercase tracking-[0.15em] mb-1">Analyst Decision Queue</h2>
                    <p className="text-[9px] text-[#555] uppercase tracking-wide font-medium">Cases requiring compliance review</p>
                  </div>
                  <button onClick={() => window.location.reload()} className="text-[9px] font-bold text-[#D4B483] hover:text-[#E5D4A3] uppercase tracking-wider flex items-center gap-1 bg-[#141414] px-2.5 py-1.5 rounded-sm border border-[#222] hover:border-[#333] transition-colors">
                    Sync Case Manifest
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 p-4 space-y-2.5 scrollbar-thin scrollbar-thumb-[#222] scrollbar-track-transparent bg-[#050505]">
                  {filteredScenarios.length > 0 ? (
                    filteredScenarios.map((s) => {
                      const priority = getPriority(s.risk);
                      const sla = getSLA(s.risk);
                      const isSelected = selectedId === s.id;
                      const context = getMicroContext(s);
                      const status = caseStatus[s.id] || 'NEW';
                      const openedAt = caseOpenedAt[s.id];
                      const agingMinutes = openedAt ? Math.floor((Date.now() - openedAt) / 60000) : 0;
                      const isAging = status === 'IN-REVIEW' && agingMinutes >= 30;
                      const isResolved = status === 'RESOLVED';

                      return (
                        <button
                          key={s.id}
                          onClick={() => analyzeRisk(s.id)}
                          className={`w-full text-left p-4 rounded-sm border transition-all duration-300 group relative ${isResolved
                            ? "bg-[#080808] border-[#151515] opacity-50 border-l-[3px] border-l-emerald-800/50"
                            : isSelected
                              ? "bg-[#111] border-[#262626] border-l-[3px] border-l-[#D4B483] shadow-[0_0_20px_rgba(212,180,131,0.05)] ring-1 ring-[#D4B483]/20 z-10"
                              : "bg-[#0A0A0A] border-[#1A1A1A] hover:bg-[#0E0E0E] hover:border-[#262626] border-l-[3px] border-l-transparent opacity-85 hover:opacity-100"
                            }`}
                          title={isResolved ? "Case resolved — decision logged" : "Click to load analysis"}
                        >
                          {isSelected && !isResolved && (
                            <div className="absolute top-0 right-0 w-16 h-16 bg-[#D4B483]/5 rounded-bl-full pointer-events-none"></div>
                          )}

                          <div className="flex justify-between items-start mb-2.5 relative z-10">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm border uppercase tracking-widest ${isSelected ? 'border-[#D4B483]/40 text-[#D4B483]' : priority.color}`}>
                                {priority.label}
                              </span>
                              <span className="text-[10px] font-mono font-medium text-[#777] tracking-tighter">ID: {s.id.substring(0, 8).toUpperCase()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {isAging && (
                                <span className="flex items-center gap-1.5 text-[8px] font-bold text-amber-500 uppercase tracking-widest">
                                  <span className="w-1 h-1 rounded-full bg-amber-500 animate-ping"></span>
                                  Aging
                                </span>
                              )}
                              <span className={`text-[9px] font-bold uppercase tracking-widest ${sla.color}`}>{sla.text}</span>
                            </div>
                          </div>

                          <h3 className={`text-sm font-medium mb-1 truncate pr-8 tracking-tight ${isResolved ? "text-[#555]" : isSelected ? "text-[#E5E5E0] font-semibold" : "text-[#999] group-hover:text-[#AAA]"}`}>
                            {s.name}
                          </h3>
                          <p className={`text-[9px] font-mono uppercase tracking-[0.1em] mb-4 ${isResolved ? "text-[#333]" : isSelected ? "text-[#D4B483]/70" : "text-[#444] group-hover:text-[#555]"}`}>
                            // TRACE: {context}
                          </p>

                          <div className="flex justify-between items-center pt-3 border-t border-[#141414] mt-auto">
                            <div className="flex items-center gap-3">
                              <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${status === 'NEW' ? 'text-cyan-400/70 bg-cyan-950/20 border border-cyan-900/30' :
                                status === 'IN-REVIEW' ? 'text-amber-400/70 bg-amber-950/20 border border-amber-900/30' :
                                  'text-emerald-400/70 bg-emerald-950/20 border border-emerald-900/30'
                                }`}>
                                {status}
                              </span>
                              {openedAt && !isResolved && (
                                <span className="text-[8px] text-[#444] font-mono">
                                  {agingMinutes}m
                                </span>
                              )}
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-widest border ${getRiskBadgeColor(s.risk)}`}>
                              {s.risk}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                      <p className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em] mb-2">Queue Clear</p>
                      <p className="text-[9px] text-[#444] uppercase tracking-wide">No pending items match current filters</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Session Activity Summary (Compact) */}
              <div
                className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-5 hover:border-[#262626] transition-colors cursor-pointer group"
                onClick={() => setCurrentView('audit')}
                title="View full Audit Ledger"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-sm bg-[#111] border border-[#1A1A1A] flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
                    </div>
                    <div>
                      <h2 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-0.5 group-hover:text-[#888] transition-colors">Session Activity</h2>
                      <p className="text-[9px] text-[#444] font-mono">
                        {auditLog.length} decision{auditLog.length !== 1 ? 's' : ''} logged
                        {auditLog.filter(l => l.outcome === 'Overridden').length > 0 && (
                          <span className="text-amber-500/60 ml-2">
                            ({auditLog.filter(l => l.outcome === 'Overridden').length} override{auditLog.filter(l => l.outcome === 'Overridden').length !== 1 ? 's' : ''})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-[#333] font-mono uppercase tracking-wider">View Ledger</span>
                    <svg className="w-3 h-3 text-[#333] group-hover:text-[#666] group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
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
                            <div className="relative">
                              <span className="text-9xl font-thin tracking-tighter text-[#E5E5E0] drop-shadow-2xl">{result.risk_score}</span>
                              <div className={`absolute -inset-4 rounded-full blur-3xl opacity-10 pointer-events-none ${result.risk_level === "High" ? "bg-red-500" : result.risk_level === "Medium" ? "bg-amber-500" : "bg-emerald-500"}`}></div>
                            </div>
                            <span className={`mt-4 px-6 py-2 rounded-sm text-[11px] font-bold uppercase tracking-[0.3em] border-2 shadow-xl ${getRiskBadgeColor(result.risk_level)}`}>
                              {result.risk_level} Risk Level
                            </span>
                          </div>
                        </div>

                        {/* Summary Logic */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2.5">
                              <div className="w-2 h-2 rounded-full bg-[#D4B483]"></div>
                              <h2 className="text-[11px] font-bold text-[#666] uppercase tracking-[0.3em]">Executive Summary</h2>
                            </div>
                            <div className="px-4 py-1.5 bg-[#111] border border-[#222] rounded-sm flex items-center gap-3">
                              <span className="text-[9px] font-bold text-[#555] uppercase tracking-widest">Case ID</span>
                              <span className="text-[10px] font-mono text-[#D4B483]">{selectedId?.toUpperCase()}</span>
                            </div>
                          </div>

                          <p className="text-2xl text-[#E5E5E0] leading-relaxed font-light mb-12 border-l-[4px] border-[#D4B483]/30 pl-10 italic">
                            "{result.explanation}"
                          </p>

                          <div className="grid grid-cols-2 gap-12 text-xs border-t border-[#1F1F1F] pt-10">
                            <div className="flex items-center gap-6">
                              <div className="p-3 bg-[#111] rounded-sm text-[#D4B483] border border-[#222] shadow-inner">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                              </div>
                              <div>
                                <span className="text-[#555] uppercase text-[10px] font-bold tracking-[0.15em] block mb-1">Global Percentile</span>
                                <span className="text-[#E5E5E0] font-mono font-medium text-lg">Top {100 - getRiskPercentile}%</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="p-3 bg-[#111] rounded-sm text-cyan-400 border border-[#222] shadow-inner">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              </div>
                              <div>
                                <span className="text-[#555] uppercase text-[10px] font-bold tracking-[0.15em] block mb-1">Model Confidence</span>
                                <span className="text-[#D4B483] font-mono font-medium text-lg">{Math.round(result.confidence_score * 100)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Banner - Interactive */}
                    <div className="bg-[#0C0C0C] px-10 py-6 border-t border-[#1F1F1F] flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                      {/* Recommended Action - Clickable */}
                      <div className="flex items-center gap-6">
                        <span className="text-[10px] font-bold text-[#555] uppercase tracking-[0.15em] block">Recommended Action</span>
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => {
                              if (result.recommended_action.toUpperCase().includes("MONITOR")) {
                                setIsImpactExpanded(true);
                                setImpactGlow(true);
                                setTimeout(() => setImpactGlow(false), 2000);
                                const el = document.getElementById('impact-section');
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              } else {
                                setIsActionPanelOpen(true);
                              }
                            }}
                            className={`text-xs font-bold uppercase tracking-wide flex items-center gap-3 px-4 py-2 rounded-sm shadow-sm group cursor-pointer transition-all active:scale-[0.98] ${actionExecutionState === 'applied'
                              ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-800/50'
                              : 'text-[#D4B483] bg-[#161616] border border-[#222] hover:bg-[#1A1A1A] hover:border-[#333]'
                              }`}
                            title={result.recommended_action.toUpperCase().includes("MONITOR") ? "Click to view impact projection" : "Click to view action details"}
                          >
                            {actionExecutionState === 'applied' ? (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Action Applied
                              </>
                            ) : (
                              <>
                                {result.recommended_action}
                                <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                              </>
                            )}
                          </button>
                          {result.recommended_action.toUpperCase().includes("MONITOR") && (
                            <p className="text-[8px] text-[#555] italic font-mono pl-1">// View projected system impact if no intervention is applied.</p>
                          )}
                        </div>
                      </div>

                      {/* Impact Projection - Interactive Accordion */}
                      <div className="relative">
                        <button
                          onClick={() => setIsImpactExpanded(!isImpactExpanded)}
                          aria-expanded={isImpactExpanded}
                          className="text-right flex items-center gap-4 group cursor-pointer focus:outline-none"
                          title="Projected system impact if recommendation is applied"
                        >
                          <span className="text-[10px] font-bold text-[#555] uppercase tracking-[0.15em] block group-hover:text-[#777] transition-colors">Impact Projection</span>
                          <span className={`text-[10px] font-medium px-3 py-1.5 rounded-sm border transition-all flex items-center gap-2 ${isImpactExpanded ? 'bg-[#D4B483]/10 border-[#D4B483]/40 text-[#D4B483]' : 'bg-[#161616] border-[#262626] text-[#CCC] group-hover:border-[#333]'
                            }`}>
                            {result.recommendation_impact}
                            <svg className={`w-3 h-3 transition-transform duration-300 ${isImpactExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Impact Expansion Content (High-Fidelity Accordion) */}
                    <div
                      id="impact-section"
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${isImpactExpanded ? 'max-h-[600px] opacity-100 mt-6' : 'max-h-0 opacity-0 pointer-events-none'}`}
                      aria-hidden={!isImpactExpanded}
                    >
                      {getActionPanelData && (
                        <div className={`bg-[#0A0A0A] border rounded-sm p-6 shadow-inner relative overflow-hidden transition-all duration-700 ${impactGlow ? 'border-[#D4B483] shadow-[0_0_30px_rgba(212,180,131,0.15)] ring-1 ring-[#D4B483]/30' : 'border-[#1A1A1A]'}`}>
                          {/* Simulated Projection Badge */}
                          <div className="absolute top-0 right-0 flex items-center">
                            <div className="px-3 py-1 bg-[#161616] border-l border-b border-[#262626] rounded-bl-sm flex items-center gap-2">
                              <span className="w-1 h-1 rounded-full bg-[#D4B483] animate-pulse"></span>
                              <span className="text-[8px] font-bold text-[#D4B483] uppercase tracking-widest text-[7px]">Scenario: No Intervention</span>
                            </div>
                            <div className="px-3 py-1 bg-[#D4B483]/5 border-l border-b border-[#D4B483]/20">
                              <span className="text-[8px] font-bold text-[#D4B483]/60 uppercase tracking-widest text-[7px]">Simulated Projection</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                            {/* KPI 1: False Positives */}
                            <div className="bg-[#0C0C0C] border border-[#1F1F1F] p-5 rounded-sm group hover:border-[#D4B483]/30 transition-colors relative" title="Projected outcome based on historical baselines.">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-[#555] uppercase tracking-wider">📉 False Positives</span>
                                <span className="text-xs font-mono text-emerald-400 font-bold">{getActionPanelData.impactMetrics.falsePositiveRate}</span>
                              </div>
                              <div className="h-1 w-full bg-[#161616] rounded-full overflow-hidden mb-3">
                                <div className="h-full bg-emerald-400/40 transition-all duration-1000 delay-300" style={{ width: isImpactExpanded ? '40%' : '0%' }}></div>
                              </div>
                              <p className="text-[9px] text-[#777] leading-relaxed">Reduction via targeted verification and signal precision.</p>
                            </div>

                            {/* KPI 2: Analyst Efficiency */}
                            <div className="bg-[#0C0C0C] border border-[#1F1F1F] p-5 rounded-sm group hover:border-[#D4B483]/30 transition-colors relative" title="Projected outcome based on historical baselines.">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-[#555] uppercase tracking-wider">⏱ Analyst Efficiency</span>
                                <span className="text-xs font-mono text-[#D4B483] font-bold">↑ 22%</span>
                              </div>
                              <div className="h-1 w-full bg-[#161616] rounded-full overflow-hidden mb-3">
                                <div className="h-full bg-[#D4B483]/40 transition-all duration-1000 delay-500" style={{ width: isImpactExpanded ? '65%' : '0%' }}></div>
                              </div>
                              <p className="text-[9px] text-[#777] leading-relaxed">Reduced manual review load through intelligent heuristics.</p>
                            </div>

                            {/* KPI 3: Risk Exposure */}
                            <div className="bg-[#0C0C0C] border border-[#1F1F1F] p-5 rounded-sm group hover:border-[#D4B483]/30 transition-colors relative" title="Projected outcome based on historical baselines.">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-[#555] uppercase tracking-wider">🛡 Risk Exposure</span>
                                <span className="text-[10px] font-mono text-cyan-400 font-bold">↓ Critical</span>
                              </div>
                              <div className="h-1 w-full bg-[#161616] rounded-full overflow-hidden mb-3">
                                <div className="h-full bg-cyan-400/40 transition-all duration-1000 delay-700" style={{ width: isImpactExpanded ? '80%' : '0%' }}></div>
                              </div>
                              <p className="text-[9px] text-[#777] leading-relaxed">Improved signal precision reduces high-risk escalation.</p>
                            </div>
                          </div>

                          <div className="mt-8 pt-6 border-t border-[#151515] flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                              <p className="text-[9px] text-[#444] font-mono tracking-tighter uppercase font-bold tracking-widest flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-cyan-500/50"></span>
                                // ENGINE_STATUS: NOMINAL
                              </p>
                              <p className="text-[9px] text-[#444] font-mono italic tracking-tighter">Based on {result.risk_level === 'High' ? 'N=4,200' : 'N=12,500'} similar historical vectors</p>
                            </div>
                            <div className="p-3 bg-[#111] rounded-sm border border-[#222]">
                              <p className="text-[8px] text-[#666] uppercase tracking-[0.2em] font-bold text-center">
                                Simulation only. No user-facing enforcement applied. Decision support artifact generated per SOC 2 Type II audit requirements.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Detail Panel (Slide-out) */}
                    {isActionPanelOpen && getActionPanelData && (
                      <div className="fixed inset-0 z-50 flex justify-end">
                        {/* Backdrop */}
                        <div
                          className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                          onClick={() => setIsActionPanelOpen(false)}
                        />

                        {/* Panel */}
                        <div className="relative w-full max-w-lg bg-[#0A0A0A] border-l border-[#1F1F1F] shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
                          {/* Panel Header */}
                          <div className="sticky top-0 bg-[#0A0A0A] border-b border-[#1F1F1F] p-6 z-10">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[9px] text-[#555] uppercase tracking-widest font-bold mb-2 block">Action Intelligence</span>
                                <h2 className="text-lg font-light text-[#E5E5E0]">{result.recommended_action}</h2>
                              </div>
                              <button
                                onClick={() => setIsActionPanelOpen(false)}
                                className="p-2 text-[#555] hover:text-[#AAA] hover:bg-[#151515] rounded-sm transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Panel Content */}
                          <div className="p-6 space-y-6">
                            {/* Why This Action */}
                            <div>
                              <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-[#D4B483]"></span>
                                Why This Action
                              </h3>
                              <div className="bg-[#080808] border border-[#151515] rounded-sm p-4">
                                <ul className="space-y-2">
                                  {getActionPanelData.reasoningChain.map((reason, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[11px] text-[#AAA]">
                                      <span className="text-[#333] mt-1">→</span>
                                      {reason}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Triggered Policies */}
                            <div>
                              <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-amber-500/50"></span>
                                Triggered Policies
                              </h3>
                              <div className="space-y-2">
                                {getActionPanelData.triggeredPolicies.map((policy, i) => (
                                  <div key={i} className="flex items-center gap-3 bg-[#080808] border border-[#151515] rounded-sm px-4 py-3">
                                    <span className="text-[9px] font-mono text-amber-500/70">{policy.split(':')[0]}</span>
                                    <span className="text-[10px] text-[#888]">{policy.split(':')[1]}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Expected Outcome */}
                            <div>
                              <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-emerald-500/50"></span>
                                Expected Outcome
                              </h3>
                              <p className="text-[11px] text-[#AAA] leading-relaxed bg-emerald-950/10 border border-emerald-900/20 rounded-sm p-4">
                                {getActionPanelData.expectedOutcome}
                              </p>
                            </div>

                            {/* Risk If Ignored */}
                            <div>
                              <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-red-500/50"></span>
                                Risk If Ignored
                              </h3>
                              <p className="text-[11px] text-[#AAA] leading-relaxed bg-red-950/10 border border-red-900/20 rounded-sm p-4">
                                {getActionPanelData.riskIfIgnored}
                              </p>
                            </div>
                          </div>

                          {/* Panel Footer - Execute Button */}
                          <div className="sticky bottom-0 bg-[#0A0A0A] border-t border-[#1F1F1F] p-6">
                            <button
                              onClick={handleExecuteAction}
                              disabled={actionExecutionState !== 'idle'}
                              className={`w-full py-4 rounded-sm text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${actionExecutionState === 'idle'
                                ? 'bg-[#D4B483] text-black hover:bg-[#E5C594] shadow-lg shadow-[#D4B483]/20'
                                : actionExecutionState === 'loading'
                                  ? 'bg-[#222] text-[#888] cursor-wait'
                                  : 'bg-emerald-800/30 text-emerald-400 border border-emerald-700/50'
                                }`}
                            >
                              {actionExecutionState === 'idle' && (
                                <>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  Execute Action (Demo Mode)
                                </>
                              )}
                              {actionExecutionState === 'loading' && (
                                <>
                                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Executing...
                                </>
                              )}
                              {actionExecutionState === 'applied' && (
                                <>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Action Applied Successfully
                                </>
                              )}
                            </button>
                            <p className="text-[8px] text-[#444] text-center mt-3 uppercase tracking-wider">
                              Demo mode — no actual changes will be made
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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
                        <option value="">Initialize Simulation Vector...</option>
                        <option value="withdrawal">Simulate: Withdrawal Attempt</option>
                        <option value="profile">Simulate: Profile Modification</option>
                        <option value="geo">Simulate: Geographic Shift</option>
                      </select>
                      {simulationAction && (
                        <div className="flex items-center gap-2 text-[9px] text-[#888] border-t border-[#222] pt-4 uppercase tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4B483] animate-pulse"></span>
                          Executing local inference model...
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
                      <div className="h-48 w-full min-h-[192px] min-w-0 opacity-90">
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
                            {((currentScenario?.visualizationData as any).interventionPoints || []).map((pt: string, i: number) => (
                              <ReferenceLine key={i} x={pt} stroke="#D4B483" strokeDasharray="3 3" label={{ position: 'top', value: 'H_ACT', fill: '#D4B483', fontSize: 8, fontFamily: 'monospace' }} />
                            ))}
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const val = Number(payload[0].value);
                                  return (
                                    <div className="bg-[#0A0A0A] border border-[#222] p-3 rounded-sm shadow-2xl">
                                      <p className="text-[9px] text-[#555] uppercase font-bold tracking-widest mb-1">Observation Points</p>
                                      <p className="text-xs font-mono text-[#D4B483]">{val} <span className="text-[9px] text-[#555]">PTS</span></p>
                                      <p className="text-[8px] text-[#666] mt-2 italic max-w-[120px] leading-tight font-mono">
                                        {val > 80 ? "// ALERT: DEVIATION_EXCEEDS_NORM" : "// STATUS: WITHIN_NOMINAL_RANGE"}
                                      </p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area type="monotone" dataKey="score" stroke={result.risk_level === "High" ? "#ef4444" : "#D4B483"} fillOpacity={1} fill="url(#colorScore)" strokeWidth={1.5} animationDuration={1200} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Factor Analysis */}
                    <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-8">
                      <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em] mb-6">Factor Weighting</h3>
                      <div className="h-48 w-full min-h-[192px] min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart layout="vertical" data={currentScenario?.visualizationData.breakdown} margin={{ top: 0, right: 10, left: 10, bottom: 0 }} barCategoryGap={18}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="signal" type="category" width={80} tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#666', fontWeight: 400, fontFamily: 'monospace' }} />
                            <Tooltip
                              cursor={{ fill: '#141414' }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-[#000] border border-[#222] p-3 rounded-sm shadow-2xl">
                                      <p className="text-[9px] text-[#555] uppercase font-bold tracking-widest mb-1">{payload[0].payload.signal}</p>
                                      <p className="text-xs font-mono text-cyan-400">{payload[0].value}% <span className="text-[9px] text-[#555]">CONTRIBUTION</span></p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="impact" fill="#333" radius={[0, 2, 2, 0]} barSize={8} background={{ fill: '#0A0A0A' }} animationDuration={1500}>
                              {currentScenario?.visualizationData.breakdown.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#D4B483' : '#444'} />
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
                          <div className={`mt-3 flex items-center gap-2 animate-in fade-in duration-500 ${justificationError ? 'text-red-500 scale-105 transition-all' : 'opacity-60'}`}>
                            <span className={`w-1 h-1 rounded-full ${justificationError ? 'bg-red-500 animate-pulse' : 'bg-amber-500/50'}`}></span>
                            <p className="text-[9px] font-mono tracking-wide uppercase font-bold">
                              {justificationError ? "Legal Mandate: Justification required for AI overrides" : "Justification is required to override AI recommendations."}
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
