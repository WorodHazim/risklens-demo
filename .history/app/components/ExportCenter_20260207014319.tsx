"use client";

import { useState } from "react";
import Image from "next/image";
import { jsPDF } from "jspdf";

interface ExportCenterProps {
    activeScenarios: any[];
    auditLog: any[];
}

export default function ExportCenter({ activeScenarios, auditLog }: ExportCenterProps) {
    const [exportProgress, setExportProgress] = useState<{ [key: string]: number }>({
        case: 0,
        ledger: 0,
        snapshot: 0
    });

    const handleDownload = (type: string, format: string, data: any) => {
        const fileName = `risklens_${type}_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;

        try {
            if (format === "PDF") {
                const doc = new jsPDF();
                doc.setFontSize(22);
                doc.text("RISKLENS INTELLIGENCE", 20, 20);
                doc.setFontSize(10);
                doc.text(`EXPORT TYPE: ${type.toUpperCase()}`, 20, 30);
                doc.text(`GENERATED: ${new Date().toLocaleString()}`, 20, 35);
                doc.text(`DOCID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 20, 40);
                doc.line(20, 45, 190, 45);

                doc.setFontSize(12);
                doc.text("Export Data Content:", 20, 55);
                doc.setFontSize(8);
                const content = JSON.stringify(data, null, 2);
                const splitContent = doc.splitTextToSize(content, 170);
                doc.text(splitContent, 20, 65);

                doc.save(fileName);
                return;
            }

            let content = "";
            let mimeType = "";

            if (format === "JSON") {
                content = JSON.stringify(data, null, 2);
                mimeType = "application/json";
            } else if (format === "CSV") {
                const list = Array.isArray(data) ? data : [data];
                if (list.length > 0) {
                    const headers = Object.keys(list[0]);
                    const rows = list.map((obj: any) =>
                        headers.map(header => {
                            const val = obj[header];
                            return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
                        }).join(",")
                    );
                    content = [headers.join(","), ...rows].join("\n");
                }
                mimeType = "text/csv;charset=utf-8;";
            } else if (format === "XML") {
                content = `<?xml version="1.0" encoding="UTF-8"?>\n<risklens_export>\n  <metadata>\n    <type>${type}</type>\n    <timestamp>${new Date().toISOString()}</timestamp>\n  </metadata>\n  <data>\n    ${JSON.stringify(data)}\n  </data>\n</risklens_export>`;
                mimeType = "application/xml";
            }

            const blob = new Blob([content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed", error);
        }
    };

    const startExport = (key: string, format: string, type: string) => {
        setExportProgress(prev => ({ ...prev, [key]: 1 }));

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 25;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);

                let exportData = {};
                if (type === "case") exportData = activeScenarios[0] || { status: "No active cases" };
                if (type === "ledger") exportData = auditLog;
                if (type === "snapshot") exportData = activeScenarios;

                handleDownload(type, format, exportData);
                setExportProgress(prev => ({ ...prev, [key]: 100 }));

                setTimeout(() => {
                    setExportProgress(prev => ({ ...prev, [key]: 0 }));
                }, 4000);
            } else {
                setExportProgress(prev => ({ ...prev, [key]: Math.floor(progress) }));
            }
        }, 300);
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-10">
            {/* Hero */}
            <div className="bg-panel-bg rounded-sm border border-border-main p-8 flex justify-between items-center relative overflow-hidden panel-depth glow-cyan/5">
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-cyan/5 to-transparent opacity-50 pointer-events-none"></div>
                <div>
                    <div className="flex items-center gap-3 mb-3 font-bold opacity-60">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-cyan">Intelligence Dissemination</span>
                    </div>
                    <h2 className="text-3xl font-thin text-text-primary tracking-tighter mb-4">Export Protocol Hub</h2>
                    <p className="text-sm text-text-secondary font-light max-w-2xl leading-relaxed opacity-60">
                        Multi-format dissemination of system state, decision logs, and risk vectors. All outbound data flows are cryptographically signed and tracked via RL-EXP-CENTRAL.
                    </p>
                </div>
                <div className="hidden lg:block">
                    <div className="p-4 border border-border-main bg-background/40 technical-border">
                        <div className="flex items-center gap-4 text-[9px] font-mono text-gold opacity-60 font-bold uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 bg-gold rounded-full animate-sentinel"></span>
                            DISCOVERY-MODE: ACTIVE
                        </div>
                    </div>
                </div>
            </div>

            {/* Export Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { key: 'case', label: 'Case Artifact', formats: 'JSON / PDF', type: 'case', desc: 'Full risk vector analysis, including neural weights and attribution logs.' },
                    { key: 'ledger', label: 'Persistence Ledger', formats: 'CSV / XML', type: 'ledger', desc: 'Immutable chronological record of human interventions and system determinism.' },
                    { key: 'snapshot', label: 'Network Snapshot', formats: 'SQL / CSV', type: 'snapshot', desc: 'Point-in-time capture of the entire active risk infrastructure queue.' }
                ].map((item) => (
                    <div key={item.key} className="bg-panel-bg rounded-sm border border-border-main p-8 hover:border-gold/30 transition-all group panel-depth flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-[10px] font-bold text-text-primary uppercase tracking-[0.2em] group-hover:text-gold transition-colors">{item.label}</h3>
                                <span className="text-[9px] font-mono text-text-secondary opacity-40 border border-border-main px-2 py-0.5 rounded-sm tabular-nums">{item.formats}</span>
                            </div>
                            <p className="text-[11px] text-text-secondary/60 leading-relaxed mb-10 font-light italic">
                                "{item.desc}"
                            </p>
                        </div>
                        <button
                            onClick={() => startExport(item.key, item.key === 'case' ? 'JSON' : 'CSV', item.type)}
                            disabled={exportProgress[item.key] > 0 && exportProgress[item.key] < 100}
                            className={`w-full py-4 border border-border-main text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 relative overflow-hidden group/btn ${exportProgress[item.key] === 100 ? 'bg-emerald/10 text-emerald border-emerald/40' : 'text-text-secondary/60 hover:text-gold hover:border-gold/40 bg-background/40'}`}
                        >
                            {exportProgress[item.key] > 0 && exportProgress[item.key] < 100 && (
                                <div className="absolute inset-0 bg-gold/5 border-r border-gold/40 animate-pulse" style={{ width: `${exportProgress[item.key]}%` }}></div>
                            )}
                            <span className="relative z-10 flex items-center gap-3">
                                {exportProgress[item.key] === 100 ? (
                                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> LOGISTIC SEALED</>
                                ) : exportProgress[item.key] > 0 ? (
                                    `SYNCHING... ${exportProgress[item.key]}%`
                                ) : (
                                    <><svg className="w-3.5 h-3.5 opacity-60 group-hover/btn:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> COMPILE BUNDLE</>
                                )}
                            </span>
                        </button>
                    </div>
                ))}
            </div>

            {/* Mock Preview & Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-background border border-border-main rounded-sm p-8 relative overflow-hidden technical-border">
                    <div className="flex justify-between items-center mb-6 border-b border-border-main/50 pb-4 scan-overlay">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] opacity-40">Schema Output Projection</span>
                        <div className="flex items-center gap-6">
                            <span className="text-[9px] font-mono text-cyan opacity-60">ENCRYPTION: AES-256</span>
                            <span className="text-[9px] font-mono text-text-secondary opacity-20">v.4.2.0</span>
                        </div>
                    </div>
                    <pre className="font-mono text-[10px] text-text-primary/40 leading-loose overflow-x-hidden p-6 bg-panel-bg/20 rounded-sm border border-border-main/20 selection:bg-gold/20 selection:text-gold">
                        {JSON.stringify({
                            export_id: "RL-EXP-SYNC-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
                            generated_at: new Date().toISOString(),
                            protocol: "REGULATORY_DISCOVERY_V4",
                            payload: {
                                records_compiled: activeScenarios.length,
                                integrity_hashes: auditLog.length > 0 ? "SEALED" : "PENDING"
                            },
                            seal: "SIGNATURE_RL_SECURE_" + Math.random().toString(36).substr(2, 32).toUpperCase()
                        }, null, 2)}
                    </pre>
                </div>

                <div className="bg-panel-bg rounded-sm border border-border-main p-10 flex flex-col justify-center text-center panel-depth glow-gold/5">
                    <div className="w-14 h-14 mx-auto mb-6 text-gold opacity-80 border border-gold/20 flex items-center justify-center technical-border bg-background shadow-2xl glow-gold/5">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <h3 className="text-[11px] font-bold text-text-primary uppercase tracking-[0.2em] mb-4">Enterprise Compliance</h3>
                    <p className="text-[10px] text-text-secondary leading-relaxed font-light opacity-60 italic">
                        "All export vectors are system-generated and immutable. No manual intervention or modification is possible post-synchronization per SOC2 protocol."
                    </p>
                </div>
            </div>
        </div>
    );
}
    );
}
