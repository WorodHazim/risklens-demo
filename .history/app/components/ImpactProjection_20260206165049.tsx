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
                className="px-8 py-6 flex justify-between items-center cursor-pointer hover:bg-[#0E0E0E] transition-all"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <h3 className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50"></span>
                            Strategic Impact Projection
                        </h3>
                        <p className="text-xs text-[#AAA] font-light">Simulation: {selectedScenario}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="relative overflow-visible">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsScenarioOpen(!isScenarioOpen);
                            }}
                            className="px-3 py-1.5 bg-[#111] border border-[#222] rounded-sm text-[9px] font-bold uppercase tracking-widest text-[#D4B483] hover:border-[#D4B483]/40 transition-all flex items-center gap-2"
                        >
                            Switch Scenario
                            <svg className={`w-3 h-3 transition-transform ${isScenarioOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {isScenarioOpen && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-[#0F0F0F] border border-[#222] rounded-sm shadow-2xl z-[150] animate-in fade-in zoom-in-95 duration-150 py-1">
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
                    <svg className={`w-4 h-4 text-[#333] transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {/* Accordion Content */}
            {isExpanded && (
                <div className="px-8 pb-8 animate-in slide-in-from-top-2 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#1A1A1A]">
                        {/* KPI 1 */}
                        <div className="bg-[#080808] border border-[#151515] p-5 rounded-sm hover:border-[#222] transition-colors">
                            <span className="text-[9px] font-bold text-[#444] uppercase tracking-widest block mb-1">Exposure Vector</span>
                            <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-xl font-light text-red-500/80">$42,500</span>
                                <span className="text-[9px] text-red-900 font-mono">EST. LOSS</span>
                            </div>
                            <p className="text-[10px] text-[#666] leading-relaxed">Projected capital at risk if transaction velocity remains unthrottled in next 24h.</p>
                        </div>

                        {/* KPI 2 */}
                        <div className="bg-[#080808] border border-[#151515] p-5 rounded-sm hover:border-[#222] transition-colors">
                            <span className="text-[9px] font-bold text-[#444] uppercase tracking-widest block mb-1">Analyst Efficiency</span>
                            <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-xl font-light text-[#D4B483]">+18 min</span>
                                <span className="text-[9px] text-[#D4B483]/50 font-mono">SLA SAVED</span>
                            </div>
                            <p className="text-[10px] text-[#666] leading-relaxed">Automation uplift from AI pre-adjudication vs pure manual compliance review.</p>
                        </div>

                        {/* KPI 3 */}
                        <div className="bg-[#080808] border border-[#151515] p-5 rounded-sm hover:border-[#222] transition-colors">
                            <span className="text-[9px] font-bold text-[#444] uppercase tracking-widest block mb-1">False Positives</span>
                            <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-xl font-light text-emerald-500/80">-12.4%</span>
                                <span className="text-[9px] text-emerald-900 font-mono">VARIANCE</span>
                            </div>
                            <p className="text-[10px] text-[#666] leading-relaxed">Model variance reduction compared to legacy rule-based threshold engines.</p>
                        </div>
                    </div>

                    <div className="mt-8 p-6 bg-[#0F0F0F] rounded-sm border border-[#1F1F1F] border-dashed">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-[#CCC] uppercase tracking-widest">Simulation Context: {selectedScenario}</span>
                        </div>
                        <p className="text-[11px] text-[#777] leading-relaxed italic">
                            "Based on historical backtesting of {result?.risk_level} risk vectors, implementing the selected mitigation strategy is projected to neutralize {result?.risk_level === 'High' ? '82%' : '94%'} of immediate exposure while maintaining nominal customer friction (CSAT Delta: -0.2)."
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
