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
  Fingerprint,
  Radio,
  Zap,
  Sparkles,
  Flame,
  FileCheck2
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
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      
      {/* Top Banner - Multi-Color Neo-Brutalist Showcase Card */}
      <div className="bg-[#FFFFFF] p-5 sm:p-7 lg:p-8 border-[3px] border-[#162013] rounded-2xl shadow-[6px_6px_0px_#162013] relative overflow-hidden">
        {/* Multi-color brutalist geometric header bars */}
        <div className="absolute top-0 left-0 right-0 h-3 flex">
          <div className="flex-1 bg-[#435E2F]"></div>
          <div className="w-24 bg-[#B4F000]"></div>
          <div className="w-20 bg-[#FFE600]"></div>
          <div className="w-24 bg-[#FF70A6]"></div>
          <div className="w-20 bg-[#22D3EE]"></div>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mt-2">
          <div className="max-w-2xl">
            {/* Colorful Neo-Brut Sticker Badges */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#B4F000] text-[#162013] border-2 border-[#162013] shadow-[2px_2px_0px_#162013] text-xs font-black uppercase font-mono tracking-wide -rotate-1">
                <Zap className="w-3.5 h-3.5 fill-[#162013]" />
                IMMUTABLE EVM HASH-CHAIN
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#FFE600] text-[#162013] border-2 border-[#162013] shadow-[2px_2px_0px_#162013] text-xs font-black uppercase font-mono tracking-wide rotate-1">
                <Sparkles className="w-3.5 h-3.5" />
                ZERO-KNOWLEDGE PRIVACY
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#22D3EE] text-[#162013] border-2 border-[#162013] shadow-[2px_2px_0px_#162013] text-xs font-black uppercase font-mono tracking-wide">
                ❄️ -80°C CRYOGENIC
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#162013] tracking-tight leading-tight font-display">
              Biological Specimen & Clinical Chain of Custody
            </h1>
            <p className="text-[#33442E] text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed font-bold">
              Decentralized biological provenance registry. Cryptographic event anchoring, two-step custody dispatch, automated quarantine on damaged specimens, and liquid nitrogen temperature compliance.
            </p>
          </div>

          {/* Quick Action Buttons (Multi-Color Neo-Brutalist Palette) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={onOpenRegister}
              className="btn-lime text-xs w-full sm:w-auto uppercase font-black"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Register Specimen</span>
            </button>
            <button
              onClick={onOpenTransfer}
              className="btn-yellow text-xs w-full sm:w-auto uppercase font-black"
            >
              <ArrowLeftRight className="w-4 h-4 shrink-0" />
              <span>Transfer Custody</span>
            </button>
            <button
              onClick={onOpenAliquot}
              className="btn-pink text-xs w-full sm:w-auto uppercase font-black"
            >
              <GitFork className="w-4 h-4 shrink-0" />
              <span>Split Aliquot</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid - 4 Multi-Color Neo-Brutalist Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Specimens (Electric Lime Theme) */}
        <div className="bg-[#FFFFFF] border-[3px] border-[#162013] rounded-2xl shadow-[5px_5px_0px_#162013] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[7px_7px_0px_#162013] transition-all overflow-hidden flex flex-col justify-between group">
          <div className="bg-[#B4F000] px-3.5 py-1.5 border-b-2 border-[#162013] flex items-center justify-between">
            <span className="text-[10px] font-black text-[#162013] uppercase font-mono tracking-wider">
              TOTAL SPECIMENS
            </span>
            <span className="text-[9px] font-black font-mono bg-[#162013] text-[#B4F000] px-1.5 py-0.2 rounded uppercase">
              ACTIVE
            </span>
          </div>
          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#F7FEE7]/60 to-[#FFFFFF]">
            <div className="flex items-center justify-between">
              <div className="text-3xl sm:text-4xl font-black text-[#162013] font-mono">
                {totalSamples}
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#B4F000] text-[#162013] flex items-center justify-center border-2 border-[#162013] shadow-[2px_2px_0px_#162013]">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#162013] mt-3 font-black uppercase">
              <span className="px-2 py-0.5 rounded-md bg-[#B4F000] border-2 border-[#162013] shadow-[1px_1px_0px_#162013] flex items-center gap-1 text-[10px]">
                <CheckCircle2 className="w-3 h-3 text-[#162013] shrink-0" />
                100% Hash-Bound
              </span>
            </div>
          </div>
        </div>

        {/* In Transit (Canary Yellow Theme) */}
        <div className="bg-[#FFFFFF] border-[3px] border-[#162013] rounded-2xl shadow-[5px_5px_0px_#162013] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[7px_7px_0px_#162013] transition-all overflow-hidden flex flex-col justify-between group">
          <div className="bg-[#FFE600] px-3.5 py-1.5 border-b-2 border-[#162013] flex items-center justify-between">
            <span className="text-[10px] font-black text-[#162013] uppercase font-mono tracking-wider">
              IN TRANSIT
            </span>
            <span className="text-[9px] font-black font-mono bg-[#162013] text-[#FFE600] px-1.5 py-0.2 rounded uppercase">
              COURIER
            </span>
          </div>
          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#FEFCE8]/60 to-[#FFFFFF]">
            <div className="flex items-center justify-between">
              <div className="text-3xl sm:text-4xl font-black text-[#162013] font-mono">
                {inTransitCount}
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FFE600] text-[#162013] flex items-center justify-center border-2 border-[#162013] shadow-[2px_2px_0px_#162013]">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#162013] mt-3 font-black uppercase">
              <span className="px-2 py-0.5 rounded-md bg-[#FFE600] text-[#162013] border-2 border-[#162013] shadow-[1px_1px_0px_#162013] text-[10px]">
                GPS Cold-Chain
              </span>
            </div>
          </div>
        </div>

        {/* Quarantined (Coral Red Theme) */}
        <div className="bg-[#FFFFFF] border-[3px] border-[#162013] rounded-2xl shadow-[5px_5px_0px_#162013] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[7px_7px_0px_#162013] transition-all overflow-hidden flex flex-col justify-between group">
          <div className="bg-[#FF6B4A] px-3.5 py-1.5 border-b-2 border-[#162013] flex items-center justify-between">
            <span className="text-[10px] font-black text-[#FFFFFF] uppercase font-mono tracking-wider">
              QUARANTINE HOLD
            </span>
            <span className="text-[9px] font-black font-mono bg-[#162013] text-[#FF6B4A] px-1.5 py-0.2 rounded uppercase">
              21 CFR
            </span>
          </div>
          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#FFF1F2]/60 to-[#FFFFFF]">
            <div className="flex items-center justify-between">
              <div className="text-3xl sm:text-4xl font-black text-[#DC2626] font-mono">
                {quarantinedCount}
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FF6B4A] text-[#FFFFFF] flex items-center justify-center border-2 border-[#162013] shadow-[2px_2px_0px_#162013]">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#DC2626] mt-3 font-black uppercase">
              <span className="px-2 py-0.5 rounded-md bg-[#FFE4E6] text-[#DC2626] border-2 border-[#162013] shadow-[1px_1px_0px_#162013] text-[10px]">
                {quarantinedCount > 0 ? "Requires Audit Sign" : "Zero Alerts"}
              </span>
            </div>
          </div>
        </div>

        {/* Chain Integrity Index (Cyber Cyan Theme) */}
        <div className="bg-[#FFFFFF] border-[3px] border-[#162013] rounded-2xl shadow-[5px_5px_0px_#162013] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[7px_7px_0px_#162013] transition-all overflow-hidden flex flex-col justify-between group">
          <div className="bg-[#22D3EE] px-3.5 py-1.5 border-b-2 border-[#162013] flex items-center justify-between">
            <span className="text-[10px] font-black text-[#162013] uppercase font-mono tracking-wider">
              INTEGRITY INDEX
            </span>
            <span className="text-[9px] font-black font-mono bg-[#162013] text-[#22D3EE] px-1.5 py-0.2 rounded uppercase">
              KECCAK-256
            </span>
          </div>
          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-gradient-to-b from-[#ECFEFF]/60 to-[#FFFFFF]">
            <div className="flex items-center justify-between">
              <div className="text-3xl sm:text-4xl font-black text-[#162013] font-mono">
                100%
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#22D3EE] text-[#162013] flex items-center justify-center border-2 border-[#162013] shadow-[2px_2px_0px_#162013]">
                <Fingerprint className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#0369A1] mt-3 font-black uppercase">
              <span className="px-2 py-0.5 rounded-md bg-[#CFFAFE] text-[#0369A1] border-2 border-[#162013] shadow-[1px_1px_0px_#162013] text-[10px]">
                Cryptographically Sealed
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Grid: Live Activity Stream & Cold-Chain Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        
        {/* Left 2 Cols: Live Provenance Blockchain Activity */}
        <div className="lg:col-span-2 bg-[#FFFFFF] p-5 sm:p-6 border-[3px] border-[#162013] rounded-2xl shadow-[5px_5px_0px_#162013]">
          <div className="flex items-center justify-between pb-3.5 border-b-[2.5px] border-[#162013]">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded-full bg-[#B4F000] border-2 border-[#162013] shrink-0"></div>
              <h2 className="text-sm sm:text-base font-black text-[#162013] uppercase font-display tracking-tight">
                Live Provenance Ledger Stream
              </h2>
            </div>
            <span className="text-[11px] text-[#162013] font-mono bg-[#FFE600] px-2.5 py-0.5 rounded-full border-2 border-[#162013] font-black shadow-[1px_1px_0px_#162013]">
              EVM Tip Live
            </span>
          </div>

          <div className="divide-y-2 divide-[#162013] mt-2">
            {recentEvents.length === 0 ? (
              <div className="py-8 text-center text-[#5D7057] text-xs font-black font-mono">
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

                return (
                  <div
                    key={i}
                    onClick={() => onSelectSample(evt.sampleId)}
                    className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-4 group cursor-pointer hover:bg-[#F4F7F1] px-2.5 rounded-xl transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black mt-0.5 border-2 border-[#162013] shadow-[2px_2px_0px_#162013] shrink-0 ${
                        isIncident || isQuarantine
                          ? "bg-[#FF6B4A] text-white"
                          : isStorage
                          ? "bg-[#22D3EE] text-[#162013]"
                          : isTest
                          ? "bg-[#C084FC] text-[#162013]"
                          : isAliquot
                          ? "bg-[#FF70A6] text-white"
                          : "bg-[#B4F000] text-[#162013]"
                      }`}>
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-black text-[#162013] group-hover:text-[#435E2F] transition-colors font-mono">
                            {evt.externalId}
                          </span>
                          <span className="text-[10px] font-mono bg-[#EAF2E5] text-[#2A3D1D] px-2 py-0.2 rounded border border-[#162013] font-black">
                            {evt.sampleType}
                          </span>
                        </div>
                        <p className="text-xs text-[#162013] mt-0.5 line-clamp-1 font-bold">
                          {rec.note || "Chain transaction committed"}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#5D7057] font-mono font-bold flex-wrap">
                          <span>Actor: <strong className="text-[#162013]">{shortHash(rec.actor, 3)}</strong></span>
                          <span>•</span>
                          <span>Prev: <strong className="text-[#162013]">{shortHash(rec.prevHash, 3)}</strong></span>
                          {rec.temp !== undefined && rec.temp !== -2147483648 && (
                            <>
                              <span>•</span>
                              <span className="text-[#162013] bg-[#22D3EE] px-1.5 py-0.2 rounded border border-[#162013] font-black">
                                {formatTemp(rec.temp)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-1 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-[#162013]/20">
                      <span className="text-[10px] text-[#5D7057] font-mono font-bold">
                        {formatTimestamp(rec.timestamp)}
                      </span>
                      <span className="text-[10px] font-mono bg-[#FFFFFF] px-2 py-0.5 rounded text-[#162013] font-black border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013]">
                        {shortHash(rec.recordHash, 3)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Col: Cold-Chain Cryogenic Monitor (Ice Cyan + Yellow Highlights) */}
        <div className="bg-[#FFFFFF] p-5 sm:p-6 border-[3px] border-[#162013] rounded-2xl shadow-[5px_5px_0px_#162013] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b-[2.5px] border-[#162013]">
              <div className="flex items-center gap-2">
                <ThermometerSnowflake className="w-5 h-5 text-[#0284C7]" />
                <h2 className="text-sm sm:text-base font-black text-[#162013] uppercase font-display tracking-tight">
                  Cold-Chain Radar
                </h2>
              </div>
              <span className="text-[10px] text-[#162013] bg-[#22D3EE] px-2.5 py-0.5 rounded-full border-2 border-[#162013] font-black shadow-[1.5px_1.5px_0px_#162013]">
                -80°C CRYOGENIC
              </span>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {thermalSamples.length === 0 ? (
                <div className="py-6 text-center text-[#5D7057] text-xs font-mono font-bold">
                  No storage readings recorded yet.
                </div>
              ) : (
                thermalSamples.map((item, idx) => {
                  const isWarning = item.temp > -600 && item.temp < 0;
                  return (
                    <div
                      key={idx}
                      onClick={() => onSelectSample(item.sampleId)}
                      className="p-3 rounded-xl bg-[#F4F7F1] border-2 border-[#162013] hover:bg-[#EAF2E5] hover:shadow-[3px_3px_0px_#162013] hover:translate-x-[-1px] cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#162013] font-mono truncate">
                          {item.externalId}
                        </span>
                        <span
                          className={`text-xs font-black font-mono px-2 py-0.5 rounded-full border-2 border-[#162013] shadow-[1px_1px_0px_#162013] shrink-0 ${
                            isWarning
                              ? "bg-[#FF6B4A] text-white"
                              : "bg-[#22D3EE] text-[#162013]"
                          }`}
                        >
                          {formatTemp(item.temp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#33442E] mt-1 line-clamp-1 font-bold">
                        {item.location}
                      </p>
                      <div className="mt-1.5 text-[10px] text-[#5D7057] font-mono font-bold flex justify-between">
                        <span>{formatTimestamp(item.timestamp)}</span>
                        {isWarning && (
                          <span className="text-[#DC2626] font-black flex items-center gap-1">
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

          <div className="mt-5 pt-4 border-t-2 border-[#162013] bg-[#FEF9C3] p-3.5 rounded-xl border-2 border-[#162013] shadow-[2px_2px_0px_#162013]">
            <div className="text-xs font-black text-[#162013] flex items-center justify-between uppercase font-mono">
              <span>Cryogenic Target</span>
              <span className="text-[#0284C7] font-black bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#162013]">-80.0 °C</span>
            </div>
            <div className="w-full bg-[#FFFFFF] h-3 rounded-full mt-2 overflow-hidden border-2 border-[#162013]">
              <div className="bg-[#435E2F] h-full w-[94%] border-r-2 border-[#162013]"></div>
            </div>
            <div className="text-[10px] text-[#713F12] mt-1.5 flex justify-between font-mono font-black uppercase">
              <span>94% in range</span>
              <span>ISO 20387 Pass</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
