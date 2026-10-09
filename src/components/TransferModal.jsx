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
      <div className="modal-content max-w-md bg-[#FFFBF1] border-2 border-[#E3D7BC]">
        
        <div className="p-5 border-b-2 border-[#E3D7BC] flex items-center justify-between bg-[#FFFBF1]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#DCE6F5] text-[#2457A6] flex items-center justify-center border border-[#BDD0EE]">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#1B2B45]">Transfer Custody</h3>
              <p className="text-[11px] text-[#596579] font-mono">{sample.externalId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-[#F5EEDC] text-[#1B2B45] hover:bg-[#EBDDB8]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-[#F6D9D4] border border-[#EDB8B3] text-[#C23B30] text-xs font-bold">
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

          <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs w-full sm:w-auto">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary text-xs w-full sm:w-auto justify-center">
              {loading ? "Dispatching..." : "Sign & Dispatch Transfer"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
