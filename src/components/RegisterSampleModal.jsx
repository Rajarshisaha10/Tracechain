import React, { useState } from "react";
import { useChain } from "../context/ChainContext";
import { hashFile, hashString } from "../utils/crypto";
import { generateBlindId } from "../services/identityMappingService";
import { X, PlusCircle, Upload, ShieldCheck, EyeOff, RefreshCw, Lock, FlaskConical, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function RegisterSampleModal({ onClose, onSuccess }) {
  const { registerSample } = useChain();

  const [externalId, setExternalId] = useState(`TC-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [blindId, setBlindId] = useState(() => generateBlindId());
  const [sampleType, setSampleType] = useState("Whole Blood (EDTA)");
  const [collectedAt, setCollectedAt] = useState(new Date().toISOString().slice(0, 10));
  const [subjectRef, setSubjectRef] = useState("STUDY-NCT0482-P" + Math.floor(100 + Math.random() * 900));
  const [patientName, setPatientName] = useState("Eleanor Vance (Synthetic Demo)");
  const [patientDob, setPatientDob] = useState("1984-06-22");
  const [clinicalRequisition, setClinicalRequisition] = useState("Comprehensive 500-Gene Targeted Oncology Exome Panel");
  const [consentHash, setConsentHash] = useState("0x" + "a1".repeat(32));
  const [fileName, setFileName] = useState("");
  const [note, setNote] = useState("Specimen collected at sterile biological extraction ward.");
  const [metricName, setMetricName] = useState("Biomarker Concentration");
  const [metricValue, setMetricValue] = useState("50.0");
  const [metricUnit, setMetricUnit] = useState("ng/µL");
  const [metricTolerance, setMetricTolerance] = useState(15);
  const [expectedQualitative, setExpectedQualitative] = useState("NEGATIVE");
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
    if (!externalId.trim() || !sampleType.trim() || !blindId.trim()) {
      setError("Barcode ID, Specimen Type, and Blind Identifier are required.");
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
        blindId: blindId.trim(),
        patientData: {
          patientName: patientName.trim(),
          dob: patientDob,
          subjectRef: subjectRef.trim(),
          clinicalRequisition: clinicalRequisition.trim(),
          collectingWard: note.trim() || "Clinical Extraction Ward"
        },
        baselineMetric: {
          name: metricName.trim() || "Biomarker Concentration",
          value: parseFloat(metricValue) || 50.0,
          unit: metricUnit,
          tolerance: Number(metricTolerance) || 15,
          expectedQualitative: expectedQualitative.trim()
        }
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
              <p className="text-[11px] text-[#52525B] font-mono font-medium">Mint root provenance with Blind Testing ID</p>
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

          {/* Blind Testing Identifier Box */}
          <div className="p-3.5 bg-[#F7FEE7] border-2 border-[#0A0A0A] rounded-xl shadow-[2.5px_2.5px_0px_#0A0A0A] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-wider uppercase text-[#365314] flex items-center gap-1.5">
                <EyeOff className="w-3.5 h-3.5 text-[#65A30D]" />
                Opaque Blind Testing Identifier
              </span>
              <button
                type="button"
                onClick={() => setBlindId(generateBlindId())}
                className="text-[10px] font-bold text-[#0A0A0A] flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#FFFFFF] border border-[#0A0A0A] hover:bg-[#F4F4F5] cursor-pointer"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Re-roll ID
              </button>
            </div>
            <input
              type="text"
              value={blindId}
              onChange={(e) => setBlindId(e.target.value)}
              className="brutal-input w-full text-xs font-mono font-black text-[#0A0A0A] p-2 bg-[#FFFFFF]"
              required
            />
            <p className="text-[10px] text-[#4D7C0F] leading-snug font-medium">
              Laboratories only receive this opaque ID. Patient name, DOB, and medical charts are blinded to prevent confirmation bias and protect confidentiality.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1.5">Collection Date</label>
              <input
                type="date"
                value={collectedAt}
                onChange={(e) => setCollectedAt(e.target.value)}
                required
                className="brutal-input w-full text-xs sm:text-sm p-2.5 font-mono"
              />
            </div>
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

          {/* Analytical Baseline & Quality Benchmark (Lab Concordance Verification) */}
          <div className="p-3.5 bg-[#FEF9C3] border-2 border-[#0A0A0A] rounded-xl space-y-2.5 shadow-[2px_2px_0px_#0A0A0A]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#0A0A0A]">
                <FlaskConical className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Baseline Analytical Benchmark (Verification Control)</span>
              </div>
              <span className="text-[9px] font-mono font-bold bg-[#FFFFFF] border border-[#0A0A0A] px-1.5 py-0.2 rounded text-[#B45309]">
                TOLERANCE CHECK
              </span>
            </div>

            <p className="text-[10px] text-[#78350F] leading-snug">
              Define the initial expected quantitative analyte measurement. If downstream testing laboratories report findings outside the acceptable tolerance margin, an automatic discrepancy warning is flagged.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-[#52525B] uppercase mb-1">Assay Metric / Analyte</label>
                <input
                  type="text"
                  value={metricName}
                  onChange={(e) => setMetricName(e.target.value)}
                  placeholder="e.g. Biomarker Concentration"
                  className="brutal-input w-full text-xs p-2 bg-[#FFFFFF]"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#52525B] uppercase mb-1">Expected Baseline Value</label>
                <input
                  type="number"
                  step="any"
                  value={metricValue}
                  onChange={(e) => setMetricValue(e.target.value)}
                  placeholder="e.g. 50.0"
                  className="brutal-input w-full text-xs p-2 font-mono font-bold bg-[#FFFFFF]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[10px] font-bold text-[#52525B] uppercase mb-1">Unit</label>
                  <select
                    value={metricUnit}
                    onChange={(e) => setMetricUnit(e.target.value)}
                    className="brutal-input w-full text-xs p-2 font-mono bg-[#FFFFFF]"
                  >
                    <option value="ng/µL">ng/µL</option>
                    <option value="mL">mL</option>
                    <option value="%">%</option>
                    <option value="g/dL">g/dL</option>
                    <option value="mg/L">mg/L</option>
                    <option value="Score">Score</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#52525B] uppercase mb-1">Tolerance</label>
                  <select
                    value={metricTolerance}
                    onChange={(e) => setMetricTolerance(Number(e.target.value))}
                    className="brutal-input w-full text-xs p-2 font-mono bg-[#FFFFFF]"
                  >
                    <option value={5}>±5%</option>
                    <option value={10}>±10%</option>
                    <option value={15}>±15%</option>
                    <option value={20}>±20%</option>
                    <option value={25}>±25%</option>
                  </select>
                </div>
              </div>
            </div>

            {metricValue && !isNaN(Number(metricValue)) && (
              <div className="p-2 bg-[#FFFFFF] border border-[#0A0A0A] rounded-lg text-[10px] font-mono flex items-center justify-between text-[#0A0A0A]">
                <span>
                  Allowable Range: <strong>{(Number(metricValue) * (1 - metricTolerance / 100)).toFixed(1)}</strong> to{" "}
                  <strong>{(Number(metricValue) * (1 + metricTolerance / 100)).toFixed(1)} {metricUnit}</strong>
                </span>
                <span className="font-bold text-[#B45309]">Margin: ±{metricTolerance}%</span>
              </div>
            )}
          </div>

          {/* Off-Chain Patient Information (HIPAA / GDPR Boundary) */}
          <div className="p-3.5 bg-[#F4F4F5] border-2 border-[#0A0A0A] rounded-xl space-y-2.5 shadow-[2px_2px_0px_#0A0A0A]">
            <div className="flex items-center gap-1.5 text-xs font-black text-[#0A0A0A]">
              <Lock className="w-3.5 h-3.5 text-[#52525B]" />
              <span>Patient Identity (Off-Chain Vault Only)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-[#52525B] uppercase mb-1">Patient Name (Synthetic Demo)</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="brutal-input w-full text-xs p-2 bg-[#FFFFFF]"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#52525B] uppercase mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={patientDob}
                  onChange={(e) => setPatientDob(e.target.value)}
                  className="brutal-input w-full text-xs p-2 bg-[#FFFFFF]"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#52525B] uppercase mb-1">Clinical Requisition Order</label>
              <input
                type="text"
                value={clinicalRequisition}
                onChange={(e) => setClinicalRequisition(e.target.value)}
                className="brutal-input w-full text-xs p-2 bg-[#FFFFFF]"
                required
              />
            </div>
            <p className="text-[10px] text-[#71717A] italic leading-tight">
              Notice: This demographic record is NEVER broadcast to the public Ethereum ledger. It is cryptographically salted and isolated in an access-gated store for collection personnel only.
            </p>
          </div>

          {/* Consent Document Hash */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1.5">
              Informed Consent Form (Cryptographic Anchor)
            </label>
            <div className="flex items-center gap-2">
              <label className="brutal-btn brutal-btn-secondary px-3 py-2 text-xs cursor-pointer shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload PDF</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.png,.jpg"
                />
              </label>
              <input
                type="text"
                value={consentHash}
                onChange={(e) => setConsentHash(e.target.value)}
                placeholder="0x..."
                className="brutal-input flex-1 text-xs font-mono p-2 truncate"
              />
            </div>
            {fileName && (
              <p className="text-[11px] text-[#15803D] font-bold font-mono mt-1">
                ✓ Computed Keccak-256 for: {fileName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1.5">Collection Protocol Note</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="brutal-input w-full text-xs p-2 font-mono"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="brutal-btn brutal-btn-primary w-full py-3 text-xs uppercase cursor-pointer"
            >
              {loading ? "Anchoring Specimen on Blockchain..." : "Mint Provenance Root & Register Blind ID"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
