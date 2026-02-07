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
        <nav className="bg-[#0A0A0A]/90 backdrop-blur-xl px-8 py-3.5 border-b border-[#1F1F1F] sticky top-0 z-50 overflow-visible">
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
                            <h1 className="text-sm font-bold tracking-tight text-[#EFEDE5] leading-none mb-0.5 group-hover:text-[#D4B483] transition-colors">RiskLens</h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-[#555] font-semibold tracking-[0.2em] uppercase">Intelligence</span>
                                <span className="px-1.5 py-0.5 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center gap-1.5">
                                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span className="text-[8px] font-bold text-[#888] uppercase tracking-wider">AI Live</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center space-x-1">
                        <button
                            onClick={() => setCurrentView("dashboard")}
                            className={`px-5 py-2 text-[10px] uppercase tracking-[0.15em] font-bold transition-all border-b-[2px] relative ${currentView === "dashboard" ? "text-[#E5E5E0] border-[#D4B483]" : "text-[#555] hover:text-[#999] border-transparent hover:border-[#222]"}`}
                        >
                            Dashboard
                            {currentView === "dashboard" && <span className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-[#D4B483] shadow-[0_0_8px_rgba(212,180,131,0.4)] animate-in fade-in duration-300"></span>}
                        </button>
                        <button
                            onClick={() => setCurrentView("policies")}
                            className={`px-5 py-2 text-[10px] uppercase tracking-[0.15em] font-bold transition-all border-b-[2px] relative ${currentView === "policies" ? "text-[#E5E5E0] border-[#D4B483]" : "text-[#555] hover:text-[#999] border-transparent hover:border-[#222]"}`}
                        >
                            Policies
                            {currentView === "policies" && <span className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-[#D4B483] shadow-[0_0_8px_rgba(212,180,131,0.4)] animate-in fade-in duration-300"></span>}
                        </button>
                        <button
                            onClick={() => setCurrentView("audit")}
                            className={`px-5 py-2 text-[10px] uppercase tracking-[0.15em] font-bold transition-all border-b-[2px] relative ${currentView === "audit" ? "text-[#E5E5E0] border-[#D4B483]" : "text-[#555] hover:text-[#999] border-transparent hover:border-[#222]"}`}
                        >
                            Audit Ledger
                            {currentView === "audit" && <span className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-[#D4B483] shadow-[0_0_8px_rgba(212,180,131,0.4)] animate-in fade-in duration-300"></span>}
                        </button>
                    </div>
                </div>

                {/* ZONE 2: System State (Persistent Metrics) */}
                <div className="hidden lg:flex items-center gap-6 px-6 border-l border-r border-[#1F1F1F]">
                    <div
                        className={`flex items-center gap-2 cursor-pointer py-1.5 px-3 rounded-sm transition-all relative ${activeFilter === 'Active' ? 'bg-[#D4B483]/5 border border-[#D4B483]/30' : 'hover:bg-[#111] border border-transparent'}`}
                        onClick={() => setActiveFilter(activeFilter === 'Active' ? 'All' : 'Active')}
                    >
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${activeFilter === 'Active' ? 'text-[#D4B483]' : 'text-[#555]'}`}>Active</span>
                        <span className={`text-sm font-bold font-mono ${activeFilter === 'Active' ? 'text-[#D4B483]' : 'text-[#E5E5E0]'}`}>{activeScenariosCount}</span>
                        {activeFilter === 'Active' && <span className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-[#D4B483] shadow-[0_0_8px_rgba(212,180,131,0.5)]"></span>}
                    </div>
                    <div
                        className={`flex items-center gap-2 cursor-pointer py-1.5 px-3 rounded-sm transition-all relative ${activeFilter === 'Urgent' ? 'bg-red-950/20 border border-red-900/30' : 'hover:bg-[#111] border border-transparent'}`}
                        onClick={() => setActiveFilter(activeFilter === 'Urgent' ? 'All' : 'Urgent')}
                    >
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${activeFilter === 'Urgent' ? 'text-red-400' : 'text-[#555]'}`}>Urgent</span>
                        <span className={`text-sm font-bold font-mono ${activeFilter === 'Urgent' ? 'text-red-400' : urgentScenariosCount > 0 ? 'text-red-400/80' : 'text-[#666]'}`}>
                            {urgentScenariosCount}
                        </span>
                        {activeFilter === 'Urgent' && <span className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>}
                    </div>
                    <div
                        className={`flex items-center gap-2 cursor-pointer py-1.5 px-3 rounded-sm transition-all relative ${activeFilter === 'Resolved' ? 'bg-emerald-950/20 border border-emerald-900/30' : 'hover:bg-[#111] border border-transparent'}`}
                        onClick={() => setActiveFilter(activeFilter === 'Resolved' ? 'All' : 'Resolved')}
                    >
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${activeFilter === 'Resolved' ? 'text-emerald-400' : 'text-[#555]'}`}>Resolved</span>
                        <span className={`text-sm font-bold font-mono ${activeFilter === 'Resolved' ? 'text-emerald-500' : 'text-emerald-500/80'}`}>{resolvedScenariosCount}</span>
                        {activeFilter === 'Resolved' && <span className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>}
                    </div>
                </div>

                {/* ZONE 3: User Actions */}
                <div className="flex items-center gap-10">
                    <button
                        onClick={() => setCurrentView("exports")}
                        className={`text-[9px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2.5 group px-3 py-1.5 rounded-sm border ${currentView === 'exports' ? 'bg-[#1A1A1A] border-[#D4B483] text-[#D4B483]' : 'bg-[#0F0F0F] hover:bg-[#141414] border-[#222] text-[#666] hover:text-[#D4B483]'}`}
                    >
                        <svg className={`w-3 h-3 transition-opacity ${currentView === 'exports' ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export
                    </button>
                    <div className="flex items-center gap-3.5 pl-6 border-l border-[#1F1F1F]">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-bold text-[#CCC] uppercase tracking-wider">Alex Chen</p>
                            <p className="text-[9px] text-[#D4B483] uppercase tracking-widest font-mono">{userRole.toUpperCase()}</p>
                        </div>
                        <div className="relative" id="user-profile-dropdown">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="h-8 w-8 rounded-sm bg-[#111] border border-[#262626] flex items-center justify-center text-[10px] font-bold text-[#D4B483] hover:border-[#D4B483]/50 transition-colors cursor-pointer"
                            >
                                AC
                            </button>
                            {isProfileOpen && (
                                <div className="absolute right-0 top-11 w-52 bg-[#0F0F0F] border border-[#222] rounded-sm shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 py-1">
                                    <div className="px-4 py-3 border-b border-[#222] bg-[#0A0A0A]">
                                        <p className="text-[9px] text-[#555] uppercase tracking-widest font-bold mb-1">Session Context</p>
                                        <p className="text-[10px] text-[#D4B483] font-mono">RL-8829-QX-P4</p>
                                    </div>
                                    <div className="p-1">
                                        <button
                                            onClick={() => setUserRole(userRole === "Senior Analyst" ? "Compliance Manager" : "Senior Analyst")}
                                            className="w-full text-left px-3 py-2 text-[10px] text-[#AAA] hover:text-[#D4B483] hover:bg-[#161616] transition-colors rounded-sm flex items-center gap-2"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                            Switch Role
                                        </button>
                                        <button className="w-full text-left px-3 py-2 text-[10px] text-[#AAA] hover:text-red-400 hover:bg-[#161616] transition-colors rounded-sm flex items-center gap-2">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                            Logout
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
