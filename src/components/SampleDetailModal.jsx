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
      <div className="modal-content max-w-4xl max-h-[94vh] flex flex-col bg-[#FFFBF1] border-2 border-[#E3D7BC]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b-2 border-[#E3D7BC] flex items-start justify-between gap-2.5 bg-[#FFFBF1] sticky top-0 z-20">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-[#DCE6F5] border border-[#BDD0EE] flex items-center justify-center text-[#2457A6] shrink-0">
              <Fingerprint className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-extrabold text-[#1B2B45] font-mono truncate">
                  {sample.externalId}
                </h2>
                <span className={`badge-status ${statusCfg.color} shrink-0`}>
                  <span className={`dot-indicator ${statusCfg.dot}`}></span>
                  {statusCfg.label}
                </span>
                {isChild && (
                  <span className="text-[10px] font-mono bg-[#EBDDB8] text-[#1B2B45] border border-[#D2C4A3] px-2 py-0.5 rounded-full font-bold">
                    Aliquot
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-[#596579] mt-0.5 font-medium truncate">
                {sample.sampleType} • Anchor: {shortHash(sample.sampleId, 5)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onOpenQr(sample)}
              className="p-2 rounded-xl bg-[#F5EEDC] hover:bg-[#EBDDB8] text-[#2457A6] border border-[#E3D7BC] transition-all min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Barcode QR View"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#F5EEDC] hover:bg-[#EBDDB8] text-[#1B2B45] border border-[#E3D7BC] transition-all min-h-[38px] min-w-[38px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1">
          
          {/* Quick Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-[#F5EEDC] border-2 border-[#E3D7BC]">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <button
                onClick={() => onOpenTransfer(sample)}
                className="btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#2457A6]" />
                Transfer
              </button>
              <button
                onClick={() => onOpenStorage(sample)}
                className="btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial"
              >
                <Thermometer className="w-3.5 h-3.5 text-[#2457A6]" />
                Storage
              </button>
              <button
                onClick={() => onOpenAliquot(sample)}
                className="btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial"
              >
                <GitFork className="w-3.5 h-3.5 text-[#C23B30]" />
                Aliquot
              </button>
            </div>

            {/* Run Verification Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={runVerification}
                disabled={isVerifying}
                className="btn-primary text-xs py-1.5 px-3.5 flex-1 sm:flex-initial"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {isVerifying ? "Verifying..." : "Verify Hash Chain"}
              </button>

              <button
                onClick={handleTamperDemo}
                title="Simulate data tampering"
                className="text-xs text-[#C23B30] bg-[#F6D9D4] border border-[#EDB8B3] px-2.5 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1 transition-all min-h-[38px]"
              >
                <Flame className="w-3.5 h-3.5" />
                Tamper
              </button>
            </div>
          </div>

          {/* Verification Result Banner */}
          {verifyResult && (
            <div
              className={`p-3.5 sm:p-4 rounded-2xl border-2 flex items-start gap-2.5 sm:gap-3 transition-all animate-fadeIn ${
                verifyResult.valid
                  ? "bg-[#DCE6F5] border-[#BDD0EE] text-[#1B4385]"
                  : "bg-[#F6D9D4] border-[#EDB8B3] text-[#9E2A20]"
              }`}
            >
              {verifyResult.valid ? (
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#2457A6] shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-[#C23B30] shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs">
                <div className="font-extrabold text-xs sm:text-sm">
                  {verifyResult.valid
                    ? "Cryptographic Provenance 100% Intact"
                    : "TAMPER ALERT — Integrity Check Failed!"}
                </div>
                <p className="mt-1 leading-relaxed font-medium">
                  {verifyResult.valid
                    ? `Every hash link from anchor root (#${shortHash(sample.sampleId, 3)}) to tip (${shortHash(sample.headHash, 3)}) matches mathematical keccak-256 specifications.`
                    : verifyResult.reason}
                </p>
                {verifyResult.valid && (
                  <div className="mt-1.5 text-[11px] font-mono font-bold text-[#2457A6]">
                    Verified {verifyResult.totalSteps} cryptographic records across ledger.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Specimen Passport Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            
            {/* Box 1: Custody & Origins */}
            <div className="glass-panel p-3.5 sm:p-4.5 bg-[#F5EEDC] border-2 border-[#E3D7BC] space-y-2.5">
              <h4 className="text-xs font-extrabold text-[#1B2B45] uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#2457A6]" /> Custody & Provenance
              </h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[#E3D7BC]">
                  <span className="text-[#6B7287] font-medium">Custodian:</span>
                  <span className="font-bold text-[#1B2B45] truncate max-w-[150px]">
                    {getOrgName(sample.custodian)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E3D7BC]">
                  <span className="text-[#6B7287] font-medium">Origin:</span>
                  <span className="font-bold text-[#1B2B45] truncate max-w-[150px]">
                    {getOrgName(sample.origin)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E3D7BC]">
                  <span className="text-[#6B7287] font-medium">Collected:</span>
                  <span className="text-[#1B2B45] font-semibold">{formatTimestamp(sample.collectedAt)}</span>
                </div>
                {sample.pendingRecipient && sample.pendingRecipient !== "0x0000000000000000000000000000000000000000" && (
                  <div className="flex justify-between py-1 border-b border-[#E3D7BC] bg-[#FEF3C7] px-2 rounded-lg">
                    <span className="text-[#92400E] font-bold">En Route:</span>
                    <span className="text-[#92400E] font-bold">{getOrgName(sample.pendingRecipient)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Box 2: Cryptographic Identity & Zero-Knowledge Hashes */}
            <div className="glass-panel p-3.5 sm:p-4.5 bg-[#F5EEDC] border-2 border-[#E3D7BC] space-y-2.5">
              <h4 className="text-xs font-extrabold text-[#1B2B45] uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#2457A6]" /> Cryptographic Hashes
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-[#6B7287] mb-0.5">
                    <span className="font-medium">Consent Seal:</span>
                    <button
                      onClick={() => handleCopy(sample.consentHash, "consent")}
                      className="text-[#2457A6] hover:underline flex items-center gap-1 font-bold"
                    >
                      {copiedHash === "consent" ? <Check className="w-3 h-3 text-[#2457A6]" /> : <Copy className="w-3 h-3" />}
                      {copiedHash === "consent" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="font-mono text-[10px] sm:text-[11px] bg-[#FFFBF1] p-1.5 rounded-lg border border-[#E3D7BC] text-[#1B2B45] break-all font-semibold">
                    {sample.consentHash}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#6B7287] mb-0.5">
                    <span className="font-medium">Subject Hash:</span>
                    <button
                      onClick={() => handleCopy(sample.subjectHash, "subject")}
                      className="text-[#2457A6] hover:underline flex items-center gap-1 font-bold"
                    >
                      {copiedHash === "subject" ? <Check className="w-3 h-3 text-[#2457A6]" /> : <Copy className="w-3 h-3" />}
                      {copiedHash === "subject" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="font-mono text-[10px] sm:text-[11px] bg-[#FFFBF1] p-1.5 rounded-lg border border-[#E3D7BC] text-[#1B2B45] break-all font-semibold">
                    {sample.subjectHash}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Aliquots Section */}
          {children.length > 0 && (
            <div className="glass-panel p-3.5 sm:p-4.5 bg-[#FFFBF1] border-2 border-[#E3D7BC]">
              <h4 className="text-xs font-extrabold text-[#C23B30] uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                <GitFork className="w-3.5 h-3.5" /> Child Aliquot Sub-Specimens ({children.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {children.map((cid) => {
                  const child = sandboxData.samples?.[cid];
                  if (!child) return null;
                  return (
                    <div
                      key={cid}
                      className="p-2.5 bg-[#F5EEDC] border-2 border-[#E3D7BC] rounded-xl text-xs flex justify-between items-center"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-[#1B2B45] font-mono truncate">{child.externalId}</div>
                        <div className="text-[#596579] text-[11px] truncate">{child.sampleType}</div>
                      </div>
                      <span className="text-[10px] font-mono text-[#C23B30] bg-[#F6D9D4] px-2 py-0.5 rounded font-bold shrink-0">
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
            <div className="flex items-center justify-between pb-2.5 border-b-2 border-[#E3D7BC] mb-3">
              <h3 className="text-xs sm:text-sm font-extrabold text-[#1B2B45] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#2457A6]" />
                Event History Hash-Chain
              </h3>
              <span className="text-xs text-[#6B7287] font-mono font-bold">
                {history.length} Blocks
              </span>
            </div>

            <div className="relative pl-5 sm:pl-6 space-y-4 sm:space-y-6 before:content-[''] before:absolute before:left-2 before:sm:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E3D7BC]">
              {history.map((rec, i) => {
                const recTypeName = RECORD_TYPE_NAMES[rec.recType] || "Handling Event";
                const isStorage = rec.recType === 7;
                const isIncident = rec.recType === 10;
                const isQuarantine = rec.recType === 11;

                return (
                  <div key={i} className="relative group">
                    {/* Node Dot */}
                    <div className="absolute -left-[24px] sm:-left-[27px] top-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#FFFBF1] border-2 border-[#2457A6] flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#2457A6]"></div>
                    </div>

                    <div className="glass-panel p-3.5 sm:p-4 bg-[#FFFBF1] border-2 border-[#E3D7BC]">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              isIncident || isQuarantine
                                ? "bg-[#F6D9D4] text-[#C23B30] border border-[#EDB8B3]"
                                : isStorage
                                ? "bg-[#DCE6F5] text-[#2457A6] border border-[#BDD0EE]"
                                : "bg-[#EBDDB8] text-[#1B2B45] border border-[#D2C4A3]"
                            }`}
                          >
                            #{i + 1} {recTypeName}
                          </span>

                          {rec.temp !== undefined && rec.temp !== -2147483648 && (
                            <span className="text-[11px] font-bold font-mono px-2 py-0.5 bg-[#DCE6F5] text-[#2457A6] rounded-md border border-[#BDD0EE]">
                              {formatTemp(rec.temp)}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] sm:text-[11px] text-[#6B7287] font-mono">
                          {formatTimestamp(rec.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs text-[#1B2B45] mt-1.5 font-semibold">
                        {rec.note || "Chain transaction executed"}
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-[#E3D7BC] grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] sm:text-[11px] font-mono">
                        <div className="text-[#6B7287] truncate">
                          Actor: <span className="text-[#1B2B45] font-bold">{getOrgName(rec.actor)}</span>
                        </div>
                        <div className="text-[#6B7287] truncate sm:text-right">
                          Prev: <span className="text-[#1B2B45] font-bold">{shortHash(rec.prevHash, 3)}</span>
                        </div>
                        <div className="col-span-full bg-[#F5EEDC] p-1.5 rounded-lg border border-[#E3D7BC] text-[9px] sm:text-[10px] text-[#2457A6] font-bold break-all">
                          Signature: {rec.recordHash}
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
