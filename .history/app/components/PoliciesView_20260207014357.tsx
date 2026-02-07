"use client";

import Image from "next/image";

interface PoliciesViewProps {
    activeScenarios: any[];
    handleSimulation: (action: string) => void;
}

export default function PoliciesView({ activeScenarios, handleSimulation }: PoliciesViewProps) {
    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            {/* Hero Top Panel */}
            <div className="bg-panel-bg rounded-sm border border-border-main p-8 flex justify-between items-center relative overflow-hidden panel-depth glow-gold/5">
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-gold/5 to-transparent opacity-50 pointer-events-none"></div>
                <div>
                    <div className="flex items-center gap-3 mb-3 font-bold opacity-60">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-gold">Governance Enforcement Layer</span>
                    </div>
                    <h2 className="text-3xl font-thin text-text-primary tracking-tighter mb-4">RL Policy Engine</h2>
                    <p className="text-sm text-text-secondary font-light max-w-2xl leading-relaxed opacity-60">
                        Deterministic rule definitions governing AI heuristic evaluation. All policies are cryptographically signed, version-controlled, and require dual-key approval for modification.
                    </p>
                </div>
                <div className="hidden md:flex items-center gap-10">
                    <div className="text-center">
                        <span className="block text-4xl font-thin text-gold mb-1 drop-shadow-sm">6</span>
                        <span className="text-[9px] uppercase tracking-widest text-text-secondary font-bold opacity-40">Active Nodes</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-4xl font-thin text-emerald/80 mb-1 drop-shadow-sm">100%</span>
                        <span className="text-[9px] uppercase tracking-widest text-text-secondary font-bold opacity-40">Compliance</span>
                    </div>
                </div>
            </div>

            {/* Policy Categories */}
            <div className="space-y-8">
                {/* AML Section */}
                <div className="bg-panel-bg/40 rounded-sm border border-border-main overflow-hidden panel-depth">
                    <div className="px-8 py-5 border-b border-border-main/50 bg-background/60 flex justify-between items-center scan-overlay">
                        <div className="flex items-center gap-4">
                            <span className="w-2 h-2 rounded-full bg-red-500/60 animate-sentinel"></span>
                            <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">Anti-Money Laundering (AML) Protocol</h3>
                        </div>
                        <span className="text-[9px] font-mono text-cyan opacity-60 border border-cyan/20 bg-cyan/5 px-3 py-1 rounded-sm uppercase tracking-widest">
                            REGULATORY: BSA · FinCEN · FATF
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-x divide-border-main/40">
                        {[
                            {
                                id: 'POL-AML-001',
                                title: 'High Velocity Withdrawals',
                                desc: 'Detects structuring behavior: multiple withdrawals designed to evade reporting thresholds.',
                                intent: 'Prevent regulatory violations under BSA $10,000 CTR requirements. Structuring is a federal crime (31 USC § 5324).',
                                threshold: 'FLOW_RATE > 3 txns/hr AND AMT > 2.5σ',
                                affected: activeScenarios.filter(s => s.risk === 'High').length,
                                lastTriggered: '2h ago',
                                sim: 'withdrawal'
                            },
                            {
                                id: 'POL-AML-002',
                                title: 'Rapid Geo-Location Meta-Shift',
                                desc: 'Identifies impossible travel patterns suggesting credential compromise or proxy usage.',
                                intent: 'Flag account takeover attempts. Protects customer assets and limits platform liability under negligence claims.',
                                threshold: 'GEO_DIST > 500km AND TIME < 2h',
                                affected: activeScenarios.filter(s => s.data?.geo_switches > 0).length,
                                lastTriggered: '45m ago',
                                sim: 'geo'
                            }
                        ].map((policy) => (
                            <div key={policy.id} className="p-8 hover:bg-panel-bg transition-all group">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h4 className="text-[13px] font-bold text-text-primary mb-1 uppercase tracking-wider group-hover:text-gold transition-colors">{policy.title}</h4>
                                        <span className="text-[9px] text-cyan font-mono opacity-60 tracking-widest">{policy.id}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse"></div>
                                        <span className="text-[9px] text-emerald font-bold uppercase tracking-widest opacity-80">Enforced</span>
                                    </div>
                                </div>
                                <p className="text-[11px] text-text-secondary/60 leading-relaxed mb-6 font-mono border-l border-border-main/60 pl-4 italic">
                                    "{policy.desc}"
                                </p>
                                <div className="bg-background/40 p-4 rounded-sm border border-border-main/40 mb-6 technical-border">
                                    <p className="text-[8px] text-text-secondary opacity-40 uppercase tracking-[0.2em] mb-2 font-bold font-mono">Business Intent Protocol</p>
                                    <p className="text-[10px] text-text-secondary leading-relaxed opacity-80">
                                        {policy.intent}
                                    </p>
                                </div>
                                <div className="flex justify-between items-end mb-6">
                                    <div className="space-y-2">
                                        <p className="text-[8px] text-text-secondary opacity-40 uppercase tracking-[0.2em] font-bold font-mono">Deterministic Threshold</p>
                                        <p className="text-[10px] text-gold font-mono tracking-tighter tabular-nums bg-gold/5 px-2 py-1 rounded-sm border border-gold/10 inline-block">{policy.threshold}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] text-text-secondary opacity-40 uppercase tracking-[0.2em] font-bold font-mono">Risk Intersection</p>
                                        <p className="text-[10px] text-text-primary font-mono tabular-nums">{policy.affected} CASES</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-6 border-t border-border-main/40 flex justify-between items-center">
                                    <span className="text-[8px] text-text-secondary opacity-30 font-mono tracking-widest">LAST INTERCEP: {policy.lastTriggered.toUpperCase()}</span>
                                    <button
                                        onClick={() => handleSimulation(policy.sim)}
                                        className="text-[9px] text-gold hover:text-text-primary font-bold uppercase tracking-[0.3em] flex items-center gap-2 group/btn transition-all outline-none"
                                    >
                                        <svg className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                                        Execute Simulation
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Info Footer */}
                <div className="bg-background/40 border border-border-main rounded-sm p-6 text-center panel-depth">
                    <p className="text-[9px] text-text-secondary opacity-40 uppercase tracking-[0.4em] leading-relaxed font-bold font-mono">
                        POL-SYNC-V.4.2 // MODIFICATION REQUIRES DUAL-KEY AUTHENTICATION [COMPLIANCE_OFFICER + RISK_COMMITTEE] // ALL VERSIONING HASH-CHAINED
                    </p>
                </div>
            </div>
        </div>
    );
}
    );
}
