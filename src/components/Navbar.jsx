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
    <header className="sticky top-0 z-50 bg-[#F5EEDC]/95 backdrop-blur-md border-b-2 border-[#E3D7BC] px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setActiveTab("dashboard")} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            {/* The signature Red Square with Cream Circle cutout */}
            <div className="w-9 h-9 rounded-xl bg-[#C23B30] flex items-center justify-center relative shadow-sm group-hover:scale-105 transition-transform">
              <div className="w-3.5 h-3.5 rounded-full bg-[#F5EEDC]"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-[#2457A6]">
                  Tracechain
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#DCE6F5] text-[#2457A6] px-2 py-0.5 rounded-full border border-[#BDD0EE]">
                  Permissioned
                </span>
              </div>
              <p className="text-[11px] text-[#6B7287] font-medium">Biological Provenance & Chain of Custody</p>
            </div>
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 ml-4 bg-[#FFFBF1] p-1.5 rounded-2xl border-2 border-[#E3D7BC]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
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
        <div className="flex items-center gap-3">
          
          {/* Mode Badge & Switcher */}
          <div className="flex items-center bg-[#FFFBF1] border-2 border-[#E3D7BC] rounded-xl p-1 text-xs">
            <button
              onClick={() => setMode("sandbox")}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                mode === "sandbox"
                  ? "bg-[#2457A6] text-white shadow-sm"
                  : "text-[#6B7287] hover:text-[#1B2B45]"
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#EBDDB8]" />
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
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                mode === "web3"
                  ? "bg-[#2457A6] text-white shadow-sm"
                  : "text-[#6B7287] hover:text-[#1B2B45]"
              }`}
            >
              <Wallet className="w-3 h-3" />
              {walletAddress ? shortHash(walletAddress, 4) : "Web3 Wallet"}
            </button>
          </div>

          {/* Sandbox Identity Selector Dropdown */}
          {mode === "sandbox" && (
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#FFFBF1] border-2 border-[#E3D7BC] hover:border-[#2457A6] text-xs transition-all text-left shadow-sm"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#C23B30]"></div>
                <div>
                  <div className="font-bold text-[#1B2B45] line-clamp-1 max-w-[130px]">
                    {currentActor.name}
                  </div>
                  <div className="text-[10px] text-[#2457A6] font-mono font-semibold">
                    {currentActor.orgTypeName}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#6B7287] ml-1" />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-[#FFFBF1] border-2 border-[#E3D7BC] rounded-2xl shadow-xl p-2 z-50 animate-fadeIn">
                  <div className="px-3 py-2 border-b border-[#E3D7BC] flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-[#6B7287] uppercase tracking-wider">
                      Acting Facility Identity
                    </span>
                    <button
                      onClick={resetSandbox}
                      title="Reset Sandbox Data to Defaults"
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
                          <div>
                            <div className="font-bold">{org.name}</div>
                            <div className="text-[10px] text-[#6B7287] font-mono">
                              {org.orgTypeName} • {shortHash(org.address, 4)}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#2457A6]"></div>
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
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFFBF1] border-2 border-[#BDD0EE] text-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2457A6]"></div>
              <span className="font-mono text-[#2457A6] font-bold">{shortHash(walletAddress, 4)}</span>
            </div>
          )}

        </div>

      </div>

      {/* Mobile Nav Tabs Bar */}
      <div className="flex md:hidden items-center justify-around gap-1 mt-3 pt-2 border-t border-[#E3D7BC] overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-2.5 py-1 text-[10px] font-bold transition-all ${
                isActive ? "text-[#2457A6]" : "text-[#6B7287]"
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
