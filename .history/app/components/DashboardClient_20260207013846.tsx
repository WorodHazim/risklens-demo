"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { scenarios as initialScenarios } from "@/src/data/scenarios";
import Header from "./Header";
import PriorityQueue from "./PriorityQueue";
import ActionIntelligence from "./ActionIntelligence";
import ExportCenter from "./ExportCenter";
import PoliciesView from "./PoliciesView";
import AuditLedgerView from "./AuditLedgerView";
import ImpactProjection from "./ImpactProjection";
import HumanReview from "./HumanReview";
import Image from "next/image";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area,
    PieChart,
    Pie
} from "recharts";

type RiskLevel = "High" | "Medium" | "Low";

interface RiskResult {
    risk_score: number;
    risk_level: RiskLevel;
    explanation: string;
    recommended_action: string;
    confidence_score: number;
    risk_signals: string[];
    business_impact: string;
    why_not_low: string;
    impact_metrics?: {
        loss_avoidance: string;
        compliance_delta: string;
        signal_recency: string;
    };
}

interface AuditRecord {
    id: string;
    timestamp: string;
    caseId: string;
    outcome: string;
    notes: string;
}

export default function DashboardClient() {
    // --- STATE ---
    const [currentView, setCurrentView] = useState<"dashboard" | "policies" | "audit" | "exports">("dashboard");
    const [activeScenarios, setActiveScenarios] = useState(initialScenarios);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [result, setResult] = useState<RiskResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState<"Senior Analyst" | "Compliance Manager">("Senior Analyst");
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<"All" | "Urgent" | "Active" | "Resolved">("Active");
    const [riskFilter, setRiskFilter] = useState<"All" | "High" | "Medium" | "Low">("All");

    // Interaction States
    const [searchQuery, setSearchQuery] = useState("");
    const [sortType, setSortType] = useState<"Default" | "Risk" | "Urgency" | "Score">("Default");
    const [isActionPanelOpen, setIsActionPanelOpen] = useState(false);
    const [actionExecutionState, setActionExecutionState] = useState<'idle' | 'loading' | 'applied'>('idle');
    const [caseStatus, setCaseStatus] = useState<{ [key: string]: string }>({});
    const [caseOpenedAt, setCaseOpenedAt] = useState<{ [key: string]: number }>({});
    const [auditLog, setAuditLog] = useState<AuditRecord[]>([]);
    const [simulationAction, setSimulationAction] = useState<string>("");

    // Toast / Feedback State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // --- LOGIC ---

    const filteredScenarios = useMemo(() => {
        let list = [...activeScenarios];

        // Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.id.toLowerCase().includes(q)
            );
        }

        // Segment Filter
        if (activeFilter === 'Urgent') list = list.filter(s => s.risk === 'High');
        if (activeFilter === 'Resolved') list = list.filter(s => caseStatus[s.id] === 'RESOLVED');
        if (riskFilter !== 'All') list = list.filter(s => s.risk === riskFilter);

        // Sort Logic
        if (sortType === "Risk") {
            const priority: any = { "High": 3, "Medium": 2, "Low": 1 };
            list.sort((a, b) => priority[b.risk] - priority[a.risk]);
        } else if (sortType === "Urgency") {
            const urg: any = { "High": 3, "Medium": 2, "Low": 1 };
            list.sort((a, b) => urg[b.risk] - urg[a.risk]);
        } else if (sortType === "Score") {
            list.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
        }

        return list;
    }, [activeScenarios, activeFilter, riskFilter, searchQuery, sortType, caseStatus]);

    const activeCase = useMemo(() => {
        if (!selectedId) return null;
        return activeScenarios.find(s => s.id === selectedId) || null;
    }, [selectedId, activeScenarios]);

    const analyzeRisk = (id: string) => {
        if (caseStatus[id] === 'RESOLVED') {
            setToast({ message: "Note: This case has already been resolved and archived.", type: 'info' });
        }

        setSelectedId(id);
        setLoading(true);

        // Simulate Neural Mesh Initialization
        setTimeout(() => {
            const scenario = activeScenarios.find((s) => s.id === id);
            if (scenario) {
                setResult({
                    risk_score: scenario.riskScore || 15,
                    risk_level: scenario.risk as RiskLevel,
                    explanation: scenario.explanation || "System performing baseline monitoring.",
                    recommended_action: scenario.recommended_action || "Monitor",
                    confidence_score: 0.95,
                    risk_signals: scenario.risk === "High" ? ["Velocity Anomaly", "New Account"] : ["Standard Pattern"],
                    business_impact: scenario.risk === "High" ? "Elevated fraud exposure." : "Nominal operational risk.",
                    why_not_low: scenario.risk === "Low" ? "N/A" : "Behavioral signals exceed variance threshold.",
                    impact_metrics: {
                        loss_avoidance: scenario.risk === "High" ? "+$284.1k" : scenario.risk === "Medium" ? "+$92.3k" : "+$12.5k",
                        compliance_delta: scenario.risk === "High" ? "Sigma (9.1)" : scenario.risk === "Medium" ? "Beta (4.2)" : "Alpha (1.0)",
                        signal_recency: scenario.risk === "High" ? "12.4ms" : "28.9ms"
                    }
                });

                if (!caseOpenedAt[id]) {
                    setCaseOpenedAt(prev => ({ ...prev, [id]: Date.now() }));
                }
                setCaseStatus(prev => ({ ...prev, [id]: prev[id] === 'RESOLVED' ? 'RESOLVED' : 'IN-REVIEW' }));
            }
            setLoading(false);
            setActionExecutionState('idle');
        }, 400);
    };

    const handleExecuteAction = useCallback((outcome: any = "Approved", notes: string = "") => {
        if (!result || !selectedId) return;

        // Type guard: Prevent event objects from leaking into state
        const finalOutcome = typeof outcome === 'string' ? outcome : "Approved";
        const finalNotes = typeof notes === 'string' ? notes : "";

        setActionExecutionState('loading');

        // Simulate API delay for execution
        setTimeout(() => {
            const newRecord: AuditRecord = {
                id: `AUD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                timestamp: new Date().toISOString(),
                caseId: selectedId,
                outcome: finalOutcome,
                notes: finalNotes || `AI Recommendation [${result.recommended_action}] executed by ${userRole}.`
            };

            setAuditLog(prev => [newRecord, ...prev]);
            setCaseStatus(prev => ({ ...prev, [selectedId]: 'RESOLVED' }));
            setActionExecutionState('applied');
            setToast({ message: `Action [${finalOutcome}] successfully executed and archived.`, type: 'success' });

            setTimeout(() => {
                setIsActionPanelOpen(false);
            }, 1000);
        }, 1500);
    }, [result, selectedId, userRole]);

    const handleSimulation = (action: string) => {
        setSimulationAction(action);
        if (!action) return;

        setToast({ message: `Initializing simulation for ${action}... UI reflects synthetic vector.`, type: 'info' });

        setTimeout(() => {
            setSimulationAction("");
        }, 2000);
    };

    // --- STYLING HELPERS ---

    const getRiskBadgeColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case "high": return "bg-red-950/20 text-gold border border-gold/40 shadow-[0_0_10px_rgba(212,175,55,0.2)]";
            case "medium": return "bg-gold/10 text-gold opacity-90 border border-gold/20";
            case "low": return "bg-cyan/5 text-cyan border border-cyan/20";
            default: return "bg-panel-bg text-text-secondary border border-border-main";
        }
    };

    const getPriority = (risk: string) => {
        if (risk === "High") return { label: "P1", color: "bg-background text-gold border-gold/30 shadow-[0_0_5px_rgba(212,175,55,0.1)]" };
        if (risk === "Medium") return { label: "P2", color: "bg-background text-text-primary border-border-main" };
        return { label: "P3", color: "bg-background text-text-secondary border-border-main/50" };
    };

    const getSLA = (risk: string) => {
        if (risk === "High") return { text: "URGENT (4h)", color: "text-gold font-bold tracking-tight" };
        if (risk === "Medium") return { text: "Warning (24h)", color: "text-text-primary/80 font-medium" };
        return { text: "Standard (3d)", color: "text-text-secondary/60" };
    };

    const getMicroContext = (s: any) => {
        if (s.risk === 'High') return "Anomalous velocity detected";
        if (s.risk === 'Medium') return "Behavioral variance detected";
        return "Routine compliance scan";
    };

    // Helper for generating more detailed action panel content
    const getActionPanelData = useMemo(() => {
        if (!result) return null;

        const triggeredPolicies = result.risk_level === 'High'
            ? ['POL-AML-001: High Velocity Withdrawals', 'POL-FRAUD-001: Account Takeover Detection']
            : result.risk_level === 'Medium'
                ? ['POL-KYC-002: Early Lifecycle Velocity']
                : ['POL-KYC-001: Standard KYC Review'];

        return {
            triggeredPolicies,
            expectedOutcome: result.risk_level === 'High'
                ? 'Immediate freeze of suspicious activity. Customer notified within 24h. SAR filed if confirmed.'
                : result.risk_level === 'Medium'
                    ? 'Enhanced monitoring activated. Step-up authentication required for high-value transactions.'
                    : 'Case cleared for standard processing. No further action required.',
            riskIfIgnored: result.risk_level === 'High'
                ? 'Potential regulatory fine up to $500K. Reputational damage if fraud proceeds. SAR filing deadline violation.'
                : result.risk_level === 'Medium'
                    ? 'Elevated exposure to false negatives. Possible escalation to high-risk if pattern continues.'
                    : 'Minimal risk. Case may resurface if new signals emerge.',
            reasoningChain: [
                `Risk score of ${result.risk_score} exceeds ${result.risk_level === 'High' ? 'critical' : 'elevated'} threshold`,
                `${result.risk_signals.length} distinct risk signals detected`,
                `Model confidence: ${Math.round(result.confidence_score * 100)}%`,
                `Action aligns with ${triggeredPolicies.length} active policies`
            ]
        };
    }, [result]);

    return (
        <main className="min-h-screen bg-[#050505] font-sans text-[#E5E5E0] pb-12 selection:bg-[#D4B483] selection:text-black">
            <Header
                currentView={currentView}
                setCurrentView={setCurrentView}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                activeScenariosCount={activeScenarios.length}
                urgentScenariosCount={activeScenarios.filter(s => s.risk === 'High').length}
                resolvedScenariosCount={auditLog.length}
                userRole={userRole}
                setUserRole={setUserRole}
                isProfileOpen={isProfileOpen}
                setIsProfileOpen={setIsProfileOpen}
            />

            <div className="max-w-[1500px] mx-auto p-6 mt-4">
                {currentView === "dashboard" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Sidebar: Priority Queue */}
                        <div className="lg:col-span-4 flex flex-col gap-10">
                            <PriorityQueue
                                scenarios={filteredScenarios}
                                selectedId={selectedId}
                                onSelect={analyzeRisk}
                                caseStatus={caseStatus}
                                caseOpenedAt={caseOpenedAt}
                                getPriority={getPriority}
                                getSLA={getSLA}
                                getRiskBadgeColor={getRiskBadgeColor}
                                getMicroContext={getMicroContext}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                sortType={sortType}
                                setSortType={setSortType}
                            />

                            <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-5 hover:border-[#262626] transition-colors cursor-pointer group" onClick={() => setCurrentView('audit')}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-sm bg-[#111] border border-[#1A1A1A] flex items-center justify-center">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
                                        </div>
                                        <div>
                                            <h2 className="text-[10px] font-bold text-[#E5E5E0] uppercase tracking-[0.15em] mb-0.5 group-hover:text-[#D4B483] transition-colors">Session Activity Log</h2>
                                            <p className="text-[9px] text-[#555] font-mono tracking-tight">{auditLog.length} persistent decision{auditLog.length !== 1 ? 's' : ''} codified</p>
                                        </div>
                                    </div>
                                    <svg className="w-3 h-3 text-[#333] group-hover:text-[#666] transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Main Content: Analysis Area */}
                        <div className="lg:col-span-8 space-y-12">
                            {!result ? (
                                <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] border-dashed text-[#333]">
                                    <div className="w-20 h-20 mb-6 opacity-10 relative animate-pulse">
                                        <Image src="/risklens-logo.svg" alt="Logo" fill className="object-contain" />
                                    </div>
                                    <div className="text-center max-w-sm px-8">
                                        <p className="text-[10px] font-bold text-[#E5E5E0] mb-3 uppercase tracking-[0.25em]">Neural Mesh Primed</p>
                                        <p className="text-[9px] text-[#555] uppercase tracking-widest leading-loose">Awaiting case vector selection to initialize adaptive risk reasoning and governance chain</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out">
                                    {/* Analysis Header */}
                                    <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-0 overflow-hidden relative shadow-lg">
                                        <div className={`h-1.5 w-full ${result.risk_level === "High" ? "bg-red-800" : result.risk_level === "Medium" ? "bg-amber-700" : "bg-emerald-800"}`}></div>
                                        <div className="p-10">
                                            <div className="flex flex-col md:flex-row gap-12 items-start">
                                                <div className="flex-shrink-0 flex flex-col items-center">
                                                    <span className="text-9xl font-thin tracking-tighter text-[#E5E5E0] drop-shadow-2xl">{result.risk_score}</span>
                                                    <span className={`mt-4 px-6 py-2 rounded-sm text-[11px] font-bold uppercase tracking-[0.3em] border-2 shadow-xl ${getRiskBadgeColor(result.risk_level)}`}>
                                                        {result.risk_level} Risk
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-8">
                                                        <h2 className="text-[11px] font-bold text-[#E5E5E0] uppercase tracking-[0.3em]">AI Reasoning & Intent Analysis</h2>
                                                        <span className="text-[9px] font-mono text-[#444] px-3 py-1 bg-[#111] border border-[#1A1A1A] tracking-tighter uppercase">Identifier: {selectedId?.toUpperCase()}</span>
                                                    </div>
                                                    <p className="text-2xl text-[#E5E5E0] leading-relaxed font-light mb-12 border-l-[4px] border-[#D4B483]/30 pl-10 italic">
                                                        "{result.explanation}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-[#0C0C0C] px-10 py-6 border-t border-[#1F1F1F] flex justify-between items-center">
                                            <div className="flex items-center gap-6">
                                                <span className="text-[9px] font-bold text-[#444] uppercase tracking-[0.2em]">Primary Mitigation Strategy:</span>
                                                <button
                                                    onClick={() => setIsActionPanelOpen(true)}
                                                    className="px-6 py-2.5 bg-[#111] border border-[#222] text-[#D4B483] text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#161616] hover:border-[#D4B483]/30 transition-all flex items-center gap-3 active:scale-[0.98]"
                                                >
                                                    {result.recommended_action}
                                                    <div className="w-1.5 h-1.5 rounded-full bg-[#D4B483] animate-pulse"></div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <ImpactProjection result={result} actionExecutionState={actionExecutionState} />

                                    <div className="pt-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
                                        <HumanReview
                                            result={result}
                                            selectedId={selectedId || ''}
                                            isResolved={caseStatus[selectedId || ''] === 'RESOLVED'}
                                            onExecute={handleExecuteAction}
                                            executionState={actionExecutionState}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {currentView === "policies" && <PoliciesView activeScenarios={activeScenarios} handleSimulation={handleSimulation} />}
                {currentView === "audit" && <AuditLedgerView auditLog={auditLog} />}
                {currentView === "exports" && <ExportCenter activeScenarios={activeScenarios} auditLog={auditLog} />}
            </div>

            <ActionIntelligence
                isOpen={isActionPanelOpen}
                onClose={() => setIsActionPanelOpen(false)}
                result={result}
                actionData={getActionPanelData}
                selectedId={selectedId || ''}
                onExecute={handleExecuteAction}
                executionState={actionExecutionState}
            />

            {/* Global Toast */}
            {toast && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-sm border shadow-2xl z-[200] animate-in fade-in slide-in-from-bottom-4 duration-300 flex items-center gap-4 ${toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100' : 'bg-[#111]/90 border-[#D4B483]/50 text-[#D4B483]'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-500 animate-pulse' : 'bg-[#D4B483] animate-pulse'}`}></div>
                    <span className="text-xs font-bold uppercase tracking-widest">{toast.message}</span>
                </div>
            )}
        </main>
    );
}
