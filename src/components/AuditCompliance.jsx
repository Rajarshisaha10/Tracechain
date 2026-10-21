import React, { useState } from "react";
import confetti from "canvas-confetti";
import { useChain } from "../context/ChainContext";
import { hashFile } from "../utils/crypto";
import { formatTimestamp, shortHash } from "../utils/formatters";
import {
  ShieldAlert,
  FileCheck2,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Search,
  Unlock,
  FileText
} from "lucide-react";

export default function AuditCompliance({ onSelectSample }) {
  const {
    sandboxData,
    recordTest,
    logIncident,
    release,
  } = useChain();

  const samples = Object.values(sandboxData.samples || {});
  const quarantinedSamples = samples.filter((s) => s.status === 3);

  const [testSampleId, setTestSampleId] = useState("");
  const [testName, setTestName] = useState("Comprehensive 500-Gene Targeted Exome Sequencing");
  const [reportHash, setReportHash] = useState("0x" + "e5".repeat(32));
  const [reportFileName, setReportFileName] = useState("");
  const [reportUri, setReportUri] = useState("ipfs://bafybeireportngsdiagnostic2026");
  const [testLoading, setTestLoading] = useState(false);

  const [incSampleId, setIncSampleId] = useState("");
  const [incDesc, setIncDesc] = useState("Cryogenic container temperature excursion: rose to -15°C for 35 mins");
  const [incEvidenceHash, setIncEvidenceHash] = useState("0x" + "c3".repeat(32));
  const [incLoading, setIncLoading] = useState(false);

  const [verifySampleId, setVerifySampleId] = useState("");
  const [verifyFileHash, setVerifyFileHash] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);

  const [msg, setMsg] = useState({ text: "", type: "" });

  const handleTestFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setReportFileName(file.name);
      const h = await hashFile(file);
      setReportHash(h);
    } catch (err) {
      setMsg({ text: "File hash computation failed: " + err.message, type: "err" });
    }
  };

  const handleRecordTest = async (e) => {
    e.preventDefault();
    if (!testSampleId || !testName.trim()) {
      setMsg({ text: "Please select specimen and enter assay name.", type: "err" });
      return;
    }
    try {
      setTestLoading(true);
      await recordTest(testSampleId, testName.trim(), reportHash, reportUri.trim());
      setMsg({ text: `Lab test "${testName}" permanently recorded on the blockchain!`, type: "ok" });
      setTestSampleId("");
      setTestLoading(false);
    } catch (err) {
      setMsg({ text: err.message, type: "err" });
      setTestLoading(false);
    }
  };

  const handleLogIncident = async (e) => {
    e.preventDefault();
    if (!incSampleId || !incDesc.trim()) {
      setMsg({ text: "Please select specimen and describe incident.", type: "err" });
      return;
    }
    try {
      setIncLoading(true);
      await logIncident(incSampleId, incDesc.trim(), incEvidenceHash, "");
      setMsg({ text: "Incident log committed on-chain.", type: "ok" });
      setIncSampleId("");
      setIncLoading(false);
    } catch (err) {
      setMsg({ text: err.message, type: "err" });
      setIncLoading(false);
    }
  };

  const handleRelease = async (sampleId) => {
    try {
      await release(sampleId, "Audit clearance granted: Thermal logs verified within acceptable tolerance");
      setMsg({ text: "Quarantine hold released! Specimen restored to Active status.", type: "ok" });
    } catch (err) {
      setMsg({ text: err.message, type: "err" });
    }
  };

  const handleCheckTestReport = (e) => {
    e.preventDefault();
    if (!verifySampleId || !verifyFileHash) return;
    const history = sandboxData.histories[verifySampleId] || [];
    const found = history.find(
      (r) => r.recType === 9 && r.dataHash.toLowerCase() === verifyFileHash.toLowerCase()
    );
    if (found) {
      setVerifyResult({
        matched: true,
        testName: found.note,
        timestamp: found.timestamp,
        actor: found.actor,
      });
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 }
      });
    } else {
      setVerifyResult({ matched: false });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn">
      
      {/* Banner */}
      <div className="brutal-card p-4 sm:p-5 bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="brutal-pill bg-[#D7FB38] text-[10px]">
              AUDIT & ACCREDITATION
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0A0A0A] flex items-center gap-2 font-display">
            <FileCheck2 className="w-5 h-5 text-[#0A0A0A] shrink-0" />
            <span>Diagnostics, Incident Auditing & Quarantine Clearance</span>
          </h2>
          <p className="text-xs text-[#52525B] mt-0.5 font-medium">
            Cryptographic test report hashing, tamper excursion logging, and regulatory auditor releases.
          </p>
        </div>
      </div>

      {msg.text && (
        <div
          className={`p-3 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#0A0A0A] animate-fadeIn ${
            msg.type === "ok"
              ? "bg-[#D7FB38] text-[#0A0A0A]"
              : "bg-[#FF5A5F] text-white"
          }`}
        >
          {msg.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0A0A0A]" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Quarantined Specimens Audit Section */}
      <div className="brutal-card p-4 sm:p-5 bg-[#FFFFFF]">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#0A0A0A] mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#DC2626]" />
            <h3 className="text-xs sm:text-sm font-black text-[#0A0A0A] uppercase font-display tracking-tight">
              Quarantine Hold Workbench ({quarantinedSamples.length})
            </h3>
          </div>
          <span className="brutal-pill bg-[#FF5A5F] text-white text-[9px]">
            Auditor Release Required
          </span>
        </div>

        {quarantinedSamples.length === 0 ? (
          <div className="py-8 text-center text-[#71717A] text-xs font-mono">
            Zero quarantined specimens. All biological inventory is in acceptable active status.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {quarantinedSamples.map((s) => (
              <div
                key={s.sampleId}
                className="p-3.5 rounded-xl bg-[#F7F8F4] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] space-y-2.5"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4
                      onClick={() => onSelectSample(s.sampleId)}
                      className="font-black text-sm text-[#0A0A0A] hover:underline font-mono cursor-pointer"
                    >
                      {s.externalId}
                    </h4>
                    <p className="text-xs text-[#52525B] font-bold mt-0.5">{s.sampleType}</p>
                  </div>
                  <span className="brutal-pill bg-[#FF5A5F] text-white text-[9px]">
                    QUARANTINED
                  </span>
                </div>

                <div className="text-xs text-[#0A0A0A] space-y-0.5 font-medium">
                  <div>Custodian: <strong className="font-mono">{shortHash(s.custodian, 4)}</strong></div>
                  <div>Anchor: <span className="font-mono bg-[#FFFFFF] px-1.5 py-0.2 rounded border border-[#0A0A0A] font-bold text-[10px]">{shortHash(s.headHash, 4)}</span></div>
                </div>

                <div className="pt-2 border-t border-[#0A0A0A]/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5">
                  <button
                    onClick={() => onSelectSample(s.sampleId)}
                    className="text-xs font-mono text-[#0A0A0A] hover:underline text-left py-1"
                  >
                    View Timeline & Evidence →
                  </button>

                  <button
                    onClick={() => handleRelease(s.sampleId)}
                    className="brutal-btn brutal-btn-primary text-xs py-1.5 px-3"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Grant Auditor Release</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Lab Testing Record & Incident Reporting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        
        {/* Box 1: Record Lab Test Results */}
        <div className="brutal-card bg-[#FFFFFF] overflow-hidden">
          <div className="bg-[#F7F8F4] px-4 py-2.5 border-b-2 border-[#0A0A0A] flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-[#0A0A0A] flex items-center gap-1.5 font-display uppercase tracking-tight">
              <FileText className="w-4 h-4 text-[#0A0A0A]" />
              <span>Record Diagnostic / Genomic Test</span>
            </h3>
            <span className="brutal-pill bg-[#38BDF8] text-[9px]">
              Lab Access
            </span>
          </div>

          <form onSubmit={handleRecordTest} className="p-4 sm:p-5 space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Target Specimen</label>
              <select
                value={testSampleId}
                onChange={(e) => setTestSampleId(e.target.value)}
                className="w-full text-xs sm:text-sm brutal-input p-2 font-mono font-bold"
                required
              >
                <option value="">-- Choose specimen --</option>
                {samples.map((s) => (
                  <option key={s.sampleId} value={s.sampleId}>
                    {s.externalId} ({s.sampleType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Diagnostic Test / Assay Name</label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                required
                className="w-full text-xs sm:text-sm brutal-input p-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Report File Seal (Keccak-256)</label>
              <label className="border-2 border-dashed border-[#0A0A0A] hover:bg-[#F4F4F5] rounded-xl p-3 text-center cursor-pointer block bg-[#F7F8F4] transition-all">
                <input type="file" className="hidden" onChange={handleTestFileUpload} />
                <div className="flex flex-col items-center gap-1 text-xs text-[#52525B]">
                  <Upload className="w-4 h-4 text-[#0A0A0A]" />
                  {reportFileName ? (
                    <span className="text-[#0A0A0A] font-bold font-mono truncate max-w-[220px]">
                      ✓ {reportFileName}
                    </span>
                  ) : (
                    <span>Pick lab report PDF to compute Keccak-256 hash</span>
                  )}
                </div>
              </label>
              <div className="font-mono text-[10px] bg-[#FFFFFF] p-1.5 rounded border border-[#0A0A0A] text-[#0A0A0A] break-all mt-1.5 font-bold">
                {reportHash}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1">IPFS Storage URI</label>
              <input
                type="text"
                value={reportUri}
                onChange={(e) => setReportUri(e.target.value)}
                placeholder="ipfs://bafybei..."
                className="w-full text-xs sm:text-sm brutal-input p-2 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={testLoading}
              className="brutal-btn brutal-btn-cyan w-full text-xs py-2.5 uppercase font-bold mt-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>{testLoading ? "Sealing Test on Chain..." : "Seal Diagnostic Report on Chain"}</span>
            </button>
          </form>
        </div>

        {/* Box 2: Report Incident / Excursion */}
        <div className="brutal-card bg-[#FFFFFF] overflow-hidden">
          <div className="bg-[#F7F8F4] px-4 py-2.5 border-b-2 border-[#0A0A0A] flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-[#0A0A0A] flex items-center gap-1.5 font-display uppercase tracking-tight">
              <AlertTriangle className="w-4 h-4 text-[#0A0A0A]" />
              <span>Log Cold-Chain Incident / Breach</span>
            </h3>
            <span className="brutal-pill bg-[#FB923C] text-[9px]">
              Excursion
            </span>
          </div>

          <form onSubmit={handleLogIncident} className="p-4 sm:p-5 space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Target Specimen</label>
              <select
                value={incSampleId}
                onChange={(e) => setIncSampleId(e.target.value)}
                className="w-full text-xs sm:text-sm brutal-input p-2 font-mono font-bold"
                required
              >
                <option value="">-- Choose specimen --</option>
                {samples.map((s) => (
                  <option key={s.sampleId} value={s.sampleId}>
                    {s.externalId} ({s.sampleType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Incident Description / Excursion</label>
              <textarea
                rows={3}
                value={incDesc}
                onChange={(e) => setIncDesc(e.target.value)}
                placeholder="Details of temperature rise, broken seal, dropped container..."
                required
                className="w-full text-xs sm:text-sm brutal-input p-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] mb-1">Evidence Hash (Logger CSV/Log)</label>
              <input
                type="text"
                value={incEvidenceHash}
                onChange={(e) => setIncEvidenceHash(e.target.value)}
                className="w-full text-xs sm:text-sm brutal-input p-2 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={incLoading}
              className="brutal-btn brutal-btn-danger w-full text-xs py-2.5 uppercase font-bold mt-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{incLoading ? "Logging on Chain..." : "Anchor Incident Report Permanently"}</span>
            </button>
          </form>
        </div>

      </div>

      {/* Independent Diagnostic Report Verifier */}
      <div className="brutal-card bg-[#FFFFFF] overflow-hidden">
        <div className="bg-[#F7F8F4] px-4 py-2.5 border-b-2 border-[#0A0A0A] flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-black text-[#0A0A0A] flex items-center gap-1.5 uppercase font-display tracking-tight">
            <Search className="w-4 h-4 text-[#0A0A0A]" />
            <span>Independent Diagnostic Report Integrity Verification</span>
          </h3>
          <span className="brutal-pill bg-[#D7FB38] text-[9px]">
            Audit Tool
          </span>
        </div>
        
        <div className="p-4 sm:p-5">
          <p className="text-xs text-[#52525B] mb-3 font-medium">
            Verify whether an external lab report PDF or sequencing dataset was certified and anchored to this specimen's immutable hash chain.
          </p>

          <form onSubmit={handleCheckTestReport} className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div>
              <select
                value={verifySampleId}
                onChange={(e) => setVerifySampleId(e.target.value)}
                className="w-full text-xs sm:text-sm brutal-input p-2 font-mono font-bold"
                required
              >
                <option value="">-- Select Specimen --</option>
                {samples.map((s) => (
                  <option key={s.sampleId} value={s.sampleId}>
                    {s.externalId}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <input
                type="text"
                placeholder="Paste Report Hash (0x...)"
                value={verifyFileHash}
                onChange={(e) => setVerifyFileHash(e.target.value)}
                required
                className="w-full text-xs sm:text-sm brutal-input p-2 font-mono"
              />
            </div>

            <button type="submit" className="brutal-btn brutal-btn-primary text-xs uppercase font-mono">
              Verify Report On-Chain
            </button>
          </form>

          {verifyResult && (
            <div
              className={`mt-3 p-3 rounded-xl border-2 border-[#0A0A0A] text-xs shadow-[3px_3px_0px_#0A0A0A] ${
                verifyResult.matched
                  ? "bg-[#D7FB38] text-[#0A0A0A] animate-fadeIn"
                  : "bg-[#FF5A5F] text-white animate-shake"
              }`}
            >
              {verifyResult.matched ? (
                <div className="space-y-0.5">
                  <div className="font-extrabold text-xs flex items-center gap-1.5 font-mono uppercase">
                    <CheckCircle2 className="w-4 h-4 text-[#0A0A0A]" /> Report Verified Authentic & On-Chain!
                  </div>
                  <div className="font-bold">Test Assay: {verifyResult.testName}</div>
                  <div className="font-mono text-[10px]">Recorded: {formatTimestamp(verifyResult.timestamp)}</div>
                </div>
              ) : (
                <div className="font-extrabold text-xs flex items-center gap-1.5 font-mono uppercase">
                  <AlertTriangle className="w-4 h-4 text-white" /> No matching diagnostic report hash found on-chain for this specimen.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
