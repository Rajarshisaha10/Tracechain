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

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Banner */}
      <div className="glass-panel p-4 sm:p-6 bg-[#FFFBF1] border-2 border-[#E3D7BC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#1B2B45] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#2457A6] shrink-0" />
            <span>Permissioned Network Participant Registry</span>
          </h2>
          <p className="text-xs text-[#596579] mt-1 font-medium">
            Vetted healthcare systems, clinical laboratories, certified cryogenic couriers, and regulatory oversight bodies.
          </p>
        </div>
        <div className="sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E3D7BC] flex sm:flex-col justify-between sm:justify-start items-center sm:items-end">
          <span className="text-[11px] text-[#6B7287]">Total Vetted Orgs:</span>
          <div className="text-base sm:text-lg font-extrabold text-[#2457A6] font-mono">{orgs.length} Active</div>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-2xl bg-[#DCE6F5] border-2 border-[#BDD0EE] text-[#1B4385] text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#2457A6]" />
          {msg}
        </div>
      )}

      {/* Grid: Directory Cards & Admin Onboarding */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Organizations List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-extrabold text-[#1B2B45] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2457A6]" />
            Active Network Nodes & Facilities
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orgs.map((o) => {
              const typeName = ORG_TYPE_NAMES[o.orgType] || o.orgTypeName || "Participant";
              return (
                <div
                  key={o.address}
                  className="glass-panel p-5 bg-[#FFFBF1] border-2 border-[#E3D7BC] hover:border-[#2457A6] space-y-3 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-[#1B2B45] line-clamp-1">{o.name}</h4>
                      <span className="text-[11px] font-bold text-[#2457A6]">
                        {typeName}
                      </span>
                    </div>
                    <span className="text-[10px] bg-[#DCE6F5] text-[#2457A6] border border-[#BDD0EE] px-2 py-0.5 rounded-full font-bold uppercase">
                      ACTIVE
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#596579] pt-2 border-t border-[#E3D7BC] font-medium">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-[#2457A6]" /> Country:</span>
                      <span className="font-bold text-[#1B2B45]">{o.country || "GLOBAL"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Address:</span>
                      <span className="font-mono text-[#1B2B45] font-semibold">{shortHash(o.address, 4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1"><Award className="w-3 h-3 text-[#2457A6]" /> Accreditation:</span>
                      <span className="font-mono text-[#2457A6] text-[10px] font-bold">{shortHash(o.accreditationHash, 4)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Admin Onboarding Form */}
        <div className="glass-panel p-6 bg-[#FFFBF1] border-2 border-[#E3D7BC]">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#E3D7BC] mb-4">
            <h3 className="text-sm font-extrabold text-[#1B2B45] flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-[#2457A6]" />
              Onboard Organization
            </h3>
            <span className="text-[11px] text-[#6B7287] font-semibold">Admin Only</span>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label>Facility / Entity Name</label>
              <input
                type="text"
                placeholder="e.g. Johns Hopkins BioBank"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>

            <div>
              <label>Organization Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="text-sm font-bold"
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
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-xs py-2.5 mt-2"
            >
              {loading ? "Registering Node..." : "Authorize & Onboard on Chain"}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
