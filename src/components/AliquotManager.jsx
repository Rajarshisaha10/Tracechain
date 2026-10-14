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
    <div className="space-y-6 sm:space-y-7 animate-fadeIn">
      
      {/* Banner - Multi-Color Neo-Brutalist Panel */}
      <div className="bg-[#FFFFFF] p-5 sm:p-6 border-[3px] border-[#162013] rounded-2xl shadow-[5px_5px_0px_#162013] flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        {/* Top color strip */}
        <div className="absolute top-0 left-0 right-0 h-2 flex">
          <div className="w-1/3 bg-[#FF70A6]"></div>
          <div className="w-1/3 bg-[#22D3EE]"></div>
          <div className="w-1/3 bg-[#FFE600]"></div>
        </div>

        <div className="mt-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded bg-[#FF70A6] text-white border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013] -rotate-1">
              FRACTIONATION & LINEAGE
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#162013] flex items-center gap-2.5 font-display">
            <GitFork className="w-5 h-5 text-[#FF70A6] shrink-0" />
            <span>Specimen Fractionation & Aliquot Lineage</span>
          </h2>
          <p className="text-xs text-[#33442E] mt-1 font-bold">
            Derive child sub-samples (plasma, serum, buffy coat) with bidirectional cryptographic anchors to the primary root specimen.
          </p>
        </div>
      </div>

      {feedback.text && (
        <div
          className={`p-4 rounded-xl border-[2.5px] border-[#162013] text-xs font-black flex items-center gap-2.5 shadow-[3px_3px_0px_#162013] ${
            feedback.type === "ok"
              ? "bg-[#EEFDC8] text-[#162013]"
              : "bg-[#FFE4E6] text-[#DC2626]"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-[#435E2F] shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Grid: Lineage Trees & Split Wizard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Lineage Trees */}
        <div className="lg:col-span-2 bg-[#FFFFFF] border-[3px] border-[#162013] rounded-2xl shadow-[5px_5px_0px_#162013] overflow-hidden">
          <div className="bg-[#FF70A6] px-5 py-3 border-b-2 border-[#162013] flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase font-display tracking-tight">
              <Layers className="w-4 h-4 text-white" />
              Active Family Lineage Trees
            </h3>
            <span className="text-[10px] text-[#162013] font-mono font-black bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border-2 border-[#162013] shadow-[1px_1px_0px_#162013]">
              Parent-to-Child Trees
            </span>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {parentSamplesWithChildren.length === 0 ? (
              <div className="py-12 text-center text-[#5D7057] text-xs font-mono font-bold">
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
                    className="p-5 rounded-2xl bg-[#F4F7F1] border-2 border-[#162013] shadow-[3px_3px_0px_#162013] space-y-4"
                  >
                    {/* Parent Specimen Header Card */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-mono font-black tracking-wider px-2 py-0.5 rounded-full bg-[#B4F000] text-[#162013] border-2 border-[#162013] shadow-[1px_1px_0px_#162013]">
                            Root Primary
                          </span>
                          <h4
                            onClick={() => onSelectSample(parent.sampleId)}
                            className="font-black text-base text-[#162013] font-mono hover:text-[#435E2F] cursor-pointer"
                          >
                            {parent.externalId}
                          </h4>
                        </div>
                        <p className="text-xs text-[#5D7057] mt-1 font-bold uppercase">{parent.sampleType}</p>
                      </div>

                      <button
                        onClick={() => onSelectSample(parent.sampleId)}
                        className="text-xs text-[#435E2F] hover:underline flex items-center gap-1 font-black font-mono uppercase bg-[#FFFFFF] px-2.5 py-1 rounded-lg border border-[#162013] shadow-[1px_1px_0px_#162013]"
                      >
                        <span>Inspect Root</span> <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Children Aliquots Branch Visualizer */}
                    <div className="pl-4 sm:pl-6 border-l-[3px] border-[#FF70A6] space-y-3 relative ml-1 sm:ml-3">
                      {children.map((child) => (
                        <div
                          key={child.sampleId}
                          onClick={() => onSelectSample(child.sampleId)}
                          className="p-3.5 rounded-xl bg-[#FFFFFF] hover:bg-[#EEFDC8] border-2 border-[#162013] shadow-[2.5px_2.5px_0px_#162013] hover:shadow-[3.5px_3.5px_0px_#162013] hover:translate-x-[-1px] cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#FF70A6] border border-[#162013] shrink-0"></span>
                              <span className="font-black text-xs text-[#162013] font-mono truncate">
                                {child.externalId}
                              </span>
                              <span className="text-[10px] text-[#5D7057] font-bold truncate">({child.sampleType})</span>
                            </div>
                            <div className="text-[11px] text-[#33442E] mt-1 truncate font-bold">
                              Custodian: <span className="font-black">{getOrgName(child.custodian)}</span> • Anchor: <span className="font-mono font-black text-[#162013] bg-[#EAF2E5] px-1 rounded">{shortHash(child.headHash, 4)}</span>
                            </div>
                          </div>

                          <span className="text-[10px] font-mono font-black text-[#162013] bg-[#FFE600] border-2 border-[#162013] px-2.5 py-0.5 rounded-full self-start sm:self-auto shrink-0 shadow-[1px_1px_0px_#162013]">
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
        <div className="bg-[#FFFFFF] border-[3px] border-[#162013] rounded-2xl shadow-[5px_5px_0px_#162013] overflow-hidden">
          <div className="bg-[#22D3EE] px-5 py-3 border-b-2 border-[#162013] flex items-center justify-between">
            <h3 className="text-sm font-black text-[#162013] flex items-center gap-2 uppercase font-display tracking-tight">
              <PlusCircle className="w-4 h-4 text-[#162013]" />
              Fractionate New Aliquot
            </h3>
            <span className="text-[10px] text-[#162013] font-mono font-black bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border-2 border-[#162013] shadow-[1px_1px_0px_#162013]">
              Mint Child
            </span>
          </div>

          <form onSubmit={handleSplit} className="p-5 sm:p-6 space-y-4">
            
            <div>
              <label>Select Parent Specimen</label>
              {eligibleParents.length === 0 ? (
                <div className="text-xs text-[#713F12] bg-[#FEF9C3] p-3 rounded-xl border-2 border-[#162013] font-bold shadow-[2px_2px_0px_#162013]">
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
              <label>Centrifugation / Protocol Note</label>
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
              className="btn-pink w-full text-xs py-3 mt-2 uppercase font-black"
            >
              <GitFork className="w-4 h-4 shrink-0" />
              <span>{loading ? "Fractionating on Chain..." : "Mint & Anchor Child Aliquot"}</span>
            </button>

          </form>
        </div>

      </div>

    </div>
  );
}
