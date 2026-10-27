import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Check,
  Menu,
  X,
  Scale
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const discrepancyCases = Object.values(sandboxData.discrepancyCases || {});
  const openDiscrepanciesCount = discrepancyCases.filter((c) => c.status !== 2).length;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "samples", label: "Specimens", icon: Layers },
    { id: "custody", label: "Custody", icon: ArrowLeftRight },
    { id: "lineage", label: "Aliquots", icon: GitFork },
    { id: "compliance", label: "Lab & Audit", icon: FileCheck2 },
    { id: "workbench", label: "Workbench", icon: Scale, badge: openDiscrepanciesCount },
    { id: "directory", label: "Directory", icon: Building2 },
  ];

  const handleRoleSelect = (addr) => {
    setActiveAccount(addr);
    setShowRoleDropdown(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b-2 border-[#0A0A0A] shadow-[0_2.5px_0px_#0A0A0A] px-3.5 sm:px-6 py-2 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3 lg:gap-6">
          <div 
            onClick={() => setActiveTab("dashboard")} 
            className="flex items-center gap-2 cursor-pointer group select-none"
          >
            {/* Tactile Brutalist Badge with animated hover */}
            <motion.div 
              whileHover={{ rotate: 12, scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#D7FB38] border-2 border-[#0A0A0A] flex items-center justify-center shadow-[2px_2px_0px_#0A0A0A] shrink-0"
            >
              <Dna className="w-5 h-5 text-[#0A0A0A]" />
            </motion.div>

            <div className="leading-none">
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-[#0A0A0A] font-display">
                  TRACE<span className="text-[#0A0A0A] underline decoration-[#D7FB38] decoration-4">CHAIN</span>
                </span>
                <span className="text-[9px] font-mono font-extrabold bg-[#0A0A0A] text-[#D7FB38] px-1.5 py-0.5 rounded uppercase hidden sm:inline-block">
                  2.0
                </span>
              </div>
              <p className="text-[9px] text-[#52525B] font-mono font-semibold tracking-tight mt-0.5 hidden md:block">
                Blind Testing & Verification // 21 CFR §11
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs with Sliding Spring Pill */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#F4F4F5] p-1 rounded-xl border border-[#0A0A0A]/20 relative">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer z-10 ${
                    isActive ? "text-[#0A0A0A]" : "text-[#52525B] hover:text-[#0A0A0A]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 bg-[#D7FB38] rounded-lg border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 text-[#0A0A0A]" />
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="text-[9px] font-mono font-black bg-[#FF5A5F] text-white px-1.5 py-0.2 rounded-full border border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Mode & Clearance Controls */}
        <div className="flex items-center gap-2">
          
          {/* Mode Switcher with Animated Pill Indicator */}
          <div className="flex items-center bg-[#F4F4F5] border-2 border-[#0A0A0A] rounded-xl p-0.5 text-xs shadow-[2px_2px_0px_#0A0A0A] relative">
            <button
              onClick={() => setMode("sandbox")}
              className={`relative px-2.5 py-1 rounded-lg font-bold text-[11px] sm:text-xs transition-colors flex items-center gap-1 cursor-pointer z-10 ${
                mode === "sandbox" ? "text-[#0A0A0A]" : "text-[#52525B] hover:text-[#0A0A0A]"
              }`}
            >
              {mode === "sandbox" && (
                <motion.div
                  layoutId="mode-active-pill"
                  className="absolute inset-0 bg-[#D7FB38] rounded-lg border border-[#0A0A0A] -z-10"
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                />
              )}
              <Sparkles className="w-3 h-3 text-[#0A0A0A]" />
              <span>Sandbox</span>
            </button>
            <button
              onClick={() => {
                if (!walletAddress) {
                  connectWallet();
                } else {
                  setMode("web3");
                }
              }}
              className={`relative px-2.5 py-1 rounded-lg font-bold text-[11px] sm:text-xs transition-colors flex items-center gap-1 cursor-pointer z-10 ${
                mode === "web3" ? "text-[#0A0A0A]" : "text-[#52525B] hover:text-[#0A0A0A]"
              }`}
            >
              {mode === "web3" && (
                <motion.div
                  layoutId="mode-active-pill"
                  className="absolute inset-0 bg-[#38BDF8] rounded-lg border border-[#0A0A0A] -z-10"
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                />
              )}
              <Wallet className="w-3 h-3 text-[#0A0A0A]" />
              <span>{walletAddress ? shortHash(walletAddress, 4) : "Connect"}</span>
            </button>
          </div>

          {/* Role Clearance Dropdown */}
          {mode === "sandbox" && (
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-xl bg-[#FFFFFF] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] hover:shadow-[3px_3px_0px_#0A0A0A] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] text-xs transition-all text-left min-h-[34px] cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-[#10B981] border border-[#0A0A0A] shrink-0 animate-pulse"></div>
                <div className="max-w-[70px] sm:max-w-[130px] truncate">
                  <div className="font-extrabold text-[#0A0A0A] truncate text-[11px]">
                    {currentActor.name}
                  </div>
                  <div className="text-[9px] text-[#52525B] font-mono font-bold truncate uppercase tracking-tight hidden sm:block">
                    {currentActor.orgTypeName}
                  </div>
                </div>
                <ChevronDown className="w-3 h-3 text-[#0A0A0A] shrink-0" />
              </button>

              <AnimatePresence>
                {showRoleDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#FFFFFF] border-2 border-[#0A0A0A] rounded-xl shadow-[5px_5px_0px_#0A0A0A] p-2.5 z-50"
                  >
                    <div className="px-2.5 py-1.5 border border-[#0A0A0A] flex items-center justify-between mb-2 bg-[#FDE047] rounded-lg">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0A0A0A]" />
                        <span className="text-[10px] font-extrabold text-[#0A0A0A] uppercase tracking-wider font-mono">
                          Active Identity
                        </span>
                      </div>
                      <button
                        onClick={resetSandbox}
                        className="text-[10px] text-[#FFFFFF] bg-[#FF5A5F] hover:bg-[#E0484D] px-2 py-0.5 rounded border border-[#0A0A0A] flex items-center gap-1 font-bold shadow-[1px_1px_0px_#0A0A0A] cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        Reset
                      </button>
                    </div>

                    <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                      {Object.values(sandboxData.orgs).map((org) => {
                        const isSelected = activeAccount.toLowerCase() === org.address.toLowerCase();
                        return (
                          <button
                            key={org.address}
                            onClick={() => handleRoleSelect(org.address)}
                            className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all flex items-center justify-between border cursor-pointer ${
                              isSelected
                                ? "bg-[#D7FB38] border-[#0A0A0A] shadow-[1.5px_1.5px_0px_#0A0A0A] text-[#0A0A0A] font-bold"
                                : "bg-[#FFFFFF] border-transparent hover:border-[#0A0A0A] hover:bg-[#F4F4F5] text-[#0A0A0A]"
                            }`}
                          >
                            <div className="truncate flex-1 pr-2">
                              <div className="font-bold truncate text-[11px] text-[#0A0A0A]">
                                {org.name}
                              </div>
                              <div className="text-[9px] text-[#52525B] font-mono truncate flex items-center gap-1.5 mt-0.5">
                                <span className="px-1 py-0.2 rounded bg-[#F4F4F5] border border-[#0A0A0A] font-bold text-[#0A0A0A]">
                                  {org.country || "GL"}
                                </span>
                                <span>{org.orgTypeName}</span>
                                <span>•</span>
                                <span>{shortHash(org.address, 3)}</span>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#0A0A0A] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-lg bg-[#FFFFFF] border-2 border-[#0A0A0A] shadow-[1.5px_1.5px_0px_#0A0A0A] text-[#0A0A0A] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

        </div>

      </div>

      {/* Mobile Drawer Menu (if open) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden mt-2 pt-2 border-t-2 border-[#0A0A0A] grid grid-cols-3 sm:grid-cols-4 gap-1.5 pb-1 overflow-hidden"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg text-[10px] font-bold border transition-all relative ${
                    isActive
                      ? "bg-[#D7FB38] text-[#0A0A0A] border-[#0A0A0A] shadow-[1.5px_1.5px_0px_#0A0A0A]"
                      : "bg-[#FFFFFF] text-[#52525B] border-[#E5E7EB]"
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-3.5 h-3.5 mb-0.5" />
                    {item.badge > 0 && (
                      <span className="absolute -top-1 -right-2 text-[8px] font-mono font-bold bg-[#FF5A5F] text-white px-1 rounded-full border border-[#0A0A0A]">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
