import React, { useState } from "react";
import { useChain } from "../context/ChainContext";
import { shortHash, STATUS_CONFIG } from "../utils/formatters";
import {
  GitFork,
  Layers,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function AliquotManager({ onSelectSample }) {
  const { sandboxData, activeAccount, createAliquot } = useChain();
  const samples = Object.values(sandboxData.samples || {});
  const childrenMap = sandboxData.childrenMap || {};

  const [parentId, setParentId] = useState("");
  const [childLabel, setChildLabel] = useState("");
  const [childType, setChildType] = useState("Blood Plasma Aliquot");
  const [aliquotNote, setAliquotNote] = useState("Centrifuged 15 min at 2000g. 1.0 mL into sterile cryovial.");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ text: "", type: "" });

  const eligibleParents = samples.filter(
    (s) => s.status === 1 && s.custodian?.toLowerCase() === activeAccount.toLowerCase()
  );

  const parentSamplesWithChildren = samples.filter(
    (s) => childrenMap[s.sampleId] && childrenMap[s.sampleId].length > 0
  );

  const handleSplit = async (e) => {
    e.preventDefault();
    if (!parentId || !childLabel.trim()) {
      setFeedback({ text: "Please select parent specimen and enter a child barcode label.", type: "err" });
      return;
    }
    try {
      setLoading(true);
      setFeedback({ text: "", type: "" });
      await createAliquot({
        parentId,
        externalId: childLabel.trim(),
        sampleType: childType,
        note: aliquotNote.trim(),
      });
      setFeedback({
        text: `Child aliquot ${childLabel} minted successfully! Anchored to parent lineage.`,
        type: "ok"
      });
      setChildLabel("");
      setParentId("");
      setLoading(false);
    } catch (err) {
      setFeedback({ text: err.message || "Failed to split aliquot", type: "err" });
      setLoading(false);
    }
  };

  const getOrgName = (addr) => {
    return sandboxData.orgs[addr]?.name || shortHash(addr, 4);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Banner */}
      <div className="glass-panel p-6 bg-[#FFFBF1] border-2 border-[#E3D7BC] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#1B2B45] flex items-center gap-2">
            <GitFork className="w-5 h-5 text-[#C23B30]" />
            Specimen Fractionation & Aliquot Lineage
          </h2>
          <p className="text-xs text-[#596579] mt-1 font-medium">
            Derive child sub-samples (plasma, serum, buffy coat) with bidirectional cryptographic anchors to the primary specimen.
          </p>
        </div>
      </div>

      {feedback.text && (
        <div
          className={`p-4 rounded-2xl border-2 text-xs font-bold flex items-center gap-2 ${
            feedback.type === "ok"
              ? "bg-[#DCE6F5] border-[#BDD0EE] text-[#1B4385]"
              : "bg-[#F6D9D4] border-[#EDB8B3] text-[#9E2A20]"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-[#2457A6]" />
          {feedback.text}
        </div>
      )}

      {/* Grid: Lineage Trees & Split Wizard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Lineage Trees */}
        <div className="lg:col-span-2 glass-panel p-6 bg-[#FFFBF1] border-2 border-[#E3D7BC] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#E3D7BC]">
            <h3 className="text-sm font-extrabold text-[#1B2B45] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2457A6]" />
              Active Family Lineage Trees
            </h3>
            <span className="text-xs text-[#6B7287] font-semibold">Parent-to-Child Trees</span>
          </div>

          {parentSamplesWithChildren.length === 0 ? (
            <div className="py-12 text-center text-[#6B7287] text-xs font-medium">
              No aliquot trees generated yet. Use the wizard on the right to fractionate a specimen.
            </div>
          ) : (
            parentSamplesWithChildren.map((parent) => {
              const children = (childrenMap[parent.sampleId] || []).map(
                (cid) => sandboxData.samples[cid]
              ).filter(Boolean);

              return (
                <div
                  key={parent.sampleId}
                  className="p-5 rounded-2xl bg-[#F5EEDC] border-2 border-[#E3D7BC] space-y-4"
                >
                  {/* Parent Specimen Header Card */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#DCE6F5] text-[#2457A6] border border-[#BDD0EE]">
                          Root Primary
                        </span>
                        <h4
                          onClick={() => onSelectSample(parent.sampleId)}
                          className="font-extrabold text-base text-[#1B2B45] font-mono hover:text-[#2457A6] cursor-pointer"
                        >
                          {parent.externalId}
                        </h4>
                      </div>
                      <p className="text-xs text-[#596579] mt-1 font-medium">{parent.sampleType}</p>
                    </div>

                    <button
                      onClick={() => onSelectSample(parent.sampleId)}
                      className="text-xs text-[#2457A6] hover:underline flex items-center gap-1 font-bold"
                    >
                      Inspect Root <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Children Aliquots Branch Visualizer */}
                  <div className="pl-6 border-l-2 border-[#C23B30] space-y-3 relative ml-3">
                    {children.map((child) => (
                      <div
                        key={child.sampleId}
                        onClick={() => onSelectSample(child.sampleId)}
                        className="p-3.5 rounded-xl bg-[#FFFBF1] hover:bg-[#FFFFFF] border-2 border-[#E3D7BC] hover:border-[#2457A6] cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#C23B30]"></span>
                            <span className="font-extrabold text-xs text-[#1B2B45] font-mono">
                              {child.externalId}
                            </span>
                            <span className="text-[10px] text-[#6B7287] font-semibold">({child.sampleType})</span>
                          </div>
                          <div className="text-[11px] text-[#596579] mt-1">
                            Custodian: {getOrgName(child.custodian)} • Anchor: {shortHash(child.headHash, 4)}
                          </div>
                        </div>

                        <span className="text-[10px] font-mono font-bold text-[#C23B30] bg-[#F6D9D4] border border-[#EDB8B3] px-2.5 py-0.5 rounded-full">
                          {STATUS_CONFIG[child.status]?.label}
                        </span>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Right Col: Split Aliquot Wizard */}
        <div className="glass-panel p-6 bg-[#FFFBF1] border-2 border-[#E3D7BC]">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#E3D7BC]">
            <h3 className="text-sm font-extrabold text-[#1B2B45] flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-[#C23B30]" />
              Fractionate New Aliquot
            </h3>
            <span className="text-[11px] text-[#6B7287] font-semibold">Mint Child</span>
          </div>

          <form onSubmit={handleSplit} className="mt-4 space-y-4">
            
            <div>
              <label>Select Parent Specimen</label>
              {eligibleParents.length === 0 ? (
                <div className="text-xs text-[#92400E] bg-[#FEF3C7] p-3 rounded-xl border border-[#FDE68A] font-bold">
                  No active specimens available in your custody to fractionate.
                </div>
              ) : (
                <select
                  value={parentId}
                  onChange={(e) => {
                    setParentId(e.target.value);
                    const selected = sandboxData.samples[e.target.value];
                    if (selected) {
                      setChildLabel(`${selected.externalId}-AL-${Math.floor(1 + Math.random() * 9)}`);
                    }
                  }}
                  className="text-sm font-bold"
                  required
                >
                  <option value="">-- Choose parent specimen --</option>
                  {eligibleParents.map((s) => (
                    <option key={s.sampleId} value={s.sampleId}>
                      {s.externalId} ({s.sampleType})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label>Child Aliquot Barcode / Label</label>
              <input
                type="text"
                placeholder="e.g. TC-2026-AL-01"
                value={childLabel}
                onChange={(e) => setChildLabel(e.target.value)}
                required
                className="font-mono text-sm font-bold"
              />
            </div>

            <div>
              <label>Aliquot Fraction Type</label>
              <select
                value={childType}
                onChange={(e) => setChildType(e.target.value)}
                className="text-sm font-bold"
              >
                <option value="Blood Plasma Aliquot">Blood Plasma Aliquot</option>
                <option value="Serum Fraction">Serum Fraction</option>
                <option value="Buffy Coat (DNA Extract)">Buffy Coat (DNA Extract)</option>
                <option value="Cellular Pellets">Cellular Pellets</option>
                <option value="Purified RNA Extract">Purified RNA Extract</option>
              </select>
            </div>

            <div>
              <label>Centrifugation / Fraction Protocol Note</label>
              <textarea
                rows={2}
                value={aliquotNote}
                onChange={(e) => setAliquotNote(e.target.value)}
                placeholder="Speed, duration, target vial volume..."
              />
            </div>

            <button
              type="submit"
              disabled={loading || eligibleParents.length === 0}
              className="btn-primary w-full text-xs py-2.5 mt-2"
            >
              {loading ? "Fractionating on Chain..." : "Mint & Anchor Child Aliquot"}
            </button>

          </form>
        </div>

      </div>

    </div>
  );
}
