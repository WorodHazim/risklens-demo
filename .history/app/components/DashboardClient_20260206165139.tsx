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
        let list = activeScenarios;
        if (activeFilter === 'Urgent') list = list.filter(s => s.risk === 'High');
        if (riskFilter !== 'All') list = list.filter(s => s.risk === riskFilter);
        return list;
    }, [activeScenarios, activeFilter, riskFilter]);

    const analyzeRisk = async (id: string) => {
        if (caseStatus[id] === 'RESOLVED') {
            setToast({ message: "Note: This case has already been resolved and archived.", type: 'info' });
        }

        setSelectedId(id);
        setLoading(true);
        setResult(null);
        setActionExecutionState('idle');

        if (!caseOpenedAt[id]) {
            setCaseOpenedAt(prev => ({ ...prev, [id]: Date.now() }));
        }
        setCaseStatus(prev => ({ ...prev, [id]: prev[id] === 'RESOLVED' ? 'RESOLVED' : 'IN-REVIEW' }));

        try {
            const scenario = activeScenarios.find((s) => s.id === id);
            const mfa_enabled = false;

            const res = await fetch("/api/analyze-risk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scenario, mfa_enabled }),
            });
            const data = await res.json();
            setResult(data);
        } catch (error) {
            console.error("Failed to analyze risk", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExecuteAction = () => {
        if (!result || !selectedId) return;

        setActionExecutionState('loading');

        // Simulate API delay for execution
        setTimeout(() => {
            const newRecord: AuditRecord = {
                id: `AUD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                timestamp: new Date().toISOString(),
                caseId: selectedId,
                outcome: "Approved",
                notes: `AI Recommendation [${result.recommended_action}] executed by ${userRole}.`
            };

            setAuditLog(prev => [newRecord, ...prev]);
            setCaseStatus(prev => ({ ...prev, [selectedId]: 'RESOLVED' }));
            setActionExecutionState('applied');
            setToast({ message: "Action successfully executed and logged to Audit Ledger.", type: 'success' });

            setTimeout(() => {
                setIsActionPanelOpen(false);
            }, 1500);
        }, 1200);
    };

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

    const getMicroContext = (s: any) => {
        if (s.risk === 'High') return "Triggered by velocity anomaly";
        if (s.risk === 'Medium') return "Multiple geo-hops detected";
        return "Periodic review cycle";
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
                        <div className="lg:col-span-4 flex flex-col gap-8">
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
                            />

                            <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] p-5 hover:border-[#262626] transition-colors cursor-pointer group" onClick={() => setCurrentView('audit')}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-sm bg-[#111] border border-[#1A1A1A] flex items-center justify-center">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
                                        </div>
                                        <div>
                                            <h2 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-0.5 group-hover:text-[#888] transition-colors">Session Activity</h2>
                                            <p className="text-[9px] text-[#444] font-mono">{auditLog.length} decision{auditLog.length !== 1 ? 's' : ''} logged</p>
                                        </div>
                                    </div>
                                    <svg className="w-3 h-3 text-[#333] group-hover:text-[#666] transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Main Content: Analysis Area */}
                        <div className="lg:col-span-8 space-y-8">
                            {!result ? (
                                <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] border-dashed text-[#333]">
                                    <div className="w-20 h-20 mb-6 opacity-10 relative animate-pulse">
                                        <Image src="/risklens-logo.svg" alt="Logo" fill className="object-contain" />
                                    </div>
                                    <div className="text-center max-w-sm px-8">
                                        <p className="text-[10px] font-bold text-[#666] mb-2 uppercase tracking-[0.2em]">System Initialized</p>
                                        <p className="text-[9px] text-[#444] uppercase tracking-wide">Select a case vector from the queue to start AI reasoning</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-700">
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
                                                        <h2 className="text-[11px] font-bold text-[#666] uppercase tracking-[0.3em]">AI Reasoning Chain</h2>
                                                        <span className="text-[10px] font-mono text-[#D4B483] px-3 py-1 bg-[#111] border border-[#222]">CASE: {selectedId?.toUpperCase()}</span>
                                                    </div>
                                                    <p className="text-2xl text-[#E5E5E0] leading-relaxed font-light mb-12 border-l-[4px] border-[#D4B483]/30 pl-10 italic">
                                                        "{result.explanation}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-[#0C0C0C] px-10 py-6 border-t border-[#1F1F1F] flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Recommendation:</span>
                                                <button
                                                    onClick={() => setIsActionPanelOpen(true)}
                                                    className="px-4 py-2 bg-[#161616] border border-[#222] text-[#D4B483] text-[11px] font-bold uppercase tracking-widest hover:border-[#D4B483]/50 transition-all flex items-center gap-2"
                                                >
                                                    {result.recommended_action}
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <ImpactProjection result={result} actionExecutionState={actionExecutionState} />
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
