"use client";

import { useState } from "react";

interface HumanReviewProps {
    result: any;
    selectedId: string;
    isResolved: boolean;
    onExecute: (outcome: string, notes: string) => void;
    executionState: 'idle' | 'loading' | 'applied';
}

export default function HumanReview({
    result,
    selectedId,
    isResolved,
    onExecute,
    executionState
}: HumanReviewProps) {
    const [justification, setJustification] = useState("");
    const [activeTab, setActiveTab] = useState<'accept' | 'override'>('accept');

    // Defensive Guard
    if (!result || !selectedId) return null;

    if (isResolved) {
        return (
            <div className="bg-panel-bg rounded-sm border border-emerald/20 p-12 flex flex-col items-center justify-center text-center animate-in fade-in duration-500 panel-depth glow-emerald/5">
                <div className="w-16 h-16 bg-emerald/10 rounded-sm border border-emerald/30 flex items-center justify-center mb-6 technical-border">
                    <svg className="w-8 h-8 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-[10px] font-bold text-emerald uppercase tracking-[0.3em] mb-2">Outcome Codified</h3>
                <p className="text-[11px] text-text-secondary uppercase tracking-widest max-w-xs leading-relaxed opacity-60">
                    This decision has been cryptographically sealed and appended to the immutable audit ledger.
                </p>
            </div>
        );
    }

    const isJustificationValid = justification.trim().length >= 10;

    return (
        <div className="bg-panel-bg rounded-sm border border-border-main overflow-hidden shadow-2xl panel-depth glow-gold/5">
            <div className="px-10 py-6 border-b border-border-main bg-panel-bg/60 flex justify-between items-center text-pretty scan-overlay">
                <div>
                    <h2 className="text-[10px] font-bold text-text-primary uppercase tracking-[0.3em] mb-1">Human Governance Enforcement</h2>
                    <p className="text-[9px] text-text-secondary uppercase tracking-widest font-medium opacity-60">Final analyst determination required per POL-SEC-09</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[9px] text-text-secondary font-mono font-bold tracking-widest self-center mt-0.5 opacity-40">SESSION: {selectedId?.slice(0, 8).toUpperCase()}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gold animate-sentinel"></span>
                </div>
            </div>

            <div className="p-10">
                <div className="space-y-10">
                    {/* Decision Selector */}
                    <div className="flex bg-background p-1.5 rounded-sm border border-border-main">
                        <button
                            onClick={() => setActiveTab('accept')}
                            className={`flex-1 py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all rounded-sm flex items-center justify-center gap-3 ${activeTab === 'accept' ? 'bg-panel-bg text-gold border border-gold/20 shadow-lg glow-gold/5' : 'text-text-secondary/40 hover:text-text-secondary'
                                }`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'accept' ? 'bg-gold animate-pulse' : 'bg-border-main'}`}></div>
                            Ratify Recommendation
                        </button>
                        <button
                            onClick={() => setActiveTab('override')}
                            className={`flex-1 py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all rounded-sm flex items-center justify-center gap-3 ${activeTab === 'override' ? 'bg-panel-bg text-red-400 border border-red-900/40 shadow-lg glow-red/5' : 'text-text-secondary/40 hover:text-text-secondary'
                                }`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'override' ? 'bg-red-500 animate-pulse' : 'bg-border-main'}`}></div>
                            Execute Override
                        </button>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] opacity-60">
                                    Regulatory Justification Log {activeTab === 'override' && <span className="text-red-500/80 font-mono ml-2">(MANDATORY)</span>}
                                </label>
                                <span className="text-[8px] text-text-secondary/40 font-mono uppercase">Log Length: {justification.length} / 10 min</span>
                            </div>
                            <textarea
                                value={justification}
                                onChange={(e) => setJustification(e.target.value)}
                                placeholder={activeTab === 'accept' ? "Affirm congruence with risk appetite framework..." : "Document specific deviation reasoning for threshold override..."}
                                className="w-full h-36 bg-background border border-border-main rounded-sm p-5 text-xs text-text-primary focus:border-gold/40 focus:ring-0 focus:outline-none transition-all resize-none font-sans leading-relaxed placeholder:text-text-secondary/20"
                            />
                            {justification.length > 0 && !isJustificationValid && (
                                <p className="text-[8px] text-red-500/60 uppercase font-bold tracking-[0.2em] mt-3">Input under regulatory threshold</p>
                            )}
                        </div>

                        <div className="bg-background/40 border border-border-main rounded-sm p-6 flex items-start gap-5 technical-border">
                            <div className="p-2.5 bg-background border border-border-main rounded-sm text-gold mt-0.5">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-text-primary/60 uppercase tracking-[0.2em] mb-1.5">Compliance Attribution</h4>
                                <p className="text-[10px] text-text-secondary/60 leading-relaxed max-w-lg">
                                    Committing this action will permanently associate your session fingerprint with this decision. Overrides that exceed variance thresholds may trigger secondary supervisory review.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => onExecute(activeTab === 'accept' ? 'Approved' : 'Overridden', justification)}
                            disabled={executionState !== 'idle' || !isJustificationValid}
                            className={`w-full py-5 rounded-sm text-[11px] font-bold uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 active:scale-[0.98] select-none ${executionState === 'idle'
                                ? isJustificationValid
                                    ? activeTab === 'accept'
                                        ? 'bg-gold text-background hover:bg-gold/90 shadow-2xl shadow-gold/20 glow-gold/20'
                                        : 'bg-red-950/40 text-red-400 border border-red-500/40 hover:bg-red-900/50'
                                    : 'bg-background text-text-secondary/20 cursor-not-allowed border border-border-main'
                                : executionState === 'loading'
                                    ? 'bg-background text-text-secondary cursor-wait border border-border-main'
                                    : 'bg-emerald/10 text-emerald border border-emerald/40'
                                }`}
                        >
                            {executionState === 'loading' ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-gold/20 border-t-gold rounded-full animate-spin"></div>
                                    Committing Determinations...
                                </>
                            ) : executionState === 'applied' ? (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Ledger Persistence Locked
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    Auth Action Determination
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
