import React, { useState } from "react";
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
    } else {
      setVerifyResult({ matched: false });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-7 animate-fadeIn">
      
      {/* Banner */}
      <div className="bg-[#FFFFFF] p-5 sm:p-6 border-[2.5px] border-[#162013] rounded-2xl shadow-[4px_4px_0px_#162013] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#162013] flex items-center gap-2.5 font-display">
            <FileCheck2 className="w-5 h-5 text-[#435E2F] shrink-0" />
            <span>Lab Diagnostics, Incident Reporting & Compliance Clearance</span>
          </h2>
          <p className="text-xs text-[#33442E] mt-1 font-bold">
            Permanent diagnostic report hashing, cold-chain incident logging, and regulatory quarantine releases.
          </p>
        </div>
      </div>

      {msg.text && (
        <div
          className={`p-4 rounded-xl border-[2.5px] border-[#162013] text-xs font-extrabold flex items-center gap-2.5 shadow-[3px_3px_0px_#162013] animate-fadeIn ${
            msg.type === "ok"
              ? "bg-[#EAF2E5] text-[#2A3D1D]"
              : "bg-[#FFE4E6] text-[#DC2626]"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-[#435E2F] shrink-0" />
          <span>{msg.text}</span>
        </div>
      )}

      {/* Quarantined Specimens Audit Section */}
      <div className="bg-[#FFFFFF] p-5 sm:p-6 border-[2.5px] border-[#162013] rounded-2xl shadow-[4px_4px_0px_#162013]">
        <div className="flex items-center justify-between pb-3.5 border-b-2 border-[#162013] mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#DC2626]" />
            <h3 className="text-sm font-extrabold text-[#162013] uppercase font-display tracking-tight">
              Quarantine Hold Workbench ({quarantinedSamples.length})
            </h3>
          </div>
          <span className="text-[10px] text-[#DC2626] font-mono font-extrabold bg-[#FFE4E6] px-2.5 py-0.5 rounded-full border border-[#162013] uppercase">
            Auditor Approval Required
          </span>
        </div>

        {quarantinedSamples.length === 0 ? (
          <div className="py-8 text-center text-[#5D7057] text-xs font-mono font-bold">
            Zero quarantined specimens. All biological inventory is in acceptable active status.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quarantinedSamples.map((s) => (
              <div
                key={s.sampleId}
                className="p-4.5 rounded-xl bg-[#F4F7F1] border-2 border-[#162013] shadow-[2.5px_2.5px_0px_#162013] space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4
                      onClick={() => onSelectSample(s.sampleId)}
                      className="font-extrabold text-sm text-[#162013] hover:text-[#435E2F] font-mono cursor-pointer"
                    >
                      {s.externalId}
                    </h4>
                    <p className="text-xs text-[#5D7057] mt-0.5 font-bold uppercase">{s.sampleType}</p>
                  </div>
                  <span className="text-[10px] font-mono bg-[#FFE4E6] text-[#DC2626] border-2 border-[#162013] px-2.5 py-0.5 rounded-full font-extrabold shadow-[1px_1px_0px_#162013]">
                    QUARANTINED
                  </span>
                </div>

                <div className="text-xs text-[#33442E] space-y-1 font-medium">
                  <div>Custodian: <span className="font-bold text-[#162013]">{shortHash(s.custodian, 4)}</span></div>
                  <div>Anchor: <span className="font-mono text-[#435E2F] font-bold bg-[#EAF2E5] px-1.5 py-0.2 rounded border border-[#162013]">{shortHash(s.headHash, 4)}</span></div>
                </div>

                <div className="pt-3 border-t-2 border-[#162013] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectSample(s.sampleId)}
                    className="text-xs text-[#162013] hover:text-[#435E2F] font-extrabold uppercase font-mono py-1"
                  >
                    View Timeline & Evidence
                  </button>

                  <button
                    onClick={() => handleRelease(s.sampleId)}
                    className="btn-primary text-xs py-1.5 px-3.5 justify-center uppercase font-extrabold"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Box 1: Record Lab Test Results (Cyber Cyan Neo-Brutalist Card) */}
        <div className="bg-[#FFFFFF] border-[3px] border-[#162013] rounded-2xl shadow-[5px_5px_0px_#162013] overflow-hidden">
          <div className="bg-[#22D3EE] px-5 py-3 border-b-2 border-[#162013] flex items-center justify-between">
            <h3 className="text-sm font-black text-[#162013] flex items-center gap-2 uppercase font-display tracking-tight">
              <FileText className="w-4 h-4 text-[#162013]" />
              Record Diagnostic / Genomic Test
            </h3>
            <span className="text-[10px] text-[#162013] font-mono font-black bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border-2 border-[#162013] shadow-[1px_1px_0px_#162013]">
              Lab Access
            </span>
          </div>

          <form onSubmit={handleRecordTest} className="p-5 sm:p-6 space-y-4">
            <div>
              <label>Target Specimen</label>
              <select
                value={testSampleId}
                onChange={(e) => setTestSampleId(e.target.value)}
                className="text-sm font-bold bg-[#FFFFFF] border-2 border-[#162013] rounded-xl shadow-[2px_2px_0px_#162013]"
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
              <label>Diagnostic Test / Assay Name</label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                required
                className="bg-[#FFFFFF] border-2 border-[#162013] rounded-xl shadow-[2px_2px_0px_#162013] font-bold"
              />
            </div>

            <div>
              <label>Report File Seal (Keccak-256)</label>
              <label className="border-2 border-dashed border-[#162013] hover:bg-[#EAF2E5] rounded-xl p-3.5 text-center cursor-pointer block bg-[#F4F7F1] transition-all">
                <input type="file" className="hidden" onChange={handleTestFileUpload} />
                <div className="flex flex-col items-center gap-1.5 text-xs text-[#33442E] font-bold">
                  <Upload className="w-5 h-5 text-[#435E2F]" />
                  {reportFileName ? (
                    <span className="text-[#435E2F] font-black truncate max-w-[220px]">
                      ✓ {reportFileName}
                    </span>
                  ) : (
                    <span>Pick lab report PDF to compute cryptographic hash</span>
                  )}
                </div>
              </label>
              <div className="font-mono text-[10px] bg-[#EAF2E5] p-2 rounded-lg border-2 border-[#162013] text-[#162013] font-bold truncate mt-1.5 shadow-[1px_1px_0px_#162013]">
                {reportHash}
              </div>
            </div>

            <div>
              <label>IPFS Document Storage URI</label>
              <input
                type="text"
                value={reportUri}
                onChange={(e) => setReportUri(e.target.value)}
                placeholder="ipfs://bafybei..."
                className="bg-[#FFFFFF] border-2 border-[#162013] rounded-xl shadow-[2px_2px_0px_#162013] font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={testLoading}
              className="btn-cyan w-full text-xs py-3 mt-2 uppercase font-black"
            >
              <FileCheck2 className="w-4 h-4 shrink-0" />
              <span>{testLoading ? "Sealing Test on Chain..." : "Seal Diagnostic Report on Chain"}</span>
            </button>
          </form>
        </div>

        {/* Box 2: Report Incident / Excursion (Canary Yellow Card) */}
        <div className="bg-[#FFFFFF] border-[3px] border-[#162013] rounded-2xl shadow-[5px_5px_0px_#162013] overflow-hidden">
          <div className="bg-[#FFE600] px-5 py-3 border-b-2 border-[#162013] flex items-center justify-between">
            <h3 className="text-sm font-black text-[#162013] flex items-center gap-2 uppercase font-display tracking-tight">
              <AlertTriangle className="w-4 h-4 text-[#162013]" />
              Log Cold-Chain Incident / Breach
            </h3>
            <span className="text-[10px] text-[#162013] font-mono font-black bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border-2 border-[#162013] shadow-[1px_1px_0px_#162013]">
              Courier & Lab
            </span>
          </div>

          <form onSubmit={handleLogIncident} className="p-5 sm:p-6 space-y-4">
            <div>
              <label>Target Specimen</label>
              <select
                value={incSampleId}
                onChange={(e) => setIncSampleId(e.target.value)}
                className="text-sm font-bold bg-[#FFFFFF] border-2 border-[#162013] rounded-xl shadow-[2px_2px_0px_#162013]"
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
              <label>Incident Description / Thermal Excursion</label>
              <textarea
                rows={3}
                value={incDesc}
                onChange={(e) => setIncDesc(e.target.value)}
                placeholder="Provide details of thermal rise, duration, damaged packaging..."
                required
                className="bg-[#FFFFFF] border-2 border-[#162013] rounded-xl shadow-[2px_2px_0px_#162013] font-bold"
              />
            </div>

            <div>
              <label>Evidence Data Logger Hash (CSV/Log file)</label>
              <input
                type="text"
                value={incEvidenceHash}
                onChange={(e) => setIncEvidenceHash(e.target.value)}
                className="font-mono text-xs bg-[#FFFFFF] border-2 border-[#162013] rounded-xl shadow-[2px_2px_0px_#162013] font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={incLoading}
              className="btn-orange w-full text-xs py-3 mt-2 justify-center uppercase font-black"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{incLoading ? "Logging on Chain..." : "Anchor Incident Report Permanently"}</span>
            </button>
          </form>
        </div>

      </div>

      {/* Independent Diagnostic Report Verifier */}
      <div className="bg-[#FFFFFF] border-[3px] border-[#162013] rounded-2xl shadow-[5px_5px_0px_#162013] overflow-hidden">
        <div className="bg-[#B4F000] px-5 py-3 border-b-2 border-[#162013] flex items-center justify-between">
          <h3 className="text-sm font-black text-[#162013] flex items-center gap-2 uppercase font-display tracking-tight">
            <Search className="w-4 h-4 text-[#162013]" />
            Independent Diagnostic Report Integrity Verification
          </h3>
          <span className="text-[10px] text-[#162013] font-mono font-black bg-[#FFFFFF] px-2.5 py-0.5 rounded-full border-2 border-[#162013] shadow-[1px_1px_0px_#162013]">
            Cryptographic Audit
          </span>
        </div>
        
        <div className="p-5 sm:p-6">
          <p className="text-xs text-[#33442E] mb-4 font-bold">
            Verify whether an external lab report PDF or sequencing dataset was certified and anchored to this specimen's immutable hash chain.
          </p>

          <form onSubmit={handleCheckTestReport} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <select
                value={verifySampleId}
                onChange={(e) => setVerifySampleId(e.target.value)}
                className="text-sm font-bold bg-[#FFFFFF] border-2 border-[#162013] rounded-xl shadow-[2px_2px_0px_#162013]"
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
                placeholder="Paste Report Keccak-256 Hash (0x...)"
                value={verifyFileHash}
                onChange={(e) => setVerifyFileHash(e.target.value)}
                required
                className="font-mono text-xs bg-[#FFFFFF] border-2 border-[#162013] rounded-xl shadow-[2px_2px_0px_#162013] font-bold"
              />
            </div>

            <button type="submit" className="btn-lime text-xs uppercase font-black">
              Verify Report On-Chain
            </button>
          </form>

        {verifyResult && (
          <div
            className={`mt-4 p-4 rounded-xl border-2 border-[#162013] text-xs shadow-[2.5px_2.5px_0px_#162013] animate-fadeIn ${
              verifyResult.matched
                ? "bg-[#EAF2E5] text-[#2A3D1D]"
                : "bg-[#FFE4E6] text-[#DC2626]"
            }`}
          >
            {verifyResult.matched ? (
              <div className="space-y-1">
                <div className="font-extrabold text-sm flex items-center gap-2 font-mono uppercase">
                  <CheckCircle2 className="w-4 h-4 text-[#435E2F]" /> Report Verified Authentic & On-Chain!
                </div>
                <div className="font-bold">Test Assay: {verifyResult.testName}</div>
                <div className="font-mono font-bold">Recorded: {formatTimestamp(verifyResult.timestamp)}</div>
              </div>
            ) : (
              <div className="font-extrabold text-sm flex items-center gap-2 font-mono uppercase">
                <AlertTriangle className="w-4 h-4 text-[#DC2626]" /> No matching diagnostic report hash found on-chain for this specimen.
              </div>
            )}
          </div>
        )}
        </div>
      </div>

    </div>
  );
}
