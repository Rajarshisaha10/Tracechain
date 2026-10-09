import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X, QrCode, Printer, Download, Check, Copy } from "lucide-react";
import { shortHash } from "../utils/formatters";

export default function BarcodeModal({ sample, onClose }) {
  const [qrUrl, setQrUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!sample) return;
    const payload = JSON.stringify({
      schema: "Tracechain-v1",
      id: sample.sampleId,
      barcode: sample.externalId,
      type: sample.sampleType,
      head: sample.headHash,
    });

    QRCode.toDataURL(payload, {
      width: 280,
      margin: 1.5,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    }).then(setQrUrl).catch(console.error);
  }, [sample]);

  if (!sample) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(sample.sampleId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-sm text-center">
        
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Specimen Cryo-Vial Barcode</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Printable Label Preview Box */}
          <div className="p-5 bg-white rounded-2xl shadow-xl text-slate-900 border border-slate-200 inline-block w-full">
            <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              TRACECHAIN BIO-REGISTRY
            </div>
            
            {qrUrl && (
              <img
                src={qrUrl}
                alt="Barcode QR"
                className="w-44 h-44 mx-auto my-2 rounded-lg"
              />
            )}

            <div className="font-mono text-base font-extrabold tracking-wider text-slate-950">
              {sample.externalId}
            </div>
            <div className="text-xs font-semibold text-slate-600 mt-0.5">
              {sample.sampleType}
            </div>
            <div className="text-[10px] font-mono text-slate-400 mt-1 truncate">
              ID: {shortHash(sample.sampleId, 6)}
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleCopyId}
              className="btn-secondary w-full text-xs py-2 flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Sample ID Copied" : "Copy Cryptographic ID"}
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Cryo-Vial Tube Label
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
