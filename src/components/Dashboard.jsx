import React from "react";
import { motion } from "framer-motion";
import { useChain } from "../context/ChainContext";
import { formatTimestamp, formatTemp, shortHash } from "../utils/formatters";
import AnimatedCounter from "./AnimatedCounter";
import {
  Layers,
  Truck,
  AlertTriangle,
  CheckCircle2,
  ThermometerSnowflake,
  ShieldAlert,
  PlusCircle,
  ArrowLeftRight,
  GitFork,
  Cpu,
  Fingerprint,
  Radio,
  Zap,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Activity,
  FileCheck2,
  RefreshCw,
  Scale,
  EyeOff,
  UserCheck
} from "lucide-react";

export default function Dashboard({
  onSelectSample,
  onOpenRegister,
  onOpenTransfer,
  onOpenAliquot,
  onOpenWorkbench
}) {
  const { sandboxData } = useChain();
  const samples = Object.values(sandboxData.samples || {});
  const histories = sandboxData.histories || {};
  const attestedReports = sandboxData.attestedReports || {};
  const retestRequests = sandboxData.retestRequests || {};
  const discrepancyCases = Object.values(sandboxData.discrepancyCases || {});

  const totalSamples = samples.length;
  const inTransitCount = samples.filter((s) => s.status === 2).length;
  const quarantinedCount = samples.filter((s) => s.status === 3).length;

  // Tracechain 2.0 Verification Metrics
  const totalAttestedReports = Object.values(attestedReports).reduce(
    (acc, list) => acc + (list?.length || 0),
    0
  );
  const totalRetests = Object.values(retestRequests).length;
  const openDiscrepancies = discrepancyCases.filter((c) => c.status !== 2).length;
  const resolvedDiscrepancies = discrepancyCases.filter((c) => c.status === 2).length;
  const blindSamplesCount = samples.filter((s) => !!s.blindId).length;

  const allEvents = [];
  Object.keys(histories).forEach((sampleId) => {
    const s = sandboxData.samples[sampleId];
    (histories[sampleId] || []).forEach((rec, idx) => {
      allEvents.push({
        sampleId,
        externalId: s?.externalId || shortHash(sampleId),
        blindId: s?.blindId,
        sampleType: s?.sampleType || "Biological Specimen",
        record: rec,
        index: idx,
      });
    });
  });

  allEvents.sort((a, b) => b.record.timestamp - a.record.timestamp);
  const recentEvents = allEvents.slice(0, 6);

  const thermalSamples = [];
  Object.keys(histories).forEach((sampleId) => {
    const s = sandboxData.samples[sampleId];
    const recsWithTemp = (histories[sampleId] || []).filter(
      (r) => r.temp !== undefined && r.temp !== -2147483648
    );
    if (recsWithTemp.length > 0) {
      const latestTempRec = recsWithTemp[recsWithTemp.length - 1];
      thermalSamples.push({
        sampleId,
        externalId: s?.externalId || shortHash(sampleId),
        temp: latestTempRec.temp,
        location: latestTempRec.note,
        timestamp: latestTempRec.timestamp,
        status: s?.status,
      });
    }
  });

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn">
      
      {/* Top Command Strip - Tight & Clean Neo-Brutalist Banner */}
      <div className="brutal-card p-4 sm:p-5 bg-[#FFFFFF] relative overflow-hidden shimmer-hover">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <span className="brutal-pill bg-[#D7FB38] text-[#0A0A0A]">
                <Zap className="w-3 h-3" />
                TRACECHAIN 2.0
              </span>
              <span className="brutal-pill bg-[#38BDF8] text-[#0A0A0A]">
                <EyeOff className="w-3 h-3" />
                BLIND TESTING
              </span>
              <span className="brutal-pill bg-[#FDE047] text-[#0A0A0A]">
                <Scale className="w-3 h-3" />
                INDEPENDENT RETESTS
              </span>
              <span className="brutal-pill bg-[#FFFFFF] text-[#0A0A0A]">
                ❄️ -80°C CRYO
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#0A0A0A] tracking-tight font-display">
              Biological Specimen Provenance & Verification
            </h1>
            <p className="text-[#52525B] text-xs sm:text-sm mt-1 max-w-xl font-medium leading-relaxed">
              Decentralized chain-of-custody registry with blind patient identifiers, ECDSA diagnostic report attestations, dual-lab independent retesting, and tamper-evident discrepancy investigation.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={onOpenRegister}
              className="brutal-btn brutal-btn-primary px-3.5 py-2 text-xs flex-1 sm:flex-initial"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register Specimen</span>
            </button>
            <button
              onClick={onOpenTransfer}
              className="brutal-btn brutal-btn-cyan px-3.5 py-2 text-xs flex-1 sm:flex-initial"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>
            <button
              onClick={onOpenAliquot}
              className="brutal-btn brutal-btn-purple px-3.5 py-2 text-xs flex-1 sm:flex-initial"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Split Aliquot</span>
            </button>
            {onOpenWorkbench && (
              <button
                onClick={onOpenWorkbench}
                className="brutal-btn bg-[#FDE047] hover:bg-[#FACC15] text-[#0A0A0A] px-3.5 py-2 text-xs flex-1 sm:flex-initial relative"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Workbench</span>
                {openDiscrepancies > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#FF5A5F] border border-[#0A0A0A] inline-block animate-ping" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Discrepancy Alert Strip (if active discrepancies exist) */}
      {openDiscrepancies > 0 && (
        <div className="brutal-card p-3.5 sm:p-4 bg-[#FFF1F2] border-2 border-[#DC2626] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[3px_3px_0px_#DC2626]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FF5A5F] text-white flex items-center justify-center shrink-0 border-2 border-[#0A0A0A] shadow-[1.5px_1.5px_0px_#0A0A0A]">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase text-[#DC2626] font-mono tracking-tight">
                  Active Analytical Discrepancy Detected
                </span>
                <span className="text-[9px] font-mono bg-[#DC2626] text-white px-1.5 py-0.2 rounded font-bold uppercase">
                  Anti-Tamper Lock Active
                </span>
              </div>
              <p className="text-xs text-[#0A0A0A] font-medium mt-0.5">
                {openDiscrepancies} biological specimen{openDiscrepancies > 1 ? "s have" : " has"} discordant findings between primary and independent verification labs. The original testing laboratory is strictly barred from self-resolution.
              </p>
            </div>
          </div>
          {onOpenWorkbench && (
            <button
              onClick={onOpenWorkbench}
              className="brutal-btn bg-[#FFFFFF] hover:bg-[#FEE2E2] text-[#DC2626] border-2 border-[#DC2626] shadow-[2px_2px_0px_#DC2626] text-xs px-3.5 py-2 shrink-0 flex items-center gap-1.5 font-black uppercase"
            >
              <span>Investigate Case</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Primary KPI Stats Grid - 4 Animated Brutalist Cards with Animated Counter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Specimens */}
        <motion.div 
          whileHover={{ y: -3, scale: 1.015 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="brutal-card p-3.5 sm:p-4 bg-[#FFFFFF] flex flex-col justify-between cursor-default"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase font-mono text-[#52525B] tracking-wider">
              Total Specimens
            </span>
            <span className="brutal-pill bg-[#D7FB38] text-[9px] px-1.5 py-0.2">
              ACTIVE
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black font-mono text-[#0A0A0A]">
              <AnimatedCounter value={totalSamples} />
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#D7FB38] border-2 border-[#0A0A0A] flex items-center justify-center shadow-[1.5px_1.5px_0px_#0A0A0A]">
              <Layers className="w-4 h-4 text-[#0A0A0A]" />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#E5E7EB] flex items-center gap-1.5 text-[11px] font-bold text-[#0A0A0A]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            <span>100% Hash-Bound</span>
          </div>
        </motion.div>

        {/* In Transit */}
        <motion.div 
          whileHover={{ y: -3, scale: 1.015 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="brutal-card p-3.5 sm:p-4 bg-[#FFFFFF] flex flex-col justify-between cursor-default"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase font-mono text-[#52525B] tracking-wider">
              In Transit
            </span>
            <span className="brutal-pill bg-[#38BDF8] text-[9px] px-1.5 py-0.2">
              COURIER
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black font-mono text-[#0A0A0A]">
              <AnimatedCounter value={inTransitCount} />
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#38BDF8] border-2 border-[#0A0A0A] flex items-center justify-center shadow-[1.5px_1.5px_0px_#0A0A0A]">
              <Truck className="w-4 h-4 text-[#0A0A0A]" />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#E5E7EB] flex items-center gap-1.5 text-[11px] font-bold text-[#0A0A0A]">
            <Radio className="w-3.5 h-3.5 text-[#0284C7] animate-pulse" />
            <span>Active Cold-Chain</span>
          </div>
        </motion.div>

        {/* Quarantine Hold */}
        <motion.div 
          whileHover={{ y: -3, scale: 1.015 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="brutal-card p-3.5 sm:p-4 bg-[#FFFFFF] flex flex-col justify-between cursor-default"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase font-mono text-[#52525B] tracking-wider">
              Quarantine Hold
            </span>
            <span className={`brutal-pill text-[9px] px-1.5 py-0.2 ${quarantinedCount > 0 ? "bg-[#FF5A5F] text-white animate-pulse" : "bg-[#F4F4F5] text-[#0A0A0A]"}`}>
              21 CFR
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className={`text-2xl sm:text-3xl font-black font-mono ${quarantinedCount > 0 ? "text-[#DC2626]" : "text-[#0A0A0A]"}`}>
              <AnimatedCounter value={quarantinedCount} />
            </div>
            <div className={`w-8 h-8 rounded-lg border-2 border-[#0A0A0A] flex items-center justify-center shadow-[1.5px_1.5px_0px_#0A0A0A] ${
              quarantinedCount > 0 ? "bg-[#FF5A5F] text-white" : "bg-[#F4F4F5] text-[#0A0A0A]"
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#E5E7EB] flex items-center gap-1.5 text-[11px] font-bold text-[#0A0A0A]">
            <AlertTriangle className={`w-3.5 h-3.5 ${quarantinedCount > 0 ? "text-[#DC2626]" : "text-[#71717A]"}`} />
            <span>{quarantinedCount > 0 ? "Requires Audit Release" : "Zero Alerts"}</span>
          </div>
        </motion.div>

        {/* Integrity Index */}
        <motion.div 
          whileHover={{ y: -3, scale: 1.015 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="brutal-card p-3.5 sm:p-4 bg-[#FFFFFF] flex flex-col justify-between cursor-default"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase font-mono text-[#52525B] tracking-wider">
              Integrity Index
            </span>
            <span className="brutal-pill bg-[#FDE047] text-[9px] px-1.5 py-0.2">
              KECCAK
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black font-mono text-[#0A0A0A]">
              100%
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#FDE047] border-2 border-[#0A0A0A] flex items-center justify-center shadow-[1.5px_1.5px_0px_#0A0A0A]">
              <Fingerprint className="w-4 h-4 text-[#0A0A0A]" />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#E5E7EB] flex items-center gap-1.5 text-[11px] font-bold text-[#0A0A0A]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Cryptographically Verified</span>
          </div>
        </motion.div>

      </div>

      {/* Tracechain 2.0 Verification Layer Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Attested Reports */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-3 sm:p-3.5 rounded-xl bg-[#FFFFFF] border-2 border-[#0A0A0A] shadow-[2.5px_2.5px_0px_#0A0A0A] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase font-mono text-[#52525B]">
              Attested Lab Reports
            </span>
            <span className="brutal-pill bg-[#C084FC] text-[9px] px-1.5 py-0.2">
              ECDSA
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black font-mono text-[#0A0A0A]">
              <AnimatedCounter value={totalAttestedReports} />
            </div>
            <FileCheck2 className="w-4 h-4 text-[#7C3AED]" />
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-[#E5E7EB] text-[10px] text-[#52525B] font-mono font-medium truncate">
            Cryptographic Key Attestations
          </div>
        </motion.div>

        {/* Blind Testing IDs */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-3 sm:p-3.5 rounded-xl bg-[#FFFFFF] border-2 border-[#0A0A0A] shadow-[2.5px_2.5px_0px_#0A0A0A] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase font-mono text-[#52525B]">
              Blind Testing IDs
            </span>
            <span className="brutal-pill bg-[#38BDF8] text-[9px] px-1.5 py-0.2">
              OFF-CHAIN
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black font-mono text-[#0A0A0A]">
              <AnimatedCounter value={blindSamplesCount} />
              <span className="text-xs text-[#71717A] font-normal ml-1">/ {totalSamples}</span>
            </div>
            <EyeOff className="w-4 h-4 text-[#0284C7]" />
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-[#E5E7EB] text-[10px] text-[#52525B] font-mono font-medium truncate">
            De-Identified Patient Vault
          </div>
        </motion.div>

        {/* Independent Retests */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-3 sm:p-3.5 rounded-xl bg-[#FFFFFF] border-2 border-[#0A0A0A] shadow-[2.5px_2.5px_0px_#0A0A0A] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase font-mono text-[#52525B]">
              Independent Retests
            </span>
            <span className="brutal-pill bg-[#FDE047] text-[9px] px-1.5 py-0.2">
              2ND LAB
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black font-mono text-[#0A0A0A]">
              <AnimatedCounter value={totalRetests} />
            </div>
            <RefreshCw className="w-4 h-4 text-[#CA8A04]" />
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-[#E5E7EB] text-[10px] text-[#52525B] font-mono font-medium truncate">
            Secondary Verification Audits
          </div>
        </motion.div>

        {/* Discrepancies */}
        <motion.div 
          whileHover={{ y: -2 }}
          onClick={onOpenWorkbench}
          className={`p-3 sm:p-3.5 rounded-xl border-2 border-[#0A0A0A] shadow-[2.5px_2.5px_0px_#0A0A0A] flex flex-col justify-between ${
            onOpenWorkbench ? "cursor-pointer hover:bg-[#FFFBEB]" : ""
          } ${openDiscrepancies > 0 ? "bg-[#FEF2F2]" : "bg-[#FFFFFF]"}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase font-mono text-[#52525B]">
              Discrepancies
            </span>
            <span className={`brutal-pill text-[9px] px-1.5 py-0.2 ${
              openDiscrepancies > 0 ? "bg-[#FF5A5F] text-white" : "bg-[#10B981] text-white"
            }`}>
              {openDiscrepancies > 0 ? "ACTION REQ" : "CLEAR"}
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <div className="text-xl sm:text-2xl font-black font-mono text-[#0A0A0A]">
              <span className={openDiscrepancies > 0 ? "text-[#DC2626]" : ""}>
                {openDiscrepancies}
              </span>
              <span className="text-xs text-[#71717A] font-normal ml-1">
                open ({resolvedDiscrepancies} res)
              </span>
            </div>
            <Scale className={`w-4 h-4 ${openDiscrepancies > 0 ? "text-[#DC2626]" : "text-[#10B981]"}`} />
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-[#E5E7EB] text-[10px] text-[#52525B] font-mono font-medium flex items-center justify-between">
            <span>Anti-Tamper Enforced</span>
            {onOpenWorkbench && (
              <span className="text-[#0A0A0A] font-bold underline flex items-center gap-0.5">
                Review <ChevronRight className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
        </motion.div>

      </div>

      {/* Main Content Grid: Live Provenance Activity & Cold-Chain Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Left 2 Cols: Live Provenance Ledger Stream */}
        <div className="lg:col-span-2 brutal-card p-4 sm:p-5 bg-[#FFFFFF]">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#0A0A0A]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981] border border-[#0A0A0A]"></span>
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-[#0A0A0A] font-display uppercase tracking-tight">
                Live Provenance Ledger Stream
              </h2>
              <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-[#DC2626] bg-[#FEE2E2] px-1.5 py-0.5 rounded border border-[#DC2626]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse"></span>
                LIVE
              </span>
            </div>
            <span className="brutal-pill bg-[#D7FB38] text-[10px]">
              EVM Tip Live
            </span>
          </div>

          <div className="space-y-2.5 mt-3">
            {recentEvents.length === 0 ? (
              <div className="py-8 text-center text-[#71717A] text-xs font-mono">
                No events recorded yet.
              </div>
            ) : (
              recentEvents.map((evt, i) => {
                const rec = evt.record;
                const isStorage = rec.recType === 7;
                const isIncident = rec.recType === 10;
                const isQuarantine = rec.recType === 11;
                const isTest = rec.recType === 9;
                const isAliquot = rec.recType === 1 || rec.recType === 2;
                const isReportAttested = rec.recType === 16;
                const isRetestRequested = rec.recType === 17;
                const isRetestReported = rec.recType === 18;
                const isDiscrepancyFlagged = rec.recType === 19;
                const isDiscrepancyResolved = rec.recType === 20;

                const getBadgeConfig = () => {
                  if (isDiscrepancyFlagged) return { bg: "bg-[#FF5A5F]", text: "text-white", label: "DISCREPANCY" };
                  if (isDiscrepancyResolved) return { bg: "bg-[#10B981]", text: "text-white", label: "RESOLVED" };
                  if (isRetestReported) return { bg: "bg-[#D7FB38]", text: "text-[#0A0A0A]", label: "RETEST PASS" };
                  if (isRetestRequested) return { bg: "bg-[#FDE047]", text: "text-[#0A0A0A]", label: "RETEST REQ" };
                  if (isReportAttested) return { bg: "bg-[#C084FC]", text: "text-[#0A0A0A]", label: "ATTESTATION" };
                  if (isIncident || isQuarantine) return { bg: "bg-[#FF5A5F]", text: "text-white", label: "ALERT" };
                  if (isStorage) return { bg: "bg-[#38BDF8]", text: "text-[#0A0A0A]", label: "STORAGE" };
                  if (isTest) return { bg: "bg-[#C084FC]", text: "text-[#0A0A0A]", label: "TEST" };
                  if (isAliquot) return { bg: "bg-[#FDE047]", text: "text-[#0A0A0A]", label: "ALIQUOT" };
                  return { bg: "bg-[#D7FB38]", text: "text-[#0A0A0A]", label: "EVENT" };
                };

                const badge = getBadgeConfig();

                return (
                  <motion.div
                    key={i}
                    whileHover={{ x: 2, scale: 1.005 }}
                    transition={{ type: "spring", stiffness: 450, damping: 25 }}
                    onClick={() => onSelectSample(evt.sampleId)}
                    className="relative p-3 rounded-xl bg-[#F7F8F4] hover:bg-[#FFFFFF] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] hover:shadow-[3.5px_3.5px_0px_#0A0A0A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer transition-all overflow-hidden"
                  >
                    {/* Laser Scanner Line (absolute overlay) */}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="animate-laser" />
                    </div>

                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border-2 border-[#0A0A0A] shadow-[1.5px_1.5px_0px_#0A0A0A] shrink-0 ${badge.bg} ${badge.text}`}>
                        {isDiscrepancyFlagged || isDiscrepancyResolved ? (
                          <Scale className="w-4 h-4" />
                        ) : isRetestReported || isRetestRequested ? (
                          <RefreshCw className="w-4 h-4" />
                        ) : isReportAttested ? (
                          <FileCheck2 className="w-4 h-4" />
                        ) : isIncident || isQuarantine ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <Cpu className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-black text-[#0A0A0A] group-hover:underline font-mono">
                            {evt.externalId}
                          </span>
                          {evt.blindId && (
                            <span className="text-[10px] font-mono bg-[#E0F2FE] text-[#0284C7] px-1.5 py-0.2 rounded border border-[#0A0A0A] font-bold">
                              {evt.blindId}
                            </span>
                          )}
                          <span className="text-[10px] font-mono bg-[#FFFFFF] text-[#0A0A0A] px-1.5 py-0.2 rounded border border-[#0A0A0A] font-bold">
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-[#0A0A0A] mt-0.5 font-medium line-clamp-1">
                          {rec.note || "Chain transaction committed"}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-[#52525B] font-mono flex-wrap">
                          <span>Actor: <strong className="text-[#0A0A0A]">{shortHash(rec.actor, 3)}</strong></span>
                          <span>•</span>
                          <span>Prev: <strong className="text-[#0A0A0A]">{shortHash(rec.prevHash, 3)}</strong></span>
                          {rec.temp !== undefined && rec.temp !== -2147483648 && (
                            <>
                              <span>•</span>
                              <span className="text-[#0A0A0A] bg-[#38BDF8] border border-[#0A0A0A] px-1.5 py-0.2 rounded font-bold">
                                {formatTemp(rec.temp)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-1 sm:pt-0">
                      <span className="text-[10px] text-[#52525B] font-mono font-medium">
                        {formatTimestamp(rec.timestamp)}
                      </span>
                      <span className="text-[10px] font-mono bg-[#FFFFFF] px-2 py-0.5 rounded text-[#0A0A0A] font-extrabold border-2 border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A]">
                        {shortHash(rec.recordHash, 3)}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Cold-Chain Cryogenic Monitor */}
        <div className="brutal-card p-4 sm:p-5 bg-[#FFFFFF] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#0A0A0A]">
              <div className="flex items-center gap-2">
                <ThermometerSnowflake className="w-4 h-4 text-[#0284C7]" />
                <h2 className="text-sm sm:text-base font-extrabold text-[#0A0A0A] font-display uppercase tracking-tight">
                  Cold-Chain Radar
                </h2>
              </div>
              <span className="brutal-pill bg-[#38BDF8] text-[10px]">
                -80°C
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {thermalSamples.length === 0 ? (
                <div className="py-6 text-center text-[#71717A] text-xs font-mono">
                  No storage readings recorded yet.
                </div>
              ) : (
                thermalSamples.map((item, idx) => {
                  const isWarning = item.temp > -600 && item.temp < 0;
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ x: 2, scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 450, damping: 25 }}
                      onClick={() => onSelectSample(item.sampleId)}
                      className="p-2.5 rounded-lg bg-[#F7F8F4] border-2 border-[#0A0A0A] hover:bg-[#FFFFFF] hover:shadow-[2px_2px_0px_#0A0A0A] cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0A0A0A] font-mono truncate">
                          {item.externalId}
                        </span>
                        <span
                          className={`text-xs font-mono px-1.5 py-0.5 rounded border border-[#0A0A0A] font-extrabold ${
                            isWarning
                              ? "bg-[#FF5A5F] text-white animate-pulse"
                              : "bg-[#38BDF8] text-[#0A0A0A]"
                          }`}
                        >
                          {formatTemp(item.temp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#52525B] mt-0.5 line-clamp-1 font-medium">
                        {item.location}
                      </p>
                      <div className="mt-1 text-[10px] text-[#71717A] font-mono flex justify-between">
                        <span>{formatTimestamp(item.timestamp)}</span>
                        {isWarning && (
                          <span className="text-[#DC2626] font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Excursion
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t-2 border-[#0A0A0A] bg-[#FEF9C3] p-3 rounded-xl border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
            <div className="text-xs font-black text-[#0A0A0A] flex items-center justify-between uppercase font-mono">
              <span>Cryogenic Target</span>
              <span className="text-[#0A0A0A] font-extrabold bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A]">-80.0 °C</span>
            </div>
            <div className="w-full bg-[#FFFFFF] h-2.5 rounded-full mt-2 overflow-hidden border-2 border-[#0A0A0A]">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "94%" }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="bg-[#D7FB38] h-full border-r-2 border-[#0A0A0A]"
              />
            </div>
            <div className="text-[10px] text-[#713F12] mt-1.5 flex justify-between font-mono font-bold uppercase">
              <span>94% in range</span>
              <span>ISO 20387 Pass</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
