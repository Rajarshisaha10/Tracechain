import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X, QrCode, Printer, Check, Copy, EyeOff } from "lucide-react";
import { shortHash } from "../utils/formatters";

export default function BarcodeModal({ sample, onClose }) {
  const [qrUrl, setQrUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!sample) return;
    const payload = JSON.stringify({
      schema: "Tracechain-v2-BlindTesting",
      id: sample.sampleId,
      blindId: sample.blindId || "UNBLINDED",
      barcode: sample.externalId,
      type: sample.sampleType,
      head: sample.headHash,
    });

    QRCode.toDataURL(payload, {
      width: 280,
      margin: 1.5,
      color: {
        dark: "#0F172A",
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#FFFFFF] border-[2.5px] border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] rounded-2xl max-w-sm w-full text-center overflow-hidden text-[#0A0A0A]">
        
        <div className="p-4 sm:p-5 border-b-2 border-[#0A0A0A] bg-[#FFFFFF] flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D7FB38] text-[#0A0A0A] flex items-center justify-center border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0A0A0A] tracking-tight">Cryo-Vial Barcode Label</h3>
              <p className="text-[11px] text-[#52525B] font-mono font-bold">Physical specimen tag with Blind ID</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#FFE4E6] border-2 border-[#0A0A0A] shadow-[1.5px_1.5px_0px_#0A0A0A] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Printable Label Preview Box */}
          <div className="p-4 bg-[#FFFFFF] rounded-xl text-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] inline-block w-full border-2 border-[#0A0A0A]">
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[9px] font-black tracking-widest text-[#0A0A0A] uppercase font-mono bg-[#D7FB38] border-2 border-[#0A0A0A] px-1.5 py-0.5 rounded shadow-[1px_1px_0px_#0A0A0A]">
                TRACECHAIN // 2.0
              </span>
              <span className="text-[9px] font-mono font-extrabold text-[#365314] bg-[#F7FEE7] border border-[#0A0A0A] px-1.5 py-0.5 rounded flex items-center gap-1">
                <EyeOff className="w-2.5 h-2.5 text-[#65A30D]" />
                BLIND TESTING
              </span>
            </div>

            {/* Prominent Blind Testing ID on label */}
            <div className="my-1.5 p-1.5 rounded-lg bg-[#F7F8F4] border-2 border-[#0A0A0A] text-left">
              <div className="text-[8px] font-mono uppercase text-[#71717A] font-bold">Lab-Facing Identifier:</div>
              <div className="text-xs font-mono font-black text-[#0A0A0A] tracking-wide">
                {sample.blindId || "BT-PENDING-REGISTRATION"}
              </div>
            </div>
            
            {qrUrl && (
              <div className="relative w-40 h-40 mx-auto my-2 overflow-hidden rounded-lg border-2 border-[#0A0A0A]">
                <img
                  src={qrUrl}
                  alt="Barcode QR"
                  className="w-full h-full object-contain"
                />
                <div className="animate-laser" />
              </div>
            )}

            <div className="font-mono text-sm font-black tracking-wider text-[#0A0A0A]">
              Barcode: {sample.externalId}
            </div>
            <div className="text-[11px] font-bold text-[#52525B] uppercase">
              {sample.sampleType}
            </div>
            <div className="text-[9px] font-mono text-[#0A0A0A] font-bold bg-[#F4F4F5] px-2 py-0.5 rounded border border-[#0A0A0A] mt-2 truncate">
              Anchor: {shortHash(sample.sampleId, 6)}
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleCopyId}
              className="brutal-btn brutal-btn-secondary w-full text-xs py-2 cursor-pointer font-mono"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#0A0A0A]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Sample ID Copied" : "Copy Cryptographic ID"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="brutal-btn brutal-btn-primary w-full text-xs py-2 cursor-pointer uppercase"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Cryo-Vial Label</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
