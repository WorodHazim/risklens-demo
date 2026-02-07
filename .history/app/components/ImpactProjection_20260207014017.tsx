"use client";

import { useState } from "react";

interface ImpactProjectionProps {
    result: any;
    actionExecutionState: string;
}

export default function ImpactProjection({ result, actionExecutionState }: ImpactProjectionProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [selectedScenario, setSelectedScenario] = useState("Baseline (Default)");
    const [isScenarioDropdownOpen, setIsScenarioDropdownOpen] = useState(false);

    // Defensive Guard
    if (!result) return null;

    const scenarios = [
        "Baseline (Default)",
        "Extended Freeze (+48h)",
        "Aggressive Recovery",
        "Passive Monitor"
    ];

    return (
        <div className="bg-panel-bg/40 rounded-sm border border-border-main overflow-hidden transition-all duration-300 panel-depth glow-cyan/5">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-10 py-6 flex items-center justify-between hover:bg-panel-bg/60 transition-colors group relative overflow-hidden"
                aria-expanded={isOpen}
            >
                <div className="absolute top-0 left-0 h-full w-1 bg-cyan/20 group-hover:bg-cyan/40 transition-colors"></div>
                <div className="flex items-center gap-6">
                    <h2 className="text-[10px] font-bold text-text-primary uppercase tracking-[0.3em]">Quantum Impact Projection</h2>
                    <span className="px-3 py-1 bg-background border border-border-main text-text-secondary text-[8px] font-mono uppercase tracking-widest glow-cyan/10">SIM-LENS V.4.2</span>
                </div>
                <svg
                    className={`w-4 h-4 text-text-secondary group-hover:text-cyan transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="px-10 pb-10 pt-4 animate-in fade-in duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b border-border-main scan-overlay">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.2em] opacity-60">Simulation Context</h3>
                            <p className="text-[11px] text-text-primary/80 font-medium tracking-wide">Multi-vector analysis relative to active node</p>
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setIsScenarioDropdownOpen(!isScenarioDropdownOpen)}
                                className="flex items-center gap-4 px-5 py-2.5 bg-background border border-border-main text-gold text-[9px] font-bold uppercase tracking-[0.2em] hover:border-gold/50 transition-all glow-gold/5"
                            >
                                <span className="opacity-50 text-[8px] text-text-secondary">VECTOR:</span>
                                {selectedScenario}
                                <svg className={`w-3 h-3 transition-transform ${isScenarioDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {isScenarioDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-background border border-border-main shadow-2xl z-[200] overflow-hidden rounded-sm animate-in fade-in slide-in-from-top-2 duration-200">
                                    {scenarios.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => {
                                                setSelectedScenario(s);
                                                setIsScenarioDropdownOpen(false);
                                            }}
                                            className={`w-full px-5 py-3.5 text-left text-[9px] font-bold uppercase tracking-[0.2em] transition-colors ${selectedScenario === s ? 'bg-panel-bg text-gold' : 'text-text-secondary hover:bg-panel-bg/40 hover:text-gold/80'
                                                }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { label: "Loss Avoidance", val: result.impact_metrics?.loss_avoidance || "+$0k", hint: "Projected recovery vs baseline", color: "text-emerald" },
                            { label: "Compliance Delta", val: result.impact_metrics?.compliance_delta || "N/A", hint: "Regulatory variance threshold", color: "text-gold" },
                            { label: "Signal Recency", val: result.impact_metrics?.signal_recency || "30ms", hint: "Neural processing latency", color: "text-cyan" }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-background/40 p-8 border border-border-main rounded-sm hover:border-border-main/80 transition-all group technical-border">
                                <div className="flex flex-col gap-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.25em] mb-4 group-hover:text-text-primary transition-colors opacity-60">{item.label}</p>
                                        <p className={`text-3xl font-thin tracking-tighter ${item.color} drop-shadow-sm`}>{item.val}</p>
                                    </div>
                                    <p className="text-[9px] text-text-secondary font-mono leading-relaxed tracking-tight opacity-40">{item.hint}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
    );
}
