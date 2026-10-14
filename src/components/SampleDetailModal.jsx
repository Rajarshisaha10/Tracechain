import React, { useState } from "react";
import confetti from "canvas-confetti";
import { useChain } from "../context/ChainContext";
import { verifyClientChain } from "../utils/crypto";
import {
  formatTimestamp,
  formatTemp,
  shortHash,
  STATUS_CONFIG,
  RECORD_TYPE_NAMES
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
  Flame
} from "lucide-react";

export default function SampleDetailModal({
  sampleId,
  onClose,
  onOpenTransfer,
  onOpenStorage,
  onOpenAliquot,
  onOpenQr
}) {
  const { sandboxData, tamperRecord } = useChain();
  const sample = sandboxData.samples?.[sampleId];
  const history = sandboxData.histories?.[sampleId] || [];
  const children = sandboxData.childrenMap?.[sampleId] || [];

  const [verifyResult, setVerifyResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedHash, setCopiedHash] = useState("");

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
    }, 350);
  };

  const handleTamperDemo = () => {
    if (history.length > 1) {
      tamperRecord(sample.sampleId, 1, "[MALICIOUS RECORD ALTERATION: Falsified temperature data]");
      runVerification();
    }
  };

  const getOrgName = (addr) => {
    return sandboxData.orgs[addr]?.name || shortHash(addr, 4);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-4xl max-h-[94vh] flex flex-col bg-[#FFFFFF] border-[3px] border-[#162013] shadow-[8px_8px_0px_#162013] rounded-2xl">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b-[2.5px] border-[#162013] flex items-start justify-between gap-3 bg-[#FFFFFF] sticky top-0 z-20">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#EAF2E5] border-2 border-[#162013] shadow-[2px_2px_0px_#162013] flex items-center justify-center text-[#435E2F] shrink-0">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-extrabold text-[#162013] font-mono truncate">
                  {sample.externalId}
                </h2>
                <span className={`badge-status ${statusCfg.color} shrink-0`}>
                  <span className={`dot-indicator ${statusCfg.dot}`}></span>
                  {statusCfg.label}
                </span>
                {isChild && (
                  <span className="text-[10px] font-mono bg-[#EAF2E5] text-[#2A3D1D] border-2 border-[#162013] px-2 py-0.5 rounded-full font-extrabold uppercase shadow-[1px_1px_0px_#162013]">
                    Aliquot
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-[#5D7057] mt-0.5 font-bold uppercase truncate font-mono">
                {sample.sampleType} • Anchor: {shortHash(sample.sampleId, 5)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenQr(sample)}
              className="p-2 rounded-xl bg-[#FFFFFF] hover:bg-[#EAF2E5] text-[#435E2F] border-2 border-[#162013] shadow-[2px_2px_0px_#162013] active:translate-x-0.5 active:translate-y-0.5 transition-all min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Barcode QR View"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#FFFFFF] hover:bg-[#FFE4E6] text-[#162013] border-2 border-[#162013] shadow-[2px_2px_0px_#162013] active:translate-x-0.5 active:translate-y-0.5 transition-all min-h-[38px] min-w-[38px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1">
          
          {/* Quick Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#F4F7F1] border-2 border-[#162013] shadow-[2px_2px_0px_#162013]">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => onOpenTransfer(sample)}
                className="btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#435E2F]" />
                Transfer
              </button>
              <button
                onClick={() => onOpenStorage(sample)}
                className="btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial"
              >
                <Thermometer className="w-3.5 h-3.5 text-[#435E2F]" />
                Storage
              </button>
              <button
                onClick={() => onOpenAliquot(sample)}
                className="btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial"
              >
                <GitFork className="w-3.5 h-3.5 text-[#DC2626]" />
                Aliquot
              </button>
            </div>

            {/* Run Verification Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={runVerification}
                disabled={isVerifying}
                className="btn-primary text-xs py-2 px-4 flex-1 sm:flex-initial uppercase font-extrabold"
              >
                <ShieldCheck className="w-4 h-4" />
                {isVerifying ? "Verifying..." : "Verify Hash Chain"}
              </button>

              <button
                onClick={handleTamperDemo}
                title="Simulate malicious data tampering"
                className="text-xs text-[#DC2626] bg-[#FFE4E6] border-2 border-[#162013] px-3 py-2 rounded-xl font-extrabold flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#162013] active:translate-x-0.5 active:translate-y-0.5 transition-all min-h-[38px] uppercase font-mono"
              >
                <Flame className="w-3.5 h-3.5" />
                Tamper
              </button>
            </div>
          </div>

          {/* Verification Result Banner */}
          {verifyResult && (
            <div
              className={`p-4 rounded-xl border-[2.5px] border-[#162013] shadow-[3px_3px_0px_#162013] flex items-start gap-3 transition-all animate-fadeIn ${
                verifyResult.valid
                  ? "bg-[#EAF2E5] text-[#2A3D1D]"
                  : "bg-[#FFE4E6] text-[#991B1B]"
              }`}
            >
              {verifyResult.valid ? (
                <ShieldCheck className="w-6 h-6 text-[#435E2F] shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-[#DC2626] shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs">
                <div className="font-extrabold text-sm uppercase font-mono">
                  {verifyResult.valid
                    ? "Cryptographic Provenance 100% Intact"
                    : "TAMPER ALERT — Mathematical Hash Mismatch!"}
                </div>
                <p className="mt-1 leading-relaxed font-bold">
                  {verifyResult.valid
                    ? `Every hash link from anchor root (#${shortHash(sample.sampleId, 3)}) to tip (${shortHash(sample.headHash, 3)}) matches mathematical keccak-256 specifications.`
                    : verifyResult.reason}
                </p>
                {verifyResult.valid && (
                  <div className="mt-1.5 text-[11px] font-mono font-extrabold text-[#435E2F]">
                    Verified {verifyResult.totalSteps} cryptographic records across EVM ledger.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Specimen Passport Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box 1: Custody & Origins */}
            <div className="bg-[#FFFFFF] p-4.5 border-2 border-[#162013] rounded-xl shadow-[3px_3px_0px_#162013] space-y-2.5">
              <h4 className="text-xs font-extrabold text-[#162013] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Building className="w-3.5 h-3.5 text-[#435E2F]" /> Custody & Provenance
              </h4>
              <div className="space-y-1.5 text-xs font-medium">
                <div className="flex justify-between py-1.5 border-b border-[#162013]/20">
                  <span className="text-[#5D7057] font-bold uppercase text-[11px]">Custodian:</span>
                  <span className="font-extrabold text-[#162013] truncate max-w-[150px]">
                    {getOrgName(sample.custodian)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#162013]/20">
                  <span className="text-[#5D7057] font-bold uppercase text-[11px]">Origin:</span>
                  <span className="font-extrabold text-[#162013] truncate max-w-[150px]">
                    {getOrgName(sample.origin)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#162013]/20">
                  <span className="text-[#5D7057] font-bold uppercase text-[11px]">Collected:</span>
                  <span className="text-[#162013] font-bold font-mono">{formatTimestamp(sample.collectedAt)}</span>
                </div>
                {sample.pendingRecipient && sample.pendingRecipient !== "0x0000000000000000000000000000000000000000" && (
                  <div className="flex justify-between py-1.5 border-2 border-[#162013] bg-[#FEF9C3] px-2 rounded-lg shadow-[1.5px_1.5px_0px_#162013]">
                    <span className="text-[#713F12] font-extrabold uppercase text-[11px]">En Route:</span>
                    <span className="text-[#713F12] font-extrabold">{getOrgName(sample.pendingRecipient)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Box 2: Cryptographic Identity & Zero-Knowledge Hashes */}
            <div className="bg-[#FFFFFF] p-4.5 border-2 border-[#162013] rounded-xl shadow-[3px_3px_0px_#162013] space-y-2.5">
              <h4 className="text-xs font-extrabold text-[#162013] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Lock className="w-3.5 h-3.5 text-[#435E2F]" /> Zero-Knowledge Privacy
              </h4>
              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-[#5D7057] mb-1">
                    <span className="font-bold uppercase">Consent Seal:</span>
                    <button
                      onClick={() => handleCopy(sample.consentHash, "consent")}
                      className="text-[#435E2F] hover:underline flex items-center gap-1 font-extrabold font-mono"
                    >
                      {copiedHash === "consent" ? <Check className="w-3 h-3 text-[#435E2F]" /> : <Copy className="w-3 h-3" />}
                      {copiedHash === "consent" ? "COPIED" : "COPY"}
                    </button>
                  </div>
                  <div className="font-mono text-[10px] sm:text-[11px] bg-[#F4F7F1] p-2 rounded-lg border-2 border-[#162013] text-[#162013] break-all font-bold">
                    {sample.consentHash}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#5D7057] mb-1">
                    <span className="font-bold uppercase">Subject Pseudonym Hash:</span>
                    <button
                      onClick={() => handleCopy(sample.subjectHash, "subject")}
                      className="text-[#435E2F] hover:underline flex items-center gap-1 font-extrabold font-mono"
                    >
                      {copiedHash === "subject" ? <Check className="w-3 h-3 text-[#435E2F]" /> : <Copy className="w-3 h-3" />}
                      {copiedHash === "subject" ? "COPIED" : "COPY"}
                    </button>
                  </div>
                  <div className="font-mono text-[10px] sm:text-[11px] bg-[#F4F7F1] p-2 rounded-lg border-2 border-[#162013] text-[#162013] break-all font-bold">
                    {sample.subjectHash}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Aliquots Section */}
          {children.length > 0 && (
            <div className="bg-[#FFFFFF] p-4.5 border-2 border-[#162013] rounded-xl shadow-[3px_3px_0px_#162013]">
              <h4 className="text-xs font-extrabold text-[#DC2626] uppercase tracking-wider flex items-center gap-1.5 mb-3 font-mono">
                <GitFork className="w-3.5 h-3.5" /> Child Aliquot Sub-Specimens ({children.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {children.map((cid) => {
                  const child = sandboxData.samples?.[cid];
                  if (!child) return null;
                  return (
                    <div
                      key={cid}
                      className="p-3 bg-[#F4F7F1] border-2 border-[#162013] shadow-[2px_2px_0px_#162013] rounded-xl text-xs flex justify-between items-center"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-extrabold text-[#162013] font-mono truncate">{child.externalId}</div>
                        <div className="text-[#5D7057] text-[11px] font-bold uppercase truncate">{child.sampleType}</div>
                      </div>
                      <span className="text-[10px] font-mono text-[#DC2626] bg-[#FFE4E6] border border-[#162013] px-2 py-0.5 rounded font-extrabold shrink-0">
                        {STATUS_CONFIG[child.status]?.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cryptographic Hash-Chain Event Timeline */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#162013] mb-4">
              <h3 className="text-xs sm:text-sm font-extrabold text-[#162013] flex items-center gap-2 uppercase font-display tracking-tight">
                <FileText className="w-4 h-4 text-[#435E2F]" />
                Event History Cryptographic Chain
              </h3>
              <span className="text-xs text-[#162013] font-mono font-extrabold bg-[#EAF2E5] px-2.5 py-0.5 rounded-full border border-[#162013]">
                {history.length} Blocks Deep
              </span>
            </div>

            <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-1 before:bg-[#162013]">
              {history.map((rec, i) => {
                const recTypeName = RECORD_TYPE_NAMES[rec.recType] || "Handling Event";
                const isStorage = rec.recType === 7;
                const isIncident = rec.recType === 10;
                const isQuarantine = rec.recType === 11;

                return (
                  <div key={i} className="relative group">
                    {/* Node Dot */}
                    <div className="absolute -left-[27px] top-2 w-4 h-4 rounded-full bg-[#FFFFFF] border-2 border-[#162013] shadow-[1px_1px_0px_#162013] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#435E2F]"></div>
                    </div>

                    <div className="bg-[#FFFFFF] p-4 border-2 border-[#162013] rounded-xl shadow-[3px_3px_0px_#162013]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border border-[#162013] shadow-[1px_1px_0px_#162013] ${
                              isIncident || isQuarantine
                                ? "bg-[#FFE4E6] text-[#DC2626]"
                                : isStorage
                                ? "bg-[#EAF2E5] text-[#2A3D1D]"
                                : "bg-[#F4F7F1] text-[#162013]"
                            }`}
                          >
                            #{i + 1} {recTypeName}
                          </span>

                          {rec.temp !== undefined && rec.temp !== -2147483648 && (
                            <span className="text-[11px] font-extrabold font-mono px-2 py-0.5 bg-[#EAF2E5] text-[#2A3D1D] rounded border border-[#162013]">
                              {formatTemp(rec.temp)}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-[#5D7057] font-mono font-bold">
                          {formatTimestamp(rec.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs text-[#162013] mt-2 font-bold leading-snug">
                        {rec.note || "Chain transaction executed"}
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-[#162013]/20 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] font-mono">
                        <div className="text-[#5D7057] truncate font-bold">
                          Actor: <span className="text-[#162013]">{getOrgName(rec.actor)}</span>
                        </div>
                        <div className="text-[#5D7057] truncate sm:text-right font-bold">
                          Prev: <span className="text-[#162013]">{shortHash(rec.prevHash, 3)}</span>
                        </div>
                        <div className="col-span-full bg-[#F4F7F1] p-2 rounded-lg border border-[#162013] text-[9px] text-[#435E2F] font-extrabold break-all mt-1">
                          Proof Hash: {rec.recordHash}
                        </div>
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
