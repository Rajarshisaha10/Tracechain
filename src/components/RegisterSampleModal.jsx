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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FFFFFF] border-[2.5px] border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden text-[#0A0A0A]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-[#0A0A0A] bg-[#FFFFFF] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D7FB38] text-[#0A0A0A] flex items-center justify-center border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0A0A0A] tracking-tight">Register Biological Specimen</h3>
              <p className="text-[11px] text-[#52525B] font-mono font-medium">Mint root provenance hash on EVM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#FFE4E6] border-2 border-[#0A0A0A] shadow-[1.5px_1.5px_0px_#0A0A0A] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FFF1F2] border-2 border-[#FF5A5F] text-[#BE123C] text-xs font-bold shadow-[2px_2px_0px_#FF5A5F]">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1.5">Specimen Barcode / Label ID</label>
            <input
              type="text"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              placeholder="e.g. TC-2026-9081"
              required
              className="brutal-input w-full text-xs sm:text-sm p-2.5 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1.5">Specimen Type</label>
            <select
              value={sampleType}
              onChange={(e) => setSampleType(e.target.value)}
              className="brutal-input w-full text-xs sm:text-sm p-2.5 font-mono cursor-pointer"
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
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1.5">Collection Date</label>
              <input
                type="date"
                value={collectedAt}
                onChange={(e) => setCollectedAt(e.target.value)}
                required
                className="brutal-input w-full text-xs sm:text-sm p-2.5 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1.5">Pseudonymous Subject ID</label>
              <input
                type="text"
                value={subjectRef}
                onChange={(e) => setSubjectRef(e.target.value)}
                placeholder="Study ID / Barcode"
                required
                className="brutal-input w-full text-xs sm:text-sm p-2.5 font-mono"
              />
            </div>
          </div>

          {/* File Hash for Informed Consent */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">Informed Consent Document Seal</label>
              <span className="brutal-pill bg-[#D7FB38] text-[10px]">Zero-Knowledge</span>
            </div>
            
            <label className="border-2 border-dashed border-[#0A0A0A] hover:border-black rounded-xl p-4 text-center cursor-pointer block transition-all bg-[#F7F8F4] hover:bg-[#F4F4F5] shadow-[2px_2px_0px_#0A0A0A]">
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="flex flex-col items-center gap-1.5 text-xs text-[#52525B]">
                <Upload className="w-5 h-5 text-[#0A0A0A]" />
                {fileName ? (
                  <span className="text-[#0A0A0A] font-mono font-bold truncate max-w-[240px]">
                    ✓ {fileName}
                  </span>
                ) : (
                  <span className="font-medium">Click or drag consent form PDF to compute Keccak-256 seal</span>
                )}
              </div>
            </label>

            <div className="font-mono text-[10px] bg-[#F7F8F4] p-2.5 rounded-lg border-2 border-[#0A0A0A] text-[#0A0A0A] font-bold break-all mt-2 shadow-[1.5px_1.5px_0px_#0A0A0A]">
              {consentHash}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1.5">Initial Collection Notes</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Clinical ward, vial volume, temperature notes..."
              className="brutal-input w-full text-xs sm:text-sm p-2.5 font-mono"
            />
          </div>

          <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2.5 border-t-2 border-[#0A0A0A]">
            <button
              type="button"
              onClick={onClose}
              className="brutal-btn brutal-btn-secondary text-xs py-2.5 px-4 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="brutal-btn brutal-btn-primary text-xs py-2.5 px-5 uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Registering on Chain..." : "Confirm & Anchor on Chain"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
