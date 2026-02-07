"use client";

import { useState } from "react";

interface ImpactProjectionProps {
    result: any;
    actionExecutionState: string;
}

export default function ImpactProjection({ result, actionExecutionState }: ImpactProjectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isScenarioOpen, setIsScenarioOpen] = useState(false);
    const [selectedScenario, setSelectedScenario] = useState("Default (No Intervention)");

    const scenarios = [
        "Default (No Intervention)",
        "Mitigation: MFA Step-up",
        "Mitigation: Asset Lock",
        "Mitigation: Velocity Caps"
    ];

    return (
        <div className="bg-[#0A0A0A] rounded-sm border border-[#1F1F1F] overflow-visible relative group" id="impact-section">
            {/* Header / Trigger */}
            <div
                className="px-8 py-6 flex justify-between items-center cursor-pointer hover:bg-[#0E0E0E] transition-all border-b border-[#1F1F1F]/50"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50"></span>
                            Strategic Impact Projection
                        </h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-[9px] text-[#444] uppercase font-bold tracking-widest">Active Scenario:</span>
                            <p className="text-xs text-[#AAA] font-light">{selectedScenario}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsScenarioOpen(!isScenarioOpen);
                            }}
                            aria-expanded={isScenarioOpen}
                            className="px-3 py-1.5 bg-[#111] border border-[#222] rounded-sm text-[9px] font-bold uppercase tracking-widest text-[#D4B483] hover:border-[#D4B483]/40 transition-all flex items-center gap-2 outline-none"
                        >
                            Switch Scenario
                            <svg className={`w-3 h-3 transition-transform duration-300 ${isScenarioOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {isScenarioOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-[#0F0F0F] border border-[#222] rounded-sm shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-[200] animate-in fade-in zoom-in-95 duration-200 py-1">
                                {scenarios.map(s => (
                                    <button
                                        key={s}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedScenario(s);
                                            setIsScenarioOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2.5 text-[10px] uppercase font-bold tracking-wider transition-colors hover:bg-[#161616] ${selectedScenario === s ? 'text-[#D4B483]' : 'text-[#555]'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="h-4 w-px bg-[#1F1F1F]"></div>
                    <svg className={`w-4 h-4 text-[#333] transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Accordion Content */}
            {isExpanded && (
                <div className="px-8 pb-8 animate-in slide-in-from-top-2 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
                        {/* KPI 1 */}
                        <div className="bg-[#050505] border border-[#151515] p-6 rounded-sm hover:border-[#D4B483]/20 transition-all group/kpi">
                            <span className="text-[9px] font-bold text-[#444] uppercase tracking-widest block mb-2 group-hover/kpi:text-[#555]">Exposure Vector</span>
                            <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-2xl font-light text-red-500/80">$42,500</span>
                                <span className="text-[9px] text-red-900 font-mono font-bold tracking-tighter">EST. LOSS</span>
                            </div>
                            <p className="text-[10px] text-[#666] leading-relaxed font-light">Projected capital at risk if transaction velocity remains unthrottled in next 24h.</p>
                        </div>

                        {/* KPI 2 */}
                        <div className="bg-[#050505] border border-[#151515] p-6 rounded-sm hover:border-[#D4B483]/20 transition-all group/kpi">
                            <span className="text-[9px] font-bold text-[#444] uppercase tracking-widest block mb-2 group-hover/kpi:text-[#555]">Analyst Efficiency</span>
                            <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-2xl font-light text-[#D4B483]">+18 min</span>
                                <span className="text-[9px] text-[#D4B483]/50 font-mono font-bold tracking-tighter">SLA SAVED</span>
                            </div>
                            <p className="text-[10px] text-[#666] leading-relaxed font-light">Automation uplift from AI pre-adjudication vs pure manual compliance review.</p>
                        </div>

                        {/* KPI 3 */}
                        <div className="bg-[#050505] border border-[#151515] p-6 rounded-sm hover:border-[#D4B483]/20 transition-all group/kpi">
                            <span className="text-[9px] font-bold text-[#444] uppercase tracking-widest block mb-2 group-hover/kpi:text-[#555]">False Positives</span>
                            <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-2xl font-light text-emerald-500/80">-12.4%</span>
                                <span className="text-[9px] text-emerald-900 font-mono font-bold tracking-tighter">VARIANCE</span>
                            </div>
                            <p className="text-[10px] text-[#666] leading-relaxed font-light">Model variance reduction compared to legacy rule-based threshold engines.</p>
                        </div>
                    </div>

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
                </div>
            )}
        </div>
    );
}
