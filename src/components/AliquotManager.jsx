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
    <div className="space-y-4 sm:space-y-5 animate-fadeIn">
      
      {/* Banner */}
      <div className="brutal-card p-4 sm:p-5 bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="brutal-pill bg-[#C084FC] text-[10px]">
              FRACTIONATION & LINEAGE
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0A0A0A] flex items-center gap-2 font-display">
            <GitFork className="w-5 h-5 text-[#C084FC] shrink-0" />
            <span>Specimen Fractionation & Aliquot Lineage</span>
          </h2>
          <p className="text-xs text-[#52525B] mt-0.5 font-medium">
            Derive child sub-samples (plasma, serum, buffy coat) with bidirectional cryptographic anchors to the root specimen.
          </p>
        </div>
      </div>

      {feedback.text && (
        <div
          className={`p-3 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#0A0A0A] animate-fadeIn ${
            feedback.type === "ok"
              ? "bg-[#D7FB38] text-[#0A0A0A]"
              : "bg-[#FF5A5F] text-white"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0A0A0A]" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Grid: Lineage Trees & Split Wizard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* Left 2 Cols: Lineage Trees */}
        <div className="lg:col-span-2 brutal-card bg-[#FFFFFF] overflow-hidden">
          <div className="bg-[#F7F8F4] px-4 py-2.5 border-b-2 border-[#0A0A0A] flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-[#0A0A0A] flex items-center gap-1.5 uppercase font-display tracking-tight">
              <Layers className="w-4 h-4 text-[#C084FC]" />
              <span>Active Family Lineage Trees</span>
            </h3>
            <span className="brutal-pill bg-[#C084FC] text-[9px]">
              Parent-to-Child
            </span>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {parentSamplesWithChildren.length === 0 ? (
              <div className="py-10 text-center text-[#71717A] text-xs font-mono">
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
                    className="p-3.5 sm:p-4 rounded-xl bg-[#F7F8F4] border-2 border-[#0A0A0A] shadow-[2.5px_2.5px_0px_#0A0A0A] space-y-3"
                  >
                    {/* Parent Specimen Header Card */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="brutal-pill bg-[#D7FB38] text-[9px]">
                            Root Primary
                          </span>
                          <h4
                            onClick={() => onSelectSample(parent.sampleId)}
                            className="font-black text-sm sm:text-base text-[#0A0A0A] font-mono hover:underline cursor-pointer"
                          >
                            {parent.externalId}
                          </h4>
                        </div>
                        <p className="text-xs text-[#52525B] font-bold mt-0.5">{parent.sampleType}</p>
                      </div>

                      <button
                        onClick={() => onSelectSample(parent.sampleId)}
                        className="brutal-btn brutal-btn-secondary text-[11px] py-1 px-2.5 font-mono"
                      >
                        <span>Inspect Root</span> <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Children Aliquots Branch Visualizer */}
                    <div className="pl-3 sm:pl-4 border-l-2 border-[#C084FC] space-y-2 relative ml-1">
                      {children.map((child) => (
                        <div
                          key={child.sampleId}
                          onClick={() => onSelectSample(child.sampleId)}
                          className="p-2.5 rounded-lg bg-[#FFFFFF] hover:bg-[#FDE047]/30 border border-[#0A0A0A] shadow-[1.5px_1.5px_0px_#0A0A0A] hover:shadow-[2px_2px_0px_#0A0A0A] hover:translate-x-[-1px] cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="w-2 h-2 rounded-full bg-[#C084FC] border border-[#0A0A0A] shrink-0"></span>
                              <span className="font-black text-xs text-[#0A0A0A] font-mono truncate">
                                {child.externalId}
                              </span>
                              <span className="text-[10px] text-[#52525B] font-bold truncate">({child.sampleType})</span>
                            </div>
                            <div className="text-[11px] text-[#52525B] mt-0.5 truncate">
                              Custodian: <strong className="text-[#0A0A0A]">{getOrgName(child.custodian)}</strong> • Anchor: <span className="font-mono text-[#0A0A0A] bg-[#F4F4F5] px-1 rounded font-bold text-[10px]">{shortHash(child.headHash, 4)}</span>
                            </div>
                          </div>

                          <span className="brutal-pill bg-[#FDE047] text-[9px] self-start sm:self-auto shrink-0">
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
        </div>

        {/* Right Col: Split Aliquot Wizard */}
        <div className="brutal-card bg-[#FFFFFF] overflow-hidden">
          <div className="bg-[#F7F8F4] px-4 py-2.5 border-b-2 border-[#0A0A0A] flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-[#0A0A0A] flex items-center gap-1.5 uppercase font-display tracking-tight">
              <PlusCircle className="w-4 h-4 text-[#0A0A0A]" />
              <span>Fractionate New Aliquot</span>
            </h3>
            <span className="brutal-pill bg-[#C084FC] text-[9px]">
              Mint Child
            </span>
          </div>

          <form onSubmit={handleSplit} className="p-4 sm:p-5 space-y-3">
            
            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Select Parent Specimen</label>
              {eligibleParents.length === 0 ? (
                <div className="text-xs text-[#854D0E] bg-[#FEF9C3] p-2.5 rounded-lg border border-[#0A0A0A] font-semibold">
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
                  className="w-full text-xs sm:text-sm brutal-input p-2 font-mono font-bold"
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
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Child Aliquot Barcode / Label</label>
              <input
                type="text"
                placeholder="e.g. TC-2026-AL-01"
                value={childLabel}
                onChange={(e) => setChildLabel(e.target.value)}
                required
                className="w-full text-xs sm:text-sm brutal-input p-2 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Aliquot Fraction Type</label>
              <select
                value={childType}
                onChange={(e) => setChildType(e.target.value)}
                className="w-full text-xs sm:text-sm brutal-input p-2 font-mono font-bold"
              >
                <option value="Blood Plasma Aliquot">Blood Plasma Aliquot</option>
                <option value="Serum Fraction">Serum Fraction</option>
                <option value="Buffy Coat (DNA Extract)">Buffy Coat (DNA Extract)</option>
                <option value="Cellular Pellets">Cellular Pellets</option>
                <option value="Purified RNA Extract">Purified RNA Extract</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Centrifugation / Protocol Note</label>
              <textarea
                rows={2}
                value={aliquotNote}
                onChange={(e) => setAliquotNote(e.target.value)}
                placeholder="Speed, duration, target vial volume..."
                className="w-full text-xs sm:text-sm brutal-input p-2 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading || eligibleParents.length === 0}
              className="brutal-btn brutal-btn-purple w-full text-xs py-2.5 uppercase font-bold mt-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>{loading ? "Fractionating on Chain..." : "Mint & Anchor Child Aliquot"}</span>
            </button>

          </form>
        </div>

      </div>

    </div>
  );
}
