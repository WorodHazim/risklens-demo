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
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    sortType: "Default" | "Risk" | "Urgency" | "Score";
    setSortType: (t: "Default" | "Risk" | "Urgency" | "Score") => void;
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
    getMicroContext,
    searchQuery,
    setSearchQuery,
    sortType,
    setSortType
}: PriorityQueueProps) {
    return (
        <div className="bg-panel-bg rounded-sm border border-border-main overflow-hidden flex flex-col h-[650px] shadow-2xl panel-depth glow-cyan/5">
            <div className="px-6 py-5 border-b border-border-main bg-panel-bg/60 scan-overlay">
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h2 className="text-[10px] font-bold text-text-primary uppercase tracking-[0.2em] mb-1">Analyst Decision Queue</h2>
                        <p className="text-[9px] text-text-secondary uppercase tracking-widest font-medium opacity-60">Pending compliance vectors</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-[9px] font-bold text-gold hover:text-background hover:bg-gold uppercase tracking-[0.2em] flex items-center gap-2 bg-background px-3 py-1.5 rounded-sm border border-border-main transition-all glow-gold/10"
                    >
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Sync
                    </button>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="SEARCH VECTORS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-background border border-border-main rounded-sm py-2 px-3 pl-8 text-[9px] font-bold tracking-[0.2em] text-text-primary focus:border-cyan/50 focus:outline-none transition-all placeholder:text-text-secondary/30"
                        />
                        <svg className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <select
                        value={sortType}
                        onChange={(e) => setSortType(e.target.value as any)}
                        className="bg-background border border-border-main rounded-sm py-2 px-3 text-[9px] font-bold tracking-[0.2em] text-cyan focus:border-cyan/50 focus:outline-none transition-all appearance-none cursor-pointer pr-8 relative uppercase"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2300E5FF\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '0.75rem' }}
                    >
                        <option value="Default">DEFAULT</option>
                        <option value="Risk">RISK (P1)</option>
                        <option value="Urgency">URGENCY</option>
                        <option value="Score">SCORE</option>
                    </select>
                </div>
            </div>
            <div className="overflow-y-auto flex-1 p-4 space-y-3 scrollbar-thin scrollbar-thumb-border-main scrollbar-track-transparent bg-background/20">
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
                                className={`w-full text-left p-4 rounded-sm border transition-all duration-300 group relative technical-border ${isResolved
                                    ? "bg-background/40 border-border-main opacity-50 border-l-[3px] border-l-emerald/50"
                                    : isSelected
                                        ? "bg-panel-bg/80 border-gold/40 border-l-[3px] border-l-gold shadow-gold/10 glow-gold/10 z-10"
                                        : "bg-background/60 border-border-main hover:bg-panel-bg/40 hover:border-cyan/30 border-l-[3px] border-l-transparent opacity-90 hover:opacity-100"
                                    }`}
                                title={isResolved ? "Case resolved — decision logged" : "Click to load analysis"}
                            >
                                {isSelected && !isResolved && (
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gold/5 rounded-bl-full pointer-events-none"></div>
                                )}

                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm border uppercase tracking-widest ${isSelected ? 'border-gold/40 text-gold shadow-gold/5' : priority.color}`}>
                                            {priority.label}
                                        </span>
                                        <span className="text-[10px] font-mono font-medium text-text-secondary/60 tracking-tighter">VECTOR: {s.id.substring(0, 8).toUpperCase()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isAging && (
                                            <span className="flex items-center gap-1.5 text-[8px] font-bold text-gold uppercase tracking-[0.2em] transition-all">
                                                <span className="w-1 h-1 rounded-full bg-gold animate-sentinel"></span>
                                                Aging
                                            </span>
                                        )}
                                        <span className={`text-[9px] font-bold uppercase tracking-widest opacity-80 ${sla.color}`}>{sla.text}</span>
                                    </div>
                                </div>

                                <h3 className={`text-sm font-medium mb-1 truncate pr-8 tracking-tight ${isResolved ? "text-text-secondary" : isSelected ? "text-text-primary font-bold" : "text-text-secondary group-hover:text-text-primary"}`}>
                                    {s.name}
                                </h3>
                                <p className={`text-[9px] font-mono uppercase tracking-[0.1em] mb-4 opacity-40 ${isResolved ? "text-text-secondary/50" : isSelected ? "text-gold/80" : "text-text-secondary/60 group-hover:text-cyan/60"}`}>
                                    // SENTINEL: {context}
                                </p>

                                <div className="flex justify-between items-center pt-3 border-t border-border-main/40 mt-auto">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border ${status === 'NEW' ? 'text-cyan bg-cyan/10 border-cyan/20' :
                                            status === 'IN-REVIEW' ? 'text-gold bg-gold/10 border-gold/20' :
                                                'text-emerald bg-emerald/10 border-emerald/20'
                                            }`}>
                                            {status}
                                        </span>
                                        {openedAt && !isResolved && (
                                            <span className="text-[8px] text-text-secondary/50 font-mono">
                                                T+{agingMinutes}M
                                            </span>
                                        )}
                                    </div>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-[0.2em] border shadow-sm transition-all ${getRiskBadgeColor(s.risk)}`}>
                                        {s.risk}
                                    </span>
                                </div>
                            </button>
                        );
                    })
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.3em] mb-2">Vectors Clear</p>
                        <p className="text-[9px] text-text-secondary uppercase tracking-widest opacity-40">Zero vectors matching current heuristics</p>
                    </div>
                )}
            </div>
        </div>
    );
}
