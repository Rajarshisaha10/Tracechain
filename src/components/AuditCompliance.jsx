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
      setMsg({ text: "Please select sample and enter test name.", type: "err" });
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
      setMsg({ text: "Please select sample and describe incident.", type: "err" });
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
    <div className="space-y-8 animate-fadeIn">
      
      {/* Banner */}
      <div className="glass-panel p-4 sm:p-6 bg-[#FFFBF1] border-2 border-[#E3D7BC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#1B2B45] flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-[#2457A6] shrink-0" />
            <span>Lab Diagnostics, Incident Reporting & Compliance Clearance</span>
          </h2>
          <p className="text-xs text-[#596579] mt-1 font-medium">
            Permanent diagnostic report hashing, incident auditing, and regulatory quarantine administration.
          </p>
        </div>
      </div>

      {msg.text && (
        <div
          className={`p-4 rounded-2xl border-2 text-xs font-bold flex items-center gap-2 ${
            msg.type === "ok"
              ? "bg-[#DCE6F5] border-[#BDD0EE] text-[#1B4385]"
              : "bg-[#F6D9D4] border-[#EDB8B3] text-[#9E2A20]"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-[#2457A6]" />
          {msg.text}
        </div>
      )}

      {/* Quarantined Specimens Audit Section */}
      <div className="glass-panel p-6 border-2 border-[#EDB8B3] bg-[#F6D9D4]/40">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#EDB8B3] mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#C23B30]" />
            <h3 className="text-sm font-extrabold text-[#1B2B45]">
              Quarantine Hold Workbench ({quarantinedSamples.length})
            </h3>
          </div>
          <span className="text-[11px] text-[#C23B30] font-mono font-bold">
            Requires Compliance Clearance
          </span>
        </div>

        {quarantinedSamples.length === 0 ? (
          <div className="py-6 text-center text-[#596579] text-xs font-medium">
            Zero quarantined specimens. All biological inventory is in acceptable status.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quarantinedSamples.map((s) => (
              <div
                key={s.sampleId}
                className="p-4.5 rounded-2xl bg-[#FFFBF1] border-2 border-[#EDB8B3] space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4
                      onClick={() => onSelectSample(s.sampleId)}
                      className="font-extrabold text-sm text-[#1B2B45] font-mono hover:text-[#2457A6] cursor-pointer"
                    >
                      {s.externalId}
                    </h4>
                    <p className="text-xs text-[#596579] mt-0.5 font-medium">{s.sampleType}</p>
                  </div>
                  <span className="text-[10px] font-mono bg-[#F6D9D4] text-[#C23B30] border border-[#EDB8B3] px-2.5 py-0.5 rounded-full font-bold">
                    QUARANTINED
                  </span>
                </div>

                <div className="text-xs text-[#596579] space-y-1 font-medium">
                  <div>Custodian: <span className="font-bold text-[#1B2B45]">{shortHash(s.custodian, 4)}</span></div>
                  <div>Anchor: <span className="font-mono text-[#2457A6] font-bold">{shortHash(s.headHash, 4)}</span></div>
                </div>

                <div className="pt-2 border-t border-[#E3D7BC] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectSample(s.sampleId)}
                    className="text-xs text-[#2457A6] hover:underline font-bold py-1"
                  >
                    View Incidents & History
                  </button>

                  <button
                    onClick={() => handleRelease(s.sampleId)}
                    className="btn-primary text-xs py-1.5 px-3.5 justify-center"
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
        
        {/* Box 1: Record Lab Test Results */}
        <div className="glass-panel p-6 bg-[#FFFBF1] border-2 border-[#E3D7BC]">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#E3D7BC] mb-4">
            <h3 className="text-sm font-extrabold text-[#1B2B45] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2457A6]" />
              Record Diagnostic / Genomic Test
            </h3>
            <span className="text-[11px] text-[#6B7287] font-semibold">Laboratories Only</span>
          </div>

          <form onSubmit={handleRecordTest} className="space-y-4">
            <div>
              <label>Target Specimen</label>
              <select
                value={testSampleId}
                onChange={(e) => setTestSampleId(e.target.value)}
                className="text-sm font-bold"
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
              />
            </div>

            <div>
              <label>Report File Seal (Keccak-256)</label>
              <label className="border-2 border-dashed border-[#E3D7BC] hover:border-[#2457A6] rounded-xl p-3.5 text-center cursor-pointer block bg-[#F5EEDC]">
                <input type="file" className="hidden" onChange={handleTestFileUpload} />
                <div className="flex flex-col items-center gap-1 text-xs text-[#596579]">
                  <Upload className="w-4 h-4 text-[#2457A6]" />
                  {reportFileName ? (
                    <span className="text-[#2457A6] font-bold truncate max-w-[200px]">
                      ✓ {reportFileName}
                    </span>
                  ) : (
                    <span className="font-medium">Pick lab report PDF to compute cryptographic hash</span>
                  )}
                </div>
              </label>
              <div className="font-mono text-[10px] bg-[#EBDDB8] p-2 rounded-lg border border-[#D2C4A3] text-[#1B2B45] font-semibold truncate mt-1">
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
              />
            </div>

            <button
              type="submit"
              disabled={testLoading}
              className="btn-primary w-full text-xs py-2.5 mt-2"
            >
              {testLoading ? "Sealing Test on Chain..." : "Seal Diagnostic Report on Chain"}
            </button>
          </form>
        </div>

        {/* Box 2: Report Incident / Excursion */}
        <div className="glass-panel p-6 bg-[#FFFBF1] border-2 border-[#E3D7BC]">
          <div className="flex items-center justify-between pb-3 border-b-2 border-[#E3D7BC] mb-4">
            <h3 className="text-sm font-extrabold text-[#1B2B45] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#C23B30]" />
              Log Cold-Chain Incident / Breach
            </h3>
            <span className="text-[11px] text-[#6B7287] font-semibold">Custodians & Couriers</span>
          </div>

          <form onSubmit={handleLogIncident} className="space-y-4">
            <div>
              <label>Target Specimen</label>
              <select
                value={incSampleId}
                onChange={(e) => setIncSampleId(e.target.value)}
                className="text-sm font-bold"
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
              />
            </div>

            <div>
              <label>Evidence Data Logger Hash (CSV/Log file)</label>
              <input
                type="text"
                value={incEvidenceHash}
                onChange={(e) => setIncEvidenceHash(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={incLoading}
              className="btn-danger w-full text-xs py-2.5 mt-2 justify-center"
            >
              <ShieldAlert className="w-4 h-4" />
              {incLoading ? "Logging on Chain..." : "Anchor Incident Report Permanently"}
            </button>
          </form>
        </div>

      </div>

      {/* Independent Diagnostic Report Verifier */}
      <div className="glass-panel p-6 bg-[#FFFBF1] border-2 border-[#E3D7BC]">
        <h3 className="text-sm font-extrabold text-[#1B2B45] flex items-center gap-2 mb-2">
          <Search className="w-4 h-4 text-[#2457A6]" />
          Independent Diagnostic Report Integrity Verification
        </h3>
        <p className="text-xs text-[#596579] mb-4 font-medium">
          Verify whether an external lab report PDF or sequencing dataset was certified and anchored to this specimen's immutable hash chain.
        </p>

        <form onSubmit={handleCheckTestReport} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <select
              value={verifySampleId}
              onChange={(e) => setVerifySampleId(e.target.value)}
              className="text-sm font-bold"
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
              className="font-mono text-xs"
            />
          </div>

          <button type="submit" className="btn-secondary text-xs">
            Verify Report On-Chain
          </button>
        </form>

        {verifyResult && (
          <div
            className={`mt-4 p-4.5 rounded-2xl border-2 text-xs animate-fadeIn ${
              verifyResult.matched
                ? "bg-[#DCE6F5] border-[#BDD0EE] text-[#1B4385]"
                : "bg-[#F6D9D4] border-[#EDB8B3] text-[#9E2A20]"
            }`}
          >
            {verifyResult.matched ? (
              <div className="space-y-1">
                <div className="font-extrabold text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2457A6]" /> Report Verified Authentic & On-Chain!
                </div>
                <div className="font-medium">Test Assay: {verifyResult.testName}</div>
                <div className="font-mono">Recorded: {formatTimestamp(verifyResult.timestamp)}</div>
              </div>
            ) : (
              <div className="font-extrabold text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#C23B30]" /> No matching diagnostic report hash found on-chain for this specimen.
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
