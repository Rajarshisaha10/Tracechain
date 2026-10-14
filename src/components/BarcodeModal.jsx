import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X, QrCode, Printer, Check, Copy } from "lucide-react";
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
        dark: "#162013",
        light: "#FFFFFF"
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
      <div className="modal-content max-w-sm text-center bg-[#FFFFFF] border-[3px] border-[#162013] shadow-[8px_8px_0px_#162013] rounded-2xl">
        
        <div className="p-5 border-b-[2.5px] border-[#162013] flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#435E2F]" />
            <h3 className="text-sm font-extrabold text-[#162013] uppercase font-display tracking-tight">Cryo-Vial Barcode Label</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-[#FFFFFF] text-[#162013] hover:bg-[#FFE4E6] border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013] active:translate-x-0.5 active:translate-y-0.5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Printable Label Preview Box */}
          <div className="p-5 bg-[#FFFFFF] rounded-2xl text-[#162013] border-[2.5px] border-[#162013] shadow-[4px_4px_0px_#162013] inline-block w-full">
            <div className="text-[10px] font-extrabold tracking-widest text-[#435E2F] uppercase font-mono">
              TRACECHAIN REGISTRY // EVM
            </div>
            
            {qrUrl && (
              <img
                src={qrUrl}
                alt="Barcode QR"
                className="w-44 h-44 mx-auto my-3 rounded-lg border-2 border-[#162013] shadow-[2px_2px_0px_#162013]"
              />
            )}

            <div className="font-mono text-base font-extrabold tracking-wider text-[#162013]">
              {sample.externalId}
            </div>
            <div className="text-xs font-extrabold text-[#5D7057] mt-0.5 uppercase">
              {sample.sampleType}
            </div>
            <div className="text-[10px] font-mono text-[#162013] bg-[#EAF2E5] px-2 py-0.5 rounded border border-[#162013] mt-2 truncate font-bold">
              ID: {shortHash(sample.sampleId, 6)}
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={handleCopyId}
              className="btn-secondary w-full text-xs py-2.5 flex items-center justify-center gap-2 font-extrabold uppercase font-mono"
            >
              {copied ? <Check className="w-4 h-4 text-[#435E2F]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Sample ID Copied" : "Copy Cryptographic ID"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary w-full text-xs py-2.5 flex items-center justify-center gap-2 font-extrabold uppercase"
            >
              <Printer className="w-4 h-4" />
              <span>Print Cryo-Vial Label</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
