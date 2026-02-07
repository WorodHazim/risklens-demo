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
                    <span className="text-2xl font-light text-[#D4B483]">+18 min</span>
                    <span className="text-[9px] text-[#D4B483]/50 font-mono font-bold tracking-tighter">SLA SAVED</span>
                </div>
                <p className="text-[10px] text-[#666] leading-relaxed font-light">Automation uplift from AI pre-adjudication vs pure manual compliance review.</p>
        </div>

                        {/* KPI 3 */ }
    <div className="bg-[#050505] border border-[#151515] p-6 rounded-sm hover:border-[#D4B483]/20 transition-all group/kpi">
        <span className="text-[9px] font-bold text-[#444] uppercase tracking-widest block mb-2 group-hover/kpi:text-[#555]">False Positives</span>
        <div className="flex items-baseline gap-2 mb-3">
            <span className="text-2xl font-light text-emerald-500/80">-12.4%</span>
            <span className="text-[9px] text-emerald-900 font-mono font-bold tracking-tighter">VARIANCE</span>
        </div>
        <p className="text-[10px] text-[#666] leading-relaxed font-light">Model variance reduction compared to legacy rule-based threshold engines.</p>
    </div>
                    </div >

        <div className="mt-12 p-8 bg-[#070707] rounded-sm border border-[#1F1F1F] border-dashed relative group/sim">
            <div className="absolute -top-3 left-6 px-3 bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm">
                <span className="text-[9px] font-bold text-[#D4B483] uppercase tracking-widest">Simulated Projection</span>
            </div>
            <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-cyan-950/20 rounded-full">
                    <span className="block w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
                </div>
                <span className="text-[10px] font-bold text-[#555] uppercase tracking-widest">Scenario: <span className="text-[#888]">{selectedScenario}</span></span>
            </div>
            <p className="text-[11px] text-[#888] leading-relaxed italic border-l-2 border-[#1F1F1F] pl-6 py-1">
                "Based on historical backtesting of {result?.risk_level} risk vectors, implementing the selected mitigation strategy is projected to neutralize {result?.risk_level === 'High' ? '82%' : '94%'} of immediate exposure while maintaining nominal customer friction (CSAT Delta: -0.2)."
            </p>
        </div>
                </div >
            )
}
        </div >
    );
}
