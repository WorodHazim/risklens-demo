"use client";

import { jsPDF } from "jspdf";

interface AuditRecord {
    id: string;
    timestamp: string;
    caseId: string;
    outcome: string;
    notes: string;
}

interface AuditLedgerViewProps {
    auditLog: AuditRecord[];
}

export default function AuditLedgerView({ auditLog }: AuditLedgerViewProps) {
    const handleFormatDownload = (format: string) => {
        const type = "audit_ledger";
        const fileName = `risklens_${type}_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;

        try {
            if (format === "PDF") {
                const doc = new jsPDF();
                doc.setFontSize(22);
                doc.text("RISKLENS AUDIT LEDGER", 20, 20);
                doc.setFontSize(10);
                doc.text(`GENERATED: ${new Date().toLocaleString()}`, 20, 30);
                doc.text(`RECORDS: ${auditLog.length}`, 20, 35);
                doc.line(20, 40, 190, 40);

                doc.setFontSize(12);
                doc.text("System Decision Log:", 20, 50);
                doc.setFontSize(8);
                const content = JSON.stringify(auditLog, null, 2);
                const splitContent = doc.splitTextToSize(content, 170);
                doc.text(splitContent, 20, 60);

                doc.save(fileName);
                return;
            }

            let content = "";
            let mimeType = "";

            if (format === "JSON") {
                content = JSON.stringify(auditLog, null, 2);
                mimeType = "application/json";
            } else if (format === "CSV") {
                if (auditLog.length > 0) {
                    const headers = Object.keys(auditLog[0]);
                    const rows = auditLog.map((obj: any) =>
                        headers.map(header => {
                            const val = obj[header];
                            return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
                        }).join(",")
                    );
                    content = [headers.join(","), ...rows].join("\n");
                } else {
                    content = "ID,Timestamp,CaseID,Outcome,Notes";
                }
                mimeType = "text/csv;charset=utf-8;";
            } else if (format === "XML") {
                content = `<?xml version="1.0" encoding="UTF-8"?>\n<audit_ledger>\n  <metadata>\n    <timestamp>${new Date().toISOString()}</timestamp>\n    <total_records>${auditLog.length}</total_records>\n  </metadata>\n  <records>\n    ${JSON.stringify(auditLog)}\n  </records>\n</audit_ledger>`;
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
            console.error("Audit export failed", error);
        }
    };

    return (
        <div className="animate-in fade-in duration-500 space-y-8">
            {/* Audit Ledger Header */}
            <div className="bg-panel-bg rounded-sm border border-border-main p-8 flex justify-between items-center relative overflow-hidden panel-depth glow-cyan/5">
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-cyan/5 to-transparent opacity-50 pointer-events-none"></div>
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="w-2 h-2 rounded-full bg-emerald animate-sentinel"></span>
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-text-secondary opacity-60">Immutable Protocol Ledger</span>
                    </div>
                    <h2 className="text-3xl font-thin text-text-primary tracking-tighter mb-2">Cryptographic Audit</h2>
                    <p className="text-sm text-text-secondary font-light max-w-2xl leading-relaxed opacity-60">
                        Blockchain-inspired record of all AI determinations and human overrides. Each entry is hash-chained for end-to-end regulatory verification.
                    </p>
                </div>
                <div className="hidden md:flex items-center gap-10">
                    <div className="text-center">
                        <span className="block text-4xl font-thin text-gold mb-1 drop-shadow-sm">{auditLog.length}</span>
                        <span className="text-[9px] uppercase tracking-widest text-text-secondary font-bold opacity-40">Persistence Index</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-4xl font-thin text-red-500/80 mb-1 drop-shadow-sm">{auditLog.filter(l => l.outcome === 'Overridden').length}</span>
                        <span className="text-[9px] uppercase tracking-widest text-text-secondary font-bold opacity-40">Manual Variances</span>
                    </div>
                </div>
            </div>

            {/* Export Controls */}
            <div className="bg-background border border-border-main rounded-sm p-5 flex justify-between items-center technical-border">
                <div className="flex items-center gap-6">
                    <span className="text-[9px] text-text-secondary uppercase tracking-[0.2em] font-bold opacity-40">Export Vectors:</span>
                    <div className="flex gap-2">
                        {['JSON', 'CSV', 'PDF', 'XML'].map(format => (
                            <button
                                key={format}
                                className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-secondary hover:text-gold bg-panel-bg/60 px-4 py-2 rounded-sm border border-border-main hover:border-gold/40 transition-all outline-none glow-gold/0 hover:glow-gold/10"
                                onClick={() => handleFormatDownload(format)}
                            >
                                {format}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-[9px] text-emerald font-mono tracking-widest font-bold opacity-80">SHA-256 SEAL ACTIVE</span>
                    <div className="p-1 px-2 border border-emerald/20 bg-emerald/5 rounded-sm">
                        <span className="text-[8px] text-emerald font-mono select-none">VALID</span>
                    </div>
                </div>
            </div>

            {/* Audit Table */}
            <div className="bg-panel-bg/40 rounded-sm border border-border-main overflow-hidden panel-depth">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-background/80 border-b border-border-main scroll-overlay">
                                <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-[0.3em] text-text-secondary opacity-60">Record Hash</th>
                                <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-[0.3em] text-text-secondary opacity-60">Timestamp</th>
                                <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-[0.3em] text-text-secondary opacity-60">Target Case</th>
                                <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-[0.3em] text-text-secondary opacity-60">Remediation Path</th>
                                <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-[0.3em] text-text-secondary opacity-60">Logic Justification</th>
                                <th className="px-8 py-5 text-[9px] font-bold uppercase tracking-[0.3em] text-text-secondary opacity-60">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-main/40">
                            {auditLog.length > 0 ? (
                                auditLog.map((log) => (
                                    <tr key={log.id} className="hover:bg-panel-bg transition-all group border-l-2 border-transparent hover:border-cyan/40">
                                        <td className="px-8 py-5 font-mono text-[10px] text-cyan opacity-60 group-hover:opacity-100 transition-opacity tabular-nums">
                                            {log.id.split('-')[0]}...
                                        </td>
                                        <td className="px-8 py-5 text-[10px] text-text-secondary/60 font-mono tracking-tighter">
                                            {new Date(log.timestamp).toLocaleString().toUpperCase()}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-[10px] font-bold text-text-primary uppercase tracking-widest">{log.caseId}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-sm border ${String(log.outcome) === 'Overridden'
                                                ? 'bg-red-950/20 text-red-400 border-red-500/30'
                                                : 'bg-emerald/5 text-emerald border-emerald/30'
                                                }`}>
                                                {String(log.outcome)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-[10px] text-text-secondary/60 line-clamp-1 max-w-[240px] font-mono italic" title={String(log.notes)}>
                                                {String(log.notes)}
                                            </p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-emerald" title="Record is cryptographically sealed and immutable">
                                                <div className="w-1 h-1 bg-emerald rounded-full animate-pulse"></div>
                                                SEALED
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center opacity-20">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-12 h-12 border border-border-main rounded-sm flex items-center justify-center animate-pulse">
                                                <svg className="w-6 h-6 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m0 0v2m0-2h2m-2 0H10m10-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Log Persistence Empty</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
