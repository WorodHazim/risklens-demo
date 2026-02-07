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

    // Final visibility gate: show only for verification or escalation
    const isReviewable = result.recommended_action?.includes("Verification") ||
        result.recommended_action?.includes("Escalate");

    if (!isReviewable || isResolved) {
        if (isResolved) {
            return (
                <div className="bg-[#0A0A0A] rounded-sm border border-emerald-900/10 p-10 flex flex-col items-center justify-center text-center animate-enterprise-in">
                    <div className="w-12 h-12 bg-emerald-500/5 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-6 h-6 text-emerald-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-[0.2em] mb-3">Decision Finalized</h3>
                    <p className="text-[11px] text-[#555] uppercase tracking-widest font-light leading-relaxed max-w-xs">
                        The remediation record has been cryptographically sealed and attributed to your session.
                    </p>
                </div>
            );
        }
        return null;
    }

    const isJustificationValid = justification.trim().length >= 10;

    return (
        <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] overflow-hidden shadow-[0_8px_48px_rgba(0,0,0,0.5)] animate-enterprise-in">
            <div className="px-10 py-6 border-b border-[#1A1A1A] bg-[#0F0F0F]/50 flex justify-between items-center">
                <div>
                    <h2 className="text-[11px] font-bold text-[#F5F5F0] uppercase tracking-[0.2em] mb-1.5">Governance & Human Review</h2>
                    <p className="text-[9px] text-[#666] uppercase tracking-widest font-bold">Policy-mandated manual verification required</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[9px] text-[#444] font-mono font-bold tracking-tighter">RL-STAMP: {selectedId?.slice(0, 12).toUpperCase()}</span>
                    <div className="w-2 h-2 rounded-full bg-[#D4B483] animate-pulse"></div>
                </div>
            </div>

            <div className="p-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    <div className="md:col-span-12">
                        <div className="flex bg-[#050505] p-1 rounded-sm border border-[#1A1A1A] mb-10">
                            <button
                                onClick={() => setActiveTab('accept')}
                                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all rounded-sm flex items-center justify-center gap-3 ${activeTab === 'accept' ? 'bg-[#111] text-[#D4B483] border border-[#222]' : 'text-[#444] hover:text-[#555]'
                                    }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'accept' ? 'bg-[#D4B483]' : 'bg-[#222]'}`}></div>
                                Confirm AI Logic
                            </button>
                            <button
                                onClick={() => setActiveTab('override')}
                                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all rounded-sm flex items-center justify-center gap-3 ${activeTab === 'override' ? 'bg-[#111] text-red-500 border border-[#222]' : 'text-[#444] hover:text-[#555]'
                                    }`}
                            >
                                <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'override' ? 'bg-red-500' : 'bg-[#222]'}`}></div>
                                Override Determination
                            </button>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <label className="text-[10px] font-bold text-[#555] uppercase tracking-[0.2em] mb-4 block">
                                    Decision Justification {activeTab === 'override' && <span className="text-red-950 font-mono">(GOVERNANCE_LOCK)</span>}
                                </label>
                                <textarea
                                    value={justification}
                                    onChange={(e) => setJustification(e.target.value)}
                                    placeholder={activeTab === 'accept' ? "Confirming signal alignment with baseline profiles..." : "Detail specific policy divergence or override reasoning..."}
                                    className="w-full h-36 bg-[#050505] border border-[#1A1A1A] rounded-sm p-5 text-xs text-[#AAA] focus:border-[#D4B483]/30 focus:ring-0 focus:outline-none transition-all resize-none font-sans leading-relaxed"
                                />
                                <div className="flex justify-between items-center mt-3">
                                    <span className="text-[9px] text-[#333] font-mono uppercase tracking-tighter">Verification Length: {justification.length} / 10 chars</span>
                                    {justification.length > 0 && !isJustificationValid && (
                                        <span className="text-[9px] text-red-900 font-bold uppercase tracking-widest">Awaiting valid justification...</span>
                                    )}
                                </div>
                            </div>

                            <div className="bg-amber-950/5 border border-amber-950/10 rounded-sm p-6 flex items-start gap-5">
                                <div className="p-2 bg-amber-950/10 rounded-sm text-amber-500/50 mt-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest mb-1.5">Attribution & Compliance</h4>
                                    <p className="text-[10px] text-[#555] leading-relaxed font-light">
                                        Final determinations are immutable and cryptographically linked to your analyst credentials for the current regulatory review period.
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => onExecute(activeTab === 'accept' ? 'Approved' : 'Overridden', justification)}
                                disabled={executionState !== 'idle' || !isJustificationValid}
                                className={`w-full py-5 rounded-sm text-[11px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 active:scale-[0.99] ${executionState === 'idle'
                                        ? isJustificationValid
                                            ? activeTab === 'accept'
                                                ? 'bg-[#D4B483] text-black hover:bg-[#E5C594] shadow-[0_8px_32px_rgba(212,180,131,0.15)]'
                                                : 'bg-red-950/30 text-red-500 border border-red-900/30 hover:bg-red-950/40'
                                            : 'bg-[#0A0A0A] text-[#333] cursor-not-allowed border border-[#1A1A1A]'
                                        : executionState === 'loading'
                                            ? 'bg-[#111] text-[#555] cursor-wait border border-[#1A1A1A]'
                                            : 'bg-emerald-950/10 text-emerald-500/60 border border-emerald-900/20'
                                    }`}
                            >
                                {executionState === 'loading' ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-[#555] border-t-white rounded-full animate-spin"></div>
                                        Committing to Ledger...
                                    </>
                                ) : executionState === 'applied' ? (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        Finalized & Archived
                                    </>
                                ) : (
                                    <>
                                        Finalize Outcome Review
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
