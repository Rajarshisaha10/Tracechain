import React, { useState } from "react";
import { useChain } from "../context/ChainContext";
import { hashFile, hashString } from "../utils/crypto";
import { formatTimestamp, shortHash, STATUS_CONFIG } from "../utils/formatters";
import {
  ShieldAlert,
  FileCheck2,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Search,
  Lock,
  Unlock,
  Building,
  FileText
} from "lucide-react";

export default function AuditCompliance({ onSelectSample }) {
  const {
    sandboxData,
    activeAccount,
    recordTest,
    logIncident,
    quarantine,
    release,
    currentActor
  } = useChain();

  const samples = Object.values(sandboxData.samples || {});
  const quarantinedSamples = samples.filter((s) => s.status === 3);

  // Lab Test form state
  const [testSampleId, setTestSampleId] = useState("");
  const [testName, setTestName] = useState("Comprehensive 500-Gene Targeted Exome Sequencing");
  const [reportHash, setReportHash] = useState("0x" + "e5".repeat(32));
  const [reportFileName, setReportFileName] = useState("");
  const [reportUri, setReportUri] = useState("ipfs://bafybeireportngsdiagnostic2026");
  const [testLoading, setTestLoading] = useState(false);

  // Incident form state
  const [incSampleId, setIncSampleId] = useState("");
  const [incDesc, setIncDesc] = useState("Cryogenic container temperature excursion: rose to -15°C for 35 mins");
  const [incEvidenceHash, setIncEvidenceHash] = useState("0x" + "c3".repeat(32));
  const [incLoading, setIncLoading] = useState(false);

  // Test Verifier
  const [verifySampleId, setVerifySampleId] = useState("");
  const [verifyFileHash, setVerifyFileHash] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);

  // Feedback notifications
  const [msg, setMsg] = useState({ text: "", type: "" });

  const isAuditorOrAdmin = currentActor.orgType === 0 || currentActor.orgType === 5;

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
      <div className="glass-panel p-6 border border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            Lab Diagnostics, Incident Reporting & Compliance Clearance
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Permanent diagnostic report hashing, incident auditing, and regulatory quarantine administration.
          </p>
        </div>
      </div>

      {msg.text && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            msg.type === "ok"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {msg.text}
        </div>
      )}

      {/* Quarantined Specimens Audit Section */}
      <div className="glass-panel p-6 border border-rose-500/20 bg-rose-500/[0.02]">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-bold text-white">
              Quarantine Hold Workbench ({quarantinedSamples.length})
            </h3>
          </div>
          <span className="text-[11px] text-rose-300/80 font-mono">
            Requires Auditor Clearance
          </span>
        </div>

        {quarantinedSamples.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            Zero quarantined specimens. All biological inventory is in acceptable status.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quarantinedSamples.map((s) => (
              <div
                key={s.sampleId}
                className="p-4 rounded-xl bg-slate-900/90 border border-rose-500/30 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4
                      onClick={() => onSelectSample(s.sampleId)}
                      className="font-bold text-sm text-white font-mono hover:text-cyan-300 cursor-pointer"
                    >
                      {s.externalId}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{s.sampleType}</p>
                  </div>
                  <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded">
                    QUARANTINED
                  </span>
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <div>Custodian: {shortHash(s.custodian, 4)}</div>
                  <div>Anchor: <span className="font-mono text-cyan-400">{shortHash(s.headHash, 4)}</span></div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectSample(s.sampleId)}
                    className="text-xs text-cyan-400 hover:underline font-semibold"
                  >
                    View Incidents & History
                  </button>

                  <button
                    onClick={() => handleRelease(s.sampleId)}
                    className="btn-primary text-xs py-1.5 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Grant Auditor Release
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
        <div className="glass-panel p-6 border border-white/10">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Record Diagnostic / Genomic Test
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Laboratories Only</span>
          </div>

          <form onSubmit={handleRecordTest} className="space-y-4">
            <div>
              <label>Target Specimen</label>
              <select
                value={testSampleId}
                onChange={(e) => setTestSampleId(e.target.value)}
                className="text-sm"
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
              <label className="border-2 border-dashed border-white/15 hover:border-cyan-500/50 rounded-xl p-3 text-center cursor-pointer block bg-slate-900/40">
                <input type="file" className="hidden" onChange={handleTestFileUpload} />
                <div className="flex flex-col items-center gap-1 text-xs text-slate-400">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  {reportFileName ? (
                    <span className="text-emerald-400 font-semibold truncate max-w-[200px]">
                      ✓ {reportFileName}
                    </span>
                  ) : (
                    <span>Click to pick lab report PDF to compute cryptographic hash</span>
                  )}
                </div>
              </label>
              <div className="font-mono text-[10px] bg-slate-950 p-2 rounded border border-white/5 text-cyan-400 truncate mt-1">
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
        <div className="glass-panel p-6 border border-white/10">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Log Cold-Chain Incident / Breach
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Custodians & Couriers</span>
          </div>

          <form onSubmit={handleLogIncident} className="space-y-4">
            <div>
              <label>Target Specimen</label>
              <select
                value={incSampleId}
                onChange={(e) => setIncSampleId(e.target.value)}
                className="text-sm"
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
      <div className="glass-panel p-6 border border-white/10">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-cyan-400" />
          Independent Diagnostic Report Integrity Verification
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Verify whether an external lab report PDF or sequencing dataset was certified and anchored to this specimen's immutable hash chain.
        </p>

        <form onSubmit={handleCheckTestReport} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <select
              value={verifySampleId}
              onChange={(e) => setVerifySampleId(e.target.value)}
              className="text-sm"
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
            className={`mt-4 p-4 rounded-xl border text-xs animate-fadeIn ${
              verifyResult.matched
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            {verifyResult.matched ? (
              <div className="space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Report Verified Authentic & On-Chain!
                </div>
                <div>Test Assay: {verifyResult.testName}</div>
                <div>Recorded: {formatTimestamp(verifyResult.timestamp)}</div>
              </div>
            ) : (
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> No matching diagnostic report hash found on-chain for this specimen.
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
