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
  ArrowRight,
  GitFork,
  Copy,
  Check,
  AlertTriangle,
  FileText,
  Lock,
  Building,
  ArrowLeftRight,
  ExternalLink,
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
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    }, 400);
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
      <div className="modal-content max-w-4xl max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4 bg-slate-900/80 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Fingerprint className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white font-mono">
                  {sample.externalId}
                </h2>
                <span className={`badge-status ${statusCfg.color}`}>
                  <span className={`dot-indicator ${statusCfg.dot}`}></span>
                  {statusCfg.label}
                </span>
                {isChild && (
                  <span className="text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                    Derived Aliquot
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {sample.sampleType} • Anchored at Block ID: {shortHash(sample.sampleId, 6)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenQr(sample)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 border border-white/5 transition-all"
              title="Barcode QR View"
            >
              <QrCode className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-white/5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenTransfer(sample)}
                className="btn-secondary text-xs py-1.5"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                Transfer
              </button>
              <button
                onClick={() => onOpenStorage(sample)}
                className="btn-secondary text-xs py-1.5"
              >
                <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                Log Storage
              </button>
              <button
                onClick={() => onOpenAliquot(sample)}
                className="btn-secondary text-xs py-1.5"
              >
                <GitFork className="w-3.5 h-3.5 text-purple-400" />
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
                className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all"
              >
                <Flame className="w-3.5 h-3.5" />
                Simulate Tamper
              </button>
            </div>
          </div>

          {/* Verification Result Banner */}
          {verifyResult && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 transition-all animate-fadeIn ${
                verifyResult.valid
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
                  : "bg-rose-500/15 border-rose-500/50 text-rose-200"
              }`}
            >
              {verifyResult.valid ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs">
                <div className="font-bold text-sm">
                  {verifyResult.valid
                    ? "Cryptographic Provenance 100% Intact"
                    : "TAMPER ALERT — Integrity Check Failed!"}
                </div>
                <p className="mt-1 opacity-90 leading-relaxed">
                  {verifyResult.valid
                    ? `Every hash link from the anchor root (block #${shortHash(sample.sampleId, 3)}) to current head (${shortHash(sample.headHash, 3)}) matches mathematical keccak-256 specifications. No unauthorized changes detected.`
                    : verifyResult.reason}
                </p>
                {verifyResult.valid && (
                  <div className="mt-2 text-[11px] font-mono opacity-80">
                    Verified {verifyResult.totalSteps} cryptographic records across the ledger.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Specimen Passport Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Box 1: Custody & Origins */}
            <div className="glass-panel p-4 border border-white/5 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-cyan-400" /> Custody & Provenance
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-500">Current Custodian:</span>
                  <span className="font-semibold text-slate-200">
                    {getOrgName(sample.custodian)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-500">Originating Org:</span>
                  <span className="font-semibold text-slate-200">
                    {getOrgName(sample.origin)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-500">Collection Date:</span>
                  <span className="text-slate-200">{formatTimestamp(sample.collectedAt)}</span>
                </div>
                {sample.pendingRecipient && sample.pendingRecipient !== "0x0000000000000000000000000000000000000000" && (
                  <div className="flex justify-between py-1 border-b border-white/5 bg-amber-500/10 px-2 rounded">
                    <span className="text-amber-400 font-semibold">En Route To:</span>
                    <span className="text-amber-300 font-semibold">{getOrgName(sample.pendingRecipient)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Box 2: Cryptographic Identity & Zero-Knowledge Hashes */}
            <div className="glass-panel p-4 border border-white/5 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Cryptographic Anchors
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                    <span>Consent Document Seal:</span>
                    <button
                      onClick={() => handleCopy(sample.consentHash, "consent")}
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {copiedHash === "consent" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedHash === "consent" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="font-mono text-[11px] bg-slate-900/80 p-1.5 rounded border border-white/5 text-slate-300 break-all">
                    {sample.consentHash}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                    <span>Pseudonymous Subject Hash:</span>
                    <button
                      onClick={() => handleCopy(sample.subjectHash, "subject")}
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {copiedHash === "subject" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedHash === "subject" ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="font-mono text-[11px] bg-slate-900/80 p-1.5 rounded border border-white/5 text-slate-300 break-all">
                    {sample.subjectHash}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Aliquots Section if present */}
          {children.length > 0 && (
            <div className="glass-panel p-4 border border-white/5">
              <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                <GitFork className="w-3.5 h-3.5" /> Child Aliquot Sub-Specimens ({children.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {children.map((cid) => {
                  const child = sandboxData.samples?.[cid];
                  if (!child) return null;
                  return (
                    <div
                      key={cid}
                      className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl text-xs flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-white font-mono">{child.externalId}</div>
                        <div className="text-slate-400 text-[11px]">{child.sampleType}</div>
                      </div>
                      <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded">
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
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Immutable Event History Hash-Chain
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {history.length} Chain Blocks
              </span>
            </div>

            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-emerald-500 before:to-purple-500">
              {history.map((rec, i) => {
                const recTypeName = RECORD_TYPE_NAMES[rec.recType] || "Handling Event";
                const isStorage = rec.recType === 7;
                const isIncident = rec.recType === 10;
                const isQuarantine = rec.recType === 11;

                return (
                  <div key={i} className="relative group">
                    {/* Timeline Node Dot */}
                    <div className="absolute -left-[27px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center group-hover:scale-125 transition-transform">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                    </div>

                    <div className="glass-panel p-4 border border-white/10 group-hover:border-cyan-500/30 transition-all">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              isIncident || isQuarantine
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : isStorage
                                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            Block #{i + 1}: {recTypeName}
                          </span>

                          {rec.temp !== undefined && rec.temp !== -2147483648 && (
                            <span className="text-xs font-bold font-mono px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-md border border-blue-500/30">
                              {formatTemp(rec.temp)}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatTimestamp(rec.timestamp)}
                        </span>
                      </div>

                      {/* Event description / note */}
                      <p className="text-xs text-slate-200 mt-2 font-medium">
                        {rec.note || "Chain transaction executed"}
                      </p>

                      {/* Actor and Cryptographic Proof Hashes */}
                      <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="text-slate-400 truncate">
                          Actor: <span className="text-slate-200">{getOrgName(rec.actor)}</span>
                        </div>
                        <div className="text-slate-400 truncate text-right">
                          Prev Hash: <span className="text-slate-300">{shortHash(rec.prevHash, 4)}</span>
                        </div>
                        <div className="col-span-full bg-slate-950/70 p-2 rounded border border-white/5 text-[10px] text-cyan-300/90 break-all flex items-center justify-between">
                          <span>Block Signature: {rec.recordHash}</span>
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
