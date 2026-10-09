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
      <div className="modal-content max-w-4xl max-h-[92vh] flex flex-col bg-[#FFFBF1] border-2 border-[#E3D7BC]">
        
        {/* Modal Header */}
        <div className="p-6 border-b-2 border-[#E3D7BC] flex items-start justify-between gap-4 bg-[#FFFBF1] sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#DCE6F5] border border-[#BDD0EE] flex items-center justify-center text-[#2457A6]">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-[#1B2B45] font-mono">
                  {sample.externalId}
                </h2>
                <span className={`badge-status ${statusCfg.color}`}>
                  <span className={`dot-indicator ${statusCfg.dot}`}></span>
                  {statusCfg.label}
                </span>
                {isChild && (
                  <span className="text-[10px] font-mono bg-[#EBDDB8] text-[#1B2B45] border border-[#D2C4A3] px-2 py-0.5 rounded-full font-bold">
                    Derived Aliquot
                  </span>
                )}
              </div>
              <p className="text-xs text-[#596579] mt-0.5 font-medium">
                {sample.sampleType} • Anchor Block: {shortHash(sample.sampleId, 6)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenQr(sample)}
              className="p-2 rounded-xl bg-[#F5EEDC] hover:bg-[#EBDDB8] text-[#2457A6] border border-[#E3D7BC] transition-all"
              title="Barcode QR View"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#F5EEDC] hover:bg-[#EBDDB8] text-[#1B2B45] border border-[#E3D7BC] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#F5EEDC] border-2 border-[#E3D7BC]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenTransfer(sample)}
                className="btn-secondary text-xs py-1.5"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#2457A6]" />
                Transfer
              </button>
              <button
                onClick={() => onOpenStorage(sample)}
                className="btn-secondary text-xs py-1.5"
              >
                <Thermometer className="w-3.5 h-3.5 text-[#2457A6]" />
                Log Storage
              </button>
              <button
                onClick={() => onOpenAliquot(sample)}
                className="btn-secondary text-xs py-1.5"
              >
                <GitFork className="w-3.5 h-3.5 text-[#C23B30]" />
                Split Aliquot
              </button>
            </div>

            {/* Run Verification Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={runVerification}
                disabled={isVerifying}
                className="btn-primary text-xs py-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {isVerifying ? "Verifying Chain..." : "Verify Hash Chain"}
              </button>

              <button
                onClick={handleTamperDemo}
                title="Simulate data tampering to test verification failure"
                className="text-xs text-[#C23B30] hover:text-[#A32E24] bg-[#F6D9D4] hover:bg-[#F3C4BD] border border-[#EDB8B3] px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all"
              >
                <Flame className="w-3.5 h-3.5" />
                Simulate Tamper
              </button>
            </div>
          </div>

          {/* Verification Result Banner */}
          {verifyResult && (
            <div
              className={`p-4 rounded-2xl border-2 flex items-start gap-3 transition-all animate-fadeIn ${
                verifyResult.valid
                  ? "bg-[#DCE6F5] border-[#BDD0EE] text-[#1B4385]"
                  : "bg-[#F6D9D4] border-[#EDB8B3] text-[#9E2A20]"
              }`}
            >
              {verifyResult.valid ? (
                <ShieldCheck className="w-6 h-6 text-[#2457A6] shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-[#C23B30] shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs">
                <div className="font-extrabold text-sm">
                  {verifyResult.valid
                    ? "Cryptographic Provenance 100% Intact"
                    : "TAMPER ALERT — Integrity Check Failed!"}
                </div>
                <p className="mt-1 leading-relaxed font-medium">
                  {verifyResult.valid
                    ? `Every hash link from the anchor root (block #${shortHash(sample.sampleId, 3)}) to current head (${shortHash(sample.headHash, 3)}) matches mathematical keccak-256 specifications. No unauthorized mutations detected.`
                    : verifyResult.reason}
                </p>
                {verifyResult.valid && (
                  <div className="mt-2 text-[11px] font-mono font-bold text-[#2457A6]">
                    Verified {verifyResult.totalSteps} cryptographic records across the ledger.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Specimen Passport Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box 1: Custody & Origins */}
            <div className="glass-panel p-4.5 bg-[#F5EEDC] border-2 border-[#E3D7BC] space-y-3">
              <h4 className="text-xs font-extrabold text-[#1B2B45] uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#2457A6]" /> Custody & Provenance
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#E3D7BC]">
                  <span className="text-[#6B7287] font-medium">Current Custodian:</span>
                  <span className="font-bold text-[#1B2B45]">
                    {getOrgName(sample.custodian)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E3D7BC]">
                  <span className="text-[#6B7287] font-medium">Originating Facility:</span>
                  <span className="font-bold text-[#1B2B45]">
                    {getOrgName(sample.origin)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E3D7BC]">
                  <span className="text-[#6B7287] font-medium">Collection Date:</span>
                  <span className="text-[#1B2B45] font-semibold">{formatTimestamp(sample.collectedAt)}</span>
                </div>
                {sample.pendingRecipient && sample.pendingRecipient !== "0x0000000000000000000000000000000000000000" && (
                  <div className="flex justify-between py-1 border-b border-[#E3D7BC] bg-[#FEF3C7] px-2 rounded-lg">
                    <span className="text-[#92400E] font-bold">En Route To:</span>
                    <span className="text-[#92400E] font-bold">{getOrgName(sample.pendingRecipient)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Box 2: Cryptographic Identity & Zero-Knowledge Hashes */}
            <div className="glass-panel p-4.5 bg-[#F5EEDC] border-2 border-[#E3D7BC] space-y-3">
              <h4 className="text-xs font-extrabold text-[#1B2B45] uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#2457A6]" /> Cryptographic Hashes
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-[#6B7287] mb-0.5">
                    <span className="font-medium">Consent Document Seal:</span>
                    <button
                      onClick={() => handleCopy(sample.consentHash, "consent")}
                      className="text-[#2457A6] hover:underline flex items-center gap-1 font-bold"
                    >
                      {copiedHash === "consent" ? <Check className="w-3 h-3 text-[#2457A6]" /> : <Copy className="w-3 h-3" />}
                      {copiedHash === "consent" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="font-mono text-[11px] bg-[#FFFBF1] p-1.5 rounded-lg border border-[#E3D7BC] text-[#1B2B45] break-all font-semibold">
                    {sample.consentHash}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#6B7287] mb-0.5">
                    <span className="font-medium">Pseudonymous Subject Hash:</span>
                    <button
                      onClick={() => handleCopy(sample.subjectHash, "subject")}
                      className="text-[#2457A6] hover:underline flex items-center gap-1 font-bold"
                    >
                      {copiedHash === "subject" ? <Check className="w-3 h-3 text-[#2457A6]" /> : <Copy className="w-3 h-3" />}
                      {copiedHash === "subject" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="font-mono text-[11px] bg-[#FFFBF1] p-1.5 rounded-lg border border-[#E3D7BC] text-[#1B2B45] break-all font-semibold">
                    {sample.subjectHash}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Aliquots Section if present */}
          {children.length > 0 && (
            <div className="glass-panel p-4.5 bg-[#FFFBF1] border-2 border-[#E3D7BC]">
              <h4 className="text-xs font-extrabold text-[#C23B30] uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <GitFork className="w-3.5 h-3.5" /> Child Aliquot Sub-Specimens ({children.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {children.map((cid) => {
                  const child = sandboxData.samples?.[cid];
                  if (!child) return null;
                  return (
                    <div
                      key={cid}
                      className="p-3 bg-[#F5EEDC] border-2 border-[#E3D7BC] rounded-xl text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-[#1B2B45] font-mono">{child.externalId}</div>
                        <div className="text-[#596579] text-[11px]">{child.sampleType}</div>
                      </div>
                      <span className="text-[10px] font-mono text-[#C23B30] bg-[#F6D9D4] px-2 py-0.5 rounded font-bold">
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
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#E3D7BC] mb-4">
              <h3 className="text-sm font-extrabold text-[#1B2B45] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2457A6]" />
                Immutable Event History Hash-Chain
              </h3>
              <span className="text-xs text-[#6B7287] font-mono font-bold">
                {history.length} Chain Blocks
              </span>
            </div>

            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E3D7BC]">
              {history.map((rec, i) => {
                const recTypeName = RECORD_TYPE_NAMES[rec.recType] || "Handling Event";
                const isStorage = rec.recType === 7;
                const isIncident = rec.recType === 10;
                const isQuarantine = rec.recType === 11;

                return (
                  <div key={i} className="relative group">
                    {/* Timeline Node Dot */}
                    <div className="absolute -left-[27px] top-1.5 w-4 h-4 rounded-full bg-[#FFFBF1] border-2 border-[#2457A6] flex items-center justify-center group-hover:scale-125 transition-transform">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#2457A6]"></div>
                    </div>

                    <div className="glass-panel p-4 bg-[#FFFBF1] border-2 border-[#E3D7BC] group-hover:border-[#2457A6] transition-all">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              isIncident || isQuarantine
                                ? "bg-[#F6D9D4] text-[#C23B30] border border-[#EDB8B3]"
                                : isStorage
                                ? "bg-[#DCE6F5] text-[#2457A6] border border-[#BDD0EE]"
                                : "bg-[#EBDDB8] text-[#1B2B45] border border-[#D2C4A3]"
                            }`}
                          >
                            Block #{i + 1}: {recTypeName}
                          </span>

                          {rec.temp !== undefined && rec.temp !== -2147483648 && (
                            <span className="text-xs font-bold font-mono px-2 py-0.5 bg-[#DCE6F5] text-[#2457A6] rounded-md border border-[#BDD0EE]">
                              {formatTemp(rec.temp)}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-[#6B7287] font-mono">
                          {formatTimestamp(rec.timestamp)}
                        </span>
                      </div>

                      {/* Event description / note */}
                      <p className="text-xs text-[#1B2B45] mt-2 font-semibold">
                        {rec.note || "Chain transaction executed"}
                      </p>

                      {/* Actor and Cryptographic Proof Hashes */}
                      <div className="mt-3 pt-3 border-t border-[#E3D7BC] grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="text-[#6B7287] truncate">
                          Actor: <span className="text-[#1B2B45] font-bold">{getOrgName(rec.actor)}</span>
                        </div>
                        <div className="text-[#6B7287] truncate text-right">
                          Prev Hash: <span className="text-[#1B2B45] font-bold">{shortHash(rec.prevHash, 4)}</span>
                        </div>
                        <div className="col-span-full bg-[#F5EEDC] p-2 rounded-lg border border-[#E3D7BC] text-[10px] text-[#2457A6] font-bold break-all flex items-center justify-between">
                          <span>Signature: {rec.recordHash}</span>
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
