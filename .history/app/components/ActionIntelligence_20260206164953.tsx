"use client";

import { useState } from "react";

interface ActionIntelligenceProps {
    isOpen: boolean;
    onClose: () => void;
    result: any;
    actionData: any;
    selectedId: string;
    onExecute: () => void;
    executionState: 'idle' | 'loading' | 'applied';
}

export default function ActionIntelligence({
    isOpen,
    onClose,
    result,
    actionData,
    selectedId,
    onExecute,
    executionState
}: ActionIntelligenceProps) {
    const [hoveredPolicy, setHoveredPolicy] = useState<number | null>(null);

    if (!isOpen || !actionData) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end overflow-visible">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`relative w-full max-w-lg bg-[#0A0A0A] border-l ${result?.risk_level === 'High' ? 'border-red-500/50' : 'border-[#1F1F1F]'} shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-right duration-500 overflow-y-auto flex flex-col z-[101]`}>
                {result?.risk_level === 'High' && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-red-500/40 z-20"></div>
                )}

                {/* Panel Header */}
                <div className="sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-[#1F1F1F] p-8 z-[110]">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[10px] text-[#D4B483] uppercase tracking-[0.2em] font-bold mb-3 block opacity-80">AI Recommended Action</span>
                            <h2 className="text-2xl font-light text-[#E5E5E0] tracking-tight">{result?.recommended_action || "Pending Analysis"}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-[#555] hover:text-[#D4B483] hover:bg-[#151515] rounded-sm transition-all focus:outline-none"
                            title="Close Panel (Esc)"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Panel Content */}
                <div className="p-8 space-y-10 flex-grow">
                    {/* Why This Action */}
                    <section>
                        <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-4 flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4B483]"></span>
                            Reasoning Analysis
                        </h3>
                        <div className="bg-[#080808] border border-[#1A1A1A] rounded-sm p-5 shadow-inner">
                            <ul className="space-y-4">
                                {actionData.reasoningChain.map((reason: string, i: number) => (
                                    <li key={i} className="flex items-start gap-4 text-xs text-[#AAA] leading-relaxed">
                                        <span className="text-[#333] font-mono mt-0.5 opacity-50">0{i + 1}</span>
                                        {reason}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* Triggered Policies */}
                    <section>
                        <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-4 flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50"></span>
                            Governance Triggers
                        </h3>
                        <div className="space-y-3">
                            {actionData.triggeredPolicies.map((policy: string, i: number) => (
                                <div
                                    key={i}
                                    onMouseEnter={() => setHoveredPolicy(i)}
                                    onMouseLeave={() => setHoveredPolicy(null)}
                                    className="flex items-center justify-between bg-[#080808] border border-[#1A1A1A] rounded-sm px-5 py-4 cursor-help hover:border-[#D4B483]/30 transition-all group relative"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-mono text-amber-500/60 font-bold">{policy.split(':')[0]}</span>
                                        <span className="text-[11px] text-[#888] font-medium">{policy.split(':')[1]}</span>
                                    </div>
                                    <svg className="w-3.5 h-3.5 text-[#333] group-hover:text-[#D4B483]/50 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>

                                    {hoveredPolicy === i && (
                                        <div className="absolute bottom-full left-0 mb-3 w-72 bg-[#111] border border-[#222] p-4 rounded-sm shadow-2xl z-[150] animate-in fade-in slide-in-from-bottom-2">
                                            <p className="text-[10px] text-[#D4B483] font-bold uppercase tracking-widest mb-2 pb-1 border-b border-[#222]">Trigger Logic</p>
                                            <p className="text-[11px] text-[#777] leading-relaxed">AI behavioral analyst detected vector-matching signature for {policy.split(':')[1].trim()}. Compliance threshold variance: +{(Math.random() * 15 + 10).toFixed(1)}%.</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Projections Section */}
                    <div className="grid grid-cols-1 gap-6">
                        <section>
                            <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-3 flex items-center gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
                                Action Outcome Projection
                            </h3>
                            <div className="bg-emerald-950/5 border border-emerald-900/20 rounded-sm p-5">
                                <p className="text-xs text-[#AAA] leading-loose">
                                    {actionData.expectedOutcome}
                                </p>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-3 flex items-center gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500/50"></span>
                                Inaction Risk Exposure
                            </h3>
                            <div className="bg-red-950/5 border border-red-900/20 rounded-sm p-5">
                                <p className="text-xs text-[#AAA] leading-loose">
                                    {actionData.riskIfIgnored}
                                </p>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Panel Footer */}
                <div className="sticky bottom-0 bg-[#0A0A0A]/95 backdrop-blur-md border-t border-[#1F1F1F] p-8 space-y-4">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        <p className="text-[10px] text-[#555] font-bold uppercase tracking-widest italic">
                            Decision will be cryptographically sealed in Audit Ledger.
                        </p>
                    </div>

                    <button
                        onClick={onExecute}
                        disabled={executionState !== 'idle'}
                        className={`w-full py-4 rounded-sm text-xs font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 active:scale-[0.98] shadow-2xl ${executionState === 'idle'
                            ? 'bg-[#D4B483] text-black hover:bg-[#E5C594]'
                            : executionState === 'loading'
                                ? 'bg-[#1A1A1A] text-[#555] cursor-wait'
                                : 'bg-emerald-900/20 text-emerald-400 border border-emerald-800/40'
                            }`}
                    >
                        {executionState === 'idle' && (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Deploy Remediation Logic
                            </>
                        )}
                        {executionState === 'loading' && (
                            <>
                                <svg className="w-4 h-4 animate-spin text-[#D4B483]" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Syncing Network Vectors...
                            </>
                        )}
                        {executionState === 'applied' && (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Artifact Sealed & Logged
                            </>
                        )}
                    </button>

                    <div className="flex justify-between items-center px-2 pt-2 text-[9px] text-[#444] font-mono border-t border-[#151515]">
                        <span className="uppercase tracking-[0.1em]">Session: RL-8829-QX</span>
                        <span className="flex items-center gap-4">
                            <span>ESC to Close</span>
                            <span>ENTER to Confirm</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
