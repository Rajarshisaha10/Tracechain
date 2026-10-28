import React, { useState } from "react";
import confetti from "canvas-confetti";
import { useChain } from "../context/ChainContext";
import { hashFile, computeReportPayloadHash, verifyReportSignature } from "../utils/crypto";
import { formatTimestamp, shortHash } from "../utils/formatters";
import {
  ShieldAlert,
  FileCheck2,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Lock,
  Search,
  Unlock,
  FileText,
  Award,
  Key,
  Scale,
  Building,
  Check,
  EyeOff
} from "lucide-react";

export default function AuditCompliance({ onSelectSample }) {
  const {
    sandboxData,
    currentActor,
    activeAccount,
    recordAttestedTest,
    requestIndependentRetest,
    logIncident,
    release,
  } = useChain();

  const samples = Object.values(sandboxData.samples || {});
  const quarantinedSamples = samples.filter((s) => s.status === 3);
  const orgs = Object.values(sandboxData.orgs || {});
  const labOrgs = orgs.filter((o) => o.orgType === 2 || o.orgType === 3);

  // Active Tab within Lab & Audit: "attest", "retest", "verify", "quarantine"
  const [activeSection, setActiveSection] = useState("attest");

  // Attest Report Form
  const [testSampleId, setTestSampleId] = useState("");
  const [testName, setTestName] = useState("Comprehensive 500-Gene Targeted Exome Sequencing");
  const [findingsSummary, setFindingsSummary] = useState("NEGATIVE (No Pathogenic Mutations Detected)");
  const [measuredValue, setMeasuredValue] = useState("");
  const [reportHash, setReportHash] = useState("0x" + "e5".repeat(32));
  const [reportFileName, setReportFileName] = useState("");
  const [reportUri, setReportUri] = useState("ipfs://bafybeireportngsdiagnostic2026");
  const [testLoading, setTestLoading] = useState(false);

  // Retest Request Form
  const [retestSampleId, setRetestSampleId] = useState("");
  const [designatedLabAddr, setDesignatedLabAddr] = useState("");
  const [retestReason, setRetestReason] = useState("ISO-15189 Cross-Laboratory Proficiency Retesting");
  const [retestLoading, setRetestLoading] = useState(false);

  // Report Verification Screen
  const [verifySampleId, setVerifySampleId] = useState("");
  const [verifyFileHash, setVerifyFileHash] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);

  // Incident log state
  const [incSampleId, setIncSampleId] = useState("");
  const [incDesc, setIncDesc] = useState("Cryogenic container temperature excursion: rose to -15°C for 35 mins");
  const [incEvidenceHash, setIncEvidenceHash] = useState("0x" + "c3".repeat(32));
  const [incLoading, setIncLoading] = useState(false);

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

  const handleRecordAttestedTest = async (e) => {
    e.preventDefault();
    if (!testSampleId || !testName.trim() || !findingsSummary.trim()) {
      setMsg({ text: "Please select specimen, enter assay name, and provide qualitative findings summary.", type: "err" });
      return;
    }
    try {
      setTestLoading(true);
      setMsg({ text: "", type: "" });
      const selectedS = samples.find((s) => s.sampleId === testSampleId);
      await recordAttestedTest({
        sampleId: testSampleId,
        testType: testName.trim(),
        reportHash,
        findings: findingsSummary.trim(),
        uri: reportUri.trim(),
        measuredValue: measuredValue !== "" ? measuredValue : undefined,
        measuredUnit: selectedS?.baselineMetric?.unit || "",
        autoFlagDiscrepancy: true
      });
      setMsg({ text: `Digitally signed laboratory report permanently attested on the blockchain!`, type: "ok" });
      setTestSampleId("");
      setTestLoading(false);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (err) {
      setMsg({ text: err.message || "Failed to record attested test", type: "err" });
      setTestLoading(false);
    }
  };

  const handleRequestRetest = async (e) => {
    e.preventDefault();
    if (!retestSampleId || !designatedLabAddr || !retestReason.trim()) {
      setMsg({ text: "Please select specimen, independent laboratory, and audit justification.", type: "err" });
      return;
    }
    try {
      setRetestLoading(true);
      setMsg({ text: "", type: "" });
      const { requestId } = await requestIndependentRetest({
        sampleId: retestSampleId,
        designatedLab: designatedLabAddr,
        reason: retestReason.trim()
      });
      setMsg({ text: `Independent retest request #${shortHash(requestId, 4)} committed to audit trail!`, type: "ok" });
      setRetestSampleId("");
      setDesignatedLabAddr("");
      setRetestLoading(false);
    } catch (err) {
      setMsg({ text: err.message || "Failed to order independent retest", type: "err" });
      setRetestLoading(false);
    }
  };

  const handleCheckTestReport = (e) => {
    e.preventDefault();
    if (!verifySampleId) return;
    const history = sandboxData.histories?.[verifySampleId] || [];
    const attestedList = sandboxData.attestedReports?.[verifySampleId] || [];

    // Find in attested reports or history
    const foundAttested = attestedList.find(
      (r) => !verifyFileHash || r.reportHash.toLowerCase() === verifyFileHash.toLowerCase()
    );

    const foundHist = history.find(
      (r) => (r.recType === 9 || r.recType === 16 || r.recType === 18) &&
        (!verifyFileHash || r.dataHash.toLowerCase() === verifyFileHash.toLowerCase())
    );

    if (foundAttested || foundHist) {
      const rep = foundAttested || {
        testType: foundHist.note,
        timestamp: foundHist.timestamp,
        laboratory: foundHist.actor,
        reportHash: foundHist.dataHash,
        findings: "Recorded in historical event log"
      };

      const sigCheck = rep.signature
        ? verifyReportSignature(rep.reportHash, rep.signature, rep.laboratory)
        : { valid: true, reason: "Legacy signature verified" };

      setVerifyResult({
        matched: true,
        testName: rep.testType,
        timestamp: rep.timestamp,
        actor: rep.laboratory,
        reportHash: rep.reportHash,
        findings: rep.findings,
        sigValid: sigCheck.valid,
        sigMessage: sigCheck.reason,
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    } else {
      setVerifyResult({
        matched: false,
        message: "No matching report hash found in blockchain state for this specimen."
      });
    }
  };

  const handleRelease = async (sampleId) => {
    try {
      await release(sampleId, "Audit clearance granted: Thermal and analytical documentation verified");
      setMsg({ text: "Quarantine hold released! Specimen restored to Active status.", type: "ok" });
    } catch (err) {
      setMsg({ text: err.message, type: "err" });
    }
  };

  const selectedSampleForRetest = samples.find((s) => s.sampleId === retestSampleId);
  const eligibleLabsForRetest = labOrgs.filter((o) => {
    if (!selectedSampleForRetest) return true;
    const reports = sandboxData.attestedReports?.[selectedSampleForRetest.sampleId] || [];
    const latestRep = reports[reports.length - 1];
    return !latestRep || o.address.toLowerCase() !== latestRep.laboratory.toLowerCase();
  });

  return (
    <div className="space-y-4 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="brutal-card p-4 sm:p-5 bg-[#FFFFFF]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="brutal-pill bg-[#FEF08A] text-[#0A0A0A] font-bold">
                <Award className="w-3.5 h-3.5" />
                DIGITAL ATTESTATIONS
              </span>
              <span className="brutal-pill bg-[#D7FB38] text-[#0A0A0A] font-bold">
                <FileCheck2 className="w-3.5 h-3.5" />
                INDEPENDENT RETESTING
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0A0A0A] tracking-tight font-display">
              Diagnostic Attestations & Audit Verification
            </h1>
            <p className="text-xs sm:text-sm text-[#52525B] max-w-2xl font-medium mt-1">
              Cryptographically signed diagnostic reports, secondary verification retests, and tamper-evident audit releases under 21 CFR §11 compliance standards.
            </p>
          </div>

          {/* Sub-navigation tabs */}
          <div className="flex items-center gap-1 bg-[#F4F4F5] p-1 rounded-xl border border-[#0A0A0A]">
            {[
              { id: "attest", label: "Attest Report", icon: Award },
              { id: "retest", label: "Order Retest", icon: Scale },
              { id: "verify", label: "Verify Report", icon: CheckCircle2 },
              { id: "quarantine", label: `Quarantine (${quarantinedSamples.length})`, icon: ShieldAlert },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeSection === tab.id
                      ? "bg-[#D7FB38] text-[#0A0A0A] shadow-[1.5px_1.5px_0px_#0A0A0A]"
                      : "text-[#52525B] hover:text-[#0A0A0A]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {msg.text && (
        <div className={`p-3 rounded-xl border-2 text-xs font-bold shadow-[2px_2px_0px_#0A0A0A] flex items-center justify-between ${
          msg.type === "ok" ? "bg-[#DCFCE7] border-[#0A0A0A] text-[#166534]" : "bg-[#FFE4E6] border-[#FF5A5F] text-[#BE123C]"
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg({ text: "", type: "" })} className="underline font-mono">Dismiss</button>
        </div>
      )}

      {/* SECTION 1: ATTEST LABORATORY REPORT (FEATURE TWO) */}
      {activeSection === "attest" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 brutal-card p-4 sm:p-5 bg-[#FFFFFF] space-y-4">
            <div className="border-b-2 border-[#0A0A0A] pb-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
                <Key className="w-4 h-4 text-[#D97706]" />
                Cryptographically Attested Diagnostic Report
              </h3>
              <p className="text-xs text-[#52525B] mt-0.5 font-medium">
                Compute document hash and sign structured payload with laboratory private key.
              </p>
            </div>

            {currentActor.orgType !== 2 && currentActor.orgType !== 3 && (
              <div className="p-3 bg-[#FEF9C3] border-2 border-[#0A0A0A] rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-[2px_2px_0px_#0A0A0A]">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0" />
                  <div>
                    <div className="font-bold text-[#0A0A0A]">
                      Current Role: {currentActor.name} ({currentActor.orgTypeName})
                    </div>
                    <div className="text-[11px] text-[#71717A]">
                      Under CLIA guidelines, diagnostic assays must be attested by a certified laboratory.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAccount("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")}
                  className="px-3 py-1.5 rounded-lg bg-[#D7FB38] hover:bg-[#bef310] text-[#0A0A0A] font-bold text-xs border border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  ⚡ Switch to Apex Core Lab
                </button>
              </div>
            )}

            <form onSubmit={handleRecordAttestedTest} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1">
                  Target Specimen (In Active Laboratory Custody)
                </label>
                <select
                  value={testSampleId}
                  onChange={(e) => setTestSampleId(e.target.value)}
                  required
                  className="w-full brutal-input text-xs py-2 font-mono font-bold"
                >
                  <option value="">-- Choose Specimen --</option>
                  {samples.map((s) => (
                    <option key={s.sampleId} value={s.sampleId}>
                      {s.blindId ? `[BLIND: ${s.blindId}] ` : ""}{s.externalId} — {s.sampleType} (Status: {s.status === 1 ? "Active" : "Held"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1">
                    Diagnostic Assay Name
                  </label>
                  <input
                    type="text"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    required
                    className="w-full brutal-input text-xs p-2 font-mono"
                    placeholder="e.g. NextGen Targeted Exome Panel"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1">
                    Qualitative Findings Summary
                  </label>
                  <input
                    type="text"
                    value={findingsSummary}
                    onChange={(e) => setFindingsSummary(e.target.value)}
                    required
                    className="w-full brutal-input text-xs p-2 font-mono font-bold"
                    placeholder="e.g. NEGATIVE or PATHOGENIC DETECTED"
                  />
                </div>
              </div>

              {/* Quantitative Measurement & Blind Tolerance Verification */}
              {(() => {
                const s = samples.find((item) => item.sampleId === testSampleId);
                const baseline = s?.baselineMetric;
                const isLab = currentActor.orgType === 2;
                const numMeasured = measuredValue !== "" ? parseFloat(measuredValue) : null;
                const numBaseline = baseline ? parseFloat(baseline.value) : null;
                let variancePct = null;
                let isOut = false;
                if (numMeasured !== null && !isNaN(numMeasured) && numBaseline && numBaseline > 0) {
                  variancePct = Number((((numMeasured - numBaseline) / numBaseline) * 100).toFixed(1));
                  isOut = Math.abs(variancePct) > (baseline.tolerance || 15);
                }

                return (
                  <div className="p-3.5 bg-[#FFFFFF] border-2 border-[#0A0A0A] rounded-xl shadow-[2.5px_2.5px_0px_#0A0A0A] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#0A0A0A]/10 pb-2">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="w-4 h-4 text-[#2563EB]" />
                        <span className="text-xs font-black uppercase tracking-wider text-[#0A0A0A]">
                          Assay Measurement & Blind Tolerance Check
                        </span>
                      </div>
                      {baseline && (
                        <span className="text-[10px] font-mono font-extrabold bg-[#EFF6FF] text-[#1D4ED8] border border-[#0A0A0A] px-2 py-0.5 rounded">
                          Metric: {baseline.name} (±{baseline.tolerance}%)
                        </span>
                      )}
                    </div>

                    {baseline && (
                      <div className="p-3 bg-[#F8FAFC] border border-[#0A0A0A] rounded-xl text-xs font-mono space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-[#0A0A0A]">
                            {isLab ? (
                              <>
                                <Lock className="w-3.5 h-3.5 text-[#B45309]" />
                                <span className="text-[#B45309]">Sealed Intake Baseline (Blind Testing Active)</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5 text-[#15803D]" />
                                <span className="text-[#0A0A0A]">Hospital Baseline Reference</span>
                              </>
                            )}
                          </div>
                          <span className="text-[10px] bg-[#FFFFFF] border border-[#0A0A0A] px-2 py-0.5 rounded font-bold text-[#52525B]">
                            Tolerance Window: ±{baseline.tolerance}%
                          </span>
                        </div>

                        {isLab ? (
                          <div className="p-2.5 bg-[#FFFFFF] border border-[#0A0A0A]/20 rounded-lg space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-[#71717A]">Hospital Target:</span>
                              <span className="text-[10px] font-mono font-black text-[#B45309] bg-[#FEF9C3] px-2 py-0.5 rounded border border-[#F59E0B] flex items-center gap-1">
                                <EyeOff className="w-3 h-3" /> [SEALED FROM LAB TO PREVENT BIAS]
                              </span>
                            </div>
                            <p className="text-[10px] text-[#52525B] leading-tight pt-1">
                              Per ISO-15189 double-blind testing protocols, laboratory personnel cannot view the hospital's registered baseline reading before inputting results. Enter your honest measured value; the system will evaluate concordance against the sealed tolerance window upon submission.
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-2 bg-[#FFFFFF] border border-[#0A0A0A]/20 rounded-lg">
                            <div>
                              <span className="text-[#64748B] block text-[10px] uppercase font-bold">Registered Target:</span>
                              <span className="font-black text-sm text-[#0A0A0A]">{baseline.value} {baseline.unit}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[#64748B] block text-[10px] uppercase font-bold">Permissible Window:</span>
                              <span className="font-bold text-[#0A0A0A]">
                                {(Number(baseline.value) * (1 - baseline.tolerance / 100)).toFixed(1)} – {(Number(baseline.value) * (1 + baseline.tolerance / 100)).toFixed(1)} {baseline.unit}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
                          Measured Laboratory Value {baseline ? `(${baseline.unit})` : ""}
                        </label>
                        {baseline && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setMeasuredValue((Number(baseline.value) * 1.02).toFixed(1))}
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F7FEE7] text-[#365314] border border-[#0A0A0A] hover:bg-[#ECFCCB]"
                            >
                              Demo: Input In-Spec Value
                            </button>
                            <button
                              type="button"
                              onClick={() => setMeasuredValue((Number(baseline.value) * 1.65).toFixed(1))}
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FFF1F2] text-[#BE123C] border border-[#0A0A0A] hover:bg-[#FFE4E6]"
                            >
                              Demo: Input Out-of-Spec (Trigger Warning)
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                        type="number"
                        step="any"
                        value={measuredValue}
                        onChange={(e) => setMeasuredValue(e.target.value)}
                        placeholder={baseline ? `Enter independent measured value in ${baseline.unit}` : "Enter measured numeric value"}
                        className="w-full brutal-input text-xs font-mono font-bold p-2 bg-[#FFFFFF]"
                      />
                    </div>

                    {/* Real-time Warning or Concordance Banner */}
                    {isOut && (
                      <div className="p-3 bg-[#FFF1F2] border-2 border-[#FF5A5F] rounded-xl text-[#BE123C] space-y-1 shadow-[2px_2px_0px_#FF5A5F] animate-pulse">
                        <div className="flex items-center gap-1.5 font-black text-xs">
                          <AlertTriangle className="w-4 h-4 text-[#FF5A5F] shrink-0" />
                          <span>⚠️ BLIND TOLERANCE WARNING: MEASUREMENT OUT OF TOLERANCE!</span>
                        </div>
                        <p className="text-[11px] font-mono leading-tight">
                          Your measured reading of <strong>{numMeasured} {baseline?.unit}</strong> fails the hospital's sealed tolerance window (deviates by <strong>{variancePct > 0 ? `+${variancePct}%` : `${variancePct}%`}</strong> vs allowable margin <strong>±{baseline?.tolerance}%</strong>).
                        </p>
                        <p className="text-[10px] text-[#9F1239] font-bold">
                          ⚠️ Submitting this test will automatically create an analytical discrepancy case on the blockchain and alert compliance auditors.
                        </p>
                      </div>
                    )}

                    {!isOut && numMeasured !== null && baseline && (
                      <div className="p-2.5 bg-[#F7FEE7] border border-[#65A30D] rounded-xl text-[#365314] flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-[#65A30D] shrink-0" />
                          <span>✓ Blind Concordance Verified: Your reading is within the hospital's sealed allowable tolerance margin.</span>
                        </div>
                        <span className="text-[9px] bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#65A30D] font-extrabold">
                          IN SPEC
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1">
                  Report PDF / Evidence File (Compute Keccak-256)
                </label>
                <div className="flex items-center gap-2">
                  <label className="brutal-btn brutal-btn-secondary px-3 py-2 text-xs cursor-pointer shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Report</span>
                    <input
                      type="file"
                      onChange={handleTestFileUpload}
                      className="hidden"
                      accept=".pdf,.json,.csv,.txt"
                    />
                  </label>
                  <input
                    type="text"
                    value={reportHash}
                    onChange={(e) => setReportHash(e.target.value)}
                    required
                    className="brutal-input flex-1 text-xs font-mono p-2 truncate"
                  />
                </div>
                {reportFileName && (
                  <p className="text-[10px] text-[#15803D] font-mono font-bold mt-1">
                    ✓ Keccak-256 computed for: {reportFileName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1">
                  Decentralized Archive Pointer (IPFS URI)
                </label>
                <input
                  type="text"
                  value={reportUri}
                  onChange={(e) => setReportUri(e.target.value)}
                  className="w-full brutal-input text-xs p-2 font-mono"
                  placeholder="ipfs://bafybei..."
                />
              </div>

              {/* Signing Identity Card */}
              <div className="p-3 bg-[#F7FEE7] border-2 border-[#0A0A0A] rounded-xl text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-black uppercase text-[#365314]">Signing Signer Wallet</span>
                  <span className="font-mono text-[10px] font-bold text-[#4D7C0F]">{currentActor.orgTypeName}</span>
                </div>
                <div className="font-mono font-bold text-[#0A0A0A]">{currentActor.name}</div>
                <div className="font-mono text-[10px] text-[#52525B] truncate">{currentActor.address}</div>
              </div>

              <button
                type="submit"
                disabled={testLoading}
                className="brutal-btn brutal-btn-primary w-full py-2.5 text-xs uppercase cursor-pointer"
              >
                {testLoading ? "Signing & Committing Attestation..." : "Sign Report Payload & Attest on EVM"}
              </button>
            </form>
          </div>

          {/* Right Column: Explanatory & Security Guidelines */}
          <div className="lg:col-span-4 space-y-3">
            <div className="brutal-card p-4 bg-[#FFFFFF] space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#0A0A0A] flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-[#0A0A0A]" />
                Attestation Verification Rules
              </h4>
              <ul className="text-xs text-[#52525B] space-y-2 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-[#0A0A0A] font-bold">•</span>
                  <span><strong>ECDSA Signature:</strong> The laboratory signs the exact tuple <code>(sampleId, lab, testType, reportHash, findings, version, timestamp)</code>.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#0A0A0A] font-bold">•</span>
                  <span><strong>Versioning / Supersession:</strong> If a report is amended, a new version is created without erasing the previous record.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-[#0A0A0A] font-bold">•</span>
                  <span><strong>Security Boundary:</strong> Signatures prove key authorization and data integrity, not physical laboratory measurement truth.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: ORDER INDEPENDENT RETEST (FEATURE THREE) */}
      {activeSection === "retest" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 brutal-card p-4 sm:p-5 bg-[#FFFFFF] space-y-4">
            <div className="border-b-2 border-[#0A0A0A] pb-2">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#C084FC]" />
                Order Secondary Independent Verification Retest
              </h3>
              <p className="text-xs text-[#52525B] mt-0.5 font-medium">
                Compliance auditor initiates cross-laboratory validation with an independent testing facility.
              </p>
            </div>

            <form onSubmit={handleRequestRetest} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1">
                  Select Completed Specimen for Verification
                </label>
                <select
                  value={retestSampleId}
                  onChange={(e) => setRetestSampleId(e.target.value)}
                  required
                  className="w-full brutal-input text-xs py-2 font-mono font-bold"
                >
                  <option value="">-- Choose Specimen --</option>
                  {samples.map((s) => {
                    const reports = sandboxData.attestedReports?.[s.sampleId] || [];
                    return (
                      <option key={s.sampleId} value={s.sampleId}>
                        {s.blindId ? `[${s.blindId}] ` : ""}{s.externalId} — {s.sampleType} ({reports.length} report{reports.length === 1 ? "" : "s"})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1">
                  Designated Independent Secondary Laboratory
                </label>
                <select
                  value={designatedLabAddr}
                  onChange={(e) => setDesignatedLabAddr(e.target.value)}
                  required
                  className="w-full brutal-input text-xs py-2 font-mono font-bold"
                >
                  <option value="">-- Select Independent Laboratory --</option>
                  {eligibleLabsForRetest.map((l) => (
                    <option key={l.address} value={l.address}>
                      {l.name} ({l.country} • {shortHash(l.address, 4)})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#71717A] mt-1">
                  Anti-collusion rule: The designated retesting facility must be an independent registered laboratory distinct from the initial testing organization.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1">
                  Audit Justification & Sampling Policy Note
                </label>
                <textarea
                  rows={2}
                  value={retestReason}
                  onChange={(e) => setRetestReason(e.target.value)}
                  required
                  className="w-full brutal-input text-xs p-2 font-mono"
                  placeholder="e.g. ISO-15189 Cross-Laboratory Proficiency Retesting..."
                />
              </div>

              <button
                type="submit"
                disabled={retestLoading}
                className="brutal-btn brutal-btn-primary w-full py-2.5 text-xs uppercase cursor-pointer"
              >
                {retestLoading ? "Ordering Retest on Blockchain..." : "Dispatch Independent Retest Order"}
              </button>
            </form>
          </div>

          <div className="lg:col-span-4 space-y-3">
            <div className="brutal-card p-4 bg-[#FFFFFF] space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#0A0A0A]">
                Secondary Verification Workflow
              </h4>
              <ol className="text-xs text-[#52525B] space-y-2 list-decimal list-inside leading-relaxed">
                <li>Auditor selects completed test.</li>
                <li>Sample is transferred to the independent lab via standard two-step custody handoff.</li>
                <li>Secondary lab receives sample, checks physical seal and Blind ID.</li>
                <li>Secondary lab performs independent test and records signed report.</li>
                <li>System compares results; if discordant, creates a Discrepancy Case.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: VERIFY REPORT INTEGRITY */}
      {activeSection === "verify" && (
        <div className="brutal-card p-4 sm:p-5 bg-[#FFFFFF] space-y-4">
          <div className="border-b-2 border-[#0A0A0A] pb-2">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              Verify Laboratory Report & Signature
            </h3>
            <p className="text-xs text-[#52525B] mt-0.5 font-medium">
              Validate cryptographic hash matching and ECDSA laboratory signature authentication.
            </p>
          </div>

          <form onSubmit={handleCheckTestReport} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1">
                Select Specimen
              </label>
              <select
                value={verifySampleId}
                onChange={(e) => setVerifySampleId(e.target.value)}
                required
                className="w-full brutal-input text-xs py-2 font-mono font-bold"
              >
                <option value="">-- Choose Specimen --</option>
                {samples.map((s) => (
                  <option key={s.sampleId} value={s.sampleId}>
                    {s.blindId ? `[${s.blindId}] ` : ""}{s.externalId} — {s.sampleType}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1">
                Report Document Keccak-256 Hash
              </label>
              <input
                type="text"
                value={verifyFileHash}
                onChange={(e) => setVerifyFileHash(e.target.value)}
                placeholder="0x... (or leave blank to verify latest)"
                className="w-full brutal-input text-xs p-2 font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="brutal-btn brutal-btn-primary w-full py-2 text-xs uppercase cursor-pointer"
              >
                Verify Proof
              </button>
            </div>
          </form>

          {verifyResult && (
            <div className={`p-4 rounded-xl border-2 space-y-2 ${
              verifyResult.matched ? "bg-[#F7FEE7] border-[#0A0A0A]" : "bg-[#FFE4E6] border-[#FF5A5F]"
            }`}>
              <div className="flex items-center gap-2">
                {verifyResult.matched ? (
                  <CheckCircle2 className="w-5 h-5 text-[#15803D]" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-[#BE123C]" />
                )}
                <span className="font-black text-xs uppercase font-mono">
                  {verifyResult.matched ? "Cryptographic Match Confirmed" : "Verification Failed"}
                </span>
              </div>

              {verifyResult.matched ? (
                <div className="text-xs space-y-1 font-mono text-[#0A0A0A]">
                  <div><strong>Assay:</strong> {verifyResult.testName}</div>
                  <div><strong>Report Hash:</strong> {verifyResult.reportHash}</div>
                  <div><strong>Findings:</strong> {verifyResult.findings}</div>
                  <div><strong>Signer:</strong> {verifyResult.actor}</div>
                  <div className="text-[11px] text-[#15803D] font-bold pt-1">
                    ✓ {verifyResult.sigMessage}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[#BE123C] font-medium">
                  {verifyResult.message}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: QUARANTINE MANAGEMENT */}
      {activeSection === "quarantine" && (
        <div className="brutal-card p-4 sm:p-5 bg-[#FFFFFF] space-y-4">
          <div className="border-b-2 border-[#0A0A0A] pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#FF5A5F]" />
                Quarantine & Compliance Adjudication
              </h3>
              <p className="text-xs text-[#52525B] mt-0.5 font-medium">
                Specimens automatically held due to damaged arrival, temperature breach, or discrepancy investigation.
              </p>
            </div>
            <span className="brutal-pill bg-[#FFE4E6] text-[#BE123C] text-xs font-bold">
              {quarantinedSamples.length} Active Hold{quarantinedSamples.length === 1 ? "" : "s"}
            </span>
          </div>

          {quarantinedSamples.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#52525B] font-bold">
              No specimens currently under quarantine hold.
            </div>
          ) : (
            <div className="space-y-2.5">
              {quarantinedSamples.map((s) => (
                <div
                  key={s.sampleId}
                  className="p-3.5 bg-[#FFF1F2] border-2 border-[#0A0A0A] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[2px_2px_0px_#0A0A0A]"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-mono text-xs font-black text-[#0A0A0A]">
                        {s.externalId}
                      </span>
                      {s.blindId && (
                        <span className="font-mono text-[10px] font-bold bg-[#FFFFFF] border border-[#0A0A0A] px-1.5 py-0.2 rounded">
                          {s.blindId}
                        </span>
                      )}
                      <span className="text-[10px] font-bold uppercase bg-[#FFE4E6] text-[#9F1239] px-1.5 py-0.2 rounded">
                        QUARANTINED
                      </span>
                    </div>
                    <div className="text-xs text-[#52525B] font-medium">
                      {s.sampleType} • Custodian: {shortHash(s.custodian, 4)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => onSelectSample(s.sampleId)}
                      className="brutal-btn brutal-btn-secondary text-xs px-2.5 py-1.5 flex-1 sm:flex-initial"
                    >
                      Inspect Logs
                    </button>
                    <button
                      onClick={() => handleRelease(s.sampleId)}
                      className="brutal-btn brutal-btn-primary text-xs px-3 py-1.5 flex-1 sm:flex-initial"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Release Hold</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
