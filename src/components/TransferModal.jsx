import React, { useState } from "react";
import { useChain } from "../context/ChainContext";
import { X, ArrowLeftRight } from "lucide-react";

export default function TransferModal({ sample, onClose, onSuccess }) {
  const { initiateTransfer, sandboxData, activeAccount } = useChain();
  const orgs = Object.values(sandboxData.orgs || {});

  const [toAddress, setToAddress] = useState("");
  const [note, setNote] = useState("Dispatched in temperature-controlled shipper");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!sample) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toAddress) {
      setError("Please select recipient organization");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await initiateTransfer(sample.sampleId, toAddress, note.trim());
      setLoading(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to initiate transfer");
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md bg-[#FFFFFF] border-[3px] border-[#162013] shadow-[8px_8px_0px_#162013] rounded-2xl">
        
        <div className="p-5 border-b-[2.5px] border-[#162013] flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EAF2E5] text-[#435E2F] flex items-center justify-center border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013]">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#162013] uppercase font-display tracking-tight">Transfer Custody</h3>
              <p className="text-[11px] text-[#5D7057] font-mono font-bold">{sample.externalId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-[#FFFFFF] text-[#162013] hover:bg-[#FFE4E6] border-2 border-[#162013] shadow-[1.5px_1.5px_0px_#162013] active:translate-x-0.5 active:translate-y-0.5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-[#FFE4E6] border-2 border-[#162013] text-[#DC2626] text-xs font-extrabold shadow-[2px_2px_0px_#162013]">
              {error}
            </div>
          )}

          <div>
            <label>Recipient Organization</label>
            <select
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="text-sm font-bold"
              required
            >
              <option value="">-- Choose recipient partner --</option>
              {orgs
                .filter((o) => o.address.toLowerCase() !== activeAccount.toLowerCase() && o.orgType !== 5)
                .map((o) => (
                  <option key={o.address} value={o.address}>
                    {o.name} ({o.orgTypeName})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label>Transport Manifest / Shipping Details</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="AWB tracking number, dry ice shipper ID, courier details..."
            />
          </div>

          <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2.5">
            <button type="button" onClick={onClose} className="btn-secondary text-xs w-full sm:w-auto uppercase">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary text-xs w-full sm:w-auto justify-center uppercase font-extrabold">
              {loading ? "Dispatching..." : "Sign & Dispatch Transfer"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
