import React, { useState } from "react";
import { useChain } from "../context/ChainContext";
import { X, Thermometer, CheckCircle2 } from "lucide-react";

export default function StorageLogModal({ sample, onClose, onSuccess }) {
  const { logStorage } = useChain();

  const [location, setLocation] = useState("Freezer Unit #UL-80, Rack 3, Shelf B");
  const [tempCelsius, setTempCelsius] = useState("-80.0");
  const [note, setNote] = useState("Routine monitoring. Seal and cryo-box intact.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!sample) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location.trim()) {
      setError("Storage location is required.");
      return;
    }
    try {
      setLoading(true);
      setError("");

      const tempVal = tempCelsius.trim() !== "" ? Math.round(parseFloat(tempCelsius) * 10) : -2147483648;

      await logStorage(sample.sampleId, location.trim(), tempVal, note.trim());
      setLoading(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to log storage");
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md">
        
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Thermometer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Log Storage & Temperature</h3>
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
            <label>Physical Storage Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. CryoFreezer A-2, Tray 4"
              required
            />
          </div>

          <div>
            <label>Storage Temperature (°C)</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.1"
                value={tempCelsius}
                onChange={(e) => setTempCelsius(e.target.value)}
                placeholder="-80.0"
                className="font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setTempCelsius("-80.0")}
                className="px-2.5 py-1 text-xs bg-slate-800 border border-white/10 rounded-lg text-cyan-300 hover:border-cyan-500/40"
              >
                -80°C
              </button>
              <button
                type="button"
                onClick={() => setTempCelsius("-20.0")}
                className="px-2.5 py-1 text-xs bg-slate-800 border border-white/10 rounded-lg text-cyan-300 hover:border-cyan-500/40"
              >
                -20°C
              </button>
              <button
                type="button"
                onClick={() => setTempCelsius("4.0")}
                className="px-2.5 py-1 text-xs bg-slate-800 border border-white/10 rounded-lg text-cyan-300 hover:border-cyan-500/40"
              >
                +4°C
              </button>
            </div>
          </div>

          <div>
            <label>Inspection Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Verified data logger telemetry"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary text-xs">
              {loading ? "Recording..." : "Record on Chain"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
