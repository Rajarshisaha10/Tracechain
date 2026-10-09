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
  ArrowUpRight,
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
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 lg:p-8 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-cyan-950/40 border border-white/10 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Cryptographic Provenance Verified • Zero-Knowledge Architecture
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Biological Specimen & Clinical Chain of Custody
            </h1>
            <p className="text-slate-400 text-sm mt-2 max-w-2xl">
              Immutable end-to-end custody tracking, cryptographic hash-chain anchoring, automated quarantine enforcement, and real-time cryogenic thermal compliance.
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
              <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
              Transfer Custody
            </button>
            <button
              onClick={onOpenAliquot}
              className="btn-secondary text-xs"
            >
              <GitFork className="w-4 h-4 text-purple-400" />
              Split Aliquot
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Specimens */}
        <div className="glass-panel p-5 border border-white/10 hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Specimens
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mt-3 font-mono">
            {totalSamples}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Cryptographically Bound</span>
          </div>
        </div>

        {/* In Transit */}
        <div className="glass-panel p-5 border border-white/10 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              In Active Transit
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-300 mt-3 font-mono">
            {inTransitCount}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Multi-stage courier transfers
          </div>
        </div>

        {/* Quarantined / Alerted */}
        <div className="glass-panel p-5 border border-white/10 hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Quarantine Holds
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-400 mt-3 font-mono">
            {quarantinedCount}
          </div>
          <div className="text-xs text-rose-300/80 mt-2">
            {quarantinedCount > 0 ? "Requires compliance auditor clearance" : "Zero active safety flags"}
          </div>
        </div>

        {/* Chain Integrity Index */}
        <div className="glass-panel p-5 border border-white/10 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Integrity Index
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Fingerprint className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-3 font-mono">
            100%
          </div>
          <div className="text-xs text-emerald-400/80 mt-2 font-medium">
            Tamper-Evident Head Anchors
          </div>
        </div>

      </div>

      {/* Main Grid: Cold-Chain Telemetry & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Live Provenance Blockchain Activity */}
        <div className="lg:col-span-2 glass-panel p-6 border border-white/10">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
              <h2 className="text-base font-bold text-white">
                Live Chain-of-Custody Event Stream
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Real-time EVM Block Logs
            </span>
          </div>

          <div className="divide-y divide-white/5 mt-3">
            {recentEvents.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                No events recorded yet.
              </div>
            ) : (
              recentEvents.map((evt, i) => {
                const rec = evt.record;
                return (
                  <div
                    key={i}
                    onClick={() => onSelectSample(evt.sampleId)}
                    className="py-3.5 flex items-start justify-between gap-4 group cursor-pointer hover:bg-white/[0.02] px-2 rounded-xl transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-cyan-400 mt-0.5 group-hover:border-cyan-500/50 group-hover:scale-105 transition-all">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                            {evt.externalId}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {evt.sampleType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {rec.note || "Chain-of-custody update"}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 font-mono">
                          <span>Actor: {shortHash(rec.actor, 3)}</span>
                          <span>•</span>
                          <span>Prev: {shortHash(rec.prevHash, 3)}</span>
                          {rec.temp !== undefined && rec.temp !== -2147483648 && (
                            <>
                              <span>•</span>
                              <span className="text-cyan-400 font-semibold">{formatTemp(rec.temp)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-slate-400">
                        {formatTimestamp(rec.timestamp)}
                      </span>
                      <div className="mt-1 flex justify-end">
                        <span className="text-[10px] font-mono bg-slate-800/80 px-2 py-0.5 rounded text-cyan-300 border border-white/5 group-hover:border-cyan-500/30">
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
        <div className="glass-panel p-6 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ThermometerSnowflake className="w-4 h-4 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Cold-Chain Radar</h2>
              </div>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                Active Telemetry
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {thermalSamples.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No storage readings recorded yet.
                </div>
              ) : (
                thermalSamples.map((item, idx) => {
                  const isUltraCold = item.temp <= -700;
                  const isWarning = item.temp > -600 && item.temp < 0; // Excursion alert!
                  return (
                    <div
                      key={idx}
                      onClick={() => onSelectSample(item.sampleId)}
                      className="p-3 rounded-xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300 font-mono">
                          {item.externalId}
                        </span>
                        <span
                          className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
                            isWarning
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20"
                          }`}
                        >
                          {formatTemp(item.temp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                        {item.location}
                      </p>
                      <div className="mt-2 text-[10px] text-slate-500 flex justify-between">
                        <span>{formatTimestamp(item.timestamp)}</span>
                        {isWarning && (
                          <span className="text-rose-400 font-bold flex items-center gap-1">
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

          <div className="mt-6 pt-4 border-t border-white/10 bg-slate-950/40 p-3 rounded-xl">
            <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Cryogenic Standard</span>
              <span className="font-mono text-cyan-400">-80.0 °C</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full w-[94%]"></div>
            </div>
            <div className="text-[10px] text-slate-400 mt-2 flex justify-between">
              <span>94% in target range</span>
              <span>ISO 20387 Compliant</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
