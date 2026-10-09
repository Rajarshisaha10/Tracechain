import React, { useState } from "react";
import { useChain } from "../context/ChainContext";
import { formatTimestamp, shortHash, STATUS_CONFIG } from "../utils/formatters";
import {
  Search,
  Filter,
  PlusCircle,
  QrCode,
  ArrowRight,
  GitFork,
  ArrowLeftRight,
  Thermometer,
  ShieldCheck,
  Building,
  Calendar
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

  // Filtered samples
  const filtered = samples.filter((s) => {
    // Status filter
    if (statusFilter !== "all" && s.status !== Number(statusFilter)) {
      return false;
    }
    // Type filter
    if (typeFilter !== "all" && !s.sampleType.toLowerCase().includes(typeFilter.toLowerCase())) {
      return false;
    }
    // Search query
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

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Search and Action Bar */}
      <div className="glass-panel p-5 border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Barcode, External ID, Specimen Type, or Custodian address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-auto text-xs py-2 px-3 bg-slate-900 border border-white/10 rounded-xl"
          >
            <option value="all">All Statuses</option>
            <option value="1">Active</option>
            <option value="2">In Transit</option>
            <option value="3">Quarantined</option>
            <option value="4">Consumed</option>
            <option value="5">Destroyed</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-auto text-xs py-2 px-3 bg-slate-900 border border-white/10 rounded-xl"
          >
            <option value="all">All Specimen Types</option>
            <option value="blood">Blood & Serum</option>
            <option value="biopsy">Tissue Biopsy</option>
            <option value="plasma">Plasma</option>
            <option value="rna">RNA / DNA</option>
          </select>

          {/* Register Button */}
          <button
            onClick={onOpenRegister}
            className="btn-primary text-xs shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            New Specimen
          </button>
        </div>

      </div>

      {/* Specimen Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full glass-panel py-16 text-center text-slate-400">
            <p className="text-base font-semibold">No specimens found</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search criteria or register a new specimen.
            </p>
          </div>
        ) : (
          filtered.map((s) => {
            const statusCfg = STATUS_CONFIG[s.status] || STATUS_CONFIG[0];
            const isChild = s.parentId && s.parentId !== "0x0000000000000000000000000000000000000000000000000000000000000000";
            const children = sandboxData.childrenMap?.[s.sampleId] || [];

            return (
              <div
                key={s.sampleId}
                className="glass-panel p-5 border border-white/10 hover:border-cyan-500/40 flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Card Header: Barcode & Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors font-mono">
                          {s.externalId}
                        </h3>
                        {isChild && (
                          <span className="text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded">
                            Aliquot
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {s.sampleType}
                      </p>
                    </div>

                    <span className={`badge-status ${statusCfg.color}`}>
                      <span className={`dot-indicator ${statusCfg.dot}`}></span>
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Metadata fields */}
                  <div className="mt-4 space-y-2 text-xs">
                    
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5" /> Custodian:
                      </span>
                      <span className="font-semibold text-slate-200 text-right truncate max-w-[160px]">
                        {getOrgName(s.custodian)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Collected:
                      </span>
                      <span className="text-slate-300">
                        {formatTimestamp(s.collectedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-slate-500">Hash Anchor:</span>
                      <span className="font-mono text-cyan-400/90 text-[11px]">
                        {shortHash(s.headHash, 4)}
                      </span>
                    </div>

                    {children.length > 0 && (
                      <div className="flex items-center justify-between py-1 border-b border-white/5">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <GitFork className="w-3.5 h-3.5 text-purple-400" /> Child Aliquots:
                        </span>
                        <span className="font-semibold text-purple-300">
                          {children.length} derived
                        </span>
                      </div>
                    )}

                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenQr(s)}
                      title="View Barcode / QR Code"
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-all border border-white/5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenTransfer(s)}
                      title="Initiate Transfer Handoff"
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-amber-400 transition-all border border-white/5"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenStorage(s)}
                      title="Log Storage & Temperature"
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-all border border-white/5"
                    >
                      <Thermometer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenAliquot(s)}
                      title="Split Aliquot Child"
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-purple-400 transition-all border border-white/5"
                    >
                      <GitFork className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectSample(s.sampleId)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-3 py-1.5 rounded-lg transition-all"
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
