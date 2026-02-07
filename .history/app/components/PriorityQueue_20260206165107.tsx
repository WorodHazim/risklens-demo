"use client";

import Image from "next/image";

interface PriorityQueueProps {
    scenarios: any[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    caseStatus: { [key: string]: string };
    caseOpenedAt: { [key: string]: number };
    getPriority: (risk: string) => any;
    getSLA: (risk: string) => any;
    getRiskBadgeColor: (risk: string) => string;
    getMicroContext: (s: any) => string;
}

export default function PriorityQueue({
    scenarios,
    selectedId,
    onSelect,
    caseStatus,
    caseOpenedAt,
    getPriority,
    getSLA,
    getRiskBadgeColor,
    getMicroContext
}: PriorityQueueProps) {
    return (
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
                {scenarios.length > 0 ? (
                    scenarios.map((s) => {
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
                                onClick={() => onSelect(s.id)}
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
    );
}
