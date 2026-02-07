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

    if (!result || isResolved) {
        if (isResolved) {
            return (
                <div className="bg-[#0A0A0A] rounded-sm border border-emerald-900/20 p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] mb-2">Decision Finalized</h3>
                    <p className="text-[11px] text-[#555] uppercase tracking-wide">
                        This case has been cryptographically sealed in the Audit Ledger.
                    </p>
                </div>
            );
        }
        return null;
    }

    const isJustificationValid = justification.trim().length >= 10;

    return (
        <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="px-8 py-5 border-b border-[#1A1A1A] bg-[#0F0F0F]/50 flex justify-between items-center">
                <div>
                    <h2 className="text-[10px] font-bold text-[#E5E5E0] uppercase tracking-[0.15em] mb-1">Human Review & Governance Enforcement</h2>
                    <p className="text-[9px] text-[#555] uppercase tracking-wide font-medium">Final outcome determination required</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[8px] text-[#444] font-mono font-bold">CASE-TOKEN: {selectedId?.slice(0, 8).toUpperCase()}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4B483] animate-pulse"></span>
                </div>
            </div>

            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    {/* Decision Selector */}
                    <div className="md:col-span-12">
                        <div className="flex bg-[#050505] p-1 rounded-sm border border-[#1A1A1A] mb-8">
                            <button
                                onClick={() => setActiveTab('accept')}
                                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm flex items-center justify-center gap-2 ${activeTab === 'accept' ? 'bg-[#111] text-[#D4B483] border border-[#222] shadow-inner' : 'text-[#444] hover:text-[#666]'
                                    }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'accept' ? 'bg-[#D4B483]' : 'bg-[#222]'}`}></div>
                                Accept AI Recommendation
                            </button>
                            <button
                                onClick={() => setActiveTab('override')}
                                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm flex items-center justify-center gap-2 ${activeTab === 'override' ? 'bg-[#111] text-red-400 border border-[#222] shadow-inner' : 'text-[#444] hover:text-[#666]'
                                    }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'override' ? 'bg-red-400' : 'bg-[#222]'}`}></div>
                                Override Recommendation
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[9px] font-bold text-[#555] uppercase tracking-[0.2em] mb-3 block">
                                    Analyst Justification {activeTab === 'override' && <span className="text-red-500/60 font-mono">(REQUIRED)</span>}
                                </label>
                                <textarea
                                    value={justification}
                                    onChange={(e) => setJustification(e.target.value)}
                                    placeholder={activeTab === 'accept' ? "Confirm logic alignment with policy POL-KYC-001..." : "State specific reasoning for threshold override..."}
                                    className="w-full h-32 bg-[#050505] border border-[#1A1A1A] rounded-sm p-4 text-xs text-[#AAA] focus:border-[#D4B483]/50 focus:ring-0 focus:outline-none transition-all resize-none font-sans leading-relaxed"
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-[8px] text-[#333] font-mono uppercase">Characters: {justification.length} / min 10</span>
                                    {justification.length > 0 && !isJustificationValid && (
                                        <span className="text-[8px] text-red-500/50 uppercase font-bold tracking-wider">Insufficient justification length</span>
                                    )}
                                </div>
                            </div>

                            <div className="bg-amber-950/5 border border-amber-900/20 rounded-sm p-5 flex items-start gap-4">
                                <div className="p-2 bg-amber-950/20 rounded-sm text-amber-500/80 mt-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest mb-1.5">Governance Disclaimer</h4>
                                    <p className="text-[10px] text-[#666] leading-relaxed">
                                        Decisions are time-stamped, attributed to your session [RL-8829-QX], and cannot be modified once committed. High-risk overrides may trigger secondary compliance review.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => onExecute(activeTab === 'accept' ? 'Approved' : 'Overridden', justification)}
                                disabled={executionState !== 'idle' || !isJustificationValid}
                                className={`w-full py-4 rounded-sm text-[11px] font-bold uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${executionState === 'idle'
                                    ? isJustificationValid
                                        ? activeTab === 'accept'
                                            ? 'bg-[#D4B483] text-black hover:bg-[#E5C594] shadow-lg shadow-[#D4B483]/10'
                                            : 'bg-red-900/40 text-red-200 border border-red-800/30 hover:bg-red-900/50'
                                        : 'bg-[#111] text-[#333] cursor-not-allowed border border-[#1A1A1A]'
                                    : executionState === 'loading'
                                        ? 'bg-[#111] text-[#555] cursor-wait border border-[#1A1A1A]'
                                        : 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30'
                                    }`}
                            >
                                {executionState === 'loading' ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Committing to Ledger...
                                    </>
                                ) : executionState === 'applied' ? (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        Artifact Sealed
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                        Finalize Decision
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
