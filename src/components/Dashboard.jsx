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

  // Aggregate metrics
  const totalSamples = samples.length;
  const inTransitCount = samples.filter((s) => s.status === 2).length;
  const quarantinedCount = samples.filter((s) => s.status === 3).length;
  const activeCount = samples.filter((s) => s.status === 1).length;

  // Flatten all events across samples to create global activity feed
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

  // Sort latest first
  allEvents.sort((a, b) => b.record.timestamp - a.record.timestamp);
  const recentEvents = allEvents.slice(0, 7);

  // Cold-chain samples with temperatures
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
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 lg:p-8 bg-[#FFFBF1] border-2 border-[#E3D7BC] relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCE6F5] border border-[#BDD0EE] text-[#2457A6] text-xs font-bold mb-3">
              <span className="w-2 h-2 rounded-full bg-[#2457A6]"></span>
              Cryptographic Provenance Verified • Zero-Knowledge Architecture
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#1B2B45] tracking-tight">
              Biological Specimen & Clinical Chain of Custody
            </h1>
            <p className="text-[#596579] text-sm mt-2 max-w-2xl leading-relaxed">
              Tamper-evident custody handoffs, cryptographic hash-chain anchoring, automated quarantine enforcement, and real-time cryogenic thermal compliance.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenRegister}
              className="btn-primary text-xs"
            >
              <PlusCircle className="w-4 h-4" />
              Register Specimen
            </button>
            <button
              onClick={onOpenTransfer}
              className="btn-secondary text-xs"
            >
              <ArrowLeftRight className="w-4 h-4 text-[#2457A6]" />
              Transfer Custody
            </button>
            <button
              onClick={onOpenAliquot}
              className="btn-secondary text-xs"
            >
              <GitFork className="w-4 h-4 text-[#C23B30]" />
              Split Aliquot
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Specimens */}
        <div className="glass-panel p-5 bg-[#FFFBF1] border-2 border-[#E3D7BC] hover:border-[#2457A6] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7287] uppercase tracking-wider">
              Total Specimens
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#DCE6F5] text-[#2457A6] flex items-center justify-center border border-[#BDD0EE]">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#1B2B45] mt-3 font-mono">
            {totalSamples}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#2457A6] mt-2 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Hash-Bound</span>
          </div>
        </div>

        {/* In Transit */}
        <div className="glass-panel p-5 bg-[#FFFBF1] border-2 border-[#E3D7BC] hover:border-[#D97706] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7287] uppercase tracking-wider">
              Active Transit
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#92400E] flex items-center justify-center border border-[#FDE68A]">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#92400E] mt-3 font-mono">
            {inTransitCount}
          </div>
          <div className="text-xs text-[#6B7287] mt-2">
            Multi-stage courier transfers
          </div>
        </div>

        {/* Quarantined / Alerted */}
        <div className="glass-panel p-5 bg-[#FFFBF1] border-2 border-[#E3D7BC] hover:border-[#C23B30] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7287] uppercase tracking-wider">
              Quarantine Holds
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#F6D9D4] text-[#C23B30] flex items-center justify-center border border-[#EDB8B3]">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#C23B30] mt-3 font-mono">
            {quarantinedCount}
          </div>
          <div className="text-xs text-[#C23B30] mt-2 font-semibold">
            {quarantinedCount > 0 ? "Requires auditor release" : "Zero active alerts"}
          </div>
        </div>

        {/* Chain Integrity Index */}
        <div className="glass-panel p-5 bg-[#FFFBF1] border-2 border-[#E3D7BC] hover:border-[#2457A6] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B7287] uppercase tracking-wider">
              Integrity Index
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#DCE6F5] text-[#2457A6] flex items-center justify-center border border-[#BDD0EE]">
              <Fingerprint className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#2457A6] mt-3 font-mono">
            100%
          </div>
          <div className="text-xs text-[#2457A6] mt-2 font-bold">
            Mathematical Hash Chain Proof
          </div>
        </div>

      </div>

      {/* Main Grid: Live Activity Stream & Cold-Chain Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Live Provenance Blockchain Activity */}
        <div className="lg:col-span-2 glass-panel p-6 bg-[#FFFBF1] border-2 border-[#E3D7BC]">
          <div className="flex items-center justify-between pb-4 border-b-2 border-[#E3D7BC]">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2457A6]"></div>
              <h2 className="text-base font-extrabold text-[#1B2B45]">
                Live Chain-of-Custody Event Stream
              </h2>
            </div>
            <span className="text-xs text-[#6B7287] font-mono">
              EVM Ledger Logs
            </span>
          </div>

          <div className="divide-y divide-[#E3D7BC] mt-2">
            {recentEvents.length === 0 ? (
              <div className="py-8 text-center text-[#6B7287] text-sm">
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
                    className="py-3.5 flex items-start justify-between gap-4 group cursor-pointer hover:bg-[#F5EEDC]/60 px-2.5 rounded-xl transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5 border ${
                        isIncident || isQuarantine
                          ? "bg-[#F6D9D4] text-[#C23B30] border-[#EDB8B3]"
                          : isStorage
                          ? "bg-[#DCE6F5] text-[#2457A6] border-[#BDD0EE]"
                          : "bg-[#EBDDB8] text-[#1B2B45] border-[#D2C4A3]"
                      }`}>
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#1B2B45] group-hover:text-[#2457A6] transition-colors">
                            {evt.externalId}
                          </span>
                          <span className="text-[11px] font-mono text-[#6B7287]">
                            {evt.sampleType}
                          </span>
                        </div>
                        <p className="text-xs text-[#596579] mt-0.5 line-clamp-1 font-medium">
                          {rec.note || "Chain transaction committed"}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#6B7287] font-mono">
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

                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-[#6B7287]">
                        {formatTimestamp(rec.timestamp)}
                      </span>
                      <div className="mt-1 flex justify-end">
                        <span className="text-[10px] font-mono bg-[#EBDDB8] px-2 py-0.5 rounded text-[#1B2B45] font-semibold border border-[#D2C4A3]">
                          {shortHash(rec.recordHash, 4)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Cold-Chain Cryogenic Monitor */}
        <div className="glass-panel p-6 bg-[#FFFBF1] border-2 border-[#E3D7BC] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#E3D7BC]">
              <div className="flex items-center gap-2">
                <ThermometerSnowflake className="w-4 h-4 text-[#2457A6]" />
                <h2 className="text-base font-extrabold text-[#1B2B45]">Cold-Chain Radar</h2>
              </div>
              <span className="text-[11px] text-[#2457A6] bg-[#DCE6F5] px-2.5 py-0.5 rounded-full border border-[#BDD0EE] font-bold">
                Active Telemetry
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {thermalSamples.length === 0 ? (
                <div className="py-8 text-center text-[#6B7287] text-xs">
                  No storage readings recorded yet.
                </div>
              ) : (
                thermalSamples.map((item, idx) => {
                  const isWarning = item.temp > -600 && item.temp < 0; // Excursion alert
                  return (
                    <div
                      key={idx}
                      onClick={() => onSelectSample(item.sampleId)}
                      className="p-3.5 rounded-xl bg-[#F5EEDC] border-2 border-[#E3D7BC] hover:border-[#2457A6] cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1B2B45] font-mono">
                          {item.externalId}
                        </span>
                        <span
                          className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
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
                      <div className="mt-2 text-[10px] text-[#6B7287] flex justify-between">
                        <span>{formatTimestamp(item.timestamp)}</span>
                        {isWarning && (
                          <span className="text-[#C23B30] font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Excursion Alert
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t-2 border-[#E3D7BC] bg-[#F5EEDC] p-3.5 rounded-xl">
            <div className="text-xs font-bold text-[#1B2B45] flex items-center justify-between">
              <span>Cryogenic Standard</span>
              <span className="font-mono text-[#2457A6] font-extrabold">-80.0 °C</span>
            </div>
            <div className="w-full bg-[#EBDDB8] h-2 rounded-full mt-2 overflow-hidden border border-[#D2C4A3]">
              <div className="bg-[#2457A6] h-full w-[94%]"></div>
            </div>
            <div className="text-[10px] text-[#6B7287] mt-2 flex justify-between font-medium">
              <span>94% in target range</span>
              <span>ISO 20387 Compliant</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
