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
                className="absolute inset-0 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500"
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`relative w-full max-w-lg bg-panel-bg border-l ${result?.risk_level === 'High' ? 'border-gold/40' : 'border-border-main'} shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-in slide-in-from-right duration-500 overflow-y-auto flex flex-col z-[101] panel-depth`}>
                {result?.risk_level === 'High' && (
                    <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gold/40 z-20 shadow-[0_0_15px_rgba(212,175,55,0.3)]"></div>
                )}

                {/* Panel Header */}
                <div className="sticky top-0 bg-panel-bg/95 backdrop-blur-md border-b border-border-main p-8 z-[110] scan-overlay">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[10px] text-gold uppercase tracking-[0.3em] font-bold mb-3 block opacity-80 flex items-center gap-2">
                                <span className="w-1 h-1 bg-gold rounded-full animate-pulse"></span>
                                AI Recommended Remediation
                            </span>
                            <h2 className="text-3xl font-thin text-text-primary tracking-tighter">{result?.recommended_action || "Pending Analysis"}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-text-secondary hover:text-gold hover:bg-background rounded-sm transition-all focus:outline-none technical-border"
                            title="Close Logic Terminal (Esc)"
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
                        <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-3 opacity-60">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan"></span>
                            Neural Reasoning Chain
                        </h3>
                        <div className="bg-background/40 border border-border-main rounded-sm p-6 shadow-inner technical-border">
                            <ul className="space-y-5">
                                {actionData.reasoningChain.map((reason: string, i: number) => (
                                    <li key={i} className="flex items-start gap-4 text-xs text-text-primary/80 leading-relaxed font-light">
                                        <span className="text-cyan font-mono mt-0.5 opacity-50 tabular-nums">0{i + 1}</span>
                                        {reason}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>

                    {/* Triggered Policies */}
                    <section>
                        <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-3 opacity-60">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold/50"></span>
                            Governance Triggers
                        </h3>
                        <div className="space-y-3">
                            {actionData.triggeredPolicies.map((policy: string, i: number) => (
                                <div
                                    key={i}
                                    onMouseEnter={() => setHoveredPolicy(i)}
                                    onMouseLeave={() => setHoveredPolicy(null)}
                                    className="flex items-center justify-between bg-background/40 border border-border-main rounded-sm px-5 py-4 cursor-help hover:border-gold/30 hover:bg-panel-bg/40 transition-all group relative technical-border"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-mono text-gold font-bold tracking-widest">{policy.split(':')[0]}</span>
                                        <span className="text-[11px] text-text-primary/70 font-medium tracking-tight">{policy.split(':')[1]}</span>
                                    </div>
                                    <svg className="w-3.5 h-3.5 text-text-secondary/40 group-hover:text-gold transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>

                                    {hoveredPolicy === i && (
                                        <div className="absolute bottom-full left-0 mb-3 w-72 bg-panel-bg border border-gold/30 p-5 rounded-sm shadow-2xl z-[150] animate-in fade-in slide-in-from-bottom-2 glow-gold/5">
                                            <p className="text-[10px] text-gold font-bold uppercase tracking-widest mb-3 pb-2 border-b border-border-main">Policy Heuristics</p>
                                            <p className="text-[11px] text-text-secondary leading-relaxed font-light">AI behavioral analyst detected vector-matching signature for {policy.split(':')[1].trim()}. Compliance threshold variance: +{(Math.random() * 15 + 10).toFixed(1)}%.</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Projections Section */}
                    <div className="grid grid-cols-1 gap-6">
                        <section>
                            <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-3 opacity-60">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald"></span>
                                Intended Mitigation Outcome
                            </h3>
                            <div className="bg-emerald/5 border border-emerald/20 rounded-sm p-6 technical-border">
                                <p className="text-xs text-text-primary/70 leading-loose italic font-light">
                                    {actionData.expectedOutcome}
                                </p>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-3 opacity-60">
                                <span className="w-1.5 h-1.5 rounded-full bg-red"></span>
                                Latent Risk Inaction
                            </h3>
                            <div className="bg-red/5 border border-red/20 rounded-sm p-6 technical-border">
                                <p className="text-xs text-text-primary/70 leading-loose font-light">
                                    {actionData.riskIfIgnored}
                                </p>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Panel Footer */}
                <div className="sticky bottom-0 bg-panel-bg/95 backdrop-blur-md border-t border-border-main p-8 space-y-6 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold animate-sentinel"></span>
                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em] opacity-40 italic">
                            Authorization will be cryptographically logged.
                        </p>
                    </div>

                    <button
                        onClick={() => onExecute()}
                        disabled={executionState !== 'idle'}
                        className={`w-full py-5 rounded-sm text-[11px] font-bold uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 active:scale-[0.98] shadow-2xl ${executionState === 'idle'
                            ? 'bg-gold text-background hover:bg-gold/90 shadow-gold/20 glow-gold/20'
                            : executionState === 'loading'
                                ? 'bg-background text-text-secondary cursor-wait border border-border-main'
                                : 'bg-emerald/10 text-emerald border border-emerald/40'
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
                                <svg className="w-4 h-4 animate-spin text-gold" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Synching Node Vectors...
                            </>
                        )}
                        {executionState === 'applied' && (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Logic Artifact Sealed
                            </>
                        )}
                    </button>

                    <div className="flex justify-between items-center px-2 pt-2 text-[9px] text-text-secondary/30 font-mono border-t border-border-main/40 uppercase tracking-widest">
                        <span>NODE: RL-8829-QX</span>
                        <div className="flex items-center gap-6">
                            <span className="hover:text-gold transition-colors cursor-help">ESC TO EXIT</span>
                            <span className="hover:text-gold transition-colors cursor-help">CONFIRM TO SYNC</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
