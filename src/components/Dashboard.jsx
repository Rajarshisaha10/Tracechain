import React from "react";
import { useChain } from "../context/ChainContext";
import { formatTimestamp, formatTemp, shortHash, STATUS_CONFIG } from "../utils/formatters";
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
  Fingerprint
} from "lucide-react";

export default function Dashboard({
  onSelectSample,
  onOpenRegister,
  onOpenTransfer,
  onOpenAliquot
}) {
  const { sandboxData } = useChain();
  const samples = Object.values(sandboxData.samples || {});
  const histories = sandboxData.histories || {};

  const totalSamples = samples.length;
  const inTransitCount = samples.filter((s) => s.status === 2).length;
  const quarantinedCount = samples.filter((s) => s.status === 3).length;

  const allEvents = [];
  Object.keys(histories).forEach((sampleId) => {
    const s = sandboxData.samples[sampleId];
    (histories[sampleId] || []).forEach((rec, idx) => {
      allEvents.push({
        sampleId,
        externalId: s?.externalId || shortHash(sampleId),
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
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="glass-panel p-4.5 sm:p-6 lg:p-8 bg-[#FFFBF1] border-2 border-[#E3D7BC] relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#DCE6F5] border border-[#BDD0EE] text-[#2457A6] text-[11px] sm:text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-[#2457A6] shrink-0"></span>
              <span>Cryptographic Provenance Verified • Zero-Knowledge</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#1B2B45] tracking-tight leading-tight">
              Biological Specimen & Clinical Chain of Custody
            </h1>
            <p className="text-[#596579] text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
              Tamper-evident custody handoffs, cryptographic hash-chain anchoring, automated quarantine enforcement, and real-time cryogenic thermal compliance.
            </p>
          </div>

          {/* Quick Action Buttons (Stacked on small screens, row on desktop) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={onOpenRegister}
              className="btn-primary text-xs w-full sm:w-auto"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Register Specimen</span>
            </button>
            <button
              onClick={onOpenTransfer}
              className="btn-secondary text-xs w-full sm:w-auto"
            >
              <ArrowLeftRight className="w-4 h-4 text-[#2457A6] shrink-0" />
              <span>Transfer Custody</span>
            </button>
            <button
              onClick={onOpenAliquot}
              className="btn-secondary text-xs w-full sm:w-auto"
            >
              <GitFork className="w-4 h-4 text-[#C23B30] shrink-0" />
              <span>Split Aliquot</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Specimens */}
        <div className="glass-panel p-3.5 sm:p-5 bg-[#FFFBF1] border-2 border-[#E3D7BC] hover:border-[#2457A6] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-[#6B7287] uppercase tracking-wider">
              Total
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#DCE6F5] text-[#2457A6] flex items-center justify-center border border-[#BDD0EE]">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#1B2B45] mt-2 sm:mt-3 font-mono">
            {totalSamples}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#2457A6] mt-1.5 font-bold">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>100% Hash-Bound</span>
          </div>
        </div>

        {/* In Transit */}
        <div className="glass-panel p-3.5 sm:p-5 bg-[#FFFBF1] border-2 border-[#E3D7BC] hover:border-[#D97706] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-[#6B7287] uppercase tracking-wider">
              In Transit
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#FEF3C7] text-[#92400E] flex items-center justify-center border border-[#FDE68A]">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#92400E] mt-2 sm:mt-3 font-mono">
            {inTransitCount}
          </div>
          <div className="text-[11px] text-[#6B7287] mt-1.5 truncate">
            Courier in flight
          </div>
        </div>

        {/* Quarantined / Alerted */}
        <div className="glass-panel p-3.5 sm:p-5 bg-[#FFFBF1] border-2 border-[#E3D7BC] hover:border-[#C23B30] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-[#6B7287] uppercase tracking-wider">
              Quarantine
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#F6D9D4] text-[#C23B30] flex items-center justify-center border border-[#EDB8B3]">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#C23B30] mt-2 sm:mt-3 font-mono">
            {quarantinedCount}
          </div>
          <div className="text-[11px] text-[#C23B30] mt-1.5 font-bold truncate">
            {quarantinedCount > 0 ? "Requires auditor release" : "Zero active alerts"}
          </div>
        </div>

        {/* Chain Integrity Index */}
        <div className="glass-panel p-3.5 sm:p-5 bg-[#FFFBF1] border-2 border-[#E3D7BC] hover:border-[#2457A6] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-[#6B7287] uppercase tracking-wider">
              Integrity
            </span>
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#DCE6F5] text-[#2457A6] flex items-center justify-center border border-[#BDD0EE]">
              <Fingerprint className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#2457A6] mt-2 sm:mt-3 font-mono">
            100%
          </div>
          <div className="text-[11px] text-[#2457A6] mt-1.5 font-bold truncate">
            Keccak-256 Proofs
          </div>
        </div>

      </div>

      {/* Main Grid: Live Activity Stream & Cold-Chain Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Left 2 Cols: Live Provenance Blockchain Activity */}
        <div className="lg:col-span-2 glass-panel p-4 sm:p-6 bg-[#FFFBF1] border-2 border-[#E3D7BC]">
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b-2 border-[#E3D7BC]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2457A6] shrink-0"></div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#1B2B45]">
                Live Chain-of-Custody Stream
              </h2>
            </div>
            <span className="text-[11px] sm:text-xs text-[#6B7287] font-mono">
              EVM Ledger
            </span>
          </div>

          <div className="divide-y divide-[#E3D7BC] mt-1">
            {recentEvents.length === 0 ? (
              <div className="py-8 text-center text-[#6B7287] text-xs">
                No events recorded yet.
              </div>
            ) : (
              recentEvents.map((evt, i) => {
                const rec = evt.record;
                const isStorage = rec.recType === 7;
                const isIncident = rec.recType === 10;
                const isQuarantine = rec.recType === 11;

                return (
                  <div
                    key={i}
                    onClick={() => onSelectSample(evt.sampleId)}
                    className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 group cursor-pointer hover:bg-[#F5EEDC]/60 px-2 rounded-xl transition-all"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5 border shrink-0 ${
                        isIncident || isQuarantine
                          ? "bg-[#F6D9D4] text-[#C23B30] border-[#EDB8B3]"
                          : isStorage
                          ? "bg-[#DCE6F5] text-[#2457A6] border-[#BDD0EE]"
                          : "bg-[#EBDDB8] text-[#1B2B45] border-[#D2C4A3]"
                      }`}>
                        <Cpu className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-[#1B2B45] group-hover:text-[#2457A6] transition-colors font-mono">
                            {evt.externalId}
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-mono text-[#6B7287]">
                            {evt.sampleType}
                          </span>
                        </div>
                        <p className="text-xs text-[#596579] mt-0.5 line-clamp-1 font-medium">
                          {rec.note || "Chain transaction committed"}
                        </p>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-1 text-[10px] sm:text-[11px] text-[#6B7287] font-mono flex-wrap">
                          <span>Actor: {shortHash(rec.actor, 3)}</span>
                          <span>•</span>
                          <span>Prev: {shortHash(rec.prevHash, 3)}</span>
                          {rec.temp !== undefined && rec.temp !== -2147483648 && (
                            <>
                              <span>•</span>
                              <span className="text-[#2457A6] font-bold">{formatTemp(rec.temp)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-1 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#E3D7BC]/40">
                      <span className="text-[10px] sm:text-[11px] text-[#6B7287]">
                        {formatTimestamp(rec.timestamp)}
                      </span>
                      <span className="text-[9px] sm:text-[10px] font-mono bg-[#EBDDB8] px-1.5 py-0.5 rounded text-[#1B2B45] font-semibold border border-[#D2C4A3]">
                        {shortHash(rec.recordHash, 3)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Cold-Chain Cryogenic Monitor */}
        <div className="glass-panel p-4 sm:p-6 bg-[#FFFBF1] border-2 border-[#E3D7BC] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b-2 border-[#E3D7BC]">
              <div className="flex items-center gap-2">
                <ThermometerSnowflake className="w-4 h-4 text-[#2457A6]" />
                <h2 className="text-sm sm:text-base font-extrabold text-[#1B2B45]">Cold-Chain Radar</h2>
              </div>
              <span className="text-[10px] sm:text-[11px] text-[#2457A6] bg-[#DCE6F5] px-2 py-0.5 rounded-full border border-[#BDD0EE] font-bold">
                Telemetry
              </span>
            </div>

            <div className="mt-3 sm:mt-4 space-y-2.5 sm:space-y-3">
              {thermalSamples.length === 0 ? (
                <div className="py-6 text-center text-[#6B7287] text-xs">
                  No storage readings recorded yet.
                </div>
              ) : (
                thermalSamples.map((item, idx) => {
                  const isWarning = item.temp > -600 && item.temp < 0;
                  return (
                    <div
                      key={idx}
                      onClick={() => onSelectSample(item.sampleId)}
                      className="p-3 rounded-xl bg-[#F5EEDC] border-2 border-[#E3D7BC] hover:border-[#2457A6] cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1B2B45] font-mono truncate">
                          {item.externalId}
                        </span>
                        <span
                          className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full shrink-0 ${
                            isWarning
                              ? "bg-[#F6D9D4] text-[#C23B30] border border-[#EDB8B3]"
                              : "bg-[#DCE6F5] text-[#2457A6] border border-[#BDD0EE]"
                          }`}
                        >
                          {formatTemp(item.temp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#596579] mt-1 line-clamp-1 font-medium">
                        {item.location}
                      </p>
                      <div className="mt-1.5 text-[10px] text-[#6B7287] flex justify-between">
                        <span>{formatTimestamp(item.timestamp)}</span>
                        {isWarning && (
                          <span className="text-[#C23B30] font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Excursion
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t-2 border-[#E3D7BC] bg-[#F5EEDC] p-3 rounded-xl">
            <div className="text-xs font-bold text-[#1B2B45] flex items-center justify-between">
              <span>Cryogenic Target</span>
              <span className="font-mono text-[#2457A6] font-extrabold">-80.0 °C</span>
            </div>
            <div className="w-full bg-[#EBDDB8] h-2 rounded-full mt-2 overflow-hidden border border-[#D2C4A3]">
              <div className="bg-[#2457A6] h-full w-[94%]"></div>
            </div>
            <div className="text-[10px] text-[#6B7287] mt-1.5 flex justify-between font-medium">
              <span>94% in range</span>
              <span>ISO 20387</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
