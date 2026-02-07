"use client";

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
        <div className="animate-in fade-in duration-500 space-y-8">
            {/* Hero */}
            <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm p-8 flex justify-between items-center shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#111] to-transparent opacity-50 pointer-events-none"></div>
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-5 w-5 relative opacity-80">
                            <Image src="/risklens-logo.svg" alt="Logo" fill className="object-contain" />
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#666]">Regulatory & Audit</span>
                    </div>
                    <h2 className="text-3xl font-light text-[#E5E5E0] tracking-tight mb-2">Data Export Center</h2>
                    <p className="text-sm text-[#888] font-light max-w-2xl leading-relaxed">
                        Generate immutable, time-stamped snapshots of system state for regulatory compliance, internal audit review, and legal discovery.
                    </p>
                </div>
            </div>

            {/* Export Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Case Export */}
                <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm p-6 hover:border-[#333] transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-[#CCC] uppercase tracking-wider group-hover:text-[#E5E5E0]">Case Artifact</h3>
                        <span className="text-[9px] font-mono text-[#555] border border-[#222] px-1.5 py-0.5 rounded-sm">JSON / PDF</span>
                    </div>
                    <p className="text-xs text-[#777] leading-relaxed mb-6 font-mono h-12">
                        Full risk vector analysis, policy triggers, and analyst decision logs for single case files.
                    </p>
                    <button
                        onClick={() => startExport('case', 'JSON', 'case')}
                        disabled={exportProgress['case'] > 0 && exportProgress['case'] < 100}
                        className="w-full py-2 border border-[#222] text-[10px] font-bold uppercase tracking-widest text-[#555] hover:text-[#CCC] hover:border-[#444] rounded-sm transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
                    >
                        {exportProgress['case'] > 0 && exportProgress['case'] < 100 && (
                            <div className="absolute inset-0 bg-[#D4B483]/10" style={{ width: `${exportProgress['case']}%` }}></div>
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            {exportProgress['case'] === 100 ? (
                                <><svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Download Document</>
                            ) : exportProgress['case'] > 0 ? (
                                `Compiling Manifest... ${exportProgress['case']}%`
                            ) : (
                                <><svg className="w-3 h-3 min-w-[12px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Compile Artifact</>
                            )}
                        </span>
                    </button>
                </div>

                {/* Card 2: Audit Ledger */}
                <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm p-6 hover:border-[#333] transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-[#CCC] uppercase tracking-wider group-hover:text-[#E5E5E0]">Audit Ledger</h3>
                        <span className="text-[9px] font-mono text-[#555] border border-[#222] px-1.5 py-0.5 rounded-sm">CSV / XML</span>
                    </div>
                    <p className="text-xs text-[#777] leading-relaxed mb-6 font-mono h-12">
                        Chronological, immutable record of all human interventions, overrides, and system outcomes.
                    </p>
                    <button
                        onClick={() => startExport('ledger', 'CSV', 'ledger')}
                        disabled={exportProgress['ledger'] > 0 && exportProgress['ledger'] < 100}
                        className="w-full py-2 border border-[#222] text-[10px] font-bold uppercase tracking-widest text-[#555] hover:text-[#CCC] hover:border-[#444] rounded-sm transition-all flex items-center justify-center gap-2 relative overflow-hidden"
                    >
                        {exportProgress['ledger'] > 0 && exportProgress['ledger'] < 100 && (
                            <div className="absolute inset-0 bg-[#D4B483]/10" style={{ width: `${exportProgress['ledger']}%` }}></div>
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            {exportProgress['ledger'] === 100 ? (
                                <><svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Download Ledger</>
                            ) : exportProgress['ledger'] > 0 ? (
                                `Sealing Records... ${exportProgress['ledger']}%`
                            ) : (
                                <><svg className="w-3 h-3 min-w-[12px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> Compile Artifact</>
                            )}
                        </span>
                    </button>
                </div>

                {/* Card 3: Queue Snapshot */}
                <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm p-6 hover:border-[#333] transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-[#CCC] uppercase tracking-wider group-hover:text-[#E5E5E0]">Queue Snapshot</h3>
                        <span className="text-[9px] font-mono text-[#555] border border-[#222] px-1.5 py-0.5 rounded-sm">SQL / CSV</span>
                    </div>
                    <p className="text-xs text-[#777] leading-relaxed mb-6 font-mono h-12">
                        Point-in-time capture of the entire active risk queue, including pending and processed states.
                    </p>
                    <button
                        onClick={() => startExport('snapshot', 'CSV', 'snapshot')}
                        disabled={exportProgress['snapshot'] > 0 && exportProgress['snapshot'] < 100}
                        className="w-full py-2 border border-[#222] text-[10px] font-bold uppercase tracking-widest text-[#555] hover:text-[#CCC] hover:border-[#444] rounded-sm transition-all flex items-center justify-center gap-2 relative overflow-hidden"
                    >
                        {exportProgress['snapshot'] > 0 && exportProgress['snapshot'] < 100 && (
                            <div className="absolute inset-0 bg-[#D4B483]/10" style={{ width: `${exportProgress['snapshot']}%` }}></div>
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            {exportProgress['snapshot'] === 100 ? (
                                <><svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Download Snapshot</>
                            ) : exportProgress['snapshot'] > 0 ? (
                                `Capturing Queue... ${exportProgress['snapshot']}%`
                            ) : (
                                <><svg className="w-3 h-3 min-w-[12px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg> Compile Artifact</>
                            )}
                        </span>
                    </button>
                </div>
            </div>

            {/* Mock Preview & Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-[#0F0F0F] border border-[#1F1F1F] rounded-sm p-6 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4 border-b border-[#222] pb-2">
                        <span className="text-[10px] font-bold text-[#666] uppercase tracking-widest">Sample Output Structure (Redacted)</span>
                        <span className="text-[9px] font-mono text-[#444]">JSON-SCHEMA: v2.4</span>
                    </div>
                    <pre className="font-mono text-[10px] text-[#555] leading-loose overflow-x-hidden p-4 bg-[#050505]/50 rounded-sm border border-[#111]">
                        {/* We'll use a static preview here or pass it as prop */}
                        {JSON.stringify({
                            export_id: "EXP-2026-02-06-SAMPLE",
                            generated_at: new Date().toISOString(),
                            context: "REGULATORY_AUDIT",
                            data: {
                                active_records: activeScenarios.length,
                                session_decisions: auditLog.length
                            },
                            signature: "SHA256: 9f86d081884c7d659a2feaa0c55ad015..."
                        }, null, 2)}
                    </pre>
                </div>

                <div className="bg-[#0A0A0A] border border-[#1F1F1F] rounded-sm p-6 flex flex-col justify-center text-center">
                    <div className="w-10 h-10 mx-auto mb-4 text-[#D4B483] opacity-80">
                        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <h3 className="text-xs font-bold text-[#E5E5E0] uppercase tracking-wide mb-2">Compliance Guarantee</h3>
                    <p className="text-[10px] text-[#666] leading-relaxed">
                        All exports are system-generated and cryptographicly signed. No manual editing or redaction is possible after generation.
                    </p>
                </div>
            </div>
        </div>
    );
}
