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
        <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-10 py-6 flex items-center justify-between hover:bg-[#0F0F0F] transition-colors group"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-6">
                    <h2 className="text-[10px] font-bold text-[#E5E5E0] uppercase tracking-[0.25em]">Strategic Impact Projection</h2>
                    <span className="px-3 py-1 bg-[#111] border border-[#222] text-[#444] text-[8px] font-mono uppercase tracking-tighter">SIM-LENS V.4.2</span>
                </div>
                <svg
                    className={`w-4 h-4 text-[#444] group-hover:text-[#666] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="px-10 pb-10 pt-4 animate-in fade-in duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b border-[#1A1A1A]">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-[9px] font-bold text-[#666] uppercase tracking-[0.15em]">Simulation Context</h3>
                            <p className="text-[11px] text-[#444] font-medium tracking-wide">Multi-vector analysis relative to active scenario</p>
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setIsScenarioDropdownOpen(!isScenarioDropdownOpen)}
                                className="flex items-center gap-4 px-5 py-2.5 bg-[#111] border border-[#222] text-[#D4B483] text-[9px] font-bold uppercase tracking-widest hover:border-[#333] transition-all"
                            >
                                <span className="opacity-50 text-[8px] text-[#666]">SCENARIO:</span>
                                {selectedScenario}
                                <svg className={`w-3 h-3 transition-transform ${isScenarioDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {isScenarioDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-[#111] border border-[#222] shadow-2xl z-[200] overflow-hidden rounded-sm animate-in fade-in slide-in-from-top-2 duration-200">
                                    {scenarios.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => {
                                                setSelectedScenario(s);
                                                setIsScenarioDropdownOpen(false);
                                            }}
                                            className={`w-full px-5 py-3.5 text-left text-[9px] font-bold uppercase tracking-widest transition-colors ${selectedScenario === s ? 'bg-[#181818] text-[#D4B483]' : 'text-[#444] hover:bg-[#151515] hover:text-[#D4B483]/80'
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
                            { label: "Loss Avoidance", val: result.impact_metrics?.loss_avoidance || "+$0k", hint: "Projected recovery vs baseline" },
                            { label: "Compliance Delta", val: result.impact_metrics?.compliance_delta || "N/A", hint: "Regulatory overhead variance" },
                            { label: "Signal Recency", val: result.impact_metrics?.signal_recency || "30ms", hint: "Processing latency under load" }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-[#0D0D0D]/50 p-8 border border-[#1A1A1A] rounded-sm hover:border-[#262626] transition-all group">
                                <div className="flex flex-col gap-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em] mb-4 group-hover:text-[#888] transition-colors">{item.label}</p>
                                        <p className="text-3xl font-thin text-[#E5E5E0] tracking-tighter">{item.val}</p>
                                    </div>
                                    <p className="text-[9px] text-[#444] font-mono leading-relaxed tracking-tight">{item.hint}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
