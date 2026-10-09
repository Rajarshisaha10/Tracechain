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
        dark: "#1B2B45",
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
      <div className="modal-content max-w-sm text-center bg-[#FFFBF1] border-2 border-[#E3D7BC]">
        
        <div className="p-5 border-b-2 border-[#E3D7BC] flex items-center justify-between bg-[#FFFBF1]">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-[#2457A6]" />
            <h3 className="text-sm font-extrabold text-[#1B2B45]">Specimen Tube Barcode</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-[#F5EEDC] text-[#1B2B45] hover:bg-[#EBDDB8]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Printable Label Preview Box */}
          <div className="p-5 bg-white rounded-2xl shadow-md text-[#1B2B45] border-2 border-[#E3D7BC] inline-block w-full">
            <div className="text-[10px] font-extrabold tracking-widest text-[#2457A6] uppercase">
              TRACECHAIN REGISTRY
            </div>
            
            {qrUrl && (
              <img
                src={qrUrl}
                alt="Barcode QR"
                className="w-44 h-44 mx-auto my-2 rounded-lg"
              />
            )}

            <div className="font-mono text-base font-extrabold tracking-wider text-[#1B2B45]">
              {sample.externalId}
            </div>
            <div className="text-xs font-bold text-[#596579] mt-0.5">
              {sample.sampleType}
            </div>
            <div className="text-[10px] font-mono text-[#6B7287] mt-1 truncate">
              ID: {shortHash(sample.sampleId, 6)}
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleCopyId}
              className="btn-secondary w-full text-xs py-2 flex items-center justify-center gap-1.5 font-bold"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#2457A6]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Sample ID Copied" : "Copy Cryptographic ID"}
            </button>
            <button
              onClick={handlePrint}
              className="btn-primary w-full text-xs py-2 flex items-center justify-center gap-1.5 font-bold"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Cryo-Vial Label
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
