import React, { useState } from "react";
import { useChain } from "../context/ChainContext";
import { shortHash } from "../utils/formatters";
import {
  ShieldCheck,
  Activity,
  Layers,
  ArrowLeftRight,
  GitFork,
  FileCheck2,
  Building2,
  Wallet,
  RotateCcw,
  Sparkles,
  ChevronDown
} from "lucide-react";

export default function Navbar({ activeTab, setActiveTab }) {
  const {
    mode,
    setMode,
    activeAccount,
    setActiveAccount,
    currentActor,
    sandboxData,
    resetSandbox,
    connectWallet,
    walletAddress,
    isConnecting
  } = useChain();

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "samples", label: "Specimens", icon: Layers },
    { id: "custody", label: "Custody & Handoff", icon: ArrowLeftRight },
    { id: "lineage", label: "Aliquot Tree", icon: GitFork },
    { id: "compliance", label: "Compliance & Lab", icon: FileCheck2 },
    { id: "directory", label: "Network Directory", icon: Building2 },
  ];

  const handleRoleSelect = (addr) => {
    setActiveAccount(addr);
    setShowRoleDropdown(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#070a12]/80 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setActiveTab("dashboard")} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-emerald-400/30 transition-all">
              <ShieldCheck className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  TRACECHAIN
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  EVM Core
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Biological Provenance & Custody</p>
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1 ml-4 bg-slate-900/60 p-1 rounded-xl border border-white/5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-300 shadow-sm border border-cyan-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Mode Switcher & Active Identity */}
        <div className="flex items-center gap-3">
          
          {/* Mode Badge & Switcher */}
          <div className="flex items-center bg-slate-900/80 border border-white/10 rounded-xl p-1 text-xs">
            <button
              onClick={() => setMode("sandbox")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                mode === "sandbox"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Sandbox
            </button>
            <button
              onClick={() => {
                if (!walletAddress) {
                  connectWallet();
                } else {
                  setMode("web3");
                }
              }}
              className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                mode === "web3"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Wallet className="w-3 h-3 text-cyan-400" />
              {walletAddress ? shortHash(walletAddress, 4) : "Web3 Wallet"}
            </button>
          </div>

          {/* Sandbox Identity Selector Dropdown */}
          {mode === "sandbox" && (
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-cyan-500/40 text-xs transition-all text-left"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <div>
                  <div className="font-semibold text-slate-200 line-clamp-1 max-w-[130px]">
                    {currentActor.name}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono">
                    {currentActor.orgTypeName}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-white/10 flex items-between justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch Role Identity
                    </span>
                    <button
                      onClick={resetSandbox}
                      title="Reset Sandbox Data to Defaults"
                      className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  </div>
                  <div className="mt-1 space-y-1">
                    {Object.values(sandboxData.orgs).map((org) => {
                      const isSelected = activeAccount.toLowerCase() === org.address.toLowerCase();
                      return (
                        <button
                          key={org.address}
                          onClick={() => handleRoleSelect(org.address)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-cyan-500/15 border border-cyan-500/30 text-cyan-200"
                              : "hover:bg-slate-800/60 text-slate-300"
                          }`}
                        >
                          <div>
                            <div className="font-semibold">{org.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {org.orgTypeName} • {shortHash(org.address, 4)}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Web3 Connected Badge */}
          {mode === "web3" && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs">
              <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
              <span className="font-mono text-cyan-300">{shortHash(walletAddress, 4)}</span>
            </div>
          )}

        </div>

      </div>

      {/* Mobile Nav Tabs Bar */}
      <div className="flex md:hidden items-center justify-around gap-1 mt-3 pt-2 border-t border-white/5 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-2.5 py-1 text-[10px] font-medium transition-all ${
                isActive ? "text-cyan-400 font-bold" : "text-slate-400"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
