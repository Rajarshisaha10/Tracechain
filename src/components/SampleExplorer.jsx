import React, { useState } from "react";
import { motion } from "framer-motion";
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
  Layers,
  EyeOff
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
      const matchId = s.externalId?.toLowerCase().includes(q) || s.sampleId?.toLowerCase().includes(q) || s.blindId?.toLowerCase().includes(q);
      const matchType = s.sampleType?.toLowerCase().includes(q);
      const matchCustodian = s.custodian?.toLowerCase().includes(q);
      if (!matchId && !matchType && !matchCustodian) return false;
    }
    return true;
  });

  const getOrgName = (addr) => {
    return sandboxData.orgs?.[addr]?.name || shortHash(addr, 4);
  };

  const getTypeTheme = (type = "") => {
    const t = type.toLowerCase();
    if (t.includes("blood")) {
      return {
        pill: "bg-[#FFE4E6] text-[#991B1B] border-[#0A0A0A]",
        tag: "BLOOD / HEMATOLOGY"
      };
    }
    if (t.includes("rna") || t.includes("dna") || t.includes("genom")) {
      return {
        pill: "bg-[#E0F2FE] text-[#0369A1] border-[#0A0A0A]",
        tag: "NUCLEIC ACID / RNA"
      };
    }
    if (t.includes("biopsy") || t.includes("tissue")) {
      return {
        pill: "bg-[#FEF9C3] text-[#854D0E] border-[#0A0A0A]",
        tag: "BIOPSY / HISTOLOGY"
      };
    }
    if (t.includes("plasma") || t.includes("serum")) {
      return {
        pill: "bg-[#F3E8FF] text-[#6B21A8] border-[#0A0A0A]",
        tag: "PURIFIED PLASMA"
      };
    }
    return {
      pill: "bg-[#D7FB38] text-[#0A0A0A] border-[#0A0A0A]",
      tag: "CRYO SPECIMEN"
    };
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      
      {/* Search and Action Bar */}
      <div className="brutal-card p-3.5 sm:p-4 bg-[#FFFFFF] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search specimen barcode, blind testing ID, sample type, or custodian..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm brutal-input font-mono placeholder:text-[#A1A1AA]"
          />
        </div>

        {/* Filters and CTA */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-2.5 brutal-input font-bold cursor-pointer"
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
            className="text-xs py-2 px-2.5 brutal-input font-bold cursor-pointer"
          >
            <option value="all">Type: All</option>
            <option value="blood">Blood</option>
            <option value="biopsy">Biopsy</option>
            <option value="plasma">Plasma</option>
            <option value="rna">RNA / DNA</option>
          </select>

          <button
            onClick={onOpenRegister}
            className="brutal-btn brutal-btn-primary text-xs px-3.5 py-2 shrink-0 uppercase"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Register Specimen</span>
          </button>
        </div>

      </div>

      {/* Specimen Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full brutal-card p-10 text-center bg-[#FFFFFF]">
            <Layers className="w-8 h-8 text-[#71717A] mx-auto mb-2" />
            <p className="text-sm font-extrabold text-[#0A0A0A] uppercase font-mono">No specimens found</p>
            <p className="text-xs text-[#71717A] mt-1">
              Adjust your search keywords or register a new biological specimen.
            </p>
          </div>
        ) : (
          filtered.map((s, idx) => {
            const statusCfg = STATUS_CONFIG[s.status] || STATUS_CONFIG[0];
            const isChild = s.parentId && s.parentId !== "0x0000000000000000000000000000000000000000000000000000000000000000";
            const children = sandboxData.childrenMap?.[s.sampleId] || [];
            const typeTheme = getTypeTheme(s.sampleType);
            const hasAttestedReports = (sandboxData.attestedReports?.[s.sampleId] || []).length > 0;
            const hasDiscrepancy = (sandboxData.sampleDiscrepancyCases?.[s.sampleId] || []).length > 0;

            return (
              <motion.div
                key={s.sampleId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.25) }}
                whileHover={{ y: -4, x: -2 }}
                className="brutal-card bg-[#FFFFFF] flex flex-col justify-between overflow-hidden relative group"
              >
                {/* High-tech Cryptographic Laser Beam on Hover (Absolute positioning) */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="animate-laser" />
                </div>

                {/* Top Category Ribbon */}
                <div className="px-3.5 py-1.5 border-b-2 border-[#0A0A0A] bg-[#F7F8F4] flex items-center justify-between">
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${typeTheme.pill}`}>
                    {typeTheme.tag}
                  </span>
                  <div className="flex items-center gap-1">
                    {hasAttestedReports && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#FEF08A] border border-[#0A0A0A] text-[#0A0A0A]">
                        ATTESTED
                      </span>
                    )}
                    {hasDiscrepancy && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#FEF3C7] border border-[#D97706] text-[#92400E]">
                        DISCREPANCY
                      </span>
                    )}
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border border-[#0A0A0A] font-extrabold uppercase ${
                      s.status === 1 ? "bg-[#D7FB38] text-[#0A0A0A]" :
                      s.status === 2 ? "bg-[#38BDF8] text-[#0A0A0A]" :
                      s.status === 3 ? "bg-[#FF5A5F] text-white animate-pulse" :
                      "bg-[#F4F4F5] text-[#0A0A0A]"
                    }`}>
                      {statusCfg.label}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 sm:p-4 flex-1">
                  {/* Card Header: Barcode & Aliquot Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-base font-black text-[#0A0A0A] font-mono truncate">
                          {s.externalId}
                        </h3>
                        {s.blindId && (
                          <span className="text-[9px] font-mono bg-[#F7FEE7] text-[#365314] border border-[#0A0A0A] px-1.5 py-0.2 rounded font-extrabold uppercase flex items-center gap-1">
                            <EyeOff className="w-2.5 h-2.5" />
                            {s.blindId}
                          </span>
                        )}
                        {isChild && (
                          <span className="text-[9px] font-mono bg-[#FDE047] text-[#0A0A0A] border border-[#0A0A0A] px-1.5 py-0.2 rounded font-extrabold uppercase">
                            Aliquot
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#52525B] mt-0.5 font-bold truncate">
                        {s.sampleType}
                      </p>
                    </div>
                  </div>

                  {/* Metadata fields */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    
                    <div className="flex items-center justify-between py-1 border-b border-[#E5E7EB]">
                      <span className="text-[#52525B] flex items-center gap-1 text-[11px] font-semibold">
                        <Building className="w-3 h-3 text-[#0A0A0A]" /> Custodian:
                      </span>
                      <span className="font-bold text-[#0A0A0A] text-right truncate max-w-[150px]">
                        {getOrgName(s.custodian)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-[#E5E7EB]">
                      <span className="text-[#52525B] flex items-center gap-1 text-[11px] font-semibold">
                        <Calendar className="w-3 h-3 text-[#0A0A0A]" /> Collected:
                      </span>
                      <span className="text-[#0A0A0A] font-bold font-mono">
                        {formatTimestamp(s.collectedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-[#E5E7EB]">
                      <span className="text-[#52525B] text-[11px] font-semibold">Anchor:</span>
                      <span className="font-mono text-[#0A0A0A] font-black text-[11px] bg-[#F7F8F4] px-1.5 py-0.2 rounded border border-[#0A0A0A]">
                        {shortHash(s.headHash, 4)}
                      </span>
                    </div>

                    {children.length > 0 && (
                      <div className="flex items-center justify-between py-1 border-b border-[#E5E7EB]">
                        <span className="text-[#52525B] flex items-center gap-1 text-[11px] font-semibold">
                          <GitFork className="w-3 h-3 text-[#C084FC]" /> Child Aliquots:
                        </span>
                        <span className="font-mono text-[#0A0A0A] bg-[#F3E8FF] border border-[#0A0A0A] px-1.5 py-0.2 rounded text-[10px] font-bold">
                          {children.length} vials
                        </span>
                      </div>
                    )}

                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-2.5 bg-[#F7F8F4] border-t-2 border-[#0A0A0A] flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenQr(s)}
                      title="Print Cryo QR Barcode"
                      className="p-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F4F4F5] border border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenTransfer(s)}
                      title="Initiate Transfer Handoff"
                      className="p-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F4F4F5] border border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenStorage(s)}
                      title="Log Storage & Temperature"
                      className="p-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F4F4F5] border border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                    >
                      <Thermometer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenAliquot(s)}
                      title="Split Aliquot Child"
                      className="p-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F4F4F5] border border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
                    >
                      <GitFork className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectSample(s.sampleId)}
                    className="brutal-btn brutal-btn-primary text-xs px-2.5 py-1 font-mono uppercase"
                  >
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

              </motion.div>
            );
          })
        )}
      </div>

    </div>
  );
}
