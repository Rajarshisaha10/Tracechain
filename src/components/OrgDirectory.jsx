import React, { useState } from "react";
import { useChain } from "../context/ChainContext";
import { shortHash, ORG_TYPE_NAMES } from "../utils/formatters";
import {
  Building2,
  ShieldCheck,
  PlusCircle,
  Globe,
  Award,
  CheckCircle2
} from "lucide-react";

export default function OrgDirectory() {
  const { sandboxData, registerOrg } = useChain();
  const orgs = Object.values(sandboxData.orgs || {});

  const [newAddr, setNewAddr] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("1"); // Hospital
  const [newCountry, setNewCountry] = useState("US");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newAddr.trim() || !newName.trim()) return;
    try {
      setLoading(true);
      await registerOrg({
        address: newAddr.trim(),
        name: newName.trim(),
        orgType: newType,
        country: newCountry.trim(),
        accreditationHash: "0x" + "88".repeat(32),
      });
      setMsg(`Organization ${newName} successfully registered on the network!`);
      setNewAddr("");
      setNewName("");
      setLoading(false);
    } catch (err) {
      setMsg(err.message || "Failed to onboard organization");
      setLoading(false);
    }
  };

  const getOrgColor = (type) => {
    switch (Number(type)) {
      case 1: return { bg: "bg-[#FF70A6]", text: "text-white", label: "Hospital" };
      case 2: return { bg: "bg-[#22D3EE]", text: "text-[#162013]", label: "Biobank" };
      case 3: return { bg: "bg-[#FFE600]", text: "text-[#162013]", label: "Courier" };
      case 4: return { bg: "bg-[#C084FC]", text: "text-[#162013]", label: "Pharma / CRO" };
      case 5: return { bg: "bg-[#FF6B4A]", text: "text-white", label: "Regulatory" };
      default: return { bg: "bg-[#B4F000]", text: "text-[#162013]", label: "Certified Node" };
    }
  };

  return (
    <div className="space-y-6 sm:space-y-7 animate-fadeIn">
      
      {/* Banner - Multi-Color Neo-Brutalist Panel */}
      <div className="bg-[#FFFFFF] p-5 sm:p-6 border-[3px] border-[#162013] rounded-2xl shadow-[5px_5px_0px_#162013] flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        {/* Top color strip */}
        <div className="absolute top-0 left-0 right-0 h-2 flex">
          <div className="w-1/4 bg-[#B4F000]"></div>
          <div className="w-1/4 bg-[#22D3EE]"></div>
          <div className="w-1/4 bg-[#FFE600]"></div>
          <div className="w-1/4 bg-[#FF70A6]"></div>
        </div>

        <div className="mt-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded bg-[#B4F000] text-[#162013] border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013] -rotate-1">
              NETWORK REGISTRY
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#162013] flex items-center gap-2.5 font-display">
            <Building2 className="w-5 h-5 text-[#435E2F] shrink-0" />
            <span>Permissioned Network Participant Registry</span>
          </h2>
          <p className="text-xs text-[#33442E] mt-1 font-bold">
            Vetted healthcare systems, clinical laboratories, certified cryogenic couriers, and regulatory oversight bodies.
          </p>
        </div>

        <div className="sm:text-right pt-2.5 sm:pt-0 border-t-2 sm:border-t-0 border-[#162013] flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
          <span className="text-[10px] text-[#5D7057] font-mono font-black uppercase">Total Vetted Orgs:</span>
          <div className="text-base sm:text-lg font-black text-[#162013] font-mono bg-[#FFE600] px-3 py-1 rounded-xl border-2 border-[#162013] shadow-[2px_2px_0px_#162013] mt-1">
            {orgs.length} Active Nodes
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-[#EEFDC8] border-2 border-[#162013] text-[#162013] text-xs font-black flex items-center gap-2.5 shadow-[3px_3px_0px_#162013]">
          <CheckCircle2 className="w-4 h-4 text-[#435E2F] shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Grid: Directory Cards & Admin Onboarding */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Organizations List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-black text-[#162013] flex items-center gap-2 uppercase font-display tracking-tight">
            <ShieldCheck className="w-4 h-4 text-[#435E2F]" />
            Active Network Nodes & Facilities
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orgs.map((o) => {
              const typeCfg = getOrgColor(o.orgType);
              return (
                <div
                  key={o.address}
                  className="bg-[#FFFFFF] border-[2.5px] border-[#162013] rounded-2xl shadow-[4px_4px_0px_#162013] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5.5px_5.5px_0px_#162013] transition-all overflow-hidden flex flex-col justify-between"
                >
                  <div className={`px-4 py-2 border-b-2 border-[#162013] flex items-center justify-between ${typeCfg.bg}`}>
                    <span className={`text-[10px] font-black uppercase font-mono ${typeCfg.text}`}>
                      {typeCfg.label}
                    </span>
                    <span className="text-[10px] bg-[#FFFFFF] text-[#162013] border border-[#162013] px-2 py-0.2 rounded font-black font-mono shadow-[1px_1px_0px_#162013]">
                      {o.country || "GLOBAL"}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 space-y-3">
                    <div>
                      <h4 className="text-base font-black text-[#162013] line-clamp-1">{o.name}</h4>
                      <p className="text-[11px] font-mono text-[#5D7057] mt-0.5 truncate">
                        {shortHash(o.address, 6)}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-[#162013]/20 flex items-center justify-between text-[11px]">
                      <span className="text-[#5D7057] font-bold">Accreditation:</span>
                      <span className="font-mono text-[#162013] font-black bg-[#EAF2E5] px-1.5 py-0.5 rounded border border-[#162013]">
                        {shortHash(o.accreditationHash || "0x8888", 3)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Admin Onboarding Form */}
        <div className="bg-[#FFFFFF] border-[3px] border-[#162013] rounded-2xl shadow-[5px_5px_0px_#162013] overflow-hidden">
          <div className="bg-[#B4F000] px-5 py-3 border-b-2 border-[#162013] flex items-center justify-between">
            <h3 className="text-sm font-black text-[#162013] flex items-center gap-2 uppercase font-display tracking-tight">
              <PlusCircle className="w-4 h-4 text-[#162013]" />
              Onboard Organization
            </h3>
            <span className="text-[10px] text-[#162013] font-mono font-black bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border-2 border-[#162013] shadow-[1px_1px_0px_#162013]">
              Admin Only
            </span>
          </div>

          <form onSubmit={handleRegister} className="p-5 sm:p-6 space-y-4">
            <div>
              <label>Facility / Entity Name</label>
              <input
                type="text"
                placeholder="e.g. Johns Hopkins BioBank"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="bg-[#FFFFFF] border-2 border-[#162013] rounded-xl shadow-[2px_2px_0px_#162013] font-bold"
              />
            </div>

            <div>
              <label>Organization Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="text-sm font-bold bg-[#FFFFFF] border-2 border-[#162013] rounded-xl shadow-[2px_2px_0px_#162013]"
              >
                <option value="1">Hospital / Clinical Ward</option>
                <option value="2">Diagnostic Laboratory</option>
                <option value="3">Research Facility</option>
                <option value="4">Logistics Courier</option>
                <option value="5">Regulatory Auditor</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label>Country (ISO)</label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="US"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value.toUpperCase())}
                  required
                  className="bg-[#FFFFFF] border-2 border-[#162013] rounded-xl shadow-[2px_2px_0px_#162013] font-bold"
                />
              </div>
              <div>
                <label>Wallet Address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={newAddr}
                  onChange={(e) => setNewAddr(e.target.value)}
                  required
                  className="font-mono text-xs bg-[#FFFFFF] border-2 border-[#162013] rounded-xl shadow-[2px_2px_0px_#162013] font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-lime w-full text-xs py-3 mt-2 uppercase font-black"
            >
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>{loading ? "Registering Node..." : "Authorize & Onboard on Chain"}</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
