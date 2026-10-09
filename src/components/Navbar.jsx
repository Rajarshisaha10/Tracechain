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
  } = useChain();

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "samples", label: "Specimens", icon: Layers },
    { id: "custody", label: "Custody", icon: ArrowLeftRight },
    { id: "lineage", label: "Aliquots", icon: GitFork },
    { id: "compliance", label: "Lab & Audit", icon: FileCheck2 },
    { id: "directory", label: "Directory", icon: Building2 },
  ];

  const handleRoleSelect = (addr) => {
    setActiveAccount(addr);
    setShowRoleDropdown(false);
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#F5EEDC]/95 backdrop-blur-md border-b-2 border-[#E3D7BC] px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div 
              onClick={() => setActiveTab("dashboard")} 
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
            >
              {/* Crimson square with cream center cutout */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#C23B30] flex items-center justify-center relative shadow-sm shrink-0">
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#F5EEDC]"></div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-lg sm:text-xl font-extrabold tracking-tight text-[#2457A6]">
                    Tracechain
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-[#DCE6F5] text-[#2457A6] px-1.5 sm:px-2 py-0.5 rounded-full border border-[#BDD0EE]">
                    EVM
                  </span>
                </div>
                <p className="hidden sm:block text-[11px] text-[#6B7287] font-medium">Biological Provenance & Custody</p>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5 ml-2 bg-[#FFFBF1] p-1.5 rounded-2xl border-2 border-[#E3D7BC]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-[#2457A6] text-white shadow-sm"
                        : "text-[#596579] hover:text-[#1B2B45] hover:bg-[#EBDDB8]/50"
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
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* Mode Switcher */}
            <div className="flex items-center bg-[#FFFBF1] border-2 border-[#E3D7BC] rounded-xl p-0.5 sm:p-1 text-[11px] sm:text-xs">
              <button
                onClick={() => setMode("sandbox")}
                className={`px-2 sm:px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  mode === "sandbox"
                    ? "bg-[#2457A6] text-white shadow-sm"
                    : "text-[#6B7287] hover:text-[#1B2B45]"
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#EBDDB8]" />
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
                className={`px-2 sm:px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  mode === "web3"
                    ? "bg-[#2457A6] text-white shadow-sm"
                    : "text-[#6B7287] hover:text-[#1B2B45]"
                }`}
              >
                <Wallet className="w-3 h-3" />
                <span className="hidden sm:inline">{walletAddress ? shortHash(walletAddress, 4) : "Web3"}</span>
              </button>
            </div>

            {/* Role Dropdown */}
            {mode === "sandbox" && (
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#FFFBF1] border-2 border-[#E3D7BC] hover:border-[#2457A6] text-xs transition-all text-left shadow-sm min-h-[38px]"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#C23B30] shrink-0"></div>
                  <div className="max-w-[80px] sm:max-w-[130px] truncate">
                    <div className="font-bold text-[#1B2B45] truncate text-[11px] sm:text-xs">
                      {currentActor.name}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-[#2457A6] font-mono font-semibold truncate hidden sm:block">
                      {currentActor.orgTypeName}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#6B7287] shrink-0" />
                </button>

                {showRoleDropdown && (
                  <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-[#FFFBF1] border-2 border-[#E3D7BC] rounded-2xl shadow-xl p-2 z-50 animate-fadeIn">
                    <div className="px-3 py-2 border-b border-[#E3D7BC] flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-[#6B7287] uppercase tracking-wider">
                        Facility Identity
                      </span>
                      <button
                        onClick={resetSandbox}
                        className="text-[10px] text-[#C23B30] hover:underline flex items-center gap-1 font-bold"
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
                                ? "bg-[#DCE6F5] border-2 border-[#BDD0EE] text-[#2457A6] font-bold"
                                : "hover:bg-[#EBDDB8]/40 text-[#1B2B45]"
                            }`}
                          >
                            <div className="truncate">
                              <div className="font-bold truncate">{org.name}</div>
                              <div className="text-[10px] text-[#6B7287] font-mono truncate">
                                {org.orgTypeName} • {shortHash(org.address, 3)}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[#2457A6] shrink-0 ml-2"></div>
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

      {/* Native Mobile Bottom Navigation Bar (Fixed for thumbs!) */}
      <nav className="md:hidden mobile-nav-bar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`mobile-nav-btn ${isActive ? "active" : ""}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
