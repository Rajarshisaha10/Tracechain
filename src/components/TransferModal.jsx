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
      <div className="modal-content max-w-md">
        
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Transfer Custody</h3>
              <p className="text-[11px] text-slate-400 font-mono">{sample.externalId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label>Recipient Organization</label>
            <select
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="text-sm"
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

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary text-xs">
              {loading ? "Dispatching..." : "Sign & Dispatch Transfer"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
