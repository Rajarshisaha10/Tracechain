import React, { useState } from "react";
import { useChain } from "../context/ChainContext";
import { formatTimestamp, shortHash, STATUS_CONFIG } from "../utils/formatters";
import {
  Search,
  PlusCircle,
  QrCode,
  ArrowRight,
  GitFork,
  ArrowLeftRight,
  Thermometer,
  Building,
  Calendar,
  Filter
} from "lucide-react";

export default function SampleExplorer({
  onSelectSample,
  onOpenRegister,
  onOpenTransfer,
  onOpenAliquot,
  onOpenStorage,
  onOpenQr
}) {
  const { sandboxData } = useChain();
  const samples = Object.values(sandboxData.samples || {});

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = samples.filter((s) => {
    if (statusFilter !== "all" && s.status !== Number(statusFilter)) {
      return false;
    }
    if (typeFilter !== "all" && !s.sampleType.toLowerCase().includes(typeFilter.toLowerCase())) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = s.externalId?.toLowerCase().includes(q) || s.sampleId?.toLowerCase().includes(q);
      const matchType = s.sampleType?.toLowerCase().includes(q);
      const matchCustodian = s.custodian?.toLowerCase().includes(q);
      if (!matchId && !matchType && !matchCustodian) return false;
    }
    return true;
  });

  const getOrgName = (addr) => {
    return sandboxData.orgs[addr]?.name || shortHash(addr, 4);
  };

  const getTypeColor = (type = "") => {
    const t = type.toLowerCase();
    if (t.includes("blood")) {
      return {
        badge: "bg-[#FF70A6] text-white",
        bar: "bg-[#FF70A6]",
        light: "bg-[#FFF1F2]",
        tag: "BLOOD / HEMATOLOGY"
      };
    }
    if (t.includes("rna") || t.includes("dna") || t.includes("genom")) {
      return {
        badge: "bg-[#22D3EE] text-[#162013]",
        bar: "bg-[#22D3EE]",
        light: "bg-[#ECFEFF]",
        tag: "NUCLEIC ACID / RNA"
      };
    }
    if (t.includes("biopsy") || t.includes("tissue")) {
      return {
        badge: "bg-[#FFE600] text-[#162013]",
        bar: "bg-[#FFE600]",
        light: "bg-[#FEFCE8]",
        tag: "BIOPSY / HISTOLOGY"
      };
    }
    if (t.includes("plasma") || t.includes("serum")) {
      return {
        badge: "bg-[#C084FC] text-[#162013]",
        bar: "bg-[#C084FC]",
        light: "bg-[#FAF5FF]",
        tag: "PURIFIED PLASMA"
      };
    }
    return {
      badge: "bg-[#B4F000] text-[#162013]",
      bar: "bg-[#B4F000]",
      light: "bg-[#F7FEE7]",
      tag: "CRYO SPECIMEN"
    };
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      
      {/* Search and Action Bar - Neo-Brutalist Multi-Color Panel */}
      <div className="bg-[#FFFFFF] p-4 sm:p-5 border-[3px] border-[#162013] rounded-2xl shadow-[5px_5px_0px_#162013] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 relative overflow-hidden">
        
        {/* Top colored strip */}
        <div className="absolute top-0 left-0 right-0 h-2 flex">
          <div className="w-1/4 bg-[#B4F000]"></div>
          <div className="w-1/4 bg-[#FFE600]"></div>
          <div className="w-1/4 bg-[#22D3EE]"></div>
          <div className="w-1/4 bg-[#FF70A6]"></div>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 mt-1">
          <Search className="w-4 h-4 text-[#5D7057] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search specimen barcode, type, or custodian..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-sm bg-[#FFFFFF] text-[#162013] border-2 border-[#162013] rounded-xl font-bold placeholder:text-[#8B9D85] shadow-[2px_2px_0px_#162013]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 mt-1">
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:w-auto text-xs py-2 px-3 bg-[#FFFFFF] border-2 border-[#162013] text-[#162013] rounded-xl font-black min-h-[42px] cursor-pointer shadow-[2.5px_2.5px_0px_#162013]"
          >
            <option value="all">Status: All</option>
            <option value="1">Active</option>
            <option value="2">In Transit</option>
            <option value="3">Quarantined</option>
            <option value="4">Consumed</option>
            <option value="5">Destroyed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex-1 sm:w-auto text-xs py-2 px-3 bg-[#FFFFFF] border-2 border-[#162013] text-[#162013] rounded-xl font-black min-h-[42px] cursor-pointer shadow-[2.5px_2.5px_0px_#162013]"
          >
            <option value="all">Type: All</option>
            <option value="blood">Blood</option>
            <option value="biopsy">Biopsy</option>
            <option value="plasma">Plasma</option>
            <option value="rna">RNA / DNA</option>
          </select>

          <button
            onClick={onOpenRegister}
            className="btn-lime text-xs w-full sm:w-auto shrink-0 uppercase font-black"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Register Specimen</span>
          </button>
        </div>

      </div>

      {/* Specimen Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-[#FFFFFF] p-10 text-center border-[3px] border-[#162013] rounded-2xl shadow-[5px_5px_0px_#162013]">
            <p className="text-base font-extrabold text-[#162013] uppercase font-mono">No specimens found</p>
            <p className="text-xs text-[#5D7057] mt-1 font-bold">
              Adjust your search keywords or register a new biological specimen.
            </p>
          </div>
        ) : (
          filtered.map((s) => {
            const statusCfg = STATUS_CONFIG[s.status] || STATUS_CONFIG[0];
            const isChild = s.parentId && s.parentId !== "0x0000000000000000000000000000000000000000000000000000000000000000";
            const children = sandboxData.childrenMap?.[s.sampleId] || [];
            const typeTheme = getTypeColor(s.sampleType);

            return (
              <div
                key={s.sampleId}
                className="bg-[#FFFFFF] border-[3px] border-[#162013] rounded-2xl shadow-[4.5px_4.5px_0px_#162013] hover:translate-x-[-1.5px] hover:translate-y-[-1.5px] hover:shadow-[6.5px_6.5px_0px_#162013] flex flex-col justify-between transition-all group overflow-hidden"
              >
                {/* Colorful Neo-Brutalist Top Category Banner */}
                <div className={`px-4 py-2 border-b-2 border-[#162013] flex items-center justify-between ${typeTheme.bar}`}>
                  <span className="text-[10px] font-black tracking-wider uppercase font-mono text-[#162013] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#162013]"></span>
                    {typeTheme.tag}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border-2 border-[#162013] shadow-[1px_1px_0px_#162013] font-black uppercase ${
                    s.status === 1 ? "bg-[#FFFFFF] text-[#162013]" :
                    s.status === 2 ? "bg-[#FFE600] text-[#162013]" :
                    s.status === 3 ? "bg-[#FF6B4A] text-[#FFFFFF]" :
                    "bg-[#FFFFFF] text-[#162013]"
                  }`}>
                    {statusCfg.label}
                  </span>
                </div>

                <div className="p-4 sm:p-5">
                  {/* Card Header: Barcode & Aliquot Pill */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base sm:text-lg font-black text-[#162013] group-hover:text-[#435E2F] transition-colors font-mono truncate">
                          {s.externalId}
                        </h3>
                        {isChild && (
                          <span className="text-[10px] font-mono bg-[#FFE600] text-[#162013] border-2 border-[#162013] px-2 py-0.2 rounded font-black uppercase shadow-[1.5px_1.5px_0px_#162013] -rotate-1">
                            Aliquot
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#33442E] font-bold mt-0.5 truncate uppercase tracking-wider">
                        {s.sampleType}
                      </p>
                    </div>
                  </div>

                  {/* Metadata fields */}
                  <div className="mt-4 space-y-2 text-xs">
                    
                    <div className="flex items-center justify-between py-1.5 border-b border-[#162013]/20">
                      <span className="text-[#5D7057] flex items-center gap-1.5 font-bold uppercase text-[11px]">
                        <Building className="w-3.5 h-3.5 text-[#435E2F]" /> Custodian:
                      </span>
                      <span className="font-black text-[#162013] text-right truncate max-w-[150px]">
                        {getOrgName(s.custodian)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-[#162013]/20">
                      <span className="text-[#5D7057] flex items-center gap-1.5 font-bold uppercase text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-[#435E2F]" /> Collected:
                      </span>
                      <span className="text-[#162013] font-bold font-mono">
                        {formatTimestamp(s.collectedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 border-b border-[#162013]/20">
                      <span className="text-[#5D7057] font-bold uppercase text-[11px]">Hash Anchor:</span>
                      <span className="font-mono text-[#162013] font-black text-[11px] bg-[#EAF2E5] px-2 py-0.5 rounded border border-[#162013] shadow-[1px_1px_0px_#162013]">
                        {shortHash(s.headHash, 4)}
                      </span>
                    </div>

                    {children.length > 0 && (
                      <div className="flex items-center justify-between py-1.5 border-b border-[#162013]/20">
                        <span className="text-[#5D7057] flex items-center gap-1.5 font-bold uppercase text-[11px]">
                          <GitFork className="w-3.5 h-3.5 text-[#FF70A6]" /> Derived Aliquots:
                        </span>
                        <span className="font-black text-[#162013] bg-[#FCE7F3] px-2 py-0.5 rounded border border-[#162013] font-mono shadow-[1px_1px_0px_#162013]">
                          {children.length} vials
                        </span>
                      </div>
                    )}

                  </div>
                </div>

                {/* Card Footer Actions - Multi-Color Tactile Neo-Brutalist Buttons */}
                <div className="p-3 bg-[#F4F7F1] border-t-2 border-[#162013] flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenQr(s)}
                      title="Print Cryo QR Barcode"
                      className="p-2 rounded-xl bg-[#FFE600] text-[#162013] hover:bg-[#FACC15] transition-all border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013] active:translate-x-0.5 active:translate-y-0.5 min-h-[36px] min-w-[36px] flex items-center justify-center font-bold"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenTransfer(s)}
                      title="Initiate Transfer Handoff"
                      className="p-2 rounded-xl bg-[#B4F000] text-[#162013] hover:bg-[#A3E635] transition-all border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013] active:translate-x-0.5 active:translate-y-0.5 min-h-[36px] min-w-[36px] flex items-center justify-center font-bold"
                    >
                      <ArrowLeftRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenStorage(s)}
                      title="Log Storage & Temperature"
                      className="p-2 rounded-xl bg-[#22D3EE] text-[#162013] hover:bg-[#38BDF8] transition-all border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013] active:translate-x-0.5 active:translate-y-0.5 min-h-[36px] min-w-[36px] flex items-center justify-center font-bold"
                    >
                      <Thermometer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenAliquot(s)}
                      title="Split Aliquot Child"
                      className="p-2 rounded-xl bg-[#FF70A6] text-white hover:bg-[#F43F5E] transition-all border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013] active:translate-x-0.5 active:translate-y-0.5 min-h-[36px] min-w-[36px] flex items-center justify-center font-bold"
                    >
                      <GitFork className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectSample(s.sampleId)}
                    className="flex items-center gap-1.5 text-xs font-black text-[#162013] bg-[#FFFFFF] hover:bg-[#B4F000] border-2 border-[#162013] px-3.5 py-1.5 rounded-xl shadow-[2px_2px_0px_#162013] hover:shadow-[3px_3px_0px_#162013] active:translate-x-0.5 active:translate-y-0.5 transition-all min-h-[36px] uppercase tracking-wider font-mono"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
