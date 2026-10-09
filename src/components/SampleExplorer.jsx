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

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      
      {/* Search and Action Bar */}
      <div className="glass-panel p-4 sm:p-5 bg-[#FFFBF1] border-2 border-[#E3D7BC] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#6B7287] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search barcode, specimen type, or custodian..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-sm bg-[#F5EEDC] text-[#1B2B45] border-2 border-[#E3D7BC] rounded-xl"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:w-auto text-xs py-2 px-3 bg-[#F5EEDC] border-2 border-[#E3D7BC] text-[#1B2B45] rounded-xl font-bold min-h-[42px]"
          >
            <option value="all">All Statuses</option>
            <option value="1">Active</option>
            <option value="2">In Transit</option>
            <option value="3">Quarantined</option>
            <option value="4">Consumed</option>
            <option value="5">Destroyed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex-1 sm:w-auto text-xs py-2 px-3 bg-[#F5EEDC] border-2 border-[#E3D7BC] text-[#1B2B45] rounded-xl font-bold min-h-[42px]"
          >
            <option value="all">All Types</option>
            <option value="blood">Blood</option>
            <option value="biopsy">Biopsy</option>
            <option value="plasma">Plasma</option>
            <option value="rna">RNA / DNA</option>
          </select>

          <button
            onClick={onOpenRegister}
            className="btn-primary text-xs w-full sm:w-auto shrink-0"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>New Specimen</span>
          </button>
        </div>

      </div>

      {/* Specimen Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full glass-panel py-12 text-center text-[#6B7287] bg-[#FFFBF1] border-2 border-[#E3D7BC]">
            <p className="text-base font-bold text-[#1B2B45]">No specimens found</p>
            <p className="text-xs text-[#6B7287] mt-1">
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
                className="glass-panel p-4.5 sm:p-5 bg-[#FFFBF1] border-2 border-[#E3D7BC] hover:border-[#2457A6] flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Card Header: Barcode & Status Badge */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-base font-extrabold text-[#1B2B45] group-hover:text-[#2457A6] transition-colors font-mono truncate">
                          {s.externalId}
                        </h3>
                        {isChild && (
                          <span className="text-[10px] font-mono bg-[#EBDDB8] text-[#1B2B45] border border-[#D2C4A3] px-1.5 py-0.5 rounded font-bold">
                            Aliquot
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#596579] font-medium mt-0.5 truncate">
                        {s.sampleType}
                      </p>
                    </div>

                    <span className={`badge-status ${statusCfg.color} shrink-0`}>
                      <span className={`dot-indicator ${statusCfg.dot}`}></span>
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Metadata fields */}
                  <div className="mt-3.5 space-y-2 text-xs">
                    
                    <div className="flex items-center justify-between py-1 border-b border-[#E3D7BC]">
                      <span className="text-[#6B7287] flex items-center gap-1.5 font-medium">
                        <Building className="w-3.5 h-3.5" /> Custodian:
                      </span>
                      <span className="font-bold text-[#1B2B45] text-right truncate max-w-[140px] sm:max-w-[160px]">
                        {getOrgName(s.custodian)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-[#E3D7BC]">
                      <span className="text-[#6B7287] flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5" /> Collected:
                      </span>
                      <span className="text-[#1B2B45] font-semibold">
                        {formatTimestamp(s.collectedAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-[#E3D7BC]">
                      <span className="text-[#6B7287] font-medium">Hash Anchor:</span>
                      <span className="font-mono text-[#2457A6] font-bold text-[11px] bg-[#DCE6F5] px-1.5 py-0.5 rounded">
                        {shortHash(s.headHash, 4)}
                      </span>
                    </div>

                    {children.length > 0 && (
                      <div className="flex items-center justify-between py-1 border-b border-[#E3D7BC]">
                        <span className="text-[#6B7287] flex items-center gap-1.5 font-medium">
                          <GitFork className="w-3.5 h-3.5 text-[#C23B30]" /> Aliquots:
                        </span>
                        <span className="font-bold text-[#C23B30]">
                          {children.length} derived
                        </span>
                      </div>
                    )}

                  </div>
                </div>

                {/* Card Footer Actions - Touch-friendly */}
                <div className="mt-4 pt-3 border-t-2 border-[#E3D7BC] flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenQr(s)}
                      title="View Barcode / QR Code"
                      className="p-2 rounded-xl bg-[#F5EEDC] hover:bg-[#EBDDB8] text-[#1B2B45] transition-all border border-[#E3D7BC] min-h-[38px] min-w-[38px] flex items-center justify-center"
                    >
                      <QrCode className="w-3.5 h-3.5 text-[#2457A6]" />
                    </button>
                    <button
                      onClick={() => onOpenTransfer(s)}
                      title="Initiate Transfer Handoff"
                      className="p-2 rounded-xl bg-[#F5EEDC] hover:bg-[#EBDDB8] text-[#1B2B45] transition-all border border-[#E3D7BC] min-h-[38px] min-w-[38px] flex items-center justify-center"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-[#2457A6]" />
                    </button>
                    <button
                      onClick={() => onOpenStorage(s)}
                      title="Log Storage & Temperature"
                      className="p-2 rounded-xl bg-[#F5EEDC] hover:bg-[#EBDDB8] text-[#1B2B45] transition-all border border-[#E3D7BC] min-h-[38px] min-w-[38px] flex items-center justify-center"
                    >
                      <Thermometer className="w-3.5 h-3.5 text-[#2457A6]" />
                    </button>
                    <button
                      onClick={() => onOpenAliquot(s)}
                      title="Split Aliquot Child"
                      className="p-2 rounded-xl bg-[#F5EEDC] hover:bg-[#EBDDB8] text-[#1B2B45] transition-all border border-[#E3D7BC] min-h-[38px] min-w-[38px] flex items-center justify-center"
                    >
                      <GitFork className="w-3.5 h-3.5 text-[#C23B30]" />
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectSample(s.sampleId)}
                    className="flex items-center gap-1 text-xs font-bold text-[#2457A6] hover:text-white bg-[#DCE6F5] hover:bg-[#2457A6] border border-[#BDD0EE] px-3 py-1.5 rounded-xl transition-all min-h-[38px]"
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
