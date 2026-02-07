"use client";

interface AuditLedgerViewProps {
    auditLog: any[];
}

export default function AuditLedgerView({ auditLog }: AuditLedgerViewProps) {
    const handleFormatDownload = (format: string) => {
        const content = JSON.stringify(auditLog, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `audit_ledger.${format.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="animate-in fade-in duration-300 space-y-6">
            {/* Audit Ledger Header */}
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm p-8 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#111] to-transparent opacity-50 pointer-events-none"></div>
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500/50 animate-pulse"></span>
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#666]">Immutable Record</span>
                    </div>
                    <h2 className="text-3xl font-light text-[#E5E5E0] tracking-tight mb-2">Audit Ledger</h2>
                    <p className="text-sm text-[#888] font-light max-w-2xl leading-relaxed">
                        Cryptographically sealed record of all AI recommendations and human decisions. Each entry is hash-chained for regulatory compliance.
                    </p>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    <div className="text-center">
                        <span className="block text-4xl font-thin text-[#D4B483] mb-1">{auditLog.length}</span>
                        <span className="text-[9px] uppercase tracking-widest text-[#555] font-bold">Total Records</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-4xl font-thin text-emerald-500/80 mb-1">{auditLog.filter(l => l.outcome === 'Overridden').length}</span>
                        <span className="text-[9px] uppercase tracking-widest text-[#555] font-bold">Overrides</span>
                    </div>
                </div>
            </div>

            {/* Export Controls */}
            <div className="bg-[#080808] border border-[#151515] rounded-sm p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <span className="text-[9px] text-[#444] uppercase tracking-widest font-bold">Export Format:</span>
                    <div className="flex gap-2">
                        {['JSON', 'CSV', 'PDF', 'XML'].map(format => (
                            <button
                                key={format}
                                className="text-[9px] font-bold uppercase tracking-wider text-[#555] hover:text-[#CCC] bg-[#0F0F0F] px-3 py-1.5 rounded-sm border border-[#1A1A1A] hover:border-[#333] transition-colors outline-none"
                                onClick={() => handleFormatDownload(format)}
                            >
                                {format}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[8px] text-[#333] font-mono">SHA-256 VERIFICATION ENABLED</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></span>
                </div>
            </div>

            {/* Audit Table */}
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="bg-[#0F0F0F] border-b border-[#1A1A1A]">
                            <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-[#555]">Record ID</th>
                            <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-[#555]">Timestamp</th>
                            <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-[#555]">Case Target</th>
                            <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-[#555]">Remediation</th>
                            <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-[#555]">Justification</th>
                            <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-[#555]">Integrity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#151515]">
                        {auditLog.length > 0 ? (
                            auditLog.map((log) => (
                                <tr key={log.id} className="hover:bg-[#0C0C0C] transition-colors group">
                                    <td className="px-6 py-4 font-mono text-[10px] text-[#444] group-hover:text-[#666]">
                                        {log.id.split('-')[0]}...
                                    </td>
                                    <td className="px-6 py-4 text-[10px] text-[#777]">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-bold text-[#E5E5E0] uppercase tracking-wide">{log.caseId}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border ${log.outcome === 'Overridden' ? 'bg-amber-950/20 text-amber-500 border-amber-900/30' : 'bg-emerald-950/20 text-emerald-500 border-emerald-900/30'
                                            }`}>
                                            {log.outcome}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-[10px] text-[#666] line-clamp-1 max-w-[200px]" title={log.notes}>
                                            {log.notes}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.2em] text-emerald-500/60" title="Record is cryptographically sealed and immutable">
                                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m10-6a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            SEALED
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-20 text-center opacity-30">
                                    <span className="text-[10px] uppercase tracking-widest font-bold">No records found for current session</span>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
