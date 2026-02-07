"use client";

import Image from "next/image";

interface HeaderProps {
    currentView: string;
    setCurrentView: (view: "dashboard" | "policies" | "audit" | "exports") => void;
    activeFilter: string;
    setActiveFilter: (filter: "All" | "Urgent" | "Active" | "Resolved") => void;
    activeScenariosCount: number;
    urgentScenariosCount: number;
    resolvedScenariosCount: number;
    userRole: string;
    setUserRole: (role: "Senior Analyst" | "Compliance Manager") => void;
    isProfileOpen: boolean;
    setIsProfileOpen: (isOpen: boolean) => void;
}

export default function Header({
    currentView,
    setCurrentView,
    activeFilter,
    setActiveFilter,
    activeScenariosCount,
    urgentScenariosCount,
    resolvedScenariosCount,
    userRole,
    setUserRole,
    isProfileOpen,
    setIsProfileOpen
}: HeaderProps) {
    return (
        <nav className="bg-panel-bg/95 backdrop-blur-xl px-8 py-3.5 border-b border-border-main sticky top-0 z-50 overflow-visible scan-overlay">
            <div className="max-w-[1500px] mx-auto flex items-center justify-between">

                {/* ZONE 1: Brand + Navigation */}
                <div className="flex items-center gap-14">
                    <div
                        className="flex items-center gap-3.5 opacity-90 hover:opacity-100 transition-opacity cursor-pointer group"
                        onClick={() => setCurrentView("dashboard")}
                    >
                        <div className="h-6 w-6 relative">
                            <Image
                                src="/risklens-logo.svg"
                                alt="RiskLens Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <div className="flex flex-col justify-center">
                            <h1 className="text-sm font-bold tracking-tight text-text-primary leading-none mb-0.5 group-hover:text-gold transition-colors">RiskLens</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-text-secondary font-semibold tracking-[0.2em] uppercase">Intelligence</span>
                                <span className="px-1.5 py-0.5 rounded-full bg-background border border-border-main flex items-center gap-1.5 group-hover:border-cyan/30 transition-colors">
                                    <span className="w-1 h-1 rounded-full bg-cyan animate-pulse"></span>
                                    <span className="text-[8px] font-bold text-text-secondary uppercase tracking-wider">Sentinel active</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center space-x-1">
                        {[
                            { id: 'dashboard', label: 'Dashboard' },
                            { id: 'policies', label: 'Policies' },
                            { id: 'audit', label: 'Audit Ledger' }
                        ].map((view) => (
                            <button
                                key={view.id}
                                onClick={() => setCurrentView(view.id as any)}
                                className={`px-5 py-2 text-[10px] uppercase tracking-[0.15em] font-bold transition-all border-b-[2px] relative ${currentView === view.id ? "text-text-primary border-cyan" : "text-text-secondary hover:text-text-primary border-transparent hover:border-border-main"}`}
                            >
                                {view.label}
                                {currentView === view.id && <span className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-cyan shadow-[0_0_10px_rgba(0,229,255,0.4)] animate-in fade-in duration-300"></span>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ZONE 2: System State (Persistent Metrics) */}
                <div className="hidden lg:flex items-center gap-6 px-6 border-l border-r border-border-main">
                    <div
                        className={`flex items-center gap-2 cursor-pointer py-1.5 px-3 rounded-sm transition-all relative ${activeFilter === 'Active' ? 'bg-cyan/5 border border-cyan/30' : 'hover:bg-panel-bg/40 border border-transparent'}`}
                        onClick={() => setActiveFilter(activeFilter === 'Active' ? 'All' : 'Active')}
                    >
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${activeFilter === 'Active' ? 'text-cyan' : 'text-text-secondary'}`}>Active</span>
                        <span className={`text-sm font-bold font-mono ${activeFilter === 'Active' ? 'text-cyan' : 'text-text-primary'}`}>{activeScenariosCount}</span>
                        {activeFilter === 'Active' && <span className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-cyan shadow-[0_0_8px_rgba(0,229,255,0.5)]"></span>}
                    </div>
                    <div
                        className={`flex items-center gap-3 cursor-pointer py-1.5 px-3 rounded-sm transition-all relative ${activeFilter === 'Urgent' ? 'bg-gold/10 border border-gold/40' : 'hover:bg-panel-bg/40 border border-transparent'}`}
                        onClick={() => setActiveFilter(activeFilter === 'Urgent' ? 'All' : 'Urgent')}
                    >
                        <div className="flex flex-col items-start gap-0.5">
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${activeFilter === 'Urgent' ? 'text-gold' : 'text-text-secondary'}`}>Urgent</span>
                            <div className="flex items-center gap-1.5">
                                <span className={`text-sm font-bold font-mono ${activeFilter === 'Urgent' ? 'text-gold' : urgentScenariosCount > 0 ? 'text-gold/80' : 'text-text-secondary/60'}`}>
                                    {urgentScenariosCount}
                                </span>
                                {urgentScenariosCount > 0 && <span className="w-1 h-1 rounded-full bg-gold animate-pulse"></span>}
                            </div>
                        </div>
                        {activeFilter === 'Urgent' && <span className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-gold shadow-[0_0_8px_rgba(212,175,55,0.5)]"></span>}
                    </div>
                    <div
                        className={`flex items-center gap-2 cursor-pointer py-1.5 px-3 rounded-sm transition-all relative ${activeFilter === 'Resolved' ? 'bg-emerald/5 border border-emerald/30' : 'hover:bg-panel-bg/40 border border-transparent'}`}
                        onClick={() => setActiveFilter(activeFilter === 'Resolved' ? 'All' : 'Resolved')}
                    >
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${activeFilter === 'Resolved' ? 'text-emerald' : 'text-text-secondary'}`}>Resolved</span>
                        <span className={`text-sm font-bold font-mono ${activeFilter === 'Resolved' ? 'text-emerald' : 'text-emerald/80'}`}>{resolvedScenariosCount}</span>
                        {activeFilter === 'Resolved' && <span className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>}
                    </div>
                </div>

                {/* ZONE 3: User Actions */}
                <div className="flex items-center gap-10">
                    <button
                        onClick={() => setCurrentView("exports")}
                        className={`text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-2.5 group px-3 py-1.5 rounded-sm border ${currentView === 'exports' ? 'bg-panel-bg border-cyan text-cyan glow-cyan' : 'bg-background hover:bg-panel-bg border-border-main text-text-secondary hover:text-cyan'}`}
                    >
                        <svg className={`w-3 h-3 transition-opacity ${currentView === 'exports' ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export Central
                    </button>
                    <div className="flex items-center gap-3.5 pl-6 border-l border-border-main">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-bold text-text-primary uppercase tracking-wider">Alex Chen</p>
                            <p className="text-[9px] text-gold uppercase tracking-widest font-mono opacity-80">{userRole.toUpperCase()}</p>
                        </div>
                        <div className="relative" id="user-profile-dropdown">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="h-8 w-8 rounded-sm bg-background border border-border-main flex items-center justify-center text-[10px] font-bold text-gold hover:border-gold/50 transition-colors cursor-pointer glow-gold/10"
                            >
                                AC
                            </button>
                            {isProfileOpen && (
                                <div className="absolute right-0 top-11 w-52 bg-background border border-border-main rounded-sm shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 py-1 panel-depth">
                                    <div className="px-4 py-3 border-b border-border-main bg-panel-bg/40">
                                        <p className="text-[9px] text-text-secondary uppercase tracking-widest font-bold mb-1 opacity-60">Identity Vector</p>
                                        <p className="text-[10px] text-gold font-mono">ID: RL-8829-QX</p>
                                    </div>
                                    <div className="p-1">
                                        <button
                                            onClick={() => setUserRole(userRole === "Senior Analyst" ? "Compliance Manager" : "Senior Analyst")}
                                            className="w-full text-left px-3 py-2 text-[10px] text-text-secondary hover:text-cyan hover:bg-panel-bg/60 transition-colors rounded-sm flex items-center gap-2"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                            Rotate Privilege
                                        </button>
                                        <button className="w-full text-left px-3 py-2 text-[10px] text-text-secondary hover:text-red-400 hover:bg-panel-bg/60 transition-colors rounded-sm flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                            Terminate Session
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
