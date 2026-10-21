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
  Flame,
  Calendar
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
    }, 300);
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

          {/* Verification Result Banner with Dramatic Animations */}
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

          {/* Aliquots Section */}
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

                return (
                  <div key={i} className="relative group">
                    {/* Node Dot */}
                    <div className="absolute -left-[23px] top-2.5 w-3 h-3 rounded-full bg-[#FFFFFF] border-2 border-[#0A0A0A] flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-[#0A0A0A]"></div>
                    </div>

                    <div className="bg-[#FFFFFF] p-3 border-2 border-[#0A0A0A] rounded-xl shadow-[2px_2px_0px_#0A0A0A]">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[9px] font-mono font-extrabold uppercase px-1.5 py-0.5 rounded border border-[#0A0A0A] ${
                              isIncident || isQuarantine
                                ? "bg-[#FF5A5F] text-white"
                                : isStorage
                                ? "bg-[#38BDF8] text-[#0A0A0A]"
                                : "bg-[#F7F8F4] text-[#0A0A0A]"
                            }`}
                          >
                            #{i + 1} {recTypeName}
                          </span>

                          {rec.temp !== undefined && rec.temp !== -2147483648 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#E0F2FE] text-[#0369A1] rounded border border-[#0A0A0A] font-bold">
                              {formatTemp(rec.temp)}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-[#71717A] font-mono">
                          {formatTimestamp(rec.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs text-[#0A0A0A] mt-1 font-semibold leading-snug">
                        {rec.note || "Chain transaction executed"}
                      </p>

                      <div className="mt-2 pt-2 border-t border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] font-mono">
                        <div className="text-[#52525B] truncate">
                          Actor: <strong className="text-[#0A0A0A]">{getOrgName(rec.actor)}</strong>
                        </div>
                        <div className="text-[#52525B] truncate sm:text-right">
                          Prev: <strong className="text-[#0A0A0A]">{shortHash(rec.prevHash, 3)}</strong>
                        </div>
                        <div className="col-span-full bg-[#F7F8F4] p-1.5 rounded border border-[#0A0A0A] text-[9px] text-[#0A0A0A] font-bold break-all mt-0.5">
                          Proof: {rec.recordHash}
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
