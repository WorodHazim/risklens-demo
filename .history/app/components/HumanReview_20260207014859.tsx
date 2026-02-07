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
            <div className="bg-[#0A0A0A] rounded-sm border border-emerald-900/10 p-12 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                <div className="w-14 h-14 bg-emerald-500/5 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-7 h-7 text-emerald-500/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-[10px] font-bold text-emerald-500/90 uppercase tracking-[0.25em] mb-2">Outcome Codified</h3>
                <p className="text-[11px] text-[#444] uppercase tracking-wide max-w-xs leading-relaxed">
                    This decision has been cryptographically sealed and appended to the immutable audit ledger.
                </p>
            </div>
        );
    }

    const isJustificationValid = justification.trim().length >= 10;

    return (
        <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] overflow-hidden shadow-2xl">
            <div className="px-10 py-6 border-b border-[#1A1A1A] bg-[#0F0F0F]/30 flex justify-between items-center text-pretty">
                <div>
                    <h2 className="text-[10px] font-bold text-[#E5E5E0] uppercase tracking-[0.2em] mb-1">Human Governance Enforcement</h2>
                    <p className="text-[9px] text-[#666] uppercase tracking-widest font-medium">Final analyst determination required per POL-SEC-09</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[9px] text-[#333] font-mono font-bold tracking-tighter self-center mt-0.5">AUTH-SESSION: {selectedId?.slice(0, 8).toUpperCase()}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4B483]/80 animate-pulse"></span>
                </div>
            </div>

            <div className="p-10">
                <div className="space-y-10">
                    {/* Decision Selector */}
                    <div className="flex bg-[#050505] p-1.5 rounded-sm border border-[#1A1A1A]">
                        <button
                            onClick={() => setActiveTab('accept')}
                            className={`flex-1 py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all rounded-sm flex items-center justify-center gap-3 ${activeTab === 'accept' ? 'bg-[#111] text-[#D4B483] border border-[#222] shadow-inner' : 'text-[#444] hover:text-[#555]'
                                }`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'accept' ? 'bg-[#D4B483]' : 'bg-[#222]'}`}></div>
                            Ratify Recommendation
                        </button>
                        <button
                            onClick={() => setActiveTab('override')}
                            className={`flex-1 py-4 text-[11px] font-bold uppercase tracking-[0.2em] transition-all rounded-sm flex items-center justify-center gap-3 ${activeTab === 'override' ? 'bg-[#111] text-red-500/80 border border-[#222] shadow-inner' : 'text-[#444] hover:text-[#555]'
                                }`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'override' ? 'bg-red-500/60' : 'bg-[#222]'}`}></div>
                            Execute Override
                        </button>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <div className="flex justify-between items-end mb-4">
                                <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em]">
                                    Regulatory Justification Log {activeTab === 'override' && <span className="text-red-500/50 font-mono ml-2">(MANDATORY)</span>}
                                </label>
                                <span className="text-[8px] text-[#333] font-mono uppercase">Log Length: {justification.length} / 10 min</span>
                            </div>
                            <textarea
                                value={justification}
                                onChange={(e) => setJustification(e.target.value)}
                                placeholder={activeTab === 'accept' ? "Affirm congruence with risk appetite framework..." : "Document specific deviation reasoning for threshold override..."}
                                className="w-full h-36 bg-[#050505] border border-[#1A1A1A] rounded-sm p-5 text-xs text-[#AAA] focus:border-[#D4B483]/30 focus:ring-0 focus:outline-none transition-all resize-none font-sans leading-relaxed"
                            />
                            {justification.length > 0 && !isJustificationValid && (
                                <p className="text-[8px] text-red-500/40 uppercase font-bold tracking-[0.2em] mt-3">Input under regulatory threshold</p>
                            )}
                        </div>

                        <div className="bg-[#0C0C0C] border border-[#1F1F1F] rounded-sm p-6 flex items-start gap-5">
                            <div className="p-2.5 bg-[#161616] border border-[#222] rounded-sm text-amber-500/50 mt-0.5">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-[#E5E5E0]/60 uppercase tracking-widest mb-1.5">Compliance Attribution</h4>
                                <p className="text-[10px] text-[#555] leading-relaxed max-w-lg">
                                    Committing this action will permanently associate your session fingerprint with this decision. Overrides that exceed variance thresholds may trigger secondary supervisory review.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => onExecute(activeTab === 'accept' ? 'Approved' : 'Overridden', justification)}
                            disabled={executionState !== 'idle' || !isJustificationValid}
                            className={`w-full py-5 rounded-sm text-[11px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 active:scale-[0.99] select-none ${executionState === 'idle'
                                ? isJustificationValid
                                    ? activeTab === 'accept'
                                        ? 'bg-[#D4B483] text-[#050505] hover:bg-[#E5C594] shadow-xl shadow-[#D4B483]/5'
                                        : 'bg-red-900/40 text-red-100 border border-red-800/20 hover:bg-red-900/50'
                                    : 'bg-[#0A0A0A] text-[#222] cursor-not-allowed border border-[#111]'
                                : executionState === 'loading'
                                    ? 'bg-[#0A0A0A] text-[#444] cursor-wait border border-[#111]'
                                    : 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/20'
                                }`}
                        >
                            {executionState === 'loading' ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-[#D4B483]/20 border-t-[#D4B483] rounded-full animate-spin"></div>
                                    Committing Action...
                                </>
                            ) : executionState === 'applied' ? (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Ledger Updated
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    Execute Final Determination
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
