import React, { useState } from "react";
import { useChain } from "../context/ChainContext";
import { shortHash } from "../utils/formatters";
import {
  Activity,
  Layers,
  ArrowLeftRight,
  GitFork,
  FileCheck2,
  Building2,
  Wallet,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  Dna,
  Flame,
  Zap
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
  } = useChain();

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity, activeColor: "bg-[#435E2F] text-white", iconColor: "text-[#B4F000]" },
    { id: "samples", label: "Specimens", icon: Layers, activeColor: "bg-[#22D3EE] text-[#162013]", iconColor: "text-[#0284C7]" },
    { id: "custody", label: "Custody", icon: ArrowLeftRight, activeColor: "bg-[#FFE600] text-[#162013]", iconColor: "text-[#D97706]" },
    { id: "lineage", label: "Aliquots", icon: GitFork, activeColor: "bg-[#FF70A6] text-white", iconColor: "text-[#DB2777]" },
    { id: "compliance", label: "Lab & Audit", icon: FileCheck2, activeColor: "bg-[#C084FC] text-[#162013]", iconColor: "text-[#7C3AED]" },
    { id: "directory", label: "Directory", icon: Building2, activeColor: "bg-[#FF6B4A] text-white", iconColor: "text-[#EA580C]" },
  ];

  const handleRoleSelect = (addr) => {
    setActiveAccount(addr);
    setShowRoleDropdown(false);
  };

  return (
    <>
      {/* Top Header - Eye-Catchy Neo-Brutalist with Bold Pops */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b-[3px] border-[#162013] px-3 sm:px-6 py-2.5 sm:py-3 shadow-[0_5px_0px_#162013]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Brand Identity with Vibrant Neo-Brut Stickers */}
          <div className="flex items-center gap-3 sm:gap-5">
            <div 
              onClick={() => setActiveTab("dashboard")} 
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
            >
              {/* Neo-brutalist olive badge with lime glow */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#435E2F] border-[2.5px] border-[#162013] flex items-center justify-center relative shadow-[3px_3px_0px_#162013] group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] group-hover:shadow-[4px_4px_0px_#162013] transition-all shrink-0">
                <Dna className="w-6 h-6 text-[#B4F000]" />
                <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#FFE600] border-2 border-[#162013] rounded-full flex items-center justify-center">
                  <Zap className="w-2 h-2 text-[#162013]" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-[#162013] font-display">
                    TRACE<span className="text-[#435E2F] underline decoration-[#B4F000] decoration-4">CHAIN</span>
                  </span>
                  
                  {/* Playful Neo-Brutalist Canary Yellow Sticker */}
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-[#FFE600] text-[#162013] px-2 py-0.5 rounded-md border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013] -rotate-2 hidden sm:inline-block">
                    EVM CORE
                  </span>
                </div>
                <p className="hidden sm:block text-[10px] text-[#5D7057] font-mono font-extrabold uppercase tracking-wider">
                  Cryptographic Specimen Provenance // 21 CFR §11
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs - Segmented Neo-Brut Control Strip */}
            <nav className="hidden lg:flex items-center gap-1.5 ml-2 bg-[#F4F7F1] p-1.5 rounded-xl border-2 border-[#162013] shadow-[2.5px_2.5px_0px_#162013]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                      isActive
                        ? `${item.activeColor} border-2 border-[#162013] shadow-[2px_2px_0px_#162013] translate-x-[-1px] translate-y-[-1px]`
                        : "text-[#33442E] hover:text-[#162013] hover:bg-[#FFFFFF] hover:border-2 hover:border-[#162013]"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-current" : item.iconColor}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Mode Switcher & Security Clearance Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Mode Switcher (Tactile Hardware Neo-Brut Bar) */}
            <div className="flex items-center bg-[#F4F7F1] border-2 border-[#162013] rounded-xl p-1 text-[11px] sm:text-xs shadow-[2.5px_2.5px_0px_#162013]">
              <button
                onClick={() => setMode("sandbox")}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-black transition-all flex items-center gap-1.5 ${
                  mode === "sandbox"
                    ? "bg-[#B4F000] text-[#162013] border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013]"
                    : "text-[#5D7057] hover:text-[#162013]"
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#162013]" />
                <span className="hidden sm:inline">Sandbox</span>
              </button>
              <button
                onClick={() => {
                  if (!walletAddress) {
                    connectWallet();
                  } else {
                    setMode("web3");
                  }
                }}
                className={`px-2.5 sm:px-3 py-1 rounded-lg font-black transition-all flex items-center gap-1.5 ${
                  mode === "web3"
                    ? "bg-[#22D3EE] text-[#162013] border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013]"
                    : "text-[#5D7057] hover:text-[#162013]"
                }`}
              >
                <Wallet className="w-3 h-3 text-[#162013]" />
                <span className="hidden sm:inline">{walletAddress ? shortHash(walletAddress, 4) : "Connect Web3"}</span>
              </button>
            </div>

            {/* Role Clearance Dropdown */}
            {mode === "sandbox" && (
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] border-2 border-[#162013] shadow-[2.5px_2.5px_0px_#162013] hover:shadow-[3.5px_3.5px_0px_#162013] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#162013] text-xs transition-all text-left min-h-[38px]"
                >
                  <div className="w-3 h-3 rounded-full bg-[#B4F000] border-2 border-[#162013] shrink-0 animate-pulse"></div>
                  <div className="max-w-[80px] sm:max-w-[140px] truncate">
                    <div className="font-black text-[#162013] truncate text-[11px] sm:text-xs">
                      {currentActor.name}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-[#435E2F] font-mono font-bold truncate uppercase tracking-tight hidden sm:block">
                      {currentActor.orgTypeName}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#162013] shrink-0" />
                </button>

                {showRoleDropdown && (
                  <div className="absolute right-0 mt-2.5 w-72 sm:w-80 bg-[#FFFFFF] border-[3px] border-[#162013] rounded-2xl shadow-[6px_6px_0px_#162013] p-3 z-50 animate-fadeIn">
                    <div className="px-3 py-2 border-2 border-[#162013] flex items-center justify-between mb-2.5 bg-[#FFE600] rounded-xl shadow-[1.5px_1.5px_0px_#162013]">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#162013]" />
                        <span className="text-[10px] font-black text-[#162013] uppercase tracking-wider font-mono">
                          Switch Clearance Actor
                        </span>
                      </div>
                      <button
                        onClick={resetSandbox}
                        className="text-[10px] text-[#FFFFFF] bg-[#DC2626] hover:bg-[#B91C1C] px-2 py-0.5 rounded border border-[#162013] flex items-center gap-1 font-bold shadow-[1px_1px_0px_#162013] active:translate-x-0.5 active:translate-y-0.5"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Reset
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {Object.values(sandboxData.orgs).map((org) => {
                        const isSelected = activeAccount.toLowerCase() === org.address.toLowerCase();
                        return (
                          <button
                            key={org.address}
                            onClick={() => handleRoleSelect(org.address)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-between border-2 ${
                              isSelected
                                ? "bg-[#B4F000] border-[#162013] shadow-[2.5px_2.5px_0px_#162013] text-[#162013] font-bold"
                                : "bg-[#FFFFFF] border-transparent hover:border-[#162013] hover:bg-[#F4F7F1] text-[#33442E]"
                            }`}
                          >
                            <div className="truncate flex-1 pr-2">
                              <div className="font-black truncate text-xs text-[#162013]">
                                {org.name}
                              </div>
                              <div className="text-[10px] text-[#5D7057] font-mono truncate flex items-center gap-1.5 mt-0.5">
                                <span className="px-1.5 py-0.2 rounded bg-[#FFFFFF] border border-[#162013] text-[9px] font-black text-[#162013]">
                                  {org.country || "GL"}
                                </span>
                                <span className="font-bold">{org.orgTypeName}</span>
                                <span>•</span>
                                <span>{shortHash(org.address, 3)}</span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-3.5 h-3.5 rounded-full bg-[#162013] shrink-0 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#B4F000]"></div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </header>

      {/* Native Mobile Bottom Navigation Bar (Colorful Neo-Brutalist Dock) */}
      <nav className="lg:hidden mobile-nav-bar bg-[#FFFFFF] border-t-[3px] border-[#162013] shadow-[0_-3px_0px_#162013]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`mobile-nav-btn ${isActive ? `${item.activeColor} border-2 border-[#162013] shadow-[2px_2px_0px_#162013] font-black` : "text-[#5D7057]"}`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
