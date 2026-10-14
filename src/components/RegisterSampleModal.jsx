import React, { useState } from "react";
import { useChain } from "../context/ChainContext";
import { hashFile, hashString } from "../utils/crypto";
import { X, PlusCircle, Upload, ShieldCheck } from "lucide-react";

export default function RegisterSampleModal({ onClose, onSuccess }) {
  const { registerSample } = useChain();

  const [externalId, setExternalId] = useState(`TC-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [sampleType, setSampleType] = useState("Whole Blood (EDTA)");
  const [collectedAt, setCollectedAt] = useState(new Date().toISOString().slice(0, 10));
  const [subjectRef, setSubjectRef] = useState("STUDY-NCT0482-P" + Math.floor(100 + Math.random() * 900));
  const [consentHash, setConsentHash] = useState("0x" + "a1".repeat(32));
  const [fileName, setFileName] = useState("");
  const [note, setNote] = useState("Specimen collected at sterile biological extraction ward.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setFileName(file.name);
      const computedHash = await hashFile(file);
      setConsentHash(computedHash);
    } catch (err) {
      setError("Failed to compute file hash: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!externalId.trim() || !sampleType.trim()) {
      setError("Barcode ID and Specimen Type are required.");
      return;
    }
    try {
      setLoading(true);
      setError("");

      const hashedSubject = hashString(subjectRef);

      await registerSample({
        externalId: externalId.trim(),
        sampleType: sampleType.trim(),
        collectedAt,
        consentHash: consentHash || "0x" + "00".repeat(32),
        subjectHash: hashedSubject,
        note: note.trim(),
      });

      setLoading(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to register specimen");
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-lg bg-[#FFFFFF] border-[3px] border-[#162013] shadow-[8px_8px_0px_#162013] rounded-2xl">
        
        {/* Header */}
        <div className="p-5 border-b-[2.5px] border-[#162013] flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF2E5] text-[#435E2F] flex items-center justify-center border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013]">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#162013] uppercase font-display tracking-tight">Register Biological Specimen</h3>
              <p className="text-[11px] text-[#5D7057] font-mono font-bold">Mint root provenance hash on EVM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#FFFFFF] text-[#162013] hover:bg-[#FFE4E6] border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013] active:translate-x-0.5 active:translate-y-0.5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FFE4E6] border-2 border-[#162013] text-[#DC2626] text-xs font-extrabold shadow-[2px_2px_0px_#162013]">
              {error}
            </div>
          )}

          <div>
            <label>Specimen Barcode / Label ID</label>
            <input
              type="text"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              placeholder="e.g. TC-2026-9081"
              required
              className="font-mono text-sm font-bold"
            />
          </div>

          <div>
            <label>Specimen Type</label>
            <select
              value={sampleType}
              onChange={(e) => setSampleType(e.target.value)}
              className="text-sm font-bold"
            >
              <option value="Whole Blood (EDTA)">Whole Blood (EDTA)</option>
              <option value="Blood Plasma Aliquot">Blood Plasma Aliquot</option>
              <option value="Tumor Biopsy Specimen">Tumor Biopsy Specimen</option>
              <option value="Total RNA Extract (High Purity)">Total RNA Extract (High Purity)</option>
              <option value="Genomic DNA (PBMC)">Genomic DNA (PBMC)</option>
              <option value="Synovial Fluid">Synovial Fluid</option>
              <option value="Cryopreserved Stem Cells">Cryopreserved Stem Cells</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label>Collection Date</label>
              <input
                type="date"
                value={collectedAt}
                onChange={(e) => setCollectedAt(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Pseudonymous Subject ID</label>
              <input
                type="text"
                value={subjectRef}
                onChange={(e) => setSubjectRef(e.target.value)}
                placeholder="Study ID / Barcode"
                required
              />
            </div>
          </div>

          {/* Drag & Drop / File Hash for Informed Consent */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="mb-0">Informed Consent Document Seal</label>
              <span className="text-[10px] text-[#435E2F] font-mono font-extrabold bg-[#EAF2E5] px-2 py-0.5 rounded border border-[#162013]">Zero-Knowledge</span>
            </div>
            
            <label className="border-2 border-dashed border-[#162013] hover:bg-[#EAF2E5] rounded-xl p-3.5 text-center cursor-pointer block transition-all bg-[#F4F7F1]">
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="flex flex-col items-center gap-1.5 text-xs text-[#33442E] font-bold">
                <Upload className="w-5 h-5 text-[#435E2F]" />
                {fileName ? (
                  <span className="text-[#435E2F] font-extrabold truncate max-w-[220px]">
                    ✓ {fileName}
                  </span>
                ) : (
                  <span>Click or drag consent form PDF to compute Keccak-256 seal</span>
                )}
              </div>
            </label>

            <div className="font-mono text-[10px] bg-[#EAF2E5] p-2 rounded-lg border-2 border-[#162013] text-[#162013] font-bold truncate mt-1.5 shadow-[1px_1px_0px_#162013]">
              {consentHash}
            </div>
          </div>

          <div>
            <label>Initial Collection Notes</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Clinical ward, vial volume, temperature notes..."
            />
          </div>

          <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs w-full sm:w-auto uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs w-full sm:w-auto justify-center uppercase font-extrabold"
            >
              {loading ? "Registering on Chain..." : "Confirm & Anchor on Chain"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
