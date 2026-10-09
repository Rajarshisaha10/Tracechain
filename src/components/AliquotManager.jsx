import React, { useState } from "react";
import { useChain } from "../context/ChainContext";
import { formatTimestamp, shortHash, STATUS_CONFIG } from "../utils/formatters";
import {
  GitFork,
  Layers,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building
} from "lucide-react";

export default function AliquotManager({ onSelectSample }) {
  const { sandboxData, activeAccount, createAliquot } = useChain();
  const samples = Object.values(sandboxData.samples || {});
  const childrenMap = sandboxData.childrenMap || {};

  // Form state
  const [parentId, setParentId] = useState("");
  const [childLabel, setChildLabel] = useState("");
  const [childType, setChildType] = useState("Blood Plasma Aliquot");
  const [aliquotNote, setAliquotNote] = useState("Centrifuged 15 min at 2000g. 1.0 mL into sterile cryovial.");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ text: "", type: "" });

  // Only active samples in custody can be split
  const eligibleParents = samples.filter(
    (s) => s.status === 1 && s.custodian?.toLowerCase() === activeAccount.toLowerCase()
  );

  // Parent samples that already have children
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
      const res = await createAliquot({
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
      <div className="glass-panel p-6 border border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GitFork className="w-5 h-5 text-purple-400" />
            Specimen Fractionation & Aliquot Lineage
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Derive child sub-samples (e.g. plasma, serum, buffy coat) with bidirectional cryptographic anchors to the primary specimen.
          </p>
        </div>
      </div>

      {feedback.text && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            feedback.type === "ok"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {feedback.text}
        </div>
      )}

      {/* Grid: Lineage Trees & Split Wizard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Lineage Trees */}
        <div className="lg:col-span-2 glass-panel p-6 border border-white/10 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Active Family Lineage Trees
            </h3>
            <span className="text-xs text-slate-400">Parent-to-Child Trees</span>
          </div>

          {parentSamplesWithChildren.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
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
                  className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-4"
                >
                  {/* Parent Specimen Header Card */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          Root Primary
                        </span>
                        <h4
                          onClick={() => onSelectSample(parent.sampleId)}
                          className="font-extrabold text-base text-white font-mono hover:text-cyan-300 cursor-pointer"
                        >
                          {parent.externalId}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{parent.sampleType}</p>
                    </div>

                    <button
                      onClick={() => onSelectSample(parent.sampleId)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                    >
                      Inspect Root <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Children Aliquots Branch Visualizer */}
                  <div className="pl-6 border-l-2 border-purple-500/40 space-y-3 relative ml-3">
                    {children.map((child) => (
                      <div
                        key={child.sampleId}
                        onClick={() => onSelectSample(child.sampleId)}
                        className="p-3 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                            <span className="font-bold text-xs text-purple-200 font-mono">
                              {child.externalId}
                            </span>
                            <span className="text-[10px] text-slate-400">({child.sampleType})</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            Custodian: {getOrgName(child.custodian)} • Anchor: {shortHash(child.headHash, 4)}
                          </div>
                        </div>

                        <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded">
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
        <div className="glass-panel p-6 border border-white/10">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-purple-400" />
              Fractionate New Aliquot
            </h3>
            <span className="text-[11px] text-slate-400">Mint Child</span>
          </div>

          <form onSubmit={handleSplit} className="mt-4 space-y-4">
            
            <div>
              <label>Select Parent Specimen</label>
              {eligibleParents.length === 0 ? (
                <div className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
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
                  className="text-sm"
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
                className="font-mono text-sm"
              />
            </div>

            <div>
              <label>Aliquot Fraction Type</label>
              <select
                value={childType}
                onChange={(e) => setChildType(e.target.value)}
                className="text-sm"
              >
                <option value="Blood Plasma Aliquot">Blood Plasma Aliquot</option>
                <option value="Serum Fraction">Serum Fraction</option>
                <option value="Buffy Coat (DNA Extract)">Buffy Coat (DNA Extract)</option>
                <option value="Cellular Pellets">Cellular Pellets</option>
                <option value="Purified RNA Extract">Purified RNA Extract</option>
              </select>
            </div>

            <div>
              <label>Processing / Centrifugation Protocol Note</label>
              <textarea
                rows={2}
                value={aliquotNote}
                onChange={(e) => setAliquotNote(e.target.value)}
                placeholder="Centrifugation speed, time, target tube volume..."
              />
            </div>

            <button
              type="submit"
              disabled={loading || eligibleParents.length === 0}
              className="btn-primary w-full text-xs py-2.5 mt-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
            >
              {loading ? "Fractionating on Chain..." : "Mint & Anchor Child Aliquot"}
            </button>

          </form>
        </div>

      </div>

    </div>
  );
}
