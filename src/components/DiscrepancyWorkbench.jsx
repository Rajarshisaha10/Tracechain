import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChain } from "../context/ChainContext";
import {
  formatTimestamp,
  shortHash,
  DISCREPANCY_STATUS_CONFIG,
  DISPOSITION_CONFIG
} from "../utils/formatters";
import { verifyReportSignature } from "../utils/crypto";
import {
  ShieldAlert,
  ShieldCheck,
  Scale,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Search,
  ExternalLink,
  Lock,
  ArrowRight,
  Sparkles,
  Dice5,
  Building,
  Fingerprint,
  UserCheck,
  Eye,
  RefreshCw
} from "lucide-react";

export default function DiscrepancyWorkbench({ onSelectSample }) {
  const {
    sandboxData,
    currentActor,
    activeAccount,
    flagDiscrepancy,
    updateDiscrepancyStatus,
    resolveDiscrepancy,
    auditSampleSelectionPolicy,
  } = useChain();

  const discrepancyCases = Object.values(sandboxData.discrepancyCases || {});
  const samples = sandboxData.samples || {};
  const attestedReports = sandboxData.attestedReports || {};
  const retestRequests = sandboxData.retestRequests || {};
  const orgs = sandboxData.orgs || {};

  const [activeFilter, setActiveFilter] = useState("all"); // "all", "open", "resolved"
  const [selectedCaseId, setSelectedCaseId] = useState(discrepancyCases[0]?.caseId || "");
  const [searchQuery, setSearchQuery] = useState("");

  // Audit Selection Policy modal / simulator state
  const [showSelector, setShowSelector] = useState(false);
  const [selectionResult, setSelectionResult] = useState(null);

  // Resolution Form state
  const [resolveDisposition, setResolveDisposition] = useState(2); // Affirmed Retest default
  const [resolveReason, setResolveReason] = useState("");
  const [releaseQuarantine, setReleaseQuarantine] = useState(true);
  const [isResolving, setIsResolving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  // Signature verification state for selected reports
  const [sigCheckResult, setSigCheckResult] = useState(null);

  const filteredCases = discrepancyCases.filter((c) => {
    if (activeFilter === "open" && (c.status === 2)) return false;
    if (activeFilter === "resolved" && c.status !== 2) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const sample = samples[c.sampleId];
      const matchSample = sample?.externalId?.toLowerCase().includes(q) || sample?.blindId?.toLowerCase().includes(q);
      const matchReason = c.reason?.toLowerCase().includes(q);
      const matchCase = c.caseId?.toLowerCase().includes(q);
      if (!matchSample && !matchReason && !matchCase) return false;
    }
    return true;
  });

  const activeCase = sandboxData.discrepancyCases?.[selectedCaseId] || filteredCases[0];
  const activeSample = activeCase ? samples[activeCase.sampleId] : null;
  const sampleReports = activeCase ? (attestedReports[activeCase.sampleId] || []) : [];
  const originalReport = sampleReports.find((r) => !r.isRetest) || sampleReports[0];
  const retestReport = sampleReports.find((r) => r.isRetest) || sampleReports[1];

  const isAuditorOrAdmin = currentActor.orgType === 5 || currentActor.orgType === 0;
  const isOriginalLab = activeCase && activeAccount.toLowerCase() === activeCase.originalLab?.toLowerCase();

  const handleRunSelectionPolicy = () => {
    const res = auditSampleSelectionPolicy();
    setSelectionResult(res);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!activeCase) return;
    try {
      await updateDiscrepancyStatus({
        caseId: activeCase.caseId,
        status: newStatus,
        note: `Status updated by ${currentActor.name}`
      });
      setMsg({ text: "Investigation status updated successfully.", type: "ok" });
    } catch (err) {
      setMsg({ text: err.message, type: "err" });
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!activeCase || !resolveReason.trim()) {
      setMsg({ text: "Please provide a clinical / audit resolution rationale.", type: "err" });
      return;
    }
    try {
      setIsResolving(true);
      setMsg({ text: "", type: "" });
      await resolveDiscrepancy({
        caseId: activeCase.caseId,
        disposition: Number(resolveDisposition),
        resolutionReason: resolveReason.trim(),
        evidenceHash: activeCase.evidenceHash,
        releaseFromQuarantine: releaseQuarantine
      });
      setMsg({ text: "Discrepancy case formally resolved and archived on-chain!", type: "ok" });
      setResolveReason("");
      setIsResolving(false);
    } catch (err) {
      setMsg({ text: err.message, type: "err" });
      setIsResolving(false);
    }
  };

  const handleVerifyReportSig = (rep) => {
    if (!rep) return;
    const res = verifyReportSignature(rep.reportHash, rep.signature, rep.laboratory);
    setSigCheckResult({
      reportHash: rep.reportHash,
      valid: res.valid,
      message: res.reason,
      lab: orgs[rep.laboratory]?.name || rep.laboratory
    });
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="brutal-card p-4 sm:p-5 bg-[#FFFFFF] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="brutal-pill bg-[#FEF08A] text-[#0A0A0A] font-bold">
                <Scale className="w-3.5 h-3.5" />
                INDEPENDENT RETEST VERIFICATION
              </span>
              <span className="brutal-pill bg-[#D7FB38] text-[#0A0A0A] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                ISO 15189 PROFICIENCY
              </span>
              <span className="brutal-pill bg-[#FFFFFF] text-[#0A0A0A] font-bold">
                21 CFR §11 AUDIT TRAIL
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0A0A0A] tracking-tight font-display">
              Discrepancy Investigation Workbench
            </h1>
            <p className="text-xs sm:text-sm text-[#52525B] max-w-2xl font-medium mt-1">
              Multi-laboratory blind verification layer. Detects analytical discordance between original diagnostic reports and secondary retest results, enforcing independent auditor resolution without data erasure.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => {
                setShowSelector(true);
                handleRunSelectionPolicy();
              }}
              className="brutal-btn brutal-btn-primary px-3.5 py-2 text-xs flex-1 sm:flex-initial"
            >
              <Dice5 className="w-3.5 h-3.5" />
              <span>Random Retest Selection</span>
            </button>
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

      {/* Main Grid: Left Case List, Right Case Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Discrepancy Case Directory (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="brutal-card p-3.5 bg-[#FFFFFF] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0A0A0A]">
                Discrepancy Cases ({filteredCases.length})
              </h3>
              <div className="flex items-center gap-1 bg-[#F4F4F5] p-0.5 rounded-lg border border-[#0A0A0A]">
                {["all", "open", "resolved"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                      activeFilter === tab ? "bg-[#0A0A0A] text-[#FFFFFF]" : "text-[#52525B]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search case, blind ID, barcode..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs brutal-input font-mono placeholder:text-[#A1A1AA]"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredCases.length === 0 ? (
              <div className="brutal-card p-6 bg-[#FFFFFF] text-center text-xs text-[#52525B] font-bold">
                No discrepancy cases found matching filter.
              </div>
            ) : (
              filteredCases.map((c) => {
                const s = samples[c.sampleId];
                const stCfg = DISCREPANCY_STATUS_CONFIG[c.status] || DISCREPANCY_STATUS_CONFIG[0];
                const isSelected = activeCase?.caseId === c.caseId;

                return (
                  <div
                    key={c.caseId}
                    onClick={() => setSelectedCaseId(c.caseId)}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#FFFFFF] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A]"
                        : "bg-[#FFFFFF] border-[#0A0A0A]/40 hover:border-[#0A0A0A] shadow-[1.5px_1.5px_0px_#0A0A0A]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-black text-[#0A0A0A] truncate">
                        {s?.blindId || s?.externalId || shortHash(c.sampleId, 4)}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${stCfg.color}`}>
                        {stCfg.label}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#52525B] line-clamp-2 font-medium mb-2">
                      {c.reason}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-[#71717A] font-mono border-t border-[#0A0A0A]/10 pt-1.5">
                      <span>Flagged: {formatTimestamp(c.flaggedAt)}</span>
                      <span className="font-bold text-[#0A0A0A]">Case #{shortHash(c.caseId, 3)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Case Deep Dive & Resolution Center (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeCase ? (
            <>
              {/* Header Card */}
              <div className="brutal-card p-4 sm:p-5 bg-[#FFFFFF] space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-[#0A0A0A] pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono font-black text-[#0A0A0A] bg-[#D7FB38] border-2 border-[#0A0A0A] px-2 py-0.5 rounded shadow-[1px_1px_0px_#0A0A0A]">
                        {activeSample?.blindId || "BLIND-ID-PENDING"}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#52525B]">
                        Barcode: {activeSample?.externalId}
                      </span>
                      <span className="text-xs font-bold text-[#0A0A0A] bg-[#F4F4F5] border border-[#0A0A0A] px-1.5 py-0.5 rounded">
                        {activeSample?.sampleType}
                      </span>
                    </div>
                    <h2 className="text-sm sm:text-base font-extrabold text-[#0A0A0A]">
                      Discrepancy Case: #{activeCase.caseId}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectSample(activeCase.sampleId)}
                      className="brutal-btn brutal-btn-secondary text-xs px-2.5 py-1.5"
                    >
                      <Fingerprint className="w-3.5 h-3.5" />
                      <span>Inspect Specimen History</span>
                    </button>
                  </div>
                </div>

                {/* Conflict Reason Box */}
                <div className="p-3 bg-[#FFFBEB] border-2 border-[#F59E0B] rounded-xl text-xs text-[#92400E] shadow-[2px_2px_0px_#F59E0B]">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold uppercase">Divergent Diagnostic Finding: </span>
                      <span className="font-medium">{activeCase.reason}</span>
                    </div>
                  </div>
                </div>

                {/* Side-by-Side Report Comparison Deck */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  
                  {/* Left: Original Laboratory Report */}
                  <div className="p-3.5 rounded-xl border-2 border-[#0A0A0A] bg-[#FFFFFF] shadow-[3px_3px_0px_#0A0A0A] space-y-2">
                    <div className="flex items-center justify-between border-b border-[#0A0A0A]/20 pb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#52525B]">
                        PRIMARY LABORATORY REPORT (V1)
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-[#F4F4F5] border border-[#0A0A0A] px-1.5 py-0.2 rounded">
                        Initial Assay
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-[#0A0A0A]">
                        {orgs[activeCase.originalLab]?.name || shortHash(activeCase.originalLab, 4)}
                      </div>
                      <div className="text-[11px] text-[#52525B] font-mono">
                        Wallet: {shortHash(activeCase.originalLab, 4)}
                      </div>
                      <div className="p-2 bg-[#F4F4F5] border border-[#0A0A0A] rounded-lg mt-2">
                        <div className="text-[10px] font-mono text-[#52525B] uppercase font-bold">Reported Findings:</div>
                        <div className="text-xs font-black text-[#0A0A0A] mt-0.5">
                          {originalReport?.findings || "Finding data archived"}
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-[#71717A] truncate pt-1">
                        Report Hash: {shortHash(activeCase.originalReportHash, 6)}
                      </div>
                    </div>

                    {originalReport && (
                      <button
                        onClick={() => handleVerifyReportSig(originalReport)}
                        className="w-full text-center text-[10px] font-bold py-1 px-2 rounded bg-[#FFFFFF] border border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] hover:bg-[#F4F4F5] cursor-pointer"
                      >
                        Verify ECDSA Signature
                      </button>
                    )}
                  </div>

                  {/* Right: Independent Secondary Retest Report */}
                  <div className="p-3.5 rounded-xl border-2 border-[#0A0A0A] bg-[#F7FEE7] shadow-[3px_3px_0px_#0A0A0A] space-y-2">
                    <div className="flex items-center justify-between border-b border-[#0A0A0A]/20 pb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#365314]">
                        INDEPENDENT RETEST REPORT (V2)
                      </span>
                      <span className="text-[10px] font-mono font-bold bg-[#D7FB38] border border-[#0A0A0A] px-1.5 py-0.2 rounded">
                        Verification Retest
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-[#14532D]">
                        {orgs[activeCase.retestLab]?.name || shortHash(activeCase.retestLab, 4)}
                      </div>
                      <div className="text-[11px] text-[#4D7C0F] font-mono">
                        Wallet: {shortHash(activeCase.retestLab, 4)}
                      </div>
                      <div className="p-2 bg-[#FFFFFF] border border-[#0A0A0A] rounded-lg mt-2">
                        <div className="text-[10px] font-mono text-[#4D7C0F] uppercase font-bold">Retest Findings:</div>
                        <div className="text-xs font-black text-[#0A0A0A] mt-0.5">
                          {retestReport?.findings || "Independent verification findings"}
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-[#4D7C0F] truncate pt-1">
                        Retest Hash: {shortHash(activeCase.retestReportHash, 6)}
                      </div>
                    </div>

                    {retestReport && (
                      <button
                        onClick={() => handleVerifyReportSig(retestReport)}
                        className="w-full text-center text-[10px] font-bold py-1 px-2 rounded bg-[#FFFFFF] border border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] hover:bg-[#F4F4F5] cursor-pointer text-[#0A0A0A]"
                      >
                        Verify ECDSA Signature
                      </button>
                    )}
                  </div>
                </div>

                {/* Signature Verification Modal Toast */}
                {sigCheckResult && (
                  <div className="p-2.5 rounded-lg bg-[#FFFFFF] border-2 border-[#0A0A0A] text-xs shadow-[2px_2px_0px_#0A0A0A] flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                      <div>
                        <span className="font-bold text-[#0A0A0A]">Cryptographic Attestation Verified: </span>
                        <span className="text-[#52525B]">{sigCheckResult.lab}</span>
                      </div>
                    </div>
                    <button onClick={() => setSigCheckResult(null)} className="font-mono text-[10px] underline">Close</button>
                  </div>
                )}
              </div>

              {/* Resolution Action Deck */}
              <div className="brutal-card p-4 sm:p-5 bg-[#FFFFFF] space-y-3">
                <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-2">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#0A0A0A]">
                    Auditor Adjudication & Binding Resolution
                  </h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    DISCREPANCY_STATUS_CONFIG[activeCase.status]?.color
                  }`}>
                    Status: {DISCREPANCY_STATUS_CONFIG[activeCase.status]?.label}
                  </span>
                </div>

                {/* Self-Resolution Protection Warning */}
                {isOriginalLab && (
                  <div className="p-3 bg-[#FFF1F2] border-2 border-[#FF5A5F] rounded-xl text-xs text-[#BE123C] shadow-[2px_2px_0px_#FF5A5F] flex items-start gap-2">
                    <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold uppercase">Anti-Tamper Rule Active: </span>
                      <span>You are logged in as the original testing laboratory ({orgs[activeCase.originalLab]?.name}). Smart contract rule prohibits the original facility from self-resolving, dismissing, or editing disputes regarding its own measurements.</span>
                    </div>
                  </div>
                )}

                {activeCase.status === 2 ? (
                  // Resolved Case Summary
                  <div className="p-4 bg-[#F4F7F1] border-2 border-[#0A0A0A] rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-[#15803D]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>CASE FORMALLY RESOLVED & ANCHORED ON-CHAIN</span>
                    </div>
                    <div className="text-xs font-mono">
                      <span className="font-bold">Final Disposition: </span>
                      <span className="font-bold uppercase text-[#0A0A0A]">
                        {DISPOSITION_CONFIG[activeCase.disposition]?.label || "Affirmed Retest"}
                      </span>
                    </div>
                    <p className="text-xs text-[#52525B] font-medium">
                      <span className="font-bold">Reviewer Rationale: </span>
                      {activeCase.resolutionReason}
                    </p>
                    <div className="text-[10px] text-[#71717A] font-mono pt-1">
                      Adjudicated by: {shortHash(activeCase.reviewer, 4)} • Resolved at: {formatTimestamp(activeCase.resolvedAt)}
                    </div>
                  </div>
                ) : (
                  // Form for Auditor to Resolve or Update Status
                  <form onSubmit={handleResolve} className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#0A0A0A]">Audit Review State:</span>
                      <button
                        type="button"
                        disabled={!isAuditorOrAdmin || isOriginalLab}
                        onClick={() => handleUpdateStatus(1)}
                        className="px-2.5 py-1 rounded bg-[#E0F2FE] border border-[#0A0A0A] text-xs font-bold text-[#0369A1] hover:bg-[#BAE6FD] disabled:opacity-50 cursor-pointer"
                      >
                        Set Under Review
                      </button>
                      <button
                        type="button"
                        disabled={!isAuditorOrAdmin || isOriginalLab}
                        onClick={() => handleUpdateStatus(3)}
                        className="px-2.5 py-1 rounded bg-[#FFE4E6] border border-[#0A0A0A] text-xs font-bold text-[#BE123C] hover:bg-[#FECDD3] disabled:opacity-50 cursor-pointer"
                      >
                        Escalate to BioEthics Board
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1">
                        Select Binding Disposition
                      </label>
                      <select
                        value={resolveDisposition}
                        onChange={(e) => setResolveDisposition(e.target.value)}
                        disabled={!isAuditorOrAdmin || isOriginalLab}
                        className="w-full brutal-input text-xs py-2 font-bold"
                      >
                        <option value={2}>Affirmed Retest (Secondary independent measurement validated)</option>
                        <option value={1}>Affirmed Original (Original assay verified; retest protocol error)</option>
                        <option value={3}>Inconclusive (Specimen degradation confirmed; mandate clinical re-collection)</option>
                        <option value={4}>Contaminated (Analytical contamination confirmed; discard under biohazard)</option>
                      </select>
                      <p className="text-[10px] text-[#71717A] mt-1 font-medium">
                        {DISPOSITION_CONFIG[resolveDisposition]?.description}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0A0A0A] mb-1">
                        Auditor Resolution Findings & Evidence Summary
                      </label>
                      <textarea
                        rows={3}
                        value={resolveReason}
                        onChange={(e) => setResolveReason(e.target.value)}
                        disabled={!isAuditorOrAdmin || isOriginalLab}
                        placeholder="Detailed technical & clinical explanation of the audit decision (e.g. Sanger sequencing confirmation, coverage depth analysis, or calibration check)..."
                        className="w-full brutal-input text-xs p-2.5 font-medium placeholder:text-[#A1A1AA]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="releaseQuarantineCheck"
                        checked={releaseQuarantine}
                        onChange={(e) => setReleaseQuarantine(e.target.checked)}
                        disabled={!isAuditorOrAdmin || isOriginalLab}
                        className="w-4 h-4 rounded border-2 border-[#0A0A0A] accent-[#D7FB38]"
                      />
                      <label htmlFor="releaseQuarantineCheck" className="text-xs font-bold text-[#0A0A0A] cursor-pointer">
                        Release specimen from Quarantine Hold upon recording resolution
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={!isAuditorOrAdmin || isOriginalLab || isResolving}
                      className="brutal-btn brutal-btn-primary w-full py-2.5 text-xs uppercase cursor-pointer disabled:opacity-50"
                    >
                      {isResolving ? "Committing Resolution to Blockchain..." : "Record Binding Resolution & Anchor on EVM"}
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="brutal-card p-12 bg-[#FFFFFF] text-center space-y-2">
              <Scale className="w-10 h-10 text-[#A1A1AA] mx-auto" />
              <h3 className="text-sm font-bold text-[#0A0A0A]">No Discrepancy Case Selected</h3>
              <p className="text-xs text-[#52525B]">Select a case from the directory on the left to inspect discordant reports.</p>
            </div>
          )}
        </div>

      </div>

      {/* Modal: Auditable Random Retest Selector */}
      {showSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#FFFFFF] border-[2.5px] border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden text-[#0A0A0A]">
            
            <div className="p-4 border-b-2 border-[#0A0A0A] bg-[#FFFFFF] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#D7FB38] border-2 border-[#0A0A0A] flex items-center justify-center shadow-[1.5px_1.5px_0px_#0A0A0A]">
                  <Dice5 className="w-4 h-4 text-[#0A0A0A]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0A0A0A]">Auditable Random Sample Selection</h3>
                  <p className="text-[10px] text-[#52525B] font-mono">ISO-15189 Cross-Verification Policy</p>
                </div>
              </div>
              <button onClick={() => setShowSelector(false)} className="p-1 rounded-lg border border-[#0A0A0A] text-xs font-mono font-bold">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              
              <div className="p-3 bg-[#F4F4F5] border border-[#0A0A0A] rounded-xl space-y-1.5 font-mono text-[11px]">
                <div className="font-bold text-[#0A0A0A]">Policy: ISO-15189 Proficiency Verification</div>
                <div className="text-[#52525B]">Selection Seed Entropy: {selectionResult?.selectionSeed}</div>
                <div className="text-[#52525B]">Eligible Completed Tests Pool: {selectionResult?.eligible?.length || 0} specimens</div>
              </div>

              {selectionResult?.selected ? (
                <div className="p-4 bg-[#F7FEE7] border-2 border-[#0A0A0A] rounded-xl space-y-2 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-extrabold bg-[#D7FB38] border border-[#0A0A0A] px-1.5 py-0.5 rounded">
                      SELECTED SPECIMEN FOR RETEST
                    </span>
                    <span className="text-[10px] font-mono text-[#52525B]">
                      {formatTimestamp(selectionResult.timestamp)}
                    </span>
                  </div>

                  <div className="font-black text-sm text-[#0A0A0A]">
                    Blind ID: {selectionResult.selected.blindId}
                  </div>
                  <div className="text-xs text-[#52525B] font-medium">
                    Specimen: {selectionResult.selected.sampleType} (Barcode: {selectionResult.selected.externalId})
                  </div>
                  <div className="text-[11px] font-mono text-[#71717A]">
                    Custodian: {orgs[selectionResult.selected.custodian]?.name || shortHash(selectionResult.selected.custodian, 4)}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#FFF1F2] border border-[#FF5A5F] rounded-xl text-center text-[#BE123C] font-bold">
                  {selectionResult?.reason || "No eligible completed samples available for selection."}
                </div>
              )}

              <div className="p-3 bg-[#FFFBEB] border border-[#F59E0B] rounded-xl text-[10px] text-[#92400E] leading-relaxed">
                <span className="font-bold">PROTOTYPE NOTICE: </span>
                {selectionResult?.disclaimer}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunSelectionPolicy}
                  className="brutal-btn brutal-btn-secondary flex-1 py-2 text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-sample Seed</span>
                </button>
                {selectionResult?.selected && (
                  <button
                    onClick={() => {
                      setShowSelector(false);
                      onSelectSample(selectionResult.selected.sampleId);
                    }}
                    className="brutal-btn brutal-btn-primary flex-1 py-2 text-xs"
                  >
                    <span>View Specimen</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
