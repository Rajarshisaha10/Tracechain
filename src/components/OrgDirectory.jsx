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

  const getOrgTheme = (type) => {
    switch (Number(type)) {
      case 1: return { pill: "bg-[#FFE4E6] text-[#991B1B]", label: "Hospital" };
      case 2: return { pill: "bg-[#E0F2FE] text-[#0369A1]", label: "Diagnostic Lab" };
      case 3: return { pill: "bg-[#F3E8FF] text-[#6B21A8]", label: "Research Institute" };
      case 4: return { pill: "bg-[#FEF9C3] text-[#854D0E]", label: "Cold-Chain Courier" };
      case 5: return { pill: "bg-[#D7FB38] text-[#0A0A0A]", label: "Compliance Auditor" };
      default: return { pill: "bg-[#F4F4F5] text-[#0A0A0A]", label: "Certified Node" };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn">
      
      {/* Banner */}
      <div className="brutal-card p-4 sm:p-5 bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="brutal-pill bg-[#D7FB38] text-[10px]">
              NETWORK REGISTRY
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0A0A0A] flex items-center gap-2 font-display">
            <Building2 className="w-5 h-5 text-[#0A0A0A] shrink-0" />
            <span>Permissioned Participant Directory</span>
          </h2>
          <p className="text-xs text-[#52525B] mt-0.5 font-medium">
            Vetted healthcare systems, clinical laboratories, certified cryogenic couriers, and regulatory oversight bodies.
          </p>
        </div>

        <div className="sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-[#0A0A0A]/20 flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
          <span className="text-[10px] text-[#52525B] font-mono uppercase font-bold">Total Vetted Orgs:</span>
          <div className="text-sm font-black text-[#0A0A0A] font-mono bg-[#D7FB38] border border-[#0A0A0A] px-2.5 py-0.5 rounded-lg mt-0.5 shadow-[1px_1px_0px_#0A0A0A]">
            {orgs.length} Active Nodes
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-[#D7FB38] border-2 border-[#0A0A0A] text-[#0A0A0A] text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#0A0A0A] animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#0A0A0A] shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Grid: Directory Cards & Admin Onboarding */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Left 2 Cols: Organizations List */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs sm:text-sm font-black text-[#0A0A0A] flex items-center gap-1.5 uppercase font-display">
            <ShieldCheck className="w-4 h-4 text-[#0A0A0A]" />
            <span>Active Network Nodes & Facilities</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {orgs.map((o) => {
              const typeCfg = getOrgTheme(o.orgType);
              return (
                <div
                  key={o.address}
                  className="brutal-card bg-[#FFFFFF] overflow-hidden flex flex-col justify-between brutal-interactive"
                >
                  <div className="px-3.5 py-1.5 bg-[#F7F8F4] border-b-2 border-[#0A0A0A] flex items-center justify-between">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-[#0A0A0A] ${typeCfg.pill}`}>
                      {typeCfg.label}
                    </span>
                    <span className="text-[9px] bg-[#FFFFFF] text-[#0A0A0A] border border-[#0A0A0A] px-1.5 py-0.2 rounded font-mono font-bold">
                      {o.country || "GLOBAL"}
                    </span>
                  </div>

                  <div className="p-3.5 sm:p-4 space-y-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#10B981] border border-[#0A0A0A] shrink-0 animate-pulse"></span>
                        <h4 className="text-sm sm:text-base font-black text-[#0A0A0A] line-clamp-1">{o.name}</h4>
                      </div>
                      <p className="text-xs font-mono text-[#52525B] mt-1 truncate">
                        {shortHash(o.address, 5)}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                      <span className="text-[#52525B] font-semibold text-[11px]">Accreditation:</span>
                      <span className="font-mono text-[#0A0A0A] bg-[#F7F8F4] px-1.5 py-0.2 rounded border border-[#0A0A0A] text-[10px] font-bold">
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
        <div className="brutal-card bg-[#FFFFFF] overflow-hidden">
          <div className="bg-[#F7F8F4] px-4 py-2.5 border-b-2 border-[#0A0A0A] flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-[#0A0A0A] flex items-center gap-1.5 uppercase font-display tracking-tight">
              <PlusCircle className="w-4 h-4 text-[#0A0A0A]" />
              <span>Onboard Organization</span>
            </h3>
            <span className="brutal-pill bg-[#D7FB38] text-[9px]">
              Admin Only
            </span>
          </div>

          <form onSubmit={handleRegister} className="p-4 sm:p-5 space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Facility Name</label>
              <input
                type="text"
                placeholder="e.g. Johns Hopkins BioBank"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full text-xs sm:text-sm brutal-input p-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Organization Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full text-xs sm:text-sm brutal-input p-2 font-mono font-bold"
              >
                <option value="1">Hospital / Clinical Ward</option>
                <option value="2">Diagnostic Laboratory</option>
                <option value="3">Research Facility</option>
                <option value="4">Logistics Courier</option>
                <option value="5">Regulatory Auditor</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Country (ISO)</label>
                <input
                  type="text"
                  maxLength={2}
                  placeholder="US"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value.toUpperCase())}
                  required
                  className="w-full text-xs sm:text-sm brutal-input p-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Wallet Address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={newAddr}
                  onChange={(e) => setNewAddr(e.target.value)}
                  required
                  className="w-full text-xs sm:text-sm brutal-input p-2 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="brutal-btn brutal-btn-primary w-full text-xs py-2.5 uppercase font-bold mt-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{loading ? "Registering..." : "Authorize on Chain"}</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
