import React, { useState } from "react";
import { useChain } from "../context/ChainContext";
import { hashFile, hashString } from "../utils/crypto";
import { X, PlusCircle, Upload } from "lucide-react";

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
      <div className="modal-content max-w-lg bg-[#FFFBF1] border-2 border-[#E3D7BC]">
        
        {/* Header */}
        <div className="p-5 border-b-2 border-[#E3D7BC] flex items-center justify-between bg-[#FFFBF1]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#DCE6F5] text-[#2457A6] flex items-center justify-center border border-[#BDD0EE]">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#1B2B45]">Register Biological Specimen</h3>
              <p className="text-[11px] text-[#596579] font-medium">Mint root provenance hash on-chain</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#F5EEDC] text-[#1B2B45] hover:bg-[#EBDDB8]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-[#F6D9D4] border border-[#EDB8B3] text-[#C23B30] text-xs font-bold">
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

          <div className="grid grid-cols-2 gap-3">
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
              <span className="text-[10px] text-[#2457A6] font-mono font-bold">Keccak-256</span>
            </div>
            
            <label className="border-2 border-dashed border-[#E3D7BC] hover:border-[#2457A6] rounded-xl p-3 text-center cursor-pointer block transition-all bg-[#F5EEDC]">
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="flex flex-col items-center gap-1 text-xs text-[#596579]">
                <Upload className="w-4 h-4 text-[#2457A6]" />
                {fileName ? (
                  <span className="text-[#2457A6] font-bold truncate max-w-[200px]">
                    ✓ {fileName}
                  </span>
                ) : (
                  <span>Click to compute cryptographic hash of consent PDF</span>
                )}
              </div>
            </label>

            <div className="font-mono text-[10px] bg-[#EBDDB8] p-2 rounded-lg border border-[#D2C4A3] text-[#1B2B45] font-semibold truncate mt-1">
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

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs"
            >
              {loading ? "Registering on Chain..." : "Confirm & Anchor on Chain"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
