import React, { useState } from "react";
import confetti from "canvas-confetti";
import { useChain } from "../context/ChainContext";
import { verifyClientChain, verifyReportSignature } from "../utils/crypto";
import { resolveIdentity } from "../services/identityMappingService";
import {
  formatTimestamp,
  formatTemp,
  shortHash,
  STATUS_CONFIG,
  RECORD_TYPE_NAMES,
  DISCREPANCY_STATUS_CONFIG
} from "../utils/formatters";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  Thermometer,
  QrCode,
  GitFork,
  Copy,
  Check,
  FileText,
  Lock,
  Building,
  ArrowLeftRight,
  Flame,
  Calendar,
  EyeOff,
  Eye,
  Scale,
  Award,
  AlertTriangle,
  CheckCircle2,
  FlaskConical
} from "lucide-react";

export default function SampleDetailModal({
  sampleId,
  onClose,
  onOpenTransfer,
  onOpenStorage,
  onOpenAliquot,
  onOpenQr
}) {
  const { sandboxData, tamperRecord, currentActor, activeAccount, recordAttestedTest, setActiveAccount } = useChain();
  const sample = sandboxData.samples?.[sampleId];
  const history = sandboxData.histories?.[sampleId] || [];
  const children = sandboxData.childrenMap?.[sampleId] || [];
  const attestedReports = sandboxData.attestedReports?.[sampleId] || [];
  const discrepancyCaseIds = sandboxData.sampleDiscrepancyCases?.[sampleId] || [];

  const [verifyResult, setVerifyResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedHash, setCopiedHash] = useState("");
  const [sigCheckToast, setSigCheckToast] = useState(null);
  const [labInputVal, setLabInputVal] = useState("");
  const [isSubmittingLab, setIsSubmittingLab] = useState(false);
  const [labSubmitMsg, setLabSubmitMsg] = useState(null);

  const handleDirectLabSubmit = async () => {
    if (!labInputVal) return;
    try {
      setIsSubmittingLab(true);
      setLabSubmitMsg(null);
      const measuredNum = parseFloat(labInputVal);
      const baselineVal = Number(sample.baselineMetric?.value || 50);
      const tol = Number(sample.baselineMetric?.tolerance || 15);
      const isOut = Math.abs(((measuredNum - baselineVal) / baselineVal) * 100) > tol;

      await recordAttestedTest({
        sampleId: sample.sampleId,
        testType: "Analytical Diagnostic Assay",
        reportHash: "0x" + "a7".repeat(32),
        findings: isOut
          ? `ANALYTICAL DEVIATION: Measured ${labInputVal} ${sample.baselineMetric?.unit || "units"}`
          : `CONCORDANT ASSAY: Measured ${labInputVal} ${sample.baselineMetric?.unit || "units"}`,
        uri: "ipfs://bafybeilabmeasuredreading2026",
        measuredValue: labInputVal,
        measuredUnit: sample.baselineMetric?.unit || "ng/µL",
        autoFlagDiscrepancy: true
      });

      setIsSubmittingLab(false);
      setLabInputVal("");
      setLabSubmitMsg({
        type: "ok",
        text: "✓ Laboratory reading successfully recorded and anchored on the blockchain!"
      });
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setIsSubmittingLab(false);
      setLabSubmitMsg({
        type: "err",
        text: err.message || "Failed to record lab reading"
      });
    }
  };

  // Off-chain identity resolution state (Role-gated)
  const [unmaskedIdentity, setUnmaskedIdentity] = useState(null);
  const [hasAttemptedUnmask, setHasAttemptedUnmask] = useState(false);

  if (!sample) return null;

  const statusCfg = STATUS_CONFIG[sample.status] || STATUS_CONFIG[0];
  const isChild = sample.parentId && sample.parentId !== "0x0000000000000000000000000000000000000000000000000000000000000000";

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(label);
    setTimeout(() => setCopiedHash(""), 2000);
  };

  const runVerification = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const res = verifyClientChain(sample.sampleId, history, sample.headHash);
      setVerifyResult(res);
      setIsVerifying(false);
      if (res.valid) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    }, 300);
  };

  const handleTamperDemo = () => {
    if (history.length > 1) {
      tamperRecord(sample.sampleId, 1, "[MALICIOUS RECORD ALTERATION: Falsified temperature data]");
      runVerification();
    }
  };

  const handleResolveIdentity = () => {
    setHasAttemptedUnmask(true);
    const res = resolveIdentity(sample.blindId, activeAccount, currentActor.orgType);
    setUnmaskedIdentity(res);
  };

  const handleVerifyReportSig = (rep) => {
    const res = verifyReportSignature(rep.reportHash, rep.signature, rep.laboratory);
    setSigCheckToast({
      reportHash: rep.reportHash,
      valid: res.valid,
      message: res.reason,
      lab: sandboxData.orgs?.[rep.laboratory]?.name || rep.laboratory
    });
  };

  const getOrgName = (addr) => {
    return sandboxData.orgs?.[addr]?.name || shortHash(addr, 4);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FFFFFF] border-[2.5px] border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-[#0A0A0A]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b-2 border-[#0A0A0A] bg-[#FFFFFF] flex items-start justify-between gap-3 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#D7FB38] border-2 border-[#0A0A0A] flex items-center justify-center text-[#0A0A0A] shrink-0 shadow-[2px_2px_0px_#0A0A0A]">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-[#0A0A0A] font-mono truncate">
                  {sample.externalId}
                </h2>
                <span className="brutal-pill bg-[#D7FB38] text-[10px]">
                  {statusCfg.label}
                </span>
                {sample.blindId && (
                  <span className="brutal-pill bg-[#F7FEE7] text-[#365314] text-[10px] flex items-center gap-1 font-mono">
                    <EyeOff className="w-2.5 h-2.5" />
                    {sample.blindId}
                  </span>
                )}
                {isChild && (
                  <span className="brutal-pill bg-[#FDE047] text-[10px]">
                    Aliquot
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#52525B] mt-0.5 font-mono truncate font-semibold">
                {sample.sampleType} • Anchor: {shortHash(sample.sampleId, 4)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onOpenQr(sample)}
              className="p-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F4F4F5] border-2 border-[#0A0A0A] shadow-[1.5px_1.5px_0px_#0A0A0A] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
              title="Barcode QR View"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#FFE4E6] border-2 border-[#0A0A0A] shadow-[1.5px_1.5px_0px_#0A0A0A] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Quick Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-[#F7F8F4] border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => onOpenTransfer(sample)}
                className="brutal-btn brutal-btn-secondary text-xs py-1.5 px-2.5 cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#0A0A0A]" />
                <span>Transfer</span>
              </button>
              <button
                onClick={() => onOpenStorage(sample)}
                className="brutal-btn brutal-btn-secondary text-xs py-1.5 px-2.5 cursor-pointer"
              >
                <Thermometer className="w-3.5 h-3.5 text-[#0A0A0A]" />
                <span>Storage</span>
              </button>
              <button
                onClick={() => onOpenAliquot(sample)}
                className="brutal-btn brutal-btn-secondary text-xs py-1.5 px-2.5 cursor-pointer"
              >
                <GitFork className="w-3.5 h-3.5 text-[#C084FC]" />
                <span>Aliquot</span>
              </button>
            </div>

            {/* Run Verification Button & Tamper Demo */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={runVerification}
                disabled={isVerifying}
                className="brutal-btn brutal-btn-primary text-xs py-1.5 px-3 font-mono uppercase cursor-pointer"
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin" : ""}`} />
                <span>{isVerifying ? "Verifying Proof..." : "Verify Hash Chain"}</span>
              </button>

              <button
                onClick={handleTamperDemo}
                title="Simulate malicious data tampering"
                className="brutal-btn brutal-btn-danger text-xs py-1.5 px-2.5 font-mono uppercase cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Tamper Attack</span>
              </button>
            </div>
          </div>

          {/* Verification Result Banner */}
          {verifyResult && (
            <div
              className={`p-3.5 rounded-xl border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] flex items-start gap-2.5 ${
                verifyResult.valid
                  ? "bg-[#D7FB38] text-[#0A0A0A] animate-fadeIn"
                  : "bg-[#FF5A5F] text-white animate-shake"
              }`}
            >
              {verifyResult.valid ? (
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-[#0A0A0A]" />
              ) : (
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-white animate-bounce" />
              )}
              <div className="flex-1 text-xs">
                <div className="font-black text-sm uppercase font-mono">
                  {verifyResult.valid
                    ? "Cryptographic Provenance 100% Intact"
                    : "TAMPER ALERT — Mathematical Hash Mismatch!"}
                </div>
                <p className="mt-0.5 leading-relaxed font-semibold">
                  {verifyResult.valid
                    ? `Every hash link from anchor root (#${shortHash(sample.sampleId, 3)}) to tip (${shortHash(sample.headHash, 3)}) matches mathematical keccak-256 specifications.`
                    : verifyResult.reason}
                </p>
                {verifyResult.valid && (
                  <div className="mt-1 text-[11px] font-mono font-bold">
                    Verified {verifyResult.totalSteps} cryptographic records across EVM ledger.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Discrepancy Case Alert */}
          {discrepancyCaseIds.length > 0 && (
            <div className="p-3 bg-[#FEF3C7] border-2 border-[#D97706] rounded-xl text-xs text-[#92400E] shadow-[2px_2px_0px_#D97706] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#D97706]" />
                <span className="font-bold">Active Discrepancy Under Investigation: #{shortHash(discrepancyCaseIds[0], 4)}</span>
              </div>
              <span className="font-mono text-[10px] font-black uppercase bg-[#FFFFFF] border border-[#0A0A0A] px-2 py-0.5 rounded">
                See Workbench
              </span>
            </div>
          )}

          {/* Feature One: Off-Chain Privacy & Blind Testing Box */}
          <div className="p-4 bg-[#FFFFFF] border-2 border-[#0A0A0A] rounded-xl shadow-[3px_3px_0px_#0A0A0A] space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#0A0A0A]/20 pb-2">
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-[#65A30D]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-[#0A0A0A]">
                  Blind Testing & Off-Chain Patient Privacy
                </h4>
              </div>
              <span className="text-[10px] font-mono font-extrabold bg-[#F7FEE7] text-[#365314] border border-[#0A0A0A] px-2 py-0.5 rounded">
                HIPAA / GDPR Boundary
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#52525B] font-bold">Blind Testing Identifier (On-Chain):</span>
                <div className="font-mono font-black text-sm text-[#0A0A0A] mt-0.5">
                  {sample.blindId || "Not assigned"}
                </div>
                <p className="text-[10px] text-[#71717A] mt-0.5">
                  Laboratories identify this specimen solely by this opaque blind ID to eliminate confirmation bias.
                </p>
              </div>

              <div>
                <span className="text-[#52525B] font-bold">Patient Identity Mapping:</span>
                {!hasAttemptedUnmask ? (
                  <button
                    onClick={handleResolveIdentity}
                    className="mt-1 brutal-btn brutal-btn-secondary text-[11px] py-1 px-2.5 w-full cursor-pointer"
                  >
                    <Eye className="w-3 h-3 text-[#0A0A0A]" />
                    <span>Attempt Role-Gated Unmasking</span>
                  </button>
                ) : unmaskedIdentity?.masked ? (
                  <div className="p-2 bg-[#F4F4F5] border border-[#0A0A0A] rounded-lg mt-1 text-[11px] text-[#52525B] leading-tight">
                    <span className="font-bold text-[#BE123C]">Identity Masked: </span>
                    {unmaskedIdentity.message}
                  </div>
                ) : (
                  <div className="p-2 bg-[#F7FEE7] border border-[#0A0A0A] rounded-lg mt-1 text-[11px] text-[#365314] space-y-0.5">
                    <div className="font-bold text-[#0A0A0A]">
                      Patient: {unmaskedIdentity?.patientData?.patientName} (DOB: {unmaskedIdentity?.patientData?.dob})
                    </div>
                    <div className="text-[10px] font-mono text-[#52525B]">
                      Requisition: {unmaskedIdentity?.patientData?.clinicalRequisition}
                    </div>
                    <div className="text-[9px] text-[#15803D] font-mono font-bold">
                      ✓ Authorized access logged for: {getOrgName(activeAccount)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feature: Analytical Baseline & Assay Concordance Benchmark */}
          <div className="p-4 bg-[#FFFFFF] border-2 border-[#0A0A0A] rounded-xl shadow-[3px_3px_0px_#0A0A0A] space-y-3">
            <div className="flex items-center justify-between border-b border-[#0A0A0A]/20 pb-2">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[#D97706]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-[#0A0A0A]">
                  Analytical Baseline & Concordance Benchmark
                </h4>
              </div>
              <span className="text-[10px] font-mono font-bold bg-[#FEF9C3] text-[#854D0E] border border-[#0A0A0A] px-2 py-0.5 rounded">
                Tolerance: ±{sample.baselineMetric?.tolerance || 15}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-[#F7F8F4] border border-[#0A0A0A] rounded-lg">
                <span className="text-[#52525B] font-mono text-[10px] uppercase font-bold block">
                  Registered Target ({sample.baselineMetric?.name || "Analyte Benchmark"}):
                </span>
                {currentActor.orgType === 2 ? (
                  <div className="mt-1">
                    <span className="font-mono font-bold text-xs text-[#B45309] bg-[#FEF9C3] px-2 py-0.5 rounded border border-[#F59E0B] inline-flex items-center gap-1">
                      <Lock className="w-3 h-3" /> SEALED BY HOSPITAL (BLIND ACTIVE)
                    </span>
                    <p className="text-[10px] text-[#71717A] mt-1 font-mono">
                      Target value hidden from laboratories to eliminate confirmation bias.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="font-mono font-black text-sm text-[#0A0A0A] mt-0.5">
                      {sample.baselineMetric?.value !== undefined ? `${sample.baselineMetric.value} ${sample.baselineMetric.unit || ""}` : "50.0 ng/µL (Default)"}
                    </div>
                    <p className="text-[10px] text-[#71717A] mt-0.5 font-mono">
                      Allowable Window: {(Number(sample.baselineMetric?.value || 50) * (1 - (sample.baselineMetric?.tolerance || 15)/100)).toFixed(1)} – {(Number(sample.baselineMetric?.value || 50) * (1 + (sample.baselineMetric?.tolerance || 15)/100)).toFixed(1)} {sample.baselineMetric?.unit || "ng/µL"}
                    </p>
                  </>
                )}
              </div>

              <div className="p-2.5 bg-[#F7F8F4] border border-[#0A0A0A] rounded-lg">
                <span className="text-[#52525B] font-mono text-[10px] uppercase font-bold block">
                  Concordance Evaluation:
                </span>
                {sample.hasValueWarning || attestedReports.some(r => r.isOutOfTolerance) ? (
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-black text-[#BE123C] bg-[#FFF1F2] border border-[#FF5A5F] p-1.5 rounded">
                    <AlertTriangle className="w-4 h-4 text-[#FF5A5F] shrink-0 animate-pulse" />
                    <span>⚠️ OUT OF TOLERANCE WARNING</span>
                  </div>
                ) : attestedReports.length > 0 ? (
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-black text-[#15803D] bg-[#F7FEE7] border border-[#65A30D] p-1.5 rounded">
                    <CheckCircle2 className="w-4 h-4 text-[#65A30D] shrink-0" />
                    <span>✓ CONCORDANT WITHIN SPEC</span>
                  </div>
                ) : (
                  <div className="mt-1 text-xs font-mono font-bold text-[#71717A] p-1.5">
                    Awaiting Laboratory Measurement
                  </div>
                )}
              </div>
            </div>

            {(sample.hasValueWarning || attestedReports.some(r => r.isOutOfTolerance)) && (
              <div className="p-3 bg-[#FFF1F2] border-2 border-[#FF5A5F] rounded-xl text-xs text-[#BE123C] space-y-1 shadow-[2px_2px_0px_#FF5A5F]">
                <div className="flex items-center gap-1.5 font-black">
                  <AlertTriangle className="w-4 h-4 text-[#FF5A5F]" />
                  <span>CRITICAL ALERT: MEASUREMENT DISCREPANCY DETECTED!</span>
                </div>
                <p className="text-[11px] font-mono text-[#9F1239] leading-snug">
                  Laboratory analytical results deviate significantly from intake baseline values beyond the approved ±{sample.baselineMetric?.tolerance || 15}% tolerance margin. This case has been escalated for audit cross-verification.
                </p>
              </div>
            )}
          </div>

          {/* Feature: Laboratory Assay Measurement & Blind Entry */}
          <div className="p-4 bg-[#FFFFFF] border-2 border-[#0A0A0A] rounded-xl shadow-[3px_3px_0px_#0A0A0A] space-y-3">
            <div className="flex items-center justify-between border-b border-[#0A0A0A]/20 pb-2">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-[#2563EB]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-[#0A0A0A]">
                  Input Laboratory Assay Reading
                </h4>
              </div>
              <span className="text-[10px] font-mono font-bold bg-[#EFF6FF] text-[#1D4ED8] border border-[#0A0A0A] px-2 py-0.5 rounded flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Blind Assay Entry
              </span>
            </div>

            {/* Blind protocol explanation */}
            <div className="p-2.5 bg-[#F8FAFC] border border-[#0A0A0A] rounded-lg text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-black uppercase text-[#1E3A8A]">
                  Double-Blind Protocol Active
                </span>
                <span className="text-[9px] font-mono font-bold bg-[#FEF9C3] text-[#854D0E] px-1.5 py-0.2 rounded border border-[#CA8A04]">
                  Anti-Bias Integrity
                </span>
              </div>
              <p className="text-[11px] text-[#475569] leading-snug">
                The intake baseline value is sealed from testing laboratories to eliminate confirmation bias. Enter your measured findings below; the consensus protocol will automatically test tolerance concordance.
              </p>
            </div>

            {/* Role switch / active lab notice */}
            {currentActor.orgType !== 2 && currentActor.orgType !== 3 ? (
              <div className="p-2.5 bg-[#FFFBEB] border border-[#F59E0B] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="font-bold text-[#92400E]">
                    Current Identity: {currentActor.name} ({currentActor.orgTypeName})
                  </div>
                  <div className="text-[10px] text-[#B45309] font-mono">
                    Under CLIA standards, tests must be certified by an independent testing laboratory.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAccount("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")}
                  className="px-2.5 py-1 rounded-lg bg-[#FDE047] hover:bg-[#FACC15] text-[#0A0A0A] font-bold text-xs border border-[#0A0A0A] shadow-[1px_1px_0px_#0A0A0A] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer whitespace-nowrap self-start sm:self-auto"
                >
                  ⚡ Switch to Apex Core Lab
                </button>
              </div>
            ) : (
              <div className="p-2 bg-[#F7FEE7] border border-[#65A30D] rounded-lg text-xs flex items-center justify-between">
                <span className="font-mono text-[11px] text-[#365314] font-bold">
                  Testing Facility: <span className="text-[#0A0A0A] font-black">{currentActor.name}</span>
                </span>
                <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-[#D7FB38] text-[#0A0A0A] border border-[#0A0A0A]">
                  CLIA Verified
                </span>
              </div>
            )}

            {/* Reading Input Field & Helpers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-[#0A0A0A]">
                  Measured Laboratory Reading ({sample.baselineMetric?.unit || "ng/µL"}):
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLabInputVal((Number(sample.baselineMetric?.value || 50) * 1.02).toFixed(1))}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F7FEE7] text-[#365314] border border-[#0A0A0A] hover:bg-[#ECFCCB] cursor-pointer"
                  >
                    Demo: In-Spec (±2%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabInputVal((Number(sample.baselineMetric?.value || 50) * 1.65).toFixed(1))}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FFF1F2] text-[#BE123C] border border-[#0A0A0A] hover:bg-[#FFE4E6] cursor-pointer"
                  >
                    Demo: Out-of-Spec (+65% Warning)
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  value={labInputVal}
                  onChange={(e) => setLabInputVal(e.target.value)}
                  placeholder={`e.g. 52.4 ${sample.baselineMetric?.unit || "ng/µL"}`}
                  className="flex-1 brutal-input text-xs font-mono font-bold p-2 bg-[#FFFFFF]"
                />
                <button
                  type="button"
                  onClick={handleDirectLabSubmit}
                  disabled={!labInputVal || isSubmittingLab}
                  className="brutal-btn brutal-btn-primary px-3 py-2 text-xs uppercase font-mono font-bold whitespace-nowrap cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingLab ? "Attesting..." : "⚡ Attest & Record"}
                </button>
              </div>
            </div>

            {/* Submission Status Message */}
            {labSubmitMsg && (
              <div className={`p-2.5 rounded-lg border-2 text-xs font-bold flex items-center justify-between ${
                labSubmitMsg.type === "ok" ? "bg-[#DCFCE7] border-[#0A0A0A] text-[#166534]" : "bg-[#FFE4E6] border-[#FF5A5F] text-[#BE123C]"
              }`}>
                <span>{labSubmitMsg.text}</span>
                <button type="button" onClick={() => setLabSubmitMsg(null)} className="text-[10px] underline font-mono">Dismiss</button>
              </div>
            )}
          </div>

          {/* Feature Two: Cryptographically Attested Laboratory Reports */}
          {attestedReports.length > 0 && (
            <div className="p-4 bg-[#FFFFFF] border-2 border-[#0A0A0A] rounded-xl shadow-[3px_3px_0px_#0A0A0A] space-y-3">
              <div className="flex items-center justify-between border-b border-[#0A0A0A]/20 pb-2">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#D97706]" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#0A0A0A]">
                    Attested Diagnostic Reports ({attestedReports.length})
                  </h4>
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#F4F4F5] border border-[#0A0A0A] px-2 py-0.5 rounded">
                  ECDSA Authenticated
                </span>
              </div>

              <div className="space-y-2.5">
                {attestedReports.map((rep, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border-2 ${
                      rep.isRetest ? "bg-[#F7FEE7] border-[#0A0A0A]" : "bg-[#F7F8F4] border-[#0A0A0A]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-[#0A0A0A]">
                        {rep.testType} {rep.isRetest ? "(Independent Retest)" : `(v${rep.reportVersion})`}
                      </span>
                      <span className="text-[10px] font-mono text-[#52525B]">
                        {formatTimestamp(rep.timestamp)}
                      </span>
                    </div>

                    <div className="text-xs text-[#52525B] mb-1.5">
                      <span className="font-bold text-[#0A0A0A]">Reporting Lab: </span>
                      {getOrgName(rep.laboratory)} ({shortHash(rep.laboratory, 4)})
                    </div>

                    {/* Inter-lab blindness: If a laboratory views another laboratory's report, mask the findings to prevent inter-lab influence! */}
                    {currentActor.orgType === 2 && rep.laboratory.toLowerCase() !== activeAccount.toLowerCase() ? (
                      <div className="p-2.5 bg-[#F4F4F5] border border-[#0A0A0A] rounded-lg text-xs font-mono text-[#52525B] mb-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[11px] font-bold text-[#B45309]">
                            <Lock className="w-3 h-3 text-[#B45309]" />
                            [INDEPENDENT TEST FINDINGS SEALED]
                          </span>
                          <span className="text-[9px] bg-[#FFFFFF] border px-1.5 py-0.5 rounded font-bold">BLINDED PER ISO-15189</span>
                        </div>
                        <p className="text-[10px] text-[#71717A] italic leading-tight">
                          Independent laboratory readings are blinded between separate test facilities to eliminate inter-laboratory confirmation bias.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="p-2 bg-[#FFFFFF] border border-[#0A0A0A] rounded-lg text-xs font-bold text-[#0A0A0A] mb-2">
                          <span className="text-[#52525B] font-mono text-[10px] uppercase block">Findings Summary:</span>
                          {rep.findings}
                        </div>

                        {rep.measuredValue !== undefined && rep.measuredValue !== null && (
                          <div className={`p-2.5 rounded-lg border mb-2 text-xs font-mono flex items-center justify-between ${
                            rep.isOutOfTolerance
                              ? 'bg-[#FFF1F2] border-[#FF5A5F] text-[#BE123C]'
                              : 'bg-[#F7FEE7] border-[#65A30D] text-[#365314]'
                          }`}>
                            <div>
                              <span className="font-bold">Measured: </span>
                              <span className="font-black text-sm">{rep.measuredValue} {rep.measuredUnit || sample.baselineMetric?.unit}</span>
                              {rep.baselineValue !== undefined && currentActor.orgType !== 2 && (
                                <span className="text-[10px] ml-1.5 text-[#52525B]">
                                  (Baseline: {rep.baselineValue} {rep.measuredUnit || sample.baselineMetric?.unit})
                                </span>
                              )}
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                              rep.isOutOfTolerance
                                ? 'bg-[#FF5A5F] text-[#FFFFFF] border-[#9F1239]'
                                : 'bg-[#D7FB38] text-[#0A0A0A] border-[#65A30D]'
                            }`}>
                              {rep.isOutOfTolerance ? `⚠️ Out of Tolerance (${rep.variancePct > 0 ? '+' : ''}${rep.variancePct}%)` : `✓ Concordant (${rep.variancePct > 0 ? '+' : ''}${rep.variancePct}%)`}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#0A0A0A]/10 text-[10px] font-mono">
                      <span className="truncate max-w-[200px] text-[#71717A]">
                        Hash: {shortHash(rep.reportHash, 6)}
                      </span>
                      <button
                        onClick={() => handleVerifyReportSig(rep)}
                        className="px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#0A0A0A] font-bold text-[#0A0A0A] hover:bg-[#F4F4F5] cursor-pointer"
                      >
                        Verify Signature
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Signature Toast Notice */}
              {sigCheckToast && (
                <div className="p-2.5 bg-[#F4F7F1] border-2 border-[#0A0A0A] rounded-lg text-xs flex items-center justify-between">
                  <span className="font-bold text-[#15803D]">
                    ✓ {sigCheckToast.message}
                  </span>
                  <button onClick={() => setSigCheckToast(null)} className="text-[10px] underline font-mono">Close</button>
                </div>
              )}

              <p className="text-[10px] text-[#71717A] italic leading-tight">
                Security Limitation Note: A valid cryptographic signature proves non-repudiation and key authorization; it does not physically verify laboratory measurement truth.
              </p>
            </div>
          )}

          {/* Specimen Passport Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            
            {/* Box 1: Custody & Origins */}
            <div className="brutal-card-flat p-3.5 space-y-2">
              <h4 className="text-xs font-black text-[#0A0A0A] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Building className="w-3.5 h-3.5 text-[#0A0A0A]" /> Custody & Provenance
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between py-1 border-b border-[#E5E7EB]">
                  <span className="text-[#52525B]">Custodian:</span>
                  <span className="font-bold text-[#0A0A0A] truncate max-w-[160px]">
                    {getOrgName(sample.custodian)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E5E7EB]">
                  <span className="text-[#52525B]">Origin:</span>
                  <span className="font-bold text-[#0A0A0A] truncate max-w-[160px]">
                    {getOrgName(sample.origin)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E5E7EB]">
                  <span className="text-[#52525B]">Collected:</span>
                  <span className="text-[#0A0A0A] font-bold font-mono">{formatTimestamp(sample.collectedAt)}</span>
                </div>
                {sample.pendingRecipient && sample.pendingRecipient !== "0x0000000000000000000000000000000000000000" && (
                  <div className="flex justify-between py-1 bg-[#FEF9C3] border border-[#0A0A0A] px-2 rounded-lg text-xs font-bold">
                    <span className="font-mono">En Route To:</span>
                    <span>{getOrgName(sample.pendingRecipient)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Box 2: Zero-Knowledge Privacy */}
            <div className="brutal-card-flat p-3.5 space-y-2">
              <h4 className="text-xs font-black text-[#0A0A0A] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Lock className="w-3.5 h-3.5 text-[#0A0A0A]" /> Zero-Knowledge Privacy
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-[#52525B] mb-0.5">
                    <span className="font-semibold">Consent Seal:</span>
                    <button
                      onClick={() => handleCopy(sample.consentHash, "consent")}
                      className="text-[#0A0A0A] hover:underline flex items-center gap-1 font-mono font-bold cursor-pointer"
                    >
                      {copiedHash === "consent" ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                      {copiedHash === "consent" ? "COPIED" : "COPY"}
                    </button>
                  </div>
                  <div className="font-mono text-[10px] bg-[#F7F8F4] p-1.5 rounded border border-[#0A0A0A] text-[#0A0A0A] break-all font-semibold">
                    {sample.consentHash}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#52525B] mb-0.5">
                    <span className="font-semibold">Subject Pseudonym Hash:</span>
                    <button
                      onClick={() => handleCopy(sample.subjectHash, "subject")}
                      className="text-[#0A0A0A] hover:underline flex items-center gap-1 font-mono font-bold cursor-pointer"
                    >
                      {copiedHash === "subject" ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                      {copiedHash === "subject" ? "COPIED" : "COPY"}
                    </button>
                  </div>
                  <div className="font-mono text-[10px] bg-[#F7F8F4] p-1.5 rounded border border-[#0A0A0A] text-[#0A0A0A] break-all font-semibold">
                    {sample.subjectHash}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Derived Aliquots Section */}
          {children.length > 0 && (
            <div className="brutal-card-flat p-3.5">
              <h4 className="text-xs font-black text-[#0A0A0A] uppercase tracking-wider flex items-center gap-1.5 mb-2.5 font-mono">
                <GitFork className="w-3.5 h-3.5 text-[#C084FC]" /> Derived Child Aliquots ({children.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {children.map((cid) => {
                  const child = sandboxData.samples?.[cid];
                  if (!child) return null;
                  return (
                    <div
                      key={cid}
                      className="p-2.5 bg-[#F7F8F4] border border-[#0A0A0A] rounded-lg text-xs flex justify-between items-center"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-[#0A0A0A] font-mono truncate">{child.externalId}</div>
                        <div className="text-[#52525B] text-[10px] truncate">{child.sampleType}</div>
                      </div>
                      <span className="brutal-pill bg-[#FDE047] text-[9px]">
                        {STATUS_CONFIG[child.status]?.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cryptographic Event Timeline */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#0A0A0A] mb-3">
              <h3 className="text-xs sm:text-sm font-black text-[#0A0A0A] flex items-center gap-1.5 uppercase font-display">
                <FileText className="w-4 h-4 text-[#0A0A0A]" />
                Event History Cryptographic Chain
              </h3>
              <span className="brutal-pill bg-[#D7FB38] text-[10px]">
                {history.length} Blocks Deep
              </span>
            </div>

            <div className="relative pl-5 space-y-3 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#0A0A0A]">
              {history.map((rec, i) => {
                const recTypeName = RECORD_TYPE_NAMES[rec.recType] || "Handling Event";
                const isStorage = rec.recType === 7;
                const isIncident = rec.recType === 10;
                const isQuarantine = rec.recType === 11;
                const isAttested = rec.recType === 16;
                const isRetestReq = rec.recType === 17;
                const isRetestRep = rec.recType === 18;
                const isDiscFlag = rec.recType === 19;
                const isDiscRes = rec.recType === 20;

                return (
                  <div key={i} className="relative group">
                    {/* Node Dot */}
                    <div className="absolute -left-[23px] top-2.5 w-3 h-3 rounded-full bg-[#FFFFFF] border-2 border-[#0A0A0A] flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-[#0A0A0A]"></div>
                    </div>

                    <div className={`p-3 border-2 border-[#0A0A0A] rounded-xl shadow-[2px_2px_0px_#0A0A0A] ${
                      isDiscFlag ? "bg-[#FFFBEB]" : isDiscRes ? "bg-[#F7FEE7]" : "bg-[#FFFFFF]"
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-black uppercase font-mono px-1.5 py-0.5 rounded border border-[#0A0A0A] ${
                            isQuarantine || isIncident ? "bg-[#FF5A5F] text-white" :
                            isAttested ? "bg-[#FEF08A] text-[#0A0A0A]" :
                            isRetestReq || isRetestRep ? "bg-[#C084FC] text-white" :
                            isDiscFlag ? "bg-[#F59E0B] text-white" :
                            isDiscRes ? "bg-[#D7FB38] text-[#0A0A0A]" :
                            "bg-[#D7FB38] text-[#0A0A0A]"
                          }`}>
                            {recTypeName}
                          </span>
                          <span className="text-[11px] text-[#52525B] font-mono">
                            Block #{i + 1}
                          </span>
                        </div>

                        <span className="text-[10px] text-[#52525B] font-mono font-semibold">
                          {formatTimestamp(rec.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs text-[#0A0A0A] font-medium mt-1.5 leading-snug">
                        {rec.note}
                      </p>

                      {isStorage && rec.temp !== -2147483648 && (
                        <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-mono font-black bg-[#E0F2FE] border border-[#0A0A0A] px-2 py-0.5 rounded text-[#0369A1]">
                          <Thermometer className="w-3 h-3" />
                          <span>Cryo Temp: {formatTemp(rec.temp)}</span>
                        </div>
                      )}

                      <div className="mt-2 pt-1.5 border-t border-[#0A0A0A]/10 flex flex-wrap items-center justify-between text-[10px] font-mono text-[#52525B] gap-2">
                        <span>Actor: {getOrgName(rec.actor)}</span>
                        <span className="text-[#0A0A0A] font-bold">Proof: {shortHash(rec.recordHash, 4)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
